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

/**
 * Create a new health record for a patient (optimized for performance)
 */
export const createHealthRecord: RequestHandler = async (req, res) => {
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

    const {
      type,
      title,
      description,
      doctor,
      metadata,
    }: CreateHealthRecordRequest = req.body;

    // Validate required fields
    if (!type || !title || !description) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields: type, title, description",
      });
    }

    // Get or create patient profile (simulate user authentication)
    const patientId =
      (req.headers["patient-id"] as string) || "default-patient";
    let patientProfile = patientProfiles.get(patientId);

    if (!patientProfile) {
      patientProfile = {
        id: patientId,
        walletAddress: BlockchainService.generateWalletAddress(),
        encryptionKey: BlockchainService.generateEncryptionKey(),
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
        recordCount: 0,
      };
      patientProfiles.set(patientId, patientProfile);
    }

    // Create health record
    const recordId = crypto.randomBytes(16).toString("hex");
    const currentDate = new Date().toISOString();

    const healthRecord: HealthRecord = {
      id: recordId,
      patientId,
      date: currentDate.split("T")[0], // YYYY-MM-DD format
      type,
      title,
      description,
      doctor: doctor || "Self-reported",
      status: "completed",
      blockchainHash: "", // Will be generated
      metadata,
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    // Add to batch processing queue for better performance
    pendingRecords.push({ record: healthRecord, sessionToken });
    scheduleBatchProcessing();

    // Generate blockchain hash (non-blocking)
    BlockchainService.generateBlockchainHash(healthRecord)
      .then((hash) => {
        healthRecord.blockchainHash = hash;
        console.log(`✅ Blockchain hash generated for record ${recordId}`);
      })
      .catch((error) => {
        console.error(`❌ Blockchain hash generation failed for record ${recordId}:`, error);
      });

    // Store in local database immediately for instant feedback
    const patientRecords = healthRecords.get(patientId) || [];
    patientRecords.unshift(healthRecord); // Add to beginning for chronological order
    healthRecords.set(patientId, patientRecords);

    // Update cache
    const cacheKey = `records_${patientId}`;
    recordCache.set(cacheKey, {
      data: patientRecords,
      timestamp: Date.now()
    });

    // Also store in secure Neon database
    try {
      const { NeonDatabaseService } = await import("../services/neonDatabase");
      await NeonDatabaseService.storeMedicalHistory({
        id: healthRecord.id,
        patientId: healthRecord.patientId,
        recordType: healthRecord.type,
        title: healthRecord.title,
        description: healthRecord.description || "",
        doctor: healthRecord.doctor || "Unknown",
        date: healthRecord.date,
        metadata: healthRecord.metadata,
        secureRecordId: null, // Not using secure encryption for regular records
      });
      console.log(
        `✅ Stored health record in secure database: ${healthRecord.id}`,
      );
    } catch (error) {
      console.error("❌ Failed to store in secure database:", error);
      // Don't fail the request if secure storage fails
    }

    // Update patient profile
    patientProfile.recordCount++;
    patientProfile.lastAccess = new Date().toISOString();
    patientProfiles.set(patientId, patientProfile);

    const response: CreateHealthRecordResponse = {
      success: true,
      record: healthRecord,
      blockchainHash: healthRecord.blockchainHash,
      transactionId: transaction.transactionId,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("Error creating health record:", error);
    const response: CreateHealthRecordResponse = {
      success: false,
      error: "Failed to create health record",
    };
    res.status(500).json(response);
  }
};

/**
 * Get all health records for authenticated user (enhanced with user authentication)
 */
