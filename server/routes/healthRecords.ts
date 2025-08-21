import { RequestHandler } from "express";
import {
  HealthRecord,
  CreateHealthRecordRequest,
  CreateHealthRecordResponse,
  GetHealthRecordsResponse,
  PatientProfile,
} from "@shared/api";
import { BlockchainService } from "../services/blockchain";
import { UserAuthenticationService } from "../services/userAuthentication";
import { SecureDataAccessService } from "../services/secureDataAccess";
import crypto from "crypto";

// In-memory storage with caching for better performance
const healthRecords: Map<string, HealthRecord[]> = new Map();
const patientProfiles: Map<string, PatientProfile> = new Map();
const recordCache: Map<string, { data: HealthRecord[]; timestamp: number }> = new Map();
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Batch processing for better performance
let pendingRecords: Array<{ record: HealthRecord; sessionToken: string }> = [];
let batchProcessingTimeout: NodeJS.Timeout | null = null;

/**
 * Process records in batches for better performance
 */
const processBatchRecords = async () => {
  if (pendingRecords.length === 0) return;

  const batch = [...pendingRecords];
  pendingRecords = [];

  try {
    console.log(`🔄 Processing batch of ${batch.length} records`);
    
    // Process records in parallel with limited concurrency
    const batchPromises = batch.map(async ({ record, sessionToken }) => {
      try {
        // Store in secure system
        await SecureDataAccessService.storeSecureHealthRecord(
          sessionToken,
          record.type,
          record,
          "patient"
        );
        
        // Add to local cache
        const patientRecords = healthRecords.get(record.patientId) || [];
        patientRecords.push(record);
        healthRecords.set(record.patientId, patientRecords);
        
        // Update cache
        const cacheKey = `records_${record.patientId}`;
        recordCache.set(cacheKey, {
          data: patientRecords,
          timestamp: Date.now()
        });
        
        return { success: true, recordId: record.id };
      } catch (error) {
        console.error(`❌ Failed to process record ${record.id}:`, error);
        return { success: false, recordId: record.id, error };
      }
    });

    const results = await Promise.allSettled(batchPromises);
    const successful = results.filter(r => r.status === 'fulfilled' && r.value.success).length;
    const failed = results.length - successful;
    
    console.log(`✅ Batch processed: ${successful} successful, ${failed} failed`);
  } catch (error) {
    console.error("❌ Batch processing failed:", error);
  }
};

/**
 * Schedule batch processing
 */
const scheduleBatchProcessing = () => {
  if (batchProcessingTimeout) {
    clearTimeout(batchProcessingTimeout);
  }
  
  batchProcessingTimeout = setTimeout(() => {
    processBatchRecords();
  }, 1000); // Process after 1 second of inactivity
};

/**
 * Add comprehensive test data for demonstration
 */
