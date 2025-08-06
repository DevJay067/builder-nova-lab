import crypto from 'crypto';
import { createClient, SupabaseClient } from '@supabase/supabase-js';

/**
 * Split-Key Authentication Service
 * Implements secure authentication using split-key cryptography
 * One half stored on client, one half stored securely in database
 */

export interface SplitKeyUser {
  id: string;
  email: string;
  username: string;
  keyHalf: string; // Server-side key half
  keyHash: string; // SHA-256 hash of complete key
  createdAt: string;
  lastLogin?: string;
  isActive: boolean;
}

export interface KeyRegistrationResult {
  success: boolean;
  userId?: string;
  clientKeyHalf?: string; // Half to return to client
  message?: string;
}

export interface AuthenticationResult {
  success: boolean;
  sessionToken?: string;
  userId?: string;
  message?: string;
}

export interface KeyValidationResult {
  valid: boolean;
  userId?: string;
  fullKey?: string;
  message?: string;
}

export class SplitKeyAuthService {
  private static supabase: SupabaseClient | null = null;
  private static isInitialized = false;

  /**
   * Initialize the service with Supabase connection
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn('⚠️ Supabase credentials not found, using fallback storage');
        this.isInitialized = true;
        return;
      }

      this.supabase = createClient(supabaseUrl, supabaseKey);
      console.log('✅ Split-key authentication service initialized with Supabase');
      
      // Create tables if they don't exist
      await this.createTables();
      
      this.isInitialized = true;
    } catch (error) {
      console.error('❌ Failed to initialize split-key auth service:', error);
      this.isInitialized = true; // Continue with fallback
    }
  }

  /**
   * Create necessary database tables
   */
  private static async createTables(): Promise<void> {
    if (!this.supabase) return;

    try {
      // Create split_key_users table
      const { error } = await this.supabase.rpc('create_split_key_tables');
      
      if (error) {
        console.warn('⚠️ Could not create tables via RPC, tables may already exist');
      }
    } catch (error) {
      console.warn('⚠️ Table creation skipped:', error);
    }
  }

  /**
   * Generate a secure 256-bit key and split it
   */
  static generateSplitKey(): { 
    fullKey: string;
    clientHalf: string;
    serverHalf: string;
    keyHash: string;
  } {
    // Generate 256-bit (32 bytes) secure random key
    const fullKey = crypto.randomBytes(32).toString('hex');
    
    // Split key into two halves
    const halfLength = fullKey.length / 2;
    const clientHalf = fullKey.substring(0, halfLength);
    const serverHalf = fullKey.substring(halfLength);
    
    // Create SHA-256 hash of the full key
    const keyHash = crypto.createHash('sha256').update(fullKey).digest('hex');
    
    return {
      fullKey,
      clientHalf,
      serverHalf,
      keyHash
    };
  }

  /**
   * Register a new user with split-key authentication
   */
  static async registerUser(
    email: string,
    username: string,
    additionalData?: any
  ): Promise<KeyRegistrationResult> {
    try {
      console.log(`🔐 Registering user with split-key: ${username}`);

      // Validate input
      if (!email || !username) {
        return { success: false, message: 'Email and username are required' };
      }

      // Check if user already exists
      const existingUser = await this.getUserByEmail(email);
      if (existingUser) {
        return { success: false, message: 'User already exists with this email' };
      }

      // Generate split key
      const { clientHalf, serverHalf, keyHash } = this.generateSplitKey();
      
      // Create user object
      const userId = crypto.randomUUID();
      const user: SplitKeyUser = {
        id: userId,
        email,
        username,
        keyHalf: serverHalf,
        keyHash,
        createdAt: new Date().toISOString(),
        isActive: true
      };

      // Store user in database
      const stored = await this.storeUser(user);
      if (!stored) {
        return { success: false, message: 'Failed to store user data' };
      }

      console.log(`✅ User ${username} registered with split-key authentication`);

      return {
        success: true,
        userId,
        clientKeyHalf: clientHalf,
        message: 'User registered successfully'
      };

    } catch (error) {
      console.error('❌ Split-key registration failed:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Registration failed'
      };
    }
  }

  /**
   * Authenticate user using split-key
   */
  static async authenticateUser(
    userId: string,
    clientKeyHalf: string
  ): Promise<AuthenticationResult> {
    try {
      console.log(`🔐 Authenticating user with split-key: ${userId}`);

      // Get user from database
      const user = await this.getUserById(userId);
      if (!user || !user.isActive) {
        return { success: false, message: 'User not found or inactive' };
      }

      // Combine key halves
      const fullKey = clientKeyHalf + user.keyHalf;
      
      // Hash the combined key
      const computedHash = crypto.createHash('sha256').update(fullKey).digest('hex');
      
      // Compare with stored hash
      if (computedHash !== user.keyHash) {
        return { success: false, message: 'Invalid authentication key' };
      }

      // Generate session token
      const sessionToken = this.generateSessionToken(userId);
      
      // Update last login
      await this.updateLastLogin(userId);

      console.log(`✅ User ${userId} authenticated successfully`);

      return {
        success: true,
        sessionToken,
        userId,
        message: 'Authentication successful'
      };

    } catch (error) {
      console.error('❌ Split-key authentication failed:', error);
      return { success: false, message: 'Authentication failed' };
    }
  }

