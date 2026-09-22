import React, { useMemo } from 'react';
import { useI18n } from '../../i18n';
import { Droplets } from 'lucide-react';

export interface AnimatedPourOverTimerProps {
  totalSeconds: number;
  stageElapsed: number;
  stageDuration: number;
  stageRemaining: number;
  currentStageName?: string;
  currentStageIdx: number;
  totalStages: number;
  isRunning: boolean;
  currentWeight: number;
  totalTargetWater: number;
  flowRate: number;
  expectedStageFlowRate: number;
  isScaleConnected: boolean;
  formatTime: (sec: number) => string;
}

export const AnimatedPourOverTimer: React.FC<AnimatedPourOverTimerProps> = ({
  totalSeconds,
  stageElapsed,
  stageDuration,
  stageRemaining,
  currentStageName,
  currentStageIdx,
  totalStages,
  isRunning,
  currentWeight,
  totalTargetWater,
  flowRate,
  expectedStageFlowRate,
  isScaleConnected,
  formatTime,
}) => {
  const { language } = useI18n();

  // Calculate dynamic drip speed (seconds per drip cycle)
  const { dripDuration, isDripping, dripCount, isKettlePouring, flowStatus } = useMemo(() => {
    if (!isRunning) {
      return {
        dripDuration: 1.5,
        isDripping: false,
        dripCount: 0,
        isKettlePouring: false,
        flowStatus: 'idle',
      };
    }

    if (flowRate <= 0.08) {
      // Resting / bloom / between pours: occasional slow drip if brewing has started
      return {
        dripDuration: 2.4,
        isDripping: totalSeconds > 0 && currentWeight > 5,
        dripCount: 1,
        isKettlePouring: false,
        flowStatus: 'rest',
      };
    }

    // Dynamic duration based on real-time flow rate (in g/s):
    // 0.5 g/s -> ~1.40s per drop
    // 1.5 g/s -> ~0.80s per drop
    // 3.0 g/s -> ~0.45s per drop
    // 5.0 g/s -> ~0.28s per drop
    // 7.0+ g/s -> ~0.18s per drop
    const duration = Math.max(0.18, Math.min(1.8, 1.35 / Math.pow(flowRate, 0.65)));

    // More cascading drops at higher flow rates
    let count = 1;
    if (flowRate >= 4.0) count = 3;
    else if (flowRate >= 1.8) count = 2;

    const pouring = flowRate >= 0.35;

    let status = 'optimal';
    if (expectedStageFlowRate > 0) {
      const diff = flowRate - expectedStageFlowRate;
      if (Math.abs(diff) <= 0.8) status = 'optimal';
      else if (diff > 0.8) status = 'fast';
      else status = 'gentle';
    }

    return {
      dripDuration: duration,
      isDripping: true,
      dripCount: count,
      isKettlePouring: pouring,
      flowStatus: status,
    };
  }, [isRunning, flowRate, totalSeconds, currentWeight, expectedStageFlowRate]);

  // Liquid fill percentage in the server carafe
  const fillPercent = useMemo(() => {
    if (totalTargetWater <= 0) return 0;
    return Math.min(100, Math.max(0, (currentWeight / totalTargetWater) * 100));
  }, [currentWeight, totalTargetWater]);

  // Progress of entire brew recipe (0 to 100)
  const brewProgressPercent = useMemo(() => {
    if (totalTargetWater <= 0) return 0;
    return Math.min(100, Math.round((currentWeight / totalTargetWater) * 100));
  }, [currentWeight, totalTargetWater]);

  // Carafe liquid surface Y coordinate (Server base is Y=230, neck is Y=160)
  const liquidY = 230 - (fillPercent / 100) * 65;

  // Status badge styling
  const statusBadge = useMemo(() => {
    if (!isRunning) {
      return { text: language === 'zh-TW' ? '待機中' : 'Standby', color: 'text-stone-400 bg-stone-800/80 border-stone-700' };
    }
    if (flowStatus === 'rest') {
      return { text: language === 'zh-TW' ? '悶蒸 / 濾乾中' : 'Bloom / Draining', color: 'text-cyan-300 bg-cyan-950/50 border-cyan-800/60' };
    }
    if (flowStatus === 'optimal') {
      return { text: language === 'zh-TW' ? '穩定注水' : 'Steady Flow', color: 'text-emerald-300 bg-emerald-950/50 border-emerald-800/60' };
    }
    if (flowStatus === 'fast') {
      return { text: language === 'zh-TW' ? '流速偏快' : 'Fast Pour', color: 'text-amber-300 bg-amber-950/50 border-amber-800/60' };
    }
    return { text: language === 'zh-TW' ? '柔和慢注' : 'Gentle Flow', color: 'text-cyan-300 bg-cyan-950/50 border-cyan-800/60' };
  }, [isRunning, flowStatus, language]);

  return (
    <div className="relative w-full max-w-lg mx-auto bg-gradient-to-b from-stone-900/90 via-stone-900/60 to-stone-950/90 rounded-3xl border border-stone-800/90 p-4 sm:p-5 shadow-2xl overflow-hidden backdrop-blur-md">
      {/* Background Radial Glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

      {/* Header Info Pill */}
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center space-x-2">
          <span className="text-[11px] font-semibold text-stone-400 uppercase tracking-wider">
            {language === 'zh-TW'
              ? `階段 ${currentStageIdx + 1}/${totalStages}: ${currentStageName}`
              : `Stage ${currentStageIdx + 1}/${totalStages}: ${currentStageName}`}
          </span>
        </div>

        <div className="flex items-center space-x-1.5">
          <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${statusBadge.color}`}>
            {statusBadge.text}
          </span>
          <span className="text-[10px] font-mono text-stone-400 bg-stone-800/60 px-2 py-0.5 rounded-full border border-stone-700/60">
            {stageRemaining}s left
          </span>
        </div>
      </div>

      {/* SVG Animated Dripper Canvas */}
      <div className="hidden">
        <svg
          viewBox="0 0 360 270"
          className="w-full max-w-[340px] h-auto select-none overflow-visible"
          style={
            {
              '--drip-duration': `${dripDuration}s`,
            } as React.CSSProperties
          }
        >
          <defs>
            {/* Coffee Liquid Gradient */}
            <linearGradient id="coffeeGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d97706" stopOpacity="0.85" />
              <stop offset="40%" stopColor="#b45309" stopOpacity="0.92" />
              <stop offset="100%" stopColor="#78350f" stopOpacity="0.98" />
            </linearGradient>

            {/* Kettle Water Stream Gradient */}
            <linearGradient id="waterStreamGradient" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#67e8f9" stopOpacity="0.8" />
              <stop offset="100%" stopColor="#38bdf8" stopOpacity="0.9" />
            </linearGradient>

            {/* Glass Highlights */}
            <linearGradient id="glassShine" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="0.08" />
              <stop offset="25%" stopColor="#ffffff" stopOpacity="0.25" />
              <stop offset="50%" stopColor="#ffffff" stopOpacity="0.03" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0.12" />
            </linearGradient>

            {/* Carafe Body Clipping Mask */}
            <clipPath id="carafeClip">
              <path d="M142,165 L218,165 L232,230 Q232,235 224,235 L136,235 Q128,235 128,230 Z" />
            </clipPath>

            {/* CSS Keyframes for Drips, Water Flow, Waves, and Steam */}
            <style>{`
              @keyframes dripFall {
                0% {
                  transform: translateY(0) scale(0.6);
                  opacity: 0.2;
                }
                20% {
                  transform: translateY(8px) scale(1);
                  opacity: 1;
                }
                85% {
                  transform: translateY(${Math.max(25, liquidY - 148)}px) scale(0.95);
                  opacity: 1;
                }
                100% {
                  transform: translateY(${Math.max(30, liquidY - 145)}px) scale(1.4, 0.4);
                  opacity: 0;
                }
              }

              @keyframes rippleExpand {
                0% {
                  r: 1;
                  opacity: 0.9;
                  stroke-width: 2;
                }
                60% {
                  opacity: 0.6;
                  stroke-width: 1.5;
                }
                100% {
                  r: 18;
                  opacity: 0;
                  stroke-width: 0.5;
                }
              }

              @keyframes kettleFlow {
                0% {
                  stroke-dashoffset: 0;
                }
                100% {
                  stroke-dashoffset: -24;
                }
              }

              @keyframes steamRise {
                0% {
                  transform: translateY(0) scale(1);
                  opacity: 0;
                }
                50% {
                  opacity: 0.45;
                }
                100% {
                  transform: translateY(-26px) scale(1.3);
                  opacity: 0;
                }
              }

              .drip-drop-1 {
                animation: dripFall var(--drip-duration) cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
                animation-play-state: ${isDripping ? 'running' : 'paused'};
              }
              .drip-drop-2 {
                animation: dripFall var(--drip-duration) cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
                animation-delay: calc(var(--drip-duration) * 0.35);
                animation-play-state: ${isDripping && dripCount >= 2 ? 'running' : 'paused'};
              }
              .drip-drop-3 {
                animation: dripFall var(--drip-duration) cubic-bezier(0.45, 0.05, 0.55, 0.95) infinite;
                animation-delay: calc(var(--drip-duration) * 0.7);
                animation-play-state: ${isDripping && dripCount >= 3 ? 'running' : 'paused'};
              }

              .ripple-wave {
                animation: rippleExpand var(--drip-duration) ease-out infinite;
                animation-play-state: ${isDripping ? 'running' : 'paused'};
              }
              .ripple-wave-delayed {
                animation: rippleExpand var(--drip-duration) ease-out infinite;
                animation-delay: calc(var(--drip-duration) * 0.4);
                animation-play-state: ${isDripping && dripCount >= 2 ? 'running' : 'paused'};
              }

              .kettle-water-stream {
                stroke-dasharray: 6, 4;
                animation: kettleFlow 0.5s linear infinite;
              }

              .steam-wisp-1 {
                animation: steamRise 3s ease-in-out infinite;
              }
              .steam-wisp-2 {
                animation: steamRise 3.6s ease-in-out infinite 1.2s;
              }
              .steam-wisp-3 {
                animation: steamRise 2.8s ease-in-out infinite 0.6s;
              }
            `}</style>
          </defs>

          {/* Circular Progress Gauge Track Framing Dripper */}
          <circle
            cx="180"
            cy="150"
            r="115"
            fill="none"
            stroke="#292524"
            strokeWidth="3"
            strokeDasharray="4 4"
            opacity="0.4"
          />
          <circle
            cx="180"
            cy="150"
            r="115"
            fill="none"
            stroke="url(#coffeeGradient)"
            strokeWidth="3.5"
            strokeLinecap="round"
            strokeDasharray={2 * Math.PI * 115}
            strokeDashoffset={2 * Math.PI * 115 * (1 - brewProgressPercent / 100)}
            transform="rotate(-90 180 150)"
            className="transition-all duration-500 ease-out"
            opacity="0.75"
          />

          {/* Steam Wisps */}
          {isRunning && currentWeight > 10 && (
            <g opacity="0.6">
              <path
                d="M172,155 Q168,140 174,130 T170,115"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="steam-wisp-1"
              />
              <path
                d="M182,158 Q187,142 180,132 T185,118"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth="1.5"
                strokeLinecap="round"
                className="steam-wisp-2"
              />
              <path
                d="M189,160 Q194,145 188,135 T192,122"
                fill="none"
                stroke="#d6d3d1"
                strokeWidth="1.2"
                strokeLinecap="round"
                className="steam-wisp-3"
              />
            </g>
          )}

          {/* Glass Server / Carafe */}
          <g id="glass-carafe">
            <ellipse cx="180" cy="242" rx="55" ry="5" fill="#0c0a09" opacity="0.8" />

            {/* Handle */}
            <path
              d="M226,175 C255,178 258,222 228,226"
              fill="none"
              stroke="#57534e"
              strokeWidth="5"
              strokeLinecap="round"
              opacity="0.6"
            />
            <path
              d="M226,175 C255,178 258,222 228,226"
              fill="none"
              stroke="#a8a29e"
              strokeWidth="1.5"
              strokeLinecap="round"
              opacity="0.4"
            />

            {/* Carafe Body */}
            <path
              d="M142,165 L218,165 L232,230 Q232,235 224,235 L136,235 Q128,235 128,230 Z"
              fill="#1c1917"
              stroke="#57534e"
              strokeWidth="2"
              opacity="0.95"
            />

            {/* Coffee Liquid Layer */}
            <g clipPath="url(#carafeClip)">
              <rect
                x="125"
                y={liquidY}
                width="110"
                height={240 - liquidY}
                fill="url(#coffeeGradient)"
                className="transition-all duration-300 ease-out"
              />

              {/* Surface Ripple Effect */}
              {isDripping && (
                <>
                  <ellipse
                    cx="180"
                    cy={liquidY}
                    rx="12"
                    ry="2"
                    fill="none"
                    stroke="#fef3c7"
                    className="ripple-wave"
                  />
                  {dripCount >= 2 && (
                    <ellipse
                      cx="180"
                      cy={liquidY}
                      rx="12"
                      ry="2"
                      fill="none"
                      stroke="#fef3c7"
                      className="ripple-wave-delayed"
                    />
                  )}
                </>
              )}

              {/* Subtle Liquid Surface Line */}
              {fillPercent > 0 && (
                <line
                  x1="130"
                  y1={liquidY}
                  x2="230"
                  y2={liquidY}
                  stroke="#fbbf24"
                  strokeWidth="1.5"
                  opacity="0.6"
                />
              )}
            </g>

            {/* Glass Shine */}
            <path
              d="M142,165 L218,165 L232,230 Q232,235 224,235 L136,235 Q128,235 128,230 Z"
              fill="url(#glassShine)"
              pointerEvents="none"
            />

            {/* Measurement Graduation Lines */}
            <g stroke="#78716c" strokeWidth="1" opacity="0.6">
              <line x1="140" y1="218" x2="148" y2="218" />
              <line x1="142" y1="202" x2="149" y2="202" />
              <line x1="144" y1="186" x2="151" y2="186" />
              <line x1="146" y1="172" x2="152" y2="172" />
            </g>
          </g>

          {/* Drip Droplets */}
          <g id="drip-droplets">
            <ellipse cx="180" cy="148" rx="7" ry="2.5" fill="#44403c" />

            {isDripping && (
              <g transform="translate(180, 148)">
                {/* Primary Droplet */}
                <path
                  d="M0,0 C-2,2 -3,5 0,8 C3,5 2,2 0,0 Z"
                  fill="#d97706"
                  className="drip-drop-1"
                />

                {/* Staggered Droplet 2 */}
                {dripCount >= 2 && (
                  <path
                    d="M0,0 C-1.8,2 -2.5,5 0,7.5 C2.5,5 1.8,2 0,0 Z"
                    fill="#b45309"
                    className="drip-drop-2"
                  />
                )}

                {/* Staggered Droplet 3 */}
                {dripCount >= 3 && (
                  <path
                    d="M0,0 C-1.5,2 -2.2,5 0,7 C2.2,5 1.5,2 0,0 Z"
                    fill="#f59e0b"
                    className="drip-drop-3"
                  />
                )}

                {/* High Flow Thin Stream (when flow rate > 4.5 g/s) */}
                {flowRate >= 4.5 && (
                  <line
                    x1="0"
                    y1="0"
                    x2="0"
                    y2={Math.max(10, liquidY - 148)}
                    stroke="#d97706"
                    strokeWidth="1.8"
                    strokeLinecap="round"
                    opacity="0.8"
                  />
                )}
              </g>
            )}
          </g>

          {/* V60 Dripper Cone & Coffee Bed */}
          <g id="v60-dripper">
            {/* Dripper Base Ring */}
            <path
              d="M136,146 L224,146 L218,150 L142,150 Z"
              fill="#292524"
              stroke="#57534e"
              strokeWidth="1"
            />

            {/* Ceramic V60 Body */}
            <path
              d="M115,82 L245,82 L186,148 L174,148 Z"
              fill="#1c1917"
              stroke="#78716c"
              strokeWidth="2.5"
            />

            {/* Paper Filter Cone */}
            <path
              d="M120,84 L240,84 L184,146 L176,146 Z"
              fill="#fafaf9"
              opacity="0.85"
            />

            {/* Internal Spiral Ribs */}
            <g stroke="#d6d3d1" strokeWidth="0.8" opacity="0.3" fill="none">
              <path d="M128,86 Q150,110 178,144" />
              <path d="M142,86 Q160,112 180,144" />
              <path d="M160,86 Q170,115 182,144" />
              <path d="M232,86 Q210,110 182,144" />
              <path d="M218,86 Q200,112 180,144" />
              <path d="M200,86 Q190,115 178,144" />
            </g>

            {/* Coffee Grounds Bed */}
            <ellipse
              cx="180"
              cy="104"
              rx="44"
              ry="11"
              fill="#3e2415"
              stroke="#57331c"
              strokeWidth="1.5"
            />
            <ellipse
              cx="180"
              cy="103"
              rx="38"
              ry="8.5"
              fill="#2a180d"
            />

            {/* Slurry Bubbles during Pour */}
            {isKettlePouring && (
              <g opacity="0.85">
                <ellipse
                  cx="180"
                  cy="103"
                  rx="30"
                  ry="6"
                  fill="#78350f"
                  opacity="0.7"
                />
                <circle cx="172" cy="102" r="2.5" fill="#fbbf24" opacity="0.8" />
                <circle cx="186" cy="104" r="2" fill="#d97706" opacity="0.9" />
                <circle cx="178" cy="101" r="1.8" fill="#fef3c7" opacity="0.9" />
                <circle cx="193" cy="103" r="1.5" fill="#fbbf24" opacity="0.7" />
              </g>
            )}

            {/* Top Rim */}
            <ellipse
              cx="180"
              cy="82"
              rx="65"
              ry="8"
              fill="none"
              stroke="#a8a29e"
              strokeWidth="2.5"
            />
          </g>

          {/* Gooseneck Kettle Spout & Water Stream */}
          {isKettlePouring && (
            <g id="kettle-stream">
              <path
                d="M45,35 C70,36 100,42 120,68 L114,72 C96,48 70,42 45,41 Z"
                fill="#78716c"
                stroke="#57534e"
                strokeWidth="1"
                opacity="0.9"
              />
              <ellipse cx="118" cy="70" rx="3.5" ry="2" fill="#a8a29e" />

              <path
                d="M118,71 C135,80 160,88 180,103"
                fill="none"
                stroke="url(#waterStreamGradient)"
                strokeWidth={Math.min(3.5, Math.max(1.5, flowRate * 0.6))}
                strokeLinecap="round"
                className="kettle-water-stream"
              />

              <ellipse
                cx="180"
                cy="103"
                rx="6"
                ry="2"
                fill="none"
                stroke="#67e8f9"
                strokeWidth="1.2"
                opacity="0.8"
              />
            </g>
          )}
        </svg>
      </div>

      {/* Dual Big Readouts: Digital Time & Live Weight */}
      <div className="grid grid-cols-2 gap-3 mt-1">
        {/* Elapsed Timer Box */}
        <div className="p-3 bg-stone-950/60 rounded-2xl border border-stone-800/80 text-center">
          <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-0.5">
            {language === 'zh-TW' ? '沖煮時間' : 'Elapsed Time'}
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-stone-100 drop-shadow-sm">
            {formatTime(totalSeconds)}
          </div>
          <div className="text-[11px] text-stone-500 font-mono mt-1">
            {language === 'zh-TW' ? '本段' : 'Stage'}: {stageElapsed}s / {stageDuration}s
          </div>
        </div>

        {/* Scale Live Weight Box */}
        <div className="p-3 bg-stone-950/60 rounded-2xl border border-stone-800/80 text-center">
          <div className="text-[10px] uppercase tracking-widest text-stone-400 font-semibold mb-0.5 flex items-center justify-center gap-1.5">
            <span>{isScaleConnected ? (language === 'zh-TW' ? '即時秤重' : 'Live Weight') : (language === 'zh-TW' ? '目標水量' : 'Target Water')}</span>
            {isScaleConnected && (
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
            )}
          </div>
          <div className="text-4xl sm:text-5xl font-extrabold font-mono tracking-tight text-amber-300 drop-shadow-sm">
            {currentWeight.toFixed(1)}
            <span className="text-sm font-normal text-stone-400 ml-1">g</span>
          </div>
          <div className="text-[11px] text-stone-400 font-mono mt-1 flex items-center justify-center gap-1">
            <span>/ {totalTargetWater}g</span>
            <span className="text-stone-600">({brewProgressPercent}%)</span>
          </div>
        </div>
      </div>

      {/* Real-Time Drip Rate Bar & Target Guidance */}
      <div className="mt-3 p-2.5 rounded-2xl bg-stone-950/50 border border-stone-800/70 flex items-center justify-between text-xs">
        <div className="flex items-center space-x-2">
          <div className={`p-1.5 rounded-xl ${flowRate > 0 ? 'bg-cyan-500/20 text-cyan-400' : 'bg-stone-800 text-stone-500'}`}>
            <Droplets className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] uppercase tracking-wider text-stone-400 font-semibold">
              {language === 'zh-TW' ? '即時滴速 / 注水流速' : 'Live Drip / Flow Rate'}
            </div>
            <div className="font-mono font-bold text-sm text-cyan-300 flex items-center gap-1.5">
              <span>{flowRate.toFixed(1)} g/s</span>
              {isDripping && (
                <span className="text-[10px] font-normal text-stone-400">
                  (~{(1 / Math.max(0.18, dripDuration)).toFixed(1)} drops/s)
                </span>
              )}
            </div>
          </div>
        </div>

        <div className="text-right font-mono">
          <div className="text-[10px] uppercase tracking-wider text-stone-500">
            {language === 'zh-TW' ? '目標流速' : 'Target Flow'}
          </div>
          <div className="text-xs font-semibold text-stone-300">
            ~{expectedStageFlowRate} g/s
          </div>
        </div>
      </div>
    </div>
  );
};
