import fs from 'fs';
import path from 'path';

/**
 * Environment Setup Script
 * Ensures proper environment configuration for the healthcare app
 */

export class EnvironmentSetup {
  static setup(): void {
    console.log('🔧 Setting up environment...');

    // Ensure data directory exists
    this.ensureDataDirectory();
    
    // Set default environment variables
    this.setDefaultEnvironmentVariables();
    
    // Validate critical settings
    this.validateEnvironment();
    
    console.log('✅ Environment setup completed');
  }

  private static ensureDataDirectory(): void {
    const directories = [
      'data',
      'data/backups',
      'data/uploads',
      'data/logs'
    ];

    directories.forEach(dir => {
      if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
        console.log(`📁 Created directory: ${dir}`);
      }
    });
  }

  private static setDefaultEnvironmentVariables(): void {
    // Set NODE_ENV if not set
    if (!process.env.NODE_ENV) {
      process.env.NODE_ENV = 'development';
      console.log('🔧 Set NODE_ENV to development');
    }

    // Set database URL to use SQLite (overriding any problematic Neon URL)
    if (!process.env.DATABASE_URL || process.env.DATABASE_URL.includes('dummy') || process.env.DATABASE_URL === '') {
      process.env.DATABASE_URL = 'sqlite:./data/healthchain.db';
      console.log('🔧 Set DATABASE_URL to SQLite');
    }

    // Set JWT secret if not set
    if (!process.env.JWT_SECRET) {
      process.env.JWT_SECRET = this.generateSecureSecret();
      console.log('🔧 Generated JWT_SECRET');
    }

    // Set encryption key if not set
    if (!process.env.ENCRYPTION_KEY) {
      process.env.ENCRYPTION_KEY = this.generateSecureSecret();
      console.log('🔧 Generated ENCRYPTION_KEY');
    }

    // Set session secret if not set
    if (!process.env.SESSION_SECRET) {
      process.env.SESSION_SECRET = this.generateSecureSecret();
      console.log('🔧 Generated SESSION_SECRET');
    }

    // Set port if not set
    if (!process.env.PORT) {
      process.env.PORT = '8080';
      console.log('🔧 Set PORT to 8080');
    }

    // Set default ping message
    if (!process.env.PING_MESSAGE) {
      process.env.PING_MESSAGE = 'HealthChain API is running!';
      console.log('🔧 Set default PING_MESSAGE');
    }
  }

  private static generateSecureSecret(): string {
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }

  private static validateEnvironment(): void {
    const requiredVars = [
      'NODE_ENV',
      'DATABASE_URL',
      'JWT_SECRET',
      'ENCRYPTION_KEY',
      'SESSION_SECRET',
      'PORT'
    ];

    const missing = requiredVars.filter(varName => !process.env[varName]);
    
    if (missing.length > 0) {
      console.warn('⚠️ Missing environment variables:', missing);
    } else {
      console.log('✅ All required environment variables are set');
    }

    // Log current configuration (without secrets)
    console.log('📋 Current environment configuration:');
    console.log(`   NODE_ENV: ${process.env.NODE_ENV}`);
    console.log(`   PORT: ${process.env.PORT}`);
    console.log(`   DATABASE_URL: ${process.env.DATABASE_URL?.substring(0, 20)}...`);
    console.log(`   JWT_SECRET: ${process.env.JWT_SECRET ? '[SET]' : '[NOT SET]'}`);
    console.log(`   ENCRYPTION_KEY: ${process.env.ENCRYPTION_KEY ? '[SET]' : '[NOT SET]'}`);
    console.log(`   SESSION_SECRET: ${process.env.SESSION_SECRET ? '[SET]' : '[NOT SET]'}`);
  }
}

// Run setup if this file is executed directly
if (require.main === module) {
  EnvironmentSetup.setup();
}
