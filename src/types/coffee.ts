export type ProcessMethod =
  | 'Washed'
  | 'Natural'
  | 'Honey'
  | 'Anaerobic'
  | 'Thermal Shock'
  | 'Carbonic Maceration'
  | 'Wet Hulled'
  | 'Experimental'
  | 'Other';

export type RoastLevel =
  | 'Light'
  | 'Light-Medium'
  | 'Medium'
  | 'Medium-Dark'
  | 'Dark';

export type BeanStatus = 'resting' | 'active' | 'finished';

export interface CoffeeBean {
  id: string;
  name: string;
  origin: string;
  region: string;
  farmOrStation?: string;
  varietal: string;
  process: ProcessMethod;
  roaster: string;
  roastLevel: RoastLevel;
  roastDate: string; // YYYY-MM-DD
  tastingNotesPackage: string[];
  totalWeightGrams: number;
  remainingWeightGrams: number;
  goldenLogId?: string; // ID of the dialed-in "God Shot / Golden Brew"
  elevationMeters?: string;
  density?: 'High' | 'Medium' | 'Low';
  price?: number;
  currency?: string;
  rating?: number; // 1-5
  status: BeanStatus;
  notes?: string;
  createdAt: string;
}

export type PourTechnique =
  | 'center'
  | 'spiral'
  | 'gentle'
  | 'high-flow'
  | 'pulse'
  | 'bypass'
  | 'osmotic';

export interface PourStage {
  id: string;
  name: string;
  targetWaterGrams: number; // Cumulative water weight at end of stage
  pourWaterGrams: number; // Water added during this stage
  startTimeSeconds: number; // Stage start time
  durationSeconds: number; // Planned duration for this pour
  technique: PourTechnique;
  description?: string;
}

export interface SensoryProfile {
  acidity: number; // 1-10
  sweetness: number; // 1-10
  body: number; // 1-10
  clarity: number; // 1-10
  balance: number; // 1-10
  aftertaste: number; // 1-10
  bitterness: number; // 1-10
  acidityQuality?: 'Bright/Citrus' | 'Juicy/Berry' | 'Malic/Crisp' | 'Sharp/Sour' | 'Muted';
  sweetnessQuality?: 'Brown Sugar' | 'Honey' | 'Fruit Nectar' | 'Caramel' | 'Weak';
  bodyQuality?: 'Tea-like' | 'Silky' | 'Round' | 'Syrupy' | 'Thin/Watery' | 'Astringent';
}

export type ExtractionAssessment =
  | 'under_extracted'
  | 'balanced_sweet'
  | 'over_extracted'
  | 'channeling';

export interface BrewLog {
  id: string;
  beanId: string;
  brewDate: string; // ISO string
  daysOffRoast: number;
  dripper: string;
  filterPaper?: string;
  grinder: string;
  grindSetting: string; // e.g. "24 clicks", "7.5", "Medium-Fine"
  doseGrams: number;
  waterGrams: number;
  ratio: number; // e.g. 15.0 -> 1:15
  waterTempCelsius: number;
  waterType?: string;
  bloomWaterGrams: number;
  bloomDurationSeconds: number;
  stages: PourStage[];
  totalTimeSeconds: number;
  drawdownTimeSeconds?: number;
  tdsPercent?: number; // Optional refractometer reading
  extractionYieldPercent?: number; // Auto calculated: (TDS * BeverageWeight) / Dose
  sensory: SensoryProfile;
  flavorTags: string[];
  extractionAssessment: ExtractionAssessment;
  dialinAdjustmentNotes?: string;
  overallScore: number; // 1 - 10
  isGolden: boolean;
  notes?: string;
}

export interface DialinRecommendation {
  action: string;
  parameter: 'grind' | 'temp' | 'ratio' | 'pour' | 'agitation' | 'water';
  direction: 'finer' | 'coarser' | 'higher' | 'lower' | 'faster' | 'slower' | 'gentler' | 'more' | 'less' | 'fewer' | 'optimal';
  description: string;
  rationale: string;
}

export interface DialinDiagnosis {
  state: ExtractionAssessment;
  title: string;
  severity: 'optimal' | 'mild' | 'moderate' | 'severe';
  summary: string;
  symptoms: string[];
  recommendations: DialinRecommendation[];
}

export interface RecipePreset {
  id: string;
  name: string;
  author: string;
  description: string;
  dripper: string;
  defaultDoseGrams: number;
  defaultWaterGrams: number;
  defaultTempCelsius: number;
  defaultGrindSetting: string;
  stages: {
    name: string;
    targetWaterPercent: number; // Percentage of total water (0 - 100)
    pourWaterPercent: number;
    startTimeSeconds: number;
    durationSeconds: number;
    technique: PourTechnique;
    description: string;
  }[];
}

export interface DripperPreset {
  id: string;
  name: string;
  type: 'conical' | 'flat_bottom' | 'trapezoid' | 'immersion' | 'hybrid';
  material?: string;
  recommendedFilters: string[];
  characteristics: string;
}
