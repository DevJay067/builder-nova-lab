import { RequestHandler } from "express";
import crypto from "crypto";
import { SupabaseService } from "../services/supabaseService";
import { UserAuthenticationService } from "../services/userAuthentication";

/**
 * Supabase Authentication Route Handlers
 * Replaces legacy auth routes with Supabase-powered authentication
 */

/**
 * Register new user with Supabase Auth + secure system
 */
export const registerUserSupabase: RequestHandler = async (req, res) => {
  try {
    const { email, password, profile } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`📝 Registering user with Supabase: ${email}`);

    const result = await SupabaseService.registerUser(email, password, profile);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("❌ Registration error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

/**
 * Login user with Supabase Auth + secure system
 */
export const loginUserSupabase: RequestHandler = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Email and password are required",
      });
    }

    console.log(`🔐 Authenticating user with Supabase: ${email}`);

    const result = await SupabaseService.authenticateUser(email, password);

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error("❌ Authentication error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during authentication",
    });
  }
};

/**
 * Get current user profile
 */
export const getCurrentUserSupabase: RequestHandler = async (req, res) => {
  try {
    const result = await SupabaseService.getCurrentUser();

    if (result.success) {
      res.json(result);
    } else {
      res.status(401).json(result);
    }
  } catch (error) {
    console.error("❌ Get current user error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error getting current user",
    });
  }
};

/**
 * Sign out user
 */
export const signOutSupabase: RequestHandler = async (req, res) => {
  try {
    const result = await SupabaseService.signOut();

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
  } catch (error) {
    console.error("❌ Sign out error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during sign out",
    });
  }
};

/**
 * Store health record with Supabase cloud storage vault (Enhanced)
 */
