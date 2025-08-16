import { Request, Response, NextFunction } from "express";
import { decryptPayload } from "../services/encryption";

export async function decryptIfEncrypted(req: Request, res: Response, next: NextFunction) {
  try {
    const isEncrypted = req.headers["x-payload-encrypted"]; 
    if (isEncrypted === "1" || isEncrypted === "true" || isEncrypted === "yes") {
      const jwe = (req.body && (req.body.jwe || req.body.encrypted || req.body.ciphertext)) as string;
      if (!jwe) return res.status(400).json({ error: "Missing encrypted payload" });
      const decrypted = await decryptPayload(jwe);
      req.body = decrypted;
    }
    next();
  } catch (err: any) {
    return res.status(400).json({ error: "Failed to decrypt payload", message: err.message });
  }
}