import { RequestHandler } from "express";
import {
  HealthRecord,
  CreateHealthRecordRequest,
  CreateHealthRecordResponse,
  GetHealthRecordsResponse,
  PatientProfile,
} from "@shared/api";
import { ProductionBlockchainService } from "../services/productionBlockchain";
import { CryptoService } from "../services/crypto";
import { BlockchainMonitorService } from "../services/blockchainMonitor";
import { statements } from "../config/database";
import crypto from "crypto";

/**
 * Production health records routes using real blockchain
 */

/**
 * Create a new health record on the blockchain
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

    // Get patient ID from headers or default
    const patientId = (req.headers["patient-id"] as string) || "default-patient";
    
    // Validate required fields
    if (!type || !title) {
      return res.status(400).json({
        success: false,
        error: "Type and title are required fields"
      });
    }

    // Create health record
    const recordId = crypto.randomBytes(16).toString("hex");
    const currentDate = new Date().toISOString();

    const healthRecord: HealthRecord = {
      id: recordId,
      patientId,
      date: currentDate.split("T")[0],
      type,
      title,
      description: description || "",
      doctor: doctor || "Self-reported",
      status: "pending",
      blockchainHash: "",
      metadata: metadata || {},
      createdAt: currentDate,
      updatedAt: currentDate,
    };

    console.log(`📝 Creating health record for patient ${patientId}: ${title}`);

    // Store on production blockchain
    const { transaction, blockchainHash } = await ProductionBlockchainService.storeHealthRecord(
      healthRecord,
      patientId
    );

    // Update health record with blockchain hash
    healthRecord.blockchainHash = blockchainHash;
    healthRecord.status = "completed";

    console.log(`⛓️  Health record stored on blockchain with hash: ${blockchainHash}`);

    const response: CreateHealthRecordResponse = {
      success: true,
      record: healthRecord,
      blockchainHash,
      transactionId: transaction.transactionId,
    };

    res.status(201).json(response);
  } catch (error) {
    console.error("❌ Error creating health record:", error);
    const response: CreateHealthRecordResponse = {
      success: false,
      error: "Failed to create health record: " + error.message,
    };
    res.status(500).json(response);
  }
};

/**
 * Get all health records for a patient
 */
export const getHealthRecords: RequestHandler = (req, res) => {
  try {
    const patientId = (req.headers["patient-id"] as string) || "default-patient";
    
    // Get records from database
    const dbRecords = statements.getPatientHealthRecords.all(patientId) as any[];
    
    // Convert database records to API format
    const records: HealthRecord[] = dbRecords.map(record => ({
      id: record.id,
      patientId: record.patient_id,
      date: record.date,
      type: record.record_type,
      title: record.title,
      description: record.description || "",
      doctor: record.doctor || "Unknown",
      status: record.status,
      blockchainHash: record.metadata_hash,
      metadata: {}, // Metadata would need to be decrypted
      createdAt: record.created_at,
      updatedAt: record.updated_at,
    }));

    console.log(`📋 Retrieved ${records.length} health records for patient ${patientId}`);

    const response: GetHealthRecordsResponse = {
      success: true,
      records,
      total: records.length,
    };

    res.json(response);
  } catch (error) {
    console.error("❌ Error fetching health records:", error);
    res.status(500).json({
      success: false,
      records: [],
      total: 0,
      error: "Failed to fetch health records"
    });
  }
};

/**
 * Get a specific health record by ID with blockchain verification
 */
export const getHealthRecord: RequestHandler = async (req, res) => {
  try {
    const { recordId } = req.params;
    const patientId = (req.headers["patient-id"] as string) || "default-patient";

    // Get record from database
    const dbRecord = statements.getHealthRecord.get(recordId) as any;

    if (!dbRecord) {
      return res.status(404).json({
        success: false,
        error: "Health record not found",
      });
    }

    // Verify the record belongs to the patient
    if (dbRecord.patient_id !== patientId) {
      return res.status(403).json({
        success: false,
        error: "Access denied to this health record",
      });
    }

    // Get blockchain transaction details
    const transaction = ProductionBlockchainService.getTransaction(dbRecord.transaction_id);
    
    // Verify blockchain integrity
    const verificationResult = await ProductionBlockchainService.verifyBlockchainIntegrity();
    
    const record: HealthRecord = {
      id: dbRecord.id,
      patientId: dbRecord.patient_id,
      date: dbRecord.date,
      type: dbRecord.record_type,
      title: dbRecord.title,
      description: dbRecord.description || "",
      doctor: dbRecord.doctor || "Unknown",
      status: dbRecord.status,
      blockchainHash: dbRecord.metadata_hash,
      metadata: {}, // Would be decrypted in production
      createdAt: dbRecord.created_at,
      updatedAt: dbRecord.updated_at,
    };

    res.json({
      success: true,
      record,
      blockchainVerified: !verificationResult.invalidBlocks.includes(dbRecord.metadata_hash),
      transaction: transaction ? {
        transactionId: transaction.transaction_id,
        blockNumber: transaction.block_number,
        timestamp: transaction.timestamp,
        gasUsed: transaction.gas_used,
        status: transaction.status
      } : null
    });
  } catch (error) {
    console.error("❌ Error fetching health record:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch health record",
    });
  }
};

