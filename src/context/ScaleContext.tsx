import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import {
  ScaleConnectionState,
  ScaleDeviceInfo,
  ScalePreferences,
  ScaleTelemetry,
} from '../types/scale';
import { acaiaScale } from '../services/acaiaScale';
import { soundService } from '../utils/audio';

interface ScaleContextType {
  connectionState: ScaleConnectionState;
  deviceInfo: ScaleDeviceInfo | null;
  telemetry: ScaleTelemetry;
  preferences: ScalePreferences;
  isWebBluetoothSupported: boolean;
  isScaleModalOpen: boolean;
  errorMessage: string | null;

  openScaleModal: () => void;
  closeScaleModal: () => void;
  connectScale: (options?: { scanAll?: boolean }) => Promise<void>;
  disconnectScale: () => Promise<void>;
  tare: () => Promise<void>;
  startTimer: () => Promise<void>;
  pauseTimer: () => Promise<void>;
  resetTimer: () => Promise<void>;
  beep: () => Promise<void>;
  toggleSimulation: (enable?: boolean) => void;
  simulatePour: (targetGrams: number, flowRate?: number) => void;
  updatePreferences: (partial: Partial<ScalePreferences>) => void;
}

const DEFAULT_PREFERENCES: ScalePreferences = {
  autoTareOnBrewStart: true,
  autoStartOnFirstDrop: true,
  firstDropThresholdGrams: 0.5,
  soundFeedback: true,
  isSimulationMode: false,
};

const STORAGE_KEY = 'brewlog_scale_preferences_v1';

const ScaleContext = createContext<ScaleContextType | null>(null);

export const ScaleProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const isWebBluetoothSupported =
    typeof navigator !== 'undefined' && Boolean(navigator.bluetooth);

  const [connectionState, setConnectionState] = useState<ScaleConnectionState>(
    isWebBluetoothSupported ? 'disconnected' : 'unsupported'
  );
  const [deviceInfo, setDeviceInfo] = useState<ScaleDeviceInfo | null>(null);
  const [telemetry, setTelemetry] = useState<ScaleTelemetry>(acaiaScale.getTelemetry());
  const [isScaleModalOpen, setIsScaleModalOpen] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const [preferences, setPreferences] = useState<ScalePreferences>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) return { ...DEFAULT_PREFERENCES, ...JSON.parse(saved) };
    } catch {}
    return DEFAULT_PREFERENCES;
  });

  const updatePreferences = useCallback((partial: Partial<ScalePreferences>) => {
    setPreferences((prev) => {
      const updated = { ...prev, ...partial };
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
      } catch {}
      return updated;
    });
  }, []);

  // Listen to scale driver events
  useEffect(() => {
    const unsubTelemetry = acaiaScale.onTelemetry((newTelemetry) => {
      setTelemetry(newTelemetry);
    });

    const unsubButton = acaiaScale.onButton((button) => {
      if (preferences.soundFeedback) {
        soundService.playBeep(880, 0.08);
      }
      console.log(`[Acaia Scale] Button pressed on hardware: ${button}`);
    });

    const unsubDisconnect = acaiaScale.onDisconnect(() => {
      setConnectionState(isWebBluetoothSupported ? 'disconnected' : 'unsupported');
      setDeviceInfo(null);
    });

    return () => {
      unsubTelemetry();
      unsubButton();
      unsubDisconnect();
    };
  }, [preferences.soundFeedback, isWebBluetoothSupported]);

  const openScaleModal = () => setIsScaleModalOpen(true);
  const closeScaleModal = () => setIsScaleModalOpen(false);

  const connectScale = useCallback(async (options?: { scanAll?: boolean }) => {
    setErrorMessage(null);
    setConnectionState('connecting');

    try {
      const info = await acaiaScale.connect(options);
      setDeviceInfo(info);
      setConnectionState('connected');
      if (preferences.soundFeedback) {
        soundService.playBeep(920, 0.12);
      }
    } catch (err: any) {
      if (err.name === 'NotFoundError' || err.message?.includes('cancelled')) {
        // User cancelled picker
        setConnectionState(isWebBluetoothSupported ? 'disconnected' : 'unsupported');
      } else {
        setConnectionState('error');
        setErrorMessage(err.message || 'Failed to connect to Acaia scale');
      }
    }
  }, [isWebBluetoothSupported, preferences.soundFeedback]);

  const disconnectScale = useCallback(async () => {
    await acaiaScale.disconnect();
    setConnectionState(isWebBluetoothSupported ? 'disconnected' : 'unsupported');
    setDeviceInfo(null);
  }, [isWebBluetoothSupported]);

  const tare = useCallback(async () => {
    if (preferences.soundFeedback) {
      soundService.playBeep(750, 0.06);
    }
    await acaiaScale.tare();
  }, [preferences.soundFeedback]);

  const startTimer = useCallback(async () => {
    await acaiaScale.startTimer();
  }, []);

  const pauseTimer = useCallback(async () => {
    await acaiaScale.pauseTimer();
  }, []);

  const resetTimer = useCallback(async () => {
    await acaiaScale.resetTimer();
  }, []);

  const beep = useCallback(async () => {
    await acaiaScale.beep();
  }, []);

  const toggleSimulation = useCallback(
    (enable?: boolean) => {
      const shouldEnable = enable !== undefined ? enable : !preferences.isSimulationMode;
      updatePreferences({ isSimulationMode: shouldEnable });

      if (shouldEnable) {
        const info = acaiaScale.connectSimulated();
        setDeviceInfo(info);
        setConnectionState('connected');
      } else {
        acaiaScale.disconnect();
        setConnectionState(isWebBluetoothSupported ? 'disconnected' : 'unsupported');
        setDeviceInfo(null);
      }
    },
    [preferences.isSimulationMode, updatePreferences, isWebBluetoothSupported]
  );

  const simulatePour = useCallback((targetGrams: number, flowRate: number = 4.0) => {
    acaiaScale.simulatePour(targetGrams, flowRate);
  }, []);

  return (
    <ScaleContext.Provider
      value={{
        connectionState,
        deviceInfo,
        telemetry,
        preferences,
        isWebBluetoothSupported,
        isScaleModalOpen,
        errorMessage,
        openScaleModal,
        closeScaleModal,
        connectScale,
        disconnectScale,
        tare,
        startTimer,
        pauseTimer,
        resetTimer,
        beep,
        toggleSimulation,
        simulatePour,
        updatePreferences,
      }}
    >
      {children}
    </ScaleContext.Provider>
  );
};

export const useScale = () => {
  const context = useContext(ScaleContext);
  if (!context) {
    throw new Error('useScale must be used within a ScaleProvider');
  }
  return context;
};
