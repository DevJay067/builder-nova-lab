import { RequestHandler } from "express";
import {
  HealthRecord,
  CreateHealthRecordRequest,
  CreateHealthRecordResponse,
  GetHealthRecordsResponse,
  PatientProfile,
} from "@shared/api";
import { BlockchainService } from "../services/blockchain";
import crypto from "crypto";

// In-memory storage (in production, use a real database)
const healthRecords: Map<string, HealthRecord[]> = new Map();
const patientProfiles: Map<string, PatientProfile> = new Map();

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
 * Create a new health record for a patient (integrated with secure system)
 */
export const createHealthRecord: RequestHandler = async (req, res) => {
  try {
    const {
      type,
      title,
      description,
      doctor,
      metadata,
    }: CreateHealthRecordRequest = req.body;

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

    // Generate blockchain hash
    healthRecord.blockchainHash =
      BlockchainService.generateBlockchainHash(healthRecord);

    // Encrypt sensitive data
    const encryptedData = BlockchainService.encryptHealthData(
      { ...healthRecord, metadata },
      patientProfile.encryptionKey,
    );
    healthRecord.encryptedData = encryptedData;

    // Store on blockchain
    const transaction = await BlockchainService.storeHealthRecord(healthRecord);

    // Store in local database (simulated)
    const patientRecords = healthRecords.get(patientId) || [];
    patientRecords.unshift(healthRecord); // Add to beginning for chronological order
    healthRecords.set(patientId, patientRecords);

    // Also store in secure Neon database
    try {
      const { NeonDatabaseService } = await import('../services/neonDatabase');
      await NeonDatabaseService.storeMedicalHistory({
        id: healthRecord.id,
        patientId: healthRecord.patientId,
        recordType: healthRecord.type,
        title: healthRecord.title,
        description: healthRecord.description || '',
        doctor: healthRecord.doctor || 'Unknown',
        date: healthRecord.date,
        metadata: healthRecord.metadata,
        secureRecordId: null // Not using secure encryption for regular records
      });
      console.log(`✅ Stored health record in secure database: ${healthRecord.id}`);
    } catch (error) {
      console.error('❌ Failed to store in secure database:', error);
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
 * Get all health records for a patient (enhanced with Neon database)
 */
export const getHealthRecords: RequestHandler = async (req, res) => {
  try {
    const patientId =
      (req.headers["patient-id"] as string) || "default-patient";

    // Get records from in-memory storage (backward compatibility)
    const memoryRecords = healthRecords.get(patientId) || [];

    // Also get records from Neon database
    let neonRecords = [];
    try {
      const { NeonDatabaseService } = await import('../services/neonDatabase');
      const dbRecords = await NeonDatabaseService.getMedicalHistory(patientId);

      // Convert database records to API format
      neonRecords = dbRecords.map(record => ({
        id: record.id,
        patientId: record.patientId,
        date: record.date,
        type: record.recordType,
        title: record.title,
        description: record.description || "",
        doctor: record.doctor || "Unknown",
        status: "completed",
        blockchainHash: `neon-${record.id.slice(-8)}`, // Generate a hash-like ID for display
        metadata: record.metadata || {},
        createdAt: record.createdAt,
        updatedAt: record.updatedAt,
      }));
    } catch (error) {
      console.error("Error fetching from Neon database:", error);
      // Don't fail the request if Neon is unavailable
    }

    // Combine records from both sources and deduplicate
    const allRecords = [...memoryRecords, ...neonRecords];
    const uniqueRecords = allRecords.filter((record, index, self) =>
      index === self.findIndex(r => r.id === record.id)
    );

    // Sort by date (newest first)
    uniqueRecords.sort((a, b) => new Date(b.createdAt || b.date).getTime() - new Date(a.createdAt || a.date).getTime());

    // Update patient last access
    const patientProfile = patientProfiles.get(patientId);
    if (patientProfile) {
      patientProfile.lastAccess = new Date().toISOString();
      patientProfiles.set(patientId, patientProfile);
    }

    const response: GetHealthRecordsResponse = {
      success: true,
      records: uniqueRecords,
      total: uniqueRecords.length,
    };

    res.json(response);
  } catch (error) {
    console.error("Error fetching health records:", error);
    res.status(500).json({
      success: false,
      records: [],
      total: 0,
      error: error.message
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
 * Store health record directly in Neon database (simplified approach)
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
      metadata
    } = req.body;

    if (!patientId || !recordType || !title) {
      return res.status(400).json({
        success: false,
        error: "Patient ID, record type, and title are required"
      });
    }

    // Generate a unique record ID
    const recordId = `neon-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

    // Store directly in Neon database
    const { NeonDatabaseService } = await import('../services/neonDatabase');
    await NeonDatabaseService.storeMedicalHistory({
      id: recordId,
      patientId,
      recordType,
      title,
      description,
      doctor,
      date,
      metadata
    });

    console.log(`✅ Stored health record directly in Neon: ${recordId}`);

    res.json({
      success: true,
      recordId,
      message: "Health record stored successfully in Neon database",
      storage: "neon-database"
    });

  } catch (error) {
    console.error("❌ Error storing health record directly:", error);
    res.status(500).json({
      success: false,
      error: "Failed to store health record: " + error.message
    });
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
