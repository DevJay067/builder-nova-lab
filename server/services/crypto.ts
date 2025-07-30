import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import secp256k1 from 'secp256k1';

/**
 * Production-grade cryptographic utilities for blockchain
 */

export interface KeyPair {
  privateKey: Buffer;
  publicKey: Buffer;
  address: string;
}

export interface TransactionSignature {
  r: string;
  s: string;
  recovery: number;
  signature: string;
}

export class CryptoService {
  
  /**
   * Generate a new cryptographic key pair for blockchain addresses
   */
  static generateKeyPair(): KeyPair {
    let privateKey: Buffer;
    
    // Generate a valid private key for secp256k1
    do {
      privateKey = crypto.randomBytes(32);
    } while (!secp256k1.privateKeyVerify(privateKey));
    
    // Generate public key from private key
    const publicKey = secp256k1.publicKeyCreate(privateKey, false);
    
    // Generate address from public key (similar to Ethereum)
    const publicKeyHash = crypto.createHash('keccak256').update(publicKey.slice(1)).digest();
    const address = '0x' + publicKeyHash.slice(-20).toString('hex');
    
    return {
      privateKey,
      publicKey,
      address
    };
  }

  /**
   * Generate a secure wallet address from public key
   */
  static generateWalletAddress(publicKey: Buffer): string {
    const hash = crypto.createHash('sha256').update(publicKey).digest();
    const ripemdHash = crypto.createHash('ripemd160').update(hash).digest();
    return '0x' + ripemdHash.toString('hex');
  }

  /**
   * Create a SHA-256 hash
   */
  static sha256(data: string | Buffer): string {
    return crypto.createHash('sha256').update(data).digest('hex');
  }

  /**
   * Create a double SHA-256 hash (Bitcoin-style)
   */
  static doubleSha256(data: string | Buffer): string {
    const firstHash = crypto.createHash('sha256').update(data).digest();
    return crypto.createHash('sha256').update(firstHash).digest('hex');
  }

  /**
   * Create Merkle tree root from transaction hashes
   */
  static calculateMerkleRoot(transactionHashes: string[]): string {
    if (transactionHashes.length === 0) {
      return this.sha256('0');
    }
    
    if (transactionHashes.length === 1) {
      return transactionHashes[0];
    }
    
    let currentLevel = [...transactionHashes];
    
    while (currentLevel.length > 1) {
      const nextLevel: string[] = [];
      
      // Process pairs
      for (let i = 0; i < currentLevel.length; i += 2) {
        const left = currentLevel[i];
        const right = i + 1 < currentLevel.length ? currentLevel[i + 1] : left;
        const combined = left + right;
        nextLevel.push(this.sha256(combined));
      }
      
      currentLevel = nextLevel;
    }
    
    return currentLevel[0];
  }

  /**
   * Sign transaction data with private key
   */
  static signTransaction(transactionData: string, privateKey: Buffer): TransactionSignature {
    const messageHash = Buffer.from(this.sha256(transactionData), 'hex');
    const signature = secp256k1.ecdsaSign(messageHash, privateKey);
    
    return {
      r: signature.signature.slice(0, 32).toString('hex'),
      s: signature.signature.slice(32, 64).toString('hex'),
      recovery: signature.recovery,
      signature: signature.signature.toString('hex')
    };
  }

  /**
   * Verify transaction signature
   */
  static verifySignature(transactionData: string, signature: TransactionSignature, publicKey: Buffer): boolean {
    try {
      const messageHash = Buffer.from(this.sha256(transactionData), 'hex');
      const signatureBuffer = Buffer.from(signature.signature, 'hex');
      
      return secp256k1.ecdsaVerify(signatureBuffer, messageHash, publicKey);
    } catch (error) {
      return false;
    }
  }

  /**
   * Encrypt sensitive data with AES-256-GCM
   */
  static encryptData(data: any, password: string): string {
    const algorithm = 'aes-256-gcm';
    const key = crypto.scryptSync(password, 'salt', 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipher(algorithm, key);
    
    let encrypted = cipher.update(JSON.stringify(data), 'utf8', 'hex');
    encrypted += cipher.final('hex');
    
    const authTag = cipher.getAuthTag();
    
    return iv.toString('hex') + ':' + authTag.toString('hex') + ':' + encrypted;
  }

  /**
   * Decrypt data with AES-256-GCM
   */
  static decryptData(encryptedData: string, password: string): any {
    try {
      const algorithm = 'aes-256-gcm';
      const key = crypto.scryptSync(password, 'salt', 32);
      
      const parts = encryptedData.split(':');
      if (parts.length !== 3) {
        throw new Error('Invalid encrypted data format');
      }
      
      const iv = Buffer.from(parts[0], 'hex');
      const authTag = Buffer.from(parts[1], 'hex');
      const encrypted = parts[2];
      
      const decipher = crypto.createDecipher(algorithm, key);
      decipher.setAuthTag(authTag);
      
      let decrypted = decipher.update(encrypted, 'hex', 'utf8');
      decrypted += decipher.final('utf8');
      
      return JSON.parse(decrypted);
    } catch (error) {
      throw new Error('Failed to decrypt data: ' + error.message);
    }
  }

  /**
   * Hash password securely
   */
  static async hashPassword(password: string): Promise<string> {
    const saltRounds = 12;
    return bcrypt.hash(password, saltRounds);
  }

  /**
   * Verify password against hash
   */
  static async verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random string
   */
  static generateSecureRandom(length: number = 32): string {
    return crypto.randomBytes(length).toString('hex');
  }

  /**
   * Generate proof-of-work hash with nonce
   */
  static generateProofOfWork(blockData: any, difficulty: number): { hash: string; nonce: number } {
    const target = '0'.repeat(difficulty);
    let nonce = 0;
    let hash: string;
    
    do {
      const blockString = JSON.stringify({ ...blockData, nonce });
      hash = this.doubleSha256(blockString);
      nonce++;
    } while (!hash.startsWith(target) && nonce < 1000000); // Prevent infinite loops
    
    return { hash, nonce: nonce - 1 };
  }

  /**
   * Validate proof-of-work
   */
  static validateProofOfWork(blockData: any, hash: string, nonce: number, difficulty: number): boolean {
    const target = '0'.repeat(difficulty);
    const blockString = JSON.stringify({ ...blockData, nonce });
    const calculatedHash = this.doubleSha256(blockString);
    
    return calculatedHash === hash && hash.startsWith(target);
  }

  /**
   * Create transaction ID
   */
  static generateTransactionId(): string {
    return this.sha256(crypto.randomBytes(32) + Date.now().toString());
  }

  /**
   * Create block hash
   */
  static generateBlockHash(blockData: any): string {
    return this.doubleSha256(JSON.stringify(blockData));
  }
}
