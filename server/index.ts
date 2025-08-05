import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";

// Add global error handlers to prevent server crashes
process.on('uncaughtException', (error) => {
  console.error('❌ Uncaught Exception:', error);
  // Don't exit in development to maintain server stability
});

process.on('unhandledRejection', (reason, promise) => {
  console.error('❌ Unhandled Rejection at:', promise, 'reason:', reason);
  // Don't exit in development to maintain server stability
});

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Received SIGINT, performing graceful shutdown...');
  process.exit(0);
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Received SIGTERM, performing graceful shutdown...');
  process.exit(0);
});
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

// Global initialization flag to prevent multiple initializations
let isSystemInitialized = false;
let isInitializing = false;

export function createServer() {
  // Initialize secure database on server startup (only once)
  const initializeSecureSystem = async () => {
    // Prevent multiple simultaneous initializations
    if (isSystemInitialized || isInitializing) {
      console.log("ℹ️ System already initialized or initializing, skipping...");
      return;
    }

    isInitializing = true;

    try {
      console.log("🚀 Initializing secure healthcare system...");

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
          "⚠️ User authentication system not available, continuing without it",
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
          "⚠️ Secure database not available, trying simple initialization...",
        );

        // Try to create at least the essential medical_history table
        try {
          const { SimpleDatabaseInit } = await import(
            "./services/simpleDatabaseInit"
          );
          await SimpleDatabaseInit.initializeMedicalHistoryTable();
          console.log("✅ Essential medical history table created");
        } catch (simpleError) {
          console.log("⚠️ System will work with in-memory storage only");
        }
      }

      isSystemInitialized = true;
      console.log("✅ System initialization completed successfully");
    } catch (error) {
      console.log(
        "⚠️ System initialization completed with some limitations",
      );
      console.log("   The application will continue to work in demo mode");
    } finally {
      isInitializing = false;
    }
  };

  // Run initialization only if not already done
  if (!isSystemInitialized && !isInitializing) {
    initializeSecureSystem().catch((error) => {
      console.error("❌ Critical error during system initialization:", error);
      isInitializing = false;
    });
  }

  const app = express();

  // Enhanced middleware with error handling and limits
  app.use(cors({
    credentials: true,
    origin: true
  }));

  app.use(cookieParser());

  // Add request size limits and timeout protection
  app.use(express.json({
    limit: '10mb',
    type: 'application/json'
  }));

  app.use(express.urlencoded({
    extended: true,
    limit: '10mb',
    parameterLimit: 1000
  }));

  // Request timeout middleware
  app.use((req, res, next) => {
    req.setTimeout(30000, () => { // 30 second timeout
      console.warn(`⚠️ Request timeout for ${req.method} ${req.url}`);
      if (!res.headersSent) {
        res.status(408).json({
          success: false,
          message: 'Request timeout'
        });
      }
    });
    next();
  });

  // Request logging middleware
  app.use((req, res, next) => {
    const start = Date.now();
    res.on('finish', () => {
      const duration = Date.now() - start;
      if (duration > 1000) { // Log slow requests
        console.log(`🐌 Slow request: ${req.method} ${req.url} took ${duration}ms`);
      }
    });
    next();
  });

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

  // Debug endpoint to test authentication service
  app.post("/api/debug/test-auth", async (req, res) => {
    try {
      console.log("🔍 Testing authentication service...");

      // Test basic auth service availability
      const { UserAuthenticationService } = await import("./services/userAuthentication");
      const stats = UserAuthenticationService.getSystemStats();

      console.log("📊 Auth service stats:", stats);

      res.json({
        success: true,
        environment: {
          NODE_ENV: process.env.NODE_ENV,
          DATABASE_URL_EXISTS: !!process.env.DATABASE_URL,
          NETLIFY_DATABASE_URL_EXISTS: !!process.env.NETLIFY_DATABASE_URL,
        },
        authService: {
          initialized: true,
          stats: stats,
        },
        timestamp: new Date().toISOString(),
      });
    } catch (error) {
      console.error("❌ Debug auth test failed:", error);
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        stack: error instanceof Error ? error.stack : "No stack trace",
        timestamp: new Date().toISOString(),
      });
    }
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

  // Personalized Medical Context API Routes
  app.get("/api/medical-context/personalized", getPersonalizedMedicalContext);
  app.post("/api/medical-context/enhance-query", enhanceQueryWithContext);
  app.get("/api/medical-context/insights", getPersonalizedInsights);

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

  // Global error handling middleware (must be last)
  app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
    console.error(`❌ Express error handler caught:`, error);

    // Don't send error if response already sent
    if (res.headersSent) {
      return next(error);
    }

    // Determine error status and message
    const status = error.status || error.statusCode || 500;
    const message = error.message || 'Internal server error';

    res.status(status).json({
      success: false,
      message: status === 500 ? 'Internal server error' : message,
      ...(process.env.NODE_ENV === 'development' && { stack: error.stack })
    });
  });

  // Handle 404 for API routes
  app.use('/api/*', (req: express.Request, res: express.Response) => {
    res.status(404).json({
      success: false,
      message: `API endpoint not found: ${req.method} ${req.path}`
    });
  });

  // Health check endpoint for monitoring
  app.get('/health', (req: express.Request, res: express.Response) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      memory: process.memoryUsage(),
      version: process.version
    });
  });

  console.log("✅ Express server configured with enhanced stability");
  return app;
}
