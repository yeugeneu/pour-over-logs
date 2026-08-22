import React, { useEffect, useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { PourStage } from '../../types/coffee';
import { soundService } from '../../utils/audio';
import { formatTime } from '../../utils/coffeeMath';
import { Play, Pause, RotateCcw, SkipForward, Volume2, VolumeX, CheckCircle, Droplets } from 'lucide-react';

interface LiveTimerProps {
  stages: PourStage[];
  totalTargetWater: number;
  doseGrams: number;
  onFinishBrew: (totalTimeSeconds: number, actualStages: PourStage[]) => void;
}

export const LiveTimer: React.FC<LiveTimerProps> = ({
  stages,
  totalTargetWater,
  onFinishBrew,
}) => {
  const { language, t } = useI18n();
  const [isRunning, setIsRunning] = useState<boolean>(false);
  const [totalSeconds, setTotalSeconds] = useState<number>(0);
  const [currentStageIdx, setCurrentStageIdx] = useState<number>(0);
  const [isMuted, setIsMuted] = useState<boolean>(soundService.getIsMuted());
  
  const timerRef = useRef<number | null>(null);
  const currentStage = stages[currentStageIdx] || stages[stages.length - 1];

  // Calculate stage elapsed and remaining time
  const stageStartTime = currentStage?.startTimeSeconds || 0;
  const stageDuration = currentStage?.durationSeconds || 30;
  const stageElapsed = Math.max(0, totalSeconds - stageStartTime);
  const stageRemaining = Math.max(0, stageDuration - stageElapsed);

  // Auto transition to next stage if stage time completes
  useEffect(() => {
    if (!isRunning) return;

    timerRef.current = window.setInterval(() => {
      setTotalSeconds((prev) => {
        const nextSec = prev + 1;

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
  }, [isRunning, currentStageIdx, stages, stageStartTime, stageDuration, stageRemaining]);

  const toggleTimer = () => {
    if (!isRunning) {
      soundService.playBeep(880, 0.1);
    }
    setIsRunning(!isRunning);
  };

  const resetTimer = () => {
    setIsRunning(false);
    setTotalSeconds(0);
    setCurrentStageIdx(0);
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
    onFinishBrew(totalSeconds, stages);
  };

  const toggleSound = () => {
    const muted = soundService.toggleMute();
    setIsMuted(muted);
  };

  // Flow rate calculation
  const stageFlowRate = currentStage
    ? (currentStage.pourWaterGrams / Math.max(1, currentStage.durationSeconds)).toFixed(1)
    : '0';

  const progressPercent = totalTargetWater > 0
    ? Math.min(100, Math.round(((currentStage?.targetWaterGrams || 0) / totalTargetWater) * 100))
    : 0;

  return (
    <div className="space-y-4">
      {/* Timer Main Screen Card */}
      <div className="p-6 bg-gradient-to-b from-stone-900 via-stone-950 to-stone-950 rounded-3xl border border-stone-800 shadow-2xl relative overflow-hidden text-center">
        {/* Subtle Background Glow */}
        <div className="absolute -top-24 left-1/2 -translate-x-1/2 w-72 h-72 bg-amber-600/10 rounded-full blur-3xl pointer-events-none" />

        {/* Audio Mute Toggle */}
        <div className="absolute top-4 right-4 z-10">
          <button
            type="button"
            onClick={toggleSound}
            className="p-2 rounded-xl bg-stone-900/80 hover:bg-stone-800 border border-stone-800 text-stone-400 hover:text-stone-200 transition shadow-sm"
            title={isMuted ? 'Unmute audio cues' : 'Mute audio cues'}
          >
            {isMuted ? <VolumeX className="w-4 h-4 text-stone-500" /> : <Volume2 className="w-4 h-4 text-amber-400" />}
          </button>
        </div>

        {/* Digital Time Display */}
        <div className="my-2">
          <div className="text-xs uppercase tracking-widest text-stone-400 font-medium">
            {t.brew.elapsedTime}
          </div>
          <div className="text-6xl sm:text-7xl font-extrabold font-mono tracking-tight text-white my-1 drop-shadow-md">
            {formatTime(totalSeconds)}
          </div>
        </div>

        {/* Current Stage Highlight Box */}
        <div className="mt-4 p-4 rounded-2xl bg-stone-900/90 border border-stone-800/90 max-w-md mx-auto">
          <div className="flex items-center justify-between text-xs text-stone-400 mb-2">
            <span className="font-semibold text-amber-400 uppercase tracking-wide">
              {language === 'zh-TW' ? `階段 ${currentStageIdx + 1} / ${stages.length}` : `Stage ${currentStageIdx + 1} of ${stages.length}`}
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
              <div className="text-[10px] text-stone-400 uppercase">{language === 'zh-TW' ? '本段注水' : 'Stage Pour'}</div>
              <div className="text-sm font-bold font-mono text-amber-300">+{currentStage?.pourWaterGrams}g</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-[10px] text-stone-400 uppercase">{language === 'zh-TW' ? '累計目標' : 'Cumulative'}</div>
              <div className="text-sm font-bold font-mono text-white">{currentStage?.targetWaterGrams}g</div>
            </div>
            <div className="p-2 rounded-xl bg-stone-950/60 border border-stone-800/60">
              <div className="text-[10px] text-stone-400 uppercase">{language === 'zh-TW' ? '建議流速' : 'Flow Rate'}</div>
              <div className="text-sm font-bold font-mono text-cyan-300">~{stageFlowRate} g/s</div>
            </div>
          </div>
        </div>

        {/* Total Water Progress Bar */}
        <div className="mt-4 max-w-md mx-auto">
          <div className="flex justify-between text-xs text-stone-400 mb-1">
            <span>{t.brew.totalWater}</span>
            <span className="font-mono text-stone-200">{currentStage?.targetWaterGrams}g / {totalTargetWater}g ({progressPercent}%)</span>
          </div>
          <div className="w-full bg-stone-800 rounded-full h-2 overflow-hidden">
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
