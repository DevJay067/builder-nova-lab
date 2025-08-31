import { useState, useEffect, useRef, useCallback } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  ArrowLeft,
  Heart,
  Activity,
  Thermometer,
  Droplets,
  Zap,
  Wifi,
  WifiOff,
  AlertTriangle,
  CheckCircle,
  TrendingUp,
  TrendingDown,
  Clock,
  Smartphone,
  Watch,
  Brain,
  RefreshCw,
  X,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
  RechartsProps,
} from "recharts";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Enhanced IoT device data interface
interface VitalSigns {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
  steps?: number;
  calories?: number;
  distance?: number;
}

interface Device {
  id: string;
  name: string;
  type:
    | "smartwatch"
    | "fitness_tracker"
    | "blood_pressure"
    | "thermometer"
    | "pulse_oximeter";
  status: "connected" | "disconnected" | "syncing" | "error";
  battery: number;
  lastSync: string;
  icon: any;
  errorMessage?: string;
}

interface Alert {
  id: string;
  type: "error" | "warning" | "info" | "success";
  message: string;
  timestamp: string;
  dismissible?: boolean;
}

// Bluetooth device connection state
interface BluetoothDeviceState {
  device: any;
  server: any;
  heartRateService?: any;
  heartRateCharacteristic?: any;
  pulseOximeterService?: any;
  pulseOximeterCharacteristic?: any;
  isConnected: boolean;
  lastDataTimestamp: string;
}

