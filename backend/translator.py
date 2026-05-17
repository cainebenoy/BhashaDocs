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


def split_long_sentence(s: str, max_chars: int = 2000) -> list:
    """Split very long sentences into smaller pieces at natural punctuation or by char windows.
    This avoids truncation during tokenization/generation while preserving order.
    """
    if len(s) <= max_chars:
        return [s]

    # try splitting at common clause delimiters first
    parts = re.split(r'(?<=,|;|:)\s+', s)
    out = []
    cur = ""
    for p in parts:
        if not cur:
            cur = p
        elif len(cur) + 1 + len(p) <= max_chars:
            cur = cur + " " + p
        else:
            out.append(cur)
            if len(p) > max_chars:
                # fallback: hard-chunk the long part
                for i in range(0, len(p), max_chars):
                    out.append(p[i:i+max_chars])
                cur = ""
            else:
                cur = p
    if cur:
        out.append(cur)
    return out

def translate_stream(text: str, target_lang_code: str):
    """Generator that yields translated chunks one by one as NDJSON."""
    if not text or len(text.strip()) == 0:
        error_obj = {"original": "", "translated": "Error: No text found."}
        yield json.dumps(error_obj) + "\n"
        return

    chunks = chunk_text(text)
    # Expand very long sentences into manageable pieces to avoid generation truncation
    expanded_chunks = []
    for s in chunks:
        expanded_chunks.extend(split_long_sentence(s, max_chars=2000))

    print(f"--- Translating {len(expanded_chunks)} chunks to {target_lang_code} (expanded from {len(chunks)}) ---")

    for i, chunk in enumerate(expanded_chunks):
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
                    use_cache=False,
                    num_beams=1,
                    max_length=1024,
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