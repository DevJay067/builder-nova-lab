import { ethers, Contract, Wallet, JsonRpcProvider } from "ethers";
import crypto from "crypto";

/**
 * Blockchain Service for Medical Records Registry
 * Handles interaction with the HealthRecordRegistry smart contract
 */

export interface BlockchainConfig {
  providerUrl: string;
  contractAddress: string;
  privateKey: string;
  networkId: number;
}

export interface MedicalRecordOnChain {
  fileHash: string;
  ipfsCid: string;
  timestamp: number;
  recordType: string;
  fileSize: number;
  isActive: boolean;
  accessCount: number;
  metadataHash: string;
}

export interface BlockchainOperationResult {
  success: boolean;
  transactionHash?: string;
  blockNumber?: number;
  gasUsed?: string;
  error?: string;
}

export interface VerificationResult {
  success: boolean;
  exists?: boolean;
  matches?: boolean;
  timestamp?: number;
  error?: string;
}

// Smart contract ABI (Application Binary Interface)
const HEALTH_RECORD_REGISTRY_ABI = [
  "function registerUser() external",
  "function storeMedicalRecord(bytes32 fileHash, string calldata ipfsCid, string calldata recordType, uint256 fileSize, string calldata metadataHash) external",
  "function verifyMedicalRecord(address user, uint256 recordId, bytes32 fileHash) external view returns (bool exists, bool matches, uint256 timestamp)",
  "function logRecordAccess(address user, uint256 recordId) external",
  "function getMedicalRecord(address user, uint256 recordId) external view returns (tuple(bytes32 fileHash, string ipfsCid, uint256 timestamp, string recordType, uint256 fileSize, bool isActive, uint256 accessCount, string metadataHash))",
  "function getUserRecordCount(address user) external view returns (uint256)",
  "function getUserRecords(address user, uint256 offset, uint256 limit) external view returns (uint256[] memory recordIds, bytes32[] memory hashes, uint256[] memory timestamps)",
  "function deactivateRecord(uint256 recordId) external",
  "function getFileHashOwner(bytes32 fileHash) external view returns (address)",
  "function isUserRegistered(address user) external view returns (bool)",
  "function getContractStats() external view returns (uint256 totalUsers, uint256 totalRecords, uint256 contractBalance)",
  "event UserRegistered(address indexed user, uint256 timestamp)",
  "event MedicalRecordStored(address indexed user, uint256 indexed recordId, bytes32 indexed fileHash, string ipfsCid, string recordType, uint256 timestamp)",
  "event MedicalRecordAccessed(address indexed user, uint256 indexed recordId, address indexed accessor, uint256 timestamp)",
  "event RecordDeactivated(address indexed user, uint256 indexed recordId, uint256 timestamp)",
];

export class BlockchainService {
  private static provider: JsonRpcProvider | null = null;
  private static wallet: Wallet | null = null;
  private static contract: Contract | null = null;
  private static isInitialized = false;
  private static config: BlockchainConfig | null = null;

