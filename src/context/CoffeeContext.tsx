import React, { createContext, useContext, useEffect, useState } from 'react';
import { INITIAL_BEANS, INITIAL_LOGS } from '../data/sampleData';
import { BrewLog, CoffeeBean } from '../types/coffee';

export type ActiveTab = 'beans' | 'trends' | 'history' | 'backup';

interface CoffeeContextType {
  beans: CoffeeBean[];
  logs: BrewLog[];
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  activeBeanId: string | null;
  setActiveBeanId: (id: string | null) => void;
  
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
};

const CoffeeContext = createContext<CoffeeContextType | null>(null);

export const CoffeeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [beans, setBeans] = useState<CoffeeBean[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.BEANS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load beans from localStorage', e);
    }
    return INITIAL_BEANS;
  });

  const [logs, setLogs] = useState<BrewLog[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.LOGS);
      if (saved) {
        return JSON.parse(saved);
      }
    } catch (e) {
      console.error('Failed to load logs from localStorage', e);
    }
    return INITIAL_LOGS;
  });

  const [activeTab, setActiveTab] = useState<ActiveTab>('beans');
  const [activeBeanId, setActiveBeanId] = useState<string | null>(beans[0]?.id || null);

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
    return newBean;
  };

  const updateBean = (id: string, updates: Partial<CoffeeBean>) => {
    setBeans((prev) =>
      prev.map((b) => (b.id === id ? { ...b, ...updates } : b))
    );
  };

  const deleteBean = (id: string) => {
    setBeans((prev) => prev.filter((b) => b.id !== id));
    setLogs((prev) => prev.filter((l) => l.beanId !== id));
    if (activeBeanId === id) {
      const remaining = beans.filter((b) => b.id !== id);
      setActiveBeanId(remaining[0]?.id || null);
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
            return {
              ...b,
              remainingWeightGrams: newRemaining,
              status,
              // If marked as golden, link to bean
              goldenLogId: logData.isGolden ? newLog.id : b.goldenLogId,
            };
          }
          return b;
        })
      );
    }

    return newLog;
  };

  const updateLog = (id: string, updates: Partial<BrewLog>) => {
    setLogs((prev) =>
      prev.map((l) => (l.id === id ? { ...l, ...updates } : l))
    );
  };

  const deleteLog = (id: string) => {
    setLogs((prev) => prev.filter((l) => l.id !== id));
    // Clear goldenLogId if it matched
    setBeans((prev) =>
      prev.map((b) => (b.goldenLogId === id ? { ...b, goldenLogId: undefined } : b))
    );
  };

  const toggleGoldenRecipe = (logId: string) => {
    const targetLog = logs.find((l) => l.id === logId);
    if (!targetLog) return;

    const willBeGolden = !targetLog.isGolden;

    // Update log
    setLogs((prev) =>
      prev.map((l) => {
        if (l.beanId === targetLog.beanId) {
          return {
            ...l,
            isGolden: l.id === logId ? willBeGolden : false,
          };
        }
        return l;
      })
    );

    // Update bean's goldenLogId reference
    setBeans((prev) =>
      prev.map((b) => {
        if (b.id === targetLog.beanId) {
          return {
            ...b,
            goldenLogId: willBeGolden ? logId : undefined,
          };
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
