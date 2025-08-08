import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
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
  Bluetooth,
  BluetoothConnected,
  Wifi,
  Heart,
  Activity,
  Watch,
  Smartphone,
  CheckCircle,
  AlertTriangle,
  Loader2,
  QrCode,
  Settings,
  HelpCircle
} from 'lucide-react';
import { realIoTDeviceService, type DeviceConnection } from '@/services/realIoTDeviceService';

interface DevicePairingWizardProps {
  onDeviceConnected?: (device: DeviceConnection) => void;
}

interface DeviceBrand {
  id: string;
  name: string;
  icon: React.ReactNode;
  color: string;
  devices: string[];
  instructions: string[];
  bluetoothName: string[];
}

const SUPPORTED_BRANDS: DeviceBrand[] = [
  {
    id: 'boat',
    name: 'boAt',
    icon: <Watch className="w-6 h-6" />,
    color: 'bg-red-500',
    devices: ['boAt Wave Pro', 'boAt Wave Sigma', 'boAt Storm Pro', 'boAt Xtend'],
    instructions: [
      'Press and hold the crown button for 3 seconds',
      'Navigate to Settings > Bluetooth > Pairing Mode',
      'Select "boAt Watch" from the device list',
      'Confirm pairing on your watch'
    ],
    bluetoothName: ['boAt', 'Boat', 'BOAT']
  },
  {
    id: 'fitbit',
    name: 'Fitbit',
    icon: <Activity className="w-6 h-6" />,
    color: 'bg-green-500',
    devices: ['Fitbit Charge 6', 'Fitbit Versa 4', 'Fitbit Sense 2', 'Fitbit Inspire 3'],
    instructions: [
      'Open Fitbit app on your phone first',
      'Go to Profile > Data Export > Third-party Apps',
      'Enable "Health Data Sharing"',
      'On your Fitbit, go to Settings > About > Bluetooth Pairing'
    ],
    bluetoothName: ['Fitbit', 'FB', 'Charge', 'Versa', 'Sense', 'Inspire']
  },
  {
    id: 'garmin',
    name: 'Garmin',
    icon: <Heart className="w-6 h-6" />,
    color: 'bg-blue-500',
    devices: ['Garmin Venu 3', 'Garmin Forerunner 965', 'Garmin Fenix 7', 'Garmin Vivoactive 5'],
    instructions: [
      'Press the UP button to access the main menu',
      'Select Settings > System > Connectivity > Bluetooth',
      'Enable "Smart Notifications" and "Bluetooth"',
      'Select "Pair Mobile Device"'
    ],
    bluetoothName: ['Garmin', 'GARMIN', 'Venu', 'Forerunner', 'Fenix', 'Vivoactive']
  },
  {
    id: 'apple',
    name: 'Apple Watch',
    icon: <Watch className="w-6 h-6" />,
    color: 'bg-gray-600',
    devices: ['Apple Watch Series 9', 'Apple Watch Ultra 2', 'Apple Watch SE'],
    instructions: [
      'Open Settings app on your Apple Watch',
      'Tap Privacy & Security > Health',
      'Enable "Share Health Data"',
      'On iPhone: Settings > Privacy > Health > HealthChain > Turn On All'
    ],
    bluetoothName: ['Apple Watch', 'Watch', 'Apple']
  },
  {
    id: 'samsung',
    name: 'Samsung Galaxy',
    icon: <Smartphone className="w-6 h-6" />,
    color: 'bg-purple-500',
    devices: ['Galaxy Watch 6', 'Galaxy Watch 6 Classic', 'Galaxy Watch 5'],
    instructions: [
      'Open Galaxy Wearable app on your phone',
      'Go to Watch settings > Advanced features',
      'Enable "Continuous HR measurement"',
      'Settings > Connections > Bluetooth > Available devices'
    ],
    bluetoothName: ['Galaxy Watch', 'Samsung', 'SM-R', 'Galaxy']
  },
  {
    id: 'xiaomi',
    name: 'Xiaomi Mi Band',
    icon: <Activity className="w-6 h-6" />,
    color: 'bg-orange-500',
    devices: ['Mi Band 8', 'Mi Band 7', 'Xiaomi Watch S3', 'Redmi Watch 4'],
    instructions: [
      'Open Mi Fitness app on your phone',
      'Go to Profile > Privacy settings',
      'Enable "Data sharing with third-party apps"',
      'On band: Settings > More > Factory reset (to enter pairing mode)'
    ],
    bluetoothName: ['Mi Band', 'Xiaomi', 'Redmi', 'MI', 'XIAOMI']
  }
];

