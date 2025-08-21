import { CompactEncrypt, compactDecrypt } from "jose";

const encoder = new TextEncoder();
const decoder = new TextDecoder();

function getKeyBytes(): Uint8Array {
  const key = process.env.ENCRYPTION_KEY;
  if (!key) throw new Error("ENCRYPTION_KEY not set");
  return encoder.encode(key);
}

export async function encryptPayload(data: unknown): Promise<string> {
  const plaintext = encoder.encode(JSON.stringify(data));
  const jwe = await new CompactEncrypt(plaintext)
    .setProtectedHeader({ alg: "dir", enc: "A256GCM" })
    .encrypt(getKeyBytes());
  return jwe;
}

export async function decryptPayload<T = any>(token: string): Promise<T> {
  const { plaintext } = await compactDecrypt(token, getKeyBytes());
  const json = decoder.decode(plaintext);
  return JSON.parse(json) as T;
}