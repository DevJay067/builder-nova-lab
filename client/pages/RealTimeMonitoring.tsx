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
  Bug,
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
import { toast } from "sonner";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import IoTDebugPanel from "@/components/IoTDebugPanel";

// Simulated IoT device data
interface VitalSigns {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
  steps?: number;
  battery?: number;
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
  status: "connected" | "disconnected" | "syncing";
  battery: number;
  lastSync: string;
  icon: any;
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
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([
    {
      id: "apple_watch",
      name: "Apple Watch Series 9",
      type: "smartwatch",
      status: "connected",
      battery: 85,
      lastSync: "2 minutes ago",
      icon: Watch,
    },
    {
      id: "fitbit_charge",
      name: "Fitbit Charge 6",
      type: "fitness_tracker",
      status: "connected",
      battery: 62,
      lastSync: "5 minutes ago",
      icon: Activity,
    },
    {
      id: "omron_bp",
      name: "Omron Blood Pressure Monitor",
      type: "blood_pressure",
      status: "syncing",
      battery: 45,
      lastSync: "1 hour ago",
      icon: Heart,
    },
    {
      id: "pulse_ox",
      name: "Masimo Pulse Oximeter",
      type: "pulse_oximeter",
      status: "disconnected",
      battery: 20,
      lastSync: "3 hours ago",
      icon: Droplets,
    },
  ]);

  const [alerts, setAlerts] = useState([
    {
      id: 1,
      type: "warning",
      message: "Heart rate elevated above normal range (>100 BPM)",
      timestamp: "2 minutes ago",
      severity: "medium",
    },
    {
      id: 2,
      type: "info",
      message: "Fitbit sync completed successfully",
      timestamp: "5 minutes ago",
      severity: "low",
    },
  ]);

  const [bluetoothSupported, setBluetoothSupported] = useState<boolean>(false);
  const [isConnecting, setIsConnecting] = useState<boolean>(false);
  const [btDeviceName, setBtDeviceName] = useState<string | null>(null);
  const [useMock, setUseMock] = useState<boolean>(false);
  const [isMockRunning, setIsMockRunning] = useState<boolean>(false);
  const [dataSource, setDataSource] = useState<"sse" | "mock" | "ble">("sse");
  const [showDebugPanel, setShowDebugPanel] = useState<boolean>(false);
  const esRef = useRef<EventSource | null>(null);
  const simRef = useRef<any>(null);

