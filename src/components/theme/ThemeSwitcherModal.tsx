import React, { useState } from 'react';
import { useTheme, THEMES, AppTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { X, Palette, Check, Sparkles, Sun, Moon, Flower2 } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ThemeSwitcherModal: React.FC = () => {
  const { theme, setTheme, isThemeModalOpen, closeThemeModal } = useTheme();
  const { language } = useI18n();

  const [activeFilter, setActiveFilter] = useState<'all' | 'light' | 'dark' | 'floral-fruity'>('all');

  if (!isThemeModalOpen) return null;

  const handleSelectTheme = (themeId: AppTheme) => {
    setTheme(themeId);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.7 },
    });
  };

  const filteredThemes = THEMES.filter((t) => {
    if (activeFilter === 'light') return t.mode === 'light';
    if (activeFilter === 'dark') return t.mode === 'dark';
    if (activeFilter === 'floral-fruity') return t.category === 'floral-fruity';
    return true;
  });

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Palette className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-100 flex items-center gap-1.5">
                <span>{language === 'zh-TW' ? '風格主題選擇' : 'Visual Theme Selector'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'zh-TW'
                  ? `共 ${THEMES.length} 款專屬精品手沖主題，包含 ${THEMES.filter((t) => t.mode === 'light').length} 款清爽明亮晨光白與 ${THEMES.filter((t) => t.mode === 'dark').length} 款風味暗黑系`
                  : `${THEMES.length} handcrafted themes: ${THEMES.filter((t) => t.mode === 'light').length} crisp Light Mode & ${THEMES.filter((t) => t.mode === 'dark').length} rich Dark Mode palettes`}
              </p>
            </div>
          </div>

          <button
            onClick={closeThemeModal}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mode / Category Filter Pills */}
        <div className="px-4 sm:px-6 pt-3 pb-2 border-b border-stone-800/80 bg-stone-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveFilter('light')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeFilter === 'light'
                ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400/50'
                : 'text-stone-300 hover:text-stone-100 bg-stone-900/80 border border-stone-700'
            }`}
          >
            <Sun className="w-3.5 h-3.5 text-amber-400" />
            <span>☀️ {language === 'zh-TW' ? `明亮晨光 (${THEMES.filter((t) => t.mode === 'light').length} 款)` : `Light (${THEMES.filter((t) => t.mode === 'light').length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('dark')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeFilter === 'dark'
                ? 'bg-amber-500 text-stone-950 shadow-md ring-2 ring-amber-400/50'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
            }`}
          >
            <Moon className="w-3.5 h-3.5 text-amber-400" />
            <span>🌙 {language === 'zh-TW' ? `夜間暗黑 (${THEMES.filter((t) => t.mode === 'dark').length} 款)` : `Dark (${THEMES.filter((t) => t.mode === 'dark').length})`}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('floral-fruity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeFilter === 'floral-fruity'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
            }`}
          >
            <Flower2 className="w-3.5 h-3.5 text-rose-400" />
            <span>🌸 {language === 'zh-TW' ? '花果香調' : 'Floral & Fruity'}</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveFilter('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeFilter === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-md'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
            }`}
          >
            🌟 {language === 'zh-TW' ? `全部 (${THEMES.length} 款)` : `All (${THEMES.length})`}
          </button>
        </div>

        {/* Theme List */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-2.5 flex-1">
          {filteredThemes.map((t) => {
            const isSelected = theme === t.id;
            return (
              <button
                key={t.id}
                type="button"
                onClick={() => handleSelectTheme(t.id)}
                className={`w-full text-left p-3.5 sm:p-4 rounded-2xl border transition flex items-center justify-between group ${
                  isSelected
                    ? 'bg-stone-950 border-amber-500 shadow-md ring-1 ring-amber-500/40'
                    : 'bg-stone-950/60 border-stone-800/80 hover:border-stone-700 hover:bg-stone-950'
                }`}
              >
                <div className="flex items-center space-x-3.5 min-w-0">
                  {/* Emoji & Palette Preview */}
                  <div
                    className="w-11 h-11 rounded-xl flex items-center justify-center text-xl shadow-inner shrink-0 border border-white/10"
                    style={{ backgroundColor: t.bgColor }}
                  >
                    <span>{t.emoji}</span>
                  </div>

                  {/* Title & Desc */}
                  <div className="min-w-0">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-sm text-stone-100">
                        {language === 'zh-TW' ? t.nameZh : t.nameEn}
                      </span>
                      {isSelected && (
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold shrink-0">
                          {language === 'zh-TW' ? '使用中' : 'Active'}
                        </span>
                      )}
                      <span
                        className={`text-[9px] px-1.5 py-0.5 rounded font-mono uppercase shrink-0 ${
                          t.mode === 'light'
                            ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                            : 'bg-stone-800 text-stone-400 border border-stone-700'
                        }`}
                      >
                        {t.mode === 'light' ? '☀️ Light' : '🌙 Dark'}
                      </span>
                    </div>
                    <p className="text-xs text-stone-400 mt-0.5 line-clamp-1">
                      {language === 'zh-TW' ? t.descriptionZh : t.descriptionEn}
                    </p>
                  </div>
                </div>

                {/* Color Swatches & Checkmark */}
                <div className="flex items-center space-x-2 shrink-0 ml-2">
                  <div className="flex items-center -space-x-1.5">
                    <div
                      className="w-4 h-4 rounded-full border-2 border-stone-900 shadow-sm"
                      style={{ backgroundColor: t.primaryColor }}
                      title="Primary Accent"
                    />
                    <div
                      className="w-4 h-4 rounded-full border-2 border-stone-900 shadow-sm"
                      style={{ backgroundColor: t.secondaryColor }}
                      title="Secondary Accent"
                    />
                    <div
                      className="w-4 h-4 rounded-full border-2 border-stone-900 shadow-sm"
                      style={{ backgroundColor: t.bgColor }}
                      title="Background Canvas"
                    />
                  </div>

                  <div
                    className={`w-6 h-6 rounded-full flex items-center justify-center transition ${
                      isSelected
                        ? 'bg-amber-500 text-stone-950 font-bold shadow'
                        : 'border border-stone-700 text-transparent group-hover:border-stone-500'
                    }`}
                  >
                    <Check className="w-3.5 h-3.5" />
                  </div>
                </div>
              </button>
            );
          })}
        </div>

        {/* Footer */}
        <div className="p-4 border-t border-stone-800 bg-stone-950/80 flex items-center justify-between text-xs">
          <span className="text-stone-400 text-[11px]">
            {language === 'zh-TW' ? '💡 選擇後即時套用並自動儲存於本機' : '💡 Automatically saved locally'}
          </span>
          <button
            onClick={closeThemeModal}
            className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold transition"
          >
            {language === 'zh-TW' ? '完成' : 'Done'}
          </button>
        </div>
      </div>
    </div>
  );
};
