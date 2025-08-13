import type { Handler } from "@netlify/functions";

// Enhanced in-memory storage with persistence simulation
const demoData = {
  healthRecords: [
    {
      id: "record_1",
      patientId: "demo_patient",
      date: "2024-01-15T10:00:00.000Z",
      type: "checkup",
      title: "Annual Physical Examination",
      description: "Routine annual checkup with normal findings",
      doctor: "Dr. Smith",
      status: "completed",
      blockchainHash: "hash_1705312800000",
      metadata: {
        weight: 75,
        height: 175,
        bloodPressure: "120/80",
        heartRate: 72,
        temperature: 36.8
      },
      createdAt: "2024-01-15T10:00:00.000Z",
      updatedAt: "2024-01-15T10:00:00.000Z"
    },
    {
      id: "record_2",
      patientId: "demo_patient",
      date: "2024-01-10T14:30:00.000Z",
      type: "medication",
      title: "Blood Pressure Medication Review",
      description: "Review of current blood pressure medication effectiveness",
      doctor: "Dr. Johnson",
      status: "completed",
      blockchainHash: "hash_1704892200000",
      metadata: {
        systolicBP: 140,
        diastolicBP: 90,
        medications: ["Lisinopril", "Amlodipine"]
      },
      createdAt: "2024-01-10T14:30:00.000Z",
      updatedAt: "2024-01-10T14:30:00.000Z"
    }
  ],
  users: [
    {
      id: "demo_user",
      username: "demo_user",
      email: "demo@example.com",
      role: "patient",
      sessionToken: "demo_token_123"
    }
  ],
  systemStatus: {
    uptime: Date.now(),
    version: "1.0.0",
    environment: "netlify",
    lastHealthCheck: new Date().toISOString()
  }
};

// Helper function to get CORS headers
const getCorsHeaders = () => ({
  "Content-Type": "application/json",
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, x-session-token",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Max-Age": "86400"
});

// Helper function to create success response
const createSuccessResponse = (data: any, statusCode: number = 200) => ({
  statusCode,
  headers: getCorsHeaders(),
  body: JSON.stringify(data)
});

// Helper function to create error response
const createErrorResponse = (message: string, statusCode: number = 400, details?: any) => ({
  statusCode,
  headers: getCorsHeaders(),
  body: JSON.stringify({
    success: false,
    error: message,
    details,
    timestamp: new Date().toISOString()
  })
});

// Helper function to validate session token
const validateSession = (headers: any) => {
  const authHeader = headers.authorization || headers.Authorization;
  const sessionToken = headers["x-session-token"] || headers["X-Session-Token"];
  
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.substring(7);
    return demoData.users.find(user => user.sessionToken === token);
  }
  
  if (sessionToken) {
    return demoData.users.find(user => user.sessionToken === sessionToken);
  }
  
  // For demo purposes, always return a valid user
  return demoData.users[0];
};

