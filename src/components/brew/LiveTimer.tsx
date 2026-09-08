import React, { useEffect, useRef, useState, useCallback } from 'react';
import { useI18n } from '../../i18n';
import { PourStage } from '../../types/coffee';
import { WeightDataPoint } from '../../types/scale';
import { useScale } from '../../context/ScaleContext';
import { soundService } from '../../utils/audio';
import { formatTime } from '../../utils/coffeeMath';
import { LivePourCurveChart } from './LivePourCurveChart';
import { AnimatedPourOverTimer } from './AnimatedPourOverTimer';
import {
  Play,
  Pause,
  RotateCcw,
  SkipForward,
  Volume2,
  VolumeX,
  CheckCircle,
  Droplets,
  Bluetooth,
  Activity,
} from 'lucide-react';

interface LiveTimerProps {
  stages: PourStage[];
  totalTargetWater: number;
  doseGrams: number;
  onFinishBrew: (
    totalTimeSeconds: number,
    actualStages: PourStage[],
    weightCurve?: WeightDataPoint[],
    scaleModel?: string,
    drawdownTimeSeconds?: number
  ) => void;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({
  stages,
  totalTargetWater,
  onFinishBrew,
}) => {
  const { language, t } = useI18n();
  const {
    connectionState,
    deviceInfo,
    telemetry,
    preferences,
    tare,
    startTimer: scaleStartTimer,
    pauseTimer: scalePauseTimer,
    resetTimer: scaleResetTimer,
    openScaleModal,
  } = useScale();

  const isScaleConnected = connectionState === 'connected';

  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(soundService.getIsMuted());
  const [showChart, setShowChart] = useState<boolean>(true);
  const [timerViewMode, setTimerViewMode] = useState<'animated' | 'compact'>('animated');

  // Time-series curve recording
  const [curveData, setCurveData] = useState<WeightDataPoint[]>([]);

  // Drawdown tracking
  const [drawdownStartTime, setDrawdownStartTime] = useState<number | null>(null);
  const [drawdownTimeSeconds, setDrawdownTimeSeconds] = useState<number | null>(null);

  const timerRef = useRef<number | null>(null);
  const telemetryRef = useRef(telemetry);
  telemetryRef.current = telemetry;

  const currentStage = stages[currentStageIdx] || stages[stages.length - 1];

  // Calculate stage elapsed and remaining time
  const stageStartTime = currentStage?.startTimeSeconds || 0;
  const stageDuration = currentStage?.durationSeconds || 30;
  const stageElapsed = Math.max(0, totalSeconds - stageStartTime);
  const stageRemaining = Math.max(0, stageDuration - stageElapsed);

  // Target flow rate calculation for current stage
  const expectedStageFlowRate = currentStage
    ? parseFloat((currentStage.pourWaterGrams / Math.max(1, currentStage.durationSeconds)).toFixed(1))
    : 0;

  // Calculate target cumulative weight at any elapsed second
  const getTargetWeightAtTime = useCallback(
    (sec: number): number => {
      if (stages.length === 0) return 0;
      for (let i = 0; i < stages.length; i++) {
        const s = stages[i];
        const sStart = s.startTimeSeconds;
        const sEnd = s.startTimeSeconds + s.durationSeconds;
        const prevTarget = i > 0 ? stages[i - 1].targetWaterGrams : 0;

        if (sec < sStart) {
          return prevTarget;
        }
        if (sec <= sEnd) {
          const progress = (sec - sStart) / Math.max(1, s.durationSeconds);
          return Math.round(prevTarget + s.pourWaterGrams * progress);
        }
      }
      return stages[stages.length - 1].targetWaterGrams;
    },
    [stages]
  );

  // Auto-Start on First Pour Detection (first drop)
  useEffect(() => {
    if (
      !isRunning &&
      totalSeconds === 0 &&
      isScaleConnected &&
      preferences.autoStartOnFirstDrop &&
      telemetry.weight >= preferences.firstDropThresholdGrams
    ) {
      soundService.playBeep(880, 0.12);
      setIsRunning(true);
      if (preferences.autoTareOnBrewStart) {
        tare();
      }
      scaleStartTimer();
    }
  }, [
    isRunning,
    totalSeconds,
    isScaleConnected,
    preferences.autoStartOnFirstDrop,
    preferences.autoTareOnBrewStart,
    preferences.firstDropThresholdGrams,
    telemetry.weight,
    tare,
    scaleStartTimer,
  ]);

  // Main Timer Loop & Auto Stage Transitions
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = window.setInterval(() => {
      setTotalSeconds((prev) => {
        const nextSec = prev + 1;

        // Record point for pour curve
        const curWeight = isScaleConnected ? telemetryRef.current.weight : 0;
        const curFlow = isScaleConnected ? telemetryRef.current.flowRate : 0;
        const targetWt = getTargetWeightAtTime(nextSec);

        setCurveData((pts) => [
          ...pts,
          {
            time: nextSec,
            weight: curWeight,
            flowRate: curFlow,
            targetWeight: targetWt,
          },
        ]);

        // Check if next stage boundary is reached
        const nextStageCandidate = stages.findIndex(
          (s, idx) => idx > currentStageIdx && nextSec >= s.startTimeSeconds
        );

        if (nextStageCandidate !== -1) {
          setCurrentStageIdx(nextStageCandidate);
          soundService.playStageChange();
        } else if (currentStageIdx < stages.length - 1) {
          const expectedEnd = stageStartTime + stageDuration;
          if (nextSec >= expectedEnd) {
            setCurrentStageIdx((curr) => Math.min(stages.length - 1, curr + 1));
            soundService.playStageChange();
          }
        } else if (currentStageIdx === stages.length - 1 && !drawdownStartTime) {
          // Entering drawdown period after last stage
          setDrawdownStartTime(nextSec);
        }

        // Countdown beeps for last 3 seconds of a stage
        if (stageRemaining <= 3 && stageRemaining > 0) {
          soundService.playBeep(700, 0.05);
        }

        return nextSec;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [
    isRunning,
    currentStageIdx,
    stages,
    stageStartTime,
    stageDuration,
    stageRemaining,
    isScaleConnected,
    getTargetWeightAtTime,
    drawdownStartTime,
  ]);

  const toggleTimer = () => {
    if (!isRunning) {
      soundService.playBeep(880, 0.1);
      if (totalSeconds === 0 && preferences.autoTareOnBrewStart && isScaleConnected) {
        tare();
      }
      scaleStartTimer();
    } else {
      scalePauseTimer();
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTotalSeconds(0);
    setCurrentStageIdx(0);
    setCurveData([]);
    setDrawdownStartTime(null);
    setDrawdownTimeSeconds(null);
    scaleResetTimer();
  };

  const handleNextStage = () => {
    if (currentStageIdx < stages.length - 1) {
      setCurrentStageIdx((prev) => prev + 1);
      soundService.playStageChange();
    }
  };

  const handleFinish = () => {
    setIsRunning(false);
    soundService.playFinish();
    scalePauseTimer();

    // Calculate actual drawdown if in drawdown phase
    let finalDrawdown = drawdownTimeSeconds;
    if (drawdownStartTime && !finalDrawdown) {
      finalDrawdown = Math.max(0, totalSeconds - drawdownStartTime);
    }

    onFinishBrew(
      totalSeconds,
      stages,
      curveData.length > 0 ? curveData : undefined,
      deviceInfo ? deviceInfo.name : undefined,
      finalDrawdown || undefined
    );
  };

  const toggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  // Progress calculations
  const displayWeight = isScaleConnected ? telemetry.weight : currentStage?.targetWaterGrams || 0;
  const progressPercent =
    totalTargetWater > 0
      ? Math.min(100, Math.round((displayWeight / totalTargetWater) * 100))
      : 0;

  // Flow rate variance evaluation
  const flowDiff = telemetry.flowRate - expectedStageFlowRate;
  const isFlowOnTarget = Math.abs(flowDiff) <= 0.6;
  const isFlowTooFast = flowDiff > 0.6;

  return (
    <div className="space-y-4">
      {/* Timer Main Screen Card */}
      <div className="p-6 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 rounded-3xl border border-stone-800 shadow-2xl relative overflow-hidden text-center">
        {/* Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Top Control Bar: Scale Pill & Audio Toggle */}
        <div className="flex items-center justify-between mb-2">
          {/* Scale Status Badge */}
          <button
            type="button"
            onClick={openScaleModal}
            className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition ${
              isScaleConnected
                ? 'bg-emerald-950/40 text-emerald-300 border-emerald-800/80 hover:bg-emerald-900/60'
                : 'bg-stone-900/80 text-stone-400 border-stone-800 hover:text-stone-200'
            }`}
          >
            <Bluetooth
              className={`w-3.5 h-3.5 ${isScaleConnected ? 'text-emerald-400' : 'text-stone-400'}`}
            />
            <span>
              {isScaleConnected
                ? `${deviceInfo?.name || 'Acaia'} • ${telemetry.weight.toFixed(1)}g`
                : t.scale.connect}
            </span>
          </button>

          <div className="flex items-center space-x-2">
            {/* Quick Tare Button (If Scale Connected) */}
            {isScaleConnected && (
              <button
                type="button"
                onClick={tare}
                className="px-2.5 py-1.5 rounded-xl bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 text-xs font-bold transition shadow-sm"
                title={t.scale.tare}
              >
                {t.scale.tare}
              </button>
            )}

            {/* Audio Mute Toggle */}
            <button
              type="button"
              onClick={toggleSound}
              className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition shadow-sm"
              title={isMuted ? 'Unmute audio cues' : 'Mute audio cues'}
            >
              {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
            </button>

            {/* View Mode Toggle: Animated Dripper vs Compact */}
            <div className="flex items-center bg-stone-900/80 p-0.5 rounded-xl border border-stone-800 text-xs shadow-sm">
              <button
                type="button"
                onClick={() => setTimerViewMode('animated')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                  timerViewMode === 'animated'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={language === 'zh-TW' ? '動畫手沖計時器' : 'Animated Dripper Timer'}
              >
                ☕ {language === 'zh-TW' ? '動畫' : 'Animation'}
              </button>
              <button
                type="button"
                onClick={() => setTimerViewMode('compact')}
                className={`px-2 py-1 rounded-lg text-[11px] font-medium transition ${
                  timerViewMode === 'compact'
                    ? 'bg-amber-600/30 text-amber-300 border border-amber-500/30 shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
                title={language === 'zh-TW' ? '數字卡片模式' : 'Compact Cards'}
              >
                📊 {language === 'zh-TW' ? '簡約' : 'Compact'}
              </button>
            </div>
          </div>
        </div>

        {/* Dynamic Timer View: Animated Pour-Over Dripper or Compact Cards */}
        {timerViewMode === 'animated' ? (
          <div className="my-3">
            <AnimatedPourOverTimer
              totalSeconds={totalSeconds}
              stageElapsed={stageElapsed}
              stageDuration={stageDuration}
              stageRemaining={stageRemaining}
              currentStageName={currentStage?.name}
              currentStageIdx={currentStageIdx}
              totalStages={stages.length}
              isRunning={isRunning}
              currentWeight={displayWeight}
              totalTargetWater={totalTargetWater}
              flowRate={telemetry.flowRate}
              expectedStageFlowRate={expectedStageFlowRate}
              isScaleConnected={isScaleConnected}
              formatTime={formatTime}
            />
          </div>
        ) : (
          /* Digital Time & Scale Weight Dual Display */
          <div className="my-3 grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
            {/* Elapsed Time */}
            <div className="p-3 bg-stone-950/50 rounded-2xl border border-stone-800/60">
              <div className="text-[10px] uppercase tracking-widest text-stone-400 font-medium">
                {t.brew.elapsedTime}
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-stone-100 my-1 drop-shadow-md">
                {formatTime(totalSeconds)}
              </div>
              <div className="text-[11px] text-stone-500 font-mono">
                Stage: {stageElapsed}s / {stageDuration}s
              </div>
            </div>

            {/* Scale Live Weight & Flow Rate */}
            <div className="p-3 bg-stone-950/50 rounded-2xl border border-stone-800/60">
              <div className="text-[10px] uppercase tracking-widest text-stone-400 font-medium flex items-center justify-center gap-1.5">
                <span>{isScaleConnected ? t.scale.liveWeight : 'Target Water'}</span>
                {isScaleConnected && (
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-ping" />
                )}
              </div>
              <div className="text-5xl sm:text-6xl font-extrabold font-mono tracking-tight text-amber-300 my-1 drop-shadow-md">
                {displayWeight.toFixed(1)}
                <span className="text-lg text-stone-400 font-normal ml-1">g</span>
              </div>

              {/* Live Flow Rate with Target Guidance */}
              <div className="text-[11px] font-mono flex items-center justify-center gap-1.5">
                <span className="text-stone-400">Flow:</span>
                <span
                  className={`font-bold ${
                    telemetry.flowRate === 0
                      ? 'text-stone-500'
                      : isFlowOnTarget
                      ? 'text-emerald-400'
                      : isFlowTooFast
                      ? 'text-amber-400'
                      : 'text-cyan-400'
                  }`}
                >
                  {telemetry.flowRate.toFixed(1)} g/s
                </span>
                <span className="text-stone-600">|</span>
                <span className="text-stone-400">Target: ~{expectedStageFlowRate} g/s</span>
              </div>
            </div>
          </div>
        )}

        {/* Current Stage Highlight Box */}
        <div className="mt-3 p-4 rounded-2xl bg-stone-900/90 border border-stone-800/90 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
            <span className="font-semibold text-amber-400 uppercase tracking-wide">
              {language === 'zh-TW'
                ? `階段 ${currentStageIdx + 1} / ${stages.length}`
                : `Stage ${currentStageIdx + 1} of ${stages.length}`}
            </span>
            <span className="font-mono bg-stone-800 px-2 py-0.5 rounded text-stone-300">
              {language === 'zh-TW' ? `剩餘 ${stageRemaining}s` : `${stageRemaining}s left`}
            </span>
          </div>

          <div className="text-base sm:text-lg font-bold text-stone-100 flex items-center justify-center gap-2">
            <span>{currentStage?.name}</span>
          </div>

          {currentStage?.description && (
            <p className="text-xs text-stone-400 mt-1.5 leading-relaxed">
              {currentStage.description}
            </p>
          )}

          {/* Water Target & Flow Rate metrics */}
          <div className="grid grid-cols-3 gap-2 mt-3 pt-3 border-t border-stone-800/80 text-center">
            <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-[10px] text-stone-400 uppercase">
                {language === 'zh-TW' ? '本段注水' : 'Stage Pour'}
              </div>
              <div className="text-sm font-bold font-mono text-amber-300">
                +{currentStage?.pourWaterGrams}g
              </div>
            </div>
            <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-[10px] text-stone-400 uppercase">
                {language === 'zh-TW' ? '累計目標' : 'Cumulative'}
              </div>
              <div className="text-sm font-bold font-mono text-stone-100">
                {currentStage?.targetWaterGrams}g
              </div>
            </div>
            <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-[10px] text-stone-400 uppercase">
                {language === 'zh-TW' ? '建議流速' : 'Flow Rate'}
              </div>
              <div className="text-sm font-bold font-mono text-cyan-300">
                ~{expectedStageFlowRate} g/s
              </div>
            </div>
          </div>
        </div>

        {/* Total Water Progress Bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>{t.brew.totalWater}</span>
            <span className="font-mono text-stone-200">
              {displayWeight.toFixed(1)}g / {totalTargetWater}g ({progressPercent}%)
            </span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2.5 overflow-hidden">
            <div
              className="bg-gradient-to-r from-amber-600 to-amber-400 h-full transition-all duration-300 rounded-full"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>

        {/* Primary Timer Controls */}
        <div className="flex items-center justify-center gap-3 sm:gap-4 mt-6">
          <button
            type="button"
            onClick={resetTimer}
            className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition active:scale-95"
            title="Reset Timer"
          >
            <RotateCcw className="w-5 h-5" />
          </button>

          <button
            type="button"
            onClick={toggleTimer}
            className={`flex items-center justify-center space-x-2 px-8 py-3.5 rounded-2xl font-bold text-base transition shadow-lg transform active:scale-95 ${
              isRunning
                ? 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-900/30'
                : 'bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-amber-900/40'
            }`}
          >
            {isRunning ? (
              <>
                <Pause className="w-5 h-5" />
                <span>{t.brew.pauseTimer}</span>
              </>
            ) : (
              <>
                <Play className="w-5 h-5" />
                <span>{totalSeconds > 0 ? t.brew.resumeTimer : t.brew.startTimer}</span>
              </>
            )}
          </button>

          {currentStageIdx < stages.length - 1 ? (
            <button
              type="button"
              onClick={handleNextStage}
              className="p-3.5 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-300 border border-stone-700 transition active:scale-95"
              title="Next Stage"
            >
              <SkipForward className="w-5 h-5" />
            </button>
          ) : (
            <button
              type="button"
              onClick={handleFinish}
              className="px-4 py-3.5 rounded-2xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs sm:text-sm transition flex items-center space-x-1.5 shadow-lg shadow-emerald-900/30 active:scale-95"
            >
              <CheckCircle className="w-4 h-4" />
              <span>{language === 'zh-TW' ? '完成' : 'Done'}</span>
            </button>
          )}
        </div>
      </div>

      {/* Live Extraction Pour Curve Chart Toggle & Visualizer */}
      <div className="space-y-2">
        <div className="flex items-center justify-between px-1">
          <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
            <Activity className="w-3.5 h-3.5 text-amber-500" />
            <span>{t.scale.pourCurve}</span>
          </div>
          <button
            type="button"
            onClick={() => setShowChart(!showChart)}
            className="text-[11px] text-stone-400 hover:text-stone-200 transition"
          >
            {showChart ? 'Hide Chart' : 'Show Chart'}
          </button>
        </div>

        {showChart && (
          <LivePourCurveChart
            data={curveData}
            stages={stages}
            totalTargetWater={totalTargetWater}
            totalTimeSeconds={totalSeconds}
          />
        )}
      </div>

      {/* Stage Timeline List */}
      <div className="bg-stone-900/70 rounded-2xl p-4 border border-stone-800 space-y-2">
        <div className="text-xs font-semibold text-stone-300 flex items-center gap-1.5 mb-2">
          <Droplets className="w-3.5 h-3.5 text-amber-500" />
          <span>{language === 'zh-TW' ? '注水階段清單' : 'Pour Stages Timeline'}</span>
        </div>

        <div className="space-y-1.5">
          {stages.map((stage, idx) => {
            const isCurrent = idx === currentStageIdx;
            const isPassed = idx < currentStageIdx;

            return (
              <div
                key={stage.id || idx}
                onClick={() => setCurrentStageIdx(idx)}
                className={`p-2.5 rounded-xl border flex items-center justify-between text-xs cursor-pointer transition ${
                  isCurrent
                    ? 'bg-amber-500/10 border-amber-500/40 text-stone-100 font-medium'
                    : isPassed
                    ? 'bg-stone-950/40 border-stone-800/40 text-stone-500'
                    : 'bg-stone-900/40 border-stone-800/80 text-stone-300 hover:bg-stone-800/40'
                }`}
              >
                <div className="flex items-center space-x-2.5">
                  <span
                    className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                      isCurrent
                        ? 'bg-amber-500 text-black'
                        : isPassed
                        ? 'bg-stone-800 text-stone-500'
                        : 'bg-stone-800 text-stone-400'
                    }`}
                  >
                    {idx + 1}
                  </span>
                  <div>
                    <div className="font-semibold">{stage.name}</div>
                    <div className="text-[10px] text-stone-400">
                      +{stage.pourWaterGrams}g • {stage.durationSeconds}s ({stage.technique})
                    </div>
                  </div>
                </div>

                <div className="text-right font-mono">
                  <span className="text-xs font-bold text-amber-300">{stage.targetWaterGrams}g</span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
