import crypto from "crypto";
import { SecureDataAccessService, SplitKeyPair } from "./secureDataAccess";

/**
 * Secure Key Management and Distribution System
 *
 * This service handles the secure generation, storage, and distribution
 * of split keys for the healthcare data access system.
 */

export interface KeyStore {
  keyId: string;
  patientId: string;
  providerId: string;
  systemKeyEncrypted: string; // Encrypted with master system key
  keyMetadata: {
    createdAt: string;
    expiresAt?: string;
    rotationCount: number;
    status: "active" | "revoked" | "expired";
    lastUsed?: string;
  };
}

export interface KeyDistribution {
  distributionId: string;
  keyId: string;
  recipientType: "patient" | "provider";
  recipientId: string;
  keyFragment: string;
  deliveryMethod: "secure_email" | "sms" | "qr_code" | "hardware_token";
  distributedAt: string;
  acknowledged: boolean;
  acknowledgedAt?: string;
}

export interface KeyRotationSchedule {
  scheduleId: string;
  keyId: string;
  scheduledRotationDate: string;
  rotationReason:
    | "periodic"
    | "security_breach"
    | "user_request"
    | "compliance";
  autoRotate: boolean;
  notificationsSent: string[];
}

export class KeyManagementService {
  private static readonly MASTER_SYSTEM_KEY =
    process.env.MASTER_SYSTEM_KEY || "default-master-key";
  private static readonly KEY_ROTATION_INTERVAL = 90; // days

  /**
   * Initialize the key management system
   */
  static async initializeKeyManagement(): Promise<void> {
    // Verify master system key
    if (!process.env.MASTER_SYSTEM_KEY) {
      console.warn(
        "⚠️  Using default master system key. Set MASTER_SYSTEM_KEY environment variable in production.",
      );
    }

    // Initialize key rotation scheduler
    this.startKeyRotationScheduler();

    console.log("✅ Key Management System initialized");
  }

  /**
   * Generate and securely distribute split keys for a new patient
   */
  static async generateAndDistributeKeys(
    patientId: string,
    providerId: string,
    patientEmail?: string,
    providerEmail?: string,
  ): Promise<{
    keyStore: KeyStore;
    distributions: KeyDistribution[];
    qrCodes: { patient: string; provider: string };
  }> {
    // Generate split keys
    const splitKeys = SecureDataAccessService.generateSplitKeys(
      patientId,
      providerId,
    );

    // Encrypt system key fragment for storage
    const systemKeyEncrypted = this.encryptSystemKey(splitKeys.systemKey);

    // Create key store record
    const keyStore: KeyStore = {
      keyId: splitKeys.keyId,
      patientId,
      providerId,
      systemKeyEncrypted,
      keyMetadata: {
        createdAt: splitKeys.createdAt,
        expiresAt: splitKeys.expiresAt,
        rotationCount: 0,
        status: "active",
      },
    };

    // Store in secure database
    await this.storeKeyRecord(keyStore);

    // Distribute keys to patient and provider
    const distributions: KeyDistribution[] = [];

    // Patient key distribution
    const patientDistribution = await this.distributeKey(
      splitKeys.keyId,
      "patient",
      patientId,
      splitKeys.patientKey,
      patientEmail ? "secure_email" : "qr_code",
    );
    distributions.push(patientDistribution);

    // Provider key distribution
    const providerDistribution = await this.distributeKey(
      splitKeys.keyId,
      "provider",
      providerId,
      splitKeys.providerKey,
      providerEmail ? "secure_email" : "qr_code",
    );
    distributions.push(providerDistribution);

    // Generate QR codes for offline access
    const qrCodes = {
      patient: this.generateQRCode(splitKeys.patientKey, "patient", patientId),
      provider: this.generateQRCode(
        splitKeys.providerKey,
        "provider",
        providerId,
      ),
    };

    // Schedule automatic key rotation
    await this.scheduleKeyRotation(splitKeys.keyId, this.KEY_ROTATION_INTERVAL);

    return { keyStore, distributions, qrCodes };
  }

  /**
   * Securely retrieve system key fragment
   */
  static async getSystemKey(keyId: string): Promise<string> {
    const keyStore = await this.getKeyRecord(keyId);

    if (!keyStore) {
      throw new Error("Key not found");
    }

    if (keyStore.keyMetadata.status !== "active") {
      throw new Error(`Key is ${keyStore.keyMetadata.status}`);
    }

    // Check expiration
    if (
      keyStore.keyMetadata.expiresAt &&
      new Date(keyStore.keyMetadata.expiresAt) < new Date()
    ) {
      await this.markKeyExpired(keyId);
      throw new Error("Key has expired");
    }

    // Decrypt system key
    const systemKey = this.decryptSystemKey(keyStore.systemKeyEncrypted);

    // Update last used timestamp
    await this.updateKeyUsage(keyId);

    return systemKey;
  }

