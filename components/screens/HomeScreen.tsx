"use client";
import TopBar from '../layout/TopBar';
import FilterChips from '../ui/FilterChips';
import CardList from '../cards/CardList';
import FavoritesShelf from '../cards/FavoritesShelf';
import { useUiStore } from '../../store/uiStore';
import { Plus, Calendar, AlertTriangle, ShieldAlert } from 'lucide-react';
import { useCardStore } from '../../store/cardStore';
import { getBillDueStatus } from '../../lib/cardUtils';

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

  const alerts = cards.reduce((acc, card) => {
    if (card.type === 'Credit' && card.limit) {
      const util = Math.round(((card.usedCredit || 0) / card.limit) * 100);
      if (util >= 75) {
        acc.push({
          id: `${card.id}-util`,
          type: 'high-utilization',
          severity: 'warning',
          message: `${card.bank} ${card.variant} has high utilization (${util}%)`,
          card
        });
      }
      
      const bill = getBillDueStatus(card.dueDateDay);
      if (bill) {
        if (bill.dueToday) {
          acc.push({
            id: `${card.id}-due-today`,
            type: 'bill-due-today',
            severity: 'danger',
            message: `Bill is due TODAY for ${card.bank} ${card.variant}`,
            card
          });
        } else if (bill.dueSoon) {
          acc.push({
            id: `${card.id}-due-soon`,
            type: 'bill-due-soon',
            severity: 'info',
            message: `Bill is due in ${bill.daysRemaining} days (${card.dueDateDay}th) for ${card.bank} ${card.variant}`,
            card
          });
        }
      }
    }
    return acc;
  }, [] as any[]);

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

      {/* Alerts & Notifications Panel */}
      {alerts.length > 0 && (
        <div className="px-4 py-4 bg-surface-elevated/20 border-b border-border flex flex-col gap-3 animate-in fade-in duration-300">
          <div className="flex items-center gap-2 text-[10px] font-bold text-text-muted uppercase tracking-wider font-sora">
            <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-pulse" />
            <span>Alerts & Notifications ({alerts.length})</span>
          </div>
          <div className="flex flex-col gap-2">
            {alerts.map(alert => (
              <div 
                key={alert.id} 
                className={`flex items-center justify-between p-3.5 rounded-xl border text-xs font-semibold font-sora ${
                  alert.severity === 'danger' ? 'bg-danger/10 border-danger/25 text-danger' :
                  alert.severity === 'warning' ? 'bg-warning/10 border-warning/25 text-warning' :
                  'bg-indigo-500/10 border-indigo-500/25 text-indigo-300'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0 pr-2">
                  {alert.severity === 'danger' ? <ShieldAlert size={15} className="shrink-0 animate-bounce text-danger" /> :
                   alert.severity === 'warning' ? <AlertTriangle size={15} className="shrink-0 text-warning" /> :
                   <Calendar size={15} className="shrink-0 text-indigo-400" />}
                  <span className="truncate">{alert.message}</span>
                </div>
                <button 
                  onClick={() => openSheet('cardDetail', alert.card.id)}
                  className={`px-3 py-1.5 rounded-xl border text-[10px] font-bold shrink-0 transition-all active:scale-95 ${
                    alert.severity === 'danger' ? 'bg-danger/20 border-danger/30 hover:bg-danger/30 text-white' :
                    alert.severity === 'warning' ? 'bg-warning/20 border-warning/30 hover:bg-warning/30 text-white' :
                    'bg-indigo-500/20 border-indigo-500/30 hover:bg-indigo-500/30 text-white'
                  }`}
                >
                  View Card
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      <FavoritesShelf />

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
