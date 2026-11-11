import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RECIPE_PRESETS } from '../../data/presets';
import { useCoffee } from '../../context/CoffeeContext';
import { useScale } from '../../context/ScaleContext';
import { useI18n } from '../../i18n';
import { BrewLog, PourStage, SensoryProfile } from '../../types/coffee';
import { WeightDataPoint } from '../../types/scale';
import { calculateDaysOffRoast, calculateExtractionYield, calculateRatio } from '../../utils/coffeeMath';
import { DialinAdvisorCard } from '../advisor/DialinAdvisorCard';
import { FlavorRadarChart } from '../sensory/FlavorRadarChart';
import { FlavorTagSelector } from '../sensory/FlavorTagSelector';
import { LiveTimer } from './LiveTimer';
import { X, Coffee, Sliders, ChevronRight, ChevronLeft, Sparkles, Check, Bookmark, Plus, Trash2, Lock, Unlock, Bluetooth, ChevronDown, ChevronUp } from 'lucide-react';

const getScaledStageName = (name: string, targetWaterGrams: number, pourWaterGrams: number) =>
  name
    .replace(/\(至 \d+g\)/g, `(至 ${targetWaterGrams}g)`)
    .replace(/\(\d+g\)/g, `(${pourWaterGrams}g)`)
    .replace(/至 \d+g/g, `至 ${targetWaterGrams}g`);

const getScaledStageDescription = (
  description: string | undefined,
  targetWaterGrams: number,
  pourWaterGrams: number,
  durationSeconds?: number
) => {
  if (!description) return description;
  const circlePour = Math.round(pourWaterGrams * 0.3);
  const centerPour = Math.max(0, pourWaterGrams - circlePour);
  let scaled = description
    .replace(
      /\d+g(\s*(?:快速)?同心圓(?:水流)?\s*\+\s*)\d+g/g,
      `${circlePour}g$1${centerPour}g`
    )
    .replace(/(至(?:總水量)?\s*)\d+g/g, `$1${targetWaterGrams}g`)
    .replace(/(注水\s*|注完\s*)\d+g/g, `$1${pourWaterGrams}g`);
  if (durationSeconds !== undefined && durationSeconds > 0) {
    scaled = scaled.replace(/(悶蒸\s*)\d+(\s*秒)/g, `$1${durationSeconds}$2`);
  }
  return scaled;
};

