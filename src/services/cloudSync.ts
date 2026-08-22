import { BrewLog, CoffeeBean } from '../types/coffee';
import { getSupabase } from './supabaseClient';

export interface DbBeanRow {
  id: string;
  user_id: string;
  name: string;
  origin: string;
  region: string | null;
  farm_or_station: string | null;
  varietal: string | null;
  process: string;
  roaster: string;
  roast_level: string;
  roast_date: string;
  tasting_notes_package: string[];
  total_weight_grams: number;
  remaining_weight_grams: number;
  golden_log_id: string | null;
  elevation_meters: string | null;
  density: string | null;
  price: number | null;
  currency: string | null;
  rating: number | null;
  status: string;
  notes: string | null;
  created_at?: string;
  updated_at?: string;
}

export interface DbBrewLogRow {
  id: string;
  user_id: string;
  bean_id: string;
  brew_date: string;
  days_off_roast: number;
  dripper: string;
  filter_paper: string | null;
  grinder: string;
  grind_setting: string;
  dose_grams: number;
  water_grams: number;
  ratio: number;
  water_temp_celsius: number;
  water_type: string | null;
  bloom_water_grams: number | null;
  bloom_duration_seconds: number | null;
  stages: any[];
  total_time_seconds: number;
  drawdown_time_seconds: number | null;
  tds_percent: number | null;
  extraction_yield_percent: number | null;
  sensory: any;
  flavor_tags: string[];
  extraction_assessment: string;
  dialin_adjustment_notes: string | null;
  overall_score: number;
  is_golden: boolean;
  notes: string | null;
  created_at?: string;
}

export function beanToRow(bean: CoffeeBean, userId: string): DbBeanRow {
  return {
    id: bean.id,
    user_id: userId,
    name: bean.name,
    origin: bean.origin,
    region: bean.region || null,
    farm_or_station: bean.farmOrStation || null,
    varietal: bean.varietal || null,
    process: bean.process,
    roaster: bean.roaster,
    roast_level: bean.roastLevel,
    roast_date: bean.roastDate,
    tasting_notes_package: bean.tastingNotesPackage || [],
    total_weight_grams: bean.totalWeightGrams,
    remaining_weight_grams: bean.remainingWeightGrams,
    golden_log_id: bean.goldenLogId || null,
    elevation_meters: bean.elevationMeters || null,
    density: bean.density || null,
    price: bean.price || null,
    currency: bean.currency || 'TWD',
    rating: bean.rating || null,
    status: bean.status,
    notes: bean.notes || null,
    created_at: bean.createdAt,
  };
}

export function rowToBean(row: DbBeanRow): CoffeeBean {
  return {
    id: row.id,
    name: row.name,
    origin: row.origin,
    region: row.region || '',
    farmOrStation: row.farm_or_station || undefined,
    varietal: row.varietal || '',
    process: row.process as any,
    roaster: row.roaster,
    roastLevel: row.roast_level as any,
    roastDate: row.roast_date,
    tastingNotesPackage: row.tasting_notes_package || [],
    totalWeightGrams: Number(row.total_weight_grams),
    remainingWeightGrams: Number(row.remaining_weight_grams),
    goldenLogId: row.golden_log_id || undefined,
    elevationMeters: row.elevation_meters || undefined,
    density: (row.density as any) || undefined,
    price: row.price ? Number(row.price) : undefined,
    currency: row.currency || 'TWD',
    rating: row.rating ? Number(row.rating) : undefined,
    status: row.status as any,
    notes: row.notes || undefined,
    createdAt: row.created_at || new Date().toISOString(),
  };
}

export function logToRow(log: BrewLog, userId: string): DbBrewLogRow {
  return {
    id: log.id,
    user_id: userId,
    bean_id: log.beanId,
    brew_date: log.brewDate,
    days_off_roast: log.daysOffRoast,
    dripper: log.dripper,
    filter_paper: log.filterPaper || null,
    grinder: log.grinder,
    grind_setting: log.grindSetting,
    dose_grams: log.doseGrams,
    water_grams: log.waterGrams,
    ratio: log.ratio,
    water_temp_celsius: log.waterTempCelsius,
    water_type: log.waterType || null,
    bloom_water_grams: log.bloomWaterGrams || null,
    bloom_duration_seconds: log.bloomDurationSeconds || null,
    stages: log.stages || [],
    total_time_seconds: log.totalTimeSeconds,
    drawdown_time_seconds: log.drawdownTimeSeconds || null,
    tds_percent: log.tdsPercent || null,
    extraction_yield_percent: log.extractionYieldPercent || null,
    sensory: log.sensory,
    flavor_tags: log.flavorTags || [],
    extraction_assessment: log.extractionAssessment,
    dialin_adjustment_notes: log.dialinAdjustmentNotes || null,
    overall_score: log.overallScore,
    is_golden: log.isGolden,
    notes: log.notes || null,
  };
}

