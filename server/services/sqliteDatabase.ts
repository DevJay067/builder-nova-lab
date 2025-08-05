import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

/**
 * SQLite Database Service
 * Provides a reliable, file-based database solution with cloud backup options
 */

export interface DatabaseConfig {
  databasePath?: string;
  enableWAL?: boolean;
  enableSync?: boolean;
  maxConnections?: number;
}

export class SQLiteDatabaseService {
  private static instance: Database.Database | null = null;
  private static isInitialized = false;
  private static config: DatabaseConfig = {
    databasePath: 'data/healthchain.db',
    enableWAL: true,
    enableSync: true,
    maxConnections: 10
  };

  /**
   * Initialize the SQLite database
   */
  static initialize(config: DatabaseConfig = {}): Database.Database {
    if (this.instance) {
      return this.instance;
    }

    try {
      this.config = { ...this.config, ...config };
      
      // Ensure data directory exists
      const dataDir = path.dirname(this.config.databasePath!);
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
        console.log(`📁 Created database directory: ${dataDir}`);
      }

      // Initialize SQLite database
      this.instance = new Database(this.config.databasePath!, {
        verbose: process.env.NODE_ENV === 'development' ? console.log : undefined
      });

      // Enable WAL mode for better concurrency
      if (this.config.enableWAL) {
        this.instance.pragma('journal_mode = WAL');
      }

      // Enable foreign key constraints
      this.instance.pragma('foreign_keys = ON');

      // Optimize for better performance
      this.instance.pragma('synchronous = NORMAL');
      this.instance.pragma('cache_size = 1000');
      this.instance.pragma('temp_store = memory');

      console.log(`✅ SQLite database initialized: ${this.config.databasePath}`);
      this.isInitialized = true;
      
      return this.instance;
    } catch (error) {
      console.error('❌ Failed to initialize SQLite database:', error);
      throw error;
    }
  }

  /**
   * Get database instance
   */
  static getInstance(): Database.Database {
    if (!this.instance) {
      return this.initialize();
    }
    return this.instance;
  }

  /**
   * Create all required tables
   */
  static createTables(): void {
    const db = this.getInstance();

    try {
      // Users table
      db.exec(`
        CREATE TABLE IF NOT EXISTS users (
          id TEXT PRIMARY KEY,
          username TEXT UNIQUE NOT NULL,
          password_hash TEXT NOT NULL,
          user_hash TEXT NOT NULL,
          email TEXT,
          first_name TEXT,
          last_name TEXT,
          date_of_birth TEXT,
          phone TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_login DATETIME,
          secure_system_activated BOOLEAN DEFAULT 0,
          split_key_system_active BOOLEAN DEFAULT 0,
          is_active BOOLEAN DEFAULT 1
        )
      `);

      // Create indexes for users table
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
        CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
        CREATE INDEX IF NOT EXISTS idx_users_user_hash ON users(user_hash);
      `);

      // Medical records table
      db.exec(`
        CREATE TABLE IF NOT EXISTS medical_records (
          id TEXT PRIMARY KEY,
          patient_id TEXT NOT NULL,
          record_type TEXT NOT NULL,
          title TEXT NOT NULL,
          description TEXT,
          date DATE NOT NULL,
          doctor TEXT,
          facility TEXT,
          diagnosis TEXT,
          treatment TEXT,
          medications TEXT,
          notes TEXT,
          metadata TEXT,
          secure_record_id TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (patient_id) REFERENCES users(username)
        )
      `);

      // Create indexes for medical records
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_medical_records_patient ON medical_records(patient_id);
        CREATE INDEX IF NOT EXISTS idx_medical_records_type ON medical_records(record_type);
        CREATE INDEX IF NOT EXISTS idx_medical_records_date ON medical_records(date);
      `);

      // Medical images table
      db.exec(`
        CREATE TABLE IF NOT EXISTS medical_images (
          id TEXT PRIMARY KEY,
          record_id TEXT NOT NULL,
          filename TEXT NOT NULL,
          original_name TEXT,
          mime_type TEXT,
          size INTEGER,
          base64_data TEXT,
          analysis_result TEXT,
          confidence_score REAL,
          upload_date DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (record_id) REFERENCES medical_records(id)
        )
      `);

      // User sessions table
      db.exec(`
        CREATE TABLE IF NOT EXISTS user_sessions (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          session_token TEXT UNIQUE NOT NULL,
          expires_at DATETIME NOT NULL,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          last_accessed DATETIME DEFAULT CURRENT_TIMESTAMP,
          ip_address TEXT,
          user_agent TEXT,
          is_active BOOLEAN DEFAULT 1,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // Create indexes for sessions
      db.exec(`
        CREATE INDEX IF NOT EXISTS idx_sessions_token ON user_sessions(session_token);
        CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);
        CREATE INDEX IF NOT EXISTS idx_sessions_expires ON user_sessions(expires_at);
      `);

      // Data access logs table for audit
      db.exec(`
        CREATE TABLE IF NOT EXISTS data_access_logs (
          id TEXT PRIMARY KEY,
          user_id TEXT NOT NULL,
          action TEXT NOT NULL,
          resource_type TEXT NOT NULL,
          resource_id TEXT,
          ip_address TEXT,
          user_agent TEXT,
          success BOOLEAN DEFAULT 1,
          error_message TEXT,
          created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (user_id) REFERENCES users(id)
        )
      `);

      // System health table
      db.exec(`
        CREATE TABLE IF NOT EXISTS system_health (
          id INTEGER PRIMARY KEY AUTOINCREMENT,
          component TEXT NOT NULL,
          status TEXT NOT NULL,
          message TEXT,
          details TEXT,
          checked_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
      `);

      console.log('✅ All database tables created successfully');
    } catch (error) {
      console.error('❌ Error creating database tables:', error);
      throw error;
    }
  }

  /**
   * Run database migrations
   */
  static runMigrations(): void {
    const db = this.getInstance();
    
    try {
      // Check if migrations table exists
      const migrationExists = db.prepare(`
        SELECT name FROM sqlite_master 
        WHERE type='table' AND name='migrations'
      `).get();

      if (!migrationExists) {
        db.exec(`
          CREATE TABLE migrations (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            version TEXT UNIQUE NOT NULL,
            applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
          )
        `);
      }

      // Add new columns if they don't exist
      const addColumnIfNotExists = (table: string, column: string, definition: string) => {
        try {
          db.exec(`ALTER TABLE ${table} ADD COLUMN ${column} ${definition}`);
          console.log(`✅ Added column ${column} to ${table}`);
        } catch (error: any) {
          if (error.message.includes('duplicate column name')) {
            // Column already exists, ignore
          } else {
            console.warn(`⚠️ Could not add column ${column} to ${table}:`, error.message);
          }
        }
      };

      // Migration: Add missing columns to users table
      addColumnIfNotExists('users', 'phone', 'TEXT');
      addColumnIfNotExists('users', 'date_of_birth', 'TEXT');
      addColumnIfNotExists('users', 'is_active', 'BOOLEAN DEFAULT 1');

      // Migration: Add missing columns to medical_records table
      addColumnIfNotExists('medical_records', 'facility', 'TEXT');
      addColumnIfNotExists('medical_records', 'diagnosis', 'TEXT');
      addColumnIfNotExists('medical_records', 'treatment', 'TEXT');
      addColumnIfNotExists('medical_records', 'medications', 'TEXT');
      addColumnIfNotExists('medical_records', 'notes', 'TEXT');
      addColumnIfNotExists('medical_records', 'updated_at', 'DATETIME DEFAULT CURRENT_TIMESTAMP');

      console.log('✅ Database migrations completed');
    } catch (error) {
      console.error('❌ Error running migrations:', error);
    }
  }

  /**
   * Test database connection
   */
  static testConnection(): boolean {
    try {
      const db = this.getInstance();
      const result = db.prepare('SELECT 1 as test').get();
      console.log('✅ Database connection test successful');
      return true;
    } catch (error) {
      console.error('❌ Database connection test failed:', error);
      return false;
    }
  }

  /**
   * Get database statistics
   */
  static getStats(): any {
    try {
      const db = this.getInstance();
      
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
      const recordCount = db.prepare('SELECT COUNT(*) as count FROM medical_records').get();
      const sessionCount = db.prepare('SELECT COUNT(*) as count FROM user_sessions WHERE is_active = 1').get();
      
      const dbSize = fs.statSync(this.config.databasePath!).size;
      
      return {
        users: userCount?.count || 0,
        medicalRecords: recordCount?.count || 0,
        activeSessions: sessionCount?.count || 0,
        databaseSize: dbSize,
        databasePath: this.config.databasePath,
        isInitialized: this.isInitialized,
        walMode: this.config.enableWAL
      };
    } catch (error) {
      console.error('❌ Error getting database stats:', error);
      return {
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  /**
   * Backup database
   */
  static backup(backupPath?: string): string {
    try {
      const db = this.getInstance();
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const defaultBackupPath = `data/backups/healthchain-backup-${timestamp}.db`;
      const finalBackupPath = backupPath || defaultBackupPath;
      
      // Ensure backup directory exists
      const backupDir = path.dirname(finalBackupPath);
      if (!fs.existsSync(backupDir)) {
        fs.mkdirSync(backupDir, { recursive: true });
      }
      
      db.backup(finalBackupPath);
      console.log(`✅ Database backed up to: ${finalBackupPath}`);
      return finalBackupPath;
    } catch (error) {
      console.error('❌ Error backing up database:', error);
      throw error;
    }
  }

  /**
   * Close database connection
   */
  static close(): void {
    if (this.instance) {
      try {
        this.instance.close();
        this.instance = null;
        this.isInitialized = false;
        console.log('✅ Database connection closed');
      } catch (error) {
        console.error('❌ Error closing database:', error);
      }
    }
  }

  /**
   * Execute a transaction
   */
  static transaction<T>(fn: (db: Database.Database) => T): T {
    const db = this.getInstance();
    const transaction = db.transaction(fn);
    return transaction();
  }

  /**
   * Clean up old sessions
   */
  static cleanupSessions(): void {
    try {
      const db = this.getInstance();
      const result = db.prepare(`
        DELETE FROM user_sessions 
        WHERE expires_at < datetime('now') OR is_active = 0
      `).run();
      
      console.log(`🧹 Cleaned up ${result.changes} expired sessions`);
    } catch (error) {
      console.error('❌ Error cleaning up sessions:', error);
    }
  }

  /**
   * Optimize database
   */
  static optimize(): void {
    try {
      const db = this.getInstance();
      db.exec('VACUUM;');
      db.exec('ANALYZE;');
      console.log('✅ Database optimized');
    } catch (error) {
      console.error('❌ Error optimizing database:', error);
    }
  }
}
