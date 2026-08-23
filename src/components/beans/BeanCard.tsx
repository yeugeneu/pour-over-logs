import React from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { CoffeeBean } from '../../types/coffee';
import { calculateDaysOffRoast, getRestingStageInfo } from '../../utils/coffeeMath';
import { Award, Calendar, Coffee, MapPin, Scale, Edit3 } from 'lucide-react';

interface BeanCardProps {
  bean: CoffeeBean;
}

export const BeanCard: React.FC<BeanCardProps> = ({ bean }) => {
  const { openBrewModal, openBeanDetailModal, openBeanModal, getGoldenLogForBean, getLogsByBeanId } = useCoffee();
  const { language, t } = useI18n();

  const daysOffRoast = calculateDaysOffRoast(bean.roastDate);
  const restInfo = getRestingStageInfo(daysOffRoast, bean.roastLevel);
  const goldenLog = getGoldenLogForBean(bean.id);
  const logs = getLogsByBeanId(bean.id);

  const remainingPercent = bean.totalWeightGrams > 0
    ? Math.max(0, Math.min(100, Math.round((bean.remainingWeightGrams / bean.totalWeightGrams) * 100)))
    : 0;

  const estimatedCups = Math.floor(bean.remainingWeightGrams / 15);

  const getRoastBadgeColor = (level: string) => {
    switch (level) {
      case 'Light':
        return 'bg-amber-500/10 text-amber-300 border-amber-500/30';
      case 'Light-Medium':
        return 'bg-orange-500/10 text-orange-300 border-orange-500/30';
      case 'Medium':
        return 'bg-yellow-700/20 text-yellow-300 border-yellow-700/40';
      case 'Medium-Dark':
      case 'Dark':
        return 'bg-stone-700/30 text-stone-300 border-stone-600/40';
      default:
        return 'bg-stone-800 text-stone-300';
    }
  };

  return (
    <div className="bg-stone-900/90 hover:bg-stone-900 border border-stone-800 hover:border-amber-500/40 rounded-3xl p-5 transition-all duration-200 flex flex-col justify-between space-y-4 shadow-sm hover:shadow-xl hover:shadow-black/40 group relative overflow-hidden">
      {/* Subtle Top Accent Glow for Golden Beans */}
      {goldenLog && (
        <div className="absolute top-0 right-0 left-0 h-1 bg-gradient-to-r from-amber-500 via-amber-300 to-amber-600" />
      )}

      {/* Top Header Row */}
      <div className="space-y-2">
        <div className="flex items-start justify-between gap-2">
          {/* Days off roast badge */}
          <div
            className={`inline-flex items-center space-x-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border ${restInfo.badgeColor}`}
            title={language === 'zh-TW' ? restInfo.descriptionZh : restInfo.descriptionEn}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>
              {language === 'zh-TW' ? `養豆 ${daysOffRoast} 天` : `${daysOffRoast}d off roast`}
            </span>
            <span className="text-[10px] opacity-80">
              • {language === 'zh-TW' ? restInfo.labelZh : restInfo.labelEn}
            </span>
          </div>

          {/* Quick Edit */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              openBeanModal(bean.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-400 hover:text-stone-200 transition"
            title="Edit Bean"
          >
            <Edit3 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Bean Name & Origin */}
        <div onClick={() => openBeanDetailModal(bean.id)} className="cursor-pointer">
          <h3 className="font-bold text-base text-stone-100 group-hover:text-amber-300 transition line-clamp-1">
            {bean.name}
          </h3>
          <div className="flex items-center space-x-2 text-xs text-stone-400 mt-1">
            <span className="flex items-center gap-1">
              <MapPin className="w-3 h-3 text-stone-500" />
              {bean.origin} {bean.region ? `• ${bean.region}` : ''}
            </span>
          </div>
        </div>
      </div>

      {/* Attributes Chips */}
      <div className="flex flex-wrap gap-1.5 text-xs">
        <span className="px-2 py-0.5 rounded-lg bg-stone-950 text-stone-300 border border-stone-800 font-medium">
          {bean.roaster}
        </span>
        <span className={`px-2 py-0.5 rounded-lg border font-medium ${getRoastBadgeColor(bean.roastLevel)}`}>
          {bean.roastLevel}
        </span>
        <span className="px-2 py-0.5 rounded-lg bg-cyan-500/10 text-cyan-300 border border-cyan-500/20 font-medium">
          {bean.process}
        </span>
        {bean.varietal && (
          <span className="px-2 py-0.5 rounded-lg bg-purple-500/10 text-purple-300 border border-purple-500/20">
            {bean.varietal}
          </span>
        )}
      </div>

      {/* Official Flavor Notes */}
      {bean.tastingNotesPackage && bean.tastingNotesPackage.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {bean.tastingNotesPackage.slice(0, 4).map((tag, idx) => (
            <span
              key={idx}
              className="text-[11px] px-2 py-0.5 rounded-md bg-stone-950/80 text-stone-400 border border-stone-800/80"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Remaining Inventory Bar & Price */}
      <div className="space-y-1.5 bg-stone-950/40 p-2.5 rounded-2xl border border-stone-800/60">
        <div className="flex justify-between items-center text-xs">
          <span className="text-stone-400 flex items-center gap-1">
            <Scale className="w-3 h-3 text-stone-500" />
            <span>{t.beans.remaining}</span>
          </span>
          <span className="font-mono text-stone-200 font-bold">
            {bean.remainingWeightGrams}g <span className="text-stone-500 font-normal">/ {bean.totalWeightGrams}g</span>
            <span className="text-amber-400/90 text-[11px] ml-1.5">
              (≈ {estimatedCups} {language === 'zh-TW' ? '杯' : 'cups'})
            </span>
          </span>
        </div>
        <div className="w-full bg-stone-800 rounded-full h-1.5 overflow-hidden">
          <div
            className={`h-full rounded-full transition-all duration-300 ${
              remainingPercent > 25 ? 'bg-amber-500' : 'bg-rose-500'
            }`}
            style={{ width: `${remainingPercent}%` }}
          />
        </div>

        {bean.price !== undefined && bean.price > 0 && bean.totalWeightGrams > 0 && (
          <div className="flex justify-between items-center text-[10px] text-stone-400 pt-0.5 font-mono">
            <span>價格: {bean.currency || 'NT$'} {bean.price}</span>
            <span className="text-amber-400/90 font-medium">
              ≈ {bean.currency || 'NT$'} {((bean.price / bean.totalWeightGrams) * 15).toFixed(1)} / 杯 (15g)
            </span>
          </div>
        )}
      </div>

      {/* Golden Recipe Card or Dial-in status */}
      {goldenLog ? (
        <div className="p-2.5 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between text-xs">
          <div className="flex items-center space-x-2">
            <Award className="w-4 h-4 text-amber-400 fill-amber-400/20" />
            <div>
              <div className="font-bold text-amber-300">{t.beans.goldenRecipe}</div>
              <div className="text-[10px] text-stone-400 font-mono">
                {goldenLog.grinder} • {goldenLog.grindSetting} • {goldenLog.doseGrams}g:{goldenLog.waterGrams}g
              </div>
            </div>
          </div>
          <span className="font-mono font-bold text-amber-400 text-xs">
            {goldenLog.overallScore} ★
          </span>
        </div>
      ) : (
        <div className="text-[11px] text-stone-500 italic px-1">
          {logs.length > 0
            ? `${logs.length} ${language === 'zh-TW' ? '次沖煮紀錄，尚未標記神參數' : 'brews logged, dialing in...'}`
            : language === 'zh-TW' ? '尚未開沖，立即開始第一把調校！' : 'Ready for initial dial-in brew!'}
        </div>
      )}

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 pt-1">
        <button
          onClick={() => openBeanDetailModal(bean.id)}
          className="px-3 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 hover:text-white text-xs font-semibold transition text-center"
        >
          {t.beans.beanDetails}
        </button>

        <button
          onClick={() => openBrewModal(bean.id, goldenLog?.id || logs[0]?.id)}
          className="px-3 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-sm flex items-center justify-center space-x-1"
        >
          <Coffee className="w-3.5 h-3.5" />
          <span>{goldenLog ? t.beans.quickBrew : t.app.newBrew}</span>
        </button>
      </div>
    </div>
  );
};
