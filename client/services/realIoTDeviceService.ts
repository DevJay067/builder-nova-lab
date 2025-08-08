/**
 * Real IoT Device Connection Service
 * Connects to actual wearables and health devices via Web Bluetooth, WebSocket, and native APIs
 */

interface DeviceConnection {
  id: string;
  name: string;
  type: 'smartwatch' | 'fitness_tracker' | 'blood_pressure' | 'pulse_oximeter' | 'glucometer' | 'smart_scale';
  status: 'connected' | 'disconnected' | 'syncing' | 'pairing';
  battery?: number;
  lastSync: Date;
  device?: BluetoothDevice;
  characteristic?: BluetoothRemoteGATTCharacteristic;
  protocols: ('bluetooth' | 'websocket' | 'healthkit' | 'googlefit')[];
}

interface VitalSigns {
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  temperature?: number;
  oxygenSaturation?: number;
  respiratoryRate?: number;
  steps?: number;
  calories?: number;
  glucose?: number;
  weight?: number;
  bodyFat?: number;
  timestamp: Date;
  deviceId: string;
}

// Bluetooth UUIDs for common health devices
const HEALTH_SERVICE_UUIDS = {
  HEART_RATE: '0000180d-0000-1000-8000-00805f9b34fb',
  BLOOD_PRESSURE: '00001810-0000-1000-8000-00805f9b34fb',
  GLUCOSE: '00001808-0000-1000-8000-00805f9b34fb',
  WEIGHT_SCALE: '0000181d-0000-1000-8000-00805f9b34fb',
  BATTERY_SERVICE: '0000180f-0000-1000-8000-00805f9b34fb',
  DEVICE_INFO: '0000180a-0000-1000-8000-00805f9b34fb',
  // Custom UUIDs for popular devices
  FITBIT_SERVICE: '0000180a-0000-1000-8000-00805f9b34fb',
  GARMIN_SERVICE: '0000180a-0000-1000-8000-00805f9b34fb',
  BOAT_SERVICE: '0000180a-0000-1000-8000-00805f9b34fb'
};

const CHARACTERISTIC_UUIDS = {
  HEART_RATE_MEASUREMENT: '00002a37-0000-1000-8000-00805f9b34fb',
  BLOOD_PRESSURE_MEASUREMENT: '00002a35-0000-1000-8000-00805f9b34fb',
  GLUCOSE_MEASUREMENT: '00002a18-0000-1000-8000-00805f9b34fb',
  WEIGHT_MEASUREMENT: '00002a9d-0000-1000-8000-00805f9b34fb',
  BATTERY_LEVEL: '00002a19-0000-1000-8000-00805f9b34fb',
  BODY_SENSOR_LOCATION: '00002a38-0000-1000-8000-00805f9b34fb'
};

class RealIoTDeviceService {
  private connectedDevices: Map<string, DeviceConnection> = new Map();
  private dataCallbacks: ((data: VitalSigns) => void)[] = [];
  private deviceCallbacks: ((devices: DeviceConnection[]) => void)[] = [];
  private isSupported = false;

  constructor() {
    this.checkDeviceSupport();
    this.initializeWebSocketConnection();
    this.initializeNativeHealthAPIs();
  }

  private checkDeviceSupport() {
    this.isSupported = 'bluetooth' in navigator && 'serviceWorker' in navigator;
    console.log('🔧 Device support check:', {
      bluetooth: 'bluetooth' in navigator,
      serviceWorker: 'serviceWorker' in navigator,
      healthkit: 'HealthKit' in window,
      supported: this.isSupported
    });
  }

