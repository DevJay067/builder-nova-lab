import { SignJWT, jwtVerify } from "jose";

const encoder = new TextEncoder();

export async function signJwt(payload: object, expiresIn = "7d"): Promise<string> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  const key = encoder.encode(secret);
  return await new SignJWT({ ...payload })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime(expiresIn)
    .sign(key);
}

export async function verifyJwt<T = any>(token: string): Promise<T> {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET not set");
  const key = encoder.encode(secret);
  const { payload } = await jwtVerify(token, key);
  return payload as T;
}