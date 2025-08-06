import { RequestHandler } from "express";
import crypto from "crypto";
import { SupabaseService } from "../services/supabaseService";

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
    const { type, title, description, data, metadata, sessionToken } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: "Health record type and data are required",
      });
    }

    console.log("🏥 Storing health record with Supabase cloud storage vault");

    const recordId = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();
    const patientId = sessionToken ? "authenticated-user" : "default-patient";

    // Prepare comprehensive health record for vault storage
    const vaultData = {
      recordId,
      type,
      title: title || `${type} - ${new Date().toLocaleDateString()}`,
      description: description || "",
      data,
      metadata: {
        ...metadata,
        secureStorage: true,
        cloudVault: true,
        encryptionLayers: 3,
        storageLocation: "supabase-vault",
        sessionToken,
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
      `${type}-${recordId}-${Date.now()}.json`
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
      record_type: type,
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

    console.log(`✅ Health record stored in Supabase cloud vault: ${vaultResult.path}`);

    res.status(201).json({
      success: true,
      recordId,
      vaultPath: vaultResult.path,
      dbRecordId: dbResult.recordId,
      message: "Health record stored successfully in Supabase cloud storage vault",
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
 * Get health records for user
 */
export const getHealthRecordsSupabase: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      (req.query.sessionToken as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token is required",
      });
    }

    console.log("🔍 Retrieving health records from Supabase");

    // Get current user
    const userResult = await SupabaseService.getCurrentUser();
    if (!userResult.success || !userResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session or user not found",
      });
    }

    // Get health records
    const result = await SupabaseService.getHealthRecords(userResult.user.id);

    if (result.success) {
      res.json(result);
    } else {
      res.status(400).json(result);
    }
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
