import React, { useState } from 'react';
import { useTheme, THEMES, AppTheme } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { X, Palette, Check, Sparkles, Flower2, Coffee, SunMedium } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ThemeSwitcherModal: React.FC = () => {
  const { theme, setTheme, isThemeModalOpen, closeThemeModal } = useTheme();
  const { language } = useI18n();

  const [activeCategory, setActiveCategory] = useState<'all' | 'floral-fruity' | 'classic' | 'modern'>('all');

  if (!isThemeModalOpen) return null;

  const handleSelectTheme = (themeId: AppTheme) => {
    setTheme(themeId);
    confetti({
      particleCount: 35,
      spread: 55,
      origin: { y: 0.7 },
    });
  };

  const filteredThemes = activeCategory === 'all'
    ? THEMES
    : THEMES.filter((t) => t.category === activeCategory);

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
                <span>{language === 'zh-TW' ? '風味視覺風格主題' : 'Flavor & Aesthetic Themes'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'zh-TW' ? '依據您喜愛的手沖風味調性，自訂專屬儀表板視覺' : 'Select a theme that matches your favorite coffee flavor notes'}
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

        {/* Category Pills */}
        <div className="px-4 sm:px-6 pt-3 pb-1 border-b border-stone-800/80 bg-stone-950/40 flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveCategory('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition ${
              activeCategory === 'all'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
            }`}
          >
            🌟 {language === 'zh-TW' ? '全部 (9 種)' : 'All (9)'}
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('floral-fruity')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'floral-fruity'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
            }`}
          >
            <Flower2 className="w-3.5 h-3.5" />
            <span>{language === 'zh-TW' ? '花香與果香 (Bright)' : 'Floral & Fruity'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('classic')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'classic'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
            }`}
          >
            <Coffee className="w-3.5 h-3.5" />
            <span>{language === 'zh-TW' ? '經典烘焙 (Classic)' : 'Classic Roast'}</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory('modern')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold whitespace-nowrap transition flex items-center gap-1.5 ${
              activeCategory === 'modern'
                ? 'bg-amber-500 text-stone-950 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-900/60 border border-stone-800'
            }`}
          >
            <SunMedium className="w-3.5 h-3.5" />
            <span>{language === 'zh-TW' ? '極簡/晨光 (Modern)' : 'Minimalist'}</span>
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
                        <span className="text-[10px] px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-300 border border-amber-500/30 font-semibold">
                          {language === 'zh-TW' ? '使用中' : 'Active'}
                        </span>
                      )}
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
                      title="Background Tone"
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
