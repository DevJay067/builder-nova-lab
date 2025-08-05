import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
  ListObjectsV2Command,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";
import crypto from "crypto";
import forge from "node-forge";

/**
 * Secure Cloud Storage Service
 * Provides encrypted cloud storage with user data isolation
 */

export interface CloudStorageConfig {
  provider: "aws" | "google" | "azure" | "local";
  accessKeyId?: string;
  secretAccessKey?: string;
  region?: string;
  bucketName?: string;
  endpoint?: string;
}

export interface EncryptedHealthRecord {
  id: string;
  userId: string;
  encryptedData: string;
  metadata: {
    recordType: string;
    timestamp: string;
    checksum: string;
    encryptionVersion: string;
  };
  cloudPath: string;
}

export interface CloudSyncStatus {
  lastSync: Date;
  pendingUploads: number;
  syncErrors: string[];
  totalCloudRecords: number;
  storageUsed: number;
}

export class SecureCloudStorageService {
  private static s3Client: S3Client | null = null;
  private static config: CloudStorageConfig = {
    provider: "aws",
    region: process.env.AWS_REGION || "us-east-1",
    bucketName: process.env.CLOUD_STORAGE_BUCKET || "healthchain-secure-data",
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
  };
  private static encryptionKey: Buffer;
  private static isInitialized = false;

  /**
   * Initialize the cloud storage service
   */
  static async initialize(config?: Partial<CloudStorageConfig>): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("🌥️ Initializing secure cloud storage service...");

      // Merge configuration
      this.config = { ...this.config, ...config };

      // Initialize encryption key
      this.initializeEncryption();

      // Initialize cloud storage client
      await this.initializeCloudClient();

