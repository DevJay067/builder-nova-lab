import crypto from 'crypto';
import { EventEmitter } from 'events';

export interface ProductionTransaction {
  id: string;
  from: string;
  to: string;
  data: any;
  dataHash: string;
  timestamp: string;
  signature: string;
  nonce: number;
  blockHash?: string;
}

export interface ProductionBlock {
  index: number;
  timestamp: string;
  transactions: ProductionTransaction[];
  previousHash: string;
  hash: string;
  nonce: number;
  merkleRoot: string;
  difficulty: number;
}

export interface SplitKeySystem {
  userHash: string;
  dataHash: string;
  combinedHash: string;
  keyFragments: string[];
  recoveryKeys: string[];
  timestamp: string;
}

export interface BlockchainStats {
  totalBlocks: number;
  totalTransactions: number;
  currentDifficulty: number;
  averageBlockTime: number;
  networkHashRate: number;
  lastBlockHash: string;
  chainIntegrity: boolean;
}

export class ProductionBlockchainService extends EventEmitter {
  private static instance: ProductionBlockchainService;
  private chain: ProductionBlock[] = [];
  private pendingTransactions: ProductionTransaction[] = [];
  private difficulty: number = 4;
  private miningReward: number = 100;
  private isMining: boolean = false;
  private miningInterval: NodeJS.Timeout | null = null;
  private splitKeyStore: Map<string, SplitKeySystem> = new Map();

  public static getInstance(): ProductionBlockchainService {
    if (!ProductionBlockchainService.instance) {
      ProductionBlockchainService.instance = new ProductionBlockchainService();
    }
    return ProductionBlockchainService.instance;
  }

  constructor() {
    super();
    this.initializeBlockchain();
  }

  private initializeBlockchain(): void {
    // Create genesis block
    const genesisBlock: ProductionBlock = {
      index: 0,
      timestamp: new Date().toISOString(),
      transactions: [],
      previousHash: '0',
      hash: this.calculateBlockHash({
        index: 0,
        timestamp: new Date().toISOString(),
        transactions: [],
        previousHash: '0',
        hash: '',
        nonce: 0,
        merkleRoot: '',
        difficulty: this.difficulty
      }),
      nonce: 0,
      merkleRoot: this.calculateMerkleRoot([]),
      difficulty: this.difficulty
    };

    this.chain.push(genesisBlock);
    console.log("🏗️ Genesis block created");
  }

  // Split-key cryptography system
  createSplitKeySystem(userHash: string, dataHash: string): SplitKeySystem {
    const combinedHash = crypto.createHash('sha256')
      .update(userHash + dataHash)
      .digest('hex');

    // Generate key fragments
    const keyFragments: string[] = [];
    const recoveryKeys: string[] = [];

    for (let i = 0; i < 5; i++) {
      keyFragments.push(crypto.randomBytes(32).toString('hex'));
    }

    // Generate recovery keys
    for (let i = 0; i < 3; i++) {
      recoveryKeys.push(crypto.randomBytes(32).toString('hex'));
    }

    const splitKeySystem: SplitKeySystem = {
      userHash,
      dataHash,
      combinedHash,
      keyFragments,
      recoveryKeys,
      timestamp: new Date().toISOString()
    };

    this.splitKeyStore.set(combinedHash, splitKeySystem);
    return splitKeySystem;
  }

  // Multi-layer encryption
  encryptHealthData(healthRecord: any, userHash: string, dataHash: string): string {
    const splitKeySystem = this.createSplitKeySystem(userHash, dataHash);
    
    // Layer 1: User-specific encryption
    const userKey = crypto.createHash('sha256').update(userHash).digest();
    const userEncrypted = this.encryptWithKey(JSON.stringify(healthRecord), userKey);
    
    // Layer 2: Data-specific encryption
    const dataKey = crypto.createHash('sha256').update(dataHash).digest();
    const dataEncrypted = this.encryptWithKey(userEncrypted, dataKey);
    
    // Layer 3: Blockchain encryption
    const blockchainKey = crypto.createHash('sha256').update(splitKeySystem.combinedHash).digest();
    const blockchainEncrypted = this.encryptWithKey(dataEncrypted, blockchainKey);
    
    return blockchainEncrypted;
  }

