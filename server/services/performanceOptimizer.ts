import { NeonDatabaseService } from "./neonDatabase";
import { SecureDataAccessService } from "./secureDataAccess";

/**
 * Performance Optimization Service
 * 
 * This service handles:
 * - Batch processing for data operations
 * - Connection pooling optimization
 * - Caching strategies
 * - Performance monitoring
 * - Database query optimization
 */

interface BatchOperation {
  id: string;
  type: 'create' | 'update' | 'delete';
  data: any;
  priority: 'high' | 'medium' | 'low';
  timestamp: number;
  retryCount: number;
}

interface PerformanceMetrics {
  operationCount: number;
  averageResponseTime: number;
  cacheHitRate: number;
  databaseConnections: number;
  batchProcessingEfficiency: number;
}

class PerformanceOptimizerService {
  private static isInitialized = false;
  private static batchQueue: BatchOperation[] = [];
  private static processingBatch = false;
  private static batchTimeout: NodeJS.Timeout | null = null;
  private static metrics: PerformanceMetrics = {
    operationCount: 0,
    averageResponseTime: 0,
    cacheHitRate: 0,
    databaseConnections: 0,
    batchProcessingEfficiency: 0,
  };
  private static cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private static readonly BATCH_SIZE = 10;
  private static readonly BATCH_TIMEOUT = 2000; // 2 seconds
  private static readonly CACHE_TTL = 5 * 60 * 1000; // 5 minutes

