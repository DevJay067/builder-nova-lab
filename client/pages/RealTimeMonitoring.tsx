import { useState, useEffect, useRef } from "react";
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
  Phone,
  Bell,
  BellOff,
  Droplet,
  Moon,
  Sunrise,
  Bed,
  Volume2,
  VolumeX,
  Play,
  Pause,
  RotateCcw,
  Settings,
  Bug,
  Database,
  Signal,
  Battery,
  Wifi as WifiIcon,
  Bluetooth,
  Cellular,
  RefreshCw,
  Shield,
  AlertCircle,
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
  PieChart,
  Pie,
  Cell,
} from "recharts";
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Enhanced IoT device data interface
interface VitalSigns {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
  steps?: number;
  battery?: number;
  sleepData?: {
    sleepStage: 'awake' | 'light' | 'deep' | 'rem';
    sleepDuration: number;
    sleepQuality: number;
    sleepEfficiency: number;
  };
  waterIntake?: {
    dailyGoal: number;
    currentIntake: number;
    lastDrink: string;
  };
  deviceInfo?: {
    deviceId: string;
    deviceName: string;
    connectionType: 'bluetooth' | 'wifi' | 'cellular';
    signalStrength: number;
    lastSync: string;
  };
}

interface Device {
  id: string;
  name: string;
  type: "smartwatch" | "fitness_tracker" | "blood_pressure" | "thermometer" | "pulse_oximeter";
  status: "connected" | "disconnected" | "syncing" | "error";
  battery: number;
  lastSync: string;
  icon: any;
  signalStrength: number;
  connectionType: 'bluetooth' | 'wifi' | 'cellular';
}

interface Alarm {
  id: string;
  time: string;
  days: string[];
  enabled: boolean;
  type: 'sleep' | 'water' | 'medication' | 'exercise';
  label: string;
  sound: string;
  vibration: boolean;
}

interface WaterReminder {
  id: string;
  interval: number;
  enabled: boolean;
  lastReminder: string;
  nextReminder: string;
  message: string;
}

interface EmergencyContact {
  name: string;
  number: string;
  type: 'emergency' | 'medical' | 'personal';
  priority: number;
}

