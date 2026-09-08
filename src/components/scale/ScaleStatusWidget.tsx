import React from 'react';
import { useScale } from '../../context/ScaleContext';
import { useI18n } from '../../i18n';
import { Bluetooth, Battery } from 'lucide-react';

export const ScaleStatusWidget: React.FC = () => {
  const { connectionState, deviceInfo, telemetry, openScaleModal } = useScale();
  const { t } = useI18n();

  const isConnected = connectionState === 'connected';
  const isConnecting = connectionState === 'connecting';

  return (
    <button
      onClick={openScaleModal}
      type="button"
      className={`shrink-0 flex items-center space-x-1.5 px-2.5 py-1.5 text-xs font-semibold rounded-xl border transition shadow-sm ${
        isConnected
          ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/50'
          : isConnecting
          ? 'bg-amber-950/40 text-amber-300 border-amber-800/80 animate-pulse'
          : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border-stone-800'
      }`}
      title={isConnected ? `${deviceInfo?.name} - ${t.scale.connected}` : t.scale.title}
    >
      <div className="relative flex items-center">
        <Bluetooth
          className={`w-3.5 h-3.5 ${
            isConnected ? 'text-emerald-400' : isConnecting ? 'text-amber-400' : 'text-stone-400'
          }`}
        />
        {isConnected && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
        )}
      </div>

      {isConnected ? (
        <div className="flex items-center space-x-1.5">
          <span className="font-mono font-bold text-emerald-300">
            {telemetry.weight.toFixed(1)}g
          </span>
          {telemetry.flowRate > 0 && (
            <span className="font-mono text-[10px] text-cyan-400 hidden sm:inline">
              ({telemetry.flowRate.toFixed(1)}/s)
            </span>
          )}
          {deviceInfo?.battery !== null && deviceInfo?.battery !== undefined && (
            <div className="hidden md:flex items-center space-x-0.5 text-[10px] text-stone-400 font-mono">
              <Battery className="w-3 h-3 text-stone-400" />
              <span>{deviceInfo.battery}%</span>
            </div>
          )}
        </div>
      ) : (
        <span className="hidden sm:inline">
          {isConnecting ? t.scale.connecting : t.scale.connect}
        </span>
      )}
    </button>
  );
};
