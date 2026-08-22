import React, { useState } from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import {
  signInWithApple,
  signInWithGoogle,
  signInWithMagicLink,
  signOut,
} from '../../services/authService';
import {
  getSupabaseCredentials,
  saveCustomSupabaseCredentials,
} from '../../services/supabaseClient';
import {
  X,
  Cloud,
  CheckCircle2,
  AlertCircle,
  RefreshCw,
  UploadCloud,
  LogOut,
  Mail,
} from 'lucide-react';

export const AuthModal: React.FC = () => {
  const {
    isAuthModalOpen,
    closeAuthModal,
    user,
    syncStatus,
    lastSyncedAt,
    syncWithCloud,
    migrateLocalToCloud,
    beans,
    logs,
  } = useCoffee();
  const { language, t } = useI18n();

  const [activeTab, setActiveTab] = useState<'login' | 'config'>('login');
  const [emailInput, setEmailInput] = useState('');
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Custom Supabase Config state
  const creds = getSupabaseCredentials();
  const [customUrl, setCustomUrl] = useState(creds.url);
  const [customAnonKey, setCustomAnonKey] = useState(creds.anonKey);

  if (!isAuthModalOpen) return null;

  const handleGoogleLogin = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await signInWithGoogle();
    setIsSubmitting(false);
    if (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const handleAppleLogin = async () => {
    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await signInWithApple();
    setIsSubmitting(false);
    if (error) {
      setFeedback({ type: 'error', message: error.message });
    }
  };

  const handleMagicLink = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!emailInput.trim()) return;

    setIsSubmitting(true);
    setFeedback(null);
    const { error } = await signInWithMagicLink(emailInput.trim());
    setIsSubmitting(false);

    if (error) {
      setFeedback({ type: 'error', message: error.message });
    } else {
      setFeedback({ type: 'success', message: t.auth.linkSent });
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setFeedback({
      type: 'success',
      message: language === 'zh-TW' ? '已成功登出帳號' : 'Signed out successfully',
    });
  };

  const handleSaveCustomConfig = (e: React.FormEvent) => {
    e.preventDefault();
    saveCustomSupabaseCredentials(customUrl, customAnonKey);
    setFeedback({ type: 'success', message: t.auth.configSaved });
  };

  const handleMigrate = async () => {
    setIsSubmitting(true);
    const res = await migrateLocalToCloud();
    setIsSubmitting(false);
    if (res.success) {
      setFeedback({
        type: 'success',
        message: `${t.auth.migrateSuccess} (${res.count} items)`,
      });
    } else {
      setFeedback({ type: 'error', message: res.error || 'Migration failed' });
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4">
      <div className="bg-stone-900 border border-stone-800 rounded-3xl w-full max-w-lg shadow-2xl overflow-hidden flex flex-col max-h-[92vh]">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-stone-800 bg-stone-950/80 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-base sm:text-lg text-stone-100">
                {t.auth.loginTitle}
              </h3>
              <p className="text-xs text-stone-400 line-clamp-1">
                {t.auth.loginSubtitle}
              </p>
            </div>
          </div>

          <button
            onClick={closeAuthModal}
            className="p-2 rounded-xl hover:bg-stone-800 text-stone-400 hover:text-stone-200 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab switch */}
        <div className="flex border-b border-stone-800 bg-stone-950/40 text-xs">
          <button
            onClick={() => setActiveTab('login')}
            className={`flex-1 py-2.5 font-semibold text-center transition border-b-2 ${
              activeTab === 'login'
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {user ? t.auth.account : t.auth.signIn}
          </button>
          <button
            onClick={() => setActiveTab('config')}
            className={`flex-1 py-2.5 font-semibold text-center transition border-b-2 ${
              activeTab === 'config'
                ? 'border-amber-500 text-amber-300 bg-amber-500/5'
                : 'border-transparent text-stone-500 hover:text-stone-300'
            }`}
          >
            {t.auth.customConfig}
          </button>
        </div>

        {/* Content Body */}
        <div className="p-4 sm:p-6 overflow-y-auto space-y-4">
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

          {/* TAB 1: LOGIN / ACCOUNT VIEW */}
          {activeTab === 'login' && (
            <>
              {user ? (
                /* Logged In View */
                <div className="space-y-4">
                  <div className="p-4 rounded-2xl bg-stone-950/70 border border-stone-800 flex items-center justify-between">
                    <div>
                      <div className="text-[11px] text-stone-400">{t.auth.loggedInAs}</div>
                      <div className="font-bold text-sm text-stone-100 font-mono">
                        {user.email || user.user_metadata?.full_name || user.id}
                      </div>
                      <div className="text-[11px] text-amber-400 flex items-center gap-1 mt-1">
                        <span className="w-2 h-2 rounded-full bg-emerald-500 inline-block" />
                        <span>{t.auth.synced}</span>
                        {lastSyncedAt && (
                          <span className="text-stone-500 font-mono">
                            • {new Date(lastSyncedAt).toLocaleTimeString()}
                          </span>
                        )}
                      </div>
                    </div>

                    <button
                      onClick={handleSignOut}
                      className="p-2 rounded-xl bg-stone-800 hover:bg-rose-900/40 text-stone-400 hover:text-rose-300 transition"
                      title={t.auth.signOut}
                    >
                      <LogOut className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Sync Actions */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                    <button
                      onClick={syncWithCloud}
                      disabled={syncStatus === 'syncing'}
                      className="p-3 rounded-2xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-semibold text-xs transition flex items-center justify-center space-x-2 border border-stone-700 disabled:opacity-50"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${syncStatus === 'syncing' ? 'animate-spin' : ''}`} />
                      <span>{t.auth.syncNow}</span>
                    </button>

                    <button
                      onClick={handleMigrate}
                      disabled={isSubmitting}
                      className="p-3 rounded-2xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 font-semibold text-xs transition flex items-center justify-center space-x-2 border border-amber-500/30"
                    >
                      <UploadCloud className="w-3.5 h-3.5 text-amber-400" />
                      <span>{t.auth.migrateLocal}</span>
                    </button>
                  </div>

                  {/* Local items count */}
                  <div className="p-3 rounded-xl bg-stone-950/40 border border-stone-800/80 text-[11px] text-stone-400 text-center">
                    目前本機庫存：<span className="text-white font-mono">{beans.length}</span> 支咖啡豆 • <span className="text-white font-mono">{logs.length}</span> 筆沖煮紀錄
                  </div>
                </div>
              ) : (
                /* Not Logged In View */
                <div className="space-y-4">
                  {/* Google OAuth Button */}
                  <button
                    type="button"
                    onClick={handleGoogleLogin}
                    disabled={isSubmitting}
                    className="w-full p-3 rounded-2xl bg-white hover:bg-stone-100 text-stone-900 font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-3 shadow-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4" viewBox="0 0 24 24">
                      <path
                        fill="#EA4335"
                        d="M12 5c1.7 0 3 .6 4 1.5l3-3C17.2 1.8 14.8 1 12 1 7.5 1 3.7 3.6 1.9 7.3l3.7 2.9C6.5 7.4 9 5 12 5z"
                      />
                      <path
                        fill="#4285F4"
                        d="M23.5 12.3c0-.8-.1-1.6-.2-2.3H12v4.5h6.5c-.3 1.5-1.1 2.8-2.4 3.7l3.7 2.9c2.2-2 3.7-5 3.7-8.8z"
                      />
                      <path
                        fill="#FBBC05"
                        d="M5.6 14.8c-.3-.8-.4-1.8-.4-2.8s.2-2 .4-2.8L1.9 6.3C.7 8.7 0 10.3 0 12s.7 3.3 1.9 5.7l3.7-2.9z"
                      />
                      <path
                        fill="#34A853"
                        d="M12 23c3.2 0 6-1.1 8-3l-3.7-2.9c-1.1.7-2.5 1.2-4.3 1.2-3 0-5.5-2.4-6.4-5.2L1.9 16C3.7 19.7 7.5 23 12 23z"
                      />
                    </svg>
                    <span>{t.auth.signInGoogle}</span>
                  </button>

                  {/* Apple OAuth Button */}
                  <button
                    type="button"
                    onClick={handleAppleLogin}
                    disabled={isSubmitting}
                    className="w-full p-3 rounded-2xl bg-stone-950 hover:bg-stone-800 text-white font-bold text-xs sm:text-sm transition flex items-center justify-center space-x-3 border border-stone-700 shadow-md disabled:opacity-50"
                  >
                    <svg className="w-4 h-4 fill-current" viewBox="0 0 170 170">
                      <path d="M150.37 130.25c-2.45 5.66-5.35 10.87-8.71 15.66-4.58 6.53-8.33 11.05-11.22 13.56-4.48 4.12-9.28 6.23-14.42 6.35-3.69 0-8.14-1.05-13.32-3.18-5.19-2.12-9.97-3.17-14.34-3.17-4.58 0-9.49 1.05-14.75 3.17-5.26 2.13-9.5 3.24-12.74 3.35-4.35.13-9.16-1.9-14.42-6.08-3.7-3.04-7.69-7.85-11.97-14.42-6.3-9.67-11.29-20.66-14.97-32.96-3.68-12.3-5.52-23.75-5.52-34.34 0-14.54 3.7-26.68 11.1-36.42 7.4-9.74 16.71-14.73 27.93-14.98 4.67 0 9.9 1.16 15.69 3.48 5.79 2.32 9.53 3.53 11.22 3.63 2.12-.22 6.09-1.52 11.91-3.9 5.82-2.38 10.8-3.41 14.95-3.08 16.34 1.34 28.53 8.35 36.56 21.03-14.34 8.71-21.32 20.66-20.94 35.86.37 11.83 4.8 21.73 13.29 29.7 4.12 3.82 8.78 6.74 13.98 8.77-2.93 8.71-6.73 17.15-11.4 25.32zM119.22 31.84c0-7.72 2.76-14.96 8.28-21.72 5.52-6.76 12.39-10.45 20.61-11.08.11 1.09.16 2.07.16 2.94 0 7.61-2.93 15.01-8.79 22.2-5.86 7.18-12.87 11.06-21.03 11.64-.11-1.09-.16-2.07-.16-2.94z" />
                    </svg>
                    <span>{t.auth.signInApple}</span>
                  </button>

                  {/* Divider */}
                  <div className="flex items-center my-2">
                    <div className="flex-1 border-t border-stone-800" />
                    <span className="px-3 text-[11px] text-stone-500 uppercase tracking-widest">
                      {language === 'zh-TW' ? '或使用信箱' : 'Or with Email'}
                    </span>
                    <div className="flex-1 border-t border-stone-800" />
                  </div>

                  {/* Magic Link Form */}
                  <form onSubmit={handleMagicLink} className="space-y-2.5">
                    <div>
                      <label className="block text-xs font-semibold text-stone-300 mb-1">
                        {t.auth.magicLink}
                      </label>
                      <div className="relative">
                        <Mail className="w-4 h-4 text-stone-500 absolute left-3 top-1/2 -translate-y-1/2" />
                        <input
                          type="email"
                          required
                          value={emailInput}
                          onChange={(e) => setEmailInput(e.target.value)}
                          placeholder={t.auth.emailPlaceholder}
                          className="w-full bg-stone-950 text-stone-100 text-xs pl-9 pr-3 py-2.5 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                    </div>

                    <button
                      type="submit"
                      disabled={isSubmitting || !emailInput.trim()}
                      className="w-full py-2.5 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs border border-stone-700 transition disabled:opacity-50"
                    >
                      {t.auth.sendMagicLink}
                    </button>
                  </form>
                </div>
              )}
            </>
          )}

          {/* TAB 2: CUSTOM SUPABASE CONFIG (BYO BACKEND) */}
          {activeTab === 'config' && (
            <form onSubmit={handleSaveCustomConfig} className="space-y-3.5">
              <div className="p-3 rounded-xl bg-stone-950/60 border border-stone-800 text-[11px] text-stone-400 leading-relaxed">
                <span className="text-amber-400 font-semibold block mb-0.5">
                  💡 自備 Supabase 後端 (BYO Backend)
                </span>
                您可以直接填入自己在 <a href="https://supabase.com" target="_blank" rel="noreferrer" className="text-amber-300 underline">supabase.com</a> 建立的免費專案 URL 與 Anon Public Key，並執行專案內的 SQL Migration 即可擁有私有雲端資料庫！
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.auth.supabaseUrl}
                </label>
                <input
                  type="url"
                  placeholder="https://xyzcompany.supabase.co"
                  value={customUrl}
                  onChange={(e) => setCustomUrl(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 font-mono text-xs px-3 py-2 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-stone-300 mb-1">
                  {t.auth.supabaseAnonKey}
                </label>
                <textarea
                  rows={3}
                  placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
                  value={customAnonKey}
                  onChange={(e) => setCustomAnonKey(e.target.value)}
                  className="w-full bg-stone-950 text-stone-100 font-mono text-xs p-3 rounded-xl border border-stone-800 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>

              <div className="flex justify-end pt-1">
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-gradient-to-r from-amber-600 to-amber-500 hover:from-amber-500 hover:to-amber-400 text-white font-bold text-xs shadow-md transition"
                >
                  {t.auth.saveConfig}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
