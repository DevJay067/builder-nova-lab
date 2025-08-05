import { RequestHandler } from "express";
import { UserAuthenticationService } from "../services/userAuthentication";

/**
 * Register a new user with production blockchain system
 */
export const registerUser: RequestHandler = async (req, res) => {
  try {
    console.log("🔍 Registration request received", {
      body: req.body ? "present" : "missing",
      contentType: req.headers["content-type"],
      bodyKeys: req.body ? Object.keys(req.body) : [],
    });

    const { username, password, email, firstName, lastName } = req.body;

    // Validate required fields
    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: "Username and password are required",
      });
    }

    // Use the new authentication service
    const result = await UserAuthenticationService.registerUser(
      username,
      password,
      email,
      {
        firstName,
        lastName,
      },
    );

    console.log("🔍 Registration result:", { success: result.success, message: result.message });

    if (result.success) {
      return res.status(201).json(result);
    } else {
      return res.status(400).json(result);
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during registration",
    });
  }
};

/**
 * Login user with secure data access system
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

    const result = await UserAuthenticationService.authenticateUser(
      username,
      password,
    );

    if (result.success) {
      // Set session cookie
      res.cookie("healthchain_session", result.user!.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        message: result.message,
        user: result.user,
        securityFeatures: result.securityFeatures,
      });
    } else {
      res.status(401).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during login",
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

    const result = UserAuthenticationService.verifySession(sessionToken);

    if (result.valid) {
      res.json({
        success: true,
        user: result.user,
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
      UserAuthenticationService.logout(sessionToken);
    }

    // Clear session cookie
    res.clearCookie("healthchain_session");

    res.json({
      success: true,
      message: "Logged out successfully",
    });
  } catch (error) {
    console.error("Error logging out user:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during logout",
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

    const sessionResult = UserAuthenticationService.verifySession(sessionToken);

    if (!sessionResult.valid) {
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
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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

    const result = await UserAuthenticationService.storeHealthRecord(
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
    console.error("Error storing health record:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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
      await UserAuthenticationService.getHealthRecords(sessionToken);

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
    console.error("Error retrieving health records:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
    });
  }
};

/**
 * Get authentication statistics (admin endpoint)
 */
export const getAuthStats: RequestHandler = async (req, res) => {
  try {
    const stats = UserAuthenticationService.getSystemStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error getting auth stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
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

    const result = UserAuthenticationService.verifySession(sessionToken);

    if (result.valid) {
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
    console.error("Error in auth middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error",
    });
  }
};
