import { RequestHandler } from "express";
import { EnhancedUserAuthenticationService } from "../services/enhancedUserAuthentication";

/**
 * Enhanced Authentication Routes with SQLite Backend
 */

/**
 * Register a new user
 */
export const registerUser: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Registration request received", {
      body: req.body ? "present" : "missing",
      contentType: req.headers["content-type"],
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    const {
      username,
      password,
      email,
      firstName,
      lastName,
      dateOfBirth,
      phone,
    } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Get IP address for logging
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";

    // Use the enhanced authentication service
    const result = await EnhancedUserAuthenticationService.registerUser(
      username,
      password,
      email,
      {
        firstName,
        lastName,
        dateOfBirth,
        phone,
      },
    );

    console.log("🔍 Registration result:", {
      success: result.success,
      message: result.message,
      hasSessionToken: !!result.user?.sessionToken,
    });

    if (result.success && result.user?.sessionToken) {
      // Set session cookie
      res.cookie("healthchain_session", result.user.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      return res.status(201).json({
        success: true,
        message: result.message,
        user: {
          id: result.user.id,
          username: result.user.username,
          userHash: result.user.userHash,
          sessionToken: result.user.sessionToken,
          secureSystemActivated: result.user.secureSystemActivated,
        },
        securityFeatures: result.securityFeatures,
      });
    } else {
      return res.status(400).json({
        success: false,
        message: result.message || "Registration failed",
      });
    }
  } catch (error) {
    console.error("❌ Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Login user
 */
export const loginUser: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Login request received", {
      body: req.body ? "present" : "missing",
      contentType: req.headers["content-type"],
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    const { username, password } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Get client info for logging
    const ipAddress = req.ip || req.connection.remoteAddress || "unknown";
    const userAgent = req.headers["user-agent"] || "unknown";

    const result = await EnhancedUserAuthenticationService.authenticateUser(
      username,
      password,
      ipAddress,
      userAgent,
    );

    console.log("🔍 Login result:", {
      success: result.success,
      message: result.message,
      hasSessionToken: !!result.user?.sessionToken,
    });

    if (result.success && result.user?.sessionToken) {
      // Set session cookie
      res.cookie("healthchain_session", result.user.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        message: result.message,
        user: {
          id: result.user.id,
          username: result.user.username,
          userHash: result.user.userHash,
          sessionToken: result.user.sessionToken,
          secureSystemActivated: result.user.secureSystemActivated,
        },
        securityFeatures: result.securityFeatures,
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message || "Authentication failed",
      });
    }
  } catch (error) {
    console.error("❌ Error logging in user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Verify session and get user info
 */
export const verifySession: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "No session token provided",
      });
    }

    const result =
      await EnhancedUserAuthenticationService.verifySession(sessionToken);

    if (result.valid && result.user) {
      res.json({
        success: true,
        user: result.user,
        valid: true,
      });
    } else {
      res.status(401).json({
        success: false,
        message: "Invalid session token",
        valid: false,
      });
    }
  } catch (error) {
    console.error("❌ Error verifying session:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during session verification",
      valid: false,
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Logout user
 */
export const logoutUser: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (sessionToken) {
      await EnhancedUserAuthenticationService.logout(sessionToken);
    }

    // Clear session cookie
    res.clearCookie("healthchain_session");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("❌ Error logging out user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Get current user profile
 */
export const getUserProfile: RequestHandler = async (req, res) => {
  try {
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

    const sessionResult =
      await EnhancedUserAuthenticationService.verifySession(sessionToken);

    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    res.json({
      success: true,
      user: sessionResult.user,
    });
  } catch (error) {
    console.error("❌ Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Store health record for authenticated user
 */
export const createDataAccess: RequestHandler = async (req, res) => {
  try {
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

    const { type, data } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: "Health record type and data are required",
      });
    }

    const result = await EnhancedUserAuthenticationService.storeHealthRecord(
      sessionToken,
      { type, data },
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        recordId: result.recordId,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Error storing health record:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Get health records for authenticated user
 */
export const verifyDataAccess: RequestHandler = async (req, res) => {
  try {
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

    const result =
      await EnhancedUserAuthenticationService.getHealthRecords(sessionToken);

    if (result.success) {
      res.json({
        success: true,
        records: result.records,
        message: result.message,
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Error retrieving health records:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Get authentication statistics (admin endpoint)
 */
export const getAuthStats: RequestHandler = async (req, res) => {
  try {
    const stats = EnhancedUserAuthenticationService.getSystemStats();

    res.json({
      success: true,
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Error getting auth stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Middleware to authenticate requests
 */
export const authenticateUser: RequestHandler = async (req, res, next) => {
  try {
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

    const result =
      await EnhancedUserAuthenticationService.verifySession(sessionToken);

    if (result.valid && result.user) {
      // Add user to request object
      (req as any).user = result.user;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }
  } catch (error) {
    console.error("❌ Error in auth middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
      error:
        process.env.NODE_ENV === "development"
          ? error instanceof Error
            ? error.message
            : "Unknown error"
          : undefined,
    });
  }
};

/**
 * Health check endpoint for authentication system
 */
export const healthCheck: RequestHandler = async (req, res) => {
  try {
    const stats = EnhancedUserAuthenticationService.getSystemStats();

    res.json({
      success: true,
      status: "healthy",
      service: "Enhanced Authentication Service",
      database: "SQLite",
      stats,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("❌ Auth health check failed:", error);
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};
