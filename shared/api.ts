/**
 * Shared code between client and server
 * Useful to share types between client and server
 * and/or small pure JS functions that can be used on both client and server
 */

/**
 * Example response type for /api/demo
 */
export interface DemoResponse {
  message: string;
}

/**
 * Health Record Types for Blockchain Storage
 */
export interface HealthRecord {
  id: string;
  patientId: string;
  date: string;
  type: 'checkup' | 'medication' | 'vitals' | 'symptom' | 'emergency';
  title: string;
  description: string;
  doctor: string;
  status: 'completed' | 'active' | 'monitoring' | 'pending';
  blockchainHash: string;
  encryptedData?: string;
  metadata: HealthRecordMetadata;
  createdAt: string;
  updatedAt: string;
}

export interface HealthRecordMetadata {
  // Personal Information
  age?: number;
  gender?: string;
  bloodType?: string;
  
  // Vital Signs
  weight?: number; // kg
  height?: number; // cm
  systolicBP?: number; // mmHg
  diastolicBP?: number; // mmHg
  heartRate?: number; // bpm
  temperature?: number; // celsius
  
  // Medical History
  medications?: string[];
  allergies?: string[];
  chronicConditions?: string[];
  
  // Additional
  notes?: string;
  attachments?: string[];
}

export interface CreateHealthRecordRequest {
  type: HealthRecord['type'];
  title: string;
  description: string;
  doctor?: string;
  metadata: HealthRecordMetadata;
}

export interface CreateHealthRecordResponse {
  success: boolean;
  record?: HealthRecord;
  blockchainHash?: string;
  transactionId?: string;
  error?: string;
}

export interface GetHealthRecordsResponse {
  success: boolean;
  records: HealthRecord[];
  total: number;
}

export interface BlockchainTransaction {
  transactionId: string;
  blockHash: string;
  blockNumber: number;
  timestamp: string;
  gasUsed: number;
  from: string;
  to: string;
  dataHash: string;
}

export interface PatientProfile {
  id: string;
  walletAddress: string;
  encryptionKey: string;
  createdAt: string;
  lastAccess: string;
  recordCount: number;
}

export interface MedicalContextSummary {
  totalRecords: number;
  lastUpdate: string | null;
  keyConditions: string[];
  medications: string[];
  allergies: string[];
  vitals: {
    weight?: number;
    height?: number;
    bloodPressure?: string;
    heartRate?: string;
    bloodType?: string;
    age?: number;
    gender?: string;
    lastUpdated: string;
  } | null;
}

export interface MedicalContextResponse {
  success: boolean;
  hasData: boolean;
  context: string;
  summary: MedicalContextSummary;
  patientId?: string;
  dataSource?: string;
  error?: string;
}
