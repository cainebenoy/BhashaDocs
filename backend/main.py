from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import json
import requests
from groq import Groq
try:
    from slowapi import Limiter, _rate_limit_exceeded_handler
    from slowapi.errors import RateLimitExceeded
    from slowapi.util import get_remote_address
    RATE_LIMIT_ENABLED = True
except Exception:
    # If slowapi isn't installed in the runtime (some deployment environments),
    # fall back to a no-op limiter so the app can start without rate limiting.
    Limiter = None
    RateLimitExceeded = Exception
    RATE_LIMIT_ENABLED = False

    def get_remote_address(request: Request):
        try:
            return request.client.host
        except Exception:
            return "unknown"
from utils import extract_text_from_pdf
from translator import translate_stream
import logging
import io
import os
import re
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging to see output inside Hugging Face container logs
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO))
logger = logging.getLogger("BhashaDocs")

app = FastAPI(title="BhashaDocs API")
if RATE_LIMIT_ENABLED:
    limiter = Limiter(key_func=get_remote_address)
    app.state.limiter = limiter
    app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)
else:
    # Define a no-op limiter with a compatible `limit` decorator
    class _NoopLimiter:
        def limit(self, _expr: str):
            def _decorator(func):
                return func
            return _decorator
    limiter = _NoopLimiter()
    logger = logging.getLogger("BhashaDocs")
    logger.warning("slowapi not available; rate limiting disabled.")

# Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", str(50 * 1024 * 1024)))
SUPPORTED_LANGUAGES = {
    "asm_Beng", "ben_Beng", "brx_Deva", "doi_Deva", "guj_Gujr", "hin_Deva",
    "kan_Knda", "kas_Arab", "gom_Deva", "mai_Deva", "mal_Mlym", "mni_Beng",
    "mar_Deva", "nep_Deva", "ory_Orya", "pan_Guru", "san_Deva", "sat_Olck",
    "snd_Arab", "tam_Taml", "tel_Telu", "urd_Arab"
}
UPSTREAM_API_URL = os.getenv(
    "UPSTREAM_API_URL",
    "https://cainebenoy-bhashadocs-inbound-api.hf.space/api/translate-inbound",
)
DOWNSTREAM_API_URL = os.getenv(
    "DOWNSTREAM_API_URL",
    "https://cainebenoy-bhashadocs-api.hf.space/api/translate-text",
)
REQUEST_TIMEOUT_SECONDS = int(os.getenv("REQUEST_TIMEOUT_SECONDS", "120"))
GROQ_MODEL = os.getenv("GROQ_MODEL", "llama-3.1-8b-instant")

# Configure Groq client from environment.
GROQ_API_KEY = os.getenv("GROQ_API_KEY")
if GROQ_API_KEY:
    groq_client = Groq(api_key=GROQ_API_KEY)
    logger.info("Groq configured with model=%s", GROQ_MODEL)
else:
    groq_client = None
    logger.warning("GROQ_API_KEY is not set; /api/chat endpoint will be unavailable.")

# Restrict CORS to production domain
allowed_origins = os.getenv("CORS_ORIGINS", "https://bhasha-docs.vercel.app").split(",")
app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=True,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "BhashaDocs Engine is Running Core Pipelines Online"}


async def safe_translate_stream(text_input, target_language):
    try:
        for chunk in translate_stream(text_input, target_language):
            yield chunk
    except Exception as e:
        logger.error(f"💥 CRITICAL EXCEPTION inside translate_stream: {str(e)}")
        yield json.dumps({"error": f"Internal ML Engine Crash: {str(e)}"})

@app.post("/api/translate-text")
async def translate_text(
    text: str = Form(...),
    target_language: str = Form(...)
):
    logger.info(f"Received raw text string for translation to {target_language}")
    cleaned_text = text.strip()
    if not cleaned_text:
        raise HTTPException(status_code=400, detail="Text string cannot be empty.")
        
    return StreamingResponse(
        safe_translate_stream(cleaned_text, target_language),
        media_type="text/event-stream",
        headers={
            "X-Accel-Buffering": "no",
            "Cache-Control": "no-cache, no-transform",
            "Connection": "keep-alive",
        }
    )


@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "IndicTrans2", "ready": True}


