import React, { createContext, useContext, useEffect, useState } from 'react';

export type AppTheme =
  // --- LIGHT MODE THEMES ---
  | 'sakura-light'
  | 'matcha-light'
  | 'citrus-light'
  | 'nordic-ice-light'
  | 'lavender-light'
  | 'oat-daylight'
  // --- DARK MODE THEMES ---
  | 'peach-blossom'
  | 'tropical-mango'
  | 'jasmine-citrus'
  | 'violet-lavender'
  | 'warm-amber'
  | 'geisha-ruby'
  | 'nordic-sage'
  | 'tokyo-cyan'
  | 'deep-navy-ice';

export interface ThemeInfo {
  id: AppTheme;
  mode: 'light' | 'dark';
  category: 'floral-fruity' | 'classic' | 'modern';
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
  // ==========================================
  // ☀️ LIGHT MODE THEMES (明亮清爽系列)
  // ==========================================
  {
    id: 'sakura-light',
    mode: 'light',
    category: 'floral-fruity',
    nameZh: '🌸 櫻花白桃晨光 (Sakura Light)',
    nameEn: 'Sakura & White Peach (Light)',
    descriptionZh: '日式白瓷手沖、粉嫩櫻花與水蜜桃果香晨光',
    descriptionEn: 'White porcelain, delicate sakura petals & sweet peach',
    primaryColor: '#e11d48',
    secondaryColor: '#f43f5e',
    bgColor: '#fdf8f9',
    isDark: false,
    emoji: '🌸',
  },
  {
    id: 'matcha-light',
    mode: 'light',
    category: 'floral-fruity',
    nameZh: '🍵 京都抹茶與白瓷 (Matcha Light)',
    nameEn: 'Kyoto Matcha & Jade (Light)',
    descriptionZh: '清爽京都抹茶、茶樹花白花香氣與白瓷器皿',
    descriptionEn: 'Crisp green tea blossom, jade botanical & porcelain',
    primaryColor: '#059669',
    secondaryColor: '#10b981',
    bgColor: '#f4f9f6',
    isDark: false,
    emoji: '🍵',
  },
  {
    id: 'citrus-light',
    mode: 'light',
    category: 'floral-fruity',
    nameZh: '🍋 西西里檸檬冰咖啡 (Citrus Light)',
    nameEn: 'Sicilian Lemon Citrus (Light)',
    descriptionZh: '陽光檸檬西西里、明亮柑橘酸質與棉麻濾布質感',
    descriptionEn: 'Sunny lemon pour-over, crisp citrus zest & linen',
    primaryColor: '#d97706',
    secondaryColor: '#f59e0b',
    bgColor: '#fefcf3',
    isDark: false,
    emoji: '🍋',
  },
  {
    id: 'nordic-ice-light',
    mode: 'light',
    category: 'modern',
    nameZh: '🧊 哥本哈根冰川藍 (Glacier Light)',
    nameEn: 'Copenhagen Glacier (Light)',
    descriptionZh: '極簡北歐白系吧台、冰川水手沖與純白無印風',
    descriptionEn: 'Nordic minimalist white brew bar & crisp glacier blue',
    primaryColor: '#0284c7',
    secondaryColor: '#0ea5e9',
    bgColor: '#f4f8fb',
    isDark: false,
    emoji: '🧊',
  },
  {
    id: 'lavender-light',
    mode: 'light',
    category: 'floral-fruity',
    nameZh: '🪻 普羅旺斯薰衣草晨曦 (Lavender Light)',
    nameEn: 'Provence Lavender (Light)',
    descriptionZh: '晨曦中的薰衣草田、藍莓花果香與輕盈明亮紫調',
    descriptionEn: 'Morning lavender fields, blueberry tea & luminous lilac',
    primaryColor: '#9333ea',
    secondaryColor: '#a855f7',
    bgColor: '#faf7fd',
    isDark: false,
    emoji: '🪻',
  },
  {
    id: 'oat-daylight',
    mode: 'light',
    category: 'modern',
    nameZh: '🥛 燕麥奶暖日晨光 (Oat Milk Light)',
    nameEn: 'Oat Milk Daylight (Light)',
    descriptionZh: '溫暖明亮的晨光手沖、燕麥奶與肉桂焦糖香氣',
    descriptionEn: 'Bright warm morning pour-over, oat milk & roasted cinnamon',
    primaryColor: '#c2410c',
    secondaryColor: '#ea580c',
    bgColor: '#faf7f2',
    isDark: false,
    emoji: '🥛',
  },

