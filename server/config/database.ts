import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';

// Database configuration
const DB_PATH = process.env.DB_PATH || path.join(process.cwd(), 'data', 'healthchain.db');
const DATA_DIR = path.dirname(DB_PATH);

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

// Initialize SQLite database
export const db = new Database(DB_PATH);

// Enable WAL mode for better performance
db.pragma('journal_mode = WAL');
db.pragma('synchronous = NORMAL');
db.pragma('cache_size = 1000000');
db.pragma('temp_store = memory');

// Create tables if they don't exist
export function initializeDatabase() {
  // Blockchain blocks table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blocks (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      block_number INTEGER UNIQUE NOT NULL,
      previous_hash TEXT NOT NULL,
      merkle_root TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      nonce INTEGER NOT NULL,
      difficulty INTEGER NOT NULL,
      hash TEXT UNIQUE NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Blockchain transactions table
  db.exec(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      transaction_id TEXT UNIQUE NOT NULL,
      block_number INTEGER,
      from_address TEXT NOT NULL,
      to_address TEXT NOT NULL,
      data_hash TEXT NOT NULL,
      signature TEXT NOT NULL,
      timestamp INTEGER NOT NULL,
      gas_used INTEGER NOT NULL,
      status TEXT DEFAULT 'pending',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (block_number) REFERENCES blocks(block_number)
    )
  `);

  // Health records table
  db.exec(`
    CREATE TABLE IF NOT EXISTS health_records (
      id TEXT PRIMARY KEY,
      patient_id TEXT NOT NULL,
      transaction_id TEXT NOT NULL,
      record_type TEXT NOT NULL,
      title TEXT NOT NULL,
      description TEXT,
      doctor TEXT,
      date TEXT NOT NULL,
      status TEXT DEFAULT 'completed',
      encrypted_data TEXT NOT NULL,
      metadata_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (transaction_id) REFERENCES transactions(transaction_id)
    )
  `);

  // Patient profiles table
  db.exec(`
    CREATE TABLE IF NOT EXISTS patient_profiles (
      id TEXT PRIMARY KEY,
      wallet_address TEXT UNIQUE NOT NULL,
      public_key TEXT NOT NULL,
      encrypted_private_key TEXT NOT NULL,
      encryption_key_hash TEXT NOT NULL,
      record_count INTEGER DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_access DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Blockchain state table
  db.exec(`
    CREATE TABLE IF NOT EXISTS blockchain_state (
      id INTEGER PRIMARY KEY CHECK (id = 1),
      current_block_number INTEGER NOT NULL,
      total_transactions INTEGER DEFAULT 0,
      difficulty INTEGER DEFAULT 4,
      last_block_hash TEXT,
      network_status TEXT DEFAULT 'active',
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Initialize blockchain state if empty
  const stateExists = db.prepare('SELECT COUNT(*) as count FROM blockchain_state').get() as { count: number };
  if (stateExists.count === 0) {
    db.prepare(`
      INSERT INTO blockchain_state (current_block_number, difficulty, last_block_hash, network_status)
      VALUES (0, 4, '0000000000000000000000000000000000000000000000000000000000000000', 'active')
    `).run();
  }

  // Create indexes for performance
  db.exec(`
    CREATE INDEX IF NOT EXISTS idx_transactions_block_number ON transactions(block_number);
    CREATE INDEX IF NOT EXISTS idx_health_records_patient_id ON health_records(patient_id);
    CREATE INDEX IF NOT EXISTS idx_transactions_from_address ON transactions(from_address);
    CREATE INDEX IF NOT EXISTS idx_blocks_hash ON blocks(hash);
    CREATE INDEX IF NOT EXISTS idx_transactions_transaction_id ON transactions(transaction_id);
  `);

  console.log('✅ Database initialized successfully');
}

// Prepared statements for better performance
export const statements = {
  // Blocks
  insertBlock: db.prepare(`
    INSERT INTO blocks (block_number, previous_hash, merkle_root, timestamp, nonce, difficulty, hash)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `),
  getBlock: db.prepare('SELECT * FROM blocks WHERE block_number = ?'),
  getLatestBlock: db.prepare('SELECT * FROM blocks ORDER BY block_number DESC LIMIT 1'),

  // Transactions
  insertTransaction: db.prepare(`
    INSERT INTO transactions (transaction_id, block_number, from_address, to_address, data_hash, signature, timestamp, gas_used, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getTransaction: db.prepare('SELECT * FROM transactions WHERE transaction_id = ?'),
  getPendingTransactions: db.prepare('SELECT * FROM transactions WHERE status = "pending" ORDER BY timestamp ASC'),
  updateTransactionStatus: db.prepare('UPDATE transactions SET status = ?, block_number = ? WHERE transaction_id = ?'),

  // Health Records
  insertHealthRecord: db.prepare(`
    INSERT INTO health_records (id, patient_id, transaction_id, record_type, title, description, doctor, date, status, encrypted_data, metadata_hash)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `),
  getHealthRecord: db.prepare('SELECT * FROM health_records WHERE id = ?'),
  getPatientHealthRecords: db.prepare('SELECT * FROM health_records WHERE patient_id = ? ORDER BY date DESC'),

  // Patient Profiles
  insertPatientProfile: db.prepare(`
    INSERT INTO patient_profiles (id, wallet_address, public_key, encrypted_private_key, encryption_key_hash, record_count)
    VALUES (?, ?, ?, ?, ?, ?)
  `),
  getPatientProfile: db.prepare('SELECT * FROM patient_profiles WHERE id = ?'),
  updatePatientRecordCount: db.prepare('UPDATE patient_profiles SET record_count = record_count + 1, last_access = CURRENT_TIMESTAMP WHERE id = ?'),

  // Blockchain State
  getBlockchainState: db.prepare('SELECT * FROM blockchain_state WHERE id = 1'),
  updateBlockchainState: db.prepare(`
    UPDATE blockchain_state 
    SET current_block_number = ?, total_transactions = ?, last_block_hash = ?, updated_at = CURRENT_TIMESTAMP 
    WHERE id = 1
  `),
  incrementDifficulty: db.prepare('UPDATE blockchain_state SET difficulty = difficulty + 1 WHERE id = 1'),
  decrementDifficulty: db.prepare('UPDATE blockchain_state SET difficulty = CASE WHEN difficulty > 1 THEN difficulty - 1 ELSE 1 END WHERE id = 1')
};

// Initialize database on import
initializeDatabase();
