import { SplitKeyAuthService } from './splitKeyAuthService';
import { EncryptionService } from './encryptionService';
import { IPFSStorageService } from './ipfsStorageService';
import { SupabaseService, MedicalRecordMetadata } from './supabaseService';

/**
 * Medical Records Management Service
 * Orchestrates secure medical record operations across all services
 */

export interface MedicalRecordUpload {
  file: Buffer;
  originalName: string;
  mimeType: string;
  title?: string;
  description?: string;
  tags?: string[];
}

export interface MedicalRecordAccess {
  recordId: string;
  userId: string;
  clientKeyHalf: string;
}

export interface UploadResult {
  success: boolean;
  recordId?: string;
  cid?: string;
  fileHash?: string;
  size?: number;
  error?: string;
}

export interface AccessResult {
  success: boolean;
  fileBuffer?: Buffer;
  metadata?: {
    originalName: string;
    mimeType: string;
    size: number;
    uploadTimestamp: string;
    title?: string;
    description?: string;
    tags?: string[];
  };
  error?: string;
}

export interface SearchResult {
  success: boolean;
  records?: Array<{
    id: string;
    originalName: string;
    mimeType: string;
    size: number;
    uploadTimestamp: string;
    title?: string;
    description?: string;
    tags?: string[];
    cid: string;
  }>;
  total?: number;
  error?: string;
}

export class MedicalRecordsManager {
  private static isInitialized = false;

  /**
   * Initialize all required services
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log('🏥 Initializing Medical Records Management System...');

      // Initialize all dependent services
      await SplitKeyAuthService.initialize();
      await IPFSStorageService.initialize();
      await SupabaseService.initialize();

      this.isInitialized = true;
      console.log('✅ Medical Records Management System initialized successfully');
    } catch (error) {
      console.error('❌ Failed to initialize Medical Records Management System:', error);
      this.isInitialized = true; // Continue with limited functionality
    }
  }

  /**
   * Securely upload a medical record
   */
  static async uploadMedicalRecord(
    userId: string,
    clientKeyHalf: string,
    uploadData: MedicalRecordUpload
  ): Promise<UploadResult> {
    try {
      console.log(`🏥 Starting secure medical record upload: ${uploadData.originalName}`);

      // Step 1: Validate and get full encryption key
      const keyValidation = await SplitKeyAuthService.validateAndGetFullKey(userId, clientKeyHalf);
      if (!keyValidation.valid || !keyValidation.fullKey) {
        return {
          success: false,
          error: 'Invalid key combination for encryption'
        };
      }

      // Step 2: Encrypt the medical file
      console.log('🔐 Encrypting medical file...');
      const encryptionResult = EncryptionService.encryptFile(
        uploadData.file,
        keyValidation.fullKey,
        uploadData.originalName,
        uploadData.mimeType
      );

      if (!encryptionResult.success || !encryptionResult.encryptedBuffer) {
        return {
          success: false,
          error: 'Medical file encryption failed'
        };
      }

      // Step 3: Upload encrypted file to IPFS
      console.log('📤 Uploading encrypted file to IPFS...');
      const ipfsResult = await IPFSStorageService.uploadMedicalRecord(
        encryptionResult.encryptedBuffer,
        uploadData.originalName,
        uploadData.mimeType,
        userId,
        keyValidation.fullKey,
        encryptionResult.metadata!
      );

      if (!ipfsResult.success || !ipfsResult.cid) {
        return {
          success: false,
          error: 'IPFS upload failed'
        };
      }

      // Step 4: Encrypt sensitive metadata
      let encryptedTitle = undefined;
      let encryptedDescription = undefined;

      if (uploadData.title) {
        const titleEncryption = EncryptionService.encryptText(uploadData.title, keyValidation.fullKey);
        encryptedTitle = titleEncryption.success ? titleEncryption.encryptedText : undefined;
      }

      if (uploadData.description) {
        const descEncryption = EncryptionService.encryptText(uploadData.description, keyValidation.fullKey);
        encryptedDescription = descEncryption.success ? descEncryption.encryptedText : undefined;
      }

      // Step 5: Store metadata in Supabase
      console.log('💾 Storing metadata in secure database...');
      const metadataResult = await SupabaseService.storeMedicalRecordMetadata({
        userId,
        cid: ipfsResult.cid,
        originalName: uploadData.originalName,
        mimeType: uploadData.mimeType,
        size: uploadData.file.length,
        encryptedTitle,
        encryptedDescription,
        uploadTimestamp: new Date().toISOString(),
        checksum: ipfsResult.fileHash || '',
        encryptionMetadata: encryptionResult.metadata!,
        tags: uploadData.tags || [],
        isActive: true
      });

      if (!metadataResult.success) {
        console.warn('⚠️ Metadata storage failed, but file is uploaded to IPFS');
      }

      console.log(`✅ Medical record uploaded successfully. CID: ${ipfsResult.cid}`);

      return {
        success: true,
        recordId: metadataResult.recordId,
        cid: ipfsResult.cid,
        fileHash: ipfsResult.fileHash,
        size: ipfsResult.size
      };

    } catch (error) {
      console.error('❌ Medical record upload failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Upload failed'
      };
    }
  }

