import { Request, Response, NextFunction } from "express";
import { verifyJwt } from "../services/jwt";

declare global {
  namespace Express {
    interface Request {
      user?: { id: string; username?: string; email?: string };
    }
  }
}

export async function authenticateJWT(req: Request, res: Response, next: NextFunction) {
  try {
    const authHeader = req.headers.authorization || "";
    const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7) : null;
    if (!token) return res.status(401).json({ error: "Unauthorized" });
    const payload = await verifyJwt<any>(token);
    req.user = { id: payload.sub as string, username: payload.username, email: payload.email };
    next();
  } catch (err) {
    return res.status(401).json({ error: "Invalid token" });
  }
}