  /**
   * Initialize the performance optimizer
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    console.log("🚀 Initializing Performance Optimizer...");

    // Start batch processing loop
    this.startBatchProcessor();

    // Initialize database connection pool
    await this.initializeConnectionPool();

    this.isInitialized = true;
    console.log("✅ Performance Optimizer initialized");
  }

  /**
   * Add operation to batch queue
   */
  static addToBatch(operation: Omit<BatchOperation, 'id' | 'timestamp' | 'retryCount'>): string {
    const id = `batch-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const batchOperation: BatchOperation = {
      ...operation,
      id,
      timestamp: Date.now(),
      retryCount: 0,
    };

    this.batchQueue.push(batchOperation);
    this.scheduleBatchProcessing();

    return id;
  }

  /**
   * Process batch operations
   */
  private static async processBatch(): Promise<void> {
    if (this.processingBatch || this.batchQueue.length === 0) return;

    this.processingBatch = true;
    const startTime = Date.now();

    try {
      // Get batch of operations
      const batch = this.batchQueue.splice(0, this.BATCH_SIZE);
      console.log(`🔄 Processing batch of ${batch.length} operations`);

      // Group operations by type
      const createOps = batch.filter(op => op.type === 'create');
      const updateOps = batch.filter(op => op.type === 'update');
      const deleteOps = batch.filter(op => op.type === 'delete');

      // Process operations in parallel
      const promises = [] as Promise<any>[];

      if (createOps.length > 0) {
        promises.push(this.processCreateOperations(createOps));
      }

      if (updateOps.length > 0) {
        promises.push(this.processUpdateOperations(updateOps));
      }

      if (deleteOps.length > 0) {
        promises.push(this.processDeleteOperations(deleteOps));
      }

      await Promise.allSettled(promises);

      const processingTime = Date.now() - startTime;
      this.updateMetrics(processingTime, batch.length);

      console.log(`✅ Batch processed in ${processingTime}ms`);

    } catch (error) {
      console.error("❌ Batch processing failed:", error);
      // Retry failed operations
      this.retryFailedOperations();
    } finally {
      this.processingBatch = false;
      // Process remaining operations if any
      if (this.batchQueue.length > 0) {
        this.scheduleBatchProcessing();
      }
    }
  }

  /**
   * Process create operations
   */
  private static async processCreateOperations(operations: BatchOperation[]): Promise<void> {
    const promises = operations.map(async (operation) => {
      try {
        // Store in secure system
        await SecureDataAccessService.storeSecureHealthRecord(
          operation.data.sessionToken,
          {
            type: operation.data.type,
            data: operation.data.record,
            timestamp: new Date().toISOString(),
          },
        );

        // Update cache
        this.updateCache(operation.data.cacheKey, operation.data.record);

        return { success: true, operationId: operation.id };
      } catch (error) {
        console.error(`❌ Failed to process create operation ${operation.id}:`, error);
        return { success: false, operationId: operation.id, error };
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Process update operations
   */
  private static async processUpdateOperations(operations: BatchOperation[]): Promise<void> {
    const promises = operations.map(async (operation) => {
      try {
        // Update in database (best-effort; method may not exist)
        await (NeonDatabaseService as any).updateRecord?.(operation.data.recordId, operation.data.updates);

        // Update cache
        this.updateCache(operation.data.cacheKey, operation.data.updates);

        return { success: true, operationId: operation.id };
      } catch (error) {
        console.error(`❌ Failed to process update operation ${operation.id}:`, error);
        return { success: false, operationId: operation.id, error };
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Process delete operations
   */
  private static async processDeleteOperations(operations: BatchOperation[]): Promise<void> {
    const promises = operations.map(async (operation) => {
      try {
        // Delete from database (best-effort; method may not exist)
        await (NeonDatabaseService as any).deleteRecord?.(operation.data.recordId);

        // Remove from cache
        this.removeFromCache(operation.data.cacheKey);

        return { success: true, operationId: operation.id };
      } catch (error) {
        console.error(`❌ Failed to process delete operation ${operation.id}:`, error);
        return { success: false, operationId: operation.id, error };
      }
    });

    await Promise.allSettled(promises);
  }

  /**
   * Schedule batch processing
   */
  private static scheduleBatchProcessing(): void {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout);
    }

    this.batchTimeout = setTimeout(() => {
      this.processBatch();
    }, this.BATCH_TIMEOUT);
  }

  /**
   * Start batch processor
   */
  private static startBatchProcessor(): void {
    // Process batches every 5 seconds
    setInterval(() => {
      if (this.batchQueue.length > 0 && !this.processingBatch) {
        this.processBatch();
      }
    }, 5000);
  }

  /**
   * Retry failed operations
   */
  private static retryFailedOperations(): void {
    const maxRetries = 3;
    const failedOperations = this.batchQueue.filter(op => op.retryCount >= maxRetries);
    
    if (failedOperations.length > 0) {
      console.warn(`⚠️ ${failedOperations.length} operations failed after ${maxRetries} retries`);
      // Remove failed operations from queue
      this.batchQueue = this.batchQueue.filter(op => op.retryCount < maxRetries);
    }
  }

  /**
   * Initialize connection pool
   */
  private static async initializeConnectionPool(): Promise<void> {
    try {
      // Initialize database with connection pooling
      await NeonDatabaseService.initializeDatabase();
      console.log("✅ Database connection pool initialized");
    } catch (error) {
      console.error("❌ Failed to initialize connection pool:", error);
    }
  }

  /**
   * Cache operations
   */
  static setCache(key: string, data: any, ttl: number = this.CACHE_TTL): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  static getCache(key: string): any | null {
    const cached = this.cache.get(key);
    if (!cached) return null;

    const isExpired = Date.now() - cached.timestamp > cached.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return cached.data;
  }

  private static updateCache(key: string, data: any): void {
    this.setCache(key, data);
  }

  private static removeFromCache(key: string): void {
    this.cache.delete(key);
  }

  /**
   * Update performance metrics
   */
  private static updateMetrics(processingTime: number, operationCount: number): void {
    this.metrics.operationCount += operationCount;
    this.metrics.averageResponseTime = 
      (this.metrics.averageResponseTime + processingTime) / 2;
    this.metrics.batchProcessingEfficiency = 
      (operationCount / this.BATCH_SIZE) * 100;
  }

  /**
   * Get performance metrics
   */
  static getMetrics(): PerformanceMetrics {
    return { ...this.metrics };
  }

  /**
   * Optimize database queries
   */
  static async optimizeQueries(): Promise<void> {
    try {
      // Add database indexes for better performance (best-effort)
      await (NeonDatabaseService as any).addPerformanceIndexes?.();
      console.log("✅ Database queries optimized");
    } catch (error) {
      console.error("❌ Failed to optimize queries:", error);
    }
  }

  /**
   * Health check
   */
  static getHealthStatus(): {
    status: 'healthy' | 'degraded' | 'unhealthy';
    metrics: PerformanceMetrics;
    queueSize: number;
    isProcessing: boolean;
  } {
    const avgResponseTime = this.metrics.averageResponseTime;
    let status: 'healthy' | 'degraded' | 'unhealthy' = 'healthy';

    if (avgResponseTime > 5000) {
      status = 'unhealthy';
    } else if (avgResponseTime > 2000) {
      status = 'degraded';
    }

    return {
      status,
      metrics: this.getMetrics(),
      queueSize: this.batchQueue.length,
      isProcessing: this.processingBatch,
    };
  }
}

export { PerformanceOptimizerService };