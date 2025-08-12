import { randomInt } from "crypto";

export interface VitalsPayload {
  heartRate: number;
  bloodPressure: { systolic: number; diastolic: number };
  temperature: number;
  oxygenSaturation: number;
  respiratoryRate: number;
  timestamp: string;
}

/**
 * Simple in-memory IoT vitals service with SSE broadcast support
 */
export class IoTVitalsService {
  private static latest: VitalsPayload = IoTVitalsService.generateRandomVitals();
  private static clients: Set<NodeJS.WritableStream> = new Set();
  private static mockInterval: NodeJS.Timeout | null = null;

  static getLatest(): VitalsPayload {
    return this.latest;
  }

  static updateVitals(payload: Partial<VitalsPayload>): VitalsPayload {
    const now = new Date().toISOString();
    const next: VitalsPayload = {
      heartRate: payload.heartRate ?? this.latest.heartRate,
      bloodPressure: payload.bloodPressure ?? this.latest.bloodPressure,
      temperature: payload.temperature ?? this.latest.temperature,
      oxygenSaturation: payload.oxygenSaturation ?? this.latest.oxygenSaturation,
      respiratoryRate: payload.respiratoryRate ?? this.latest.respiratoryRate,
      timestamp: payload.timestamp ?? now,
    };
    this.latest = next;
    this.broadcast(next);
    return next;
  }

  static addClient(stream: NodeJS.WritableStream): void {
    this.clients.add(stream);
  }

  static removeClient(stream: NodeJS.WritableStream): void {
    this.clients.delete(stream);
  }

  static broadcast(data: VitalsPayload): void {
    const payload = `data: ${JSON.stringify(data)}\n\n`;
    for (const client of Array.from(this.clients)) {
      try {
        client.write(payload);
      } catch {
        this.clients.delete(client);
      }
    }
  }

  static startMock(): void {
    if (this.mockInterval) return;
    this.mockInterval = setInterval(() => {
      const next = this.generateRandomVitals();
      this.latest = next;
      this.broadcast(next);
    }, 3000);
  }

  static stopMock(): void {
    if (this.mockInterval) clearInterval(this.mockInterval);
    this.mockInterval = null;
  }

  private static generateRandomVitals(): VitalsPayload {
    const now = new Date().toISOString();
    return {
      heartRate: randomInt(65, 86),
      bloodPressure: { systolic: randomInt(110, 131), diastolic: randomInt(70, 86) },
      temperature: 97.5 + Math.random() * 2,
      oxygenSaturation: randomInt(97, 101),
      respiratoryRate: randomInt(14, 21),
      timestamp: now,
    };
  }
}