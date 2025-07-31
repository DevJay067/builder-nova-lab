import { neon } from '@neondatabase/serverless';
import { SecureDataRecord, SplitKeyPair, AuditLog } from './secureDataAccess';
import { KeyStore, KeyDistribution, KeyRotationSchedule } from './keyManagement';

/**
 * Neon Database Integration for Secure Healthcare Data Storage
 * 
 * This service integrates with Neon PostgreSQL database to store
 * encrypted healthcare data with blockchain immutability.
 */

// Database connection
const sql = neon(process.env.DATABASE_URL || 'postgresql://misty-glitter-69745686-user:default@ep-empty-frog-a5lp6eyz.us-east-2.aws.neon.tech/misty-glitter-69745686-db?sslmode=require');

export class NeonDatabaseService {
  
  /**
   * Initialize database tables for secure data storage
   */
  static async initializeDatabase(): Promise<void> {
    try {
      // Create secure_data_records table
      await sql`
        CREATE TABLE IF NOT EXISTS secure_data_records (
          id VARCHAR(255) PRIMARY KEY,
          patient_id VARCHAR(255) NOT NULL,
          data_type VARCHAR(50) NOT NULL,
          encrypted_data TEXT NOT NULL,
          key_id VARCHAR(255) NOT NULL,
          blockchain_hash VARCHAR(255) UNIQUE NOT NULL,
          access_level VARCHAR(50) NOT NULL DEFAULT 'provider',
          created_by VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          access_count INTEGER DEFAULT 0,
          last_accessed TIMESTAMP,
          checksum VARCHAR(255) NOT NULL,
          INDEX idx_patient_id (patient_id),
          INDEX idx_key_id (key_id),
          INDEX idx_blockchain_hash (blockchain_hash)
        )
      `;

      // Create key_store table
      await sql`
        CREATE TABLE IF NOT EXISTS key_store (
          key_id VARCHAR(255) PRIMARY KEY,
          patient_id VARCHAR(255) NOT NULL,
          provider_id VARCHAR(255) NOT NULL,
          system_key_encrypted TEXT NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP,
          rotation_count INTEGER DEFAULT 0,
          status VARCHAR(20) DEFAULT 'active',
          last_used TIMESTAMP,
          INDEX idx_patient_id (patient_id),
          INDEX idx_provider_id (provider_id),
          INDEX idx_status (status)
        )
      `;

      // Create key_distributions table
      await sql`
        CREATE TABLE IF NOT EXISTS key_distributions (
          distribution_id VARCHAR(255) PRIMARY KEY,
          key_id VARCHAR(255) NOT NULL,
          recipient_type VARCHAR(20) NOT NULL,
          recipient_id VARCHAR(255) NOT NULL,
          key_fragment_encrypted TEXT NOT NULL,
          delivery_method VARCHAR(50) NOT NULL,
          distributed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          acknowledged BOOLEAN DEFAULT false,
          acknowledged_at TIMESTAMP,
          INDEX idx_key_id (key_id),
          INDEX idx_recipient_id (recipient_id),
          FOREIGN KEY (key_id) REFERENCES key_store(key_id) ON DELETE CASCADE
        )
      `;

      // Create audit_logs table
      await sql`
        CREATE TABLE IF NOT EXISTS audit_logs (
          log_id VARCHAR(255) PRIMARY KEY,
          action VARCHAR(20) NOT NULL,
          data_record_id VARCHAR(255),
          user_id VARCHAR(255) NOT NULL,
          user_role VARCHAR(50) NOT NULL,
          timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent TEXT,
          success BOOLEAN NOT NULL,
          details JSONB,
          INDEX idx_data_record_id (data_record_id),
          INDEX idx_user_id (user_id),
          INDEX idx_timestamp (timestamp),
          INDEX idx_action (action)
        )
      `;

      // Create key_rotation_schedule table
      await sql`
        CREATE TABLE IF NOT EXISTS key_rotation_schedule (
          schedule_id VARCHAR(255) PRIMARY KEY,
          key_id VARCHAR(255) NOT NULL,
          scheduled_rotation_date TIMESTAMP NOT NULL,
          rotation_reason VARCHAR(50) NOT NULL,
          auto_rotate BOOLEAN DEFAULT true,
          notifications_sent JSONB DEFAULT '[]',
          completed BOOLEAN DEFAULT false,
          completed_at TIMESTAMP,
          INDEX idx_key_id (key_id),
          INDEX idx_scheduled_date (scheduled_rotation_date),
          INDEX idx_completed (completed),
          FOREIGN KEY (key_id) REFERENCES key_store(key_id) ON DELETE CASCADE
        )
      `;

      // Create medical_history table for traditional health records
      await sql`
        CREATE TABLE IF NOT EXISTS medical_history (
          id VARCHAR(255) PRIMARY KEY,
          patient_id VARCHAR(255) NOT NULL,
          record_type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          doctor VARCHAR(255),
          date DATE NOT NULL,
          metadata JSONB,
          secure_record_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          INDEX idx_patient_id (patient_id),
          INDEX idx_date (date),
          INDEX idx_record_type (record_type),
          FOREIGN KEY (secure_record_id) REFERENCES secure_data_records(id)
        )
      `;

      console.log('✅ Neon database tables initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing database:', error);
      throw error;
    }
  }

