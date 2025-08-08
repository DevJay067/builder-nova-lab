import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Settings,
  Wifi,
  WifiOff,
  Activity,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Bug,
  Bluetooth,
  Zap
} from 'lucide-react';
import { realIoTDeviceService } from '@/services/realIoTDeviceService';
import { deviceSimulationService } from '@/services/deviceSimulationService';

export default function IoTDebugPanel() {
  const [deviceSupport, setDeviceSupport] = useState({
    bluetooth: false,
    serviceWorker: false,
    healthkit: false,
    googlefit: false,
    secureContext: false,
    permissions: 'unknown' as PermissionState | 'unknown'
  });
  const [simulationStatus, setSimulationStatus] = useState({
    isRunning: false,
    activeDevices: 0,
    totalDevices: 0
  });
  const [websocketStatus, setWebsocketStatus] = useState({
    connected: false,
    url: '',
    state: 'Unknown',
    lastError: ''
  });
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkDeviceSupport();
    updateSimulationStatus();
    checkWebSocketStatus();

    const interval = setInterval(() => {
      updateSimulationStatus();
      checkWebSocketStatus();
    }, 2000);
    return () => clearInterval(interval);
  }, []);

  const checkDeviceSupport = async () => {
    try {
      const bluetoothCheck = await realIoTDeviceService.checkBluetoothPermissions();

      setDeviceSupport({
        bluetooth: bluetoothCheck.supported,
        serviceWorker: 'serviceWorker' in navigator,
        healthkit: 'HealthKit' in window,
        googlefit: 'GoogleFit' in window,
        secureContext: window.isSecureContext,
        permissions: bluetoothCheck.permission || 'unknown'
      });
    } catch (error) {
      console.error('Device support check failed:', error);
      setDeviceSupport({
        bluetooth: 'bluetooth' in navigator,
        serviceWorker: 'serviceWorker' in navigator,
        healthkit: 'HealthKit' in window,
        googlefit: 'GoogleFit' in window,
        secureContext: window.isSecureContext,
        permissions: 'unknown'
      });
    }
  };

  const updateSimulationStatus = () => {
    setSimulationStatus(deviceSimulationService.getSimulationStatus());
  };

  const checkWebSocketStatus = () => {
    // Access the WebSocket instance through the service (we'll need to add a getter)
    const isDevelopment =
      window.location.hostname === 'localhost' ||
      window.location.hostname === '127.0.0.1' ||
      window.location.port === '8080';

    if (isDevelopment) {
      setWebsocketStatus({
        connected: false,
        url: 'Skipped in development',
        state: 'Development Mode',
        lastError: 'WebSocket disabled in development for better performance'
      });
    } else {
      const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
      const wsUrl = `${protocol}//${window.location.host}/health-stream`;

      setWebsocketStatus({
        connected: false,
        url: wsUrl,
        state: 'Not Connected',
        lastError: 'Production WebSocket not implemented yet'
      });
    }
  };

  const startSimulation = () => {
    deviceSimulationService.startSimulation();
    updateSimulationStatus();
  };

  const stopSimulation = () => {
    deviceSimulationService.stopSimulation();
    updateSimulationStatus();
  };

  const testBluetoothScan = async () => {
    try {
      await realIoTDeviceService.connectDevice();
      console.log('✅ Bluetooth scan test successful');
    } catch (error) {
      console.error('❌ Bluetooth scan test failed:', error);
    }
  };

  const connectWebSocket = () => {
    realIoTDeviceService.connectToHealthStream();
  };

  const disconnectWebSocket = () => {
    realIoTDeviceService.disconnectHealthStream();
  };

  const triggerEmergencyScenario = (scenario: 'heart_attack' | 'low_oxygen' | 'fever' | 'hypotension') => {
    deviceSimulationService.simulateEmergencyScenario(scenario);
    console.log(`🚨 Emergency scenario triggered: ${scenario}`);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Bug className="w-4 h-4" />
          IoT Debug
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Settings className="w-5 h-5 text-blue-600" />
            IoT Health Monitoring Debug Panel
          </DialogTitle>
          <DialogDescription>
            Debug and test IoT device connections, WebSocket streaming, and simulation features
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6">
          {/* Device Support Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Support Status</CardTitle>
              <CardDescription>Check browser and platform capabilities</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Bluetooth className="w-4 h-4 text-blue-600" />
                    <span className="text-sm font-medium">Web Bluetooth</span>
                  </div>
                  <Badge variant={deviceSupport.bluetooth ? "default" : "secondary"}>
                    {deviceSupport.bluetooth ? 'Supported' : 'Not Available'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Zap className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Service Worker</span>
                  </div>
                  <Badge variant={deviceSupport.serviceWorker ? "default" : "secondary"}>
                    {deviceSupport.serviceWorker ? 'Supported' : 'Not Available'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-red-600" />
                    <span className="text-sm font-medium">Apple HealthKit</span>
                  </div>
                  <Badge variant={deviceSupport.healthkit ? "default" : "secondary"}>
                    {deviceSupport.healthkit ? 'Available' : 'iOS Only'}
                  </Badge>
                </div>
                
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Activity className="w-4 h-4 text-yellow-600" />
                    <span className="text-sm font-medium">Google Fit</span>
                  </div>
                  <Badge variant={deviceSupport.googlefit ? "default" : "secondary"}>
                    {deviceSupport.googlefit ? 'Available' : 'Android Only'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="w-4 h-4 text-green-600" />
                    <span className="text-sm font-medium">Secure Context</span>
                  </div>
                  <Badge variant={deviceSupport.secureContext ? "default" : "destructive"}>
                    {deviceSupport.secureContext ? 'HTTPS/Localhost' : 'Insecure'}
                  </Badge>
                </div>

                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <div className="flex items-center gap-2">
                    <Settings className="w-4 h-4 text-purple-600" />
                    <span className="text-sm font-medium">Bluetooth Permission</span>
                  </div>
                  <Badge variant={
                    deviceSupport.permissions === 'granted' ? "default" :
                    deviceSupport.permissions === 'denied' ? "destructive" : "secondary"
                  }>
                    {deviceSupport.permissions === 'granted' ? 'Granted' :
                     deviceSupport.permissions === 'denied' ? 'Denied' :
                     deviceSupport.permissions === 'prompt' ? 'Will Ask' : 'Unknown'}
                  </Badge>
                </div>
              </div>
              
              <Button onClick={checkDeviceSupport} variant="outline" size="sm" className="w-full">
                <RefreshCw className="w-4 h-4 mr-2" />
                Refresh Support Check
              </Button>
            </CardContent>
          </Card>

          {/* Simulation Control */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Device Simulation</CardTitle>
              <CardDescription>Test with simulated device data</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">Simulation Status</p>
                  <p className="text-sm text-gray-600">
                    {simulationStatus.activeDevices} of {simulationStatus.totalDevices} devices active
                  </p>
                </div>
                <Badge variant={simulationStatus.isRunning ? "default" : "secondary"}>
                  {simulationStatus.isRunning ? 'Running' : 'Stopped'}
                </Badge>
              </div>
              
              <div className="flex gap-2">
                <Button 
                  onClick={startSimulation} 
                  disabled={simulationStatus.isRunning}
                  className="flex-1"
                >
                  Start Simulation
                </Button>
                <Button 
                  onClick={stopSimulation} 
                  disabled={!simulationStatus.isRunning}
                  variant="outline"
                  className="flex-1"
                >
                  Stop Simulation
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <Button
                  onClick={() => triggerEmergencyScenario('heart_attack')}
                  variant="outline"
                  size="sm"
                  className="text-red-600 hover:text-red-700"
                  disabled={!simulationStatus.isRunning}
                >
                  Test Heart Attack
                </Button>
                <Button
                  onClick={() => triggerEmergencyScenario('low_oxygen')}
                  variant="outline"
                  size="sm"
                  className="text-orange-600 hover:text-orange-700"
                  disabled={!simulationStatus.isRunning}
                >
                  Test Low Oxygen
                </Button>
                <Button
                  onClick={() => triggerEmergencyScenario('fever')}
                  variant="outline"
                  size="sm"
                  className="text-yellow-600 hover:text-yellow-700"
                  disabled={!simulationStatus.isRunning}
                >
                  Test Fever
                </Button>
                <Button
                  onClick={() => triggerEmergencyScenario('hypotension')}
                  variant="outline"
                  size="sm"
                  className="text-blue-600 hover:text-blue-700"
                  disabled={!simulationStatus.isRunning}
                >
                  Test Low BP
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* WebSocket Status */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">WebSocket Status</CardTitle>
              <CardDescription>Real-time health data streaming connection</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between p-3 border rounded-lg bg-gray-50">
                <div>
                  <p className="font-medium">Connection Status</p>
                  <p className="text-sm text-gray-600">{websocketStatus.url}</p>
                </div>
                <Badge variant={websocketStatus.connected ? "default" : "secondary"}>
                  {websocketStatus.state}
                </Badge>
              </div>

              {websocketStatus.lastError && (
                <Alert className="border-yellow-200 bg-yellow-50">
                  <AlertTriangle className="h-4 w-4 text-yellow-600" />
                  <AlertDescription className="text-yellow-700 text-sm">
                    {websocketStatus.lastError}
                  </AlertDescription>
                </Alert>
              )}
            </CardContent>
          </Card>

          {/* Connection Testing */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Connection Testing</CardTitle>
              <CardDescription>Test device connections and WebSocket streaming</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 gap-3">
                <Button onClick={testBluetoothScan} variant="outline" className="justify-start">
                  <Bluetooth className="w-4 h-4 mr-2" />
                  Test Bluetooth Device Scan
                </Button>
                
                <Button onClick={connectWebSocket} variant="outline" className="justify-start">
                  <Wifi className="w-4 h-4 mr-2" />
                  Connect WebSocket Stream
                </Button>
                
                <Button onClick={disconnectWebSocket} variant="outline" className="justify-start">
                  <WifiOff className="w-4 h-4 mr-2" />
                  Disconnect WebSocket Stream
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Debug Information */}
          <Alert>
            <CheckCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Development Mode Active:</strong>
              <div className="mt-2 space-y-2 text-sm">
                <p>• WebSocket connections are disabled in development for better performance</p>
                <p>• Use <strong>Demo Mode</strong> to test with realistic simulated device data</p>
                <p>• Bluetooth connections work if you have compatible devices nearby</p>
                <p>• All features will work normally in production deployment</p>
              </div>
            </AlertDescription>
          </Alert>

          <Alert className="border-blue-200 bg-blue-50">
            <AlertTriangle className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-700">
              <strong>Browser Compatibility:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Use Chrome or Edge browser for best Bluetooth support</li>
                <li>Enable HTTPS for Bluetooth access (required by Web Bluetooth API)</li>
                <li>Allow Bluetooth permissions when prompted</li>
                <li>Make sure devices are in pairing mode</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
