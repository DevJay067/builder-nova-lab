import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { createServer } from "./index";

const PORT = process.env.PORT || 3001;

async function startDevServer() {
  try {
    console.log("🚀 Starting development server...");
    
    const app = createServer();
    
    // Start the server
    app.listen(PORT, () => {
      console.log(`✅ Development server running on http://localhost:${PORT}`);
      console.log(`✅ API endpoints available at http://localhost:${PORT}/api/*`);
      console.log(`✅ Health check: http://localhost:${PORT}/api/health`);
      console.log(`✅ Demo login: http://localhost:${PORT}/api/auth/demo-login`);
    });
    
  } catch (error) {
    console.error("❌ Failed to start development server:", error);
    process.exit(1);
  }
}

// Start the server
startDevServer();