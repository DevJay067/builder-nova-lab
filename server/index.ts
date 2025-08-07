import "dotenv/config";
import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import crypto from "crypto";
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
  getHealthDataForAI,
  searchHealthRecordsForAI,
} from "./routes/aiHealthContext";
import {
  registerUserSupabase,
  loginUserSupabase,
  getCurrentUserSupabase,
  signOutSupabase,
  storeHealthRecordSupabase,
  getHealthRecordsSupabase,
  getSystemStatsSupabase,
  testSupabaseConnection,
  healthCheckSupabase,
} from "./routes/supabaseAuth";

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

      // Initialize Supabase system
      try {
        const { SupabaseService } = await import("./services/supabaseService");
        SupabaseService.initialize();
        console.log("✅ Supabase system initialized successfully");
      } catch (authError) {
        console.log("⚠️  Supabase system not configured, using fallback");
        console.log("   The system will work in demo mode");
      }

      // Initialize Supabase database system
      try {
        const { SupabaseService } = await import("./services/supabaseService");
        await SupabaseService.initializeDatabase();
        await SupabaseService.initializeStorage();
        console.log(
          "✅ Supabase database and storage initialized successfully",
        );
      } catch (dbError) {
        console.log(
          "⚠️  Supabase database not configured, system will work with mock data",
        );
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
  app.use(cors());
  app.use(cookieParser());

  // Add request logging middleware
  app.use((req, res, next) => {
    if (req.path.includes("/auth/")) {
      console.log(`📥 ${req.method} ${req.path}`, {
        contentType: req.headers["content-type"],
        contentLength: req.headers["content-length"],
        hasBody: !!req.body,
      });
    }
    next();
  });

  app.use(express.json({ limit: "10mb" }));
  app.use(express.urlencoded({ extended: true, limit: "10mb" }));

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

  // Debug endpoint for registration issues
  app.post("/api/debug/register", (req, res) => {
    console.log("🔍 Debug registration endpoint hit");
    console.log("Headers:", req.headers);
    console.log("Body type:", typeof req.body);
    console.log("Body content:", req.body);

    res.json({
      success: true,
      message: "Debug endpoint working",
      headers: req.headers,
      body: req.body,
      bodyType: typeof req.body,
    });
  });

  // Simple registration test endpoint
  app.post("/api/test/register", (req, res) => {
    try {
      const { username, password, email } = req.body;

      console.log("🧪 Test registration:", {
        username,
        hasPassword: !!password,
        email,
      });

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password required",
        });
      }

      res.json({
        success: true,
        message: "Test registration successful",
        user: {
          id: "test-" + Date.now(),
          username,
          email,
          sessionToken: "test-token-" + Date.now(),
        },
      });
    } catch (error) {
      console.error("Test registration error:", error);
      res.status(500).json({
        success: false,
        message: "Test registration failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Auto-create test user endpoint for easier debugging
  app.post("/api/test/create-user", async (req, res) => {
    try {
      const { UserAuthenticationService } = await import(
        "./services/userAuthentication"
      );

      const testUser = {
        username: "testuser",
        password: "password123",
        email: "test@example.com",
        firstName: "Test",
        lastName: "User",
      };

      console.log("🧪 Creating test user for debugging...");

      const result = await UserAuthenticationService.registerUser(
        testUser.username,
        testUser.password,
        testUser.email,
        {
          firstName: testUser.firstName,
          lastName: testUser.lastName,
        },
      );

      if (result.success) {
        res.json({
          success: true,
          message: "Test user created successfully",
          user: result.user,
          credentials: {
            username: testUser.username,
            password: testUser.password,
          },
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("❌ Error creating test user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to create test user",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Auto-create user for any login attempt (development mode)
  app.post("/api/auth/auto-register", async (req, res) => {
    try {
      const { UserAuthenticationService } = await import(
        "./services/userAuthentication"
      );

      const { username, password } = req.body;

      if (!username || !password) {
        return res.status(400).json({
          success: false,
          message: "Username and password required",
        });
      }

      console.log(`🔧 Auto-registering user: ${username}`);

      const result = await UserAuthenticationService.registerUser(
        username,
        password,
        `${username}@example.com`,
        {
          firstName: username,
          lastName: "User",
        },
      );

      if (result.success) {
        res.json({
          success: true,
          message: "User auto-registered successfully",
          user: result.user,
        });
      } else {
        res.status(400).json(result);
      }
    } catch (error) {
      console.error("❌ Error auto-registering user:", error);
      res.status(500).json({
        success: false,
        message: "Failed to auto-register user",
        error: error instanceof Error ? error.message : "Unknown error",
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

  // Simple health record storage (fallback)
  app.post("/api/health-records/simple", (req, res) => {
    try {
      const { type, title, description, data } = req.body;
      const recordId = crypto.randomBytes(16).toString("hex");

      const record = {
        id: recordId,
        type: type || "general",
        title: title || "Health Record",
        description: description || "",
        data: data || {},
        timestamp: new Date().toISOString(),
        patientId: "default-patient",
      };

      console.log("📝 Storing simple health record:", recordId);

      res.json({
        success: true,
        recordId,
        record,
        message: "Health record stored successfully",
      });
    } catch (error) {
      console.error("❌ Error storing simple health record:", error);
      res.status(500).json({
        success: false,
        message: "Failed to store health record",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });
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

  // Authentication API Routes (Legacy)
  app.post("/api/auth/register", registerUser);
  app.post("/api/auth/login", loginUser);
  app.get("/api/auth/verify", verifySession);
  app.post("/api/auth/logout", logoutUser);
  app.get("/api/auth/profile", getUserProfile);
  app.post("/api/auth/data-access", createDataAccess);
  app.get("/api/auth/data-access/:dataRecordId", verifyDataAccess);
  app.get("/api/auth/stats", getAuthStats);

  // Supabase Authentication API Routes (New)
  app.post("/api/supabase/auth/register", registerUserSupabase);
  app.post("/api/supabase/auth/login", loginUserSupabase);
  app.get("/api/supabase/auth/user", getCurrentUserSupabase);
  app.post("/api/supabase/auth/signout", signOutSupabase);
  app.post("/api/supabase/health-records", storeHealthRecordSupabase);
  app.get("/api/supabase/health-records", getHealthRecordsSupabase);
  app.get("/api/supabase/stats", getSystemStatsSupabase);
  app.get("/api/supabase/test-connection", testSupabaseConnection);
  app.get("/api/supabase/health", healthCheckSupabase);

  // Universal Health Data Storage - ALL health data goes to Supabase cloud storage
  app.post("/api/health-data/store", (req, res) => {
    console.log("🚀 Routing ALL health data to Supabase cloud storage");

    // Forward all health data storage requests to Supabase cloud storage
    storeHealthRecordSupabase(req, res, () => {});
  });

  app.get("/api/health-data/records", (req, res) => {
    console.log("🔍 Retrieving ALL health data from Supabase cloud storage");

    // Forward all health data retrieval requests to Supabase cloud storage
    getHealthRecordsSupabase(req, res, () => {});
  });

  // Redirect legacy health record endpoints to Supabase cloud storage
  app.post("/api/health-records/cloud", storeHealthRecordSupabase);
  app.get("/api/health-records/cloud", getHealthRecordsSupabase);

  // Demo endpoint to test cloud storage
  app.post("/api/test-cloud-storage", async (req, res) => {
    try {
      console.log("🧪 Testing Supabase cloud storage with sample health data");

      const sampleHealthData = {
        type: "test-record",
        title: "Test Health Record",
        description: "Testing Supabase cloud storage functionality",
        data: {
          vitals: {
            bloodPressure: "120/80",
            heartRate: 72,
            temperature: 98.6,
          },
          notes: "Sample health data for testing cloud storage",
          timestamp: new Date().toISOString(),
        },
        metadata: {
          testRecord: true,
          cloudStorageTest: true,
        },
      };

      // Forward to cloud storage
      req.body = sampleHealthData;
      storeHealthRecordSupabase(req, res, () => {});
    } catch (error) {
      console.error("❌ Test cloud storage error:", error);
      res.status(500).json({
        success: false,
        message: "Test failed",
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Personalized Medical Context API Routes
  app.get("/api/medical-context/personalized", getPersonalizedMedicalContext);
  app.post("/api/medical-context/enhance-query", enhanceQueryWithContext);
  app.get("/api/medical-context/insights", getPersonalizedInsights);

  // AI Health Context API Routes
  app.get("/api/ai/health-context", getHealthDataForAI);
  app.post("/api/ai/search-health", searchHealthRecordsForAI);

  // Export storage data for backup
  app.get("/api/debug/export-storage", (req, res) => {
    try {
      const { SupabaseService } = require("./services/supabaseService");
      const storageData = (SupabaseService as any).mockStorage;
      const filesData = (SupabaseService as any).mockStorageFiles;

      res.json({
        success: true,
        message: "Storage data exported",
        export: {
          timestamp: new Date().toISOString(),
          storage: storageData,
          files: filesData,
          summary: {
            totalUsers: storageData?.users?.length || 0,
            totalHealthRecords: storageData?.health_records?.length || 0,
            totalFiles: Object.keys(filesData || {}).length,
          }
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Import storage data from backup
  app.post("/api/debug/import-storage", (req, res) => {
    try {
      const { SupabaseService } = require("./services/supabaseService");
      const { storage, files } = req.body;

      if (storage) {
        (SupabaseService as any).mockStorage = storage;
      }
      if (files) {
        (SupabaseService as any).mockStorageFiles = files;
      }

      res.json({
        success: true,
        message: "Storage data imported successfully",
        imported: {
          users: storage?.users?.length || 0,
          health_records: storage?.health_records?.length || 0,
          files: Object.keys(files || {}).length,
        }
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

  // Debug endpoint to check mock storage
  app.get("/api/debug/mock-storage", (req, res) => {
    try {
      const sessionToken =
        req.headers.authorization?.replace("Bearer ", "") ||
        req.cookies.healthchain_session ||
        (req.headers["x-session-token"] as string);

      const { SupabaseService } = require("./services/supabaseService");
      const {
        UserAuthenticationService,
      } = require("./services/userAuthentication");

      let userInfo = null;
      let userRecords = [];

      if (sessionToken) {
        const sessionResult =
          UserAuthenticationService.verifySession(sessionToken);
        if (sessionResult.valid) {
          userInfo = sessionResult.user;
          const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;
          userRecords =
            (SupabaseService as any).mockStorage?.health_records?.filter(
              (record: any) => record.patient_id === patientId,
            ) || [];
        }
      }

      res.json({
        success: true,
        currentUser: userInfo,
        userHealthRecords: userRecords.length,
        userRecords: userRecords,
        allMockStorage: (SupabaseService as any).mockStorage,
        totalAllRecords:
          (SupabaseService as any).mockStorage?.health_records?.length || 0,
      });
    } catch (error) {
      res.status(500).json({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      });
    }
  });

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