export default function RealTimeMonitoring() {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 98.6,
    oxygenSaturation: 98,
    respiratoryRate: 16,
    timestamp: new Date().toISOString(),
  });

  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [useDemo, setUseDemo] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [uploadToCloud, setUploadToCloud] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'disconnected' | 'connecting' | 'connected' | 'error'>('disconnected');
  const [lastDataUpdate, setLastDataUpdate] = useState<string>('Never');
  
  const isBLESupported = typeof navigator !== "undefined" && !!(navigator as any).bluetooth;
  const bluetoothStateRef = useRef<BluetoothDeviceState | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const dataTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Add alert helper
  const addAlert = useCallback((type: Alert['type'], message: string, dismissible = true) => {
    const newAlert: Alert = {
      id: Date.now().toString(),
      type,
      message,
      timestamp: new Date().toLocaleTimeString(),
      dismissible,
    };
    setAlerts(prev => [newAlert, ...prev.slice(0, 4)]); // Keep only last 5 alerts
  }, []);

  // Dismiss alert
  const dismissAlert = useCallback((alertId: string) => {
    setAlerts(prev => prev.filter(alert => alert.id !== alertId));
  }, []);

  // Clear data timeout
  const clearDataTimeout = useCallback(() => {
    if (dataTimeoutRef.current) {
      clearTimeout(dataTimeoutRef.current);
      dataTimeoutRef.current = null;
    }
  }, []);

  // Set data timeout to detect when device stops sending data
  const setDataTimeout = useCallback(() => {
    clearDataTimeout();
    dataTimeoutRef.current = setTimeout(() => {
      addAlert('warning', 'No data received from device for 30 seconds. Check device connection.');
      setConnectionStatus('error');
    }, 30000);
  }, [addAlert, clearDataTimeout]);

  // Update last data timestamp
  const updateLastDataTimestamp = useCallback(() => {
    const now = new Date();
    setLastDataUpdate(now.toLocaleTimeString());
    setDataTimeout();
  }, [setDataTimeout]);

  // Disconnect Bluetooth device
  const disconnectBluetooth = useCallback(() => {
    if (bluetoothStateRef.current?.device) {
      try {
        if (bluetoothStateRef.current.heartRateCharacteristic) {
          bluetoothStateRef.current.heartRateCharacteristic.stopNotifications();
        }
        if (bluetoothStateRef.current.pulseOximeterCharacteristic) {
          bluetoothStateRef.current.pulseOximeterCharacteristic.stopNotifications();
        }
        if (bluetoothStateRef.current.server) {
          bluetoothStateRef.current.server.disconnect();
        }
      } catch (error) {
        console.warn('Error during disconnect:', error);
      }
    }
    
    bluetoothStateRef.current = null;
    setBleDeviceName(null);
    setConnectionStatus('disconnected');
    setConnectedDevices([]);
    clearDataTimeout();
    clearReconnectTimeout();
  }, [clearDataTimeout]);

  // Clear reconnect timeout
  const clearReconnectTimeout = useCallback(() => {
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  }, []);

  // Attempt to reconnect to Bluetooth device
  const attemptReconnect = useCallback(() => {
    if (bluetoothStateRef.current?.device) {
      addAlert('info', 'Attempting to reconnect to device...');
      // Trigger reconnection by calling the connect function
      setTimeout(() => {
        if (bluetoothStateRef.current?.device) {
          connectBluetooth();
        }
      }, 100);
    }
  }, [addAlert]);

  // Attempt SSE connection; fallback to simulation
  useEffect(() => {
    let simulateInterval: any = null;
    let eventSource: EventSource | null = null;

    function startSimulation() {
      if (simulateInterval) return;
      simulateInterval = setInterval(() => {
        const now = new Date();
        const newVitals: VitalSigns = {
          heartRate: Math.floor(Math.random() * 20) + 65,
          bloodPressure: {
            systolic: Math.floor(Math.random() * 20) + 110,
            diastolic: Math.floor(Math.random() * 15) + 70,
          },
          temperature: Math.random() * 2 + 97.5,
          oxygenSaturation: Math.floor(Math.random() * 3) + 97,
          respiratoryRate: Math.floor(Math.random() * 6) + 14,
          timestamp: now.toISOString(),
        };
        setVitalSigns(newVitals);
        setVitalsHistory((prev) => {
          const newHistory = [
            ...prev,
            {
              time: now.toLocaleTimeString(),
              heartRate: newVitals.heartRate,
              temperature: newVitals.temperature,
              oxygenSat: newVitals.oxygenSaturation,
              systolic: newVitals.bloodPressure.systolic,
            },
          ].slice(-20);
          return newHistory;
        });
      }, 3000);
    }

    function stopSimulation() {
      if (simulateInterval) {
        clearInterval(simulateInterval);
        simulateInterval = null;
      }
    }

    try {
      const token = localStorage.getItem("sessionToken");
      const url = useDemo
        ? `/api/iot/stream?simulate=true`
        : token
          ? `/api/iot/stream?token=${encodeURIComponent(token)}`
          : "";

      if (!url) {
        // no session and not in demo -> no SSE
      } else {
        eventSource = new EventSource(url);

        eventSource.addEventListener("vitals", (evt: MessageEvent) => {
          try {
            const payload = JSON.parse((evt as any).data || (evt as any).detail || "{}");
            const now = new Date(payload.timestamp || new Date().toISOString());
            const heartRate = payload?.metrics?.heartRate ?? vitalSigns.heartRate;
            const spo2 = payload?.metrics?.spo2 ?? vitalSigns.oxygenSaturation;
            const steps = payload?.metrics?.steps;
            const calories = payload?.metrics?.calories;
            const distance = payload?.metrics?.distance;
            const updated: VitalSigns = {
              heartRate,
              bloodPressure: vitalSigns.bloodPressure,
              temperature: vitalSigns.temperature,
              oxygenSaturation: spo2,
              respiratoryRate: vitalSigns.respiratoryRate,
              timestamp: now.toISOString(),
              steps,
              calories,
              distance,
            };
            setVitalSigns(updated);
            setVitalsHistory((prev) => [
              ...prev,
              {
                time: now.toLocaleTimeString(),
                heartRate: updated.heartRate,
                temperature: updated.temperature,
                oxygenSat: updated.oxygenSaturation,
                systolic: updated.bloodPressure.systolic,
                steps: updated.steps,
              },
            ].slice(-20));
          } catch {}
        });

        eventSource.addEventListener("ready", () => {
          stopSimulation();
        });

        eventSource.onerror = () => {
          if (useDemo) startSimulation();
        };
      }

      if (useDemo) startSimulation();
    } catch {
      if (useDemo) startSimulation();
    }

    return () => {
      stopSimulation();
      if (eventSource) {
        eventSource.close();
      }
    };
  }, [useDemo]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      disconnectBluetooth();
      clearDataTimeout();
      clearReconnectTimeout();
    };
  }, [disconnectBluetooth, clearDataTimeout, clearReconnectTimeout]);

  // Enhanced Web Bluetooth: connect and stream heart rate (and optional SpO2)
  const connectBluetooth = useCallback(async () => {
    try {
      if (!isBLESupported) {
        addAlert('error', 'Web Bluetooth is not supported in this browser. Please use Chrome or Edge.');
        return;
      }

      setIsConnecting(true);
      setConnectionStatus('connecting');
      addAlert('info', 'Requesting Bluetooth device...');

      // Request device with specific filters for health devices
      const device = await (navigator as any).bluetooth.requestDevice({
        filters: [
          { services: [0x180D] }, // Heart Rate Service
          { services: [0x1822] }, // Pulse Oximeter Service
          { namePrefix: 'Apple Watch' },
          { namePrefix: 'Fitbit' },
          { namePrefix: 'Garmin' },
          { namePrefix: 'Polar' },
          { namePrefix: 'Samsung' },
        ],
        optionalServices: [0x180D, 0x1822, 0x180F, 0x1812], // Heart Rate, Pulse Oximeter, Battery, HID
      });

      setBleDeviceName(device.name || "Unknown Device");
      addAlert('success', `Connected to ${device.name || 'Bluetooth device'}`);

      // Update connected devices
      setConnectedDevices([{
        id: device.id || "ble-device",
        name: device.name || "Bluetooth Health Device",
        type: "smartwatch",
        status: "connected",
        battery: 0,
        lastSync: "Just now",
        icon: Watch,
      }]);

      // Connect to GATT server
      addAlert('info', 'Connecting to device services...');
      const server = await device.gatt.connect();
      
      // Store device state
      bluetoothStateRef.current = {
        device,
        server,
        isConnected: true,
        lastDataTimestamp: new Date().toISOString(),
      };

      setConnectionStatus('connected');
      updateLastDataTimestamp();

      // Listen for disconnection events
      device.addEventListener('gattserverdisconnected', () => {
        addAlert('warning', 'Device disconnected. Attempting to reconnect...');
        setConnectionStatus('error');
        setConnectedDevices([]);
        setBleDeviceName(null);
        clearDataTimeout();
        
        // Attempt reconnection after 5 seconds
        clearReconnectTimeout();
        reconnectTimeoutRef.current = setTimeout(attemptReconnect, 5000);
      });

      // Heart Rate Service (0x180D)
      try {
        addAlert('info', 'Setting up heart rate monitoring...');
        const hrService = await server.getPrimaryService(0x180D);
        const hrChar = await hrService.getCharacteristic(0x2A37); // Heart Rate Measurement
        await hrChar.startNotifications();
        
        bluetoothStateRef.current.heartRateService = hrService;
        bluetoothStateRef.current.heartRateCharacteristic = hrChar;

        hrChar.addEventListener("characteristicvaluechanged", (event: any) => {
          try {
            const value: DataView = event.target.value;
            const flags = value.getUint8(0);
            const hr16 = flags & 0x01;
            const heartRate = hr16 ? value.getUint16(1, true) : value.getUint8(1);

            // Validate heart rate value
            if (heartRate > 0 && heartRate < 300) {
              const now = new Date();
              setVitalSigns((prev) => {
                const updated = {
                  ...prev,
                  heartRate,
                  timestamp: now.toISOString(),
                };
                
                // Update history
                setVitalsHistory((prevHist) => [
                  ...prevHist,
                  {
                    time: now.toLocaleTimeString(),
                    heartRate: updated.heartRate,
                    temperature: updated.temperature,
                    oxygenSat: updated.oxygenSaturation,
                    systolic: updated.bloodPressure.systolic,
                  },
                ].slice(-50));
                
                return updated;
              });

              updateLastDataTimestamp();

              // Upload to cloud if enabled
              if (uploadToCloud) {
                const token = localStorage.getItem("sessionToken");
                if (token) {
                  fetch("/api/iot/ingest", {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json", 
                      Authorization: `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                      deviceId: device.id,
                      deviceType: "bluetooth_heart_rate",
                      metrics: { heartRate },
                      timestamp: now.toISOString(),
                    }),
                  }).catch((error) => {
                    console.warn('Failed to upload heart rate data:', error);
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error processing heart rate data:', error);
            addAlert('error', 'Error processing heart rate data from device');
          }
        });

        addAlert('success', 'Heart rate monitoring active');
      } catch (error) {
        console.warn('Heart rate service not available:', error);
        addAlert('warning', 'Heart rate service not available on this device');
      }

      // Pulse Oximeter Service (0x1822) - Optional
      try {
        addAlert('info', 'Setting up pulse oximeter monitoring...');
        const plxService = await server.getPrimaryService(0x1822);
        const plxChar = await plxService.getCharacteristic(0x2A5F); // Continuous Measurement
        await plxChar.startNotifications();
        
        bluetoothStateRef.current.pulseOximeterService = plxService;
        bluetoothStateRef.current.pulseOximeterCharacteristic = plxChar;

        plxChar.addEventListener("characteristicvaluechanged", (event: any) => {
          try {
            const dv: DataView = event.target.value;
            
            // Parse SpO2 value - this varies by device manufacturer
            const spo2 = (() => {
              if (dv.byteLength >= 3) {
                // Try different parsing methods based on common device formats
                try {
                  // Method 1: Direct byte value (common in some devices)
                  const directValue = dv.getUint8(1);
                  if (directValue > 0 && directValue <= 100) {
                    return directValue;
                  }
                  
                  // Method 2: IEEE-11073 16-bit SFLOAT format
                  const raw = dv.getUint16(1, true);
                  const mantissa = ((raw & 0x0FFF) << 20) >> 20; // sign extend 12-bit
                  const exp = ((raw >> 12) & 0x000F) >= 0x0008 ? ((raw >> 12) | 0xFFF0) : (raw >> 12);
                  const value = mantissa * Math.pow(10, exp);
                  return Math.round(value);
                } catch {
                  // Method 3: Simple offset (some devices)
                  const offsetValue = dv.getUint8(1) - 128;
                  if (offsetValue > 0 && offsetValue <= 100) {
                    return offsetValue;
                  }
                }
              }
              return undefined;
            })();

            if (typeof spo2 === "number" && spo2 > 0 && spo2 <= 100) {
              const now = new Date();
              setVitalSigns((prev) => {
                const updated = { 
                  ...prev, 
                  oxygenSaturation: spo2, 
                  timestamp: now.toISOString() 
                };
                
                // Update history
                setVitalsHistory((prevHist) => [
                  ...prevHist,
                  {
                    time: now.toLocaleTimeString(),
                    heartRate: updated.heartRate,
                    temperature: updated.temperature,
                    oxygenSat: updated.oxygenSaturation,
                    systolic: updated.bloodPressure.systolic,
                  },
                ].slice(-50));
                
                return updated;
              });

              updateLastDataTimestamp();

              // Upload to cloud if enabled
              if (uploadToCloud) {
                const token = localStorage.getItem("sessionToken");
                if (token) {
                  fetch("/api/iot/ingest", {
                    method: "POST",
                    headers: { 
                      "Content-Type": "application/json", 
                      Authorization: `Bearer ${token}` 
                    },
                    body: JSON.stringify({
                      deviceId: device.id,
                      deviceType: "bluetooth_pulse_oximeter",
                      metrics: { spo2 },
                      timestamp: now.toISOString(),
                    }),
                  }).catch((error) => {
                    console.warn('Failed to upload SpO2 data:', error);
                  });
                }
              }
            }
          } catch (error) {
            console.error('Error processing SpO2 data:', error);
            addAlert('error', 'Error processing SpO2 data from device');
          }
        });

        addAlert('success', 'Pulse oximeter monitoring active');
      } catch (error) {
        console.warn('Pulse oximeter service not available:', error);
        addAlert('info', 'Pulse oximeter service not available on this device');
      }

      // Battery Service (0x180F) - Optional
      try {
        const batteryService = await server.getPrimaryService(0x180F);
        const batteryChar = await batteryService.getCharacteristic(0x2A19); // Battery Level
        const batteryValue = await batteryChar.readValue();
        const batteryLevel = batteryValue.getUint8(0);
        
        setConnectedDevices(prev => prev.map(device => ({
          ...device,
          battery: batteryLevel,
        })));
      } catch (error) {
        console.warn('Battery service not available:', error);
      }

    } catch (error: any) {
      console.error('Bluetooth connection error:', error);
      
      if (error.name === 'NotFoundError') {
        addAlert('error', 'No Bluetooth device selected or device not found');
      } else if (error.name === 'NotAllowedError') {
        addAlert('error', 'Bluetooth permission denied. Please allow access to Bluetooth devices.');
      } else if (error.name === 'NetworkError') {
        addAlert('error', 'Connection failed. Please ensure the device is turned on and in range.');
      } else {
        addAlert('error', `Connection failed: ${error.message || 'Unknown error'}`);
      }
      
      setConnectionStatus('error');
      setBleDeviceName(null);
      setConnectedDevices([]);
    } finally {
      setIsConnecting(false);
    }
  }, [isBLESupported, addAlert, updateLastDataTimestamp, uploadToCloud, clearDataTimeout, clearReconnectTimeout]);

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case "heartRate":
        if (value < 60) return { status: "low", color: "text-blue-600" };
        if (value > 100) return { status: "high", color: "text-red-600" };
        return { status: "normal", color: "text-green-600" };
      case "bloodPressure":
        if (value > 140) return { status: "high", color: "text-red-600" };
        if (value < 90) return { status: "low", color: "text-blue-600" };
        return { status: "normal", color: "text-green-600" };
      case "temperature":
        if (value > 100.4) return { status: "fever", color: "text-red-600" };
        if (value < 97) return { status: "low", color: "text-blue-600" };
        return { status: "normal", color: "text-green-600" };
      case "oxygenSat":
        if (value < 95) return { status: "low", color: "text-red-600" };
        return { status: "normal", color: "text-green-600" };
      default:
        return { status: "normal", color: "text-green-600" };
    }
  };

  const heartRateStatus = getVitalStatus("heartRate", vitalSigns.heartRate);
  const bpStatus = getVitalStatus(
    "bloodPressure",
    vitalSigns.bloodPressure.systolic,
  );
  const tempStatus = getVitalStatus("temperature", vitalSigns.temperature);
  const oxygenStatus = getVitalStatus("oxygenSat", vitalSigns.oxygenSaturation);

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-blue-50 page-transition">
      {/* Enhanced Header */}
      <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4 fade-in">
              <Link to="/">
                <Button variant="ghost" size="sm" className="btn-smooth">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-3">
                <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-blue-500 to-cyan-600 text-white shadow-lg shadow-blue-500/25 transform-smooth hover:scale-110">
                  <Activity className="h-6 w-6" />
                </div>
                <div>
                  <h1 className="text-xl font-bold text-slate-800">
                    Real-time Health Monitoring
                  </h1>
                  <p className="text-sm text-slate-600 font-medium">
                    Live IoT Device Integration
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3 fade-in fade-in-delay-1">
              <Badge
                variant="secondary"
                className={`${
                  connectionStatus === 'connected' 
                    ? 'bg-green-50 text-green-700 border-green-200' 
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-50 text-yellow-700 border-yellow-200'
                    : 'bg-red-50 text-red-700 border-red-200'
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectionStatus === 'connected' 
                    ? 'bg-green-500 animate-pulse' 
                    : connectionStatus === 'connecting'
                    ? 'bg-yellow-500 animate-spin'
                    : 'bg-red-500'
                }`}></div>
                {connectionStatus === 'connected' ? 'Live Monitoring' : 
                 connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
              </Badge>
              <Badge variant="outline" className="text-slate-600">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleTimeString()}
              </Badge>
              <div className="flex items-center space-x-2">
                <Label htmlFor="demo-mode" className="text-xs text-slate-600">Demo Mode</Label>
                <Switch id="demo-mode" checked={useDemo} onCheckedChange={setUseDemo} />
              </div>
              <div className="flex items-center space-x-2">
                <Label htmlFor="cloud-upload" className="text-xs text-slate-600">Upload to Cloud</Label>
                <Switch id="cloud-upload" checked={uploadToCloud} onCheckedChange={setUploadToCloud} />
              </div>
              <div className="flex items-center space-x-2">
                {connectionStatus === 'connected' ? (
                  <Button 
                    size="sm" 
                    variant="outline" 
                    className="btn-smooth" 
                    onClick={disconnectBluetooth}
                  >
                    <X className="w-4 h-4 mr-2" />
                    Disconnect
                  </Button>
                ) : (
                  <Button 
                    size="sm" 
                    className="btn-smooth" 
                    onClick={connectBluetooth} 
                    disabled={!isBLESupported || isConnecting}
                  >
                    {isConnecting ? (
                      <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                    ) : (
                      <Watch className="w-4 h-4 mr-2" />
                    )}
                    {isConnecting ? "Connecting..." : bleDeviceName ? "Reconnect" : "Connect Device"}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Enhanced Device Status */}
        {bleDeviceName && (
          <div className="mb-4">
            <Card className="shadow-colored border-border/50">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <div className={`p-2 rounded-lg ${
                    connectionStatus === 'connected' 
                      ? 'bg-green-100 text-green-700' 
                      : connectionStatus === 'connecting'
                      ? 'bg-yellow-100 text-yellow-700'
                      : 'bg-red-100 text-red-700'
                  }`}>
                    <Watch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{bleDeviceName}</div>
                    <div className="text-xs text-muted-foreground">
                      Last update: {lastDataUpdate}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Badge variant="secondary" className="text-xs">
                    {connectionStatus === 'connected' ? 'BLE Connected' : 
                     connectionStatus === 'connecting' ? 'Connecting...' : 'Disconnected'}
                  </Badge>
                  {connectionStatus === 'error' && (
                    <Button 
                      size="sm" 
                      variant="ghost" 
                      onClick={attemptReconnect}
                      className="text-xs"
                    >
                      <RefreshCw className="w-3 h-3 mr-1" />
                      Retry
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
        )}
        {/* Enhanced Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3 fade-in">
            {alerts.map((alert) => (
              <Alert
                key={alert.id}
                className={`border-l-4 ${
                  alert.type === "error"
                    ? "border-red-500 bg-red-50"
                    : alert.type === "warning"
                      ? "border-yellow-500 bg-yellow-50"
                      : alert.type === "success"
                        ? "border-green-500 bg-green-50"
                        : "border-blue-500 bg-blue-50"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium flex items-center justify-between">
                  <span>{alert.message}</span>
                  <div className="flex items-center space-x-2">
                    <span className="text-sm text-muted-foreground">
                      {alert.timestamp}
                    </span>
                    {alert.dismissible && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => dismissAlert(alert.id)}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Live Vital Signs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Heart Rate */}
          <Card className="card-hover shadow-colored border-border/50 fade-in">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Heart className={`w-5 h-5 ${heartRateStatus.color}`} />
                  <CardTitle className="text-sm font-medium">
                    Heart Rate
                  </CardTitle>
                </div>
                <Badge
                  variant={
                    heartRateStatus.status === "normal"
                      ? "default"
                      : "destructive"
                  }
                >
                  {heartRateStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.heartRate}
                <span className="text-lg text-muted-foreground ml-1">BPM</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                Normal range: 60-100 BPM
              </div>
            </CardContent>
          </Card>

          {/* Blood Pressure */}
          <Card className="card-hover shadow-colored border-border/50 fade-in fade-in-delay-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className={`w-5 h-5 ${bpStatus.color}`} />
                  <CardTitle className="text-sm font-medium">
                    Blood Pressure
                  </CardTitle>
                </div>
                <Badge
                  variant={
                    bpStatus.status === "normal" ? "default" : "destructive"
                  }
                >
                  {bpStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.bloodPressure.systolic}
                <span className="text-xl text-muted-foreground">
                  /{vitalSigns.bloodPressure.diastolic}
                </span>
                <span className="text-lg text-muted-foreground ml-1">mmHg</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-green-600" />
                Target: &lt;120/80 mmHg
              </div>
            </CardContent>
          </Card>

          {/* Temperature */}
          <Card className="card-hover shadow-colored border-border/50 fade-in fade-in-delay-2">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Thermometer className={`w-5 h-5 ${tempStatus.color}`} />
                  <CardTitle className="text-sm font-medium">
                    Temperature
                  </CardTitle>
                </div>
                <Badge
                  variant={
                    tempStatus.status === "normal" ? "default" : "destructive"
                  }
                >
                  {tempStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.temperature.toFixed(1)}
                <span className="text-lg text-muted-foreground ml-1">°F</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                Normal: 97-99°F
              </div>
            </CardContent>
          </Card>

          {/* Oxygen Saturation */}
          <Card className="card-hover shadow-colored border-border/50 fade-in fade-in-delay-3">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Droplets className={`w-5 h-5 ${oxygenStatus.color}`} />
                  <CardTitle className="text-sm font-medium">
                    Oxygen Saturation
                  </CardTitle>
                </div>
                <Badge
                  variant={
                    oxygenStatus.status === "normal" ? "default" : "destructive"
                  }
                >
                  {oxygenStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.oxygenSaturation}
                <span className="text-lg text-muted-foreground ml-1">%</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                Normal: &gt;95%
              </div>
            </CardContent>
          </Card>
          {/* Steps */}
          <Card className="card-hover shadow-colored border-border/50 fade-in fade-in-delay-4">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className="w-5 h-5 text-purple-600" />
                  <CardTitle className="text-sm font-medium">Steps</CardTitle>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.steps ?? 0}
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-purple-600" />
                Today’s steps
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts and Device Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Vital Signs Chart */}
          <div className="lg:col-span-2">
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-4">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                  Live Vital Signs Trends
                </CardTitle>
                <CardDescription>
                  Real-time data from connected IoT health devices
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={vitalsHistory}>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        className="opacity-30"
                      />
                      <XAxis dataKey="time" className="text-xs" />
                      <YAxis className="text-xs" />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                        name="Heart Rate (BPM)"
                      />
                      <Line
                        type="monotone"
                        dataKey="oxygenSat"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        name="Oxygen Saturation (%)"
                      />
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                        name="Systolic BP (mmHg)"
                      />
                      {vitalsHistory.some((d) => typeof d.steps === "number") && (
                        <Line
                          type="monotone"
                          dataKey="steps"
                          stroke="#8b5cf6"
                          strokeWidth={2}
                          dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
                          name="Steps"
                        />
                      )}
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connected Devices */}
          <div>
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-green-600" />
                  Connected Devices
                </CardTitle>
                <CardDescription>IoT health monitoring devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedDevices.length > 0 ? (
                  connectedDevices.map((device) => {
                    const IconComponent = device.icon;
                    return (
                      <div
                        key={device.id}
                        className="flex items-center justify-between p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div
                            className={`p-2 rounded-lg ${
                              device.status === "connected"
                                ? "bg-green-100 text-green-600"
                                : device.status === "syncing"
                                  ? "bg-yellow-100 text-yellow-600"
                                  : "bg-red-100 text-red-600"
                            }`}
                          >
                            <IconComponent className="w-4 h-4" />
                          </div>
                          <div>
                            <p className="font-medium text-sm">{device.name}</p>
                            <p className="text-xs text-muted-foreground">
                              {device.lastSync}
                            </p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          <div className="text-xs text-muted-foreground">
                            {device.battery}%
                          </div>
                          <Progress value={device.battery} className="w-12 h-2" />
                          {device.status === "connected" ? (
                            <Wifi className="w-4 h-4 text-green-600" />
                          ) : device.status === "syncing" ? (
                            <Zap className="w-4 h-4 text-yellow-600 animate-pulse" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-red-600" />
                          )}
                        </div>
                      </div>
                    );
                  })
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <Watch className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-sm">No devices connected</p>
                    <p className="text-xs">Connect a Bluetooth health device to start monitoring</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
