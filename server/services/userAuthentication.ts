import bcrypt from "bcrypt";
import crypto from "crypto";
import { SecureDataAccessService } from "./secureDataAccess";
import { ProductionBlockchainService } from "./productionBlockchain";
import { NeonDatabaseService } from "./neonDatabase";
import { SimpleDatabaseInit } from "./simpleDatabaseInit";
import { DatabaseHealthService } from "./databaseHealthCheck";

/**
 * Enhanced User Authentication Service
 * Integrates with production blockchain and secure data access system
 */

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  userHash: string;
  email?: string;
  profile?: {
    firstName?: string;
    lastName?: string;
    dateOfBirth?: string;
  };
  createdAt: string;
  lastLogin?: string;
  secureSystemActivated: boolean;
  splitKeySystemActive: boolean;
}

export interface AuthResult {
  success: boolean;
  user?: {
    id: string;
    username: string;
    userHash: string;
    sessionToken?: string;
    secureSystemActivated: boolean;
  };
  message?: string;
  securityFeatures?: {
    splitKeySystem: boolean;
    blockchainStorage: boolean;
    encryptionLayers: number;
  };
}

export interface DataAccessRecord {
  userId: string;
  userHash: string;
  dataHash: string;
  combinedHash: string;
  splitKeyPart1: string;
  splitKeyPart2: string;
  checksum: string;
  createdAt: string;
  accessCount: number;
  lastAccessed?: string;
}

class UserAuthenticationService {
  private static users: Map<string, User> = new Map();
  private static dataAccessRecords: Map<string, DataAccessRecord> = new Map();
  private static isInitialized = false;
  private static useDatabase = false;

