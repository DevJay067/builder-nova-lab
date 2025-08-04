import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import {
  Bluetooth,
  BluetoothConnected,
  Wifi,
  WifiOff,
  Watch,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Shield,
  AlertTriangle,
  CheckCircle,
  Loader2,
  Smartphone,
  Battery,
  RefreshCw,
  Settings,
  Eye,
  EyeOff,
} from "lucide-react";

interface HealthDevice {
  id: string;
  name: string;
  type:
    | "smartwatch"
    | "fitness_tracker"
    | "blood_pressure"
    | "thermometer"
    | "pulse_oximeter";
  bluetoothId?: string;
  connected: boolean;
  connecting: boolean;
  battery?: number;
  lastSync: Date;
  capabilities: string[];
  permissions: {
    heartRate: boolean;
    bloodPressure: boolean;
    temperature: boolean;
    oxygenSaturation: boolean;
    steps: boolean;
    sleep: boolean;
  };
}

interface VitalData {
  deviceId: string;
  timestamp: Date;
  heartRate?: number;
  bloodPressure?: { systolic: number; diastolic: number };
  temperature?: number;
  oxygenSaturation?: number;
  steps?: number;
  calories?: number;
  sleepHours?: number;
}

export default function BluetoothHealthMonitor() {
  const [devices, setDevices] = useState<HealthDevice[]>([]);
  const [isScanning, setIsScanning] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);
  const [bluetoothEnabled, setBluetoothEnabled] = useState(false);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [vitalsData, setVitalsData] = useState<VitalData[]>([]);
  const [currentVitals, setCurrentVitals] = useState<VitalData | null>(null);
  const [showPermissions, setShowPermissions] = useState(false);

  // Check Bluetooth support on component mount
  useEffect(() => {
    checkBluetoothSupport();
  }, []);

  const checkBluetoothSupport = async () => {
    if ("bluetooth" in navigator) {
      setBluetoothSupported(true);
      try {
        const available = await navigator.bluetooth.getAvailability();
        setBluetoothEnabled(available);
      } catch (error) {
        console.log("Bluetooth availability check failed:", error);
      }
    } else {
      setBluetoothSupported(false);
    }
  };

  // Request permissions for health data access
  const requestPermissions = async (deviceId: string) => {
    try {
      // Simulate permission request dialog
      const permissions = await new Promise<any>((resolve) => {
        // In a real app, this would show a native permission dialog
        setTimeout(() => {
          resolve({
            heartRate: true,
            bloodPressure: true,
            temperature: true,
            oxygenSaturation: true,
            steps: true,
            sleep: true,
          });
        }, 1000);
      });

      // Update device permissions
      setDevices((prev) =>
        prev.map((device) =>
          device.id === deviceId ? { ...device, permissions } : device,
        ),
      );

      setPermissionsGranted(true);
      return permissions;
    } catch (error) {
      console.error("Permission request failed:", error);
      return null;
    }
  };

  // Scan for Bluetooth health devices
  const scanForDevices = async () => {
    if (!bluetoothSupported || !bluetoothEnabled) {
      return;
    }

    setIsScanning(true);
    try {
      // Request device with health-related services
      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: ["heart_rate"] },
          { services: ["blood_pressure"] },
          { services: ["health_thermometer"] },
          { namePrefix: "Apple Watch" },
          { namePrefix: "Fitbit" },
          { namePrefix: "Samsung" },
          { namePrefix: "Garmin" },
        ],
        optionalServices: [
          "heart_rate",
          "blood_pressure",
          "health_thermometer",
          "pulse_oximeter",
          "fitness_machine",
          "user_data",
        ],
      });

      if (device) {
        await connectToDevice(device);
      }
    } catch (error) {
      console.error("Device scan failed:", error);
    } finally {
      setIsScanning(false);
    }
  };

  // Connect to a Bluetooth device
  const connectToDevice = async (bluetoothDevice: BluetoothDevice) => {
    const deviceId = bluetoothDevice.id || bluetoothDevice.name || "unknown";

    // Add device to list if not already present
    const existingDevice = devices.find(
      (d) => d.bluetoothId === bluetoothDevice.id,
    );
    if (!existingDevice) {
      const newDevice: HealthDevice = {
        id: deviceId,
        name: bluetoothDevice.name || "Unknown Device",
        type: getDeviceType(bluetoothDevice.name || ""),
        bluetoothId: bluetoothDevice.id,
        connected: false,
        connecting: true,
        lastSync: new Date(),
        capabilities: getDeviceCapabilities(bluetoothDevice.name || ""),
        permissions: {
          heartRate: false,
          bloodPressure: false,
          temperature: false,
          oxygenSaturation: false,
          steps: false,
          sleep: false,
        },
      };

      setDevices((prev) => [...prev, newDevice]);
    }

    try {
      // Request permissions first
      const permissions = await requestPermissions(deviceId);
      if (!permissions) {
        throw new Error("Permissions denied");
      }

      // Connect to GATT server
      const server = await bluetoothDevice.gatt?.connect();
      if (!server) {
        throw new Error("Failed to connect to GATT server");
      }

      // Update device as connected
      setDevices((prev) =>
        prev.map((device) =>
          device.bluetoothId === bluetoothDevice.id
            ? { ...device, connected: true, connecting: false }
            : device,
        ),
      );

      // Start monitoring health data
      await startMonitoring(bluetoothDevice, server);
    } catch (error) {
      console.error("Connection failed:", error);
      // Update device as failed to connect
      setDevices((prev) =>
        prev.map((device) =>
          device.bluetoothId === bluetoothDevice.id
            ? { ...device, connected: false, connecting: false }
            : device,
        ),
      );
    }
  };

  // Start monitoring health data from connected device
  const startMonitoring = async (
    device: BluetoothDevice,
    server: BluetoothRemoteGATTServer,
  ) => {
    try {
      // Monitor heart rate if available
      if (device.name?.includes("Watch") || device.name?.includes("Fitbit")) {
        await monitorHeartRate(server, device.id || "unknown");
      }

      // Monitor other health metrics based on device capabilities
      // This would be expanded based on specific device protocols

      // Simulate continuous data collection
      startDataSimulation(device.id || "unknown");
    } catch (error) {
      console.error("Monitoring setup failed:", error);
    }
  };

  // Monitor heart rate service
  const monitorHeartRate = async (
    server: BluetoothRemoteGATTServer,
    deviceId: string,
  ) => {
    try {
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic(
        "heart_rate_measurement",
      );

      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", (event) => {
        const value = event.target?.value;
        if (value) {
          const heartRate = value.getUint16(1, true);
          updateVitalData(deviceId, { heartRate });
        }
      });
    } catch (error) {
      console.log("Heart rate monitoring not available:", error);
    }
  };

  // Simulate continuous data collection (for demo purposes)
  const startDataSimulation = (deviceId: string) => {
    const interval = setInterval(() => {
      const simulatedData: Partial<VitalData> = {
        heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 BPM
        bloodPressure: {
          systolic: Math.floor(Math.random() * 30) + 110, // 110-140
          diastolic: Math.floor(Math.random() * 20) + 70, // 70-90
        },
        temperature: Math.random() * 2 + 97.5, // 97.5-99.5°F
        oxygenSaturation: Math.floor(Math.random() * 4) + 96, // 96-100%
        steps: Math.floor(Math.random() * 1000) + 5000, // 5000-6000 steps
        calories: Math.floor(Math.random() * 100) + 200, // 200-300 calories
      };

      updateVitalData(deviceId, simulatedData);
    }, 5000); // Update every 5 seconds

    // Store interval for cleanup
    return interval;
  };

  // Update vital data
  const updateVitalData = (deviceId: string, data: Partial<VitalData>) => {
    const newVitalData: VitalData = {
      deviceId,
      timestamp: new Date(),
      ...data,
    };

    setVitalsData((prev) => [...prev.slice(-50), newVitalData]); // Keep last 50 readings
    setCurrentVitals(newVitalData);

    // Update device last sync time
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId || device.bluetoothId === deviceId
          ? { ...device, lastSync: new Date() }
          : device,
      ),
    );
  };

  // Disconnect from device
  const disconnectDevice = (deviceId: string) => {
    setDevices((prev) =>
      prev.map((device) =>
        device.id === deviceId ? { ...device, connected: false } : device,
      ),
    );
  };

  // Helper functions
  const getDeviceType = (name: string): HealthDevice["type"] => {
    const lowerName = name.toLowerCase();
    if (lowerName.includes("watch")) return "smartwatch";
    if (lowerName.includes("fitbit") || lowerName.includes("tracker"))
      return "fitness_tracker";
    if (lowerName.includes("pressure")) return "blood_pressure";
    if (lowerName.includes("temp")) return "thermometer";
    if (lowerName.includes("oximeter")) return "pulse_oximeter";
    return "smartwatch";
  };

  const getDeviceCapabilities = (name: string): string[] => {
    const capabilities = [];
    const lowerName = name.toLowerCase();

    if (lowerName.includes("watch") || lowerName.includes("fitbit")) {
      capabilities.push("Heart Rate", "Steps", "Sleep", "Calories");
    }
    if (lowerName.includes("pressure")) {
      capabilities.push("Blood Pressure");
    }
    if (lowerName.includes("temp")) {
      capabilities.push("Temperature");
    }
    if (lowerName.includes("oximeter")) {
      capabilities.push("Oxygen Saturation");
    }

    return capabilities.length > 0 ? capabilities : ["Heart Rate", "Activity"];
  };

  const getDeviceIcon = (type: HealthDevice["type"]) => {
    switch (type) {
      case "smartwatch":
        return Watch;
      case "fitness_tracker":
        return Activity;
      case "blood_pressure":
        return Heart;
      case "thermometer":
        return Thermometer;
      case "pulse_oximeter":
        return Droplets;
      default:
        return Watch;
    }
  };

  return (
    <div className="space-y-6">
      {/* Bluetooth Status & Controls */}
      <Card className="border-blue-200 bg-blue-50">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Bluetooth className="w-5 h-5 text-blue-600" />
            <span>Bluetooth Health Monitoring</span>
          </CardTitle>
          <CardDescription>
            Connect your health devices via Bluetooth for real-time monitoring
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!bluetoothSupported ? (
            <Alert className="border-red-200 bg-red-50">
              <AlertTriangle className="h-4 w-4 text-red-600" />
              <AlertDescription>
                Bluetooth is not supported in this browser. Please use Chrome,
                Edge, or a supported browser.
              </AlertDescription>
            </Alert>
          ) : !bluetoothEnabled ? (
            <Alert className="border-yellow-200 bg-yellow-50">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <AlertDescription>
                Bluetooth is not enabled. Please enable Bluetooth in your device
                settings.
              </AlertDescription>
            </Alert>
          ) : (
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <BluetoothConnected className="w-5 h-5 text-green-600" />
                <span className="text-sm font-medium">Bluetooth Ready</span>
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                  Available
                </Badge>
              </div>
              <div className="flex space-x-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowPermissions(!showPermissions)}
                >
                  {showPermissions ? (
                    <EyeOff className="w-4 h-4" />
                  ) : (
                    <Eye className="w-4 h-4" />
                  )}
                  Permissions
                </Button>
                <Button
                  onClick={scanForDevices}
                  disabled={isScanning}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  {isScanning ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Scanning...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="w-4 h-4 mr-2" />
                      Scan for Devices
                    </>
                  )}
                </Button>
              </div>
            </div>
          )}

          {/* Permissions Display */}
          {showPermissions && (
            <Card className="border-gray-200">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">Data Permissions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {[
                    "Heart Rate",
                    "Blood Pressure",
                    "Temperature",
                    "Oxygen Saturation",
                    "Steps",
                    "Sleep",
                  ].map((permission) => (
                    <div
                      key={permission}
                      className="flex items-center space-x-2"
                    >
                      <CheckCircle className="w-4 h-4 text-green-600" />
                      <span className="text-sm">{permission}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </CardContent>
      </Card>

      {/* Connected Devices */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Smartphone className="w-5 h-5 text-green-600" />
            <span>
              Connected Devices ({devices.filter((d) => d.connected).length})
            </span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {devices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <Watch className="w-12 h-12 mx-auto mb-4 opacity-50" />
              <p>No devices connected</p>
              <p className="text-sm">Scan for devices to start monitoring</p>
            </div>
          ) : (
            <div className="space-y-4">
              {devices.map((device) => {
                const IconComponent = getDeviceIcon(device.type);
                return (
                  <div
                    key={device.id}
                    className="flex items-center justify-between p-4 rounded-lg border bg-card"
                  >
                    <div className="flex items-center space-x-4">
                      <div
                        className={`p-2 rounded-lg ${
                          device.connected
                            ? "bg-green-100 text-green-600"
                            : device.connecting
                              ? "bg-yellow-100 text-yellow-600"
                              : "bg-gray-100 text-gray-600"
                        }`}
                      >
                        <IconComponent className="w-5 h-5" />
                      </div>
                      <div>
                        <h3 className="font-medium">{device.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          {device.capabilities.join(", ")}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Last sync: {device.lastSync.toLocaleTimeString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-3">
                      {device.battery && (
                        <div className="flex items-center space-x-1">
                          <Battery className="w-4 h-4 text-muted-foreground" />
                          <span className="text-sm">{device.battery}%</span>
                        </div>
                      )}
                      <Badge
                        variant={
                          device.connected
                            ? "default"
                            : device.connecting
                              ? "secondary"
                              : "outline"
                        }
                      >
                        {device.connecting
                          ? "Connecting..."
                          : device.connected
                            ? "Connected"
                            : "Disconnected"}
                      </Badge>
                      {device.connected && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => disconnectDevice(device.id)}
                        >
                          Disconnect
                        </Button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Current Vitals */}
      {currentVitals && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Heart className="w-5 h-5 text-red-600" />
              <span>Live Health Data</span>
            </CardTitle>
            <CardDescription>
              Real-time data from connected devices
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {currentVitals.heartRate && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Heart className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">Heart Rate</span>
                  </div>
                  <div className="text-2xl font-bold text-red-600">
                    {currentVitals.heartRate}
                    <span className="text-sm text-muted-foreground ml-1">
                      BPM
                    </span>
                  </div>
                </div>
              )}

              {currentVitals.bloodPressure && (
                <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Activity className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Blood Pressure</span>
                  </div>
                  <div className="text-2xl font-bold text-blue-600">
                    {currentVitals.bloodPressure.systolic}/
                    {currentVitals.bloodPressure.diastolic}
                    <span className="text-sm text-muted-foreground ml-1">
                      mmHg
                    </span>
                  </div>
                </div>
              )}

              {currentVitals.temperature && (
                <div className="p-3 rounded-lg bg-orange-50 border border-orange-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Thermometer className="w-4 h-4 text-orange-600" />
                    <span className="text-sm font-medium">Temperature</span>
                  </div>
                  <div className="text-2xl font-bold text-orange-600">
                    {currentVitals.temperature.toFixed(1)}
                    <span className="text-sm text-muted-foreground ml-1">
                      °F
                    </span>
                  </div>
                </div>
              )}

              {currentVitals.oxygenSaturation && (
                <div className="p-3 rounded-lg bg-cyan-50 border border-cyan-200">
                  <div className="flex items-center space-x-2 mb-2">
                    <Droplets className="w-4 h-4 text-cyan-600" />
                    <span className="text-sm font-medium">Oxygen</span>
                  </div>
                  <div className="text-2xl font-bold text-cyan-600">
                    {currentVitals.oxygenSaturation}
                    <span className="text-sm text-muted-foreground ml-1">
                      %
                    </span>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
