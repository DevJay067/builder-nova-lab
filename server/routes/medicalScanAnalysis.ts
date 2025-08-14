import { RequestHandler } from "express";
import { MedicalScanAIService, ScanAnalysisRequest, MedicalScanResult } from "../services/medicalScanAI";
import { ProductionBlockchainService } from "../services/productionBlockchain";
import { UserAuthenticationService } from "../services/userAuthentication";
import crypto from "crypto";

// In-memory storage for scan results (in production, use database)
const scanResults: Map<string, MedicalScanResult> = new Map();

/**
 * Analyze medical scan with AI
 */
export const analyzeMedicalScan: RequestHandler = async (req, res) => {
  try {
    console.log("🔬 Medical scan analysis request received");

    const sessionToken = req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required for medical scan analysis",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const { imageData, scanType, patientSymptoms, patientHistory } = req.body;

    if (!imageData) {
      return res.status(400).json({
        success: false,
        message: "Image data is required",
      });
    }

    // Initialize AI service
    const aiService = MedicalScanAIService.getInstance();
    await aiService.initialize();

    // Create analysis request
    const analysisRequest: ScanAnalysisRequest = {
      imageData,
      scanType,
      patientSymptoms,
      patientHistory,
    };

    // Perform AI analysis
    const analysisResult = await aiService.analyzeMedicalScan(analysisRequest);

    // Store result in blockchain if user has permission
    let blockchainHash = null;
    if (sessionResult.user?.role === "judge" || sessionResult.user?.demoMode) {
      try {
        const blockchainService = ProductionBlockchainService.getInstance();
        
        // Create blockchain transaction for the scan result
        const transaction = blockchainService.createTransaction(
          sessionResult.user.id,
          "healthchain-system",
          {
            type: "medical_scan_analysis",
            scanResult: analysisResult,
            timestamp: new Date().toISOString(),
          }
        );

        // Store in local cache
        scanResults.set(analysisResult.id, analysisResult);
        
        blockchainHash = crypto.createHash('sha256')
          .update(JSON.stringify(analysisResult))
          .digest('hex');

        console.log("✅ Medical scan analysis stored in blockchain");
      } catch (error) {
        console.error("⚠️ Failed to store in blockchain:", error);
      }
    }

    // Store result locally
    scanResults.set(analysisResult.id, analysisResult);

    res.json({
      success: true,
      message: "Medical scan analysis completed successfully",
      result: analysisResult,
      blockchainHash,
      metadata: {
        processingTime: analysisResult.metadata.processingTime,
        aiModel: analysisResult.metadata.aiModel,
        confidence: analysisResult.confidence,
        riskLevel: analysisResult.riskLevel,
      },
    });

  } catch (error) {
    console.error("❌ Medical scan analysis failed:", error);
    res.status(500).json({
      success: false,
      message: "Medical scan analysis failed",
      error: error.message,
    });
  }
};

/**
 * Get medical scan analysis result
 */
export const getMedicalScanResult: RequestHandler = async (req, res) => {
  try {
    const { analysisId } = req.params;

    const sessionToken = req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const result = scanResults.get(analysisId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Medical scan analysis result not found",
      });
    }

    res.json({
      success: true,
      result,
    });

  } catch (error) {
    console.error("❌ Failed to get medical scan result:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve medical scan result",
      error: error.message,
    });
  }
};

/**
 * Get all medical scan analyses for user
 */
export const getUserMedicalScans: RequestHandler = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    // Get all scan results (in production, filter by user)
    const userScans = Array.from(scanResults.values()).map(result => ({
      id: result.id,
      scanType: result.scanType,
      confidence: result.confidence,
      riskLevel: result.riskLevel,
      timestamp: result.timestamp,
      findings: result.findings,
      diagnosis: result.diagnosis,
    }));

    res.json({
      success: true,
      scans: userScans,
      total: userScans.length,
    });

  } catch (error) {
    console.error("❌ Failed to get user medical scans:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve medical scans",
      error: error.message,
    });
  }
};

/**
 * Get medical scan analysis statistics
 */
export const getMedicalScanStats: RequestHandler = async (req, res) => {
  try {
    const sessionToken = req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const allScans = Array.from(scanResults.values());

    // Calculate statistics
    const stats = {
      totalScans: allScans.length,
      scanTypes: {
        xray: allScans.filter(s => s.scanType === 'xray').length,
        mri: allScans.filter(s => s.scanType === 'mri').length,
        ct: allScans.filter(s => s.scanType === 'ct').length,
        ultrasound: allScans.filter(s => s.scanType === 'ultrasound').length,
        bloodwork: allScans.filter(s => s.scanType === 'bloodwork').length,
        ecg: allScans.filter(s => s.scanType === 'ecg').length,
        general: allScans.filter(s => s.scanType === 'general').length,
      },
      riskLevels: {
        low: allScans.filter(s => s.riskLevel === 'low').length,
        medium: allScans.filter(s => s.riskLevel === 'medium').length,
        high: allScans.filter(s => s.riskLevel === 'high').length,
        critical: allScans.filter(s => s.riskLevel === 'critical').length,
      },
      averageConfidence: allScans.length > 0 
        ? allScans.reduce((sum, scan) => sum + scan.confidence, 0) / allScans.length 
        : 0,
      recentScans: allScans
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, 5)
        .map(scan => ({
          id: scan.id,
          scanType: scan.scanType,
          confidence: scan.confidence,
          riskLevel: scan.riskLevel,
          timestamp: scan.timestamp,
        })),
    };

    res.json({
      success: true,
      stats,
    });

  } catch (error) {
    console.error("❌ Failed to get medical scan stats:", error);
    res.status(500).json({
      success: false,
      message: "Failed to retrieve medical scan statistics",
      error: error.message,
    });
  }
};

/**
 * Delete medical scan analysis
 */
export const deleteMedicalScan: RequestHandler = async (req, res) => {
  try {
    const { analysisId } = req.params;

    const sessionToken = req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies.healthchain_session ||
      req.headers["x-session-token"];

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    // Verify user session
    const sessionResult = UserAuthenticationService.verifySession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        message: "Invalid session",
      });
    }

    const result = scanResults.get(analysisId);
    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Medical scan analysis not found",
      });
    }

    // Delete from storage
    scanResults.delete(analysisId);

    res.json({
      success: true,
      message: "Medical scan analysis deleted successfully",
    });

  } catch (error) {
    console.error("❌ Failed to delete medical scan:", error);
    res.status(500).json({
      success: false,
      message: "Failed to delete medical scan analysis",
      error: error.message,
    });
  }
};