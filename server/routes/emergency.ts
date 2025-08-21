import { RequestHandler } from "express";
import { z } from "zod";
import { findNearbyHospitals } from "../services/hospitalFinder";
import { emitUserEvent } from "../services/socket";

const coordsSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  radius: z.coerce.number().min(100).max(50000).optional(),
});

export const nearbyHospitals: RequestHandler = async (req, res) => {
  const parse = coordsSchema.safeParse(req.query);
  if (!parse.success) return res.status(400).json({ error: "Invalid coordinates", details: parse.error.flatten() });
  const { lat, lng, radius } = parse.data;
  const results = await findNearbyHospitals(lat, lng, radius);
  return res.json({ success: true, hospitals: results });
};

export const triggerSOS: RequestHandler = async (req, res) => {
  const userId = req.user?.id || (req.body && req.body.userId);
  if (!userId) return res.status(400).json({ error: "userId required" });
  const info = {
    userId,
    timestamp: new Date().toISOString(),
    location: req.body?.location || null,
    reason: req.body?.reason || "sos",
  };
  emitUserEvent(userId, "emergency-sos", info);
  return res.json({ success: true, info });
};