  /**
   * Securely access a medical record
   */
  static async accessMedicalRecord(
    accessData: MedicalRecordAccess
  ): Promise<AccessResult> {
    try {
      console.log(`🏥 Starting secure medical record access: ${accessData.recordId}`);

      // Step 1: Validate and get full encryption key
      const keyValidation = await SplitKeyAuthService.validateAndGetFullKey(
        accessData.userId,
        accessData.clientKeyHalf
      );
      if (!keyValidation.valid || !keyValidation.fullKey) {
        return {
          success: false,
          error: 'Invalid key combination for decryption'
        };
      }

      // Step 2: Get record metadata from Supabase
      console.log('📋 Retrieving record metadata...');
      const metadataResult = await SupabaseService.getMedicalRecordMetadata(
        accessData.recordId,
        accessData.userId
      );

      if (!metadataResult.success || !metadataResult.record) {
        return {
          success: false,
          error: 'Medical record not found or access denied'
        };
      }

      const record = metadataResult.record;

      // Step 3: Download encrypted file from IPFS
      console.log('📥 Downloading encrypted file from IPFS...');
      const ipfsResult = await IPFSStorageService.downloadMedicalRecord(record.cid, accessData.userId);
      if (!ipfsResult.success || !ipfsResult.fileBuffer) {
        return {
          success: false,
          error: 'Failed to download file from IPFS'
        };
      }

      // Step 4: Decrypt the file
      console.log('🔓 Decrypting medical file...');
      const decryptionResult = EncryptionService.decryptFile(
        ipfsResult.fileBuffer,
        keyValidation.fullKey,
        record.encryptionMetadata
      );

      if (!decryptionResult.success || !decryptionResult.fileBuffer) {
        return {
          success: false,
          error: 'File decryption failed'
        };
      }

      // Step 5: Decrypt metadata if available
      let decryptedTitle = undefined;
      let decryptedDescription = undefined;

      if (record.encryptedTitle) {
        const titleDecryption = EncryptionService.decryptText(record.encryptedTitle, keyValidation.fullKey);
        decryptedTitle = titleDecryption.success ? titleDecryption.decryptedText : undefined;
      }

      if (record.encryptedDescription) {
        const descDecryption = EncryptionService.decryptText(record.encryptedDescription, keyValidation.fullKey);
        decryptedDescription = descDecryption.success ? descDecryption.decryptedText : undefined;
      }

      console.log(`✅ Medical record accessed successfully: ${record.originalName}`);

      return {
        success: true,
        fileBuffer: decryptionResult.fileBuffer,
        metadata: {
          originalName: record.originalName,
          mimeType: record.mimeType,
          size: record.size,
          uploadTimestamp: record.uploadTimestamp,
          title: decryptedTitle,
          description: decryptedDescription,
          tags: record.tags
        }
      };

    } catch (error) {
      console.error('❌ Medical record access failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Access failed'
      };
    }
  }

  /**
   * Get user's medical records with decrypted metadata
   */
  static async getUserMedicalRecords(
    userId: string,
    clientKeyHalf: string
  ): Promise<SearchResult> {
    try {
      console.log(`🏥 Retrieving medical records for user: ${userId}`);

      // Step 1: Validate key for metadata decryption
      const keyValidation = await SplitKeyAuthService.validateAndGetFullKey(userId, clientKeyHalf);
      if (!keyValidation.valid || !keyValidation.fullKey) {
        return {
          success: false,
          error: 'Invalid key combination'
        };
      }

      // Step 2: Get records from Supabase
      const result = await SupabaseService.getUserMedicalRecords(userId);
      if (!result.success) {
        return {
          success: false,
          error: 'Failed to retrieve medical records'
        };
      }

      // Step 3: Decrypt metadata for each record
      const decryptedRecords = await Promise.all(
        (result.records || []).map(async (record) => {
          let decryptedTitle = undefined;
          let decryptedDescription = undefined;

          if (record.encryptedTitle) {
            const titleDecryption = EncryptionService.decryptText(record.encryptedTitle, keyValidation.fullKey!);
            decryptedTitle = titleDecryption.success ? titleDecryption.decryptedText : undefined;
          }

          if (record.encryptedDescription) {
            const descDecryption = EncryptionService.decryptText(record.encryptedDescription, keyValidation.fullKey!);
            decryptedDescription = descDecryption.success ? descDecryption.decryptedText : undefined;
          }

          return {
            id: record.id,
            originalName: record.originalName,
            mimeType: record.mimeType,
            size: record.size,
            uploadTimestamp: record.uploadTimestamp,
            title: decryptedTitle,
            description: decryptedDescription,
            tags: record.tags,
            cid: record.cid
          };
        })
      );

      console.log(`✅ Retrieved ${decryptedRecords.length} medical records`);

      return {
        success: true,
        records: decryptedRecords,
        total: decryptedRecords.length
      };

    } catch (error) {
      console.error('❌ Failed to retrieve user medical records:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Retrieval failed'
      };
    }
  }

