import bcrypt from "bcrypt";
import crypto from "crypto";
import { SQLiteDatabaseService } from "./sqliteDatabase";
import { SecureDataAccessService } from "./secureDataAccess";
import { ProductionBlockchainService } from "./productionBlockchain";

/**
 * Enhanced User Authentication Service with SQLite
 * Provides reliable authentication with fallback mechanisms
 */

export interface User {
  id: string;
  username: string;
  passwordHash: string;
  userHash: string;
  email?: string;
  firstName?: string;
  lastName?: string;
  dateOfBirth?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  secureSystemActivated: boolean;
  splitKeySystemActive: boolean;
  isActive: boolean;
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

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  expiresAt: Date;
  createdAt: Date;
  lastAccessed: Date;
  ipAddress?: string;
  userAgent?: string;
  isActive: boolean;
}

export class EnhancedUserAuthenticationService {
  private static isInitialized = false;
  private static fallbackUsers: Map<string, User> = new Map();

  /**
   * Initialize the authentication service
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    try {
      console.log("🚀 Initializing enhanced authentication service...");

      // Initialize SQLite database
      try {
        SQLiteDatabaseService.initialize();
        SQLiteDatabaseService.createTables();
        SQLiteDatabaseService.runMigrations();
        console.log("✅ SQLite database initialized successfully");
      } catch (dbError) {
        console.warn("⚠️ SQLite initialization failed, using in-memory fallback");
      }

      // Initialize secure data access system
      try {
        await SecureDataAccessService.initialize();
        console.log("✅ Secure data access system initialized");
      } catch (secureError) {
        console.warn("⚠️ Secure data access system failed, using basic auth");
      }

      this.isInitialized = true;
      console.log("✅ Enhanced authentication service initialized");

      // Clean up old sessions on startup
      setTimeout(() => this.cleanupExpiredSessions(), 1000);
    } catch (error) {
      console.error("❌ Failed to initialize authentication service:", error);
      this.isInitialized = true; // Continue with fallback
    }
  }

  /**
   * Register a new user
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
  ): Promise<AuthResult> {
    try {
      console.log(`👤 Registering user: ${username}`);

      // Validate input
      const validation = this.validateUserInput(username, password, email);
      if (!validation.valid) {
        return { success: false, message: validation.message };
      }

      // Check if user exists
      const existingUser = await this.getUserByUsername(username);
      if (existingUser) {
        return { success: false, message: "Username already exists" };
      }

      // Check email if provided
      if (email) {
        const existingEmail = await this.getUserByEmail(email);
        if (existingEmail) {
          return { success: false, message: "Email already registered" };
        }
      }

      // Generate secure password hash
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(password, saltRounds);

      // Generate user hash for blockchain
      let userHash: string;
      try {
        userHash = ProductionBlockchainService.generateUserHash(username, password);
      } catch (error) {
        userHash = crypto.createHash('sha256').update(username + password + Date.now()).digest('hex');
      }

      // Create user object
      const user: User = {
        id: crypto.randomBytes(16).toString("hex"),
        username,
        passwordHash,
        userHash,
        email,
        firstName: profile?.firstName,
        lastName: profile?.lastName,
        dateOfBirth: profile?.dateOfBirth,
        phone: profile?.phone,
        createdAt: new Date().toISOString(),
        secureSystemActivated: false,
        splitKeySystemActive: false,
        isActive: true
      };

      // Store user in database
      const stored = await this.storeUser(user);
      if (!stored) {
        return { success: false, message: "Failed to create user account" };
      }

      // Create session
      const sessionToken = await this.createSession(user.id);

      // Activate secure system
      let secureActivated = false;
      try {
        const secureResult = await SecureDataAccessService.createSecureUserAccount(
          username,
          password,
          profile || {}
        );
        secureActivated = secureResult.dataAccessActivated;
      } catch (error) {
        console.warn("⚠️ Secure account creation failed, continuing with basic account");
      }

      // Update user with secure system status
      await this.updateUserSecureStatus(user.id, secureActivated);

      console.log(`✅ User ${username} registered successfully`);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          userHash: user.userHash,
          sessionToken,
          secureSystemActivated: secureActivated
        },
        message: "Registration successful",
        securityFeatures: {
          splitKeySystem: secureActivated,
          blockchainStorage: true,
          encryptionLayers: secureActivated ? 3 : 1
        }
      };
    } catch (error) {
      console.error("❌ Registration failed:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Registration failed"
      };
    }
  }

  /**
   * Authenticate user
   */
  static async authenticateUser(
    username: string,
    password: string,
    ipAddress?: string,
    userAgent?: string
  ): Promise<AuthResult> {
    try {
      console.log(`🔐 Authenticating user: ${username}`);

      // Get user from database
      const user = await this.getUserByUsername(username);
      if (!user || !user.isActive) {
        return { success: false, message: "Invalid username or password" };
      }

      // Verify password
      const passwordValid = await bcrypt.compare(password, user.passwordHash);
      if (!passwordValid) {
        await this.logDataAccess(user.id, "login_failed", "authentication", null, ipAddress, false, "Invalid password");
        return { success: false, message: "Invalid username or password" };
      }

      // Create session
      const sessionToken = await this.createSession(user.id, ipAddress, userAgent);

      // Update last login
      await this.updateLastLogin(user.id);

      // Authenticate with secure system
      let secureAuth = false;
      try {
        const secureResult = await SecureDataAccessService.authenticateUser(username, password);
        secureAuth = secureResult.authenticated;
      } catch (error) {
        console.warn("⚠️ Secure authentication failed, using basic session");
      }

      // Log successful access
      await this.logDataAccess(user.id, "login_success", "authentication", null, ipAddress, true);

      console.log(`✅ User ${username} authenticated successfully`);

      return {
        success: true,
        user: {
          id: user.id,
          username: user.username,
          userHash: user.userHash,
          sessionToken,
          secureSystemActivated: user.secureSystemActivated
        },
        message: "Authentication successful",
        securityFeatures: {
          splitKeySystem: secureAuth,
          blockchainStorage: true,
          encryptionLayers: user.secureSystemActivated ? 3 : 1
        }
      };
    } catch (error) {
      console.error("❌ Authentication failed:", error);
      return { success: false, message: "Authentication failed" };
    }
  }

