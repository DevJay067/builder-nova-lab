import crypto from "crypto";
import { HealthRecord, BlockchainTransaction } from "@shared/api";

/**
 * Production-Level Blockchain Service with Split Key Cryptography
 *
 * This service implements a secure healthcare blockchain system with:
 * - Split key cryptography for enhanced security
 * - User hash + data hash combination for secure data access
 * - Production-ready blockchain immutability
 * - Advanced encryption with multiple key layers
 */

export interface SplitKeyData {
  userHash: string;
  dataHash: string;
  combinedHash: string;
  splitKeyPairs: {
    part1: string;
    part2: string;
    checksum: string;
  };
}

export interface SecureHealthRecord extends HealthRecord {
  splitKeyData: SplitKeyData;
  encryptionLayers: {
    userLayer: string;
    dataLayer: string;
    blockchainLayer: string;
  };
  accessControl: {
    patientAccess: boolean;
    providerAccess: boolean;
    emergencyAccess: boolean;
  };
}

export interface ProductionBlock {
  blockNumber: number;
  previousHash: string;
  merkleRoot: string;
  timestamp: string;
  transactions: ProductionTransaction[];
  nonce: number;
  difficulty: number;
  hash: string;
  signature: string;
}

export interface ProductionTransaction {
  id: string;
  type: "CREATE" | "ACCESS" | "UPDATE" | "REVOKE";
  patientId: string;
  dataHash: string;
  splitKeyReference: string;
  encryptedPayload: string;
  timestamp: string;
  signature: string;
  gasUsed: number;
  validationProof: string;
}

class ProductionBlockchainService {
  private static blockchain: ProductionBlock[] = [];
  private static pendingTransactions: ProductionTransaction[] = [];
  private static readonly DIFFICULTY = 4; // Adjustable mining difficulty
  private static readonly BLOCK_TIME = 10000; // 10 seconds per block
  private static readonly MAX_TRANSACTIONS_PER_BLOCK = 100;

  /**
   * Initialize the blockchain with genesis block
   */
  static initializeBlockchain(): void {
    if (this.blockchain.length === 0) {
      const genesisBlock = this.createGenesisBlock();
      this.blockchain.push(genesisBlock);
      console.log("🚀 Production blockchain initialized with genesis block");
    }
  }

  /**
   * Create genesis block
   */
  private static createGenesisBlock(): ProductionBlock {
    const genesisData = {
      blockNumber: 0,
      previousHash: "0",
      timestamp: new Date().toISOString(),
      transactions: [],
      nonce: 0,
      difficulty: this.DIFFICULTY,
    };

    const merkleRoot = this.calculateMerkleRoot([]);
    const blockData = `${genesisData.blockNumber}${genesisData.previousHash}${merkleRoot}${genesisData.timestamp}${genesisData.difficulty}`;
    const hash = this.calculateHash(blockData + genesisData.nonce);

    return {
      ...genesisData,
      merkleRoot,
      hash,
      signature: this.signBlock(hash),
    };
  }

  /**
   * Generate user hash from username and password
   */
  static generateUserHash(username: string, password: string): string {
    const salt = crypto
      .createHash("sha256")
      .update(username)
      .digest("hex")
      .substring(0, 16);
    const userKey = crypto.pbkdf2Sync(password, salt, 100000, 32, "sha256");
    return crypto.createHash("sha256").update(userKey).digest("hex");
  }

  /**
   * Generate data hash from health record
   */
  static generateDataHash(healthRecord: any): string {
    const recordString = JSON.stringify({
      type: healthRecord.type,
      data: healthRecord.data,
      timestamp: healthRecord.timestamp,
      patientId: healthRecord.patientId,
    });
    return crypto.createHash("sha256").update(recordString).digest("hex");
  }

  /**
   * Create split key system (User Hash + Data Hash = Combined Hash → Split)
   */
  static createSplitKeySystem(
    userHash: string,
    dataHash: string,
  ): SplitKeyData {
    // Combine user hash and data hash
    const combinedHash = crypto
      .createHash("sha256")
      .update(userHash + dataHash)
      .digest("hex");

    // Split the combined hash into two parts
    const midPoint = combinedHash.length / 2;
    const part1 = combinedHash.substring(0, midPoint);
    const part2 = combinedHash.substring(midPoint);

    // Create checksum for integrity verification
    const checksum = crypto
      .createHash("sha256")
      .update(part1 + part2)
      .digest("hex")
      .substring(0, 8);

    return {
      userHash,
      dataHash,
      combinedHash,
      splitKeyPairs: {
        part1,
        part2,
        checksum,
      },
    };
  }

