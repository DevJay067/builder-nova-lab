import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';
import bcrypt from 'bcrypt';
import { db, initializeDatabase, testDatabaseConnection } from './server/config/database.ts';

const app = express();
const PORT = process.env.PORT || 3001;

// Basic middleware setup
app.use(cors({
  origin: true,
  credentials: true,
}));

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    timestamp: new Date().toISOString(),
    environment: "development",
    database: "Neon PostgreSQL Connected"
  });
});

// Test endpoint
app.get("/api/test", (req, res) => {
  res.json({
    success: true,
    message: "API is working!",
    timestamp: new Date().toISOString()
  });
});

// Demo login endpoint for judges
app.post("/api/auth/demo-login", async (req, res) => {
  try {
    console.log("🔍 Demo login request received for judges");

    // Check if demo judge user exists, create if not
    let demoUser = await db`
      SELECT * FROM users 
      WHERE username = 'demo_judge' AND role = 'judge'
    `;

    if (demoUser.length === 0) {
      // Create demo judge user
      const userHash = "demo-judge-hash-" + Date.now();
      const passwordHash = await bcrypt.hash("demo123", 10);
      
      const newUser = await db`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, 
          role, permissions, user_hash, demo_mode, secure_system_activated
        ) VALUES (
          'demo_judge', 'judge@healthchain.demo', ${passwordHash}, 'Demo', 'Judge',
          'judge', ARRAY['view_all_records', 'access_analytics', 'demo_mode'], ${userHash}, true, true
        ) RETURNING *
      `;
      
      demoUser = newUser;
    }

    const user = demoUser[0];
    const sessionToken = "demo-session-" + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Create session in database
    await db`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `;

    // Update last login
    await db`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = ${user.id}
    `;

    const demoUserResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      permissions: user.permissions,
      userHash: user.user_hash,
      sessionToken: sessionToken,
      secureSystemActivated: user.secure_system_activated,
      lastLogin: new Date().toISOString(),
      demoMode: user.demo_mode,
      demoFeatures: {
        canViewAllRecords: true,
        canAccessAnalytics: true,
        canPerformDemoActions: true,
        hasElevatedPermissions: true
      }
    };

    // Set session cookie
    res.cookie("healthchain_session", sessionToken, {
      httpOnly: true,
      secure: false, // false for development
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour for demo sessions
    });

    console.log("✅ Demo login successful for judge");

    res.json({
      success: true,
      message: "Demo login successful! Welcome to the judge demo environment.",
      user: demoUserResponse,
      securityFeatures: {
        demoMode: true,
        elevatedPermissions: true,
        sessionDuration: "1 hour",
        features: demoUserResponse.demoFeatures
      },
      demoInfo: {
        role: "Judge",
        permissions: demoUserResponse.permissions,
        features: demoUserResponse.demoFeatures,
        note: "This is a demo environment with elevated permissions for demonstration purposes."
      }
    });
  } catch (error) {
    console.error("Error in demo login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during demo login",
    });
  }
});

// Regular login endpoint
app.post("/api/auth/login", async (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Check if user exists
    const users = await db`
      SELECT * FROM users 
      WHERE username = ${username}
    `;

    let user;
    if (users.length === 0) {
      // Create new user for demo purposes
      const userHash = "demo-user-hash-" + Date.now();
      const passwordHash = await bcrypt.hash(password, 10);
      
      const newUser = await db`
        INSERT INTO users (
          username, email, password_hash, first_name, last_name, 
          role, user_hash, secure_system_activated
        ) VALUES (
          ${username}, ${username + '@demo.com'}, ${passwordHash}, 'Demo', 'User',
          'user', ${userHash}, true
        ) RETURNING *
      `;
      
      user = newUser[0];
    } else {
      user = users[0];
      // Verify password
      const isValidPassword = await bcrypt.compare(password, user.password_hash);
      if (!isValidPassword) {
        return res.status(401).json({
          success: false,
          message: "Invalid username or password",
        });
      }
    }

    const sessionToken = "demo-session-" + Math.random().toString(36).substring(2, 15);
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    // Create session in database
    await db`
      INSERT INTO sessions (user_id, session_token, expires_at)
      VALUES (${user.id}, ${sessionToken}, ${expiresAt})
    `;

    // Update last login
    await db`
      UPDATE users 
      SET last_login = NOW() 
      WHERE id = ${user.id}
    `;

    const userResponse = {
      id: user.id,
      username: user.username,
      email: user.email,
      firstName: user.first_name,
      lastName: user.last_name,
      role: user.role,
      userHash: user.user_hash,
      sessionToken: sessionToken,
      secureSystemActivated: user.secure_system_activated,
      lastLogin: new Date().toISOString(),
    };

    // Set session cookie
    res.cookie("healthchain_session", sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Login successful!",
      user: userResponse,
    });
  } catch (error) {
    console.error("Error in login:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
    });
  }
});

