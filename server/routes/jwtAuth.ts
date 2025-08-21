import { RequestHandler } from "express";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { connectMongo } from "../services/mongo";
import { UserModel } from "../models/User";
import { signJwt } from "../services/jwt";

const signupSchema = z.object({
  username: z.string().min(3),
  email: z.string().email(),
  password: z.string().min(8),
});

const loginSchema = z.object({
  usernameOrEmail: z.string().min(3),
  password: z.string().min(8),
});

export const signup: RequestHandler = async (req, res) => {
  await connectMongo();
  const parse = signupSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });

  const { username, email, password } = parse.data;

  const existing = await UserModel.findOne({ $or: [{ username }, { email }] });
  if (existing) return res.status(409).json({ error: "User already exists" });

  const passwordHash = await bcrypt.hash(password, 10);
  const user = await UserModel.create({ username, email, passwordHash });

  const token = await signJwt({ sub: user.id, username, email }, "7d");
  return res.status(201).json({ token, user: { id: user.id, username, email } });
};

export const login: RequestHandler = async (req, res) => {
  await connectMongo();
  const parse = loginSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });

  const { usernameOrEmail, password } = parse.data;
  const user = await UserModel.findOne({ $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }] });
  if (!user) return res.status(401).json({ error: "Invalid credentials" });
  const match = await bcrypt.compare(password, user.passwordHash);
  if (!match) return res.status(401).json({ error: "Invalid credentials" });

  const token = await signJwt({ sub: user.id, username: user.username, email: user.email }, "7d");
  return res.json({ token, user: { id: user.id, username: user.username, email: user.email } });
};

export const me: RequestHandler = async (req, res) => {
  return res.json({ user: req.user });
};