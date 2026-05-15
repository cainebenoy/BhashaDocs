from PyPDF2 import PdfReader

def extract_text_from_pdf(file_path: str) -> str:
    reader = PdfReader(file_path)
    text = ""
    for page in reader.pages:
        extracted = page.extract_text()
        if extracted:
            text += extracted + "\n"
    
    # CLEANUP: Remove extra whitespace
    final_text = text.strip()
    
    if not final_text:
        raise ValueError("The PDF contains no selectable text. It might be a scanned image.")
        
    return final_text