/**
 * IoT Device Simulation Service
 * Simulates real device data for testing the IoT integration
 */

import { realIoTDeviceService, type VitalSigns, type DeviceConnection } from './realIoTDeviceService';

interface SimulatedDevice {
  id: string;
  name: string;
  type: DeviceConnection['type'];
  brand: string;
  isActive: boolean;
  interval?: NodeJS.Timeout;
  baseValues: {
    heartRate: number;
    systolic: number;
    diastolic: number;
    temperature: number;
    oxygenSaturation: number;
    steps: number;
    calories: number;
  };
  patterns: {
    activity: 'resting' | 'walking' | 'exercising' | 'sleeping';
    timeOfDay: number; // 0-23 hours
  };
}

class DeviceSimulationService {
  private simulatedDevices: Map<string, SimulatedDevice> = new Map();
  private isRunning = false;

  constructor() {
    this.initializeDefaultDevices();
  }

  private initializeDefaultDevices() {
    const defaultDevices: Omit<SimulatedDevice, 'id' | 'interval'>[] = [
      {
        name: 'boAt Wave Pro Simulator',
        type: 'smartwatch',
        brand: 'boAt',
        isActive: false,
        baseValues: {
          heartRate: 72,
          systolic: 120,
          diastolic: 80,
          temperature: 98.6,
          oxygenSaturation: 98,
          steps: 0,
          calories: 0
        },
        patterns: {
          activity: 'resting',
          timeOfDay: new Date().getHours()
        }
      },
      {
        name: 'Fitbit Charge 6 Simulator',
        type: 'fitness_tracker',
        brand: 'Fitbit',
        isActive: false,
        baseValues: {
          heartRate: 68,
          systolic: 118,
          diastolic: 78,
          temperature: 98.4,
          oxygenSaturation: 99,
          steps: 0,
          calories: 0
        },
        patterns: {
          activity: 'walking',
          timeOfDay: new Date().getHours()
        }
      },
      {
        name: 'Apple Watch Series 9 Simulator',
        type: 'smartwatch',
        brand: 'Apple',
        isActive: false,
        baseValues: {
          heartRate: 75,
          systolic: 122,
          diastolic: 82,
          temperature: 98.8,
          oxygenSaturation: 97,
          steps: 0,
          calories: 0
        },
        patterns: {
          activity: 'resting',
          timeOfDay: new Date().getHours()
        }
      }
    ];

    defaultDevices.forEach((device, index) => {
      const simulatedDevice: SimulatedDevice = {
        ...device,
        id: `sim_${device.brand.toLowerCase()}_${index}`
      };
      this.simulatedDevices.set(simulatedDevice.id, simulatedDevice);
    });
  }

  startSimulation(deviceIds?: string[]) {
    console.log('🎬 Starting IoT device simulation...');
    
    const devicesToSimulate = deviceIds 
      ? Array.from(this.simulatedDevices.values()).filter(d => deviceIds.includes(d.id))
      : Array.from(this.simulatedDevices.values());

    devicesToSimulate.forEach(device => {
      this.startDeviceSimulation(device);
    });

    this.isRunning = true;
  }

  stopSimulation(deviceIds?: string[]) {
    console.log('⏹️ Stopping IoT device simulation...');
    
    const devicesToStop = deviceIds 
      ? Array.from(this.simulatedDevices.values()).filter(d => deviceIds.includes(d.id))
      : Array.from(this.simulatedDevices.values());

    devicesToStop.forEach(device => {
      this.stopDeviceSimulation(device);
    });

    if (!deviceIds) {
      this.isRunning = false;
    }
  }

  private startDeviceSimulation(device: SimulatedDevice) {
    if (device.isActive) return;

    device.isActive = true;
    console.log(`📡 Starting simulation for ${device.name}`);

    // Update activity pattern based on time
    this.updateActivityPattern(device);

    // Start streaming data every 3-5 seconds
    device.interval = setInterval(() => {
      const vitalSigns = this.generateRealisticVitalSigns(device);
      
      // Emit the data through the real IoT service
      realIoTDeviceService['emitVitalSigns'](vitalSigns);
      
      // Update device patterns occasionally
      if (Math.random() < 0.1) { // 10% chance every interval
        this.updateActivityPattern(device);
      }
      
    }, 3000 + Math.random() * 2000); // 3-5 second intervals
  }

