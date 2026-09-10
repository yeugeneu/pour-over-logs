import { AcaiaScaleModel, ScaleDeviceInfo, ScaleTelemetry } from '../types/scale';

// GATT Service & Characteristic UUIDs
export const ACAIA_BM71_SERVICE_UUID = '49535343-fe7d-4ae5-8fa9-9fafd205e455';
export const ACAIA_BM71_WRITE_CHAR_UUID = '49535343-8841-43f4-a8d4-ecbe34729bb3';
export const ACAIA_BM71_NOTIFY_CHAR_UUID = '49535343-1e4d-4bd9-ba61-23c647249616';

export const ACAIA_CSR_SERVICE_UUID = '00001820-0000-1000-8000-00805f9b34fb';
export const ACAIA_CSR_CHAR_UUID = '00002a80-0000-1000-8000-00805f9b34fb';
export const ACAIA_OLD_CSR_SERVICE_UUID = '0000ffe0-0000-1000-8000-00805f9b34fb';
export const ACAIA_OLD_CSR_CHAR_UUID = '0000ffe1-0000-1000-8000-00805f9b34fb';

export function isIOSorBluefy(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = (navigator.userAgent || navigator.vendor || '').toLowerCase();
  return /iphone|ipad|ipod/.test(ua) || ua.includes('bluefy');
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

const HEADER1 = 0xef;
const HEADER2 = 0xdd;

const MSG_WEIGHT = 5;
const MSG_BATTERY = 6;
const MSG_TIMER = 7;
const MSG_BUTTON = 8;
const MSG_HEARTBEAT = 11;
const CMD_EVENT = 12;
const CMD_SETTINGS = 8;

export type ScaleEventCallback = (telemetry: ScaleTelemetry) => void;
export type ScaleButtonCallback = (button: 'tare' | 'start' | 'stop' | 'reset') => void;
export type ScaleDisconnectCallback = () => void;

export class AcaiaScaleDriver {
  private device: BluetoothDevice | null = null;
  private gattServer: BluetoothRemoteGATTServer | null = null;
  private writeChar: BluetoothRemoteGATTCharacteristic | null = null;
  private notifyChar: BluetoothRemoteGATTCharacteristic | null = null;

  private isBM71 = true;
  private heartbeatInterval: ReturnType<typeof setInterval> | null = null;
  private buffer: number[] = [];
  private weightHistory: { timestamp: number; weight: number }[] = [];

  // Current Telemetry
  private currentWeight = 0;
  private currentFlowRate = 0;
  private currentBattery: number | null = null;
  private currentUnit: 'g' | 'oz' = 'g';
  private timerSeconds = 0;
  private timerRunning = false;
  private isStable = true;

  // Listeners
  private telemetryListeners: Set<ScaleEventCallback> = new Set();
  private buttonListeners: Set<ScaleButtonCallback> = new Set();
  private disconnectListeners: Set<ScaleDisconnectCallback> = new Set();

  // Simulation State
  private isSimulated = false;
  private simTimer: ReturnType<typeof setInterval> | null = null;
  private simPourInterval: ReturnType<typeof setInterval> | null = null;
  private simTargetWeight = 0;

  public isConnected(): boolean {
    if (this.isSimulated) return true;
    return !!(this.gattServer && this.gattServer.connected);
  }

  public getDeviceInfo(): ScaleDeviceInfo | null {
    if (this.isSimulated) {
      return {
        id: 'simulated-acaia-scale',
        name: 'Acaia Pearl (Simulated)',
        model: 'Simulated Scale',
        battery: 98,
        unit: 'g',
        isSimulated: true,
      };
    }

    if (!this.device) return null;

    const rawName = this.device.name || 'Acaia Scale';
    let model: AcaiaScaleModel = 'Pearl';
    const upper = rawName.toUpperCase();

    if (upper.includes('PEARLS')) {
      model = 'Pearl S';
    } else if (upper.includes('PEARL-') || upper.includes('PEARL 2021') || upper.includes('PEARL_2021')) {
      model = 'Pearl 2021';
    } else if (upper.includes('PEARL')) {
      model = 'Pearl';
    } else if (upper.includes('LUNAR')) {
      model = 'Lunar';
    } else if (upper.includes('PYXIS')) {
      model = 'Pyxis';
    } else if (upper.includes('CINCO')) {
      model = 'Cinco';
    } else {
      model = 'Unknown Acaia';
    }

    return {
      id: this.device.id,
      name: rawName,
      model,
      battery: this.currentBattery,
      unit: this.currentUnit,
      isSimulated: false,
    };
  }

  public getTelemetry(): ScaleTelemetry {
    return {
      weight: this.currentWeight,
      flowRate: this.currentFlowRate,
      isStable: this.isStable,
      timerSeconds: this.timerSeconds,
      timerRunning: this.timerRunning,
      battery: this.currentBattery,
      unit: this.currentUnit,
      timestamp: Date.now(),
    };
  }

  public onTelemetry(callback: ScaleEventCallback): () => void {
    this.telemetryListeners.add(callback);
    return () => this.telemetryListeners.delete(callback);
  }

  public onButton(callback: ScaleButtonCallback): () => void {
    this.buttonListeners.add(callback);
    return () => this.buttonListeners.delete(callback);
  }

  public onDisconnect(callback: ScaleDisconnectCallback): () => void {
    this.disconnectListeners.add(callback);
    return () => this.disconnectListeners.delete(callback);
  }

  /**
   * Request device & establish Web Bluetooth GATT connection
   */
  public async connect(options?: { scanAll?: boolean }): Promise<ScaleDeviceInfo> {
    if (typeof navigator === 'undefined' || !navigator.bluetooth) {
      throw new Error('Web Bluetooth API is not supported in this browser. Please use Google Chrome, Microsoft Edge, Opera, or Bluefy (iOS).');
    }

    this.disconnect();

    const optionalServices: string[] = [
      ACAIA_BM71_SERVICE_UUID,
      ACAIA_CSR_SERVICE_UUID,
      ACAIA_OLD_CSR_SERVICE_UUID,
    ];

    const requestOptions: RequestDeviceOptions = options?.scanAll
      ? {
          acceptAllDevices: true,
          optionalServices,
        }
      : {
          filters: [
            { namePrefix: 'ACAIA' },
            { namePrefix: 'Acaia' },
            { namePrefix: 'acaia' },
            { namePrefix: 'PEARL' },
            { namePrefix: 'Pearl' },
            { namePrefix: 'pearl' },
            { namePrefix: 'LUNAR' },
            { namePrefix: 'Lunar' },
            { namePrefix: 'lunar' },
            { namePrefix: 'PYXIS' },
            { namePrefix: 'Pyxis' },
            { namePrefix: 'CINCO' },
            { namePrefix: 'PROCH' },
            { namePrefix: 'FELICITA' },
          ],
          optionalServices,
        };

    try {
      const device = await navigator.bluetooth.requestDevice(requestOptions);

      this.device = device;
      device.addEventListener('gattserverdisconnected', this.handleGattDisconnected);

      const server = await device.gatt?.connect();
      if (!server) throw new Error('Failed to connect to scale GATT server');
      this.gattServer = server;

      // Stabilization delay for iOS CoreBluetooth / Bluefy
      await delay(300);

      // Check whether this scale uses Microchip BM71 ISSC service or CSR service
      let service: BluetoothRemoteGATTService | null = null;
      try {
        service = await server.getPrimaryService(ACAIA_BM71_SERVICE_UUID);
        this.isBM71 = true;
      } catch {
        await delay(150);
        // Fallback to CSR service
        try {
          service = await server.getPrimaryService(ACAIA_CSR_SERVICE_UUID);
          this.isBM71 = false;
        } catch {
          await delay(150);
          try {
            service = await server.getPrimaryService(ACAIA_OLD_CSR_SERVICE_UUID);
            this.isBM71 = false;
          } catch {
            service = null;
          }
        }
      }

      if (!service) throw new Error('Could not find compatible Acaia GATT service');

      await delay(150);

      if (this.isBM71) {
        this.writeChar = await service.getCharacteristic(ACAIA_BM71_WRITE_CHAR_UUID);
        this.notifyChar = await service.getCharacteristic(ACAIA_BM71_NOTIFY_CHAR_UUID);
      } else {
        try {
          const char = await service.getCharacteristic(ACAIA_CSR_CHAR_UUID);
          this.writeChar = char;
          this.notifyChar = char;
        } catch {
          const char = await service.getCharacteristic(ACAIA_OLD_CSR_CHAR_UUID);
          this.writeChar = char;
          this.notifyChar = char;
        }
      }

      await delay(150);

      // Start notifications
      await this.notifyChar.startNotifications();
      this.notifyChar.addEventListener('characteristicvaluechanged', this.handleNotification);
      // Dual-bind for Bluefy / iOS WKWebView event bridge
      (this.notifyChar as any).oncharacteristicvaluechanged = this.handleNotification;

      await delay(250);

      // Perform Handshake & Request Notifications
      await this.sendAuth();
      await delay(200);
      await this.sendNotificationRequest();

      // Start Heartbeat interval
      this.startHeartbeat();

      const info = this.getDeviceInfo()!;
      return info;
    } catch (err: any) {
      this.disconnect();
      throw err;
    }
  }

  /**
   * Connect to a simulated scale for testing / demo
   */
  public connectSimulated(): ScaleDeviceInfo {
    this.disconnect();
    this.isSimulated = true;
    this.currentWeight = 0;
    this.currentFlowRate = 0;
    this.currentBattery = 98;
    this.currentUnit = 'g';
    this.timerSeconds = 0;
    this.timerRunning = false;
    this.isStable = true;

    // Simulate idle background noise & heartbeat
    this.simTimer = setInterval(() => {
      if (this.timerRunning) {
        this.timerSeconds += 1;
      }

      this.emitTelemetry();
    }, 1000);

    return this.getDeviceInfo()!;
  }

  /**
   * Simulate a water pour (useful for testing auto-start and live graphs)
   */
  public simulatePour(targetGrams: number, flowRateGps: number = 4.0): void {
    if (!this.isSimulated) return;
    if (this.simPourInterval) clearInterval(this.simPourInterval);

    this.simTargetWeight = Math.max(0, this.currentWeight + targetGrams);
    const stepIntervalMs = 100;
    const gramsPerStep = (flowRateGps * stepIntervalMs) / 1000;

    this.simPourInterval = setInterval(() => {
      if (this.currentWeight < this.simTargetWeight) {
        this.currentWeight = parseFloat(
          (this.currentWeight + gramsPerStep + (Math.random() * 0.04 - 0.02)).toFixed(1)
        );
        this.calculateFlowRate(this.currentWeight, Date.now());
        this.emitTelemetry();
      } else {
        this.currentWeight = this.simTargetWeight;
        this.currentFlowRate = 0;
        this.emitTelemetry();
        if (this.simPourInterval) {
          clearInterval(this.simPourInterval);
          this.simPourInterval = null;
        }
      }
    }, stepIntervalMs);
  }

  public async disconnect(): Promise<void> {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
      this.heartbeatInterval = null;
    }
    if (this.simTimer) {
      clearInterval(this.simTimer);
      this.simTimer = null;
    }
    if (this.simPourInterval) {
      clearInterval(this.simPourInterval);
      this.simPourInterval = null;
    }

    if (this.notifyChar) {
      try {
        this.notifyChar.removeEventListener('characteristicvaluechanged', this.handleNotification);
        (this.notifyChar as any).oncharacteristicvaluechanged = null;
        await this.notifyChar.stopNotifications();
      } catch {}
      this.notifyChar = null;
    }

    if (this.device) {
      this.device.removeEventListener('gattserverdisconnected', this.handleGattDisconnected);
      if (this.device.gatt?.connected) {
        this.device.gatt.disconnect();
      }
      this.device = null;
    }

    this.gattServer = null;
    this.writeChar = null;
    this.isSimulated = false;
    this.buffer = [];
    this.weightHistory = [];
    this.currentFlowRate = 0;
  }

  // Commands

  public async tare(): Promise<void> {
    if (this.isSimulated) {
      this.currentWeight = 0;
      this.currentFlowRate = 0;
      this.weightHistory = [];
      this.emitTelemetry();
      return;
    }
    await this.sendCommand(4, [0]);
  }

  public async startTimer(): Promise<void> {
    this.timerRunning = true;
    if (this.isSimulated) {
      this.emitTelemetry();
      return;
    }
    await this.sendCommand(13, [0, 0]);
  }

  public async pauseTimer(): Promise<void> {
    this.timerRunning = false;
    if (this.isSimulated) {
      this.emitTelemetry();
      return;
    }
    await this.sendCommand(13, [0, 2]);
  }

  public async resetTimer(): Promise<void> {
    this.timerSeconds = 0;
    this.timerRunning = false;
    if (this.isSimulated) {
      this.emitTelemetry();
      return;
    }
    await this.sendCommand(13, [0, 1]);
  }

  public async beep(): Promise<void> {
    if (this.isSimulated) return;
    // Sound command
    await this.sendCommand(6, [0]);
  }

  // Protocol Implementation

  private async sendAuth(): Promise<void> {
    // Auth payload:
    // New: "012345678901234"
    // Classic: "---------------"
    const payload = this.isBM71
      ? [0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37, 0x38, 0x39, 0x30, 0x31, 0x32, 0x33, 0x34]
      : Array(15).fill(0x2d);

    await this.sendCommand(11, payload);
  }

  private async sendNotificationRequest(): Promise<void> {
    // Request weight, battery, timer, key events
    const payload = [9, 0, 1, 1, 2, 2, 5, 3, 4];
    await this.sendCommand(12, payload);
  }

  private startHeartbeat(): void {
    if (this.heartbeatInterval) clearInterval(this.heartbeatInterval);

    this.heartbeatInterval = setInterval(async () => {
      if (!this.isConnected()) return;
      try {
        if (this.isBM71) {
          // Re-affirm auth & heartbeat for BM71
          await this.sendAuth();
        }
        await this.sendCommand(0, [2, 0]);
      } catch (err) {
        console.warn('Failed to send Acaia heartbeat', err);
      }
    }, 1000);
  }

  private encodePacket(msgType: number, payload: number[]): Uint8Array {
    let even = 0;
    let odd = 0;
    for (let i = 0; i < payload.length; i++) {
      if (i % 2 === 0) even += payload[i];
      else odd += payload[i];
    }
    return new Uint8Array([
      HEADER1,
      HEADER2,
      msgType,
      ...payload,
      even & 0xff,
      odd & 0xff,
    ]);
  }

  private async sendCommand(msgType: number, payload: number[]): Promise<void> {
    if (!this.writeChar) return;
    const packet = this.encodePacket(msgType, payload);
    const char = this.writeChar as any;

    if (typeof char.writeValueWithResponse === 'function') {
      try {
        await char.writeValueWithResponse(packet);
        return;
      } catch {
        // Fallback below
      }
    }

    if (typeof char.writeValue === 'function') {
      try {
        await char.writeValue(packet);
        return;
      } catch {
        // Fallback below
      }
    }

    if (typeof char.writeValueWithoutResponse === 'function') {
      try {
        await char.writeValueWithoutResponse(packet);
      } catch (err) {
        console.warn('Error sending command to Acaia scale:', err);
      }
    }
  }

  private handleNotification = (event: Event) => {
    const char = event.target as BluetoothRemoteGATTCharacteristic;
    if (!char.value) return;

    const data = new Uint8Array(char.value.buffer);
    for (let i = 0; i < data.length; i++) {
      this.buffer.push(data[i]);
    }

    this.processBuffer();
  };

  private processBuffer(): void {
    while (this.buffer.length >= 6) {
      // Find header [0xEF, 0xDD]
      let headerIdx = -1;
      for (let i = 0; i < this.buffer.length - 1; i++) {
        if (this.buffer[i] === HEADER1 && this.buffer[i + 1] === HEADER2) {
          headerIdx = i;
          break;
        }
      }

      if (headerIdx === -1) {
        // No header found, discard all but last byte
        this.buffer = this.buffer.slice(-1);
        return;
      }

      if (headerIdx > 0) {
        this.buffer = this.buffer.slice(headerIdx);
      }

      if (this.buffer.length < 6) return;

      const command = this.buffer[2];
      const length = this.buffer[3];
      const frameEnd = 3 + length + 2; // header(2) + cmd(1) + length(1) + payload(length-1) + checksum(2)

      if (this.buffer.length < frameEnd) {
        // Wait for more bytes
        return;
      }

      const frame = this.buffer.slice(0, frameEnd);
      this.buffer = this.buffer.slice(frameEnd);

      this.parseFrame(command, frame);
    }
  }

  private parseFrame(command: number, frame: number[]): void {
    if (command === CMD_EVENT) {
      const msgType = frame[4];
      const payload = frame.slice(5, frame.length - 2);

      if (msgType === MSG_WEIGHT) {
        this.parseWeight(payload);
      } else if (msgType === MSG_TIMER) {
        this.parseTimer(payload);
      } else if (msgType === MSG_BUTTON) {
        this.parseButton(payload);
      } else if (msgType === MSG_HEARTBEAT) {
        this.parseHeartbeat(payload);
      }
    } else if (command === CMD_SETTINGS) {
      const payload = frame.slice(4, frame.length - 2);
      this.parseSettings(payload);
    }
  }

  private parseWeight(payload: number[]): void {
    if (payload.length < 6) return;

    let value = ((payload[1] & 0xff) << 8) | (payload[0] & 0xff);
    const unitByte = payload[4] & 0xff;

    // Unit divisors
    const divisors: Record<number, number> = { 1: 10.0, 2: 100.0, 3: 1000.0, 4: 10000.0 };
    const divisor = divisors[unitByte] || 10.0;
    value /= divisor;

    // Sign bit: bit 1 of byte 5
    if (payload[5] & 0x02) {
      value *= -1;
    }

    this.isStable = (payload[5] & 0x01) === 0;
    this.currentWeight = parseFloat(value.toFixed(1));
    this.calculateFlowRate(this.currentWeight, Date.now());
    this.emitTelemetry();
  }

  private parseTimer(payload: number[]): void {
    if (payload.length < 3) return;
    const minutes = payload[0] & 0xff;
    const seconds = payload[1] & 0xff;
    const tenths = payload[2] & 0xff;
    this.timerSeconds = minutes * 60 + seconds + tenths / 10.0;
    this.emitTelemetry();
  }

  private parseButton(payload: number[]): void {
    if (payload.length < 1) return;
    const key = payload[0];
    let btn: 'tare' | 'start' | 'stop' | 'reset' | null = null;
    if (key === 0) btn = 'tare';
    else if (key === 8) btn = 'start';
    else if (key === 9) btn = 'reset';
    else if (key === 10) btn = 'stop';

    if (btn) {
      for (const listener of this.buttonListeners) {
        listener(btn);
      }
    }
  }

  private parseHeartbeat(payload: number[]): void {
    if (payload.length < 3) return;
    const innerTag = payload[2];
    const innerPayload = payload.slice(3);

    if (innerTag === MSG_WEIGHT) {
      this.parseWeight(innerPayload);
    } else if (innerTag === MSG_TIMER) {
      this.parseTimer(innerPayload);
    } else if (innerTag === MSG_BUTTON) {
      this.parseButton(innerPayload);
    } else if (innerTag === MSG_BATTERY && innerPayload.length >= 1) {
      this.currentBattery = innerPayload[0] & 0x7f;
      this.emitTelemetry();
    }
  }

  private parseSettings(payload: number[]): void {
    if (payload.length >= 7) {
      this.currentBattery = payload[1] & 0x7f;
      this.currentUnit = payload[2] === 5 ? 'oz' : 'g';
      this.emitTelemetry();
    }
  }

  /**
   * Calculate smoothed real-time flow rate using least-squares linear regression over the last 1.2 seconds.
   */
  private calculateFlowRate(weight: number, timestamp: number): void {
    this.weightHistory.push({ timestamp, weight });

    // Keep only the last 1.5 seconds of data
    const cutoff = timestamp - 1500;
    while (this.weightHistory.length > 0 && this.weightHistory[0].timestamp < cutoff) {
      this.weightHistory.shift();
    }

    if (this.weightHistory.length < 3) {
      this.currentFlowRate = 0;
      return;
    }

    const n = this.weightHistory.length;
    let sumT = 0;
    let sumW = 0;

    for (const pt of this.weightHistory) {
      sumT += pt.timestamp;
      sumW += pt.weight;
    }

    const meanT = sumT / n;
    const meanW = sumW / n;

    let cov = 0;
    let varT = 0;

    for (const pt of this.weightHistory) {
      const dt = (pt.timestamp - meanT) / 1000; // in seconds
      const dw = pt.weight - meanW;
      cov += dt * dw;
      varT += dt * dt;
    }

    if (varT > 0) {
      const slope = cov / varT;
      // Clamp small negatives (measurement jitter) to 0
      this.currentFlowRate = Math.max(0, parseFloat(slope.toFixed(1)));
    } else {
      this.currentFlowRate = 0;
    }
  }

  private emitTelemetry(): void {
    const telemetry = this.getTelemetry();
    for (const listener of this.telemetryListeners) {
      listener(telemetry);
    }
  }

  private handleGattDisconnected = () => {
    this.disconnect();
    for (const listener of this.disconnectListeners) {
      listener();
    }
  };
}

// Singleton scale driver instance
export const acaiaScale = new AcaiaScaleDriver();
