import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import crypto from 'crypto';

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
    environment: "development"
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
app.post("/api/auth/demo-login", (req, res) => {
  try {
    console.log("🔍 Demo login request received for judges");

    // Create a demo user with judge permissions
    const demoUser = {
      id: "demo-judge-001",
      username: "demo_judge",
      email: "judge@healthchain.demo",
      firstName: "Demo",
      lastName: "Judge",
      role: "judge",
      permissions: ["view_all_records", "access_analytics", "demo_mode"],
      userHash: "demo-judge-hash-" + Date.now(),
      sessionToken: "demo-session-" + Math.random().toString(36).substring(2, 15),
      secureSystemActivated: true,
      lastLogin: new Date().toISOString(),
      demoMode: true,
      demoFeatures: {
        canViewAllRecords: true,
        canAccessAnalytics: true,
        canPerformDemoActions: true,
        hasElevatedPermissions: true
      }
    };

    // Set session cookie
    res.cookie("healthchain_session", demoUser.sessionToken, {
      httpOnly: true,
      secure: false, // false for development
      sameSite: "lax",
      maxAge: 60 * 60 * 1000, // 1 hour for demo sessions
    });

    console.log("✅ Demo login successful for judge");

    res.json({
      success: true,
      message: "Demo login successful! Welcome to the judge demo environment.",
      user: demoUser,
      securityFeatures: {
        demoMode: true,
        elevatedPermissions: true,
        sessionDuration: "1 hour",
        features: demoUser.demoFeatures
      },
      demoInfo: {
        role: "Judge",
        permissions: demoUser.permissions,
        features: demoUser.demoFeatures,
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
app.post("/api/auth/login", (req, res) => {
  try {
    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Simple demo login for any credentials
    const demoUser = {
      id: "demo-user-001",
      username: username,
      email: `${username}@demo.com`,
      firstName: "Demo",
      lastName: "User",
      role: "user",
      userHash: "demo-user-hash-" + Date.now(),
      sessionToken: "demo-session-" + Math.random().toString(36).substring(2, 15),
      secureSystemActivated: true,
      lastLogin: new Date().toISOString(),
    };

    // Set session cookie
    res.cookie("healthchain_session", demoUser.sessionToken, {
      httpOnly: true,
      secure: false,
      sameSite: "lax",
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    });

    res.json({
      success: true,
      message: "Login successful!",
      user: demoUser,
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
app.get("/api/auth/verify", (req, res) => {
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

    // Simple session validation for demo
    if (sessionToken.startsWith("demo-session-")) {
      res.json({
        success: true,
        user: {
          id: "demo-user-001",
          username: "demo_user",
          role: sessionToken.includes("judge") ? "judge" : "user",
          demoMode: true
        },
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid session token",
      });
    }
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during session verification",
    });
  }
});

// Health records endpoints
app.get("/api/health-records", (req, res) => {
  // Demo health records
  const demoRecords = [
    {
      id: "record-001",
      patientId: "demo-patient",
      date: new Date().toISOString(),
      type: "checkup",
      title: "Annual Physical",
      description: "Routine annual physical examination",
      doctor: "Dr. Smith",
      status: "completed",
      blockchainHash: "demo-hash-001",
      metadata: {
        age: 30,
        gender: "Male",
        bloodType: "O+",
        weight: 70,
        height: 175,
        systolicBP: 120,
        diastolicBP: 80,
        heartRate: 72,
        temperature: 36.8
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    },
    {
      id: "record-002",
      patientId: "demo-patient",
      date: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      type: "vitals",
      title: "Blood Pressure Check",
      description: "Regular blood pressure monitoring",
      doctor: "Dr. Johnson",
      status: "completed",
      blockchainHash: "demo-hash-002",
      metadata: {
        systolicBP: 118,
        diastolicBP: 78,
        heartRate: 68
      },
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
  ];

  res.json({
    success: true,
    records: demoRecords,
    total: demoRecords.length
  });
});

// Medical context endpoints
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

app.listen(PORT, () => {
  console.log(`🚀 Development API Server running on http://localhost:${PORT}`);
  console.log(`📊 Health check: http://localhost:${PORT}/api/health`);
  console.log(`🔐 Demo login: http://localhost:${PORT}/api/auth/demo-login`);
  console.log(`👤 Regular login: http://localhost:${PORT}/api/auth/login`);
  console.log(`📋 Health records: http://localhost:${PORT}/api/health-records`);
});