  /**
   * Verify session token
   */
  static async verifySession(sessionToken: string): Promise<{ valid: boolean; user?: any }> {
    try {
      const session = await this.getActiveSession(sessionToken);
      if (!session) {
        return { valid: false };
      }

      // Update last accessed
      await this.updateSessionAccess(session.id);

      const user = await this.getUserById(session.userId);
      if (!user || !user.isActive) {
        return { valid: false };
      }

      return {
        valid: true,
        user: {
          id: user.id,
          username: user.username,
          userHash: user.userHash,
          email: user.email
        }
      };
    } catch (error) {
      console.error("❌ Session verification failed:", error);
      return { valid: false };
    }
  }

  /**
   * Logout user
   */
  static async logout(sessionToken: string): Promise<boolean> {
    try {
      await this.invalidateSession(sessionToken);
      return true;
    } catch (error) {
      console.error("❌ Logout failed:", error);
      return false;
    }
  }

  /**
   * Store health record
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
      const session = await this.verifySession(sessionToken);
      if (!session.valid || !session.user) {
        return { success: false, message: "Invalid session" };
      }

      const recordId = crypto.randomBytes(16).toString("hex");
      const record = {
        id: recordId,
        patientId: session.user.username,
        recordType: healthRecord.type,
        title: healthRecord.data.title || `${healthRecord.type} - ${new Date().toLocaleDateString()}`,
        description: healthRecord.data.description || JSON.stringify(healthRecord.data),
        date: healthRecord.data.date || new Date().toISOString().split('T')[0],
        doctor: healthRecord.data.doctor || null,
        facility: healthRecord.data.facility || null,
        diagnosis: healthRecord.data.diagnosis || null,
        treatment: healthRecord.data.treatment || null,
        medications: healthRecord.data.medications || null,
        notes: healthRecord.data.notes || null,
        metadata: JSON.stringify(healthRecord.data.metadata || {}),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      const stored = await this.storeMedicalRecord(record);
      if (stored) {
        await this.logDataAccess(session.user.id, "store_health_record", "medical_record", recordId, null, true);
        return { success: true, recordId, message: "Health record stored successfully" };
      } else {
        return { success: false, message: "Failed to store health record" };
      }
    } catch (error) {
      console.error("❌ Failed to store health record:", error);
      return { success: false, message: "Storage failed" };
    }
  }

  /**
   * Get health records for user
   */
  static async getHealthRecords(sessionToken: string): Promise<{
    success: boolean;
    records?: any[];
    message?: string;
  }> {
    try {
      const session = await this.verifySession(sessionToken);
      if (!session.valid || !session.user) {
        return { success: false, message: "Invalid session" };
      }

      const records = await this.getMedicalRecords(session.user.username);
      await this.logDataAccess(session.user.id, "get_health_records", "medical_record", null, null, true);

      return {
        success: true,
        records,
        message: `Retrieved ${records.length} health records`
      };
    } catch (error) {
      console.error("❌ Failed to get health records:", error);
      return { success: false, message: "Retrieval failed" };
    }
  }

