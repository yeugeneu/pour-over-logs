import React from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { Coffee, Flame, Plus, Sparkles, TrendingUp, History, Database, Layers } from 'lucide-react';
import { SyncStatusBadge } from '../auth/SyncStatusBadge';

export const Navbar: React.FC = () => {
  const { beans, logs, activeTab, setActiveTab, openBrewModal, openBeanModal } = useCoffee();
  const { language, setLanguage, t } = useI18n();

  const totalBeans = beans.length;
  const totalBrews = logs.length;
  const avgScore = totalBrews > 0
    ? (logs.reduce((acc, curr) => acc + curr.overallScore, 0) / totalBrews).toFixed(1)
    : '-';

  return (
    <header className="sticky top-0 z-40 bg-stone-950/90 backdrop-blur-md border-b border-stone-800 text-stone-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo & Tagline */}
          <div className="flex items-center space-x-3 cursor-pointer" onClick={() => setActiveTab('beans')}>
            <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-amber-700 to-amber-500 flex items-center justify-center shadow-lg shadow-amber-900/30 text-white">
              <Coffee className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <span className="font-bold text-lg tracking-tight bg-gradient-to-r from-amber-200 via-amber-400 to-amber-100 bg-clip-text text-transparent">
                  {t.app.title}
                </span>
                <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/10 text-amber-400 border border-amber-500/20 font-mono">
                  v1.0 PWA
                </span>
              </div>
              <p className="text-xs text-stone-400 hidden md:block">
                {t.app.subtitle}
              </p>
            </div>
          </div>

          {/* Center Quick Stats Badges */}
          <div className="hidden lg:flex items-center space-x-6 px-4 py-1.5 rounded-full bg-stone-900/80 border border-stone-800/80 text-xs">
            <div className="flex items-center space-x-1.5 text-stone-300">
              <Layers className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.app.totalBeans}:</span>
              <span className="font-bold text-white">{totalBeans}</span>
            </div>
            <div className="h-3 w-px bg-stone-800" />
            <div className="flex items-center space-x-1.5 text-stone-300">
              <Flame className="w-3.5 h-3.5 text-amber-500" />
              <span>{t.app.brewsLogged}:</span>
              <span className="font-bold text-white">{totalBrews}</span>
            </div>
            <div className="h-3 w-px bg-stone-800" />
            <div className="flex items-center space-x-1.5 text-stone-300">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.app.averageScore}:</span>
              <span className="font-bold text-amber-400 font-mono">{avgScore} / 10</span>
            </div>
          </div>

          {/* Action Buttons & Language Switch */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Cloud Sync / Auth Status Badge */}
            <SyncStatusBadge />

            {/* Language Switch */}
            <button
              onClick={() => setLanguage(language === 'zh-TW' ? 'en' : 'zh-TW')}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-stone-800/80 hover:bg-stone-700 text-stone-300 hover:text-white border border-stone-700 transition"
              title="Switch Language"
            >
              {language === 'zh-TW' ? 'EN' : '繁中'}
            </button>

            {/* Add Bean Button */}
            <button
              onClick={() => openBeanModal()}
              className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-stone-800 hover:bg-stone-700 text-stone-200 border border-stone-700 transition shadow-sm"
            >
              <Plus className="w-3.5 h-3.5 text-amber-400" />
              <span>{t.app.newBean}</span>
            </button>

            {/* Start Brew Cockpit Button */}
            <button
              onClick={() => openBrewModal()}
              className="flex items-center space-x-2 px-3.5 py-2 text-xs sm:text-sm font-semibold rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white shadow-md shadow-amber-900/30 transition transform active:scale-95"
            >
              <Coffee className="w-4 h-4" />
              <span>{t.app.newBrew}</span>
            </button>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="flex items-center space-x-1 sm:space-x-2 py-2 overflow-x-auto no-scrollbar border-t border-stone-800/60">
          <button
            onClick={() => setActiveTab('beans')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'beans'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{t.app.beans}</span>
          </button>

          <button
            onClick={() => setActiveTab('trends')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'trends'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <TrendingUp className="w-4 h-4" />
            <span>{t.app.trends}</span>
          </button>

          <button
            onClick={() => setActiveTab('history')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'history'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <History className="w-4 h-4" />
            <span>{t.app.history} ({totalBrews})</span>
          </button>

          <button
            onClick={() => setActiveTab('backup')}
            className={`flex items-center space-x-2 px-3.5 py-1.5 text-xs sm:text-sm font-medium rounded-lg transition whitespace-nowrap ${
              activeTab === 'backup'
                ? 'bg-amber-600/20 text-amber-300 border border-amber-500/30'
                : 'text-stone-400 hover:text-stone-200 hover:bg-stone-800/50'
            }`}
          >
            <Database className="w-4 h-4" />
            <span>{t.app.backup}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
