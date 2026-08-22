import { RoastLevel } from '../types/coffee';

/**
 * Calculates days between roast date and brew date (defaults to today)
 */
export function calculateDaysOffRoast(roastDateStr: string, brewDateStr?: string): number {
  if (!roastDateStr) return 0;
  const roastDate = new Date(roastDateStr);
  const brewDate = brewDateStr ? new Date(brewDateStr) : new Date();

  // Reset time portions for pure day diff
  const utc1 = Date.UTC(roastDate.getFullYear(), roastDate.getMonth(), roastDate.getDate());
  const utc2 = Date.UTC(brewDate.getFullYear(), brewDate.getMonth(), brewDate.getDate());

  const diffMs = utc2 - utc1;
  const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  return Math.max(0, days);
}

export interface RestStatusInfo {
  phase: 'too_fresh' | 'resting' | 'peak' | 'past_peak' | 'stale';
  labelZh: string;
  labelEn: string;
  badgeColor: string;
  descriptionZh: string;
  descriptionEn: string;
  minPeakDay: number;
  maxPeakDay: number;
}

/**
 * Returns specialty coffee resting status and recommendation based on roast level and days off roast.
 * Light roasts typically peak around 10-25 days; Dark roasts peak earlier (4-14 days).
 */
export function getRestingStageInfo(days: number, roastLevel: RoastLevel = 'Light'): RestStatusInfo {
  let minPeak = 10;
  let maxPeak = 28;

  switch (roastLevel) {
    case 'Light':
      minPeak = 12;
      maxPeak = 30;
      break;
    case 'Light-Medium':
      minPeak = 8;
      maxPeak = 24;
      break;
    case 'Medium':
      minPeak = 6;
      maxPeak = 20;
      break;
    case 'Medium-Dark':
      minPeak = 4;
      maxPeak = 16;
      break;
    case 'Dark':
      minPeak = 3;
      maxPeak = 14;
      break;
  }

  if (days < Math.floor(minPeak / 2)) {
    return {
      phase: 'too_fresh',
      labelZh: '新鮮排氣中',
      labelEn: 'Degassing Phase',
      badgeColor: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
      descriptionZh: '二氧化碳釋放旺盛，建議延長悶蒸或多養幾天以展現風味層次。',
      descriptionEn: 'High CO2 degassing. Suggest longer bloom or additional rest.',
      minPeakDay: minPeak,
      maxPeakDay: maxPeak,
    };
  } else if (days < minPeak) {
    return {
      phase: 'resting',
      labelZh: '養豆漸入佳境',
      labelEn: 'Resting & Opening Up',
      badgeColor: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
      descriptionZh: '風味正在展開，香氣與甜感逐漸增強。',
      descriptionEn: 'Flavors opening up, aromatics and sweetness developing.',
      minPeakDay: minPeak,
      maxPeakDay: maxPeak,
    };
  } else if (days <= maxPeak) {
    return {
      phase: 'peak',
      labelZh: '黃金賞味期',
      labelEn: 'Peak Flavor Window',
      badgeColor: 'bg-amber-500/20 text-amber-400 border-amber-500/30 ring-1 ring-amber-500/50',
      descriptionZh: '風味最為飽滿、酸甜平衡極佳的巔峰狀態！',
      descriptionEn: 'Optimal complexity, vibrant acidity, and maximum sweetness.',
      minPeakDay: minPeak,
      maxPeakDay: maxPeak,
    };
  } else if (days <= maxPeak + 14) {
    return {
      phase: 'past_peak',
      labelZh: '適飲熟豆',
      labelEn: 'Mature & Steady',
      badgeColor: 'bg-stone-500/20 text-stone-300 border-stone-500/30',
      descriptionZh: '芳香揮發物略減，但甜感與圓潤度依然維持良好。',
      descriptionEn: 'Aroma subtle decline, still sweet and rounded.',
      minPeakDay: minPeak,
      maxPeakDay: maxPeak,
    };
  } else {
    return {
      phase: 'stale',
      labelZh: '微衰退',
      labelEn: 'Fading Aromatics',
      badgeColor: 'bg-rose-500/20 text-rose-400 border-rose-500/30',
      descriptionZh: '香氣衰退較多，建議使用稍高水溫與適度攪拌提取甜感。',
      descriptionEn: 'Aromatics fading. Suggest slightly higher temp and gentle agitation.',
      minPeakDay: minPeak,
      maxPeakDay: maxPeak,
    };
  }
}

/**
 * Calculates brew ratio (e.g. 15g coffee to 225g water -> 15.0)
 */
export function calculateRatio(doseGrams: number, waterGrams: number): number {
  if (!doseGrams || doseGrams <= 0) return 0;
  return Number((waterGrams / doseGrams).toFixed(1));
}

/**
 * Calculates Extraction Yield (EY %)
 * Standard Specialty Coffee Formula:
 * Estimated Beverage Weight ≈ WaterGrams - (DoseGrams * 2.0 absorption factor)
 * EY % = (Beverage Weight * TDS %) / DoseGrams
 */
export function calculateExtractionYield(
  doseGrams: number,
  waterGrams: number,
  tdsPercent: number
): number {
  if (!doseGrams || doseGrams <= 0 || !tdsPercent || tdsPercent <= 0) return 0;
  const beverageWeight = Math.max(0, waterGrams - doseGrams * 2.0);
  const yieldPercent = (beverageWeight * tdsPercent) / doseGrams;
  return Number(yieldPercent.toFixed(2));
}

/**
 * Formats seconds into mm:ss
 */
export function formatTime(totalSeconds: number): string {
  const mins = Math.floor(totalSeconds / 60);
  const secs = Math.floor(totalSeconds % 60);
  return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
}

/**
 * Calculates flow rate in grams per second
 */
export function calculateFlowRate(waterGrams: number, durationSeconds: number): number {
  if (!durationSeconds || durationSeconds <= 0) return 0;
  return Number((waterGrams / durationSeconds).toFixed(2));
}
