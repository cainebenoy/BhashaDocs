from fastapi import FastAPI, UploadFile, File, Form, HTTPException
from fastapi.responses import StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
from utils import extract_text_from_pdf
from translator import translate_stream
import logging
import io  # <--- ADD THIS IMPORT

# Setup logging to see output inside Hugging Face container logs
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("BhashaDocs")

app = FastAPI(title="BhashaDocs API")

# 1. Enable Global CORS for Production Web Access
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Allows your Vercel deployment to connect securely
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
async def root():
    return {"status": "BhashaDocs Engine is Running Core Pipelines Online"}

@app.post("/api/translate-doc")
async def translate_document(
    file: UploadFile = File(...), 
    target_language: str = Form(...)
):
    logger.info(f"Received file: {file.filename} for translation to {target_language}")
    
    # 2. Validate File Type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(status_code=400, detail="Only PDF files are officially supported.")
    
    try:
        # 3. Read File and Extract Sentences/Chunks
        file_bytes = await file.read()
        text_chunks = extract_text_from_pdf(io.BytesIO(file_bytes)) # <--- WRAP IT HERE
        
        if not text_chunks:
            raise HTTPException(status_code=400, detail="No readable text found inside the PDF.")
            
        logger.info(f"Successfully extracted {len(text_chunks)} text segments for processing.")
        
        # 4. Return Streaming Response to UI with Proxy-Bypass Headers
        return StreamingResponse(
            translate_stream(text_chunks, target_language),
            media_type="text/event-stream",
            headers={
                "X-Accel-Buffering": "no",                  # Bypasses Nginx buffering on cloud proxies
                "Cache-Control": "no-cache, no-transform",   # Prevents CDNs from holding onto text chunks
                "Connection": "keep-alive",                  # Keeps the persistent streaming pipe open
            }
        )
        
    except Exception as e:
        logger.error(f"Pipeline error encountered: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Internal Server Pipeline Error: {str(e)}")