import { RequestHandler } from "express";
import { 
  HealthRecord, 
  CreateHealthRecordRequest, 
  CreateHealthRecordResponse,
  GetHealthRecordsResponse,
  PatientProfile
} from "@shared/api";
import { BlockchainService } from "../services/blockchain";
import crypto from 'crypto';

// In-memory storage (in production, use a real database)
const healthRecords: Map<string, HealthRecord[]> = new Map();
const patientProfiles: Map<string, PatientProfile> = new Map();

/**
 * Create a new health record for a patient
 */
export const createHealthRecord: RequestHandler = async (req, res) => {
  try {
    const { type, title, description, doctor, metadata }: CreateHealthRecordRequest = req.body;
    
    // Get or create patient profile (simulate user authentication)
    const patientId = req.headers['patient-id'] as string || 'default-patient';
    let patientProfile = patientProfiles.get(patientId);
    
    if (!patientProfile) {
      patientProfile = {
        id: patientId,
        walletAddress: BlockchainService.generateWalletAddress(),
        encryptionKey: BlockchainService.generateEncryptionKey(),
        createdAt: new Date().toISOString(),
        lastAccess: new Date().toISOString(),
        recordCount: 0
      };
      patientProfiles.set(patientId, patientProfile);
    }

    // Create health record
    const recordId = crypto.randomBytes(16).toString('hex');
    const currentDate = new Date().toISOString();
    
    const healthRecord: HealthRecord = {
      id: recordId,
      patientId,
      date: currentDate.split('T')[0], // YYYY-MM-DD format
      type,
      title,
      description,
      doctor: doctor || 'Self-reported',
      status: 'completed',
      blockchainHash: '', // Will be generated
      metadata,
      createdAt: currentDate,
      updatedAt: currentDate
    };

    // Generate blockchain hash
    healthRecord.blockchainHash = BlockchainService.generateBlockchainHash(healthRecord);

    // Encrypt sensitive data
    const encryptedData = BlockchainService.encryptHealthData(
      { ...healthRecord, metadata }, 
      patientProfile.encryptionKey
    );
    healthRecord.encryptedData = encryptedData;

    // Store on blockchain
    const transaction = await BlockchainService.storeHealthRecord(healthRecord);

    // Store in local database (simulated)
    const patientRecords = healthRecords.get(patientId) || [];
    patientRecords.unshift(healthRecord); // Add to beginning for chronological order
    healthRecords.set(patientId, patientRecords);

    // Update patient profile
    patientProfile.recordCount++;
    patientProfile.lastAccess = new Date().toISOString();
    patientProfiles.set(patientId, patientProfile);

    const response: CreateHealthRecordResponse = {
      success: true,
      record: healthRecord,
      blockchainHash: healthRecord.blockchainHash,
      transactionId: transaction.transactionId
    };

    res.status(201).json(response);
  } catch (error) {
    console.error('Error creating health record:', error);
    const response: CreateHealthRecordResponse = {
      success: false,
      error: 'Failed to create health record'
    };
    res.status(500).json(response);
  }
};

/**
 * Get all health records for a patient
 */
export const getHealthRecords: RequestHandler = (req, res) => {
  try {
    const patientId = req.headers['patient-id'] as string || 'default-patient';
    const records = healthRecords.get(patientId) || [];
    
    // Update patient last access
    const patientProfile = patientProfiles.get(patientId);
    if (patientProfile) {
      patientProfile.lastAccess = new Date().toISOString();
      patientProfiles.set(patientId, patientProfile);
    }

    const response: GetHealthRecordsResponse = {
      success: true,
      records,
      total: records.length
    };

    res.json(response);
  } catch (error) {
    console.error('Error fetching health records:', error);
    res.status(500).json({
      success: false,
      records: [],
      total: 0
    });
  }
};

/**
 * Get medical context summary for AI integration
 */