/**
 * Get medical context for AI with blockchain verification
 */
export const getMedicalContext: RequestHandler = async (req, res) => {
  try {
    const patientId = (req.headers["patient-id"] as string) || "default-patient";
    
    // Get patient records
    const dbRecords = statements.getPatientHealthRecords.all(patientId) as any[];
    
    if (dbRecords.length === 0) {
      return res.json({
        success: true,
        hasData: false,
        context: "No medical history available. This is a new patient with blockchain-verified empty history.",
        summary: {
          totalRecords: 0,
          lastUpdate: null,
          keyConditions: [],
          medications: [],
          allergies: [],
          vitals: null,
          blockchainVerified: true
        },
      });
    }

    // Verify blockchain integrity for this patient's records
    const verificationResult = await ProductionBlockchainService.verifyBlockchainIntegrity();
    const verifiedRecords = dbRecords.filter(record => 
      !verificationResult.invalidBlocks.includes(record.metadata_hash)
    );

    // Create medical context
    const latestRecord = verifiedRecords[0];
    
    const medicalContext = `
PATIENT MEDICAL CONTEXT (Production Blockchain-Verified):
========================================================

🔒 BLOCKCHAIN VERIFICATION STATUS: ${verifiedRecords.length}/${dbRecords.length} records verified
📊 TOTAL BLOCKCHAIN TRANSACTIONS: ${dbRecords.length}
🏥 VERIFIED MEDICAL RECORDS: ${verifiedRecords.length}

RECENT VERIFIED MEDICAL HISTORY:
${verifiedRecords
  .slice(0, 5)
  .map((record, idx) => `${idx + 1}. ${record.date}: ${record.title} - ${record.description}`)
  .join("\n")}

BLOCKCHAIN INTEGRITY: ${verificationResult.isValid ? "✅ VERIFIED" : "⚠️ SOME RECORDS UNVERIFIED"}
LAST MEDICAL UPDATE: ${latestRecord?.date || "No records"}
TOTAL VERIFIED RECORDS: ${verifiedRecords.length}

IMPORTANT: All medical data is cryptographically verified on blockchain. 
Please use this verified medical context for personalized health recommendations.
Always remind the patient to consult with their healthcare provider for serious medical concerns.
`.trim();

    const summary = {
      totalRecords: verifiedRecords.length,
      lastUpdate: latestRecord?.date || null,
      keyConditions: [],
      medications: [],
      allergies: [],
      vitals: null,
      blockchainVerified: verificationResult.isValid,
      verificationDetails: {
        totalBlocks: verificationResult.totalBlocks,
        invalidBlocks: verificationResult.invalidBlocks.length,
        integrityPercentage: verificationResult.isValid ? 100 : 
          ((verifiedRecords.length / dbRecords.length) * 100).toFixed(2)
      }
    };

    res.json({
      success: true,
      hasData: true,
      context: medicalContext,
      summary,
      patientId,
      dataSource: "production-blockchain-verified",
    });
  } catch (error) {
    console.error("❌ Error generating medical context:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate medical context",
    });
  }
};

/**
 * Get patient blockchain profile
 */
export const getPatientProfile: RequestHandler = async (req, res) => {
  try {
    const patientId = (req.headers["patient-id"] as string) || "default-patient";
    
    // Get patient profile from database
    const profile = statements.getPatientProfile.get(patientId) as any;

    if (!profile) {
      return res.status(404).json({
        success: false,
        error: "Patient profile not found",
      });
    }

    // Get blockchain stats
    const blockchainStats = ProductionBlockchainService.getBlockchainStats();
    
    // Get patient's transaction history
    const patientTransactions = statements.getPendingTransactions.all() as any[];
    const patientTxHistory = patientTransactions.filter(tx => tx.from_address === profile.wallet_address);

    const patientProfile: PatientProfile = {
      id: profile.id,
      walletAddress: profile.wallet_address,
      encryptionKey: "***ENCRYPTED***", // Never expose actual key
      createdAt: profile.created_at,
      lastAccess: profile.last_access,
      recordCount: profile.record_count,
    };

    res.json({
      success: true,
      profile: patientProfile,
      transactionHistory: patientTxHistory.map(tx => ({
        transactionId: tx.transaction_id,
        blockNumber: tx.block_number,
        timestamp: tx.timestamp,
        gasUsed: tx.gas_used,
        status: tx.status
      })),
      blockchainStats,
    });
  } catch (error) {
    console.error("❌ Error fetching patient profile:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch patient profile",
    });
  }
};

/**
 * Verify blockchain integrity for patient records
 */
