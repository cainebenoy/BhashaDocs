from fastapi import FastAPI, UploadFile, File, Form
from fastapi.responses import JSONResponse
import shutil
import os
from utils import extract_text_from_pdf
from translator import translate_text

app = FastAPI(title="BhashaDocs API")

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
        
        # Note: In a production app, implement a text chunking logic here to avoid token limits
        translation = translate_text(extracted_text, target_language)
        
        os.remove(file_path)
        
        return {"filename": file.filename, "translated_text": translation}
        
    except Exception as e:
        return JSONResponse(status_code=500, content={"error": str(e)})

# Run the server locally: uvicorn main:app --reload