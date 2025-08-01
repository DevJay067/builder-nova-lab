import crypto from 'crypto';
import { HealthRecord, BlockchainTransaction } from '@shared/api';

/**
 * Blockchain Simulation Service
 * Simulates blockchain functionality for healthcare data storage
 */

// In-memory blockchain simulation (in production, this would be a real blockchain)
const blockchainLedger: Map<string, any> = new Map();
const transactionHistory: BlockchainTransaction[] = [];
let currentBlockNumber = 1;

export class BlockchainService {
  
  /**
   * Generate a cryptographic hash for blockchain storage
   */
  static generateBlockchainHash(data: any): string {
    const dataString = JSON.stringify(data);
    const hash = crypto.createHash('sha256').update(dataString).digest('hex');
    return `0x${hash.substring(0, 32)}...${hash.substring(hash.length - 8)}`;
  }

  /**
   * Generate a wallet address for a patient
   */
  static generateWalletAddress(): string {
    const randomBytes = crypto.randomBytes(20);
    return `0x${randomBytes.toString('hex')}`;
  }

  /**
   * Generate an encryption key for patient data
   */
  static generateEncryptionKey(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  /**
   * Encrypt sensitive health data
   */
  static encryptHealthData(data: any, encryptionKey: string): string {
    const algorithm = 'aes-256-gcm';
    const iv = crypto.randomBytes(16);
    const key = crypto.createHash('sha256').update(encryptionKey).digest();
    const cipher = crypto.createCipherGCM(algorithm, key, iv);

    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    const authTag = cipher.getAuthTag();

    return `${iv.toString('hex')}:${authTag.toString('hex')}:${encrypted}`;
  }

  /**
   * Decrypt health data
   */
  static decryptHealthData(encryptedData: string, encryptionKey: string): any {
    try {
      const algorithm = 'aes-256-gcm';
      const [ivHex, encrypted] = encryptedData.split(':');
      const iv = Buffer.from(ivHex, 'hex');
      const decipher = crypto.createDecipher(algorithm, encryptionKey);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt health data');
    }
  }

  /**
   * Store health record on simulated blockchain
   */
  static async storeHealthRecord(record: HealthRecord): Promise<BlockchainTransaction> {
    const blockHash = this.generateBlockchainHash({
      ...record,
      timestamp: new Date().toISOString(),
      blockNumber: currentBlockNumber
    });

    const transaction: BlockchainTransaction = {
      transactionId: crypto.randomBytes(16).toString('hex'),
      blockHash,
      blockNumber: currentBlockNumber,
      timestamp: new Date().toISOString(),
      gasUsed: Math.floor(Math.random() * 50000) + 21000, // Simulate gas usage
      from: record.patientId,
      to: '0xHealthChainContract',
      dataHash: record.blockchainHash
    };

    // Store in simulated blockchain ledger
    blockchainLedger.set(record.blockchainHash, {
      record,
      transaction,
      immutable: true,
      verified: true
    });

    transactionHistory.push(transaction);
    currentBlockNumber++;

    // Simulate blockchain network delay
    await new Promise(resolve => setTimeout(resolve, 100));

    return transaction;
  }

  /**
   * Retrieve health record from blockchain
   */
  static getHealthRecordFromBlockchain(blockchainHash: string): any {
    return blockchainLedger.get(blockchainHash);
  }

  /**
   * Verify blockchain integrity
   */
  static verifyBlockchainIntegrity(blockchainHash: string): boolean {
    const entry = blockchainLedger.get(blockchainHash);
    if (!entry) return false;

    // Simulate verification process
    const recomputedHash = this.generateBlockchainHash(entry.record);
    return recomputedHash === blockchainHash;
  }

  /**
   * Get blockchain statistics
   */
  static getBlockchainStats() {
    return {
      totalBlocks: currentBlockNumber - 1,
      totalTransactions: transactionHistory.length,
      totalRecords: blockchainLedger.size,
      networkStatus: 'active',
      lastBlockTime: transactionHistory[transactionHistory.length - 1]?.timestamp || null
    };
  }

  /**
   * Get transaction history for a patient
   */
  static getPatientTransactionHistory(patientId: string): BlockchainTransaction[] {
    return transactionHistory.filter(tx => tx.from === patientId);
  }

  /**
   * Simulate blockchain mining/consensus
   */
  static simulateBlockMining(): Promise<{ success: boolean; blockHash: string }> {
    return new Promise((resolve) => {
      // Simulate mining time
      setTimeout(() => {
        const blockHash = this.generateBlockchainHash({
          timestamp: new Date().toISOString(),
          blockNumber: currentBlockNumber,
          nonce: Math.floor(Math.random() * 1000000)
        });
        
        resolve({
          success: true,
          blockHash
        });
      }, 200); // Simulate 200ms mining time
    });
  }
}
