import React from "react";

/**
 * Universal Health Data Storage Service
 * Ensures ALL health data is stored in Supabase cloud storage vault
 */

export interface HealthDataRecord {
  type: string;
  title: string;
  description?: string;
  data: any;
  metadata?: any;
  sessionToken?: string;
}

export interface StorageResponse {
  success: boolean;
  recordId?: string;
  vaultPath?: string;
  message?: string;
  storage?: {
    type: string;
    path: string;
    secure: boolean;
    encrypted: boolean;
    size: number;
  };
  error?: string;
}

export class HealthDataStorage {
  private static readonly STORAGE_ENDPOINT = "/api/supabase/health-records";
  private static readonly RETRIEVAL_ENDPOINT = "/api/supabase/health-records";

  /**
   * Store health data in Supabase cloud storage vault
   */
  static async storeHealthData(
    data: HealthDataRecord,
  ): Promise<StorageResponse> {
    try {
      console.log("🏥 Storing health data in Supabase cloud storage vault...");

      const response = await fetch(this.STORAGE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...(data.sessionToken && {
            Authorization: `Bearer ${data.sessionToken}`,
            "x-session-token": data.sessionToken,
          }),
        },
        body: JSON.stringify({
          type: data.type,
          title: data.title,
          description: data.description,
          data: data.data,
          metadata: {
            ...data.metadata,
            cloudStorage: true,
            storageTimestamp: new Date().toISOString(),
          },
          sessionToken: data.sessionToken,
        }),
      });

      const result = await response.json();

      if (result.success) {
        console.log(
          `✅ Health data stored in cloud vault: ${result.vaultPath}`,
        );
        return result;
      } else {
        console.error("❌ Failed to store health data:", result.message);
        return result;
      }
    } catch (error) {
      console.error("❌ Error storing health data:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Storage failed",
      };
    }
  }

  /**
   * Retrieve health data from Supabase cloud storage vault
   */
  static async getHealthData(sessionToken?: string): Promise<{
    success: boolean;
    records?: any[];
    totalRecords?: number;
    cloudStorage?: any;
    message?: string;
    error?: string;
  }> {
    try {
      console.log(
        "🔍 Retrieving health data from Supabase cloud storage vault...",
      );

      const response = await fetch(this.RETRIEVAL_ENDPOINT, {
        headers: {
          "Content-Type": "application/json",
          ...(sessionToken && {
            Authorization: `Bearer ${sessionToken}`,
            "x-session-token": sessionToken,
          }),
        },
      });

      const result = await response.json();

      if (result.success) {
        console.log(
          `✅ Retrieved ${result.totalRecords || 0} records from cloud vault`,
        );
        return result;
      } else {
        console.error("❌ Failed to retrieve health data:", result.message);
        return result;
      }
    } catch (error) {
      console.error("❌ Error retrieving health data:", error);
      return {
        success: false,
        message: error instanceof Error ? error.message : "Retrieval failed",
      };
    }
  }

  /**
   * Store any type of health data (vital signs, medications, appointments, etc.)
   */
  static async storeVitalSigns(
    data: {
      bloodPressure?: { systolic: number; diastolic: number };
      heartRate?: number;
      temperature?: number;
      weight?: number;
      height?: number;
      oxygenSaturation?: number;
      glucoseLevel?: number;
      [key: string]: any;
    },
    sessionToken?: string,
  ): Promise<StorageResponse> {
    return this.storeHealthData({
      type: "vital-signs",
      title: `Vital Signs - ${new Date().toLocaleDateString()}`,
      description: "Recorded vital signs and biometric data",
      data,
      metadata: {
        category: "vital-signs",
        recordedAt: new Date().toISOString(),
      },
      sessionToken,
    });
  }

  /**
   * Store medication data
   */
  static async storeMedication(
    data: {
      name: string;
      dosage: string;
      frequency: string;
      startDate: string;
      endDate?: string;
      prescribedBy?: string;
      notes?: string;
      [key: string]: any;
    },
    sessionToken?: string,
  ): Promise<StorageResponse> {
    return this.storeHealthData({
      type: "medication",
      title: `Medication: ${data.name}`,
      description: `${data.dosage} - ${data.frequency}`,
      data,
      metadata: {
        category: "medication",
        medicationName: data.name,
        recordedAt: new Date().toISOString(),
      },
      sessionToken,
    });
  }

  /**
   * Store appointment data
   */
  static async storeAppointment(
    data: {
      date: string;
      time: string;
      doctor: string;
      specialty?: string;
      reason: string;
      notes?: string;
      [key: string]: any;
    },
    sessionToken?: string,
  ): Promise<StorageResponse> {
    return this.storeHealthData({
      type: "appointment",
      title: `Appointment: ${data.doctor}`,
      description: `${data.date} - ${data.reason}`,
      data,
      metadata: {
        category: "appointment",
        appointmentDate: data.date,
        doctor: data.doctor,
        recordedAt: new Date().toISOString(),
      },
      sessionToken,
    });
  }

  /**
   * Store lab results
   */
  static async storeLabResults(
    data: {
      testName: string;
      results: any;
      date: string;
      orderingPhysician?: string;
      lab?: string;
      notes?: string;
      [key: string]: any;
    },
    sessionToken?: string,
  ): Promise<StorageResponse> {
    return this.storeHealthData({
      type: "lab-results",
      title: `Lab Results: ${data.testName}`,
      description: `Test results from ${data.date}`,
      data,
      metadata: {
        category: "lab-results",
        testName: data.testName,
        testDate: data.date,
        recordedAt: new Date().toISOString(),
      },
      sessionToken,
    });
  }

  /**
   * Store general health record
   */
  static async storeGeneralRecord(
    data: {
      title: string;
      description?: string;
      category: string;
      data: any;
      [key: string]: any;
    },
    sessionToken?: string,
  ): Promise<StorageResponse> {
    return this.storeHealthData({
      type: data.category || "general",
      title: data.title,
      description: data.description,
      data: data.data,
      metadata: {
        category: data.category,
        recordedAt: new Date().toISOString(),
      },
      sessionToken,
    });
  }
}

export default HealthDataStorage;
