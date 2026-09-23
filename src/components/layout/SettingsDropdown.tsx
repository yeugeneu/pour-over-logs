import React, { useState, useRef, useEffect } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useTheme } from '../../context/ThemeContext';
import { useScale } from '../../context/ScaleContext';
import { useI18n } from '../../i18n';
import {
  Settings,
  Globe,
  Palette,
  Bluetooth,
  Cloud,
  ChevronRight,
  X,
  Battery,
  RefreshCw,
} from 'lucide-react';

export const SettingsDropdown: React.FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const { user, syncStatus, openAuthModal } = useCoffee();
  const { openThemeModal, currentThemeInfo } = useTheme();
  const { connectionState, deviceInfo, telemetry, openScaleModal } = useScale();
  const { language, setLanguage, t } = useI18n();

  const isScaleConnected = connectionState === 'connected';
  const isScaleConnecting = connectionState === 'connecting';
  const isCloudSyncing = syncStatus === 'syncing';
  const hasCloudError = syncStatus === 'error';

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleOpenTheme = () => {
    setIsOpen(false);
    openThemeModal();
  };

  const handleOpenScale = () => {
    setIsOpen(false);
    openScaleModal();
  };

  const handleOpenAuth = () => {
    setIsOpen(false);
    openAuthModal();
  };

  // Determine indicator dot status on settings button
  const getIndicatorDot = () => {
    if (isScaleConnected) {
      return (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400 ring-2 ring-stone-950" />
        </span>
      );
    }
    if (isScaleConnecting || isCloudSyncing) {
      return (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400 animate-pulse ring-2 ring-stone-950" />
        </span>
      );
    }
    if (hasCloudError) {
      return (
        <span className="absolute top-1 right-1 flex h-2 w-2">
          <span className="relative inline-flex rounded-full h-2 w-2 bg-rose-400 ring-2 ring-stone-950" />
        </span>
      );
    }
    return null;
  };

  return (
    <div className="relative shrink-0" ref={dropdownRef}>
      {/* Settings Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-haspopup="true"
        aria-label={t.settings.title}
        title={t.settings.title}
        className={`relative shrink-0 p-2 sm:px-2.5 sm:py-2 text-xs font-semibold rounded-xl border transition flex items-center gap-1.5 shadow-sm active:scale-95 ${
          isOpen
            ? 'bg-stone-800 text-stone-100 border-amber-500/50 ring-1 ring-amber-500/30'
            : 'bg-stone-900 hover:bg-stone-800 text-stone-300 hover:text-stone-100 border-stone-800'
        }`}
      >
        <Settings className={`w-4 h-4 transition-transform duration-200 ${isOpen ? 'rotate-45 text-amber-400' : 'text-stone-300'}`} />
        {getIndicatorDot()}
      </button>

      {/* Dropdown Menu Popover */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-80 sm:w-92 z-50 isolate bg-stone-950 border border-stone-800 rounded-2xl shadow-2xl overflow-hidden ring-1 ring-white/10 animate-in fade-in slide-in-from-top-2 duration-150">
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 bg-stone-950 border-b border-stone-800">
            <div className="flex items-center space-x-2 text-stone-200">
              <Settings className="w-4 h-4 text-amber-400" />
              <span className="font-semibold text-xs tracking-wider uppercase">
                {t.settings.menuTitle}
              </span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-stone-400 hover:text-stone-200 p-1 rounded-lg hover:bg-stone-800/80 transition"
              aria-label="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="p-2 space-y-1">
            {/* 1. Language Row */}
            <div className="flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800/40 transition">
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400 shrink-0">
                  <Globe className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-200 truncate">
                    {t.settings.language}
                  </p>
                  <p className="text-[11px] text-stone-400">
                    {language === 'zh-TW' ? '繁體中文 (繁中)' : 'English (EN)'}
                  </p>
                </div>
              </div>

              {/* Language Segmented Switch */}
              <div className="flex items-center bg-stone-950 p-0.5 rounded-xl border border-stone-800 text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setLanguage('zh-TW')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    language === 'zh-TW'
                      ? 'bg-amber-600 text-white shadow-sm font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  繁中
                </button>
                <button
                  type="button"
                  onClick={() => setLanguage('en')}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${
                    language === 'en'
                      ? 'bg-amber-600 text-white shadow-sm font-semibold'
                      : 'text-stone-400 hover:text-stone-200'
                  }`}
                >
                  EN
                </button>
              </div>
            </div>

            {/* 2. Theme Row */}
            <button
              type="button"
              onClick={handleOpenTheme}
              className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800/60 transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 shrink-0">
                  <Palette className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 transition-colors truncate">
                    {t.settings.theme}
                  </p>
                  <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 mt-0.5">
                    <span>{currentThemeInfo.emoji}</span>
                    <span className="truncate">
                      {language === 'zh-TW' ? currentThemeInfo.nameZh : currentThemeInfo.nameEn}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 ml-2">
                <div className="flex items-center space-x-1 bg-stone-950/80 px-2 py-1 rounded-lg border border-stone-800">
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/10"
                    style={{ backgroundColor: currentThemeInfo.primaryColor }}
                    title={currentThemeInfo.primaryColor}
                  />
                  <span
                    className="w-2.5 h-2.5 rounded-full shrink-0 border border-white/10"
                    style={{ backgroundColor: currentThemeInfo.secondaryColor }}
                    title={currentThemeInfo.secondaryColor}
                  />
                  <span className="text-[10px] text-stone-400 uppercase font-mono ml-0.5">
                    {currentThemeInfo.isDark ? 'Dark' : 'Light'}
                  </span>
                </div>
                <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-stone-300 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* 3. Scale Row */}
            <button
              type="button"
              onClick={handleOpenScale}
              className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800/60 transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    isScaleConnected
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : isScaleConnecting
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400 animate-pulse'
                      : 'bg-stone-800/60 border-stone-700/60 text-stone-400'
                  }`}
                >
                  <Bluetooth className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <div className="flex items-center space-x-1.5">
                    <p className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 transition-colors truncate">
                      {t.settings.scale}
                    </p>
                    {isScaleConnected && (
                      <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                    )}
                  </div>
                  <div className="flex items-center space-x-1.5 text-[11px] text-stone-400 mt-0.5 truncate">
                    {isScaleConnected ? (
                      <>
                        <span className="text-stone-300 font-medium truncate max-w-[90px] sm:max-w-[120px]">
                          {deviceInfo?.name || 'Acaia Scale'}
                        </span>
                        <span>•</span>
                        <span className="font-mono font-bold text-emerald-300 shrink-0">
                          {telemetry.weight.toFixed(1)}g
                        </span>
                        {deviceInfo?.battery !== null && deviceInfo?.battery !== undefined && (
                          <>
                            <span>•</span>
                            <span className="flex items-center space-x-0.5 font-mono shrink-0">
                              <Battery className="w-3 h-3" />
                              <span>{deviceInfo.battery}%</span>
                            </span>
                          </>
                        )}
                      </>
                    ) : isScaleConnecting ? (
                      <span className="text-amber-400">{t.settings.scaleConnecting}</span>
                    ) : (
                      <span>{t.settings.scaleDisconnected}</span>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 ml-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                    isScaleConnected
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : isScaleConnecting
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}
                >
                  {isScaleConnected
                    ? t.settings.scaleConnected
                    : isScaleConnecting
                    ? t.settings.scaleConnecting
                    : t.scale.connect}
                </span>
                <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-stone-300 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>

            {/* 4. Cloud Sync & Account Row */}
            <button
              type="button"
              onClick={handleOpenAuth}
              className="w-full text-left flex items-center justify-between px-3 py-2.5 rounded-xl hover:bg-stone-800/60 transition group cursor-pointer"
            >
              <div className="flex items-center space-x-2.5 min-w-0">
                <div
                  className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 border ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-500/10 border-amber-500/30 text-amber-400'
                      : syncStatus === 'error'
                      ? 'bg-rose-500/10 border-rose-500/30 text-rose-400'
                      : 'bg-sky-500/10 border-sky-500/20 text-sky-400'
                  }`}
                >
                  {isCloudSyncing ? (
                    <RefreshCw className="w-4 h-4 animate-spin text-amber-400" />
                  ) : (
                    <Cloud className="w-4 h-4" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="text-xs font-semibold text-stone-200 group-hover:text-amber-300 transition-colors truncate">
                    {t.settings.cloudSync}
                  </p>
                  <p className="text-[11px] text-stone-400 mt-0.5 truncate max-w-[140px] sm:max-w-[170px]">
                    {user ? user.email || t.auth.loggedInAs : t.settings.localMode}
                  </p>
                </div>
              </div>

              <div className="flex items-center space-x-2 shrink-0 ml-2">
                <span
                  className={`px-2 py-0.5 text-[10px] font-semibold rounded-full border ${
                    syncStatus === 'synced'
                      ? 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30'
                      : syncStatus === 'syncing'
                      ? 'bg-amber-500/15 text-amber-300 border-amber-500/30'
                      : syncStatus === 'error' || syncStatus === 'offline'
                      ? 'bg-rose-500/15 text-rose-300 border-rose-500/30'
                      : 'bg-stone-800 text-stone-400 border-stone-700'
                  }`}
                >
                  {syncStatus === 'synced'
                    ? t.settings.synced
                    : syncStatus === 'syncing'
                    ? t.settings.syncing
                    : syncStatus === 'error' || syncStatus === 'offline'
                    ? t.settings.offline
                    : user
                    ? t.auth.account
                    : t.auth.signIn}
                </span>
                <ChevronRight className="w-4 h-4 text-stone-500 group-hover:text-stone-300 transition-transform group-hover:translate-x-0.5" />
              </div>
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
