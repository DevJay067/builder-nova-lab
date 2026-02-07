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
  sleepData?: {
    sleepStage: 'awake' | 'light' | 'deep' | 'rem';
    sleepDuration: number; // minutes
    sleepQuality: number; // 0-100
    sleepEfficiency: number; // 0-100
  };
  waterIntake?: {
    dailyGoal: number; // ml
    currentIntake: number; // ml
    lastDrink: string; // timestamp
  };
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    connectionType: 'bluetooth' | 'wifi' | 'cellular';
    signalStrength: number; // 0-100
    lastSync: string;
  };
}

export interface DeviceConnectionStatus {
  deviceId: string;
  deviceName: string;
  status: 'connected' | 'disconnected' | 'syncing' | 'error';
  lastSeen: string;
  battery: number;
  signalStrength: number;
  connectionType: 'bluetooth' | 'wifi' | 'cellular';
}

/**
 * Enhanced IoT vitals service with comprehensive health tracking and debugging
 */
export class IoTVitalsService {
  private static latest: VitalsPayload = IoTVitalsService.generateRandomVitals();
  private static clients: Set<NodeJS.WritableStream> = new Set();
  private static mockInterval: NodeJS.Timeout | null = null;
  private static deviceConnections: Map<string, DeviceConnectionStatus> = new Map();
  private static dataLog: Array<{ timestamp: string; data: any; source: string }> = [];
  private static isDebugMode: boolean = process.env.NODE_ENV === 'development';

  static getLatest(): VitalsPayload {
    return this.latest;
  }

  static getDeviceConnections(): DeviceConnectionStatus[] {
    return Array.from(this.deviceConnections.values());
  }

  static getDataLog(): Array<{ timestamp: string; data: any; source: string }> {
    return this.dataLog.slice(-100); // Keep last 100 entries
  }

  static updateVitals(payload: Partial<VitalsPayload>): VitalsPayload {
    const now = new Date().toISOString();
    
    // Log incoming data for debugging
    if (this.isDebugMode) {
      this.dataLog.push({
        timestamp: now,
        data: payload,
        source: 'device_update'
      });
      console.log('📊 IoT Data Received:', JSON.stringify(payload, null, 2));
    }

    // Validate incoming data
    const validatedPayload = this.validateVitalsData(payload);
    
    const next: VitalsPayload = {
      heartRate: validatedPayload.heartRate ?? this.latest.heartRate,
      bloodPressure: validatedPayload.bloodPressure ?? this.latest.bloodPressure,
      temperature: validatedPayload.temperature ?? this.latest.temperature,
      oxygenSaturation: validatedPayload.oxygenSaturation ?? this.latest.oxygenSaturation,
      respiratoryRate: validatedPayload.respiratoryRate ?? this.latest.respiratoryRate,
      timestamp: validatedPayload.timestamp ?? now,
      steps: validatedPayload.steps ?? this.latest.steps,
      battery: validatedPayload.battery ?? this.latest.battery,
      sleepData: validatedPayload.sleepData ?? this.latest.sleepData,
      waterIntake: validatedPayload.waterIntake ?? this.latest.waterIntake,
      deviceInfo: validatedPayload.deviceInfo ?? this.latest.deviceInfo,
    };

    // Update device connection status
    if (validatedPayload.deviceInfo) {
      this.updateDeviceConnection(validatedPayload.deviceInfo);
    }

    this.latest = next;
    this.broadcast(next);
    
    // Log successful update
    if (this.isDebugMode) {
      console.log('✅ Vitals updated successfully:', {
        heartRate: next.heartRate,
        steps: next.steps,
        battery: next.battery,
        deviceId: next.deviceInfo?.deviceId
      });
    }

    return next;
  }

  private static validateVitalsData(payload: Partial<VitalsPayload>): Partial<VitalsPayload> {
    const validated: Partial<VitalsPayload> = {};

    // Validate heart rate (30-220 BPM)
    if (payload.heartRate !== undefined) {
      validated.heartRate = Math.max(30, Math.min(220, payload.heartRate));
    }

    // Validate blood pressure
    if (payload.bloodPressure) {
      validated.bloodPressure = {
        systolic: Math.max(70, Math.min(250, payload.bloodPressure.systolic)),
        diastolic: Math.max(40, Math.min(150, payload.bloodPressure.diastolic))
      };
    }

    // Validate temperature (90-110°F)
    if (payload.temperature !== undefined) {
      validated.temperature = Math.max(90, Math.min(110, payload.temperature));
    }

    // Validate oxygen saturation (70-100%)
    if (payload.oxygenSaturation !== undefined) {
      validated.oxygenSaturation = Math.max(70, Math.min(100, payload.oxygenSaturation));
    }

    // Validate respiratory rate (8-40 breaths/min)
    if (payload.respiratoryRate !== undefined) {
      validated.respiratoryRate = Math.max(8, Math.min(40, payload.respiratoryRate));
    }

    // Validate battery (0-100%)
    if (payload.battery !== undefined) {
      validated.battery = Math.max(0, Math.min(100, payload.battery));
    }

    // Validate steps (non-negative)
    if (payload.steps !== undefined) {
      validated.steps = Math.max(0, payload.steps);
    }

    // Validate sleep data
    if (payload.sleepData) {
      validated.sleepData = {
        sleepStage: payload.sleepData.sleepStage || 'awake',
        sleepDuration: Math.max(0, payload.sleepData.sleepDuration),
        sleepQuality: Math.max(0, Math.min(100, payload.sleepData.sleepQuality)),
        sleepEfficiency: Math.max(0, Math.min(100, payload.sleepData.sleepEfficiency))
      };
    }

    // Validate water intake
    if (payload.waterIntake) {
      validated.waterIntake = {
        dailyGoal: Math.max(0, payload.waterIntake.dailyGoal),
        currentIntake: Math.max(0, payload.waterIntake.currentIntake),
        lastDrink: payload.waterIntake.lastDrink || new Date().toISOString()
      };
    }

    return validated;
  }