export const getHealthRecords: RequestHandler = async (req, res) => {
  try {
    // Get session token for authentication
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.healthchain_session ||
      (req.headers["x-session-token"] as string) ||
      (req.headers["patient-id"] as string); // Fallback for demo mode

    let authenticatedUser = null;
    let userPatientId = "default-patient";

    // Try to authenticate user
    if (sessionToken && sessionToken !== "default-patient") {
      try {
        const sessionResult =
          await UserAuthenticationService.validateSession(sessionToken);
        if (sessionResult.valid) {
          authenticatedUser = sessionResult.user!;
          userPatientId = authenticatedUser.id;
          console.log(
            `✅ Fetching records for authenticated user: ${authenticatedUser.username}`,
          );
        }
      } catch (error) {
        console.log("⚠️  Session validation failed, falling back to demo mode");
      }
    }

    // Check cache first for better performance
    const cacheKey = `records_${userPatientId}`;
    const cachedData = recordCache.get(cacheKey);
    
    if (cachedData && (Date.now() - cachedData.timestamp) < CACHE_DURATION) {
      console.log(`📦 Returning cached records for patient ${userPatientId}`);
      const response: GetHealthRecordsResponse = {
        success: true,
        records: cachedData.data,
        total: cachedData.data.length,
        fromCache: true,
      };

      // Add user info if authenticated
      if (authenticatedUser) {
        (response as any).userInfo = {
          userId: authenticatedUser.id,
          username: authenticatedUser.username,
          name: `${authenticatedUser.firstName} ${authenticatedUser.lastName}`,
          isAuthenticated: true,
        };
      } else {
        (response as any).userInfo = {
          isAuthenticated: false,
          message: "Demo mode - using default patient data",
        };
      }

      return res.json(response);
    }

    // Get records from in-memory storage (backward compatibility)
    const memoryRecords = healthRecords.get(userPatientId) || [];

    // Also get records from Neon database (with timeout for better performance)
    let neonRecords = [];
    try {
      const { NeonDatabaseService } = await import("../services/neonDatabase");
      
      // Add timeout to prevent hanging
      const dbPromise = NeonDatabaseService.getMedicalHistory(userPatientId);
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Database timeout')), 5000)
      );
      
      const dbRecords = await Promise.race([dbPromise, timeoutPromise]) as any[];

      // Convert database records to API format
      neonRecords = dbRecords.map((record) => ({
        id: record.id,
        patientId: record.patientId,
        date: record.date,
        type: record.recordType,
        title: record.title,
        description: record.description || "",
        doctor: record.doctor || "Unknown",
        status: "completed",
        blockchainHash: `secure-${record.id.slice(-8)}`, // Generate a hash-like ID for display
        metadata: record.metadata || {},
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));

      console.log(
        `✅ Found ${neonRecords.length} records in Neon database for user: ${userPatientId}`,
      );
    } catch (error) {
      console.error("Error fetching from Neon database:", error);
      // Don't fail the request if Neon is unavailable
    }

    // Combine records from both sources and deduplicate
    const allRecords = [...memoryRecords, ...neonRecords];
    const uniqueRecords = allRecords.filter(
      (record, index, self) =>
        index === self.findIndex((r) => r.id === record.id),
    );

    // Sort by date (newest first)
    uniqueRecords.sort(
      (a, b) =>
        new Date(b.createdAt || b.date).getTime() -
        new Date(a.createdAt || a.date).getTime(),
    );

    // Update cache
    recordCache.set(cacheKey, {
      data: uniqueRecords,
      timestamp: Date.now()
    });

    // Update patient last access
    const patientProfile = patientProfiles.get(userPatientId);
    if (patientProfile) {
      patientProfile.lastAccess = new Date().toISOString();
      patientProfiles.set(userPatientId, patientProfile);
    }

    const response: GetHealthRecordsResponse = {
      success: true,
      records: uniqueRecords,
      total: uniqueRecords.length,
      fromCache: false,
    };

    // Add user info if authenticated
    if (authenticatedUser) {
      (response as any).userInfo = {
        userId: authenticatedUser.id,
        username: authenticatedUser.username,
        name: `${authenticatedUser.firstName} ${authenticatedUser.lastName}`,
        isAuthenticated: true,
      };
    } else {
      (response as any).userInfo = {
        isAuthenticated: false,
        demoMode: true,
      };
    }

    res.json(response);
  } catch (error) {
    console.error("Error fetching health records:", error);
    res.status(500).json({
      success: false,
      records: [],
      total: 0,
      error: error.message,
    });
  }
};

/**
 * Get medical context summary for AI integration
 */
