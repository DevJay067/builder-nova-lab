import { randomInt } from "crypto";

export interface VitalsPayload {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
  steps?: number;
  battery?: number; // percentage 0-100
  deviceId?: string;
  connectionStatus?: 'connected' | 'disconnected' | 'syncing';
  dataQuality?: 'excellent' | 'good' | 'poor' | 'unavailable';
}

export interface DeviceConnection {
  deviceId: string;
  deviceName: string;
  deviceType: 'smartwatch' | 'fitness_tracker' | 'blood_pressure' | 'thermometer' | 'pulse_oximeter';
  connectionMethod: 'bluetooth' | 'wifi' | 'cellular' | 'mock';
  lastSeen: string;
  battery: number;
  status: 'connected' | 'disconnected' | 'syncing';
  dataQuality: 'excellent' | 'good' | 'poor' | 'unavailable';
}

/**
 * Enhanced IoT vitals service with debugging, logging, and device management
 */
export class IoTVitalsService {
  private static latest: VitalsPayload = IoTVitalsService.generateRandomVitals();
  private static clients: Set<NodeJS.WritableStream> = new Set();
  private static mockInterval: NodeJS.Timeout | null = null;
  private static connectedDevices: Map<string, DeviceConnection> = new Map();
  private static dataHistory: VitalsPayload[] = [];
  private static debugMode: boolean = process.env.NODE_ENV === 'development';
  private static lastDataReceived: string | null = null;
  private static connectionAttempts: number = 0;
  private static successfulConnections: number = 0;

  static getLatest(): VitalsPayload {
    return this.latest;
  }

  static getConnectedDevices(): DeviceConnection[] {
    return Array.from(this.connectedDevices.values());
  }

  static getDataHistory(): VitalsPayload[] {
    return this.dataHistory.slice(-100); // Keep last 100 readings
  }

  static getConnectionStats() {
    return {
      totalAttempts: this.connectionAttempts,
      successfulConnections: this.successfulConnections,
      lastDataReceived: this.lastDataReceived,
      connectedDevices: this.connectedDevices.size,
      activeClients: this.clients.size,
      mockRunning: !!this.mockInterval,
      debugMode: this.debugMode
    };
  }

  static updateVitals(payload: Partial<VitalsPayload>): VitalsPayload {
    const now = new Date().toISOString();
    const next: VitalsPayload = {
      heartRate: payload.heartRate ?? this.latest.heartRate,
      bloodPressure: payload.bloodPressure ?? this.latest.bloodPressure,
      temperature: payload.temperature ?? this.latest.temperature,
      oxygenSaturation: payload.oxygenSaturation ?? this.latest.oxygenSaturation,
      respiratoryRate: payload.respiratoryRate ?? this.latest.respiratoryRate,
      timestamp: payload.timestamp ?? now,
      steps: payload.steps ?? this.latest.steps,
      battery: payload.battery ?? this.latest.battery,
      deviceId: payload.deviceId ?? this.latest.deviceId,
      connectionStatus: payload.connectionStatus ?? this.latest.connectionStatus,
      dataQuality: payload.dataQuality ?? this.latest.dataQuality,
    };

    // Validate data quality
    next.dataQuality = this.validateDataQuality(next);

    this.latest = next;
    this.lastDataReceived = now;
    
    // Store in history
    this.dataHistory.push(next);
    if (this.dataHistory.length > 100) {
      this.dataHistory.shift();
    }

    // Log data reception
    if (this.debugMode) {
      console.log(`📊 IoT Data Received:`, {
        deviceId: next.deviceId || 'unknown',
        heartRate: next.heartRate,
        temperature: next.temperature,
        timestamp: next.timestamp,
        dataQuality: next.dataQuality
      });
    }

    this.broadcast(next);
    return next;
  }

  static registerDevice(device: DeviceConnection): void {
    this.connectedDevices.set(device.deviceId, device);
    this.connectionAttempts++;
    this.successfulConnections++;
    
    if (this.debugMode) {
      console.log(`🔗 Device Connected:`, {
        deviceId: device.deviceId,
        deviceName: device.deviceName,
        connectionMethod: device.connectionMethod,
        status: device.status
      });
    }
  }