  /**
   * Initialize blockchain service
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      console.log("🔗 Initializing blockchain service...");

      // Load configuration from environment
      const providerUrl =
        process.env.BLOCKCHAIN_PROVIDER_URL || "http://localhost:8545";
      const contractAddress = process.env.HEALTH_REGISTRY_CONTRACT_ADDRESS;
      const privateKey = process.env.BLOCKCHAIN_PRIVATE_KEY;
      const networkId = parseInt(process.env.BLOCKCHAIN_NETWORK_ID || "31337");

      if (!contractAddress || !privateKey) {
        console.warn(
          "⚠️ Blockchain configuration incomplete, running without blockchain features",
        );
        this.isInitialized = true;
        return;
      }

      this.config = {
        providerUrl,
        contractAddress,
        privateKey,
        networkId,
      };

      // Initialize provider
      this.provider = new JsonRpcProvider(providerUrl);

      // Initialize wallet
      this.wallet = new Wallet(privateKey, this.provider);

      // Initialize contract
      this.contract = new Contract(
        contractAddress,
        HEALTH_RECORD_REGISTRY_ABI,
        this.wallet,
      );

      // Test connection
      const network = await this.provider.getNetwork();
      console.log(
        `✅ Connected to blockchain network: ${network.name} (Chain ID: ${network.chainId})`,
      );

      this.isInitialized = true;
      console.log("✅ Blockchain service initialized successfully");
    } catch (error) {
      console.error("❌ Failed to initialize blockchain service:", error);
      this.isInitialized = true; // Continue without blockchain
    }
  }

  /**
   * Register user on blockchain
   */
  static async registerUser(
    userAddress: string,
  ): Promise<BlockchainOperationResult> {
    if (!this.contract || !this.wallet) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      console.log(`🔗 Registering user on blockchain: ${userAddress}`);

      // Check if user is already registered
      const isRegistered = await this.contract.isUserRegistered(userAddress);
      if (isRegistered) {
        return { success: true, error: "User already registered" };
      }

      // Create a contract instance for the user
      const userContract = this.contract.connect(this.wallet);

      // Register user
      const tx = await userContract.registerUser();
      const receipt = await tx.wait();

      console.log(`✅ User registered on blockchain. TX: ${tx.hash}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Blockchain user registration failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Registration failed",
      };
    }
  }

  /**
   * Store medical record hash on blockchain
   */
  static async storeMedicalRecordHash(
    userAddress: string,
    fileBuffer: Buffer,
    ipfsCid: string,
    recordType: string,
    metadataHash: string,
  ): Promise<BlockchainOperationResult> {
    if (!this.contract || !this.wallet) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      console.log(
        `🔗 Storing medical record hash on blockchain for user: ${userAddress}`,
      );

      // Calculate file hash
      const fileHash = crypto.createHash("sha256").update(fileBuffer).digest();
      const fileHashHex = "0x" + fileHash.toString("hex");

      // Create contract instance for the user
      const userContract = this.contract.connect(this.wallet);

      // Store medical record
      const tx = await userContract.storeMedicalRecord(
        fileHashHex,
        ipfsCid,
        recordType,
        fileBuffer.length,
        metadataHash,
      );

      const receipt = await tx.wait();

      console.log(
        `✅ Medical record hash stored on blockchain. TX: ${tx.hash}`,
      );

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Blockchain record storage failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Storage failed",
      };
    }
  }

  /**
   * Verify medical record integrity on blockchain
   */
  static async verifyMedicalRecord(
    userAddress: string,
    recordId: number,
    fileBuffer: Buffer,
  ): Promise<VerificationResult> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      console.log(
        `🔍 Verifying medical record on blockchain: ${userAddress}, Record ${recordId}`,
      );

      // Calculate file hash
      const fileHash = crypto.createHash("sha256").update(fileBuffer).digest();
      const fileHashHex = "0x" + fileHash.toString("hex");

      // Verify on blockchain
      const [exists, matches, timestamp] =
        await this.contract.verifyMedicalRecord(
          userAddress,
          recordId,
          fileHashHex,
        );

      console.log(
        `✅ Record verification completed. Exists: ${exists}, Matches: ${matches}`,
      );

      return {
        success: true,
        exists,
        matches,
        timestamp: timestamp.toNumber(),
      };
    } catch (error) {
      console.error("❌ Blockchain verification failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Verification failed",
      };
    }
  }

  /**
   * Log record access on blockchain
   */
  static async logRecordAccess(
    userAddress: string,
    recordId: number,
  ): Promise<BlockchainOperationResult> {
    if (!this.contract || !this.wallet) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      console.log(
        `📋 Logging record access on blockchain: ${userAddress}, Record ${recordId}`,
      );

      const tx = await this.contract.logRecordAccess(userAddress, recordId);
      const receipt = await tx.wait();

      console.log(`✅ Record access logged on blockchain. TX: ${tx.hash}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Blockchain access logging failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Access logging failed",
      };
    }
  }

  /**
   * Get medical record from blockchain
   */
  static async getMedicalRecord(
    userAddress: string,
    recordId: number,
  ): Promise<{
    success: boolean;
    record?: MedicalRecordOnChain;
    error?: string;
  }> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      console.log(
        `📋 Getting medical record from blockchain: ${userAddress}, Record ${recordId}`,
      );

      const recordData = await this.contract.getMedicalRecord(
        userAddress,
        recordId,
      );

      const record: MedicalRecordOnChain = {
        fileHash: recordData.fileHash,
        ipfsCid: recordData.ipfsCid,
        timestamp: recordData.timestamp.toNumber(),
        recordType: recordData.recordType,
        fileSize: recordData.fileSize.toNumber(),
        isActive: recordData.isActive,
        accessCount: recordData.accessCount.toNumber(),
        metadataHash: recordData.metadataHash,
      };

      return { success: true, record };
    } catch (error) {
      console.error("❌ Failed to get record from blockchain:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Record retrieval failed",
      };
    }
  }

  /**
   * Get user's record count from blockchain
   */
  static async getUserRecordCount(userAddress: string): Promise<{
    success: boolean;
    count?: number;
    error?: string;
  }> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      const count = await this.contract.getUserRecordCount(userAddress);
      return { success: true, count: count.toNumber() };
    } catch (error) {
      console.error("❌ Failed to get user record count:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Count retrieval failed",
      };
    }
  }

  /**
   * Get user's records from blockchain (paginated)
   */
  static async getUserRecords(
    userAddress: string,
    offset: number = 0,
    limit: number = 10,
  ): Promise<{
    success: boolean;
    records?: Array<{
      recordId: number;
      fileHash: string;
      timestamp: number;
    }>;
    error?: string;
  }> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      const [recordIds, hashes, timestamps] =
        await this.contract.getUserRecords(userAddress, offset, limit);

      const records = recordIds.map((id: any, index: number) => ({
        recordId: id.toNumber(),
        fileHash: hashes[index],
        timestamp: timestamps[index].toNumber(),
      }));

      return { success: true, records };
    } catch (error) {
      console.error("❌ Failed to get user records:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Records retrieval failed",
      };
    }
  }

  /**
   * Deactivate record on blockchain
   */
  static async deactivateRecord(
    userAddress: string,
    recordId: number,
  ): Promise<BlockchainOperationResult> {
    if (!this.contract || !this.wallet) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      console.log(
        `🗑️ Deactivating record on blockchain: ${userAddress}, Record ${recordId}`,
      );

      const tx = await this.contract.deactivateRecord(recordId);
      const receipt = await tx.wait();

      console.log(`✅ Record deactivated on blockchain. TX: ${tx.hash}`);

      return {
        success: true,
        transactionHash: tx.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
      };
    } catch (error) {
      console.error("❌ Blockchain record deactivation failed:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Deactivation failed",
      };
    }
  }

  /**
   * Check if user is registered on blockchain
   */
  static async isUserRegistered(userAddress: string): Promise<{
    success: boolean;
    registered?: boolean;
    error?: string;
  }> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      const registered = await this.contract.isUserRegistered(userAddress);
      return { success: true, registered };
    } catch (error) {
      console.error("❌ Failed to check user registration:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Registration check failed",
      };
    }
  }

  /**
   * Get contract statistics
   */
  static async getContractStats(): Promise<{
    success: boolean;
    stats?: {
      totalUsers: number;
      totalRecords: number;
      contractBalance: string;
    };
    error?: string;
  }> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      const [totalUsers, totalRecords, contractBalance] =
        await this.contract.getContractStats();

      return {
        success: true,
        stats: {
          totalUsers: totalUsers.toNumber(),
          totalRecords: totalRecords.toNumber(),
          contractBalance: ethers.formatEther(contractBalance),
        },
      };
    } catch (error) {
      console.error("❌ Failed to get contract stats:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Stats retrieval failed",
      };
    }
  }

  /**
   * Get file hash owner
   */
  static async getFileHashOwner(fileBuffer: Buffer): Promise<{
    success: boolean;
    owner?: string;
    error?: string;
  }> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      const fileHash = crypto.createHash("sha256").update(fileBuffer).digest();
      const fileHashHex = "0x" + fileHash.toString("hex");

      const owner = await this.contract.getFileHashOwner(fileHashHex);

      return {
        success: true,
        owner: owner === ethers.ZeroAddress ? undefined : owner,
      };
    } catch (error) {
      console.error("❌ Failed to get file hash owner:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Owner lookup failed",
      };
    }
  }

  /**
   * Listen to contract events
   */
  static setupEventListeners(): void {
    if (!this.contract) return;

    console.log("👂 Setting up blockchain event listeners...");

    this.contract.on("UserRegistered", (user, timestamp) => {
      console.log(
        `🔗 User registered on blockchain: ${user} at ${new Date(timestamp * 1000)}`,
      );
    });

    this.contract.on(
      "MedicalRecordStored",
      (user, recordId, fileHash, ipfsCid, recordType, timestamp) => {
        console.log(
          `🔗 Medical record stored: User ${user}, Record ${recordId}, Type ${recordType}`,
        );
      },
    );

    this.contract.on(
      "MedicalRecordAccessed",
      (user, recordId, accessor, timestamp) => {
        console.log(
          `🔗 Medical record accessed: User ${user}, Record ${recordId}, Accessor ${accessor}`,
        );
      },
    );

    this.contract.on("RecordDeactivated", (user, recordId, timestamp) => {
      console.log(
        `🔗 Medical record deactivated: User ${user}, Record ${recordId}`,
      );
    });
  }

  /**
   * Get service status
   */
  static getStatus(): {
    initialized: boolean;
    connected: boolean;
    contractAddress?: string;
    networkId?: number;
    features: string[];
  } {
    return {
      initialized: this.isInitialized,
      connected: this.contract !== null && this.provider !== null,
      contractAddress: this.config?.contractAddress,
      networkId: this.config?.networkId,
      features: [
        "User registration",
        "Medical record hash storage",
        "Integrity verification",
        "Access logging",
        "Record deactivation",
        "Event monitoring",
        "Statistics tracking",
      ],
    };
  }

  /**
   * Generate wallet address from private key
   */
  static generateWalletAddress(privateKey?: string): string {
    try {
      const key = privateKey || ethers.Wallet.createRandom().privateKey;
      const wallet = new ethers.Wallet(key);
      return wallet.address;
    } catch (error) {
      return ethers.ZeroAddress;
    }
  }

  /**
   * Estimate gas for operations
   */
  static async estimateGas(
    operation: string,
    params: any[],
  ): Promise<{
    success: boolean;
    gasEstimate?: string;
    error?: string;
  }> {
    if (!this.contract) {
      return { success: false, error: "Blockchain service not initialized" };
    }

    try {
      const gasEstimate = await this.contract[operation].estimateGas(...params);
      return {
        success: true,
        gasEstimate: gasEstimate.toString(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : "Gas estimation failed",
      };
    }
  }
}