  /**
   * Verify split key integrity
   */
  static verifySplitKey(splitKeyData: SplitKeyData): boolean {
    const { part1, part2, checksum } = splitKeyData.splitKeyPairs;
    const reconstructedHash = part1 + part2;

    // Verify reconstruction matches original combined hash
    if (reconstructedHash !== splitKeyData.combinedHash) {
      return false;
    }

    // Verify checksum
    const calculatedChecksum = crypto
      .createHash("sha256")
      .update(part1 + part2)
      .digest("hex")
      .substring(0, 8);

    return calculatedChecksum === checksum;
  }

  /**
   * Encrypt health data with multiple layers
   */
  static encryptHealthData(
    healthRecord: any,
    splitKeyData: SplitKeyData,
  ): { encryptedData: string; encryptionLayers: any } {
    const { userHash, dataHash, combinedHash } = splitKeyData;

    // Layer 1: Encrypt with user hash (user-specific encryption)
    const userLayerKey = crypto.createHash("sha256").update(userHash).digest();
    const userIv = crypto.randomBytes(16);
    const userCipher = crypto.createCipherGCM("aes-256-gcm", userLayerKey);
    userCipher.setIV(userIv);
    userCipher.setAAD(Buffer.from("user-layer"));

    let userEncrypted = userCipher.update(
      JSON.stringify(healthRecord),
      "utf8",
      "hex",
    );
    userEncrypted += userCipher.final("hex");
    const userAuthTag = userCipher.getAuthTag();
    const userLayerData = `${userIv.toString("hex")}:${userAuthTag.toString("hex")}:${userEncrypted}`;

    // Layer 2: Encrypt with data hash (data-specific encryption)
    const dataLayerKey = crypto.createHash("sha256").update(dataHash).digest();
    const dataIv = crypto.randomBytes(16);
    const dataCipher = crypto.createCipherGCM("aes-256-gcm", dataLayerKey);
    dataCipher.setIV(dataIv);
    dataCipher.setAAD(Buffer.from("data-layer"));

    let dataEncrypted = dataCipher.update(userLayerData, "utf8", "hex");
    dataEncrypted += dataCipher.final("hex");
    const dataAuthTag = dataCipher.getAuthTag();
    const dataLayerData = `${dataIv.toString("hex")}:${dataAuthTag.toString("hex")}:${dataEncrypted}`;

    // Layer 3: Encrypt with combined hash (blockchain-specific encryption)
    const blockchainLayerKey = crypto
      .createHash("sha256")
      .update(combinedHash)
      .digest();
    const blockchainIv = crypto.randomBytes(16);
    const blockchainCipher = crypto.createCipherGCM("aes-256-gcm", blockchainLayerKey);
    blockchainCipher.setIV(blockchainIv);
    blockchainCipher.setAAD(Buffer.from("blockchain-layer"));

    let blockchainEncrypted = blockchainCipher.update(
      dataLayerData,
      "utf8",
      "hex",
    );
    blockchainEncrypted += blockchainCipher.final("hex");
    const blockchainAuthTag = blockchainCipher.getAuthTag();
    const finalEncryptedData = `${blockchainIv.toString("hex")}:${blockchainAuthTag.toString("hex")}:${blockchainEncrypted}`;

    return {
      encryptedData: finalEncryptedData,
      encryptionLayers: {
        userLayer: userLayerData,
        dataLayer: dataLayerData,
        blockchainLayer: finalEncryptedData,
      },
    };
  }

