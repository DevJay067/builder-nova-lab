import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import { handleDemo } from "./routes/demo";
import {
  createHealthRecord,
  getHealthRecords,
  getHealthRecord,
  getMedicalContext,
  getPatientProfile,
  verifyPatientBlockchain,
  getBlockchainStats,
  addTestData,
  storeHealthRecordDirect,
} from "./routes/healthRecords";
import {
  generateSplitKeys,
  storeSecureData,
  retrieveSecureData,
  rotateKeys,
  verifyDataIntegrity,
  getAuditLogs,
  generateEmergencyKey,
  getSystemStatus,
  validateKeyFragments,
} from "./routes/secureDataAPI";
import {
  checkDatabaseHealth,
  initializeDatabase,
  testDatabaseConnection,
} from "./routes/databaseHealth";
import {
  generateDemoKeys,
  getDemoKeysInfo,
  initializeDemoData,
} from "./routes/demoKeys";
import {
  registerUser,
  loginUser,
  verifySession,
  logoutUser,
  getUserProfile,
  createDataAccess,
  verifyDataAccess,
  getAuthStats,
  authenticateUser,
} from "./routes/auth";
import {
  getPersonalizedMedicalContext,
  enhanceQueryWithContext,
  getPersonalizedInsights,
} from "./routes/personalizedContext";
import {
  streamVitals,
  getLatestVitals,
  updateVitals,
  startMock,
  stopMock,
} from "./routes/iot";
import { setGoals, getGoals, setReminders, getReminders, deleteAllMyData, registerPushSubscription } from "./routes/analytics";

