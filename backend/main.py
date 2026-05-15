from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse, StreamingResponse # <-- Added StreamingResponse
from fastapi.middleware.cors import CORSMiddleware
import shutil
import os
from utils import extract_text_from_pdf
from translator import translate_stream # <-- Changed import

app = FastAPI(title="BhashaDocs API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

UPLOAD_DIR = "temp_uploads"
os.makedirs(UPLOAD_DIR, exist_ok=True)

@app.post("/api/translate-doc")
async def translate_document(
    file: UploadFile = File(...),
    target_language: str = Form(...)
):
    try:
        file_path = os.path.join(UPLOAD_DIR, file.filename)
        with open(file_path, "wb") as buffer:
            shutil.copyfileobj(file.file, buffer)
            
        extracted_text = extract_text_from_pdf(file_path)
        os.remove(file_path) # Clean up immediately
        
        # Return a stream instead of a static JSON response
        return StreamingResponse(
            translate_stream(extracted_text, target_language), 
            media_type="text/plain"
        )
        
    except ValueError as ve:
        return JSONResponse(status_code=400, content={"error": str(ve)})
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})