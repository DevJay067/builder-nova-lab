import type { Handler } from "@netlify/functions";

// Enhanced in-memory storage with persistence simulation
const demoData = {
  healthRecords: [], // Start with empty records - let users create their own
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
  },
  iot: {} as Record<string, any>
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
    const user = demoData.users.find(user => user.sessionToken === token);
    if (user) return user;
  }
  
  if (sessionToken) {
    const user = demoData.users.find(user => user.sessionToken === sessionToken);
    if (user) return user;
  }
  
  // For demo purposes, always return a valid user even without token
  // This ensures the app works seamlessly in demo mode
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
        
        // For demo purposes, accept any login
        const user = demoData.users.find(u => u.username === username) || demoData.users[0];
        
        // Create a new session token
        const sessionToken = "demo_session_" + Date.now();
        user.sessionToken = sessionToken;
        
        return createSuccessResponse({
          success: true,
          message: "Login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          },
          token: sessionToken,
          sessionToken: sessionToken,
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
          sessionToken: "new_session_" + Date.now()
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
          token: newUser.sessionToken,
          sessionToken: newUser.sessionToken
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

    // IoT ingest and latest endpoints (phone bridge)
    if (path === "/api/iot/ingest" && httpMethod === "POST") {
      try {
        const user = validateSession(headers);
        const { deviceId, deviceType, timestamp, metrics } = JSON.parse(body || "{}");
        const ts = timestamp || new Date().toISOString();
        const supportedKeys = ["heartRate", "spo2", "steps", "calories", "distance"];
        const filtered = Object.fromEntries(Object.entries(metrics || {}).filter(([k,v]) => supportedKeys.includes(k) && typeof v === "number"));
        const event = { type: "iot_vitals", timestamp: ts, metrics: filtered, device: { id: deviceId || "phone_bridge", type: deviceType || "bridge" } };
        (demoData.iot as any)[user.id] = { last: event };
        // Also append to demo records for visibility
        demoData.healthRecords.push({
          id: `iot_${Date.now()}`,
          patientId: user.id,
          date: ts,
          type: "iot_vitals",
          title: "IoT Vitals Update",
          description: "Vitals ingested via phone bridge",
          doctor: "",
          status: "completed",
          blockchainHash: `hash_${Date.now()}`,
          metadata: event.metrics,
          createdAt: ts,
          updatedAt: ts
        });
        return createSuccessResponse({ success: true });
      } catch (error) {
        return createErrorResponse("Invalid request body", 400);
      }
    }

    if (path === "/api/iot/latest" && httpMethod === "GET") {
      const user = validateSession(headers);
      const last = (demoData.iot as any)[user.id]?.last || null;
      return createSuccessResponse({ success: true, last });
    }

    // Note: SSE endpoints like /api/iot/stream and /api/notifications/stream are not supported in Netlify functions
    // Fall back to polling via /api/iot/latest and acknowledge notification schedules only

    // Notifications schedule endpoints (ack only)
    if (path === "/api/notifications/hydration" && httpMethod === "POST") {
      return createSuccessResponse({ success: true });
    }
    if (path === "/api/notifications/bedtime" && httpMethod === "POST") {
      return createSuccessResponse({ success: true });
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
        
        // Get actual health records for context
        const userRecords = demoData.healthRecords;
        const recordCount = userRecords.length;
        
        // Extract relevant information from actual records
        const conditions = userRecords
          .filter(record => record.metadata && record.metadata.conditions)
          .flatMap(record => record.metadata.conditions || []);
        
        const medications = userRecords
          .filter(record => record.metadata && record.metadata.medications)
          .flatMap(record => record.metadata.medications || []);
        
        const context = recordCount > 0 
          ? `Patient has ${recordCount} health records with focus on ${library || 'general'} health`
          : "Patient has no health records yet";
        
        return createSuccessResponse({
          success: true,
          originalQuery: query,
          enhancedQuery: `Enhanced: ${query} (using ${library || 'default'} library)`,
          context: context,
          libraryUsed: library || "default",
          librariesSearched: ["cardiovascular", "general", "emergency"],
          confidence: 0.85,
          relevantConditions: conditions.length > 0 ? conditions : ["general health"],
          searchContext: `${library || 'General'} health focus`,
          personalizedPrompt: `Consider patient's health records and ${library || 'general'} conditions`,
          hasPersonalization: recordCount > 0,
          recordCount: recordCount
        });
      } catch (error) {
        return createErrorResponse("Invalid request", 400);
      }
    }

    if (path === "/api/medical-context/enhance" && httpMethod === "POST") {
      try {
        const { query, library } = JSON.parse(body || "{}");
        
        // Get actual health records for context
        const userRecords = demoData.healthRecords;
        const recordCount = userRecords.length;
        
        // Extract relevant information from actual records
        const conditions = userRecords
          .filter(record => record.metadata && record.metadata.conditions)
          .flatMap(record => record.metadata.conditions || []);
        
        const medications = userRecords
          .filter(record => record.metadata && record.metadata.medications)
          .flatMap(record => record.metadata.medications || []);
        
        return createSuccessResponse({
          success: true,
          insights: [
            {
              type: "cardiovascular",
              title: "Heart Health Status",
              description: "Your heart rate is within normal range.",
              recommendations: ["Maintain regular exercise", "Monitor heart rate variability"],
              librariesSearched: ["cardiovascular", "general", "emergency"],
              recordCount: recordCount
            },
            {
              type: "general",
              title: "General Health Overview",
              description: "Stay hydrated and maintain balanced nutrition.",
              recommendations: ["Drink more water", "Get 7-8 hours of sleep"],
              librariesSearched: ["cardiovascular", "general", "emergency"],
              recordCount: recordCount
            }
          ]
        });
      } catch (error) {
        return createErrorResponse("Invalid request", 400);
      }
    }

    if (path === "/api/medical-context/personalized" && httpMethod === "GET") {
      // Get actual health records for personalized context
      const userRecords = demoData.healthRecords;
      const recordCount = userRecords.length;
      
      // Extract information from actual records
      const conditions = userRecords
        .filter(record => record.metadata && record.metadata.conditions)
        .flatMap(record => record.metadata.conditions || []);
      
      const medications = userRecords
        .filter(record => record.metadata && record.metadata.medications)
        .flatMap(record => record.metadata.medications || []);
      
      const allergies = userRecords
        .filter(record => record.metadata && record.metadata.allergies)
        .flatMap(record => record.metadata.allergies || []);
      
      // Get latest vitals from records
      const latestRecord = userRecords
        .filter(record => record.metadata && record.metadata.vitals)
        .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())[0];
      
      const vitals = latestRecord?.metadata?.vitals || {
        weight: null,
        height: null,
        bloodPressure: null,
        heartRate: null,
        bloodType: null,
        age: null,
        gender: null,
        lastUpdated: new Date().toISOString()
      };
      
      return createSuccessResponse({
        success: true,
        hasData: recordCount > 0,
        context: recordCount > 0 
          ? `Patient has ${recordCount} health records with ${conditions.length > 0 ? conditions.join(', ') : 'general health'} focus`
          : "Patient has no health records yet",
        summary: {
          totalRecords: recordCount,
          lastUpdate: recordCount > 0 ? userRecords[userRecords.length - 1].updatedAt : new Date().toISOString(),
          keyConditions: conditions.length > 0 ? conditions : ["general health"],
          medications: medications.length > 0 ? medications : [],
          allergies: allergies.length > 0 ? allergies : [],
          vitals: vitals
        },
        patientId: "demo_patient",
        dataSource: recordCount > 0 ? "health_records" : "none"
      });
    }

    if (path === "/api/medical-context/insights" && httpMethod === "GET") {
      // Get actual health records for insights
      const userRecords = demoData.healthRecords;
      const recordCount = userRecords.length;
      
      if (recordCount === 0) {
        return createSuccessResponse({
          success: true,
          insights: [
            "No health records available yet",
            "Create your first health record to get personalized insights",
            "Start by adding basic health information"
          ],
          recommendations: [
            "Add your first health record",
            "Include basic vitals and medical history",
            "Regular updates will improve AI insights"
          ],
          timestamp: new Date().toISOString()
        });
      }
      
      // Generate insights based on actual records
      const insights = [
        `You have ${recordCount} health records in your profile`,
        recordCount > 1 ? "Your health data is being tracked over time" : "Start building your health history",
        "AI can now provide personalized recommendations based on your data"
      ];
      
      const recommendations = [
        "Continue adding health records regularly",
        "Include detailed information for better AI analysis",
        "Review your health trends periodically"
      ];
      
      return createSuccessResponse({
        success: true,
        insights: insights,
        recommendations: recommendations,
        recordCount: recordCount,
        timestamp: new Date().toISOString()
      });
    }

    // AI scan endpoint
    if (path === "/api/medical-context/ai-scan" && httpMethod === "POST") {
      try {
        const { query, scanTypes } = JSON.parse(body || "{}");
        
        // Get actual health records for context
        const userRecords = demoData.healthRecords;
        const recordCount = userRecords.length;
        
        // Extract information from actual records for better AI analysis
        const conditions = userRecords
          .filter(record => record.metadata && record.metadata.conditions)
          .flatMap(record => record.metadata.conditions || []);
        
        const medications = userRecords
          .filter(record => record.metadata && record.metadata.medications)
          .flatMap(record => record.metadata.medications || []);
        
        const allergies = userRecords
          .filter(record => record.metadata && record.metadata.allergies)
          .flatMap(record => record.metadata.allergies || []);
        
        const scanResults = (scanTypes || ["symptoms", "medications", "conditions", "allergies"]).map((type: string, index: number) => {
          let detected = false;
          let details = `AI analyzed your query for ${type}`;
          let recommendations = [`Consider ${type} in your health assessment`];
          let severity = "medium";
          
          // Provide more relevant results based on actual health records
          if (type === "conditions" && conditions.length > 0) {
            detected = true;
            details = `Found ${conditions.length} existing conditions: ${conditions.join(', ')}`;
            recommendations = ["Monitor existing conditions", "Schedule follow-up appointments"];
          } else if (type === "medications" && medications.length > 0) {
            detected = true;
            details = `Found ${medications.length} current medications: ${medications.join(', ')}`;
            recommendations = ["Review medication interactions", "Check for side effects"];
          } else if (type === "allergies" && allergies.length > 0) {
            detected = true;
            details = `Found ${allergies.length} known allergies: ${allergies.join(', ')}`;
            recommendations = ["Avoid known allergens", "Carry emergency medication if needed"];
          } else if (recordCount > 0) {
            detected = Math.random() > 0.3; // Higher chance of detection if records exist
            details = `AI analyzed your query against ${recordCount} health records for ${type}`;
            recommendations = [`Review ${type} in your health records`, "Update your health profile"];
          }
          
          return {
            id: `scan-${Date.now()}-${index}`,
            type,
            confidence: Math.random() * 0.4 + 0.6,
            data: {
              detected: detected,
              details: details,
              recommendations: recommendations,
              severity: severity
            },
            timestamp: new Date().toISOString()
          };
        });
        
        return createSuccessResponse({
          success: true,
          scanResults,
          query: query,
          totalScans: scanResults.length,
          recordCount: recordCount,
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

    // Demo auto-login endpoint for easier testing
    if (path === "/api/auth/demo-login" && httpMethod === "POST") {
      try {
        const user = demoData.users[0];
        const sessionToken = "demo_session_" + Date.now();
        user.sessionToken = sessionToken;
        
        return createSuccessResponse({
          success: true,
          message: "Demo login successful",
          user: {
            id: user.id,
            username: user.username,
            email: user.email,
            role: user.role
          },
          token: sessionToken,
          sessionToken: sessionToken,
          expiresAt: new Date(Date.now() + 3600000).toISOString()
        });
      } catch (error) {
        return createErrorResponse("Demo login failed", 400);
      }
    }

    if (path === "/api/auth/logout" && httpMethod === "POST") {
      try {
        const user = validateSession(headers);
        if (user) {
          user.sessionToken = null;
        }
        
        return createSuccessResponse({
          success: true,
          message: "Logout successful"
        });
      } catch (error) {
        return createErrorResponse("Logout failed", 400);
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
        "/api/iot/ingest",
        "/api/iot/latest",
        "/api/notifications/hydration",
        "/api/notifications/bedtime",
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
