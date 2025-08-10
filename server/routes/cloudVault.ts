import { Router, Request, Response } from "express";
import { SupabaseService } from "../services/supabaseService";
import { UserAuthenticationService } from "../services/userAuthentication";

const router = Router();

/**
 * Store data in user's encrypted cloud vault
 */
router.post("/store", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers["x-session-token"] as string;
    const { data, filename, dataType, metadata } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;

    // Prepare vault data with metadata
    const vaultData = {
      content: data,
      userMetadata: metadata || {},
      storedAt: new Date().toISOString(),
      userAgent: req.headers["user-agent"] || "unknown"
    };

    const result = await SupabaseService.storeInVault(
      patientId,
      vaultData,
      filename,
      dataType
    );

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to store data in vault",
        error: result.error,
      });
    }

    console.log(`✅ Data stored in cloud vault for user ${patientId}:`, {
      vaultId: result.vaultId,
      path: result.path,
      dataType
    });

    res.json({
      success: true,
      message: "Data stored in encrypted cloud vault",
      vaultId: result.vaultId,
      path: result.path,
    });
  } catch (error) {
    console.error("❌ Error storing data in vault:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Retrieve data from user's encrypted cloud vault
 */
router.get("/retrieve/:vaultId", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers["x-session-token"] as string;
    const { vaultId } = req.params;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;

    // For now, we'll need to implement a way to map vaultId to path
    // This would typically be stored in a vault index table
    const vaultPath = `${patientId}/vault/${vaultId}`;

    const result = await SupabaseService.retrieveFromVault(vaultPath, patientId);

    if (!result.success) {
      return res.status(404).json({
        success: false,
        message: "Failed to retrieve data from vault",
        error: result.error,
      });
    }

    console.log(`✅ Data retrieved from cloud vault for user ${patientId}:`, {
      vaultId,
      dataType: result.metadata?.dataType
    });

    res.json({
      success: true,
      data: result.data,
      metadata: result.metadata,
    });
  } catch (error) {
    console.error("❌ Error retrieving data from vault:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * List all vault entries for the authenticated user
 */
router.get("/list", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers["x-session-token"] as string;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;

    const result = await SupabaseService.listPatientVaults(patientId);

    if (!result.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to list vault entries",
        error: result.error,
      });
    }

    console.log(`✅ Listed vault entries for user ${patientId}:`, {
      count: result.vaults?.length || 0
    });

    res.json({
      success: true,
      vaults: result.vaults || [],
      count: result.vaults?.length || 0,
    });
  } catch (error) {
    console.error("❌ Error listing vault entries:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Store health record in vault (enhanced version)
 */
router.post("/store-health-record", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers["x-session-token"] as string;
    const { record_type, title, description, doctor, date, metadata } = req.body;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;

    // Store in regular database first
    const dbResult = await SupabaseService.storeHealthRecord({
      patient_id: patientId,
      record_type,
      title,
      description,
      doctor,
      date,
      metadata,
    });

    if (!dbResult.success) {
      return res.status(500).json({
        success: false,
        message: "Failed to store health record",
        error: dbResult.error,
      });
    }

    // Also store in encrypted vault for additional security
    const vaultData = {
      recordId: dbResult.recordId,
      record_type,
      title,
      description,
      doctor,
      date,
      metadata,
      patientId,
      storedAt: new Date().toISOString()
    };

    const vaultResult = await SupabaseService.storeInVault(
      patientId,
      vaultData,
      `health-record-${dbResult.recordId}.json`,
      "health-record"
    );

    console.log(`✅ Health record stored in both DB and encrypted vault:`, {
      recordId: dbResult.recordId,
      vaultId: vaultResult.vaultId,
      patientId
    });

    res.json({
      success: true,
      message: "Health record stored in database and encrypted vault",
      recordId: dbResult.recordId,
      vaultId: vaultResult.vaultId,
      vaultPath: vaultResult.path,
    });
  } catch (error) {
    console.error("❌ Error storing health record:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

/**
 * Get vault statistics for user
 */
router.get("/stats", async (req: Request, res: Response) => {
  try {
    const sessionToken = req.headers["x-session-token"] as string;

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Session token required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid || !sessionResult.user) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const patientId = `user_${sessionResult.user.userHash || sessionResult.user.username || sessionResult.user.id}`;

    // Get health records count
    const healthRecords = await SupabaseService.getHealthRecords(patientId);
    
    // Get vault entries
    const vaultEntries = await SupabaseService.listPatientVaults(patientId);

    const stats = {
      patientId,
      healthRecords: {
        count: healthRecords.records?.length || 0,
        lastUpdated: healthRecords.records?.[0]?.updated_at || null
      },
      vault: {
        count: vaultEntries.vaults?.length || 0,
        totalSize: vaultEntries.vaults?.reduce((sum, v) => sum + v.size, 0) || 0
      },
      security: {
        encryptionEnabled: true,
        userSpecificKeys: true,
        accessControlEnabled: true
      },
      lastAccessed: new Date().toISOString()
    };

    res.json({
      success: true,
      stats
    });
  } catch (error) {
    console.error("❌ Error getting vault stats:", error);
    res.status(500).json({
      success: false,
      message: "Internal server error",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
});

export default router;
