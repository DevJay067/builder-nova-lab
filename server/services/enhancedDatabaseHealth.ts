import { SQLiteDatabaseService } from "./sqliteDatabase";

/**
 * Enhanced Database Health Service
 * Provides comprehensive health monitoring and fallback mechanisms
 */

export interface HealthCheckResult {
  isHealthy: boolean;
  database: string;
  latency?: number;
  error?: string;
  lastChecked: Date;
  connectionStatus: string;
  fallbackActive: boolean;
  stats?: any;
}

export class EnhancedDatabaseHealthService {
  private static lastHealthCheck: Date | null = null;
  private static isHealthy = false;
  private static fallbackActive = false;
  private static currentDatabase = 'sqlite';

  /**
   * Comprehensive health check
   */
  static async checkHealth(): Promise<HealthCheckResult> {
    const startTime = Date.now();
    const now = new Date();

    try {
      console.log("🔍 Running enhanced database health check...");

      // Test SQLite database
      const sqliteHealthy = this.testSQLiteConnection();
      
      if (sqliteHealthy) {
        const latency = Date.now() - startTime;
        const stats = SQLiteDatabaseService.getStats();
        
        this.isHealthy = true;
        this.fallbackActive = false;
        this.lastHealthCheck = now;
        this.currentDatabase = 'sqlite';

        console.log(`✅ SQLite database is healthy (${latency}ms)`);

        return {
          isHealthy: true,
          database: 'sqlite',
          latency,
          lastChecked: now,
          connectionStatus: 'connected',
          fallbackActive: false,
          stats
        };
      } else {
        throw new Error('SQLite connection failed');
      }
    } catch (error) {
      console.error("❌ Database health check failed:", error);

      this.isHealthy = false;
      this.fallbackActive = true;
      this.lastHealthCheck = now;

      return {
        isHealthy: false,
        database: 'none',
        error: error instanceof Error ? error.message : 'Unknown error',
        lastChecked: now,
        connectionStatus: 'disconnected',
        fallbackActive: true
      };
    }
  }

  /**
   * Test SQLite connection
   */
  private static testSQLiteConnection(): boolean {
    try {
      return SQLiteDatabaseService.testConnection();
    } catch (error) {
      console.error("❌ SQLite connection test failed:", error);
      return false;
    }
  }

  /**
   * Get current health status
   */
  static getCurrentHealth(): {
    isHealthy: boolean;
    database: string;
    lastChecked: Date | null;
    needsCheck: boolean;
    fallbackActive: boolean;
  } {
    const needsCheck =
      !this.lastHealthCheck ||
      Date.now() - this.lastHealthCheck.getTime() > 60000; // 1 minute

    return {
      isHealthy: this.isHealthy,
      database: this.currentDatabase,
      lastChecked: this.lastHealthCheck,
      needsCheck,
      fallbackActive: this.fallbackActive
    };
  }