// Enhanced request handler with comprehensive error handling
const handleRequest = async (event: any) => {
  const { path, httpMethod, body, headers } = event;
  
  console.log(`Handling request: ${httpMethod} ${path}`);

  try {
    // Health check endpoint
    if (path === "/api/health" && httpMethod === "GET") {
      return createSuccessResponse({
        status: "ok",
        timestamp: new Date().toISOString(),
        environment: "netlify",
        uptime: Date.now() - demoData.systemStatus.uptime,
        version: demoData.systemStatus.version
      });
    }

    // Demo endpoint
    if (path === "/api/demo" && httpMethod === "GET") {
      return createSuccessResponse({
        message: "Hello from Netlify Functions!",
        timestamp: new Date().toISOString(),
        features: [
          "Health Records Management",
          "Secure Data Access", 
          "Blockchain Integration",
          "AI Medical Scanning",
          "Performance Optimization"
        ],
        status: "operational"
      });
    }

    // Performance status endpoint
    if (path === "/api/performance/status" && httpMethod === "GET") {
      return createSuccessResponse({
        success: true,
        metrics: {
          operationCount: demoData.healthRecords.length,
          averageResponseTime: 150,
          cacheHitRate: 0.85,
          uptime: Date.now() - demoData.systemStatus.uptime,
          memoryUsage: "45%",
          cpuUsage: "12%"
        },
        health: {
          status: "healthy",
          database: "connected",
          blockchain: "active",
          cache: "operational",
          ai: "ready"
        },
        timestamp: new Date().toISOString()
      });
    }

    // Auth endpoints
    if (path === "/api/auth/verify" && httpMethod === "GET") {
      const user = validateSession(headers);
      return createSuccessResponse({
        success: true,
        authenticated: true,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        },
        timestamp: new Date().toISOString()
      });
    }

    if (path === "/api/auth/login" && httpMethod === "POST") {
      try {
        const { username, password } = JSON.parse(body || "{}");
        const user = demoData.users.find(u => u.username === username) || demoData.users[0];
        
        return createSuccessResponse({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          },
          token: user.sessionToken,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        });
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    if (path === "/api/auth/register" && httpMethod === "POST") {
      try {
        const { username, email, password } = JSON.parse(body || "{}");
        const newUser = {
          id: "new_user_" + Date.now(),
          username: username || "new_user",
          email: email || "new@example.com",
          role: "patient",
          sessionToken: "new_token_" + Date.now()
        };
        
        demoData.users.push(newUser);
        
        return createSuccessResponse({
          success: true,
          message: "Registration successful",
          user: {
            id: newUser.id,
            username: newUser.username,
            email: newUser.email,
            role: newUser.role
          },
          token: newUser.sessionToken
        }, 201);
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    if (path === "/api/auth/data-access" && httpMethod === "POST") {
      try {
        const { recordId, accessType } = JSON.parse(body || "{}");
        return createSuccessResponse({
          success: true,
          message: "Data access granted",
          accessId: "access_" + Date.now(),
          recordId: recordId || "demo_record",
          accessType: accessType || "read",
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        });
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    if (path === "/api/auth/data-access/records" && httpMethod === "GET") {
      return createSuccessResponse({
        success: true,
        records: demoData.healthRecords,
        total: demoData.healthRecords.length,
        accessLevel: "full"
      });
    }

    // Health records endpoints
    if (path === "/api/health-records" && httpMethod === "GET") {
      return createSuccessResponse({
        success: true,
        records: demoData.healthRecords,
        total: demoData.healthRecords.length,
        patientId: "demo_patient"
      });
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
        
        return createSuccessResponse({
          success: true,
          record: newRecord,
          blockchainHash: newRecord.blockchainHash,
          message: "Health record created successfully"
        }, 201);
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    // Medical context endpoints
    if (path === "/api/medical-context/enhance-query" && httpMethod === "POST") {
      try {
        const { query, library } = JSON.parse(body || "{}");
        
        return createSuccessResponse({
          success: true,
          originalQuery: query,
          enhancedQuery: `Enhanced: ${query} (using ${library || 'default'} library)`,
          context: "Patient has 3 health records with focus on cardiovascular health",
          libraryUsed: library || "default",
          librariesSearched: ["cardiovascular", "general", "emergency"],
          confidence: 0.85,
          relevantConditions: ["hypertension", "diabetes"],
          searchContext: "Cardiovascular health focus",
          personalizedPrompt: `Consider patient's history of ${library || 'cardiovascular'} conditions`,
          hasPersonalization: true
        });
      } catch (error) {
        return createErrorResponse("Invalid request", 400);
      }
    }

    if (path === "/api/medical-context/enhance" && httpMethod === "POST") {
      try {
        const { query, library } = JSON.parse(body || "{}");
        
        return createSuccessResponse({
          success: true,
          originalQuery: query,
          enhancedQuery: `Enhanced: ${query} (using ${library || 'default'} library)`,
          context: "Patient has 3 health records with focus on cardiovascular health",
          libraryUsed: library || "default",
          librariesSearched: ["cardiovascular", "general", "emergency"],
          confidence: 0.85,
          relevantConditions: ["hypertension", "diabetes"],
          searchContext: "Cardiovascular health focus",
          personalizedPrompt: `Consider patient's history of ${library || 'cardiovascular'} conditions`,
          hasPersonalization: true
        });
      } catch (error) {
        return createErrorResponse("Invalid request", 400);
      }
    }

    if (path === "/api/medical-context/personalized" && httpMethod === "GET") {
      return createSuccessResponse({
        success: true,
        hasData: true,
        context: "Patient has cardiovascular history with hypertension and diabetes",
        summary: {
          totalRecords: demoData.healthRecords.length,
          lastUpdate: new Date().toISOString(),
          keyConditions: ["hypertension", "diabetes"],
          medications: ["Lisinopril", "Amlodipine"],
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
      });
    }

    if (path === "/api/medical-context/insights" && httpMethod === "GET") {
      return createSuccessResponse({
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
      });
    }

    // AI scan endpoint
    if (path === "/api/medical-context/ai-scan" && httpMethod === "POST") {
      try {
        const { query, scanTypes } = JSON.parse(body || "{}");
        
        const scanResults = (scanTypes || ["symptoms", "medications", "conditions", "allergies"]).map((type: string, index: number) => ({
          id: `scan-${Date.now()}-${index}`,
          type,
          confidence: Math.random() * 0.4 + 0.6,
          data: {
            detected: Math.random() > 0.5,
            details: `AI detected ${type} patterns in your query: "${query}"`,
            recommendations: [`Consider ${type} in your health assessment`],
            severity: Math.random() > 0.7 ? "high" : "medium"
          },
          timestamp: new Date().toISOString()
        }));
        
        return createSuccessResponse({
          success: true,
          scanResults,
          query: query,
          totalScans: scanResults.length,
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return createErrorResponse("Invalid request", 400);
      }
    }

    // Secure data endpoints
    if (path === "/api/secure/system/status" && httpMethod === "GET") {
      return createSuccessResponse({
        success: true,
        status: "operational",
        encryption: "active",
        blockchain: "connected",
        cache: "healthy",
        uptime: Date.now() - demoData.systemStatus.uptime,
        timestamp: new Date().toISOString()
      });
    }

    if (path === "/api/secure/keys/generate" && httpMethod === "POST") {
      try {
        const { keyType, keySize } = JSON.parse(body || "{}");
        return createSuccessResponse({
          success: true,
          keyId: "key_" + Date.now(),
          keyType: keyType || "AES-256",
          keySize: keySize || 256,
          publicKey: "demo_public_key_" + Date.now(),
          privateKey: "demo_private_key_" + Date.now(),
          createdAt: new Date().toISOString()
        });
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    if (path === "/api/secure/data/store" && httpMethod === "POST") {
      try {
        const { data, encryptionKey } = JSON.parse(body || "{}");
        return createSuccessResponse({
          success: true,
          recordId: "secure_record_" + Date.now(),
          encryptedData: "encrypted_" + btoa(JSON.stringify(data)),
          hash: "hash_" + Date.now(),
          timestamp: new Date().toISOString()
        });
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    // Handle dynamic secure data retrieve endpoint
    if (path.startsWith("/api/secure/data/retrieve/") && httpMethod === "POST") {
      try {
        const recordId = path.split("/").pop();
        const { decryptionKey } = JSON.parse(body || "{}");
        return createSuccessResponse({
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
        });
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    // Default response for unknown endpoints
    return createErrorResponse("The requested endpoint does not exist", 404, {
      path: path,
      method: httpMethod,
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
      ]
    });

  } catch (error) {
    console.error("Request handling error:", error);
    return createErrorResponse("Internal server error", 500, {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
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
        headers: getCorsHeaders(),
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

    return createErrorResponse("Server error occurred. Please try again later.", 500, {
      message: error.message,
      stack: process.env.NODE_ENV === "development" ? error.stack : undefined
    });
  }
};
