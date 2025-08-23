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
  testDemoLogin,
} from "./routes/auth";
import {
  getPersonalizedMedicalContext,
  enhanceQueryWithContext,
  getPersonalizedInsights,
  performAIScan,
} from "./routes/personalizedContext";

export function createServer() {
  const app = express();

  // Basic middleware setup with performance optimizations
  app.use(cors({
    origin: process.env.NODE_ENV === "production" 
      ? ["https://your-app.netlify.app", "https://localhost:3000"] 
      : ["http://localhost:8080", "http://localhost:3000", "http://localhost:3001"],
    credentials: true,
    optionsSuccessStatus: 200, // Some legacy browsers choke on 204
  }));
  app.use(cookieParser());
  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

  // Health check endpoint (always available)
  app.get("/api/health", (req, res) => {
    res.json({
      status: "ok",
      timestamp: new Date().toISOString(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Initialize services in background (non-blocking) with reduced priority
  const initializeServices = async () => {
    try {
      console.log("🚀 Starting background service initialization...");

      // Initialize user authentication service first (high priority)
      try {
        const { UserAuthenticationService } = await import("./services/userAuthentication");
        UserAuthenticationService.initialize();
        console.log("✅ User authentication service initialized");
      } catch (error) {
        console.log("⚠️ User authentication service failed:", error.message);
      }

      // Only initialize heavy services if enabled
      if (process.env.ENABLE_PERFORMANCE_OPTIMIZER === 'true') {
        setTimeout(async () => {
          try {
            const { PerformanceOptimizerService } = await import("./services/performanceOptimizer");
            await PerformanceOptimizerService.initialize();
            console.log("✅ Performance optimizer initialized");
          } catch (error) {
            console.log("⚠️ Performance optimizer failed:", error.message);
          }
        }, 1000);
      } else {
        console.log("⏭️ Performance optimizer disabled");
      }

      // Only initialize blockchain if enabled
      if (process.env.ENABLE_BLOCKCHAIN === 'true') {
        setTimeout(async () => {
          try {
            const { ProductionBlockchainService } = await import("./services/productionBlockchain");
            ProductionBlockchainService.initializeBlockchain();
            console.log("✅ Blockchain system initialized");
          } catch (error) {
            console.log("⚠️ Blockchain system failed:", error.message);
          }
        }, 2000);
      } else {
        console.log("⏭️ Blockchain system disabled");
      }

      // Only initialize database if enabled and connection available
      if (process.env.ENABLE_SECURE_DATA === 'true' && process.env.DATABASE_URL) {
        setTimeout(async () => {
          try {
            const { initializeDatabase } = await import("./routes/databaseHealth");
            await initializeDatabase();
            console.log("✅ Database initialized");
          } catch (error) {
            console.log("⚠️ Database initialization failed:", error.message);
          }
        }, 3000);
      } else {
        console.log("⏭️ Database initialization disabled (no DATABASE_URL or ENABLE_SECURE_DATA=false)");
      }

    } catch (error) {
      console.error("❌ Service initialization error:", error);
    }
  };

  // Start background initialization
  initializeServices();

  // Add routes with error handling and performance optimization
  const addRoutes = async () => {
    try {
      console.log("🚀 Adding API routes...");
      
      // Add all routes in parallel for better performance
      const routePromises = [
        // Health records routes
        (async () => {
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
            return "Health records routes";
          } catch (error) {
            throw new Error(`Health records: ${error.message}`);
          }
        })(),

        // Auth routes (high priority)
        (async () => {
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
            app.get("/api/auth/test-demo", testDemoLogin);
            return "Auth routes";
          } catch (error) {
            throw new Error(`Auth routes: ${error.message}`);
          }
        })(),

        // Demo routes (high priority for testing)
        (async () => {
          try {
            app.get("/api/demo", handleDemo);
            app.post("/api/demo/keys", generateDemoKeys);
            app.get("/api/demo/keys", getDemoKeysInfo);
            app.post("/api/demo/init", initializeDemoData);
            return "Demo routes";
          } catch (error) {
            throw new Error(`Demo routes: ${error.message}`);
          }
        })(),

        // Other routes (lower priority)
        (async () => {
          try {
            // Secure data API routes
            app.post("/api/secure/generate-keys", generateSplitKeys);
            app.post("/api/secure/store", storeSecureData);
            app.get("/api/secure/retrieve", retrieveSecureData);
            app.post("/api/secure/rotate-keys", rotateKeys);
            app.get("/api/secure/verify", verifyDataIntegrity);
            app.get("/api/secure/audit", getAuditLogs);
            app.post("/api/secure/emergency-key", generateEmergencyKey);
            app.get("/api/secure/status", getSystemStatus);
            app.post("/api/secure/validate", validateKeyFragments);

            // Database health routes
            app.get("/api/database/health", checkDatabaseHealth);
            app.post("/api/database/init", initializeDatabase);
            app.get("/api/database/test", testDatabaseConnection);

            // Personalized context routes
            app.get("/api/medical-context/personalized", getPersonalizedMedicalContext);
            app.post("/api/medical-context/enhance", enhanceQueryWithContext);
            app.get("/api/medical-context/insights", getPersonalizedInsights);
            app.post("/api/medical-context/ai-scan", performAIScan);

            return "Other routes";
          } catch (error) {
            throw new Error(`Other routes: ${error.message}`);
          }
        })(),

        // IoT and notifications (lowest priority)
        (async () => {
          try {
            const { iotStream, ingestIoTData } = await import("./routes/iot");
            app.get("/api/iot/stream", iotStream);
            app.post("/api/iot/ingest", ingestIoTData);

            const { notificationsStream, scheduleHydration, scheduleBedtime } = await import("./routes/notifications");
            app.get("/api/notifications/stream", notificationsStream);
            app.post("/api/notifications/hydration", scheduleHydration);
            app.post("/api/notifications/bedtime", scheduleBedtime);

            return "IoT and notifications routes";
          } catch (error) {
            throw new Error(`IoT routes: ${error.message}`);
          }
        })(),
      ];

      // Wait for all routes to be added
      const results = await Promise.allSettled(routePromises);
      
      // Log results
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          console.log(`✅ ${result.value} added`);
        } else {
          console.log(`⚠️ Route group ${index} failed: ${result.reason}`);
        }
      });

      console.log("✅ All API routes configured");
    } catch (error) {
      console.error("❌ Route configuration error:", error);
    }
  };

  // Add routes in background
  addRoutes();

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

  return app;
}
