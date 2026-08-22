import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { RECIPE_PRESETS } from '../../data/presets';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { BrewLog, PourStage, SensoryProfile } from '../../types/coffee';
import { calculateDaysOffRoast, calculateExtractionYield, calculateRatio } from '../../utils/coffeeMath';
import { DialinAdvisorCard } from '../advisor/DialinAdvisorCard';
import { FlavorRadarChart } from '../sensory/FlavorRadarChart';
import { FlavorTagSelector } from '../sensory/FlavorTagSelector';
import { LiveTimer } from './LiveTimer';
import { X, Coffee, Sliders, ChevronRight, ChevronLeft, Sparkles, Check, Bookmark, Plus, Trash2 } from 'lucide-react';

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
  const { language, t } = useI18n();

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);

  // Selected Bean
  const [selectedBeanId, setSelectedBeanId] = useState<string>(
    brewModalBeanId || beans[0]?.id || ''
  );

  // Parameters
  const [dripper, setDripper] = useState<string>('Hario V60 01');
  const [filterPaper, setFilterPaper] = useState<string>('Cafec Abaca');
  const [grinder, setGrinder] = useState<string>('Comandante C40 MK4');
  const [grindSetting, setGrindSetting] = useState<string>('23 clicks');
  const [doseGrams, setDoseGrams] = useState<number>(15);
  const [waterGrams, setWaterGrams] = useState<number>(225);
  const [waterTemp, setWaterTemp] = useState<number>(92);
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

  // Initialize from preset or duplicate log
  useEffect(() => {
    if (brewModalBeanId) {
      setSelectedBeanId(brewModalBeanId);
    }
  }, [brewModalBeanId]);

  // Load recipe preset stages whenever preset or water changes
  const applyPreset = (presetId: string, customWater?: number, customDose?: number) => {
    const preset = RECIPE_PRESETS.find((p) => p.id === presetId);
    if (!preset) return;

    const currentWater = customWater || waterGrams;

    if (!customWater) setWaterGrams(preset.defaultWaterGrams);
    if (!customDose) setDoseGrams(preset.defaultDoseGrams);
    setDripper(preset.dripper);
    setWaterTemp(preset.defaultTempCelsius);
    setGrindSetting(preset.defaultGrindSetting);

    const generatedStages: PourStage[] = preset.stages.map((st, idx) => {
      const targetWater = Math.round((currentWater * st.targetWaterPercent) / 100);
      const pourWater = Math.round((currentWater * st.pourWaterPercent) / 100);
      return {
        id: `st-${idx + 1}`,
        name: st.name,
        targetWaterGrams: targetWater,
        pourWaterGrams: pourWater,
        startTimeSeconds: st.startTimeSeconds,
        durationSeconds: st.durationSeconds,
        technique: st.technique,
        description: st.description,
      };
    });

    setStages(generatedStages);
    setSelectedPresetId(presetId);
  };

  // On modal open, initialize
  useEffect(() => {
    if (isBrewModalOpen) {
      setStep(1);
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

  if (!isBrewModalOpen) return null;

  const currentBean = getBeanById(selectedBeanId) || beans[0];
  const ratio = calculateRatio(doseGrams, waterGrams);
  const tdsNum = parseFloat(tdsInput);
  const eyPercent = !isNaN(tdsNum) && tdsNum > 0
    ? calculateExtractionYield(doseGrams, waterGrams, tdsNum)
    : undefined;

  const daysOffRoast = currentBean ? calculateDaysOffRoast(currentBean.roastDate) : 0;

  const handleFinishTimer = (totalSeconds: number, finalStages: PourStage[]) => {
    setTotalTimeSeconds(totalSeconds);
    setStages(finalStages);
    setStep(3);
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
      doseGrams,
      waterGrams,
      ratio,
      waterTempCelsius: waterTemp,
      waterType,
      bloomWaterGrams: stages[0]?.pourWaterGrams || 45,
      bloomDurationSeconds: stages[0]?.durationSeconds || 40,
      stages,
      totalTimeSeconds,
      drawdownTimeSeconds: totalTimeSeconds,
      tdsPercent: !isNaN(tdsNum) && tdsNum > 0 ? tdsNum : undefined,
      extractionYieldPercent: eyPercent,
      sensory,
      flavorTags,
      extractionAssessment: sensory.sweetness >= 7 && sensory.bitterness <= 4 ? 'balanced_sweet' : sensory.bitterness >= 6 ? 'over_extracted' : 'under_extracted',
      dialinAdjustmentNotes: dialinNotes,
      overallScore,
      isGolden,
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
    const nextStages = [...stages];
    nextStages[idx] = { ...nextStages[idx], ...updates };
    setStages(nextStages);
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
                {step === 1 && t.brew.step1Params}
                {step === 2 && t.brew.step2Timer}
                {step === 3 && t.brew.step3Sensory}
                {step === 4 && t.brew.step4Diagnosis}
              </p>
            </div>
          </div>

          <button
            onClick={closeBrewModal}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Pills */}
        <div className="grid grid-cols-4 bg-stone-950/50 border-b border-stone-800/80 text-xs">
          {[
            { num: 1, label: language === 'zh-TW' ? '1. 參數' : '1. Setup' },
            { num: 2, label: language === 'zh-TW' ? '2. 計時' : '2. Timer' },
            { num: 3, label: language === 'zh-TW' ? '3. 杯測' : '3. Tasting' },
            { num: 4, label: language === 'zh-TW' ? '4. 調校' : '4. Dial-in' },
          ].map((s) => (
            <button
              key={s.num}
              onClick={() => setStep(s.num as 1 | 2 | 3 | 4)}
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
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {language === 'zh-TW' ? '選擇沖煮咖啡豆 (Select Bean)' : 'Select Bean'}
                </label>
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
                  <span>{t.brew.presetRecipe}</span>
                  <span className="text-[11px] text-amber-400 font-normal">
                    {RECIPE_PRESETS.find((p) => p.id === selectedPresetId)?.author}
                  </span>
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {RECIPE_PRESETS.map((preset) => (
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
                      <div className="font-semibold text-xs text-stone-200">{preset.name}</div>
                      <div className="text-[11px] text-stone-400 mt-0.5 line-clamp-1">{preset.description}</div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Dose, Water, Ratio, Temp Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800">
                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">{t.brew.dose}</label>
                  <input
                    type="number"
                    step="0.1"
                    value={doseGrams}
                    onChange={(e) => {
                      const d = parseFloat(e.target.value) || 0;
                      setDoseGrams(d);
                    }}
                    className="w-full bg-stone-900 text-stone-100 font-mono text-sm px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">{t.brew.water}</label>
                  <input
                    type="number"
                    step="1"
                    value={waterGrams}
                    onChange={(e) => {
                      const w = parseFloat(e.target.value) || 0;
                      setWaterGrams(w);
                    }}
                    className="w-full bg-stone-900 text-stone-100 font-mono text-sm px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">{t.brew.ratio}</label>
                  <div className="bg-stone-900 text-amber-300 font-mono text-sm px-3 py-2 rounded-xl border border-stone-800 flex items-center justify-center font-bold">
                    1 : {ratio}
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] text-stone-400 mb-1">{t.brew.waterTemp}</label>
                  <input
                    type="number"
                    value={waterTemp}
                    onChange={(e) => setWaterTemp(parseFloat(e.target.value) || 0)}
                    className="w-full bg-stone-900 text-stone-100 font-mono text-sm px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  />
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
                    className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">{t.brew.grinder}</label>
                  <input
                    type="text"
                    value={grinder}
                    onChange={(e) => setGrinder(e.target.value)}
                    className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-stone-300 mb-1">{t.brew.grindSetting}</label>
                  <input
                    type="text"
                    value={grindSetting}
                    onChange={(e) => setGrindSetting(e.target.value)}
                    placeholder="e.g. 24 clicks / 7.2"
                    className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none font-mono"
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
                      className="p-2.5 bg-stone-950/70 rounded-xl border border-stone-800 flex items-center gap-2 text-xs"
                    >
                      <span className="w-5 h-5 rounded-full bg-stone-800 flex items-center justify-center font-bold text-[10px] text-stone-400">
                        {idx + 1}
                      </span>
                      <input
                        type="text"
                        value={st.name}
                        onChange={(e) => updateStage(idx, { name: e.target.value })}
                        className="flex-1 bg-stone-900 px-2 py-1 rounded text-stone-200 border border-stone-800 text-xs"
                      />
                      <div className="flex items-center space-x-1">
                        <span className="text-stone-500 text-[10px]">目標:</span>
                        <input
                          type="number"
                          value={st.targetWaterGrams}
                          onChange={(e) =>
                            updateStage(idx, { targetWaterGrams: parseFloat(e.target.value) || 0 })
                          }
                          className="w-14 bg-stone-900 px-1.5 py-1 rounded text-amber-300 font-mono text-center border border-stone-800"
                        />
                        <span className="text-stone-500 text-[10px]">g</span>
                      </div>
                      <div className="flex items-center space-x-1">
                        <span className="text-stone-500 text-[10px]">時間:</span>
                        <input
                          type="number"
                          value={st.durationSeconds}
                          onChange={(e) =>
                            updateStage(idx, { durationSeconds: parseInt(e.target.value) || 0 })
                          }
                          className="w-12 bg-stone-900 px-1.5 py-1 rounded text-stone-200 font-mono text-center border border-stone-800"
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

          {/* STEP 2: LIVE TIMER COCKPIT */}
          {step === 2 && (
            <LiveTimer
              stages={stages}
              totalTargetWater={waterGrams}
              doseGrams={doseGrams}
              onFinishBrew={handleFinishTimer}
            />
          )}

          {/* STEP 3: SENSORY EVALUATION & FLAVOR WHEEL */}
          {step === 3 && (
            <div className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                {/* 6-Axis Sensory Sliders */}
                <div className="space-y-3 bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
                  <div className="text-xs font-semibold text-amber-400 flex items-center justify-between">
                    <span>{t.sensory.title}</span>
                    <span className="text-stone-400 text-[11px]">評分 1 (極低) ~ 10 (極佳)</span>
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
                <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800 flex flex-col items-center justify-center">
                  <div className="text-xs font-semibold text-stone-300 mb-1">
                    {language === 'zh-TW' ? '即時風味雷達圖' : 'Live Flavor Radar'}
                  </div>
                  <FlavorRadarChart sensory={sensory} size="md" />
                </div>
              </div>

              {/* Flavor Tag Selector */}
              <div className="space-y-2">
                <label className="text-xs font-semibold text-stone-300">
                  {t.sensory.flavorTags}
                </label>
                <FlavorTagSelector selectedTags={flavorTags} onChange={setFlavorTags} />
              </div>

              {/* TDS & Extraction Yield (Optional) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 bg-stone-950/60 p-3.5 rounded-2xl border border-stone-800">
                <div>
                  <label className="block text-xs text-stone-400 mb-1">{t.sensory.tdsOptional}</label>
                  <input
                    type="number"
                    step="0.01"
                    placeholder="e.g. 1.38"
                    value={tdsInput}
                    onChange={(e) => setTdsInput(e.target.value)}
                    className="w-full bg-stone-900 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-xs text-stone-400 mb-1">{t.sensory.eyPercent}</label>
                  <div className="bg-stone-900 text-stone-200 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 flex items-center justify-between">
                    <span>{eyPercent !== undefined ? `${eyPercent}%` : '—'}</span>
                    <span className="text-[10px] text-stone-500">標準區間: 18% - 22%</span>
                  </div>
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
                  step="0.1"
                  value={overallScore}
                  onChange={(e) => setOverallScore(parseFloat(e.target.value))}
                  className="w-full h-2 bg-stone-800 rounded-lg appearance-none cursor-pointer accent-amber-500"
                />
              </div>
            </div>
          )}

          {/* STEP 4: DIAL-IN DIAGNOSIS & SAVE */}
          {step === 4 && (
            <div className="space-y-4">
              {/* Dial-in Barista Advisor Card */}
              <DialinAdvisorCard
                log={{
                  doseGrams,
                  waterGrams,
                  waterTempCelsius: waterTemp,
                  ratio,
                  totalTimeSeconds,
                  sensory,
                  flavorTags,
                  extractionYieldPercent: eyPercent,
                }}
              />

              {/* Next Brew Dial-in Notes */}
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1.5">
                  {t.sensory.dialinPlanNotes}
                </label>
                <textarea
                  rows={3}
                  value={dialinNotes}
                  onChange={(e) => setDialinNotes(e.target.value)}
                  placeholder={
                    language === 'zh-TW'
                      ? '紀錄本次風味感受，以及下一把預計調整的研磨度、水溫或手法...'
                      : 'Record tasting thoughts and next-brew tweaks...'
                  }
                  className="w-full bg-stone-950 text-stone-100 text-xs p-3 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none resize-none leading-relaxed"
                />
              </div>

              {/* Bookmark as Golden Recipe */}
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
                      {language === 'zh-TW' ? '將此套參數設為該咖啡豆的官方標竿' : 'Set as the benchmark recipe for this bean'}
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
          )}
        </div>

        {/* Modal Footer Controls */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div>
            {step > 1 ? (
              <button
                type="button"
                onClick={() => setStep((s) => (s - 1) as 1 | 2 | 3 | 4)}
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
                  onClick={() => setStep(3)}
                  className="px-3.5 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
                >
                  {language === 'zh-TW' ? '跳過計時 (手動紀錄)' : 'Skip Timer'}
                </button>
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-md shadow-amber-900/30"
                >
                  <span>{language === 'zh-TW' ? '進入計時' : 'Start Timer'}</span>
                  <ChevronRight className="w-4 h-4" />
                </button>
              </>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={() => setStep(3)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
              >
                <span>{language === 'zh-TW' ? '進入杯測評分' : 'Evaluate Tasting'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={() => setStep(4)}
                className="flex items-center space-x-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white text-xs font-bold transition"
              >
                <span>{language === 'zh-TW' ? '查看診斷與保存' : 'View Diagnosis & Save'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            )}

            {step === 4 && (
              <button
                type="button"
                onClick={handleSaveBrew}
                className="flex items-center space-x-1.5 px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-amber-900/40 transform active:scale-95"
              >
                <Check className="w-4 h-4" />
                <span>{language === 'zh-TW' ? '保存手沖日誌' : 'Save Brew Session'}</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
