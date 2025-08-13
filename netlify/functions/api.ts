import type { Handler } from "@netlify/functions";

// Simple in-memory storage for demo purposes
const demoData = {
  healthRecords: [],
  users: [],
  systemStatus: {
    uptime: Date.now(),
    version: "1.0.0",
    environment: "netlify"
  }
};

// Basic API endpoints that work without external dependencies
const handleRequest = async (event: any) => {
  const { path, httpMethod, body } = event;
  
  console.log(`Handling request: ${httpMethod} ${path}`);

  // Health check endpoint
  if (path === "/api/health" && httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: "netlify",
        uptime: Date.now() - demoData.systemStatus.uptime
      })
    };
  }

  // Demo endpoint
  if (path === "/api/demo" && httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        message: "Hello from Netlify Functions!",
        timestamp: new Date().toISOString(),
        features: [
          "Health Records Management",
          "Secure Data Access",
          "Blockchain Integration",
          "AI Medical Scanning",
          "Performance Optimization"
        ]
      })
    };
  }

  // Performance status endpoint
  if (path === "/api/performance/status" && httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        success: true,
        metrics: {
          operationCount: demoData.healthRecords.length,
          averageResponseTime: 150,
          cacheHitRate: 0.85,
          uptime: Date.now() - demoData.systemStatus.uptime
        },
        health: {
          status: "healthy",
          database: "connected",
          blockchain: "active",
          cache: "operational"
        },
        timestamp: new Date().toISOString()
      })
    };
  }

  // Health records endpoints
  if (path === "/api/health-records" && httpMethod === "GET") {
    return {
      statusCode: 200,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        success: true,
        records: demoData.healthRecords,
        total: demoData.healthRecords.length
      })
    };
  }

  if (path === "/api/health-records" && httpMethod === "POST") {
    try {
      const record = JSON.parse(body || "{}");
      const newRecord = {
        id: `record_${Date.now()}`,
        patientId: record.patientId || "demo_patient",
        date: new Date().toISOString(),
        type: record.type || "checkup",
        title: record.title || "Demo Health Record",
        description: record.description || "This is a demo health record",
        doctor: record.doctor || "Dr. Demo",
        status: "completed",
        blockchainHash: `hash_${Date.now()}`,
        metadata: record.metadata || {},
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      demoData.healthRecords.push(newRecord);
      
      return {
        statusCode: 201,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: JSON.stringify({
          success: true,
          record: newRecord,
          blockchainHash: newRecord.blockchainHash,
          message: "Health record created successfully"
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid request body",
          message: error.message
        })
      };
    }
  }

  // Medical context enhancement endpoint
  if (path === "/api/medical-context/enhance" && httpMethod === "POST") {
    try {
      const { query, library } = JSON.parse(body || "{}");
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: JSON.stringify({
          success: true,
          enhancedQuery: `Enhanced: ${query} (using ${library || 'default'} library)`,
          context: "Patient has 3 health records with focus on cardiovascular health",
          libraryUsed: library || "default",
          librariesSearched: ["cardiovascular", "general", "emergency"],
          confidence: 0.85
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid request",
          message: error.message
        })
      };
    }
  }

  // AI scan endpoint
  if (path === "/api/medical-context/ai-scan" && httpMethod === "POST") {
    try {
      const { query } = JSON.parse(body || "{}");
      
      return {
        statusCode: 200,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: JSON.stringify({
          success: true,
          scanResults: {
            symptoms: ["fatigue", "shortness of breath"],
            medications: ["aspirin", "beta-blocker"],
            conditions: ["hypertension", "diabetes"],
            allergies: ["penicillin"],
            recommendations: [
              "Monitor blood pressure regularly",
              "Continue current medication regimen",
              "Schedule follow-up in 3 months"
            ]
          },
          query: query,
          timestamp: new Date().toISOString()
        })
      };
    } catch (error) {
      return {
        statusCode: 400,
        headers: {
          "Content-Type": "application/json",
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: JSON.stringify({
          success: false,
          error: "Invalid request",
          message: error.message
        })
      };
    }
  }

  // Default response for unknown endpoints
  return {
    statusCode: 404,
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Access-Control-Allow-Headers": "Content-Type, Authorization",
      "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    },
    body: JSON.stringify({
      error: "Not found",
      message: "The requested endpoint does not exist",
      path: path,
      availableEndpoints: [
        "/api/health",
        "/api/demo",
        "/api/performance/status",
        "/api/health-records",
        "/api/medical-context/enhance",
        "/api/medical-context/ai-scan"
      ],
      timestamp: new Date().toISOString()
    })
  };
};

export const handler: Handler = async (event, context) => {
  try {
    // Set longer timeout for initialization
    context.callbackWaitsForEmptyEventLoop = false;

    console.log("Netlify function called:", {
      path: event.path,
      method: event.httpMethod,
      headers: event.headers
    });

    // Handle CORS preflight requests
    if (event.httpMethod === 'OPTIONS') {
      return {
        statusCode: 200,
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Headers": "Content-Type, Authorization",
          "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
        },
        body: ""
      };
    }

    const result = await handleRequest(event);
    
    console.log("Request handled successfully:", {
      statusCode: result.statusCode,
      path: event.path
    });
    
    return result;
    
  } catch (error) {
    console.error("Netlify function error:", error);
    console.error("Error details:", {
      name: error.name,
      message: error.message,
      stack: error.stack,
      code: error.code
    });

    return {
      statusCode: 500,
      headers: {
        "Content-Type": "application/json",
        "Access-Control-Allow-Origin": "*",
        "Access-Control-Allow-Headers": "Content-Type, Authorization",
        "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
      },
      body: JSON.stringify({
        error: "Internal server error",
        message: "Server error occurred. Please try again later.",
        details: process.env.NODE_ENV === "development" ? error.message : undefined,
        timestamp: new Date().toISOString(),
      }),
    };
  }
};
