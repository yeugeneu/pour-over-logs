import React, { useState } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { calculateDaysOffRoast, getRestingStageInfo, formatTime } from '../../utils/coffeeMath';
import { FlavorRadarChart } from '../sensory/FlavorRadarChart';
import { X, Award, Coffee, Edit3, Trash2, MapPin, Sparkles, ChevronDown, ChevronUp } from 'lucide-react';

export const BeanDetailModal: React.FC = () => {
  const {
    isBeanDetailModalOpen,
    detailBeanId,
    closeBeanDetailModal,
    openBeanModal,
    openBrewModal,
    deleteBean,
    toggleGoldenRecipe,
    deleteLog,
    openTastingModal,
    getBeanById,
    getLogsByBeanId,
    getGoldenLogForBean,
  } = useCoffee();
  const { language, t } = useI18n();

  const [expandedLogId, setExpandedLogId] = useState<string | null>(null);

  if (!isBeanDetailModalOpen || !detailBeanId) return null;

  const bean = getBeanById(detailBeanId);
  if (!bean) return null;

  const daysOffRoast = calculateDaysOffRoast(bean.roastDate);
  const restInfo = getRestingStageInfo(daysOffRoast, bean.roastLevel);
  const goldenLog = getGoldenLogForBean(bean.id);
  const logs = getLogsByBeanId(bean.id);

  const toggleLogExpand = (logId: string) => {
    setExpandedLogId(expandedLogId === logId ? null : logId);
  };

  const handleDeleteBean = () => {
    if (window.confirm(language === 'zh-TW' ? `確定要刪除「${bean.name}」及其所有沖煮紀錄嗎？` : `Delete "${bean.name}" and all its brew logs?`)) {
      deleteBean(bean.id);
      closeBeanDetailModal();
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-3xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-6 border-b border-stone-800 bg-stone-950/80 flex items-start justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <span className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${restInfo.badgeColor}`}>
                {language === 'zh-TW' ? `養豆 ${daysOffRoast} 天` : `${daysOffRoast}d off roast`} • {language === 'zh-TW' ? restInfo.labelZh : restInfo.labelEn}
              </span>
              <span className="text-xs px-2 py-0.5 rounded-lg bg-stone-800 text-stone-300">
                {bean.roaster}
              </span>
            </div>
            <h2 className="text-lg sm:text-xl font-extrabold text-stone-100">
              {bean.name}
            </h2>
            <div className="flex items-center space-x-3 text-xs text-stone-400">
              <span className="flex items-center gap-1">
                <MapPin className="w-3 h-3 text-stone-500" />
                {bean.origin} {bean.region ? `• ${bean.region}` : ''} {bean.farmOrStation ? `(${bean.farmOrStation})` : ''}
              </span>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => {
                closeBeanDetailModal();
                openBeanModal(bean.id);
              }}
              className="p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 transition"
              title="Edit Bean"
            >
              <Edit3 className="w-4 h-4" />
            </button>
            <button
              onClick={handleDeleteBean}
              className="p-2 rounded-xl bg-stone-800 hover:bg-rose-900/50 text-stone-400 hover:text-rose-300 transition"
              title="Delete Bean"
            >
              <Trash2 className="w-4 h-4" />
            </button>
            <button
              onClick={closeBeanDetailModal}
              className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Modal Scroll Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-6">
          {/* Metadata Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-5 gap-2.5 bg-stone-950/60 p-4 rounded-2xl border border-stone-800 text-xs">
            <div>
              <span className="text-stone-500 block">{t.beans.process}</span>
              <span className="font-semibold text-stone-200">{bean.process}</span>
            </div>
            <div>
              <span className="text-stone-500 block">{t.beans.roastLevel}</span>
              <span className="font-semibold text-stone-200">{bean.roastLevel}</span>
            </div>
            <div>
              <span className="text-stone-500 block">{t.beans.varietal}</span>
              <span className="font-semibold text-stone-200">{bean.varietal || '—'}</span>
            </div>
            <div>
              <span className="text-stone-500 block">{t.beans.remaining}</span>
              <span className="font-semibold text-amber-400 font-mono">
                {bean.remainingWeightGrams}g / {bean.totalWeightGrams}g
              </span>
            </div>
            <div>
              <span className="text-stone-500 block">價格與單杯成本</span>
              <span className="font-semibold text-stone-200 font-mono">
                {bean.price !== undefined && bean.price > 0 && bean.totalWeightGrams > 0
                  ? `${bean.currency || 'NT$'} ${bean.price} (≈ $${((bean.price / bean.totalWeightGrams) * 15).toFixed(1)}/杯)`
                  : '未記錄'}
              </span>
            </div>
          </div>

          {/* Official Tasting Notes */}
          {bean.tastingNotesPackage && bean.tastingNotesPackage.length > 0 && (
            <div>
              <div className="text-xs font-semibold text-stone-400 mb-1.5">{t.beans.tastingNotes}：</div>
              <div className="flex flex-wrap gap-1.5">
                {bean.tastingNotesPackage.map((note, idx) => (
                  <span
                    key={idx}
                    className="px-2.5 py-1 rounded-lg bg-amber-500/10 text-amber-300 border border-amber-500/30 text-xs font-medium"
                  >
                    {note}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Golden Recipe Card (If present) */}
          {goldenLog ? (
            <div className="p-5 rounded-2xl bg-gradient-to-br from-amber-950/40 via-stone-900 to-stone-950 border border-amber-500/40 space-y-3 relative overflow-hidden shadow-lg">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-2">
                  <Award className="w-5 h-5 text-amber-400 fill-amber-400/20" />
                  <span className="font-bold text-sm text-amber-300">{t.beans.goldenRecipe}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <span className="text-xs text-stone-400">
                    {goldenLog.brewDate.slice(0, 10)} (養豆 {goldenLog.daysOffRoast} 天)
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-500 text-black font-bold font-mono text-xs">
                    {goldenLog.overallScore} ★
                  </span>
                </div>
              </div>

              {/* Parameters Breakdown */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-stone-950/60 p-3 rounded-xl border border-stone-800 text-xs">
                <div>
                  <span className="text-stone-500 block">濾杯 / 濾紙</span>
                  <span className="text-stone-200 font-medium truncate block">{goldenLog.dripper}</span>
                </div>
                <div>
                  <span className="text-stone-500 block">磨豆機 / 刻度</span>
                  <span className="text-stone-200 font-mono font-medium truncate block">{goldenLog.grinder} ({goldenLog.grindSetting})</span>
                </div>
                <div>
                  <span className="text-stone-500 block">粉水比 / 水溫</span>
                  <span className="text-stone-200 font-mono font-medium block">
                    {goldenLog.doseGrams}g : {goldenLog.waterGrams}g ({goldenLog.waterTempCelsius}°C)
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 block">時間 / 萃取率</span>
                  <span className="text-amber-400 font-mono font-medium block">
                    {formatTime(goldenLog.totalTimeSeconds)} {goldenLog.extractionYieldPercent ? `(${goldenLog.extractionYieldPercent}%)` : ''}
                  </span>
                </div>
              </div>

              {goldenLog.dialinAdjustmentNotes && (
                <p className="text-xs text-stone-300 bg-stone-900/60 p-2.5 rounded-xl border border-stone-800/80 leading-relaxed italic">
                  💬 「{goldenLog.dialinAdjustmentNotes}」
                </p>
              )}

              <div className="flex justify-end pt-1">
                <button
                  onClick={() => {
                    closeBeanDetailModal();
                    openBrewModal(bean.id, goldenLog.id);
                  }}
                  className="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition flex items-center space-x-1.5"
                >
                  <Coffee className="w-4 h-4" />
                  <span>{language === 'zh-TW' ? '一鍵帶入神參數沖煮' : 'Brew with this Golden Recipe'}</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-2xl bg-stone-950/40 border border-dashed border-stone-800 text-center text-xs text-stone-400 space-y-2">
              <Sparkles className="w-5 h-5 text-amber-500/60 mx-auto" />
              <p>{t.beans.noGoldenRecipe}</p>
            </div>
          )}

          {/* Brew Logs History for this bean */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm text-stone-200 flex items-center gap-1.5">
                <Coffee className="w-4 h-4 text-amber-500" />
                <span>{t.beans.brewHistory} ({logs.length})</span>
              </h3>

              <button
                onClick={() => {
                  closeBeanDetailModal();
                  openBrewModal(bean.id);
                }}
                className="text-xs text-amber-400 hover:text-amber-300 flex items-center gap-1"
              >
                <span>+ {t.app.newBrew}</span>
              </button>
            </div>

            {logs.length === 0 ? (
              <p className="text-xs text-stone-500 text-center py-4">
                {language === 'zh-TW' ? '此咖啡豆尚無沖煮紀錄' : 'No brew logs recorded for this bean yet.'}
              </p>
            ) : (
              <div className="space-y-2.5">
                {logs.map((log, idx) => {
                  const isExpanded = expandedLogId === log.id;

                  return (
                    <div
                      key={log.id}
                      className={`p-3.5 rounded-2xl border transition ${
                        log.isGolden
                          ? 'bg-amber-950/20 border-amber-500/40'
                          : 'bg-stone-950/60 border-stone-800 hover:border-stone-700'
                      }`}
                    >
                      {/* Log Summary Header */}
                      <div
                        onClick={() => toggleLogExpand(log.id)}
                        className="flex items-center justify-between cursor-pointer"
                      >
                        <div className="flex items-center space-x-3">
                          <span className="w-6 h-6 rounded-full bg-stone-800 flex items-center justify-center text-xs font-mono font-bold text-stone-300">
                            #{logs.length - idx}
                          </span>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-semibold text-xs text-stone-200">
                                養豆第 {log.daysOffRoast} 天
                              </span>
                              <span className="text-[11px] text-stone-400 font-mono">
                                • {log.brewDate.slice(0, 10)}
                              </span>
                              {log.isGolden && (
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-0.5">
                                  <Award className="w-3 h-3" /> 神參數
                                </span>
                              )}
                            </div>
                            <div className="text-[11px] text-stone-400 font-mono mt-0.5">
                              {log.grinder} ({log.grindSetting}) • {log.doseGrams}g:{log.waterGrams}g • {formatTime(log.totalTimeSeconds)}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center space-x-2.5">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              openTastingModal(log.id, 'sensory');
                            }}
                            className={`px-2 py-1 rounded-lg text-xs font-semibold border flex items-center gap-1 transition ${
                              log.isTastingPending
                                ? 'bg-amber-500 text-stone-950 border-amber-400 font-bold'
                                : 'bg-stone-900 hover:bg-stone-800 text-amber-300 border-stone-800'
                            }`}
                            title="編輯感官杯測評分與調校筆記"
                          >
                            <Edit3 className="w-3 h-3" />
                            <span>{log.isTastingPending ? '補填杯測' : '評分/調校'}</span>
                          </button>

                          <span className="text-sm font-bold font-mono text-amber-400">
                            {log.overallScore.toFixed(1)} ★
                          </span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4 text-stone-400" />
                          ) : (
                            <ChevronDown className="w-4 h-4 text-stone-400" />
                          )}
                        </div>
                      </div>

                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-3 pt-3 border-t border-stone-800/80 space-y-3 animate-fade-in">
                          {/* Flavor Tags */}
                          {log.flavorTags && log.flavorTags.length > 0 && (
                            <div className="flex flex-wrap gap-1">
                              {log.flavorTags.map((tag) => (
                                <span
                                  key={tag}
                                  className="text-[10px] px-2 py-0.5 rounded bg-stone-900 text-stone-300 border border-stone-800"
                                >
                                  {tag}
                                </span>
                              ))}
                            </div>
                          )}

                          {/* Radar & Sensory */}
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                            <FlavorRadarChart sensory={log.sensory} size="sm" />

                            <div className="space-y-1 text-xs">
                              {log.dialinAdjustmentNotes && (
                                <div className="p-2 rounded-xl bg-stone-900 border border-stone-800 text-stone-300">
                                  <div className="flex items-center justify-between">
                                    <span className="text-amber-400 font-semibold block text-[11px]">調校筆記：</span>
                                    <button
                                      type="button"
                                      onClick={() => openTastingModal(log.id, 'dialin')}
                                      className="text-[10px] text-amber-400/80 hover:text-amber-300 flex items-center gap-0.5"
                                    >
                                      <Edit3 className="w-3 h-3" />
                                      <span>編輯</span>
                                    </button>
                                  </div>
                                  <p className="text-[11px] leading-relaxed mt-0.5">{log.dialinAdjustmentNotes}</p>
                                </div>
                              )}

                              <div className="flex items-center justify-between text-stone-400 text-[11px] pt-1">
                                <span>水溫: {log.waterTempCelsius}°C</span>
                                <span>萃取率: {log.extractionYieldPercent ? `${log.extractionYieldPercent}%` : '未量測'}</span>
                              </div>
                            </div>
                          </div>

                          {/* Log Actions */}
                          <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-stone-800/60 text-xs">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => toggleGoldenRecipe(log.id)}
                                className={`flex items-center space-x-1 px-2.5 py-1 rounded-lg border transition ${
                                  log.isGolden
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/40'
                                    : 'bg-stone-900 text-stone-400 border-stone-800 hover:text-stone-200'
                                }`}
                              >
                                <Award className="w-3.5 h-3.5" />
                                <span>{log.isGolden ? '取消神參數' : '設為神參數'}</span>
                              </button>

                              <button
                                type="button"
                                onClick={() => openTastingModal(log.id, 'sensory')}
                                className="flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-stone-900 hover:bg-stone-800 text-stone-300 border border-stone-800 transition"
                              >
                                <Edit3 className="w-3 h-3 text-amber-400" />
                                <span>編輯杯測/調校</span>
                              </button>
                            </div>

                            <div className="flex space-x-2">
                              <button
                                onClick={() => {
                                  closeBeanDetailModal();
                                  openBrewModal(bean.id, log.id);
                                }}
                                className="px-3 py-1 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 font-medium"
                              >
                                複製此參數沖煮
                              </button>
                              <button
                                onClick={() => deleteLog(log.id)}
                                className="p-1 rounded-lg hover:bg-rose-900/40 text-stone-500 hover:text-rose-400"
                                title="Delete Log"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
