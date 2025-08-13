# Medical Image Insight (Non‑diagnostic Demo)

This is a simple demo app that accepts medical images (e.g., X‑rays, MRIs, CTs, ultrasound, skin photos) and returns a plain‑language summary using a vision model. It is intended for educational and research purposes only.

IMPORTANT SAFETY NOTICE
- This tool does NOT provide medical diagnosis or treatment advice.
- It is NOT a medical device and is NOT approved for clinical use.
- Do NOT rely on this for decisions about health. Always consult a qualified clinician.

## Features
- Upload image(s) and optionally anonymize by stripping EXIF metadata
- Choose modality to tailor the prompt: Chest X‑ray, Brain MRI, CT, Ultrasound, Skin, Other
- Sends the image to a vision LLM for a non‑diagnostic summary and basic risk triage language
- Shows results per image with a consistent structured response

## Quickstart

1) Prerequisites
- Python 3.10+
- An OpenAI API key with access to a vision model (e.g., `gpt-4o-mini`)

2) Setup
```bash
cd /workspace
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
# Edit .env and set OPENAI_API_KEY=...
```

3) Run
```bash
streamlit run app.py --server.port 7860 --server.address 0.0.0.0
```
Then open http://localhost:7860 in your browser.

## Environment Variables
- `OPENAI_API_KEY`: your OpenAI API key
- `OPENAI_MODEL` (optional): defaults to `gpt-4o-mini`

## Notes
- Images are processed client‑to‑server within this demo. If you deploy this app, you are responsible for data handling, security, and compliance.
- For true medical imaging work (DICOM, modality‑specific models, PACS integration), consider frameworks like MONAI, TorchXRayVision, and ensure regulatory compliance.

## Roadmap (optional)
- Support DICOM ingestion (pydicom) with de‑identification
- Add modality‑specific open‑source models (e.g., chest X‑ray classifiers) for offline analysis
- Add heatmaps/overlays where model supports it

## License
This repository is provided "as‑is" without warranty. Use at your own risk.