  // ==========================================
  // 🌙 DARK MODE THEMES (夜間與暗色系列)
  // ==========================================
  {
    id: 'peach-blossom',
    mode: 'dark',
    category: 'floral-fruity',
    nameZh: '🌸 蜜桃橙花與野草莓 (Dark)',
    nameEn: 'Peach Blossom & Berry (Dark)',
    descriptionZh: '甜美白桃、粉紅草莓與淡雅橙花香氣',
    descriptionEn: 'Sweet white peach, pink wild berry & orange blossom',
    primaryColor: '#ec4899',
    secondaryColor: '#f472b6',
    bgColor: '#160a13',
    isDark: true,
    emoji: '🌸',
  },
  {
    id: 'tropical-mango',
    mode: 'dark',
    category: 'floral-fruity',
    nameZh: '🥭 熱帶芒果與百香果 (Dark)',
    nameEn: 'Tropical Mango & Passion (Dark)',
    descriptionZh: '明亮多汁的百香果與熱帶芒果厭氧發酵風味',
    descriptionEn: 'Juicy passionfruit & vibrant tropical anaerobic notes',
    primaryColor: '#f97316',
    secondaryColor: '#fb923c',
    bgColor: '#170d08',
    isDark: true,
    emoji: '🥭',
  },
  {
    id: 'jasmine-citrus',
    mode: 'dark',
    category: 'floral-fruity',
    nameZh: '🍋 耶加茉莉與佛手柑 (Dark)',
    nameEn: 'Yirgacheffe Jasmine & Citrus (Dark)',
    descriptionZh: '明亮檸檬水洗酸質、佛手柑與盛開茉莉白花',
    descriptionEn: 'Bright washed lemon citrus, bergamot & jasmine florals',
    primaryColor: '#eab308',
    secondaryColor: '#facc15',
    bgColor: '#141107',
    isDark: true,
    emoji: '🍋',
  },
  {
    id: 'violet-lavender',
    mode: 'dark',
    category: 'floral-fruity',
    nameZh: '🪻 薰衣草與紫羅蘭花香 (Dark)',
    nameEn: 'Lavender & Violet Bloom (Dark)',
    descriptionZh: '優雅紫羅蘭、薰衣草與藍莓花果甜香',
    descriptionEn: 'Elegant violet petals, lavender aroma & blueberry',
    primaryColor: '#a855f7',
    secondaryColor: '#c084fc',
    bgColor: '#120b1c',
    isDark: true,
    emoji: '🪻',
  },
  {
    id: 'warm-amber',
    mode: 'dark',
    category: 'classic',
    nameZh: '☕ 經典琥珀烘焙 (Dark)',
    nameEn: 'Warm Amber Roast (Dark)',
    descriptionZh: '溫暖蜂蜜焦糖與日式喫茶店質調',
    descriptionEn: 'Warm honey caramel & classic roastery vibe',
    primaryColor: '#f59e0b',
    secondaryColor: '#d97706',
    bgColor: '#0c0a09',
    isDark: true,
    emoji: '☕',
  },
  {
    id: 'geisha-ruby',
    mode: 'dark',
    category: 'classic',
    nameZh: '🍷 瑰夏紅酒與自然莓果 (Dark)',
    nameEn: 'Geisha Natural Ruby (Dark)',
    descriptionZh: '花香與厭氧發酵莓果，頂級感官體驗',
    descriptionEn: 'Floral jasmine & anaerobic berry fermentation',
    primaryColor: '#f43f5e',
    secondaryColor: '#e11d48',
    bgColor: '#100812',
    isDark: true,
    emoji: '🍷',
  },
  {
    id: 'nordic-sage',
    mode: 'dark',
    category: 'classic',
    nameZh: '🌿 北歐淺焙鼠尾草綠 (Dark)',
    nameEn: 'Nordic Sage & Light Roast (Dark)',
    descriptionZh: '清新草本薄荷，奧斯陸極簡咖啡美學',
    descriptionEn: 'Crisp herbal mint & Oslo minimalist aesthetic',
    primaryColor: '#10b981',
    secondaryColor: '#059669',
    bgColor: '#06100d',
    isDark: true,
    emoji: '🌿',
  },
  {
    id: 'tokyo-cyan',
    mode: 'dark',
    category: 'modern',
    nameZh: '🪨 東京極簡冰川藍 (Dark)',
    nameEn: 'Tokyo Minimalist Cyan (Dark)',
    descriptionZh: '冷冽科技感與精準萃取儀表板',
    descriptionEn: 'Precision digital extraction & matte obsidian',
    primaryColor: '#0ea5e9',
    secondaryColor: '#0284c7',
    bgColor: '#08090c',
    isDark: true,
    emoji: '🪨',
  },
  {
    id: 'deep-navy-ice',
    mode: 'dark',
    category: 'modern',
    nameZh: '🌌 深海星空與矢車菊冰藍 (Deep Navy & Ice)',
    nameEn: 'Deep Navy & Icy Blue (Dark)',
    descriptionZh: '深邃午夜海軍藍底色、暮光藍與矢車菊冰藍光澤',
    descriptionEn: 'Deep navy canvas (#091540), dusk blue & cornflower ice (#7692FF / #ABD2FA)',
    primaryColor: '#7692FF',
    secondaryColor: '#1B2CC1',
    bgColor: '#091540',
    isDark: true,
    emoji: '🌌',
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

const STORAGE_KEY = 'brewlog_app_theme_v3';

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
    const selected = THEMES.find((t) => t.id === theme);
    if (selected && !selected.isDark) {
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