export const verifyPatientBlockchain: RequestHandler = async (req, res) => {
  try {
    const patientId = (req.headers["patient-id"] as string) || "default-patient";
    
    // Get patient records
    const records = statements.getPatientHealthRecords.all(patientId) as any[];
    
    // Verify blockchain integrity
    const verificationResult = await ProductionBlockchainService.verifyBlockchainIntegrity();
    
    const patientVerification = records.map(record => ({
      recordId: record.id,
      blockchainHash: record.metadata_hash,
      isValid: !verificationResult.invalidBlocks.includes(record.metadata_hash),
      transactionId: record.transaction_id,
      lastVerified: new Date().toISOString(),
    }));

    const totalRecords = patientVerification.length;
    const validRecords = patientVerification.filter(r => r.isValid).length;

    res.json({
      success: true,
      verification: {
        totalRecords,
        validRecords,
        invalidRecords: totalRecords - validRecords,
        integrityPercentage: totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100,
        verifiedAt: new Date().toISOString(),
        blockchainStatus: verificationResult.isValid ? "fully_verified" : "partially_verified"
      },
      results: patientVerification,
      globalBlockchainHealth: {
        totalBlocks: verificationResult.totalBlocks,
        invalidBlocks: verificationResult.invalidBlocks.length,
        isHealthy: verificationResult.isValid
      }
    });
  } catch (error) {
    console.error("❌ Error verifying blockchain:", error);
    res.status(500).json({
      success: false,
      error: "Failed to verify blockchain integrity",
    });
  }
};

/**
 * Get blockchain network statistics
 */
export const getBlockchainStats: RequestHandler = (req, res) => {
  try {
    const stats = ProductionBlockchainService.getBlockchainStats();
    
    res.json({
      success: true,
      stats: {
        ...stats,
        networkType: "production-grade",
        consensusAlgorithm: "proof-of-work",
        cryptography: "secp256k1 + SHA-256",
        storageType: "persistent-database"
      },
    });
  } catch (error) {
    console.error("❌ Error fetching blockchain stats:", error);
    res.status(500).json({
      success: false,
      error: "Failed to fetch blockchain statistics",
    });
  }
};

/**
 * Mine a new block manually (for testing)
 */
export const mineBlock: RequestHandler = async (req, res) => {
  try {
    console.log("⛏️  Manual block mining initiated...");
    
    const block = await ProductionBlockchainService.mineBlock();
    
    if (!block) {
      return res.json({
        success: true,
        message: "No pending transactions to mine",
        block: null
      });
    }

    res.json({
      success: true,
      message: `Block ${block.blockNumber} mined successfully`,
      block: {
        blockNumber: block.blockNumber,
        hash: block.hash,
        transactions: block.transactions.length,
        difficulty: block.difficulty,
        nonce: block.nonce,
        timestamp: block.timestamp
      }
    });
  } catch (error) {
    console.error("❌ Error mining block:", error);
    res.status(500).json({
      success: false,
      error: "Failed to mine block",
    });
  }
};

/**
 * Add comprehensive test data with real blockchain storage
 */
export const addTestData: RequestHandler = async (req, res) => {
  try {
    const patientId = "default-patient";
    console.log(`📊 Adding test data for patient ${patientId}...`);

    // Test health records to add
    const testRecords = [
      {
        type: "checkup" as const,
        title: "Annual Physical Examination",
        description: "Routine annual checkup with blood work and vitals assessment",
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
        },
      },
      {
        type: "medication" as const,
        title: "Blood Pressure Medication Started",
        description: "Prescribed Lisinopril 10mg daily for mild hypertension management",
        doctor: "Dr. Sarah Johnson",
        metadata: {
          medications: ["Lisinopril 10mg daily"],
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
        },
      },
    ];

    const createdRecords = [];

    // Create each test record on the blockchain
    for (const testRecord of testRecords) {
      const recordId = crypto.randomBytes(16).toString("hex");
      const recordDate = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000);

      const healthRecord: HealthRecord = {
        id: recordId,
        patientId,
        date: recordDate.toISOString().split("T")[0],
        type: testRecord.type,
        title: testRecord.title,
        description: testRecord.description,
        doctor: testRecord.doctor,
        status: "pending",
        blockchainHash: "",
        metadata: testRecord.metadata,
        createdAt: recordDate.toISOString(),
        updatedAt: recordDate.toISOString(),
      };

      // Store on production blockchain
      const { transaction, blockchainHash } = await ProductionBlockchainService.storeHealthRecord(
        healthRecord,
        patientId
      );

      healthRecord.blockchainHash = blockchainHash;
      healthRecord.status = "completed";
      
      createdRecords.push({
        id: healthRecord.id,
        title: healthRecord.title,
        date: healthRecord.date,
        blockchainHash,
        transactionId: transaction.transactionId
      });
      
      console.log(`✅ Test record "${testRecord.title}" stored on blockchain`);
    }

    // Mine a block with the new transactions
    console.log("⛏️  Mining block with test data...");
    const block = await ProductionBlockchainService.mineBlock();

    res.json({
      success: true,
      message: "Test data added successfully to production blockchain",
      recordsCreated: createdRecords.length,
      records: createdRecords,
      blockMined: block ? {
        blockNumber: block.blockNumber,
        hash: block.hash,
        transactions: block.transactions.length
      } : null
    });
  } catch (error) {
    console.error("❌ Error adding test data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to add test data: " + error.message,
    });
  }
};
