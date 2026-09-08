export type ScaleConnectionState =
  | 'disconnected'
  | 'connecting'
  | 'connected'
  | 'error'
  | 'unsupported';

export type AcaiaScaleModel =
  | 'Pearl'
  | 'Pearl 2021'
  | 'Pearl S'
  | 'Lunar'
  | 'Pyxis'
  | 'Cinco'
  | 'Simulated Scale'
  | 'Unknown Acaia';

export interface ScaleTelemetry {
  weight: number; // in grams (0.1g or 0.01g precision)
  flowRate: number; // in grams per second (smoothed)
  isStable: boolean;
  timerSeconds: number;
  timerRunning: boolean;
  battery: number | null; // percentage 0-100 or null if unknown
  unit: 'g' | 'oz';
  timestamp: number; // epoch ms
}

export interface ScaleDeviceInfo {
  id: string;
  name: string;
  model: AcaiaScaleModel;
  battery: number | null;
  unit: 'g' | 'oz';
  isSimulated: boolean;
}

export interface WeightDataPoint {
  time: number; // seconds from brew start
  weight: number; // cumulative water grams
  flowRate: number; // flow rate in g/s
  targetWeight?: number; // target water grams at this second
}

export interface ScalePreferences {
  autoTareOnBrewStart: boolean;
  autoStartOnFirstDrop: boolean;
  firstDropThresholdGrams: number; // e.g. 0.5g
  soundFeedback: boolean;
  isSimulationMode: boolean;
}
