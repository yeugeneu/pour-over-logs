import React, { useState } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { BeanCard } from './BeanCard';
import { Search, Plus, Layers, Coffee } from 'lucide-react';

export const BeanList: React.FC = () => {
  const { beans, openBeanModal, resetToSampleData } = useCoffee();
  const { language, t } = useI18n();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'active' | 'resting' | 'finished'>('all');
  const [roastFilter, setRoastFilter] = useState<string>('all');
  const [processFilter, setProcessFilter] = useState<string>('all');

  const filteredBeans = beans.filter((bean) => {
    const matchesSearch =
      bean.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bean.roaster.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bean.origin.toLowerCase().includes(searchQuery.toLowerCase()) ||
      bean.process.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (bean.varietal && bean.varietal.toLowerCase().includes(searchQuery.toLowerCase())) ||
      (bean.tastingNotesPackage && bean.tastingNotesPackage.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase())));

    const matchesStatus = statusFilter === 'all' || bean.status === statusFilter;
    const matchesRoast = roastFilter === 'all' || bean.roastLevel === roastFilter;
    const matchesProcess = processFilter === 'all' || bean.process === processFilter;

    return matchesSearch && matchesStatus && matchesRoast && matchesProcess;
  });

  return (
    <div className="space-y-6">
      {/* Top Banner / Shelf Intro */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-6 rounded-3xl border border-stone-800 shadow-sm relative overflow-hidden">
        <div className="space-y-1 z-10">
          <div className="flex items-center space-x-2">
            <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
              <Layers className="w-4 h-4" />
            </span>
            <h1 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
              {t.beans.shelfTitle}
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
            {t.beans.shelfSubtitle}
          </p>
        </div>

        <div className="flex items-center space-x-2.5 z-10">
          <button
            onClick={() => openBeanModal()}
            className="flex items-center space-x-1.5 px-4 py-2.5 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm transition shadow-lg shadow-amber-900/30 active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span>{t.beans.addBean}</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Controls */}
      <div className="space-y-3">
        {/* Search Bar */}
        <div className="relative">
          <Search className="w-4 h-4 text-stone-500 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.beans.searchPlaceholder}
            className="w-full bg-stone-900 text-stone-100 placeholder-stone-500 text-xs sm:text-sm pl-10 pr-4 py-3 rounded-2xl border border-stone-800 focus:border-amber-500 focus:outline-none shadow-sm"
          />
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar text-xs">
          {/* Status Filter */}
          <div className="flex items-center p-1 rounded-xl bg-stone-950/80 border border-stone-800">
            {[
              { key: 'all', label: t.beans.all },
              { key: 'active', label: t.beans.active },
              { key: 'resting', label: t.beans.resting },
              { key: 'finished', label: t.beans.finished },
            ].map((st) => (
              <button
                key={st.key}
                onClick={() => setStatusFilter(st.key as typeof statusFilter)}
                className={`px-3 py-1 rounded-lg font-medium transition whitespace-nowrap ${
                  statusFilter === st.key
                    ? 'bg-amber-500 text-black font-bold shadow-sm'
                    : 'text-stone-400 hover:text-stone-200'
                }`}
              >
                {st.label}
              </button>
            ))}
          </div>

          {/* Roast Filter */}
          <select
            value={roastFilter}
            onChange={(e) => setRoastFilter(e.target.value)}
            className="bg-stone-950 text-stone-300 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">{language === 'zh-TW' ? '所有烘焙度' : 'All Roast Levels'}</option>
            <option value="Light">Light (淺焙)</option>
            <option value="Light-Medium">Light-Medium (淺中焙)</option>
            <option value="Medium">Medium (中焙)</option>
            <option value="Medium-Dark">Medium-Dark (中深焙)</option>
            <option value="Dark">Dark (深焙)</option>
          </select>

          {/* Process Filter */}
          <select
            value={processFilter}
            onChange={(e) => setProcessFilter(e.target.value)}
            className="bg-stone-950 text-stone-300 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
          >
            <option value="all">{language === 'zh-TW' ? '所有處理法' : 'All Processes'}</option>
            <option value="Washed">Washed (水洗)</option>
            <option value="Natural">Natural (日曬)</option>
            <option value="Honey">Honey (蜜處理)</option>
            <option value="Anaerobic">Anaerobic (厭氧)</option>
            <option value="Thermal Shock">Thermal Shock (熱衝擊)</option>
          </select>
        </div>
      </div>

      {/* Beans Grid */}
      {filteredBeans.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {filteredBeans.map((bean) => (
            <BeanCard key={bean.id} bean={bean} />
          ))}
        </div>
      ) : (
        /* Empty State */
        <div className="p-12 text-center bg-stone-900/40 rounded-3xl border border-dashed border-stone-800 space-y-4">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center mx-auto">
            <Coffee className="w-6 h-6" />
          </div>
          <div className="space-y-1">
            <h3 className="font-bold text-stone-200 text-base">
              {language === 'zh-TW' ? '找不到符合條件的咖啡豆' : 'No matching coffee beans found'}
            </h3>
            <p className="text-xs text-stone-400 max-w-sm mx-auto">
              {t.beans.emptyBeans}
            </p>
          </div>
          <div className="flex items-center justify-center gap-3 pt-2">
            <button
              onClick={() => openBeanModal()}
              className="px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-500 text-white font-bold text-xs transition"
            >
              {t.beans.addBean}
            </button>
            <button
              onClick={resetToSampleData}
              className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
            >
              {t.backup.resetSample}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