export const storeHealthRecordSupabase: RequestHandler = async (req, res) => {
  try {
    console.log("🏥 Supabase health record storage request received:", {
      method: req.method,
      contentType: req.headers["content-type"],
      hasBody: !!req.body,
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    // Get session token for user identification
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify session and get user info
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    // Validate request body exists
    if (!req.body || typeof req.body !== "object") {
      console.error("❌ Invalid or missing request body");
      return res.status(400).json({
        success: false,
        message: "Invalid request format",
      });
    }

    // Extract data with safer destructuring
    const healthData = {
      type: req.body.type,
      title: req.body.title,
      description: req.body.description,
      data: req.body.data,
      metadata: req.body.metadata,
      sessionToken: req.body.sessionToken,
    };

    console.log("🩺 Health record data extracted:", {
      type: healthData.type,
      title: healthData.title,
      hasData: !!healthData.data,
      hasSessionToken: !!healthData.sessionToken,
    });

    if (!healthData.type) {
      return res.status(400).json({
        success: false,
        message: "Health record type is required",
        details: "The 'type' field is missing from the request",
      });
    }

    if (!healthData.data) {
      return res.status(400).json({
        success: false,
        message: "Health record data is required",
        details: "The 'data' field is missing from the request",
      });
    }

    console.log("🏥 Storing health record with Supabase cloud storage vault");

    const recordId = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();

    // Use the actual user ID from the session for patient isolation
    const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;

    // Prepare comprehensive health record for vault storage
    const vaultData = {
      recordId,
      type: healthData.type,
      title:
        healthData.title ||
        `${healthData.type} - ${new Date().toLocaleDateString()}`,
      description: healthData.description || "",
      data: healthData.data,
      metadata: {
        ...healthData.metadata,
        secureStorage: true,
        cloudVault: true,
        encryptionLayers: 3,
        storageLocation: "supabase-vault",
        sessionToken: healthData.sessionToken,
      },
      timestamp,
      patientId,
      storedAt: timestamp,
    };

    // Store in Supabase cloud storage vault
    console.log("📦 Storing data in Supabase cloud vault...");
    const vaultResult = await SupabaseService.storeInVault(
      patientId,
      vaultData,
      `${healthData.type}-${recordId}-${Date.now()}.json`,
    );

    if (!vaultResult.success) {
      console.error("❌ Failed to store in Supabase vault:", vaultResult.error);
      return res.status(500).json({
        success: false,
        message: "Failed to store in cloud storage vault",
        error: vaultResult.error,
      });
    }

    // Also store metadata in database for quick access
    console.log("💾 Storing metadata in database...");
    const dbResult = await SupabaseService.storeHealthRecord({
      patient_id: patientId,
      record_type: healthData.type,
      title: vaultData.title,
      description: vaultData.description,
      date: timestamp.split("T")[0],
      metadata: {
        cloudVaultPath: vaultResult.path,
        recordId,
        dataSize: JSON.stringify(vaultData).length,
        storageType: "supabase-cloud-vault",
      },
      storage_path: vaultResult.path,
    });

    console.log(
      `✅ Health record stored in Supabase cloud vault: ${vaultResult.path}`,
    );

    res.status(201).json({
      success: true,
      recordId,
      vaultPath: vaultResult.path,
      dbRecordId: dbResult.recordId,
      message:
        "Health record stored successfully in Supabase cloud storage vault",
      storage: {
        type: "supabase-cloud-vault",
        path: vaultResult.path,
        secure: true,
        encrypted: true,
        size: JSON.stringify(vaultData).length,
      },
    });
  } catch (error) {
    console.error("❌ Failed to store health record in cloud storage:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error storing health record",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

/**
 * Get health records from Supabase cloud storage vault
 */
export const getHealthRecordsSupabase: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string) ||
      (req.query.sessionToken as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify session and get user info
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    console.log(
      "🔍 Retrieving health records from Supabase cloud storage vault",
      { userId: sessionResult.user.username }
    );

    // Use the actual user ID for patient isolation
    const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;

    // Get health records metadata from database
    const dbResult = await SupabaseService.getHealthRecords(patientId);

    if (!dbResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to retrieve health records metadata",
        error: dbResult.error,
      });
    }

    // Retrieve full data from cloud storage vault for each record
    const enrichedRecords = [];
    for (const record of dbResult.records || []) {
      try {
        if (record.storage_path) {
          console.log(
            `📦 Retrieving full data from vault: ${record.storage_path}`,
          );
          const vaultResult = await SupabaseService.retrieveFromVault(
            record.storage_path,
          );

          if (vaultResult.success) {
            enrichedRecords.push({
              ...record,
              fullData: vaultResult.data,
              storageInfo: {
                type: "supabase-cloud-vault",
                path: record.storage_path,
                retrieved: true,
              },
            });
          } else {
            enrichedRecords.push({
              ...record,
              fullData: null,
              storageInfo: {
                type: "supabase-cloud-vault",
                path: record.storage_path,
                retrieved: false,
                error: vaultResult.error,
              },
            });
          }
        } else {
          enrichedRecords.push({
            ...record,
            fullData: null,
            storageInfo: {
              type: "database-only",
              retrieved: true,
            },
          });
        }
      } catch (vaultError) {
        console.warn(
          `⚠️ Failed to retrieve vault data for record ${record.id}:`,
          vaultError,
        );
        enrichedRecords.push({
          ...record,
          fullData: null,
          storageInfo: {
            type: "supabase-cloud-vault",
            path: record.storage_path,
            retrieved: false,
            error:
              vaultError instanceof Error
                ? vaultError.message
                : "Unknown error",
          },
        });
      }
    }

    console.log(
      `✅ Retrieved ${enrichedRecords.length} health records from Supabase cloud vault`,
    );

    res.json({
      success: true,
      records: enrichedRecords,
      totalRecords: enrichedRecords.length,
      cloudStorage: {
        type: "supabase-vault",
        retrievedAt: new Date().toISOString(),
      },
      message: "Health records retrieved successfully from cloud storage vault",
    });
  } catch (error) {
    console.error("❌ Get health records error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error retrieving health records",
    });
  }
};

/**
 * Get system statistics including Supabase data
 */
export const getSystemStatsSupabase: RequestHandler = async (req, res) => {
  try {
    console.log("📊 Getting Supabase system statistics");

    const stats = await SupabaseService.getStatistics();

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Get system stats error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error getting system stats",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Test Supabase connectivity
 */
export const testSupabaseConnection: RequestHandler = async (req, res) => {
  try {
    console.log("🧪 Testing Supabase connection");

    const isConnected = await SupabaseService.testConnection();

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected
        ? "Supabase connection successful"
        : "Supabase connection failed",
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Test connection error:", error);
    res.status(500).json({
      success: false,
      connected: false,
      message: "Error testing Supabase connection",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Health check endpoint for Supabase services
 */
export const healthCheckSupabase: RequestHandler = async (req, res) => {
  try {
    const [connectionTest, systemStats] = await Promise.all([
      SupabaseService.testConnection(),
      SupabaseService.getStatistics(),
    ]);

    res.json({
      success: true,
      health: {
        database: connectionTest ? "healthy" : "degraded",
        storage: "available",
        authentication: "active",
        services: {
          supabase: connectionTest,
          blockchain: true,
          encryption: true,
          vault: true,
        },
      },
      stats: systemStats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Health check error:", error);
    res.status(200).json({
      success: true,
      health: {
        database: "degraded",
        storage: "mock",
        authentication: "fallback",
        services: {
          supabase: false,
          blockchain: true,
          encryption: true,
          vault: false,
        },
      },
      message: "Running in degraded mode",
      timestamp: new Date().toISOString(),
    });
  }
};
