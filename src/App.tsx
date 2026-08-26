import React from 'react';
import { useCoffee } from './context/CoffeeContext';
import { Navbar } from './components/layout/Navbar';
import { BeanList } from './components/beans/BeanList';
import { BeanModal } from './components/beans/BeanModal';
import { BeanDetailModal } from './components/beans/BeanDetailModal';
import { BrewSessionModal } from './components/brew/BrewSessionModal';
import { TrendsDashboard } from './components/analytics/TrendsDashboard';
import { BrewHistoryList } from './components/history/BrewHistoryList';
import { BackupModal } from './components/backup/BackupModal';
import { AuthModal } from './components/auth/AuthModal';
import { ResetPasswordModal } from './components/auth/ResetPasswordModal';
import { ThemeSwitcherModal } from './components/theme/ThemeSwitcherModal';
import { TastingDialinModal } from './components/brew/TastingDialinModal';
import { Coffee, Heart } from 'lucide-react';

export const App: React.FC = () => {
  const { activeTab } = useCoffee();

  return (
    <div className="min-h-screen bg-stone-950 text-stone-100 flex flex-col font-sans selection:bg-amber-600 selection:text-white">
      {/* Top Sticky Navigation Bar */}
      <Navbar />

      {/* Main Content Area */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
        {activeTab === 'beans' && <BeanList />}
        {activeTab === 'trends' && <TrendsDashboard />}
        {activeTab === 'history' && <BrewHistoryList />}
        {activeTab === 'backup' && <BackupModal />}
      </main>

      {/* Global Modals */}
      <BrewSessionModal />
      <BeanModal />
      <BeanDetailModal />
      <TastingDialinModal />
      <AuthModal />
      <ResetPasswordModal />
      <ThemeSwitcherModal />

      {/* App Footer */}
      <footer className="border-t border-stone-900 bg-stone-950/80 py-6 text-center text-xs text-stone-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-3">
          <div className="flex items-center space-x-2">
            <Coffee className="w-4 h-4 text-amber-500" />
            <span className="font-semibold text-stone-400">BrewLog 萃取日記</span>
            <span>• Specialty Coffee Extraction & Flavor Tracker</span>
          </div>

          <div className="flex items-center space-x-1">
            <span>Crafted with</span>
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>for Pour-Over Coffee Lovers</span>
          </div>
        </div>
      </footer>
    </div>
  );
};
