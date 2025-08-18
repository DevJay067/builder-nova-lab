import { RequestHandler } from "express";
import { SecureDataAccessService } from "../services/secureDataAccess";

// Simple in-memory pub/sub for SSE by channel (sessionToken or "demo")
const channelSubscribers: Map<string, Set<any>> = new Map();

function getChannel(key: string): Set<any> {
  if (!channelSubscribers.has(key)) {
    channelSubscribers.set(key, new Set());
  }
  return channelSubscribers.get(key)!;
}

function broadcastToChannel(channelKey: string, event: string, data: any) {
  const subs = channelSubscribers.get(channelKey);
  if (!subs) return;
  const payload = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
  for (const res of subs) {
    try {
      res.write(payload);
    } catch (e) {
      // Drop broken connection
      subs.delete(res);
    }
  }
}

export const iotStream: RequestHandler = (req, res) => {
  // Support cookie, query param, or Authorization header
  const tokenFromHeader = req.headers.authorization?.replace("Bearer ", "");
  const tokenFromCookie = (req as any).cookies?.healthchain_session as string | undefined;
  const tokenFromQuery = (req.query.token as string) || undefined;
  const simulate = (req.query.simulate as string) === "true";

  const sessionToken = tokenFromQuery || tokenFromCookie || tokenFromHeader;
  const channelKey = sessionToken && SecureDataAccessService.validateSession(sessionToken)
    ? sessionToken
    : "demo";

  // Prepare SSE headers (avoid buffering)
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache, no-transform");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("X-Accel-Buffering", "no");
  res.setHeader("Transfer-Encoding", "chunked");
  res.flushHeaders?.();

  // Register subscriber
  const channel = getChannel(channelKey);
  channel.add(res);

  // Send initial event
  res.write(`event: ready\ndata: ${JSON.stringify({ channel: channelKey, timestamp: Date.now() })}\n\n`);

  // Heartbeat to keep connection alive
  const keepAlive = setInterval(() => {
    try {
      res.write(`event: ping\ndata: ${Date.now()}\n\n`);
    } catch {
      clearInterval(keepAlive);
    }
  }, 25000);

  // Optional demo simulation
  let demoInterval: any = null;
  if (channelKey === "demo" || simulate) {
    demoInterval = setInterval(() => {
      const now = new Date().toISOString();
      const heartRate = Math.floor(Math.random() * 20) + 65;
      const spo2 = Math.floor(Math.random() * 3) + 97;
      const steps = Math.floor(Math.random() * 20) + 1000;
      const payload = {
        type: "iot_vitals",
        timestamp: now,
        metrics: { heartRate, spo2, steps },
        device: { id: "demo_device", type: "simulator" },
      };
      try {
        res.write(`event: vitals\ndata: ${JSON.stringify(payload)}\n\n`);
      } catch {
        // ignore
      }
    }, 3000);
  }

  // Cleanup on close
  req.on("close", () => {
    clearInterval(keepAlive);
    if (demoInterval) clearInterval(demoInterval);
    channel.delete(res);
    res.end();
  });
};

export const ingestIoTData: RequestHandler = async (req, res) => {
  try {
    const {
      deviceId,
      deviceType,
      timestamp,
      metrics,
      targetSessionToken,
    } = req.body || {};

    // Basic validation - allow any supported metric
    const supportedKeys = ["heartRate", "spo2", "steps", "calories", "distance"];
    const hasAnyMetric = metrics && typeof metrics === "object" && supportedKeys.some((k) => typeof metrics[k] === "number");
    if (!hasAnyMetric) {
      return res.status(400).json({ success: false, message: "Missing metrics: provide at least one of heartRate, spo2, steps, calories, distance" });
    }

    const event = {
      type: "iot_vitals",
      timestamp: timestamp || new Date().toISOString(),
      metrics: Object.fromEntries(Object.entries(metrics).filter(([k,v]) => supportedKeys.includes(k) && typeof v === "number")),
      device: { id: deviceId || "unknown", type: deviceType || "unknown" },
    };

    // Determine broadcast channel(s)
    const authHeaderToken = req.headers.authorization?.replace("Bearer ", "");
    const cookieToken = (req as any).cookies?.healthchain_session as string | undefined;
    const sessionToken = targetSessionToken || authHeaderToken || cookieToken;

    if (sessionToken && SecureDataAccessService.validateSession(sessionToken)) {
      // Broadcast to this user's channel
      broadcastToChannel(sessionToken, "vitals", event);

      // Persist into secure records as iot_vitals
      try {
        await SecureDataAccessService.storeHealthRecord(sessionToken, {
          type: "iot_vitals",
          data: {
            ...event.metrics,
            device: event.device,
          },
          timestamp: event.timestamp,
        });
      } catch (e) {
        // Non-fatal for ingestion
      }
    } else {
      // Broadcast to demo channel if no valid session
      broadcastToChannel("demo", "vitals", event);
    }

    return res.json({ success: true });
  } catch (error: any) {
    console.error("IoT ingestion error:", error);
    return res.status(500).json({ success: false, message: error.message || "Internal server error" });
  }
};