  /**
   * Ensure database connection is working
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
   * Execute operation with automatic fallback
   */
  static async withFallback<T>(
    operation: () => Promise<T>,
    fallback: () => T,
    maxRetries: number = 2
  ): Promise<T> {
    let lastError: Error | null = null;

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        // Check connection before attempting operation
        if (attempt === 1) {
          const isConnected = await this.ensureConnection();
          if (!isConnected) {
            console.log(`⚠️ Database not connected on attempt ${attempt}, retrying...`);
            continue;
          }
        }

        return await operation();
      } catch (error) {
        lastError = error instanceof Error ? error : new Error("Unknown error");
        console.error(`❌ Database operation failed (attempt ${attempt}/${maxRetries}):`, error);

        if (attempt < maxRetries) {
          // Wait before retry with exponential backoff
          const waitTime = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
          console.log(`⏳ Waiting ${waitTime}ms before retry...`);
          await new Promise(resolve => setTimeout(resolve, waitTime));
        }
      }
    }

    console.log("❌ All database attempts failed, using fallback");
    this.fallbackActive = true;
    return fallback();
  }

  /**
   * Initialize database with health monitoring
   */
  static async initializeWithHealth(): Promise<boolean> {
    try {
      console.log("🚀 Initializing database with health monitoring...");

      // Initialize SQLite
      SQLiteDatabaseService.initialize();
      SQLiteDatabaseService.createTables();
      SQLiteDatabaseService.runMigrations();

      // Run initial health check
      const health = await this.checkHealth();
      
      if (health.isHealthy) {
        console.log("✅ Database initialized successfully with health monitoring");
        
        // Schedule periodic health checks
        this.schedulePeriodicHealthChecks();
        
        return true;
      } else {
        console.warn("⚠️ Database initialization completed but health check failed");
        return false;
      }
    } catch (error) {
      console.error("❌ Database initialization failed:", error);
      this.fallbackActive = true;
      return false;
    }
  }

  /**
   * Schedule periodic health checks
   */
  private static schedulePeriodicHealthChecks(): void {
    // Health check every 5 minutes
    setInterval(async () => {
      try {
        await this.checkHealth();
      } catch (error) {
        console.error("❌ Periodic health check failed:", error);
      }
    }, 5 * 60 * 1000);

    // Session cleanup every hour
    setInterval(() => {
      try {
        if (this.isHealthy && !this.fallbackActive) {
          const { EnhancedUserAuthenticationService } = require("./enhancedUserAuthentication");
          EnhancedUserAuthenticationService.cleanupExpiredSessions();
        }
      } catch (error) {
        console.error("❌ Session cleanup failed:", error);
      }
    }, 60 * 60 * 1000);

    // Database optimization daily
    setInterval(() => {
      try {
        if (this.isHealthy && !this.fallbackActive) {
          SQLiteDatabaseService.optimize();
          console.log("🔧 Database optimized");
        }
      } catch (error) {
        console.error("❌ Database optimization failed:", error);
      }
    }, 24 * 60 * 60 * 1000);

    console.log("⏰ Scheduled periodic health checks and maintenance");
  }

  /**
   * Get comprehensive system status
   */
  static async getSystemStatus(): Promise<any> {
    const health = await this.checkHealth();
    const currentHealth = this.getCurrentHealth();
    
    return {
      database: {
        type: this.currentDatabase,
        isHealthy: health.isHealthy,
        latency: health.latency,
        connectionStatus: health.connectionStatus,
        fallbackActive: health.fallbackActive,
        lastChecked: health.lastChecked,
        stats: health.stats
      },
      system: {
        uptime: process.uptime(),
        memory: process.memoryUsage(),
        nodeVersion: process.version,
        platform: process.platform,
        environment: process.env.NODE_ENV
      },
      services: {
        authentication: true,
        healthRecords: true,
        imageUpload: true,
        secureDataAccess: !this.fallbackActive
      },
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Force reconnection attempt
   */
  static async forceReconnect(): Promise<boolean> {
    console.log("🔄 Forcing database reconnection...");
    
    try {
      // Reset health status
      this.isHealthy = false;
      this.lastHealthCheck = null;
      
      // Re-initialize database
      return await this.initializeWithHealth();
    } catch (error) {
      console.error("❌ Force reconnect failed:", error);
      return false;
    }
  }

  /**
   * Create backup
   */
  static async createBackup(): Promise<string | null> {
    try {
      if (this.isHealthy && !this.fallbackActive) {
        return SQLiteDatabaseService.backup();
      } else {
        console.warn("⚠️ Cannot create backup - database not healthy");
        return null;
      }
    } catch (error) {
      console.error("❌ Backup creation failed:", error);
      return null;
    }
  }

  /**
   * Get health metrics for monitoring
   */
  static getHealthMetrics(): any {
    return {
      isHealthy: this.isHealthy,
      database: this.currentDatabase,
      fallbackActive: this.fallbackActive,
      lastHealthCheck: this.lastHealthCheck,
      uptime: process.uptime(),
      memoryUsage: process.memoryUsage(),
      timestamp: new Date().toISOString()
    };
  }
}