export function createServer() {
  // Initialize secure database on server startup
  const initializeSecureSystem = async () => {
    try {
      console.log("🚀 Attempting to initialize secure healthcare system...");

      // Initialize production blockchain system
      try {
        const { ProductionBlockchainService } = await import(
          "./services/productionBlockchain"
        );
        ProductionBlockchainService.initializeBlockchain();
        console.log("✅ Production blockchain system initialized successfully");
      } catch (blockchainError) {
        console.log(
          "⚠️ Production blockchain initialization failed, continuing...",
        );
      }

      // Initialize secure data access system
      try {
        const { SecureDataAccessService } = await import(
          "./services/secureDataAccess"
        );
        await SecureDataAccessService.initialize();
        console.log("✅ Secure data access system initialized successfully");
      } catch (secureError) {
        console.log(
          "⚠️ Secure data access system initialization failed, continuing...",
        );
      }

      // Try to initialize user authentication system with production features
      try {
        const { UserAuthenticationService } = await import(
          "./services/userAuthentication"
        );
        await UserAuthenticationService.initialize();
        console.log("✅ User authentication system initialized successfully");
      } catch (authError) {
        console.log(
          "⚠️  User authentication system not available, continuing without it",
        );
        console.log("   The system will work in demo mode");
      }

      // Try to initialize the main database system
      try {
        const { DatabaseInitService } = await import("./services/initDatabase");
        await DatabaseInitService.initializeSecureHealthcareDatabase();
        console.log("✅ Secure healthcare database initialized successfully");
      } catch (dbError) {
        console.log(
          "⚠️  Secure database not available, trying simple initialization...",
        );

        // Try to create at least the essential medical_history table
        try {
          const { SimpleDatabaseInit } = await import(
            "./services/simpleDatabaseInit"
          );
          await SimpleDatabaseInit.initializeMedicalHistoryTable();
          console.log("✅ Essential medical history table created");
        } catch (simpleError) {
          console.log("⚠️  System will work with in-memory storage only");
        }
      }
    } catch (error) {
      console.log(
        "⚠️  Secure system initialization completed with some limitations",
      );
      console.log("   The application will continue to work in demo mode");
    }
  };

  // Run initialization (don't await to avoid blocking server start)
  initializeSecureSystem();

  const app = express();

  // Middleware
  // Trust proxy for secure cookies and correct protocol detection (e.g., behind Netlify/NGINX)
  app.set("trust proxy", 1);

  const allowedOrigins = [
    /^(http:\/\/|https:\/\/)localhost(:\d+)?$/,
    /^(http:\/\/|https:\/\/)127\.0\.0\.1(:\d+)?$/,
  ];
  app.use(
    cors({
      origin: (origin, cb) => {
        if (!origin) return cb(null, true);
        if (process.env.NODE_ENV === "production") {
          // In production, disable cross-origin requests
          return cb(null, false);
        }
        if (allowedOrigins.some((re) => re.test(origin))) return cb(null, true);
        return cb(null, false);
      },
      credentials: true,
      methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
      allowedHeaders: [
        "Content-Type",
        "Authorization",
        "x-session-token",
        "x-patient-key",
        "x-provider-key",
      ],
    }),
  );
  app.use(cookieParser());
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));

  // Minimal hardening headers (subset of helmet)
  app.disable("x-powered-by");
  app.use((_, res, next) => {
    res.setHeader("Cross-Origin-Opener-Policy", "same-origin");
    res.setHeader("Cross-Origin-Resource-Policy", "same-origin");
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("Referrer-Policy", "no-referrer");
    if (process.env.NODE_ENV === "production") {
      res.setHeader("Strict-Transport-Security", "max-age=63072000; includeSubDomains; preload");
    }
    next();
  });

  // Basic in-memory rate limiter (per-IP)
  const requests: Record<string, { count: number; ts: number }> = {};
  function rateLimit(windowMs = 60_000, max = 120) {
    return (req: any, res: any, next: any) => {
      const ip = req.ip || req.headers["x-forwarded-for"] || req.socket.remoteAddress || "unknown";
      const now = Date.now();
      const entry = requests[ip] || { count: 0, ts: now };
      if (now - entry.ts > windowMs) {
        entry.count = 0;
        entry.ts = now;
      }
      entry.count += 1;
      requests[ip] = entry;
      if (entry.count > max) {
        return res.status(429).json({ success: false, message: "Too many requests" });
      }
      next();
    };
  }
  // Apply to sensitive routes
  app.use(["/api/auth/", "/api/vitals/", "/api/secure/"], rateLimit());

  // Example API routes
  app.get("/api/ping", (_req, res) => {
    const ping = process.env.PING_MESSAGE ?? "ping";
    res.json({ message: ping });
  });

  // Test endpoint for debugging
  app.post("/api/test", (req, res) => {
    console.log("🧪 Test endpoint hit", { body: req.body });
    res.json({
      success: true,
      received: req.body,
      timestamp: new Date().toISOString(),
    });
  });

  // Debug endpoint to check user existence
  app.get("/api/debug/user/:username", async (req, res) => {
    try {
      const { username } = req.params;
      const { UserAuthenticationService } = await import(
        "./services/userAuthentication"
      );

      // Check both memory and database
      const stats = UserAuthenticationService.getSystemStats();

      res.json({
        success: true,
        username: username,
        systemStats: stats,
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  app.get("/api/demo", handleDemo);

  // Health Records & Blockchain API Routes
  app.post("/api/health-records", createHealthRecord);
  app.get("/api/health-records", getHealthRecords);
  app.get("/api/health-records/:recordId", getHealthRecord);
  app.post("/api/health-records/store-direct", storeHealthRecordDirect);
  app.get("/api/medical-context", getMedicalContext);
  app.post("/api/add-test-data", addTestData);

  // Patient & Blockchain Management
  app.get("/api/patient/profile", getPatientProfile);
  app.get("/api/patient/verify-blockchain", verifyPatientBlockchain);
  app.get("/api/blockchain/stats", getBlockchainStats);

  // Secure Data Access API Routes
  app.post("/api/secure/keys/generate", generateSplitKeys);
  app.post("/api/secure/data/store", storeSecureData);
  app.post("/api/secure/data/retrieve/:recordId", retrieveSecureData);
  app.post("/api/secure/keys/rotate/:keyId", rotateKeys);
  app.get("/api/secure/data/verify/:recordId", verifyDataIntegrity);
  app.get("/api/secure/audit/:recordId", getAuditLogs);
  app.post("/api/secure/emergency/key", generateEmergencyKey);
  app.get("/api/secure/system/status", getSystemStatus);
  app.post("/api/secure/keys/validate", validateKeyFragments);

  // Database Health & Management
  app.get("/api/database/health", checkDatabaseHealth);
  app.post("/api/database/initialize", initializeDatabase);
  app.post("/api/database/test-connection", testDatabaseConnection);

  // Demo Keys & Testing
  app.post("/api/demo/keys/generate", generateDemoKeys);
  app.get("/api/demo/keys/info", getDemoKeysInfo);
  app.post("/api/demo/initialize", initializeDemoData);

  // Authentication API Routes
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.get("/api/auth/verify", verifySession);
  app.post("/api/auth/logout", logoutUser);
  app.get("/api/auth/profile", getUserProfile);
  app.post("/api/auth/data-access", createDataAccess);
  app.get("/api/auth/data-access/:dataRecordId", verifyDataAccess);
  app.get("/api/auth/stats", getAuthStats);
  // Frontend expects this route to fetch all records for the authenticated user
  app.get("/api/auth/data-access/records", verifyDataAccess);

  // Personalized Medical Context API Routes
  app.get("/api/medical-context/personalized", getPersonalizedMedicalContext);
  app.post("/api/medical-context/enhance-query", enhanceQueryWithContext);
  app.get("/api/medical-context/insights", getPersonalizedInsights);

  // IoT Vitals Streaming and Control
  app.get("/api/vitals/stream", streamVitals);
  app.get("/api/health/vitals", getLatestVitals);
  app.post("/api/vitals/update", updateVitals);
  app.post("/api/vitals/mock/start", startMock);
  app.post("/api/vitals/mock/stop", stopMock);

  // Health Analytics (Goals and Reminders)
  app.post("/api/analytics/goals", setGoals);
  app.get("/api/analytics/goals", getGoals);
  app.post("/api/analytics/reminders", setReminders);
  app.get("/api/analytics/reminders", getReminders);
  app.delete("/api/analytics/delete", deleteAllMyData);
  app.post("/api/analytics/push/subscribe", registerPushSubscription);

  // Database Health Check Endpoint
  app.get("/api/health/database", async (req, res) => {
    try {
      const { DatabaseHealthService } = await import(
        "./services/databaseHealthCheck"
      );
      const health = await DatabaseHealthService.checkHealth();
      res.json({
        success: true,
        database: health,
        server: {
          uptime: process.uptime(),
          memory: process.memoryUsage(),
          timestamp: new Date().toISOString(),
        },
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        timestamp: new Date().toISOString(),
      });
    }
  });

  return app;
}
