import { createClient, SupabaseClient } from "@supabase/supabase-js";
import crypto from "crypto";

/**
 * Supabase Service for Healthcare Data Management
 * Replaces Neon database with Supabase PostgreSQL + Storage
 */

export interface HealthRecord {
  id: string;
  patient_id: string;
  record_type: string;
  title: string;
  description?: string;
  doctor?: string;
  date: string;
  metadata?: any;
  secure_record_id?: string;
  created_at?: string;
  updated_at?: string;
  storage_path?: string; // Path to file in Supabase Storage
}

export interface SecureDataRecord {
  id: string;
  patient_id: string;
  data_type: string;
  encrypted_data: string;
  key_id: string;
  blockchain_hash: string;
  access_level: string;
  created_by: string;
  created_at: string;
  updated_at: string;
  access_count: number;
  last_accessed?: string;
  checksum: string;
  storage_vault_path?: string; // Path in Supabase Storage vault
}

export interface User {
  id: string;
  username: string;
  email?: string;
  user_hash: string;
  first_name?: string;
  last_name?: string;
  created_at: string;
  last_login?: string;
  secure_system_activated: boolean;
  split_key_system_active: boolean;
}

class SupabaseService {
  private static client: SupabaseClient | null = null;
  private static isInitialized = false;

  /**
   * Initialize Supabase client
   */
  static initialize(): SupabaseClient {
    if (!this.client) {
      const supabaseUrl = process.env.SUPABASE_URL || "";
      const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

      if (!supabaseUrl || !supabaseKey) {
        console.warn(
          "⚠️ Supabase credentials not configured, using mock client",
        );
        // Return a mock client for development
        return this.createMockClient();
      }

      this.client = createClient(supabaseUrl, supabaseKey);
      console.log("✅ Supabase client initialized");
    }

    return this.client;
  }

  // In-memory storage for mock client
  public static mockStorage: { [table: string]: any[] } = {
    health_records: [],
    secure_data_records: [],
    users: [],
  };
  private static mockStorageFiles: { [path: string]: any } = {};

  /**
   * Create mock client for development when credentials are not available
   */
  private static createMockClient(): any {
    const createMockQuery = (tableName: string) => {
      let currentData = [...(this.mockStorage[tableName] || [])];
      let filters: any = {};
      let orderBy: any = null;
      let limitValue: number | null = null;

      const mockQuery = {
        select: (columns?: string) => {
          // Return the same query object for chaining
          return mockQuery;
        },

        insert: (data: any) => {
          const recordsToInsert = Array.isArray(data) ? data : [data];
          const insertedRecords: any[] = [];

          recordsToInsert.forEach((record) => {
            const newRecord = {
              ...record,
              id: record.id || crypto.randomBytes(16).toString("hex"),
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
            };
            this.mockStorage[tableName].push(newRecord);
            insertedRecords.push(newRecord);
          });

          // Return a chainable object that supports .select() and .single()
          const insertResult = {
            data: insertedRecords,
            error: null,

            select: (columns?: string) => ({
              data: insertedRecords,
              error: null,
              single: () => ({
                data: insertedRecords[0] || null,
                error: insertedRecords.length === 0 ? { message: 'No data found' } : null,
                then: (callback: any) => callback({
                  data: insertedRecords[0] || null,
                  error: insertedRecords.length === 0 ? { message: 'No data found' } : null
                })
              }),
              then: (callback: any) => callback({ data: insertedRecords, error: null })
            }),

            then: (callback: any) => callback({ data: insertedRecords, error: null }),
          };

          return insertResult;
        },

        eq: (column: string, value: any) => {
          filters[column] = value;
          return mockQuery;
        },

        order: (column: string, options?: any) => {
          orderBy = { column, ascending: options?.ascending !== false };
          return mockQuery;
        },

        limit: (count: number) => {
          limitValue = count;
          return mockQuery;
        },

        single: () => {
          let results = this.mockStorage[tableName] || [];

          // Apply filters
          Object.keys(filters).forEach((key) => {
            results = results.filter((record) => record[key] === filters[key]);
          });

          const singleResult = results[0] || null;
          return {
            data: singleResult,
            error: singleResult ? null : { message: "No data found" },
            then: (callback: any) =>
              callback({
                data: singleResult,
                error: singleResult ? null : { message: "No data found" },
              }),
          };
        },

        then: (callback: any) => {
          let results = this.mockStorage[tableName] || [];

          // Apply filters
          Object.keys(filters).forEach((key) => {
            results = results.filter((record) => record[key] === filters[key]);
          });

          // Apply ordering
          if (orderBy) {
            results.sort((a, b) => {
              const aVal = a[orderBy.column];
              const bVal = b[orderBy.column];
              if (orderBy.ascending) {
                return aVal > bVal ? 1 : -1;
              } else {
                return aVal < bVal ? 1 : -1;
              }
            });
          }

          // Apply limit
          if (limitValue) {
            results = results.slice(0, limitValue);
          }

          return callback({ data: results, error: null });
        },

        // Direct properties for immediate access
        data: currentData,
        error: null,
      };

      return mockQuery;
    };

    return {
      from: (tableName: string) => createMockQuery(tableName),
      storage: {
        from: (bucketName: string) => ({
          upload: (path: string, file: any) => {
            this.mockStorageFiles[path] = file;
            return Promise.resolve({
              data: { path, id: crypto.randomBytes(16).toString("hex") },
              error: null,
            });
          },
          download: (path: string) => {
            const file = this.mockStorageFiles[path];
            return Promise.resolve({
              data: file ? { toString: () => JSON.stringify(file) } : null,
              error: file ? null : { message: "File not found" },
            });
          },
          list: () => {
            const files = Object.keys(this.mockStorageFiles).map((path) => ({
              name: path.split("/").pop(),
              id: crypto.randomBytes(16).toString("hex"),
              created_at: new Date().toISOString(),
            }));
            return Promise.resolve({ data: files, error: null });
          },
        }),
        createBucket: () => Promise.resolve({ data: null, error: null }),
        getBucket: () =>
          Promise.resolve({ data: { name: "mock-bucket" }, error: null }),
      },
      auth: {
        signUp: () => ({ data: { user: null }, error: null }),
        signInWithPassword: () => ({ data: { user: null }, error: null }),
        signOut: () => ({ error: null }),
        getUser: () => ({ data: { user: null }, error: null }),
      },
    };
  }

