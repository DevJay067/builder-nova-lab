import { NeonDatabaseService } from './neonDatabase';

/**
 * Database Initialization Service
 * Sets up the secure healthcare data storage system
 */

export class DatabaseInitService {
  
  /**
   * Initialize the complete database schema for secure healthcare data
   */
  static async initializeSecureHealthcareDatabase(): Promise<void> {
    try {
      console.log('🚀 Starting secure healthcare database initialization...');
      
      // Initialize all database tables
      await NeonDatabaseService.initializeDatabase();
      
      // Add some sample data for demonstration
      await this.addSampleSecureData();
      
      console.log('✅ Secure healthcare database initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize database:', error);
      throw error;
    }
  }

  /**
   * Add sample secure data for demonstration
   */
  private static async addSampleSecureData(): Promise<void> {
    try {
      // Sample key store record
      const sampleKeyStore = {
        keyId: `demo-key-${Date.now()}`,
        patientId: 'default-patient',
        providerId: 'dr-smith-001',
        systemKeyEncrypted: 'encrypted-system-key-data',
        keyMetadata: {
          createdAt: new Date().toISOString(),
          expiresAt: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
          rotationCount: 0,
          status: 'active' as const
        }
      };
      
      await NeonDatabaseService.storeKeyRecord(sampleKeyStore);

      // Sample medical history record
      const sampleMedicalRecord = {
        id: `med-record-${Date.now()}`,
        patientId: 'default-patient',
        recordType: 'checkup',
        title: 'Annual Physical Examination',
        description: 'Routine annual checkup with blood work and vitals assessment',
        doctor: 'Dr. Sarah Johnson',
        date: new Date().toISOString().split('T')[0],
        metadata: {
          age: 28,
          gender: 'male',
          bloodType: 'A+',
          weight: 78,
          height: 175,
          systolicBP: 130,
          diastolicBP: 85,
          heartRate: 72,
          temperature: 36.7,
          medications: ['Lisinopril 10mg daily'],
          allergies: ['Penicillin', 'Shellfish'],
          chronicConditions: ['Mild Hypertension']
        }
      };

      await NeonDatabaseService.storeMedicalHistory(sampleMedicalRecord);

      // Sample audit log
      const sampleAuditLog = {
        logId: 'audit-001',
        action: 'create' as const,
        dataRecordId: 'med-record-001',
        userId: 'dr-smith-001',
        userRole: 'provider',
        timestamp: new Date().toISOString(),
        success: true,
        details: {
          action: 'sample_data_creation',
          recordType: 'medical_history',
          automated: true
        }
      };

      await NeonDatabaseService.storeAuditLog(sampleAuditLog);

      console.log('✅ Sample secure data added successfully');
    } catch (error) {
      console.error('❌ Error adding sample data:', error);
      // Don't throw here as this is just sample data
    }
  }

  /**
   * Check database connection and health
   */
  static async checkDatabaseHealth(): Promise<{
    connected: boolean;
    stats: any;
    timestamp: string;
  }> {
    try {
      const stats = await NeonDatabaseService.getDatabaseStats();
      
      return {
        connected: true,
        stats,
        timestamp: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Database health check failed:', error);
      return {
        connected: false,
        stats: null,
        timestamp: new Date().toISOString()
      };
    }
  }
}