export function rowToLog(row: DbBrewLogRow): BrewLog {
  return {
    id: row.id,
    beanId: row.bean_id,
    brewDate: row.brew_date,
    daysOffRoast: row.days_off_roast,
    dripper: row.dripper,
    filterPaper: row.filter_paper || undefined,
    grinder: row.grinder,
    grindSetting: row.grind_setting,
    doseGrams: Number(row.dose_grams),
    waterGrams: Number(row.water_grams),
    ratio: Number(row.ratio),
    waterTempCelsius: Number(row.water_temp_celsius),
    waterType: row.water_type || undefined,
    bloomWaterGrams: row.bloom_water_grams ? Number(row.bloom_water_grams) : 0,
    bloomDurationSeconds: row.bloom_duration_seconds ? Number(row.bloom_duration_seconds) : 0,
    stages: row.stages || [],
    totalTimeSeconds: Number(row.total_time_seconds),
    drawdownTimeSeconds: row.drawdown_time_seconds ? Number(row.drawdown_time_seconds) : undefined,
    tdsPercent: row.tds_percent ? Number(row.tds_percent) : undefined,
    extractionYieldPercent: row.extraction_yield_percent ? Number(row.extraction_yield_percent) : undefined,
    sensory: row.sensory,
    flavorTags: row.flavor_tags || [],
    extractionAssessment: row.extraction_assessment as any,
    dialinAdjustmentNotes: row.dialin_adjustment_notes || undefined,
    overallScore: Number(row.overall_score),
    isGolden: Boolean(row.is_golden),
    notes: row.notes || undefined,
  };
}

export async function fetchRemoteData(userId: string): Promise<{
  beans: CoffeeBean[];
  logs: BrewLog[];
  error: Error | null;
}> {
  const supabase = getSupabase();
  if (!supabase) return { beans: [], logs: [], error: new Error('Supabase client not available') };

  try {
    const [beansRes, logsRes] = await Promise.all([
      supabase.from('beans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('brew_logs').select('*').eq('user_id', userId).order('brew_date', { ascending: false }),
    ]);

    if (beansRes.error) throw beansRes.error;
    if (logsRes.error) throw logsRes.error;

    const beans = (beansRes.data || []).map(rowToBean);
    const logs = (logsRes.data || []).map(rowToLog);

    return { beans, logs, error: null };
  } catch (err: any) {
    console.error('Error fetching data from Supabase:', err);
    return { beans: [], logs: [], error: err };
  }
}

export async function upsertBeanRemote(bean: CoffeeBean, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const row = beanToRow(bean, userId);
    const { error } = await supabase.from('beans').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upsert bean to Supabase:', err);
    return false;
  }
}

export async function deleteBeanRemote(beanId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('beans').delete().eq('id', beanId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete bean from Supabase:', err);
    return false;
  }
}

export async function upsertLogRemote(log: BrewLog, userId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const row = logToRow(log, userId);
    const { error } = await supabase.from('brew_logs').upsert(row, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to upsert log to Supabase:', err);
    return false;
  }
}

export async function deleteLogRemote(logId: string): Promise<boolean> {
  const supabase = getSupabase();
  if (!supabase) return false;

  try {
    const { error } = await supabase.from('brew_logs').delete().eq('id', logId);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Failed to delete log from Supabase:', err);
    return false;
  }
}

export async function migrateAllLocalToCloud(
  beans: CoffeeBean[],
  logs: BrewLog[],
  userId: string
): Promise<{ success: boolean; count: number; error?: string }> {
  const supabase = getSupabase();
  if (!supabase) return { success: false, count: 0, error: 'Supabase client not initialized' };

  try {
    const beanRows = beans.map((b) => beanToRow(b, userId));
    const logRows = logs.map((l) => logToRow(l, userId));

    if (beanRows.length > 0) {
      const { error: bErr } = await supabase.from('beans').upsert(beanRows, { onConflict: 'id' });
      if (bErr) throw bErr;
    }

    if (logRows.length > 0) {
      const { error: lErr } = await supabase.from('brew_logs').upsert(logRows, { onConflict: 'id' });
      if (lErr) throw lErr;
    }

    return { success: true, count: beanRows.length + logRows.length };
  } catch (err: any) {
    console.error('Failed to migrate local data to cloud:', err);
    return { success: false, count: 0, error: err.message };
  }
}
