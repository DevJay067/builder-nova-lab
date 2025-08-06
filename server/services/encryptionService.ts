import crypto from 'crypto';

/**
 * Advanced Encryption Service using AES-256-GCM
 * Provides secure encryption/decryption for medical files and data
 */

export interface EncryptionResult {
  success: boolean;
  encryptedData?: Buffer;
  metadata?: {
    iv: string;
    authTag: string;
    algorithm: string;
  };
  error?: string;
}

export interface DecryptionResult {
  success: boolean;
  decryptedData?: Buffer;
  error?: string;
}

export interface FileEncryptionResult {
  success: boolean;
  encryptedBuffer?: Buffer;
  metadata?: {
    iv: string;
    authTag: string;
    algorithm: string;
    originalName: string;
    mimeType: string;
    size: number;
  };
  error?: string;
}

export class EncryptionService {
  private static readonly ALGORITHM = 'aes-256-gcm';
  private static readonly IV_LENGTH = 16; // 128 bits
  private static readonly TAG_LENGTH = 16; // 128 bits
  private static readonly KEY_LENGTH = 32; // 256 bits

  /**
   * Validate encryption key format
   */
  private static validateKey(key: string): boolean {
    // Key should be 64 hex characters (32 bytes = 256 bits)
    return /^[a-f0-9]{64}$/i.test(key);
  }

  /**
   * Prepare key for encryption (ensure it's 32 bytes)
   */
  private static prepareKey(key: string): Buffer {
    if (!this.validateKey(key)) {
      // If key is not in correct format, hash it to get 32 bytes
      return crypto.createHash('sha256').update(key).digest();
    }
    return Buffer.from(key, 'hex');
  }

  /**
   * Encrypt data using AES-256-GCM
   */
  static encryptData(data: Buffer | string, encryptionKey: string): EncryptionResult {
    try {
      // Prepare the key
      const key = this.prepareKey(encryptionKey);
      
      // Generate random IV
      const iv = crypto.randomBytes(this.IV_LENGTH);
      
      // Create cipher
      const cipher = crypto.createCipher(this.ALGORITHM, key);
      cipher.setAAD(Buffer.from('healthchain-medical-data'));

      // Convert string to buffer if needed
      const inputData = typeof data === 'string' ? Buffer.from(data, 'utf8') : data;
      
      // Encrypt the data
      const encrypted = Buffer.concat([
        cipher.update(inputData),
        cipher.final()
      ]);
      
      // Get the authentication tag
      const authTag = cipher.getAuthTag();
      
      return {
        success: true,
        encryptedData: encrypted,
        metadata: {
          iv: iv.toString('hex'),
          authTag: authTag.toString('hex'),
          algorithm: this.ALGORITHM
        }
      };
    } catch (error) {
      console.error('❌ Encryption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Encryption failed'
      };
    }
  }

  /**
   * Decrypt data using AES-256-GCM
   */
  static decryptData(
    encryptedData: Buffer,
    encryptionKey: string,
    metadata: {
      iv: string;
      authTag: string;
      algorithm: string;
    }
  ): DecryptionResult {
    try {
      // Prepare the key
      const key = this.prepareKey(encryptionKey);
      
      // Convert metadata from hex
      const iv = Buffer.from(metadata.iv, 'hex');
      const authTag = Buffer.from(metadata.authTag, 'hex');
      
      // Create decipher
      const decipher = crypto.createDecipher(metadata.algorithm, key);
      decipher.setAAD(Buffer.from('healthchain-medical-data'));
      decipher.setAuthTag(authTag);
      
      // Decrypt the data
      const decrypted = Buffer.concat([
        decipher.update(encryptedData),
        decipher.final()
      ]);
      
      return {
        success: true,
        decryptedData: decrypted
      };
    } catch (error) {
      console.error('❌ Decryption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Decryption failed'
      };
    }
  }

  /**
   * Encrypt a medical file with metadata
   */
  static encryptFile(
    fileBuffer: Buffer,
    encryptionKey: string,
    originalName: string,
    mimeType: string
  ): FileEncryptionResult {
    try {
      console.log(`🔐 Encrypting medical file: ${originalName}`);

      // Create file metadata
      const fileMetadata = {
        originalName,
        mimeType,
        size: fileBuffer.length,
        timestamp: new Date().toISOString()
      };

      // Combine metadata and file data
      const metadataBuffer = Buffer.from(JSON.stringify(fileMetadata), 'utf8');
      const metadataLength = Buffer.alloc(4);
      metadataLength.writeUInt32BE(metadataBuffer.length, 0);
      
      const combinedData = Buffer.concat([
        metadataLength,
        metadataBuffer,
        fileBuffer
      ]);

      // Encrypt the combined data
      const encryptionResult = this.encryptData(combinedData, encryptionKey);
      
      if (!encryptionResult.success) {
        return {
          success: false,
          error: encryptionResult.error
        };
      }

      console.log(`✅ File encrypted successfully: ${originalName}`);

      return {
        success: true,
        encryptedBuffer: encryptionResult.encryptedData,
        metadata: {
          ...encryptionResult.metadata!,
          originalName,
          mimeType,
          size: fileBuffer.length
        }
      };
    } catch (error) {
      console.error('❌ File encryption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File encryption failed'
      };
    }
  }

