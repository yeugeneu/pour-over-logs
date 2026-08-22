import React, { useState } from 'react';
import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  BarChart,
  Bar,
} from 'recharts';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { formatTime } from '../../utils/coffeeMath';
import { FlavorRadarChart } from '../sensory/FlavorRadarChart';
import { Calendar, Coffee, Sparkles, TrendingUp, Sliders } from 'lucide-react';

export const TrendsDashboard: React.FC = () => {
  const { beans, getLogsByBeanId, openBrewModal } = useCoffee();
  const { language, t } = useI18n();

  const [selectedBeanId, setSelectedBeanId] = useState<string>(
    beans[0]?.id || ''
  );

  const [compLogId1, setCompLogId1] = useState<string>('');
  const [compLogId2, setCompLogId2] = useState<string>('');

  const beanLogs = selectedBeanId ? getLogsByBeanId(selectedBeanId) : [];

  // Sort chronologically for trend chart (oldest to newest)
  const chronologicalLogs = [...beanLogs].sort(
    (a, b) => new Date(a.brewDate).getTime() - new Date(b.brewDate).getTime()
  );

  // Prepare Days-off-roast trend data
  const trendData = chronologicalLogs.map((l, idx) => ({
    attempt: `#${idx + 1}`,
    daysOffRoast: `D+${l.daysOffRoast}`,
    score: l.overallScore,
    acidity: l.sensory.acidity,
    sweetness: l.sensory.sweetness,
    body: l.sensory.body,
    clarity: l.sensory.clarity,
    ey: l.extractionYieldPercent || 0,
    grind: l.grindSetting,
    time: l.totalTimeSeconds,
    isGolden: l.isGolden,
  }));

  // Prepare Grind vs Score data
  const grindScoreData = chronologicalLogs.map((l, idx) => ({
    name: `#${idx + 1} (${l.grindSetting})`,
    grind: l.grindSetting,
    score: l.overallScore,
    totalTime: l.totalTimeSeconds,
    dose: l.doseGrams,
  }));

  const log1 = beanLogs.find((l) => l.id === compLogId1) || beanLogs[0];
  const log2 = beanLogs.find((l) => l.id === compLogId2) || beanLogs[1] || beanLogs[0];

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-6 rounded-3xl border border-stone-800 shadow-sm space-y-2">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <TrendingUp className="w-4 h-4" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
            {t.trends.title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
          {t.trends.subtitle}
        </p>

        {/* Bean Selector Dropdown */}
        <div className="pt-3 max-w-md">
          <label className="block text-xs font-semibold text-stone-300 mb-1.5">
            {t.trends.selectBeanForTrends}
          </label>
          <select
            value={selectedBeanId}
            onChange={(e) => {
              setSelectedBeanId(e.target.value);
              setCompLogId1('');
              setCompLogId2('');
            }}
            className="w-full bg-stone-900 text-stone-100 text-xs sm:text-sm px-3.5 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
          >
            {beans.map((b) => (
              <option key={b.id} value={b.id}>
                {b.name} ({b.roaster} • {getLogsByBeanId(b.id).length} 次沖煮)
              </option>
            ))}
          </select>
        </div>
      </div>

      {beanLogs.length === 0 ? (
        <div className="p-12 text-center bg-stone-900/40 rounded-3xl border border-dashed border-stone-800 space-y-3">
          <Coffee className="w-8 h-8 text-amber-500/50 mx-auto" />
          <p className="text-xs sm:text-sm text-stone-400 max-w-md mx-auto">
            {t.trends.noLogsForTrends}
          </p>
          <button
            onClick={() => openBrewModal(selectedBeanId)}
            className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
          >
            {t.app.newBrew}
          </button>
        </div>
      ) : (
        <div className="space-y-6">
          {/* CHART 1: Days off roast vs Cup Score & Sensory Attributes */}
          <div className="p-5 sm:p-6 bg-stone-900/90 rounded-3xl border border-stone-800 space-y-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-100 flex items-center gap-2">
                <Calendar className="w-4 h-4 text-amber-400" />
                <span>{t.trends.roastDaysCurve}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {t.trends.roastDaysDesc}
              </p>
            </div>

            <div className="h-72 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={trendData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#372c27" />
                  <XAxis
                    dataKey="daysOffRoast"
                    stroke="#a89a90"
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    domain={[0, 10]}
                    stroke="#a89a90"
                    tick={{ fontSize: 11 }}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44352e',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Line
                    type="monotone"
                    dataKey="score"
                    name={language === 'zh-TW' ? '綜合評分 Overall Score' : 'Overall Score'}
                    stroke="#f59e0b"
                    strokeWidth={3}
                    dot={{ r: 5, fill: '#f59e0b' }}
                    activeDot={{ r: 8 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="sweetness"
                    name={language === 'zh-TW' ? '甜感 Sweetness' : 'Sweetness'}
                    stroke="#fbbf24"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="acidity"
                    name={language === 'zh-TW' ? '酸質 Acidity' : 'Acidity'}
                    stroke="#38bdf8"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                  <Line
                    type="monotone"
                    dataKey="clarity"
                    name={language === 'zh-TW' ? '乾淨度 Clarity' : 'Clarity'}
                    stroke="#34d399"
                    strokeWidth={1.5}
                    strokeDasharray="4 4"
                    dot={{ r: 3 }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* CHART 2: Grind Setting vs Overall Score */}
          <div className="p-5 sm:p-6 bg-stone-900/90 rounded-3xl border border-stone-800 space-y-4">
            <div>
              <h3 className="font-bold text-sm sm:text-base text-stone-100 flex items-center gap-2">
                <Sliders className="w-4 h-4 text-amber-400" />
                <span>{t.trends.grindDialinPlot}</span>
              </h3>
              <p className="text-xs text-stone-400 mt-0.5">
                {t.trends.grindDialinDesc}
              </p>
            </div>

            <div className="h-64 w-full pt-2">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={grindScoreData} margin={{ top: 10, right: 20, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#372c27" />
                  <XAxis dataKey="name" stroke="#a89a90" tick={{ fontSize: 11 }} />
                  <YAxis domain={[0, 10]} stroke="#a89a90" tick={{ fontSize: 11 }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: '#1c1917',
                      borderColor: '#44352e',
                      borderRadius: '0.75rem',
                      fontSize: '12px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />
                  <Bar
                    dataKey="score"
                    name={language === 'zh-TW' ? '杯測總分 (Cup Score)' : 'Cup Score'}
                    fill="#d97706"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* SIDE-BY-SIDE BREW COMPARISON SECTION */}
          {beanLogs.length >= 2 && (
            <div className="p-5 sm:p-6 bg-stone-900/90 rounded-3xl border border-stone-800 space-y-5">
              <div>
                <h3 className="font-bold text-sm sm:text-base text-stone-100 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t.trends.comparison}</span>
                </h3>
                <p className="text-xs text-stone-400 mt-0.5">
                  {language === 'zh-TW'
                    ? '選取任意兩次沖煮紀錄，直接比對研磨度、水溫與風味雷達圖差異'
                    : 'Compare two brew attempts side-by-side to analyze parameter impact'}
                </p>
              </div>

              {/* Comparison Selectors */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-amber-400 mb-1">
                    沖煮 A (左側 / 基準)
                  </label>
                  <select
                    value={compLogId1 || beanLogs[0]?.id}
                    onChange={(e) => setCompLogId1(e.target.value)}
                    className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  >
                    {beanLogs.map((l, idx) => (
                      <option key={l.id} value={l.id}>
                        #{beanLogs.length - idx} • 養豆 {l.daysOffRoast} 天 ({l.grinder} {l.grindSetting} • {l.overallScore}★)
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-blue-400 mb-1">
                    沖煮 B (右側 / 對比)
                  </label>
                  <select
                    value={compLogId2 || beanLogs[1]?.id || beanLogs[0]?.id}
                    onChange={(e) => setCompLogId2(e.target.value)}
                    className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-blue-500 focus:outline-none"
                  >
                    {beanLogs.map((l, idx) => (
                      <option key={l.id} value={l.id}>
                        #{beanLogs.length - idx} • 養豆 {l.daysOffRoast} 天 ({l.grinder} {l.grindSetting} • {l.overallScore}★)
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* Dual Radar & Parameter Diff Table */}
              {log1 && log2 && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center pt-2">
                  <div className="bg-stone-950/60 p-4 rounded-2xl border border-stone-800">
                    <FlavorRadarChart sensory={log1.sensory} comparisonSensory={log2.sensory} size="md" />
                  </div>

                  <div className="space-y-2 text-xs">
                    <div className="grid grid-cols-3 p-2 rounded-xl bg-stone-950/80 font-semibold text-stone-400 border border-stone-800">
                      <span>參數項目</span>
                      <span className="text-amber-400">沖煮 A</span>
                      <span className="text-blue-400">沖煮 B</span>
                    </div>

                    {[
                      { label: '養豆天數', a: `D+${log1.daysOffRoast}`, b: `D+${log2.daysOffRoast}` },
                      { label: '研磨刻度', a: `${log1.grindSetting}`, b: `${log2.grindSetting}` },
                      { label: '粉水比例', a: `${log1.doseGrams}g : ${log1.waterGrams}g`, b: `${log2.doseGrams}g : ${log2.waterGrams}g` },
                      { label: '沖煮水溫', a: `${log1.waterTempCelsius}°C`, b: `${log2.waterTempCelsius}°C` },
                      { label: '總時間', a: formatTime(log1.totalTimeSeconds), b: formatTime(log2.totalTimeSeconds) },
                      { label: '萃取率 (EY%)', a: log1.extractionYieldPercent ? `${log1.extractionYieldPercent}%` : '—', b: log2.extractionYieldPercent ? `${log2.extractionYieldPercent}%` : '—' },
                      { label: '綜合評分', a: `${log1.overallScore.toFixed(1)} ★`, b: `${log2.overallScore.toFixed(1)} ★` },
                    ].map((row, idx) => (
                      <div
                        key={idx}
                        className="grid grid-cols-3 p-2 rounded-xl bg-stone-950/40 border border-stone-800/60 text-stone-200"
                      >
                        <span className="text-stone-400">{row.label}</span>
                        <span className="font-mono font-medium text-amber-300">{row.a}</span>
                        <span className="font-mono font-medium text-blue-300">{row.b}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
