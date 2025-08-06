import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { EnhancedUserAuthenticationService } from "./services/enhancedUserAuthentication";
import { SecureCloudStorageService } from "./services/secureCloudStorage";
import { CloudAuthenticationService } from "./services/cloudAuthenticationService";
import { MedicalRecordsManager } from "./services/medicalRecordsManager";
import { SplitKeyAuthService } from "./services/splitKeyAuthService";
import { IPFSStorageService } from "./services/ipfsStorageService";
import { SupabaseService } from "./services/supabaseService";
import { BlockchainService } from "./services/blockchainService";

// Import existing routes
import authRoutes from "./routes/auth";
import enhancedAuthRoutes from "./routes/enhancedAuth";
import cloudStorageRoutes from "./routes/cloudStorage";
import healthRecordsRoutes from "./routes/healthRecords";
import imageUploadRoutes from "./routes/imageUpload";
import demoRoutes from "./routes/demo";
import demoKeysRoutes from "./routes/demoKeys";
import databaseHealthRoutes from "./routes/databaseHealth";

// Import new secure health API
import secureHealthAPIRoutes from "./routes/secureHealthAPI";

const app = express();
const PORT = process.env.PORT || 8080;

// Security middleware
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
      fontSrc: ["'self'", "https://fonts.gstatic.com"],
      imgSrc: ["'self'", "data:", "https:", "blob:"],
      scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
      connectSrc: ["'self'", "https:", "wss:", "ws:"],
      mediaSrc: ["'self'", "blob:"],
    },
  },
  crossOriginEmbedderPolicy: false,
}));

// CORS configuration
const corsOptions = {
  origin: process.env.CORS_ORIGIN?.split(',') || [
    'http://localhost:3000',
    'http://localhost:8080',
    'http://127.0.0.1:3000',
    'http://127.0.0.1:8080'
  ],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-client-key'],
};

app.use(cors(corsOptions));

// Global rate limiting
const globalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 1000, // Limit each IP to 1000 requests per windowMs
  message: {
    error: 'Too many requests from this IP, please try again later.',
  },
  standardHeaders: true,
  legacyHeaders: false,
});

app.use(globalLimiter);

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Request logging middleware
app.use((req, res, next) => {
  const timestamp = new Date().toISOString();
  const method = req.method;
  const url = req.url;
  const ip = req.ip || req.connection.remoteAddress;
  
  console.log(`${timestamp} - ${method} ${url} - IP: ${ip}`);
  next();
});

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    services: {
      authentication: EnhancedUserAuthenticationService.getSystemStats(),
      cloudStorage: SecureCloudStorageService.getStatus(),
      splitKeyAuth: SplitKeyAuthService.getStats(),
      medicalRecords: MedicalRecordsManager.getStatus(),
      ipfsStorage: IPFSStorageService.getStatus(),
      database: SupabaseService.getStatus(),
      blockchain: BlockchainService.getStatus(),
    },
  });
});

// API Routes

// Legacy authentication routes (maintained for backward compatibility)
app.use("/api/auth", authRoutes);
app.use("/api/enhanced-auth", enhancedAuthRoutes);

// Cloud storage and health records routes
app.use("/api/cloud-storage", cloudStorageRoutes);
app.use("/api/health-records", healthRecordsRoutes);

// Image upload and processing
app.use("/api/image-upload", imageUploadRoutes);

// Demo and development routes
app.use("/api/demo", demoRoutes);
app.use("/api/demo-keys", demoKeysRoutes);

// Database health monitoring
app.use("/api/database-health", databaseHealthRoutes);

// NEW: Secure Health API with split-key authentication and blockchain
app.use("/api/secure-health", secureHealthAPIRoutes);

