import crypto from 'crypto';
import { BlockchainService } from './blockchain';

/**
 * Secure Data Access System with Split-Key Mechanism and Blockchain Immutability
 * 
 * This system implements a multi-layered security approach:
 * 1. Split-key mechanism for access control
 * 2. Blockchain immutability for data integrity
 * 3. Role-based access control
 * 4. Audit logging for compliance
 */

export interface SplitKeyPair {
  patientKey: string;      // Patient-held key fragment
  providerKey: string;     // Healthcare provider key fragment
  systemKey: string;       // System-held key fragment
  keyId: string;           // Unique identifier for this key set
  createdAt: string;
  expiresAt?: string;
}

export interface SecureDataRecord {
  id: string;
  patientId: string;
  dataType: 'medical_history' | 'ai_report' | 'assessment' | 'lab_result';
  encryptedData: string;
  keyId: string;
  blockchainHash: string;
  accessLevel: 'patient' | 'provider' | 'emergency' | 'research';
  metadata: {
    createdBy: string;
    createdAt: string;
    lastAccessed?: string;
    accessCount: number;
    checksum: string;
  };
}

export interface AccessRequest {
  requestId: string;
  dataRecordId: string;
  requestedBy: string;
  requestedRole: 'patient' | 'provider' | 'emergency' | 'researcher';
  keyFragments: {
    patientKey?: string;
    providerKey?: string;
    emergencyKey?: string;
  };
  purpose: string;
  timestamp: string;
}

export interface AuditLog {
  logId: string;
  action: 'create' | 'access' | 'modify' | 'delete' | 'share';
  dataRecordId: string;
  userId: string;
  userRole: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details?: any;
}

export class SecureDataAccessService {
  
  /**
   * Generate a new split-key set for a patient
   */
  static generateSplitKeys(patientId: string, providerId: string): SplitKeyPair {
    const keyId = crypto.randomBytes(16).toString('hex');
    
    // Generate master key (256-bit)
    const masterKey = crypto.randomBytes(32);
    
    // Split master key into 3 fragments using XOR splitting
    const patientFragment = crypto.randomBytes(32);
    const providerFragment = crypto.randomBytes(32);
    const systemFragment = Buffer.alloc(32);
    
    // XOR operation to ensure all three keys are needed
    for (let i = 0; i < 32; i++) {
      systemFragment[i] = masterKey[i] ^ patientFragment[i] ^ providerFragment[i];
    }
    
    return {
      patientKey: patientFragment.toString('hex'),
      providerKey: providerFragment.toString('hex'),
      systemKey: systemFragment.toString('hex'),
      keyId,
      createdAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString() // 1 year
    };
  }

  /**
   * Reconstruct master key from split fragments
   */
  static reconstructMasterKey(
    patientKey: string, 
    providerKey: string, 
    systemKey: string
  ): Buffer {
    const patientFragment = Buffer.from(patientKey, 'hex');
    const providerFragment = Buffer.from(providerKey, 'hex');
    const systemFragment = Buffer.from(systemKey, 'hex');
    
    const masterKey = Buffer.alloc(32);
    
    // XOR all fragments to reconstruct master key
    for (let i = 0; i < 32; i++) {
      masterKey[i] = patientFragment[i] ^ providerFragment[i] ^ systemFragment[i];
    }
    
    return masterKey;
  }

