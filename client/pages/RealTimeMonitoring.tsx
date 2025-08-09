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
  Bluetooth,
  BluetoothConnected,
  Plus,
  RefreshCw,
  Settings,
  Star,
  Shield,
  Sparkles,
  Pulse,
  CircuitBoard,
  Signal,
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
} from "recharts";
import { realIoTDeviceService, type DeviceConnection, type VitalSigns } from "@/services/realIoTDeviceService";
import { DevicePairingWizard } from "@/components/DevicePairingWizard";
import { deviceSimulationService } from "@/services/deviceSimulationService";
import IoTDebugPanel from "@/components/IoTDebugPanel";

export default function RealTimeMonitoring() {
  const [vitalSigns, setVitalSigns] = useState<VitalSigns>({
    heartRate: 72,
    bloodPressure: { systolic: 120, diastolic: 80 },
    temperature: 98.6,
    oxygenSaturation: 98,
    respiratoryRate: 16,
    timestamp: new Date(),
    deviceId: 'none'
  });

  const [vitalsHistory, setVitalsHistory] = useState<any[]>([]);
  const [connectedDevices, setConnectedDevices] = useState<DeviceConnection[]>([]);
  const [isConnecting, setIsConnecting] = useState(false);
  const [isSupported, setIsSupported] = useState(true);
  const [alerts, setAlerts] = useState<any[]>([]);
  const [isDemoMode, setIsDemoMode] = useState(false);

  // Initialize real IoT device service
  useEffect(() => {
    setIsSupported(realIoTDeviceService.isDeviceSupported());

    // Listen for real device data
    realIoTDeviceService.onDataReceived((data: VitalSigns) => {
      console.log('📊 Real device data received:', data);
      setVitalSigns(data);
      
      // Update history
      setVitalsHistory((prev) => {
        const newHistory = [
          ...prev,
          {
            time: new Date(data.timestamp).toLocaleTimeString(),
            heartRate: data.heartRate || 0,
            temperature: data.temperature || 0,
            oxygenSat: data.oxygenSaturation || 0,
            systolic: data.bloodPressure?.systolic || 0,
            steps: data.steps || 0,
            calories: data.calories || 0,
          },
        ].slice(-20);
        return newHistory;
      });

      // Generate alerts for real data
      checkForAlerts(data);
    });

    // Listen for device updates
    realIoTDeviceService.onDeviceUpdate((devices: DeviceConnection[]) => {
      console.log('🔄 Device list updated:', devices);
      setConnectedDevices(devices);
    });

    // Load initially connected devices
    setConnectedDevices(realIoTDeviceService.getConnectedDevices());

    return () => {
      // Cleanup listeners if needed
    };
  }, []);

  const checkForAlerts = (data: VitalSigns) => {
    const newAlerts = [];

    if (data.heartRate && data.heartRate > 100) {
      newAlerts.push({
        id: Date.now(),
        type: "warning",
        message: `High heart rate detected: ${data.heartRate} BPM from ${getDeviceName(data.deviceId)}`,
        timestamp: "Just now",
        severity: "high",
      });
    }

    if (data.bloodPressure && data.bloodPressure.systolic > 140) {
      newAlerts.push({
        id: Date.now() + 1,
        type: "warning",
        message: `High blood pressure: ${data.bloodPressure.systolic}/${data.bloodPressure.diastolic} mmHg`,
        timestamp: "Just now",
        severity: "high",
      });
    }

    if (data.temperature && data.temperature > 100.4) {
      newAlerts.push({
        id: Date.now() + 2,
        type: "alert",
        message: `Fever detected: ${data.temperature.toFixed(1)}°F`,
        timestamp: "Just now",
        severity: "critical",
      });
    }

    if (data.oxygenSaturation && data.oxygenSaturation < 95) {
      newAlerts.push({
        id: Date.now() + 3,
        type: "alert",
        message: `Low oxygen saturation: ${data.oxygenSaturation}%`,
        timestamp: "Just now",
        severity: "critical",
      });
    }

    if (newAlerts.length > 0) {
      setAlerts((prev) => [...newAlerts, ...prev.slice(0, 4)]);
    }
  };

  const getDeviceName = (deviceId: string): string => {
    const device = connectedDevices.find(d => d.id === deviceId);
    return device?.name || 'Unknown Device';
  };

  const connectNewDevice = async () => {
    if (!isSupported) {
      alert('Bluetooth not supported in this browser. Please use Chrome or Edge.');
      return;
    }

    setIsConnecting(true);
    try {
      await realIoTDeviceService.connectDevice();
      console.log('✅ Device connection completed');
    } catch (error) {
      console.error('❌ Device connection failed:', error);
      alert('Failed to connect device. Please make sure your device is nearby and in pairing mode.');
    } finally {
      setIsConnecting(false);
    }
  };

  const connectSpecificDevice = async (deviceType: string) => {
    setIsConnecting(true);
    try {
      let connection = null;
      switch (deviceType) {
        case 'boat':
          connection = await realIoTDeviceService.connectBoAtDevice();
          break;
        case 'fitbit':
          connection = await realIoTDeviceService.connectFitbitDevice();
          break;
        default:
          connection = await realIoTDeviceService.connectDevice();
      }
      
      if (connection) {
        console.log(`✅ ${deviceType} device connected successfully`);
      }
    } catch (error) {
      console.error(`❌ ${deviceType} connection failed:`, error);
    } finally {
      setIsConnecting(false);
    }
  };

  const disconnectDevice = async (deviceId: string) => {
    try {
      await realIoTDeviceService.disconnectDevice(deviceId);
      console.log('🔌 Device disconnected');
    } catch (error) {
      console.error('❌ Disconnect failed:', error);
    }
  };

  const refreshDevices = () => {
    setConnectedDevices(realIoTDeviceService.getConnectedDevices());
  };

  const getVitalStatus = (type: string, value: number) => {
    switch (type) {
      case "heartRate":
        if (value < 60) return { status: "low", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
        if (value > 100) return { status: "high", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
        return { status: "normal", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
      case "bloodPressure":
        if (value > 140) return { status: "high", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
        if (value < 90) return { status: "low", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
        return { status: "normal", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
      case "temperature":
        if (value > 100.4) return { status: "fever", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
        if (value < 97) return { status: "low", color: "text-blue-600", bgColor: "bg-blue-50", borderColor: "border-blue-200" };
        return { status: "normal", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
      case "oxygenSat":
        if (value < 95) return { status: "low", color: "text-red-600", bgColor: "bg-red-50", borderColor: "border-red-200" };
        return { status: "normal", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
      default:
        return { status: "normal", color: "text-green-600", bgColor: "bg-green-50", borderColor: "border-green-200" };
    }
  };

  const heartRateStatus = getVitalStatus("heartRate", vitalSigns.heartRate || 0);
  const bpStatus = getVitalStatus("bloodPressure", vitalSigns.bloodPressure?.systolic || 0);
  const tempStatus = getVitalStatus("temperature", vitalSigns.temperature || 0);
  const oxygenStatus = getVitalStatus("oxygenSat", vitalSigns.oxygenSaturation || 0);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-purple-50/20 relative overflow-hidden">
      {/* Animated background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-gradient-to-br from-blue-400/10 to-purple-400/10 rounded-full blur-3xl animate-pulse"></div>
        <div className="absolute -bottom-40 -left-40 w-80 h-80 bg-gradient-to-tr from-green-400/10 to-blue-400/10 rounded-full blur-3xl animate-pulse delay-1000"></div>
        <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-gradient-to-r from-purple-400/5 to-pink-400/5 rounded-full blur-3xl animate-pulse delay-2000"></div>
      </div>

      {/* Enhanced Header */}
      <header className="relative z-10 border-b border-white/20 bg-white/10 backdrop-blur-xl sticky top-0 shadow-lg">
        <div className="container mx-auto px-6 py-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-6 fade-in">
              <Link to="/">
                <Button variant="ghost" size="sm" className="text-slate-700 hover:text-slate-900 hover:bg-white/20 transition-all duration-300 rounded-xl">
                  <ArrowLeft className="h-4 w-4 mr-2" />
                  Back to Dashboard
                </Button>
              </Link>
              <div className="flex items-center space-x-4">
                <div className="relative">
                  <div className="flex items-center justify-center w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-xl shadow-blue-500/30 transform hover:scale-110 transition-all duration-300">
                    <Pulse className="h-8 w-8 animate-pulse" />
                  </div>
                  <div className="absolute -top-1 -right-1 w-4 h-4 bg-green-400 rounded-full border-2 border-white animate-ping"></div>
                </div>
                <div>
                  <h1 className="text-2xl font-bold bg-gradient-to-r from-slate-800 to-slate-600 bg-clip-text text-transparent">
                    Real-time Health Monitoring
                  </h1>
                  <p className="text-slate-600 font-medium flex items-center gap-2">
                    <CircuitBoard className="h-4 w-4" />
                    Live IoT Device Integration
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4 fade-in fade-in-delay-1">
              <Badge
                variant="secondary"
                className={`px-4 py-2 rounded-full transition-all duration-300 ${
                  connectedDevices.length > 0 
                    ? "bg-green-100 text-green-700 border-green-200 shadow-green-100/50 shadow-lg"
                    : "bg-slate-100 text-slate-700 border-slate-200"
                }`}
              >
                <div className={`w-2.5 h-2.5 rounded-full mr-2 ${
                  connectedDevices.length > 0 ? "bg-green-500 animate-pulse" : "bg-slate-400"
                }`}></div>
                {connectedDevices.length > 0 ? "Live Monitoring" : "No Devices"}
              </Badge>
              <Badge variant="outline" className="text-slate-600 px-4 py-2 rounded-full bg-white/50 backdrop-blur-sm">
                <Clock className="w-3 h-3 mr-1" />
                {new Date().toLocaleTimeString()}
              </Badge>
              <Button
                variant={isDemoMode ? "default" : "outline"}
                size="sm"
                onClick={() => {
                  if (!isDemoMode) {
                    deviceSimulationService.startSimulation();
                    setIsDemoMode(true);
                  } else {
                    deviceSimulationService.stopSimulation();
                    setIsDemoMode(false);
                  }
                }}
                className={`rounded-xl px-4 py-2 transition-all duration-300 ${
                  isDemoMode 
                    ? "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 shadow-lg shadow-purple-500/30" 
                    : "hover:bg-white/20"
                }`}
              >
                {isDemoMode ? (
                  <>
                    <Sparkles className="w-4 h-4 mr-2" />
                    Stop Demo
                  </>
                ) : (
                  <>
                    <Star className="w-4 h-4 mr-2" />
                    Demo Mode
                  </>
                )}
              </Button>
              <IoTDebugPanel />
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-6 py-8 relative z-10">
        {/* Enhanced Device Connection Section */}
        <div className="mb-12 fade-in">
          <Card className="border-0 bg-white/60 backdrop-blur-xl shadow-2xl shadow-blue-500/10 rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-1">
              <CardHeader className="bg-white/80 backdrop-blur-sm rounded-t-3xl">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="text-2xl font-bold flex items-center text-slate-800">
                      <BluetoothConnected className="w-6 h-6 mr-3 text-blue-600" />
                      Device Connections
                      <Shield className="w-5 h-5 ml-2 text-green-600" />
                    </CardTitle>
                    <CardDescription className="text-lg mt-2 text-slate-600">
                      Connect your smartwatch, fitness tracker, or health devices for real-time monitoring
                    </CardDescription>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      onClick={refreshDevices}
                      disabled={isConnecting}
                      className="rounded-xl hover:bg-blue-50 border-blue-200 text-blue-700"
                    >
                      <RefreshCw className={`w-4 h-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                      Refresh
                    </Button>
                    <DevicePairingWizard 
                      onDeviceConnected={(device) => {
                        console.log('Device connected via wizard:', device);
                        refreshDevices();
                      }} 
                    />
                  </div>
                </div>
              </CardHeader>
            </div>
            <CardContent className="p-8 bg-white/80 backdrop-blur-sm">
              {!isSupported && (
                <Alert className="mb-6 border-amber-200 bg-amber-50/80 backdrop-blur-sm rounded-2xl">
                  <AlertTriangle className="h-5 w-5 text-amber-600" />
                  <AlertDescription className="text-amber-700 font-medium">
                    Bluetooth not supported in this browser. Please use Chrome or Edge for device connections.
                  </AlertDescription>
                </Alert>
              )}
              
              {connectedDevices.length === 0 ? (
                <div className="text-center py-12">
                  <div className="relative mb-6">
                    <Bluetooth className="w-16 h-16 mx-auto text-slate-300 animate-pulse" />
                    <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-blue-200 rounded-full animate-ping"></div>
                  </div>
                  <h3 className="text-2xl font-bold text-slate-700 mb-3">No Devices Connected</h3>
                  <p className="text-slate-500 mb-8 text-lg">Connect your wearables to start monitoring your health in real-time</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
                    {[
                      { type: 'boat', name: 'boAt Watch', icon: Watch, color: 'from-red-500 to-orange-500' },
                      { type: 'fitbit', name: 'Fitbit', icon: Activity, color: 'from-green-500 to-emerald-500' },
                      { type: 'apple', name: 'Apple Watch', icon: Heart, color: 'from-gray-600 to-slate-600' },
                      { type: 'other', name: 'Other Device', icon: Smartphone, color: 'from-blue-500 to-cyan-500' }
                    ].map((device, index) => (
                      <Button
                        key={device.type}
                        variant="outline"
                        onClick={() => connectSpecificDevice(device.type)}
                        disabled={isConnecting}
                        className={`flex flex-col items-center p-6 h-auto rounded-2xl border-2 transition-all duration-300 hover:scale-105 hover:shadow-xl group ${
                          isConnecting ? 'opacity-50' : ''
                        }`}
                        style={{ animationDelay: `${index * 100}ms` }}
                      >
                        <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${device.color} flex items-center justify-center mb-3 group-hover:scale-110 transition-transform duration-300`}>
                          <device.icon className="w-6 h-6 text-white" />
                        </div>
                        <span className="font-semibold text-slate-700">{device.name}</span>
                      </Button>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {connectedDevices.map((device, index) => {
                    const IconComponent = device.type === 'smartwatch' ? Watch : 
                                       device.type === 'fitness_tracker' ? Activity : 
                                       device.type === 'blood_pressure' ? Heart : 
                                       device.type === 'pulse_oximeter' ? Droplets : Smartphone;
                    
                    return (
                      <Card key={device.id} className="border-0 bg-white/80 backdrop-blur-sm rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-105">
                        <CardContent className="p-6">
                          <div className="flex items-center justify-between mb-4">
                            <div className="flex items-center space-x-4">
                              <div className={`p-3 rounded-xl ${
                                device.status === "connected" ? "bg-green-100 text-green-600" :
                                device.status === "syncing" ? "bg-yellow-100 text-yellow-600" :
                                "bg-red-100 text-red-600"
                              }`}>
                                <IconComponent className="w-6 h-6" />
                              </div>
                              <div>
                                <h3 className="font-bold text-lg text-slate-800">{device.name}</h3>
                                <p className="text-sm text-slate-500 capitalize">{device.type.replace('_', ' ')}</p>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => disconnectDevice(device.id)}
                              className="text-red-600 hover:text-red-700 hover:bg-red-50 rounded-xl"
                            >
                              ×
                            </Button>
                          </div>
                          
                          <div className="flex items-center justify-between mb-3">
                            <Badge variant={device.status === "connected" ? "default" : "secondary"} className="rounded-full">
                              {device.status}
                            </Badge>
                            {device.protocols.includes('bluetooth') && (
                              <BluetoothConnected className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          
                          {device.battery && (
                            <div className="flex items-center justify-between mb-3">
                              <span className="text-sm font-medium text-slate-600">Battery</span>
                              <div className="flex items-center space-x-2">
                                <span className="text-sm font-bold text-slate-700">{device.battery}%</span>
                                <Progress value={device.battery} className="w-20 h-2" />
                              </div>
                            </div>
                          )}
                          
                          <p className="text-xs text-slate-500">
                            Last sync: {new Date(device.lastSync).toLocaleTimeString()}
                          </p>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Enhanced Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-4 fade-in">
            {alerts.slice(0, 3).map((alert, index) => (
              <Alert
                key={alert.id}
                className={`border-0 rounded-2xl backdrop-blur-sm shadow-lg animate-in slide-in-from-right duration-300 ${
                  alert.severity === "critical"
                    ? "bg-red-50/80 border-l-4 border-l-red-500"
                    : alert.severity === "high"
                      ? "bg-orange-50/80 border-l-4 border-l-orange-500"
                      : alert.severity === "medium"
                        ? "bg-yellow-50/80 border-l-4 border-l-yellow-500"
                        : "bg-blue-50/80 border-l-4 border-l-blue-500"
                }`}
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <AlertTriangle className="h-5 w-5" />
                <AlertDescription className="font-medium text-lg">
                  {alert.message}
                  <span className="text-sm text-muted-foreground ml-3 opacity-70">
                    • {alert.timestamp}
                  </span>
                </AlertDescription>
              </Alert>
            ))}
          </div>
        )}

        {/* Enhanced Live Vital Signs Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Heart Rate */}
          <Card className={`border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden ${heartRateStatus.bgColor} ${heartRateStatus.borderColor} border-2`}>
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${heartRateStatus.bgColor} ${heartRateStatus.borderColor} border`}>
                      <Heart className={`w-6 h-6 ${heartRateStatus.color} animate-pulse`} />
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">Heart Rate</CardTitle>
                  </div>
                  <Badge variant={heartRateStatus.status === "normal" ? "default" : "destructive"} className="rounded-full px-3 py-1">
                    {heartRateStatus.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-3 text-slate-800">
                  {vitalSigns.heartRate || '--'}
                  <span className="text-xl text-muted-foreground ml-2">BPM</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  {vitalSigns.deviceId !== 'none' ? (
                    <BluetoothConnected className="w-4 h-4 mr-2 text-blue-600" />
                  ) : (
                    <WifiOff className="w-4 h-4 mr-2 text-slate-400" />
                  )}
                  {vitalSigns.deviceId !== 'none' ? getDeviceName(vitalSigns.deviceId) : 'No device connected'}
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Blood Pressure */}
          <Card className={`border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden ${bpStatus.bgColor} ${bpStatus.borderColor} border-2`}>
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${bpStatus.bgColor} ${bpStatus.borderColor} border`}>
                      <Activity className={`w-6 h-6 ${bpStatus.color}`} />
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">Blood Pressure</CardTitle>
                  </div>
                  <Badge variant={bpStatus.status === "normal" ? "default" : "destructive"} className="rounded-full px-3 py-1">
                    {bpStatus.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-3 text-slate-800">
                  {vitalSigns.bloodPressure ? (
                    <>
                      {vitalSigns.bloodPressure.systolic}
                      <span className="text-2xl text-muted-foreground">
                        /{vitalSigns.bloodPressure.diastolic}
                      </span>
                    </>
                  ) : '--/--'}
                  <span className="text-xl text-muted-foreground ml-2">mmHg</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <TrendingUp className="w-4 h-4 mr-2 text-green-600" />
                  Target: &lt;120/80 mmHg
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Temperature */}
          <Card className={`border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden ${tempStatus.bgColor} ${tempStatus.borderColor} border-2`}>
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${tempStatus.bgColor} ${tempStatus.borderColor} border`}>
                      <Thermometer className={`w-6 h-6 ${tempStatus.color}`} />
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">Temperature</CardTitle>
                  </div>
                  <Badge variant={tempStatus.status === "normal" ? "default" : "destructive"} className="rounded-full px-3 py-1">
                    {tempStatus.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-3 text-slate-800">
                  {vitalSigns.temperature ? vitalSigns.temperature.toFixed(1) : '--'}
                  <span className="text-xl text-muted-foreground ml-2">°F</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Normal: 97-99°F
                </div>
              </CardContent>
            </div>
          </Card>

          {/* Oxygen Saturation */}
          <Card className={`border-0 rounded-3xl shadow-xl hover:shadow-2xl transition-all duration-500 hover:scale-105 overflow-hidden ${oxygenStatus.bgColor} ${oxygenStatus.borderColor} border-2`}>
            <div className="bg-gradient-to-br from-white/80 to-white/60 backdrop-blur-sm h-full">
              <CardHeader className="pb-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className={`p-3 rounded-2xl ${oxygenStatus.bgColor} ${oxygenStatus.borderColor} border`}>
                      <Droplets className={`w-6 h-6 ${oxygenStatus.color}`} />
                    </div>
                    <CardTitle className="text-lg font-bold text-slate-800">Oxygen Saturation</CardTitle>
                  </div>
                  <Badge variant={oxygenStatus.status === "normal" ? "default" : "destructive"} className="rounded-full px-3 py-1">
                    {oxygenStatus.status}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="text-4xl font-bold mb-3 text-slate-800">
                  {vitalSigns.oxygenSaturation || '--'}
                  <span className="text-xl text-muted-foreground ml-2">%</span>
                </div>
                <div className="flex items-center text-sm text-muted-foreground">
                  <CheckCircle className="w-4 h-4 mr-2 text-green-600" />
                  Normal: &gt;95%
                </div>
              </CardContent>
            </div>
          </Card>
        </div>

        {/* Enhanced Charts Section */}
        <div className="grid grid-cols-1 gap-8">
          <Card className="border-0 bg-white/70 backdrop-blur-xl shadow-2xl rounded-3xl overflow-hidden">
            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 p-1">
              <CardHeader className="bg-white/90 backdrop-blur-sm rounded-t-3xl">
                <CardTitle className="text-2xl font-bold flex items-center text-slate-800">
                  <TrendingUp className="w-6 h-6 mr-3 text-blue-600" />
                  Live Vital Signs Trends
                  <Signal className="w-5 h-5 ml-2 text-green-600 animate-pulse" />
                </CardTitle>
                <CardDescription className="text-lg text-slate-600">
                  Real-time data from connected IoT health devices ({connectedDevices.length} device{connectedDevices.length !== 1 ? 's' : ''} connected)
                </CardDescription>
              </CardHeader>
            </div>
            <CardContent className="p-8 bg-white/90 backdrop-blur-sm">
              <div className="h-96">
                {vitalsHistory.length > 0 ? (
                  <ResponsiveContainer
                    width="100%"
                    height="100%"
                    debounce={50}
                  >
                    <AreaChart
                      data={vitalsHistory}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <defs>
                        <linearGradient id="heartRateGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#ef4444" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#ef4444" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="oxygenGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                        </linearGradient>
                        <linearGradient id="systolicGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        stroke="#e2e8f0"
                        strokeOpacity={0.3}
                        horizontal={true}
                        vertical={false}
                      />
                      <XAxis
                        dataKey="time"
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={{ stroke: '#cbd5e0' }}
                        axisLine={{ stroke: '#cbd5e0' }}
                        interval="preserveStartEnd"
                        type="category"
                        allowDuplicatedCategory={false}
                      />
                      <YAxis
                        tick={{ fontSize: 12, fill: '#64748b' }}
                        tickLine={{ stroke: '#cbd5e0' }}
                        axisLine={{ stroke: '#cbd5e0' }}
                        domain={["dataMin - 5", "dataMax + 5"]}
                        type="number"
                        allowDataOverflow={false}
                      />
                      <Tooltip
                        active={true}
                        animationDuration={150}
                        contentStyle={{
                          backgroundColor: "rgba(255, 255, 255, 0.95)",
                          border: "none",
                          borderRadius: "16px",
                          boxShadow: "0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)",
                          backdropFilter: "blur(10px)"
                        }}
                        labelStyle={{ color: '#374151', fontWeight: 'bold' }}
                        cursor={{ strokeDasharray: '3 3', stroke: '#94a3b8' }}
                      />
                      <Area
                        type="monotone"
                        dataKey="heartRate"
                        stroke="#ef4444"
                        strokeWidth={3}
                        fill="url(#heartRateGradient)"
                        dot={{ fill: "#ef4444", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8, fill: "#ef4444", stroke: "#fff", strokeWidth: 2 }}
                        name="Heart Rate (BPM)"
                        connectNulls={false}
                        animationDuration={500}
                      />
                      <Area
                        type="monotone"
                        dataKey="oxygenSat"
                        stroke="#3b82f6"
                        strokeWidth={3}
                        fill="url(#oxygenGradient)"
                        dot={{ fill: "#3b82f6", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8, fill: "#3b82f6", stroke: "#fff", strokeWidth: 2 }}
                        name="Oxygen Saturation (%)"
                        connectNulls={false}
                        animationDuration={500}
                      />
                      <Area
                        type="monotone"
                        dataKey="systolic"
                        stroke="#10b981"
                        strokeWidth={3}
                        fill="url(#systolicGradient)"
                        dot={{ fill: "#10b981", strokeWidth: 2, r: 5 }}
                        activeDot={{ r: 8, fill: "#10b981", stroke: "#fff", strokeWidth: 2 }}
                        name="Systolic BP (mmHg)"
                        connectNulls={false}
                        animationDuration={500}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-slate-500">
                    <div className="text-center">
                      <div className="relative mb-6">
                        <Activity className="w-16 h-16 mx-auto text-slate-300 animate-pulse" />
                        <div className="absolute inset-0 w-16 h-16 mx-auto border-4 border-blue-200 rounded-full animate-ping"></div>
                      </div>
                      <h3 className="text-xl font-bold text-slate-600 mb-2">Waiting for device data...</h3>
                      <p className="text-slate-500">Connect a device or enable Demo Mode to see real-time charts</p>
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