  /**
   * Decrypt health data by reversing the encryption layers
   */
  static decryptHealthData(
    encryptedData: string,
    splitKeyData: SplitKeyData,
  ): any {
    try {
      const { userHash, dataHash, combinedHash } = splitKeyData;

      // Layer 3: Decrypt blockchain layer
      const blockchainLayerKey = crypto
        .createHash("sha256")
        .update(combinedHash)
        .digest();
      const [blockchainIvHex, blockchainAuthTagHex, blockchainEncrypted] =
        encryptedData.split(":");
      const blockchainIv = Buffer.from(blockchainIvHex, "hex");
      const blockchainAuthTag = Buffer.from(blockchainAuthTagHex, "hex");

      const blockchainDecipher = crypto.createDecipherGCM("aes-256-gcm", blockchainLayerKey);
      blockchainDecipher.setIV(blockchainIv);
      blockchainDecipher.setAAD(Buffer.from("blockchain-layer"));
      blockchainDecipher.setAuthTag(blockchainAuthTag);

      let dataLayerData = blockchainDecipher.update(
        blockchainEncrypted,
        "hex",
        "utf8",
      );
      dataLayerData += blockchainDecipher.final("utf8");

      // Layer 2: Decrypt data layer
      const dataLayerKey = crypto
        .createHash("sha256")
        .update(dataHash)
        .digest();
      const [dataIvHex, dataAuthTagHex, dataEncrypted] =
        dataLayerData.split(":");
      const dataIv = Buffer.from(dataIvHex, "hex");
      const dataAuthTag = Buffer.from(dataAuthTagHex, "hex");

      const dataDecipher = crypto.createDecipherGCM("aes-256-gcm", dataLayerKey);
      dataDecipher.setIV(dataIv);
      dataDecipher.setAAD(Buffer.from("data-layer"));
      dataDecipher.setAuthTag(dataAuthTag);

      let userLayerData = dataDecipher.update(dataEncrypted, "hex", "utf8");
      userLayerData += dataDecipher.final("utf8");

      // Layer 1: Decrypt user layer
      const userLayerKey = crypto
        .createHash("sha256")
        .update(userHash)
        .digest();
      const [userIvHex, userAuthTagHex, userEncrypted] =
        userLayerData.split(":");
      const userIv = Buffer.from(userIvHex, "hex");
      const userAuthTag = Buffer.from(userAuthTagHex, "hex");

      const userDecipher = crypto.createDecipherGCM("aes-256-gcm", userLayerKey);
      userDecipher.setIV(userIv);
      userDecipher.setAAD(Buffer.from("user-layer"));
      userDecipher.setAuthTag(userAuthTag);

      let decryptedData = userDecipher.update(userEncrypted, "hex", "utf8");
      decryptedData += userDecipher.final("utf8");

      return JSON.parse(decryptedData);
    } catch (error) {
      console.error("❌ Failed to decrypt health data:", error);
      throw new Error(
        "Failed to decrypt health data - invalid keys or corrupted data",
      );
    }
  }

  /**
   * Store secure health record in blockchain
   */
  static async storeSecureHealthRecord(
    healthRecord: any,
    username: string,
    password: string,
  ): Promise<{
    transaction: ProductionTransaction;
    splitKeyData: SplitKeyData;
    blockchainHash: string;
  }> {
    // Generate hashes
    const userHash = this.generateUserHash(username, password);
    const dataHash = this.generateDataHash(healthRecord);

    // Create split key system
    const splitKeyData = this.createSplitKeySystem(userHash, dataHash);

    // Encrypt the health data
    const { encryptedData, encryptionLayers } = this.encryptHealthData(
      healthRecord,
      splitKeyData,
    );

    // Create secure transaction
    const transaction: ProductionTransaction = {
      id: crypto.randomBytes(16).toString("hex"),
      type: "CREATE",
      patientId: healthRecord.patientId || userHash.substring(0, 16),
      dataHash: dataHash,
      splitKeyReference: splitKeyData.combinedHash,
      encryptedPayload: encryptedData,
      timestamp: new Date().toISOString(),
      signature: this.signTransaction(encryptedData),
      gasUsed: this.calculateGasUsage(encryptedData),
      validationProof: this.generateValidationProof(splitKeyData),
    };

    // Add to pending transactions
    this.pendingTransactions.push(transaction);

    // Mine block if enough transactions
    if (this.pendingTransactions.length >= this.MAX_TRANSACTIONS_PER_BLOCK) {
      await this.mineBlock();
    }

    const blockchainHash = crypto
      .createHash("sha256")
      .update(transaction.id + transaction.encryptedPayload)
      .digest("hex");

    console.log(
      `✅ Secure health record stored with blockchain hash: ${blockchainHash}`,
    );

    return {
      transaction,
      splitKeyData,
      blockchainHash,
    };
  }