  /**
   * Rotate keys for enhanced security
   */
  static async rotateKeys(
    keyId: string,
    reason: "periodic" | "security_breach" | "user_request" | "compliance",
  ): Promise<{
    oldKeyId: string;
    newKeyStore: KeyStore;
    distributions: KeyDistribution[];
  }> {
    const oldKeyStore = await this.getKeyRecord(keyId);
    if (!oldKeyStore) {
      throw new Error("Original key not found");
    }

    // Generate new split keys
    const newSplitKeys = SecureDataAccessService.generateSplitKeys(
      oldKeyStore.patientId,
      oldKeyStore.providerId,
    );

    // Create new key store record
    const newKeyStore: KeyStore = {
      keyId: newSplitKeys.keyId,
      patientId: oldKeyStore.patientId,
      providerId: oldKeyStore.providerId,
      systemKeyEncrypted: this.encryptSystemKey(newSplitKeys.systemKey),
      keyMetadata: {
        createdAt: newSplitKeys.createdAt,
        expiresAt: newSplitKeys.expiresAt,
        rotationCount: oldKeyStore.keyMetadata.rotationCount + 1,
        status: "active",
      },
    };

    // Store new key record
    await this.storeKeyRecord(newKeyStore);

    // Revoke old key
    await this.revokeKey(keyId, `Key rotation: ${reason}`);

    // Redistribute new keys
    const distributions: KeyDistribution[] = [];

    // Patient key redistribution
    const patientDistribution = await this.distributeKey(
      newSplitKeys.keyId,
      "patient",
      oldKeyStore.patientId,
      newSplitKeys.patientKey,
      "secure_email",
    );
    distributions.push(patientDistribution);

    // Provider key redistribution
    const providerDistribution = await this.distributeKey(
      newSplitKeys.keyId,
      "provider",
      oldKeyStore.providerId,
      newSplitKeys.providerKey,
      "secure_email",
    );
    distributions.push(providerDistribution);

    // Schedule next rotation
    await this.scheduleKeyRotation(
      newSplitKeys.keyId,
      this.KEY_ROTATION_INTERVAL,
    );

    // Log key rotation
    await SecureDataAccessService.createAuditLog({
      logId: crypto.randomBytes(16).toString("hex"),
      action: "modify",
      dataRecordId: keyId,
      userId: "SYSTEM",
      userRole: "system",
      timestamp: new Date().toISOString(),
      success: true,
      details: {
        action: "key_rotation",
        reason,
        oldKeyId: keyId,
        newKeyId: newSplitKeys.keyId,
        rotationCount: newKeyStore.keyMetadata.rotationCount,
      },
    });

    return {
      oldKeyId: keyId,
      newKeyStore,
      distributions,
    };
  }

  /**
   * Distribute key fragment to recipient
   */
  static async distributeKey(
    keyId: string,
    recipientType: "patient" | "provider",
    recipientId: string,
    keyFragment: string,
    deliveryMethod: KeyDistribution["deliveryMethod"],
  ): Promise<KeyDistribution> {
    const distributionId = crypto.randomBytes(16).toString("hex");
    const timestamp = new Date().toISOString();

    const distribution: KeyDistribution = {
      distributionId,
      keyId,
      recipientType,
      recipientId,
      keyFragment: this.encryptKeyFragment(keyFragment, recipientId),
      deliveryMethod,
      distributedAt: timestamp,
      acknowledged: false,
    };

    // Store distribution record
    await this.storeDistributionRecord(distribution);

    // Send key fragment based on delivery method
    switch (deliveryMethod) {
      case "secure_email":
        await this.sendSecureEmail(distribution);
        break;
      case "sms":
        await this.sendSecureSMS(distribution);
        break;
      case "qr_code":
        await this.generateAndStoreQRCode(distribution);
        break;
      case "hardware_token":
        await this.programHardwareToken(distribution);
        break;
    }

    return distribution;
  }

  /**
   * Generate QR code for key fragment
   */
  static generateQRCode(
    keyFragment: string,
    recipientType: string,
    recipientId: string,
  ): string {
    const qrData = {
      keyFragment,
      recipientType,
      recipientId,
      timestamp: new Date().toISOString(),
      version: "1.0",
    };

    // In a real implementation, you would use a QR code library
    const qrString = Buffer.from(JSON.stringify(qrData)).toString("base64");
    return `QR:${qrString}`;
  }

  /**
   * Encrypt system key for storage
   */
  private static encryptSystemKey(systemKey: string): string {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(this.MASTER_SYSTEM_KEY, "salt", 32);
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, key, iv);

    let encrypted = cipher.update(systemKey, "utf8", "hex");
    encrypted += cipher.final("hex");

    const authTag = cipher.getAuthTag();

