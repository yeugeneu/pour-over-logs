import React, { useEffect, useState } from 'react';
import confetti from 'canvas-confetti';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { BrewLog, SensoryProfile } from '../../types/coffee';
import { calculateExtractionYield, formatTime } from '../../utils/coffeeMath';
import { FlavorRadarChart } from '../sensory/FlavorRadarChart';
import { FlavorTagSelector } from '../sensory/FlavorTagSelector';
import { DialinAdvisorCard } from '../advisor/DialinAdvisorCard';
import { X, Sparkles, Award, Check, Coffee, Sliders, ChevronRight, ChevronDown, ChevronUp } from 'lucide-react';

export const TastingDialinModal: React.FC = () => {
  const {
    logs,
    getBeanById,
    isTastingModalOpen,
    tastingLogId,
    initialTastingTab,
    closeTastingModal,
    updateLog,
  } = useCoffee();
  const { language, t } = useI18n();

  const [activeTab, setActiveTab] = useState<'sensory' | 'dialin'>('sensory');
  const [showProSensory, setShowProSensory] = useState<boolean>(false);
  const [quickTaste, setQuickTaste] = useState<'sour' | 'balanced' | 'bitter'>('balanced');

  const log = logs.find((l) => l.id === tastingLogId);
  const bean = log ? getBeanById(log.beanId) : undefined;

  // Sensory State
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

  // Dial-in State
  const [dialinNotes, setDialinNotes] = useState<string>('');
  const [isGolden, setIsGolden] = useState<boolean>(false);

  // Synchronize state when modal opens
  useEffect(() => {
    if (log) {
      setSensory(log.sensory || {
        acidity: 7.5,
        sweetness: 8.0,
        body: 7.0,
        clarity: 8.0,
        balance: 8.0,
        aftertaste: 7.5,
        bitterness: 3.0,
      });
      setFlavorTags(log.flavorTags || []);
      setTdsInput(log.tdsPercent ? String(log.tdsPercent) : '');
      setOverallScore(log.overallScore !== undefined ? log.overallScore : 8.5);
      setDialinNotes(log.dialinAdjustmentNotes || '');
      setIsGolden(!!log.isGolden);
      setActiveTab(initialTastingTab || 'sensory');
      setShowProSensory(Boolean(log.tdsPercent));
      if (log.extractionAssessment === 'under_extracted') setQuickTaste('sour');
      else if (log.extractionAssessment === 'over_extracted') setQuickTaste('bitter');
      else setQuickTaste('balanced');
    }
  }, [log, initialTastingTab, isTastingModalOpen]);

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

  if (!isTastingModalOpen || !log) return null;

  const tdsNum = parseFloat(tdsInput);
  const calculatedEY = !isNaN(tdsNum) && tdsNum > 0 && log.doseGrams > 0
    ? calculateExtractionYield(tdsNum, log.waterGrams, log.doseGrams)
    : log.extractionYieldPercent;

  const currentDraftLog: Partial<BrewLog> = {
    ...log,
    sensory,
    flavorTags,
    tdsPercent: !isNaN(tdsNum) && tdsNum > 0 ? tdsNum : undefined,
    extractionYieldPercent: calculatedEY,
    overallScore,
    dialinAdjustmentNotes: dialinNotes,
    isGolden,
  };

  const handleAppendNote = (snippet: string) => {
    setDialinNotes((prev) => (prev ? `${prev}；${snippet}` : snippet));
  };

  const handleSave = () => {
    const updates: Partial<BrewLog> = {
      sensory,
      flavorTags,
      tdsPercent: !isNaN(tdsNum) && tdsNum > 0 ? tdsNum : undefined,
      extractionYieldPercent: calculatedEY,
      overallScore,
      dialinAdjustmentNotes: dialinNotes,
      isGolden,
      isTastingPending: false, // Mark tasting as completed
      extractionAssessment:
        sensory.sweetness >= 7 && sensory.bitterness <= 4
          ? 'balanced_sweet'
          : sensory.bitterness >= 6
          ? 'over_extracted'
          : 'under_extracted',
    };

    updateLog(log.id, updates);

    if (isGolden) {
      try {
        confetti({
          particleCount: 75,
          spread: 65,
          origin: { y: 0.6 },
        });
      } catch {}
    }

    closeTastingModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-100 flex items-center gap-2">
                <span>{language === 'zh-TW' ? '感官杯測與調校' : 'Cupping & Dial-in Editor'}</span>
                {bean && (
                  <span className="text-xs font-normal text-amber-400/90 truncate max-w-[200px] sm:max-w-xs">
                    • {bean.name}
                  </span>
                )}
              </h3>
              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-stone-400 font-mono mt-0.5">
                <span>{log.brewDate.slice(0, 10)}</span>
                <span>• {log.doseGrams}g:{log.waterGrams}g (1:{log.ratio.toFixed(1)})</span>
                <span>• {log.grinder} ({log.grindSetting})</span>
                <span>• {log.waterTempCelsius}°C</span>
                <span>• {formatTime(log.totalTimeSeconds)}</span>
              </div>
            </div>
          </div>

          <button
            onClick={closeTastingModal}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2-Tab Navigation */}
        <div className="grid grid-cols-2 bg-stone-950/50 border-b border-stone-800/80 text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => setActiveTab('sensory')}
            className={`py-3 px-2 text-center font-bold border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === 'sensory'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Coffee className="w-4 h-4" />
            <span>{language === 'zh-TW' ? '1. 感官杯測評分' : '1. Sensory Cupping'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('dialin')}
            className={`py-3 px-2 text-center font-bold border-b-2 transition flex items-center justify-center gap-2 ${
              activeTab === 'dialin'
                ? 'border-amber-500 text-amber-400 bg-amber-500/5'
                : 'border-transparent text-stone-400 hover:text-stone-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            <span>{language === 'zh-TW' ? '2. 萃取診斷與調校' : '2. Diagnosis & Dial-in'}</span>
          </button>
        </div>

        {/* Scrollable Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* TAB 1: SENSORY CUPPING */}
          {activeTab === 'sensory' && (
            <div className="space-y-5">
              {/* 1-Tap Quick Taste Check */}
              <div className="p-4 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-stone-200">
                    {language === 'zh-TW' ? '這杯喝起來如何？ (一鍵快速評估)' : 'How did this cup taste? (Quick Check)'}
                  </label>
                  <span className="text-[11px] text-stone-400">
                    {language === 'zh-TW' ? '自動設定風味基底' : 'Auto-fills sensory baseline'}
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
              </div>

              {/* Overall Cup Score Slider */}
              <div className="p-4 rounded-2xl bg-amber-500/10 border border-amber-500/30 space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-bold text-amber-300">
                    {t.sensory.overallScore} (Overall Score)
                  </label>
                  <div className="text-xl font-black font-mono text-amber-400 flex items-center gap-1">
                    <span>{overallScore.toFixed(1)}</span>
                    <span className="text-xs text-stone-400">/ 10 ★</span>
                  </div>
                </div>

                <input
                  type="range"
                  min="1"
                  max="10"
                  step="0.5"
                  value={overallScore}
                  onChange={(e) => setOverallScore(parseFloat(e.target.value))}
                  className="w-full accent-amber-500 cursor-pointer h-2 bg-stone-800 rounded-lg"
                />

                <div className="flex justify-between text-[10px] text-stone-400 font-mono">
                  <span>1.0 平淡 / 瑕疵</span>
                  <span>8.0 優質好喝</span>
                  <span>10.0 卓越神杯</span>
                </div>
              </div>

              {/* Flavor Wheel Tags */}
              <div className="space-y-2">
                <FlavorTagSelector selectedTags={flavorTags} onChange={setFlavorTags} />
              </div>

              {/* Progressive Disclosure: Pro 7-Axis Sliders, Radar & Refractometer TDS */}
              <div className="rounded-2xl border border-stone-800 bg-stone-950/40 overflow-hidden">
                <button
                  type="button"
                  onClick={() => setShowProSensory((prev) => !prev)}
                  className="w-full px-4 py-3 flex items-center justify-between text-xs font-semibold text-stone-300 hover:bg-stone-900/60 transition"
                >
                  <div className="flex items-center gap-2">
                    <Sliders className="w-3.5 h-3.5 text-amber-500" />
                    <span>
                      {language === 'zh-TW'
                        ? '進階專業杯測：7 軸細項滑桿、風味雷達圖與折射儀 TDS'
                        : 'Advanced SCA Cupping: 7-Axis Sliders, Radar & Refractometer TDS'}
                    </span>
                  </div>
                  {showProSensory ? (
                    <ChevronUp className="w-4 h-4 text-stone-400" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-stone-400" />
                  )}
                </button>

                {showProSensory && (
                  <div className="p-4 border-t border-stone-800 space-y-5 bg-stone-950/60">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 items-center bg-stone-900/50 p-4 rounded-2xl border border-stone-800">
                      <div className="flex flex-col items-center justify-center">
                        <FlavorRadarChart sensory={sensory} size="md" />
                      </div>

                      {/* Refractometer TDS & EY */}
                      <div className="p-3.5 rounded-2xl bg-stone-950 border border-stone-800 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-semibold text-stone-300">
                            折射儀 TDS & 萃取率 (EY %)
                          </span>
                          {calculatedEY && (
                            <span className="text-xs font-mono font-bold text-cyan-300 px-2 py-0.5 rounded-md bg-cyan-500/10 border border-cyan-500/20">
                              EY: {calculatedEY}%
                            </span>
                          )}
                        </div>

                        <div className="flex items-center gap-2">
                          <div className="flex-1 relative">
                            <input
                              type="number"
                              step="0.01"
                              placeholder="e.g. 1.35"
                              value={tdsInput}
                              onChange={(e) => setTdsInput(e.target.value)}
                              className="w-full bg-stone-900 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs text-stone-500 font-mono">
                              % TDS
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* 7 Sensory Sliders */}
                    <div className="space-y-3">
                      <h4 className="text-xs font-bold text-amber-400 uppercase tracking-wider">
                        {t.sensory.radarTitle} (Sensory Dimensions)
                      </h4>

                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {([
                          { key: 'acidity', label: t.sensory.acidity, accent: 'accent-amber-500' },
                          { key: 'sweetness', label: t.sensory.sweetness, accent: 'accent-amber-500' },
                          { key: 'body', label: t.sensory.body, accent: 'accent-amber-500' },
                          { key: 'clarity', label: t.sensory.clarity, accent: 'accent-amber-500' },
                          { key: 'balance', label: t.sensory.balance, accent: 'accent-amber-500' },
                          { key: 'aftertaste', label: t.sensory.aftertaste, accent: 'accent-amber-500' },
                          { key: 'bitterness', label: t.sensory.bitterness, accent: 'accent-rose-500', fullWidth: true },
                        ] as const).map((item) => (
                          <div
                            key={item.key}
                            className={`p-3 bg-stone-900/70 rounded-xl border border-stone-800 space-y-1.5 ${
                              'fullWidth' in item && item.fullWidth ? 'sm:col-span-2' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center text-xs">
                              <span className="font-semibold text-stone-200">{item.label}</span>
                              <span className="font-mono font-bold text-amber-400">
                                {sensory[item.key].toFixed(1)}
                              </span>
                            </div>
                            <input
                              type="range"
                              min="1"
                              max="10"
                              step="0.5"
                              value={sensory[item.key]}
                              onChange={(e) =>
                                setSensory({ ...sensory, [item.key]: parseFloat(e.target.value) })
                              }
                              className={`w-full ${item.accent} h-1.5 bg-stone-800 rounded cursor-pointer`}
                            />
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: DIAGNOSIS & DIAL-IN */}
          {activeTab === 'dialin' && (
            <div className="space-y-5">
              {/* Automated Extraction Diagnosis Card */}
              <DialinAdvisorCard log={currentDraftLog} />

              {/* Quick Strategy Snippet Chips */}
              <div className="space-y-2">
                <label className="block text-xs font-semibold text-stone-300">
                  {language === 'zh-TW' ? '一鍵加入調校微調建議：' : 'Quick Adjustment Actions:'}
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {[
                    language === 'zh-TW' ? '研磨調細 1 格' : 'Grind 1 click finer',
                    language === 'zh-TW' ? '研磨調粗 1 格' : 'Grind 1 click coarser',
                    language === 'zh-TW' ? '水溫提高 2°C' : 'Water temp +2°C',
                    language === 'zh-TW' ? '水溫降低 2°C' : 'Water temp -2°C',
                    language === 'zh-TW' ? '增加前段繞圈擾流' : 'Increase bloom agitation',
                    language === 'zh-TW' ? '延長悶蒸時間 10s' : 'Extend bloom +10s',
                    language === 'zh-TW' ? '縮短注水總時長' : 'Shorten total brew time',
                    language === 'zh-TW' ? '提高粉水濃度 (1:14)' : 'Higher ratio (1:14)',
                  ].map((chip, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => handleAppendNote(chip)}
                      className="px-2.5 py-1 rounded-xl bg-stone-950 hover:bg-stone-800 border border-stone-800 hover:border-amber-500/40 text-stone-300 text-xs transition active:scale-95"
                    >
                      + {chip}
                    </button>
                  ))}
                </div>
              </div>

              {/* Dial-in Adjustment Notes */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-stone-300">
                  {t.sensory.dialinPlanNotes}
                </label>
                <textarea
                  rows={4}
                  value={dialinNotes}
                  onChange={(e) => setDialinNotes(e.target.value)}
                  placeholder={
                    language === 'zh-TW'
                      ? '記錄品飲體驗、口感層次、微調原因與下把沖煮計畫...'
                      : 'Record sensory reflections and planned adjustments for next cup...'
                  }
                  className="w-full bg-stone-950 text-stone-100 text-xs sm:text-sm p-3.5 rounded-2xl border border-stone-800 focus:border-amber-500 focus:outline-none leading-relaxed"
                />
              </div>

              {/* Golden Recipe Mark */}
              <div
                onClick={() => setIsGolden(!isGolden)}
                className={`p-4 rounded-2xl border cursor-pointer transition flex items-center justify-between ${
                  isGolden
                    ? 'bg-amber-500/10 border-amber-500/40 shadow-sm'
                    : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <div
                    className={`p-2 rounded-xl border ${
                      isGolden
                        ? 'bg-amber-500 text-black border-amber-400'
                        : 'bg-stone-900 text-stone-400 border-stone-800'
                    }`}
                  >
                    <Award className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="font-bold text-sm text-stone-100">{t.sensory.markAsGolden}</div>
                    <div className="text-xs text-stone-400">{t.sensory.markAsGoldenDesc}</div>
                  </div>
                </div>

                <div
                  className={`w-6 h-6 rounded-lg flex items-center justify-center border transition ${
                    isGolden
                      ? 'bg-amber-500 border-amber-500 text-stone-950'
                      : 'border-stone-700 text-transparent'
                  }`}
                >
                  <Check className="w-4 h-4 font-bold" />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="p-4 sm:p-5 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <button
            type="button"
            onClick={closeTastingModal}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-semibold transition"
          >
            {language === 'zh-TW' ? '取消' : 'Cancel'}
          </button>

          <div className="flex items-center space-x-2">
            {activeTab === 'sensory' ? (
              <button
                type="button"
                onClick={() => setActiveTab('dialin')}
                className="px-4 py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 text-xs font-bold transition flex items-center space-x-1.5"
              >
                <span>{language === 'zh-TW' ? '前往萃取調校' : 'Go to Dial-in'}</span>
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : null}

            <button
              type="button"
              onClick={handleSave}
              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold transition shadow-lg shadow-amber-900/30 flex items-center space-x-2 active:scale-95"
            >
              <Check className="w-4 h-4" />
              <span>{language === 'zh-TW' ? '保存杯測與調校' : 'Save Tasting & Dial-in'}</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