  /**
   * Initialize database tables
   */
  static async initializeDatabase(): Promise<void> {
    const client = this.initialize();

    try {
      console.log("🏥 Setting up Supabase database tables...");

      // Check if we're using mock client
      if (!process.env.SUPABASE_URL) {
        console.log("⚠️ Supabase not configured, skipping table creation");
        return;
      }

      // The tables will be created via Supabase Dashboard or migration scripts
      // For now, we'll just verify the connection
      const { data, error } = await client
        .from("health_records")
        .select("id")
        .limit(1);

      if (error && error.code === "PGRST116") {
        console.log(
          "⚠️ Tables not yet created in Supabase. Please run the database migration.",
        );
      } else {
        console.log("✅ Supabase database connection verified");
      }

      this.isInitialized = true;
    } catch (error) {
      console.error("❌ Error initializing Supabase database:", error);
      console.log("⚠️ Continuing with mock client for development");
    }
  }

  /**
   * Create storage buckets for health data vault
   */
  static async initializeStorage(): Promise<void> {
    const client = this.initialize();

    try {
      console.log("🗄️ Setting up Supabase Storage buckets...");

      // Create health-vault bucket for secure health data
      const { data: bucketData, error: bucketError } =
        await client.storage.createBucket("health-vault", {
          public: false, // Private bucket for security
          allowedMimeTypes: [
            "application/json",
            "text/plain",
            "application/pdf",
            "image/*",
          ],
          fileSizeLimit: 50 * 1024 * 1024, // 50MB limit
        });

      if (bucketError && !bucketError.message.includes("already exists")) {
        console.error("❌ Error creating health-vault bucket:", bucketError);
      } else {
        console.log("✅ Health vault storage bucket ready");
      }

      // Create medical-records bucket for regular medical documents
      const { data: recordsBucket, error: recordsError } =
        await client.storage.createBucket("medical-records", {
          public: false,
          allowedMimeTypes: ["application/pdf", "image/*", "text/*"],
          fileSizeLimit: 100 * 1024 * 1024, // 100MB limit
        });

      if (recordsError && !recordsError.message.includes("already exists")) {
        console.error(
          "❌ Error creating medical-records bucket:",
          recordsError,
        );
      } else {
        console.log("✅ Medical records storage bucket ready");
      }
    } catch (error) {
      console.error("❌ Error initializing Supabase storage:", error);
    }
  }

