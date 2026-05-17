from fastapi import FastAPI, UploadFile, File, Form, HTTPException, Request
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address
from utils import extract_text_from_pdf
from translator import translate_stream
import logging
import io
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Setup logging to see output inside Hugging Face container logs
log_level = os.getenv("LOG_LEVEL", "INFO").upper()
logging.basicConfig(level=getattr(logging, log_level, logging.INFO))
logger = logging.getLogger("BhashaDocs")

app = FastAPI(title="BhashaDocs API")
limiter = Limiter(key_func=get_remote_address)
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

# Configuration
MAX_FILE_SIZE = int(os.getenv("MAX_FILE_SIZE", str(50 * 1024 * 1024)))
SUPPORTED_LANGUAGES = {
    "asm_Beng", "ben_Beng", "brx_Deva", "doi_Deva", "guj_Gujr", "hin_Deva",
    "kan_Knda", "kas_Arab", "gom_Deva", "mai_Deva", "mal_Mlym", "mni_Beng",
    "mar_Deva", "nep_Deva", "ory_Orya", "pan_Guru", "san_Deva", "sat_Olck",
    "snd_Arab", "tam_Taml", "tel_Telu", "urd_Arab"
}

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


@app.get("/health")
async def health_check():
    return {"status": "ok", "model": "IndicTrans2", "ready": True}

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