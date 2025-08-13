import base64
import io
import os
from typing import Optional, Tuple

import streamlit as st
from PIL import Image, ImageOps
from dotenv import load_dotenv

# Try both modern and legacy OpenAI clients for compatibility
try:
    from openai import OpenAI  # type: ignore
    _HAS_OPENAI_SDK_V1 = True
except Exception:
    _HAS_OPENAI_SDK_V1 = False
    import openai  # type: ignore


# ---------- Helpers ----------

def load_env() -> None:
    load_dotenv(override=True)


def get_openai_model_name() -> str:
    return os.getenv("OPENAI_MODEL", "gpt-4o-mini")


def anonymize_image(image: Image.Image) -> Image.Image:
    # Re-encode image to strip metadata (EXIF)
    rgb_image = image.convert("RGB")
    output = io.BytesIO()
    rgb_image.save(output, format="JPEG", quality=95, optimize=True)
    output.seek(0)
    return Image.open(output)


def resize_for_vision(image: Image.Image, max_side: int = 1600) -> Image.Image:
    w, h = image.size
    scale = min(max_side / max(w, h), 1.0)
    if scale < 1.0:
        new_size = (int(w * scale), int(h * scale))
        return ImageOps.contain(image, new_size)
    return image


def image_to_data_url(image: Image.Image) -> Tuple[str, bytes]:
    buf = io.BytesIO()
    image.convert("RGB").save(buf, format="JPEG", quality=92, optimize=True)
    jpeg_bytes = buf.getvalue()
    b64 = base64.b64encode(jpeg_bytes).decode("utf-8")
    data_url = f"data:image/jpeg;base64,{b64}"
    return data_url, jpeg_bytes


def build_prompt(modality: str, extra_instructions: str) -> str:
    modality_text = modality.strip() or "Other"
    instructions = extra_instructions.strip()
    return (
        "You are a medical imaging assistant. You must not provide a clinical diagnosis or treatment advice. "
        "Provide a non-diagnostic, plain-language summary for a layperson. If critical red flags are likely, recommend immediate medical attention.\n\n"
        f"Modality: {modality_text}.\n\n"
        "Return a concise JSON-like markdown block with these keys: \n"
        "- summary: brief non-diagnostic description of visible features\n"
        "- possible_findings: short list of plausible, generic categories (not diagnoses)\n"
        "- red_flags: short list of concerning visual cues, if any\n"
        "- triage_advice: general guidance (e.g., 'seek urgent care', 'schedule routine check'), not medical advice\n"
        "- confidence: low | medium | high\n\n"
        "Tone: cautious, non-alarming, avoid definitive statements.\n\n"
        f"Additional user notes: {instructions if instructions else 'None'}\n"
    )


def call_vision_model(image_data_url: str, prompt: str) -> Optional[str]:
    api_key = os.getenv("OPENAI_API_KEY", "").strip()
    if not api_key:
        return None

    model = get_openai_model_name()

    # Try the modern SDK first
    if _HAS_OPENAI_SDK_V1:
        client = OpenAI(api_key=api_key)
        try:
            resp = client.chat.completions.create(
                model=model,
                messages=[
                    {"role": "system", "content": (
                        "You are a careful, safe medical imaging assistant. You never provide a diagnosis or treatment advice."
                    )},
                    {
                        "role": "user",
                        "content": [
                            {"type": "text", "text": prompt},
                            {"type": "image_url", "image_url": {"url": image_data_url, "detail": "auto"}},
                        ],
                    },
                ],
                temperature=0.2,
                max_tokens=600,
            )
            return resp.choices[0].message.content
        except Exception as e:
            return f"Error calling model: {e}"

    # Legacy fallback
    try:
        openai.api_key = api_key  # type: ignore
        resp = openai.ChatCompletion.create(  # type: ignore
            model=model,
            messages=[
                {"role": "system", "content": (
                    "You are a careful, safe medical imaging assistant. You never provide a diagnosis or treatment advice."
                )},
                {
                    "role": "user",
                    "content": [
                        {"type": "text", "text": prompt},
                        {"type": "image_url", "image_url": {"url": image_data_url}},
                    ],
                },
            ],
            temperature=0.2,
            max_tokens=600,
        )
        return resp["choices"][0]["message"]["content"]
    except Exception as e:  # pragma: no cover
        return f"Error calling model: {e}"


