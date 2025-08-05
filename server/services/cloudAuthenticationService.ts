import { EnhancedUserAuthenticationService } from "./enhancedUserAuthentication";
import { SecureCloudStorageService } from "./secureCloudStorage";
import crypto from "crypto";

/**
 * Cloud-Integrated Authentication Service
 * Extends enhanced authentication with secure cloud storage capabilities
 */

export interface UserDataAccess {
  userId: string;
  username: string;
  hasCloudAccess: boolean;
  encryptionLevel: 'basic' | 'enhanced' | 'enterprise';
  dataLocation: 'local' | 'cloud' | 'hybrid';
  permissions: string[];
}

export interface CloudHealthRecord {
  id: string;
  recordType: string;
  encryptedData: boolean;
  cloudSynced: boolean;
  lastModified: Date;
  accessLog: {
    timestamp: Date;
    action: string;
    userAgent?: string;
    ipAddress?: string;
  }[];
}

export class CloudAuthenticationService extends EnhancedUserAuthenticationService {
  private static cloudInitialized = false;

  /**
   * Initialize cloud authentication service
   */
  static async initialize(): Promise<void> {
    try {
      console.log("🌥️ Initializing cloud authentication service...");

      // Initialize base authentication
      await super.initialize();

      // Initialize cloud storage
      await SecureCloudStorageService.initialize({
        provider: 'aws',
        region: process.env.AWS_REGION || 'us-east-1',
        bucketName: process.env.CLOUD_STORAGE_BUCKET || 'healthchain-secure-data',
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
      });

      this.cloudInitialized = true;
      console.log("✅ Cloud authentication service initialized successfully");
    } catch (error) {
      console.error("❌ Cloud authentication initialization failed:", error);
      console.log("⚠️ Continuing with local authentication only");
    }
  }

