import { HealthRecord, BlockchainTransaction } from '@shared/api';
import { CryptoService, KeyPair, TransactionSignature } from './crypto';
import { db, statements } from '../config/database';
import crypto from 'crypto';

/**
 * Production-grade blockchain service with real cryptographic operations
 */

export interface Block {
  blockNumber: number;
  previousHash: string;
  merkleRoot: string;
  timestamp: number;
  nonce: number;
  difficulty: number;
  hash: string;
  transactions: Transaction[];
}

export interface Transaction {
  transactionId: string;
  fromAddress: string;
  toAddress: string;
  dataHash: string;
  signature: TransactionSignature;
  timestamp: number;
  gasUsed: number;
  data?: any;
}

export interface BlockchainState {
  currentBlockNumber: number;
  totalTransactions: number;
  difficulty: number;
  lastBlockHash: string;
  networkStatus: string;
}

export class ProductionBlockchainService {
  private static readonly BLOCK_TIME_TARGET = 60000; // 1 minute target block time
  private static readonly DIFFICULTY_ADJUSTMENT_INTERVAL = 10; // Adjust difficulty every 10 blocks
  private static readonly MAX_TRANSACTIONS_PER_BLOCK = 100;
  private static readonly CONTRACT_ADDRESS = '0xHealthChainContract';

  /**
   * Initialize the blockchain with genesis block
   */
  static async initializeBlockchain(): Promise<void> {
    const latestBlock = statements.getLatestBlock.get() as any;
    
    if (!latestBlock) {
      await this.createGenesisBlock();
    }
  }

  /**
   * Create the genesis block
   */
  private static async createGenesisBlock(): Promise<void> {
    const genesisBlock: Block = {
      blockNumber: 0,
      previousHash: '0000000000000000000000000000000000000000000000000000000000000000',
      merkleRoot: CryptoService.sha256('genesis'),
      timestamp: Date.now(),
      nonce: 0,
      difficulty: 4,
      hash: '',
      transactions: []
    };

    // Mine genesis block
    const { hash, nonce } = CryptoService.generateProofOfWork(genesisBlock, 4);
    genesisBlock.hash = hash;
    genesisBlock.nonce = nonce;

    // Store genesis block
    statements.insertBlock.run(
      genesisBlock.blockNumber,
      genesisBlock.previousHash,
      genesisBlock.merkleRoot,
      genesisBlock.timestamp,
      genesisBlock.nonce,
      genesisBlock.difficulty,
      genesisBlock.hash
    );

    console.log('✅ Genesis block created:', genesisBlock.hash);
  }

  /**
   * Create a new transaction for health record storage
   */
  static async createTransaction(
    healthRecord: HealthRecord,
    patientKeyPair: KeyPair
  ): Promise<Transaction> {
    const transactionId = CryptoService.generateTransactionId();
    const dataHash = CryptoService.sha256(JSON.stringify(healthRecord));
    
    const transactionData = {
      transactionId,
      fromAddress: patientKeyPair.address,
      toAddress: this.CONTRACT_ADDRESS,
      dataHash,
      timestamp: Date.now(),
      gasUsed: this.calculateGasCost(healthRecord)
    };

    // Sign the transaction
    const signature = CryptoService.signTransaction(
      JSON.stringify(transactionData),
      patientKeyPair.privateKey
    );

    const transaction: Transaction = {
      ...transactionData,
      signature,
      data: healthRecord
    };

    // Store transaction in pending state
    statements.insertTransaction.run(
      transaction.transactionId,
      null, // block_number (null for pending)
      transaction.fromAddress,
      transaction.toAddress,
      transaction.dataHash,
      JSON.stringify(transaction.signature),
      transaction.timestamp,
      transaction.gasUsed,
      'pending'
    );

    return transaction;
  }

