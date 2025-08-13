import { neon } from "@neondatabase/serverless";

// Database connection with fallback for missing environment variables
const getDatabaseUrl = () => {
  const dbUrl = process.env.DATABASE_URL;
  if (!dbUrl) {
    console.warn("⚠️ DATABASE_URL not set, using fallback connection");
    // Return a dummy URL that won't actually connect but prevents build errors
    return "postgresql://dummy:dummy@localhost/dummy";
  }
  return dbUrl;
};

const sql = neon(getDatabaseUrl());

export class SimpleDatabaseInit {
  static async initializeDatabase(): Promise<void> {
    try {
      // Only try to connect if we have a real database URL
      if (process.env.DATABASE_URL) {
        await sql`SELECT 1`;
        console.log("✅ Database connection successful");
      } else {
        console.log("⚠️ Skipping database initialization - no DATABASE_URL");
      }
    } catch (error) {
      console.warn("⚠️ Database initialization failed:", error);
      // Don't throw error to prevent build failures
    }
  }
}