  private static updateDeviceConnection(deviceInfo: VitalsPayload['deviceInfo']) {
    if (!deviceInfo) return;

    const connection: DeviceConnectionStatus = {
      deviceId: deviceInfo.deviceId,
      deviceName: deviceInfo.deviceName,
      status: 'connected',
      lastSeen: new Date().toISOString(),
      battery: this.latest.battery || 0,
      signalStrength: deviceInfo.signalStrength,
      connectionType: deviceInfo.connectionType
    };

    this.deviceConnections.set(deviceInfo.deviceId, connection);
  }

  static addClient(stream: NodeJS.WritableStream): void {
    this.clients.add(stream);
    console.log(`📡 Client connected. Total clients: ${this.clients.size}`);
  }

  static removeClient(stream: NodeJS.WritableStream): void {
    this.clients.delete(stream);
    console.log(`📡 Client disconnected. Total clients: ${this.clients.size}`);
  }

  static broadcast(data: VitalsPayload): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    let successCount = 0;
    let errorCount = 0;

    for (const client of Array.from(this.clients)) {
      try {
        client.write(payload);
        successCount++;
      } catch (error) {
        this.clients.delete(client);
        errorCount++;
      }
    }

    if (this.isDebugMode && (successCount > 0 || errorCount > 0)) {
      console.log(`📤 Broadcast: ${successCount} success, ${errorCount} errors`);
    }
  }

  static startMock(): void {
    if (this.mockInterval) return;
    
    console.log('🎭 Starting mock IoT data generation...');
    
    this.mockInterval = setInterval(() => {
      const next = this.generateRandomVitals();
      this.latest = next;
      this.broadcast(next);
    }, 3000);
  }

  static stopMock(): void {
    if (this.mockInterval) {
      clearInterval(this.mockInterval);
      this.mockInterval = null;
      console.log('🎭 Mock IoT data generation stopped');
    }
  }

  static simulateDeviceConnection(deviceId: string, deviceName: string): void {
    const connection: DeviceConnectionStatus = {
      deviceId,
      deviceName,
      status: 'connected',
      lastSeen: new Date().toISOString(),
      battery: randomInt(30, 101),
      signalStrength: randomInt(60, 101),
      connectionType: 'bluetooth'
    };

    this.deviceConnections.set(deviceId, connection);
    console.log(`📱 Simulated device connection: ${deviceName} (${deviceId})`);
  }

  private static generateRandomVitals(): VitalsPayload {
    const now = new Date().toISOString();
    const sleepStages: Array<'awake' | 'light' | 'deep' | 'rem'> = ['awake', 'light', 'deep', 'rem'];
    
    return {
      heartRate: randomInt(65, 86),
      bloodPressure: { systolic: randomInt(110, 131), diastolic: randomInt(70, 86) },
      temperature: 97.5 + Math.random() * 2,
      oxygenSaturation: randomInt(97, 101),
      respiratoryRate: randomInt(14, 21),
      timestamp: now,
      steps: randomInt(0, 200),
      battery: randomInt(30, 101),
      sleepData: {
        sleepStage: sleepStages[randomInt(0, sleepStages.length)],
        sleepDuration: randomInt(0, 480), // 0-8 hours in minutes
        sleepQuality: randomInt(60, 101),
        sleepEfficiency: randomInt(70, 101)
      },
      waterIntake: {
        dailyGoal: 2000, // 2L daily goal
        currentIntake: randomInt(0, 1500),
        lastDrink: new Date(Date.now() - randomInt(0, 3600000)).toISOString() // 0-1 hour ago
      },
      deviceInfo: {
        deviceId: 'mock_smartwatch_001',
        deviceName: 'Mock Smartwatch',
        connectionType: 'bluetooth',
        signalStrength: randomInt(70, 101),
        lastSync: now
      }
    };
  }
}