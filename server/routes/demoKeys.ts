import { RequestHandler } from "express";
import { KeyManagementService } from "../services/keyManagement";

/**
 * Demo keys management for testing secure data storage
 */

/**
 * Generate demo keys for testing
 */
export const generateDemoKeys: RequestHandler = async (req, res) => {
  try {
    const patientId = "default-patient";
    const providerId = "demo-provider-001";

    console.log(`🔑 Generating demo keys for patient: ${patientId}`);

    // Generate split keys for the demo patient
    const result = await KeyManagementService.generateAndDistributeKeys(
      patientId,
      providerId,
      "patient@example.com",
      "provider@hospital.com"
    );

    res.json({
      success: true,
      message: "Demo keys generated successfully",
      keyId: result.keyStore.keyId,
      patientKey: result.qrCodes.patient,
      providerKey: result.qrCodes.provider,
      distributions: result.distributions.map(d => ({
        distributionId: d.distributionId,
        recipientType: d.recipientType,
        deliveryMethod: d.deliveryMethod,
        distributedAt: d.distributedAt
      })),
      instructions: {
        usage: "Use these keys in the secure data storage endpoints",
        patientKeyHeader: "x-patient-key",
        providerKeyHeader: "x-provider-key",
        keyId: result.keyStore.keyId
      }
    });

  } catch (error) {
    console.error("❌ Error generating demo keys:", error);
    res.status(500).json({
      success: false,
      error: "Failed to generate demo keys: " + error.message
    });
  }
};

/**
 * Get demo keys information
 */
export const getDemoKeysInfo: RequestHandler = (req, res) => {
  try {
    const demoInfo = {
      success: true,
      demoKeys: {
        patientId: "default-patient",
        providerId: "demo-provider-001",
        keyId: "demo-key-123",
        patientKeyFragment: "patient-demo-key-12345",
        providerKeyFragment: "provider-demo-key-67890",
        instructions: {
          description: "These are demo keys for testing the secure data storage system",
          usage: [
            "1. Use 'demo-key-123' as the keyId in API requests",
            "2. Use 'patient-demo-key-12345' in x-patient-key header",
            "3. Use 'provider-demo-key-67890' in x-provider-key header",
            "4. These keys work with the secure data storage endpoints"
          ],
          securityNote: "In production, keys would be securely generated and distributed to actual patients and providers"
        }
      },
      endpoints: {
        storeData: "POST /api/secure/data/store",
        retrieveData: "POST /api/secure/data/retrieve/:recordId",
        generateKeys: "POST /api/secure/keys/generate",
        systemStatus: "GET /api/secure/system/status"
      }
    };

    res.json(demoInfo);
  } catch (error) {
    console.error("❌ Error getting demo keys info:", error);
    res.status(500).json({
      success: false,
      error: "Failed to get demo keys info: " + error.message
    });
  }
};

/**
 * Initialize demo data in the secure system
 */
export const initializeDemoData: RequestHandler = async (req, res) => {
  try {
    // Initialize database
    const { DatabaseInitService } = await import('../services/initDatabase');
    await DatabaseInitService.initializeSecureHealthcareDatabase();

    res.json({
      success: true,
      message: "Demo data initialized successfully",
      nextSteps: [
        "1. Visit /secure to access the secure data management interface",
        "2. Use the demo keys provided by /api/demo/keys/info",
        "3. Test storing and retrieving secure health data",
        "4. Monitor system status via /api/secure/system/status"
      ]
    });

  } catch (error) {
    console.error("❌ Error initializing demo data:", error);
    res.status(500).json({
      success: false,
      error: "Failed to initialize demo data: " + error.message
    });
  }
};
