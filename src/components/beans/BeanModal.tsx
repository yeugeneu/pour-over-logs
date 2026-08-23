import React, { useEffect, useState } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { BeanStatus, ProcessMethod, RoastLevel } from '../../types/coffee';
import { calculateDaysOffRoast, getRestingStageInfo } from '../../utils/coffeeMath';
import { FlavorTagSelector } from '../sensory/FlavorTagSelector';
import { BeanScannerModal } from './BeanScannerModal';
import { ExtractedBeanMetadata } from '../../services/aiScanner';
import { X, Layers, Check, Calendar, Camera, Sparkles } from 'lucide-react';

export const BeanModal: React.FC = () => {
  const { isBeanModalOpen, editingBeanId, closeBeanModal, addBean, updateBean, getBeanById } = useCoffee();
  const { language, t } = useI18n();

  const [name, setName] = useState('');
  const [origin, setOrigin] = useState('Ethiopia (衣索比亞)');
  const [region, setRegion] = useState('');
  const [farmOrStation, setFarmOrStation] = useState('');
  const [varietal, setVarietal] = useState('');
  const [process, setProcess] = useState<ProcessMethod>('Washed');
  const [roaster, setRoaster] = useState('');
  const [roastLevel, setRoastLevel] = useState<RoastLevel>('Light');
  const [roastDate, setRoastDate] = useState(new Date().toISOString().slice(0, 10));
  const [tastingNotes, setTastingNotes] = useState<string[]>([]);
  const [totalWeightGrams, setTotalWeightGrams] = useState(200);
  const [remainingWeightGrams, setRemainingWeightGrams] = useState(200);
  const [price, setPrice] = useState<number | ''>('');
  const [currency, setCurrency] = useState<string>('TWD');
  const [elevationMeters, setElevationMeters] = useState('');
  const [status, setStatus] = useState<BeanStatus>('active');
  const [notes, setNotes] = useState('');

  // AI Scanner state
  const [isScannerOpen, setIsScannerOpen] = useState(false);
  const [autoFilledNotice, setAutoFilledNotice] = useState(false);

  useEffect(() => {
    if (editingBeanId) {
      const bean = getBeanById(editingBeanId);
      if (bean) {
        setName(bean.name);
        setOrigin(bean.origin);
        setRegion(bean.region || '');
        setFarmOrStation(bean.farmOrStation || '');
        setVarietal(bean.varietal || '');
        setProcess(bean.process);
        setRoaster(bean.roaster);
        setRoastLevel(bean.roastLevel);
        setRoastDate(bean.roastDate);
        setTastingNotes(bean.tastingNotesPackage || []);
        setTotalWeightGrams(bean.totalWeightGrams);
        setRemainingWeightGrams(bean.remainingWeightGrams);
        setPrice(bean.price !== undefined ? bean.price : '');
        setCurrency(bean.currency || 'TWD');
        setElevationMeters(bean.elevationMeters || '');
        setStatus(bean.status);
        setNotes(bean.notes || '');
      }
    } else {
      // Reset defaults
      setName('');
      setOrigin('Ethiopia (衣索比亞)');
      setRegion('');
      setFarmOrStation('');
      setVarietal('');
      setProcess('Washed');
      setRoaster('');
      setRoastLevel('Light');
      setRoastDate(new Date().toISOString().slice(0, 10));
      setTastingNotes([]);
      setTotalWeightGrams(200);
      setRemainingWeightGrams(200);
      setPrice('');
      setCurrency('TWD');
      setElevationMeters('');
      setStatus('active');
      setNotes('');
    }
  }, [editingBeanId, isBeanModalOpen]);

  if (!isBeanModalOpen) return null;

  const daysOffRoast = calculateDaysOffRoast(roastDate);
  const restInfo = getRestingStageInfo(daysOffRoast, roastLevel);

  const handleScannerApply = (data: ExtractedBeanMetadata) => {
    if (data.name) setName(data.name);
    if (data.roaster) setRoaster(data.roaster);
    if (data.origin) setOrigin(data.origin);
    if (data.region) setRegion(data.region);
    if (data.farmOrStation) setFarmOrStation(data.farmOrStation);
    if (data.varietal) setVarietal(data.varietal);
    if (data.process) setProcess(data.process);
    if (data.roastLevel) setRoastLevel(data.roastLevel);
    if (data.roastDate) setRoastDate(data.roastDate);
    if (data.tastingNotes && data.tastingNotes.length > 0) setTastingNotes(data.tastingNotes);
    if (data.totalWeightGrams) {
      setTotalWeightGrams(data.totalWeightGrams);
      setRemainingWeightGrams(data.remainingWeightGrams || data.totalWeightGrams);
    }
    if (data.elevationMeters) setElevationMeters(data.elevationMeters);
    if (data.notes) setNotes(data.notes);

    setAutoFilledNotice(true);
    setTimeout(() => setAutoFilledNotice(false), 4000);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !roaster.trim()) return;

    if (editingBeanId) {
      updateBean(editingBeanId, {
        name,
        origin,
        region,
        farmOrStation,
        varietal,
        process,
        roaster,
        roastLevel,
        roastDate,
        tastingNotesPackage: tastingNotes,
        totalWeightGrams,
        remainingWeightGrams,
        price: price !== '' ? Number(price) : undefined,
        currency,
        elevationMeters,
        status,
        notes,
      });
    } else {
      addBean({
        name,
        origin,
        region,
        farmOrStation,
        varietal,
        process,
        roaster,
        roastLevel,
        roastDate,
        tastingNotesPackage: tastingNotes,
        totalWeightGrams,
        remainingWeightGrams,
        price: price !== '' ? Number(price) : undefined,
        currency,
        elevationMeters,
        status,
        notes,
      });
    }

    closeBeanModal();
  };

  const processOptions: ProcessMethod[] = [
    'Washed',
    'Natural',
    'Honey',
    'Anaerobic',
    'Thermal Shock',
    'Carbonic Maceration',
    'Wet Hulled',
    'Experimental',
    'Other',
  ];

  const roastOptions: RoastLevel[] = [
    'Light',
    'Light-Medium',
    'Medium',
    'Medium-Dark',
    'Dark',
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
        <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-2xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
          {/* Modal Header */}
          <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
                <Layers className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-base sm:text-lg text-stone-100">
                  {editingBeanId ? t.beans.editBean : t.beans.addBean}
                </h3>
                <p className="text-xs text-stone-400">
                  {language === 'zh-TW'
                    ? '填寫精品豆履歷與烘焙資訊，系統將自動計算養豆狀態'
                    : 'Enter bean metadata to track rest curves and brew history'}
                </p>
              </div>
            </div>

            <div className="flex items-center space-x-1.5">
              {/* Scan Bag Button Trigger */}
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="hidden sm:flex items-center space-x-1.5 px-3 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs border border-amber-500/30 transition shadow-sm"
              >
                <Camera className="w-3.5 h-3.5 text-amber-400" />
                <span>{t.scanner.scanBtn}</span>
              </button>

              <button
                onClick={closeBeanModal}
                className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Form Body */}
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto flex-1 space-y-4">
            {/* Auto-filled Notification Banner */}
            {autoFilledNotice && (
              <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 text-amber-200 text-xs flex items-center justify-between animate-fade-in shadow-lg shadow-amber-900/20">
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-400 shrink-0" />
                  <span className="font-semibold">
                    ✨ {language === 'zh-TW' ? '已成功從照片辨識並自動填入咖啡豆資訊！' : 'Successfully extracted bean details from photo!'}
                  </span>
                </div>
                <span className="text-[11px] text-amber-300/80">請核對並調整</span>
              </div>
            )}

            {/* Mobile Scan Button Banner */}
            <div className="sm:hidden">
              <button
                type="button"
                onClick={() => setIsScannerOpen(true)}
                className="w-full py-2.5 px-3 rounded-2xl bg-gradient-to-r from-amber-600/30 via-amber-500/20 to-amber-600/30 hover:from-amber-600/40 hover:to-amber-500/30 text-amber-300 font-bold text-xs border border-amber-500/40 transition flex items-center justify-center space-x-2 shadow-sm"
              >
                <Camera className="w-4 h-4 text-amber-400" />
                <span>{t.scanner.scanBtn}</span>
              </button>
            </div>

            {/* Bean Name */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {language === 'zh-TW' ? '咖啡豆名稱 (Bean Name) *' : 'Bean Name *'}
              </label>
              <input
                type="text"
                required
                placeholder="e.g. 衣索比亞 耶加雪菲 歌姬 沃卡 日曬 G1"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-stone-950 text-stone-100 text-sm px-3.5 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
              />
            </div>

            {/* Roaster & Origin Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.beans.roaster} *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Simple Kaffa / The Barn / 自烘"
                  value={roaster}
                  onChange={(e) => setRoaster(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3.5 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.beans.origin}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Ethiopia / Panama / Colombia"
                  value={origin}
                  onChange={(e) => setOrigin(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3.5 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Region, Farm & Varietal Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.beans.region}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Yirgacheffe / Boquete"
                  value={region}
                  onChange={(e) => setRegion(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.beans.varietal}
                </label>
                <input
                  type="text"
                  placeholder="e.g. Geisha / Heirloom / SL28"
                  value={varietal}
                  onChange={(e) => setVarietal(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {language === 'zh-TW' ? '海拔 (Elevation)' : 'Elevation'}
                </label>
                <input
                  type="text"
                  placeholder="e.g. 1950-2100m"
                  value={elevationMeters}
                  onChange={(e) => setElevationMeters(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            {/* Process & Roast Level */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.beans.process}
                </label>
                <select
                  value={process}
                  onChange={(e) => setProcess(e.target.value as ProcessMethod)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                >
                  {processOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.beans.roastLevel}
                </label>
                <select
                  value={roastLevel}
                  onChange={(e) => setRoastLevel(e.target.value as RoastLevel)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                >
                  {roastOptions.map((opt) => (
                    <option key={opt} value={opt}>
                      {opt}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Roast Date & Resting Stage Live Preview */}
            <div className="p-3.5 bg-stone-950/60 rounded-2xl border border-stone-800 space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-stone-300 flex items-center gap-1.5">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{t.beans.roastDate}</span>
                </label>
                <span
                  className={`text-xs px-2.5 py-0.5 rounded-full border font-semibold ${restInfo.badgeColor}`}
                >
                  {language === 'zh-TW' ? `養豆 ${daysOffRoast} 天` : `${daysOffRoast}d`} • {language === 'zh-TW' ? restInfo.labelZh : restInfo.labelEn}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 items-center">
                <input
                  type="date"
                  required
                  value={roastDate}
                  onChange={(e) => setRoastDate(e.target.value)}
                  className="w-full bg-stone-900 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
                <p className="text-[11px] text-stone-400 leading-relaxed">
                  💡 {language === 'zh-TW' ? restInfo.descriptionZh : restInfo.descriptionEn}
                </p>
              </div>
            </div>

            {/* Package Tasting Notes */}
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-stone-300">
                {t.beans.tastingNotes}
              </label>
              <FlavorTagSelector
                selectedTags={tastingNotes}
                onChange={setTastingNotes}
              />
            </div>

            {/* Weights, Price & Status */}
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {language === 'zh-TW' ? '總克重 (Total g)' : 'Total (g)'}
                </label>
                <input
                  type="number"
                  value={totalWeightGrams}
                  onChange={(e) => {
                    const val = parseFloat(e.target.value) || 0;
                    setTotalWeightGrams(val);
                    if (!editingBeanId) setRemainingWeightGrams(val);
                  }}
                  className="w-full bg-stone-950 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {language === 'zh-TW' ? '剩餘克重 (Rem. g)' : 'Remaining (g)'}
                </label>
                <input
                  type="number"
                  value={remainingWeightGrams}
                  onChange={(e) => setRemainingWeightGrams(parseFloat(e.target.value) || 0)}
                  className="w-full bg-stone-950 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-xs font-semibold text-stone-300">
                    {language === 'zh-TW' ? '購買價格 (Price)' : 'Price'}
                  </label>
                  {price && totalWeightGrams > 0 && (
                    <span className="text-[10px] text-amber-400 font-mono">
                      ≈ {currency} {((Number(price) / totalWeightGrams) * 15).toFixed(1)}/杯
                    </span>
                  )}
                </div>
                <div className="flex gap-1.5">
                  <select
                    value={currency}
                    onChange={(e) => setCurrency(e.target.value)}
                    className="bg-stone-950 text-stone-300 text-xs px-2 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  >
                    <option value="TWD">NT$</option>
                    <option value="CAD">CAD $</option>
                    <option value="USD">USD $</option>
                    <option value="EUR">EUR €</option>
                    <option value="GBP">GBP £</option>
                    <option value="JPY">JPY ¥</option>
                    <option value="HKD">HK$</option>
                    <option value="AUD">AUD $</option>
                    <option value="SGD">SGD $</option>
                  </select>
                  <input
                    type="number"
                    placeholder="e.g. 450"
                    value={price}
                    onChange={(e) => setPrice(e.target.value === '' ? '' : parseFloat(e.target.value) || 0)}
                    className="flex-1 bg-stone-950 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.beans.filterStatus}
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as BeanStatus)}
                  className="w-full bg-stone-950 text-stone-100 text-xs px-3 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                >
                  <option value="active">{t.beans.active}</option>
                  <option value="resting">{t.beans.resting}</option>
                  <option value="finished">{t.beans.finished}</option>
                </select>
              </div>
            </div>

            {/* Notes */}
            <div>
              <label className="block text-xs font-semibold text-stone-300 mb-1">
                {language === 'zh-TW' ? '備註與保存建議 (Notes)' : 'Notes'}
              </label>
              <textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="e.g. 建議單向排氣閥密封常溫保存，低研磨細粉率..."
                className="w-full bg-stone-950 text-stone-100 text-xs p-3 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none resize-none"
              />
            </div>

            {/* Modal Footer */}
            <div className="pt-3 border-t border-stone-800 flex justify-end space-x-2">
              <button
                type="button"
                onClick={closeBeanModal}
                className="px-4 py-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-300 text-xs font-medium transition"
              >
                {language === 'zh-TW' ? '取消' : 'Cancel'}
              </button>
              <button
                type="submit"
                className="px-6 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white text-xs font-bold transition shadow-md shadow-amber-900/30 flex items-center space-x-1.5"
              >
                <Check className="w-4 h-4" />
                <span>{editingBeanId ? (language === 'zh-TW' ? '更新咖啡豆' : 'Update Bean') : (language === 'zh-TW' ? '加入豆架' : 'Add to Shelf')}</span>
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* AI Scanner Sub-Modal */}
      <BeanScannerModal
        isOpen={isScannerOpen}
        onClose={() => setIsScannerOpen(false)}
        onApply={handleScannerApply}
      />
    </>
  );
};