  /**
   * Decrypt a medical file and extract metadata
   */
  static decryptFile(
    encryptedBuffer: Buffer,
    encryptionKey: string,
    metadata: {
      iv: string;
      authTag: string;
      algorithm: string;
    }
  ): {
    success: boolean;
    fileBuffer?: Buffer;
    fileMetadata?: {
      originalName: string;
      mimeType: string;
      size: number;
      timestamp: string;
    };
    error?: string;
  } {
    try {
      console.log('🔓 Decrypting medical file...');

      // Decrypt the data
      const decryptionResult = this.decryptData(encryptedBuffer, encryptionKey, metadata);
      
      if (!decryptionResult.success) {
        return {
          success: false,
          error: decryptionResult.error
        };
      }

      const decryptedData = decryptionResult.decryptedData!;

      // Extract metadata length
      const metadataLength = decryptedData.readUInt32BE(0);
      
      // Extract metadata
      const metadataBuffer = decryptedData.subarray(4, 4 + metadataLength);
      const fileMetadata = JSON.parse(metadataBuffer.toString('utf8'));
      
      // Extract file data
      const fileBuffer = decryptedData.subarray(4 + metadataLength);

      console.log(`✅ File decrypted successfully: ${fileMetadata.originalName}`);

      return {
        success: true,
        fileBuffer,
        fileMetadata
      };
    } catch (error) {
      console.error('❌ File decryption failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'File decryption failed'
      };
    }
  }

  /**
   * Encrypt sensitive text data (like descriptions, notes)
   */
  static encryptText(text: string, encryptionKey: string): {
    success: boolean;
    encryptedText?: string;
    error?: string;
  } {
    try {
      const textBuffer = Buffer.from(text, 'utf8');
      const result = this.encryptData(textBuffer, encryptionKey);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      // Combine encrypted data and metadata into a single string
      const combined = {
        data: result.encryptedData!.toString('base64'),
        metadata: result.metadata
      };

      return {
        success: true,
        encryptedText: Buffer.from(JSON.stringify(combined)).toString('base64')
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text encryption failed'
      };
    }
  }

  /**
   * Decrypt sensitive text data
   */
  static decryptText(encryptedText: string, encryptionKey: string): {
    success: boolean;
    decryptedText?: string;
    error?: string;
  } {
    try {
      // Parse the encrypted text
      const combined = JSON.parse(Buffer.from(encryptedText, 'base64').toString('utf8'));
      const encryptedData = Buffer.from(combined.data, 'base64');
      
      const result = this.decryptData(encryptedData, encryptionKey, combined.metadata);
      
      if (!result.success) {
        return { success: false, error: result.error };
      }

      return {
        success: true,
        decryptedText: result.decryptedData!.toString('utf8')
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Text decryption failed'
      };
    }
  }

  /**
   * Generate a secure encryption key
   */
  static generateSecureKey(): string {
    return crypto.randomBytes(this.KEY_LENGTH).toString('hex');
  }

  /**
   * Hash data for integrity verification
   */
  static hashData(data: Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Verify data integrity
   */
  static verifyDataIntegrity(data: Buffer, expectedHash: string): boolean {
    const actualHash = this.hashData(data);
    return actualHash === expectedHash;
  }

  /**
   * Create a secure checksum for encrypted files
   */
  static createChecksum(encryptedData: Buffer, metadata: any): string {
    const combined = Buffer.concat([
      encryptedData,
      Buffer.from(JSON.stringify(metadata), 'utf8')
    ]);
    return crypto.createHash('sha256').update(combined).digest('hex');
  }

  /**
   * Verify encrypted file checksum
   */
  static verifyChecksum(
    encryptedData: Buffer,
    metadata: any,
    expectedChecksum: string
  ): boolean {
    const actualChecksum = this.createChecksum(encryptedData, metadata);
    return actualChecksum === expectedChecksum;
  }
}
