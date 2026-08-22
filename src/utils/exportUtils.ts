import { BrewLog, CoffeeBean } from '../types/coffee';

export interface AppBackupData {
  version: string;
  exportedAt: string;
  beans: CoffeeBean[];
  logs: BrewLog[];
}

export function exportBackupJSON(beans: CoffeeBean[], logs: BrewLog[]): void {
  const data: AppBackupData = {
    version: '1.0',
    exportedAt: new Date().toISOString(),
    beans,
    logs,
  };

  const jsonString = JSON.stringify(data, null, 2);
  const blob = new Blob([jsonString], { type: 'application/json' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `brewlog-backup-${new Date().toISOString().slice(0, 10)}.json`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportLogsToCSV(beans: CoffeeBean[], logs: BrewLog[]): void {
  const beanMap = new Map(beans.map((b) => [b.id, b]));

  const headers = [
    'Log ID',
    'Brew Date',
    'Bean Name',
    'Origin',
    'Process',
    'Roaster',
    'Roast Level',
    'Days Off Roast',
    'Dripper',
    'Grinder',
    'Grind Setting',
    'Dose (g)',
    'Water (g)',
    'Ratio (1:X)',
    'Water Temp (°C)',
    'Total Time (s)',
    'Drawdown Time (s)',
    'TDS (%)',
    'Extraction Yield (%)',
    'Acidity (1-10)',
    'Sweetness (1-10)',
    'Body (1-10)',
    'Clarity (1-10)',
    'Balance (1-10)',
    'Aftertaste (1-10)',
    'Bitterness (1-10)',
    'Overall Score (1-10)',
    'Extraction Assessment',
    'Is Golden',
    'Flavor Tags',
    'Adjustment Notes',
  ];

  const rows = logs.map((log) => {
    const bean = beanMap.get(log.beanId);
    return [
      `"${log.id}"`,
      `"${log.brewDate.slice(0, 19).replace('T', ' ')}"`,
      `"${bean ? bean.name.replace(/"/g, '""') : 'Unknown'}"`,
      `"${bean ? bean.origin : ''}"`,
      `"${bean ? bean.process : ''}"`,
      `"${bean ? bean.roaster : ''}"`,
      `"${bean ? bean.roastLevel : ''}"`,
      log.daysOffRoast,
      `"${log.dripper || ''}"`,
      `"${log.grinder || ''}"`,
      `"${log.grindSetting || ''}"`,
      log.doseGrams,
      log.waterGrams,
      log.ratio,
      log.waterTempCelsius,
      log.totalTimeSeconds,
      log.drawdownTimeSeconds || '',
      log.tdsPercent || '',
      log.extractionYieldPercent || '',
      log.sensory.acidity,
      log.sensory.sweetness,
      log.sensory.body,
      log.sensory.clarity,
      log.sensory.balance,
      log.sensory.aftertaste,
      log.sensory.bitterness,
      log.overallScore,
      `"${log.extractionAssessment}"`,
      log.isGolden ? 'YES' : 'NO',
      `"${(log.flavorTags || []).join(', ')}"`,
      `"${(log.dialinAdjustmentNotes || '').replace(/"/g, '""')}"`,
    ];
  });

  const csvContent = '\uFEFF' + [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);

  const a = document.createElement('a');
  a.href = url;
  a.download = `brewlog-sessions-${new Date().toISOString().slice(0, 10)}.csv`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function parseAndValidateBackupJSON(jsonStr: string): {
  success: boolean;
  beans?: CoffeeBean[];
  logs?: BrewLog[];
  error?: string;
} {
  try {
    const data = JSON.parse(jsonStr);
    if (!data || typeof data !== 'object') {
      return { success: false, error: '無效的 JSON 檔案結構' };
    }

    if (!Array.isArray(data.beans) || !Array.isArray(data.logs)) {
      return { success: false, error: 'JSON 格式不符，缺少 beans 或 logs 資料陣列' };
    }

    return {
      success: true,
      beans: data.beans,
      logs: data.logs,
    };
  } catch {
    return { success: false, error: 'JSON 解析失敗，檔案可能損毀' };
  }
}