  // Real-time updates via SSE with fallback to local simulation
  useEffect(() => {
    setBluetoothSupported(!!(navigator as any).bluetooth);
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
      // Critical alert detection (simplified)
      const hr = newVitals.heartRate;
      const bpSys = newVitals.bloodPressure.systolic;
      const spo2 = newVitals.oxygenSaturation;
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

    try {
      es = new EventSource("/api/vitals/stream");
      esRef.current = es;
      es.onmessage = (evt) => {
        if (dataSource !== "sse") return; // ignore when not using SSE
        try {
          const data = JSON.parse(evt.data);
          if (data && data.heartRate) handleVitals(data);
        } catch {}
      };
      es.onerror = () => {
        es?.close();
        es = null;
        if (dataSource === "sse") {
          // Fallback to local simulation
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

    return () => {
      if (es) es.close();
      if (fallbackInterval) clearInterval(fallbackInterval);
    };
  }, [dataSource]);

  async function connectBluetoothDevice() {
    if (!(navigator as any).bluetooth) {
      toast.error("Web Bluetooth not supported. Using mock data.");
      await startMockStream();
      return;
    }
    try {
      setIsConnecting(true);
      setDataSource("ble");
      // Stop SSE and simulation
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
          "heart_rate", // 0x180D
          0x1810, // blood pressure
          0x1809, // health thermometer
          0x1822, // pulse oximeter
          0x180f, // battery service
         0x1814, // running speed and cadence (steps estimate)
        ],
      });
      setBtDeviceName(device?.name || "Bluetooth Device");
      const server = await device.gatt.connect();
      device.addEventListener("gattserverdisconnected", () => {
        setBtDeviceName(null);
        setDataSource("sse");
        toast.message("Device disconnected. Resuming SSE");
      });

      // Try Heart Rate Service if available
      try {
        const service = await server.getPrimaryService("heart_rate");
        const characteristic = await service.getCharacteristic("heart_rate_measurement");
        await characteristic.startNotifications();
        characteristic.addEventListener("characteristicvaluechanged", (event: any) => {
          const value = event.target.value as DataView;
          // Parse Heart Rate Measurement (spec-compliant minimal)
          let flags = value.getUint8(0);
          let rate16 = flags & 0x1;
          let index = 1;
          const heartRate = rate16 ? value.getUint16(index, true) : value.getUint8(index);
          const now = new Date();
          const vitals: VitalSigns = {
            heartRate,
            bloodPressure: { systolic: vitalSigns.bloodPressure.systolic, diastolic: vitalSigns.bloodPressure.diastolic },
            temperature: vitalSigns.temperature,
            oxygenSaturation: vitalSigns.oxygenSaturation,
            respiratoryRate: vitalSigns.respiratoryRate,
            timestamp: now.toISOString(),
            steps: vitalSigns.steps,
            battery: vitalSigns.battery,
          };
          setVitalSigns(vitals);
        });
        toast.success("Connected to Bluetooth Heart Rate service");
      } catch {}

      // Blood Pressure (0x1810) -> Blood Pressure Measurement (0x2A35)
      try {
        const bpService = await server.getPrimaryService(0x1810);
        const bpChar = await bpService.getCharacteristic(0x2a35);
        await bpChar.startNotifications();
        bpChar.addEventListener("characteristicvaluechanged", (event: any) => {
          const dv = event.target.value as DataView;
          // Simplified parse
          const systolic = dv.getUint8(1) || vitalSigns.bloodPressure.systolic;
          const diastolic = dv.getUint8(3) || vitalSigns.bloodPressure.diastolic;
          setVitalSigns((prev) => ({
            ...prev,
            bloodPressure: { systolic, diastolic },
            timestamp: new Date().toISOString(),
          }));
        });
      } catch {}

      // Thermometer (0x1809) -> Temperature Measurement (0x2A1C)
      try {
        const tService = await server.getPrimaryService(0x1809);
        const tChar = await tService.getCharacteristic(0x2a1c);
        await tChar.startNotifications();
        tChar.addEventListener("characteristicvaluechanged", (event: any) => {
          const dv = event.target.value as DataView;
          const temp = 35 + (dv.getUint8(1) % 6) + Math.random();
          setVitalSigns((prev) => ({ ...prev, temperature: temp, timestamp: new Date().toISOString() }));
        });
      } catch {}

      // Pulse Oximeter (0x1822)
      try {
        const oxService = await server.getPrimaryService(0x1822);
        const plxChar = await oxService.getCharacteristic(0x2a60).catch(() => oxService.getCharacteristic(0x2a5f));
        await plxChar.startNotifications();
        plxChar.addEventListener("characteristicvaluechanged", (event: any) => {
          const dv = event.target.value as DataView;
          const spo2 = dv.getUint8(1) || vitalSigns.oxygenSaturation;
          setVitalSigns((prev) => ({ ...prev, oxygenSaturation: spo2, timestamp: new Date().toISOString() }));
        });
      } catch {}

      // Running Speed and Cadence (0x1814) -> RSC Measurement (0x2A53)
      try {
        const rscService = await server.getPrimaryService(0x1814);
        const rscChar = await rscService.getCharacteristic(0x2a53);
        await rscChar.startNotifications();
        rscChar.addEventListener("characteristicvaluechanged", (event: any) => {
          const dv = event.target.value as DataView;
          const cadence = dv.getUint8(1) || 0; // very simplified
          setVitalSigns((prev) => ({
            ...prev,
            steps: (prev.steps || 0) + Math.max(1, Math.round(cadence / 2)),
            timestamp: new Date().toISOString(),
          }));
        });
      } catch {}

      // Optional: parse battery service if available
      try {
        const battService = await server.getPrimaryService(0x180f);
        const battChar = await battService.getCharacteristic(0x2a19);
        const battValue = await battChar.readValue();
        const battery = battValue.getUint8(0);
        setVitalSigns((prev) => ({ ...prev, battery }));
      } catch {}
    } catch (e) {
      toast.error("Bluetooth connection failed. Starting mock data.");
      await startMockStream();
    } finally {
      setIsConnecting(false);
    }
  }

