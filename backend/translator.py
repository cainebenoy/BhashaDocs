import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit.processor import IndicProcessor
import re
import json

torch.set_num_threads(2)

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


# --- (Keep your existing model loading and ip = IndicProcessor setup up here) ---

def chunk_text(text: str) -> list:
    """Splits text strictly by sentence boundaries for the fastest safe streaming."""
    # Split by periods, question marks, or exclamation points followed by a space
    sentences = re.split(r'(?<=[.!?])\s+', text.strip())
    # Filter out empty strings and return
    return [s.strip() for s in sentences if len(s.strip()) > 0]

def translate_stream(text: str, target_lang_code: str):
    """Generator that yields translated chunks one by one as NDJSON."""
    if not text or len(text.strip()) == 0:
        error_obj = {"original": "", "translated": "Error: No text found."}
        yield json.dumps(error_obj) + "\n"
        return

    chunks = chunk_text(text)
    print(f"--- Translating {len(chunks)} chunks to {target_lang_code} ---")

    for i, chunk in enumerate(chunks):
        if not chunk.strip(): continue
        
        try:
            # 1. Preprocess
            batch = ip.preprocess_batch([chunk], src_lang="eng_Latn", tgt_lang=target_lang_code)
            
            # 2. Setup Tokenizer Langs
            tokenizer.src_lang = "eng_Latn"
            tokenizer.tgt_lang = target_lang_code
            
            # 3. Tokenize
            inputs = tokenizer(
                batch, 
                truncation=True, 
                padding="longest", 
                return_tensors="pt", 
                add_special_tokens=True
            ).to(DEVICE)

            # 4. Generate
            with torch.no_grad():
                generated_tokens = model.generate(
                    **inputs,
                    use_cache=True,  # <--- CRITICAL FIX: Remembers past math!
                    num_beams=1,     # <--- CRITICAL FIX: Greedy decoding (4x faster)
                    max_length=256,
                    num_return_sequences=1,
                )

            # 5. Decode
            with tokenizer.as_target_tokenizer():
                decoded = tokenizer.batch_decode(
                    generated_tokens, 
                    skip_special_tokens=True, 
                    clean_up_tokenization_spaces=True
                )

            # 6. Postprocess
            translation = ip.postprocess_batch(decoded, lang=target_lang_code)[0]
            print(f"Chunk {i+1}/{len(chunks)} translated.")
            
            # 7. Yield NDJSON Object
            result_obj = {
                "original": chunk.strip(),
                "translated": translation.strip()
            }
            yield json.dumps(result_obj) + "\n"

        except Exception as e:
            print(f"Error on chunk {i}: {e}")
            error_obj = {
                "original": chunk.strip(), 
                "translated": f"[Translation error: {str(e)}]"
            }
            yield json.dumps(error_obj) + "\n"