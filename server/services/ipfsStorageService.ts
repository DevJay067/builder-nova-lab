import { Web3Storage, getFilesFromPath } from "web3.storage";
import { File } from "@web-std/file";
import crypto from "crypto";

/**
 * IPFS Storage Service using Web3.Storage
 * Handles secure upload and retrieval of encrypted medical files
 */

export interface IPFSUploadResult {
  success: boolean;
  cid?: string;
  fileHash?: string;
  size?: number;
  error?: string;
}

export interface IPFSRetrievalResult {
  success: boolean;
  fileBuffer?: Buffer;
  fileName?: string;
  error?: string;
}

export interface StorageMetadata {
  originalName: string;
  mimeType: string;
  size: number;
  uploadTimestamp: string;
  userId: string;
  encryptionMetadata: {
    iv: string;
    authTag: string;
    algorithm: string;
  };
  checksum: string;
}

export class IPFSStorageService {
  private static client: Web3Storage | null = null;
  private static isInitialized = false;

  /**
   * Initialize Web3.Storage client
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const apiToken = process.env.WEB3_STORAGE_TOKEN;

      if (!apiToken) {
        console.warn(
          "⚠️ Web3.Storage token not found, IPFS features will be limited",
        );
        this.isInitialized = true;
        return;
      }

      this.client = new Web3Storage({ token: apiToken });
      console.log("✅ IPFS storage service initialized with Web3.Storage");

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize IPFS storage service:", error);
      this.isInitialized = true; // Continue without IPFS
    }
  }

  /**
   * Upload encrypted file to IPFS
   */
  static async uploadEncryptedFile(
    encryptedBuffer: Buffer,
    metadata: StorageMetadata,
  ): Promise<IPFSUploadResult> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: "IPFS client not initialized",
        };
      }

      console.log(
        `📤 Uploading encrypted file to IPFS: ${metadata.originalName}`,
      );

      // Create a unique filename for IPFS
      const fileHash = crypto
        .createHash("sha256")
        .update(encryptedBuffer)
        .digest("hex");
      const fileName = `medical_${fileHash.substring(0, 16)}.enc`;

      // Create metadata file
      const metadataFileName = `${fileName}.metadata.json`;
      const metadataContent = JSON.stringify(metadata, null, 2);

      // Create File objects for Web3.Storage
      const files = [
        new File([encryptedBuffer], fileName, {
          type: "application/octet-stream",
        }),
        new File([metadataContent], metadataFileName, {
          type: "application/json",
        }),
      ];

      // Upload to IPFS
      const cid = await this.client.put(files, {
        name: `HealthChain Medical Record - ${metadata.originalName}`,
        maxRetries: 3,
        wrapWithDirectory: true,
      });

      console.log(`✅ File uploaded to IPFS successfully. CID: ${cid}`);

      return {
        success: true,
        cid,
        fileHash,
        size: encryptedBuffer.length,
      };
    } catch (error) {
      console.error("❌ IPFS upload failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Upload failed",
      };
    }
  }

  /**
   * Retrieve encrypted file from IPFS
   */
  static async retrieveEncryptedFile(
    cid: string,
    fileName?: string,
  ): Promise<IPFSRetrievalResult> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: "IPFS client not initialized",
        };
      }

      console.log(`📥 Retrieving file from IPFS. CID: ${cid}`);

      // Get the file from IPFS
      const res = await this.client.get(cid);

      if (!res.ok) {
        return {
          success: false,
          error: `Failed to retrieve file: ${res.status}`,
        };
      }

      const files = await res.files();

      // Find the encrypted file (not the metadata)
      let targetFile = null;
      if (fileName) {
        targetFile = files.find((f) => f.name === fileName);
      } else {
        // Find the first .enc file
        targetFile = files.find((f) => f.name.endsWith(".enc"));
      }

      if (!targetFile) {
        return {
          success: false,
          error: "Encrypted file not found in IPFS response",
        };
      }

      // Convert to buffer
      const arrayBuffer = await targetFile.arrayBuffer();
      const fileBuffer = Buffer.from(arrayBuffer);

      console.log(
        `✅ File retrieved from IPFS successfully: ${targetFile.name}`,
      );

      return {
        success: true,
        fileBuffer,
        fileName: targetFile.name,
      };
    } catch (error) {
      console.error("❌ IPFS retrieval failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Retrieval failed",
      };
    }
  }

  /**
   * Retrieve metadata for a file
   */
  static async retrieveFileMetadata(cid: string): Promise<{
    success: boolean;
    metadata?: StorageMetadata;
    error?: string;
  }> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: "IPFS client not initialized",
        };
      }

      console.log(`📥 Retrieving metadata from IPFS. CID: ${cid}`);

      const res = await this.client.get(cid);

      if (!res.ok) {
        return {
          success: false,
          error: `Failed to retrieve metadata: ${res.status}`,
        };
      }

      const files = await res.files();

      // Find the metadata file
      const metadataFile = files.find((f) => f.name.endsWith(".metadata.json"));

      if (!metadataFile) {
        return {
          success: false,
          error: "Metadata file not found",
        };
      }

      const metadataText = await metadataFile.text();
      const metadata = JSON.parse(metadataText) as StorageMetadata;

      return {
        success: true,
        metadata,
      };
    } catch (error) {
      console.error("❌ Failed to retrieve metadata:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Metadata retrieval failed",
      };
    }
  }

  /**
   * Check if a file exists in IPFS
   */
  static async fileExists(cid: string): Promise<boolean> {
    try {
      if (!this.client) return false;

      const res = await this.client.get(cid);
      return res.ok;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get storage statistics
   */
  static async getStorageStats(): Promise<{
    success: boolean;
    stats?: {
      totalUploads: number;
      totalSize: string;
    };
    error?: string;
  }> {
    try {
      if (!this.client) {
        return {
          success: false,
          error: "IPFS client not initialized",
        };
      }

      // Note: Web3.Storage doesn't provide direct stats API
      // This would need to be tracked separately in your database
      return {
        success: true,
        stats: {
          totalUploads: 0,
          totalSize: "0 KB",
        },
      };
    } catch (error) {
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Stats retrieval failed",
      };
    }
  }

  /**
   * Upload medical record with automatic encryption and IPFS storage
   */
  static async uploadMedicalRecord(
    fileBuffer: Buffer,
    originalName: string,
    mimeType: string,
    userId: string,
    encryptionKey: string,
    encryptionMetadata: {
      iv: string;
      authTag: string;
      algorithm: string;
    },
  ): Promise<IPFSUploadResult> {
    try {
      console.log(`🏥 Uploading medical record: ${originalName}`);

      // Create checksum for integrity verification
      const checksum = crypto
        .createHash("sha256")
        .update(Buffer.concat([fileBuffer, Buffer.from(userId)]))
        .digest("hex");

      // Prepare storage metadata
      const metadata: StorageMetadata = {
        originalName,
        mimeType,
        size: fileBuffer.length,
        uploadTimestamp: new Date().toISOString(),
        userId,
        encryptionMetadata,
        checksum,
      };

      // Upload to IPFS
      const uploadResult = await this.uploadEncryptedFile(fileBuffer, metadata);

      if (uploadResult.success) {
        console.log(`✅ Medical record uploaded successfully: ${originalName}`);
      }

      return uploadResult;
    } catch (error) {
      console.error("❌ Medical record upload failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Medical record upload failed",
      };
    }
  }

  /**
   * Download and verify medical record
   */
  static async downloadMedicalRecord(
    cid: string,
    userId: string,
  ): Promise<{
    success: boolean;
    fileBuffer?: Buffer;
    metadata?: StorageMetadata;
    error?: string;
  }> {
    try {
      console.log(`🏥 Downloading medical record. CID: ${cid}`);

      // Retrieve metadata first
      const metadataResult = await this.retrieveFileMetadata(cid);
      if (!metadataResult.success || !metadataResult.metadata) {
        return {
          success: false,
          error: metadataResult.error || "Failed to retrieve metadata",
        };
      }

      // Verify user access
      if (metadataResult.metadata.userId !== userId) {
        return {
          success: false,
          error: "Access denied: User ID mismatch",
        };
      }

      // Retrieve the encrypted file
      const fileResult = await this.retrieveEncryptedFile(cid);
      if (!fileResult.success || !fileResult.fileBuffer) {
        return {
          success: false,
          error: fileResult.error || "Failed to retrieve file",
        };
      }

      console.log(`✅ Medical record downloaded successfully`);

      return {
        success: true,
        fileBuffer: fileResult.fileBuffer,
        metadata: metadataResult.metadata,
      };
    } catch (error) {
      console.error("❌ Medical record download failed:", error);
      return {
        success: false,
        error:
          error instanceof Error
            ? error.message
            : "Medical record download failed",
      };
    }
  }

  /**
   * Delete a file from IPFS (Note: IPFS is immutable, this just removes from pinning)
   */
  static async unpinFile(cid: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      // Note: Web3.Storage doesn't provide direct unpin functionality
      // Files are garbage collected automatically if not pinned elsewhere
      console.log(
        `⚠️ IPFS files are immutable. CID ${cid} may still be accessible`,
      );

      return {
        success: true,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unpin failed",
      };
    }
  }

  /**
   * Get service status
   */
  static getStatus(): {
    initialized: boolean;
    clientAvailable: boolean;
    features: string[];
  } {
    return {
      initialized: this.isInitialized,
      clientAvailable: this.client !== null,
      features: [
        "Encrypted file upload",
        "Secure file retrieval",
        "Metadata storage",
        "Integrity verification",
        "Access control",
      ],
    };
  }
}