export const addTestData: RequestHandler = async (req, res) => {
  try {
    const patientId = "default-patient";

    // Create patient profile
    const patientProfile: PatientProfile = {
      id: patientId,
      walletAddress: BlockchainService.generateWalletAddress(),
      encryptionKey: BlockchainService.generateEncryptionKey(),
      createdAt: new Date().toISOString(),
      lastAccess: new Date().toISOString(),
      recordCount: 0,
    };
    patientProfiles.set(patientId, patientProfile);

    // Test health records to add
    const testRecords = [
      {
        type: "checkup" as const,
        title: "Annual Physical Examination",
        description:
          "Routine annual checkup with blood work and vitals assessment",
        doctor: "Dr. Sarah Johnson",
        metadata: {
          age: 28,
          gender: "male",
          bloodType: "A+",
          weight: 78,
          height: 175,
          systolicBP: 130,
          diastolicBP: 85,
          heartRate: 72,
          temperature: 36.7,
          medications: ["Lisinopril 10mg daily"],
          allergies: ["Penicillin", "Shellfish"],
          chronicConditions: ["Mild Hypertension"],
          notes:
            "Patient reports occasional headaches, blood pressure slightly elevated but stable with medication",
        },
      },
      {
        type: "medication" as const,
        title: "Blood Pressure Medication Started",
        description:
          "Prescribed Lisinopril 10mg daily for mild hypertension management",
        doctor: "Dr. Sarah Johnson",
        metadata: {
          medications: ["Lisinopril 10mg daily"],
          notes:
            "Started medication due to consistently elevated BP readings. Patient advised to monitor sodium intake and exercise regularly.",
        },
      },
      {
        type: "vitals" as const,
        title: "Blood Pressure Monitoring",
        description: "Follow-up BP check after starting medication",
        doctor: "Nurse Patricia",
        metadata: {
          systolicBP: 125,
          diastolicBP: 82,
          heartRate: 68,
          weight: 78,
          notes:
            "Blood pressure improving with medication. Continue current dosage.",
        },
      },
    ];

    const createdRecords = [];

    // Create each test record
    for (const testRecord of testRecords) {
      const recordId = crypto.randomBytes(16).toString("hex");
      const recordDate = new Date(
        Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000,
      ); // Random date within last 30 days

      const healthRecord: HealthRecord = {
        id: recordId,
        patientId,
        date: recordDate.toISOString().split("T")[0],
        type: testRecord.type,
        title: testRecord.title,
        description: testRecord.description,
        doctor: testRecord.doctor,
        status: "completed",
        blockchainHash: "",
        metadata: testRecord.metadata,
        createdAt: recordDate.toISOString(),
        updatedAt: recordDate.toISOString(),
      };

      // Generate blockchain hash
      healthRecord.blockchainHash =
        BlockchainService.generateBlockchainHash(healthRecord);

      // Encrypt sensitive data
      const encryptedData = BlockchainService.encryptHealthData(
        { ...healthRecord, metadata: testRecord.metadata },
        patientProfile.encryptionKey,
      );
      healthRecord.encryptedData = encryptedData;

      // Store on blockchain
      await BlockchainService.storeHealthRecord(healthRecord);

      createdRecords.push(healthRecord);
    }

    // Store all records
    healthRecords.set(
      patientId,
      createdRecords.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime(),
      ),
    );

    // Update patient profile
    patientProfile.recordCount = createdRecords.length;
    patientProfiles.set(patientId, patientProfile);

    res.json({
      success: true,
      message: "Test data added successfully",
      recordsCreated: createdRecords.length,
      records: createdRecords.map((r) => ({
        id: r.id,
        title: r.title,
        date: r.date,
        blockchainHash: r.blockchainHash,
      })),
    });
  } catch (error) {
    console.error("Error adding test data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add test data",
    });
  }
};

export const getBlockchainStats: RequestHandler = (req, res) => {
  try {
    const stats = BlockchainService.getBlockchainStats();
    res.json({
      success: true,
      stats,
    });
  } catch (error) {
    console.error("Error fetching blockchain stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blockchain statistics",
    });
  }
};

// --- Share token helpers and endpoints ---

function encodeShareToken(payload: any): string {
  const json = JSON.stringify(payload);
  return Buffer.from(json).toString("base64url");
}

function decodeShareToken(token: string): any | null {
  try {
    const json = Buffer.from(token, "base64url").toString("utf8");
    return JSON.parse(json);
  } catch {
    return null;
  }
}

export const createShareToken: RequestHandler = async (req, res) => {
  try {
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.healthchain_session ||
      (req.headers["x-session-token"] as string);
    if (!sessionToken) {
      return res.status(401).json({ success: false, error: "Authentication required" });
    }
    const sessionResult = await UserAuthenticationService.validateSession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({ success: false, error: sessionResult.error });
    }

    const { recordId } = req.body as { recordId: string };
    if (!recordId) return res.status(400).json({ success: false, error: "recordId required" });

    const user = sessionResult.user!;
    const token = encodeShareToken({ r: recordId, u: user.id, iat: Date.now(), exp: Date.now() + 1000 * 60 * 60 * 24 });
    const shareUrl = `${req.protocol}://${req.get("host")}/share?token=${token}`;

    return res.json({ success: true, token, url: shareUrl });
  } catch (error) {
    console.error("❌ Error creating share token:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

export const getSharedRecord: RequestHandler = async (req, res) => {
  try {
    const token = (req.query.token as string) || (req.params.token as string);
    if (!token) return res.status(400).json({ success: false, error: "token required" });

    const payload = decodeShareToken(token);
    if (!payload) return res.status(400).json({ success: false, error: "invalid token" });
    if (payload.exp && Date.now() > payload.exp) return res.status(401).json({ success: false, error: "token expired" });

    const recordId = payload.r as string;
    const userId = payload.u as string;

    // Try Neon DB first
    try {
      const { NeonDatabaseService } = await import("../services/neonDatabase");
      const rec = await NeonDatabaseService.getMedicalHistoryById(recordId, userId);
      if (rec) {
        return res.json({ success: true, record: rec });
      }
    } catch {}

    // Fallback to in-memory cache
    const records = healthRecords.get(userId) || [];
    const record = records.find(r => r.id === recordId);
    if (!record) return res.status(404).json({ success: false, error: "record not found" });

    return res.json({ success: true, record });
  } catch (error) {
    console.error("❌ Error getting shared record:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};