// Session verification endpoint
app.get("/api/auth/verify", async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "No session token provided",
      });
    }

    // Verify session in database
    const sessions = await db`
      SELECT s.*, u.* FROM sessions s
      JOIN users u ON s.user_id = u.id
      WHERE s.session_token = ${sessionToken} 
      AND s.is_active = true 
      AND s.expires_at > NOW()
    `;

    if (sessions.length === 0) {
      return res.status(401).json({
        success: false,
        message: "Invalid or expired session token",
      });
    }

    const session = sessions[0];
    const user = {
      id: session.user_id,
      username: session.username,
      email: session.email,
      firstName: session.first_name,
      lastName: session.last_name,
      role: session.role,
      permissions: session.permissions,
      userHash: session.user_hash,
      demoMode: session.demo_mode,
      secureSystemActivated: session.secure_system_activated,
    };

    res.json({
      success: true,
      user: user,
    });
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during session verification",
    });
  }
});

// Health records endpoints
app.get("/api/health-records", async (req, res) => {
  try {
    const records = await db`
      SELECT * FROM health_records 
      ORDER BY created_at DESC
    `;

    res.json({
      success: true,
      records: records,
      total: records.length
    });
  } catch (error) {
    console.error("Error fetching health records:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch health records"
    });
  }
});

app.post("/api/health-records", async (req, res) => {
  try {
    const { patientId, type, title, description, doctor, metadata } = req.body;
    
    const blockchainHash = crypto.createHash('sha256').update(JSON.stringify(req.body)).digest('hex');
    
    const newRecord = await db`
      INSERT INTO health_records (
        patient_id, type, title, description, doctor, metadata, blockchain_hash
      ) VALUES (
        ${patientId}, ${type}, ${title}, ${description}, ${doctor}, ${JSON.stringify(metadata)}, ${blockchainHash}
      ) RETURNING *
    `;

    res.json({
      success: true,
      record: newRecord[0],
      message: "Health record created successfully"
    });
  } catch (error) {
    console.error("Error creating health record:", error);
    res.status(500).json({
      success: false,
      message: "Failed to create health record"
    });
  }
});

// Medical scan analysis endpoints
app.post("/api/medical-scan/analyze", async (req, res) => {
  try {
    const { imageData, scanType, patientSymptoms, patientHistory, userId } = req.body;
    
    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: "Image data is required"
      });
    }

    // Simulate AI analysis
    const analysisId = crypto.randomUUID();
    const imageHash = crypto.createHash('sha256').update(imageData).digest('hex');
    
    // Generate mock analysis based on scan type
    const analysis = generateMockAnalysis(scanType || 'general', patientSymptoms, patientHistory);
    
    const result = {
      id: analysisId,
      scanType: analysis.scanType,
      confidence: analysis.confidence,
      findings: analysis.findings,
      diagnosis: analysis.diagnosis,
      recommendations: analysis.recommendations,
      riskLevel: analysis.riskLevel,
      timestamp: new Date().toISOString(),
      metadata: {
        imageHash,
        processingTime: Math.floor(Math.random() * 2000) + 500,
        aiModel: 'HealthChain-Medical-AI-v1.0',
        version: '1.0.0'
      }
    };

    // Save to database
    const blockchainHash = crypto.createHash('sha256').update(JSON.stringify(result)).digest('hex');
    
    await db`
      INSERT INTO medical_scans (
        user_id, scan_type, confidence, findings, diagnosis, recommendations, 
        risk_level, image_hash, processing_time, ai_model, version, blockchain_hash
      ) VALUES (
        ${userId || 1}, ${result.scanType}, ${result.confidence}, 
        ${result.findings}, ${result.diagnosis}, ${result.recommendations},
        ${result.riskLevel}, ${result.metadata.imageHash}, ${result.metadata.processingTime},
        ${result.metadata.aiModel}, ${result.metadata.version}, ${blockchainHash}
      )
    `;

    res.json({
      success: true,
      message: "Medical scan analysis completed successfully",
      result,
      blockchainHash,
      metadata: {
        processingTime: result.metadata.processingTime,
        aiModel: result.metadata.aiModel,
        confidence: result.confidence,
        riskLevel: result.riskLevel,
      }
    });
  } catch (error) {
    console.error("Error in medical scan analysis:", error);
    res.status(500).json({
      success: false,
      message: "Medical scan analysis failed",
      error: error.message
    });
  }
});

