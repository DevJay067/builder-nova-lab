import serverless from "serverless-http";
import express from "express";
import { createServer } from "../../server/index";

// Netlify env to set: MONGODB_URI, JWT_SECRET, ENCRYPTION_KEY, GOOGLE_MAPS_API_KEY, REDIS_URL (optional), CORS_ORIGINS

// Create the main Express app with all routes
const apiApp = createServer();

// Wrapper app that adjusts the base path expected by Netlify redirects
const wrapper = express();

// Requests arrive as /.netlify/functions/api/<splat>
// Our app expects /api/<splat>. Rewrite the URL before delegating.
wrapper.use("/.netlify/functions/api", (req, res, next) => {
  const original = req.url || ""; // e.g. /data/sync
  req.url = "/api" + (original.startsWith("/") ? original : `/${original}`);
  return (apiApp as any)(req, res, next);
});

export const handler = serverless(wrapper);