export default function DevicePairingWizard({ onDeviceConnected }: DevicePairingWizardProps) {
  const [selectedBrand, setSelectedBrand] = useState<DeviceBrand | null>(null);
  const [pairingStep, setPairingStep] = useState(0);
  const [isConnecting, setIsConnecting] = useState(false);
  const [connectionProgress, setConnectionProgress] = useState(0);
  const [connectedDevice, setConnectedDevice] = useState<DeviceConnection | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [discoveredDevices, setDiscoveredDevices] = useState<BluetoothDevice[]>([]);

  const resetPairing = () => {
    setSelectedBrand(null);
    setPairingStep(0);
    setIsConnecting(false);
    setConnectionProgress(0);
    setConnectedDevice(null);
    setErrorMessage('');
    setDiscoveredDevices([]);
  };

  const startPairing = async (brand: DeviceBrand) => {
    setSelectedBrand(brand);
    setPairingStep(1);
    setErrorMessage('');
  };

  const connectDevice = async () => {
    if (!selectedBrand) return;

    setIsConnecting(true);
    setConnectionProgress(10);
    setPairingStep(2);

    try {
      // Check Bluetooth permissions first
      const permissions = await realIoTDeviceService.checkBluetoothPermissions();

      if (!permissions.supported) {
        throw new Error('Web Bluetooth not supported. Please use Chrome or Edge browser.');
      }

      if (!permissions.available) {
        throw new Error('Bluetooth not available. Please enable Bluetooth on your device.');
      }

      if (permissions.permission === 'denied') {
        throw new Error('Bluetooth permission denied. Please enable Bluetooth access in browser settings.');
      }

      // Show progress
      const progressInterval = setInterval(() => {
        setConnectionProgress(prev => Math.min(prev + 15, 90));
      }, 500);

      // Try to connect based on brand
      let device: DeviceConnection | null = null;

      switch (selectedBrand.id) {
        case 'boat':
          device = await realIoTDeviceService.connectBoAtDevice();
          break;
        case 'fitbit':
          device = await realIoTDeviceService.connectFitbitDevice();
          break;
        default:
          device = await realIoTDeviceService.connectDevice();
      }

      clearInterval(progressInterval);
      setConnectionProgress(100);

      if (device) {
        setConnectedDevice(device);
        setPairingStep(3);
        onDeviceConnected?.(device);

        // Auto-close after success
        setTimeout(() => {
          resetPairing();
        }, 3000);
      } else {
        throw new Error('Device connection failed - no device returned');
      }

    } catch (error: any) {
      setConnectionProgress(0);

      // Provide user-friendly error messages
      let userMessage = error.message || 'Failed to connect device';

      if (error.message?.includes('permissions policy')) {
        userMessage = 'Bluetooth blocked by browser. Try opening this page in a new tab or different browser.';
      } else if (error.message?.includes('SecurityError')) {
        userMessage = 'Bluetooth access denied. Please enable Bluetooth permissions and try again.';
      } else if (error.message?.includes('NotFoundError')) {
        userMessage = `No ${selectedBrand.name} devices found. Make sure your device is in pairing mode and nearby.`;
      } else if (error.message?.includes('HTTPS')) {
        userMessage = 'Secure connection required. Please use HTTPS or localhost.';
      }

      setErrorMessage(userMessage);
      setPairingStep(1);
    } finally {
      setIsConnecting(false);
    }
  };

  const scanForDevices = async () => {
    if (!selectedBrand) return;

    try {
      setIsConnecting(true);
      
      // Use Web Bluetooth to scan for devices matching the brand
      const filters = selectedBrand.bluetoothName.map(name => ({ namePrefix: name }));
      
      const device = await navigator.bluetooth.requestDevice({
        filters,
        optionalServices: ['heart_rate', 'battery_service', 'device_information']
      });

      if (device) {
        setDiscoveredDevices([device]);
        setPairingStep(2);
      }
    } catch (error: any) {
      setErrorMessage('No devices found. Make sure your device is in pairing mode.');
    } finally {
      setIsConnecting(false);
    }
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
          <Bluetooth className="w-4 h-4 mr-2" />
          Pair New Device
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center">
            <BluetoothConnected className="w-5 h-5 mr-2 text-blue-600" />
            Device Pairing Wizard
          </DialogTitle>
          <DialogDescription>
            Connect your wearable devices to start real-time health monitoring
          </DialogDescription>
        </DialogHeader>

        {/* Step 0: Brand Selection */}
        {pairingStep === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select Your Device Brand</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              {SUPPORTED_BRANDS.map((brand) => (
                <Card 
                  key={brand.id}
                  className="cursor-pointer hover:shadow-lg transition-all hover:scale-105"
                  onClick={() => startPairing(brand)}
                >
                  <CardContent className="p-4 text-center">
                    <div className={`w-12 h-12 rounded-full ${brand.color} flex items-center justify-center text-white mx-auto mb-3`}>
                      {brand.icon}
                    </div>
                    <h4 className="font-semibold">{brand.name}</h4>
                    <p className="text-xs text-gray-500 mt-1">
                      {brand.devices.length} models supported
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Alert className="mt-6">
              <HelpCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>Before pairing:</strong> Make sure your device is charged and within 3 feet of your computer. 
                Enable Bluetooth on both devices.
              </AlertDescription>
            </Alert>
          </div>
        )}

        {/* Step 1: Preparation Instructions */}
        {pairingStep === 1 && selectedBrand && (
          <div className="space-y-4">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Prepare Your {selectedBrand.name}</h3>
              <Button variant="outline" size="sm" onClick={resetPairing}>
                ← Back
              </Button>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center">
                  <div className={`w-8 h-8 rounded-full ${selectedBrand.color} flex items-center justify-center text-white mr-3`}>
                    {selectedBrand.icon}
                  </div>
                  {selectedBrand.name} Setup
                </CardTitle>
                <CardDescription>
                  Supported models: {selectedBrand.devices.join(', ')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <h4 className="font-medium">Follow these steps on your device:</h4>
                  <ol className="space-y-2">
                    {selectedBrand.instructions.map((instruction, index) => (
                      <li key={index} className="flex items-start space-x-3">
                        <span className="flex-shrink-0 w-6 h-6 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-sm font-medium">
                          {index + 1}
                        </span>
                        <span className="text-sm">{instruction}</span>
                      </li>
                    ))}
                  </ol>
                </div>
              </CardContent>
            </Card>

            {errorMessage && (
              <Alert className="border-red-200 bg-red-50">
                <AlertTriangle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-700">
                  {errorMessage}
                </AlertDescription>
              </Alert>
            )}

            <div className="flex space-x-3">
              <Button 
                onClick={scanForDevices}
                disabled={isConnecting}
                className="flex-1"
              >
                {isConnecting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Scanning...
                  </>
                ) : (
                  <>
                    <Bluetooth className="w-4 h-4 mr-2" />
                    Scan for Device
                  </>
                )}
              </Button>
              <Button 
                variant="outline"
                onClick={connectDevice}
                disabled={isConnecting}
              >
                Skip Scan & Connect
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Connection Progress */}
        {pairingStep === 2 && (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center">
              {isConnecting ? (
                <Loader2 className="w-16 h-16 text-blue-600 animate-spin" />
              ) : (
                <BluetoothConnected className="w-16 h-16 text-blue-600" />
              )}
            </div>
            
            <div>
              <h3 className="text-lg font-semibold mb-2">
                {isConnecting ? 'Connecting to your device...' : 'Ready to Connect'}
              </h3>
              <p className="text-gray-600">
                {isConnecting 
                  ? 'Please wait while we establish the connection'
                  : 'Make sure your device is in pairing mode'
                }
              </p>
            </div>

            {isConnecting && (
              <div className="space-y-2">
                <Progress value={connectionProgress} className="w-full" />
                <p className="text-sm text-gray-500">{connectionProgress}% complete</p>
              </div>
            )}

            {discoveredDevices.length > 0 && (
              <div className="space-y-3">
                <h4 className="font-medium">Found Devices:</h4>
                {discoveredDevices.map((device, index) => (
                  <Card key={index} className="text-left">
                    <CardContent className="p-3">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium">{device.name}</p>
                          <p className="text-sm text-gray-500">ID: {device.id}</p>
                        </div>
                        <Button size="sm" onClick={connectDevice}>
                          Connect
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isConnecting && discoveredDevices.length === 0 && (
              <Button onClick={connectDevice} className="w-full">
                Try Manual Connection
              </Button>
            )}
          </div>
        )}

        {/* Step 3: Success */}
        {pairingStep === 3 && connectedDevice && (
          <div className="space-y-6 text-center">
            <div className="flex items-center justify-center">
              <CheckCircle className="w-16 h-16 text-green-600" />
            </div>
            
            <div>
              <h3 className="text-xl font-bold text-green-600 mb-2">
                Successfully Connected!
              </h3>
              <p className="text-gray-600">
                Your {connectedDevice.name} is now streaming health data
              </p>
            </div>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                      <CheckCircle className="w-6 h-6 text-green-600" />
                    </div>
                    <div className="text-left">
                      <p className="font-medium">{connectedDevice.name}</p>
                      <p className="text-sm text-gray-500 capitalize">
                        {connectedDevice.type.replace('_', ' ')}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-green-100 text-green-700">
                    Connected
                  </Badge>
                </div>
                
                {connectedDevice.battery && (
                  <div className="mt-3 flex items-center justify-between text-sm">
                    <span className="text-gray-600">Battery Level</span>
                    <div className="flex items-center space-x-2">
                      <span>{connectedDevice.battery}%</span>
                      <Progress value={connectedDevice.battery} className="w-20 h-2" />
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            <Alert className="text-left">
              <CheckCircle className="h-4 w-4" />
              <AlertDescription>
                <strong>What's next?</strong> Your device will now automatically sync health data 
                including heart rate, steps, and other metrics. You can view real-time data on the 
                monitoring dashboard.
              </AlertDescription>
            </Alert>

            <Button onClick={resetPairing} className="w-full">
              Pair Another Device
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

export { DevicePairingWizard };
