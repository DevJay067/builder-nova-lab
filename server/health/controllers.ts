import jwt from "jsonwebtoken";
import bcrypt from "bcryptjs";
import type { Handler } from "@netlify/functions";
import { connectMongo } from "./db";
import { HealthData, User } from "./models";
import { healthDataSchema, signupSchema, loginSchema } from "./validators";

const signToken = (payload: any, expiresIn = process.env.JWT_EXPIRES_IN || "7d") => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.sign(payload, secret, { expiresIn });
};

const verifyToken = (token: string) => {
  const secret = process.env.JWT_SECRET as string;
  return jwt.verify(token, secret) as any;
};

const getAuthUser = (headers: Record<string, string>) => {
  const header = headers["authorization"] || headers["Authorization"] || "";
  if (!header.startsWith("Bearer ")) return null;
  try {
    const token = header.substring(7);
    return verifyToken(token);
  } catch {
    return null;
  }
};

const memoryRecent = new Map<string, any>();

export const signupHandler: Handler = async (event) => {
  await connectMongo();
  const body = JSON.parse(event.body || "{}");
  const { error, value } = signupSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) return { statusCode: 400, body: JSON.stringify({ error: "Validation error", details: error.details.map((d) => d.message) }) };

  const exists = await User.findOne({ email: value.email });
  if (exists) return { statusCode: 409, body: JSON.stringify({ error: "Email already registered" }) };

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(value.password, salt);
  const user = await User.create({ email: value.email, password: hashed, name: value.name });
  const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
  return { statusCode: 201, body: JSON.stringify({ token, user: { id: user._id.toString(), email: user.email, name: user.name } }) };
};

export const loginHandler: Handler = async (event) => {
  await connectMongo();
  const body = JSON.parse(event.body || "{}");
  const { error, value } = loginSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) return { statusCode: 400, body: JSON.stringify({ error: "Validation error", details: error.details.map((d) => d.message) }) };

  const user = await User.findOne({ email: value.email });
  if (!user) return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };
  const ok = await bcrypt.compare(value.password, user.password);
  if (!ok) return { statusCode: 401, body: JSON.stringify({ error: "Invalid credentials" }) };

  const token = signToken({ id: user._id.toString(), email: user.email, role: user.role });
  return { statusCode: 200, body: JSON.stringify({ token, user: { id: user._id.toString(), email: user.email, name: user.name } }) };
};

export const syncDataHandler: Handler = async (event) => {
  await connectMongo();
  const auth = getAuthUser(event.headers as any);
  if (!auth) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  const body = JSON.parse(event.body || "{}");
  const { error, value } = healthDataSchema.validate(body, { abortEarly: false, stripUnknown: true });
  if (error) return { statusCode: 400, body: JSON.stringify({ error: "Validation error", details: error.details.map((d) => d.message) }) };
  if (auth.id !== value.userId) return { statusCode: 403, body: JSON.stringify({ error: "Forbidden: mismatched userId" }) };

  const record = await HealthData.create(value);
  memoryRecent.set(value.userId, record);
  return { statusCode: 201, body: JSON.stringify({ success: true, id: record._id.toString() }) };
};

export const recentHandler: Handler = async (event) => {
  await connectMongo();
  const auth = getAuthUser(event.headers as any);
  if (!auth) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  const url = new URL(event.rawUrl);
  const userId = url.searchParams.get("userId") || auth.id;
  if (userId !== auth.id) return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };

  const cached = memoryRecent.get(userId);
  if (cached) return { statusCode: 200, body: JSON.stringify({ source: "cache", data: cached }) };
  const data = await HealthData.findOne({ userId }).sort({ timestamp: -1 }).lean();
  if (data) memoryRecent.set(userId, data);
  return { statusCode: 200, body: JSON.stringify({ source: data ? "db" : "empty", data }) };
};

export const historyHandler: Handler = async (event) => {
  await connectMongo();
  const auth = getAuthUser(event.headers as any);
  if (!auth) return { statusCode: 401, body: JSON.stringify({ error: "Unauthorized" }) };
  const url = new URL(event.rawUrl);
  const userId = url.searchParams.get("userId") || auth.id;
  if (userId !== auth.id) return { statusCode: 403, body: JSON.stringify({ error: "Forbidden" }) };
  const page = Math.max(1, parseInt(url.searchParams.get("page") || "1", 10));
  const limit = Math.min(200, Math.max(1, parseInt(url.searchParams.get("limit") || "50", 10)));
  const skip = (page - 1) * limit;
  const [items, total] = await Promise.all([
    HealthData.find({ userId }).sort({ timestamp: -1 }).skip(skip).limit(limit).lean(),
    HealthData.countDocuments({ userId }),
  ]);
  return { statusCode: 200, body: JSON.stringify({ page, limit, total, items }) };
};