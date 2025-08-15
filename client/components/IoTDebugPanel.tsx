import { useState, useEffect } from "react";
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
import {
  Activity,
  Wifi,
  WifiOff,
  Bug,
  TestTube,
  Database,
  Clock,
  Smartphone,
  Watch,
  Heart,
  Thermometer,
  Droplets,
  Zap,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw,
  Play,
  Square,
  Settings,
} from "lucide-react";
import { toast } from "sonner";

interface ConnectionStats {
  totalAttempts: number;
  successfulConnections: number;
  lastDataReceived: string | null;
  connectedDevices: number;
  activeClients: number;
  mockRunning: boolean;
  debugMode: boolean;
}

interface DeviceConnection {
  deviceId: string;
  deviceName: string;
  deviceType: string;
  connectionMethod: string;
  lastSeen: string;
  battery: number;
  status: string;
  dataQuality: string;
}

interface DebugData {
  stats: ConnectionStats;
  devices: DeviceConnection[];
  historyCount: number;
  latestData: any[];
  timestamp: string;
}

export default function IoTDebugPanel() {
  const [debugData, setDebugData] = useState<DebugData | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [testResults, setTestResults] = useState<any[]>([]);
  const [debugMode, setDebugMode] = useState(false);

  const fetchDebugData = async () => {
    try {
      setIsRefreshing(true);
      const response = await fetch("/api/vitals/debug/stats");
      if (response.ok) {
        const data = await response.json();
        setDebugData(data);
        setDebugMode(data.stats.debugMode);
      } else {
        toast.error("Failed to fetch debug data");
      }
    } catch (error) {
      toast.error("Error fetching debug data");
      console.error("Debug data fetch error:", error);
    } finally {
      setIsRefreshing(false);
    }
  };

  const testDataFlow = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("/api/vitals/debug/test-flow", {
        method: "POST",
      });
      if (response.ok) {
        const result = await response.json();
        setTestResults(prev => [result, ...prev.slice(0, 4)]);
        toast.success("Data flow test completed");
      } else {
        toast.error("Data flow test failed");
      }
    } catch (error) {
      toast.error("Error testing data flow");
      console.error("Data flow test error:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const toggleDebugMode = async () => {
    try {
      const response = await fetch("/api/vitals/debug/enable", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ enabled: !debugMode }),
      });
      if (response.ok) {
        setDebugMode(!debugMode);
        toast.success(`Debug mode ${!debugMode ? 'enabled' : 'disabled'}`);
        fetchDebugData();
      } else {
        toast.error("Failed to toggle debug mode");
      }
    } catch (error) {
      toast.error("Error toggling debug mode");
    }
  };

  const startMockData = async () => {
    try {
      const response = await fetch("/api/vitals/mock/start", { method: "POST" });
      if (response.ok) {
        toast.success("Mock data started");
        fetchDebugData();
      } else {
        toast.error("Failed to start mock data");
      }
    } catch (error) {
      toast.error("Error starting mock data");
    }
  };

  const stopMockData = async () => {
    try {
      const response = await fetch("/api/vitals/mock/stop", { method: "POST" });
      if (response.ok) {
        toast.success("Mock data stopped");
        fetchDebugData();
      } else {
        toast.error("Failed to stop mock data");
      }
    } catch (error) {
      toast.error("Error stopping mock data");
    }
  };

  const registerTestDevice = async () => {
    try {
      const response = await fetch("/api/vitals/debug/device/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          deviceId: `test-device-${Date.now()}`,
          deviceName: "Test Smartwatch",
          deviceType: "smartwatch",
          connectionMethod: "bluetooth",
        }),
      });
      if (response.ok) {
        toast.success("Test device registered");
        fetchDebugData();
      } else {
        toast.error("Failed to register test device");
      }
    } catch (error) {
      toast.error("Error registering test device");
    }
  };

  useEffect(() => {
    fetchDebugData();
    const interval = setInterval(fetchDebugData, 5000); // Refresh every 5 seconds
    return () => clearInterval(interval);
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="w-4 h-4 text-green-600" />;
      case "disconnected":
        return <XCircle className="w-4 h-4 text-red-600" />;
      case "syncing":
        return <RefreshCw className="w-4 h-4 text-yellow-600 animate-spin" />;
      default:
        return <AlertTriangle className="w-4 h-4 text-gray-600" />;
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case "smartwatch":
        return <Watch className="w-4 h-4" />;
      case "fitness_tracker":
        return <Activity className="w-4 h-4" />;
      case "blood_pressure":
        return <Heart className="w-4 h-4" />;
      case "thermometer":
        return <Thermometer className="w-4 h-4" />;
      case "pulse_oximeter":
        return <Droplets className="w-4 h-4" />;
      default:
        return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-3">
          <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-purple-500 to-pink-600 text-white shadow-lg">
            <Bug className="h-6 w-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-slate-800">IoT Debug Panel</h2>
            <p className="text-sm text-slate-600">Monitor and troubleshoot device connections</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={fetchDebugData}
            disabled={isRefreshing}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button
            variant={debugMode ? "default" : "outline"}
            size="sm"
            onClick={toggleDebugMode}
          >
            <Settings className="w-4 h-4 mr-2" />
            Debug {debugMode ? 'ON' : 'OFF'}
          </Button>
        </div>
      </div>

      {/* Connection Stats */}
      {debugData && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Database className="w-5 h-5" />
              <span>Connection Statistics</span>
            </CardTitle>
            <CardDescription>
              Real-time monitoring of IoT device connections and data flow
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="text-center p-3 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">
                  {debugData.stats.connectedDevices}
                </div>
                <div className="text-sm text-blue-600">Connected Devices</div>
              </div>
              <div className="text-center p-3 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {debugData.stats.activeClients}
                </div>
                <div className="text-sm text-green-600">Active Clients</div>
              </div>
              <div className="text-center p-3 bg-purple-50 rounded-lg">
                <div className="text-2xl font-bold text-purple-600">
                  {debugData.stats.successfulConnections}
                </div>
                <div className="text-sm text-purple-600">Successful Connections</div>
              </div>
              <div className="text-center p-3 bg-orange-50 rounded-lg">
                <div className="text-2xl font-bold text-orange-600">
                  {debugData.historyCount}
                </div>
                <div className="text-sm text-orange-600">Data Points</div>
              </div>
            </div>
            
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm">
                <span>Last Data Received:</span>
                <span className="font-mono">
                  {debugData.stats.lastDataReceived 
                    ? new Date(debugData.stats.lastDataReceived).toLocaleTimeString()
                    : 'Never'
                  }
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Mock Data Running:</span>
                <Badge variant={debugData.stats.mockRunning ? "default" : "secondary"}>
                  {debugData.stats.mockRunning ? "Active" : "Inactive"}
                </Badge>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span>Debug Mode:</span>
                <Badge variant={debugData.stats.debugMode ? "default" : "secondary"}>
                  {debugData.stats.debugMode ? "Enabled" : "Disabled"}
                </Badge>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Connected Devices */}
      {debugData && debugData.devices.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Smartphone className="w-5 h-5" />
              <span>Connected Devices</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {debugData.devices.map((device) => (
                <div
                  key={device.deviceId}
                  className="flex items-center justify-between p-3 border rounded-lg"
                >
                  <div className="flex items-center space-x-3">
                    {getDeviceIcon(device.deviceType)}
                    <div>
                      <div className="font-medium">{device.deviceName}</div>
                      <div className="text-sm text-gray-500">
                        {device.deviceType} • {device.connectionMethod}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center space-x-3">
                    <div className="text-right">
                      <div className="text-sm font-medium">{device.status}</div>
                      <div className="text-xs text-gray-500">
                        Battery: {device.battery}%
                      </div>
                    </div>
                    {getStatusIcon(device.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Test Controls */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <TestTube className="w-5 h-5" />
            <span>Test Controls</span>
          </CardTitle>
          <CardDescription>
            Test data flow and simulate device connections
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            <Button
              variant="outline"
              onClick={testDataFlow}
              disabled={isLoading}
              className="h-auto p-3 flex flex-col items-center space-y-2"
            >
              <TestTube className="w-5 h-5" />
              <span>Test Data Flow</span>
            </Button>
            
            <Button
              variant="outline"
              onClick={registerTestDevice}
              className="h-auto p-3 flex flex-col items-center space-y-2"
            >
              <Smartphone className="w-5 h-5" />
              <span>Register Test Device</span>
            </Button>
            
            <Button
              variant={debugData?.stats.mockRunning ? "destructive" : "outline"}
              onClick={debugData?.stats.mockRunning ? stopMockData : startMockData}
              className="h-auto p-3 flex flex-col items-center space-y-2"
            >
              {debugData?.stats.mockRunning ? (
                <>
                  <Square className="w-5 h-5" />
                  <span>Stop Mock Data</span>
                </>
              ) : (
                <>
                  <Play className="w-5 h-5" />
                  <span>Start Mock Data</span>
                </>
              )}
            </Button>
            
            <Button
              variant="outline"
              onClick={fetchDebugData}
              disabled={isRefreshing}
              className="h-auto p-3 flex flex-col items-center space-y-2"
            >
              <RefreshCw className={`w-5 h-5 ${isRefreshing ? 'animate-spin' : ''}`} />
              <span>Refresh Stats</span>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Test Results */}
      {testResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Recent Test Results</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {testResults.map((result, index) => (
                <Alert key={index}>
                  <CheckCircle className="h-4 w-4" />
                  <AlertDescription>
                    <div className="font-medium">Data Flow Test #{index + 1}</div>
                    <div className="text-sm text-gray-600">
                      {result.message} • {new Date(result.timestamp).toLocaleTimeString()}
                    </div>
                    {result.testPayload && (
                      <div className="mt-2 text-xs bg-gray-100 p-2 rounded">
                        <pre>{JSON.stringify(result.testPayload, null, 2)}</pre>
                      </div>
                    )}
                  </AlertDescription>
                </Alert>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Latest Data Sample */}
      {debugData && debugData.latestData.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Latest Data Sample</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="bg-gray-50 p-3 rounded-lg">
              <pre className="text-xs overflow-x-auto">
                {JSON.stringify(debugData.latestData[0], null, 2)}
              </pre>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}