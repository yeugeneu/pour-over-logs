import React from 'react';
import { useCoffee } from '../../context/CoffeeContext';
import { useI18n } from '../../i18n';
import { Cloud, RefreshCw } from 'lucide-react';

export const SyncStatusBadge: React.FC = () => {
  const { user, syncStatus, openAuthModal } = useCoffee();
  const { t } = useI18n();

  const getStatusDisplay = () => {
    if (!user) {
      return {
        dot: 'bg-stone-500',
        text: t.auth.localMode,
        badgeBg: 'bg-stone-900/80 text-stone-400 border-stone-800 hover:border-stone-700 hover:text-stone-200',
      };
    }

    switch (syncStatus) {
      case 'syncing':
        return {
          dot: 'bg-amber-400 animate-pulse',
          text: t.auth.syncing,
          badgeBg: 'bg-amber-500/10 text-amber-300 border-amber-500/30',
        };
      case 'synced':
        return {
          dot: 'bg-emerald-400',
          text: t.auth.synced,
          badgeBg: 'bg-emerald-500/10 text-emerald-300 border-emerald-500/30',
        };
      case 'error':
      case 'offline':
        return {
          dot: 'bg-rose-400',
          text: t.auth.offline,
          badgeBg: 'bg-rose-500/10 text-rose-300 border-rose-500/30',
        };
      default:
        return {
          dot: 'bg-stone-400',
          text: t.auth.localMode,
          badgeBg: 'bg-stone-900/80 text-stone-400 border-stone-800',
        };
    }
  };

  const status = getStatusDisplay();

  return (
    <button
      onClick={openAuthModal}
      className={`flex items-center space-x-1.5 px-2 sm:px-2.5 py-1.5 rounded-xl border text-xs font-medium transition cursor-pointer shrink-0 whitespace-nowrap ${status.badgeBg}`}
      title="Cloud Sync & Account Settings"
    >
      {syncStatus === 'syncing' ? (
        <RefreshCw className="w-3 h-3 animate-spin text-amber-400" />
      ) : (
        <span className={`w-1.5 h-1.5 rounded-full ${status.dot}`} />
      )}

      <span className="hidden sm:inline">{status.text}</span>
      {user ? (
        <span className="w-4 h-4 rounded-full bg-amber-500/20 text-amber-300 flex items-center justify-center font-bold text-[9px]">
          {user.email ? user.email[0].toUpperCase() : 'U'}
        </span>
      ) : (
        <Cloud className="w-3 h-3 text-stone-400 sm:hidden" />
      )}
    </button>
  );
};
