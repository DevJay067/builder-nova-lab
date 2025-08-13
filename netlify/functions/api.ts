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

  // Auth endpoints
  if (path === "/api/auth/verify" && httpMethod === "GET") {
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
        authenticated: true,
        user: {
          id: "demo_user",
          username: "demo_user",
          email: "demo@example.com",
          role: "patient"
        },
        timestamp: new Date().toISOString()
      })
    };
  }

  if (path === "/api/auth/login" && httpMethod === "POST") {
    try {
      const { username, password } = JSON.parse(body || "{}");
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
          message: "Login successful",
          user: {
            id: "demo_user",
            username: username || "demo_user",
            email: "demo@example.com",
            role: "patient"
          },
          token: "demo_token_" + Date.now()
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
          error: "Invalid request body"
        })
      };
    }
  }

  if (path === "/api/auth/register" && httpMethod === "POST") {
    try {
      const { username, email, password } = JSON.parse(body || "{}");
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
          message: "Registration successful",
          user: {
            id: "new_user_" + Date.now(),
            username: username || "new_user",
            email: email || "new@example.com",
            role: "patient"
          }
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
          error: "Invalid request body"
        })
      };
    }
  }

  if (path === "/api/auth/data-access" && httpMethod === "POST") {
    try {
      const { recordId, accessType } = JSON.parse(body || "{}");
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
          message: "Data access granted",
          accessId: "access_" + Date.now(),
          recordId: recordId || "demo_record",
          accessType: accessType || "read",
          expiresAt: new Date(Date.now() + 3600000).toISOString()
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
          error: "Invalid request body"
        })
      };
    }
  }

  if (path === "/api/auth/data-access/records" && httpMethod === "GET") {
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

  // Medical context endpoints
  if (path === "/api/medical-context/enhance-query" && httpMethod === "POST") {
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

  if (path === "/api/medical-context/personalized" && httpMethod === "GET") {
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
        hasData: true,
        context: "Patient has cardiovascular history with hypertension and diabetes",
        summary: {
          totalRecords: demoData.healthRecords.length,
          lastUpdate: new Date().toISOString(),
          keyConditions: ["hypertension", "diabetes"],
          medications: ["aspirin", "beta-blocker"],
          allergies: ["penicillin"],
          vitals: {
            weight: 75,
            height: 175,
            bloodPressure: "140/90",
            heartRate: "72",
            bloodType: "O+",
            age: 45,
            gender: "male",
            lastUpdated: new Date().toISOString()
          }
        },
        patientId: "demo_patient",
        dataSource: "health_records"
      })
    };
  }

  if (path === "/api/medical-context/insights" && httpMethod === "GET") {
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
        insights: [
          "Blood pressure trending upward - consider medication adjustment",
          "Weight stable over last 3 months - good progress",
          "Heart rate within normal range",
          "Consider adding exercise routine to improve cardiovascular health"
        ],
        recommendations: [
          "Monitor blood pressure daily",
          "Schedule cardiologist appointment",
          "Increase physical activity",
          "Review medication effectiveness"
        ],
        timestamp: new Date().toISOString()
      })
    };
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

  // Secure data endpoints
  if (path === "/api/secure/system/status" && httpMethod === "GET") {
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
        status: "operational",
        encryption: "active",
        blockchain: "connected",
        cache: "healthy",
        uptime: Date.now() - demoData.systemStatus.uptime,
        timestamp: new Date().toISOString()
      })
    };
  }

  if (path === "/api/secure/keys/generate" && httpMethod === "POST") {
    try {
      const { keyType, keySize } = JSON.parse(body || "{}");
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
          keyId: "key_" + Date.now(),
          keyType: keyType || "AES-256",
          keySize: keySize || 256,
          publicKey: "demo_public_key_" + Date.now(),
          privateKey: "demo_private_key_" + Date.now(),
          createdAt: new Date().toISOString()
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
          error: "Invalid request body"
        })
      };
    }
  }

  if (path === "/api/secure/data/store" && httpMethod === "POST") {
    try {
      const { data, encryptionKey } = JSON.parse(body || "{}");
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
          recordId: "secure_record_" + Date.now(),
          encryptedData: "encrypted_" + btoa(JSON.stringify(data)),
          hash: "hash_" + Date.now(),
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
          error: "Invalid request body"
        })
      };
    }
  }

  // Handle dynamic secure data retrieve endpoint
  if (path.startsWith("/api/secure/data/retrieve/") && httpMethod === "POST") {
    try {
      const recordId = path.split("/").pop();
      const { decryptionKey } = JSON.parse(body || "{}");
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
          recordId: recordId,
          decryptedData: {
            type: "medical_record",
            content: "This is decrypted medical data",
            patientId: "demo_patient",
            timestamp: new Date().toISOString()
          },
          integrity: "verified",
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
          error: "Invalid request body"
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
        "/api/auth/verify",
        "/api/auth/login",
        "/api/auth/register",
        "/api/auth/data-access",
        "/api/auth/data-access/records",
        "/api/health-records",
        "/api/medical-context/enhance-query",
        "/api/medical-context/enhance",
        "/api/medical-context/personalized",
        "/api/medical-context/insights",
        "/api/medical-context/ai-scan",
        "/api/secure/system/status",
        "/api/secure/keys/generate",
        "/api/secure/data/store",
        "/api/secure/data/retrieve/:recordId"
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
