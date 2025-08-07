import { useState, useEffect } from "react";
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
} from "recharts";

// Simulated IoT device data
interface VitalSigns {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
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

  // Simulate real-time data updates
  useEffect(() => {
    const interval = setInterval(() => {
      const now = new Date();
      const newVitals: VitalSigns = {
        heartRate: Math.floor(Math.random() * 20) + 65, // 65-85 BPM
        bloodPressure: {
          systolic: Math.floor(Math.random() * 20) + 110, // 110-130
          diastolic: Math.floor(Math.random() * 15) + 70, // 70-85
        },
        temperature: Math.random() * 2 + 97.5, // 97.5-99.5°F
        oxygenSaturation: Math.floor(Math.random() * 3) + 97, // 97-100%
        respiratoryRate: Math.floor(Math.random() * 6) + 14, // 14-20 per minute
        timestamp: now.toISOString(),
      };

      setVitalSigns(newVitals);

      // Update history (keep last 20 readings)
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

      // Simulate alert generation
      if (newVitals.heartRate > 100 && Math.random() > 0.8) {
        setAlerts((prev) => [
          {
            id: Date.now(),
            type: "warning",
            message: `Heart rate spike detected: ${newVitals.heartRate} BPM`,
            timestamp: "Just now",
            severity: "high",
          },
          ...prev.slice(0, 4), // Keep only 5 most recent alerts
        ]);
      }
    }, 3000); // Update every 3 seconds

    return () => clearInterval(interval);
  }, []);

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
                        stroke="#e2e8f0"
                        strokeOpacity={0.5}
                      />
                      <XAxis
                        dataKey="time"
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e0' }}
                        axisLine={{ stroke: '#cbd5e0' }}
                        interval="preserveStartEnd"
                      />
                      <YAxis
                        className="text-xs"
                        tick={{ fontSize: 12 }}
                        tickLine={{ stroke: '#cbd5e0' }}
                        axisLine={{ stroke: '#cbd5e0' }}
                        domain={['dataMin - 5', 'dataMax + 5']}
                      />
                      <Tooltip
                        active={true}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "1px solid #e2e8f0",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                        labelStyle={{ color: '#374151' }}
                        itemStyle={{ color: '#374151' }}
                      />
                      <Line
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ef4444"
                        strokeWidth={2}
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#ef4444" }}
                        name="Heart Rate (BPM)"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="oxygenSat"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#3b82f6" }}
                        name="Oxygen Saturation (%)"
                        connectNulls={false}
                      />
                      <Line
                        type="monotone"
                        dataKey="systolic"
                        stroke="#10b981"
                        strokeWidth={2}
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 4 }}
                        activeDot={{ r: 6, fill: "#10b981" }}
                        name="Systolic BP (mmHg)"
                        connectNulls={false}
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
                {connectedDevices.map((device) => {
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
                })}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
