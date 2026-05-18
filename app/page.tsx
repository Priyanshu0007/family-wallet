"use client";
import { useEffect, useState } from 'react';
import { usePinStore } from '../store/pinStore';
import { useCardStore } from '../store/cardStore';
import PinLock from '../components/pin/PinLock';
import PinSetup from '../components/pin/PinSetup';
import BottomNav from '../components/layout/BottomNav';
import Sidebar from '../components/layout/Sidebar';
import HomeScreen from '../components/screens/HomeScreen';
import StatsScreen from '../components/screens/StatsScreen';
import SettingsScreen from '../components/screens/SettingsScreen';
import Toast from '../components/ui/Toast';
import SortModal from '../components/ui/SortModal';
import CardDetail from '../components/cards/CardDetail';
import CardForm from '../components/cards/CardForm';

export default function App() {
  const { isLocked, isFirstLaunch, initialize, lock, timeoutDuration } = usePinStore();
  const { loadCards } = useCardStore();
  const [activeTab, setActiveTab] = useState('cards');
  const [isInit, setIsInit] = useState(false);

  useEffect(() => {
    initialize().then(() => setIsInit(true));
  }, [initialize]);

  // Handle auto-lock on background
  useEffect(() => {
    if (timeoutDuration === -1) return; // Never lock

    let timeout: NodeJS.Timeout;
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        timeout = setTimeout(() => {
          lock();
        }, timeoutDuration * 60 * 1000);
      } else {
        clearTimeout(timeout);
      }
    };
    
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      clearTimeout(timeout);
    };
  }, [lock, timeoutDuration]);

  // Load cards when unlocked
  useEffect(() => {
    if (!isLocked && isInit) {
      loadCards();
    }
  }, [isLocked, isInit, loadCards]);

  if (!isInit) return <div className="min-h-screen bg-background" />;

  if (isFirstLaunch) {
    return <PinSetup />;
  }

  if (isLocked) {
    return <PinLock />;
  }

  return (
    <div className="flex h-screen bg-background overflow-hidden text-text-primary">
      <Sidebar activeTab={activeTab} setActiveTab={setActiveTab} />
      
      <main className="flex-1 md:ml-64 h-full overflow-y-auto relative no-scrollbar">
        {activeTab === 'cards' && <HomeScreen />}
        {activeTab === 'stats' && <StatsScreen />}
        {activeTab === 'settings' && <SettingsScreen />}
      </main>

      <BottomNav activeTab={activeTab} setActiveTab={setActiveTab} />

      {/* Global Overlays */}
      <CardDetail />
      <CardForm />
      <SortModal />
      <Toast />
    </div>
  );
}