export const getMedicalContext: RequestHandler = (req, res) => {
  try {
    const patientId = req.headers['patient-id'] as string || 'default-patient';
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
          vitals: null
        }
      });
    }

    // Aggregate medical data for AI context
    const latestRecord = records[0];
    const allMedications = new Set<string>();
    const allAllergies = new Set<string>();
    const allConditions = new Set<string>();
    let latestVitals = null;

    records.forEach(record => {
      if (record.metadata) {
        // Collect medications
        if (record.metadata.medications) {
          record.metadata.medications.forEach(med => allMedications.add(med));
        }
        
        // Collect allergies
        if (record.metadata.allergies) {
          record.metadata.allergies.forEach(allergy => allAllergies.add(allergy));
        }
        
        // Collect chronic conditions
        if (record.metadata.chronicConditions) {
          record.metadata.chronicConditions.forEach(condition => allConditions.add(condition));
        }
        
        // Get latest vitals
        if (record.metadata.weight || record.metadata.height || record.metadata.systolicBP) {
          latestVitals = {
            weight: record.metadata.weight,
            height: record.metadata.height,
            bloodPressure: record.metadata.systolicBP && record.metadata.diastolicBP 
              ? `${record.metadata.systolicBP}/${record.metadata.diastolicBP} mmHg`
              : null,
            heartRate: record.metadata.heartRate ? `${record.metadata.heartRate} bpm` : null,
            bloodType: record.metadata.bloodType,
            age: record.metadata.age,
            gender: record.metadata.gender,
            lastUpdated: record.date
          };
        }
      }
    });

    // Create comprehensive medical context for AI
    const medicalContext = `
PATIENT MEDICAL CONTEXT (Blockchain-Verified):
==============================================

BASIC INFORMATION:
${latestVitals ? `
- Age: ${latestVitals.age || 'Not specified'}
- Gender: ${latestVitals.gender || 'Not specified'}  
- Blood Type: ${latestVitals.bloodType || 'Not specified'}
` : '- Basic information not available'}

CURRENT MEDICATIONS:
${Array.from(allMedications).length > 0 
  ? Array.from(allMedications).map(med => `- ${med}`).join('\n')
  : '- No current medications reported'
}

KNOWN ALLERGIES:
${Array.from(allAllergies).length > 0 
  ? Array.from(allAllergies).map(allergy => `- ${allergy}`).join('\n')
  : '- No known allergies reported'
}

CHRONIC CONDITIONS:
${Array.from(allConditions).length > 0 
  ? Array.from(allConditions).map(condition => `- ${condition}`).join('\n')
  : '- No chronic conditions reported'
}

LATEST VITAL SIGNS (${latestVitals?.lastUpdated || 'Not available'}):
${latestVitals ? `
- Weight: ${latestVitals.weight ? `${latestVitals.weight} kg` : 'Not recorded'}
- Height: ${latestVitals.height ? `${latestVitals.height} cm` : 'Not recorded'}
- Blood Pressure: ${latestVitals.bloodPressure || 'Not recorded'}
- Heart Rate: ${latestVitals.heartRate || 'Not recorded'}
` : '- No vital signs recorded'}

RECENT MEDICAL HISTORY:
${records.slice(0, 3).map(record => 
  `- ${record.date}: ${record.title} - ${record.description}`
).join('\n')}

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
      vitals: latestVitals
    };

    res.json({
      success: true,
      hasData: true,
      context: medicalContext,
      summary,
      patientId,
      dataSource: 'blockchain-verified'
    });

  } catch (error) {
    console.error('Error generating medical context:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to generate medical context'
    });
  }
};

/**
 * Get a specific health record by ID
 */
export const getHealthRecord: RequestHandler = (req, res) => {
  try {
    const { recordId } = req.params;
    const patientId = req.headers['patient-id'] as string || 'default-patient';
    
    const records = healthRecords.get(patientId) || [];
    const record = records.find(r => r.id === recordId);
    
    if (!record) {
      return res.status(404).json({
        success: false,
        error: 'Health record not found'
      });
    }

    // Verify blockchain integrity
    const isValid = BlockchainService.verifyBlockchainIntegrity(record.blockchainHash);
    
    res.json({
      success: true,
      record,
      blockchainVerified: isValid
    });
  } catch (error) {
    console.error('Error fetching health record:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch health record'
    });
  }
};

/**
 * Get patient profile and blockchain info
 */
export const getPatientProfile: RequestHandler = (req, res) => {
  try {
    const patientId = req.headers['patient-id'] as string || 'default-patient';
    const profile = patientProfiles.get(patientId);
    
    if (!profile) {
      return res.status(404).json({
        success: false,
        error: 'Patient profile not found'
      });
    }

    const transactionHistory = BlockchainService.getPatientTransactionHistory(patientId);
    const blockchainStats = BlockchainService.getBlockchainStats();
    
    res.json({
      success: true,
      profile: {
        ...profile,
        encryptionKey: undefined // Don't send encryption key to frontend
      },
      transactionHistory,
      blockchainStats
    });
  } catch (error) {
    console.error('Error fetching patient profile:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch patient profile'
    });
  }
};

/**
 * Verify blockchain integrity for all patient records
 */
export const verifyPatientBlockchain: RequestHandler = (req, res) => {
  try {
    const patientId = req.headers['patient-id'] as string || 'default-patient';
    const records = healthRecords.get(patientId) || [];
    
    const verificationResults = records.map(record => ({
      recordId: record.id,
      blockchainHash: record.blockchainHash,
      isValid: BlockchainService.verifyBlockchainIntegrity(record.blockchainHash),
      lastVerified: new Date().toISOString()
    }));
    
    const totalRecords = verificationResults.length;
    const validRecords = verificationResults.filter(r => r.isValid).length;
    
    res.json({
      success: true,
      verification: {
        totalRecords,
        validRecords,
        invalidRecords: totalRecords - validRecords,
        integrityPercentage: totalRecords > 0 ? (validRecords / totalRecords) * 100 : 100,
        verifiedAt: new Date().toISOString()
      },
      results: verificationResults
    });
  } catch (error) {
    console.error('Error verifying blockchain:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to verify blockchain integrity'
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
      stats
    });
  } catch (error) {
    console.error('Error fetching blockchain stats:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to fetch blockchain statistics'
    });
  }
};
