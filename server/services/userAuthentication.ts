import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { neon } from '@neondatabase/serverless';

// Try to initialize Neon database connection, but allow fallback to in-memory storage
let sql: any = null;
try {
  if (process.env.DATABASE_URL) {
    sql = neon(process.env.DATABASE_URL);
  }
} catch (error) {
  console.log('⚠️  Database connection not available, using in-memory storage for authentication');
}

// In-memory fallback storage
const inMemoryUsers = new Map<string, any>();
const inMemorySessions = new Map<string, any>();
const inMemoryDataAccess = new Map<string, any[]>();

export interface User {
  id: string;
  username: string;
  email: string;
  passwordHash: string;
  userHash: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface UserSession {
  id: string;
  userId: string;
  sessionToken: string;
  dataAccessHash: string;
  createdAt: string;
  expiresAt: string;
  lastActivity: string;
  ipAddress?: string;
  userAgent?: string;
}

export interface UserRegistration {
  username: string;
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  dateOfBirth?: string;
  phone?: string;
}

export interface UserLogin {
  username: string;
  password: string;
}

export class UserAuthenticationService {
  
  /**
   * Initialize user authentication tables
   */
  static async initializeUserTables(): Promise<void> {
    if (!sql) {
      console.log('📝 Using in-memory storage for user authentication');
      return;
    }

    try {
      // Create users table
      await sql`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(255) PRIMARY KEY,
          username VARCHAR(100) UNIQUE NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          user_hash VARCHAR(255) UNIQUE NOT NULL,
          first_name VARCHAR(100) NOT NULL,
          last_name VARCHAR(100) NOT NULL,
          date_of_birth DATE,
          phone VARCHAR(20),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_login TIMESTAMP,
          is_active BOOLEAN DEFAULT true,
          failed_login_attempts INTEGER DEFAULT 0,
          locked_until TIMESTAMP,
          INDEX idx_username (username),
          INDEX idx_email (email),
          INDEX idx_user_hash (user_hash)
        )
      `;

      // Create user_sessions table
      await sql`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          session_token VARCHAR(255) UNIQUE NOT NULL,
          data_access_hash VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          expires_at TIMESTAMP NOT NULL,
          last_activity TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          ip_address VARCHAR(45),
          user_agent TEXT,
          is_active BOOLEAN DEFAULT true,
          INDEX idx_user_id (user_id),
          INDEX idx_session_token (session_token),
          INDEX idx_data_access_hash (data_access_hash),
          INDEX idx_expires_at (expires_at),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      // Create user_data_access table for hash-based data linking
      await sql`
        CREATE TABLE IF NOT EXISTS user_data_access (
          id VARCHAR(255) PRIMARY KEY,
          user_id VARCHAR(255) NOT NULL,
          data_record_id VARCHAR(255) NOT NULL,
          combined_hash VARCHAR(255) NOT NULL,
          split_hash_1 VARCHAR(255) NOT NULL,
          split_hash_2 VARCHAR(255) NOT NULL,
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_accessed TIMESTAMP,
          access_count INTEGER DEFAULT 0,
          INDEX idx_user_id (user_id),
          INDEX idx_combined_hash (combined_hash),
          INDEX idx_split_hash_1 (split_hash_1),
          INDEX idx_split_hash_2 (split_hash_2),
          UNIQUE KEY unique_user_data (user_id, data_record_id),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `;

      console.log('✅ User authentication tables initialized successfully');
    } catch (error) {
      console.error('❌ Error initializing user tables:', error);
      throw error;
    }
  }

  /**
   * Generate secure hash for user data access
   */
  static generateUserHash(username: string, email: string): string {
    const combined = `${username}:${email}:${Date.now()}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Generate session token
   */
  static generateSessionToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Generate data access hash (combination of user hash and data hash)
   */
  static generateDataAccessHash(userHash: string, dataId: string): string {
    const combined = `${userHash}:${dataId}`;
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Split hash for secure storage
   */
  static splitHash(hash: string): { hash1: string; hash2: string } {
    const midPoint = Math.floor(hash.length / 2);
    return {
      hash1: hash.slice(0, midPoint),
      hash2: hash.slice(midPoint)
    };
  }

  /**
   * Combine split hashes
   */
  static combineHashes(hash1: string, hash2: string): string {
    return hash1 + hash2;
  }

  /**
   * Register a new user
   */
  static async registerUser(userData: UserRegistration): Promise<{ success: boolean; user?: User; error?: string }> {
    try {
      // Check if username or email already exists
      const existingUser = await sql`
        SELECT id FROM users 
        WHERE username = ${userData.username} OR email = ${userData.email}
      `;

      if (existingUser.length > 0) {
        return { success: false, error: 'Username or email already exists' };
      }

      // Generate user ID and hash
      const userId = `user_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const userHash = this.generateUserHash(userData.username, userData.email);

      // Hash the password
      const saltRounds = 12;
      const passwordHash = await bcrypt.hash(userData.password, saltRounds);

      const user: User = {
        id: userId,
        username: userData.username,
        email: userData.email,
        passwordHash,
        userHash,
        firstName: userData.firstName,
        lastName: userData.lastName,
        dateOfBirth: userData.dateOfBirth,
        phone: userData.phone,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      // Store user in database
      await sql`
        INSERT INTO users (
          id, username, email, password_hash, user_hash, first_name, last_name,
          date_of_birth, phone, created_at, is_active
        ) VALUES (
          ${user.id}, ${user.username}, ${user.email}, ${user.passwordHash},
          ${user.userHash}, ${user.firstName}, ${user.lastName}, 
          ${user.dateOfBirth}, ${user.phone}, ${user.createdAt}, ${user.isActive}
        )
      `;

      console.log(`✅ User registered successfully: ${user.username}`);
      
      // Remove sensitive data before returning
      const safeUser = { ...user };
      delete safeUser.passwordHash;
      
      return { success: true, user: safeUser };
    } catch (error) {
      console.error('❌ Error registering user:', error);
      return { success: false, error: 'Failed to register user' };
    }
  }

  /**
   * Authenticate user login
   */
  static async authenticateUser(loginData: UserLogin): Promise<{ success: boolean; user?: User; session?: UserSession; error?: string }> {
    try {
      // Get user by username
      const userResult = await sql`
        SELECT * FROM users 
        WHERE username = ${loginData.username} AND is_active = true
      `;

      if (userResult.length === 0) {
        return { success: false, error: 'Invalid username or password' };
      }

      const user = userResult[0];

      // Check if account is locked
      if (user.locked_until && new Date(user.locked_until) > new Date()) {
        return { success: false, error: 'Account is temporarily locked due to failed login attempts' };
      }

      // Verify password
      const isPasswordValid = await bcrypt.compare(loginData.password, user.password_hash);

      if (!isPasswordValid) {
        // Increment failed login attempts
        await sql`
          UPDATE users 
          SET failed_login_attempts = failed_login_attempts + 1,
              locked_until = CASE 
                WHEN failed_login_attempts >= 4 THEN NOW() + INTERVAL '15 minutes'
                ELSE NULL
              END
          WHERE id = ${user.id}
        `;

        return { success: false, error: 'Invalid username or password' };
      }

      // Reset failed login attempts and update last login
      await sql`
        UPDATE users 
        SET failed_login_attempts = 0, locked_until = NULL, last_login = NOW()
        WHERE id = ${user.id}
      `;

      // Create session
      const sessionId = `session_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;
      const sessionToken = this.generateSessionToken();
      const dataAccessHash = this.generateDataAccessHash(user.user_hash, user.id);
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      const session: UserSession = {
        id: sessionId,
        userId: user.id,
        sessionToken,
        dataAccessHash,
        createdAt: new Date().toISOString(),
        expiresAt: expiresAt.toISOString(),
        lastActivity: new Date().toISOString()
      };

      await sql`
        INSERT INTO user_sessions (
          id, user_id, session_token, data_access_hash, created_at, 
          expires_at, last_activity, is_active
        ) VALUES (
          ${session.id}, ${session.userId}, ${session.sessionToken}, 
          ${session.dataAccessHash}, ${session.createdAt}, ${session.expiresAt},
          ${session.lastActivity}, true
        )
      `;

      console.log(`✅ User authenticated successfully: ${user.username}`);

      // Return user without sensitive data
      const safeUser: User = {
        id: user.id,
        username: user.username,
        email: user.email,
        passwordHash: '', // Don't return password hash
        userHash: user.user_hash,
        firstName: user.first_name,
        lastName: user.last_name,
        dateOfBirth: user.date_of_birth,
        phone: user.phone,
        createdAt: user.created_at,
        lastLogin: user.last_login,
        isActive: user.is_active
      };

      return { success: true, user: safeUser, session };
    } catch (error) {
      console.error('❌ Error authenticating user:', error);
      return { success: false, error: 'Authentication failed' };
    }
  }

  /**
   * Validate session token
   */
  static async validateSession(sessionToken: string): Promise<{ valid: boolean; user?: User; session?: UserSession; error?: string }> {
    try {
      const sessionResult = await sql`
        SELECT s.*, u.id as user_id, u.username, u.email, u.user_hash, 
               u.first_name, u.last_name, u.date_of_birth, u.phone, 
               u.created_at as user_created_at, u.last_login, u.is_active
        FROM user_sessions s
        JOIN users u ON s.user_id = u.id
        WHERE s.session_token = ${sessionToken} 
        AND s.is_active = true 
        AND s.expires_at > NOW()
        AND u.is_active = true
      `;

      if (sessionResult.length === 0) {
        return { valid: false, error: 'Invalid or expired session' };
      }

      const result = sessionResult[0];

      // Update last activity
      await sql`
        UPDATE user_sessions 
        SET last_activity = NOW() 
        WHERE id = ${result.id}
      `;

      const user: User = {
        id: result.user_id,
        username: result.username,
        email: result.email,
        passwordHash: '',
        userHash: result.user_hash,
        firstName: result.first_name,
        lastName: result.last_name,
        dateOfBirth: result.date_of_birth,
        phone: result.phone,
        createdAt: result.user_created_at,
        lastLogin: result.last_login,
        isActive: result.is_active
      };

      const session: UserSession = {
        id: result.id,
        userId: result.user_id,
        sessionToken: result.session_token,
        dataAccessHash: result.data_access_hash,
        createdAt: result.created_at,
        expiresAt: result.expires_at,
        lastActivity: new Date().toISOString(),
        ipAddress: result.ip_address,
        userAgent: result.user_agent
      };

      return { valid: true, user, session };
    } catch (error) {
      console.error('❌ Error validating session:', error);
      return { valid: false, error: 'Session validation failed' };
    }
  }

  /**
   * Create data access record with hash linking
   */
  static async createDataAccessRecord(userId: string, dataRecordId: string, userHash: string): Promise<{ success: boolean; accessId?: string; error?: string }> {
    try {
      const combinedHash = this.generateDataAccessHash(userHash, dataRecordId);
      const { hash1, hash2 } = this.splitHash(combinedHash);
      
      const accessId = `access_${Date.now()}_${crypto.randomBytes(8).toString('hex')}`;

      await sql`
        INSERT INTO user_data_access (
          id, user_id, data_record_id, combined_hash, split_hash_1, split_hash_2,
          created_at, access_count
        ) VALUES (
          ${accessId}, ${userId}, ${dataRecordId}, ${combinedHash}, 
          ${hash1}, ${hash2}, NOW(), 0
        )
        ON CONFLICT (user_id, data_record_id) 
        DO UPDATE SET last_accessed = NOW(), access_count = user_data_access.access_count + 1
      `;

      console.log(`✅ Created data access record: ${accessId}`);
      return { success: true, accessId };
    } catch (error) {
      console.error('❌ Error creating data access record:', error);
      return { success: false, error: 'Failed to create data access record' };
    }
  }

  /**
   * Verify user can access data by combining hashes
   */
  static async verifyDataAccess(userId: string, dataRecordId: string): Promise<{ hasAccess: boolean; combinedHash?: string; error?: string }> {
    try {
      const accessResult = await sql`
        SELECT * FROM user_data_access 
        WHERE user_id = ${userId} AND data_record_id = ${dataRecordId}
      `;

      if (accessResult.length === 0) {
        return { hasAccess: false, error: 'No access record found' };
      }

      const accessRecord = accessResult[0];
      const combinedHash = this.combineHashes(accessRecord.split_hash_1, accessRecord.split_hash_2);

      // Update access metadata
      await sql`
        UPDATE user_data_access 
        SET last_accessed = NOW(), access_count = access_count + 1
        WHERE id = ${accessRecord.id}
      `;

      return { hasAccess: true, combinedHash };
    } catch (error) {
      console.error('❌ Error verifying data access:', error);
      return { hasAccess: false, error: 'Access verification failed' };
    }
  }

  /**
   * Get user data access records
   */
  static async getUserDataAccess(userId: string): Promise<any[]> {
    try {
      const result = await sql`
        SELECT uda.*, mh.title, mh.record_type, mh.date, mh.doctor
        FROM user_data_access uda
        LEFT JOIN medical_history mh ON uda.data_record_id = mh.id
        WHERE uda.user_id = ${userId}
        ORDER BY uda.last_accessed DESC, uda.created_at DESC
      `;

      return result.map(row => ({
        id: row.id,
        dataRecordId: row.data_record_id,
        combinedHash: row.combined_hash,
        createdAt: row.created_at,
        lastAccessed: row.last_accessed,
        accessCount: row.access_count,
        recordInfo: row.title ? {
          title: row.title,
          recordType: row.record_type,
          date: row.date,
          doctor: row.doctor
        } : null
      }));
    } catch (error) {
      console.error('❌ Error getting user data access:', error);
      return [];
    }
  }

  /**
   * Logout user (invalidate session)
   */
  static async logoutUser(sessionToken: string): Promise<{ success: boolean; error?: string }> {
    try {
      await sql`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE session_token = ${sessionToken}
      `;

      console.log('✅ User logged out successfully');
      return { success: true };
    } catch (error) {
      console.error('❌ Error logging out user:', error);
      return { success: false, error: 'Logout failed' };
    }
  }

  /**
   * Cleanup expired sessions
   */
  static async cleanupExpiredSessions(): Promise<void> {
    try {
      const result = await sql`
        UPDATE user_sessions 
        SET is_active = false 
        WHERE expires_at < NOW() AND is_active = true
      `;

      console.log(`✅ Cleaned up ${result.length} expired sessions`);
    } catch (error) {
      console.error('❌ Error cleaning up expired sessions:', error);
    }
  }

  /**
   * Get user statistics
   */
  static async getUserStats(): Promise<any> {
    try {
      const [totalUsers] = await sql`SELECT COUNT(*) as count FROM users WHERE is_active = true`;
      const [activeSessions] = await sql`SELECT COUNT(*) as count FROM user_sessions WHERE is_active = true AND expires_at > NOW()`;
      const [totalDataAccess] = await sql`SELECT COUNT(*) as count FROM user_data_access`;

      return {
        totalUsers: totalUsers.count,
        activeSessions: activeSessions.count,
        totalDataAccess: totalDataAccess.count,
        lastUpdated: new Date().toISOString()
      };
    } catch (error) {
      console.error('❌ Error getting user stats:', error);
      return {
        totalUsers: 0,
        activeSessions: 0,
        totalDataAccess: 0,
        lastUpdated: new Date().toISOString()
      };
    }
  }
}