  /**
   * Mine a new block with pending transactions
   */
  static async mineBlock(): Promise<Block | null> {
    const pendingTransactions = statements.getPendingTransactions.all() as any[];
    
    if (pendingTransactions.length === 0) {
      return null;
    }

    // Get blockchain state
    const state = statements.getBlockchainState.get() as any;
    const latestBlock = statements.getLatestBlock.get() as any;
    
    const blockNumber = state.current_block_number + 1;
    const previousHash = latestBlock?.hash || '0000000000000000000000000000000000000000000000000000000000000000';

    // Select transactions for this block
    const transactionsToInclude = pendingTransactions.slice(0, this.MAX_TRANSACTIONS_PER_BLOCK);
    const transactionHashes = transactionsToInclude.map(tx => tx.data_hash);
    const merkleRoot = CryptoService.calculateMerkleRoot(transactionHashes);

    // Create block
    const block: Block = {
      blockNumber,
      previousHash,
      merkleRoot,
      timestamp: Date.now(),
      nonce: 0,
      difficulty: state.difficulty,
      hash: '',
      transactions: transactionsToInclude.map(tx => ({
        transactionId: tx.transaction_id,
        fromAddress: tx.from_address,
        toAddress: tx.to_address,
        dataHash: tx.data_hash,
        signature: JSON.parse(tx.signature),
        timestamp: tx.timestamp,
        gasUsed: tx.gas_used
      }))
    };

    console.log(`⛏️  Mining block ${blockNumber} with ${transactionsToInclude.length} transactions...`);
    
    // Mine the block (proof-of-work)
    const startTime = Date.now();
    const { hash, nonce } = CryptoService.generateProofOfWork(block, state.difficulty);
    const miningTime = Date.now() - startTime;
    
    block.hash = hash;
    block.nonce = nonce;

    console.log(`✅ Block ${blockNumber} mined in ${miningTime}ms with hash: ${hash}`);

    // Store the block
    statements.insertBlock.run(
      block.blockNumber,
      block.previousHash,
      block.merkleRoot,
      block.timestamp,
      block.nonce,
      block.difficulty,
      block.hash
    );

    // Update transaction statuses
    for (const tx of transactionsToInclude) {
      statements.updateTransactionStatus.run('confirmed', blockNumber, tx.transaction_id);
    }

    // Update blockchain state
    statements.updateBlockchainState.run(
      blockNumber,
      state.total_transactions + transactionsToInclude.length,
      block.hash
    );

    // Adjust difficulty if needed
    await this.adjustDifficulty(blockNumber, miningTime);

    return block;
  }

  /**
   * Store health record on blockchain
   */
  static async storeHealthRecord(
    healthRecord: HealthRecord,
    patientId: string
  ): Promise<{ transaction: Transaction; blockchainHash: string }> {
    // Get or create patient key pair
    let patientProfile = statements.getPatientProfile.get(patientId) as any;
    
    if (!patientProfile) {
      const keyPair = CryptoService.generateKeyPair();
      const encryptedPrivateKey = CryptoService.encryptData(
        keyPair.privateKey.toString('hex'),
        patientId + process.env.ENCRYPTION_SECRET || 'default-secret'
      );
      
      statements.insertPatientProfile.run(
        patientId,
        keyPair.address,
        keyPair.publicKey.toString('hex'),
        encryptedPrivateKey,
        CryptoService.sha256(patientId),
        0
      );
      
      patientProfile = {
        id: patientId,
        wallet_address: keyPair.address,
        public_key: keyPair.publicKey.toString('hex'),
        encrypted_private_key: encryptedPrivateKey
      };
    }

    // Reconstruct key pair
    const privateKeyHex = CryptoService.decryptData(
      patientProfile.encrypted_private_key,
      patientId + process.env.ENCRYPTION_SECRET || 'default-secret'
    );
    
    const keyPair: KeyPair = {
      privateKey: Buffer.from(privateKeyHex, 'hex'),
      publicKey: Buffer.from(patientProfile.public_key, 'hex'),
      address: patientProfile.wallet_address
    };

    // Encrypt health record data
    const encryptedData = CryptoService.encryptData(
      healthRecord,
      patientId + CryptoService.generateSecureRandom(16)
    );
    
    // Create transaction
    const transaction = await this.createTransaction(healthRecord, keyPair);
    
    // Store encrypted health record
    statements.insertHealthRecord.run(
      healthRecord.id,
      patientId,
      transaction.transactionId,
      healthRecord.type,
      healthRecord.title,
      healthRecord.description,
      healthRecord.doctor,
      healthRecord.date,
      healthRecord.status,
      encryptedData,
      transaction.dataHash
    );

    // Update patient record count
    statements.updatePatientRecordCount.run(patientId);

    return {
      transaction,
      blockchainHash: transaction.dataHash
    };
  }