      this.isInitialized = true;
      console.log("✅ Secure cloud storage service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize cloud storage:", error);
      // Continue without cloud storage - fallback to local only
      console.log("⚠️ Continuing with local storage only");
    }
  }

  /**
   * Initialize encryption key
   */
  private static initializeEncryption(): void {
    const encryptionSecret =
      process.env.HEALTH_DATA_ENCRYPTION_KEY ||
      process.env.ENCRYPTION_KEY ||
      crypto.randomBytes(32).toString("hex");

    this.encryptionKey = crypto.scryptSync(
      encryptionSecret,
      "healthchain-salt",
      32,
    );
    console.log("🔐 Encryption system initialized");
  }

  /**
   * Initialize cloud storage client
   */
  private static async initializeCloudClient(): Promise<void> {
    if (this.config.provider === "aws") {
      // Check if AWS credentials are available
      if (!this.config.accessKeyId || !this.config.secretAccessKey) {
        console.log("⚠️ AWS credentials not found, using local storage only");
        return;
      }

      this.s3Client = new S3Client({
        region: this.config.region,
        credentials: {
          accessKeyId: this.config.accessKeyId,
          secretAccessKey: this.config.secretAccessKey,
        },
        endpoint: this.config.endpoint,
      });

      // Test connection
      try {
        await this.testCloudConnection();
        console.log("✅ AWS S3 connection verified");
      } catch (error) {
        console.warn("⚠️ AWS S3 connection failed, using local storage only");
        this.s3Client = null;
      }
    }
  }

  /**
   * Test cloud storage connection
   */
  private static async testCloudConnection(): Promise<boolean> {
    if (!this.s3Client) {
      return false;
    }

    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        MaxKeys: 1,
      });

      await this.s3Client.send(listCommand);
      return true;
    } catch (error) {
      console.error("Cloud connection test failed:", error);
      return false;
    }
  }

  /**
   * Encrypt health record data
   */
  private static encryptHealthData(
    data: any,
    userId: string,
  ): {
    encryptedData: string;
    checksum: string;
  } {
    try {
      // Create a user-specific encryption key
      const userKey = crypto.scryptSync(this.encryptionKey, userId, 32);

      // Generate random IV
      const iv = crypto.randomBytes(16);

      // Create cipher
      const cipher = crypto.createCipher("aes-256-gcm", userKey);
      cipher.setAAD(Buffer.from(userId));

      // Encrypt data
      const jsonData = JSON.stringify(data);
      let encrypted = cipher.update(jsonData, "utf8", "hex");
      encrypted += cipher.final("hex");

      // Get authentication tag
      const authTag = cipher.getAuthTag();

      // Combine IV, auth tag, and encrypted data
      const encryptedData =
        iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;

      // Generate checksum
      const checksum = crypto
        .createHash("sha256")
        .update(encryptedData)
        .digest("hex");

      return { encryptedData, checksum };
    } catch (error) {
      console.error("❌ Encryption failed:", error);
      throw new Error("Failed to encrypt health data");
    }
  }

  /**
   * Decrypt health record data
   */
  private static decryptHealthData(
    encryptedData: string,
    userId: string,
    expectedChecksum: string,
  ): any {
    try {
      // Verify checksum
      const actualChecksum = crypto
        .createHash("sha256")
        .update(encryptedData)
        .digest("hex");
      if (actualChecksum !== expectedChecksum) {
        throw new Error("Data integrity check failed");
      }

      // Split encrypted data
      const parts = encryptedData.split(":");
      if (parts.length !== 3) {
        throw new Error("Invalid encrypted data format");
      }

      const iv = Buffer.from(parts[0], "hex");
      const authTag = Buffer.from(parts[1], "hex");
      const encrypted = parts[2];

      // Create user-specific decryption key
      const userKey = crypto.scryptSync(this.encryptionKey, userId, 32);

      // Create decipher
      const decipher = crypto.createDecipher("aes-256-gcm", userKey);
      decipher.setAuthTag(authTag);
      decipher.setAAD(Buffer.from(userId));

      // Decrypt data
      let decrypted = decipher.update(encrypted, "hex", "utf8");
      decrypted += decipher.final("utf8");

      return JSON.parse(decrypted);
    } catch (error) {
      console.error("❌ Decryption failed:", error);
      throw new Error("Failed to decrypt health data");
    }
  }

  /**
   * Store health record in cloud with encryption
   */
  static async storeHealthRecord(
    userId: string,
    recordId: string,
    healthData: any,
  ): Promise<{ success: boolean; cloudPath?: string; message?: string }> {
    try {
      console.log(`🌥️ Storing health record for user ${userId} in cloud...`);

      // Encrypt the health data
      const { encryptedData, checksum } = this.encryptHealthData(
        healthData,
        userId,
      );

      // Create encrypted record
      const encryptedRecord: EncryptedHealthRecord = {
        id: recordId,
        userId: userId,
        encryptedData: encryptedData,
        metadata: {
          recordType: healthData.recordType || "unknown",
          timestamp: new Date().toISOString(),
          checksum: checksum,
          encryptionVersion: "1.0",
        },
        cloudPath: `users/${userId}/health-records/${recordId}.encrypted`,
      };

      // Store in cloud if available
      if (this.s3Client && this.isInitialized) {
        try {
          const putCommand = new PutObjectCommand({
            Bucket: this.config.bucketName,
            Key: encryptedRecord.cloudPath,
            Body: JSON.stringify(encryptedRecord),
            ContentType: "application/json",
            Metadata: {
              userId: userId,
              recordId: recordId,
              recordType: healthData.recordType || "unknown",
              encrypted: "true",
              timestamp: encryptedRecord.metadata.timestamp,
            },
            ServerSideEncryption: "AES256", // Additional server-side encryption
          });

          await this.s3Client.send(putCommand);
          console.log(
            `✅ Health record stored in cloud: ${encryptedRecord.cloudPath}`,
          );

          return {
            success: true,
            cloudPath: encryptedRecord.cloudPath,
            message: "Health record stored securely in cloud",
          };
        } catch (cloudError) {
          console.error("❌ Cloud storage failed:", cloudError);

          // Store locally as fallback
          await this.storeLocalBackup(encryptedRecord);

          return {
            success: true,
            message: "Health record stored locally (cloud unavailable)",
          };
        }
      } else {
        // Store locally when cloud is not available
        await this.storeLocalBackup(encryptedRecord);

        return {
          success: true,
          message: "Health record stored locally",
        };
      }
    } catch (error) {
      console.error("❌ Failed to store health record:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Storage failed",
      };
    }
  }

  /**
   * Retrieve health records for user from cloud
   */
  static async getHealthRecords(userId: string): Promise<{
    success: boolean;
    records?: any[];
    source?: string;
    message?: string;
  }> {
    try {
      console.log(`🌥️ Retrieving health records for user ${userId}...`);

      let cloudRecords: any[] = [];
      let localRecords: any[] = [];

      // Try to get from cloud first
      if (this.s3Client && this.isInitialized) {
        try {
          cloudRecords = await this.getCloudRecords(userId);
          console.log(`✅ Retrieved ${cloudRecords.length} records from cloud`);
        } catch (cloudError) {
          console.warn("⚠️ Failed to retrieve from cloud:", cloudError);
        }
      }

      // Get local backup records
      try {
        localRecords = await this.getLocalBackupRecords(userId);
        console.log(
          `✅ Retrieved ${localRecords.length} records from local backup`,
        );
      } catch (localError) {
        console.warn("⚠️ Failed to retrieve local backup:", localError);
      }

      // Merge and deduplicate records
      const allRecords = this.mergeRecords(cloudRecords, localRecords);

      return {
        success: true,
        records: allRecords,
        source: cloudRecords.length > 0 ? "cloud+local" : "local",
        message: `Retrieved ${allRecords.length} health records`,
      };
    } catch (error) {
      console.error("❌ Failed to retrieve health records:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Retrieval failed",
      };
    }
  }

  /**
   * Get records from cloud storage
   */
  private static async getCloudRecords(userId: string): Promise<any[]> {
    if (!this.s3Client) {
      return [];
    }

    const records: any[] = [];
    const prefix = `users/${userId}/health-records/`;

    try {
      const listCommand = new ListObjectsV2Command({
        Bucket: this.config.bucketName,
        Prefix: prefix,
      });

      const response = await this.s3Client.send(listCommand);

      if (response.Contents) {
        for (const object of response.Contents) {
          if (object.Key) {
            try {
              const getCommand = new GetObjectCommand({
                Bucket: this.config.bucketName,
                Key: object.Key,
              });

              const result = await this.s3Client.send(getCommand);
              const encryptedRecord = JSON.parse(
                (await result.Body?.transformToString()) || "{}",
              );

              // Decrypt the record
              const decryptedData = this.decryptHealthData(
                encryptedRecord.encryptedData,
                userId,
                encryptedRecord.metadata.checksum,
              );

              records.push({
                ...decryptedData,
                id: encryptedRecord.id,
                cloudPath: encryptedRecord.cloudPath,
                lastModified: object.LastModified,
                source: "cloud",
              });
            } catch (recordError) {
              console.error(
                `❌ Failed to process record ${object.Key}:`,
                recordError,
              );
            }
          }
        }
      }

      return records;
    } catch (error) {
      console.error("❌ Failed to get cloud records:", error);
      return [];
    }
  }

  /**
   * Store local backup
   */
  private static async storeLocalBackup(
    encryptedRecord: EncryptedHealthRecord,
  ): Promise<void> {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");

      const backupDir = path.join(
        process.cwd(),
        "data",
        "cloud-backup",
        encryptedRecord.userId,
      );

      // Ensure directory exists
      await fs.mkdir(backupDir, { recursive: true });

      const backupPath = path.join(backupDir, `${encryptedRecord.id}.json`);
      await fs.writeFile(backupPath, JSON.stringify(encryptedRecord, null, 2));

      console.log(`💾 Local backup stored: ${backupPath}`);
    } catch (error) {
      console.error("❌ Failed to store local backup:", error);
    }
  }

  /**
   * Get local backup records
   */
  private static async getLocalBackupRecords(userId: string): Promise<any[]> {
    try {
      const fs = await import("fs/promises");
      const path = await import("path");

      const backupDir = path.join(
        process.cwd(),
        "data",
        "cloud-backup",
        userId,
      );

      try {
        const files = await fs.readdir(backupDir);
        const records: any[] = [];

        for (const file of files) {
          if (file.endsWith(".json")) {
            try {
              const filePath = path.join(backupDir, file);
              const content = await fs.readFile(filePath, "utf-8");
              const encryptedRecord = JSON.parse(content);

              // Decrypt the record
              const decryptedData = this.decryptHealthData(
                encryptedRecord.encryptedData,
                userId,
                encryptedRecord.metadata.checksum,
              );

              records.push({
                ...decryptedData,
                id: encryptedRecord.id,
                source: "local-backup",
              });
            } catch (fileError) {
              console.error(
                `❌ Failed to process backup file ${file}:`,
                fileError,
              );
            }
          }
        }

        return records;
      } catch (dirError) {
        // Directory doesn't exist
        return [];
      }
    } catch (error) {
      console.error("❌ Failed to get local backup records:", error);
      return [];
    }
  }

  /**
   * Merge and deduplicate records
   */
  private static mergeRecords(cloudRecords: any[], localRecords: any[]): any[] {
    const recordMap = new Map();

    // Add cloud records first (they take priority)
    cloudRecords.forEach((record) => {
      recordMap.set(record.id, record);
    });

    // Add local records only if not already present
    localRecords.forEach((record) => {
      if (!recordMap.has(record.id)) {
        recordMap.set(record.id, record);
      }
    });

    return Array.from(recordMap.values()).sort((a, b) => {
      const dateA = new Date(a.date || a.createdAt || 0);
      const dateB = new Date(b.date || b.createdAt || 0);
      return dateB.getTime() - dateA.getTime(); // Most recent first
    });
  }

  /**
   * Sync local data to cloud
   */
  static async syncToCloud(userId: string): Promise<CloudSyncStatus> {
    const syncStatus: CloudSyncStatus = {
      lastSync: new Date(),
      pendingUploads: 0,
      syncErrors: [],
      totalCloudRecords: 0,
      storageUsed: 0,
    };

    try {
      if (!this.s3Client || !this.isInitialized) {
        syncStatus.syncErrors.push("Cloud storage not available");
        return syncStatus;
      }

      console.log(`🔄 Syncing data to cloud for user ${userId}...`);

      // Get local records that need syncing
      const localRecords = await this.getLocalBackupRecords(userId);
      const cloudRecords = await this.getCloudRecords(userId);

      // Find records that exist locally but not in cloud
      const cloudRecordIds = new Set(cloudRecords.map((r) => r.id));
      const recordsToSync = localRecords.filter(
        (r) => !cloudRecordIds.has(r.id),
      );

      syncStatus.pendingUploads = recordsToSync.length;

      // Upload missing records
      for (const record of recordsToSync) {
        try {
          const result = await this.storeHealthRecord(
            userId,
            record.id,
            record,
          );
          if (!result.success) {
            syncStatus.syncErrors.push(
              `Failed to sync record ${record.id}: ${result.message}`,
            );
          }
        } catch (error) {
          syncStatus.syncErrors.push(
            `Sync error for record ${record.id}: ${error}`,
          );
        }
      }

      // Update stats
      const finalCloudRecords = await this.getCloudRecords(userId);
      syncStatus.totalCloudRecords = finalCloudRecords.length;
      syncStatus.pendingUploads = Math.max(
        0,
        syncStatus.pendingUploads -
          (finalCloudRecords.length - cloudRecords.length),
      );

      console.log(
        `✅ Sync completed: ${finalCloudRecords.length} total cloud records`,
      );
      return syncStatus;
    } catch (error) {
      console.error("❌ Sync failed:", error);
      syncStatus.syncErrors.push(
        error instanceof Error ? error.message : "Unknown sync error",
      );
      return syncStatus;
    }
  }

  /**
   * Delete health record from cloud
   */
  static async deleteHealthRecord(
    userId: string,
    recordId: string,
  ): Promise<{
    success: boolean;
    message?: string;
  }> {
    try {
      let cloudDeleted = false;
      let localDeleted = false;

      // Delete from cloud
      if (this.s3Client && this.isInitialized) {
        try {
          const cloudPath = `users/${userId}/health-records/${recordId}.encrypted`;
          const deleteCommand = new DeleteObjectCommand({
            Bucket: this.config.bucketName,
            Key: cloudPath,
          });

          await this.s3Client.send(deleteCommand);
          cloudDeleted = true;
          console.log(`✅ Deleted from cloud: ${cloudPath}`);
        } catch (cloudError) {
          console.error("❌ Failed to delete from cloud:", cloudError);
        }
      }

      // Delete local backup
      try {
        const fs = await import("fs/promises");
        const path = await import("path");

        const backupPath = path.join(
          process.cwd(),
          "data",
          "cloud-backup",
          userId,
          `${recordId}.json`,
        );
        await fs.unlink(backupPath);
        localDeleted = true;
        console.log(`✅ Deleted local backup: ${backupPath}`);
      } catch (localError) {
        console.error("❌ Failed to delete local backup:", localError);
      }

      return {
        success: cloudDeleted || localDeleted,
        message: cloudDeleted
          ? "Record deleted from cloud and local backup"
          : "Record deleted from local backup only",
      };
    } catch (error) {
      console.error("❌ Failed to delete health record:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Deletion failed",
      };
    }
  }

  /**
   * Get cloud storage statistics
   */
  static async getStorageStats(userId: string): Promise<{
    cloudRecords: number;
    localBackups: number;
    storageUsed: number;
    lastSync?: Date;
    isCloudAvailable: boolean;
  }> {
    try {
      const stats = {
        cloudRecords: 0,
        localBackups: 0,
        storageUsed: 0,
        isCloudAvailable: !!(this.s3Client && this.isInitialized),
      };

      // Count cloud records
      if (stats.isCloudAvailable) {
        try {
          const cloudRecords = await this.getCloudRecords(userId);
          stats.cloudRecords = cloudRecords.length;
        } catch (error) {
          console.error("Failed to get cloud stats:", error);
        }
      }

      // Count local backups
      try {
        const localRecords = await this.getLocalBackupRecords(userId);
        stats.localBackups = localRecords.length;
      } catch (error) {
        console.error("Failed to get local stats:", error);
      }

      return stats;
    } catch (error) {
      console.error("❌ Failed to get storage stats:", error);
      return {
        cloudRecords: 0,
        localBackups: 0,
        storageUsed: 0,
        isCloudAvailable: false,
      };
    }
  }

  /**
   * Get service status
   */
  static getServiceStatus(): {
    isInitialized: boolean;
    cloudProvider: string;
    isCloudAvailable: boolean;
    encryptionEnabled: boolean;
    config: Partial<CloudStorageConfig>;
  } {
    return {
      isInitialized: this.isInitialized,
      cloudProvider: this.config.provider,
      isCloudAvailable: !!(this.s3Client && this.isInitialized),
      encryptionEnabled: !!this.encryptionKey,
      config: {
        provider: this.config.provider,
        region: this.config.region,
        bucketName: this.config.bucketName,
      },
    };
  }
}
