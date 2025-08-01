import { RequestHandler } from "express";
import { DatabaseInitService } from "../services/initDatabase";

/**
 * Database health check and initialization endpoints
 */

/**
 * Check database connection health
 */
export const checkDatabaseHealth: RequestHandler = async (req, res) => {
  try {
    const health = await DatabaseInitService.checkDatabaseHealth();
    
    res.json({
      success: true,
      health,
      message: health.connected ? 'Database connection successful' : 'Database connection failed'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database health check failed'
    });
  }
};

/**
 * Initialize database tables
 */
export const initializeDatabase: RequestHandler = async (req, res) => {
  try {
    await DatabaseInitService.initializeSecureHealthcareDatabase();
    
    res.json({
      success: true,
      message: 'Database initialized successfully'
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database initialization failed'
    });
  }
};

/**
 * Test database connection with custom URL
 */
export const testDatabaseConnection: RequestHandler = async (req, res) => {
  try {
    const { databaseUrl } = req.body;
    
    if (!databaseUrl) {
      return res.status(400).json({
        success: false,
        error: 'Database URL is required'
      });
    }

    // Test connection with provided URL
    const { neon } = await import('@neondatabase/serverless');
    const testSql = neon(databaseUrl);
    
    // Simple test query
    const result = await testSql`SELECT 1 as test`;
    
    res.json({
      success: true,
      message: 'Database connection test successful',
      result: result[0]
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: error.message,
      message: 'Database connection test failed'
    });
  }
};