  /**
   * Enhanced user registration with cloud storage setup
   */
  static async registerUser(
    username: string,
    password: string,
    email?: string,
    profile?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
      phone?: string;
    }
  ): Promise<any> {
    try {
      // Perform standard registration
      const result = await super.registerUser(username, password, email, profile);
      
      if (result.success && result.user) {
        // Set up user's cloud storage space
        await this.setupUserCloudSpace(result.user.id, username);
        
        // Log the cloud setup
        await this.logDataAccess(
          result.user.id, 
          'cloud_setup', 
          'user_registration', 
          null, 
          null, 
          true
        );

        // Enhanced result with cloud information
        return {
          ...result,
          cloudStorage: {
            enabled: this.cloudInitialized,
            encrypted: true,
            userIsolated: true,
            provider: 'aws-s3'
          }
        };
      }

      return result;
    } catch (error) {
      console.error("❌ Cloud registration failed:", error);
      return await super.registerUser(username, password, email, profile);
    }
  }

  /**
   * Enhanced authentication with cloud access validation
   */
  static async authenticateUser(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<any> {
    try {
      // Perform standard authentication
      const result = await super.authenticateUser(username, password, ipAddress, userAgent);
      
      if (result.success && result.user) {
        // Get user's cloud access information
        const cloudAccess = await this.getUserCloudAccess(result.user.id);
        
        // Enhanced result with cloud access info
        return {
          ...result,
          cloudAccess: {
            hasCloudStorage: this.cloudInitialized,
            dataLocation: cloudAccess.dataLocation,
            encryptionLevel: cloudAccess.encryptionLevel,
            permissions: cloudAccess.permissions
          }
        };
      }

      return result;
    } catch (error) {
      console.error("❌ Cloud authentication failed:", error);
      return await super.authenticateUser(username, password, ipAddress, userAgent);
    }
  }

  /**
   * Store health record with cloud encryption and user isolation
   */
  static async storeHealthRecord(
    sessionToken: string,
    healthRecord: {
      type: string;
      data: any;
      timestamp?: string;
    }
  ): Promise<{ success: boolean; recordId?: string; message?: string; cloudInfo?: any }> {
    try {
      const session = await this.verifySession(sessionToken);
      if (!session.valid || !session.user) {
        return { success: false, message: "Invalid session" };
      }

      const recordId = crypto.randomBytes(16).toString("hex");
      const userId = session.user.id;
      const username = session.user.username;

      // Prepare health record with metadata
      const enhancedRecord = {
        id: recordId,
        recordType: healthRecord.type,
        patientId: username,
        ...healthRecord.data,
        timestamp: healthRecord.timestamp || new Date().toISOString(),
        encryptionLevel: 'enterprise',
        userIsolated: true,
        cloudEnabled: this.cloudInitialized
      };

      let cloudResult = null;
      let localResult = false;

      // Store in cloud with encryption and user isolation
      if (this.cloudInitialized) {
        try {
          cloudResult = await SecureCloudStorageService.storeHealthRecord(
            userId,
            recordId,
            enhancedRecord
          );
          console.log(`✅ Health record stored in cloud for user ${username}`);
        } catch (cloudError) {
          console.error("❌ Cloud storage failed:", cloudError);
        }
      }

      // Also store locally (as backup and for offline access)
      try {
        localResult = await this.storeLocalHealthRecord(userId, recordId, enhancedRecord);
      } catch (localError) {
        console.error("❌ Local storage failed:", localError);
      }

      // Log the data access
      await this.logDataAccess(
        userId,
        'store_health_record',
        'medical_record',
        recordId,
        null,
        cloudResult?.success || localResult
      );

      const success = cloudResult?.success || localResult;
      const message = cloudResult?.success 
        ? "Health record stored securely in encrypted cloud storage"
        : localResult 
        ? "Health record stored locally (cloud unavailable)"
        : "Failed to store health record";

      return {
        success,
        recordId: success ? recordId : undefined,
        message,
        cloudInfo: {
          cloudStored: cloudResult?.success || false,
          localBackup: localResult,
          encrypted: true,
          userIsolated: true,
          cloudPath: cloudResult?.cloudPath
        }
      };
    } catch (error) {
      console.error("❌ Failed to store health record:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Storage failed"
      };
    }
  }

  /**
   * Get health records with cloud sync and user isolation
   */
  static async getHealthRecords(sessionToken: string): Promise<{
    success: boolean;
    records?: any[];
    message?: string;
    cloudInfo?: any;
  }> {
    try {
      const session = await this.verifySession(sessionToken);
      if (!session.valid || !session.user) {
        return { success: false, message: "Invalid session" };
      }

      const userId = session.user.id;
      const username = session.user.username;

      let cloudRecords: any[] = [];
      let localRecords: any[] = [];
      let cloudInfo = {
        cloudAvailable: this.cloudInitialized,
        cloudRecords: 0,
        localRecords: 0,
        syncStatus: 'unknown' as 'synced' | 'partial' | 'local-only' | 'unknown'
      };

      // Get records from cloud storage (user-isolated and encrypted)
      if (this.cloudInitialized) {
        try {
          const cloudResult = await SecureCloudStorageService.getHealthRecords(userId);
          if (cloudResult.success && cloudResult.records) {
            cloudRecords = cloudResult.records;
            cloudInfo.cloudRecords = cloudRecords.length;
            console.log(`✅ Retrieved ${cloudRecords.length} encrypted records from cloud for user ${username}`);
          }
        } catch (cloudError) {
          console.error("❌ Failed to retrieve from cloud:", cloudError);
        }
      }

      // Get local records as backup
      try {
        const localResult = await this.getLocalHealthRecords(username);
        if (localResult.success && localResult.records) {
          localRecords = localResult.records;
          cloudInfo.localRecords = localRecords.length;
        }
      } catch (localError) {
        console.error("❌ Failed to retrieve local records:", localError);
      }

      // Merge records (cloud takes priority)
      const allRecords = this.mergeHealthRecords(cloudRecords, localRecords);

      // Determine sync status
      if (cloudInfo.cloudRecords > 0 && cloudInfo.localRecords > 0) {
        cloudInfo.syncStatus = cloudInfo.cloudRecords === cloudInfo.localRecords ? 'synced' : 'partial';
      } else if (cloudInfo.cloudRecords > 0) {
        cloudInfo.syncStatus = 'synced';
      } else {
        cloudInfo.syncStatus = 'local-only';
      }

      // Log data access
      await this.logDataAccess(
        userId,
        'get_health_records',
        'medical_record',
        null,
        null,
        true
      );

      return {
        success: true,
        records: allRecords,
        message: `Retrieved ${allRecords.length} health records (${cloudInfo.cloudRecords} from cloud, ${cloudInfo.localRecords} local)`,
        cloudInfo
      };
    } catch (error) {
      console.error("❌ Failed to retrieve health records:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Retrieval failed"
      };
    }
  }

  /**
   * Sync user data to cloud
   */
  static async syncUserDataToCloud(sessionToken: string): Promise<{
    success: boolean;
    syncInfo?: any;
    message?: string;
  }> {
    try {
      const session = await this.verifySession(sessionToken);
      if (!session.valid || !session.user) {
        return { success: false, message: "Invalid session" };
      }

      if (!this.cloudInitialized) {
        return { success: false, message: "Cloud storage not available" };
      }

      const userId = session.user.id;
      const username = session.user.username;

      console.log(`🔄 Syncing data to cloud for user ${username}...`);

      const syncResult = await SecureCloudStorageService.syncToCloud(userId);

      // Log sync operation
      await this.logDataAccess(
        userId,
        'cloud_sync',
        'data_sync',
        null,
        null,
        syncResult.syncErrors.length === 0
      );

      return {
        success: syncResult.syncErrors.length === 0,
        syncInfo: {
          lastSync: syncResult.lastSync,
          totalCloudRecords: syncResult.totalCloudRecords,
          pendingUploads: syncResult.pendingUploads,
          errors: syncResult.syncErrors
        },
        message: syncResult.syncErrors.length === 0 
          ? `Successfully synced ${syncResult.totalCloudRecords} records to cloud`
          : `Sync completed with ${syncResult.syncErrors.length} errors`
      };
    } catch (error) {
      console.error("❌ Cloud sync failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Sync failed"
      };
    }
  }

  /**
   * Get user's cloud storage statistics
   */
  static async getUserCloudStats(sessionToken: string): Promise<{
    success: boolean;
    stats?: any;
    message?: string;
  }> {
    try {
      const session = await this.verifySession(sessionToken);
      if (!session.valid || !session.user) {
        return { success: false, message: "Invalid session" };
      }

      const userId = session.user.id;
      const stats = await SecureCloudStorageService.getStorageStats(userId);

      return {
        success: true,
        stats: {
          ...stats,
          encryption: 'AES-256-GCM',
          userIsolated: true,
          dataLocation: stats.isCloudAvailable ? 'cloud+local' : 'local-only'
        },
        message: "Storage statistics retrieved successfully"
      };
    } catch (error) {
      console.error("❌ Failed to get cloud stats:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Stats retrieval failed"
      };
    }
  }

  // Private helper methods

  private static async setupUserCloudSpace(userId: string, username: string): Promise<void> {
    try {
      if (!this.cloudInitialized) {
        console.log(`⚠️ Cloud not available for user ${username} setup`);
        return;
      }

      // Create user's cloud directory structure by storing a welcome record
      const welcomeRecord = {
        recordType: 'system',
        title: 'Welcome to HealthChain',
        description: 'Your secure, encrypted health data storage is now ready',
        date: new Date().toISOString().split('T')[0],
        metadata: {
          isWelcomeRecord: true,
          userSetup: true,
          encryptionEnabled: true
        }
      };

      await SecureCloudStorageService.storeHealthRecord(
        userId,
        `welcome-${Date.now()}`,
        welcomeRecord
      );

      console.log(`✅ Cloud space set up for user ${username}`);
    } catch (error) {
      console.error(`❌ Failed to set up cloud space for user ${username}:`, error);
    }
  }

  private static async getUserCloudAccess(userId: string): Promise<UserDataAccess> {
    try {
      const user = await this.getUserById(userId);
      if (!user) {
        throw new Error('User not found');
      }

      return {
        userId: user.id,
        username: user.username,
        hasCloudAccess: this.cloudInitialized,
        encryptionLevel: 'enterprise',
        dataLocation: this.cloudInitialized ? 'hybrid' : 'local',
        permissions: [
          'read:own_data',
          'write:own_data',
          'delete:own_data',
          'sync:cloud_storage'
        ]
      };
    } catch (error) {
      console.error('❌ Failed to get user cloud access:', error);
      return {
        userId,
        username: 'unknown',
        hasCloudAccess: false,
        encryptionLevel: 'basic',
        dataLocation: 'local',
        permissions: ['read:own_data']
      };
    }
  }

  private static async storeLocalHealthRecord(
    userId: string, 
    recordId: string, 
    record: any
  ): Promise<boolean> {
    try {
      // Store in SQLite database (existing functionality)
      const success = await this.storeMedicalRecord({
        id: recordId,
        patientId: record.patientId,
        recordType: record.recordType,
        title: record.title || `${record.recordType} - ${new Date().toLocaleDateString()}`,
        description: record.description || JSON.stringify(record),
        date: record.date || new Date().toISOString().split('T')[0],
        doctor: record.doctor || null,
        facility: record.facility || null,
        diagnosis: record.diagnosis || null,
        treatment: record.treatment || null,
        medications: record.medications || null,
        notes: record.notes || null,
        metadata: JSON.stringify({
          ...record.metadata,
          cloudEnabled: this.cloudInitialized,
          encryptionLevel: 'enterprise'
        }),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      });

      return success;
    } catch (error) {
      console.error('❌ Failed to store local health record:', error);
      return false;
    }
  }

  private static async getLocalHealthRecords(patientId: string): Promise<{
    success: boolean;
    records?: any[];
  }> {
    try {
      const records = await this.getMedicalRecords(patientId);
      return {
        success: true,
        records: records.map(record => ({
          ...record,
          source: 'local'
        }))
      };
    } catch (error) {
      console.error('❌ Failed to get local health records:', error);
      return { success: false };
    }
  }

  private static mergeHealthRecords(cloudRecords: any[], localRecords: any[]): any[] {
    const recordMap = new Map();
    
    // Cloud records take priority
    cloudRecords.forEach(record => {
      recordMap.set(record.id, {
        ...record,
        source: 'cloud',
        cloudSynced: true
      });
    });
    
    // Add local records if not in cloud
    localRecords.forEach(record => {
      if (!recordMap.has(record.id)) {
        recordMap.set(record.id, {
          ...record,
          source: 'local',
          cloudSynced: false
        });
      }
    });
    
    return Array.from(recordMap.values()).sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime();
    });
  }

  /**
   * Get system status including cloud integration
   */
  static getSystemStats(): any {
    const baseStats = super.getSystemStats();
    const cloudStatus = SecureCloudStorageService.getServiceStatus();

    return {
      ...baseStats,
      cloudStorage: {
        ...cloudStatus,
        userDataIsolation: true,
        encryptionAtRest: true,
        encryptionInTransit: true
      },
      features: {
        localStorage: true,
        cloudStorage: cloudStatus.isCloudAvailable,
        encryption: true,
        userIsolation: true,
        auditLogging: true,
        automaticSync: cloudStatus.isCloudAvailable
      }
    };
  }
}