  /**
   * Web Bluetooth API Implementation
   */
  async scanAndConnectBluetooth(): Promise<DeviceConnection[]> {
    if (!this.isSupported) {
      throw new Error('Bluetooth not supported');
    }

    try {
      const devices = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [HEALTH_SERVICE_UUIDS.HEART_RATE] },
          { services: [HEALTH_SERVICE_UUIDS.BLOOD_PRESSURE] },
          { services: [HEALTH_SERVICE_UUIDS.GLUCOSE] },
          { services: [HEALTH_SERVICE_UUIDS.WEIGHT_SCALE] },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
          { namePrefix: 'boAt' },
          { namePrefix: 'Apple Watch' },
          { namePrefix: 'Samsung' },
          { namePrefix: 'Xiaomi' },
          { namePrefix: 'HUAWEI' }
        ],
        optionalServices: [
          HEALTH_SERVICE_UUIDS.BATTERY_SERVICE,
          HEALTH_SERVICE_UUIDS.DEVICE_INFO
        ]
      });

      if (devices) {
        const deviceArray = Array.isArray(devices) ? devices : [devices];
        const connections: DeviceConnection[] = [];

        for (const device of deviceArray) {
          const connection = await this.connectBluetoothDevice(device);
          if (connection) {
            connections.push(connection);
          }
        }

        return connections;
      }
    } catch (error) {
      console.error('Bluetooth scan failed:', error);
      throw error;
    }

    return [];
  }

  private async connectBluetoothDevice(device: BluetoothDevice): Promise<DeviceConnection | null> {
    try {
      console.log(`🔗 Connecting to ${device.name}...`);

      const server = await device.gatt?.connect();
      if (!server) return null;

      const deviceType = this.detectDeviceType(device.name || '');
      const connection: DeviceConnection = {
        id: device.id,
        name: device.name || 'Unknown Device',
        type: deviceType,
        status: 'syncing',
        lastSync: new Date(),
        device,
        protocols: ['bluetooth']
      };

      // Try to connect to health services
      await this.setupHealthServices(server, connection);

      // Get battery level
      try {
        const batteryService = await server.getPrimaryService(HEALTH_SERVICE_UUIDS.BATTERY_SERVICE);
        const batteryCharacteristic = await batteryService.getCharacteristic(CHARACTERISTIC_UUIDS.BATTERY_LEVEL);
        const batteryValue = await batteryCharacteristic.readValue();
        connection.battery = batteryValue.getUint8(0);
      } catch (e) {
        console.log('Battery service not available');
      }

      connection.status = 'connected';
      this.connectedDevices.set(connection.id, connection);
      this.notifyDeviceUpdate();

      console.log(`✅ Connected to ${device.name}`);
      return connection;

    } catch (error) {
      console.error(`❌ Failed to connect to ${device.name}:`, error);
      return null;
    }
  }

  private async setupHealthServices(server: BluetoothRemoteGATTServer, connection: DeviceConnection) {
    // Heart Rate Service
    try {
      const heartRateService = await server.getPrimaryService(HEALTH_SERVICE_UUIDS.HEART_RATE);
      const heartRateCharacteristic = await heartRateService.getCharacteristic(CHARACTERISTIC_UUIDS.HEART_RATE_MEASUREMENT);
      
      await heartRateCharacteristic.startNotifications();
      heartRateCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          const heartRate = this.parseHeartRateData(value);
          this.emitVitalSigns({
            heartRate,
            timestamp: new Date(),
            deviceId: connection.id
          });
        }
      });
      
      connection.characteristic = heartRateCharacteristic;
      console.log(`📈 Heart rate monitoring enabled for ${connection.name}`);
    } catch (e) {
      console.log('Heart rate service not available');
    }

    // Blood Pressure Service
    try {
      const bpService = await server.getPrimaryService(HEALTH_SERVICE_UUIDS.BLOOD_PRESSURE);
      const bpCharacteristic = await bpService.getCharacteristic(CHARACTERISTIC_UUIDS.BLOOD_PRESSURE_MEASUREMENT);
      
      await bpCharacteristic.startNotifications();
      bpCharacteristic.addEventListener('characteristicvaluechanged', (event) => {
        const value = (event.target as BluetoothRemoteGATTCharacteristic).value;
        if (value) {
          const bloodPressure = this.parseBloodPressureData(value);
          this.emitVitalSigns({
            bloodPressure,
            timestamp: new Date(),
            deviceId: connection.id
          });
        }
      });
      
      console.log(`🩺 Blood pressure monitoring enabled for ${connection.name}`);
    } catch (e) {
      console.log('Blood pressure service not available');
    }
  }

  /**
   * WebSocket Implementation for Real-time Streaming
   */
  private websocket: WebSocket | null = null;

  private initializeWebSocketConnection() {
    // Skip WebSocket connection in development/demo mode
    const isDevelopment = window.location.hostname === 'localhost' || window.location.hostname === '127.0.0.1';

    if (isDevelopment) {
      console.log('⚠️ WebSocket skipped in development mode. Using local simulation instead.');
      return;
    }

    try {
      // Use the current domain for WebSocket connection
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/health-stream`;

      console.log(`🔌 Attempting WebSocket connection to: ${wsUrl}`);
      this.websocket = new WebSocket(wsUrl);

      this.websocket.onopen = () => {
        console.log('🌐 WebSocket connected for real-time health streaming');
      };

      this.websocket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === 'vital_signs') {
            this.emitVitalSigns(data.payload);
          } else if (data.type === 'device_update') {
            this.handleDeviceUpdate(data.payload);
          }
        } catch (e) {
          console.error('WebSocket message parse error:', e);
        }
      };

      this.websocket.onerror = (error: Event) => {
        console.error('WebSocket connection error:', {
          type: error.type,
          target: error.target,
          message: 'Failed to connect to WebSocket server',
          url: wsUrl
        });

        // Don't attempt reconnection in development
        if (!isDevelopment) {
          console.log('🔄 Will retry WebSocket connection in 10 seconds...');
        }
      };

      this.websocket.onclose = (event: CloseEvent) => {
        console.log('WebSocket disconnected:', {
          code: event.code,
          reason: event.reason || 'No reason provided',
          wasClean: event.wasClean
        });

        // Only attempt reconnection if not in development and connection was not clean
        if (!isDevelopment && !event.wasClean && event.code !== 1000) {
          setTimeout(() => {
            console.log('🔄 Attempting WebSocket reconnection...');
            this.initializeWebSocketConnection();
          }, 10000);
        }
      };

    } catch (error) {
      console.warn('WebSocket initialization failed:', error);
    }
  }

  /**
   * Native Health APIs Integration
   */
  private async initializeNativeHealthAPIs() {
    // Apple HealthKit Integration (iOS Safari)
    if ('HealthKit' in window) {
      try {
        await this.initializeHealthKit();
      } catch (e) {
        console.log('HealthKit initialization failed:', e);
      }
    }

    // Google Fit Integration (Android Chrome)
    if ('GoogleFit' in window) {
      try {
        await this.initializeGoogleFit();
      } catch (e) {
        console.log('Google Fit initialization failed:', e);
      }
    }

    // Web API for device sensors
    this.initializeWebSensors();
  }

  private async initializeHealthKit() {
    // iOS HealthKit integration
    const healthKit = (window as any).HealthKit;
    
    try {
      await healthKit.requestAuthorization([
        'HKQuantityTypeIdentifierHeartRate',
        'HKQuantityTypeIdentifierBloodPressureSystolic',
        'HKQuantityTypeIdentifierBloodPressureDiastolic',
        'HKQuantityTypeIdentifierBodyTemperature',
        'HKQuantityTypeIdentifierOxygenSaturation',
        'HKQuantityTypeIdentifierStepCount',
        'HKQuantityTypeIdentifierActiveEnergyBurned'
      ]);

      // Start real-time data collection
      healthKit.startDataCollection((data: any) => {
        this.emitVitalSigns({
          heartRate: data.heartRate,
          bloodPressure: data.bloodPressure,
          temperature: data.temperature,
          oxygenSaturation: data.oxygenSaturation,
          steps: data.steps,
          calories: data.calories,
          timestamp: new Date(),
          deviceId: 'healthkit'
        });
      });

      console.log('✅ HealthKit integration active');
    } catch (error) {
      console.error('HealthKit setup failed:', error);
    }
  }

  private async initializeGoogleFit() {
    // Google Fit integration
    const googleFit = (window as any).GoogleFit;
    
    try {
      await googleFit.initialize({
        scopes: [
          'https://www.googleapis.com/auth/fitness.heart_rate.read',
          'https://www.googleapis.com/auth/fitness.blood_pressure.read',
          'https://www.googleapis.com/auth/fitness.body_temperature.read',
          'https://www.googleapis.com/auth/fitness.oxygen_saturation.read'
        ]
      });

      googleFit.startRealTimeData((data: any) => {
        this.emitVitalSigns({
          heartRate: data.heartRate,
          bloodPressure: data.bloodPressure,
          oxygenSaturation: data.oxygenSaturation,
          steps: data.steps,
          calories: data.calories,
          timestamp: new Date(),
          deviceId: 'googlefit'
        });
      });

      console.log('✅ Google Fit integration active');
    } catch (error) {
      console.error('Google Fit setup failed:', error);
    }
  }

  private initializeWebSensors() {
    // Use device sensors if available
    if ('Accelerometer' in window) {
      try {
        const accel = new (window as any).Accelerometer({ frequency: 10 });
        accel.addEventListener('reading', () => {
          // Calculate steps from accelerometer data
          const steps = this.calculateStepsFromAcceleration(accel.x, accel.y, accel.z);
          if (steps > 0) {
            this.emitVitalSigns({
              steps,
              timestamp: new Date(),
              deviceId: 'device-sensors'
            });
          }
        });
        accel.start();
      } catch (e) {
        console.log('Accelerometer not available');
      }
    }
  }

  /**
   * Data Parsing Functions
   */
  private parseHeartRateData(value: DataView): number {
    // Parse BLE heart rate measurement format
    const flags = value.getUint8(0);
    const heartRateFormat = flags & 0x01;
    
    if (heartRateFormat === 0) {
      return value.getUint8(1);
    } else {
      return value.getUint16(1, true);
    }
  }

  private parseBloodPressureData(value: DataView): { systolic: number; diastolic: number } {
    // Parse BLE blood pressure measurement format
    const systolic = value.getUint16(1, true);
    const diastolic = value.getUint16(3, true);
    return { systolic, diastolic };
  }

  private calculateStepsFromAcceleration(x: number, y: number, z: number): number {
    // Simple step detection algorithm
    const magnitude = Math.sqrt(x * x + y * y + z * z);
    // This is a simplified implementation - real step counting is more complex
    return magnitude > 12 ? 1 : 0;
  }

  private detectDeviceType(deviceName: string): DeviceConnection['type'] {
    const name = deviceName.toLowerCase();
    
    if (name.includes('watch')) return 'smartwatch';
    if (name.includes('fitbit') || name.includes('garmin') || name.includes('boat')) return 'fitness_tracker';
    if (name.includes('blood pressure') || name.includes('omron')) return 'blood_pressure';
    if (name.includes('pulse') || name.includes('oximeter')) return 'pulse_oximeter';
    if (name.includes('glucose') || name.includes('meter')) return 'glucometer';
    if (name.includes('scale') || name.includes('weight')) return 'smart_scale';
    
    return 'fitness_tracker';
  }

  /**
   * Public API Methods
   */
  async connectDevice(): Promise<DeviceConnection[]> {
    return await this.scanAndConnectBluetooth();
  }

  async disconnectDevice(deviceId: string): Promise<void> {
    const device = this.connectedDevices.get(deviceId);
    if (device?.device?.gatt?.connected) {
      device.device.gatt.disconnect();
      device.status = 'disconnected';
      this.connectedDevices.delete(deviceId);
      this.notifyDeviceUpdate();
    }
  }

  getConnectedDevices(): DeviceConnection[] {
    return Array.from(this.connectedDevices.values());
  }

  onDataReceived(callback: (data: VitalSigns) => void): void {
    this.dataCallbacks.push(callback);
  }

  onDeviceUpdate(callback: (devices: DeviceConnection[]) => void): void {
    this.deviceCallbacks.push(callback);
  }

  private emitVitalSigns(data: VitalSigns): void {
    this.dataCallbacks.forEach(callback => callback(data));
  }

  private notifyDeviceUpdate(): void {
    const devices = this.getConnectedDevices();
    this.deviceCallbacks.forEach(callback => callback(devices));
  }

  private handleDeviceUpdate(payload: any): void {
    // Handle device updates from WebSocket
    console.log('Device update received:', payload);
  }

  /**
   * Device-specific Integration Methods
   */
  async connectBoAtDevice(): Promise<DeviceConnection | null> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'boAt' }],
        optionalServices: [HEALTH_SERVICE_UUIDS.HEART_RATE, HEALTH_SERVICE_UUIDS.BATTERY_SERVICE]
      });

      return await this.connectBluetoothDevice(device);
    } catch (error) {
      console.error('boAt device connection failed:', error);
      return null;
    }
  }

  async connectFitbitDevice(): Promise<DeviceConnection | null> {
    try {
      const device = await navigator.bluetooth.requestDevice({
        filters: [{ namePrefix: 'Fitbit' }],
        optionalServices: [HEALTH_SERVICE_UUIDS.HEART_RATE, HEALTH_SERVICE_UUIDS.BATTERY_SERVICE]
      });

      return await this.connectBluetoothDevice(device);
    } catch (error) {
      console.error('Fitbit device connection failed:', error);
      return null;
    }
  }

  isDeviceSupported(): boolean {
    return this.isSupported;
  }
}

export const realIoTDeviceService = new RealIoTDeviceService();
export type { DeviceConnection, VitalSigns };
