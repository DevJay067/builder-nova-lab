import { createClient, SupabaseClient } from "@supabase/supabase-js";

/**
 * Supabase Database Service
 * Handles secure storage of user data, split keys, and medical record metadata
 */

export interface MedicalRecordMetadata {
  id: string;
  userId: string;
  cid: string; // IPFS Content Identifier
  originalName: string;
  mimeType: string;
  size: number;
  encryptedTitle?: string;
  encryptedDescription?: string;
  uploadTimestamp: string;
  lastAccessed?: string;
  checksum: string;
  encryptionMetadata: {
    iv: string;
    authTag: string;
    algorithm: string;
  };
  tags?: string[];
  isActive: boolean;
}

export interface DatabaseStats {
  totalUsers: number;
  totalRecords: number;
  totalStorageSize: number;
  lastActivity?: string;
}

export class SupabaseService {
  private static client: SupabaseClient | null = null;
  private static isInitialized = false;

  /**
   * Initialize Supabase client and create necessary tables
   */
  static async initialize(): Promise<void> {
    if (this.isInitialized) return;

    try {
      const supabaseUrl = process.env.SUPABASE_URL;
      const supabaseKey = process.env.SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseKey) {
        console.warn(
          "⚠️ Supabase credentials not found, database features will be limited",
        );
        this.isInitialized = true;
        return;
      }

      this.client = createClient(supabaseUrl, supabaseKey);
      console.log("✅ Supabase service initialized");

      // Create necessary tables
      await this.createTables();

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Failed to initialize Supabase service:", error);
      this.isInitialized = true; // Continue without Supabase
    }
  }

  /**
   * Create database tables using SQL
   */
  private static async createTables(): Promise<void> {
    if (!this.client) return;

    try {
      // Create split_key_users table
      await this.client.rpc("create_split_key_users_table", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS split_key_users (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            email VARCHAR(255) UNIQUE NOT NULL,
            username VARCHAR(100) UNIQUE NOT NULL,
            key_half TEXT NOT NULL,
            key_hash TEXT NOT NULL,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            last_login TIMESTAMP WITH TIME ZONE,
            is_active BOOLEAN DEFAULT TRUE,
            profile_data JSONB DEFAULT '{}'::jsonb
          );

          CREATE INDEX IF NOT EXISTS idx_split_key_users_email ON split_key_users(email);
          CREATE INDEX IF NOT EXISTS idx_split_key_users_username ON split_key_users(username);
          CREATE INDEX IF NOT EXISTS idx_split_key_users_active ON split_key_users(is_active);
        `,
      });

      // Create medical_records_metadata table
      await this.client.rpc("create_medical_records_table", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS medical_records_metadata (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID NOT NULL REFERENCES split_key_users(id) ON DELETE CASCADE,
            cid TEXT NOT NULL,
            original_name TEXT NOT NULL,
            mime_type VARCHAR(255) NOT NULL,
            file_size BIGINT NOT NULL,
            encrypted_title TEXT,
            encrypted_description TEXT,
            upload_timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
            last_accessed TIMESTAMP WITH TIME ZONE,
            checksum TEXT NOT NULL,
            encryption_metadata JSONB NOT NULL,
            tags TEXT[] DEFAULT ARRAY[]::TEXT[],
            is_active BOOLEAN DEFAULT TRUE
          );

          CREATE INDEX IF NOT EXISTS idx_medical_records_user_id ON medical_records_metadata(user_id);
          CREATE INDEX IF NOT EXISTS idx_medical_records_cid ON medical_records_metadata(cid);
          CREATE INDEX IF NOT EXISTS idx_medical_records_upload_time ON medical_records_metadata(upload_timestamp);
          CREATE INDEX IF NOT EXISTS idx_medical_records_active ON medical_records_metadata(is_active);
        `,
      });

      // Create access_logs table for security auditing
      await this.client.rpc("create_access_logs_table", {
        sql_query: `
          CREATE TABLE IF NOT EXISTS access_logs (
            id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
            user_id UUID REFERENCES split_key_users(id),
            action VARCHAR(100) NOT NULL,
            resource_type VARCHAR(50) NOT NULL,
            resource_id UUID,
            ip_address INET,
            user_agent TEXT,
            success BOOLEAN NOT NULL DEFAULT TRUE,
            error_message TEXT,
            created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
          );

          CREATE INDEX IF NOT EXISTS idx_access_logs_user_id ON access_logs(user_id);
          CREATE INDEX IF NOT EXISTS idx_access_logs_action ON access_logs(action);
          CREATE INDEX IF NOT EXISTS idx_access_logs_created_at ON access_logs(created_at);
        `,
      });

      console.log("✅ Database tables created successfully");
    } catch (error) {
      console.warn(
        "⚠️ Table creation may have failed, they might already exist:",
        error,
      );
    }
  }

  /**
   * Store medical record metadata
   */
  static async storeMedicalRecordMetadata(
    metadata: Omit<MedicalRecordMetadata, "id">,
  ): Promise<{ success: boolean; recordId?: string; error?: string }> {
    if (!this.client) {
      return { success: false, error: "Supabase not initialized" };
    }

    try {
      const { data, error } = await this.client
        .from("medical_records_metadata")
        .insert([
          {
            user_id: metadata.userId,
            cid: metadata.cid,
            original_name: metadata.originalName,
            mime_type: metadata.mimeType,
            file_size: metadata.size,
            encrypted_title: metadata.encryptedTitle,
            encrypted_description: metadata.encryptedDescription,
            upload_timestamp: metadata.uploadTimestamp,
            checksum: metadata.checksum,
            encryption_metadata: metadata.encryptionMetadata,
            tags: metadata.tags || [],
            is_active: metadata.isActive,
          },
        ])
        .select("id")
        .single();

      if (error) {
        console.error("❌ Failed to store medical record metadata:", error);
        return { success: false, error: error.message };
      }

      // Log the access
      await this.logAccess(
        metadata.userId,
        "store_record",
        "medical_record",
        data.id,
        null,
        true,
      );

      return { success: true, recordId: data.id };
    } catch (error) {
      console.error("❌ Error storing medical record metadata:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Storage failed",
      };
    }
  }

  /**
   * Get medical records for a user
   */
  static async getUserMedicalRecords(
    userId: string,
    includeInactive: boolean = false,
  ): Promise<{
    success: boolean;
    records?: MedicalRecordMetadata[];
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "Supabase not initialized" };
    }

    try {
      let query = this.client
        .from("medical_records_metadata")
        .select("*")
        .eq("user_id", userId)
        .order("upload_timestamp", { ascending: false });

      if (!includeInactive) {
        query = query.eq("is_active", true);
      }

      const { data, error } = await query;

      if (error) {
        console.error("❌ Failed to fetch medical records:", error);
        return { success: false, error: error.message };
      }

      const records: MedicalRecordMetadata[] = data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        cid: row.cid,
        originalName: row.original_name,
        mimeType: row.mime_type,
        size: row.file_size,
        encryptedTitle: row.encrypted_title,
        encryptedDescription: row.encrypted_description,
        uploadTimestamp: row.upload_timestamp,
        lastAccessed: row.last_accessed,
        checksum: row.checksum,
        encryptionMetadata: row.encryption_metadata,
        tags: row.tags || [],
        isActive: row.is_active,
      }));

      // Log the access
      await this.logAccess(
        userId,
        "get_records",
        "medical_record",
        null,
        null,
        true,
      );

      return { success: true, records };
    } catch (error) {
      console.error("❌ Error fetching medical records:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Fetch failed",
      };
    }
  }

  /**
   * Get specific medical record metadata
   */
  static async getMedicalRecordMetadata(
    recordId: string,
    userId: string,
  ): Promise<{
    success: boolean;
    record?: MedicalRecordMetadata;
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "Supabase not initialized" };
    }

    try {
      const { data, error } = await this.client
        .from("medical_records_metadata")
        .select("*")
        .eq("id", recordId)
        .eq("user_id", userId)
        .eq("is_active", true)
        .single();

      if (error) {
        console.error("❌ Failed to fetch medical record:", error);
        return { success: false, error: error.message };
      }

      if (!data) {
        return { success: false, error: "Record not found or access denied" };
      }

      const record: MedicalRecordMetadata = {
        id: data.id,
        userId: data.user_id,
        cid: data.cid,
        originalName: data.original_name,
        mimeType: data.mime_type,
        size: data.file_size,
        encryptedTitle: data.encrypted_title,
        encryptedDescription: data.encrypted_description,
        uploadTimestamp: data.upload_timestamp,
        lastAccessed: data.last_accessed,
        checksum: data.checksum,
        encryptionMetadata: data.encryption_metadata,
        tags: data.tags || [],
        isActive: data.is_active,
      };

      // Update last accessed timestamp
      await this.updateLastAccessed(recordId);

      // Log the access
      await this.logAccess(
        userId,
        "get_record",
        "medical_record",
        recordId,
        null,
        true,
      );

      return { success: true, record };
    } catch (error) {
      console.error("❌ Error fetching medical record:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Fetch failed",
      };
    }
  }

  /**
   * Update last accessed timestamp for a record
   */
  static async updateLastAccessed(recordId: string): Promise<void> {
    if (!this.client) return;

    try {
      await this.client
        .from("medical_records_metadata")
        .update({ last_accessed: new Date().toISOString() })
        .eq("id", recordId);
    } catch (error) {
      console.error("❌ Error updating last accessed:", error);
    }
  }

  /**
   * Delete (deactivate) medical record
   */
  static async deleteMedicalRecord(
    recordId: string,
    userId: string,
  ): Promise<{ success: boolean; error?: string }> {
    if (!this.client) {
      return { success: false, error: "Supabase not initialized" };
    }

    try {
      const { error } = await this.client
        .from("medical_records_metadata")
        .update({ is_active: false })
        .eq("id", recordId)
        .eq("user_id", userId);

      if (error) {
        console.error("❌ Failed to delete medical record:", error);
        return { success: false, error: error.message };
      }

      // Log the access
      await this.logAccess(
        userId,
        "delete_record",
        "medical_record",
        recordId,
        null,
        true,
      );

      return { success: true };
    } catch (error) {
      console.error("❌ Error deleting medical record:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Delete failed",
      };
    }
  }

  /**
   * Search medical records by tags or name
   */
  static async searchMedicalRecords(
    userId: string,
    searchTerm: string,
  ): Promise<{
    success: boolean;
    records?: MedicalRecordMetadata[];
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "Supabase not initialized" };
    }

    try {
      const { data, error } = await this.client
        .from("medical_records_metadata")
        .select("*")
        .eq("user_id", userId)
        .eq("is_active", true)
        .or(`original_name.ilike.%${searchTerm}%,tags.cs.{${searchTerm}}`)
        .order("upload_timestamp", { ascending: false });

      if (error) {
        console.error("❌ Failed to search medical records:", error);
        return { success: false, error: error.message };
      }

      const records: MedicalRecordMetadata[] = data.map((row) => ({
        id: row.id,
        userId: row.user_id,
        cid: row.cid,
        originalName: row.original_name,
        mimeType: row.mime_type,
        size: row.file_size,
        encryptedTitle: row.encrypted_title,
        encryptedDescription: row.encrypted_description,
        uploadTimestamp: row.upload_timestamp,
        lastAccessed: row.last_accessed,
        checksum: row.checksum,
        encryptionMetadata: row.encryption_metadata,
        tags: row.tags || [],
        isActive: row.is_active,
      }));

      // Log the access
      await this.logAccess(
        userId,
        "search_records",
        "medical_record",
        null,
        null,
        true,
      );

      return { success: true, records };
    } catch (error) {
      console.error("❌ Error searching medical records:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Search failed",
      };
    }
  }

  /**
   * Log access for security auditing
   */
  static async logAccess(
    userId: string,
    action: string,
    resourceType: string,
    resourceId?: string | null,
    ipAddress?: string | null,
    success: boolean = true,
    errorMessage?: string,
  ): Promise<void> {
    if (!this.client) return;

    try {
      await this.client.from("access_logs").insert([
        {
          user_id: userId,
          action,
          resource_type: resourceType,
          resource_id: resourceId,
          ip_address: ipAddress,
          success,
          error_message: errorMessage,
        },
      ]);
    } catch (error) {
      console.error("❌ Error logging access:", error);
    }
  }

  /**
   * Get database statistics
   */
  static async getDatabaseStats(): Promise<{
    success: boolean;
    stats?: DatabaseStats;
    error?: string;
  }> {
    if (!this.client) {
      return { success: false, error: "Supabase not initialized" };
    }

    try {
      // Get user count
      const { count: userCount } = await this.client
        .from("split_key_users")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get record count
      const { count: recordCount } = await this.client
        .from("medical_records_metadata")
        .select("*", { count: "exact", head: true })
        .eq("is_active", true);

      // Get total storage size
      const { data: sizeData } = await this.client
        .from("medical_records_metadata")
        .select("file_size")
        .eq("is_active", true);

      const totalSize =
        sizeData?.reduce((sum, record) => sum + (record.file_size || 0), 0) ||
        0;

      // Get last activity
      const { data: lastActivity } = await this.client
        .from("access_logs")
        .select("created_at")
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      const stats: DatabaseStats = {
        totalUsers: userCount || 0,
        totalRecords: recordCount || 0,
        totalStorageSize: totalSize,
        lastActivity: lastActivity?.created_at,
      };

      return { success: true, stats };
    } catch (error) {
      console.error("❌ Error getting database stats:", error);
      return {
        success: false,
        error:
          error instanceof Error ? error.message : "Stats retrieval failed",
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
        "User management",
        "Medical record metadata",
        "Access logging",
        "Search functionality",
        "Database statistics",
      ],
    };
  }
}