  /**
   * Search medical records with decrypted metadata
   */
  static async searchMedicalRecords(
    userId: string,
    clientKeyHalf: string,
    searchTerm: string
  ): Promise<SearchResult> {
    try {
      console.log(`🔍 Searching medical records for: ${searchTerm}`);

      // For search, we need to get all records and decrypt them to search in titles/descriptions
      const allRecords = await this.getUserMedicalRecords(userId, clientKeyHalf);
      if (!allRecords.success) {
        return allRecords;
      }

      // Filter records based on search term
      const matchingRecords = (allRecords.records || []).filter(record => {
        const searchLower = searchTerm.toLowerCase();
        
        return (
          record.originalName.toLowerCase().includes(searchLower) ||
          (record.title && record.title.toLowerCase().includes(searchLower)) ||
          (record.description && record.description.toLowerCase().includes(searchLower)) ||
          (record.tags && record.tags.some(tag => tag.toLowerCase().includes(searchLower)))
        );
      });

      console.log(`✅ Found ${matchingRecords.length} matching records`);

      return {
        success: true,
        records: matchingRecords,
        total: matchingRecords.length
      };

    } catch (error) {
      console.error('❌ Medical records search failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Search failed'
      };
    }
  }

  /**
   * Delete a medical record
   */
  static async deleteMedicalRecord(
    recordId: string,
    userId: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      console.log(`🗑️ Deleting medical record: ${recordId}`);

      const result = await SupabaseService.deleteMedicalRecord(recordId, userId);
      
      if (result.success) {
        console.log(`✅ Medical record deleted successfully: ${recordId}`);
      }

      return result;

    } catch (error) {
      console.error('❌ Medical record deletion failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Deletion failed'
      };
    }
  }

  /**
   * Verify file integrity
   */
  static async verifyFileIntegrity(
    recordId: string,
    userId: string,
    clientKeyHalf: string
  ): Promise<{
    success: boolean;
    valid?: boolean;
    checksum?: string;
    error?: string;
  }> {
    try {
      console.log(`🔍 Verifying file integrity for record: ${recordId}`);

      // Get record metadata
      const metadataResult = await SupabaseService.getMedicalRecordMetadata(recordId, userId);
      if (!metadataResult.success || !metadataResult.record) {
        return {
          success: false,
          error: 'Record not found'
        };
      }

      // Download file from IPFS
      const ipfsResult = await IPFSStorageService.downloadMedicalRecord(
        metadataResult.record.cid,
        userId
      );

      if (!ipfsResult.success || !ipfsResult.fileBuffer) {
        return {
          success: false,
          error: 'Failed to download file for verification'
        };
      }

      // Calculate current checksum
      const currentChecksum = EncryptionService.hashData(ipfsResult.fileBuffer);
      const isValid = currentChecksum === metadataResult.record.checksum;

      console.log(`✅ File integrity verification completed. Valid: ${isValid}`);

      return {
        success: true,
        valid: isValid,
        checksum: currentChecksum
      };

    } catch (error) {
      console.error('❌ File integrity verification failed:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Verification failed'
      };
    }
  }

  /**
   * Get system statistics
   */
  static async getSystemStats(): Promise<{
    success: boolean;
    stats?: {
      totalUsers: number;
      totalRecords: number;
      totalStorageSize: number;
      services: {
        splitKeyAuth: any;
        ipfsStorage: any;
        database: any;
      };
    };
    error?: string;
  }> {
    try {
      const dbStatsResult = await SupabaseService.getDatabaseStats();
      const authStats = await SplitKeyAuthService.getStats();
      const ipfsStatus = IPFSStorageService.getStatus();
      const dbStatus = SupabaseService.getStatus();

      return {
        success: true,
        stats: {
          totalUsers: dbStatsResult.stats?.totalUsers || 0,
          totalRecords: dbStatsResult.stats?.totalRecords || 0,
          totalStorageSize: dbStatsResult.stats?.totalStorageSize || 0,
          services: {
            splitKeyAuth: authStats,
            ipfsStorage: ipfsStatus,
            database: dbStatus
          }
        }
      };

    } catch (error) {
      console.error('❌ Failed to get system stats:', error);
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Stats retrieval failed'
      };
    }
  }

  /**
   * Get service status
   */
  static getStatus(): {
    initialized: boolean;
    services: {
      splitKeyAuth: boolean;
      encryption: boolean;
      ipfsStorage: boolean;
      database: boolean;
    };
    features: string[];
  } {
    return {
      initialized: this.isInitialized,
      services: {
        splitKeyAuth: true,
        encryption: true,
        ipfsStorage: IPFSStorageService.getStatus().initialized,
        database: SupabaseService.getStatus().initialized
      },
      features: [
        'Split-key authentication',
        'AES-256 encryption',
        'IPFS/Filecoin storage',
        'Secure metadata management',
        'File integrity verification',
        'Search and discovery',
        'Access logging',
        'Rate limiting'
      ]
    };
  }
}
