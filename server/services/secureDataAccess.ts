import crypto from "crypto";
import {
  SimpleSecureStorage,
  SplitKeyData,
} from "./simpleSecureStorage";
import { NeonDatabaseService } from "./neonDatabase";

/**
 * Secure Data Access System with Production Blockchain Integration
 *
 * This service provides secure data access using:
 * - User authentication with hash generation
 * - Split key cryptography (user hash + data hash)
 * - Production blockchain for immutable storage
 * - Automatic activation on user account creation
 */

export interface SecureDataRecord {
  id: string;
  patientId: string;
  dataType:
    | "medical_history"
    | "lab_results"
    | "prescription"
    | "imaging"
    | "emergency";
  encryptedData: string;
  keyId: string;
  blockchainHash: string;
  accessLevel: "patient" | "provider" | "emergency" | "research";
  metadata: {
    createdBy: string;
    createdAt: string;
    lastAccessed?: string;
    accessCount: number;
    checksum: string;
  };
}

export interface UserAccessCredentials {
  username: string;
  password: string;
  userHash: string;
  sessionToken?: string;
}

export interface DataAccessResult {
  success: boolean;
  data?: any;
  error?: string;
  accessLog: {
    timestamp: string;
    action: string;
    result: string;
  };
}

export interface SplitKeyPair {
  keyId: string;
  part1: string;
  part2: string;
  checksum: string;
  createdAt: string;
  expiresAt: string;
}

export interface AuditLog {
  logId: string;
  action: "create" | "read" | "update" | "delete" | "access_denied";
  dataRecordId?: string;
  userId: string;
  userRole: string;
  timestamp: string;
  ipAddress?: string;
  userAgent?: string;
  success: boolean;
  details: any;
}

class SecureDataAccessService {
  private static isInitialized = false;
  private static userSessions: Map<string, UserAccessCredentials> = new Map();
  private static splitKeyCache: Map<string, SplitKeyData> = new Map();

