import { ProductionBlockchainService } from './productionBlockchain';

/**
 * Blockchain monitoring and health check service
 */

export interface BlockchainHealth {
  status: 'healthy' | 'warning' | 'critical';
  uptime: number;
  performance: {
    avgBlockTime: number;
    transactionThroughput: number;
    pendingTransactions: number;
  };
  integrity: {
    isValid: boolean;
    totalBlocks: number;
    invalidBlocks: number;
  };
  network: {
    difficulty: number;
    hashRate: number;
    networkStatus: string;
  };
  storage: {
    totalRecords: number;
    verifiedRecords: number;
    storageSize: string;
  };
}

export class BlockchainMonitorService {
  private static startTime = Date.now();
  private static readonly CHECK_INTERVAL = 30000; // 30 seconds
  private static monitoringInterval: NodeJS.Timeout | null = null;
  private static healthHistory: BlockchainHealth[] = [];
  private static readonly MAX_HISTORY = 100; // Keep last 100 health checks

  /**
   * Start blockchain monitoring
   */
  static startMonitoring(): void {
    console.log('🔍 Starting blockchain monitoring service...');
    
    // Initial health check
    this.performHealthCheck();
    
    // Set up periodic monitoring
    this.monitoringInterval = setInterval(() => {
      this.performHealthCheck();
    }, this.CHECK_INTERVAL);
    
    console.log('✅ Blockchain monitoring service started');
  }

