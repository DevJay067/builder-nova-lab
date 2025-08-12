import { RequestHandler } from "express";
import { AnalyticsService } from "../services/analytics";

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