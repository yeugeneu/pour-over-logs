import React, { useRef, useState } from 'react';
import { useI18n } from '../../i18n';
import { compressImage } from '../../utils/imageCompressor';
import {
  ExtractedBeanMetadata,
  getGeminiApiKey,
  saveGeminiApiKey,
  scanBeanBagWithAI,
} from '../../services/aiScanner';
import {
  Camera,
  Upload,
  X,
  Sparkles,
  RefreshCw,
  Check,
  Calendar,
  Key,
  Flame,
  Globe,
  Tag,
  AlertCircle,
  FileText,
} from 'lucide-react';

interface BeanScannerModalProps {
  isOpen: boolean;
  onClose: () => void;
  onApply: (data: ExtractedBeanMetadata) => void;
}

export const BeanScannerModal: React.FC<BeanScannerModalProps> = ({
  isOpen,
  onClose,
  onApply,
}) => {
  const { language, t } = useI18n();

  const [step, setStep] = useState<'upload' | 'analyzing' | 'review'>('upload');
  const [capturedImageBase64, setCapturedImageBase64] = useState<string | null>(null);
  const [imageStats, setImageStats] = useState<{ origSize: number; compSize: number } | null>(null);
  const [extractedData, setExtractedData] = useState<ExtractedBeanMetadata | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // API Key Settings Modal
  const [apiKeyInput, setApiKeyInput] = useState(getGeminiApiKey());
  const [showKeyConfig, setShowKeyConfig] = useState(!getGeminiApiKey());
  const [keySavedBanner, setKeySavedBanner] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleProcessFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setErrorMsg('請選擇圖片檔案 (JPG / PNG / WebP)');
      return;
    }

    try {
      setErrorMsg(null);
      setStep('analyzing');

      // 1. Compress image on client
      const compressed = await compressImage(file, 1280, 0.85);
      setCapturedImageBase64(compressed.base64);
      setImageStats({
        origSize: compressed.originalSizeBytes,
        compSize: compressed.compressedSizeBytes,
      });

      // 2. Send to AI Multimodal Vision API
      const result = await scanBeanBagWithAI(compressed.base64);
      setExtractedData(result);
      setStep('review');
    } catch (err: any) {
      console.error('Scan error:', err);
      setErrorMsg(err.message || t.scanner.scanError);
      setStep('upload');
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleProcessFile(file);
  };

  const handleApply = () => {
    if (extractedData) {
      onApply(extractedData);
      handleReset();
      onClose();
    }
  };

  const handleReset = () => {
    setStep('upload');
    setCapturedImageBase64(null);
    setImageStats(null);
    setExtractedData(null);
    setErrorMsg(null);
  };

  const handleSaveApiKey = (e: React.FormEvent) => {
    e.preventDefault();
    saveGeminiApiKey(apiKeyInput);
    setKeySavedBanner(true);
    setTimeout(() => {
      setKeySavedBanner(false);
      setShowKeyConfig(false);
    }, 1500);
  };

  const formatKB = (bytes: number) => `${Math.round(bytes / 1024)} KB`;
  const isKeyConfigured = Boolean(getGeminiApiKey());

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Camera className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center space-x-2">
                <h3 className="font-bold text-base sm:text-lg text-stone-100">
                  {t.scanner.scanTitle}
                </h3>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-gradient-to-r from-amber-500/20 to-orange-500/20 text-amber-300 border border-amber-500/30 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-amber-400" />
                  <span>Gemini Vision</span>
                </span>
              </div>
              <p className="text-xs text-stone-400 line-clamp-1">
                {t.scanner.scanSubtitle}
              </p>
            </div>
          </div>

          <div className="flex items-center space-x-1.5">
            <button
              onClick={() => setShowKeyConfig(!showKeyConfig)}
              className={`p-2 rounded-xl border transition flex items-center gap-1 text-xs ${
                isKeyConfigured
                  ? 'bg-stone-800/80 text-stone-400 hover:text-amber-300 border-stone-700'
                  : 'bg-amber-500/10 text-amber-400 border-amber-500/30 hover:bg-amber-500/20'
              }`}
              title="API Key Settings"
            >
              <Key className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{isKeyConfigured ? 'API Key' : '設定 Key'}</span>
            </button>
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Missing API Key Warning / Configuration Banner */}
        {!isKeyConfigured && !showKeyConfig && (
          <div className="p-3 bg-amber-500/10 border-b border-amber-500/20 flex items-center justify-between text-xs text-amber-300">
            <div className="flex items-center gap-2">
              <Key className="w-4 h-4 text-amber-400 shrink-0" />
              <span>未設定 Gemini API Key（目前使用範例模式）。若要辨識真實包裝，請輸入免費 API Key。</span>
            </div>
            <button
              onClick={() => setShowKeyConfig(true)}
              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-stone-950 font-bold rounded-lg shrink-0 ml-2"
            >
              立即設定
            </button>
          </div>
        )}

        {/* API Key Config Dropdown */}
        {showKeyConfig && (
          <div className="p-4 bg-stone-950 border-b border-stone-800 text-xs space-y-2.5">
            <form onSubmit={handleSaveApiKey} className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="font-semibold text-stone-200 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  <span>Google Gemini API Key (免費金鑰)</span>
                </label>
                <a
                  href="https://aistudio.google.com/app/apikey"
                  target="_blank"
                  rel="noreferrer"
                  className="text-amber-400 hover:underline text-[11px] font-semibold"
                >
                  {language === 'zh-TW' ? '30秒免費取得 Google API Key ↗' : 'Get free Google API Key ↗'}
                </a>
              </div>
              <div className="flex gap-2">
                <input
                  type="password"
                  value={apiKeyInput}
                  onChange={(e) => setApiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="flex-1 bg-stone-900 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
                <button
                  type="submit"
                  className="px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold rounded-xl transition shadow-sm"
                >
                  {t.scanner.saveApiKey}
                </button>
              </div>
              {keySavedBanner && (
                <div className="text-emerald-400 text-[11px] flex items-center gap-1">
                  <Check className="w-3.5 h-3.5" />
                  <span>{language === 'zh-TW' ? '已成功保存 Gemini API Key！已開啟真實 AI 視覺辨識' : 'API Key saved! Real-time vision scanning enabled.'}</span>
                </div>
              )}
            </form>
          </div>
        )}

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
          {errorMsg && (
            <div className="p-3.5 rounded-2xl bg-rose-500/10 border border-rose-500/30 text-rose-300 text-xs flex items-center space-x-2">
              <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* STEP 1: UPLOAD / CAMERA TRIGGER */}
          {step === 'upload' && (
            <div className="space-y-4">
              {/* Drag and Drop Zone */}
              <div
                onDragOver={(e) => e.preventDefault()}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-stone-700 hover:border-amber-500/60 rounded-3xl p-8 text-center cursor-pointer bg-stone-950/40 hover:bg-amber-500/5 transition group space-y-3"
              >
                <div className="w-16 h-16 rounded-2xl bg-stone-900 border border-stone-800 group-hover:border-amber-500/40 flex items-center justify-center mx-auto text-stone-400 group-hover:text-amber-400 transition shadow-inner">
                  <Camera className="w-8 h-8" />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-stone-200 group-hover:text-amber-300 transition">
                    {t.scanner.dragDropText}
                  </h4>
                  <p className="text-xs text-stone-500 mt-1">
                    支援咖啡豆包裝袋正面、背面產區風味卡或標籤貼紙 (JPG, PNG, WebP)
                  </p>
                </div>
              </div>

              {/* Action Buttons (Native Mobile Camera & File Select) */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {/* Native Camera Trigger for Phones */}
                <button
                  type="button"
                  onClick={() => cameraInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs sm:text-sm shadow-lg shadow-amber-900/30 transition flex items-center justify-center space-x-2"
                >
                  <Camera className="w-4 h-4" />
                  <span>{t.scanner.takePhoto} (相機拍照)</span>
                </button>

                {/* Photo Library Picker */}
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="py-3 px-4 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs sm:text-sm border border-stone-700 transition flex items-center justify-center space-x-2"
                >
                  <Upload className="w-4 h-4 text-stone-400" />
                  <span>{t.scanner.uploadPhoto} (相簿圖片)</span>
                </button>
              </div>

              {/* Hidden File Inputs */}
              <input
                ref={cameraInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                onChange={handleFileChange}
                className="hidden"
              />
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileChange}
                className="hidden"
              />
            </div>
          )}

          {/* STEP 2: ANALYZING ANIMATION */}
          {step === 'analyzing' && (
            <div className="py-12 px-4 text-center space-y-5">
              <div className="relative w-24 h-24 mx-auto">
                <div className="absolute inset-0 rounded-full border-4 border-amber-500/20 animate-ping" />
                <div className="relative w-24 h-24 rounded-full bg-stone-900 border-2 border-amber-500/40 flex items-center justify-center text-amber-400 shadow-xl shadow-amber-500/10">
                  <RefreshCw className="w-10 h-10 animate-spin text-amber-500" />
                </div>
              </div>

              <div className="space-y-1.5">
                <h4 className="font-bold text-base text-stone-100">
                  {t.scanner.analyzing}
                </h4>
                <p className="text-xs text-stone-400">
                  {t.scanner.analyzingHint}
                </p>
              </div>

              {imageStats && (
                <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-stone-950 border border-stone-800 text-[11px] text-stone-400 font-mono">
                  <span>原始: {formatKB(imageStats.origSize)}</span>
                  <span>→</span>
                  <span className="text-emerald-400 font-semibold">
                    壓縮優化: {formatKB(imageStats.compSize)}
                  </span>
                </div>
              )}
            </div>
          )}

          {/* STEP 3: REVIEW & VERIFY */}
          {step === 'review' && extractedData && (
            <div className="space-y-4">
              {/* Mock demo notice */}
              {extractedData.isMockDemo && (
                <div className="p-3 bg-amber-500/15 border border-amber-500/30 rounded-2xl text-xs text-amber-200 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-amber-400 shrink-0" />
                    <span>當前為<b>離線展示資料</b>（因未輸入 API Key）。若要辨識您的真實咖啡袋，請點擊右上角 🔑 輸入免費 Gemini API Key。</span>
                  </div>
                  <button
                    onClick={() => setShowKeyConfig(true)}
                    className="px-2.5 py-1 bg-amber-500 text-stone-950 font-bold rounded-lg shrink-0 ml-2"
                  >
                    設定 Key
                  </button>
                </div>
              )}

              <div className="flex items-center justify-between">
                <h4 className="font-bold text-xs sm:text-sm text-stone-200 flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-amber-400" />
                  <span>{t.scanner.reviewTitle}</span>
                </h4>
                <span className={`text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${
                  extractedData.isMockDemo
                    ? 'bg-amber-500/10 text-amber-300 border-amber-500/30'
                    : 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                }`}>
                  {extractedData.isMockDemo ? '展示模式 Demo' : `AI 辨識信心度 ${Math.round((extractedData.confidenceScore || 0.95) * 100)}%`}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-12 gap-4">
                {/* Photo Thumbnail */}
                {capturedImageBase64 && (
                  <div className="md:col-span-4 flex flex-col items-center space-y-2">
                    <div className="w-full aspect-square rounded-2xl overflow-hidden border border-stone-800 bg-stone-950 relative shadow-md">
                      <img
                        src={capturedImageBase64}
                        alt="Coffee bag capture"
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute bottom-2 left-2 right-2 px-2 py-1 rounded-lg bg-stone-950/80 backdrop-blur-sm text-[10px] text-stone-300 font-mono text-center border border-stone-800">
                        📸 {imageStats ? formatKB(imageStats.compSize) : 'Captured'}
                      </div>
                    </div>

                    {/* Raw OCR Text snippet if available */}
                    {extractedData.rawDetectedText && (
                      <div className="w-full p-2.5 rounded-xl bg-stone-950 border border-stone-800 text-[10px] text-stone-400 font-mono space-y-1">
                        <div className="flex items-center gap-1 text-stone-300 font-bold">
                          <FileText className="w-3 h-3 text-amber-500" />
                          <span>辨識到的文字：</span>
                        </div>
                        <p className="line-clamp-3 text-stone-400">
                          {extractedData.rawDetectedText}
                        </p>
                      </div>
                    )}
                  </div>
                )}

                {/* Parsed Fields Cards */}
                <div className={`space-y-2.5 ${capturedImageBase64 ? 'md:col-span-8' : 'md:col-span-12'}`}>
                  {/* Bean Name */}
                  <div className="p-3 rounded-xl bg-stone-950/70 border border-stone-800/80">
                    <div className="text-[10px] uppercase font-bold text-amber-400 tracking-wider">
                      咖啡豆名稱 (Bean Name)
                    </div>
                    <div className="font-bold text-sm text-white mt-0.5">
                      {extractedData.name}
                    </div>
                  </div>

                  {/* Roaster & Origin */}
                  <div className="grid grid-cols-2 gap-2">
                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80">
                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Flame className="w-3 h-3 text-amber-500" />
                        <span>烘豆坊</span>
                      </div>
                      <div className="font-semibold text-xs text-stone-100 mt-0.5 truncate">
                        {extractedData.roaster}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80">
                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Globe className="w-3 h-3 text-amber-500" />
                        <span>產區與品種</span>
                      </div>
                      <div className="font-semibold text-xs text-stone-100 mt-0.5 truncate">
                        {extractedData.origin} {extractedData.varietal ? `• ${extractedData.varietal}` : ''}
                      </div>
                    </div>
                  </div>

                  {/* Process, Roast Level & Date */}
                  <div className="grid grid-cols-3 gap-2">
                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80">
                      <div className="text-[10px] text-stone-400">處理法</div>
                      <div className="font-bold text-xs text-amber-300 mt-0.5">
                        {extractedData.process}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80">
                      <div className="text-[10px] text-stone-400">焙度</div>
                      <div className="font-bold text-xs text-stone-200 mt-0.5">
                        {extractedData.roastLevel}
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80">
                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3 text-amber-500" />
                        <span>烘焙日</span>
                      </div>
                      <div className="font-mono text-xs text-stone-200 mt-0.5">
                        {extractedData.roastDate}
                      </div>
                    </div>
                  </div>

                  {/* Flavor Tags */}
                  {extractedData.tastingNotes && extractedData.tastingNotes.length > 0 && (
                    <div className="p-2.5 rounded-xl bg-stone-950/70 border border-stone-800/80 space-y-1.5">
                      <div className="text-[10px] text-stone-400 flex items-center gap-1">
                        <Tag className="w-3 h-3 text-amber-500" />
                        <span>官方風味筆記 (Tasting Notes)</span>
                      </div>
                      <div className="flex flex-wrap gap-1">
                        {extractedData.tastingNotes.map((note) => (
                          <span
                            key={note}
                            className="px-2 py-0.5 rounded-md bg-amber-500/10 text-amber-300 border border-amber-500/20 text-[11px]"
                          >
                            {note}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex justify-between items-center border-t border-stone-800">
                <button
                  type="button"
                  onClick={handleReset}
                  className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition flex items-center space-x-1.5"
                >
                  <RefreshCw className="w-3.5 h-3.5" />
                  <span>{t.scanner.retakeBtn}</span>
                </button>

                <button
                  type="button"
                  onClick={handleApply}
                  className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs sm:text-sm font-bold shadow-lg shadow-amber-900/30 transition flex items-center space-x-2"
                >
                  <Check className="w-4 h-4" />
                  <span>{t.scanner.applyBtn}</span>
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
