import { DripperPreset, RecipePreset } from '../types/coffee';

export const RECIPE_PRESETS: RecipePreset[] = [
  {
    id: '4-6-method',
    name: '粕谷哲 4:6 法 (Tetsu Kasuya 4:6 Method)',
    author: 'Tetsu Kasuya (2016 WBrC Champion)',
    description: '前 40% 水量決定酸甜平衡（前小後大多甜，前大後小多酸），後 60% 水量分成 3 等分調整醇厚度與濃度。',
    dripper: 'Hario V60 / Origami',
    defaultDoseGrams: 20,
    defaultWaterGrams: 300,
    defaultTempCelsius: 91,
    defaultGrindSetting: 'Coarse (粗研磨, 如 C40 28-30 clicks)',
    stages: [
      {
        name: '第一段：悶蒸 (酸甜開端)',
        targetWaterPercent: 16.7, // 50g of 300g
        pourWaterPercent: 16.7,
        startTimeSeconds: 0,
        durationSeconds: 45,
        technique: 'spiral',
        description: '以中心向外螺旋注水，等待至 45 秒完全下水。',
      },
      {
        name: '第二段：前段平衡 (強化甜感)',
        targetWaterPercent: 40.0, // 120g
        pourWaterPercent: 23.3, // 70g
        startTimeSeconds: 45,
        durationSeconds: 45,
        technique: 'spiral',
        description: '注水至 120g，等待水位完全下降至粉層（約 1:30）。',
      },
      {
        name: '第三段：濃度構建 1',
        targetWaterPercent: 60.0, // 180g
        pourWaterPercent: 20.0, // 60g
        startTimeSeconds: 90,
        durationSeconds: 45,
        technique: 'center',
        description: '穩定中心注水至 180g，等待完全濾乾。',
      },
      {
        name: '第四段：濃度構建 2',
        targetWaterPercent: 80.0, // 240g
        pourWaterPercent: 20.0, // 60g
        startTimeSeconds: 135,
        durationSeconds: 45,
        technique: 'center',
        description: '注水至 240g，等待完全濾乾。',
      },
      {
        name: '第五段：尾段收尾',
        targetWaterPercent: 100.0, // 300g
        pourWaterPercent: 20.0, // 60g
        startTimeSeconds: 180,
        durationSeconds: 45,
        technique: 'center',
        description: '注水至總水量 300g，等待滴濾完畢（約 3:15-3:30 移開濾杯）。',
      },
    ],
  },
  {
    id: 'hoffmann-1-cup',
    name: 'James Hoffmann 單杯 V60 法 (Hoffmann 1-Cup)',
    author: 'James Hoffmann (2007 WBC Champion)',
    description: '經典單杯 15g:250g（1:16.7），均勻擾動與平整粉床的高萃取率手法。',
    dripper: 'Hario V60 01 / Plastic V60',
    defaultDoseGrams: 15,
    defaultWaterGrams: 250,
    defaultTempCelsius: 93,
    defaultGrindSetting: 'Medium-Fine (中細研磨, 如 C40 20-22 clicks)',
    stages: [
      {
        name: '第 1 段：悶蒸與晃動 (Bloom & Swirl)',
        targetWaterPercent: 20.0, // 50g
        pourWaterPercent: 20.0,
        startTimeSeconds: 0,
        durationSeconds: 45,
        technique: 'spiral',
        description: '快速注水 50g，隨即輕輕晃動濾杯使全部粉粒均勻吸水，悶蒸至 45 秒。',
      },
      {
        name: '第 2 段：主注水至 100g (Main Pour Pt.1)',
        targetWaterPercent: 40.0, // 100g
        pourWaterPercent: 20.0,
        startTimeSeconds: 45,
        durationSeconds: 15,
        technique: 'spiral',
        description: '流速約 4-5 g/s，平穩由內向外螺旋注水至 100g。',
      },
      {
        name: '第 3 段：延展至 150g (Main Pour Pt.2)',
        targetWaterPercent: 60.0, // 150g
        pourWaterPercent: 20.0,
        startTimeSeconds: 60,
        durationSeconds: 15,
        technique: 'spiral',
        description: '持續溫和螺旋注水至 150g，維持適當液位。',
      },
      {
        name: '第 4 段：推進至 200g (Main Pour Pt.3)',
        targetWaterPercent: 80.0, // 200g
        pourWaterPercent: 20.0,
        startTimeSeconds: 75,
        durationSeconds: 15,
        technique: 'spiral',
        description: '平穩注水至 200g。',
      },
      {
        name: '第 5 段：尾段注水至 250g 與落水',
        targetWaterPercent: 100.0, // 250g
        pourWaterPercent: 20.0,
        startTimeSeconds: 90,
        durationSeconds: 20,
        technique: 'center',
        description: '注水至 250g 後，輕微晃動濾杯一次並輕敲使其平整，靜置落水完畢（約 2:30-2:45）。',
      },
    ],
  },
  {
    id: 'april-brewer-method',
    name: 'April Brewer 雙段沖煮法 (April Method)',
    author: 'Patrik Rolf (April Coffee Copenhagen)',
    description: '適合平底濾杯與淺焙咖啡，強調節奏分明、高甜感與極佳的香氣乾淨度。',
    dripper: 'April Brewer / Kalita Wave / Orea',
    defaultDoseGrams: 13,
    defaultWaterGrams: 200,
    defaultTempCelsius: 92,
    defaultGrindSetting: 'Medium-Coarse (中粗研磨, 如 C40 25-27 clicks)',
    stages: [
      {
        name: '第一段：同心圓 + 中心注水 (100g)',
        targetWaterPercent: 50.0, // 100g
        pourWaterPercent: 50.0,
        startTimeSeconds: 0,
        durationSeconds: 30,
        technique: 'spiral',
        description: '30g 快速同心圓水流 + 70g 中心細水流，30 秒內注完 100g，等待完全瀝乾。',
      },
      {
        name: '第二段：同心圓 + 中心注水 (至 200g)',
        targetWaterPercent: 100.0, // 200g
        pourWaterPercent: 50.0,
        startTimeSeconds: 60,
        durationSeconds: 30,
        technique: 'spiral',
        description: '於 1:00 開始，重複 30g 同心圓 + 70g 中心水流至 200g，總時間約 2:20 結束。',
      },
    ],
  },
  {
    id: 'lance-hedrick-low-agitation',
    name: 'Lance Hedrick 低擾動極簡法 (1-2 Pour Low Agitation)',
    author: 'Lance Hedrick (Coffee Educator)',
    description: '最大程度減少微粉在濾紙堵塞，保持極度清澈的高花果香與酸質立體感。',
    dripper: 'Origami / V60 / Flat Bottom',
    defaultDoseGrams: 15,
    defaultWaterGrams: 240,
    defaultTempCelsius: 94,
    defaultGrindSetting: 'Medium (中度研磨, 如 C40 23 clicks)',
    stages: [
      {
        name: '第一段：高水量悶蒸 (Bloom 3:1)',
        targetWaterPercent: 25.0, // 60g
        pourWaterPercent: 25.0,
        startTimeSeconds: 0,
        durationSeconds: 45,
        technique: 'spiral',
        description: '注水 60g 迅速打濕所有粉粒，輕輕旋轉濾杯，悶蒸 45 秒至 1 分鐘。',
      },
      {
        name: '第二段：單一大水流溫和注滿',
        targetWaterPercent: 100.0, // 240g
        pourWaterPercent: 75.0,
        startTimeSeconds: 45,
        durationSeconds: 40,
        technique: 'center',
        description: '貼近水面，以穩定柔和的中心細水流持續注入至 240g，避免激起粉床邊緣細粉，靜置落水完畢（約 2:15-2:45）。',
      },
    ],
  },
  {
    id: 'traditional-three-stage',
    name: '經典三段式注水 (Traditional 3-Stage)',
    author: 'Barista Standard',
    description: '通用性極高的黃金架構：悶蒸喚醒 -> 第一次延伸萃取 -> 第二次維持濃度與收斂尾韻。',
    dripper: 'Universal (通用各類濾杯)',
    defaultDoseGrams: 15,
    defaultWaterGrams: 225,
    defaultTempCelsius: 92,
    defaultGrindSetting: 'Medium (中度研磨, 如 C40 22-24 clicks)',
    stages: [
      {
        name: '第 1 段：悶蒸 (Bloom)',
        targetWaterPercent: 20.0, // 45g
        pourWaterPercent: 20.0,
        startTimeSeconds: 0,
        durationSeconds: 40,
        technique: 'spiral',
        description: '中心向外螺旋注水 45g，充分排氣釋放芳香，悶蒸 40 秒。',
      },
      {
        name: '第 2 段：主段萃取 (Main Extraction)',
        targetWaterPercent: 60.0, // 135g
        pourWaterPercent: 40.0, // 90g
        startTimeSeconds: 40,
        durationSeconds: 30,
        technique: 'spiral',
        description: '由內向外均勻旋轉注水至 135g，維持水柱垂直穩定。',
      },
      {
        name: '第 3 段：尾段注水 (Final Sweetness)',
        targetWaterPercent: 100.0, // 225g
        pourWaterPercent: 40.0, // 90g
        startTimeSeconds: 80,
        durationSeconds: 30,
        technique: 'center',
        description: '中心輕柔注水至 225g，等待液面完全濾落（約 2:00-2:20 移開）。',
      },
    ],
  },
];

