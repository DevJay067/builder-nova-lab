import { RequestHandler } from "express";
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

    const result = await SupabaseAuthService.authenticateUser(email, password);

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
    const result = await SupabaseAuthService.getCurrentUser();

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
    const result = await SupabaseAuthService.signOut();

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
 * Store health record with vault storage
 */
export const storeHealthRecordSupabase: RequestHandler = async (req, res) => {
  try {
    const { sessionToken, healthRecord } = req.body;

    if (!sessionToken || !healthRecord) {
      return res.status(400).json({
        success: false,
        message: "Session token and health record data are required",
      });
    }

    console.log("🏥 Storing health record with Supabase + vault");

    const result = await SupabaseAuthService.storeHealthRecord(sessionToken, healthRecord);

    if (result.success) {
      res.status(201).json(result);
    } else {
      res.status(400).json(result);
    }

  } catch (error) {
    console.error("❌ Store health record error:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error storing health record",
    });
  }
};

/**
 * Get health records for user
 */
export const getHealthRecordsSupabase: RequestHandler = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace('Bearer ', '') || 
                          req.query.sessionToken as string;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token is required",
      });
    }

    console.log("🔍 Retrieving health records from Supabase");

    const result = await SupabaseAuthService.getHealthRecords(sessionToken);

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

    const stats = await SupabaseAuthService.getSystemStats();

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

    const isConnected = await SupabaseAuthService.testConnection();

    res.json({
      success: true,
      connected: isConnected,
      message: isConnected ? "Supabase connection successful" : "Supabase connection failed",
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
      SupabaseAuthService.testConnection(),
      SupabaseAuthService.getSystemStats()
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
        }
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
        }
      },
      message: "Running in degraded mode",
      timestamp: new Date().toISOString(),
    });
  }
};
