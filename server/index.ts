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
  demoLogin,
} from "./routes/auth";
import {
  getPersonalizedMedicalContext,
  enhanceQueryWithContext,
  getPersonalizedInsights,
  performAIScan,
} from "./routes/personalizedContext";
import { applySecurity } from "./middleware/security";
import { authenticateJWT } from "./middleware/authJwt";
import { syncData, getRecent, getHistory } from "./routes/data";
import { bleIngest } from "./routes/ble";
import { nearbyHospitals, triggerSOS } from "./routes/emergency";
import { scheduleSleepAlarm } from "./routes/sleep";
import { signup as jwtSignup, login as jwtLogin, me as jwtMe } from "./routes/jwtAuth";

export function createServer() {
  const app = express();

  // Basic middleware setup
  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? ["https://your-app.netlify.app", "https://localhost:3000"] 
      : true,
    credentials: true,
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));
  applySecurity(app);

  // Health check endpoint (always available)
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Initialize services in background (non-blocking)
  const initializeServices = async () => {
    try {
      console.log("🚀 Starting background service initialization...");

      // Initialize performance optimizer
      try {
        const { PerformanceOptimizerService } = await import("./services/performanceOptimizer");
        await PerformanceOptimizerService.initialize();
        console.log("✅ Performance optimizer initialized");
      } catch (error) {
        console.log("⚠️ Performance optimizer failed:", (error as any).message);
      }

      // Initialize blockchain system
      try {
        const { ProductionBlockchainService } = await import("./services/productionBlockchain");
        ProductionBlockchainService.initializeBlockchain();
        console.log("✅ Blockchain system initialized");
      } catch (error) {
        console.log("⚠️ Blockchain system failed:", (error as any).message);
      }

      // Initialize secure data access
      try {
        const { SecureDataAccessService } = await import("./services/secureDataAccess");
        await SecureDataAccessService.initialize();
        console.log("✅ Secure data access initialized");
      } catch (error) {
        console.log("⚠️ Secure data access failed:", (error as any).message);
      }

      // Initialize user authentication
      try {
        const { UserAuthenticationService } = await import("./services/userAuthentication");
        await UserAuthenticationService.initialize();
        console.log("✅ User authentication initialized");
      } catch (error) {
        console.log("⚠️ User authentication failed:", (error as any).message);
      }

      // Initialize database
      try {
        const { DatabaseInitService } = await import("./services/initDatabase");
        await DatabaseInitService.initializeDatabase();
        console.log("✅ Database initialized");
      } catch (error) {
        console.log("⚠️ Database failed:", (error as any).message);
      }

      console.log("✅ Background initialization completed");
    } catch (error) {
      console.error("❌ Background initialization error:", error);
    }
  };

  // Start background initialization
  initializeServices();

  // Add routes with error handling
  const addRoutes = async () => {
    try {
      // Health records routes
      try {
        app.post("/api/health-records", createHealthRecord);
        app.get("/api/health-records", getHealthRecords);
        app.get("/api/health-records/:id", getHealthRecord);
        app.get("/api/medical-context", getMedicalContext);
        app.get("/api/patient-profile", getPatientProfile);
        app.get("/api/blockchain/verify", verifyPatientBlockchain);
        app.get("/api/blockchain/stats", getBlockchainStats);
        app.post("/api/test-data", addTestData);
        app.post("/api/store-health-record", storeHealthRecordDirect);
        const { deleteHealthRecord } = await import("./routes/healthRecords");
        app.delete("/api/health-records/:id", deleteHealthRecord);
        console.log("✅ Health records routes added");
      } catch (error) {
        console.log("⚠️ Health records routes failed:", (error as any).message);
      }

      // Secure data API routes
      try {
        app.post("/api/secure/generate-keys", generateSplitKeys);
        app.post("/api/secure/store", storeSecureData);
        app.get("/api/secure/retrieve", retrieveSecureData);
        app.post("/api/secure/rotate-keys", rotateKeys);
        app.get("/api/secure/verify", verifyDataIntegrity);
        app.get("/api/secure/audit", getAuditLogs);
        app.post("/api/secure/emergency-key", generateEmergencyKey);
        app.get("/api/secure/status", getSystemStatus);
        app.post("/api/secure/validate", validateKeyFragments);
        console.log("✅ Secure data routes added");
      } catch (error) {
        console.log("⚠️ Secure data routes failed:", (error as any).message);
      }

      // Database health routes
      try {
        app.get("/api/database/health", checkDatabaseHealth);
        app.post("/api/database/init", initializeDatabase);
        app.get("/api/database/test", testDatabaseConnection);
        console.log("✅ Database routes added");
      } catch (error) {
        console.log("⚠️ Database routes failed:", (error as any).message);
      }

      // Demo keys routes
      try {
        app.post("/api/demo/keys", generateDemoKeys);
        app.get("/api/demo/keys", getDemoKeysInfo);
        app.post("/api/demo/init", initializeDemoData);
        console.log("✅ Demo routes added");
      } catch (error) {
        console.log("⚠️ Demo routes failed:", (error as any).message);
      }

      // Auth routes
      try {
        app.post("/api/auth/register", registerUser);
        app.post("/api/auth/login", loginUser);
        app.get("/api/auth/verify", verifySession);
        app.post("/api/auth/logout", logoutUser);
        app.get("/api/auth/profile", getUserProfile);
        app.post("/api/auth/data-access", createDataAccess);
        app.get("/api/auth/data-access", verifyDataAccess);
        app.get("/api/auth/stats", getAuthStats);
        app.post("/api/auth/authenticate", authenticateUser);
        app.post("/api/auth/demo-login", demoLogin);
        // JWT-based auth (explicit)
        app.post("/api/jwt/signup", jwtSignup);
        app.post("/api/jwt/login", jwtLogin);
        app.get("/api/jwt/me", authenticateJWT, jwtMe);
        console.log("✅ Auth routes added");
      } catch (error) {
        console.log("⚠️ Auth routes failed:", (error as any).message);
      }

      // Personalized context routes
      try {
        app.get("/api/medical-context/personalized", getPersonalizedMedicalContext);
        app.post("/api/medical-context/enhance", enhanceQueryWithContext);
        app.get("/api/medical-context/insights", getPersonalizedInsights);
        app.post("/api/medical-context/ai-scan", performAIScan);
        console.log("✅ Personalized context routes added");
      } catch (error) {
        console.log("⚠️ Personalized context routes failed:", (error as any).message);
      }

      // Demo route
      try {
        app.get("/api/demo", handleDemo);
        console.log("✅ Demo route added");
      } catch (error) {
        console.log("⚠️ Demo route failed:", (error as any).message);
      }

      // IoT routes
      try {
        const { iotStream, ingestIoTData } = await import("./routes/iot");
        app.get("/api/iot/stream", iotStream);
        app.post("/api/iot/ingest", ingestIoTData);
        console.log("✅ IoT routes added");
      } catch (error) {
        console.log("⚠️ IoT routes failed:", (error as any).message);
      }

      // Notifications routes
      try {
        const { notificationsStream, scheduleHydration, scheduleBedtime } = await import("./routes/notifications");
        app.get("/api/notifications/stream", notificationsStream);
        app.post("/api/notifications/hydration", scheduleHydration);
        app.post("/api/notifications/bedtime", scheduleBedtime);
        console.log("✅ Notifications routes added");
      } catch (error) {
        console.log("⚠️ Notifications routes failed:", (error as any).message);
      }

      // Health data sync & queries
      try {
        app.post("/api/data/sync", syncData);
        app.get("/api/data/recent", authenticateJWT, getRecent);
        app.get("/api/data/history", authenticateJWT, getHistory);
        console.log("✅ Health data routes added");
      } catch (error) {
        console.log("⚠️ Health data routes failed:", (error as any).message);
      }

      // BLE ingest
      try {
        app.post("/api/ble/ingest", ...bleIngest);
        console.log("✅ BLE ingest route added");
      } catch (error) {
        console.log("⚠️ BLE ingest route failed:", (error as any).message);
      }

      // Emergency + hospitals
      try {
        app.get("/api/emergency/nearby-hospitals", nearbyHospitals);
        app.post("/api/emergency/sos", authenticateJWT, triggerSOS);
        console.log("✅ Emergency routes added");
      } catch (error) {
        console.log("⚠️ Emergency routes failed:", (error as any).message);
      }

      // Sleep alarm scheduling
      try {
        app.post("/api/sleep/alarm", scheduleSleepAlarm);
        console.log("✅ Sleep routes added");
      } catch (error) {
        console.log("⚠️ Sleep routes failed:", (error as any).message);
      }

    } catch (error) {
      console.error("❌ Route initialization error:", error);
    }
  };

  // Add routes, then attach error and 404 handlers after
  const routesReady = addRoutes();

  routesReady.finally(() => {
    // Error handling middleware
    app.use((error: any, req: any, res: any, next: any) => {
      console.error("Express error:", error);
      res.status(500).json({
        error: "Internal server error",
        message: process.env.NODE_ENV === "development" ? error.message : "Something went wrong",
        timestamp: new Date().toISOString()
      });
    });

    // 404 handler
    app.use("*", (req, res) => {
      res.status(404).json({
        error: "Not found",
        message: "The requested endpoint does not exist",
        path: req.originalUrl,
        timestamp: new Date().toISOString()
      });
    });
  });

  return app;
}