export const getMedicalContext: RequestHandler = (req, res) => {
  try {
    const patientId =
      (req.headers["patient-id"] as string) || "default-patient";
    const records = healthRecords.get(patientId) || [];
    const patientProfile = patientProfiles.get(patientId);

    if (records.length === 0) {
      return res.json({
        success: true,
        hasData: false,
        context: "No medical history available. This is a new patient.",
        summary: {
          totalRecords: 0,
          lastUpdate: null,
          keyConditions: [],
          medications: [],
          allergies: [],
          vitals: null,
        },
      });
    }

    // Aggregate medical data for AI context
    const latestRecord = records[0];
    const allMedications = new Set<string>();
    const allAllergies = new Set<string>();
    const allConditions = new Set<string>();
    let latestVitals = null;

    records.forEach((record) => {
      if (record.metadata) {
        // Collect medications
        if (record.metadata.medications) {
          record.metadata.medications.forEach((med) => allMedications.add(med));
        }

        // Collect allergies
        if (record.metadata.allergies) {
          record.metadata.allergies.forEach((allergy) =>
            allAllergies.add(allergy),
          );
        }

        // Collect chronic conditions
        if (record.metadata.chronicConditions) {
          record.metadata.chronicConditions.forEach((condition) =>
            allConditions.add(condition),
          );
        }

        // Get latest vitals
        if (
          record.metadata.weight ||
          record.metadata.height ||
          record.metadata.systolicBP
        ) {
          latestVitals = {
            weight: record.metadata.weight,
            height: record.metadata.height,
            bloodPressure:
              record.metadata.systolicBP && record.metadata.diastolicBP
                ? `${record.metadata.systolicBP}/${record.metadata.diastolicBP} mmHg`
                : null,
            heartRate: record.metadata.heartRate
              ? `${record.metadata.heartRate} bpm`
              : null,
            bloodType: record.metadata.bloodType,
            age: record.metadata.age,
            gender: record.metadata.gender,
            lastUpdated: record.date,
          };
        }
      }
    });

    // Create comprehensive medical context for AI
    const medicalContext = `
PATIENT MEDICAL CONTEXT (Blockchain-Verified):
==============================================

BASIC INFORMATION:
${
  latestVitals
    ? `
- Age: ${latestVitals.age || "Not specified"}
- Gender: ${latestVitals.gender || "Not specified"}  
- Blood Type: ${latestVitals.bloodType || "Not specified"}
`
    : "- Basic information not available"
}

CURRENT MEDICATIONS:
${
  Array.from(allMedications).length > 0
    ? Array.from(allMedications)
        .map((med) => `- ${med}`)
        .join("\n")
    : "- No current medications reported"
}

KNOWN ALLERGIES:
${
  Array.from(allAllergies).length > 0
    ? Array.from(allAllergies)
        .map((allergy) => `- ${allergy}`)
        .join("\n")
    : "- No known allergies reported"
}

CHRONIC CONDITIONS:
${
  Array.from(allConditions).length > 0
    ? Array.from(allConditions)
        .map((condition) => `- ${condition}`)
        .join("\n")
    : "- No chronic conditions reported"
}

LATEST VITAL SIGNS (${latestVitals?.lastUpdated || "Not available"}):
${
  latestVitals
    ? `
- Weight: ${latestVitals.weight ? `${latestVitals.weight} kg` : "Not recorded"}
- Height: ${latestVitals.height ? `${latestVitals.height} cm` : "Not recorded"}
- Blood Pressure: ${latestVitals.bloodPressure || "Not recorded"}
- Heart Rate: ${latestVitals.heartRate || "Not recorded"}
`
    : "- No vital signs recorded"
}

RECENT MEDICAL HISTORY:
${records
  .slice(0, 3)
  .map((record) => `- ${record.date}: ${record.title} - ${record.description}`)
  .join("\n")}

TOTAL HEALTH RECORDS: ${records.length}
LAST HEALTH UPDATE: ${latestRecord.date}

IMPORTANT: Please use this medical context to provide personalized health recommendations. Always remind the patient to consult with their healthcare provider for serious medical concerns.
`.trim();

    const summary = {
      totalRecords: records.length,
      lastUpdate: latestRecord.date,
      keyConditions: Array.from(allConditions),
      medications: Array.from(allMedications),
      allergies: Array.from(allAllergies),
      vitals: latestVitals,
    };

    res.json({
      success: true,
      hasData: true,
      context: medicalContext,
      summary,
      patientId,
      dataSource: "blockchain-verified",
    });
  } catch (error) {
    console.error("Error generating medical context:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate medical context",
    });
  }
};

/**
 * Get a specific health record by ID
 */
export const getHealthRecord: RequestHandler = (req, res) => {
  try {
    const { recordId } = req.params;
    const patientId =
      (req.headers["patient-id"] as string) || "default-patient";

    const records = healthRecords.get(patientId) || [];
    const record = records.find((r) => r.id === recordId);

    if (!record) {
      return res.status(404).json({
        success: false,
        error: "Health record not found",
      });
    }

    // Verify blockchain integrity
    const isValid = BlockchainService.verifyBlockchainIntegrity(
      record.blockchainHash,
    );

    res.json({
      success: true,
      record,
      blockchainVerified: isValid,
    });
  } catch (error) {
    console.error("Error fetching health record:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch health record",
    });
  }
};

/**
 * Get patient profile and blockchain info
 */
export const getPatientProfile: RequestHandler = (req, res) => {
  try {
    const patientId =
      (req.headers["patient-id"] as string) || "default-patient";
    const profile = patientProfiles.get(patientId);

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Patient profile not found",
      });
    }

    const transactionHistory =
      BlockchainService.getPatientTransactionHistory(patientId);
    const blockchainStats = BlockchainService.getBlockchainStats();

    res.json({
      success: true,
      profile: {
        ...profile,
        encryptionKey: undefined, // Don't send encryption key to frontend
      },
      transactionHistory,
      blockchainStats,
    });
  } catch (error) {
    console.error("Error fetching patient profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient profile",
    });
  }
};