export const DRIPPER_PRESETS: DripperPreset[] = [
  {
    id: 'v60',
    name: 'Hario V60 01/02',
    type: 'conical',
    material: 'Ceramic / Plastic / Glass',
    recommendedFilters: ['Cafec Abaca', 'Hario Tabbed White', 'Sibarist Fast'],
    characteristics: '大出水孔、螺旋肋骨，流速靈敏受研磨刻度控制，強調酸質明亮與層次豐富。',
  },
  {
    id: 'origami',
    name: 'Origami Dripper (摺紙濾杯)',
    type: 'conical',
    material: 'Mino Porcelain / Resin',
    recommendedFilters: ['Origami Conical', 'Kalita Wave 155/185', 'Cafec T-90'],
    characteristics: '20 條深溝槽，兼具錐形濾紙（高明亮）與蛋糕濾紙（高甜感均勻）兩種模式。',
  },
  {
    id: 'kalita-wave',
    name: 'Kalita Wave 155/185 (蛋糕濾杯)',
    type: 'flat_bottom',
    material: 'Stainless Steel / Glass / Hasami',
    recommendedFilters: ['Kalita Wave 155 / 185 Filter'],
    characteristics: '三孔平底設計，浸泡均勻不易產生通道效應，醇厚度高、甜感飽滿穩定。',
  },
  {
    id: 'april-brewer',
    name: 'April Brewer',
    type: 'flat_bottom',
    material: 'Porcelain / Glass / Plastic',
    recommendedFilters: ['April Paper Filter', 'Kalita 155'],
    characteristics: '中心凸起底座與特殊空氣通道，最大化香氣揮發與極致甜感。',
  },
  {
    id: 'orea-v3',
    name: 'Orea Brewer V3 / V4',
    type: 'flat_bottom',
    material: 'Trognon / Matte Polycarbonate',
    recommendedFilters: ['Kalita 185', 'Orea Flat Papers with Negotiator'],
    characteristics: '超大平底開口、極速下水，支援高細研磨高萃取率手法。',
  },
  {
    id: 'clever-dripper',
    name: 'Clever Dripper (聰明濾杯)',
    type: 'immersion',
    material: 'BPA-free Eastman Tritan',
    recommendedFilters: ['Mellita 102 / 104', 'Filtropa #4'],
    characteristics: '專利止水閥浸泡式手沖，萃取均勻度最高，容錯率極佳。',
  },
];

