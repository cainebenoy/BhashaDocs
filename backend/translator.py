from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
import torch

MODEL_NAME = "ai4bharat/indictrans2-en-indic-1B"

print("Loading tokenizer and model...")
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForSeq2SeqLM.from_pretrained(MODEL_NAME, trust_remote_code=True)

def translate_text(text: str, target_lang_code: str) -> str:
    # target_lang_code examples: 'hin_Deva' (Hindi), 'tam_Taml' (Tamil), 'mal_Mlym' (Malayalam)
    inputs = tokenizer(text, return_tensors="pt", padding=True, truncation=True)
    
    with torch.no_grad():
        outputs = model.generate(
            **inputs,
            max_length=512,
            num_beams=5,
            early_stopping=True
        )
    
    translated_text = tokenizer.decode(outputs[0], skip_special_tokens=True)
    return translated_text