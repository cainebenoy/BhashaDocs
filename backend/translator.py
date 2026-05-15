import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit.processor import IndicProcessor
import re

# Auto-detect hardware
DEVICE = "cuda" if torch.cuda.is_available() else "cpu"
print(f"Loading IndicTrans2 on {DEVICE.upper()}...")

MODEL_NAME = "ai4bharat/indictrans2-en-indic-1B"

# Load Tokenizer and Model
tokenizer = AutoTokenizer.from_pretrained(MODEL_NAME, trust_remote_code=True)
model = AutoModelForSeq2SeqLM.from_pretrained(
    MODEL_NAME, 
    trust_remote_code=True,
    # We remove flash_attn here for maximum local compatibility. 
    # You can add it back when deploying to a high-end AIKosh GPU.
).to(DEVICE)

# Initialize the custom AI4Bharat Processor
ip = IndicProcessor(inference=True)

def chunk_text(text: str, max_chars: int = 300) -> list:
    """Splits long text into safe, model-friendly chunks without breaking sentences."""
    # Split by periods, question marks, or newlines
    sentences = re.split(r'(?<=[.!?\n]) +|\n+', text)
    chunks = []
    current_chunk = ""
    
    for sentence in sentences:
        if len(current_chunk) + len(sentence) < max_chars:
            current_chunk += sentence + " "
        else:
            if current_chunk: chunks.append(current_chunk.strip())
            current_chunk = sentence + " "
    if current_chunk: chunks.append(current_chunk.strip())
    
    return chunks

def translate_stream(text: str, target_lang_code: str):
    """Generator that yields translated chunks one by one."""
    if not text or len(text.strip()) == 0:
        yield "Error: No text found."
        return

    chunks = chunk_text(text)
    print(f"--- Translating {len(chunks)} chunks to {target_lang_code} ---")

    for i, chunk in enumerate(chunks):
        if not chunk.strip(): continue
        
        try:
            batch = ip.preprocess_batch([chunk], src_lang="eng_Latn", tgt_lang=target_lang_code)
            
            tokenizer.src_lang = "eng_Latn"
            tokenizer.tgt_lang = target_lang_code
            
            inputs = tokenizer(
                batch, truncation=True, padding="longest", 
                return_tensors="pt", add_special_tokens=True
            ).to(DEVICE)

            with torch.no_grad():
                generated_tokens = model.generate(
                    **inputs,
                    use_cache=False, # Keeps it stable
                    num_beams=4,     # Slightly lowered for faster CPU speed
                    max_length=256,
                    num_return_sequences=1,
                )

            with tokenizer.as_target_tokenizer():
                decoded = tokenizer.batch_decode(
                    generated_tokens, skip_special_tokens=True, clean_up_tokenization_spaces=True
                )

            translation = ip.postprocess_batch(decoded, lang=target_lang_code)[0]
            
            print(f"Chunk {i+1}/{len(chunks)} translated.")
            # Yield the chunk plus a space so it formats correctly on the frontend
            yield translation + " " 

        except Exception as e:
            print(f"Error on chunk {i}: {e}")
            yield f"[Translation error on a chunk] "