  private stopDeviceSimulation(device: SimulatedDevice) {
    if (!device.isActive) return;

    device.isActive = false;
    if (device.interval) {
      clearInterval(device.interval);
      device.interval = undefined;
    }
    console.log(`📡 Stopped simulation for ${device.name}`);
  }

  private updateActivityPattern(device: SimulatedDevice) {
    const hour = new Date().getHours();
    device.patterns.timeOfDay = hour;

    // Determine activity based on time and random factors
    if (hour >= 22 || hour <= 6) {
      device.patterns.activity = 'sleeping';
    } else if (hour >= 7 && hour <= 9) {
      device.patterns.activity = Math.random() > 0.5 ? 'walking' : 'resting';
    } else if (hour >= 12 && hour <= 14) {
      device.patterns.activity = 'resting'; // Lunch time
    } else if (hour >= 17 && hour <= 19) {
      device.patterns.activity = Math.random() > 0.3 ? 'exercising' : 'walking';
    } else {
      const activities: SimulatedDevice['patterns']['activity'][] = ['resting', 'walking', 'exercising'];
      device.patterns.activity = activities[Math.floor(Math.random() * activities.length)];
    }
  }

  private generateRealisticVitalSigns(device: SimulatedDevice): VitalSigns {
    const { baseValues, patterns } = device;
    const now = new Date();

    // Activity-based modifications
    let heartRateModifier = 0;
    let stepsIncrement = 0;
    let caloriesIncrement = 0;
    let temperatureModifier = 0;

    switch (patterns.activity) {
      case 'sleeping':
        heartRateModifier = -10;
        stepsIncrement = 0;
        caloriesIncrement = 0.5;
        temperatureModifier = -0.3;
        break;
      case 'walking':
        heartRateModifier = 15;
        stepsIncrement = Math.floor(Math.random() * 8) + 3; // 3-10 steps per reading
        caloriesIncrement = 2;
        temperatureModifier = 0.2;
        break;
      case 'exercising':
        heartRateModifier = 40;
        stepsIncrement = Math.floor(Math.random() * 15) + 10; // 10-25 steps per reading
        caloriesIncrement = 5;
        temperatureModifier = 0.8;
        break;
      case 'resting':
      default:
        heartRateModifier = 0;
        stepsIncrement = Math.floor(Math.random() * 3); // 0-2 steps per reading
        caloriesIncrement = 1;
        temperatureModifier = 0;
        break;
    }

    // Add some random variation
    const variation = {
      heartRate: (Math.random() - 0.5) * 10,
      bloodPressure: (Math.random() - 0.5) * 8,
      temperature: (Math.random() - 0.5) * 0.4,
      oxygenSaturation: (Math.random() - 0.5) * 2
    };

    // Time-of-day effects
    const timeModifier = {
      heartRate: Math.sin((patterns.timeOfDay - 6) * Math.PI / 12) * 5, // Peak afternoon
      temperature: Math.sin((patterns.timeOfDay - 14) * Math.PI / 12) * 0.5 // Peak evening
    };

    // Generate vital signs
    const heartRate = Math.max(40, Math.min(180, 
      baseValues.heartRate + heartRateModifier + variation.heartRate + timeModifier.heartRate
    ));

    const systolic = Math.max(80, Math.min(200,
      baseValues.systolic + (heartRateModifier * 0.5) + variation.bloodPressure
    ));

    const diastolic = Math.max(50, Math.min(120,
      baseValues.diastolic + (heartRateModifier * 0.3) + variation.bloodPressure * 0.7
    ));

    const temperature = Math.max(96, Math.min(102,
      baseValues.temperature + temperatureModifier + variation.temperature + timeModifier.temperature
    ));

    const oxygenSaturation = Math.max(90, Math.min(100,
      baseValues.oxygenSaturation + variation.oxygenSaturation - (patterns.activity === 'exercising' ? 1 : 0)
    ));

    // Update cumulative values
    baseValues.steps += stepsIncrement;
    baseValues.calories += caloriesIncrement;

    return {
      heartRate: Math.round(heartRate),
      bloodPressure: {
        systolic: Math.round(systolic),
        diastolic: Math.round(diastolic)
      },
      temperature: Math.round(temperature * 10) / 10,
      oxygenSaturation: Math.round(oxygenSaturation),
      steps: baseValues.steps,
      calories: Math.round(baseValues.calories),
      timestamp: now,
      deviceId: device.id
    };
  }

