import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { User } from '@supabase/supabase-js';
import { INITIAL_BEANS, INITIAL_LOGS } from '../data/sampleData';
import { BrewLog, CoffeeBean } from '../types/coffee';
import { getCurrentUser } from '../services/authService';
import { getSupabase, getSupabaseCredentials } from '../services/supabaseClient';
import {
  deleteBeanRemote,
  deleteLogRemote,
  fetchRemoteData,
  migrateAllLocalToCloud,
  upsertBeanRemote,
  upsertLogRemote,
} from '../services/cloudSync';

export type ActiveTab = 'beans' | 'trends' | 'history' | 'backup';
export type SyncStatus = 'synced' | 'syncing' | 'offline' | 'local' | 'error';

interface CoffeeContextType {
  beans: CoffeeBean[];
  logs: BrewLog[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeBeanId: string | null;
  setActiveBeanId: (id: string | null) => void;

  // Cloud & Auth states
  user: User | null;
  setUser: (user: User | null) => void;
  isCloudConfigured: boolean;
  syncStatus: SyncStatus;
  lastSyncedAt: string | null;
  isAuthModalOpen: boolean;
  openAuthModal: () => void;
  closeAuthModal: () => void;
  syncWithCloud: () => Promise<void>;
  migrateLocalToCloud: () => Promise<{ success: boolean; count: number; error?: string }>;
  
  // Modal states
  isBrewModalOpen: boolean;
  brewModalBeanId: string | null;
  brewModalPresetLogId: string | null;
  openBrewModal: (beanId?: string, presetLogId?: string) => void;
  closeBrewModal: () => void;
  
  isBeanModalOpen: boolean;
  editingBeanId: string | null;
  openBeanModal: (beanIdToEdit?: string) => void;
  closeBeanModal: () => void;

  isBeanDetailModalOpen: boolean;
  detailBeanId: string | null;
  openBeanDetailModal: (beanId: string) => void;
  closeBeanDetailModal: () => void;

  // CRUD Operations
  addBean: (bean: Omit<CoffeeBean, 'id' | 'createdAt'>) => CoffeeBean;
  updateBean: (id: string, updates: Partial<CoffeeBean>) => void;
  deleteBean: (id: string) => void;
  
  addLog: (log: Omit<BrewLog, 'id'>) => BrewLog;
  updateLog: (id: string, updates: Partial<BrewLog>) => void;
  deleteLog: (id: string) => void;
  
  toggleGoldenRecipe: (logId: string) => void;
  resetToSampleData: () => void;
  restoreFromBackup: (beans: CoffeeBean[], logs: BrewLog[]) => void;
  
  // Helpers
  getBeanById: (id: string) => CoffeeBean | undefined;
  getLogsByBeanId: (beanId: string) => BrewLog[];
  getGoldenLogForBean: (beanId: string) => BrewLog | undefined;
}

const STORAGE_KEYS = {
  BEANS: 'brewlog_beans_v1',
  LOGS: 'brewlog_logs_v1',
  LAST_SYNC: 'brewlog_last_sync_timestamp',
};

const CoffeeContext = createContext<CoffeeContextType | null>(null);

export const CoffeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [beans, setBeans] = useState<CoffeeBean[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BEANS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load beans from localStorage', e);
    }
    return INITIAL_BEANS;
  });

  const [logs, setLogs] = useState<BrewLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) return JSON.parse(saved);
    } catch (e) {
      console.error('Failed to load logs from localStorage', e);
    }
    return INITIAL_LOGS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('beans');
  const [activeBeanId, setActiveBeanId] = useState<string | null>(beans[0]?.id || null);

  // Auth & Sync State
  const [user, setUser] = useState<User | null>(null);
  const [syncStatus, setSyncStatus] = useState<SyncStatus>('local');
  const [lastSyncedAt, setLastSyncedAt] = useState<string | null>(() => {
    return localStorage.getItem(STORAGE_KEYS.LAST_SYNC);
  });
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const { isConfigured: isCloudConfigured } = getSupabaseCredentials();

  // Brew modal state
  const [isBrewModalOpen, setIsBrewModalOpen] = useState(false);
  const [brewModalBeanId, setBrewModalBeanId] = useState<string | null>(null);
  const [brewModalPresetLogId, setBrewModalPresetLogId] = useState<string | null>(null);

  // Bean modal state
  const [isBeanModalOpen, setIsBeanModalOpen] = useState(false);
  const [editingBeanId, setEditingBeanId] = useState<string | null>(null);

  // Bean detail modal state
  const [isBeanDetailModalOpen, setIsBeanDetailModalOpen] = useState(false);
  const [detailBeanId, setDetailBeanId] = useState<string | null>(null);

  // Persist to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.BEANS, JSON.stringify(beans));
    } catch (e) {
      console.error('Failed to save beans', e);
    }
  }, [beans]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
    } catch (e) {
      console.error('Failed to save logs', e);
    }
  }, [logs]);

  const openAuthModal = () => setIsAuthModalOpen(true);
  const closeAuthModal = () => setIsAuthModalOpen(false);

  // Sync with Cloud
  const syncWithCloud = useCallback(async () => {
    if (!user) {
      setSyncStatus(isCloudConfigured ? 'local' : 'local');
      return;
    }

    setSyncStatus('syncing');
    try {
      const { beans: remoteBeans, logs: remoteLogs, error } = await fetchRemoteData(user.id);
      if (error) throw error;

      if (remoteBeans.length > 0 || remoteLogs.length > 0) {
        // Merge strategy: remote takes priority if newer, otherwise keep combined unique items
        setBeans((localBeans) => {
          const remoteMap = new Map(remoteBeans.map((b) => [b.id, b]));
          const merged = [...remoteBeans];
          localBeans.forEach((lb) => {
            if (!remoteMap.has(lb.id)) merged.push(lb);
          });
          return merged;
        });

        setLogs((localLogs) => {
          const remoteMap = new Map(remoteLogs.map((l) => [l.id, l]));
          const merged = [...remoteLogs];
          localLogs.forEach((ll) => {
            if (!remoteMap.has(ll.id)) merged.push(ll);
          });
          return merged;
        });
      }

      const nowStr = new Date().toISOString();
      setLastSyncedAt(nowStr);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, nowStr);
      setSyncStatus('synced');
    } catch (err) {
      console.error('Sync failed:', err);
      setSyncStatus('error');
    }
  }, [user, isCloudConfigured]);

  // Migrate local records to cloud
  const migrateLocalToCloud = async () => {
    if (!user) return { success: false, count: 0, error: 'User not logged in' };
    setSyncStatus('syncing');
    const res = await migrateAllLocalToCloud(beans, logs, user.id);
    if (res.success) {
      const nowStr = new Date().toISOString();
      setLastSyncedAt(nowStr);
      localStorage.setItem(STORAGE_KEYS.LAST_SYNC, nowStr);
      setSyncStatus('synced');
    } else {
      setSyncStatus('error');
    }
    return res;
  };

  // Initial Auth & Realtime setup
  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) {
      setSyncStatus('local');
      return;
    }

    getCurrentUser().then((u) => {
      setUser(u);
      if (u) {
        setSyncStatus('synced');
      } else {
        setSyncStatus('local');
      }
    });

    const { data: authListener } = supabase.auth.onAuthStateChange(async (_event, session) => {
      const currentUser = session?.user || null;
      setUser(currentUser);
      if (currentUser) {
        setSyncStatus('syncing');
        const { beans: remoteBeans, logs: remoteLogs } = await fetchRemoteData(currentUser.id);
        if (remoteBeans.length > 0 || remoteLogs.length > 0) {
          setBeans(remoteBeans);
          setLogs(remoteLogs);
        }
        setSyncStatus('synced');
      } else {
        setSyncStatus('local');
      }
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, []);

  const openBrewModal = (beanId?: string, presetLogId?: string) => {
    setBrewModalBeanId(beanId || activeBeanId || beans[0]?.id || null);
    setBrewModalPresetLogId(presetLogId || null);
    setIsBrewModalOpen(true);
  };

  const closeBrewModal = () => {
    setIsBrewModalOpen(false);
    setBrewModalBeanId(null);
    setBrewModalPresetLogId(null);
  };

  const openBeanModal = (beanIdToEdit?: string) => {
    setEditingBeanId(beanIdToEdit || null);
    setIsBeanModalOpen(true);
  };

  const closeBeanModal = () => {
    setIsBeanModalOpen(false);
    setEditingBeanId(null);
  };

  const openBeanDetailModal = (beanId: string) => {
    setDetailBeanId(beanId);
    setIsBeanDetailModalOpen(true);
  };

  const closeBeanDetailModal = () => {
    setIsBeanDetailModalOpen(false);
    setDetailBeanId(null);
  };

  const addBean = (beanData: Omit<CoffeeBean, 'id' | 'createdAt'>): CoffeeBean => {
    const newBean: CoffeeBean = {
      ...beanData,
      id: `bean-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
    };
    setBeans((prev) => [newBean, ...prev]);
    setActiveBeanId(newBean.id);

    // Push to Supabase in background if logged in
    if (user) {
      upsertBeanRemote(newBean, user.id).catch(() => {});
    }

    return newBean;
  };

  const updateBean = (id: string, updates: Partial<CoffeeBean>) => {
    setBeans((prev) => {
      const next = prev.map((b) => (b.id === id ? { ...b, ...updates } : b));
      const target = next.find((b) => b.id === id);
      if (user && target) {
        upsertBeanRemote(target, user.id).catch(() => {});
      }
      return next;
    });
  };

  const deleteBean = (id: string) => {
    setBeans((prev) => prev.filter((b) => b.id !== id));
    setLogs((prev) => prev.filter((l) => l.beanId !== id));
    if (activeBeanId === id) {
      const remaining = beans.filter((b) => b.id !== id);
      setActiveBeanId(remaining[0]?.id || null);
    }
    if (user) {
      deleteBeanRemote(id).catch(() => {});
    }
  };

  const addLog = (logData: Omit<BrewLog, 'id'>): BrewLog => {
    const newLog: BrewLog = {
      ...logData,
      id: `log-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
    };

    setLogs((prev) => [newLog, ...prev]);

    // Automatically deduct grams from bean remaining inventory
    if (logData.doseGrams > 0) {
      setBeans((prev) =>
        prev.map((b) => {
          if (b.id === logData.beanId) {
            const newRemaining = Math.max(0, b.remainingWeightGrams - logData.doseGrams);
            const status = newRemaining === 0 ? 'finished' : b.status;
            const updatedBean: CoffeeBean = {
              ...b,
              remainingWeightGrams: newRemaining,
              status,
              goldenLogId: logData.isGolden ? newLog.id : b.goldenLogId,
            };
            if (user) {
              upsertBeanRemote(updatedBean, user.id).catch(() => {});
            }
            return updatedBean;
          }
          return b;
        })
      );
    }

    // Push to Supabase if logged in
    if (user) {
      upsertLogRemote(newLog, user.id).catch(() => {});
    }

    return newLog;
  };

  const updateLog = (id: string, updates: Partial<BrewLog>) => {
    setLogs((prev) => {
      const next = prev.map((l) => (l.id === id ? { ...l, ...updates } : l));
      const target = next.find((l) => l.id === id);
      if (user && target) {
        upsertLogRemote(target, user.id).catch(() => {});
      }
      return next;
    });
  };

  const deleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    setBeans((prev) =>
      prev.map((b) => (b.goldenLogId === id ? { ...b, goldenLogId: undefined } : b))
    );
    if (user) {
      deleteLogRemote(id).catch(() => {});
    }
  };

  const toggleGoldenRecipe = (logId: string) => {
    const targetLog = logs.find((l) => l.id === logId);
    if (!targetLog) return;

    const willBeGolden = !targetLog.isGolden;

    setLogs((prev) =>
      prev.map((l) => {
        if (l.beanId === targetLog.beanId) {
          const updated = {
            ...l,
            isGolden: l.id === logId ? willBeGolden : false,
          };
          if (user) upsertLogRemote(updated, user.id).catch(() => {});
          return updated;
        }
        return l;
      })
    );

    setBeans((prev) =>
      prev.map((b) => {
        if (b.id === targetLog.beanId) {
          const updated = {
            ...b,
            goldenLogId: willBeGolden ? logId : undefined,
          };
          if (user) upsertBeanRemote(updated, user.id).catch(() => {});
          return updated;
        }
        return b;
      })
    );
  };

  const resetToSampleData = () => {
    setBeans(INITIAL_BEANS);
    setLogs(INITIAL_LOGS);
    setActiveBeanId(INITIAL_BEANS[0].id);
  };

  const restoreFromBackup = (newBeans: CoffeeBean[], newLogs: BrewLog[]) => {
    setBeans(newBeans);
    setLogs(newLogs);
    if (newBeans.length > 0) {
      setActiveBeanId(newBeans[0].id);
    }
  };

  const getBeanById = (id: string) => beans.find((b) => b.id === id);
  
  const getLogsByBeanId = (beanId: string) =>
    logs
      .filter((l) => l.beanId === beanId)
      .sort((a, b) => new Date(b.brewDate).getTime() - new Date(a.brewDate).getTime());

  const getGoldenLogForBean = (beanId: string) => {
    const bean = getBeanById(beanId);
    if (!bean || !bean.goldenLogId) return undefined;
    return logs.find((l) => l.id === bean.goldenLogId);
  };

  return (
    <CoffeeContext.Provider
      value={{
        beans,
        logs,
        activeTab,
        setActiveTab,
        activeBeanId,
        setActiveBeanId,
        user,
        setUser,
        isCloudConfigured,
        syncStatus,
        lastSyncedAt,
        isAuthModalOpen,
        openAuthModal,
        closeAuthModal,
        syncWithCloud,
        migrateLocalToCloud,
        isBrewModalOpen,
        brewModalBeanId,
        brewModalPresetLogId,
        openBrewModal,
        closeBrewModal,
        isBeanModalOpen,
        editingBeanId,
        openBeanModal,
        closeBeanModal,
        isBeanDetailModalOpen,
        detailBeanId,
        openBeanDetailModal,
        closeBeanDetailModal,
        addBean,
        updateBean,
        deleteBean,
        addLog,
        updateLog,
        deleteLog,
        toggleGoldenRecipe,
        resetToSampleData,
        restoreFromBackup,
        getBeanById,
        getLogsByBeanId,
        getGoldenLogForBean,
      }}
    >
      {children}
    </CoffeeContext.Provider>
  );
};

export const useCoffee = () => {
  const context = useContext(CoffeeContext);
  if (!context) {
    throw new Error('useCoffee must be used within a CoffeeProvider');
  }
  return context;
};