export const GRINDER_PRESETS = [
  'Comandante C40 MK4',
  '1Zpresso K-Ultra',
  '1Zpresso ZP6 Special',
  'Fellow Ode Gen 2',
  'Timemore Chestnut C3',
  'Mahlkönig EK43 / EK43S',
  'DF64 Gen 2',
  'Option-O Lagom P64',
  'Baratza Encore ESP',
  'Kingrinder K6',
];

export const FLAVOR_CATEGORIES = [
  {
    nameZh: '花香 (Floral)',
    nameEn: 'Floral',
    color: 'bg-pink-500/20 text-pink-300 border-pink-500/30',
    tags: ['茉莉花 Jasmine', '橙花 Orange Blossom', '玫瑰 Rose', '接骨木花 Elderflower', '洋甘菊 Chamomile', '百合 Lily'],
  },
  {
    nameZh: '柑橘果酸 (Citrus)',
    nameEn: 'Citrus',
    color: 'bg-yellow-500/20 text-yellow-300 border-yellow-500/30',
    tags: ['檸檬 Lemon', '佛手柑 Bergamot', '葡萄柚 Grapefruit', '黃檸檬 Meyer Lemon', '金桔 Kumquat', '萊姆 Lime'],
  },
  {
    nameZh: '莓果與核果 (Berry & Stone Fruit)',
    nameEn: 'Berry & Stone Fruit',
    color: 'bg-rose-500/20 text-rose-300 border-rose-500/30',
    tags: ['草莓 Strawberry', '藍莓 Blueberry', '黑莓 Blackberry', '白桃 White Peach', '黃金奇異果 Kiwi', '紅櫻桃 Red Cherry', '杏桃 Apricot', '李子 Plum'],
  },
  {
    nameZh: '熱帶水果 (Tropical)',
    nameEn: 'Tropical Fruit',
    color: 'bg-orange-500/20 text-orange-300 border-orange-500/30',
    tags: ['芒果 Mango', '百香果 Passion Fruit', '鳳梨 Pineapple', '荔枝 Lychee', '芭樂 Guava', '波羅蜜 Jackfruit'],
  },
  {
    nameZh: '茶感與草本 (Tea & Herbal)',
    nameEn: 'Tea & Herbal',
    color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
    tags: ['伯爵茶 Earl Grey', '烏龍茶 Oolong Tea', '綠茶 Green Tea', '紅茶 Black Tea', '薄荷 Mint', '香茅 Lemongrass'],
  },
  {
    nameZh: '甜感與堅果可可 (Sweet & Nutty)',
    nameEn: 'Sweet & Nutty',
    color: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
    tags: ['蜂蜜 Honey', '黑糖 Brown Sugar', '焦糖 Caramel', '楓糖 Maple Syrup', '榛果 Hazelnut', '杏仁 Almond', '黑巧克力 Dark Chocolate', '可可碎 Cocoa Nibs'],
  },
  {
    nameZh: '特殊發酵與酒香 (Fermented & Winey)',
    nameEn: 'Fermented & Winey',
    color: 'bg-purple-500/20 text-purple-300 border-purple-500/30',
    tags: ['蘭姆酒 Rum', '威士忌 Whisky', '紅酒 Red Wine', '熱紅酒 Mulled Wine', '酒釀 Fermented Rice', '白蘭地 Brandy', '可爾必思 Calpis'],
  },
];
