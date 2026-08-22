import React, { useState } from 'react';
import { FLAVOR_CATEGORIES } from '../../data/presets';
import { useI18n } from '../../i18n';
import { Plus, X, Tag } from 'lucide-react';

interface FlavorTagSelectorProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  maxTags?: number;
}

export const FlavorTagSelector: React.FC<FlavorTagSelectorProps> = ({
  selectedTags,
  onChange,
  maxTags = 12,
}) => {
  const { language, t } = useI18n();
  const [activeCategory, setActiveCategory] = useState<number>(0);
  const [customInput, setCustomInput] = useState<string>('');

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      if (selectedTags.length < maxTags) {
        onChange([...selectedTags, tag]);
      }
    }
  };

  const handleAddCustom = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = customInput.trim();
    if (trimmed && !selectedTags.includes(trimmed)) {
      if (selectedTags.length < maxTags) {
        onChange([...selectedTags, trimmed]);
        setCustomInput('');
      }
    }
  };

  return (
    <div className="space-y-3">
      {/* Selected Tags Pills */}
      <div className="flex flex-wrap items-center gap-1.5 min-h-[36px] p-2 bg-stone-950/60 rounded-xl border border-stone-800">
        {selectedTags.length === 0 ? (
          <span className="text-xs text-stone-500 flex items-center gap-1">
            <Tag className="w-3 h-3" />
            {language === 'zh-TW' ? '點擊下方風味輪分類或手動輸入標籤...' : 'Select flavor notes below or type custom notes...'}
          </span>
        ) : (
          selectedTags.map((tag) => (
            <span
              key={tag}
              className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-full text-xs font-medium bg-amber-500/20 text-amber-300 border border-amber-500/40 animate-fade-in"
            >
              <span>{tag}</span>
              <button
                type="button"
                onClick={() => toggleTag(tag)}
                className="hover:text-white p-0.5 rounded-full hover:bg-amber-500/30"
              >
                <X className="w-3 h-3" />
              </button>
            </span>
          ))
        )}
      </div>

      {/* Custom Tag Input */}
      <form onSubmit={handleAddCustom} className="flex gap-2">
        <input
          type="text"
          value={customInput}
          onChange={(e) => setCustomInput(e.target.value)}
          placeholder={t.sensory.searchTagPlaceholder}
          className="flex-1 bg-stone-900 text-stone-100 placeholder-stone-500 text-xs px-3 py-2 rounded-lg border border-stone-800 focus:outline-none focus:border-amber-500 focus:ring-1 focus:ring-amber-500"
        />
        <button
          type="submit"
          disabled={!customInput.trim() || selectedTags.length >= maxTags}
          className="px-3 py-2 bg-stone-800 hover:bg-stone-700 disabled:opacity-50 text-stone-200 text-xs font-medium rounded-lg border border-stone-700 transition flex items-center gap-1"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{language === 'zh-TW' ? '加入' : 'Add'}</span>
        </button>
      </form>

      {/* Flavor Category Selector Tabs */}
      <div className="flex gap-1 overflow-x-auto pb-1 no-scrollbar">
        {FLAVOR_CATEGORIES.map((cat, idx) => (
          <button
            key={cat.nameEn}
            type="button"
            onClick={() => setActiveCategory(idx)}
            className={`px-2.5 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition ${
              activeCategory === idx
                ? 'bg-stone-800 text-amber-300 border border-amber-500/40 shadow-sm'
                : 'text-stone-400 hover:text-stone-200 bg-stone-950/40 hover:bg-stone-900 border border-transparent'
            }`}
          >
            {language === 'zh-TW' ? cat.nameZh : cat.nameEn}
          </button>
        ))}
      </div>

      {/* Flavor Note Chips */}
      <div className="flex flex-wrap gap-1.5 p-2 bg-stone-900/40 rounded-xl border border-stone-800/60 max-h-36 overflow-y-auto">
        {FLAVOR_CATEGORIES[activeCategory].tags.map((tag) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              type="button"
              onClick={() => toggleTag(tag)}
              className={`px-2.5 py-1 rounded-lg text-xs transition border ${
                isSelected
                  ? 'bg-amber-500/30 text-amber-200 border-amber-500 font-medium'
                  : 'bg-stone-900 hover:bg-stone-800 text-stone-300 border-stone-800 hover:border-stone-700'
              }`}
            >
              {tag}
            </button>
          );
        })}
      </div>
    </div>
  );
};