  /**
   * Store encrypted health record in Neon database
   */
  static async storeSecureRecord(record: SecureDataRecord): Promise<void> {
    try {
      await sql`
        INSERT INTO secure_data_records (
          id, patient_id, data_type, encrypted_data, key_id, 
          blockchain_hash, access_level, created_by, created_at, 
          updated_at, checksum
        ) VALUES (
          ${record.id}, ${record.patientId}, ${record.dataType}, 
          ${record.encryptedData}, ${record.keyId}, ${record.blockchainHash}, 
          ${record.accessLevel}, ${record.metadata.createdBy}, 
          ${record.metadata.createdAt}, ${record.metadata.createdAt}, 
          ${record.metadata.checksum}
        )
      `;
      
      console.log(`✅ Stored secure record: ${record.id}`);
    } catch (error) {
      console.error('❌ Error storing secure record:', error);
      throw error;
    }
  }

  /**
   * Retrieve encrypted health record from database
   */
  static async getSecureRecord(recordId: string): Promise<SecureDataRecord | null> {
    try {
      const result = await sql`
        SELECT * FROM secure_data_records WHERE id = ${recordId}
      `;

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        id: row.id,
        patientId: row.patient_id,
        dataType: row.data_type as SecureDataRecord['dataType'],
        encryptedData: row.encrypted_data,
        keyId: row.key_id,
        blockchainHash: row.blockchain_hash,
        accessLevel: row.access_level as SecureDataRecord['accessLevel'],
        metadata: {
          createdBy: row.created_by,
          createdAt: row.created_at,
          lastAccessed: row.last_accessed,
          accessCount: row.access_count,
          checksum: row.checksum
        }
      };
    } catch (error) {
      console.error('❌ Error retrieving secure record:', error);
      throw error;
    }
  }

  /**
   * Store key record in database
   */
  static async storeKeyRecord(keyStore: KeyStore): Promise<void> {
    try {
      await sql`
        INSERT INTO key_store (
          key_id, patient_id, provider_id, system_key_encrypted,
          created_at, expires_at, rotation_count, status
        ) VALUES (
          ${keyStore.keyId}, ${keyStore.patientId}, ${keyStore.providerId},
          ${keyStore.systemKeyEncrypted}, ${keyStore.keyMetadata.createdAt},
          ${keyStore.keyMetadata.expiresAt}, ${keyStore.keyMetadata.rotationCount},
          ${keyStore.keyMetadata.status}
        )
      `;
      
      console.log(`✅ Stored key record: ${keyStore.keyId}`);
    } catch (error) {
      console.error('❌ Error storing key record:', error);
      throw error;
    }
  }

  /**
   * Get key record from database
   */
  static async getKeyRecord(keyId: string): Promise<KeyStore | null> {
    try {
      const result = await sql`
        SELECT * FROM key_store WHERE key_id = ${keyId} AND status = 'active'
      `;

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      return {
        keyId: row.key_id,
        patientId: row.patient_id,
        providerId: row.provider_id,
        systemKeyEncrypted: row.system_key_encrypted,
        keyMetadata: {
          createdAt: row.created_at,
          expiresAt: row.expires_at,
          rotationCount: row.rotation_count,
          status: row.status,
          lastUsed: row.last_used
        }
      };
    } catch (error) {
      console.error('❌ Error retrieving key record:', error);
      throw error;
    }
  }

  /**
   * Store key distribution record
   */
  static async storeDistributionRecord(distribution: KeyDistribution): Promise<void> {
    try {
      await sql`
        INSERT INTO key_distributions (
          distribution_id, key_id, recipient_type, recipient_id,
          key_fragment_encrypted, delivery_method, distributed_at,
          acknowledged, acknowledged_at
        ) VALUES (
          ${distribution.distributionId}, ${distribution.keyId}, 
          ${distribution.recipientType}, ${distribution.recipientId},
          ${distribution.keyFragment}, ${distribution.deliveryMethod},
          ${distribution.distributedAt}, ${distribution.acknowledged},
          ${distribution.acknowledgedAt}
        )
      `;
      
      console.log(`✅ Stored distribution record: ${distribution.distributionId}`);
    } catch (error) {
      console.error('❌ Error storing distribution record:', error);
      throw error;
    }
  }

  /**
   * Store audit log in database
   */
  static async storeAuditLog(auditLog: AuditLog): Promise<void> {
    try {
      await sql`
        INSERT INTO audit_logs (
          log_id, action, data_record_id, user_id, user_role,
          timestamp, ip_address, user_agent, success, details
        ) VALUES (
          ${auditLog.logId}, ${auditLog.action}, ${auditLog.dataRecordId},
          ${auditLog.userId}, ${auditLog.userRole}, ${auditLog.timestamp},
          ${auditLog.ipAddress}, ${auditLog.userAgent}, ${auditLog.success},
          ${JSON.stringify(auditLog.details)}
        )
      `;
      
      console.log(`✅ Stored audit log: ${auditLog.logId}`);
    } catch (error) {
      console.error('❌ Error storing audit log:', error);
      throw error;
    }
  }

  /**
   * Get audit logs for a record
   */
  static async getAuditLogs(recordId: string, limit: number = 50, offset: number = 0): Promise<AuditLog[]> {
    try {
      const result = await sql`
        SELECT * FROM audit_logs 
        WHERE data_record_id = ${recordId} 
        ORDER BY timestamp DESC 
        LIMIT ${limit} OFFSET ${offset}
      `;

      return result.map(row => ({
        logId: row.log_id,
        action: row.action,
        dataRecordId: row.data_record_id,
        userId: row.user_id,
        userRole: row.user_role,
        timestamp: row.timestamp,
        ipAddress: row.ip_address,
        userAgent: row.user_agent,
        success: row.success,
        details: row.details
      }));
    } catch (error) {
      console.error('❌ Error retrieving audit logs:', error);
      throw error;
    }
  }

  /**
   * Update access metadata for a record
   */
  static async updateAccessMetadata(recordId: string): Promise<void> {
    try {
      await sql`
        UPDATE secure_data_records 
        SET access_count = access_count + 1, 
            last_accessed = CURRENT_TIMESTAMP 
        WHERE id = ${recordId}
      `;
      
      console.log(`✅ Updated access metadata for record: ${recordId}`);
    } catch (error) {
      console.error('❌ Error updating access metadata:', error);
      throw error;
    }
  }

  /**
   * Mark key as expired
   */
  static async markKeyExpired(keyId: string): Promise<void> {
    try {
      await sql`
        UPDATE key_store 
        SET status = 'expired' 
        WHERE key_id = ${keyId}
      `;
      
      console.log(`✅ Marked key as expired: ${keyId}`);
    } catch (error) {
      console.error('❌ Error marking key as expired:', error);
      throw error;
    }
  }

  /**
   * Update key usage timestamp
   */
  static async updateKeyUsage(keyId: string): Promise<void> {
    try {
      await sql`
        UPDATE key_store 
        SET last_used = CURRENT_TIMESTAMP 
        WHERE key_id = ${keyId}
      `;
      
      console.log(`✅ Updated key usage: ${keyId}`);
    } catch (error) {
      console.error('❌ Error updating key usage:', error);
      throw error;
    }
  }

  /**
   * Revoke key
   */
  static async revokeKey(keyId: string, reason: string): Promise<void> {
    try {
      await sql`
        UPDATE key_store 
        SET status = 'revoked' 
        WHERE key_id = ${keyId}
      `;
      
      console.log(`✅ Revoked key: ${keyId}, reason: ${reason}`);
    } catch (error) {
      console.error('❌ Error revoking key:', error);
      throw error;
    }
  }

  /**
   * Store rotation schedule
   */
  static async storeRotationSchedule(schedule: KeyRotationSchedule): Promise<void> {
    try {
      await sql`
        INSERT INTO key_rotation_schedule (
          schedule_id, key_id, scheduled_rotation_date, rotation_reason,
          auto_rotate, notifications_sent
        ) VALUES (
          ${schedule.scheduleId}, ${schedule.keyId}, 
          ${schedule.scheduledRotationDate}, ${schedule.rotationReason},
          ${schedule.autoRotate}, ${JSON.stringify(schedule.notificationsSent)}
        )
      `;
      
      console.log(`✅ Stored rotation schedule: ${schedule.scheduleId}`);
    } catch (error) {
      console.error('❌ Error storing rotation schedule:', error);
      throw error;
    }
  }

  /**
   * Get scheduled rotations
   */
  static async getScheduledRotations(date: Date): Promise<KeyRotationSchedule[]> {
    try {
      const result = await sql`
        SELECT * FROM key_rotation_schedule 
        WHERE scheduled_rotation_date <= ${date.toISOString()} 
        AND completed = false
        ORDER BY scheduled_rotation_date ASC
      `;

      return result.map(row => ({
        scheduleId: row.schedule_id,
        keyId: row.key_id,
        scheduledRotationDate: row.scheduled_rotation_date,
        rotationReason: row.rotation_reason,
        autoRotate: row.auto_rotate,
        notificationsSent: row.notifications_sent
      }));
    } catch (error) {
      console.error('❌ Error retrieving scheduled rotations:', error);
      throw error;
    }
  }

  /**
   * Mark rotation as completed
   */
  static async markRotationCompleted(scheduleId: string): Promise<void> {
    try {
      await sql`
        UPDATE key_rotation_schedule 
        SET completed = true, completed_at = CURRENT_TIMESTAMP 
        WHERE schedule_id = ${scheduleId}
      `;
      
      console.log(`✅ Marked rotation completed: ${scheduleId}`);
    } catch (error) {
      console.error('❌ Error marking rotation completed:', error);
      throw error;
    }
  }

  /**
   * Store medical history record (traditional format)
   */
  static async storeMedicalHistory(record: {
    id: string;
    patientId: string;
    recordType: string;
    title: string;
    description?: string;
    doctor?: string;
    date: string;
    metadata?: any;
    secureRecordId?: string;
  }): Promise<void> {
    try {
      await sql`
        INSERT INTO medical_history (
          id, patient_id, record_type, title, description, doctor,
          date, metadata, secure_record_id
        ) VALUES (
          ${record.id}, ${record.patientId}, ${record.recordType},
          ${record.title}, ${record.description}, ${record.doctor},
          ${record.date}, ${JSON.stringify(record.metadata)},
          ${record.secureRecordId}
        )
      `;
      
      console.log(`✅ Stored medical history record: ${record.id}`);
    } catch (error) {
      console.error('❌ Error storing medical history:', error);
      throw error;
    }
  }

  /**
   * Get medical history for a patient
   */
  static async getMedicalHistory(patientId: string): Promise<any[]> {
    try {
      const result = await sql`
        SELECT * FROM medical_history 
        WHERE patient_id = ${patientId} 
        ORDER BY date DESC, created_at DESC
      `;

      return result.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        recordType: row.record_type,
        title: row.title,
        description: row.description,
        doctor: row.doctor,
        date: row.date,
        metadata: row.metadata,
        secureRecordId: row.secure_record_id,
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error('❌ Error retrieving medical history:', error);
      throw error;
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<any> {
    try {
      const [secureRecords] = await sql`SELECT COUNT(*) as count FROM secure_data_records`;
      const [activeKeys] = await sql`SELECT COUNT(*) as count FROM key_store WHERE status = 'active'`;
      const [totalAuditLogs] = await sql`SELECT COUNT(*) as count FROM audit_logs`;
      const [scheduledRotations] = await sql`SELECT COUNT(*) as count FROM key_rotation_schedule WHERE completed = false`;

      return {
        secureRecords: secureRecords.count,
        activeKeys: activeKeys.count,
        auditLogs: totalAuditLogs.count,
        scheduledRotations: scheduledRotations.count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      return {
        secureRecords: 0,
        activeKeys: 0,
        auditLogs: 0,
        scheduledRotations: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}