  /**
   * Initialize the secure data access system
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("🔐 Initializing secure data access system...");

      // Initialize simple secure storage
      SimpleSecureStorage.initializeBlockchain();

      // Validate blockchain integrity
      SimpleSecureStorage.validateBlockchain();

      this.isInitialized = true;
      console.log("✅ Secure data access system initialized successfully");
    } catch (error) {
      console.error(
        "❌ Failed to initialize secure data access system:",
        error,
      );
      throw error;
    }
  }

  /**
   * Create secure user account with automatic data access system activation
   */
  static async createSecureUserAccount(
    username: string,
    password: string,
    userProfile: {
      email?: string;
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    },
  ): Promise<{
    userHash: string;
    splitKeySystem: boolean;
    dataAccessActivated: boolean;
    sessionToken: string;
  }> {
    try {
      console.log(`🔐 Creating secure account for user: ${username}`);

      // Generate user hash
      const userHash = SimpleSecureStorage.generateUserHash(
        username,
        password,
      );

      // Create initial health record to activate split key system
      const initialHealthRecord = {
        patientId: userHash.substring(0, 16),
        type: "account_creation",
        data: {
          accountCreated: new Date().toISOString(),
          username: username,
          profile: userProfile,
          systemVersion: "1.0.0",
        },
        timestamp: new Date().toISOString(),
      };

      // Store in production blockchain with split key system
      const blockchainResult =
        await SimpleSecureStorage.storeSecureHealthRecord(
          initialHealthRecord,
          username,
          password,
        );

      // Store split key data in cache for quick access
      this.splitKeyCache.set(userHash, blockchainResult.splitKeyData);

      // Generate session token
      const sessionToken = this.generateSessionToken(userHash);

      // Store user session
      const userCredentials: UserAccessCredentials = {
        username,
        password: "", // Don't store password in session
        userHash,
        sessionToken,
      };
      this.userSessions.set(sessionToken, userCredentials);

      // Create audit log
      await this.createAuditLog({
        action: "create",
        dataRecordId: blockchainResult.transaction.id,
        userId: userHash,
        userRole: "patient",
        success: true,
        details: {
          action: "secure_account_creation",
          username: username,
          blockchainHash: blockchainResult.blockchainHash,
          splitKeySystemActivated: true,
        },
      });

      console.log(
        `✅ Secure account created for ${username} with split key system activated`,
      );

      return {
        userHash,
        splitKeySystem: true,
        dataAccessActivated: true,
        sessionToken,
      };
    } catch (error) {
      console.error("❌ Failed to create secure user account:", error);

      // Create failure audit log
      await this.createAuditLog({
        action: "create",
        userId: username,
        userRole: "patient",
        success: false,
        details: {
          action: "secure_account_creation_failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      throw error;
    }
  }

  /**
   * Authenticate user and establish secure session
   */
  static async authenticateUser(
    username: string,
    password: string,
  ): Promise<{
    authenticated: boolean;
    userHash?: string;
    sessionToken?: string;
    splitKeySystemActive?: boolean;
  }> {
    try {
      console.log(`🔐 Authenticating user: ${username}`);

      // Generate user hash
      const userHash = SimpleSecureStorage.generateUserHash(
        username,
        password,
      );

      // Check if user has data in blockchain (this verifies they exist)
      const hasData = await this.checkUserDataExists(userHash);

      if (!hasData) {
        await this.createAuditLog({
          action: "access_denied",
          userId: username,
          userRole: "unknown",
          success: false,
          details: {
            reason: "user_not_found",
            attempted_username: username,
          },
        });

        return { authenticated: false };
      }

      // Generate session token
      const sessionToken = this.generateSessionToken(userHash);

      // Store user session
      const userCredentials: UserAccessCredentials = {
        username,
        password: "", // Don't store password
        userHash,
        sessionToken,
      };
      this.userSessions.set(sessionToken, userCredentials);

      // Create successful authentication audit log
      await this.createAuditLog({
        action: "read",
        userId: userHash,
        userRole: "patient",
        success: true,
        details: {
          action: "user_authentication",
          username: username,
          sessionEstablished: true,
        },
      });

      console.log(`✅ User ${username} authenticated successfully`);

      return {
        authenticated: true,
        userHash,
        sessionToken,
        splitKeySystemActive: true,
      };
    } catch (error) {
      console.error("❌ Authentication failed:", error);

      await this.createAuditLog({
        action: "access_denied",
        userId: username,
        userRole: "unknown",
        success: false,
        details: {
          action: "authentication_failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return { authenticated: false };
    }
  }

  /**
   * Store secure health record with split key system
   */
  static async storeSecureHealthRecord(
    sessionToken: string,
    healthRecord: any,
  ): Promise<{
    success: boolean;
    recordId?: string;
    blockchainHash?: string;
    splitKeyReference?: string;
  }> {
    try {
      // Validate session
      const userCredentials = this.userSessions.get(sessionToken);
      if (!userCredentials) {
        throw new Error("Invalid session token");
      }

      console.log(
        `🔐 Storing secure health record for user: ${userCredentials.username}`,
      );

      // Get user password for encryption (in production, this should be handled more securely)
      // For now, we'll use a derived key from the user hash
      const derivedPassword = crypto
        .createHash("sha256")
        .update(userCredentials.userHash)
        .digest("hex");

      // Store in production blockchain
      const blockchainResult =
        await SimpleSecureStorage.storeSecureHealthRecord(
          healthRecord,
          userCredentials.username,
          derivedPassword,
        );

      // Update split key cache
      this.splitKeyCache.set(
        userCredentials.userHash,
        blockchainResult.splitKeyData,
      );

      // Create secure data record for database
      const secureRecord: SecureDataRecord = {
        id: blockchainResult.transaction.id,
        patientId: userCredentials.userHash.substring(0, 16),
        dataType: "medical_history",
        encryptedData: blockchainResult.transaction.encryptedPayload,
        keyId: blockchainResult.splitKeyData.combinedHash,
        blockchainHash: blockchainResult.blockchainHash,
        accessLevel: "patient",
        metadata: {
          createdBy: userCredentials.userHash,
          createdAt: new Date().toISOString(),
          accessCount: 0,
          checksum: crypto
            .createHash("sha256")
            .update(blockchainResult.transaction.encryptedPayload)
            .digest("hex"),
        },
      };

      // Store in database
      await NeonDatabaseService.storeSecureRecord(secureRecord);

      // Create audit log
      await this.createAuditLog({
        action: "create",
        dataRecordId: blockchainResult.transaction.id,
        userId: userCredentials.userHash,
        userRole: "patient",
        success: true,
        details: {
          action: "secure_health_record_storage",
          recordType: healthRecord.type || "medical_history",
          blockchainHash: blockchainResult.blockchainHash,
          encryptionLayers: 3,
        },
      });

      console.log(`✅ Secure health record stored successfully`);

      return {
        success: true,
        recordId: blockchainResult.transaction.id,
        blockchainHash: blockchainResult.blockchainHash,
        splitKeyReference: blockchainResult.splitKeyData.combinedHash,
      };
    } catch (error) {
      console.error("❌ Failed to store secure health record:", error);

      const userCredentials = this.userSessions.get(sessionToken);
      await this.createAuditLog({
        action: "create",
        userId: userCredentials?.userHash || "unknown",
        userRole: "patient",
        success: false,
        details: {
          action: "secure_health_record_storage_failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return { success: false };
    }
  }

  /**
   * Retrieve secure health records for authenticated user
   */
  static async getSecureHealthRecords(
    sessionToken: string,
  ): Promise<DataAccessResult> {
    try {
      // Validate session
      const userCredentials = this.userSessions.get(sessionToken);
      if (!userCredentials) {
        throw new Error("Invalid session token");
      }

      console.log(
        `🔐 Retrieving secure health records for user: ${userCredentials.username}`,
      );

      // Get all records for this user from database
      const databaseRecords = await NeonDatabaseService.getMedicalHistory(
        userCredentials.userHash.substring(0, 16),
      );

      // Decrypt each record using split key system
      const decryptedRecords = [];
      const derivedPassword = crypto
        .createHash("sha256")
        .update(userCredentials.userHash)
        .digest("hex");

      for (const record of databaseRecords) {
        try {
          // Try to decrypt from blockchain if it's a secure record
          if (record.secureRecordId) {
            const decryptedData =
              SimpleSecureStorage.retrieveSecureHealthRecord(
                userCredentials.username,
                derivedPassword,
                record.secureRecordId,
              );

            if (decryptedData) {
              decryptedRecords.push({
                ...record,
                decryptedData,
              });
            } else {
              // If decryption fails, include the record without decrypted data
              decryptedRecords.push(record);
            }
          } else {
            // Regular record, not encrypted
            decryptedRecords.push(record);
          }
        } catch (decryptError) {
          console.warn(
            `⚠️ Failed to decrypt record ${record.id}:`,
            decryptError,
          );
          // Include record without decrypted data
          decryptedRecords.push(record);
        }
      }

      // Update access metadata
      for (const record of databaseRecords) {
        if (record.secureRecordId) {
          await NeonDatabaseService.updateAccessMetadata(record.secureRecordId);
        }
      }

      // Create audit log
      await this.createAuditLog({
        action: "read",
        userId: userCredentials.userHash,
        userRole: "patient",
        success: true,
        details: {
          action: "secure_health_records_retrieval",
          recordsCount: decryptedRecords.length,
          decryptedCount: decryptedRecords.filter((r) => r.decryptedData)
            .length,
        },
      });

      console.log(
        `✅ Retrieved ${decryptedRecords.length} health records for user`,
      );

      return {
        success: true,
        data: decryptedRecords,
        accessLog: {
          timestamp: new Date().toISOString(),
          action: "retrieve_health_records",
          result: "success",
        },
      };
    } catch (error) {
      console.error("❌ Failed to retrieve secure health records:", error);

      const userCredentials = this.userSessions.get(sessionToken);
      await this.createAuditLog({
        action: "access_denied",
        userId: userCredentials?.userHash || "unknown",
        userRole: "patient",
        success: false,
        details: {
          action: "secure_health_records_retrieval_failed",
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        accessLog: {
          timestamp: new Date().toISOString(),
          action: "retrieve_health_records",
          result: "failure",
        },
      };
    }
  }

  /**
   * Check if user has data in the system
   */
  private static async checkUserDataExists(userHash: string): Promise<boolean> {
    try {
      const patientId = userHash.substring(0, 16);
      const records = await NeonDatabaseService.getMedicalHistory(patientId);
      return records.length > 0;
    } catch (error) {
      console.error("❌ Error checking user data existence:", error);
      return false;
    }
  }

  /**
   * Generate secure session token
   */
  private static generateSessionToken(userHash: string): string {
    const timestamp = Date.now().toString();
    const randomBytes = crypto.randomBytes(16).toString("hex");
    const tokenData = `${userHash}:${timestamp}:${randomBytes}`;
    return crypto.createHash("sha256").update(tokenData).digest("hex");
  }

  /**
   * Create audit log entry
   */
  private static async createAuditLog(
    logData: Partial<AuditLog>,
  ): Promise<void> {
    try {
      const auditLog: AuditLog = {
        logId: crypto.randomBytes(16).toString("hex"),
        action: logData.action || "unknown",
        dataRecordId: logData.dataRecordId,
        userId: logData.userId || "system",
        userRole: logData.userRole || "unknown",
        timestamp: new Date().toISOString(),
        ipAddress: logData.ipAddress,
        userAgent: logData.userAgent,
        success: logData.success || false,
        details: logData.details || {},
      };

      await NeonDatabaseService.storeAuditLog(auditLog);
    } catch (error) {
      console.error("❌ Failed to create audit log:", error);
    }
  }

  /**
   * Validate session token
   */
  static validateSession(sessionToken: string): boolean {
    return this.userSessions.has(sessionToken);
  }

  /**
   * Get user from session
   */
  static getUserFromSession(
    sessionToken: string,
  ): UserAccessCredentials | null {
    return this.userSessions.get(sessionToken) || null;
  }

  /**
   * Invalidate session
   */
  static invalidateSession(sessionToken: string): boolean {
    return this.userSessions.delete(sessionToken);
  }

  /**
   * Get system statistics
   */
  static getSystemStats(): {
    activeSessions: number;
    blockchainStats: any;
    cacheSize: number;
    totalAuditLogs: number;
  } {
    const blockchainStats = SimpleSecureStorage.getBlockchainStats();

    return {
      activeSessions: this.userSessions.size,
      blockchainStats,
      cacheSize: this.splitKeyCache.size,
      totalAuditLogs: 0, // This would need to be fetched from database
    };
  }

  /**
   * Emergency data access (for healthcare providers)
   */
  static async emergencyDataAccess(
    providerCredentials: {
      providerId: string;
      emergencyCode: string;
      reason: string;
    },
    patientIdentifier: string,
  ): Promise<DataAccessResult> {
    try {
      console.log(
        `🚨 Emergency data access requested by provider: ${providerCredentials.providerId}`,
      );

      // In a production system, this would verify provider credentials
      // For now, we'll implement basic emergency access

      const records =
        await NeonDatabaseService.getMedicalHistory(patientIdentifier);

      // Create emergency access audit log
      await this.createAuditLog({
        action: "read",
        userId: providerCredentials.providerId,
        userRole: "emergency_provider",
        success: true,
        details: {
          action: "emergency_data_access",
          patientIdentifier,
          emergencyCode: providerCredentials.emergencyCode,
          reason: providerCredentials.reason,
          recordsAccessed: records.length,
        },
      });

      return {
        success: true,
        data: records,
        accessLog: {
          timestamp: new Date().toISOString(),
          action: "emergency_access",
          result: "success",
        },
      };
    } catch (error) {
      console.error("❌ Emergency data access failed:", error);

      await this.createAuditLog({
        action: "access_denied",
        userId: providerCredentials.providerId,
        userRole: "emergency_provider",
        success: false,
        details: {
          action: "emergency_data_access_failed",
          patientIdentifier,
          error: error instanceof Error ? error.message : "Unknown error",
        },
      });

      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Emergency access failed",
        accessLog: {
          timestamp: new Date().toISOString(),
          action: "emergency_access",
          result: "failure",
        },
      };
    }
  }
}

export { SecureDataAccessService };
export type {
  SecureDataRecord,
  UserAccessCredentials,
  DataAccessResult,
  SplitKeyPair,
  AuditLog,
};