  /**
   * Store health record in database and optionally in storage vault
   */
  static async storeHealthRecord(
    record: Omit<HealthRecord, "id" | "created_at" | "updated_at">,
  ): Promise<{ success: boolean; recordId?: string; error?: string }> {
    const client = this.initialize();

    try {
      const recordId = crypto.randomBytes(16).toString("hex");
      const now = new Date().toISOString();

      const healthRecord: HealthRecord = {
        ...record,
        id: recordId,
        created_at: now,
        updated_at: now,
      };

      const { data, error } = await client
        .from("health_records")
        .insert([healthRecord])
        .select();

      if (error) {
        console.error("❌ Error storing health record:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Health record stored: ${recordId}`, {
        type: record.record_type,
        title: record.title,
        totalRecords: this.mockStorage?.health_records?.length || "unknown",
      });
      return { success: true, recordId };
    } catch (error) {
      console.error("❌ Error storing health record:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Store health data in secure storage vault
   */
  static async storeInVault(
    patientId: string,
    data: any,
    filename?: string,
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    const client = this.initialize();

    try {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const vaultPath = `${patientId}/${timestamp}_${filename || "health-data.json"}`;

      const dataBlob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });

      const { data: uploadData, error } = await client.storage
        .from("health-vault")
        .upload(vaultPath, dataBlob, {
          cacheControl: "3600",
          upsert: false,
        });

      if (error) {
        console.error("❌ Error storing in vault:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Data stored in vault: ${vaultPath}`);
      return { success: true, path: vaultPath };
    } catch (error) {
      console.error("❌ Error storing in vault:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Retrieve health data from storage vault
   */
  static async retrieveFromVault(
    path: string,
  ): Promise<{ success: boolean; data?: any; error?: string }> {
    const client = this.initialize();

    try {
      const { data, error } = await client.storage
        .from("health-vault")
        .download(path);

      if (error) {
        console.error("❌ Error retrieving from vault:", error);
        return { success: false, error: error.message };
      }

      const text = await data.text();
      const parsedData = JSON.parse(text);

      console.log(`✅ Data retrieved from vault: ${path}`);
      return { success: true, data: parsedData };
    } catch (error) {
      console.error("❌ Error retrieving from vault:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get health records for a patient
   */
  static async getHealthRecords(
    patientId: string,
  ): Promise<{ success: boolean; records?: HealthRecord[]; error?: string }> {
    const client = this.initialize();

    try {
      const { data, error } = await client
        .from("health_records")
        .select("*")
        .eq("patient_id", patientId)
        .order("date", { ascending: false });

      if (error) {
        console.error("❌ Error retrieving health records:", error);
        return { success: false, error: error.message };
      }

      console.log(
        `✅ Retrieved ${data?.length || 0} health records for patient: ${patientId}`,
        {
          totalInStorage: this.mockStorage?.health_records?.length || "unknown",
          records:
            data?.map((r) => ({
              id: r.id,
              type: r.record_type,
              title: r.title,
            })) || [],
        },
      );
      return { success: true, records: data || [] };
    } catch (error) {
      console.error("❌ Error retrieving health records:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Store secure data record with vault storage
   */
  static async storeSecureRecord(
    record: Omit<SecureDataRecord, "id" | "created_at" | "updated_at">,
  ): Promise<{ success: boolean; recordId?: string; error?: string }> {
    const client = this.initialize();

    try {
      const recordId = crypto.randomBytes(16).toString("hex");
      const now = new Date().toISOString();

      // Store encrypted data in vault
      const vaultResult = await this.storeInVault(
        record.patient_id,
        {
          encryptedData: record.encrypted_data,
          metadata: { keyId: record.key_id, checksum: record.checksum },
        },
        `secure-record-${recordId}.json`,
      );

      const secureRecord: SecureDataRecord = {
        ...record,
        id: recordId,
        created_at: now,
        updated_at: now,
        storage_vault_path: vaultResult.path,
      };

      const { data, error } = await client
        .from("secure_data_records")
        .insert([secureRecord])
        .select();

      if (error) {
        console.error("❌ Error storing secure record:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ Secure record stored: ${recordId}`);
      return { success: true, recordId };
    } catch (error) {
      console.error("❌ Error storing secure record:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Authenticate user with Supabase Auth
   */
  static async authenticateUser(
    email: string,
    password: string,
  ): Promise<{ success: boolean; user?: any; session?: any; error?: string }> {
    const client = this.initialize();

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error("❌ Authentication failed:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ User authenticated: ${email}`);
      return { success: true, user: data.user, session: data.session };
    } catch (error) {
      console.error("❌ Authentication error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Register new user with Supabase Auth
   */
  static async registerUser(
    email: string,
    password: string,
    metadata?: any,
  ): Promise<{ success: boolean; user?: any; error?: string }> {
    const client = this.initialize();

    try {
      const { data, error } = await client.auth.signUp({
        email,
        password,
        options: {
          data: metadata,
        },
      });

      if (error) {
        console.error("❌ Registration failed:", error);
        return { success: false, error: error.message };
      }

      console.log(`✅ User registered: ${email}`);
      return { success: true, user: data.user };
    } catch (error) {
      console.error("❌ Registration error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get current authenticated user
   */
  static async getCurrentUser(): Promise<{
    success: boolean;
    user?: any;
    error?: string;
  }> {
    const client = this.initialize();

    try {
      const { data, error } = await client.auth.getUser();

      if (error) {
        return { success: false, error: error.message };
      }

      return { success: true, user: data.user };
    } catch (error) {
      console.error("❌ Error getting current user:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Sign out user
   */
  static async signOut(): Promise<{ success: boolean; error?: string }> {
    const client = this.initialize();

    try {
      const { error } = await client.auth.signOut();

      if (error) {
        console.error("❌ Sign out failed:", error);
        return { success: false, error: error.message };
      }

      console.log("✅ User signed out");
      return { success: true };
    } catch (error) {
      console.error("❌ Sign out error:", error);
      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      };
    }
  }

  /**
   * Get database and storage statistics
   */
  static async getStatistics(): Promise<any> {
    const client = this.initialize();

    try {
      // Get counts from various tables
      const [healthRecords, secureRecords, vaultFiles] = await Promise.all([
        client
          .from("health_records")
          .select("id", { count: "exact", head: true }),
        client
          .from("secure_data_records")
          .select("id", { count: "exact", head: true }),
        client.storage.from("health-vault").list(),
      ]);

      return {
        healthRecords: healthRecords.count || 0,
        secureRecords: secureRecords.count || 0,
        vaultFiles: vaultFiles.data?.length || 0,
        lastUpdated: new Date().toISOString(),
      };
    } catch (error) {
      console.error("❌ Error getting statistics:", error);
      return {
        healthRecords: 0,
        secureRecords: 0,
        vaultFiles: 0,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  /**
   * Test database connectivity
   */
  static async testConnection(): Promise<boolean> {
    const client = this.initialize();

    try {
      // Try a simple query to test connection
      const { error } = await client
        .from("health_records")
        .select("id")
        .limit(1);
      return !error;
    } catch (error) {
      console.error("Database connection test failed:", error);
      return false;
    }
  }

  /**
   * Get storage usage information
   */
  static async getStorageUsage(): Promise<{
    vaultUsage: number;
    recordsUsage: number;
    totalFiles: number;
  }> {
    const client = this.initialize();

    try {
      const [vaultFiles, recordFiles] = await Promise.all([
        client.storage.from("health-vault").list(),
        client.storage.from("medical-records").list(),
      ]);

      const vaultUsage =
        vaultFiles.data?.reduce(
          (total, file) => total + (file.metadata?.size || 0),
          0,
        ) || 0;
      const recordsUsage =
        recordFiles.data?.reduce(
          (total, file) => total + (file.metadata?.size || 0),
          0,
        ) || 0;
      const totalFiles =
        (vaultFiles.data?.length || 0) + (recordFiles.data?.length || 0);

      return { vaultUsage, recordsUsage, totalFiles };
    } catch (error) {
      console.error("❌ Error getting storage usage:", error);
      return { vaultUsage: 0, recordsUsage: 0, totalFiles: 0 };
    }
  }
}

export { SupabaseService };
export type { HealthRecord, SecureDataRecord, User };