    return iv.toString("hex") + ":" + authTag.toString("hex") + ":" + encrypted;
  }

  /**
   * Decrypt system key from storage
   */
  private static decryptSystemKey(encryptedSystemKey: string): string {
    const algorithm = "aes-256-gcm";
    const key = crypto.scryptSync(this.MASTER_SYSTEM_KEY, "salt", 32);

    const parts = encryptedSystemKey.split(":");
    const iv = Buffer.from(parts[0], "hex");
    const authTag = Buffer.from(parts[1], "hex");
    const encrypted = parts[2];

    const decipher = crypto.createDecipherGCM(algorithm, key, iv);
    decipher.setAuthTag(authTag);

    let decrypted = decipher.update(encrypted, "hex", "utf8");
    decrypted += decipher.final("utf8");

    return decrypted;
  }

  /**
   * Encrypt key fragment for distribution
   */
  private static encryptKeyFragment(
    keyFragment: string,
    recipientId: string,
  ): string {
    const derivedKey = crypto.scryptSync(
      recipientId + this.MASTER_SYSTEM_KEY,
      "salt",
      32,
    );
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv("aes-256-cbc", derivedKey, iv);

    let encrypted = cipher.update(keyFragment, "utf8", "hex");
    encrypted += cipher.final("hex");

    return iv.toString("hex") + ":" + encrypted;
  }

  /**
   * Start automatic key rotation scheduler
   */
  private static startKeyRotationScheduler(): void {
    // Check for scheduled rotations every hour
    setInterval(
      async () => {
        try {
          await this.processScheduledRotations();
        } catch (error) {
          console.error("Error processing scheduled key rotations:", error);
        }
      },
      60 * 60 * 1000,
    ); // 1 hour
  }

  /**
   * Process scheduled key rotations
   */
  private static async processScheduledRotations(): Promise<void> {
    const now = new Date();
    const scheduledRotations = await this.getScheduledRotations(now);

    for (const rotation of scheduledRotations) {
      if (rotation.autoRotate) {
        try {
          await this.rotateKeys(rotation.keyId, rotation.rotationReason);
          await this.markRotationCompleted(rotation.scheduleId);
          console.log(`✅ Auto-rotated key: ${rotation.keyId}`);
        } catch (error) {
          console.error(
            `❌ Failed to auto-rotate key ${rotation.keyId}:`,
            error,
          );
        }
      } else {
        // Send notification for manual rotation
        await this.sendRotationNotification(rotation);
      }
    }
  }

  /**
   * Schedule key rotation
   */
  private static async scheduleKeyRotation(
    keyId: string,
    daysFromNow: number,
    autoRotate: boolean = true,
  ): Promise<void> {
    const scheduledDate = new Date();
    scheduledDate.setDate(scheduledDate.getDate() + daysFromNow);

    const schedule: KeyRotationSchedule = {
      scheduleId: crypto.randomBytes(16).toString("hex"),
      keyId,
      scheduledRotationDate: scheduledDate.toISOString(),
      rotationReason: "periodic",
      autoRotate,
      notificationsSent: [],
    };

    await this.storeRotationSchedule(schedule);
  }

  // Database operations using Neon
  private static async storeKeyRecord(keyStore: KeyStore): Promise<void> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    await NeonDatabaseService.storeKeyRecord(keyStore);
  }

  private static async getKeyRecord(keyId: string): Promise<KeyStore | null> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    return await NeonDatabaseService.getKeyRecord(keyId);
  }

  private static async storeDistributionRecord(
    distribution: KeyDistribution,
  ): Promise<void> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    await NeonDatabaseService.storeDistributionRecord(distribution);
  }

  private static async storeRotationSchedule(
    schedule: KeyRotationSchedule,
  ): Promise<void> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    await NeonDatabaseService.storeRotationSchedule(schedule);
  }

  private static async getScheduledRotations(
    date: Date,
  ): Promise<KeyRotationSchedule[]> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    return await NeonDatabaseService.getScheduledRotations(date);
  }

  private static async markKeyExpired(keyId: string): Promise<void> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    await NeonDatabaseService.markKeyExpired(keyId);
  }

  private static async updateKeyUsage(keyId: string): Promise<void> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    await NeonDatabaseService.updateKeyUsage(keyId);
  }

  private static async revokeKey(keyId: string, reason: string): Promise<void> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    await NeonDatabaseService.revokeKey(keyId, reason);
  }

  private static async markRotationCompleted(
    scheduleId: string,
  ): Promise<void> {
    const { NeonDatabaseService } = await import("./neonDatabase");
    await NeonDatabaseService.markRotationCompleted(scheduleId);
  }

  // Placeholder methods for communication
  private static async sendSecureEmail(
    distribution: KeyDistribution,
  ): Promise<void> {
    console.log(`Sending secure email to ${distribution.recipientId}`);
  }

  private static async sendSecureSMS(
    distribution: KeyDistribution,
  ): Promise<void> {
    console.log(`Sending secure SMS to ${distribution.recipientId}`);
  }

  private static async generateAndStoreQRCode(
    distribution: KeyDistribution,
  ): Promise<void> {
    console.log(`Generating QR code for ${distribution.recipientId}`);
  }

  private static async programHardwareToken(
    distribution: KeyDistribution,
  ): Promise<void> {
    console.log(`Programming hardware token for ${distribution.recipientId}`);
  }

  private static async sendRotationNotification(
    rotation: KeyRotationSchedule,
  ): Promise<void> {
    console.log(`Sending rotation notification for key: ${rotation.keyId}`);
  }
}
