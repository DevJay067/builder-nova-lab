import { neon } from '@neondatabase/serverless';

// Database configuration
export const DATABASE_URL = 'postgresql://neondb_owner:npg_TQh7kV1SKXeP@ep-tiny-butterfly-aewegd39-pooler.c-2.us-east-2.aws.neon.tech/neondb?sslmode=require&channel_binding=require';

// Create database connection
export const db = neon(DATABASE_URL);

// Database tables schema
export const TABLES = {
  USERS: 'users',
  HEALTH_RECORDS: 'health_records',
  MEDICAL_SCANS: 'medical_scans',
  SESSIONS: 'sessions',
  BLOCKCHAIN_TRANSACTIONS: 'blockchain_transactions',
  SPLIT_KEYS: 'split_keys',
};

// Initialize database tables
export async function initializeDatabase() {
  try {
    console.log('🔧 Initializing database tables...');

    // Create users table
    await db`
      CREATE TABLE IF NOT EXISTS ${TABLES.USERS} (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        first_name VARCHAR(255),
        last_name VARCHAR(255),
        role VARCHAR(50) DEFAULT 'user',
        permissions TEXT[] DEFAULT '{}',
        user_hash VARCHAR(255) UNIQUE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        last_login TIMESTAMP,
        demo_mode BOOLEAN DEFAULT FALSE,
        secure_system_activated BOOLEAN DEFAULT FALSE
      )
    `;

    // Create health records table
    await db`
      CREATE TABLE IF NOT EXISTS ${TABLES.HEALTH_RECORDS} (
        id SERIAL PRIMARY KEY,
        patient_id VARCHAR(255) NOT NULL,
        type VARCHAR(100) NOT NULL,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        doctor VARCHAR(255),
        status VARCHAR(50) DEFAULT 'completed',
        blockchain_hash VARCHAR(255),
        encrypted_data TEXT,
        metadata JSONB,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create medical scans table
    await db`
      CREATE TABLE IF NOT EXISTS ${TABLES.MEDICAL_SCANS} (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ${TABLES.USERS}(id),
        scan_type VARCHAR(50) NOT NULL,
        confidence DECIMAL(3,2),
        findings TEXT[],
        diagnosis TEXT[],
        recommendations TEXT[],
        risk_level VARCHAR(20),
        image_hash VARCHAR(255),
        processing_time INTEGER,
        ai_model VARCHAR(255),
        version VARCHAR(50),
        blockchain_hash VARCHAR(255),
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create sessions table
    await db`
      CREATE TABLE IF NOT EXISTS ${TABLES.SESSIONS} (
        id SERIAL PRIMARY KEY,
        user_id INTEGER REFERENCES ${TABLES.USERS}(id),
        session_token VARCHAR(255) UNIQUE NOT NULL,
        expires_at TIMESTAMP NOT NULL,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        is_active BOOLEAN DEFAULT TRUE
      )
    `;

    // Create blockchain transactions table
    await db`
      CREATE TABLE IF NOT EXISTS ${TABLES.BLOCKCHAIN_TRANSACTIONS} (
        id SERIAL PRIMARY KEY,
        transaction_id VARCHAR(255) UNIQUE NOT NULL,
        block_hash VARCHAR(255),
        block_number INTEGER,
        from_address VARCHAR(255),
        to_address VARCHAR(255),
        data_hash VARCHAR(255),
        transaction_type VARCHAR(50),
        gas_used INTEGER,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    // Create split keys table
    await db`
      CREATE TABLE IF NOT EXISTS ${TABLES.SPLIT_KEYS} (
        id SERIAL PRIMARY KEY,
        user_hash VARCHAR(255) NOT NULL,
        data_hash VARCHAR(255) NOT NULL,
        combined_hash VARCHAR(255) UNIQUE NOT NULL,
        key_fragments TEXT[],
        recovery_keys TEXT[],
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
      )
    `;

    console.log('✅ Database tables initialized successfully');
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

// Test database connection
export async function testDatabaseConnection() {
  try {
    const result = await db`SELECT NOW() as current_time`;
    console.log('✅ Database connection successful:', result[0]);
    return true;
  } catch (error) {
    console.error('❌ Database connection failed:', error);
    return false;
  }
}

// Get database stats
export async function getDatabaseStats() {
  try {
    const stats = await db`
      SELECT 
        (SELECT COUNT(*) FROM ${TABLES.USERS}) as user_count,
        (SELECT COUNT(*) FROM ${TABLES.HEALTH_RECORDS}) as health_records_count,
        (SELECT COUNT(*) FROM ${TABLES.MEDICAL_SCANS}) as medical_scans_count,
        (SELECT COUNT(*) FROM ${TABLES.BLOCKCHAIN_TRANSACTIONS}) as blockchain_transactions_count
    `;
    return stats[0];
  } catch (error) {
    console.error('❌ Failed to get database stats:', error);
    return null;
  }
}