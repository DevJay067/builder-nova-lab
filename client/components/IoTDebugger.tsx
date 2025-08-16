import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Bug,
  Database,
  Signal,
  Bluetooth,
  Wifi,
  Cellular,
  RefreshCw,
  Play,
  Pause,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Info,
  Activity,
  Heart,
  Thermometer,
  Droplets,
  Battery,
  Clock,
  Settings,
  TestTube,
  Zap,
  Shield,
  Eye,
  EyeOff,
} from "lucide-react";
import { toast } from "sonner";

interface DebugInfo {
  timestamp: string;
  type: 'info' | 'success' | 'warning' | 'error';
  message: string;
  data?: any;
}

interface ConnectionTest {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'success' | 'failed';
  result?: any;
  error?: string;
}

export default function IoTDebugger() {
  const [debugLog, setDebugLog] = useState<DebugInfo[]>([]);
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [dataLog, setDataLog] = useState<any[]>([]);
  const [connectionTests, setConnectionTests] = useState<ConnectionTest[]>([]);
  const [isRunningTests, setIsRunningTests] = useState(false);
  const [showRawData, setShowRawData] = useState(false);
  const [bluetoothSupported, setBluetoothSupported] = useState(false);

  useEffect(() => {
    setBluetoothSupported(!!(navigator as any).bluetooth);
    addDebugLog('info', 'IoT Debugger initialized');
    fetchSystemStatus();
  }, []);

  const addDebugLog = (type: DebugInfo['type'], message: string, data?: any) => {
    const logEntry: DebugInfo = {
      timestamp: new Date().toISOString(),
      type,
      message,
      data
    };
    setDebugLog(prev => [logEntry, ...prev.slice(0, 99)]); // Keep last 100 entries
  };

  const fetchSystemStatus = async () => {
    try {
      addDebugLog('info', 'Fetching system status...');
      const response = await fetch("/api/vitals/system-status");
      const data = await response.json();
      
      if (data.success) {
        setSystemStatus(data.status);
        addDebugLog('success', 'System status fetched successfully', data.status);
      } else {
        addDebugLog('error', 'Failed to fetch system status', data);
      }
    } catch (error) {
      addDebugLog('error', 'System status fetch failed', error);
    }
  };

  const fetchDataLog = async () => {
    try {
      addDebugLog('info', 'Fetching data log...');
      const response = await fetch("/api/vitals/log");
      const data = await response.json();
      
      if (data.success) {
        setDataLog(data.log || []);
        addDebugLog('success', `Data log fetched: ${data.totalEntries} entries`);
      } else {
        addDebugLog('error', 'Failed to fetch data log', data);
      }
    } catch (error) {
      addDebugLog('error', 'Data log fetch failed', error);
    }
  };

  const testDeviceConnection = async () => {
    const testId = `test_${Date.now()}`;
    const test: ConnectionTest = {
      id: testId,
      name: 'Device Connection Test',
      status: 'running'
    };
    
    setConnectionTests(prev => [...prev, test]);
    
    try {
      addDebugLog('info', 'Testing device connection...');
      const response = await fetch("/api/vitals/test-connection", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ deviceId: "test_device" })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setConnectionTests(prev => 
          prev.map(t => t.id === testId ? { ...t, status: 'success', result: data } : t)
        );
        addDebugLog('success', 'Device connection test passed', data);
      } else {
        setConnectionTests(prev => 
          prev.map(t => t.id === testId ? { ...t, status: 'failed', error: data.error } : t)
        );
        addDebugLog('error', 'Device connection test failed', data);
      }
    } catch (error) {
      setConnectionTests(prev => 
        prev.map(t => t.id === testId ? { ...t, status: 'failed', error: error.message } : t)
      );
      addDebugLog('error', 'Device connection test failed', error);
    }
  };

  const testBluetoothConnection = async () => {
    const testId = `bluetooth_${Date.now()}`;
    const test: ConnectionTest = {
      id: testId,
      name: 'Bluetooth Connection Test',
      status: 'running'
    };
    
    setConnectionTests(prev => [...prev, test]);
    
    try {
      addDebugLog('info', 'Testing Bluetooth connection...');
      
      if (!(navigator as any).bluetooth) {
        throw new Error('Web Bluetooth not supported');
      }
      
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ["heart_rate"]
      });
      
      setConnectionTests(prev => 
        prev.map(t => t.id === testId ? { 
          ...t, 
          status: 'success', 
          result: { deviceName: device.name, connected: true } 
        } : t)
      );
      addDebugLog('success', 'Bluetooth connection test passed', { deviceName: device.name });
      
    } catch (error) {
      setConnectionTests(prev => 
        prev.map(t => t.id === testId ? { ...t, status: 'failed', error: error.message } : t)
      );
      addDebugLog('error', 'Bluetooth connection test failed', error);
    }
  };

  const testMockData = async () => {
    const testId = `mock_${Date.now()}`;
    const test: ConnectionTest = {
      id: testId,
      name: 'Mock Data Test',
      status: 'running'
    };
    
    setConnectionTests(prev => [...prev, test]);
    
    try {
      addDebugLog('info', 'Testing mock data generation...');
      
      // Start mock data
      const startResponse = await fetch("/api/vitals/mock/start", { method: "POST" });
      const startData = await startResponse.json();
      
      if (!startData.success) {
        throw new Error('Failed to start mock data');
      }
      
      // Wait a moment for data to generate
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Fetch latest vitals
      const vitalsResponse = await fetch("/api/health/vitals");
      const vitalsData = await vitalsResponse.json();
      
      if (vitalsData.success) {
        setConnectionTests(prev => 
          prev.map(t => t.id === testId ? { 
            ...t, 
            status: 'success', 
            result: vitalsData.vitals 
          } : t)
        );
        addDebugLog('success', 'Mock data test passed', vitalsData.vitals);
      } else {
        throw new Error('Failed to fetch vitals data');
      }
      
      // Stop mock data
      await fetch("/api/vitals/mock/stop", { method: "POST" });
      
    } catch (error) {
      setConnectionTests(prev => 
        prev.map(t => t.id === testId ? { ...t, status: 'failed', error: error.message } : t)
      );
      addDebugLog('error', 'Mock data test failed', error);
    }
  };

  const runAllTests = async () => {
    setIsRunningTests(true);
    addDebugLog('info', 'Starting comprehensive IoT tests...');
    
    // Clear previous tests
    setConnectionTests([]);
    
    // Run tests sequentially
    await testDeviceConnection();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    await testMockData();
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    if (bluetoothSupported) {
      await testBluetoothConnection();
    }
    
    setIsRunningTests(false);
    addDebugLog('success', 'All tests completed');
  };

  const simulateDeviceData = async () => {
    try {
      addDebugLog('info', 'Simulating device data...');
      
      const testData = {
        heartRate: 75,
        bloodPressure: { systolic: 120, diastolic: 80 },
        temperature: 98.6,
        oxygenSaturation: 98,
        respiratoryRate: 16,
        timestamp: new Date().toISOString(),
        steps: 100,
        battery: 85,
        deviceInfo: {
          deviceId: 'simulated_device',
          deviceName: 'Simulated Smartwatch',
          connectionType: 'bluetooth',
          signalStrength: 90,
          lastSync: new Date().toISOString()
        }
      };
      
      const response = await fetch("/api/vitals/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(testData)
      });
      
      const data = await response.json();
      
      if (data.success) {
        addDebugLog('success', 'Device data simulation successful', data.vitals);
        toast.success('Device data simulated successfully');
      } else {
        addDebugLog('error', 'Device data simulation failed', data);
        toast.error('Device data simulation failed');
      }
    } catch (error) {
      addDebugLog('error', 'Device data simulation failed', error);
      toast.error('Device data simulation failed');
    }
  };

  const clearDebugLog = () => {
    setDebugLog([]);
    addDebugLog('info', 'Debug log cleared');
  };

  const getStatusIcon = (status: ConnectionTest['status']) => {
    switch (status) {
      case 'pending': return <Clock className="h-4 w-4 text-gray-500" />;
      case 'running': return <RefreshCw className="h-4 w-4 text-blue-500 animate-spin" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'failed': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  const getLogIcon = (type: DebugInfo['type']) => {
    switch (type) {
      case 'info': return <Info className="h-4 w-4 text-blue-500" />;
      case 'success': return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'warning': return <AlertTriangle className="h-4 w-4 text-yellow-500" />;
      case 'error': return <XCircle className="h-4 w-4 text-red-500" />;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Bug className="h-5 w-5 mr-2" />
            IoT Device Debugger
          </CardTitle>
          <CardDescription>
            Comprehensive debugging tools for IoT smartwatch integration
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="tests" className="space-y-4">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="tests">Connection Tests</TabsTrigger>
              <TabsTrigger value="status">System Status</TabsTrigger>
              <TabsTrigger value="data">Data Log</TabsTrigger>
              <TabsTrigger value="debug">Debug Log</TabsTrigger>
            </TabsList>

            {/* Connection Tests Tab */}
            <TabsContent value="tests" className="space-y-4">
              <div className="flex space-x-2">
                <Button onClick={runAllTests} disabled={isRunningTests}>
                  <TestTube className="h-4 w-4 mr-2" />
                  Run All Tests
                </Button>
                <Button onClick={testDeviceConnection} variant="outline">
                  <Database className="h-4 w-4 mr-2" />
                  Test API
                </Button>
                <Button onClick={testMockData} variant="outline">
                  <Play className="h-4 w-4 mr-2" />
                  Test Mock Data
                </Button>
                {bluetoothSupported && (
                  <Button onClick={testBluetoothConnection} variant="outline">
                    <Bluetooth className="h-4 w-4 mr-2" />
                    Test Bluetooth
                  </Button>
                )}
                <Button onClick={simulateDeviceData} variant="outline">
                  <Zap className="h-4 w-4 mr-2" />
                  Simulate Data
                </Button>
              </div>

              <div className="space-y-2">
                {connectionTests.map((test) => (
                  <div key={test.id} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      {getStatusIcon(test.status)}
                      <div>
                        <div className="font-medium">{test.name}</div>
                        {test.error && (
                          <div className="text-sm text-red-600">{test.error}</div>
                        )}
                      </div>
                    </div>
                    <Badge variant={test.status === 'success' ? 'default' : test.status === 'failed' ? 'destructive' : 'secondary'}>
                      {test.status}
                    </Badge>
                  </div>
                ))}
                
                {connectionTests.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No tests run yet. Click "Run All Tests" to start debugging.
                  </div>
                )}
              </div>
            </TabsContent>

            {/* System Status Tab */}
            <TabsContent value="status" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">System Status</h3>
                <Button onClick={fetchSystemStatus} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>

              {systemStatus ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Service Status</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Service:</span>
                          <Badge variant={systemStatus.service === 'running' ? 'default' : 'destructive'}>
                            {systemStatus.service}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Health:</span>
                          <Badge variant={systemStatus.systemHealth === 'healthy' ? 'default' : 'destructive'}>
                            {systemStatus.systemHealth}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Connected Devices:</span>
                          <span className="font-medium">{systemStatus.connectedDevices}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Active Clients:</span>
                          <span className="font-medium">{systemStatus.activeClients}</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-sm">Data Statistics</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span>Recent Data Points:</span>
                          <span className="font-medium">{systemStatus.recentDataPoints}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Update:</span>
                          <span className="text-sm text-gray-600">
                            {new Date(systemStatus.lastUpdate).toLocaleTimeString()}
                          </span>
                        </div>
                        <div className="flex justify-between">
                          <span>Timestamp:</span>
                          <span className="text-sm text-gray-600">
                            {new Date(systemStatus.timestamp).toLocaleTimeString()}
                          </span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No system status available. Click "Refresh" to fetch status.
                </div>
              )}
            </TabsContent>

            {/* Data Log Tab */}
            <TabsContent value="data" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Data Log</h3>
                <div className="flex space-x-2">
                  <Button onClick={fetchDataLog} variant="outline" size="sm">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Refresh
                  </Button>
                  <Button 
                    onClick={() => setShowRawData(!showRawData)} 
                    variant="outline" 
                    size="sm"
                  >
                    {showRawData ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                    {showRawData ? 'Hide Raw' : 'Show Raw'}
                  </Button>
                </div>
              </div>

              {dataLog.length > 0 ? (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {dataLog.map((entry, index) => (
                    <div key={index} className="p-3 border rounded-lg">
                      <div className="flex justify-between items-start mb-2">
                        <span className="text-sm font-medium">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                        <Badge variant="outline" className="text-xs">
                          {entry.source}
                        </Badge>
                      </div>
                      {showRawData ? (
                        <pre className="text-xs bg-gray-100 p-2 rounded overflow-auto">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      ) : (
                        <div className="text-sm text-gray-600">
                          Data received from {entry.source}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center text-gray-500 py-8">
                  No data log available. Click "Refresh" to fetch data.
                </div>
              )}
            </TabsContent>

            {/* Debug Log Tab */}
            <TabsContent value="debug" className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 className="text-lg font-medium">Debug Log</h3>
                <Button onClick={clearDebugLog} variant="outline" size="sm">
                  Clear Log
                </Button>
              </div>

              <div className="space-y-2 max-h-96 overflow-y-auto">
                {debugLog.map((entry, index) => (
                  <div key={index} className="flex items-start space-x-3 p-3 border rounded-lg">
                    {getLogIcon(entry.type)}
                    <div className="flex-1">
                      <div className="flex justify-between items-start">
                        <span className="text-sm font-medium">{entry.message}</span>
                        <span className="text-xs text-gray-500">
                          {new Date(entry.timestamp).toLocaleTimeString()}
                        </span>
                      </div>
                      {entry.data && (
                        <pre className="text-xs bg-gray-100 p-2 rounded mt-2 overflow-auto">
                          {JSON.stringify(entry.data, null, 2)}
                        </pre>
                      )}
                    </div>
                  </div>
                ))}
                
                {debugLog.length === 0 && (
                  <div className="text-center text-gray-500 py-8">
                    No debug entries yet.
                  </div>
                )}
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}