  /**
   * Verify blockchain integrity
   */
  static async verifyBlockchainIntegrity(): Promise<{
    isValid: boolean;
    totalBlocks: number;
    invalidBlocks: string[];
  }> {
    const blocks = db.prepare('SELECT * FROM blocks ORDER BY block_number ASC').all() as any[];
    const invalidBlocks: string[] = [];
    
    for (let i = 0; i < blocks.length; i++) {
      const block = blocks[i];
      const blockData = {
        blockNumber: block.block_number,
        previousHash: block.previous_hash,
        merkleRoot: block.merkle_root,
        timestamp: block.timestamp,
        difficulty: block.difficulty
      };
      
      // Verify proof-of-work
      const isValidPoW = CryptoService.validateProofOfWork(
        blockData,
        block.hash,
        block.nonce,
        block.difficulty
      );
      
      if (!isValidPoW) {
        invalidBlocks.push(block.hash);
      }
      
      // Verify previous hash link (except genesis)
      if (i > 0 && block.previous_hash !== blocks[i - 1].hash) {
        invalidBlocks.push(block.hash);
      }
    }
    
    return {
      isValid: invalidBlocks.length === 0,
      totalBlocks: blocks.length,
      invalidBlocks
    };
  }

  /**
   * Get blockchain statistics
   */
  static getBlockchainStats(): any {
    const state = statements.getBlockchainState.get() as any;
    const latestBlock = statements.getLatestBlock.get() as any;
    
    const totalTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions').get() as { count: number };
    const pendingTransactions = db.prepare('SELECT COUNT(*) as count FROM transactions WHERE status = "pending"').get() as { count: number };
    
    return {
      currentBlockNumber: state.current_block_number,
      totalBlocks: state.current_block_number + 1,
      totalTransactions: totalTransactions.count,
      pendingTransactions: pendingTransactions.count,
      difficulty: state.difficulty,
      networkStatus: state.network_status,
      lastBlockHash: state.last_block_hash,
      lastBlockTime: latestBlock?.timestamp || null,
      avgBlockTime: this.calculateAverageBlockTime()
    };
  }

  /**
   * Calculate gas cost for transaction
   */
  private static calculateGasCost(healthRecord: HealthRecord): number {
    const baseGas = 21000;
    const dataSize = JSON.stringify(healthRecord).length;
    const dataGas = Math.ceil(dataSize / 32) * 68; // 68 gas per 32 bytes
    
    return baseGas + dataGas;
  }

  /**
   * Adjust mining difficulty based on block time
   */
  private static async adjustDifficulty(blockNumber: number, lastMiningTime: number): Promise<void> {
    if (blockNumber % this.DIFFICULTY_ADJUSTMENT_INTERVAL === 0 && blockNumber > 0) {
      const avgBlockTime = this.calculateAverageBlockTime();
      
      if (avgBlockTime < this.BLOCK_TIME_TARGET * 0.8) {
        // Blocks too fast, increase difficulty
        statements.incrementDifficulty.run();
        console.log('📈 Difficulty increased due to fast block times');
      } else if (avgBlockTime > this.BLOCK_TIME_TARGET * 1.2) {
        // Blocks too slow, decrease difficulty
        statements.decrementDifficulty.run();
        console.log('📉 Difficulty decreased due to slow block times');
      }
    }
  }

  /**
   * Calculate average block time
   */
  private static calculateAverageBlockTime(): number {
    const recentBlocks = db.prepare(`
      SELECT timestamp FROM blocks 
      ORDER BY block_number DESC 
      LIMIT ${this.DIFFICULTY_ADJUSTMENT_INTERVAL}
    `).all() as any[];
    
    if (recentBlocks.length < 2) return this.BLOCK_TIME_TARGET;
    
    const times = recentBlocks.map(block => block.timestamp).sort((a, b) => a - b);
    const totalTime = times[times.length - 1] - times[0];
    
    return totalTime / (times.length - 1);
  }

  /**
   * Get transaction by ID
   */
  static getTransaction(transactionId: string): any {
    return statements.getTransaction.get(transactionId);
  }

  /**
   * Get block by number
   */
  static getBlock(blockNumber: number): any {
    return statements.getBlock.get(blockNumber);
  }

  /**
   * Validate transaction signature
   */
  static validateTransaction(transaction: Transaction): boolean {
    try {
      const publicKey = Buffer.from(transaction.fromAddress.slice(2), 'hex');
      const transactionData = JSON.stringify({
        transactionId: transaction.transactionId,
        fromAddress: transaction.fromAddress,
        toAddress: transaction.toAddress,
        dataHash: transaction.dataHash,
        timestamp: transaction.timestamp,
        gasUsed: transaction.gasUsed
      });
      
      return CryptoService.verifySignature(transactionData, transaction.signature, publicKey);
    } catch (error) {
      return false;
    }
  }
}

// Initialize blockchain on service load
ProductionBlockchainService.initializeBlockchain().catch(console.error);