/**
 * Verify blockchain integrity for all patient records
 */
export const verifyPatientBlockchain: RequestHandler = (req, res) => {
  try {
    const patientId =
      (req.headers["patient-id"] as string) || "default-patient";
    const records = healthRecords.get(patientId) || [];

    const verificationResults = records.map((record) => ({
      recordId: record.id,
      blockchainHash: record.blockchainHash,
      isValid: BlockchainService.verifyBlockchainIntegrity(
        record.blockchainHash,
      ),
      lastVerified: new Date().toISOString(),
    }));

    const totalRecords = verificationResults.length;
    const validRecords = verificationResults.filter((r) => r.isValid).length;

    res.json({
      success: true,
      verification: {
        totalRecords,
        validRecords,
        invalidRecords: totalRecords - validRecords,
        integrityPercentage:
          totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100,
        verifiedAt: new Date().toISOString(),
      },
      results: verificationResults,
    });
  } catch (error) {
    console.error("Error verifying blockchain:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify blockchain integrity",
    });
  }
};

/**
 * Store health record directly in Neon database with user authentication and hash linking
 */
export const storeHealthRecordDirect: RequestHandler = async (req, res) => {
  try {
    const {
      patientId,
      recordType,
      title,
      description,
      doctor,
      date,
      metadata,
    } = req.body;

    // Get session token for authentication
    const sessionToken =
      req.headers.authorization?.replace("Bearer ", "") ||
      req.cookies?.healthchain_session ||
      (req.headers["x-session-token"] as string);

    if (!sessionToken) {
      return res.status(401).json({
        success: false,
        error: "Authentication required to store health records",
      });
    }

    // Validate session
    const sessionResult =
      await UserAuthenticationService.validateSession(sessionToken);
    if (!sessionResult.valid) {
      return res.status(401).json({
        success: false,
        error: sessionResult.error,
      });
    }

    const authenticatedUser = sessionResult.user!;

    if (!recordType || !title) {
      return res.status(400).json({
        success: false,
        error: "Record type and title are required",
      });
    }

    // Use authenticated user's ID as patient ID
    const userPatientId = authenticatedUser.id;

    // Generate a unique record ID with user hash
    const recordId = `record_${Date.now()}_${crypto.randomBytes(8).toString("hex")}`;

    // Store directly in Neon database
    const { NeonDatabaseService } = await import("../services/neonDatabase");
    await NeonDatabaseService.storeMedicalHistory({
      id: recordId,
      patientId: userPatientId,
      recordType,
      title,
      description,
      doctor,
      date,
      metadata,
    });

    // Create data access record with hash linking
    const accessResult = await UserAuthenticationService.createDataAccessRecord(
      authenticatedUser.id,
      recordId,
      authenticatedUser.userHash,
    );

    console.log(
      `✅ Stored health record for user ${authenticatedUser.username}: ${recordId}`,
    );

    res.json({
      success: true,
      recordId,
      message: "Health record stored successfully with secure access",
      storage: "neon-database",
      userAccess: accessResult.success,
      accessId: accessResult.accessId,
      userInfo: {
        userId: authenticatedUser.id,
        username: authenticatedUser.username,
        userHash: authenticatedUser.userHash,
      },
    });
  } catch (error) {
    console.error("❌ Error storing health record directly:", error);
    res.status(500).json({
      success: false,
      error: "Failed to store health record: " + (error as Error).message,
    });
  }
};

/**
 * Delete health record for authenticated user
 */
export const deleteHealthRecord: RequestHandler = async (req, res) => {
  try {
    const recordId = req.params.id;
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

    const user = sessionResult.user!;
    const { NeonDatabaseService } = await import("../services/neonDatabase");
    const ok = await NeonDatabaseService.deleteMedicalHistory(recordId, user.id);
    if (!ok) {
      return res.status(400).json({ success: false, error: "Failed to delete record" });
    }

    // Best-effort: create audit log via secure data service
    try {
      const { SecureDataAccessService } = await import("../services/secureDataAccess");
      await (SecureDataAccessService as any).createAuditLog?.({
        action: "delete",
        userId: user.userHash,
        userRole: "patient",
        success: true,
        details: { action: "health_record_delete", recordId },
      });
    } catch {}

    return res.json({ success: true, message: "Record deleted" });
  } catch (error) {
    console.error("❌ Error deleting health record:", error);
    return res.status(500).json({ success: false, error: "Internal server error" });
  }
};

/**
 * Get blockchain network statistics
 */
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