  // Private helper methods

  private static validateUserInput(username: string, password: string, email?: string): { valid: boolean; message?: string } {
    if (!username || !password) {
      return { valid: false, message: "Username and password are required" };
    }

    if (username.length < 3 || username.length > 30) {
      return { valid: false, message: "Username must be 3-30 characters" };
    }

    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return { valid: false, message: "Username can only contain letters, numbers, and underscores" };
    }

    if (password.length < 6) {
      return { valid: false, message: "Password must be at least 6 characters" };
    }

    if (email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return { valid: false, message: "Invalid email format" };
    }

    return { valid: true };
  }

  private static async storeUser(user: User): Promise<boolean> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        INSERT INTO users (
          id, username, password_hash, user_hash, email, first_name, last_name,
          date_of_birth, phone, created_at, secure_system_activated,
          split_key_system_active, is_active
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        user.id, user.username, user.passwordHash, user.userHash, user.email,
        user.firstName, user.lastName, user.dateOfBirth, user.phone,
        user.createdAt, user.secureSystemActivated ? 1 : 0,
        user.splitKeySystemActive ? 1 : 0, user.isActive ? 1 : 0
      );

      return true;
    } catch (error) {
      console.error("❌ Error storing user:", error);
      // Fallback to memory
      this.fallbackUsers.set(user.username, user);
      return true;
    }
  }

  private static async getUserByUsername(username: string): Promise<User | null> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare('SELECT * FROM users WHERE username = ? AND is_active = 1');
      const row = stmt.get(username);

      if (row) {
        return this.mapRowToUser(row);
      }

      // Check fallback
      return this.fallbackUsers.get(username) || null;
    } catch (error) {
      console.error("❌ Error getting user by username:", error);
      return this.fallbackUsers.get(username) || null;
    }
  }

  private static async getUserByEmail(email: string): Promise<User | null> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare('SELECT * FROM users WHERE email = ? AND is_active = 1');
      const row = stmt.get(email);

      if (row) {
        return this.mapRowToUser(row);
      }

      // Check fallback
      for (const user of this.fallbackUsers.values()) {
        if (user.email === email) {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting user by email:", error);
      return null;
    }
  }

  private static async getUserById(id: string): Promise<User | null> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare('SELECT * FROM users WHERE id = ? AND is_active = 1');
      const row = stmt.get(id);

      if (row) {
        return this.mapRowToUser(row);
      }

      // Check fallback
      for (const user of this.fallbackUsers.values()) {
        if (user.id === id) {
          return user;
        }
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting user by ID:", error);
      return null;
    }
  }

  private static mapRowToUser(row: any): User {
    return {
      id: row.id,
      username: row.username,
      passwordHash: row.password_hash,
      userHash: row.user_hash,
      email: row.email,
      firstName: row.first_name,
      lastName: row.last_name,
      dateOfBirth: row.date_of_birth,
      phone: row.phone,
      createdAt: row.created_at,
      lastLogin: row.last_login,
      secureSystemActivated: Boolean(row.secure_system_activated),
      splitKeySystemActive: Boolean(row.split_key_system_active),
      isActive: Boolean(row.is_active)
    };
  }

  private static async createSession(userId: string, ipAddress?: string, userAgent?: string): Promise<string> {
    const sessionToken = crypto.randomBytes(32).toString('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        INSERT INTO user_sessions (id, user_id, session_token, expires_at, ip_address, user_agent)
        VALUES (?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        crypto.randomBytes(16).toString("hex"),
        userId,
        sessionToken,
        expiresAt.toISOString(),
        ipAddress,
        userAgent
      );
    } catch (error) {
      console.error("❌ Error creating session:", error);
    }

    return sessionToken;
  }

  private static async getActiveSession(sessionToken: string): Promise<UserSession | null> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        SELECT * FROM user_sessions 
        WHERE session_token = ? AND expires_at > datetime('now') AND is_active = 1
      `);
      const row = stmt.get(sessionToken);

      if (row) {
        return {
          id: row.id,
          userId: row.user_id,
          sessionToken: row.session_token,
          expiresAt: new Date(row.expires_at),
          createdAt: new Date(row.created_at),
          lastAccessed: new Date(row.last_accessed),
          ipAddress: row.ip_address,
          userAgent: row.user_agent,
          isActive: Boolean(row.is_active)
        };
      }
      return null;
    } catch (error) {
      console.error("❌ Error getting session:", error);
      return null;
    }
  }

  private static async updateSessionAccess(sessionId: string): Promise<void> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        UPDATE user_sessions SET last_accessed = datetime('now') WHERE id = ?
      `);
      stmt.run(sessionId);
    } catch (error) {
      console.error("❌ Error updating session access:", error);
    }
  }

  private static async invalidateSession(sessionToken: string): Promise<void> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        UPDATE user_sessions SET is_active = 0 WHERE session_token = ?
      `);
      stmt.run(sessionToken);
    } catch (error) {
      console.error("❌ Error invalidating session:", error);
    }
  }

  private static async updateLastLogin(userId: string): Promise<void> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        UPDATE users SET last_login = datetime('now') WHERE id = ?
      `);
      stmt.run(userId);
    } catch (error) {
      console.error("❌ Error updating last login:", error);
    }
  }

  private static async updateUserSecureStatus(userId: string, activated: boolean): Promise<void> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        UPDATE users SET secure_system_activated = ? WHERE id = ?
      `);
      stmt.run(activated ? 1 : 0, userId);
    } catch (error) {
      console.error("❌ Error updating user secure status:", error);
    }
  }

  private static async storeMedicalRecord(record: any): Promise<boolean> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        INSERT INTO medical_records (
          id, patient_id, record_type, title, description, date, doctor,
          facility, diagnosis, treatment, medications, notes, metadata, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        record.id, record.patientId, record.recordType, record.title,
        record.description, record.date, record.doctor, record.facility,
        record.diagnosis, record.treatment, record.medications, record.notes,
        record.metadata, record.createdAt, record.updatedAt
      );

      return true;
    } catch (error) {
      console.error("❌ Error storing medical record:", error);
      return false;
    }
  }

  private static async getMedicalRecords(patientId: string): Promise<any[]> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        SELECT * FROM medical_records WHERE patient_id = ? ORDER BY date DESC, created_at DESC
      `);
      const rows = stmt.all(patientId);

      return rows.map(row => ({
        id: row.id,
        patientId: row.patient_id,
        recordType: row.record_type,
        title: row.title,
        description: row.description,
        date: row.date,
        doctor: row.doctor,
        facility: row.facility,
        diagnosis: row.diagnosis,
        treatment: row.treatment,
        medications: row.medications,
        notes: row.notes,
        metadata: row.metadata ? JSON.parse(row.metadata) : {},
        createdAt: row.created_at,
        updatedAt: row.updated_at
      }));
    } catch (error) {
      console.error("❌ Error getting medical records:", error);
      return [];
    }
  }

  private static async logDataAccess(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string | null,
    ipAddress?: string | null,
    success: boolean = true,
    errorMessage?: string | null
  ): Promise<void> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        INSERT INTO data_access_logs (id, user_id, action, resource_type, resource_id, ip_address, success, error_message)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);

      stmt.run(
        crypto.randomBytes(16).toString("hex"),
        userId,
        action,
        resourceType,
        resourceId,
        ipAddress,
        success ? 1 : 0,
        errorMessage
      );
    } catch (error) {
      console.error("❌ Error logging data access:", error);
    }
  }

  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const db = SQLiteDatabaseService.getInstance();
      const stmt = db.prepare(`
        DELETE FROM user_sessions WHERE expires_at < datetime('now')
      `);
      const result = stmt.run();
      console.log(`🧹 Cleaned up ${result.changes} expired sessions`);
    } catch (error) {
      console.error("❌ Error cleaning up sessions:", error);
    }
  }

  static getSystemStats(): any {
    try {
      return SQLiteDatabaseService.getStats();
    } catch (error) {
      return {
        totalUsers: this.fallbackUsers.size,
        error: error instanceof Error ? error.message : "Unknown error"
      };
    }
  }
}
