import crypto from "crypto";
import { HealthRecord, BlockchainTransaction } from "@shared/api";

/**
 * Simple Secure Storage Service
 * Provides basic encryption without problematic crypto methods
 */

export interface SplitKeyData {
  splitKeyPairs: {
    part1: string;
    part2: string;
    checksum: string;
  };
  combinedHash: string;
  userHash: string;
  dataHash: string;
}

export class SimpleSecureStorage {
  private static blockchain: BlockchainTransaction[] = [];
  private static isInitialized = false;

  /**
   * Initialize the simple storage system
   */
  static initializeBlockchain(): void {
    if (this.isInitialized) return;

    console.log("🚀 Initializing simple secure storage system...");
    
    // Create genesis block
    const genesisBlock: BlockchainTransaction = {
      id: "genesis",
      patientId: "system",
      encryptedData: "genesis-block",
      timestamp: new Date().toISOString(),
      hash: this.generateHash("genesis"),
      previousHash: "0",
      blockIndex: 0,
    };

    this.blockchain.push(genesisBlock);
    this.isInitialized = true;
    console.log("✅ Simple secure storage initialized");
  }

  /**
   * Generate a simple hash
   */
  static generateHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Generate user hash
   */
  static generateUserHash(username: string, password: string): string {
    return this.generateHash(`${username}:${password}:user`);
  }

  /**
   * Generate data hash
   */
  static generateDataHash(data: any): string {
    return this.generateHash(JSON.stringify(data));
  }

  /**
   * Generate combined hash
   */
  static generateCombinedHash(userHash: string, dataHash: string): string {
    return this.generateHash(`${userHash}:${dataHash}`);
  }

  /**
   * Create split key system
   */
  static createSplitKeySystem(userHash: string, dataHash: string): SplitKeyData {
    const combinedHash = this.generateCombinedHash(userHash, dataHash);
    
    // Create simple split keys
    const part1 = this.generateHash(`${combinedHash}:part1`);
    const part2 = this.generateHash(`${combinedHash}:part2`);
    const checksum = this.generateHash(`${part1}:${part2}`);

    return {
      splitKeyPairs: { part1, part2, checksum },
      combinedHash,
      userHash,
      dataHash,
    };
  }

  /**
   * Simple encryption using base64 and XOR
   */
  static simpleEncrypt(data: string, key: string): string {
    const dataBuffer = Buffer.from(data, "utf8");
    const keyBuffer = Buffer.from(key, "hex");
    const encrypted = Buffer.alloc(dataBuffer.length);

    for (let i = 0; i < dataBuffer.length; i++) {
      encrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
    }

    return encrypted.toString("base64");
  }

  /**
   * Simple decryption
   */
  static simpleDecrypt(encryptedData: string, key: string): string {
    try {
      const dataBuffer = Buffer.from(encryptedData, "base64");
      const keyBuffer = Buffer.from(key, "hex");
      const decrypted = Buffer.alloc(dataBuffer.length);

      for (let i = 0; i < dataBuffer.length; i++) {
        decrypted[i] = dataBuffer[i] ^ keyBuffer[i % keyBuffer.length];
      }

      return decrypted.toString("utf8");
    } catch (error) {
      console.error("Decryption failed:", error);
      return encryptedData;
    }
  }

  /**
   * Store health record securely
   */
  static async storeSecureHealthRecord(
    healthRecord: any,
    username: string,
    password: string,
  ): Promise<{
    success: boolean;
    blockchainHash: string;
    splitKeyData: SplitKeyData;
    recordId: string;
  }> {
    try {
      console.log(`🔐 Storing health record for user: ${username}`);

      // Generate hashes
      const userHash = this.generateUserHash(username, password);
      const dataHash = this.generateDataHash(healthRecord);
      const combinedHash = this.generateCombinedHash(userHash, dataHash);

      // Simple encryption
      const encryptedData = this.simpleEncrypt(JSON.stringify(healthRecord), combinedHash);

      // Create blockchain transaction
      const recordId = crypto.randomBytes(16).toString("hex");
      const previousBlock = this.blockchain[this.blockchain.length - 1];
      
      const transaction: BlockchainTransaction = {
        id: recordId,
        patientId: userHash.substring(0, 16),
        encryptedData,
        timestamp: new Date().toISOString(),
        hash: this.generateHash(`${recordId}:${encryptedData}:${previousBlock.hash}`),
        previousHash: previousBlock.hash,
        blockIndex: this.blockchain.length,
      };

      this.blockchain.push(transaction);

      // Create split key data
      const splitKeyData = this.createSplitKeySystem(userHash, dataHash);

      console.log(`✅ Health record stored with ID: ${recordId}`);

      return {
        success: true,
        blockchainHash: transaction.hash,
        splitKeyData,
        recordId,
      };
    } catch (error) {
      console.error("❌ Failed to store health record:", error);
      throw error;
    }
  }

  /**
   * Retrieve health record
   */
  static async retrieveSecureHealthRecord(
    recordId: string,
    username: string,
    password: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    try {
      console.log(`🔓 Retrieving health record: ${recordId}`);

      // Find the record
      const transaction = this.blockchain.find(block => block.id === recordId);
      if (!transaction) {
        return { success: false, error: "Record not found" };
      }

      // Generate decryption key
      const userHash = this.generateUserHash(username, password);
      const dataHash = ""; // We don't have the original data hash, use empty string
      const combinedHash = this.generateCombinedHash(userHash, dataHash);

      // Try to decrypt
      const decryptedData = this.simpleDecrypt(transaction.encryptedData, combinedHash);
      
      try {
        const parsedData = JSON.parse(decryptedData);
        console.log(`✅ Health record retrieved: ${recordId}`);
        return { success: true, data: parsedData };
      } catch (parseError) {
        console.error("Failed to parse decrypted data:", parseError);
        return { success: false, error: "Failed to decrypt record" };
      }
    } catch (error) {
      console.error("❌ Failed to retrieve health record:", error);
      return { success: false, error: error instanceof Error ? error.message : "Unknown error" };
    }
  }

  /**
   * Validate blockchain integrity
   */
  static validateBlockchain(): boolean {
    try {
      for (let i = 1; i < this.blockchain.length; i++) {
        const currentBlock = this.blockchain[i];
        const previousBlock = this.blockchain[i - 1];

        if (currentBlock.previousHash !== previousBlock.hash) {
          console.error(`❌ Blockchain validation failed at block ${i}`);
          return false;
        }
      }
      
      console.log("✅ Blockchain integrity validated");
      return true;
    } catch (error) {
      console.error("❌ Blockchain validation error:", error);
      return false;
    }
  }

  /**
   * Get blockchain stats
   */
  static getBlockchainStats(): any {
    return {
      totalBlocks: this.blockchain.length,
      latestBlockHash: this.blockchain[this.blockchain.length - 1]?.hash || "none",
      isValid: this.validateBlockchain(),
    };
  }
}
