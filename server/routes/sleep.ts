import { RequestHandler } from "express";
import { z } from "zod";
import cron from "node-cron";
import { emitUserEvent } from "../services/socket";

const scheduleMap = new Map<string, cron.ScheduledTask>();

const alarmSchema = z.object({
  userId: z.string().min(1),
  bedtime: z.coerce.date(),
  cycles: z.number().int().min(1).max(8).default(5),
});

export const scheduleSleepAlarm: RequestHandler = async (req, res) => {
  const parse = alarmSchema.safeParse(req.body);
  if (!parse.success) return res.status(400).json({ error: "Invalid payload", details: parse.error.flatten() });

  const { userId, bedtime, cycles } = parse.data;
  const wakeTime = new Date(bedtime.getTime() + cycles * 90 * 60 * 1000);

  const key = `alarm:${userId}`;
  const existing = scheduleMap.get(key);
  if (existing) existing.stop();

  const cronExpr = `${wakeTime.getUTCMinutes()} ${wakeTime.getUTCHours()} ${wakeTime.getUTCDate()} ${wakeTime.getUTCMonth() + 1} *`;
  const task = cron.schedule(cronExpr, () => {
    emitUserEvent(userId, "sleep-alarm", { userId, wakeTime: new Date().toISOString() });
  }, { timezone: "UTC" });

  scheduleMap.set(key, task);

  return res.json({ success: true, userId, wakeTime: wakeTime.toISOString(), cron: cronExpr });
};