  /**
   * Retrieve secure health record from blockchain
   */
  static retrieveSecureHealthRecord(
    username: string,
    password: string,
    dataIdentifier: string,
  ): any | null {
    try {
      // Generate user hash
      const userHash = this.generateUserHash(username, password);

      // Search for transaction in blockchain
      const transaction = this.findTransactionByIdentifier(
        dataIdentifier,
        userHash,
      );

      if (!transaction) {
        console.log("❌ No matching transaction found for user");
        return null;
      }

      // Reconstruct split key data
      const splitKeyData = this.reconstructSplitKeyData(userHash, transaction);

      // Verify split key integrity
      if (!this.verifySplitKey(splitKeyData)) {
        console.error("❌ Split key verification failed");
        return null;
      }

      // Decrypt the health data
      const decryptedData = this.decryptHealthData(
        transaction.encryptedPayload,
        splitKeyData,
      );

      console.log(`✅ Successfully retrieved secure health record for user`);
      return decryptedData;
    } catch (error) {
      console.error("❌ Failed to retrieve secure health record:", error);
      return null;
    }
  }

  /**
   * Find transaction by identifier and user
   */
  private static findTransactionByIdentifier(
    identifier: string,
    userHash: string,
  ): ProductionTransaction | null {
    for (const block of this.blockchain) {
      for (const transaction of block.transactions) {
        if (
          (transaction.id === identifier ||
            transaction.dataHash === identifier ||
            transaction.splitKeyReference.includes(
              userHash.substring(0, 16),
            )) &&
          transaction.patientId === userHash.substring(0, 16)
        ) {
          return transaction;
        }
      }
    }
    return null;
  }

  /**
   * Reconstruct split key data from transaction
   */
  private static reconstructSplitKeyData(
    userHash: string,
    transaction: ProductionTransaction,
  ): SplitKeyData {
    const dataHash = transaction.dataHash;
    return this.createSplitKeySystem(userHash, dataHash);
  }

  /**
   * Mine a new block
   */
  private static async mineBlock(): Promise<ProductionBlock> {
    const previousBlock = this.blockchain[this.blockchain.length - 1];
    const blockNumber = previousBlock.blockNumber + 1;
    const timestamp = new Date().toISOString();
    const transactions = [...this.pendingTransactions];
    const merkleRoot = this.calculateMerkleRoot(transactions);

    // Clear pending transactions
    this.pendingTransactions = [];

    // Mine the block (proof of work)
    const { nonce, hash } = await this.proofOfWork(
      blockNumber,
      previousBlock.hash,
      merkleRoot,
      timestamp,
      this.DIFFICULTY,
    );

    const newBlock: ProductionBlock = {
      blockNumber,
      previousHash: previousBlock.hash,
      merkleRoot,
      timestamp,
      transactions,
      nonce,
      difficulty: this.DIFFICULTY,
      hash,
      signature: this.signBlock(hash),
    };

    this.blockchain.push(newBlock);
    console.log(
      `⛏️  Successfully mined block #${blockNumber} with ${transactions.length} transactions`,
    );

    return newBlock;
  }

  /**
   * Proof of work mining algorithm
   */
  private static async proofOfWork(
    blockNumber: number,
    previousHash: string,
    merkleRoot: string,
    timestamp: string,
    difficulty: number,
  ): Promise<{ nonce: number; hash: string }> {
    const target = "0".repeat(difficulty);
    let nonce = 0;
    let hash = "";

    while (!hash.startsWith(target)) {
      nonce++;
      const blockData = `${blockNumber}${previousHash}${merkleRoot}${timestamp}${difficulty}${nonce}`;
      hash = this.calculateHash(blockData);

      // Yield control periodically to prevent blocking
      if (nonce % 10000 === 0) {
        await new Promise((resolve) => setTimeout(resolve, 1));
      }
    }

    return { nonce, hash };
  }

  /**
   * Calculate Merkle root of transactions
   */
  private static calculateMerkleRoot(
    transactions: ProductionTransaction[],
  ): string {
    if (transactions.length === 0) {
      return crypto.createHash("sha256").update("empty").digest("hex");
    }

    let hashes = transactions.map((tx) =>
      crypto
        .createHash("sha256")
        .update(tx.id + tx.encryptedPayload)
        .digest("hex"),
    );

    while (hashes.length > 1) {
      const newHashes: string[] = [];

      for (let i = 0; i < hashes.length; i += 2) {
        const left = hashes[i];
        const right = hashes[i + 1] || hashes[i]; // Use left hash if odd number
        const combined = crypto
          .createHash("sha256")
          .update(left + right)
          .digest("hex");
        newHashes.push(combined);
      }

      hashes = newHashes;
    }

    return hashes[0];
  }

