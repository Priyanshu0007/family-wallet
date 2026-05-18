"use client";
import TopBar from '../layout/TopBar';
import FilterChips from '../ui/FilterChips';
import CardList from '../cards/CardList';
import { useUiStore } from '../../store/uiStore';
import { Plus } from 'lucide-react';
import { useCardStore } from '../../store/cardStore';

export default function HomeScreen() {
  const openSheet = useUiStore(s => s.openSheet);
  const { cards } = useCardStore();

  const expiringCount = cards.filter(c => {
    try {
      const [m, y] = c.expiry.split('/');
      const date = new Date(2000 + parseInt(y), parseInt(m), 0);
      const now = new Date();
      if (date < now) return false;
      now.setMonth(now.getMonth() + 3);
      return date <= now;
    } catch { return false; }
  }).length;

  const expiredCount = cards.filter(c => {
    try {
      const [m, y] = c.expiry.split('/');
      const date = new Date(2000 + parseInt(y), parseInt(m), 0);
      return date < new Date();
    } catch { return false; }
  }).length;

  return (
    <div className="flex flex-col min-h-screen pb-20 md:pb-0 relative">
      <TopBar />
      
      {/* Stats Bar */}
      <div className="flex overflow-x-auto no-scrollbar px-4 py-3 gap-4 border-b border-border bg-surface text-sm whitespace-nowrap z-40 sticky top-16">
        <div className="flex items-center gap-2">
          <span className="text-text-muted">Total</span>
          <span className="font-mono font-bold">{cards.length}</span>
        </div>
        <div className="w-px h-4 bg-border my-auto" />
        <div className="flex items-center gap-2">
          <span className="text-warning">Expiring</span>
          <span className="font-mono font-bold text-warning">{expiringCount}</span>
        </div>
        <div className="w-px h-4 bg-border my-auto" />
        <div className="flex items-center gap-2">
          <span className="text-danger">Expired</span>
          <span className="font-mono font-bold text-danger">{expiredCount}</span>
        </div>
      </div>

      <FilterChips />
      
      <div className="flex-1">
        <CardList />
      </div>

      {/* FAB */}
      <button 
        onClick={() => openSheet('addCard')}
        className="fixed bottom-20 md:bottom-8 right-4 md:right-8 w-14 h-14 bg-primary text-white rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 active:scale-95 transition-all z-20"
      >
        <Plus size={28} />
      </button>
    </div>
  );
}
