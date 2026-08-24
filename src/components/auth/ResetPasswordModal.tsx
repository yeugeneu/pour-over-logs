import React, { useState } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { updateUserPassword } from '../../services/authService';
import { X, Lock, CheckCircle2, AlertCircle, KeyRound, Sparkles } from 'lucide-react';
import confetti from 'canvas-confetti';

export const ResetPasswordModal: React.FC = () => {
  const { isResetPasswordModalOpen, closeResetPasswordModal } = useCoffee();
  const { language } = useI18n();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isResetPasswordModalOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password.length < 6) {
      setFeedback({
        type: 'error',
        message: language === 'zh-TW' ? '密碼長度至少需 6 個字元' : 'Password must be at least 6 characters.',
      });
      return;
    }

    if (password !== confirmPassword) {
      setFeedback({
        type: 'error',
        message: language === 'zh-TW' ? '兩次輸入的密碼不一致' : 'Passwords do not match.',
      });
      return;
    }

    setIsSubmitting(true);
    setFeedback(null);

    const { error } = await updateUserPassword(password.trim());
    setIsSubmitting(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
    } else {
      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.6 },
      });
      setFeedback({
        type: 'success',
        message: language === 'zh-TW' ? '密碼設定成功！今後可直接使用帳號密碼登入。' : 'Password updated successfully!',
      });
      // Clean up URL hash recovery tokens
      window.history.replaceState(null, '', window.location.pathname);
      setTimeout(() => {
        closeResetPasswordModal();
      }, 1200);
    }
  };

  const handleClose = () => {
    // Clean up URL hash recovery tokens if closed
    window.history.replaceState(null, '', window.location.pathname);
    closeResetPasswordModal();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 animate-fade-in">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-md shadow-2xl overflow-hidden flex flex-col">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <KeyRound className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-100 flex items-center gap-1.5">
                <span>{language === 'zh-TW' ? '設定帳號新密碼' : 'Set New Password'}</span>
                <Sparkles className="w-4 h-4 text-amber-400" />
              </h3>
              <p className="text-xs text-stone-400">
                {language === 'zh-TW' ? '請輸入您要設定的登入密碼' : 'Enter your new login password below'}
              </p>
            </div>
          </div>

          <button
            onClick={handleClose}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 sm:p-6 space-y-4">
          {/* Feedback banner */}
          {feedback && (
            <div
              className={`p-3.5 rounded-2xl border flex items-center space-x-2.5 text-xs animate-fade-in ${
                feedback.type === 'success'
                  ? 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30'
                  : 'bg-rose-500/10 text-rose-300 border-rose-500/30'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
              )}
              <span>{feedback.message}</span>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              {language === 'zh-TW' ? '新密碼 (至少 6 位)' : 'New Password (min 6 chars)'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                autoFocus
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-950 text-stone-100 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-stone-300 mb-1">
              {language === 'zh-TW' ? '再次確認新密碼' : 'Confirm New Password'}
            </label>
            <div className="relative">
              <Lock className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="password"
                required
                minLength={6}
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-stone-950 text-stone-100 text-sm pl-9 pr-3 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
              />
            </div>
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting || !password.trim() || !confirmPassword.trim()}
              className="w-full py-3 rounded-2xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-sm shadow-lg shadow-amber-900/30 transition disabled:opacity-50 flex items-center justify-center space-x-2"
            >
              <KeyRound className="w-4 h-4" />
              <span>{language === 'zh-TW' ? '儲存並完成密碼設定' : 'Save & Set Password'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
