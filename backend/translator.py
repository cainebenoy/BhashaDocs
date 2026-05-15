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
    # 1. Validation: Don't process empty strings
    if not text or len(text.strip()) == 0:
        return "Error: No text found to translate."

    # 2. Preprocess using their custom toolkit
    # We take only the first 1000 characters for now to avoid memory crashes
    # until we implement a proper chunking loop.
    input_text = text[:1000] 

    batch = ip.preprocess_batch(
        [input_text],
        src_lang="eng_Latn",
        tgt_lang=target_lang_code,
    )

    # 3. Tokenize with explicit source language
    # This is often what causes the 'NoneType' error if omitted
    tokenizer.src_lang = "eng_Latn"
    tokenizer.tgt_lang = target_lang_code

    inputs = tokenizer(
        batch,
        truncation=True,
        padding="longest",
        return_tensors="pt",
        return_attention_mask=True,
    ).to(DEVICE)

    # 4. Generate Translation
    try:
        with torch.no_grad():
            generated_tokens = model.generate(
                **inputs,
                use_cache=True,
                num_beams=5,
                max_length=512,
                num_return_sequences=1,
            )

        # 5. Decode and Postprocess
        generated_tokens = tokenizer.batch_decode(
            generated_tokens,
            skip_special_tokens=True,
            clean_up_tokenization_spaces=True,
        )

        translations = ip.postprocess_batch(generated_tokens, lang=target_lang_code)
        return translations[0]
        
    except Exception as e:
        print(f"Model Error: {e}")
        return f"Translation failed: {str(e)}"