export const BrewSessionModal: React.FC = () => {
  const {
    beans,
    logs,
    isBrewModalOpen,
    brewModalBeanId,
    brewModalPresetLogId,
    closeBrewModal,
    addLog,
    getBeanById,
  } = useCoffee();
  const { connectionState, telemetry } = useScale();
  const isScaleConnected = connectionState === 'connected';
  const { language, t } = useI18n();

  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [showAdvancedSetup, setShowAdvancedSetup] = useState<boolean>(false);
  const [showAdvancedTasting, setShowAdvancedTasting] = useState<boolean>(false);
  const [quickTaste, setQuickTaste] = useState<'sour' | 'balanced' | 'bitter'>('balanced');

  // Selected Bean
  const [selectedBeanId, setSelectedBeanId] = useState<string>(
    brewModalBeanId || beans[0]?.id || ''
  );

  // Parameters
  const [dripper, setDripper] = useState<string>('Hario V60 01');
  const [filterPaper, setFilterPaper] = useState<string>('Cafec Abaca');
  const [grinder, setGrinder] = useState<string>('Fellow Ode Gen 1');
  const [grindSetting, setGrindSetting] = useState<string>('23 clicks');
  const [doseGrams, setDoseGrams] = useState<number | ''>(15);
  const [waterGrams, setWaterGrams] = useState<number | ''>(225);
  const [targetRatio, setTargetRatio] = useState<number | ''>(15);
  const [isRatioLocked, setIsRatioLocked] = useState<boolean>(true);
  const [waterTemp, setWaterTemp] = useState<number | ''>(92);
  const [waterType, setWaterType] = useState<string>('RO Filtered');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('traditional-three-stage');

  // Stages
  const [stages, setStages] = useState<PourStage[]>([]);

  // Brew Time
  const [totalTimeSeconds, setTotalTimeSeconds] = useState<number>(145);

  // Sensory Profile
  const [sensory, setSensory] = useState<SensoryProfile>({
    acidity: 7.5,
    sweetness: 8.0,
    body: 7.0,
    clarity: 8.0,
    balance: 8.0,
    aftertaste: 7.5,
    bitterness: 3.0,
  });

  const [flavorTags, setFlavorTags] = useState<string[]>([]);
  const [tdsInput, setTdsInput] = useState<string>('');
  const [overallScore, setOverallScore] = useState<number>(8.5);
  const [dialinNotes, setDialinNotes] = useState<string>('');
  const [isGolden, setIsGolden] = useState<boolean>(false);
  const [savedWeightCurve, setSavedWeightCurve] = useState<WeightDataPoint[] | undefined>();
  const [savedScaleModel, setSavedScaleModel] = useState<string | undefined>();
  const [savedDrawdownSeconds, setSavedDrawdownSeconds] = useState<number | undefined>();

  // Initialize from preset or duplicate log
  useEffect(() => {
    if (brewModalBeanId) {
      setSelectedBeanId(brewModalBeanId);
    }
  }, [brewModalBeanId]);

  // Rescale stages proportionally to new total water
  const rescaleStages = (newTotalWater: number) => {
    if (newTotalWater <= 0) return;
    const preset = RECIPE_PRESETS.find((p) => p.id === selectedPresetId);
    if (preset) {
      let prevTarget = 0;
      const updatedStages = preset.stages.map((st, idx) => {
        const targetWater =
          idx === preset.stages.length - 1
            ? Math.round(newTotalWater)
            : Math.round((newTotalWater * st.targetWaterPercent) / 100);
        const pourWater = Math.max(0, targetWater - prevTarget);
        prevTarget = targetWater;
        return {
          id: `st-${idx + 1}`,
          name: getScaledStageName(st.name, targetWater, pourWater),
          targetWaterGrams: targetWater,
          pourWaterGrams: pourWater,
          startTimeSeconds: st.startTimeSeconds,
          durationSeconds: st.durationSeconds,
          technique: st.technique,
          description: getScaledStageDescription(
            st.description,
            targetWater,
            pourWater,
            st.durationSeconds
          ),
        };
      });
      setStages(updatedStages);
    } else if (stages.length > 0) {
      const currentSum = stages[stages.length - 1]?.targetWaterGrams || (waterGrams !== '' ? Number(waterGrams) : 1);
      const factor = newTotalWater / currentSum;
      let prevTarget = 0;
      const updatedStages = stages.map((st, idx) => {
        const targetWater =
          idx === stages.length - 1
            ? Math.round(newTotalWater)
            : Math.round(st.targetWaterGrams * factor);
        const pourWater = Math.max(0, targetWater - prevTarget);
        prevTarget = targetWater;
        return {
          ...st,
          name: getScaledStageName(st.name, targetWater, pourWater),
          targetWaterGrams: targetWater,
          pourWaterGrams: pourWater,
          description: getScaledStageDescription(
            st.description,
            targetWater,
            pourWater,
            st.durationSeconds
          ),
        };
      });
      setStages(updatedStages);
    }
  };

  const toggleRatioLock = () => {
    setIsRatioLocked((prev) => !prev);
  };

  const handleDoseChange = (val: string) => {
    if (val === '') {
      setDoseGrams('');
      return;
    }
    const newDose = parseFloat(val);
    setDoseGrams(newDose);
    if (newDose > 0) {
      if (isRatioLocked && targetRatio !== '' && Number(targetRatio) > 0) {
        // In locked mode: auto scale water = dose * ratio
        const newWater = Math.round(newDose * Number(targetRatio));
        setWaterGrams(newWater);
        rescaleStages(newWater);
      } else if (!isRatioLocked && waterGrams !== '' && Number(waterGrams) > 0) {
        // In free mode: update ratio display
        const newRatio = parseFloat((Number(waterGrams) / newDose).toFixed(1));
        setTargetRatio(newRatio);
      }
    }
  };

  const handleWaterChange = (val: string) => {
    if (val === '') {
      setWaterGrams('');
      return;
    }
    const newWater = parseFloat(val);
    setWaterGrams(newWater);
    if (newWater > 0) {
      if (isRatioLocked && targetRatio !== '' && Number(targetRatio) > 0) {
        // In locked mode: auto scale dose = water / ratio
        const newDose = parseFloat((newWater / Number(targetRatio)).toFixed(1));
        setDoseGrams(newDose);
        rescaleStages(newWater);
      } else {
        // In free mode: update ratio display
        const curDose = doseGrams !== '' ? Number(doseGrams) : 0;
        if (curDose > 0) {
          const newRatio = parseFloat((newWater / curDose).toFixed(1));
          setTargetRatio(newRatio);
        }
        rescaleStages(newWater);
      }
    }
  };

  const handleRatioChange = (val: string | number) => {
    if (val === '') {
      setTargetRatio('');
      return;
    }
    const newRatio = typeof val === 'number' ? val : parseFloat(val);
    setTargetRatio(newRatio);
    const curDose = doseGrams !== '' ? Number(doseGrams) : 15;
    if (curDose > 0 && newRatio > 0) {
      const newWater = Math.round(curDose * newRatio);
      setWaterGrams(newWater);
      rescaleStages(newWater);
    }
  };

  // Load recipe preset stages whenever preset or water changes
  const applyPreset = (presetId: string, customWater?: number, customDose?: number) => {
    const preset = RECIPE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const currentWater = customWater || (waterGrams !== '' ? Number(waterGrams) : 225);
    const currentDose = customDose || (doseGrams !== '' ? Number(doseGrams) : 15);

    setWaterGrams(currentWater);
    setDoseGrams(currentDose);
    setTargetRatio(parseFloat((currentWater / currentDose).toFixed(1)));
    setDripper(preset.dripper);
    setWaterTemp(preset.defaultTempCelsius);
    setGrindSetting(preset.defaultGrindSetting);

    let prevTarget = 0;
    const generatedStages: PourStage[] = preset.stages.map((st, idx) => {
      const targetWater =
        idx === preset.stages.length - 1
          ? Math.round(currentWater)
          : Math.round((currentWater * st.targetWaterPercent) / 100);
      const pourWater = Math.max(0, targetWater - prevTarget);
      prevTarget = targetWater;
      return {
        id: `st-${idx + 1}`,
        name: getScaledStageName(st.name, targetWater, pourWater),
        targetWaterGrams: targetWater,
        pourWaterGrams: pourWater,
        startTimeSeconds: st.startTimeSeconds,
        durationSeconds: st.durationSeconds,
        technique: st.technique,
        description: getScaledStageDescription(
          st.description,
          targetWater,
          pourWater,
          st.durationSeconds
        ),
      };
    });

    setStages(generatedStages);
    setSelectedPresetId(presetId);
  };

  // On modal open, initialize
  useEffect(() => {
    if (isBrewModalOpen) {
      setStep(1);
      setShowAdvancedSetup(false);
      setShowAdvancedTasting(false);
      setQuickTaste('balanced');
      if (brewModalPresetLogId) {
        const baseLog = logs.find((l) => l.id === brewModalPresetLogId);
        if (baseLog) {
          setSelectedBeanId(baseLog.beanId);
          setDripper(baseLog.dripper);
          setFilterPaper(baseLog.filterPaper || 'Cafec Abaca');
          setGrinder(baseLog.grinder);
          setGrindSetting(baseLog.grindSetting);
          setDoseGrams(baseLog.doseGrams);
          setWaterGrams(baseLog.waterGrams);
          setTargetRatio(baseLog.ratio);
          setWaterTemp(baseLog.waterTempCelsius);
          setWaterType(baseLog.waterType || 'RO Filtered');
          setStages(baseLog.stages || []);
          setTotalTimeSeconds(baseLog.totalTimeSeconds);
          setSensory(baseLog.sensory);
          setFlavorTags(baseLog.flavorTags || []);
          setDialinNotes(baseLog.dialinAdjustmentNotes ? `基於前把調校：${baseLog.dialinAdjustmentNotes}` : '');
          return;
        }
      }

      // Default apply traditional 3-stage
      applyPreset('traditional-three-stage', 225, 15);
    }
  }, [isBrewModalOpen, brewModalPresetLogId]);

  const applyQuickTaste = (taste: 'sour' | 'balanced' | 'bitter') => {
    setQuickTaste(taste);
    if (taste === 'sour') {
      setSensory({
        acidity: 8.5,
        sweetness: 5.5,
        body: 5.5,
        clarity: 7.5,
        balance: 5.5,
        aftertaste: 5.5,
        bitterness: 2.5,
      });
      setOverallScore(6.5);
    } else if (taste === 'balanced') {
      setSensory({
        acidity: 7.5,
        sweetness: 8.5,
        body: 7.5,
        clarity: 8.0,
        balance: 8.5,
        aftertaste: 8.0,
        bitterness: 3.0,
      });
      setOverallScore(8.5);
    } else {
      setSensory({
        acidity: 5.0,
        sweetness: 5.5,
        body: 7.5,
        clarity: 5.5,
        balance: 5.5,
        aftertaste: 5.0,
        bitterness: 7.5,
      });
      setOverallScore(6.0);
    }
  };

  if (!isBrewModalOpen) return null;

  const currentBean = getBeanById(selectedBeanId) || beans[0];
  const parsedDose = doseGrams !== '' ? Number(doseGrams) : 15;
  const parsedWater = waterGrams !== '' ? Number(waterGrams) : 225;
  const parsedTemp = waterTemp !== '' ? Number(waterTemp) : 92;
  const ratio = targetRatio !== '' ? Number(targetRatio) : calculateRatio(parsedDose, parsedWater);

  const daysOffRoast = currentBean ? calculateDaysOffRoast(currentBean.roastDate) : 0;

  const handleCloseWithoutSaving = () => {
    const message = language === 'zh-TW'
      ? '目前的沖煮資料尚未儲存，確定要不儲存並關閉嗎？'
      : 'This brew has not been saved. Close without saving?';

    if (window.confirm(message)) {
      closeBrewModal();
    }
  };

  const tdsNum = parseFloat(tdsInput);
  const eyPercent = !isNaN(tdsNum) && tdsNum > 0 && parsedDose > 0
    ? calculateExtractionYield(tdsNum, parsedWater, parsedDose)
    : undefined;

  const handleFinishTimer = (
    totalSeconds: number,
    finalStages: PourStage[],
    weightCurve?: WeightDataPoint[],
    scaleModel?: string,
    drawdownSeconds?: number
  ) => {
    setTotalTimeSeconds(totalSeconds);
    setStages(finalStages);
    setSavedWeightCurve(weightCurve);
    setSavedScaleModel(scaleModel);
    setSavedDrawdownSeconds(drawdownSeconds);
    setStep(3);
  };

  const handleSaveBrewLater = () => {
    if (!currentBean) return;

    const draftLog: Omit<BrewLog, 'id'> = {
      beanId: currentBean.id,
      brewDate: new Date().toISOString(),
      daysOffRoast,
      dripper,
      filterPaper,
      grinder,
      grindSetting,
      doseGrams: parsedDose,
      waterGrams: parsedWater,
      ratio,
      waterTempCelsius: parsedTemp,
      waterType,
      bloomWaterGrams: stages[0]?.pourWaterGrams || 45,
      bloomDurationSeconds: stages[0]?.durationSeconds || 40,
      stages,
      totalTimeSeconds,
      drawdownTimeSeconds: savedDrawdownSeconds || totalTimeSeconds,
      scaleModel: savedScaleModel,
      weightCurve: savedWeightCurve,
      sensory: {
        acidity: 7.5,
        sweetness: 8.0,
        body: 7.0,
        clarity: 8.0,
        balance: 8.0,
        aftertaste: 7.5,
        bitterness: 3.0,
      },
      flavorTags: [],
      extractionAssessment: 'balanced_sweet',
      dialinAdjustmentNotes: '',
      overallScore: 8.0,
      isGolden: false,
      isTastingPending: true,
    };

    addLog(draftLog);
    closeBrewModal();
  };

  const handleSaveBrew = () => {
    if (!currentBean) return;

    const draftLog: Omit<BrewLog, 'id'> = {
      beanId: currentBean.id,
      brewDate: new Date().toISOString(),
      daysOffRoast,
      dripper,
      filterPaper,
      grinder,
      grindSetting,
      doseGrams: parsedDose,
      waterGrams: parsedWater,
      ratio,
      waterTempCelsius: parsedTemp,
      waterType,
      bloomWaterGrams: stages[0]?.pourWaterGrams || 45,
      bloomDurationSeconds: stages[0]?.durationSeconds || 40,
      stages,
      totalTimeSeconds,
      drawdownTimeSeconds: savedDrawdownSeconds || totalTimeSeconds,
      scaleModel: savedScaleModel,
      weightCurve: savedWeightCurve,
      tdsPercent: !isNaN(tdsNum) && tdsNum > 0 ? tdsNum : undefined,
      extractionYieldPercent: eyPercent,
      sensory,
      flavorTags,
      extractionAssessment:
        sensory.sweetness >= 7 && sensory.bitterness <= 4
          ? 'balanced_sweet'
          : sensory.bitterness >= 6
          ? 'over_extracted'
          : 'under_extracted',
      dialinAdjustmentNotes: dialinNotes,
      overallScore,
      isGolden,
      isTastingPending: false,
    };

    addLog(draftLog);

    if (isGolden) {
      try {
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    closeBrewModal();
  };

  const updateStage = (idx: number, updates: Partial<PourStage>) => {
    const nextStages = stages.map((st, i) => (i === idx ? { ...st, ...updates } : { ...st }));
    let prevTarget = 0;
    const syncedStages = nextStages.map((st) => {
      const targetWater = st.targetWaterGrams;
      const pourWater = Math.max(0, targetWater - prevTarget);
      prevTarget = targetWater;
      return {
        ...st,
        pourWaterGrams: pourWater,
        name: getScaledStageName(st.name, targetWater, pourWater),
        description: getScaledStageDescription(
          st.description,
          targetWater,
          pourWater,
          st.durationSeconds
        ),
      };
    });
    setStages(syncedStages);
  };

  const addCustomStage = () => {
    const lastStage = stages[stages.length - 1];
    const nextTarget = (lastStage?.targetWaterGrams || 0) + 50;
    const newStage: PourStage = {
      id: `st-${stages.length + 1}`,
      name: `第 ${stages.length + 1} 段注水`,
      targetWaterGrams: nextTarget,
      pourWaterGrams: 50,
      startTimeSeconds: (lastStage?.startTimeSeconds || 0) + (lastStage?.durationSeconds || 30),
      durationSeconds: 30,
      technique: 'spiral',
    };
    setStages([...stages, newStage]);
    setWaterGrams(nextTarget);
  };

  const removeStage = (idx: number) => {
    if (stages.length <= 1) return;
    const nextStages = stages.filter((_, i) => i !== idx);
    setStages(nextStages);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header & Step Indicator */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Coffee className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-100 flex items-center gap-2">
                <span>{t.brew.cockpitTitle}</span>
                {currentBean && (
                  <span className="text-xs font-normal text-amber-400/90 truncate max-w-[200px] sm:max-w-xs">
                    • {currentBean.name}
                  </span>
                )}
              </h3>
              <p className="text-xs text-stone-400">
                {step === 1 && (language === 'zh-TW' ? '選好咖啡豆與杯量，一鍵跟著計時沖煮' : 'Pick your bean, cup size, and recipe to start')}
                {step === 2 && t.brew.step2Timer}
                {step === 3 && (language === 'zh-TW' ? '快速記錄風味感受，或展開專業杯測調校' : 'Quickly rate your cup or expand pro sensory tools')}
              </p>
            </div>
          </div>

          <button
            onClick={handleCloseWithoutSaving}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills (Streamlined 3-Step Flow) */}
        <div className="grid grid-cols-3 bg-stone-950/50 border-b border-stone-800/80 text-xs">
          {[
            { num: 1, label: language === 'zh-TW' ? '1. 準備沖煮' : '1. Setup' },
            { num: 2, label: language === 'zh-TW' ? '2. 跟著注水' : '2. Timer' },
            { num: 3, label: language === 'zh-TW' ? '3. 品飲紀錄' : '3. Taste & Save' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as 1 | 2 | 3)}
              className={`py-2.5 px-1 text-center font-medium border-b-2 transition ${
                step === s.num
                  ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                  : 'border-transparent text-stone-500 hover:text-stone-300'
              }`}
            >
              {s.label}
            </button>
          ))}
        </div>

        {/* Modal Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-5">
          {/* STEP 1: PARAMETER SETUP */}
          {step === 1 && (
            <div className="space-y-4">
              {/* Bean Selection */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold text-stone-300">
                    {language === 'zh-TW' ? '1. 選擇沖煮咖啡豆' : '1. Select Coffee Bean'}
                  </label>
                  {currentBean && (
                    <span className="text-[11px] text-amber-400/90">
                      💡 {language === 'zh-TW'
                        ? `${currentBean.roastLevel} 建議水溫：${currentBean.roastLevel === 'Light' ? '92–94°C' : currentBean.roastLevel === 'Dark' ? '85–88°C' : '89–91°C'}`
                        : `Recommended for ${currentBean.roastLevel}: ${currentBean.roastLevel === 'Light' ? '92–94°C' : currentBean.roastLevel === 'Dark' ? '85–88°C' : '89–91°C'}`}
                    </span>
                  )}
                </div>
                <select
                  value={selectedBeanId}
                  onChange={(e) => setSelectedBeanId(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 text-sm px-3.5 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                >
                  {beans.map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.name} ({b.roaster} • 養豆 {calculateDaysOffRoast(b.roastDate)} 天 • 剩 {b.remainingWeightGrams}g)
                    </option>
                  ))}
                </select>
              </div>

              {/* Recipe Preset Selector */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5 flex items-center justify-between">
                  <span>{language === 'zh-TW' ? '2. 選擇注水手法 (點選即套用)' : '2. Pick a Pour Recipe (1-Click)'}</span>
                  <span className="text-[11px] text-amber-400 font-normal">
                    {RECIPE_PRESETS.find((p) => p.id === selectedPresetId)?.author}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RECIPE_PRESETS.map((preset) => {
                    const isBeginnerFriendly =
                      preset.id === 'traditional-three-stage' || preset.id === 'hoffmann-v60';
                    return (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => applyPreset(preset.id)}
                        className={`p-3 rounded-xl border text-left transition ${
                          selectedPresetId === preset.id
                            ? 'bg-amber-500/10 border-amber-500/50 text-stone-100 shadow-sm'
                            : 'bg-stone-950/50 border-stone-800 text-stone-400 hover:bg-stone-800/40'
                        }`}
                      >
                        <div className="flex items-center justify-between gap-2">
                          <span className="font-semibold text-xs text-stone-200 truncate">{preset.name}</span>
                          {isBeginnerFriendly && (
                            <span className="shrink-0 text-[10px] px-1.5 py-0.5 rounded-md bg-emerald-500/15 text-emerald-300 border border-emerald-500/30 font-medium">
                              {language === 'zh-TW' ? '新手推薦' : 'Easy'}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{preset.description}</div>
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Simple Cup Size & Basic Dose / Water / Temp */}
              <div className="space-y-2.5 bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <span className="text-xs font-semibold text-stone-300">
                    {language === 'zh-TW' ? '3. 粉量與水量 (1:' + ratio + ')' : `3. Dose & Water (1:${ratio})`}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[11px] text-stone-400">
                      {language === 'zh-TW' ? '快速杯量:' : 'Cup size:'}
                    </span>
                    {[
                      { label: language === 'zh-TW' ? '1 人份 (15g)' : '1 Cup (15g)', dose: 15 },
                      { label: language === 'zh-TW' ? '大杯 (20g)' : 'Large (20g)', dose: 20 },
                      { label: language === 'zh-TW' ? '2 人份 (30g)' : '2 Cups (30g)', dose: 30 },
                    ].map((presetCup) => (
                      <button
                        key={presetCup.dose}
                        type="button"
                        onClick={() => {
                          setIsRatioLocked(true);
                          const r = targetRatio !== '' && Number(targetRatio) > 0 ? Number(targetRatio) : 15;
                          const w = Math.round(presetCup.dose * r);
                          setDoseGrams(presetCup.dose);
                          setWaterGrams(w);
                          rescaleStages(w);
                        }}
                        className={`px-2.5 py-1 rounded-lg text-[11px] font-medium transition ${
                          Number(doseGrams) === presetCup.dose
                            ? 'bg-amber-500 text-stone-950 font-bold shadow-sm'
                            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800'
                        }`}
                      >
                        {presetCup.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 pt-1">
                  {/* 咖啡粉重 Dose */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block text-[11px] text-stone-400">{t.brew.dose}</label>
                      {isScaleConnected && (
                        <button
                          type="button"
                          onClick={() => handleDoseChange(telemetry.weight.toFixed(1))}
                          className="text-[10px] text-amber-400 hover:text-amber-300 font-mono flex items-center gap-0.5"
                          title="Sync dose from Acaia scale"
                        >
                          <Bluetooth className="w-2.5 h-2.5" />
                          <span>{telemetry.weight.toFixed(1)}g</span>
                        </button>
                      )}
                    </div>
                    <input
                      type="number"
                      step="0.1"
                      placeholder="15"
                      value={doseGrams}
                      onChange={(e) => handleDoseChange(e.target.value)}
                      className="w-full bg-stone-900 text-stone-100 font-mono text-sm px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* 總注水量 Water */}
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">{t.brew.water}</label>
                    <input
                      type="number"
                      step="1"
                      placeholder="225"
                      value={waterGrams}
                      onChange={(e) => handleWaterChange(e.target.value)}
                      className="w-full bg-stone-900 text-stone-100 font-mono text-sm px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>

                  {/* 沖煮水溫 Temp */}
                  <div>
                    <label className="block text-[11px] text-stone-400 mb-1">{t.brew.waterTemp}</label>
                    <input
                      type="number"
                      value={waterTemp}
                      onChange={(e) => {
                        const val = e.target.value;
                        setWaterTemp(val === '' ? '' : parseFloat(val));
                      }}
                      className="w-full bg-stone-900 text-stone-100 font-mono text-sm px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                    />
                  </div>
                </div>

                {/* Read-only Quick Pour Preview Pill */}
                <div className="pt-2 border-t border-stone-800/80 flex flex-wrap items-center justify-between gap-2 text-[11px] text-stone-400">
                  <div className="flex flex-wrap items-center gap-1.5">
                    <span className="text-stone-500 font-medium">
                      {language === 'zh-TW' ? '注水節奏：' : 'Pour plan:'}
                    </span>
                    {stages.map((st, idx) => (
                      <span
                        key={st.id || idx}
                        className="px-2 py-0.5 rounded-md bg-stone-900 border border-stone-800 font-mono text-stone-300"
                      >
                        {idx + 1}. {st.targetWaterGrams}g ({st.durationSeconds}s)
                      </span>
                    ))}
                  </div>
                </div>
              </div>

              {/* Progressive Disclosure Toggle: Equipment, Ratio Lock & Custom Pour Stages */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedSetup((prev) => !prev)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-stone-300 hover:bg-stone-900/60 transition"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <Sliders className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    <span>
                      {language === 'zh-TW'
                        ? '進階設定：粉水比鎖定、器材研磨與自訂分段'
                        : 'Advanced: Ratio Lock, Grinder/Dripper & Custom Pour Stages'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-[11px] font-mono text-stone-400 hidden sm:inline">
                      1:{ratio} • {dripper} • {grindSetting}
                    </span>
                    {showAdvancedSetup ? (
                      <ChevronUp className="w-4 h-4 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-4 h-4 text-stone-400" />
                    )}
                  </div>
                </button>

                {showAdvancedSetup && (
                  <div className="p-4 border-t border-stone-800 space-y-4 bg-stone-950/60">
                    {/* Ratio Lock & Quick Ratio Pills */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-300">{t.brew.ratio}</label>
                        <button
                          type="button"
                          onClick={toggleRatioLock}
                          className={`px-2.5 py-1 rounded-lg text-[11px] font-bold flex items-center gap-1 transition ${
                            isRatioLocked
                              ? 'bg-amber-500 text-stone-950'
                              : 'bg-stone-800 text-stone-300 border border-stone-700'
                          }`}
                        >
                          {isRatioLocked ? (
                            <>
                              <Lock className="w-3 h-3" />
                              <span>{language === 'zh-TW' ? '比例已鎖定' : 'Ratio Locked'}</span>
                            </>
                          ) : (
                            <>
                              <Unlock className="w-3 h-3" />
                              <span>{language === 'zh-TW' ? '自由粉水' : 'Free Mode'}</span>
                            </>
                          )}
                        </button>
                      </div>

                      <div className="flex flex-wrap items-center gap-2">
                        <div className="flex items-center px-3 py-1.5 rounded-xl bg-stone-900 border border-stone-800 w-28">
                          <span className="font-bold mr-1 text-xs text-stone-400">1 :</span>
                          <input
                            type="number"
                            step="0.1"
                            value={targetRatio}
                            onChange={(e) => handleRatioChange(e.target.value)}
                            className="w-full bg-transparent font-mono font-bold text-xs text-amber-300 focus:outline-none"
                          />
                        </div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          {[14, 15, 15.5, 16, 16.5, 17].map((r) => (
                            <button
                              key={r}
                              type="button"
                              onClick={() => {
                                handleRatioChange(r);
                                setIsRatioLocked(true);
                              }}
                              className={`px-2 py-1 rounded-lg text-[11px] font-mono transition ${
                                targetRatio === r && isRatioLocked
                                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40 font-bold'
                                  : 'bg-stone-900 hover:bg-stone-800 text-stone-400 border border-stone-800'
                              }`}
                            >
                              1:{r}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Equipment Setup */}
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">{t.brew.dripper}</label>
                        <input
                          type="text"
                          value={dripper}
                          onChange={(e) => setDripper(e.target.value)}
                          className="w-full bg-stone-900 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">{t.brew.grinder}</label>
                        <input
                          type="text"
                          value={grinder}
                          onChange={(e) => setGrinder(e.target.value)}
                          className="w-full bg-stone-900 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-stone-300 mb-1">{t.brew.grindSetting}</label>
                        <input
                          type="text"
                          value={grindSetting}
                          onChange={(e) => setGrindSetting(e.target.value)}
                          placeholder="e.g. 24 clicks / 7.2"
                          className="w-full bg-stone-900 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none font-mono"
                        />
                      </div>
                    </div>

                    {/* Staged Pour Plan Editor */}
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                          <Sliders className="w-3.5 h-3.5 text-amber-500" />
                          <span>{t.brew.stages}</span>
                        </label>
                        <button
                          type="button"
                          onClick={addCustomStage}
                          className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>{t.brew.addStage}</span>
                        </button>
                      </div>

                      <div className="space-y-2 max-h-48 overflow-y-auto">
                        {stages.map((st, idx) => (
                          <div
                            key={st.id || idx}
                            className="p-2.5 bg-stone-900/80 rounded-xl border border-stone-800 flex items-center gap-2 text-xs"
                          >
                            <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center font-bold text-[10px] text-stone-400">
                              {idx + 1}
                            </span>
                            <input
                              type="text"
                              value={st.name}
                              onChange={(e) => updateStage(idx, { name: e.target.value })}
                              className="flex-1 bg-stone-950 px-2 py-1 rounded text-stone-200 border border-stone-800 text-xs"
                            />
                            <div className="flex items-center space-x-1">
                              <span className="text-stone-500 text-[10px]">目標:</span>
                              <input
                                type="number"
                                value={st.targetWaterGrams || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateStage(idx, { targetWaterGrams: val === '' ? 0 : parseFloat(val) });
                                }}
                                className="w-14 bg-stone-950 px-1.5 py-1 rounded text-amber-300 font-mono text-center border border-stone-800"
                              />
                              <span className="text-stone-500 text-[10px]">g</span>
                            </div>
                            <div className="flex items-center space-x-1">
                              <span className="text-stone-500 text-[10px]">時間:</span>
                              <input
                                type="number"
                                value={st.durationSeconds || ''}
                                onChange={(e) => {
                                  const val = e.target.value;
                                  updateStage(idx, { durationSeconds: val === '' ? 0 : parseInt(val) });
                                }}
                                className="w-12 bg-stone-950 px-1.5 py-1 rounded text-stone-200 font-mono text-center border border-stone-800"
                              />
                              <span className="text-stone-500 text-[10px]">s</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => removeStage(idx)}
                              className="p-1 text-stone-500 hover:text-rose-400"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* STEP 2: LIVE TIMER COCKPIT */}
          {step === 2 && (
            <LiveTimer
              stages={stages}
              totalTargetWater={parsedWater}
              doseGrams={parsedDose}
              onFinishBrew={handleFinishTimer}
            />
          )}

          {/* STEP 3: QUICK TASTING & PROGRESSIVE PRO SENSORY / DIAL-IN */}
          {step === 3 && (
            <div className="space-y-4">
              {/* 1-Tap Quick Taste Check for Beginners */}
              <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200">
                    {language === 'zh-TW' ? '1. 這杯喝起來如何？ (一鍵快速評估)' : '1. How did this cup taste? (Quick Check)'}
                  </label>
                  <span className="text-[11px] text-stone-400">
                    {language === 'zh-TW' ? '自動給出下次調整建議' : 'Auto-fills sensory & tips'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2.5">
                  {[
                    {
                      id: 'sour' as const,
                      emoji: '🍋',
                      title: language === 'zh-TW' ? '偏酸 / 偏淡' : 'Too Sour / Weak',
                      sub: language === 'zh-TW' ? '萃取略少' : 'Under-extracted',
                    },
                    {
                      id: 'balanced' as const,
                      emoji: '✨',
                      title: language === 'zh-TW' ? '順口好喝！' : 'Balanced & Sweet',
                      sub: language === 'zh-TW' ? '恰到好處' : 'Just right',
                    },
                    {
                      id: 'bitter' as const,
                      emoji: '🍫',
                      title: language === 'zh-TW' ? '偏苦 / 乾澀' : 'Too Bitter / Harsh',
                      sub: language === 'zh-TW' ? '萃取過多' : 'Over-extracted',
                    },
                  ].map((opt) => (
                    <button
                      key={opt.id}
                      type="button"
                      onClick={() => applyQuickTaste(opt.id)}
                      className={`p-3 rounded-2xl border text-center transition ${
                        quickTaste === opt.id
                          ? 'bg-amber-500/15 border-amber-500 text-stone-100 shadow-sm'
                          : 'bg-stone-900/70 border-stone-800 text-stone-400 hover:bg-stone-800/50'
                      }`}
                    >
                      <div className="text-xl mb-1">{opt.emoji}</div>
                      <div className="text-xs font-bold text-stone-200">{opt.title}</div>
                      <div className="text-[10px] text-stone-400 mt-0.5">{opt.sub}</div>
                    </button>
                  ))}
                </div>

                {/* Friendly Beginner Tip Banner */}
                <div className="p-3 rounded-xl bg-stone-900/90 border border-stone-800 text-xs text-stone-300 flex items-center justify-between gap-2">
                  <span>
                    {quickTaste === 'sour' &&
                      (language === 'zh-TW'
                        ? '💡 下次小撇步：試著把「研磨調細 1 格」或「水溫提高 2°C」，能帶出更多甜感！'
                        : '💡 Next time: Try grinding 1 click finer or raising water temp by +2°C for more sweetness.')}
                    {quickTaste === 'balanced' &&
                      (language === 'zh-TW'
                        ? '🎉 沖得很棒！如果非常喜歡這杯，可以在下方勾選「設為神參數」保存下來。'
                        : '🎉 Great brew! Bookmark it as your Golden Recipe below to repeat it easily.')}
                    {quickTaste === 'bitter' &&
                      (language === 'zh-TW'
                        ? '💡 下次小撇步：試著把「研磨調粗 1 格」或「水溫降低 2°C」，苦澀感就會減少！'
                        : '💡 Next time: Try grinding 1 click coarser or lowering water temp by -2°C to reduce bitterness.')}
                  </span>
                </div>
              </div>

              {/* Overall Score Slider */}
              <div className="p-4 bg-amber-500/10 rounded-2xl border border-amber-500/30 space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs sm:text-sm font-bold text-amber-300 flex items-center gap-1.5">
                    <Sparkles className="w-4 h-4" />
                    <span>{t.sensory.overallScore}</span>
                  </label>
                  <span className="text-xl font-bold font-mono text-amber-400">
                    {overallScore.toFixed(1)} <span className="text-xs text-stone-400">/ 10</span>
                  </span>
                </div>
                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={overallScore}
                  onChange={(e) => setOverallScore(parseFloat(e.target.value))}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>

              {/* Flavor Tag Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300">
                  {t.sensory.flavorTags}
                </label>
                <FlavorTagSelector selectedTags={flavorTags} onChange={setFlavorTags} />
              </div>

              {/* Quick Notes & Golden Recipe Bookmark */}
              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                    {t.sensory.dialinPlanNotes}
                  </label>
                  <textarea
                    rows={2}
                    value={dialinNotes}
                    onChange={(e) => setDialinNotes(e.target.value)}
                    placeholder={
                      language === 'zh-TW'
                        ? '隨手記下心得，例如：放涼後果酸很甜、下次想磨細一點...'
                        : 'Jot down quick tasting thoughts or next-brew tweaks...'
                    }
                    className="w-full bg-stone-950 text-stone-100 text-xs p-3 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                  />
                </div>

                <div
                  onClick={() => setIsGolden(!isGolden)}
                  className={`p-3.5 rounded-2xl border flex items-center justify-between cursor-pointer transition ${
                    isGolden
                      ? 'bg-amber-500/20 border-amber-500 text-amber-200'
                      : 'bg-stone-950/60 border-stone-800 text-stone-400 hover:bg-stone-900'
                  }`}
                >
                  <div className="flex items-center space-x-2.5">
                    <Bookmark className={`w-5 h-5 ${isGolden ? 'text-amber-400 fill-amber-400' : 'text-stone-500'}`} />
                    <div>
                      <div className="font-semibold text-xs text-stone-200">{t.sensory.markAsGolden}</div>
                      <div className="text-[11px] text-stone-400">
                        {language === 'zh-TW' ? '將此套參數設為這支豆子的最佳配方' : 'Save as your go-to recipe for this bean'}
                      </div>
                    </div>
                  </div>

                  <div
                    className={`w-5 h-5 rounded-md flex items-center justify-center border ${
                      isGolden ? 'bg-amber-500 border-amber-500 text-black' : 'border-stone-700'
                    }`}
                  >
                    {isGolden && <Check className="w-3.5 h-3.5 font-bold" />}
                  </div>
                </div>
              </div>

              {/* Progressive Disclosure: Pro 7-Axis Sensory Sliders, Radar, TDS & Diagnostic Engine */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowAdvancedTasting((prev) => !prev)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-stone-300 hover:bg-stone-900/60 transition"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {language === 'zh-TW'
                        ? '進階杯測與診斷：7 軸風味雷達圖、TDS 萃取率、AI 調校報告'
                        : 'Pro Barista Tools: 7-Axis Radar, TDS/EY% & Diagnostic Coach'}
                    </span>
                  </div>
                  {showAdvancedTasting ? (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </button>

                {showAdvancedTasting && (
                  <div className="p-4 border-t border-stone-800 space-y-5 bg-stone-950/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                      {/* 7-Axis Sensory Sliders */}
                      <div className="space-y-3 bg-stone-900/60 p-4 rounded-2xl border border-stone-800">
                        <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                          <span>{t.sensory.title}</span>
                          <span className="text-stone-400 text-[11px]">1 ~ 10</span>
                        </div>

                        {[
                          { key: 'acidity', label: t.sensory.acidity, color: 'accent-yellow-500' },
                          { key: 'sweetness', label: t.sensory.sweetness, color: 'accent-amber-500' },
                          { key: 'body', label: t.sensory.body, color: 'accent-orange-500' },
                          { key: 'clarity', label: t.sensory.clarity, color: 'accent-cyan-500' },
                          { key: 'balance', label: t.sensory.balance, color: 'accent-emerald-500' },
                          { key: 'aftertaste', label: t.sensory.aftertaste, color: 'accent-purple-500' },
                          { key: 'bitterness', label: t.sensory.bitterness, color: 'accent-rose-500' },
                        ].map(({ key, label, color }) => (
                          <div key={key} className="space-y-1">
                            <div className="flex justify-between text-xs">
                              <span className="text-stone-300">{label}</span>
                              <span className="font-mono font-bold text-amber-300">
                                {sensory[key as keyof SensoryProfile] || 5} / 10
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              value={sensory[key as keyof SensoryProfile] || 5}
                              onChange={(e) =>
                                setSensory({
                                  ...sensory,
                                  [key]: parseFloat(e.target.value),
                                })
                              }
                              className={`w-full h-1.5 bg-stone-800 rounded-lg appearance-none cursor-pointer ${color}`}
                            />
                          </div>
                        ))}
                      </div>

                      {/* Real-time Flavor Radar Preview */}
                      <div className="bg-stone-900/60 p-4 rounded-2xl border border-stone-800 flex flex-col items-center justify-center">
                        <div className="text-xs font-semibold text-stone-300 mb-1">
                          {language === 'zh-TW' ? '即時風味雷達圖' : 'Live Flavor Radar'}
                        </div>
                        <FlavorRadarChart sensory={sensory} size="md" />
                      </div>
                    </div>

                    {/* TDS & Extraction Yield (Optional) */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-900/60 p-3.5 rounded-2xl border border-stone-800">
                      <div>
                        <label className="block text-xs text-stone-400 mb-1">{t.sensory.tdsOptional}</label>
                        <input
                          type="number"
                          step="0.01"
                          placeholder="e.g. 1.38"
                          value={tdsInput}
                          onChange={(e) => setTdsInput(e.target.value)}
                          className="w-full bg-stone-950 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                        />
                      </div>

                      <div>
                        <label className="block text-xs text-stone-400 mb-1">{t.sensory.eyPercent}</label>
                        <div className="bg-stone-950 text-stone-200 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 flex items-center justify-between">
                          <span>{eyPercent !== undefined ? `${eyPercent}%` : '—'}</span>
                          <span className="text-[10px] text-stone-500">標準區間: 18% - 22%</span>
                        </div>
                      </div>
                    </div>

                    {/* Dial-in Barista Advisor Card */}
                    <DialinAdvisorCard
                      log={{
                        doseGrams: parsedDose,
                        waterGrams: parsedWater,
                        waterTempCelsius: parsedTemp,
                        ratio,
                        totalTimeSeconds,
                        sensory,
                        flavorTags,
                        extractionYieldPercent: eyPercent,
                      }}
                    />
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3)}
                className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
              >
                <ChevronLeft className="w-4 h-4" />
                <span>{language === 'zh-TW' ? '上一步' : 'Back'}</span>
              </button>
            ) : (
              <div />
            )}
          </div>

          <div className="flex items-center space-x-2">
            {step === 1 && (
              <>
                <button
                  type="button"
                  onClick={handleSaveBrewLater}
                  className="hidden sm:flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 transition"
                  title="僅保存手沖參數，待沖煮完成品飲後隨時再補填杯測"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'zh-TW' ? '僅記參數 (稍後杯測)' : 'Log & Cup Later'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
                >
                  {language === 'zh-TW' ? '跳過計時' : 'Skip Timer'}
                </button>

                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-md shadow-amber-900/30 active:scale-95"
                >
                  <span>{language === 'zh-TW' ? '開始沖煮計時' : 'Start Brew Timer'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <>
                <button
                  type="button"
                  onClick={handleSaveBrewLater}
                  className="flex items-center space-x-1 px-3 py-2 rounded-xl bg-stone-900 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 transition"
                  title="沖煮完畢，待降溫品飲後再補填杯測評分"
                >
                  <Bookmark className="w-3.5 h-3.5 text-amber-400" />
                  <span>{language === 'zh-TW' ? '沖完稍後杯測' : 'Save & Cup Later'}</span>
                </button>

                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-md shadow-amber-900/30 active:scale-95"
                >
                  <span>{language === 'zh-TW' ? '下一步：品飲紀錄' : 'Next: Taste & Save'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSaveBrew}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-amber-900/40 transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'zh-TW' ? '保存沖煮日誌' : 'Save Brew Log'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
