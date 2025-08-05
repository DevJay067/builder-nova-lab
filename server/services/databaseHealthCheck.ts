import { neon } from "@neondatabase/serverless";

/**
 * Database Health Check Service
 * Monitors database connectivity and provides fallback mechanisms
 */

// Lazy initialization of database connection to handle missing env vars
let sql: any = null;

function getSqlConnection() {
  if (!sql) {
    const dbUrl = process.env.DATABASE_URL;
    if (!dbUrl || dbUrl.includes('dummy') || dbUrl === '') {
      throw new Error('No valid database connection available');
    }
    sql = neon(dbUrl);
  }
  return sql;
}

export class DatabaseHealthService {
  private static lastHealthCheck: Date | null = null;
  private static isHealthy = false;
  private static connectionPool: any = null;

  /**
   * Check database health
   */
  static async checkHealth(): Promise<{
    isHealthy: boolean;
    lastChecked: Date;
    connectionStatus: string;
    latency?: number;
  }> {
    const startTime = Date.now();

    try {
      console.log("🔍 Checking database health...");

      // Simple connectivity test
      const result = await sql`SELECT 1 as health_check`;

      const latency = Date.now() - startTime;
      this.isHealthy = true;
      this.lastHealthCheck = new Date();

      console.log(`✅ Database is healthy (${latency}ms latency)`);

      return {
        isHealthy: true,
        lastChecked: this.lastHealthCheck,
        connectionStatus: "connected",
        latency,
      };
    } catch (error) {
      console.error("❌ Database health check failed:", error);

      this.isHealthy = false;
      this.lastHealthCheck = new Date();

      return {
        isHealthy: false,
        lastChecked: this.lastHealthCheck,
        connectionStatus: `error: ${error instanceof Error ? error.message : "Unknown error"}`,
      };
    }
  }

  /**
   * Get current health status
   */
  static getCurrentHealth(): {
    isHealthy: boolean;
    lastChecked: Date | null;
    needsCheck: boolean;
  } {
    const needsCheck =
      !this.lastHealthCheck ||
      Date.now() - this.lastHealthCheck.getTime() > 30000; // 30 seconds

    return {
      isHealthy: this.isHealthy,
      lastChecked: this.lastHealthCheck,
      needsCheck,
    };
  }

  /**
   * Test database connection before operations
   */
  static async ensureConnection(): Promise<boolean> {
    const currentHealth = this.getCurrentHealth();

    if (currentHealth.needsCheck || !currentHealth.isHealthy) {
      const healthCheck = await this.checkHealth();
      return healthCheck.isHealthy;
    }

    return currentHealth.isHealthy;
  }

  /**
   * Retry database operation with fallback
   */
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    maxRetries: number = 3,
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let i = 0; i < maxRetries; i++) {
      try {
        const isConnected = await this.ensureConnection();
        if (!isConnected && i === 0) {
          console.log("Database not connected, retrying...");
          continue;
        }

        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(
          `Database operation failed (attempt ${i + 1}/${maxRetries}):`,
          error,
        );

        if (i < maxRetries - 1) {
          // Wait before retry
          await new Promise((resolve) => setTimeout(resolve, 1000 * (i + 1)));
        }
      }
    }

    console.log("All database retries failed, using fallback");
    return fallback();
  }

  /**
   * Reset connection pool
   */
  static resetConnection(): void {
    console.log("🔄 Resetting database connection...");
    this.isHealthy = false;
    this.lastHealthCheck = null;
    this.connectionPool = null;
  }

  /**
   * Get connection statistics
   */
  static getStats(): {
    isHealthy: boolean;
    lastChecked: string | null;
    uptime: string;
    connectionAttempts: number;
  } {
    return {
      isHealthy: this.isHealthy,
      lastChecked: this.lastHealthCheck?.toISOString() || null,
      uptime: process.uptime().toFixed(2) + " seconds",
      connectionAttempts: 0, // Could be implemented if needed
    };
  }
}
