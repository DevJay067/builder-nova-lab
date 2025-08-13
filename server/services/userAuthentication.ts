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
   * Create user tables in database
   */
  private static async createUserTables(): Promise<void> {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL || "");

      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          user_hash VARCHAR(255) NOT NULL,
          email VARCHAR(255),
          first_name VARCHAR(255),
          last_name VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP,
          secure_system_activated BOOLEAN DEFAULT false,
          split_key_system_active BOOLEAN DEFAULT false
        )
      `;

      // Add missing columns if they don't exist (for existing tables)
      try {
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS secure_system_activated BOOLEAN DEFAULT false`;
        await sql`ALTER TABLE users ADD COLUMN IF NOT EXISTS split_key_system_active BOOLEAN DEFAULT false`;
      } catch (alterError) {
        // Columns likely already exist, ignore
        console.log("Column alter operation skipped (likely already exist)");
      }

      // Create index on username for faster lookups
      await sql`CREATE INDEX IF NOT EXISTS idx_users_username ON users(username)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_users_user_hash ON users(user_hash)`;

      console.log("✅ User tables created successfully");
    } catch (error) {
      console.error("❌ Error creating user tables:", error);
      throw error;
    }
  }

  /**
   * Store user in database
   */
  private static async storeUserInDatabase(user: User): Promise<void> {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL || "");

      await sql`
        INSERT INTO users (
          id, username, password_hash, user_hash, email,
          first_name, last_name, created_at, secure_system_activated,
          split_key_system_active
        ) VALUES (
          ${user.id}, ${user.username}, ${user.passwordHash},
          ${user.userHash}, ${user.email || null},
          ${user.profile?.firstName || null}, ${user.profile?.lastName || null},
          ${user.createdAt}, ${user.secureSystemActivated},
          ${user.splitKeySystemActive}
        )
        ON CONFLICT (username) DO UPDATE SET
          password_hash = EXCLUDED.password_hash,
          user_hash = EXCLUDED.user_hash,
          email = EXCLUDED.email,
          first_name = EXCLUDED.first_name,
          last_name = EXCLUDED.last_name,
          secure_system_activated = EXCLUDED.secure_system_activated,
          split_key_system_active = EXCLUDED.split_key_system_active
      `;

      console.log(`✅ User ${user.username} stored in database`);
    } catch (error) {
      console.error("❌ Error storing user in database:", error);
      throw error;
    }
  }

  /**
   * Get user from database
   */
  private static async getUserFromDatabase(
    username: string,
  ): Promise<User | null> {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL || "");

      const result = await sql`
        SELECT * FROM users WHERE username = ${username}
      `;

      if (result.length === 0) {
        return null;
      }

      const row = result[0];
      const user: User = {
        id: row.id,
        username: row.username,
        passwordHash: row.password_hash,
        userHash: row.user_hash,
        email: row.email,
        profile: {
          firstName: row.first_name,
          lastName: row.last_name,
        },
        createdAt: row.created_at,
        lastLogin: row.last_login,
        secureSystemActivated: row.secure_system_activated || false,
        splitKeySystemActive: row.split_key_system_active || false,
      };

      return user;
    } catch (error) {
      console.error("❌ Error getting user from database:", error);
      return null;
    }
  }

  /**
   * Update user last login in database
   */
  private static async updateUserLastLogin(username: string): Promise<void> {
    try {
      const { neon } = await import("@neondatabase/serverless");
      const sql = neon(process.env.DATABASE_URL || "");

      await sql`
        UPDATE users
        SET last_login = CURRENT_TIMESTAMP
        WHERE username = ${username}
      `;

      console.log(`✅ Updated last login for user: ${username}`);
    } catch (error) {
      console.error("❌ Error updating user last login:", error);
    }
  }

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
        console.warn(
          "⚠️ Database health check failed, continuing with in-memory storage",
        );
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
            console.warn(
              "⚠️ Fallback initialization also failed, using in-memory only",
            );
          });
        },
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
    },
  ): Promise<AuthResult> {
    try {
      console.log(`👤 Registering new user: ${username}`);

      // Validate input
      if (!username || !password) {
        return {
          success: false,
          message: "Username and password are required",
        };
      }

      if (username.length < 3 || username.length > 30) {
        return {
          success: false,
          message: "Username must be 3-30 characters",
        };
      }

      if (!/^[a-zA-Z0-9_]+$/.test(username)) {
        return {
          success: false,
          message:
            "Username must contain only letters, numbers, and underscores",
        };
      }

      if (password.length < 8 || !/[A-Z]/.test(password) || !/[0-9]/.test(password)) {
        return {
          success: false,
          message: "Password must be at least 8 chars with a number and uppercase",
        };
      }

      // Check if user already exists (database first, then memory)
      let existingUser = null;
      if (this.useDatabase) {
        existingUser = await this.getUserFromDatabase(username);
      }
      if (!existingUser && this.users.has(username)) {
        existingUser = this.users.get(username);
      }

      if (existingUser) {
        return {
          success: false,
          message: "Username already exists",
        };
      }

      // Generate secure password hash
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate user hash for the blockchain system
      const userHash = ProductionBlockchainService.generateUserHash(
        username,
        password,
      );

      // Create user record
      const user: User = {
        id: crypto.randomBytes(16).toString("hex"),
        username,
        passwordHash,
        userHash,
        email,
        profile,
        createdAt: new Date().toISOString(),
        secureSystemActivated: false,
        splitKeySystemActive: false,
      };

      // Store user in database if available, otherwise in memory
      if (this.useDatabase) {
        await this.storeUserInDatabase(user);
      } else {
        this.users.set(username, user);
      }

      // Activate secure data access system for the user
      const secureAccountResult =
        await SecureDataAccessService.createSecureUserAccount(
          username,
          password,
          profile || {},
        );

      // Update user with secure system activation
      user.secureSystemActivated = secureAccountResult.dataAccessActivated;
      user.splitKeySystemActive = secureAccountResult.splitKeySystem;

      // Create data access record for split key system
      await this.createDataAccessRecord(user.id, userHash, username, password);

      console.log(
        `✅ User ${username} registered successfully with secure system activated`,
      );

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          userHash: user.userHash,
          sessionToken: secureAccountResult.sessionToken,
          secureSystemActivated: user.secureSystemActivated,
        },
        message:
          "User registered successfully with secure data access activated",
        securityFeatures: {
          splitKeySystem: true,
          blockchainStorage: true,
          encryptionLayers: 3,
        },
      };
    } catch (error) {
      console.error("❌ Failed to register user:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Authenticate user and establish secure session
   */
  static async authenticateUser(
    username: string,
    password: string,
  ): Promise<AuthResult> {
    try {
      console.log(`🔐 Authenticating user: ${username}`);

      // Simple per-user rate limit in memory
      (this as any)._loginAttempts = (this as any)._loginAttempts || new Map<string, { count: number; ts: number }>();
      const attempts = (this as any)._loginAttempts;
      const now = Date.now();
      const windowMs = 60_000;
      const max = 20;
      const rec = attempts.get(username) || { count: 0, ts: now };
      if (now - rec.ts > windowMs) {
        rec.count = 0;
        rec.ts = now;
      }
      rec.count += 1;
      attempts.set(username, rec);
      if (rec.count > max) {
        return { success: false, message: "Too many attempts, try again later" } as any;
      }

      // Get user from database first, then fallback to memory
      let user: User | null = null;

      if (this.useDatabase) {
        user = await this.getUserFromDatabase(username);
      }

      if (!user) {
        user = this.users.get(username) || null;
      }

      if (!user) {
        return {
          success: false,
          message: "Invalid username or password",
        };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        return {
          success: false,
          message: "Invalid username or password",
        };
      }

      // Authenticate with secure data access system
      const secureAuthResult = await SecureDataAccessService.authenticateUser(
        username,
        password,
      );

      if (!secureAuthResult.authenticated) {
        return {
          success: false,
          message: "Secure authentication failed",
        };
      }

      // Update last login
      user.lastLogin = new Date().toISOString();

      // Update in database if available
      if (this.useDatabase) {
        await this.updateUserLastLogin(username);
      }

      console.log(`✅ User ${username} authenticated successfully`);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          userHash: user.userHash,
          sessionToken: secureAuthResult.sessionToken,
          secureSystemActivated: user.secureSystemActivated,
        },
        message: "Authentication successful",
        securityFeatures: {
          splitKeySystem: secureAuthResult.splitKeySystemActive || false,
          blockchainStorage: true,
          encryptionLayers: 3,
        },
      };
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      return {
        success: false,
        message: "Authentication failed",
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
    },
  ): Promise<{ success: boolean; recordId?: string; message?: string }> {
    try {
      // Validate session
      if (!SecureDataAccessService.validateSession(sessionToken)) {
        return {
          success: false,
          message: "Invalid session token",
        };
      }

      console.log("🏥 Storing health record with secure split key system");

      // Prepare health record
      const preparedRecord = {
        ...healthRecord,
        timestamp: healthRecord.timestamp || new Date().toISOString(),
        id: crypto.randomBytes(16).toString("hex"),
      };

      // Store using secure data access system
      const result = await SecureDataAccessService.storeSecureHealthRecord(
        sessionToken,
        preparedRecord,
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
            date: preparedRecord.timestamp.split("T")[0],
            metadata: {
              secureStorage: true,
              encryptionLayers: 3,
              splitKeySystem: true,
            },
            secureRecordId: result.recordId,
          };

          try {
            await NeonDatabaseService.storeMedicalHistory(medicalRecord);
          } catch (dbError) {
            console.warn(
              "⚠️ Failed to store in main database, record stored securely in blockchain",
            );
          }
        }

        console.log(
          "✅ Health record stored successfully with split key system",
        );
        return {
          success: true,
          recordId: result.recordId,
          message: "Health record stored securely",
        };
      } else {
        return {
          success: false,
          message: "Failed to store health record",
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
          message: "Invalid session token",
        };
      }

      console.log("🔐 Retrieving health records with secure access control");

      // Retrieve using secure data access system
      const result =
        await SecureDataAccessService.getSecureHealthRecords(sessionToken);

      if (result.success) {
        console.log(`✅ Retrieved ${result.data?.length || 0} health records`);
        return {
          success: true,
          records: result.data,
          message: "Health records retrieved successfully",
        };
      } else {
        return {
          success: false,
          message: result.error || "Failed to retrieve health records",
        };
      }
    } catch (error) {
      console.error("❌ Failed to retrieve health records:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Retrieval failed",
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
    password: string,
  ): Promise<void> {
    try {
      // Generate a sample data hash for initialization
      const sampleData = {
        userId,
        accountCreated: new Date().toISOString(),
        initialSetup: true,
      };

      const dataHash = ProductionBlockchainService.generateDataHash(sampleData);

      // Create split key system
      const splitKeyData = ProductionBlockchainService.createSplitKeySystem(
        userHash,
        dataHash,
      );

      const dataAccessRecord: DataAccessRecord = {
        userId,
        userHash,
        dataHash,
        combinedHash: splitKeyData.combinedHash,
        splitKeyPart1: splitKeyData.splitKeyPairs.part1,
        splitKeyPart2: splitKeyData.splitKeyPairs.part2,
        checksum: splitKeyData.splitKeyPairs.checksum,
        createdAt: new Date().toISOString(),
        accessCount: 0,
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
        user: user
          ? {
              username: user.username,
              userHash: user.userHash,
            }
          : undefined,
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
    const secureUsers = Array.from(this.users.values()).filter(
      (u) => u.secureSystemActivated,
    ).length;
    const systemStats = SecureDataAccessService.getSystemStats();

    return {
      totalUsers: this.users.size,
      activeUsers: systemStats.activeSessions,
      secureSystemUsers: secureUsers,
      dataAccessRecords: this.dataAccessRecords.size,
      systemStats,
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
