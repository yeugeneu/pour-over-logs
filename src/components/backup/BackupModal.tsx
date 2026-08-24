import React, { useRef, useState } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useTheme, THEMES } from '../../context/ThemeContext';
import { useI18n } from '../../i18n';
import { exportBackupJSON, exportLogsToCSV, parseAndValidateBackupJSON } from '../../utils/exportUtils';
import { Database, Download, FileSpreadsheet, RotateCcw, Upload, CheckCircle2, AlertCircle, HardDrive, Palette } from 'lucide-react';

export const BackupModal: React.FC = () => {
  const { beans, logs, resetToSampleData, restoreFromBackup } = useCoffee();
  const { theme, setTheme, openThemeModal, currentThemeInfo } = useTheme();
  const { language, t } = useI18n();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);

  const handleExportJSON = () => {
    exportBackupJSON(beans, logs);
    setFeedback({
      type: 'success',
      message: language === 'zh-TW' ? '已成功下載 JSON 備份檔！' : 'JSON backup downloaded successfully!',
    });
  };

  const handleExportCSV = () => {
    exportLogsToCSV(beans, logs);
    setFeedback({
      type: 'success',
      message: language === 'zh-TW' ? '已成功匯出 CSV 紀錄表格！' : 'CSV session log exported successfully!',
    });
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const parsed = parseAndValidateBackupJSON(content);

      if (parsed.success && parsed.beans && parsed.logs) {
        restoreFromBackup(parsed.beans, parsed.logs);
        setFeedback({
          type: 'success',
          message: `${language === 'zh-TW' ? '已成功還原' : 'Restored'} ${parsed.beans.length} ${
            language === 'zh-TW' ? '支咖啡豆與' : 'beans and'
          } ${parsed.logs.length} ${language === 'zh-TW' ? '筆沖煮日誌！' : 'brew logs!'}`,
        });
      } else {
        setFeedback({
          type: 'error',
          message: parsed.error || t.backup.importError,
        });
      }
    };
    reader.readAsText(file);
    // Reset file input
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const handleResetSample = () => {
    if (window.confirm(t.backup.confirmReset)) {
      resetToSampleData();
      setFeedback({
        type: 'success',
        message: language === 'zh-TW' ? '已重置為官方精品豆範例資料！' : 'Reset to sample specialty coffees!',
      });
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-stone-950 via-stone-900 to-stone-950 p-6 rounded-3xl border border-stone-800 shadow-sm space-y-2">
        <div className="flex items-center space-x-2">
          <span className="p-1.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Database className="w-4 h-4" />
          </span>
          <h1 className="text-xl sm:text-2xl font-black text-stone-100 tracking-tight">
            {t.backup.title}
          </h1>
        </div>
        <p className="text-xs sm:text-sm text-stone-400 max-w-2xl leading-relaxed">
          {language === 'zh-TW'
            ? '本系統採用 Local-First 架構，所有資料安全儲存於您的瀏覽器本地，支援 100% 離線使用。建議定期下載 JSON 備份以防瀏覽器清除快取。'
            : 'BrewLog is local-first. All data is saved securely in your browser and works 100% offline. Export regular backups for peace of mind.'}
        </p>
      </div>

      {/* Feedback Banner */}
      {feedback && (
        <div
          className={`p-4 rounded-2xl border flex items-center space-x-3 text-xs sm:text-sm animate-fade-in ${
            feedback.type === 'success'
              ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
              : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
          }`}
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0" />
          ) : (
            <AlertCircle className="w-5 h-5 text-rose-400 shrink-0" />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Stats Card */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <HardDrive className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-stone-400 uppercase">{t.app.totalBeans}</div>
            <div className="text-lg font-bold font-mono text-stone-100">{beans.length} 支</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
            <Database className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-stone-400 uppercase">{t.app.brewsLogged}</div>
            <div className="text-lg font-bold font-mono text-stone-100">{logs.length} 筆</div>
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-stone-900/80 border border-stone-800 flex items-center space-x-3">
          <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <CheckCircle2 className="w-5 h-5" />
          </div>
          <div>
            <div className="text-[11px] text-stone-400 uppercase">儲存狀態 (Storage)</div>
            <div className="text-xs font-bold text-emerald-400">已啟用離線本機儲存</div>
          </div>
        </div>
      </div>

      {/* Backup & Export Action Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Visual Theme Card */}
        <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3 flex flex-col justify-between md:col-span-2">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="space-y-1">
              <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
                <Palette className="w-4 h-4" />
                <span>{language === 'zh-TW' ? '🎨 視覺風格主題 (Visual Themes)' : '🎨 App Visual Theme'}</span>
              </div>
              <p className="text-xs text-stone-400">
                {language === 'zh-TW'
                  ? `當前風格：${currentThemeInfo.nameZh} (${currentThemeInfo.emoji}) • ${currentThemeInfo.descriptionZh}`
                  : `Active Theme: ${currentThemeInfo.nameEn} (${currentThemeInfo.emoji}) • ${currentThemeInfo.descriptionEn}`}
              </p>
            </div>

            <button
              type="button"
              onClick={openThemeModal}
              className="py-2 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition shrink-0"
            >
              {language === 'zh-TW' ? '更換主題' : 'Change Theme'}
            </button>
          </div>

          {/* Light Themes */}
          <div className="space-y-1.5 pt-1">
            <div className="text-[11px] font-semibold text-amber-400 flex items-center gap-1">
              <span>☀️ {language === 'zh-TW' ? '明亮晨光主題 (Light Mode)' : 'Light Mode Themes'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-2">
              {THEMES.filter((t) => t.mode === 'light').map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition flex flex-col gap-1.5 ${
                    theme === t.id
                      ? 'border-amber-500 bg-amber-500/10 font-bold text-amber-300 ring-1 ring-amber-500/30'
                      : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t.emoji}</span>
                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.primaryColor }} />
                  </div>
                  <span className="truncate text-[11px] font-medium">{language === 'zh-TW' ? t.nameZh.replace(/\s*\([^)]*\)/, '') : t.nameEn.replace(/\s*\([^)]*\)/, '')}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Dark Themes */}
          <div className="space-y-1.5 pt-2">
            <div className="text-[11px] font-semibold text-stone-400 flex items-center gap-1">
              <span>🌙 {language === 'zh-TW' ? '夜間風味主題 (Dark Mode)' : 'Dark Mode Themes'}</span>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-9 gap-2">
              {THEMES.filter((t) => t.mode === 'dark').map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTheme(t.id)}
                  className={`p-2.5 rounded-xl border text-xs text-left transition flex flex-col gap-1.5 ${
                    theme === t.id
                      ? 'border-amber-500 bg-amber-500/10 font-bold text-amber-300 ring-1 ring-amber-500/30'
                      : 'border-stone-800 bg-stone-950/60 text-stone-400 hover:border-stone-700'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span>{t.emoji}</span>
                    <div className="w-3 h-3 rounded-full border border-white/20" style={{ backgroundColor: t.primaryColor }} />
                  </div>
                  <span className="truncate text-[11px] font-medium">{language === 'zh-TW' ? t.nameZh.replace(' (Dark)', '').replace(' (Deep Navy & Ice)', '') : t.nameEn.replace(' (Dark)', '')}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Export JSON Card */}
        <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-amber-400 font-bold text-sm">
              <Download className="w-4 h-4" />
              <span>{t.backup.exportJson}</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              下載包含所有咖啡豆履歷、神參數設定與歷史日誌的單一 JSON 備份檔。
            </p>
          </div>

          <button
            onClick={handleExportJSON}
            className="w-full py-2.5 px-4 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition"
          >
            {t.backup.exportJson}
          </button>
        </div>

        {/* Export CSV Card */}
        <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-emerald-400 font-bold text-sm">
              <FileSpreadsheet className="w-4 h-4" />
              <span>{t.backup.exportCsv}</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              匯出成標準 CSV 格式，可直接以 Microsoft Excel、Numbers 或 Google Sheets 進行數據分析。
            </p>
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 transition"
          >
            {t.backup.exportCsv}
          </button>
        </div>

        {/* Import JSON Card */}
        <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-blue-400 font-bold text-sm">
              <Upload className="w-4 h-4" />
              <span>{t.backup.importJson}</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              從先前匯出的 JSON 檔案還原咖啡豆與沖煮日誌（跨裝置同步使用）。
            </p>
          </div>

          <div>
            <input
              type="file"
              accept=".json"
              ref={fileInputRef}
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 transition"
            >
              {t.backup.importJson}
            </button>
          </div>
        </div>

        {/* Reset to Sample Data Card */}
        <div className="p-5 rounded-3xl bg-stone-900/90 border border-stone-800 space-y-3 flex flex-col justify-between">
          <div className="space-y-1">
            <div className="flex items-center space-x-2 text-stone-400 font-bold text-sm">
              <RotateCcw className="w-4 h-4" />
              <span>{t.backup.resetSample}</span>
            </div>
            <p className="text-xs text-stone-400 leading-relaxed">
              重置為包含巴拿馬藝伎、衣索比亞沃卡與哥倫比亞粉紅波旁的官方範例數據庫。
            </p>
          </div>

          <button
            onClick={handleResetSample}
            className="w-full py-2.5 px-4 rounded-xl bg-stone-800 hover:bg-rose-950/40 text-stone-400 hover:text-rose-300 font-bold text-xs border border-stone-800 transition"
          >
            {t.backup.resetSample}
          </button>
        </div>
      </div>
    </div>
  );
};