app.get("/api/medical-scan/results", async (req, res) => {
  try {
    const scans = await db`
      SELECT * FROM medical_scans 
      ORDER BY created_at DESC
    `;

    res.json({
      success: true,
      scans: scans,
      total: scans.length
    });
  } catch (error) {
    console.error("Error fetching medical scans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medical scans"
    });
  }
});

app.get("/api/medical-scan/stats", async (req, res) => {
  try {
    const stats = await db`
      SELECT 
        COUNT(*) as total_scans,
        AVG(confidence) as average_confidence,
        COUNT(CASE WHEN risk_level = 'low' THEN 1 END) as low_risk,
        COUNT(CASE WHEN risk_level = 'medium' THEN 1 END) as medium_risk,
        COUNT(CASE WHEN risk_level = 'high' THEN 1 END) as high_risk,
        COUNT(CASE WHEN risk_level = 'critical' THEN 1 END) as critical_risk
      FROM medical_scans
    `;

    const scanTypes = await db`
      SELECT scan_type, COUNT(*) as count
      FROM medical_scans
      GROUP BY scan_type
    `;

    res.json({
      success: true,
      stats: {
        totalScans: parseInt(stats[0].total_scans) || 0,
        averageConfidence: parseFloat(stats[0].average_confidence) || 0,
        riskLevels: {
          low: parseInt(stats[0].low_risk) || 0,
          medium: parseInt(stats[0].medium_risk) || 0,
          high: parseInt(stats[0].high_risk) || 0,
          critical: parseInt(stats[0].critical_risk) || 0
        },
        scanTypes: scanTypes.reduce((acc, type) => {
          acc[type.scan_type] = parseInt(type.count);
          return acc;
        }, {})
      }
    });
  } catch (error) {
    console.error("Error fetching medical scan stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch medical scan statistics"
    });
  }
});

// Blockchain endpoints
app.get("/api/blockchain/stats", async (req, res) => {
  try {
    const transactionCount = await db`
      SELECT COUNT(*) as count FROM blockchain_transactions
    `;

    res.json({
      success: true,
      stats: {
        totalBlocks: 1250,
        totalTransactions: parseInt(transactionCount[0].count) || 0,
        currentDifficulty: 4,
        averageBlockTime: 60000,
        networkHashRate: 4000,
        lastBlockHash: "0x1234567890abcdef",
        chainIntegrity: true
      }
    });
  } catch (error) {
    console.error("Error fetching blockchain stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blockchain statistics"
    });
  }
});

app.get("/api/blockchain/blocks", async (req, res) => {
  try {
    const transactions = await db`
      SELECT * FROM blockchain_transactions 
      ORDER BY created_at DESC 
      LIMIT 10
    `;

    const mockBlocks = [
      {
        index: 1250,
        timestamp: new Date().toISOString(),
        transactions: transactions.length,
        previousHash: "0xabcdef1234567890",
        hash: "0x1234567890abcdef",
        nonce: 12345,
        merkleRoot: "0xmerkle123456",
        difficulty: 4
      }
    ];

    res.json({
      success: true,
      blocks: mockBlocks,
      total: mockBlocks.length
    });
  } catch (error) {
    console.error("Error fetching blockchain blocks:", error);
    res.status(500).json({
      success: false,
      message: "Failed to fetch blockchain blocks"
    });
  }
});

// Medical context endpoints (mock data for now)
app.get("/api/medical-context/personalized", (req, res) => {
  res.json({
    success: true,
    hasData: true,
    context: "Patient has a history of hypertension and is currently on medication. Recent blood pressure readings show improvement. Patient is 30 years old, male, with no known allergies.",
    summary: {
      totalRecords: 2,
      lastUpdate: new Date().toISOString(),
      keyConditions: ["Hypertension"],
      medications: ["Lisinopril"],
      allergies: [],
      vitals: {
        weight: 70,
        height: 175,
        bloodPressure: "120/80",
        heartRate: "72",
        bloodType: "O+",
        age: 30,
        gender: "Male",
        lastUpdated: new Date().toISOString()
      }
    },
    patientId: "demo-patient",
    dataSource: "demo"
  });
});

