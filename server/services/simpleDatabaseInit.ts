import { neon } from "@neondatabase/serverless";

// Only initialize if DATABASE_URL is properly configured
const sql = process.env.DATABASE_URL && process.env.DATABASE_URL !== ""
  ? neon(process.env.DATABASE_URL)
  : null;

export class SimpleDatabaseInit {
  /**
   * Initialize only the essential medical_history table
   */
  static async initializeMedicalHistoryTable(): Promise<void> {
    if (!sql) {
      console.log("⚠️ Database not configured, skipping table creation");
      return;
    }

    try {
      console.log("🏥 Creating medical_history table...");

      // Create medical_history table for health records
      await sql`
        CREATE TABLE IF NOT EXISTS medical_history (
          id VARCHAR(255) PRIMARY KEY,
          patient_id VARCHAR(255) NOT NULL,
          record_type VARCHAR(50) NOT NULL,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          doctor VARCHAR(255),
          date DATE NOT NULL,
          metadata JSONB,
          secure_record_id VARCHAR(255),
          created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `;

      // Create essential indexes
      await sql`CREATE INDEX IF NOT EXISTS idx_medical_history_patient_id ON medical_history(patient_id)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_medical_history_date ON medical_history(date)`;
      await sql`CREATE INDEX IF NOT EXISTS idx_medical_history_record_type ON medical_history(record_type)`;

      console.log("✅ Medical history table created successfully");
    } catch (error) {
      console.log("⚠️ Database connection failed, using in-memory storage");
      // Don't throw error, allow fallback to in-memory storage
    }
  }

  /**
   * Test database connectivity
   */
  static async testConnection(): Promise<boolean> {
    try {
      await sql`SELECT 1 as test`;
      return true;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }
}