// System information endpoint
app.get("/api/system/info", async (req, res) => {
  try {
    const systemInfo = {
      name: "HealthChain Secure Medical Records System",
      version: "1.0.0",
      features: {
        splitKeyAuthentication: true,
        aes256Encryption: true,
        ipfsStorage: IPFSStorageService.getStatus().clientAvailable,
        blockchainIntegrity: BlockchainService.getStatus().connected,
        supabaseDatabase: SupabaseService.getStatus().clientAvailable,
        rateLimiting: true,
        auditLogging: true,
      },
      endpoints: {
        legacy: [
          "/api/auth/*",
          "/api/enhanced-auth/*",
          "/api/cloud-storage/*",
          "/api/health-records/*",
        ],
        secure: [
          "/api/secure-health/register",
          "/api/secure-health/login",
          "/api/secure-health/upload",
          "/api/secure-health/records",
          "/api/secure-health/download/:recordId",
          "/api/secure-health/search",
        ],
        system: [
          "/health",
          "/api/system/info",
          "/api/system/stats",
        ],
      },
      security: {
        encryption: "AES-256-GCM",
        keyManagement: "Split-key architecture",
        storage: "IPFS/Filecoin",
        blockchain: "Ethereum/Polygon compatible",
        authentication: "JWT with split-key validation",
      },
    };

    res.json(systemInfo);
  } catch (error) {
    console.error("❌ System info error:", error);
    res.status(500).json({
      error: "Failed to retrieve system information",
    });
  }
});

// System statistics endpoint
app.get("/api/system/stats", async (req, res) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const sessionToken = authHeader.substring(7);
    const verification = SplitKeyAuthService.verifySessionToken(sessionToken);
    
    if (!verification.valid) {
      return res.status(401).json({ error: 'Invalid session token' });
    }

    const stats = await MedicalRecordsManager.getSystemStats();
    res.json(stats);
  } catch (error) {
    console.error("❌ System stats error:", error);
    res.status(500).json({
      error: "Failed to retrieve system statistics",
    });
  }
});

// Error handling middleware
app.use((error: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error("❌ Unhandled error:", error);
  
  // Don't expose internal errors in production
  const isDevelopment = process.env.NODE_ENV !== 'production';
  
  res.status(error.status || 500).json({
    error: isDevelopment ? error.message : 'Internal server error',
    ...(isDevelopment && { stack: error.stack }),
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: "Endpoint not found",
    availableEndpoints: [
      "/health",
      "/api/system/info",
      "/api/secure-health/*",
      "/api/auth/*",
      "/api/enhanced-auth/*",
      "/api/cloud-storage/*",
      "/api/health-records/*",
    ],
  });
});

// Initialize all services
async function initializeServices() {
  console.log("🚀 Initializing HealthChain Secure Medical Records System...");
  
  try {
    // Initialize legacy services (maintain backward compatibility)
    await EnhancedUserAuthenticationService.initialize();
    await SecureCloudStorageService.initialize();
    await CloudAuthenticationService.initialize();

    // Initialize new secure services
    await SplitKeyAuthService.initialize();
    await IPFSStorageService.initialize();
    await SupabaseService.initialize();
    await BlockchainService.initialize();
    await MedicalRecordsManager.initialize();

    // Setup blockchain event listeners if available
    if (BlockchainService.getStatus().connected) {
      BlockchainService.setupEventListeners();
      console.log("👂 Blockchain event listeners activated");
    }

    console.log("✅ All services initialized successfully");
  } catch (error) {
    console.error("❌ Service initialization failed:", error);
    console.log("⚠️ Some features may be limited");
  }
}

// Graceful shutdown handling
process.on('SIGTERM', () => {
  console.log('📴 SIGTERM received, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('📴 SIGINT received, shutting down gracefully...');
  process.exit(0);
});

// Start the server
async function startServer() {
  try {
    await initializeServices();
    
    app.listen(PORT, () => {
      console.log(`
🏥 HealthChain Secure Medical Records System Started
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

🌐 Server: http://localhost:${PORT}
🔗 Health Check: http://localhost:${PORT}/health
📊 System Info: http://localhost:${PORT}/api/system/info

🔐 Secure Health API:
   • Registration: POST /api/secure-health/register
   • Login: POST /api/secure-health/login  
   • Upload: POST /api/secure-health/upload
   • Records: GET /api/secure-health/records
   • Download: GET /api/secure-health/download/:id
   • Search: GET /api/secure-health/search?q=term

🛡️ Security Features:
   ✅ Split-key authentication
   ✅ AES-256-GCM encryption
   ✅ IPFS decentralized storage
   ✅ Blockchain integrity verification
   ✅ Rate limiting protection
   ✅ Complete audit trail

📋 Legacy API (backward compatibility):
   • /api/auth/* - Original authentication
   • /api/enhanced-auth/* - Enhanced authentication
   • /api/cloud-storage/* - Cloud storage
   • /api/health-records/* - Health records

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Ready for secure medical record management! 🚀
      `);
    });
  } catch (error) {
    console.error("❌ Failed to start server:", error);
    process.exit(1);
  }
}

// Start the application
startServer();

export default app;