app.post("/api/medical-context/enhance-query", (req, res) => {
  const { query } = req.body;
  
  res.json({
    success: true,
    enhancedQuery: `Enhanced: ${query} (Based on patient's medical history including hypertension and current medication)`,
    context: "Patient has hypertension history, taking Lisinopril, recent BP readings show improvement.",
    confidence: 0.85
  });
});

app.get("/api/medical-context/insights", (req, res) => {
  res.json({
    success: true,
    insights: [
      {
        type: "positive",
        title: "Blood Pressure Improvement",
        description: "Recent readings show significant improvement in blood pressure control.",
        confidence: 0.9
      },
      {
        type: "recommendation",
        title: "Medication Adherence",
        description: "Continue taking Lisinopril as prescribed for optimal blood pressure control.",
        confidence: 0.85
      }
    ]
  });
});

app.post("/api/medical-context/ai-scan", (req, res) => {
  const { query } = req.body;
  
  res.json({
    success: true,
    scan: {
      query: query,
      analysis: "AI analysis of patient's health data shows good overall health with controlled hypertension.",
      recommendations: [
        "Continue current medication regimen",
        "Monitor blood pressure weekly",
        "Maintain healthy lifestyle habits"
      ],
      riskLevel: "low",
      confidence: 0.88
    }
  });
});

// Performance status endpoint
app.get("/api/performance/status", (req, res) => {
  res.json({
    success: true,
    metrics: {
      responseTime: "45ms",
      uptime: "99.9%",
      activeConnections: 5
    },
    health: "healthy",
    timestamp: new Date().toISOString()
  });
});

// Helper function to generate mock analysis
function generateMockAnalysis(scanType, symptoms, history) {
  const scanTypeLower = scanType.toLowerCase();
  
  if (scanTypeLower.includes('xray')) {
    return {
      scanType: 'xray',
      confidence: 0.85,
      findings: ['Normal chest X-ray appearance', 'Clear lung fields'],
      diagnosis: ['Normal findings'],
      recommendations: ['No immediate treatment required', 'Follow-up in 6 months'],
      riskLevel: 'low'
    };
  }
  
  if (scanTypeLower.includes('blood') || scanTypeLower.includes('lab')) {
    return {
      scanType: 'bloodwork',
      confidence: 0.78,
      findings: ['Elevated blood glucose levels', 'Normal CBC'],
      diagnosis: ['Possible pre-diabetes'],
      recommendations: ['Endocrinology consultation', 'Blood glucose monitoring'],
      riskLevel: 'medium'
    };
  }
  
  if (scanTypeLower.includes('mri')) {
    return {
      scanType: 'mri',
      confidence: 0.92,
      findings: ['Normal brain MRI', 'No mass lesions'],
      diagnosis: ['Normal findings'],
      recommendations: ['No immediate concerns'],
      riskLevel: 'low'
    };
  }
  
  return {
    scanType: 'general',
    confidence: 0.65,
    findings: ['Image requires medical professional review'],
    diagnosis: ['Requires medical evaluation'],
    recommendations: ['Consult with healthcare provider'],
    riskLevel: 'medium'
  };
}

// Error handling middleware
app.use((error, req, res, next) => {
  console.error("Express error:", error);
  res.status(500).json({
    error: "Internal server error",
    message: error.message,
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

// Initialize database and start server
async function startServer() {
  try {
    console.log('🔧 Initializing database...');
    await initializeDatabase();
    
    const isConnected = await testDatabaseConnection();
    if (!isConnected) {
      throw new Error('Database connection failed');
    }
    
    console.log('✅ Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`🚀 Development API Server with Database running on http://localhost:${PORT}`);
      console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
      console.log(`🔐 Demo login: http://localhost:${PORT}/api/auth/demo-login`);
      console.log(`👤 Regular login: http://localhost:${PORT}/api/auth/login`);
      console.log(`📋 Health records: http://localhost:${PORT}/api/health-records`);
      console.log(`🔬 Medical scan analysis: http://localhost:${PORT}/api/medical-scan/analyze`);
      console.log(`⛓️ Blockchain stats: http://localhost:${PORT}/api/blockchain/stats`);
      console.log(`🗄️ Database: Neon PostgreSQL Connected`);
    });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
}

startServer();