  /**
   * Stop blockchain monitoring
   */
  static stopMonitoring(): void {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
      console.log('🛑 Blockchain monitoring service stopped');
    }
  }

  /**
   * Perform comprehensive health check
   */
  static async performHealthCheck(): Promise<BlockchainHealth> {
    try {
      const health = await this.generateHealthReport();
      
      // Add to history
      this.healthHistory.push(health);
      if (this.healthHistory.length > this.MAX_HISTORY) {
        this.healthHistory.shift();
      }
      
      // Log warnings or critical issues
      if (health.status === 'warning') {
        console.warn('⚠️  Blockchain health warning detected:', this.getHealthSummary(health));
      } else if (health.status === 'critical') {
        console.error('🚨 Critical blockchain issue detected:', this.getHealthSummary(health));
      }
      
      return health;
    } catch (error) {
      console.error('❌ Error performing blockchain health check:', error);
      return this.createCriticalHealth(error.message);
    }
  }

  /**
   * Generate comprehensive health report
   */
  private static async generateHealthReport(): Promise<BlockchainHealth> {
    // Get blockchain stats
    const stats = ProductionBlockchainService.getBlockchainStats();
    
    // Get integrity verification
    const integrity = await ProductionBlockchainService.verifyBlockchainIntegrity();
    
    // Calculate performance metrics
    const performance = this.calculatePerformanceMetrics(stats);
    
    // Calculate storage metrics
    const storage = this.calculateStorageMetrics();
    
    // Calculate network metrics
    const network = this.calculateNetworkMetrics(stats);
    
    // Determine overall health status
    const status = this.determineHealthStatus(integrity, performance, network);
    
    return {
      status,
      uptime: Date.now() - this.startTime,
      performance,
      integrity: {
        isValid: integrity.isValid,
        totalBlocks: integrity.totalBlocks,
        invalidBlocks: integrity.invalidBlocks.length
      },
      network,
      storage
    };
  }

  /**
   * Calculate performance metrics
   */
  private static calculatePerformanceMetrics(stats: any) {
    const currentTime = Date.now();
    const oneHourAgo = currentTime - (60 * 60 * 1000);

    // Get recent transactions for throughput calculation
    const { db } = require('../config/database');
    const recentTransactions = db.prepare(`
      SELECT COUNT(*) as count FROM transactions
      WHERE timestamp > ?
    `).get(oneHourAgo) as { count: number };
    
    const transactionThroughput = recentTransactions.count / 60; // per minute
    
    return {
      avgBlockTime: stats.avgBlockTime || 60000,
      transactionThroughput,
      pendingTransactions: stats.pendingTransactions || 0
    };
  }

  /**
   * Calculate storage metrics
   */
  private static calculateStorageMetrics() {
    const { db } = require('../config/database');
    const totalRecords = db.prepare('SELECT COUNT(*) as count FROM health_records').get() as { count: number };
    const verifiedRecords = db.prepare(`
      SELECT COUNT(*) as count FROM health_records hr
      INNER JOIN transactions t ON hr.transaction_id = t.transaction_id
      WHERE t.status = 'confirmed'
    `).get() as { count: number };
    
    // Estimate storage size (rough calculation)
    const avgRecordSize = 1024; // 1KB per record estimate
    const storageSizeBytes = totalRecords.count * avgRecordSize;
    const storageSize = this.formatBytes(storageSizeBytes);
    
    return {
      totalRecords: totalRecords.count,
      verifiedRecords: verifiedRecords.count,
      storageSize
    };
  }

  /**
   * Calculate network metrics
   */
  private static calculateNetworkMetrics(stats: any) {
    // Estimate hash rate based on difficulty and block time
    const hashRate = this.estimateHashRate(stats.difficulty, stats.avgBlockTime);
    
    return {
      difficulty: stats.difficulty || 4,
      hashRate,
      networkStatus: stats.networkStatus || 'active'
    };
  }

  /**
   * Determine overall health status
   */
  private static determineHealthStatus(
    integrity: any,
    performance: any,
    network: any
  ): 'healthy' | 'warning' | 'critical' {
    // Critical conditions
    if (!integrity.isValid || integrity.invalidBlocks > 0) {
      return 'critical';
    }
    
    if (network.networkStatus !== 'active') {
      return 'critical';
    }
    
    // Warning conditions
    if (performance.pendingTransactions > 100) {
      return 'warning';
    }
    
    if (performance.avgBlockTime > 120000) { // More than 2 minutes
      return 'warning';
    }
    
    if (performance.transactionThroughput < 0.1) { // Less than 0.1 tx/min
      return 'warning';
    }
    
    return 'healthy';
  }

  /**
   * Get current health status
   */
  static getCurrentHealth(): BlockchainHealth | null {
    return this.healthHistory[this.healthHistory.length - 1] || null;
  }

  /**
   * Get health history
   */
  static getHealthHistory(limit: number = 50): BlockchainHealth[] {
    return this.healthHistory.slice(-limit);
  }

  /**
   * Get health summary for logging
   */
  private static getHealthSummary(health: BlockchainHealth): string {
    return `Status: ${health.status}, Blocks: ${health.integrity.totalBlocks}, ` +
           `Pending TXs: ${health.performance.pendingTransactions}, ` +
           `Avg Block Time: ${health.performance.avgBlockTime}ms`;
  }

  /**
   * Create critical health status for errors
   */
  private static createCriticalHealth(error: string): BlockchainHealth {
    return {
      status: 'critical',
      uptime: Date.now() - this.startTime,
      performance: {
        avgBlockTime: 0,
        transactionThroughput: 0,
        pendingTransactions: 0
      },
      integrity: {
        isValid: false,
        totalBlocks: 0,
        invalidBlocks: 1
      },
      network: {
        difficulty: 0,
        hashRate: 0,
        networkStatus: `error: ${error}`
      },
      storage: {
        totalRecords: 0,
        verifiedRecords: 0,
        storageSize: '0 B'
      }
    };
  }

  /**
   * Estimate hash rate based on difficulty and block time
   */
  private static estimateHashRate(difficulty: number, avgBlockTime: number): number {
    // Rough estimation: hash rate = (2^difficulty) / block_time_in_seconds
    const targetTimeSeconds = avgBlockTime / 1000;
    const targetHash = Math.pow(2, difficulty);
    return targetHash / targetTimeSeconds;
  }

  /**
   * Format bytes to human readable format
   */
  private static formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  /**
   * Get system diagnostics
   */
  static getSystemDiagnostics() {
    const currentHealth = this.getCurrentHealth();
    const recentHistory = this.getHealthHistory(10);
    
    const avgPerformance = recentHistory.reduce((acc, health) => ({
      avgBlockTime: acc.avgBlockTime + health.performance.avgBlockTime,
      transactionThroughput: acc.transactionThroughput + health.performance.transactionThroughput,
      pendingTransactions: acc.pendingTransactions + health.performance.pendingTransactions
    }), { avgBlockTime: 0, transactionThroughput: 0, pendingTransactions: 0 });
    
    if (recentHistory.length > 0) {
      avgPerformance.avgBlockTime /= recentHistory.length;
      avgPerformance.transactionThroughput /= recentHistory.length;
      avgPerformance.pendingTransactions /= recentHistory.length;
    }
    
    return {
      currentHealth,
      recentHistory,
      averages: avgPerformance,
      uptime: Date.now() - this.startTime,
      monitoringActive: this.monitoringInterval !== null
    };
  }
}

// Auto-start monitoring when service is imported
BlockchainMonitorService.startMonitoring();

// Graceful shutdown
process.on('SIGINT', () => {
  BlockchainMonitorService.stopMonitoring();
});

process.on('SIGTERM', () => {
  BlockchainMonitorService.stopMonitoring();
});