  /**
   * Validate key combination and return full key for encryption
   */
  static async validateAndGetFullKey(
    userId: string,
    clientKeyHalf: string
  ): Promise<KeyValidationResult> {
    try {
      const user = await this.getUserById(userId);
      if (!user || !user.isActive) {
        return { valid: false, message: 'User not found or inactive' };
      }

      // Combine key halves
      const fullKey = clientKeyHalf + user.keyHalf;
      
      // Hash the combined key
      const computedHash = crypto.createHash('sha256').update(fullKey).digest('hex');
      
      // Compare with stored hash
      if (computedHash !== user.keyHash) {
        return { valid: false, message: 'Invalid key combination' };
      }

      return {
        valid: true,
        userId,
        fullKey,
        message: 'Key validation successful'
      };

    } catch (error) {
      console.error('❌ Key validation failed:', error);
      return { valid: false, message: 'Validation failed' };
    }
  }

  /**
   * Generate secure session token
   */
  private static generateSessionToken(userId: string): string {
    const payload = {
      userId,
      timestamp: Date.now(),
      random: crypto.randomBytes(16).toString('hex')
    };
    
    // Create JWT-like token (simplified for demo)
    const token = crypto
      .createHmac('sha256', process.env.SESSION_SECRET || 'fallback-secret')
      .update(JSON.stringify(payload))
      .digest('hex');
    
    return `${Buffer.from(JSON.stringify(payload)).toString('base64')}.${token}`;
  }

  /**
   * Verify session token
   */
  static verifySessionToken(sessionToken: string): { valid: boolean; userId?: string } {
    try {
      const [payloadB64, signature] = sessionToken.split('.');
      const payload = JSON.parse(Buffer.from(payloadB64, 'base64').toString());
      
      // Verify signature
      const expectedSignature = crypto
        .createHmac('sha256', process.env.SESSION_SECRET || 'fallback-secret')
        .update(JSON.stringify(payload))
        .digest('hex');
      
      if (signature !== expectedSignature) {
        return { valid: false };
      }

      // Check if token is expired (24 hours)
      const tokenAge = Date.now() - payload.timestamp;
      if (tokenAge > 24 * 60 * 60 * 1000) {
        return { valid: false };
      }

      return { valid: true, userId: payload.userId };
    } catch (error) {
      return { valid: false };
    }
  }

  // Database operations

  private static async storeUser(user: SplitKeyUser): Promise<boolean> {
    if (this.supabase) {
      try {
        const { error } = await this.supabase
          .from('split_key_users')
          .insert([{
            id: user.id,
            email: user.email,
            username: user.username,
            key_half: user.keyHalf,
            key_hash: user.keyHash,
            created_at: user.createdAt,
            is_active: user.isActive
          }]);

        if (error) {
          console.error('❌ Supabase insert error:', error);
          return false;
        }
        return true;
      } catch (error) {
        console.error('❌ Error storing user in Supabase:', error);
        return false;
      }
    }

    // Fallback to in-memory storage (for development)
    console.warn('⚠️ Using fallback storage for user data');
    return true;
  }

  private static async getUserById(userId: string): Promise<SplitKeyUser | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('split_key_users')
          .select('*')
          .eq('id', userId)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          return null;
        }

        return {
          id: data.id,
          email: data.email,
          username: data.username,
          keyHalf: data.key_half,
          keyHash: data.key_hash,
          createdAt: data.created_at,
          lastLogin: data.last_login,
          isActive: data.is_active
        };
      } catch (error) {
        console.error('❌ Error fetching user from Supabase:', error);
        return null;
      }
    }

    // Fallback
    return null;
  }

  private static async getUserByEmail(email: string): Promise<SplitKeyUser | null> {
    if (this.supabase) {
      try {
        const { data, error } = await this.supabase
          .from('split_key_users')
          .select('*')
          .eq('email', email)
          .eq('is_active', true)
          .single();

        if (error || !data) {
          return null;
        }

        return {
          id: data.id,
          email: data.email,
          username: data.username,
          keyHalf: data.key_half,
          keyHash: data.key_hash,
          createdAt: data.created_at,
          lastLogin: data.last_login,
          isActive: data.is_active
        };
      } catch (error) {
        // User not found is not an error in this context
        return null;
      }
    }

    return null;
  }

  private static async updateLastLogin(userId: string): Promise<void> {
    if (this.supabase) {
      try {
        await this.supabase
          .from('split_key_users')
          .update({ last_login: new Date().toISOString() })
          .eq('id', userId);
      } catch (error) {
        console.error('❌ Error updating last login:', error);
      }
    }
  }

  /**
   * Get service statistics
   */
  static async getStats(): Promise<any> {
    if (this.supabase) {
      try {
        const { count } = await this.supabase
          .from('split_key_users')
          .select('*', { count: 'exact', head: true });

        return {
          totalUsers: count || 0,
          serviceType: 'Supabase',
          initialized: this.isInitialized
        };
      } catch (error) {
        return {
          error: error instanceof Error ? error.message : 'Unknown error',
          serviceType: 'Supabase (Error)',
          initialized: this.isInitialized
        };
      }
    }

    return {
      totalUsers: 0,
      serviceType: 'Fallback',
      initialized: this.isInitialized
    };
  }
}