def offline_basic_analysis(jpeg_bytes: bytes) -> str:
    # Minimal offline placeholder: returns basic image stats only
    try:
        image = Image.open(io.BytesIO(jpeg_bytes)).convert("L")
        w, h = image.size
        pixels = list(image.getdata())
        mean_val = sum(pixels) / len(pixels)
        min_val = min(pixels)
        max_val = max(pixels)
        return (
            "```\n"
            f"summary: grayscale image {w}x{h}, mean_intensity={mean_val:.1f}, min={min_val}, max={max_val}\n"
            "possible_findings: [""general image features only; model offline""]\n"
            "red_flags: []\n"
            "triage_advice: [""This offline mode cannot assess risk. Consult a clinician for any concerns.""]\n"
            "confidence: low\n"
            "```"
        )
    except Exception as e:
        return f"Error in offline analysis: {e}"


# ---------- UI ----------

def main() -> None:
    load_env()
    st.set_page_config(page_title="Medical Image Insight (Non‑diagnostic)", page_icon="🩺", layout="centered")

    st.title("Medical Image Insight (Non‑diagnostic Demo)")
    st.caption(
        "This tool is for educational purposes only. It is not a medical device and does not provide diagnosis or treatment advice."
    )

    with st.expander("Safety & Privacy", expanded=False):
        st.markdown(
            "- This is NOT a diagnosis. Always consult a qualified clinician.\n"
            "- Uploaded images can be anonymized by stripping EXIF metadata.\n"
            "- If you deploy this app, you are responsible for security and compliance."
        )

    modality = st.selectbox(
        "Select image modality (to tailor the prompt):",
        ["Chest X-ray", "Brain MRI", "CT", "Ultrasound", "Skin", "Other"],
        index=0,
    )

    extra_notes = st.text_area(
        "Optional notes (symptoms, context, region of interest)",
        placeholder="e.g., cough and fever, focus on right lung field",
    )

    anonymize = st.checkbox("Anonymize images (strip metadata)", value=True)

    uploaded_files = st.file_uploader(
        "Upload medical image(s)",
        type=["jpg", "jpeg", "png", "webp", "bmp", "tiff"],
        accept_multiple_files=True,
    )

    run_btn = st.button("Analyze", type="primary", use_container_width=True)

    if run_btn:
        if not uploaded_files:
            st.warning("Please upload at least one image.")
            st.stop()

        api_key_available = bool(os.getenv("OPENAI_API_KEY", "").strip())
        prompt = build_prompt(modality, extra_notes)

        for f in uploaded_files:
            st.divider()
            st.subheader(f.name)
            try:
                image = Image.open(f).convert("RGB")
            except Exception as e:
                st.error(f"Failed to open image: {e}")
                continue

            # Preprocess
            if anonymize:
                image = anonymize_image(image)
            image = resize_for_vision(image)
            data_url, jpeg_bytes = image_to_data_url(image)

            st.image(image, caption="Preview", use_container_width=True)

            with st.spinner("Analyzing (non‑diagnostic)..."):
                if api_key_available:
                    result = call_vision_model(data_url, prompt)
                    if not result:
                        st.info(
                            "No API key detected or empty response. Falling back to offline basic analysis."
                        )
                        result = offline_basic_analysis(jpeg_bytes)
                else:
                    st.info(
                        "OPENAI_API_KEY not set. Showing offline basic analysis."
                    )
                    result = offline_basic_analysis(jpeg_bytes)

            st.markdown("**Result (non‑diagnostic):**")
            st.markdown(result or "No response")

            # Offer anonymized download
            dl_buf = io.BytesIO(jpeg_bytes)
            st.download_button(
                label="Download anonymized image (JPEG)",
                data=dl_buf,
                file_name=f"anonymized_{os.path.splitext(f.name)[0]}.jpg",
                mime="image/jpeg",
            )

    st.divider()
    st.caption(
        "This tool is not a substitute for professional medical advice, diagnosis, or treatment."
    )


if __name__ == "__main__":
    main()