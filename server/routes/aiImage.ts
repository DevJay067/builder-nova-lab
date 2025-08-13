import { RequestHandler } from "express";
import OpenAI from "openai";

const DEFAULT_MODEL = process.env.OPENAI_MODEL || "gpt-4o-mini";

function buildPrompt(modality?: string, notes?: string): string {
  const modalityText = (modality || "Other").trim();
  const extra = (notes || "").trim();
  return (
    "You are a medical imaging assistant. You must not provide a clinical diagnosis or treatment advice. " +
    "Provide a non-diagnostic, plain-language summary for a layperson. If critical red flags are likely, recommend immediate medical attention.\n\n" +
    `Modality: ${modalityText}.\n\n` +
    "Return a concise JSON-like markdown block with these keys: \n" +
    "- summary: brief non-diagnostic description of visible features\n" +
    "- possible_findings: short list of plausible, generic categories (not diagnoses)\n" +
    "- red_flags: short list of concerning visual cues, if any\n" +
    "- triage_advice: general guidance (e.g., 'seek urgent care', 'schedule routine check'), not medical advice\n" +
    "- confidence: low | medium | high\n\n" +
    "Tone: cautious, non-alarming, avoid definitive statements.\n\n" +
    `Additional user notes: ${extra || "None"}\n`
  );
}

function toDataUrl(imageBase64?: string, imageDataUrl?: string): string | null {
  if (imageDataUrl && imageDataUrl.startsWith("data:")) return imageDataUrl;
  if (imageBase64) return `data:image/jpeg;base64,${imageBase64}`;
  return null;
}

export const analyzeMedicalImage: RequestHandler = async (req, res) => {
  try {
    const apiKey = process.env.OPENAI_API_KEY?.trim();
    if (!apiKey) {
      return res.status(400).json({
        success: false,
        error: "OPENAI_API_KEY not set on server. Configure it to enable image analysis.",
      });
    }

    const { imageBase64, imageDataUrl, modality, notes } = req.body || {};
    const dataUrl = toDataUrl(imageBase64, imageDataUrl);

    if (!dataUrl) {
      return res.status(400).json({
        success: false,
        error: "Provide imageDataUrl (data:) or imageBase64 string.",
      });
    }

    const prompt = buildPrompt(modality, notes);
    const openai = new OpenAI({ apiKey });

    const response = await openai.chat.completions.create({
      model: DEFAULT_MODEL,
      messages: [
        {
          role: "system",
          content:
            "You are a careful, safe medical imaging assistant. You never provide a diagnosis or treatment advice.",
        },
        {
          role: "user",
          content: [
            { type: "text", text: prompt },
            { type: "image_url", image_url: { url: dataUrl, detail: "auto" } },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 600,
    });

    const result = response.choices?.[0]?.message?.content || "";

    return res.json({
      success: true,
      result,
      model: DEFAULT_MODEL,
      tokens: response.usage,
    });
  } catch (error: any) {
    console.error("❌ Error analyzing medical image:", error);
    return res.status(500).json({
      success: false,
      error: error?.message || "Unexpected server error",
    });
  }
};