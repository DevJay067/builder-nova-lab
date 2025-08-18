import { useState, useEffect } from "react";

// Suppress Recharts defaultProps warnings in development
const originalConsoleWarn = console.warn;
if (typeof console !== "undefined") {
  console.warn = (...args) => {
    if (
      typeof args[0] === "string" &&
      args[0].includes(
        "Support for defaultProps will be removed from function components",
      ) &&
      (args[0].includes("XAxis") || args[0].includes("YAxis"))
    ) {
      return; // Suppress these specific warnings
    }
    originalConsoleWarn.apply(console, args);
  };
}
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
  RadialBarChart,
  RadialBar,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";

// Simulated IoT device data
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
  const [connectedDevices, setConnectedDevices] = useState<Device[]>([]);

  const [alerts, setAlerts] = useState([] as any[]);
  const [chartType, setChartType] = useState<"line" | "area" | "radial">(
    "line",
  );
  const [showPredictions, setShowPredictions] = useState(false);
  const [devicePerformance, setDevicePerformance] = useState({
    accuracy: 95,
    batteryLevel: 78,
    signalStrength: 85,
    dataQuality: 92,
  });

  const [useDemo, setUseDemo] = useState(false);
  const [isConnecting, setIsConnecting] = useState(false);
  const [bleDeviceName, setBleDeviceName] = useState<string | null>(null);
  const [uploadToCloud, setUploadToCloud] = useState(true);
  const isBLESupported =
    typeof navigator !== "undefined" && !!(navigator as any).bluetooth;

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
          steps: vitalSigns.steps
            ? vitalSigns.steps + Math.floor(Math.random() * 50) + 10
            : Math.floor(Math.random() * 5000) + 2000,
          calories: vitalSigns.calories
            ? vitalSigns.calories + Math.floor(Math.random() * 15) + 5
            : Math.floor(Math.random() * 800) + 400,
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
            const payload = JSON.parse(
              (evt as any).data || (evt as any).detail || "{}",
            );
            const now = new Date(payload.timestamp || new Date().toISOString());
            const heartRate =
              payload?.metrics?.heartRate ?? vitalSigns.heartRate;
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
            setVitalsHistory((prev) =>
              [
                ...prev,
                {
                  time: now.toLocaleTimeString(),
                  heartRate: updated.heartRate,
                  temperature: updated.temperature,
                  oxygenSat: updated.oxygenSaturation,
                  systolic: updated.bloodPressure.systolic,
                  steps: updated.steps,
                },
              ].slice(-20),
            );
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

  // Web Bluetooth: connect and stream heart rate (and optional SpO2)
  const connectBluetooth = async () => {
    try {
      if (!isBLESupported) return;
      setIsConnecting(true);
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: [0x180d, 0x1822], // Heart Rate, Pulse Oximeter
      });
      setBleDeviceName(device?.name || "Unknown Device");
      setConnectedDevices([
        {
          id: device.id || "ble-device",
          name: device.name || "Bluetooth Health Device",
          type: "smartwatch",
          status: "connected",
          battery: 0,
          lastSync: "Just now",
          icon: Watch,
        },
      ]);

      const server = await device.gatt.connect();

      // Heart Rate service
      try {
        const hrService = await server.getPrimaryService(0x180d);
        const hrChar = await hrService.getCharacteristic(0x2a37);
        await hrChar.startNotifications();
        hrChar.addEventListener("characteristicvaluechanged", (event: any) => {
          const value: DataView = event.target.value;
          const flags = value.getUint8(0);
          const hr16 = flags & 0x01;
          const heartRate = hr16 ? value.getUint16(1, true) : value.getUint8(1);
          const now = new Date();
          setVitalSigns((prev) => {
            const updated = {
              ...prev,
              heartRate,
              timestamp: now.toISOString(),
            };
            setVitalsHistory((prevHist) =>
              [
                ...prevHist,
                {
                  time: now.toLocaleTimeString(),
                  heartRate: updated.heartRate,
                  temperature: updated.temperature,
                  oxygenSat: updated.oxygenSaturation,
                  systolic: updated.bloodPressure.systolic,
                },
              ].slice(-50),
            );
            return updated;
          });

          // Optional cloud ingest
          if (uploadToCloud) {
            const token = localStorage.getItem("sessionToken");
            if (token) {
              fetch("/api/iot/ingest", {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  Authorization: `Bearer ${token}`,
                },
                body: JSON.stringify({
                  deviceId: device.id,
                  deviceType: "bluetooth_health",
                  metrics: { heartRate },
                }),
              }).catch(() => {});
            }
          }
        });
      } catch {}

      // Pulse Oximeter service (best-effort)
      try {
        const plxService = await server.getPrimaryService(0x1822);
        // Continuous Measurement 0x2A5F
        const plxChar = await plxService.getCharacteristic(0x2a5f);
        await plxChar.startNotifications();
        plxChar.addEventListener("characteristicvaluechanged", (event: any) => {
          const dv: DataView = event.target.value;
          // Try to parse SpO2 from first SFLOAT after flags
          const spo2 = (() => {
            if (dv.byteLength >= 3) {
              const raw = dv.getUint16(1, true);
              // IEEE-11073 16-bit SFLOAT (mantissa 12-bit signed, exponent 4-bit signed)
              const mantissa = ((raw & 0x0fff) << 20) >> 20; // sign extend 12-bit
              const exp =
                ((raw >> 12) & 0x000f) >= 0x0008
                  ? (raw >> 12) | 0xfff0
                  : raw >> 12;
              const value = mantissa * Math.pow(10, exp);
              return Math.round(value);
            }
            return undefined;
          })();

          if (typeof spo2 === "number" && spo2 > 0 && spo2 <= 100) {
            const now = new Date();
            setVitalSigns((prev) => {
              const updated = {
                ...prev,
                oxygenSaturation: spo2,
                timestamp: now.toISOString(),
              };
              setVitalsHistory((prevHist) =>
                [
                  ...prevHist,
                  {
                    time: now.toLocaleTimeString(),
                    heartRate: updated.heartRate,
                    temperature: updated.temperature,
                    oxygenSat: updated.oxygenSaturation,
                    systolic: updated.bloodPressure.systolic,
                  },
                ].slice(-50),
              );
              return updated;
            });

            if (uploadToCloud) {
              const token = localStorage.getItem("sessionToken");
              if (token) {
                fetch("/api/iot/ingest", {
                  method: "POST",
                  headers: {
                    "Content-Type": "application/json",
                    Authorization: `Bearer ${token}`,
                  },
                  body: JSON.stringify({
                    deviceId: device.id,
                    deviceType: "pulse_oximeter",
                    metrics: { spo2 },
                  }),
                }).catch(() => {});
              }
            }
          }
        });
      } catch {}
    } catch (e) {
      // noop
    } finally {
      setIsConnecting(false);
    }
  };

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
      {/* Enhanced Header - Mobile Optimized */}
      <header className="border-b border-border/40 glass backdrop-blur-xl sticky top-0 z-50">
        <div className="container mx-auto px-4 py-3 sm:py-4">
          {/* Mobile: Stacked Layout */}
          <div className="flex flex-col space-y-3 sm:hidden">
            {/* Top Row: Back button and title */}
            <div className="flex items-center justify-between">
              <Link to="/">
                <Button
                  variant="ghost"
                  size="sm"
                  className="btn-smooth h-10 px-3"
                >
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  <span className="text-sm">Back</span>
                </Button>
              </Link>
              <div className="flex items-center space-x-2">
                <Badge
                  variant="secondary"
                  className="bg-green-50 text-green-700 border-green-200 text-xs"
                >
                  <div className="w-2 h-2 rounded-full bg-green-500 mr-1 animate-pulse"></div>
                  Live
                </Badge>
              </div>
            </div>

            {/* Title Row */}
            <div className="flex items-center space-x-3">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-600 text-white">
                <Activity className="h-4 w-4" />
              </div>
              <div>
                <h1 className="text-lg font-bold text-slate-800">
                  Real-time Monitoring
                </h1>
                <p className="text-xs text-slate-600">Live Health Data</p>
              </div>
            </div>

            {/* Controls Row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <Label
                  htmlFor="demo-mode-mobile"
                  className="text-xs font-medium"
                >
                  Demo
                </Label>
                <Switch
                  id="demo-mode-mobile"
                  checked={useDemo}
                  onCheckedChange={setUseDemo}
                />
              </div>
              <div className="flex items-center justify-between bg-muted/30 rounded-lg p-2">
                <Label
                  htmlFor="predictions-mobile"
                  className="text-xs font-medium"
                >
                  AI
                </Label>
                <Switch
                  id="predictions-mobile"
                  checked={showPredictions}
                  onCheckedChange={setShowPredictions}
                />
              </div>
            </div>

            {/* Chart Controls and Connect Button */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-1">
                {["line", "area", "radial"].map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type as any)}
                    className="h-8 w-8 p-0"
                  >
                    {type === "line" ? (
                      <Activity className="w-3 h-3" />
                    ) : type === "area" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <Brain className="w-3 h-3" />
                    )}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                className="btn-smooth h-10 px-4 text-sm"
                onClick={connectBluetooth}
                disabled={!isBLESupported || isConnecting}
              >
                <Watch className="w-4 h-4 mr-2" />
                {isConnecting
                  ? "Connecting..."
                  : bleDeviceName
                    ? "Reconnect"
                    : "Connect"}
              </Button>
            </div>
          </div>

          {/* Desktop: Original Layout */}
          <div className="hidden sm:flex items-center justify-between">
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
                className="bg-green-50 text-green-700 border-green-200"
              >
                <div className="w-2 h-2 rounded-full bg-green-500 mr-2 animate-pulse"></div>
                Live Monitoring
              </Badge>
              <Badge variant="outline" className="text-slate-600">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleTimeString()}
              </Badge>
              <div className="flex items-center space-x-2">
                <Label htmlFor="demo-mode" className="text-xs text-slate-600">
                  Demo Mode
                </Label>
                <Switch
                  id="demo-mode"
                  checked={useDemo}
                  onCheckedChange={setUseDemo}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="cloud-upload"
                  className="text-xs text-slate-600"
                >
                  Upload to Cloud
                </Label>
                <Switch
                  id="cloud-upload"
                  checked={uploadToCloud}
                  onCheckedChange={setUploadToCloud}
                />
              </div>
              <div className="flex items-center space-x-2">
                <Label
                  htmlFor="show-predictions"
                  className="text-xs text-slate-600"
                >
                  AI Predictions
                </Label>
                <Switch
                  id="show-predictions"
                  checked={showPredictions}
                  onCheckedChange={setShowPredictions}
                />
              </div>
              <div className="flex items-center space-x-1">
                {["line", "area", "radial"].map((type) => (
                  <Button
                    key={type}
                    variant={chartType === type ? "default" : "ghost"}
                    size="sm"
                    onClick={() => setChartType(type as any)}
                    className="text-xs px-2"
                  >
                    {type === "line" ? (
                      <Activity className="w-3 h-3" />
                    ) : type === "area" ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <Brain className="w-3 h-3" />
                    )}
                  </Button>
                ))}
              </div>
              <Button
                size="sm"
                className="btn-smooth"
                onClick={connectBluetooth}
                disabled={!isBLESupported || isConnecting}
              >
                <Watch className="w-4 h-4 mr-2" />
                {isConnecting
                  ? "Connecting..."
                  : bleDeviceName
                    ? "Reconnect"
                    : "Connect Device"}
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-3 sm:px-4 py-4 sm:py-8">
        {/* Device status (mobile-friendly) */}
        {bleDeviceName && (
          <div className="mb-4">
            <Card className="shadow-colored border-border/50">
              <CardContent className="flex items-center justify-between p-3">
                <div className="flex items-center space-x-3">
                  <div className="p-2 rounded-lg bg-blue-100 text-blue-700">
                    <Watch className="w-4 h-4" />
                  </div>
                  <div>
                    <div className="text-sm font-medium">{bleDeviceName}</div>
                    <div className="text-xs text-muted-foreground">
                      Last update:{" "}
                      {new Date(vitalSigns.timestamp).toLocaleTimeString()}
                    </div>
                  </div>
                </div>
                <Badge variant="secondary" className="text-xs">
                  BLE Connected
                </Badge>
              </CardContent>
            </Card>
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

        {/* Live Vital Signs Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-6 gap-3 sm:gap-4 lg:gap-6 mb-6 sm:mb-8">
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
                <Badge
                  variant="outline"
                  className="text-xs text-purple-600 border-purple-200"
                >
                  {(((vitalSigns.steps ?? 0) / 10000) * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.steps ?? 0}
              </div>
              <Progress
                value={((vitalSigns.steps ?? 0) / 10000) * 100}
                className="mb-2 h-2"
              />
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-purple-600" />
                Today’s steps
              </div>
            </CardContent>
          </Card>

          {/* Calories */}
          <Card className="card-hover shadow-colored border-border/50 fade-in fade-in-delay-5">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Zap className="w-5 h-5 text-orange-600" />
                  <CardTitle className="text-sm font-medium">
                    Calories
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs text-orange-600 border-orange-200"
                >
                  {(((vitalSigns.calories ?? 0) / 2000) * 100).toFixed(0)}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.calories ?? 0}
                <span className="text-lg text-muted-foreground ml-1">cal</span>
              </div>
              <Progress
                value={((vitalSigns.calories ?? 0) / 2000) * 100}
                className="mb-2 h-2"
              />
              <div className="flex items-center text-sm text-muted-foreground">
                <TrendingUp className="w-4 h-4 mr-1 text-orange-600" />
                Goal: 2,000 calories
              </div>
            </CardContent>
          </Card>

          {/* Device Performance */}
          <Card className="card-hover shadow-colored border-border/50 fade-in fade-in-delay-6">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Smartphone className="w-5 h-5 text-cyan-600" />
                  <CardTitle className="text-sm font-medium">
                    Device Performance
                  </CardTitle>
                </div>
                <Badge
                  variant="outline"
                  className="text-xs text-cyan-600 border-cyan-200"
                >
                  {devicePerformance.accuracy}%
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">
                    Accuracy
                  </span>
                  <span className="text-sm font-medium">
                    {devicePerformance.accuracy}%
                  </span>
                </div>
                <Progress value={devicePerformance.accuracy} className="h-1" />
                <div className="flex justify-between items-center">
                  <span className="text-xs text-muted-foreground">Signal</span>
                  <span className="text-sm font-medium">
                    {devicePerformance.signalStrength}%
                  </span>
                </div>
                <Progress
                  value={devicePerformance.signalStrength}
                  className="h-1"
                />
              </div>
            </CardContent>
          </Card>
        </div>

        {/* AI Predictions Card */}
        {showPredictions && (
          <div className="mb-8">
            <Card className="shadow-colored border-border/50 bg-gradient-to-r from-indigo-50 to-purple-50 fade-in">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-indigo-600" />
                  AI Health Predictions
                </CardTitle>
                <CardDescription>
                  Advanced machine learning insights based on your vitals
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="p-4 rounded-lg bg-white/60 border border-indigo-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-indigo-700">
                        Stress Level
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs text-indigo-600"
                      >
                        Low
                      </Badge>
                    </div>
                    <Progress value={25} className="mb-2 h-2" />
                    <p className="text-xs text-slate-600">
                      Your current vitals indicate a relaxed state
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/60 border border-green-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-green-700">
                        Health Score
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs text-green-600"
                      >
                        Excellent
                      </Badge>
                    </div>
                    <Progress value={88} className="mb-2 h-2" />
                    <p className="text-xs text-slate-600">
                      All vitals within optimal ranges
                    </p>
                  </div>
                  <div className="p-4 rounded-lg bg-white/60 border border-yellow-100">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-yellow-700">
                        Activity Recommendation
                      </span>
                      <Badge
                        variant="outline"
                        className="text-xs text-yellow-600"
                      >
                        Moderate
                      </Badge>
                    </div>
                    <Progress value={65} className="mb-2 h-2" />
                    <p className="text-xs text-slate-600">
                      Consider light exercise to boost activity
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Charts and Device Status */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6 lg:gap-8">
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
                    {chartType === "line" ? (
                      <LineChart data={vitalsHistory}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="time"
                          className="text-xs"
                          axisLine={true}
                          tickLine={true}
                          tick={{ fontSize: 12 }}
                          height={60}
                          type="category"
                        />
                        <YAxis
                          className="text-xs"
                          axisLine={true}
                          tickLine={true}
                          tick={{ fontSize: 12 }}
                          width={80}
                          type="number"
                        />
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
                        {vitalsHistory.some(
                          (d) => typeof d.steps === "number",
                        ) && (
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
                    ) : chartType === "area" ? (
                      <AreaChart data={vitalsHistory}>
                        <CartesianGrid
                          strokeDasharray="3 3"
                          className="opacity-30"
                        />
                        <XAxis
                          dataKey="time"
                          className="text-xs"
                          axisLine={true}
                          tickLine={true}
                          tick={{ fontSize: 12 }}
                          height={60}
                          type="category"
                        />
                        <YAxis
                          className="text-xs"
                          axisLine={true}
                          tickLine={true}
                          tick={{ fontSize: 12 }}
                          width={80}
                          type="number"
                        />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: "rgba(255, 255, 255, 0.95)",
                            border: "1px solid #e2e8f0",
                            borderRadius: "8px",
                            boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="heartRate"
                          stroke="#ef4444"
                          fill="#fef2f2"
                          strokeWidth={2}
                          name="Heart Rate (BPM)"
                        />
                        <Area
                          type="monotone"
                          dataKey="oxygenSat"
                          stroke="#3b82f6"
                          fill="#eff6ff"
                          strokeWidth={2}
                          name="Oxygen Saturation (%)"
                        />
                      </AreaChart>
                    ) : (
                      <div className="flex items-center justify-center h-full">
                        <div className="grid grid-cols-2 gap-8 w-full max-w-md">
                          <div className="relative">
                            <ResponsiveContainer width="100%" height={150}>
                              <RadialBarChart
                                data={[
                                  {
                                    name: "Heart Rate",
                                    value: (vitalSigns.heartRate / 120) * 100,
                                    fill: "#ef4444",
                                  },
                                ]}
                                startAngle={90}
                                endAngle={450}
                                innerRadius="60%"
                                outerRadius="90%"
                              >
                                <RadialBar
                                  dataKey="value"
                                  cornerRadius={10}
                                  fill="#ef4444"
                                />
                              </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <div className="text-2xl font-bold text-red-600">
                                {vitalSigns.heartRate}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                BPM
                              </div>
                            </div>
                          </div>
                          <div className="relative">
                            <ResponsiveContainer width="100%" height={150}>
                              <RadialBarChart
                                data={[
                                  {
                                    name: "Oxygen",
                                    value: vitalSigns.oxygenSaturation,
                                    fill: "#3b82f6",
                                  },
                                ]}
                                startAngle={90}
                                endAngle={450}
                                innerRadius="60%"
                                outerRadius="90%"
                              >
                                <RadialBar
                                  dataKey="value"
                                  cornerRadius={10}
                                  fill="#3b82f6"
                                />
                              </RadialBarChart>
                            </ResponsiveContainer>
                            <div className="absolute inset-0 flex items-center justify-center flex-col">
                              <div className="text-2xl font-bold text-blue-600">
                                {vitalSigns.oxygenSaturation}
                              </div>
                              <div className="text-xs text-muted-foreground">
                                %
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    )}
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Connected Devices & System Status */}
          <div className="space-y-6">
            {/* Connected Devices */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-5">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Smartphone className="w-5 h-5 mr-2 text-green-600" />
                  Connected Devices
                </CardTitle>
                <CardDescription>IoT health monitoring devices</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {connectedDevices.length === 0 ? (
                  <div className="text-center py-8">
                    <div className="w-16 h-16 mx-auto mb-4 rounded-full bg-gray-100 flex items-center justify-center">
                      <Watch className="w-8 h-8 text-gray-400" />
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">
                      No devices connected
                    </p>
                    <Button
                      size="sm"
                      onClick={connectBluetooth}
                      disabled={!isBLESupported}
                    >
                      <Smartphone className="w-4 h-4 mr-2" />
                      Connect Device
                    </Button>
                  </div>
                ) : (
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
                          <Progress
                            value={device.battery}
                            className="w-12 h-2"
                          />
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
                )}
              </CardContent>
            </Card>

            {/* System Performance */}
            <Card className="shadow-colored border-border/50 fade-in fade-in-delay-6">
              <CardHeader>
                <CardTitle className="flex items-center">
                  <Brain className="w-5 h-5 mr-2 text-purple-600" />
                  System Performance
                </CardTitle>
                <CardDescription>Real-time monitoring metrics</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Data Quality
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {devicePerformance.dataQuality}%
                      </span>
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  </div>
                  <Progress
                    value={devicePerformance.dataQuality}
                    className="h-2"
                  />

                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">
                      Battery Level
                    </span>
                    <div className="flex items-center space-x-2">
                      <span className="text-sm font-medium">
                        {devicePerformance.batteryLevel}%
                      </span>
                      {devicePerformance.batteryLevel > 50 ? (
                        <CheckCircle className="w-4 h-4 text-green-600" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-yellow-600" />
                      )}
                    </div>
                  </div>
                  <Progress
                    value={devicePerformance.batteryLevel}
                    className="h-2"
                  />

                  <div className="grid grid-cols-2 gap-4 mt-4 pt-4 border-t border-border/50">
                    <div className="text-center">
                      <div className="text-lg font-bold text-green-600">
                        99.2%
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Uptime
                      </div>
                    </div>
                    <div className="text-center">
                      <div className="text-lg font-bold text-blue-600">
                        42ms
                      </div>
                      <div className="text-xs text-muted-foreground">
                        Latency
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
