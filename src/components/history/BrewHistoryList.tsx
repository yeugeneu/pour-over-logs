import React, { useState } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { formatTime } from '../../utils/coffeeMath';
import { FlavorRadarChart } from '../sensory/FlavorRadarChart';
import { Search, Award, Coffee, Trash2, ChevronDown, ChevronUp, Edit3, Plus } from 'lucide-react';

export const BrewHistoryList: React.FC = () => {
  const { beans, logs, getBeanById, openBrewModal, openTastingModal, deleteLog, toggleGoldenRecipe } = useCoffee();
  const { language, t } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedBeanFilter, setSelectedBeanFilter] = useState('all');
  const [goldenOnly, setGoldenOnly] = useState(false);
  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  const filteredLogs = logs.filter((log) => {
    const bean = getBeanById(log.beanId);
    const matchesBean = selectedBeanFilter === 'all' || log.beanId === selectedBeanFilter;
    const matchesGolden = !goldenOnly || log.isGolden;

    const matchesSearch =
      (bean && bean.name.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bean && bean.roaster.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.grinder && log.grinder.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.dripper && log.dripper.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (log.flavorTags && log.flavorTags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()))) ||
      (log.dialinAdjustmentNotes && log.dialinAdjustmentNotes.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesBean && matchesGolden && matchesSearch;
  });

  const toggleExpand = (id: string) => {
    setExpandedLogId(expandedLogId === id ? null : id);
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-6 rounded-3xl border border-stone-800 shadow-sm">
        <div className="space-y-1">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Coffee className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
              {t.app.history} ({logs.length})
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl">
            {language === 'zh-TW'
              ? '回顧歷次沖煮的完整參數、感官評分與調校筆記，隨時一鍵複製神參數再次沖煮'
              : 'Review your complete brewing trajectory, tasting scores, and dial-in adjustments'}
          </p>
        </div>

        <button
          onClick={() => openBrewModal()}
          className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-900/30"
        >
          <Coffee className="w-4 h-4" />
          <span>{t.app.newBrew}</span>
        </button>
      </div>

      {/* Search & Filter Controls */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={
              language === 'zh-TW'
                ? '搜尋沖煮紀錄 (咖啡豆、磨豆機、風味、調校筆記...)'
                : 'Search logs by bean, grinder, notes...'
            }
            className="w-full bg-stone-900 text-stone-100 placeholder-stone-500 text-xs sm:text-sm pl-10 pr-4 py-2.5 rounded-2xl border border-stone-800 focus:border-amber-500 focus:outline-none"
          />
        </div>

        <select
          value={selectedBeanFilter}
          onChange={(e) => setSelectedBeanFilter(e.target.value)}
          className="bg-stone-900 text-stone-300 text-xs px-3 py-2.5 rounded-2xl border border-stone-800 focus:border-amber-500 focus:outline-none"
        >
          <option value="all">{language === 'zh-TW' ? '所有咖啡豆' : 'All Coffee Beans'}</option>
          {beans.map((b) => (
            <option key={b.id} value={b.id}>
              {b.name}
            </option>
          ))}
        </select>

        <button
          onClick={() => setGoldenOnly(!goldenOnly)}
          className={`flex items-center space-x-1.5 px-3.5 py-2 rounded-2xl border text-xs font-semibold transition ${
            goldenOnly
              ? 'bg-amber-500/20 text-amber-300 border-amber-500/50 shadow-sm'
              : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
          }`}
        >
          <Award className="w-3.5 h-3.5 text-amber-400" />
          <span>{language === 'zh-TW' ? '僅看神參數' : 'Golden Only'}</span>
        </button>
      </div>

      {/* Logs List */}
      {filteredLogs.length > 0 ? (
        <div className="space-y-3">
          {filteredLogs.map((log) => {
            const bean = getBeanById(log.beanId);
            const isExpanded = expandedLogId === log.id;

            return (
              <div
                key={log.id}
                className={`p-4 sm:p-5 rounded-3xl border transition ${
                  log.isGolden
                    ? 'bg-stone-900/90 border-amber-500/40 shadow-sm'
                    : 'bg-stone-900/80 border-stone-800 hover:border-stone-700'
                }`}
              >
                {/* Header Row */}
                <div
                  onClick={() => toggleExpand(log.id)}
                  className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 cursor-pointer"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm sm:text-base text-stone-100">
                        {bean ? bean.name : 'Unknown Bean'}
                      </span>
                      {log.isGolden && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-0.5 font-semibold">
                          <Award className="w-3 h-3 text-amber-400" /> 神參數
                        </span>
                      )}
                    </div>

                    <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-stone-400 font-mono">
                      <span>{log.brewDate.slice(0, 10)}</span>
                      <span>• 養豆 {log.daysOffRoast} 天</span>
                      <span>• {log.grinder} ({log.grindSetting})</span>
                      <span>• {log.doseGrams}g:{log.waterGrams}g</span>
                      <span>• {log.waterTempCelsius}°C</span>
                      <span>• {formatTime(log.totalTimeSeconds)}</span>
                    </div>
                  </div>

                  <div className="flex items-center space-x-3 self-end sm:self-center">
                    {/* Quick Edit Tasting Button */}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        openTastingModal(log.id, log.isTastingPending ? 'sensory' : 'sensory');
                      }}
                      className={`px-2.5 py-1.5 rounded-xl text-xs font-semibold border flex items-center gap-1.5 transition shadow-sm ${
                        log.isTastingPending
                          ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold hover:bg-amber-400 animate-pulse'
                          : 'bg-stone-950/80 hover:bg-stone-800 text-amber-300 border-stone-800 hover:border-amber-500/40'
                      }`}
                      title={language === 'zh-TW' ? '編輯感官杯測評分與調校筆記' : 'Edit Tasting & Dial-in'}
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                      <span>
                        {log.isTastingPending
                          ? (language === 'zh-TW' ? '補填杯測評分' : 'Add Tasting')
                          : (language === 'zh-TW' ? '編輯杯測/調校' : 'Edit Tasting')}
                      </span>
                    </button>

                    <div className="text-right">
                      <div className="text-lg font-black font-mono text-amber-400">
                        {log.overallScore.toFixed(1)} <span className="text-xs text-stone-400">★</span>
                      </div>
                      {log.extractionYieldPercent && (
                        <div className="text-[10px] text-stone-400 font-mono">
                          EY: {log.extractionYieldPercent}%
                        </div>
                      )}
                    </div>
                    {isExpanded ? (
                      <ChevronUp className="w-5 h-5 text-stone-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-stone-400" />
                    )}
                  </div>
                </div>

                {/* Flavor tags preview */}
                {log.flavorTags && log.flavorTags.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-2.5">
                    {log.flavorTags.map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] px-2 py-0.5 rounded-md bg-stone-950 text-stone-300 border border-stone-800"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                )}

                {/* Expanded Details */}
                {isExpanded && (
                  <div className="mt-4 pt-4 border-t border-stone-800/80 space-y-4 animate-fade-in">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-5 items-center">
                      <FlavorRadarChart sensory={log.sensory} size="sm" />

                      <div className="space-y-2 text-xs">
                        {log.dialinAdjustmentNotes ? (
                          <div className="p-3 rounded-2xl bg-stone-950 border border-stone-800 text-stone-300">
                            <div className="flex items-center justify-between">
                              <span className="text-amber-400 font-semibold block text-xs">
                                調校筆記 (Dial-in Notes)：
                              </span>
                              <button
                                type="button"
                                onClick={() => openTastingModal(log.id, 'dialin')}
                                className="text-[11px] text-amber-400/80 hover:text-amber-300 flex items-center gap-0.5"
                              >
                                <Edit3 className="w-3 h-3" />
                                <span>編輯</span>
                              </button>
                            </div>
                            <p className="text-xs leading-relaxed mt-1 text-stone-300">
                              {log.dialinAdjustmentNotes}
                            </p>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => openTastingModal(log.id, 'dialin')}
                            className="w-full p-2.5 rounded-2xl bg-stone-950/60 border border-dashed border-stone-800 hover:border-amber-500/40 text-stone-400 hover:text-amber-300 text-xs text-center transition flex items-center justify-center gap-1"
                          >
                            <Plus className="w-3.5 h-3.5" />
                            <span>新增調校筆記與下把微調計畫</span>
                          </button>
                        )}

                        <div className="grid grid-cols-2 gap-2 text-[11px] text-stone-400 bg-stone-950/60 p-2.5 rounded-xl border border-stone-800">
                          <div>濾杯: <span className="text-stone-200">{log.dripper}</span></div>
                          <div>濾紙: <span className="text-stone-200">{log.filterPaper || '—'}</span></div>
                          <div>水質: <span className="text-stone-200">{log.waterType || 'RO Filtered'}</span></div>
                          <div>TDS: <span className="text-stone-200">{log.tdsPercent ? `${log.tdsPercent}%` : '—'}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions */}
                    <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/60">
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => toggleGoldenRecipe(log.id)}
                          className={`flex items-center space-x-1.5 px-3 py-1.5 rounded-xl border text-xs font-semibold transition ${
                            log.isGolden
                              ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                              : 'bg-stone-950 text-stone-400 border-stone-800 hover:text-stone-200'
                          }`}
                        >
                          <Award className="w-3.5 h-3.5" />
                          <span>{log.isGolden ? '取消神參數' : '標記為神參數'}</span>
                        </button>

                        <button
                          type="button"
                          onClick={() => openTastingModal(log.id, 'sensory')}
                          className="flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-stone-950 hover:bg-stone-800 text-stone-300 text-xs font-semibold border border-stone-800 transition"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-amber-400" />
                          <span>{language === 'zh-TW' ? '編輯杯測與調校' : 'Edit Tasting/Dial-in'}</span>
                        </button>
                      </div>

                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => openBrewModal(log.beanId, log.id)}
                          className="px-3.5 py-1.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-sm flex items-center space-x-1"
                        >
                          <Coffee className="w-3.5 h-3.5" />
                          <span>複製參數開沖</span>
                        </button>

                        <button
                          onClick={() => {
                            if (window.confirm('確定要刪除這筆沖煮日誌嗎？')) {
                              deleteLog(log.id);
                            }
                          }}
                          className="p-1.5 rounded-xl hover:bg-rose-900/40 text-stone-500 hover:text-rose-400 transition"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      ) : (
        <div className="p-12 text-center bg-stone-900/40 rounded-3xl border border-dashed border-stone-800 text-stone-400 space-y-2">
          <Coffee className="w-6 h-6 text-stone-500 mx-auto" />
          <p className="text-xs sm:text-sm">沒有找到符合條件的沖煮紀錄</p>
        </div>
      )}
    </div>
  );
};
