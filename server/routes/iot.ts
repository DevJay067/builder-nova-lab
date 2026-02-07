import { RequestHandler } from "express";
import { IoTVitalsService } from "../services/iotVitals";

export const streamVitals: RequestHandler = async (req, res) => {
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
};

export const getLatestVitals: RequestHandler = async (_req, res) => {
  try {
    const vitals = IoTVitalsService.getLatest();
    res.json({ 
      success: true, 
      vitals,
      timestamp: new Date().toISOString(),
      dataSource: 'iot_service'
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve vitals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const updateVitals: RequestHandler = async (req, res) => {
  try {
    const payload = req.body || {};
    
    // Log incoming request for debugging
    console.log('📥 Received vitals update:', {
      timestamp: new Date().toISOString(),
      payload: payload,
      contentType: req.headers['content-type'],
      userAgent: req.headers['user-agent']
    });

    const updated = IoTVitalsService.updateVitals(payload);
    
    res.json({ 
      success: true, 
      vitals: updated,
      message: 'Vitals updated successfully',
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    console.error('❌ Error updating vitals:', error);
    res.status(500).json({ 
      success: false, 
      error: 'Failed to update vitals',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const startMock: RequestHandler = async (_req, res) => {
  try {
    IoTVitalsService.startMock();
    res.json({ 
      success: true, 
      message: "Mock IoT generator started",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to start mock data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const stopMock: RequestHandler = async (_req, res) => {
  try {
    IoTVitalsService.stopMock();
    res.json({ 
      success: true, 
      message: "Mock IoT generator stopped",
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to stop mock data',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

// New debugging and monitoring endpoints
export const getDeviceConnections: RequestHandler = async (_req, res) => {
  try {
    const connections = IoTVitalsService.getDeviceConnections();
    res.json({ 
      success: true, 
      connections,
      totalDevices: connections.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve device connections',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getDataLog: RequestHandler = async (_req, res) => {
  try {
    const log = IoTVitalsService.getDataLog();
    res.json({ 
      success: true, 
      log,
      totalEntries: log.length,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to retrieve data log',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const simulateDeviceConnection: RequestHandler = async (req, res) => {
  try {
    const { deviceId, deviceName } = req.body;
    
    if (!deviceId || !deviceName) {
      return res.status(400).json({
        success: false,
        error: 'Missing required fields',
        required: ['deviceId', 'deviceName']
      });
    }

    IoTVitalsService.simulateDeviceConnection(deviceId, deviceName);
    
    res.json({ 
      success: true, 
      message: `Simulated connection for ${deviceName}`,
      deviceId,
      deviceName,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to simulate device connection',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const testDeviceConnection: RequestHandler = async (req, res) => {
  try {
    const { deviceId, testData } = req.body;
    
    console.log('🧪 Testing device connection:', { deviceId, testData });
    
    // Simulate a test data update
    const testVitals = {
      heartRate: 75,
      bloodPressure: { systolic: 120, diastolic: 80 },
      temperature: 98.6,
      oxygenSaturation: 98,
      respiratoryRate: 16,
      timestamp: new Date().toISOString(),
      steps: 100,
      battery: 85,
      deviceInfo: {
        deviceId: deviceId || 'test_device',
        deviceName: 'Test Device',
        connectionType: 'bluetooth' as const,
        signalStrength: 90,
        lastSync: new Date().toISOString()
      }
    };

    const updated = IoTVitalsService.updateVitals(testVitals);
    
    res.json({ 
      success: true, 
      message: 'Device connection test successful',
      testData: updated,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Device connection test failed',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

export const getSystemStatus: RequestHandler = async (_req, res) => {
  try {
    const vitals = IoTVitalsService.getLatest();
    const connections = IoTVitalsService.getDeviceConnections();
    const log = IoTVitalsService.getDataLog();
    
    const status = {
      service: 'running',
      lastUpdate: vitals.timestamp,
      connectedDevices: connections.length,
      activeClients: connections.filter(c => c.status === 'connected').length,
      recentDataPoints: log.length,
      systemHealth: 'healthy',
      timestamp: new Date().toISOString()
    };
    
    res.json({ 
      success: true, 
      status
    });
  } catch (error) {
    res.status(500).json({ 
      success: false, 
      error: 'Failed to get system status',
      message: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};