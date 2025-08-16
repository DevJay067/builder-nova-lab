import type { Server as HttpServer } from "http";
import { Server } from "socket.io";

let io: Server | null = null;

function getAllowedOrigins() {
  const env = process.env.CORS_ORIGINS;
  if (!env) return process.env.NODE_ENV === "production" ? ["https://your-app.netlify.app"] : true;
  const list = env.split(",").map((s) => s.trim()).filter(Boolean);
  return list.length ? list : true;
}

export function initSocket(server: HttpServer) {
  io = new Server(server, {
    cors: { origin: getAllowedOrigins() },
    transports: ["websocket", "polling"],
  });

  io.on("connection", (socket) => {
    const userId = socket.handshake.auth?.userId || socket.handshake.query.userId;
    if (typeof userId === "string" && userId) {
      socket.join(`user:${userId}`);
    }

    socket.on("join", (roomId: string) => {
      if (roomId) socket.join(roomId);
    });

    socket.on("disconnect", () => {
      // no-op
    });
  });

  return io;
}

export function getIO(): Server | null {
  return io;
}

export function emitUserEvent(userId: string, event: string, payload: any) {
  if (!io) return;
  io.to(`user:${userId}`).emit(event, payload);
}