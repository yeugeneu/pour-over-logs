import { BrewLog, DialinDiagnosis, DialinRecommendation, SensoryProfile } from '../types/coffee';

/**
 * Expert Dial-in Diagnostic Engine
 * Analyzes sensory notes, brew time, extraction yield, and parameters to diagnose
 * extraction balance and offer precise barista-level adjustment suggestions for the next brew.
 */
export function diagnoseExtraction(log: Partial<BrewLog>): DialinDiagnosis {
  const sensory: SensoryProfile = log.sensory || {
    acidity: 5,
    sweetness: 5,
    body: 5,
    clarity: 5,
    balance: 5,
    aftertaste: 5,
    bitterness: 5,
  };

  const tags = log.flavorTags || [];
  const tagsLower = tags.map((t) => t.toLowerCase());

  const dose = log.doseGrams || 15;
  const totalTime = log.totalTimeSeconds || 150;
  const temp = log.waterTempCelsius || 92;
  const ratio = log.ratio || 15;
  const ey = log.extractionYieldPercent;

  // Symptom Flags
  const hasSourTags = tagsLower.some((t) =>
    ['尖酸', '死酸', '生澀', '青草', '花生', 'sour', 'sharp', 'vegetal', 'grassy', 'salty', 'lemon peel'].includes(t)
  );
  const hasBitterDryTags = tagsLower.some((t) =>
    ['苦澀', '乾澀', '焦苦', '刮喉', '燥感', 'bitter', 'astringent', 'dry', 'harsh', 'ashy', 'burnt', 'woody'].includes(t)
  );
  const hasHollowTags = tagsLower.some((t) =>
    ['空洞', '單薄', '水感', '薄弱', 'hollow', 'watery', 'thin'].includes(t)
  );

  const isFastFlow = totalTime < (dose <= 15 ? 115 : 140);
  const isSlowFlow = totalTime > (dose <= 15 ? 200 : 230);

  const underExtractionScore =
    (sensory.acidity >= 7 ? 2 : sensory.acidity >= 6 ? 1 : 0) +
    (sensory.sweetness <= 4 ? 2 : sensory.sweetness <= 5 ? 1 : 0) +
    (sensory.body <= 4 ? 1 : 0) +
    (hasSourTags ? 3 : 0) +
    (hasHollowTags ? 1 : 0) +
    (isFastFlow ? 1.5 : 0) +
    (ey !== undefined && ey < 18 ? 2 : 0);

  const overExtractionScore =
    (sensory.bitterness >= 6 ? 2.5 : sensory.bitterness >= 5 ? 1 : 0) +
    (sensory.aftertaste <= 4 ? 2 : sensory.aftertaste <= 5 ? 1 : 0) +
    (hasBitterDryTags ? 3 : 0) +
    (isSlowFlow ? 1.5 : 0) +
    (ey !== undefined && ey > 22 ? 2 : 0);

  const channelingScore =
    (sensory.acidity >= 7 && sensory.bitterness >= 5 ? 3 : 0) +
    (hasSourTags && hasBitterDryTags ? 3 : 0) +
    (sensory.clarity <= 4 ? 1.5 : 0) +
    (sensory.balance <= 4 ? 1.5 : 0);

  const recommendations: DialinRecommendation[] = [];
  const symptoms: string[] = [];

  // Determine Primary Diagnosis
  if (channelingScore >= 3.5) {
    // Channeling / Uneven extraction
    if (hasSourTags) symptoms.push('尖酸與未萃取前段風味');
    if (hasBitterDryTags) symptoms.push('尾段出現乾澀或刮喉苦感');
    symptoms.push('酸苦並存、風味分離且缺乏甜感與平衡度');
    if (sensory.clarity <= 4) symptoms.push('乾淨度較低，口感混濁');

    recommendations.push({
      action: '調整注水手法與水流衝擊力',
      parameter: 'pour',
      direction: 'gentler',
      description: '注水壺嘴貼近粉層表面，以細柔中心水流螺旋向外，避免猛烈衝擊或大水流直接沖刷濾杯邊緣。',
      rationale: '過強的水流會沖破粉層形成孔洞（通道），導致部分咖啡過萃、部分未萃。',
    });

    recommendations.push({
      action: '改善悶蒸排氣與粉層潤濕均勻度',
      parameter: 'agitation',
      direction: 'more',
      description: '悶蒸注水以 2.5~3 倍粉量（約 40-45g），注水後可輕柔晃動濾杯（Swirl）或用攪拌棒十字撥勻，確保所有粉粒吸水均勻。',
      rationale: '底層或中心乾粉結塊是手沖產生通道效應的最常見主因。',
    });

    recommendations.push({
      action: '微調磨豆機刻度',
      parameter: 'grind',
      direction: 'coarser',
      description: '若細粉過多造成局部堵塞，建議稍微調粗半格至 1 格，提高水流通暢度。',
      rationale: '減少極細粉（Fines）產生的局部淤積與微通道。',
    });

    return {
      state: 'channeling',
      severity: channelingScore >= 5 ? 'severe' : 'moderate',
      title: '通道效應與萃取不均 (Channeling Detected)',
      summary: '咖啡中同時出現刺激的尖酸與不悅的乾澀苦味，代表水流在粉層中局部走快捷通道，造成局部過萃同時大部分粉粒萃取不足。',
      symptoms,
      recommendations,
    };
  }

  if (overExtractionScore >= 3.0 && overExtractionScore > underExtractionScore) {
    // Over-extraction
    if (sensory.bitterness >= 6) symptoms.push(`苦味偏高 (${sensory.bitterness}/10)`);
    if (hasBitterDryTags) symptoms.push('尾韻出現乾澀、木質、燥感或焦苦味');
    if (isSlowFlow) symptoms.push(`總沖煮時間偏長 (${Math.floor(totalTime / 60)}分${totalTime % 60}秒)，下水停滯`);
    if (ey && ey > 22) symptoms.push(`萃取率偏高 (${ey}%)`);

    recommendations.push({
      action: '將磨豆機刻度調粗',
      parameter: 'grind',
      direction: 'coarser',
      description: '將磨豆機刻度調粗 1 至 2 格（如 C40 +1~2 clicks，K-Ultra +0.3~0.5 圈）。',
      rationale: '調粗顆粒可減少咖啡接觸面積與減緩萃取速率，大幅降低苦澀與焦燥感提取。',
    });

    if (temp >= 92) {
      recommendations.push({
        action: '適度調降沖煮水溫',
        parameter: 'temp',
        direction: 'lower',
        description: `將水溫從 ${temp}°C 降至 ${Math.max(88, temp - 2)}°C ~ ${Math.max(86, temp - 3)}°C。`,
        rationale: '高水溫會加速後段不易揮發的苦味大分子（如綠原酸內酯）溶出。',
      });
    }

    recommendations.push({
      action: '減少注水段數或降低擾動',
      parameter: 'pour',
      direction: 'fewer',
      description: '將四至五段注水簡化為三段（例如 悶蒸 -> 大水量主注水 -> 尾段收斂），並輕柔注水。',
      rationale: '減少多次破壞粉層造成的微細粉下沉堵塞，縮短後段浸泡時間。',
    });

    return {
      state: 'over_extracted',
      severity: overExtractionScore >= 5 ? 'severe' : 'moderate',
      title: '過度萃取與苦澀雜味 (Over-Extracted)',
      summary: '萃取過深，溶出了咖啡後段的重分子苦澀物與木質燥感，掩蓋了原本明亮的產區花果香氣。',
      symptoms,
      recommendations,
    };
  }

  if (underExtractionScore >= 3.0) {
    // Under-extraction
    if (sensory.acidity >= 7) symptoms.push(`酸質尖銳或不成熟 (${sensory.acidity}/10)`);
    if (sensory.sweetness <= 4) symptoms.push(`甜感匱乏 (${sensory.sweetness}/10)`);
    if (sensory.body <= 4) symptoms.push('醇厚度單薄、口感空洞缺乏支撐');
    if (hasSourTags) symptoms.push('帶有檸檬酸、鹹感或青草生味');
    if (isFastFlow) symptoms.push(`流速過快 (${Math.floor(totalTime / 60)}分${totalTime % 60}秒)`);
    if (ey && ey < 18) symptoms.push(`萃取率偏低 (${ey}%)`);

    recommendations.push({
      action: '將磨豆機刻度調細',
      parameter: 'grind',
      direction: 'finer',
      description: '將磨豆機刻度調細 1 至 2 格，增加咖啡顆粒比表面積並延長水流接觸時間。',
      rationale: '有助於充分萃取中後段的糖分與大分子芳香酯類，將尖酸轉化為甜美多汁。',
    });

    if (temp <= 92) {
      recommendations.push({
        action: '提升沖煮水溫',
        parameter: 'temp',
        direction: 'higher',
        description: `將水溫從 ${temp}°C 提升至 ${Math.min(96, temp + 2)}°C ~ ${Math.min(96, temp + 3)}°C。`,
        rationale: '淺焙豆密度高且細胞壁緊密，較高水溫能顯著激發芳香與糖質溶出。',
      });
    }

    if (ratio < 16) {
      recommendations.push({
        action: '微幅拉大粉水比',
        parameter: 'ratio',
        direction: 'higher',
        description: `將粉水比從 1:${ratio} 調整至 1:${(ratio + 0.5).toFixed(1)} ~ 1:16。`,
        rationale: '更多水量流經粉層能提升總萃取率（EY%），使風味層次更加展開。',
      });
    }

    return {
      state: 'under_extracted',
      severity: underExtractionScore >= 5 ? 'severe' : 'moderate',
      title: '萃取不足與尖酸單薄 (Under-Extracted)',
      summary: '只萃取出前段快速溶出的有機酸與鹽類，尚未充分釋放中後段的焦糖化糖分與醇厚物質，導致風味尖銳且單薄。',
      symptoms,
      recommendations,
    };
  }

  // Optimal extraction
  symptoms.push('甜感與酸質融合極佳');
  symptoms.push('口感乾淨絲滑，餘韻綿長');
  if (sensory.balance >= 8) symptoms.push(`平衡度優秀 (${sensory.balance}/10)`);

  recommendations.push({
    action: '保存並標記為神參數 (Golden Recipe)',
    parameter: 'water',
    direction: 'optimal',
    description: '此套參數已完美擊中該豆的最佳萃取甜蜜點！建議標記為「神參數」以供日後一鍵帶入。',
    rationale: '已達到甜度、酸質立體度、乾淨度與餘韻的最佳平衡。',
  });

  return {
    state: 'balanced_sweet',
    severity: 'optimal',
    title: '完美萃取甜蜜點 (Balanced & Dialed-in)',
    summary: '恭喜！這杯手沖展現了豐富飽滿的產區個性，酸甜平衡極佳，層次分明且餘韻悠長。',
    symptoms,
    recommendations,
  };
}