export default function RealTimeMonitoring() {
  // Core state
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 98.6,
    oxygenSaturation: 98,
    respiratoryRate: 16,
    timestamp: new Date().toISOString(),
    sleepData: {
      sleepStage: 'awake',
      sleepDuration: 0,
      sleepQuality: 85,
      sleepEfficiency: 90
    },
    waterIntake: {
      dailyGoal: 2000,
      currentIntake: 0,
      lastDrink: new Date().toISOString()
    },
    deviceInfo: {
      deviceId: 'demo_device',
      deviceName: 'Demo Smartwatch',
      connectionType: 'bluetooth',
      signalStrength: 85,
      lastSync: new Date().toISOString()
    }
  });

  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);
  const [alerts, setAlerts] = useState<any[]>([]);
  
  // Connection state
  const [bluetoothSupported, setBluetoothSupported] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [useMock, setUseMock] = useState<boolean>(false);
  const [isMockRunning, setIsMockRunning] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<"sse" | "mock" | "ble">("sse");
  
  // Alarm and reminder state
  const [alarms, setAlarms] = useState<Alarm[]>([]);
  const [waterReminders, setWaterReminders] = useState<WaterReminder[]>([
    {
      id: 'water_5min',
      interval: 5,
      enabled: true,
      lastReminder: new Date().toISOString(),
      nextReminder: new Date(Date.now() + 5 * 60 * 1000).toISOString(),
      message: 'Time to drink water! 💧'
    },
    {
      id: 'water_30min',
      interval: 30,
      enabled: true,
      lastReminder: new Date().toISOString(),
      nextReminder: new Date(Date.now() + 30 * 60 * 1000).toISOString(),
      message: 'Stay hydrated! Drink water now 🚰'
    },
    {
      id: 'water_60min',
      interval: 60,
      enabled: true,
      lastReminder: new Date().toISOString(),
      nextReminder: new Date(Date.now() + 60 * 60 * 1000).toISOString(),
      message: 'Hydration reminder: Time for water! 💦'
    }
  ]);
  
  // Emergency contacts
  const [emergencyContacts] = useState<EmergencyContact[]>([
    { name: "Emergency Services", number: "112", type: "emergency", priority: 1 },
    { name: "Medical Emergency", number: "108", type: "medical", priority: 2 },
    { name: "Mental Health Crisis", number: "9152987821", type: "medical", priority: 3 }
  ]);
  
  // Debug state
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [dataLog, setDataLog] = useState<any[]>([]);
  
  // Refs
  const esRef = useRef<EventSource | null>(null);
  const simRef = useRef<any>(null);
  const waterReminderRef = useRef<any>(null);
  const alarmAudioRef = useRef<HTMLAudioElement | null>(null);

  // Initialize component
  useEffect(() => {
    setBluetoothSupported(!!(navigator as any).bluetooth);
    initializeMonitoring();
    setupWaterReminders();
    setupAlarms();
    
    return () => {
      cleanup();
    };
  }, []);

  const initializeMonitoring = () => {
    let fallbackInterval: any;
    let es: EventSource | null = null;

    const handleVitals = (newVitals: VitalSigns) => {
      const now = new Date(newVitals.timestamp);
      setVitalSigns(newVitals);
      setVitalsHistory((prev) =>
        [
          ...prev,
          {
            time: now.toLocaleTimeString(),
            heartRate: newVitals.heartRate,
            temperature: newVitals.temperature,
            oxygenSat: newVitals.oxygenSaturation,
            systolic: newVitals.bloodPressure.systolic,
            steps: newVitals.steps ?? 0,
          },
        ].slice(-20),
      );
      
      // Critical alert detection
      checkCriticalAlerts(newVitals);
    };

    try {
      es = new EventSource("/api/vitals/stream");
      esRef.current = es;
      es.onmessage = (evt) => {
        if (dataSource !== "sse") return;
        try {
          const data = JSON.parse(evt.data);
          if (data && data.heartRate) handleVitals(data);
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (dataSource === "sse") {
          fallbackInterval = startLocalSimulation(handleVitals);
          simRef.current = fallbackInterval;
        }
      };
    } catch {
      if (dataSource === "sse") {
        fallbackInterval = startLocalSimulation(handleVitals);
        simRef.current = fallbackInterval;
      }
    }
  };

  const checkCriticalAlerts = (vitals: VitalSigns) => {
    const hr = vitals.heartRate;
    const bpSys = vitals.bloodPressure.systolic;
    const spo2 = vitals.oxygenSaturation;
    
    if (hr > 120 || bpSys > 160 || spo2 < 92) {
      setAlerts((prev) => [
        {
          id: Date.now(),
          type: "warning",
          message: `Unusual vitals detected (HR:${hr} BPM, BP:${bpSys} mmHg, SpO2:${spo2}%)`,
          timestamp: "Just now",
          severity: "high",
        },
        ...prev.slice(0, 4),
      ]);
    }
  };

  const setupWaterReminders = () => {
    waterReminderRef.current = setInterval(() => {
      const now = new Date();
      setWaterReminders(prev => 
        prev.map(reminder => {
          if (reminder.enabled && new Date(reminder.nextReminder) <= now) {
            // Show water reminder
            toast.info(reminder.message, {
              duration: 10000,
              action: {
                label: "Dismiss",
                onClick: () => {}
              }
            });
            
            // Update next reminder
            return {
              ...reminder,
              lastReminder: now.toISOString(),
              nextReminder: new Date(now.getTime() + reminder.interval * 60 * 1000).toISOString()
            };
          }
          return reminder;
        })
      );
    }, 60000); // Check every minute
  };

  const setupAlarms = () => {
    // Initialize default alarms
    const defaultAlarms: Alarm[] = [
      {
        id: 'sleep_reminder',
        time: '22:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
        enabled: true,
        type: 'sleep',
        label: 'Sleep Time',
        sound: 'gentle',
        vibration: true
      },
      {
        id: 'wake_up',
        time: '07:00',
        days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        enabled: true,
        type: 'sleep',
        label: 'Wake Up',
        sound: 'alarm',
        vibration: true
      }
    ];
    setAlarms(defaultAlarms);
  };

  const cleanup = () => {
    if (esRef.current) esRef.current.close();
    if (simRef.current) clearInterval(simRef.current);
    if (waterReminderRef.current) clearInterval(waterReminderRef.current);
  };

  // Bluetooth connection functions
  const connectBluetoothDevice = async () => {
    if (!(navigator as any).bluetooth) {
      toast.error("Web Bluetooth not supported. Using mock data.");
      await startMockStream();
      return;
    }
    
    try {
      setIsConnecting(true);
      setDataSource("ble");
      
      // Stop existing connections
      if (esRef.current) {
        esRef.current.close();
        esRef.current = null;
      }
      if (simRef.current) {
        clearInterval(simRef.current);
        simRef.current = null;
      }

      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [
          "heart_rate",
          0x1810, // blood pressure
          0x1809, // health thermometer
          0x1822, // pulse oximeter
          0x180f, // battery service
          0x1814, // running speed and cadence
        ],
      });

      setBtDeviceName(device?.name || "Bluetooth Device");
      
      const server = await device.gatt.connect();
      
      device.addEventListener("gattserverdisconnected", () => {
        setBtDeviceName(null);
        setDataSource("sse");
        toast.message("Device disconnected. Resuming SSE");
      });

      // Connect to various health services
      await connectToHealthServices(server);
      
      toast.success("Connected to Bluetooth device successfully");
      
    } catch (e) {
      console.error("Bluetooth connection failed:", e);
      toast.error("Bluetooth connection failed. Starting mock data.");
      await startMockStream();
    } finally {
      setIsConnecting(false);
    }
  };

  const connectToHealthServices = async (server: any) => {
    // Heart Rate Service
    try {
      const service = await server.getPrimaryService("heart_rate");
      const characteristic = await service.getCharacteristic("heart_rate_measurement");
      await characteristic.startNotifications();
      characteristic.addEventListener("characteristicvaluechanged", (event: any) => {
        const value = event.target.value as DataView;
        let flags = value.getUint8(0);
        let rate16 = flags & 0x1;
        let index = 1;
        const heartRate = rate16 ? value.getUint16(index, true) : value.getUint8(index);
        
        setVitalSigns(prev => ({
          ...prev,
          heartRate,
          timestamp: new Date().toISOString()
        }));
      });
      toast.success("Connected to Heart Rate service");
    } catch (error) {
      console.log("Heart Rate service not available");
    }

    // Add other service connections here...
  };

  // Mock data functions
  const startMockStream = async () => {
    try {
      await fetch("/api/vitals/mock/start", { method: "POST" });
      setIsMockRunning(true);
      setUseMock(true);
      setDataSource("mock");
      toast.success("Mock data started");
    } catch (error) {
      console.error("Failed to start mock data:", error);
      toast.error("Failed to start mock data");
    }
  };

  const stopMockStream = async () => {
    try {
      await fetch("/api/vitals/mock/stop", { method: "POST" });
      setIsMockRunning(false);
      setUseMock(false);
      setDataSource("sse");
      toast.message("Mock data stopped");
    } catch (error) {
      console.error("Failed to stop mock data:", error);
    }
  };

  const startLocalSimulation = (cb: (v: VitalSigns) => void) => {
    return setInterval(() => {
      const now = new Date();
      cb({
        heartRate: Math.floor(Math.random() * 20) + 65,
        bloodPressure: {
          systolic: Math.floor(Math.random() * 20) + 110,
          diastolic: Math.floor(Math.random() * 15) + 70,
        },
        temperature: Math.random() * 2 + 97.5,
        oxygenSaturation: Math.floor(Math.random() * 3) + 97,
        respiratoryRate: Math.floor(Math.random() * 6) + 14,
        timestamp: now.toISOString(),
        steps: Math.floor(Math.random() * 100),
        battery: Math.floor(Math.random() * 30) + 70,
        sleepData: {
          sleepStage: ['awake', 'light', 'deep', 'rem'][Math.floor(Math.random() * 4)] as any,
          sleepDuration: Math.floor(Math.random() * 480),
          sleepQuality: Math.floor(Math.random() * 40) + 60,
          sleepEfficiency: Math.floor(Math.random() * 30) + 70
        },
        waterIntake: {
          dailyGoal: 2000,
          currentIntake: Math.floor(Math.random() * 1500),
          lastDrink: new Date(Date.now() - Math.random() * 3600000).toISOString()
        },
        deviceInfo: {
          deviceId: 'local_sim_device',
          deviceName: 'Local Simulation',
          connectionType: 'bluetooth',
          signalStrength: Math.floor(Math.random() * 30) + 70,
          lastSync: now.toISOString()
        }
      });
    }, 3000);
  };

  // Debug functions
  const fetchSystemStatus = async () => {
    try {
      const response = await fetch("/api/vitals/system-status");
      const data = await response.json();
      setSystemStatus(data.status);
    } catch (error) {
      console.error("Failed to fetch system status:", error);
    }
  };

  const fetchDataLog = async () => {
    try {
      const response = await fetch("/api/vitals/log");
      const data = await response.json();
      setDataLog(data.log || []);
    } catch (error) {
      console.error("Failed to fetch data log:", error);
    }
  };

  const testDeviceConnection = async () => {
    try {
      const response = await fetch("/api/vitals/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "test_device" })
      });
      const data = await response.json();
      if (data.success) {
        toast.success("Device connection test successful");
      } else {
        toast.error("Device connection test failed");
      }
    } catch (error) {
      console.error("Device connection test failed:", error);
      toast.error("Device connection test failed");
    }
  };

  // Emergency calling function
  const makeEmergencyCall = (number: string) => {
    try {
      // Try to use the Web Telephony API if available
      if ('telephony' in navigator) {
        (navigator as any).telephony.dial(number);
      } else {
        // Fallback: create a tel: link
        const link = document.createElement('a');
        link.href = `tel:${number}`;
        link.click();
      }
      toast.success(`Calling ${number}...`);
    } catch (error) {
      console.error("Failed to make call:", error);
      toast.error("Failed to make call. Please dial manually.");
    }
  };

  // Water intake tracking
  const addWaterIntake = (amount: number) => {
    setVitalSigns(prev => ({
      ...prev,
      waterIntake: {
        ...prev.waterIntake!,
        currentIntake: (prev.waterIntake?.currentIntake || 0) + amount,
        lastDrink: new Date().toISOString()
      }
    }));
    toast.success(`Added ${amount}ml of water`);
  };

  // Sleep tracking
  const startSleepTracking = () => {
    setVitalSigns(prev => ({
      ...prev,
      sleepData: {
        ...prev.sleepData!,
        sleepStage: 'light',
        sleepDuration: 0
      }
    }));
    toast.success("Sleep tracking started");
  };

  const stopSleepTracking = () => {
    setVitalSigns(prev => ({
      ...prev,
      sleepData: {
        ...prev.sleepData!,
        sleepStage: 'awake'
      }
    }));
    toast.success("Sleep tracking stopped");
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-green-50">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-sm border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Link to="/">
                <Button variant="ghost" size="sm">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back
                </Button>
              </Link>
              <div>
                <h1 className="text-xl font-bold text-gray-900">Real-Time Health Monitoring</h1>
                <p className="text-sm text-gray-600">IoT Smartwatch Dashboard</p>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowDebugPanel(!showDebugPanel)}
              >
                <Bug className="h-4 w-4 mr-2" />
                Debug
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchSystemStatus}
              >
                <Database className="h-4 w-4 mr-2" />
                Status
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-6">
        <Tabs defaultValue="monitoring" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="monitoring">Monitoring</TabsTrigger>
            <TabsTrigger value="alarms">Alarms</TabsTrigger>
            <TabsTrigger value="water">Hydration</TabsTrigger>
            <TabsTrigger value="emergency">Emergency</TabsTrigger>
          </TabsList>

          {/* Monitoring Tab */}
          <TabsContent value="monitoring" className="space-y-6">
            {/* Connection Status */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Signal className="h-5 w-5 mr-2" />
                  Device Connection Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg">
                    <Bluetooth className="h-5 w-5 text-blue-600" />
                    <div>
                      <p className="font-medium">Bluetooth</p>
                      <p className="text-sm text-gray-600">
                        {bluetoothSupported ? "Supported" : "Not Supported"}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-green-50 rounded-lg">
                    <WifiIcon className="h-5 w-5 text-green-600" />
                    <div>
                      <p className="font-medium">Data Source</p>
                      <p className="text-sm text-gray-600 capitalize">{dataSource}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-3 p-3 bg-purple-50 rounded-lg">
                    <Battery className="h-5 w-5 text-purple-600" />
                    <div>
                      <p className="font-medium">Device Battery</p>
                      <p className="text-sm text-gray-600">{vitalSigns.battery || 0}%</p>
                    </div>
                  </div>
                </div>
                
                <div className="flex space-x-2 mt-4">
                  <Button
                    onClick={connectBluetoothDevice}
                    disabled={isConnecting}
                    className="flex-1"
                  >
                    {isConnecting ? (
                      <>
                        <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Bluetooth className="h-4 w-4 mr-2" />
                        Connect Device
                      </>
                    )}
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={startMockStream}
                    disabled={isMockRunning}
                  >
                    <Play className="h-4 w-4 mr-2" />
                    Start Mock
                  </Button>
                  
                  <Button
                    variant="outline"
                    onClick={stopMockStream}
                    disabled={!isMockRunning}
                  >
                    <Pause className="h-4 w-4 mr-2" />
                    Stop Mock
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Vital Signs Display */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm">
                    <Heart className="h-4 w-4 mr-2 text-red-500" />
                    Heart Rate
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">
                    {vitalSigns.heartRate} BPM
                  </div>
                  <Progress value={vitalSigns.heartRate / 2} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm">
                    <Activity className="h-4 w-4 mr-2 text-blue-500" />
                    Blood Pressure
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-blue-600">
                    {vitalSigns.bloodPressure.systolic}/{vitalSigns.bloodPressure.diastolic}
                  </div>
                  <p className="text-xs text-gray-600 mt-1">mmHg</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm">
                    <Thermometer className="h-4 w-4 mr-2 text-orange-500" />
                    Temperature
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-orange-600">
                    {vitalSigns.temperature.toFixed(1)}°F
                  </div>
                  <Progress value={(vitalSigns.temperature - 95) * 10} className="mt-2" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-2">
                  <CardTitle className="flex items-center text-sm">
                    <Droplets className="h-4 w-4 mr-2 text-cyan-500" />
                    Oxygen
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-cyan-600">
                    {vitalSigns.oxygenSaturation}%
                  </div>
                  <Progress value={vitalSigns.oxygenSaturation} className="mt-2" />
                </CardContent>
              </Card>
            </div>

            {/* Health Analytics */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>Steps & Activity</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-600 mb-4">
                    {vitalSigns.steps || 0} steps
                  </div>
                  <ResponsiveContainer width="100%" height={200}>
                    <LineChart data={vitalsHistory}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="time" />
                      <YAxis />
                      <Tooltip />
                      <Line type="monotone" dataKey="steps" stroke="#10b981" strokeWidth={2} />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Sleep Analytics</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <span>Sleep Stage:</span>
                      <Badge variant="outline" className="capitalize">
                        {vitalSigns.sleepData?.sleepStage || 'awake'}
                      </Badge>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Quality:</span>
                      <span className="font-medium">{vitalSigns.sleepData?.sleepQuality || 0}%</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Efficiency:</span>
                      <span className="font-medium">{vitalSigns.sleepData?.sleepEfficiency || 0}%</span>
                    </div>
                    <div className="flex space-x-2">
                      <Button size="sm" onClick={startSleepTracking}>
                        <Bed className="h-4 w-4 mr-2" />
                        Start Sleep
                      </Button>
                      <Button size="sm" variant="outline" onClick={stopSleepTracking}>
                        <Sunrise className="h-4 w-4 mr-2" />
                        Wake Up
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Debug Panel */}
            {showDebugPanel && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center">
                    <Bug className="h-5 w-5 mr-2" />
                    Debug Information
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <h4 className="font-medium mb-2">System Status</h4>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(systemStatus, null, 2)}
                      </pre>
                    </div>
                    <div>
                      <h4 className="font-medium mb-2">Recent Data Log</h4>
                      <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto max-h-32">
                        {JSON.stringify(dataLog.slice(-5), null, 2)}
                      </pre>
                    </div>
                  </div>
                  <div className="flex space-x-2 mt-4">
                    <Button size="sm" onClick={fetchSystemStatus}>
                      <RefreshCw className="h-4 w-4 mr-2" />
                      Refresh Status
                    </Button>
                    <Button size="sm" onClick={fetchDataLog}>
                      <Database className="h-4 w-4 mr-2" />
                      Fetch Log
                    </Button>
                    <Button size="sm" onClick={testDeviceConnection}>
                      <Shield className="h-4 w-4 mr-2" />
                      Test Connection
                    </Button>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          {/* Alarms Tab */}
          <TabsContent value="alarms" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Bell className="h-5 w-5 mr-2" />
                  Smart Alarms
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {alarms.map((alarm) => (
                    <div key={alarm.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <div className="text-center">
                          <div className="text-lg font-bold">{alarm.time}</div>
                          <div className="text-xs text-gray-600">{alarm.label}</div>
                        </div>
                        <div>
                          <div className="text-sm font-medium">{alarm.days.join(', ')}</div>
                          <div className="text-xs text-gray-600 capitalize">{alarm.type}</div>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch
                          checked={alarm.enabled}
                          onCheckedChange={(checked) => {
                            setAlarms(prev => 
                              prev.map(a => a.id === alarm.id ? { ...a, enabled: checked } : a)
                            );
                          }}
                        />
                        <Button size="sm" variant="outline">
                          <Settings className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
                
                <Button className="mt-4" onClick={() => {
                  const newAlarm: Alarm = {
                    id: `alarm_${Date.now()}`,
                    time: '08:00',
                    days: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
                    enabled: true,
                    type: 'sleep',
                    label: 'New Alarm',
                    sound: 'gentle',
                    vibration: true
                  };
                  setAlarms(prev => [...prev, newAlarm]);
                }}>
                  <Bell className="h-4 w-4 mr-2" />
                  Add New Alarm
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Water Tab */}
          <TabsContent value="water" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Droplet className="h-5 w-5 mr-2" />
                  Hydration Tracking
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {/* Water Progress */}
                  <div className="text-center">
                    <div className="text-4xl font-bold text-blue-600 mb-2">
                      {vitalSigns.waterIntake?.currentIntake || 0}ml
                    </div>
                    <div className="text-gray-600 mb-4">
                      of {vitalSigns.waterIntake?.dailyGoal || 2000}ml daily goal
                    </div>
                    <Progress 
                      value={((vitalSigns.waterIntake?.currentIntake || 0) / (vitalSigns.waterIntake?.dailyGoal || 2000)) * 100} 
                      className="h-3"
                    />
                  </div>

                  {/* Quick Add Buttons */}
                  <div className="grid grid-cols-3 gap-2">
                    <Button onClick={() => addWaterIntake(250)} variant="outline">
                      250ml
                    </Button>
                    <Button onClick={() => addWaterIntake(500)} variant="outline">
                      500ml
                    </Button>
                    <Button onClick={() => addWaterIntake(1000)} variant="outline">
                      1L
                    </Button>
                  </div>

                  {/* Reminders */}
                  <div>
                    <h4 className="font-medium mb-3">Water Reminders</h4>
                    <div className="space-y-2">
                      {waterReminders.map((reminder) => (
                        <div key={reminder.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">Every {reminder.interval} minutes</div>
                            <div className="text-sm text-gray-600">{reminder.message}</div>
                          </div>
                          <Switch
                            checked={reminder.enabled}
                            onCheckedChange={(checked) => {
                              setWaterReminders(prev => 
                                prev.map(r => r.id === reminder.id ? { ...r, enabled: checked } : r)
                              );
                            }}
                          />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Emergency Tab */}
          <TabsContent value="emergency" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center text-red-600">
                  <AlertCircle className="h-5 w-5 mr-2" />
                  Emergency Contacts
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {emergencyContacts.map((contact, index) => (
                    <div key={index} className="flex items-center justify-between p-4 border rounded-lg bg-red-50">
                      <div>
                        <div className="font-bold text-red-800">{contact.name}</div>
                        <div className="text-2xl font-bold text-red-600">{contact.number}</div>
                        <div className="text-sm text-gray-600 capitalize">{contact.type}</div>
                      </div>
                      <Button
                        size="lg"
                        variant="destructive"
                        onClick={() => makeEmergencyCall(contact.number)}
                        className="h-12 w-12 p-0"
                      >
                        <Phone className="h-6 w-6" />
                      </Button>
                    </div>
                  ))}
                </div>
                
                <Alert className="mt-4">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    <strong>Emergency Disclaimer:</strong> This app provides quick access to emergency services.
                    In any serious emergency, call 112 immediately. This information does not replace professional medical training.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