  async function forgetBluetoothDevice() {
    try {
      setBtDeviceName(null);
      setDataSource("sse");
      toast.message("Bluetooth device unpaired. Using SSE/mock data.");
    } catch {}
  }

  async function startMockStream() {
    try {
      await fetch("/api/vitals/mock/start", { method: "POST" });
      setIsMockRunning(true);
      setUseMock(true);
      setDataSource("mock");
      toast.success("Mock data started");
    } catch {}
  }

  async function stopMockStream() {
    try {
      await fetch("/api/vitals/mock/stop", { method: "POST" });
      setIsMockRunning(false);
      setUseMock(false);
      setDataSource("sse");
      toast.message("Mock data stopped");
    } catch {}
  }

  function startLocalSimulation(cb: (v: VitalSigns) => void) {
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
        steps: (vitalSigns.steps || 0) + Math.floor(Math.random() * 20),
        battery: vitalSigns.battery,
      });
    }, 3000);
  }

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
              <Button variant="outline" size="sm" onClick={connectBluetoothDevice} disabled={isConnecting}>
                {isConnecting ? "Connecting..." : bluetoothSupported ? "Connect Bluetooth" : "Start Mock"}
              </Button>
              {btDeviceName && (
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-slate-600">{btDeviceName}</Badge>
                  <Button variant="ghost" size="sm" onClick={forgetBluetoothDevice}>Unpair</Button>
                </div>
              )}
              <div className="flex items-center space-x-2">
                <Label htmlFor="use-mock" className="text-xs text-slate-600">Mock</Label>
                <Switch id="use-mock" checked={useMock} onCheckedChange={(v) => (v ? startMockStream() : stopMockStream())} />
              </div>
              <Button 
                variant="outline" 
                size="sm" 
                onClick={() => setShowDebugPanel(!showDebugPanel)}
              >
                <Bug className="w-4 h-4 mr-2" />
                Debug
              </Button>
              <Badge
                variant="secondary"
                className="bg-green-50 text-green-700 border-green-200"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Live Monitoring
              </Badge>
              <Badge variant="outline" className="text-slate-600">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleTimeString()}
              </Badge>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {/* Critical Alert Banner */}
        {alerts[0]?.severity === "high" && (
          <div className="mb-6 p-4 rounded-lg bg-red-50 border border-red-200 flex items-center space-x-3">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <div className="text-red-700 text-sm font-medium">{alerts[0].message}</div>
          </div>
        )}
        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3 fade-in">
            {alerts.slice(0, 3).map((alert) => (
              <Alert
                key={alert.id}
                className={`border-l-4 ${
                  alert.severity === "high"
                    ? "border-red-500 bg-red-50"
                    : alert.severity === "medium"
                      ? "border-yellow-500 bg-yellow-50"
                      : "border-blue-500 bg-blue-50"
                }`}
              >
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription className="font-medium">
                  {alert.message}
                  <span className="text-sm text-muted-foreground ml-2">
                    • {alert.timestamp}
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Debug Panel */}
        {showDebugPanel && (
          <div className="mb-8 fade-in">
            <IoTDebugPanel />
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
                      <Line
                        type="monotone"
                        dataKey="steps"
                        stroke="#8b5cf6"
                        strokeWidth={2}
                        dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 4 }}
                        name="Steps"
                      />
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
                {btDeviceName ? (
                  <div className="flex items-center justify-between p-3 rounded-lg bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 rounded-lg bg-green-100 text-green-600">
                        <Smartphone className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="font-medium text-sm">{btDeviceName}</p>
                        <p className="text-xs text-muted-foreground">Connected</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-2">
                      {typeof vitalSigns.battery === "number" && (
                        <>
                          <div className="text-xs text-muted-foreground">{vitalSigns.battery}%</div>
                          <Progress value={vitalSigns.battery} className="w-12 h-2" />
                        </>
                      )}
                      <Wifi className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">No device connected</div>
                )}
                {typeof vitalSigns.battery === "number" && (
                  <div className="p-3 rounded-lg bg-gray-50 flex items-center justify-between">
                    <div className="text-sm">Watch Battery</div>
                    <div className="flex items-center space-x-2">
                      <div className="text-xs text-muted-foreground">{vitalSigns.battery}%</div>
                      <Progress value={vitalSigns.battery} className="w-12 h-2" />
                    </div>
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
