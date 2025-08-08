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

  const heartRateStatus = getVitalStatus("heartRate", vitalSigns.heartRate || 0);
  const bpStatus = getVitalStatus("bloodPressure", vitalSigns.bloodPressure?.systolic || 0);
  const tempStatus = getVitalStatus("temperature", vitalSigns.temperature || 0);
  const oxygenStatus = getVitalStatus("oxygenSat", vitalSigns.oxygenSaturation || 0);

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
                  connectedDevices.length > 0 
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}
              >
                <div className={`w-2 h-2 rounded-full mr-2 ${
                  connectedDevices.length > 0 ? "bg-green-500 animate-pulse" : "bg-gray-400"
                }`}></div>
                {connectedDevices.length > 0 ? "Live Monitoring" : "No Devices"}
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
        {/* Device Connection Section */}
        <div className="mb-8 fade-in">
          <Card className="shadow-colored border-border/50">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="flex items-center">
                    <BluetoothConnected className="w-5 h-5 mr-2 text-blue-600" />
                    Device Connections
                  </CardTitle>
                  <CardDescription>
                    Connect your smartwatch, fitness tracker, or health devices
                  </CardDescription>
                </div>
                <div className="flex items-center space-x-2">
                  <Button 
                    variant="outline" 
                    size="sm" 
                    onClick={refreshDevices}
                    disabled={isConnecting}
                  >
                    <RefreshCw className={`w-4 h-4 mr-2 ${isConnecting ? 'animate-spin' : ''}`} />
                    Refresh
                  </Button>
                  <Button 
                    onClick={connectNewDevice} 
                    disabled={!isSupported || isConnecting}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    {isConnecting ? (
                      <>
                        <Bluetooth className="w-4 h-4 mr-2 animate-pulse" />
                        Connecting...
                      </>
                    ) : (
                      <>
                        <Plus className="w-4 h-4 mr-2" />
                        Connect Device
                      </>
                    )}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {!isSupported && (
                <Alert className="mb-4 border-orange-200 bg-orange-50">
                  <AlertTriangle className="h-4 w-4" />
                  <AlertDescription>
                    Bluetooth not supported in this browser. Please use Chrome or Edge for device connections.
                  </AlertDescription>
                </Alert>
              )}
              
              {connectedDevices.length === 0 ? (
                <div className="text-center py-8">
                  <Bluetooth className="w-12 h-12 mx-auto text-gray-400 mb-4" />
                  <h3 className="text-lg font-medium text-gray-600 mb-2">No Devices Connected</h3>
                  <p className="text-gray-500 mb-6">Connect your wearables to start monitoring your health</p>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl mx-auto">
                    <Button 
                      variant="outline" 
                      onClick={() => connectSpecificDevice('boat')}
                      disabled={isConnecting}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Watch className="w-6 h-6 mb-2" />
                      <span className="text-sm">boAt Watch</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => connectSpecificDevice('fitbit')}
                      disabled={isConnecting}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Activity className="w-6 h-6 mb-2" />
                      <span className="text-sm">Fitbit</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={() => connectSpecificDevice('apple')}
                      disabled={isConnecting}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Heart className="w-6 h-6 mb-2" />
                      <span className="text-sm">Apple Watch</span>
                    </Button>
                    <Button 
                      variant="outline" 
                      onClick={connectNewDevice}
                      disabled={isConnecting}
                      className="flex flex-col items-center p-4 h-auto"
                    >
                      <Smartphone className="w-6 h-6 mb-2" />
                      <span className="text-sm">Other Device</span>
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {connectedDevices.map((device) => {
                    const IconComponent = device.type === 'smartwatch' ? Watch : 
                                       device.type === 'fitness_tracker' ? Activity : 
                                       device.type === 'blood_pressure' ? Heart : 
                                       device.type === 'pulse_oximeter' ? Droplets : Smartphone;
                    
                    return (
                      <div key={device.id} className="p-4 border rounded-lg bg-white/50">
                        <div className="flex items-center justify-between mb-3">
                          <div className="flex items-center space-x-3">
                            <div className={`p-2 rounded-lg ${
                              device.status === "connected" ? "bg-green-100 text-green-600" :
                              device.status === "syncing" ? "bg-yellow-100 text-yellow-600" :
                              "bg-red-100 text-red-600"
                            }`}>
                              <IconComponent className="w-5 h-5" />
                            </div>
                            <div>
                              <h3 className="font-medium">{device.name}</h3>
                              <p className="text-sm text-gray-500 capitalize">{device.type.replace('_', ' ')}</p>
                            </div>
                          </div>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => disconnectDevice(device.id)}
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            ×
                          </Button>
                        </div>
                        
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-2">
                            <Badge variant={device.status === "connected" ? "default" : "secondary"}>
                              {device.status}
                            </Badge>
                            {device.protocols.includes('bluetooth') && (
                              <BluetoothConnected className="w-4 h-4 text-blue-600" />
                            )}
                          </div>
                          
                          {device.battery && (
                            <div className="flex items-center space-x-2">
                              <span className="text-sm text-gray-600">{device.battery}%</span>
                              <Progress value={device.battery} className="w-16 h-2" />
                            </div>
                          )}
                        </div>
                        
                        <p className="text-xs text-gray-500 mt-2">
                          Last sync: {new Date(device.lastSync).toLocaleTimeString()}
                        </p>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Alerts Section */}
        {alerts.length > 0 && (
          <div className="mb-8 space-y-3 fade-in">
            {alerts.slice(0, 3).map((alert) => (
              <Alert
                key={alert.id}
                className={`border-l-4 ${
                  alert.severity === "critical"
                    ? "border-red-500 bg-red-50"
                    : alert.severity === "high"
                      ? "border-orange-500 bg-orange-50"
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
                  <CardTitle className="text-sm font-medium">Heart Rate</CardTitle>
                </div>
                <Badge variant={heartRateStatus.status === "normal" ? "default" : "destructive"}>
                  {heartRateStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.heartRate || '--'}
                <span className="text-lg text-muted-foreground ml-1">BPM</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                {vitalSigns.deviceId !== 'none' ? (
                  <BluetoothConnected className="w-4 h-4 mr-1 text-blue-600" />
                ) : (
                  <WifiOff className="w-4 h-4 mr-1 text-gray-400" />
                )}
                {vitalSigns.deviceId !== 'none' ? getDeviceName(vitalSigns.deviceId) : 'No device connected'}
              </div>
            </CardContent>
          </Card>

          {/* Blood Pressure */}
          <Card className="card-hover shadow-colored border-border/50 fade-in fade-in-delay-1">
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Activity className={`w-5 h-5 ${bpStatus.color}`} />
                  <CardTitle className="text-sm font-medium">Blood Pressure</CardTitle>
                </div>
                <Badge variant={bpStatus.status === "normal" ? "default" : "destructive"}>
                  {bpStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.bloodPressure ? (
                  <>
                    {vitalSigns.bloodPressure.systolic}
                    <span className="text-xl text-muted-foreground">
                      /{vitalSigns.bloodPressure.diastolic}
                    </span>
                  </>
                ) : '--/--'}
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
                  <CardTitle className="text-sm font-medium">Temperature</CardTitle>
                </div>
                <Badge variant={tempStatus.status === "normal" ? "default" : "destructive"}>
                  {tempStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.temperature ? vitalSigns.temperature.toFixed(1) : '--'}
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
                  <CardTitle className="text-sm font-medium">Oxygen Saturation</CardTitle>
                </div>
                <Badge variant={oxygenStatus.status === "normal" ? "default" : "destructive"}>
                  {oxygenStatus.status}
                </Badge>
              </div>
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold mb-2 text-slate-800">
                {vitalSigns.oxygenSaturation || '--'}
                <span className="text-lg text-muted-foreground ml-1">%</span>
              </div>
              <div className="flex items-center text-sm text-muted-foreground">
                <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                Normal: &gt;95%
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Section */}
        <div className="grid grid-cols-1 lg:grid-cols-1 gap-8">
          <Card className="shadow-colored border-border/50 fade-in fade-in-delay-4">
            <CardHeader>
              <CardTitle className="flex items-center">
                <TrendingUp className="w-5 h-5 mr-2 text-blue-600" />
                Live Vital Signs Trends
              </CardTitle>
              <CardDescription>
                Real-time data from connected IoT health devices ({connectedDevices.length} device{connectedDevices.length !== 1 ? 's' : ''} connected)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-80">
                {vitalsHistory.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%" minHeight={320}>
                    <LineChart
                      data={vitalsHistory}
                      margin={{ top: 20, right: 30, left: 20, bottom: 20 }}
                    >
                      <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                      <XAxis 
                        dataKey="time" 
                        tick={{ fontSize: 12 }}
                        interval="preserveStartEnd"
                      />
                      <YAxis 
                        tick={{ fontSize: 12 }}
                        domain={['dataMin - 5', 'dataMax + 5']}
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
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="flex items-center justify-center h-full text-gray-500">
                    <div className="text-center">
                      <Activity className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                      <p>Waiting for device data...</p>
                      <p className="text-sm mt-2">Connect a device to see real-time charts</p>
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