  private encryptWithKey(data: string, key: Buffer): string {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher('aes-256-gcm', key);
    
    let encrypted = cipher.update(data, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  // Create new transaction
  createTransaction(from: string, to: string, data: any): ProductionTransaction {
    const transaction: ProductionTransaction = {
      id: crypto.randomUUID(),
      from,
      to,
      data,
      dataHash: this.calculateDataHash(data),
      timestamp: new Date().toISOString(),
      signature: '',
      nonce: 0
    };

    // Sign transaction
    transaction.signature = this.signTransaction(transaction, from);
    
    this.pendingTransactions.push(transaction);
    this.emit('transactionCreated', transaction);
    
    return transaction;
  }

  // Sign transaction with digital signature
  signTransaction(transaction: ProductionTransaction, privateKey: string): string {
    const transactionData = JSON.stringify({
      id: transaction.id,
      from: transaction.from,
      to: transaction.to,
      data: transaction.data,
      dataHash: transaction.dataHash,
      timestamp: transaction.timestamp
    });

    const signature = crypto.createHmac('sha256', privateKey)
      .update(transactionData)
      .digest('hex');

    return signature;
  }

  // Verify transaction signature
  verifyTransactionSignature(transaction: ProductionTransaction, publicKey: string): boolean {
    const transactionData = JSON.stringify({
      id: transaction.id,
      from: transaction.from,
      to: transaction.to,
      data: transaction.data,
      dataHash: transaction.dataHash,
      timestamp: transaction.timestamp
    });

    const expectedSignature = crypto.createHmac('sha256', publicKey)
      .update(transactionData)
      .digest('hex');

    return transaction.signature === expectedSignature;
  }

  // Calculate Merkle root for data integrity
  calculateMerkleRoot(transactions: ProductionTransaction[]): string {
    if (transactions.length === 0) {
      return crypto.createHash('sha256').update('empty').digest('hex');
    }

    if (transactions.length === 1) {
      return crypto.createHash('sha256').update(transactions[0].dataHash).digest('hex');
    }

    const leaves = transactions.map(tx => tx.dataHash);
    const merkleTree = this.buildMerkleTree(leaves);
    
    return merkleTree[merkleTree.length - 1][0];
  }

  private buildMerkleTree(leaves: string[]): string[][] {
    const tree: string[][] = [leaves];

    while (tree[tree.length - 1].length > 1) {
      const currentLevel = tree[tree.length - 1];
      const nextLevel: string[] = [];

      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        
        const combined = crypto.createHash('sha256')
          .update(left + right)
          .digest('hex');
        
        nextLevel.push(combined);
      }

      tree.push(nextLevel);
    }

    return tree;
  }

  // Proof-of-work mining
  async mineBlock(transactions: ProductionTransaction[], difficulty: number = this.difficulty): Promise<ProductionBlock> {
    const previousBlock = this.getLatestBlock();
    const newBlock: ProductionBlock = {
      index: previousBlock.index + 1,
      timestamp: new Date().toISOString(),
      transactions,
      previousHash: previousBlock.hash,
      hash: '',
      nonce: 0,
      merkleRoot: this.calculateMerkleRoot(transactions),
      difficulty
    };

    console.log(`⛏️ Mining block ${newBlock.index} with difficulty ${difficulty}...`);
    
    let nonce = 0;
    let hash = '';
    const target = '0'.repeat(difficulty);

    while (!hash.startsWith(target)) {
      nonce++;
      newBlock.nonce = nonce;
      hash = this.calculateBlockHash(newBlock);
      
      if (nonce % 10000 === 0) {
        this.emit('miningProgress', { blockIndex: newBlock.index, nonce, hash });
      }
    }

    newBlock.hash = hash;
    console.log(`✅ Block ${newBlock.index} mined! Hash: ${hash}`);
    
    return newBlock;
  }

  // Calculate block hash
  private calculateBlockHash(block: ProductionBlock): string {
    const blockData = JSON.stringify({
      index: block.index,
      timestamp: block.timestamp,
      transactions: block.transactions,
      previousHash: block.previousHash,
      nonce: block.nonce,
      merkleRoot: block.merkleRoot,
      difficulty: block.difficulty
    });

    return crypto.createHash('sha256').update(blockData).digest('hex');
  }

  // Add block to chain
  addBlock(block: ProductionBlock): boolean {
    // Verify block integrity
    if (!this.isValidBlock(block)) {
      console.error("❌ Invalid block detected");
      return false;
    }

    this.chain.push(block);
    this.emit('blockAdded', block);
    
    // Adjust difficulty based on mining time
    this.adjustDifficulty();
    
    return true;
  }

  // Validate block
  private isValidBlock(block: ProductionBlock): boolean {
    const previousBlock = this.getLatestBlock();
    
    // Check block index
    if (block.index !== previousBlock.index + 1) {
      return false;
    }
    
    // Check previous hash
    if (block.previousHash !== previousBlock.hash) {
      return false;
    }
    
    // Check block hash
    const calculatedHash = this.calculateBlockHash(block);
    if (block.hash !== calculatedHash) {
      return false;
    }
    
    // Check proof of work
    const target = '0'.repeat(block.difficulty);
    if (!block.hash.startsWith(target)) {
      return false;
    }
    
    // Verify Merkle root
    const calculatedMerkleRoot = this.calculateMerkleRoot(block.transactions);
    if (block.merkleRoot !== calculatedMerkleRoot) {
      return false;
    }
    
    return true;
  }

  // Adjust mining difficulty
  private adjustDifficulty(): void {
    const lastBlock = this.getLatestBlock();
    const previousBlock = this.chain[this.chain.length - 2];
    
    if (!previousBlock) return;
    
    const timeDiff = new Date(lastBlock.timestamp).getTime() - new Date(previousBlock.timestamp).getTime();
    const targetTime = 60000; // 1 minute target
    
    if (timeDiff < targetTime / 2) {
      this.difficulty++;
    } else if (timeDiff > targetTime * 2) {
      this.difficulty = Math.max(1, this.difficulty - 1);
    }
  }

  // Start mining process
  startMining(): void {
    if (this.isMining) return;
    
    this.isMining = true;
    console.log("🚀 Starting blockchain mining...");
    
    this.miningInterval = setInterval(async () => {
      if (this.pendingTransactions.length > 0) {
        const transactions = [...this.pendingTransactions];
        this.pendingTransactions = [];
        
        try {
          const newBlock = await this.mineBlock(transactions);
          this.addBlock(newBlock);
        } catch (error) {
          console.error("❌ Mining error:", error);
        }
      }
    }, 1000);
  }

  // Stop mining process
  stopMining(): void {
    if (this.miningInterval) {
      clearInterval(this.miningInterval);
      this.miningInterval = null;
    }
    this.isMining = false;
    console.log("⏹️ Mining stopped");
  }

  // Get blockchain statistics
  getBlockchainStats(): BlockchainStats {
    const totalBlocks = this.chain.length;
    const totalTransactions = this.chain.reduce((sum, block) => sum + block.transactions.length, 0);
    const lastBlock = this.getLatestBlock();
    
    // Calculate average block time
    let totalTime = 0;
    for (let i = 1; i < this.chain.length; i++) {
      const currentTime = new Date(this.chain[i].timestamp).getTime();
      const previousTime = new Date(this.chain[i - 1].timestamp).getTime();
      totalTime += currentTime - previousTime;
    }
    const averageBlockTime = totalTime / (this.chain.length - 1);
    
    return {
      totalBlocks,
      totalTransactions,
      currentDifficulty: this.difficulty,
      averageBlockTime,
      networkHashRate: this.calculateHashRate(),
      lastBlockHash: lastBlock.hash,
      chainIntegrity: this.verifyChainIntegrity()
    };
  }

  // Calculate network hash rate
  private calculateHashRate(): number {
    // Simplified hash rate calculation
    return this.difficulty * 1000; // Hashes per second estimate
  }

  // Verify entire chain integrity
  verifyChainIntegrity(): boolean {
    for (let i = 1; i < this.chain.length; i++) {
      if (!this.isValidBlock(this.chain[i])) {
        return false;
      }
    }
    return true;
  }

  // Get latest block
  getLatestBlock(): ProductionBlock {
    return this.chain[this.chain.length - 1];
  }

  // Get all blocks
  getAllBlocks(): ProductionBlock[] {
    return [...this.chain];
  }

  // Get pending transactions
  getPendingTransactions(): ProductionTransaction[] {
    return [...this.pendingTransactions];
  }

  // Calculate data hash
  private calculateDataHash(data: any): string {
    const dataString = JSON.stringify(data);
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }

  // Emergency key recovery
  recoverSplitKey(combinedHash: string, recoveryKeys: string[]): SplitKeySystem | null {
    const splitKeySystem = this.splitKeyStore.get(combinedHash);
    if (!splitKeySystem) {
      return null;
    }

    // Verify recovery keys
    const validRecoveryKeys = splitKeySystem.recoveryKeys;
    const providedKeys = new Set(recoveryKeys);
    
    const isValidRecovery = validRecoveryKeys.some(key => providedKeys.has(key));
    
    if (isValidRecovery) {
      return splitKeySystem;
    }
    
    return null;
  }

  // Initialize blockchain system
  initializeBlockchain(): void {
    console.log("🏗️ Initializing production blockchain system...");
    this.startMining();
    console.log("✅ Production blockchain system initialized");
  }
}
