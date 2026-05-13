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
    """
    Translates English text to a specified Indic language using IndicTrans2.
    target_lang_code format: 'hin_Deva', 'mal_Mlym', 'tam_Taml', etc.
    """
    # 1. Preprocess using their custom toolkit
    batch = ip.preprocess_batch(
        [text],
        src_lang="eng_Latn",
        tgt_lang=target_lang_code,
    )

    # 2. Tokenize
    inputs = tokenizer(
        batch,
        truncation=True,
        padding="longest",
        return_tensors="pt",
        return_attention_mask=True,
    ).to(DEVICE)

    # 3. Generate Translation
    with torch.no_grad():
        generated_tokens = model.generate(
            **inputs,
            use_cache=True,
            min_length=0,
            max_length=512, # Adjust based on PDF chunk sizes
            num_beams=5,
            num_return_sequences=1,
        )

    # 4. Decode
    generated_tokens = tokenizer.batch_decode(
        generated_tokens,
        skip_special_tokens=True,
        clean_up_tokenization_spaces=True,
    )

    # 5. Postprocess (fixes entity formatting and script rules)
    translations = ip.postprocess_batch(generated_tokens, lang=target_lang_code)
    
    return translations[0]