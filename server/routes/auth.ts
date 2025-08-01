import { RequestHandler } from "express";
import {
  UserAuthenticationService,
  UserRegistration,
  UserLogin,
} from "../services/userAuthentication";

/**
 * Register a new user
 */
export const registerUser: RequestHandler = async (req, res) => {
  try {
    const userData: UserRegistration = req.body;

    // Validate required fields
    if (
      !userData.username ||
      !userData.email ||
      !userData.password ||
      !userData.firstName ||
      !userData.lastName
    ) {
      return res.status(400).json({
        success: false,
        error:
          "Username, email, password, first name, and last name are required",
      });
    }

    // Validate password strength
    if (userData.password.length < 8) {
      return res.status(400).json({
        success: false,
        error: "Password must be at least 8 characters long",
      });
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(userData.email)) {
      return res.status(400).json({
        success: false,
        error: "Invalid email format",
      });
    }

    // Validate username (no special characters, 3-30 chars)
    const usernameRegex = /^[a-zA-Z0-9_]{3,30}$/;
    if (!usernameRegex.test(userData.username)) {
      return res.status(400).json({
        success: false,
        error:
          "Username must be 3-30 characters and contain only letters, numbers, and underscores",
      });
    }

    const result = await UserAuthenticationService.registerUser(userData);

    if (result.success) {
      res.status(201).json({
        success: true,
        message: "User registered successfully",
        user: result.user,
      });
    } else {
      res.status(400).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error registering user:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during registration",
    });
  }
};

/**
 * Login user
 */
export const loginUser: RequestHandler = async (req, res) => {
  try {
    const loginData: UserLogin = req.body;

    // Validate required fields
    if (!loginData.username || !loginData.password) {
      return res.status(400).json({
        success: false,
        error: "Username and password are required",
      });
    }

    const result = await UserAuthenticationService.authenticateUser(loginData);

    if (result.success) {
      // Set session cookie
      res.cookie("healthchain_session", result.session!.sessionToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "strict",
        maxAge: 24 * 60 * 60 * 1000, // 24 hours
      });

      res.json({
        success: true,
        message: "Login successful",
        user: result.user,
        sessionToken: result.session!.sessionToken,
        dataAccessHash: result.session!.dataAccessHash,
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error logging in user:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during login",
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
        error: "No session token provided",
      });
    }

    const result =
      await UserAuthenticationService.validateSession(sessionToken);

    if (result.valid) {
      res.json({
        success: true,
        user: result.user,
        session: result.session,
      });
    } else {
      res.status(401).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error verifying session:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error during session verification",
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
      await UserAuthenticationService.logoutUser(sessionToken);
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
      error: "Internal server error during logout",
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
        error: "Authentication required",
      });
    }

    const sessionResult =
      await UserAuthenticationService.validateSession(sessionToken);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: sessionResult.error,
      });
    }

    // Get user data access records
    const dataAccess = await UserAuthenticationService.getUserDataAccess(
      sessionResult.user!.id,
    );

    res.json({
      success: true,
      user: sessionResult.user,
      dataAccess,
      sessionInfo: {
        sessionId: sessionResult.session!.id,
        createdAt: sessionResult.session!.createdAt,
        expiresAt: sessionResult.session!.expiresAt,
        lastActivity: sessionResult.session!.lastActivity,
      },
    });
  } catch (error) {
    console.error("Error getting user profile:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Create data access record for user
 */
export const createDataAccess: RequestHandler = async (req, res) => {
  try {
    const { dataRecordId } = req.body;
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    if (!dataRecordId) {
      return res.status(400).json({
        success: false,
        error: "Data record ID is required",
      });
    }

    const sessionResult =
      await UserAuthenticationService.validateSession(sessionToken);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: sessionResult.error,
      });
    }

    const result = await UserAuthenticationService.createDataAccessRecord(
      sessionResult.user!.id,
      dataRecordId,
      sessionResult.user!.userHash,
    );

    if (result.success) {
      res.json({
        success: true,
        message: "Data access record created",
        accessId: result.accessId,
      });
    } else {
      res.status(500).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error creating data access record:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Verify user data access
 */
export const verifyDataAccess: RequestHandler = async (req, res) => {
  try {
    const { dataRecordId } = req.params;
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication required",
      });
    }

    const sessionResult =
      await UserAuthenticationService.validateSession(sessionToken);

    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: sessionResult.error,
      });
    }

    const accessResult = await UserAuthenticationService.verifyDataAccess(
      sessionResult.user!.id,
      dataRecordId,
    );

    res.json({
      success: true,
      hasAccess: accessResult.hasAccess,
      combinedHash: accessResult.combinedHash,
      error: accessResult.error,
    });
  } catch (error) {
    console.error("Error verifying data access:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
    });
  }
};

/**
 * Get authentication statistics (admin endpoint)
 */
export const getAuthStats: RequestHandler = async (req, res) => {
  try {
    const stats = await UserAuthenticationService.getUserStats();

    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error getting auth stats:", error);
    res.status(500).json({
      success: false,
      error: "Internal server error",
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
        error: "Authentication required",
      });
    }

    const result =
      await UserAuthenticationService.validateSession(sessionToken);

    if (result.valid) {
      // Add user and session to request object
      (req as any).user = result.user;
      (req as any).session = result.session;
      next();
    } else {
      return res.status(401).json({
        success: false,
        error: result.error,
      });
    }
  } catch (error) {
    console.error("Error in auth middleware:", error);
    return res.status(500).json({
      success: false,
      error: "Authentication error",
    });
  }
};