  /**
   * Encrypt sensitive healthcare data
   */
  static encryptHealthcareData(data: any, masterKey: Buffer): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, masterKey);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    // Combine IV, auth tag, and encrypted data
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt healthcare data
   */
  static decryptHealthcareData(encryptedData: string, masterKey: Buffer): any {
    try {
      const algorithm = 'aes-256-gcm';
      const parts = encryptedData.split(':');
      
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(algorithm, masterKey);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data: Invalid key or corrupted data');
    }
  }

  /**
   * Store encrypted data on blockchain with immutability
   */
  static async storeSecureData(
    patientId: string,
    dataType: SecureDataRecord['dataType'],
    data: any,
    splitKeys: SplitKeyPair,
    createdBy: string,
    accessLevel: SecureDataRecord['accessLevel'] = 'provider'
  ): Promise<SecureDataRecord> {
    
    // Reconstruct master key for encryption
    const masterKey = this.reconstructMasterKey(
      splitKeys.patientKey,
      splitKeys.providerKey,
      splitKeys.systemKey
    );
    
    // Encrypt the data
    const encryptedData = this.encryptHealthcareData(data, masterKey);
    
    // Generate data checksum for integrity verification
    const checksum = crypto.createHash('sha256')
      .update(JSON.stringify(data))
      .digest('hex');
    
    const recordId = crypto.randomBytes(16).toString('hex');
    const timestamp = new Date().toISOString();
    
    const record: SecureDataRecord = {
      id: recordId,
      patientId,
      dataType,
      encryptedData,
      keyId: splitKeys.keyId,
      blockchainHash: '', // Will be set after blockchain storage
      accessLevel,
      metadata: {
        createdBy,
        createdAt: timestamp,
        accessCount: 0,
        checksum
      }
    };
    
    // Store on blockchain for immutability
    const blockchainHash = await BlockchainService.storeHealthRecord({
      id: recordId,
      patientId,
      date: timestamp.split('T')[0],
      type: dataType,
      title: `Secure ${dataType.replace('_', ' ')}`,
      description: `Encrypted healthcare data with split-key access control`,
      doctor: createdBy,
      status: 'completed',
      blockchainHash: '',
      metadata: {
        encrypted: true,
        keyId: splitKeys.keyId,
        accessLevel,
        checksum
      },
      createdAt: timestamp,
      updatedAt: timestamp
    });
    
    record.blockchainHash = blockchainHash;
    
    // Log the creation
    await this.createAuditLog({
      logId: crypto.randomBytes(16).toString('hex'),
      action: 'create',
      dataRecordId: recordId,
      userId: createdBy,
      userRole: 'provider',
      timestamp,
      success: true,
      details: {
        dataType,
        accessLevel,
        keyId: splitKeys.keyId
      }
    });
    
    return record;
  }

  /**
   * Secure data retrieval with access validation
   */
  static async retrieveSecureData(
    accessRequest: AccessRequest,
    splitKeys: Partial<SplitKeyPair>,
    systemKey: string
  ): Promise<{ data: any; auditLog: AuditLog }> {
    
    const timestamp = new Date().toISOString();
    let auditLog: AuditLog;
    
    try {
      // Validate access request
      const isAuthorized = await this.validateAccess(accessRequest);
      
      if (!isAuthorized) {
        auditLog = await this.createAuditLog({
          logId: crypto.randomBytes(16).toString('hex'),
          action: 'access',
          dataRecordId: accessRequest.dataRecordId,
          userId: accessRequest.requestedBy,
          userRole: accessRequest.requestedRole,
          timestamp,
          success: false,
          details: { reason: 'Unauthorized access attempt' }
        });
        
        throw new Error('Access denied: Insufficient permissions');
      }
      
      // Get required key fragments based on access level
      const requiredKeys = this.getRequiredKeyFragments(accessRequest.requestedRole);
      
      // Validate that all required key fragments are provided
      for (const keyType of requiredKeys) {
        if (!accessRequest.keyFragments[keyType] && keyType !== 'systemKey') {
          auditLog = await this.createAuditLog({
            logId: crypto.randomBytes(16).toString('hex'),
            action: 'access',
            dataRecordId: accessRequest.dataRecordId,
            userId: accessRequest.requestedBy,
            userRole: accessRequest.requestedRole,
            timestamp,
            success: false,
            details: { reason: `Missing ${keyType} fragment` }
          });
          
          throw new Error(`Access denied: Missing ${keyType} fragment`);
        }
      }
      
      // Reconstruct master key
      const masterKey = this.reconstructMasterKey(
        accessRequest.keyFragments.patientKey || splitKeys.patientKey!,
        accessRequest.keyFragments.providerKey || splitKeys.providerKey!,
        systemKey
      );
      
      // Retrieve and decrypt data (this would fetch from your database)
      const encryptedRecord = await this.getEncryptedRecord(accessRequest.dataRecordId);
      const decryptedData = this.decryptHealthcareData(encryptedRecord.encryptedData, masterKey);
      
      // Verify data integrity
      const dataChecksum = crypto.createHash('sha256')
        .update(JSON.stringify(decryptedData))
        .digest('hex');
      
      if (dataChecksum !== encryptedRecord.metadata.checksum) {
        throw new Error('Data integrity check failed');
      }
      
      // Update access metadata
      await this.updateAccessMetadata(accessRequest.dataRecordId);
      
      // Create successful audit log
      auditLog = await this.createAuditLog({
        logId: crypto.randomBytes(16).toString('hex'),
        action: 'access',
        dataRecordId: accessRequest.dataRecordId,
        userId: accessRequest.requestedBy,
        userRole: accessRequest.requestedRole,
        timestamp,
        success: true,
        details: {
          purpose: accessRequest.purpose,
          keyFragmentsUsed: Object.keys(accessRequest.keyFragments)
        }
      });
      
      return { data: decryptedData, auditLog };
      
    } catch (error) {
      if (!auditLog!) {
        auditLog = await this.createAuditLog({
          logId: crypto.randomBytes(16).toString('hex'),
          action: 'access',
          dataRecordId: accessRequest.dataRecordId,
          userId: accessRequest.requestedBy,
          userRole: accessRequest.requestedRole,
          timestamp,
          success: false,
          details: { error: error.message }
        });
      }
      
      throw error;
    }
  }

  /**
   * Validate access permissions based on role and data sensitivity
   */
  static async validateAccess(accessRequest: AccessRequest): Promise<boolean> {
    // Implement role-based access control logic
    const accessMatrix = {
      'patient': ['medical_history', 'lab_result'],
      'provider': ['medical_history', 'ai_report', 'assessment', 'lab_result'],
      'emergency': ['medical_history', 'assessment'],
      'researcher': ['ai_report'] // Only anonymized data
    };
    
    const record = await this.getEncryptedRecord(accessRequest.dataRecordId);
    const allowedDataTypes = accessMatrix[accessRequest.requestedRole] || [];
    
    return allowedDataTypes.includes(record.dataType);
  }

  /**
   * Get required key fragments based on user role
   */
  static getRequiredKeyFragments(role: string): string[] {
    const keyRequirements = {
      'patient': ['patientKey', 'systemKey'],
      'provider': ['patientKey', 'providerKey', 'systemKey'],
      'emergency': ['emergencyKey', 'systemKey'],
      'researcher': ['providerKey', 'systemKey']
    };
    
    return keyRequirements[role] || ['patientKey', 'providerKey', 'systemKey'];
  }

  /**
   * Create audit log entry
   */
  static async createAuditLog(auditData: AuditLog): Promise<AuditLog> {
    // Store audit log on blockchain for immutability
    const auditLogHash = await BlockchainService.storeHealthRecord({
      id: auditData.logId,
      patientId: 'AUDIT_LOG',
      date: auditData.timestamp.split('T')[0],
      type: 'audit',
      title: `Audit Log: ${auditData.action}`,
      description: `Security audit log entry`,
      doctor: 'SYSTEM',
      status: 'completed',
      blockchainHash: '',
      metadata: auditData,
      createdAt: auditData.timestamp,
      updatedAt: auditData.timestamp
    });
    
    // Also store in database for quick queries
    console.log(`Audit Log Created: ${auditData.action} by ${auditData.userId} at ${auditData.timestamp}`);
    
    return auditData;
  }

  /**
   * Get encrypted record from Neon database
   */
  static async getEncryptedRecord(recordId: string): Promise<SecureDataRecord> {
    const { NeonDatabaseService } = await import('./neonDatabase');
    const record = await NeonDatabaseService.getSecureRecord(recordId);

    if (!record) {
      throw new Error('Record not found');
    }

    return record;
  }

  /**
   * Update access metadata
   */
  static async updateAccessMetadata(recordId: string): Promise<void> {
    const { NeonDatabaseService } = await import('./neonDatabase');
    await NeonDatabaseService.updateAccessMetadata(recordId);
  }

  /**
   * Generate emergency access key
   */
  static generateEmergencyKey(patientId: string, providerId: string): string {
    const emergencyData = `EMERGENCY:${patientId}:${providerId}:${Date.now()}`;
    return crypto.createHash('sha256').update(emergencyData).digest('hex');
  }

  /**
   * Revoke access by rotating keys
   */
  static async revokeAccess(keyId: string, reason: string): Promise<SplitKeyPair> {
    // Generate new split keys
    const newKeys = this.generateSplitKeys('patient', 'provider');
    
    // Log the key rotation
    await this.createAuditLog({
      logId: crypto.randomBytes(16).toString('hex'),
      action: 'modify',
      dataRecordId: keyId,
      userId: 'SYSTEM',
      userRole: 'system',
      timestamp: new Date().toISOString(),
      success: true,
      details: {
        action: 'key_rotation',
        reason,
        oldKeyId: keyId,
        newKeyId: newKeys.keyId
      }
    });
    
    return newKeys;
  }

  /**
   * Verify blockchain integrity of stored data
   */
  static async verifyDataIntegrity(recordId: string): Promise<boolean> {
    try {
      const record = await this.getEncryptedRecord(recordId);
      return BlockchainService.verifyBlockchainIntegrity(record.blockchainHash);
    } catch (error) {
      return false;
    }
  }
}
