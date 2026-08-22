import React from 'react';
import { useI18n } from '../../i18n';
import { BrewLog, DialinDiagnosis } from '../../types/coffee';
import { diagnoseExtraction } from '../../utils/dialinEngine';
import { AlertCircle, CheckCircle2, Sliders, Sparkles, Thermometer, Compass, Droplets } from 'lucide-react';

interface DialinAdvisorCardProps {
  log: Partial<BrewLog>;
  compact?: boolean;
}

export const DialinAdvisorCard: React.FC<DialinAdvisorCardProps> = ({ log, compact = false }) => {
  const { language, t } = useI18n();
  const diagnosis: DialinDiagnosis = diagnoseExtraction(log);

  const getStatusBadge = () => {
    switch (diagnosis.state) {
      case 'balanced_sweet':
        return {
          icon: <CheckCircle2 className="w-4 h-4 text-emerald-400" />,
          color: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
          title: language === 'zh-TW' ? t.advisor.optimal : 'Optimal Sweet Spot',
        };
      case 'under_extracted':
        return {
          icon: <AlertCircle className="w-4 h-4 text-cyan-400" />,
          color: 'bg-cyan-500/10 text-cyan-300 border-cyan-500/30',
          title: language === 'zh-TW' ? t.advisor.underExtracted : 'Under-Extracted',
        };
      case 'over_extracted':
        return {
          icon: <AlertCircle className="w-4 h-4 text-rose-400" />,
          color: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
          title: language === 'zh-TW' ? t.advisor.overExtracted : 'Over-Extracted',
        };
      case 'channeling':
        return {
          icon: <AlertCircle className="w-4 h-4 text-purple-400" />,
          color: 'bg-purple-500/10 text-purple-300 border-purple-500/30',
          title: language === 'zh-TW' ? t.advisor.channeling : 'Channeling Detected',
        };
    }
  };

  const badge = getStatusBadge();

  const getParamIcon = (param: string) => {
    switch (param) {
      case 'grind':
        return <Sliders className="w-3.5 h-3.5 text-amber-400" />;
      case 'temp':
        return <Thermometer className="w-3.5 h-3.5 text-rose-400" />;
      case 'pour':
      case 'agitation':
        return <Compass className="w-3.5 h-3.5 text-blue-400" />;
      default:
        return <Droplets className="w-3.5 h-3.5 text-cyan-400" />;
    }
  };

  return (
    <div className="p-4 bg-stone-900/90 rounded-2xl border border-stone-800 space-y-3.5 shadow-sm">
      {/* Header */}
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center space-x-2">
          <div className="p-1.5 rounded-lg bg-amber-500/10 border border-amber-500/20 text-amber-400">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs sm:text-sm font-bold text-stone-100 flex items-center gap-1.5">
              {t.advisor.title}
            </h4>
            <p className="text-[11px] text-stone-400">
              {diagnosis.summary}
            </p>
          </div>
        </div>
        <span
          className={`flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-semibold border whitespace-nowrap ${badge.color}`}
        >
          {badge.icon}
          <span>{badge.title}</span>
        </span>
      </div>

      {/* Identified Symptoms */}
      {diagnosis.symptoms.length > 0 && (
        <div className="bg-stone-950/60 p-2.5 rounded-xl border border-stone-800/80">
          <div className="text-[11px] font-semibold text-stone-400 mb-1.5">
            {t.advisor.symptomsIdentified}：
          </div>
          <div className="flex flex-wrap gap-1.5">
            {diagnosis.symptoms.map((sym, idx) => (
              <span
                key={idx}
                className="px-2 py-0.5 rounded-md bg-stone-900 text-stone-300 text-xs border border-stone-800"
              >
                • {sym}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Actionable Recommendations */}
      {!compact && diagnosis.recommendations.length > 0 && (
        <div className="space-y-2">
          <div className="text-xs font-semibold text-amber-400 flex items-center gap-1">
            <Sliders className="w-3.5 h-3.5" />
            <span>{t.advisor.recommendedActions}</span>
          </div>

          <div className="grid grid-cols-1 gap-2">
            {diagnosis.recommendations.map((rec, idx) => (
              <div
                key={idx}
                className="p-2.5 rounded-xl bg-stone-950/80 border border-stone-800/90 flex items-start space-x-2.5"
              >
                <div className="p-1 rounded-md bg-stone-900 border border-stone-800 mt-0.5">
                  {getParamIcon(rec.parameter)}
                </div>
                <div className="flex-1 text-xs">
                  <div className="font-semibold text-stone-200 flex items-center justify-between">
                    <span>{rec.action}</span>
                    <span className="text-[10px] uppercase px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-300 border border-amber-500/20 font-mono">
                      {rec.parameter}
                    </span>
                  </div>
                  <p className="text-stone-400 text-[11px] mt-0.5 leading-relaxed">
                    {rec.description}
                  </p>
                  <p className="text-stone-500 text-[10px] mt-0.5 italic">
                    💡 原理：{rec.rationale}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
