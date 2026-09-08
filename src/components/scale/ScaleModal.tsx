import React from 'react';
import { useScale } from '../../context/ScaleContext';
import { useI18n } from '../../i18n';
import {
  X,
  Bluetooth,
  RotateCcw,
  Play,
  Pause,
  Sliders,
  Volume2,
  AlertTriangle,
  Droplets,
} from 'lucide-react';

export const ScaleModal: React.FC = () => {
  const {
    isScaleModalOpen,
    closeScaleModal,
    connectionState,
    deviceInfo,
    telemetry,
    preferences,
    isWebBluetoothSupported,
    errorMessage,
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
  } = useScale();

  const { t } = useI18n();

  if (!isScaleModalOpen) return null;

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="bg-stone-900 border border-stone-800 rounded-3xl max-w-lg w-full overflow-hidden shadow-2xl flex flex-col max-h-[90vh]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="p-5 border-b border-stone-800/80 flex items-center justify-between bg-stone-950/40">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-600/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Bluetooth className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-stone-100 flex items-center gap-2">
                <span>{t.scale.title}</span>
                {deviceInfo?.isSimulated && (
                  <span className="text-[10px] uppercase font-mono px-2 py-0.5 rounded-full bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">
                    {t.scale.simulationBadge}
                  </span>
                )}
              </h2>
              <p className="text-xs text-stone-400">{t.scale.subtitle}</p>
            </div>
          </div>
          <button
            onClick={closeScaleModal}
            className="p-2 rounded-xl text-stone-400 hover:text-stone-200 hover:bg-stone-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-5 overflow-y-auto space-y-5">
          {/* Unsupported Browser Alert */}
          {!isWebBluetoothSupported && (
            <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-xs space-y-1.5">
              <div className="flex items-center space-x-2 text-amber-300 font-semibold">
                <AlertTriangle className="w-4 h-4 shrink-0" />
                <span>{t.scale.unsupportedTitle}</span>
              </div>
              <p className="text-stone-300 leading-relaxed">
                {t.scale.unsupportedDesc}
              </p>
            </div>
          )}

          {/* Connection Error Message */}
          {errorMessage && (
            <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-xs text-rose-300 flex items-start space-x-2">
              <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{errorMessage}</span>
            </div>
          )}

          {/* Device Connection Card */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-3">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2.5">
                <div
                  className={`w-3 h-3 rounded-full ${
                    isConnected
                      ? 'bg-emerald-400 shadow-md shadow-emerald-500/40'
                      : isConnecting
                      ? 'bg-amber-400 animate-ping'
                      : 'bg-stone-600'
                  }`}
                />
                <div>
                  <div className="text-xs font-semibold text-stone-200">
                    {isConnected
                      ? deviceInfo?.name || t.scale.connected
                      : isConnecting
                      ? t.scale.connecting
                      : t.scale.disconnected}
                  </div>
                  {isConnected && (
                    <div className="text-[10px] text-stone-400 font-mono">
                      Model: {deviceInfo?.model || 'Acaia'} • Unit: {telemetry.unit}
                    </div>
                  )}
                </div>
              </div>

              {isConnected ? (
                <button
                  type="button"
                  onClick={disconnectScale}
                  className="px-3 py-1.5 rounded-xl text-xs font-medium bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white transition"
                >
                  {t.scale.disconnect}
                </button>
              ) : (
                <button
                  type="button"
                  onClick={connectScale}
                  disabled={!isWebBluetoothSupported || isConnecting}
                  className={`flex items-center space-x-1.5 px-4 py-2 rounded-xl text-xs font-bold transition shadow-md ${
                    !isWebBluetoothSupported
                      ? 'bg-stone-800 text-stone-500 cursor-not-allowed'
                      : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-900/30'
                  }`}
                >
                  <Bluetooth className="w-3.5 h-3.5" />
                  <span>{isConnecting ? t.scale.connecting : t.scale.connect}</span>
                </button>
              )}
            </div>

            {/* Scale Connection Tip */}
            {!isConnected && isWebBluetoothSupported && (
              <p className="text-[11px] text-stone-400 leading-relaxed border-t border-stone-800/60 pt-2.5">
                💡 <strong>Pairing tip:</strong> Power on your Acaia scale and ensure the official Acaia mobile app is closed, as Acaia scales support only 1 Bluetooth connection at a time.
              </p>
            )}
          </div>

          {/* Live Telemetry Display & Scale Commands */}
          <div className="p-5 rounded-2xl bg-gradient-to-b from-stone-950/80 to-stone-950/40 border border-stone-800 text-center space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {/* Weight Metric */}
              <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800/70">
                <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                  {t.scale.liveWeight}
                </div>
                <div className="text-4xl font-extrabold font-mono text-amber-300">
                  {telemetry.weight.toFixed(1)}
                  <span className="text-sm ml-1 text-stone-400 font-normal">g</span>
                </div>
              </div>

              {/* Flow Rate Metric */}
              <div className="p-3.5 rounded-xl bg-stone-900/70 border border-stone-800/70">
                <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold mb-1">
                  {t.scale.flowRate}
                </div>
                <div className="text-4xl font-extrabold font-mono text-cyan-300">
                  {telemetry.flowRate.toFixed(1)}
                  <span className="text-sm ml-1 text-stone-400 font-normal">g/s</span>
                </div>
              </div>
            </div>

            {/* Action Buttons: Tare & Timer Controls */}
            <div className="flex items-center justify-center gap-2 pt-1">
              <button
                type="button"
                onClick={tare}
                disabled={!isConnected}
                className="flex-1 py-2.5 px-3 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center space-x-1.5"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>{t.scale.tare}</span>
              </button>

              <button
                type="button"
                onClick={telemetry.timerRunning ? pauseTimer : startTimer}
                disabled={!isConnected}
                className="py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed flex items-center space-x-1.5"
              >
                {telemetry.timerRunning ? (
                  <>
                    <Pause className="w-3.5 h-3.5 text-rose-400" />
                    <span>Pause Scale</span>
                  </>
                ) : (
                  <>
                    <Play className="w-3.5 h-3.5 text-emerald-400" />
                    <span>Start Scale</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={resetTimer}
                disabled={!isConnected}
                className="py-2.5 px-3 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Reset Scale Timer"
              >
                Reset
              </button>

              <button
                type="button"
                onClick={beep}
                disabled={!isConnected || deviceInfo?.isSimulated}
                className="p-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs transition disabled:opacity-40 disabled:cursor-not-allowed"
                title="Beep Sound Test"
              >
                <Volume2 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Simulated Pour Trigger (If in simulation mode) */}
            {deviceInfo?.isSimulated && (
              <div className="pt-2 border-t border-stone-800/60">
                <button
                  type="button"
                  onClick={() => simulatePour(50, 4.0)}
                  className="w-full py-2 px-3 rounded-xl bg-cyan-600/20 hover:bg-cyan-600/30 text-cyan-300 border border-cyan-500/30 text-xs font-medium transition flex items-center justify-center space-x-1.5"
                >
                  <Droplets className="w-3.5 h-3.5" />
                  <span>{t.scale.testPour}</span>
                </button>
              </div>
            )}
          </div>

          {/* Scale Automation & Preferences */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 space-y-3">
            <div className="text-xs font-semibold text-stone-300 flex items-center space-x-1.5">
              <Sliders className="w-3.5 h-3.5 text-amber-400" />
              <span>Scale Automation & Preferences</span>
            </div>

            <div className="space-y-2.5 pt-1 text-xs">
              {/* Auto Tare Toggle */}
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-stone-300 group-hover:text-stone-100">
                  {t.scale.autoTare}
                </span>
                <input
                  type="checkbox"
                  checked={preferences.autoTareOnBrewStart}
                  onChange={(e) => updatePreferences({ autoTareOnBrewStart: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500 bg-stone-800 border-stone-700 cursor-pointer"
                />
              </label>

              {/* Auto Start Timer on First Drop */}
              <label className="flex items-center justify-between cursor-pointer group">
                <div>
                  <span className="text-stone-300 group-hover:text-stone-100">
                    {t.scale.autoStartOnFlow}
                  </span>
                  <div className="text-[10px] text-stone-500">
                    Starts brew timer automatically when weight increases &gt; {preferences.firstDropThresholdGrams}g
                  </div>
                </div>
                <input
                  type="checkbox"
                  checked={preferences.autoStartOnFirstDrop}
                  onChange={(e) => updatePreferences({ autoStartOnFirstDrop: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500 bg-stone-800 border-stone-700 cursor-pointer"
                />
              </label>

              {/* Sound Feedback */}
              <label className="flex items-center justify-between cursor-pointer group">
                <span className="text-stone-300 group-hover:text-stone-100">
                  Audio chime on scale events
                </span>
                <input
                  type="checkbox"
                  checked={preferences.soundFeedback}
                  onChange={(e) => updatePreferences({ soundFeedback: e.target.checked })}
                  className="w-4 h-4 rounded accent-amber-500 bg-stone-800 border-stone-700 cursor-pointer"
                />
              </label>
            </div>
          </div>

          {/* Simulation Mode Card */}
          <div className="p-4 rounded-2xl bg-stone-950/60 border border-stone-800/80 flex items-center justify-between">
            <div>
              <div className="text-xs font-semibold text-stone-200">
                {t.scale.simulationMode}
              </div>
              <div className="text-[10px] text-stone-400">
                Test live telemetry and brew curves without physical scale hardware
              </div>
            </div>

            <button
              type="button"
              onClick={() => toggleSimulation()}
              className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition border ${
                preferences.isSimulationMode
                  ? 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40'
                  : 'bg-stone-800 hover:bg-stone-700 text-stone-300 border-stone-700'
              }`}
            >
              {preferences.isSimulationMode ? 'Enabled' : 'Enable'}
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-4 border-t border-stone-800/80 bg-stone-950/40 flex justify-end">
          <button
            type="button"
            onClick={closeScaleModal}
            className="px-5 py-2 rounded-xl text-xs font-semibold bg-stone-800 hover:bg-stone-700 text-stone-200 transition"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
