/**
 * Real-time Health Data Streaming Server
 * WebSocket server for streaming health data from IoT devices
 */

import { WebSocketServer, WebSocket } from "ws";
import { createServer } from "http";

interface HealthDataStream {
  userId: string;
  deviceId: string;
  timestamp: Date;
  data: {
    heartRate?: number;
    bloodPressure?: { systolic: number; diastolic: number };
    temperature?: number;
    oxygenSaturation?: number;
    steps?: number;
    calories?: number;
    glucose?: number;
    weight?: number;
  };
}

interface ConnectedClient {
  id: string;
  userId?: string;
  socket: WebSocket;
  devices: string[];
  lastPing: Date;
}

class HealthStreamingServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, ConnectedClient> = new Map();
  private deviceStreams: Map<string, HealthDataStream[]> = new Map();

  constructor() {
    this.initializeWebSocketServer();
    this.setupPeriodicCleanup();
    this.setupDeviceDataIngestion();
  }

  private initializeWebSocketServer() {
    try {
      const server = createServer();
      this.wss = new WebSocketServer({
        server,
        path: "/health-stream",
        perMessageDeflate: false,
      });

      this.wss.on("connection", (ws: WebSocket, request) => {
        this.handleNewConnection(ws, request);
      });

      const port = process.env.WEBSOCKET_PORT || 8081;
      server.listen(port, () => {
        console.log(
          `🌐 Health Streaming WebSocket Server running on port ${port}`,
        );
      });
    } catch (error) {
      console.error("❌ Failed to start WebSocket server:", error);
    }
  }

  private handleNewConnection(ws: WebSocket, request: any) {
    const clientId = this.generateClientId();
    const client: ConnectedClient = {
      id: clientId,
      socket: ws,
      devices: [],
      lastPing: new Date(),
    };

    this.clients.set(clientId, client);
    console.log(`✅ New health stream client connected: ${clientId}`);

    // Send welcome message
    this.sendToClient(clientId, {
      type: "connection_established",
      clientId,
      timestamp: new Date().toISOString(),
    });

    // Handle messages from client
    ws.on("message", (data) => {
      try {
        const message = JSON.parse(data.toString());
        this.handleClientMessage(clientId, message);
      } catch (error) {
        console.error("Invalid message format:", error);
      }
    });

    // Handle client disconnect
    ws.on("close", () => {
      this.clients.delete(clientId);
      console.log(`🔌 Client disconnected: ${clientId}`);
    });

    // Handle errors
    ws.on("error", (error) => {
      console.error(`WebSocket error for client ${clientId}:`, error);
    });

    // Setup ping/pong for connection health
    ws.on("pong", () => {
      const client = this.clients.get(clientId);
      if (client) {
        client.lastPing = new Date();
      }
    });
  }

  private handleClientMessage(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (!client) return;

    switch (message.type) {
      case "authenticate":
        client.userId = message.userId;
        this.sendToClient(clientId, {
          type: "authenticated",
          userId: message.userId,
        });
        break;

      case "register_device":
        if (!client.devices.includes(message.deviceId)) {
          client.devices.push(message.deviceId);
          this.sendToClient(clientId, {
            type: "device_registered",
            deviceId: message.deviceId,
          });
        }
        break;

      case "health_data":
        this.processHealthData(clientId, message.data);
        break;

      case "request_device_data":
        this.sendDeviceHistory(clientId, message.deviceId);
        break;

      case "ping":
        client.lastPing = new Date();
        this.sendToClient(clientId, { type: "pong" });
        break;

      default:
        console.log(`Unknown message type: ${message.type}`);
    }
  }

  private processHealthData(clientId: string, data: HealthDataStream) {
    const client = this.clients.get(clientId);
    if (!client || !client.userId) return;

    // Validate and store health data
    const healthData: HealthDataStream = {
      ...data,
      timestamp: new Date(),
    };

    // Store in device streams
    const deviceId = data.deviceId;
    if (!this.deviceStreams.has(deviceId)) {
      this.deviceStreams.set(deviceId, []);
    }

    const deviceHistory = this.deviceStreams.get(deviceId)!;
    deviceHistory.push(healthData);

    // Keep only last 1000 readings per device
    if (deviceHistory.length > 1000) {
      deviceHistory.splice(0, deviceHistory.length - 1000);
    }

    // Broadcast to all clients monitoring this device
    this.broadcastHealthData(deviceId, healthData);

    // Check for alerts
    this.checkHealthAlerts(healthData);
  }

  private broadcastHealthData(deviceId: string, data: HealthDataStream) {
    const message = {
      type: "vital_signs",
      payload: data,
    };

    this.clients.forEach((client) => {
      if (
        client.devices.includes(deviceId) &&
        client.socket.readyState === WebSocket.OPEN
      ) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }

  private checkHealthAlerts(data: HealthDataStream) {
    const alerts = [];

    // Heart rate alerts
    if (data.data.heartRate) {
      if (data.data.heartRate > 100) {
        alerts.push({
          type: "warning",
          severity: "high",
          message: `High heart rate detected: ${data.data.heartRate} BPM`,
          deviceId: data.deviceId,
          timestamp: new Date(),
        });
      } else if (data.data.heartRate < 50) {
        alerts.push({
          type: "warning",
          severity: "medium",
          message: `Low heart rate detected: ${data.data.heartRate} BPM`,
          deviceId: data.deviceId,
          timestamp: new Date(),
        });
      }
    }

    // Blood pressure alerts
    if (data.data.bloodPressure) {
      const { systolic, diastolic } = data.data.bloodPressure;
      if (systolic > 140 || diastolic > 90) {
        alerts.push({
          type: "warning",
          severity: "high",
          message: `High blood pressure: ${systolic}/${diastolic} mmHg`,
          deviceId: data.deviceId,
          timestamp: new Date(),
        });
      }
    }

    // Temperature alerts
    if (data.data.temperature && data.data.temperature > 100.4) {
      alerts.push({
        type: "warning",
        severity: "high",
        message: `Fever detected: ${data.data.temperature.toFixed(1)}°F`,
        deviceId: data.deviceId,
        timestamp: new Date(),
      });
    }

    // Oxygen saturation alerts
    if (data.data.oxygenSaturation && data.data.oxygenSaturation < 95) {
      alerts.push({
        type: "alert",
        severity: "critical",
        message: `Low oxygen saturation: ${data.data.oxygenSaturation}%`,
        deviceId: data.deviceId,
        timestamp: new Date(),
      });
    }

    // Send alerts to relevant clients
    if (alerts.length > 0) {
      this.broadcastAlerts(data.deviceId, alerts);
    }
  }

  private broadcastAlerts(deviceId: string, alerts: any[]) {
    const message = {
      type: "health_alerts",
      deviceId,
      alerts,
    };

    this.clients.forEach((client) => {
      if (
        client.devices.includes(deviceId) &&
        client.socket.readyState === WebSocket.OPEN
      ) {
        client.socket.send(JSON.stringify(message));
      }
    });
  }

  private sendDeviceHistory(clientId: string, deviceId: string) {
    const history = this.deviceStreams.get(deviceId) || [];
    const recentHistory = history.slice(-50); // Last 50 readings

    this.sendToClient(clientId, {
      type: "device_history",
      deviceId,
      data: recentHistory,
    });
  }

  private sendToClient(clientId: string, message: any) {
    const client = this.clients.get(clientId);
    if (client && client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  private generateClientId(): string {
    return `client_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private setupPeriodicCleanup() {
    setInterval(() => {
      const now = new Date();
      const timeout = 5 * 60 * 1000; // 5 minutes

      this.clients.forEach((client, clientId) => {
        if (now.getTime() - client.lastPing.getTime() > timeout) {
          console.log(`🧹 Cleaning up inactive client: ${clientId}`);
          client.socket.terminate();
          this.clients.delete(clientId);
        }
      });
    }, 60000); // Check every minute
  }

  private setupDeviceDataIngestion() {
    // Setup external device data ingestion endpoints
    this.setupFitbitIngestion();
    this.setupAppleHealthIngestion();
    this.setupGarminIngestion();
    this.setupBoAtIngestion();
  }

  private setupFitbitIngestion() {
    // Fitbit Web API integration
    console.log("🔗 Setting up Fitbit data ingestion...");
    // This would integrate with Fitbit's Web API to pull real data
  }

  private setupAppleHealthIngestion() {
    // Apple HealthKit integration for iOS
    console.log("🍎 Setting up Apple Health data ingestion...");
    // This would integrate with HealthKit for iOS devices
  }

  private setupGarminIngestion() {
    // Garmin Connect IQ integration
    console.log("⌚ Setting up Garmin data ingestion...");
    // This would integrate with Garmin's API
  }

  private setupBoAtIngestion() {
    // boAt wearables integration
    console.log("🎧 Setting up boAt device data ingestion...");
    // Custom integration for boAt devices
  }

  // Public API
  getConnectedClients(): number {
    return this.clients.size;
  }

  getDeviceStreamCount(): number {
    return this.deviceStreams.size;
  }

  broadcastSystemMessage(message: any) {
    this.clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.send(
          JSON.stringify({
            type: "system_message",
            ...message,
          }),
        );
      }
    });
  }

  // Simulate device data for testing
  simulateDeviceData(deviceId: string) {
    const simulatedData: HealthDataStream = {
      userId: "test_user",
      deviceId,
      timestamp: new Date(),
      data: {
        heartRate: Math.floor(Math.random() * 40) + 60, // 60-100 BPM
        bloodPressure: {
          systolic: Math.floor(Math.random() * 30) + 110, // 110-140
          diastolic: Math.floor(Math.random() * 20) + 70, // 70-90
        },
        temperature: Math.random() * 2 + 98, // 98-100°F
        oxygenSaturation: Math.floor(Math.random() * 5) + 96, // 96-100%
        steps: Math.floor(Math.random() * 100),
        calories: Math.floor(Math.random() * 50),
      },
    };

    this.processHealthData("simulator", simulatedData);
  }
}

export const healthStreamingServer = new HealthStreamingServer();
export type { HealthDataStream, ConnectedClient };
