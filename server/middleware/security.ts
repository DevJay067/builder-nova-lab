import helmet from "helmet";
import hpp from "hpp";
import mongoSanitize from "express-mongo-sanitize";
import xss from "xss-clean";
import compression from "compression";
import rateLimit from "express-rate-limit";
import morgan from "morgan";
import { Express } from "express";

export function applySecurity(app: Express) {
  app.use(helmet());
  app.use(hpp());
  app.use(mongoSanitize());
  app.use(xss());
  app.use(compression());
  app.use(morgan(process.env.NODE_ENV === "production" ? "combined" : "dev"));
  app.use("/api", rateLimit({ windowMs: 15 * 60 * 1000, max: 1000 }));
}