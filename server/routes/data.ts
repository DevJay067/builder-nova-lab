import { RequestHandler } from "express";
import { z } from "zod";
import { connectMongo } from "../services/mongo";
import { HealthDataModel } from "../models/HealthData";
import { cacheDel, cacheGet, cacheSet } from "../services/redis";
import { emitUserEvent } from "../services/socket";

const healthDataSchema = z.object({
  userId: z.string().min(1),
  timestamp: z.coerce.date(),
  heartRate: z.number().int().min(0).optional(),
  steps: z.number().int().min(0).optional(),
  calories: z.number().min(0).optional(),
  sleepData: z.object({
    durationMinutes: z.number().int().min(0).optional(),
    qualityScore: z.number().int().min(0).max(100).optional(),
    stages: z.object({
      rem: z.number().int().min(0).optional(),
      light: z.number().int().min(0).optional(),
      deep: z.number().int().min(0).optional(),
      awake: z.number().int().min(0).optional(),
    }).partial().optional(),
  }).partial().optional(),
});

export const syncData: RequestHandler = async (req, res) => {
  await connectMongo();
  const parse = healthDataSchema.safeParse(req.body);
  if (!parse.success) {
    return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });
  }

  const payload = parse.data;

  const doc = await HealthDataModel.create({
    userId: payload.userId,
    timestamp: payload.timestamp,
    heartRate: payload.heartRate,
    steps: payload.steps,
    calories: payload.calories,
    sleepData: payload.sleepData,
  });

  await cacheDel(`health:recent:${payload.userId}`);
  await cacheDel(`health:history:${payload.userId}`);

  emitUserEvent(payload.userId, "health-update", {
    userId: payload.userId,
    timestamp: doc.timestamp,
    heartRate: doc.heartRate,
    steps: doc.steps,
    calories: doc.calories,
    sleepData: doc.sleepData,
  });

  return res.status(201).json({ success: true, id: doc.id });
};

export const getRecent: RequestHandler = async (req, res) => {
  await connectMongo();
  const userId = (req.query.userId as string) || req.user?.id;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const cacheKey = `health:recent:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const recent = await HealthDataModel.findOne({ userId }).sort({ timestamp: -1 }).lean();
  await cacheSet(cacheKey, recent, 30);
  return res.json({ success: true, data: recent });
};

export const getHistory: RequestHandler = async (req, res) => {
  await connectMongo();
  const userId = (req.query.userId as string) || req.user?.id;
  if (!userId) return res.status(400).json({ error: "userId required" });

  const cacheKey = `health:history:${userId}`;
  const cached = await cacheGet(cacheKey);
  if (cached) return res.json({ success: true, data: cached, cached: true });

  const items = await HealthDataModel.find({ userId }).sort({ timestamp: -1 }).limit(1000).lean();
  await cacheSet(cacheKey, items, 300);
  return res.json({ success: true, data: items });
};