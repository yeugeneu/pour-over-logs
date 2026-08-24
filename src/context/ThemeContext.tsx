import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme = 'warm-amber' | 'nordic-sage' | 'geisha-ruby' | 'tokyo-cyan' | 'oat-daylight';

export interface ThemeInfo {
  id: AppTheme;
  nameZh: string;
  nameEn: string;
  descriptionZh: string;
  descriptionEn: string;
  primaryColor: string;
  secondaryColor: string;
  bgColor: string;
  isDark: boolean;
  emoji: string;
}

export const THEMES: ThemeInfo[] = [
  {
    id: 'warm-amber',
    nameZh: '經典琥珀烘焙',
    nameEn: 'Warm Amber Roast',
    descriptionZh: '溫暖蜂蜜焦糖與日式喫茶店質調',
    descriptionEn: 'Warm honey caramel & classic roastery vibe',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    bgColor: '#0c0a09',
    isDark: true,
    emoji: '☕',
  },
  {
    id: 'nordic-sage',
    nameZh: '北歐淺焙鼠尾草綠',
    nameEn: 'Nordic Sage & Light Roast',
    descriptionZh: '清新草本薄荷，奧斯陸極簡咖啡美學',
    descriptionEn: 'Crisp herbal mint & Oslo minimalist aesthetic',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    bgColor: '#06100d',
    isDark: true,
    emoji: '🌿',
  },
  {
    id: 'geisha-ruby',
    nameZh: '瑰夏紅酒與自然莓果',
    nameEn: 'Geisha Natural Ruby',
    descriptionZh: '花香與厭氧發酵莓果，頂級感官體驗',
    descriptionEn: 'Floral jasmine & anaerobic berry fermentation',
    primaryColor: '#f43f5e',
    secondaryColor: '#e11d48',
    bgColor: '#100812',
    isDark: true,
    emoji: '🍷',
  },
  {
    id: 'tokyo-cyan',
    nameZh: '東京極簡冰川藍',
    nameEn: 'Tokyo Minimalist Cyan',
    descriptionZh: '冷冽科技感與精準萃取儀表板',
    descriptionEn: 'Precision digital extraction & matte obsidian',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0284c7',
    bgColor: '#08090c',
    isDark: true,
    emoji: '🪨',
  },
  {
    id: 'oat-daylight',
    nameZh: '燕麥奶暖日晨光',
    nameEn: 'Oat Milk Daylight',
    descriptionZh: '溫暖明亮的晨光手沖，清爽乾淨日行模式',
    descriptionEn: 'Bright warm morning pour-over in sunlight',
    primaryColor: '#ea580c',
    secondaryColor: '#c2410c',
    bgColor: '#faf8f5',
    isDark: false,
    emoji: '🥛',
  },
];

interface ThemeContextType {
  theme: AppTheme;
  setTheme: (theme: AppTheme) => void;
  currentThemeInfo: ThemeInfo;
  isThemeModalOpen: boolean;
  openThemeModal: () => void;
  closeThemeModal: () => void;
}

const STORAGE_KEY = 'brewlog_app_theme_v1';

const ThemeContext = createContext<ThemeContextType | null>(null);

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [theme, setThemeState] = useState<AppTheme>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved && THEMES.some((t) => t.id === saved)) {
        return saved as AppTheme;
      }
    } catch {
      // ignore
    }
    return 'warm-amber';
  });

  const [isThemeModalOpen, setIsThemeModalOpen] = useState(false);

  const setTheme = (newTheme: AppTheme) => {
    setThemeState(newTheme);
    try {
      localStorage.setItem(STORAGE_KEY, newTheme);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    if (theme === 'oat-daylight') {
      document.documentElement.classList.remove('dark');
      document.documentElement.classList.add('light');
    } else {
      document.documentElement.classList.add('dark');
      document.documentElement.classList.remove('light');
    }
  }, [theme]);

  const currentThemeInfo = THEMES.find((t) => t.id === theme) || THEMES[0];

  const openThemeModal = () => setIsThemeModalOpen(true);
  const closeThemeModal = () => setIsThemeModalOpen(false);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        currentThemeInfo,
        isThemeModalOpen,
        openThemeModal,
        closeThemeModal,
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
};

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};
