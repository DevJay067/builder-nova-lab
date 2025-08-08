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
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    checkDeviceSupport();
    updateSimulationStatus();
    
    const interval = setInterval(updateSimulationStatus, 2000);
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
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              <strong>Debug Tips:</strong>
              <ul className="list-disc list-inside mt-2 space-y-1 text-sm">
                <li>Use Chrome or Edge browser for best Bluetooth support</li>
                <li>Enable HTTPS for Bluetooth access (required by Web Bluetooth API)</li>
                <li>Start with simulation mode to test the UI without real devices</li>
                <li>Check browser console for detailed error messages</li>
                <li>WebSocket errors in localhost are normal - they'll work in production</li>
              </ul>
            </AlertDescription>
          </Alert>
        </div>
      </DialogContent>
    </Dialog>
  );
}
