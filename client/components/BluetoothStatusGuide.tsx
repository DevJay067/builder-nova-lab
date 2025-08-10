import React, { useState, useEffect } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Bluetooth,
  BluetoothConnected,
  AlertTriangle,
  CheckCircle,
  Monitor,
  Smartphone,
  RefreshCw,
  Settings,
  HelpCircle,
} from "lucide-react";
import { realIoTDeviceService } from "@/services/realIoTDeviceService";

interface BluetoothStatusGuideProps {
  className?: string;
}

export default function BluetoothStatusGuide({
  className = "",
}: BluetoothStatusGuideProps) {
  const [bluetoothStatus, setBluetoothStatus] = useState({
    supported: false,
    available: false,
    permission: "unknown" as PermissionState | "unknown",
    checking: true,
  });

  const checkBluetoothStatus = async () => {
    setBluetoothStatus((prev) => ({ ...prev, checking: true }));

    try {
      const status = await realIoTDeviceService.checkBluetoothPermissions();
      setBluetoothStatus({
        supported: status.supported,
        available: status.available,
        permission: status.permission || "unknown",
        checking: false,
      });
    } catch (error) {
      console.error("Bluetooth status check failed:", error);
      setBluetoothStatus({
        supported: "bluetooth" in navigator,
        available: false,
        permission: "unknown",
        checking: false,
      });
    }
  };

  useEffect(() => {
    checkBluetoothStatus();
  }, []);

  const getStatusIcon = () => {
    if (bluetoothStatus.checking) {
      return <RefreshCw className="w-5 h-5 animate-spin text-blue-600" />;
    }

    if (!bluetoothStatus.supported) {
      return <AlertTriangle className="w-5 h-5 text-red-600" />;
    }

    if (bluetoothStatus.available && bluetoothStatus.permission === "granted") {
      return <BluetoothConnected className="w-5 h-5 text-green-600" />;
    }

    return <Bluetooth className="w-5 h-5 text-yellow-600" />;
  };

  const getStatusText = () => {
    if (bluetoothStatus.checking) return "Checking...";
    if (!bluetoothStatus.supported) return "Not Supported";
    if (!bluetoothStatus.available) return "Disabled";
    if (bluetoothStatus.permission === "denied") return "Permission Denied";
    if (bluetoothStatus.permission === "granted") return "Ready";
    return "Needs Setup";
  };

  const getStatusColor = () => {
    if (bluetoothStatus.checking)
      return "bg-blue-50 text-blue-700 border-blue-200";
    if (
      !bluetoothStatus.supported ||
      !bluetoothStatus.available ||
      bluetoothStatus.permission === "denied"
    ) {
      return "bg-red-50 text-red-700 border-red-200";
    }
    if (bluetoothStatus.permission === "granted")
      return "bg-green-50 text-green-700 border-green-200";
    return "bg-yellow-50 text-yellow-700 border-yellow-200";
  };

  const getPlatformInstructions = () => {
    const userAgent = navigator.userAgent.toLowerCase();

    if (userAgent.includes("windows")) {
      return {
        platform: "Windows",
        icon: <Monitor className="w-4 h-4" />,
        steps: [
          "Click Start button and open Settings",
          "Go to Devices → Bluetooth & other devices",
          "Turn on Bluetooth toggle switch",
          "Refresh this page and try again",
        ],
      };
    }

    if (userAgent.includes("mac")) {
      return {
        platform: "macOS",
        icon: <Monitor className="w-4 h-4" />,
        steps: [
          "Click Apple menu and open System Preferences",
          "Click on Bluetooth",
          "Turn Bluetooth On",
          "Refresh this page and try again",
        ],
      };
    }

    if (userAgent.includes("android")) {
      return {
        platform: "Android",
        icon: <Smartphone className="w-4 h-4" />,
        steps: [
          "Open Settings app",
          "Go to Connected devices → Bluetooth",
          "Turn on Bluetooth",
          "Refresh this page and try again",
        ],
      };
    }

    return {
      platform: "Your Device",
      icon: <Settings className="w-4 h-4" />,
      steps: [
        "Open your device settings",
        "Find Bluetooth settings",
        "Enable Bluetooth",
        "Refresh this page and try again",
      ],
    };
  };

  const instructions = getPlatformInstructions();

  return (
    <Card
      className={`${className} border-0 bg-white/80 backdrop-blur-sm rounded-2xl`}
    >
      <CardHeader>
        <CardTitle className="flex items-center gap-3">
          {getStatusIcon()}
          Bluetooth Status
          <Badge className={`ml-auto ${getStatusColor()}`}>
            {getStatusText()}
          </Badge>
        </CardTitle>
        <CardDescription>
          Check your device's Bluetooth connectivity for IoT health monitoring
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Status Details */}
        <div className="grid grid-cols-1 gap-3">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-700">Browser Support</span>
            <div className="flex items-center gap-2">
              {bluetoothStatus.supported ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span
                className={
                  bluetoothStatus.supported ? "text-green-600" : "text-red-600"
                }
              >
                {bluetoothStatus.supported ? "Supported" : "Not Supported"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-700">
              Bluetooth Hardware
            </span>
            <div className="flex items-center gap-2">
              {bluetoothStatus.available ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              )}
              <span
                className={
                  bluetoothStatus.available ? "text-green-600" : "text-red-600"
                }
              >
                {bluetoothStatus.available ? "Available" : "Disabled"}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded-xl">
            <span className="font-medium text-gray-700">
              Browser Permission
            </span>
            <div className="flex items-center gap-2">
              {bluetoothStatus.permission === "granted" ? (
                <CheckCircle className="w-4 h-4 text-green-600" />
              ) : bluetoothStatus.permission === "denied" ? (
                <AlertTriangle className="w-4 h-4 text-red-600" />
              ) : (
                <HelpCircle className="w-4 h-4 text-yellow-600" />
              )}
              <span
                className={
                  bluetoothStatus.permission === "granted"
                    ? "text-green-600"
                    : bluetoothStatus.permission === "denied"
                      ? "text-red-600"
                      : "text-yellow-600"
                }
              >
                {bluetoothStatus.permission === "granted"
                  ? "Granted"
                  : bluetoothStatus.permission === "denied"
                    ? "Denied"
                    : bluetoothStatus.permission === "prompt"
                      ? "Will Ask"
                      : "Unknown"}
              </span>
            </div>
          </div>
        </div>

        {/* Instructions */}
        {(!bluetoothStatus.supported || !bluetoothStatus.available) && (
          <Alert className="border-blue-200 bg-blue-50">
            <instructions.icon />
            <AlertDescription>
              <div className="space-y-3">
                <div className="font-medium text-blue-800">
                  {!bluetoothStatus.supported
                    ? "Web Bluetooth not supported in this browser"
                    : `To enable Bluetooth on ${instructions.platform}:`}
                </div>

                {bluetoothStatus.supported && (
                  <ol className="list-decimal list-inside space-y-1 text-sm text-blue-700">
                    {instructions.steps.map((step, index) => (
                      <li key={index}>{step}</li>
                    ))}
                  </ol>
                )}

                {!bluetoothStatus.supported && (
                  <div className="text-sm text-blue-700">
                    Please use Chrome or Edge browser for the best Bluetooth
                    support, or try Demo Mode to test the interface.
                  </div>
                )}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Actions */}
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={checkBluetoothStatus}
            disabled={bluetoothStatus.checking}
            className="flex-1"
          >
            <RefreshCw
              className={`w-4 h-4 mr-2 ${bluetoothStatus.checking ? "animate-spin" : ""}`}
            />
            Check Again
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
