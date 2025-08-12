import { RequestHandler } from "express";
import { AnalyticsService } from "../services/analytics";
import { NeonDatabaseService } from "../services/neonDatabase";

export const setGoals: RequestHandler = async (req, res) => {
  const sessionToken = (req.headers.authorization?.replace("Bearer ", "") || req.headers["x-session-token"]) as string;
  if (!sessionToken) return res.status(401).json({ success: false, message: "Auth required" });
  const result = AnalyticsService.setGoals(sessionToken, req.body || {});
  if (!result.success) return res.status(400).json(result);
  res.json(result);
};

export const getGoals: RequestHandler = async (req, res) => {
  const sessionToken = (req.headers.authorization?.replace("Bearer ", "") || req.headers["x-session-token"]) as string;
  if (!sessionToken) return res.status(401).json({ success: false, message: "Auth required" });
  res.json(AnalyticsService.getGoals(sessionToken));
};

export const setReminders: RequestHandler = async (req, res) => {
  const sessionToken = (req.headers.authorization?.replace("Bearer ", "") || req.headers["x-session-token"]) as string;
  if (!sessionToken) return res.status(401).json({ success: false, message: "Auth required" });
  const result = AnalyticsService.setReminders(sessionToken, req.body || {});
  if (!result.success) return res.status(400).json(result);
  res.json(result);
};

export const getReminders: RequestHandler = async (req, res) => {
  const sessionToken = (req.headers.authorization?.replace("Bearer ", "") || req.headers["x-session-token"]) as string;
  if (!sessionToken) return res.status(401).json({ success: false, message: "Auth required" });
  res.json(AnalyticsService.getReminders(sessionToken));
};

export const deleteAllMyData: RequestHandler = async (req, res) => {
  const sessionToken = (req.headers.authorization?.replace("Bearer ", "") || req.headers["x-session-token"]) as string;
  if (!sessionToken) return res.status(401).json({ success: false, message: "Auth required" });
  try {
    const user = (AnalyticsService as any).getUserHashFromSession(sessionToken);
    if (!user) return res.status(401).json({ success: false, message: "Invalid session" });
    // Best-effort crypto-erasure: mark revocation in blockchain would be added here
    let dbResult: any = null;
    if (process.env.DATABASE_URL) {
      dbResult = await NeonDatabaseService.deleteUserDataForUser(user);
    }
    res.json({ success: true, deleted: dbResult?.deleted || {} });
  } catch (e) {
    res.status(500).json({ success: false, message: "Failed to delete user data" });
  }
};