  // Simulate device connections
  simulateDeviceConnection(deviceId: string): DeviceConnection | null {
    const device = this.simulatedDevices.get(deviceId);
    if (!device) return null;

    const connection: DeviceConnection = {
      id: device.id,
      name: device.name,
      type: device.type,
      status: 'connected',
      battery: Math.floor(Math.random() * 40) + 60, // 60-100%
      lastSync: new Date(),
      protocols: ['bluetooth']
    };

    // Start simulation for this device
    this.startDeviceSimulation(device);

    return connection;
  }

  // Add a new custom device
  addCustomDevice(name: string, type: DeviceConnection['type'], brand: string): string {
    const deviceId = `sim_custom_${Date.now()}`;
    const device: SimulatedDevice = {
      id: deviceId,
      name: `${name} Simulator`,
      type,
      brand,
      isActive: false,
      baseValues: {
        heartRate: 70 + Math.random() * 10,
        systolic: 115 + Math.random() * 10,
        diastolic: 75 + Math.random() * 10,
        temperature: 98.4 + Math.random() * 0.8,
        oxygenSaturation: 97 + Math.random() * 2,
        steps: 0,
        calories: 0
      },
      patterns: {
        activity: 'resting',
        timeOfDay: new Date().getHours()
      }
    };

    this.simulatedDevices.set(deviceId, device);
    return deviceId;
  }

  getSimulatedDevices(): SimulatedDevice[] {
    return Array.from(this.simulatedDevices.values());
  }

  isDeviceActive(deviceId: string): boolean {
    return this.simulatedDevices.get(deviceId)?.isActive || false;
  }

  getSimulationStatus(): { isRunning: boolean; activeDevices: number; totalDevices: number } {
    const activeDevices = Array.from(this.simulatedDevices.values()).filter(d => d.isActive).length;
    return {
      isRunning: this.isRunning,
      activeDevices,
      totalDevices: this.simulatedDevices.size
    };
  }

  // Emergency simulation scenarios
  simulateEmergencyScenario(scenario: 'heart_attack' | 'low_oxygen' | 'fever' | 'hypotension') {
    console.log(`🚨 Simulating emergency scenario: ${scenario}`);
    
    // Find an active device to simulate emergency on
    const activeDevice = Array.from(this.simulatedDevices.values()).find(d => d.isActive);
    if (!activeDevice) return;

    let emergencyData: Partial<VitalSigns> = {
      timestamp: new Date(),
      deviceId: activeDevice.id
    };

    switch (scenario) {
      case 'heart_attack':
        emergencyData = {
          ...emergencyData,
          heartRate: 150 + Math.random() * 30, // 150-180 BPM
          bloodPressure: { systolic: 160 + Math.random() * 20, diastolic: 100 + Math.random() * 15 }
        };
        break;
      case 'low_oxygen':
        emergencyData = {
          ...emergencyData,
          oxygenSaturation: 85 + Math.random() * 8, // 85-93%
          heartRate: 95 + Math.random() * 15
        };
        break;
      case 'fever':
        emergencyData = {
          ...emergencyData,
          temperature: 101.5 + Math.random() * 2, // 101.5-103.5°F
          heartRate: 90 + Math.random() * 20
        };
        break;
      case 'hypotension':
        emergencyData = {
          ...emergencyData,
          bloodPressure: { systolic: 80 + Math.random() * 10, diastolic: 50 + Math.random() * 10 },
          heartRate: 110 + Math.random() * 15
        };
        break;
    }

    // Send emergency data
    realIoTDeviceService['emitVitalSigns'](emergencyData as VitalSigns);
    
    // Return to normal after 30 seconds
    setTimeout(() => {
      console.log('🩺 Emergency scenario ended, returning to normal values');
    }, 30000);
  }
}

export const deviceSimulationService = new DeviceSimulationService();
export type { SimulatedDevice };