  /**
   * Calculate hash using SHA-256
   */
  private static calculateHash(data: string): string {
    return crypto.createHash("sha256").update(data).digest("hex");
  }

  /**
   * Sign transaction
   */
  private static signTransaction(data: string): string {
    return crypto
      .createHmac("sha256", "healthcare-blockchain-secret")
      .update(data)
      .digest("hex");
  }

  /**
   * Sign block
   */
  private static signBlock(hash: string): string {
    return crypto
      .createHmac("sha256", "healthcare-blockchain-block-secret")
      .update(hash)
      .digest("hex");
  }

  /**
   * Calculate gas usage for transaction
   */
  private static calculateGasUsage(encryptedData: string): number {
    const baseGas = 21000;
    const dataGas = encryptedData.length * 16;
    return baseGas + dataGas;
  }

  /**
   * Generate validation proof
   */
  private static generateValidationProof(splitKeyData: SplitKeyData): string {
    return crypto
      .createHash("sha256")
      .update(splitKeyData.combinedHash + splitKeyData.splitKeyPairs.checksum)
      .digest("hex");
  }

  /**
   * Get blockchain statistics
   */
  static getBlockchainStats(): {
    totalBlocks: number;
    totalTransactions: number;
    pendingTransactions: number;
    lastBlockHash: string;
    difficulty: number;
    averageBlockTime: number;
  } {
    const totalTransactions = this.blockchain.reduce(
      (total, block) => total + block.transactions.length,
      0,
    );
    const lastBlock = this.blockchain[this.blockchain.length - 1];

    return {
      totalBlocks: this.blockchain.length,
      totalTransactions,
      pendingTransactions: this.pendingTransactions.length,
      lastBlockHash: lastBlock?.hash || "none",
      difficulty: this.DIFFICULTY,
      averageBlockTime: this.BLOCK_TIME,
    };
  }

  /**
   * Validate blockchain integrity
   */
  static validateBlockchain(): boolean {
    for (let i = 1; i < this.blockchain.length; i++) {
      const currentBlock = this.blockchain[i];
      const previousBlock = this.blockchain[i - 1];

      // Check if previous hash matches
      if (currentBlock.previousHash !== previousBlock.hash) {
        console.error(`❌ Invalid previous hash at block ${i}`);
        return false;
      }

      // Recalculate and verify hash
      const blockData = `${currentBlock.blockNumber}${currentBlock.previousHash}${currentBlock.merkleRoot}${currentBlock.timestamp}${currentBlock.difficulty}${currentBlock.nonce}`;
      const calculatedHash = this.calculateHash(blockData);

      if (currentBlock.hash !== calculatedHash) {
        console.error(`❌ Invalid hash at block ${i}`);
        return false;
      }

      // Check proof of work
      if (!currentBlock.hash.startsWith("0".repeat(currentBlock.difficulty))) {
        console.error(`❌ Invalid proof of work at block ${i}`);
        return false;
      }
    }

    console.log("✅ Blockchain integrity validated successfully");
    return true;
  }
}

/**
 * Key Management Service for Split Keys
 */
class KeyManagementService {
  private static keyStore: Map<string, SplitKeyData> = new Map();

  /**
   * Store split key data securely
   */
  static storeSplitKeyData(
    identifier: string,
    splitKeyData: SplitKeyData,
  ): void {
    this.keyStore.set(identifier, splitKeyData);
  }

  /**
   * Retrieve split key data
   */
  static getSplitKeyData(identifier: string): SplitKeyData | null {
    return this.keyStore.get(identifier) || null;
  }

  /**
   * Remove split key data
   */
  static removeSplitKeyData(identifier: string): boolean {
    return this.keyStore.delete(identifier);
  }

  /**
   * Get key store statistics
   */
  static getKeyStoreStats(): { totalKeys: number; memoryUsage: string } {
    return {
      totalKeys: this.keyStore.size,
      memoryUsage: `${(JSON.stringify([...this.keyStore.entries()]).length / 1024).toFixed(2)} KB`,
    };
  }
}

export { ProductionBlockchainService, KeyManagementService };
export type {
  SplitKeyData,
  SecureHealthRecord,
  ProductionBlock,
  ProductionTransaction,
};