  static updateDeviceStatus(deviceId: string, status: DeviceConnection['status'], battery?: number): void {
    const device = this.connectedDevices.get(deviceId);
    if (device) {
      device.status = status;
      device.lastSeen = new Date().toISOString();
      if (battery !== undefined) device.battery = battery;
      
      if (this.debugMode) {
        console.log(`📱 Device Status Update:`, {
          deviceId,
          status,
          battery,
          timestamp: device.lastSeen
        });
      }
    }
  }

  static removeDevice(deviceId: string): void {
    this.connectedDevices.delete(deviceId);
    if (this.debugMode) {
      console.log(`❌ Device Disconnected:`, { deviceId });
    }
  }

  static addClient(stream: NodeJS.WritableStream): void {
    this.clients.add(stream);
    if (this.debugMode) {
      console.log(`👥 Client Connected. Total clients: ${this.clients.size}`);
    }
  }

  static removeClient(stream: NodeJS.WritableStream): void {
    this.clients.delete(stream);
    if (this.debugMode) {
      console.log(`👥 Client Disconnected. Total clients: ${this.clients.size}`);
    }
  }

  static broadcast(data: VitalsPayload): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    let activeClients = 0;
    
    for (const client of Array.from(this.clients)) {
      try {
        client.write(payload);
        activeClients++;
      } catch (error) {
        if (this.debugMode) {
          console.log(`❌ Failed to send to client:`, error);
        }
        this.clients.delete(client);
      }
    }

    if (this.debugMode && activeClients > 0) {
      console.log(`📡 Broadcasted to ${activeClients} clients`);
    }
  }

  static startMock(): void {
    if (this.mockInterval) {
      if (this.debugMode) console.log(`⚠️ Mock already running`);
      return;
    }

    // Register mock device
    this.registerDevice({
      deviceId: 'mock-device-001',
      deviceName: 'Mock Smartwatch',
      deviceType: 'smartwatch',
      connectionMethod: 'mock',
      lastSeen: new Date().toISOString(),
      battery: 85,
      status: 'connected',
      dataQuality: 'excellent'
    });

    this.mockInterval = setInterval(() => {
      const next = this.generateRandomVitals();
      next.deviceId = 'mock-device-001';
      next.connectionStatus = 'connected';
      next.dataQuality = 'excellent';
      this.latest = next;
      this.broadcast(next);
    }, 3000);

    if (this.debugMode) {
      console.log(`🎭 Mock IoT generator started`);
    }
  }

  static stopMock(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
      this.removeDevice('mock-device-001');
      
      if (this.debugMode) {
        console.log(`🛑 Mock IoT generator stopped`);
      }
    }
  }

  static enableDebugMode(enabled: boolean = true): void {
    this.debugMode = enabled;
    console.log(`🔧 Debug mode ${enabled ? 'enabled' : 'disabled'}`);
  }

  private static validateDataQuality(vitals: VitalsPayload): 'excellent' | 'good' | 'poor' | 'unavailable' {
    // Check for reasonable ranges
    const checks = [
      vitals.heartRate >= 40 && vitals.heartRate <= 200,
      vitals.bloodPressure.systolic >= 70 && vitals.bloodPressure.systolic <= 200,
      vitals.bloodPressure.diastolic >= 40 && vitals.bloodPressure.diastolic <= 130,
      vitals.temperature >= 90 && vitals.temperature <= 110,
      vitals.oxygenSaturation >= 70 && vitals.oxygenSaturation <= 100,
      vitals.respiratoryRate >= 8 && vitals.respiratoryRate <= 40
    ];

    const validChecks = checks.filter(Boolean).length;
    const quality = validChecks / checks.length;

    if (quality >= 0.9) return 'excellent';
    if (quality >= 0.7) return 'good';
    if (quality >= 0.5) return 'poor';
    return 'unavailable';
  }

  private static generateRandomVitals(): VitalsPayload {
    const now = new Date().toISOString();
    return {
      heartRate: randomInt(65, 86),
      bloodPressure: { systolic: randomInt(110, 131), diastolic: randomInt(70, 86) },
      temperature: 97.5 + Math.random() * 2,
      oxygenSaturation: randomInt(97, 101),
      respiratoryRate: randomInt(14, 21),
      timestamp: now,
      steps: randomInt(0, 200),
      battery: randomInt(30, 101),
      deviceId: 'mock-device-001',
      connectionStatus: 'connected',
      dataQuality: 'excellent'
    };
  }
}