@app.post("/api/chat")
async def chat_with_document(
    question: str = Form(...),
    document_context: str = Form(...),
    source_lang: str = Form("mal_Mlym"),
):
    if groq_client is None:
        raise HTTPException(status_code=503, detail="Groq is not configured on the server.")

    cleaned_question = question.strip()
    cleaned_context = document_context.strip()
    if not cleaned_question:
        raise HTTPException(status_code=400, detail="Question cannot be empty.")
    if not cleaned_context:
        raise HTTPException(status_code=400, detail="Document context cannot be empty.")
    if source_lang not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language. Check supported language codes.")

    try:
        logger.info("/api/chat request started for source_lang=%s", source_lang)

        # Phase 1: translate user question to English via inbound translator.
        upstream_res = requests.post(
            UPSTREAM_API_URL,
            data={"text": cleaned_question, "source_lang": source_lang},
            timeout=REQUEST_TIMEOUT_SECONDS,
        )
        if upstream_res.status_code != 200:
            logger.error("Upstream translation failed with status=%s", upstream_res.status_code)
            raise HTTPException(status_code=500, detail="Upstream translation failed.")

        upstream_payload = upstream_res.json()
        english_question = upstream_payload.get("english_text", "").strip()
        if not english_question:
            logger.error("Upstream translation response missing english_text.")
            raise HTTPException(status_code=500, detail="Upstream translation returned invalid payload.")

        # Phase 2: ask Groq using full extracted document context.
        prompt = f"""
You are a highly accurate document analysis assistant.
Read the following document context and answer the user's question based strictly on the provided text.
If the answer is not in the document, say "I cannot find the answer in the document."
Keep your answer concise and factual.

DOCUMENT CONTEXT:
{cleaned_context}

QUESTION:
{english_question}
"""
        try:
            groq_response = groq_client.chat.completions.create(
                messages=[{"role": "user", "content": prompt}],
                model=GROQ_MODEL,
                temperature=0.1,
            )
        except Exception as groq_exc:
            failure_text = str(groq_exc)
            retry_match = re.search(r"retry after\s+([0-9]+(?:\.[0-9]+)?)s", failure_text, re.IGNORECASE)
            retry_after = int(float(retry_match.group(1))) if retry_match else None
            status_code = getattr(groq_exc, "status_code", None)
            if status_code == 429 or "429" in failure_text or "quota" in failure_text.lower() or "rate" in failure_text.lower():
                raise HTTPException(
                    status_code=429,
                    detail={
                        "error": "Groq quota exceeded. Please retry after some time or use a key with available quota.",
                        "retry_after_seconds": retry_after,
                    },
                )
            logger.error("Groq completion failed: %s", failure_text)
            raise HTTPException(status_code=503, detail="Groq service unavailable. Check GROQ_API_KEY and GROQ_MODEL.")

        english_answer = ""
        if groq_response.choices and groq_response.choices[0].message:
            english_answer = (groq_response.choices[0].message.content or "").strip()

        if not english_answer:
            raise HTTPException(status_code=500, detail="Groq returned an empty answer.")

        # Phase 3: stream translated answer back to the frontend via downstream API.
        def stream_generator():
            with requests.post(
                DOWNSTREAM_API_URL,
                data={"text": english_answer, "target_language": source_lang},
                stream=True,
                timeout=REQUEST_TIMEOUT_SECONDS,
            ) as downstream_res:
                if downstream_res.status_code != 200:
                    logger.error("Downstream translation failed with status=%s", downstream_res.status_code)
                    raise HTTPException(status_code=500, detail="Downstream translation failed.")

                for line in downstream_res.iter_lines(decode_unicode=True):
                    if line:
                        yield f"{line}\n\n"

        return StreamingResponse(
            stream_generator(),
            media_type="text/event-stream",
            headers={
                "X-Accel-Buffering": "no",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            },
        )

    except HTTPException:
        raise
    except Exception as e:
        logger.error("Chat pipeline error: %s", str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred in chat pipeline.")

@app.post("/api/translate-doc")
@limiter.limit("5/minute")
async def translate_document(
    request: Request,
    file: UploadFile = File(...), 
    target_language: str = Form(...)
):
    logger.info("Received file %s for translation to %s", file.filename, target_language)
    
    # 1. Validate File Type (check extension and MIME type)
    if not file.filename or not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are supported.")
    
    if file.content_type and file.content_type != "application/pdf":
        raise HTTPException(status_code=400, detail="Invalid file type. Please upload a PDF.")
    
    # 2. Validate Target Language
    if target_language not in SUPPORTED_LANGUAGES:
        raise HTTPException(status_code=400, detail="Unsupported language. Check supported language codes.")
    
    try:
        # 3. Read file bytes (no hard size rejection - translate full PDF)
        file_bytes = await file.read()
        # Note: MAX_FILE_SIZE is retained as an env hint but not enforced here
        # to allow translating full PDF uploads per product requirement.
        # 4. Extract Text from PDF
        text = extract_text_from_pdf(io.BytesIO(file_bytes))
        
        if not text or len(text.strip()) == 0:
            raise HTTPException(status_code=400, detail="No readable text found in PDF.")

        logger.info(
            "Successfully extracted text from %s (%d bytes, %d characters).",
            file.filename,
            len(file_bytes),
            len(text),
        )
        
        # 5. Return Streaming Response to UI with Proxy-Bypass Headers
        logger.info("Starting streamed translation for %s to %s", file.filename, target_language)
        return StreamingResponse(
            translate_stream(text, target_language),
            media_type="text/event-stream",
            headers={
                "X-Accel-Buffering": "no",
                "Cache-Control": "no-cache, no-transform",
                "Connection": "keep-alive",
            }
        )
        
    except HTTPException:
        raise
    except Exception as e:
        logger.error("Pipeline error for %s -> %s: %s", file.filename, target_language, str(e), exc_info=True)
        raise HTTPException(status_code=500, detail="An error occurred during translation. Please try again.")