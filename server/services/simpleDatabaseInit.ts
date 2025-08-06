import { neon } from "@neondatabase/serverless";

let sql: ReturnType<typeof neon> | null = null;

function getDatabase() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl) {
      throw new Error("DATABASE_URL environment variable is not set");
    }
    sql = neon(dbUrl);
  }
  return sql;
}

export class SimpleDatabaseInit {
  /**
   * Initialize only the essential medical_history table
   */
  static async initializeMedicalHistoryTable(): Promise<void> {
    try {
      console.log("🏥 Creating medical_history table...");

      const sql = getDatabase();

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
      console.error("❌ Error creating medical_history table:", error);
      throw error;
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
