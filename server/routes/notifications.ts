import { RequestHandler } from "express";
import { SecureDataAccessService } from "../services/secureDataAccess";

// In-memory scheduler storage (process lifetime)
const hydrationTimers: Map<string, NodeJS.Timeout> = new Map();
const bedtimeTimers: Map<string, NodeJS.Timeout> = new Map();

// SSE subscribers per session
const notifSubscribers: Map<string, Set<any>> = new Map();

function getTokenFrom(req: any): string | null {
  const sessionToken =
    req.headers.authorization?.replace("Bearer ", "") ||
    req.cookies?.healthchain_session ||
    (req.headers["x-session-token"] as string) ||
    (req.query.token as string);
  return sessionToken || null;
}

function ensureChannel(token: string): Set<any> {
  if (!notifSubscribers.has(token)) notifSubscribers.set(token, new Set());
  return notifSubscribers.get(token)!;
}

function sendEvent(token: string, event: string, data: any) {
  const subs = notifSubscribers.get(token);
  if (!subs) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of subs) {
    try { res.write(payload); } catch { subs.delete(res); }
  }
}

export const notificationsStream: RequestHandler = (req, res) => {
  const token = getTokenFrom(req);
  if (!token || !SecureDataAccessService.validateSession(token)) {
    return res.status(401).json({ success: false, error: "Invalid session" });
  }

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Transfer-Encoding", "chunked");
  res.flushHeaders?.();

  const channel = ensureChannel(token);
  channel.add(res);
  res.write(`event: ready\ndata: ${JSON.stringify({ ok: true, ts: Date.now() })}\n\n`);

  req.on("close", () => {
    channel.delete(res);
    res.end();
  });
};

export const scheduleHydration: RequestHandler = (req, res) => {
  const token = getTokenFrom(req);
  if (!token || !SecureDataAccessService.validateSession(token)) {
    return res.status(401).json({ success: false, error: "Invalid session" });
  }

  const { minutes = 30, repeat = false } = req.body || {};
  if (!minutes || minutes <= 0) {
    return res.status(400).json({ success: false, error: "Invalid minutes" });
  }

  // Clear existing
  const existing = hydrationTimers.get(token);
  if (existing) clearTimeout(existing);

  const schedule = () => {
    const t = setTimeout(() => {
      sendEvent(token, "hydration", { message: "It's water time!", ts: Date.now(), minutes, repeat });
      if (repeat) {
        schedule();
      } else {
        hydrationTimers.delete(token);
      }
    }, minutes * 60 * 1000);
    hydrationTimers.set(token, t);
  };

  schedule();
  return res.json({ success: true, scheduledInMs: minutes * 60 * 1000, repeat });
};

export const scheduleBedtime: RequestHandler = (req, res) => {
  const token = getTokenFrom(req);
  if (!token || !SecureDataAccessService.validateSession(token)) {
    return res.status(401).json({ success: false, error: "Invalid session" });
  }

  const { hour, minute, repeat = true } = req.body || {};
  if (typeof hour !== "number" || typeof minute !== "number") {
    return res.status(400).json({ success: false, error: "Invalid time" });
  }

  const existing = bedtimeTimers.get(token);
  if (existing) clearTimeout(existing);

  const scheduleNext = () => {
    const now = new Date();
    const target = new Date();
    target.setHours(hour, minute, 0, 0);
    if (target.getTime() <= now.getTime()) target.setDate(target.getDate() + 1);
    const delay = target.getTime() - now.getTime();

    const t = setTimeout(() => {
      sendEvent(token, "bedtime", { message: "It's bedtime", ts: Date.now(), hour, minute });
      if (repeat) {
        scheduleNext();
      } else {
        bedtimeTimers.delete(token);
      }
    }, delay);
    bedtimeTimers.set(token, t);
  };

  scheduleNext();
  return res.json({ success: true });
};