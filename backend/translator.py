import torch
from transformers import AutoModelForSeq2SeqLM, AutoTokenizer
from IndicTransToolkit.processor import IndicProcessor

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

def translate_text(text: str, target_lang_code: str) -> str:
    if not text or len(text.strip()) == 0:
        return "Error: No text found."

    # Debug: See what text we are starting with
    print(f"--- Processing Translation to {target_lang_code} ---")
    input_text = text[:500].strip() # Shorter snippet for the first successful test
    print(f"Source Text Snippet: {input_text[:50]}...")

    try:
        # 1. Preprocess using IndicProcessor
        # This adds the special language tags like <2mlm> or <2hin>
        batch = ip.preprocess_batch(
            [input_text],
            src_lang="eng_Latn",
            tgt_lang=target_lang_code,
        )
        print(f"Processor Output (Batch): {batch}")

        # 2. Tokenize - We do this manually to ensure tensors are created
        inputs = tokenizer(
            batch,
            truncation=True,
            padding="longest",
            return_tensors="pt",
            add_special_tokens=True 
        ).to(DEVICE)

        # DEBUG CHECK: Ensure input_ids exist
        if inputs.get("input_ids") is None:
            return "Error: Tokenizer produced None for input_ids."
        
        print(f"Tensor Shape: {inputs['input_ids'].shape}")

# 3. Generate
        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs,
                use_cache=False,  # <-- THE SILVER BULLET
                num_beams=5,
                max_length=256, 
                num_return_sequences=1,
            )

        # 4. Decode and Postprocess
        with tokenizer.as_target_tokenizer():
            decoded = tokenizer.batch_decode(
                generated_tokens,
                skip_special_tokens=True,
                clean_up_tokenization_spaces=True,
            )

        translations = ip.postprocess_batch(decoded, lang=target_lang_code)
        print(f"Result: {translations[0][:50]}...")
        return translations[0]

    except Exception as e:
        import traceback
        error_details = traceback.format_exc()
        print(f"CRITICAL ERROR:\n{error_details}")
        return f"Translation failed: {str(e)}"