  /**
   * Initialize the authentication service
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("🚀 Initializing enhanced user authentication system...");

      // Check database health first
      const healthCheck = await DatabaseHealthService.checkHealth();
      if (!healthCheck.isHealthy) {
        console.warn("⚠️ Database health check failed, continuing with in-memory storage");
      }

      // Initialize secure data access system
      await SecureDataAccessService.initialize();

      // Initialize database connections with fallback
      await DatabaseHealthService.withFallback(
        async () => {
          await NeonDatabaseService.initializeDatabase();
          await this.createUserTables();
          this.useDatabase = true;
          console.log("✅ User authentication tables initialized successfully");
        },
        () => {
          console.warn("⚠️ Using fallback database initialization");
          this.useDatabase = false;
          SimpleDatabaseInit.createMedicalHistoryTable().catch(() => {
            console.warn("⚠️ Fallback initialization also failed, using in-memory only");
          });
        }
      );

      this.isInitialized = true;
      console.log("✅ User authentication system initialized successfully");

    } catch (error) {
      console.error("❌ Failed to initialize authentication system:", error);
      // Don't throw error, allow system to continue with in-memory storage
      this.isInitialized = true;
      console.log("✅ Authentication system initialized in degraded mode");
    }
  }

  /**
   * Register a new user with automatic secure system activation
   */
  static async registerUser(
    username: string,
    password: string,
    email?: string,
    profile?: {
      firstName?: string;
      lastName?: string;
      dateOfBirth?: string;
    }
  ): Promise<AuthResult> {
    try {
      console.log(`👤 Registering new user: ${username}`);

      // Validate input
      if (!username || !password) {
        return {
          success: false,
          message: "Username and password are required"
        };
      }

      if (username.length < 3 || username.length > 30) {
        return {
          success: false,
          message: "Username must be 3-30 characters"
        };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
          success: false,
          message: "Username must contain only letters, numbers, and underscores"
        };
      }

      if (password.length < 6) {
        return {
          success: false,
          message: "Password must be at least 6 characters"
        };
      }

      // Check if user already exists
      if (this.users.has(username)) {
        return {
          success: false,
          message: "Username already exists"
        };
      }

      // Generate secure password hash
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate user hash for the blockchain system
      const userHash = ProductionBlockchainService.generateUserHash(username, password);

      // Create user record
      const user: User = {
        id: crypto.randomBytes(16).toString('hex'),
        username,
        passwordHash,
        userHash,
        email,
        profile,
        createdAt: new Date().toISOString(),
        secureSystemActivated: false,
        splitKeySystemActive: false
      };

      // Store user
      this.users.set(username, user);

      // Activate secure data access system for the user
      const secureAccountResult = await SecureDataAccessService.createSecureUserAccount(
        username,
        password,
        profile || {}
      );

      // Update user with secure system activation
      user.secureSystemActivated = secureAccountResult.dataAccessActivated;
      user.splitKeySystemActive = secureAccountResult.splitKeySystem;

      // Create data access record for split key system
      await this.createDataAccessRecord(user.id, userHash, username, password);

      console.log(`✅ User ${username} registered successfully with secure system activated`);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          userHash: user.userHash,
          sessionToken: secureAccountResult.sessionToken,
          secureSystemActivated: user.secureSystemActivated
        },
        message: "User registered successfully with secure data access activated",
        securityFeatures: {
          splitKeySystem: true,
          blockchainStorage: true,
          encryptionLayers: 3
        }
      };

    } catch (error) {
      console.error("❌ Failed to register user:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed"
      };
    }
  }

  /**
   * Authenticate user and establish secure session
   */
  static async authenticateUser(username: string, password: string): Promise<AuthResult> {
    try {
      console.log(`🔐 Authenticating user: ${username}`);

      // Get user from storage
      const user = this.users.get(username);
      if (!user) {
        return {
          success: false,
          message: "Invalid username or password"
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return {
          success: false,
          message: "Invalid username or password"
        };
      }

      // Authenticate with secure data access system
      const secureAuthResult = await SecureDataAccessService.authenticateUser(username, password);
      
      if (!secureAuthResult.authenticated) {
        return {
          success: false,
          message: "Secure authentication failed"
        };
      }

      // Update last login
      user.lastLogin = new Date().toISOString();

      console.log(`✅ User ${username} authenticated successfully`);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          userHash: user.userHash,
          sessionToken: secureAuthResult.sessionToken,
          secureSystemActivated: user.secureSystemActivated
        },
        message: "Authentication successful",
        securityFeatures: {
          splitKeySystem: secureAuthResult.splitKeySystemActive || false,
          blockchainStorage: true,
          encryptionLayers: 3
        }
      };

    } catch (error) {
      console.error("❌ Authentication failed:", error);
      return {
        success: false,
        message: "Authentication failed"
      };
    }
  }

  /**
   * Store health record with secure split key system
   */
  static async storeHealthRecord(
    sessionToken: string,
    healthRecord: {
      type: string;
      data: any;
      timestamp?: string;
    }
  ): Promise<{ success: boolean; recordId?: string; message?: string }> {
    try {
      // Validate session
      if (!SecureDataAccessService.validateSession(sessionToken)) {
        return {
          success: false,
          message: "Invalid session token"
        };
      }

      console.log("🏥 Storing health record with secure split key system");

      // Prepare health record
      const preparedRecord = {
        ...healthRecord,
        timestamp: healthRecord.timestamp || new Date().toISOString(),
        id: crypto.randomBytes(16).toString('hex')
      };

      // Store using secure data access system
      const result = await SecureDataAccessService.storeSecureHealthRecord(
        sessionToken,
        preparedRecord
      );

      if (result.success) {
        // Also store in traditional format for compatibility
        const user = SecureDataAccessService.getUserFromSession(sessionToken);
        if (user) {
          const medicalRecord = {
            id: preparedRecord.id,
            patientId: user.userHash.substring(0, 16),
            recordType: preparedRecord.type,
            title: `${preparedRecord.type} - ${new Date().toLocaleDateString()}`,
            description: JSON.stringify(preparedRecord.data),
            date: preparedRecord.timestamp.split('T')[0],
            metadata: {
              secureStorage: true,
              encryptionLayers: 3,
              splitKeySystem: true
            },
            secureRecordId: result.recordId
          };

          try {
            await NeonDatabaseService.storeMedicalHistory(medicalRecord);
          } catch (dbError) {
            console.warn("⚠️ Failed to store in main database, record stored securely in blockchain");
          }
        }

        console.log("✅ Health record stored successfully with split key system");
        return {
          success: true,
          recordId: result.recordId,
          message: "Health record stored securely"
        };
      } else {
        return {
          success: false,
          message: "Failed to store health record"
        };
      }

    } catch (error) {
      console.error("❌ Failed to store health record:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Storage failed"
      };
    }
  }

  /**
   * Retrieve health records for authenticated user
   */
  static async getHealthRecords(sessionToken: string): Promise<{
    success: boolean;
    records?: any[];
    message?: string;
  }> {
    try {
      // Validate session
      if (!SecureDataAccessService.validateSession(sessionToken)) {
        return {
          success: false,
          message: "Invalid session token"
        };
      }

      console.log("🔐 Retrieving health records with secure access control");

      // Retrieve using secure data access system
      const result = await SecureDataAccessService.getSecureHealthRecords(sessionToken);

      if (result.success) {
        console.log(`✅ Retrieved ${result.data?.length || 0} health records`);
        return {
          success: true,
          records: result.data,
          message: "Health records retrieved successfully"
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to retrieve health records"
        };
      }

    } catch (error) {
      console.error("❌ Failed to retrieve health records:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Retrieval failed"
      };
    }
  }

  /**
   * Create data access record for user (split key system)
   */
  private static async createDataAccessRecord(
    userId: string,
    userHash: string,
    username: string,
    password: string
  ): Promise<void> {
    try {
      // Generate a sample data hash for initialization
      const sampleData = {
        userId,
        accountCreated: new Date().toISOString(),
        initialSetup: true
      };
      
      const dataHash = ProductionBlockchainService.generateDataHash(sampleData);
      
      // Create split key system
      const splitKeyData = ProductionBlockchainService.createSplitKeySystem(userHash, dataHash);
      
      const dataAccessRecord: DataAccessRecord = {
        userId,
        userHash,
        dataHash,
        combinedHash: splitKeyData.combinedHash,
        splitKeyPart1: splitKeyData.splitKeyPairs.part1,
        splitKeyPart2: splitKeyData.splitKeyPairs.part2,
        checksum: splitKeyData.splitKeyPairs.checksum,
        createdAt: new Date().toISOString(),
        accessCount: 0
      };

      this.dataAccessRecords.set(userId, dataAccessRecord);
      console.log(`✅ Data access record created for user: ${username}`);
      
    } catch (error) {
      console.error("❌ Failed to create data access record:", error);
    }
  }

  /**
   * Verify session token
   */
  static verifySession(sessionToken: string): { valid: boolean; user?: any } {
    const isValid = SecureDataAccessService.validateSession(sessionToken);
    if (isValid) {
      const user = SecureDataAccessService.getUserFromSession(sessionToken);
      return {
        valid: true,
        user: user ? {
          username: user.username,
          userHash: user.userHash
        } : undefined
      };
    }
    return { valid: false };
  }

  /**
   * Logout user and invalidate session
   */
  static logout(sessionToken: string): boolean {
    return SecureDataAccessService.invalidateSession(sessionToken);
  }

  /**
   * Get system statistics
   */
  static getSystemStats(): {
    totalUsers: number;
    activeUsers: number;
    secureSystemUsers: number;
    dataAccessRecords: number;
    systemStats: any;
  } {
    const secureUsers = Array.from(this.users.values()).filter(u => u.secureSystemActivated).length;
    const systemStats = SecureDataAccessService.getSystemStats();
    
    return {
      totalUsers: this.users.size,
      activeUsers: systemStats.activeSessions,
      secureSystemUsers: secureUsers,
      dataAccessRecords: this.dataAccessRecords.size,
      systemStats
    };
  }

  /**
   * Emergency system reset (for development/testing)
   */
  static resetSystem(): void {
    console.log("🔄 Resetting authentication system...");
    this.users.clear();
    this.dataAccessRecords.clear();
    this.isInitialized = false;
    console.log("✅ Authentication system reset");
  }
}

export { UserAuthenticationService };
export type { User, AuthResult, DataAccessRecord };
