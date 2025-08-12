import { RequestHandler } from "express";
import { IoTVitalsService } from "../services/iotVitals";

export const streamVitals: RequestHandler = async (req, res) => {
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.flushHeaders?.();

  // Send initial comment and latest snapshot
  res.write(":ok\n\n");
  res.write(`data: ${JSON.stringify(IoTVitalsService.getLatest())}\n\n`);

  const client = res as unknown as NodeJS.WritableStream;
  IoTVitalsService.addClient(client);

  // Heartbeat
  const heartbeat = setInterval(() => {
    try {
      res.write(":heartbeat\n\n");
    } catch {
      clearInterval(heartbeat);
    }
  }, 15000);

  req.on("close", () => {
    clearInterval(heartbeat);
    IoTVitalsService.removeClient(client);
  });
};

export const getLatestVitals: RequestHandler = async (_req, res) => {
  res.json({ success: true, vitals: IoTVitalsService.getLatest() });
};

export const updateVitals: RequestHandler = async (req, res) => {
  const payload = req.body || {};
  const updated = IoTVitalsService.updateVitals(payload);
  res.json({ success: true, vitals: updated });
};

export const startMock: RequestHandler = async (_req, res) => {
  IoTVitalsService.startMock();
  res.json({ success: true, message: "Mock IoT generator started" });
};

export const stopMock: RequestHandler = async (_req, res) => {
  IoTVitalsService.stopMock();
  res.json({ success: true, message: "Mock IoT generator stopped" });
};