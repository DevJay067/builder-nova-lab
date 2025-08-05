import { RequestHandler } from "express";
import { CloudAuthenticationService } from "../services/cloudAuthenticationService";
import { SecureCloudStorageService } from "../services/secureCloudStorage";

/**
 * Cloud Storage API Routes
 * Provides secure cloud storage endpoints with user data isolation
 */

/**
 * Store health record in encrypted cloud storage
 */
export const storeCloudHealthRecord: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for cloud storage access",
      });
    }

    const { type, data, metadata } = req.body;

    if (!type || !data) {
      return res.status(400).json({
        success: false,
        message: "Health record type and data are required",
      });
    }

    const result = await CloudAuthenticationService.storeHealthRecord(
      sessionToken,
      { 
        type, 
        data: {
          ...data,
          metadata: {
            ...metadata,
            apiVersion: "1.0",
            clientTimestamp: new Date().toISOString()
          }
        }
      }
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        recordId: result.recordId,
        cloudInfo: result.cloudInfo,
        security: {
          encrypted: true,
          userIsolated: true,
          cloudStored: result.cloudInfo?.cloudStored || false
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Error storing cloud health record:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during cloud storage",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};

/**
 * Get health records from encrypted cloud storage
 */
export const getCloudHealthRecords: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for cloud storage access",
      });
    }

    const result = await CloudAuthenticationService.getHealthRecords(sessionToken);

    if (result.success) {
      res.json({
        success: true,
        records: result.records,
        message: result.message,
        cloudInfo: result.cloudInfo,
        security: {
          encrypted: true,
          userIsolated: true,
          dataSource: result.cloudInfo?.syncStatus || 'unknown'
        }
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Error retrieving cloud health records:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during cloud retrieval",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};

/**
 * Sync local data to cloud storage
 */
export const syncToCloud: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for cloud sync",
      });
    }

    const result = await CloudAuthenticationService.syncUserDataToCloud(sessionToken);

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        syncInfo: result.syncInfo,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Error syncing to cloud:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during cloud sync",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};

/**
 * Get user's cloud storage statistics
 */
export const getCloudStorageStats: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for storage stats",
      });
    }

    const result = await CloudAuthenticationService.getUserCloudStats(sessionToken);

    if (result.success) {
      res.json({
        success: true,
        stats: result.stats,
        message: result.message,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Error getting cloud storage stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during stats retrieval",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};

/**
 * Delete health record from cloud storage
 */
export const deleteCloudHealthRecord: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for cloud deletion",
      });
    }

    const { recordId } = req.params;

    if (!recordId) {
      return res.status(400).json({
        success: false,
        message: "Record ID is required for deletion",
      });
    }

    // Verify session and get user info
    const session = await CloudAuthenticationService.verifySession(sessionToken);
    if (!session.valid || !session.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session for cloud deletion",
      });
    }

    const result = await SecureCloudStorageService.deleteHealthRecord(
      session.user.id,
      recordId
    );

    if (result.success) {
      res.json({
        success: true,
        message: result.message,
        recordId: recordId,
        timestamp: new Date().toISOString()
      });
    } else {
      res.status(500).json({
        success: false,
        message: result.message,
      });
    }
  } catch (error) {
    console.error("❌ Error deleting cloud health record:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during cloud deletion",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};

/**
 * Get cloud storage service status
 */
export const getCloudServiceStatus: RequestHandler = async (req, res) => {
  try {
    const serviceStatus = SecureCloudStorageService.getServiceStatus();
    const systemStats = CloudAuthenticationService.getSystemStats();

    res.json({
      success: true,
      status: "operational",
      cloudStorage: serviceStatus,
      systemStats: {
        ...systemStats,
        security: {
          encryptionAtRest: true,
          encryptionInTransit: true,
          userDataIsolation: true,
          auditLogging: true
        }
      },
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("❌ Error getting cloud service status:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during status check",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};

/**
 * Health check for cloud storage service
 */
export const cloudHealthCheck: RequestHandler = async (req, res) => {
  try {
    const serviceStatus = SecureCloudStorageService.getServiceStatus();
    
    const healthStatus = {
      service: "Cloud Storage Service",
      status: serviceStatus.isCloudAvailable ? "healthy" : "degraded",
      features: {
        encryption: serviceStatus.encryptionEnabled,
        cloudStorage: serviceStatus.isCloudAvailable,
        userIsolation: true,
        localBackup: true
      },
      provider: serviceStatus.cloudProvider,
      region: serviceStatus.config.region,
      timestamp: new Date().toISOString()
    };

    const httpStatus = serviceStatus.isCloudAvailable ? 200 : 206; // 206 = Partial Content
    res.status(httpStatus).json({
      success: true,
      health: healthStatus
    });
  } catch (error) {
    console.error("❌ Cloud health check failed:", error);
    res.status(500).json({
      success: false,
      status: "unhealthy",
      error: error instanceof Error ? error.message : "Unknown error",
      timestamp: new Date().toISOString(),
    });
  }
};

/**
 * Setup cloud storage for user (manual trigger)
 */
export const setupUserCloudStorage: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for cloud setup",
      });
    }

    // Verify session
    const session = await CloudAuthenticationService.verifySession(sessionToken);
    if (!session.valid || !session.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session for cloud setup",
      });
    }

    // Get current cloud stats to check if already set up
    const statsResult = await CloudAuthenticationService.getUserCloudStats(sessionToken);
    
    if (statsResult.success && statsResult.stats?.isCloudAvailable) {
      res.json({
        success: true,
        message: "Cloud storage already configured for this user",
        stats: statsResult.stats,
        alreadySetup: true
      });
    } else {
      res.json({
        success: false,
        message: "Cloud storage not available. Please check configuration.",
        cloudAvailable: false
      });
    }
  } catch (error) {
    console.error("❌ Error setting up cloud storage:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error during cloud setup",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};

/**
 * Middleware to ensure cloud authentication
 */
export const requireCloudAuth: RequestHandler = async (req, res, next) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Cloud storage requires authentication",
      });
    }

    const result = await CloudAuthenticationService.verifySession(sessionToken);

    if (result.valid && result.user) {
      // Add user to request object
      (req as any).user = result.user;
      (req as any).sessionToken = sessionToken;
      next();
    } else {
      return res.status(401).json({
        success: false,
        message: "Invalid session for cloud access",
      });
    }
  } catch (error) {
    console.error("❌ Error in cloud auth middleware:", error);
    return res.status(500).json({
      success: false,
      message: "Authentication error for cloud access",
      error: process.env.NODE_ENV === 'development' ? error instanceof Error ? error.message : 'Unknown error' : undefined
    });
  }
};
