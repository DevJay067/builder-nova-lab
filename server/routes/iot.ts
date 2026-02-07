import { RequestHandler } from "express";
import { IoTVitalsService } from "../services/iotVitals";

export const streamVitals: RequestHandler = async (req, res) => {
  try {
    res.setHeader("Content-Type", "text/event-stream");
    res.setHeader("Cache-Control", "no-cache");
    res.setHeader("Connection", "keep-alive");
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Cache-Control");
    res.flushHeaders?.();

    // Send initial comment and latest snapshot
    res.write(":ok\n\n");
    res.write(`data: ${JSON.stringify(IoTVitalsService.getLatest())}\n\n`);

    const client = res as unknown as NodeJS.WritableStream;
    IoTVitalsService.addClient(client);

    // Heartbeat
    const heartbeat = setInterval(() => {
      try {
        res.write(":heartbeat\n\n");
      } catch {
        clearInterval(heartbeat);
      }
    }, 15000);

    req.on("close", () => {
      clearInterval(heartbeat);
      IoTVitalsService.removeClient(client);
    });
  } catch (error) {
    console.error("SSE stream error:", error);
    res.status(500).json({ error: "SSE stream failed" });
  }
};

export const getLatestVitals: RequestHandler = async (_req, res) => {
  try {
    const vitals = IoTVitalsService.getLatest();
    const stats = IoTVitalsService.getConnectionStats();
    
    res.json({ 
      success: true, 
      vitals,
      stats,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Get latest vitals error:", error);
    res.status(500).json({ error: "Failed to get vitals" });
  }
};

export const updateVitals: RequestHandler = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Validate required fields
    if (!payload.heartRate && !payload.temperature && !payload.bloodPressure) {
      return res.status(400).json({ 
        error: "At least one vital sign must be provided",
        required: ["heartRate", "temperature", "bloodPressure", "oxygenSaturation", "respiratoryRate"]
      });
    }

    const updated = IoTVitalsService.updateVitals(payload);
    res.json({ success: true, vitals: updated });
  } catch (error) {
    console.error("Update vitals error:", error);
    res.status(500).json({ error: "Failed to update vitals" });
  }
};

export const startMock: RequestHandler = async (_req, res) => {
  try {
    IoTVitalsService.startMock();
    res.json({ 
      success: true, 
      message: "Mock IoT generator started",
      stats: IoTVitalsService.getConnectionStats()
    });
  } catch (error) {
    console.error("Start mock error:", error);
    res.status(500).json({ error: "Failed to start mock" });
  }
};

export const stopMock: RequestHandler = async (_req, res) => {
  try {
    IoTVitalsService.stopMock();
    res.json({ 
      success: true, 
      message: "Mock IoT generator stopped",
      stats: IoTVitalsService.getConnectionStats()
    });
  } catch (error) {
    console.error("Stop mock error:", error);
    res.status(500).json({ error: "Failed to stop mock" });
  }
};

// New debugging endpoints
export const getConnectionStats: RequestHandler = async (_req, res) => {
  try {
    const stats = IoTVitalsService.getConnectionStats();
    const devices = IoTVitalsService.getConnectedDevices();
    const history = IoTVitalsService.getDataHistory();
    
    res.json({
      success: true,
      stats,
      devices,
      historyCount: history.length,
      latestData: history.slice(-5), // Last 5 readings
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error("Get connection stats error:", error);
    res.status(500).json({ error: "Failed to get connection stats" });
  }
};

export const registerDevice: RequestHandler = async (req, res) => {
  try {
    const { deviceId, deviceName, deviceType, connectionMethod } = req.body;
    
    if (!deviceId || !deviceName || !deviceType || !connectionMethod) {
      return res.status(400).json({
        error: "Missing required device information",
        required: ["deviceId", "deviceName", "deviceType", "connectionMethod"]
      });
    }

    IoTVitalsService.registerDevice({
      deviceId,
      deviceName,
      deviceType,
      connectionMethod,
      lastSeen: new Date().toISOString(),
      battery: 100,
      status: 'connected',
      dataQuality: 'excellent'
    });

    res.json({
      success: true,
      message: "Device registered successfully",
      deviceId,
      stats: IoTVitalsService.getConnectionStats()
    });
  } catch (error) {
    console.error("Register device error:", error);
    res.status(500).json({ error: "Failed to register device" });
  }
};

export const updateDeviceStatus: RequestHandler = async (req, res) => {
  try {
    const { deviceId, status, battery } = req.body;
    
    if (!deviceId || !status) {
      return res.status(400).json({
        error: "Missing required parameters",
        required: ["deviceId", "status"]
      });
    }

    IoTVitalsService.updateDeviceStatus(deviceId, status, battery);

    res.json({
      success: true,
      message: "Device status updated",
      deviceId,
      status,
      battery,
      stats: IoTVitalsService.getConnectionStats()
    });
  } catch (error) {
    console.error("Update device status error:", error);
    res.status(500).json({ error: "Failed to update device status" });
  }
};

export const enableDebugMode: RequestHandler = async (req, res) => {
  try {
    const { enabled = true } = req.body;
    IoTVitalsService.enableDebugMode(enabled);
    
    res.json({
      success: true,
      message: `Debug mode ${enabled ? 'enabled' : 'disabled'}`,
      debugMode: enabled,
      stats: IoTVitalsService.getConnectionStats()
    });
  } catch (error) {
    console.error("Enable debug mode error:", error);
    res.status(500).json({ error: "Failed to toggle debug mode" });
  }
};

export const testDataFlow: RequestHandler = async (req, res) => {
  try {
    // Test data flow by sending a test payload
    const testPayload = {
      heartRate: 75,
      bloodPressure: { systolic: 120, diastolic: 80 },
      temperature: 98.6,
      oxygenSaturation: 98,
      respiratoryRate: 16,
      deviceId: 'test-device-001',
      connectionStatus: 'connected' as const,
      dataQuality: 'excellent' as const
    };

    const updated = IoTVitalsService.updateVitals(testPayload);
    
    res.json({
      success: true,
      message: "Test data flow completed",
      testPayload,
      updated,
      stats: IoTVitalsService.getConnectionStats()
    });
  } catch (error) {
    console.error("Test data flow error:", error);
    res.status(500).json({ error: "Failed to test data flow" });
  }
};