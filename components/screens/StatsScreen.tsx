"use client";
import { useCardStore } from '../../store/cardStore';
import { useFamilyStore } from '../../store/familyStore';
import { getExpiryStatus } from '../../lib/cardUtils';

export default function StatsScreen() {
  const { cards } = useCardStore();
  const { members } = useFamilyStore();
  
  const total = cards.length;
  const credits = cards.filter(c => c.type === 'Credit').length;
  const debits = cards.filter(c => c.type === 'Debit').length;
  
  const expiring = cards.filter(c => getExpiryStatus(c.expiry) === 'expiring').length;
  const expired = cards.filter(c => getExpiryStatus(c.expiry) === 'expired').length;

  const getHolderStats = (holder: string) => {
    const holderCards = cards.filter(c => c.holder === holder);
    const count = holderCards.length;
    const cred = holderCards.filter(c => c.type === 'Credit').length;
    const deb = holderCards.filter(c => c.type === 'Debit').length;
    const pct = total === 0 ? 0 : Math.round((count / total) * 100);
    return { count, cred, deb, pct };
  };

  const getBankStats = () => {
    const counts: Record<string, number> = {};
    cards.forEach(c => {
      counts[c.bank] = (counts[c.bank] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  const getNetworkStats = () => {
    const counts: Record<string, number> = {};
    cards.forEach(c => {
      counts[c.network] = (counts[c.network] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1]);
  };

  return (
    <div className="flex flex-col min-h-screen pb-24 px-4 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-sora font-bold mb-8">Statistics</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
        <div className="bg-surface-elevated p-4 rounded-xl border border-border">
          <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Total</p>
          <p className="text-2xl font-mono">{total}</p>
        </div>
        <div className="bg-surface-elevated p-4 rounded-xl border border-border flex justify-between">
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Credit</p>
            <p className="text-2xl font-mono">{credits}</p>
          </div>
          <div>
            <p className="text-text-muted text-xs uppercase tracking-wider mb-1">Debit</p>
            <p className="text-2xl font-mono">{debits}</p>
          </div>
        </div>
        <div className="bg-warning/10 p-4 rounded-xl border border-warning/20">
          <p className="text-warning text-xs uppercase tracking-wider mb-1">Expiring</p>
          <p className="text-2xl font-mono text-warning">{expiring}</p>
        </div>
        <div className="bg-danger/10 p-4 rounded-xl border border-danger/20">
          <p className="text-danger text-xs uppercase tracking-wider mb-1">Expired</p>
          <p className="text-2xl font-mono text-danger">{expired}</p>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Members Breakdown */}
        <div>
          <h3 className="font-sora font-semibold mb-4 text-lg">Per Member</h3>
          <div className="space-y-4">
            {members.map(member => {
              const s = getHolderStats(member.name);
              return (
                <div key={member.id} className="bg-surface-elevated p-4 rounded-xl border border-border">
                  <div className="flex justify-between items-end mb-3">
                    <span className="font-medium">{member.name}</span>
                    <span className="font-mono text-xl">{s.count}</span>
                  </div>
                  <div className="h-2 w-full bg-surface rounded-full overflow-hidden flex mb-2">
                    <div style={{ width: `${s.pct}%` }} className="h-full bg-primary" />
                  </div>
                  <div className="flex justify-between text-xs text-text-muted">
                    <span>{s.cred} Credit</span>
                    <span>{s.deb} Debit</span>
                    <span>{s.pct}% of total</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Banks & Networks */}
        <div className="space-y-8">
          <div>
            <h3 className="font-sora font-semibold mb-4 text-lg">Banks</h3>
            <div className="bg-surface-elevated p-4 rounded-xl border border-border space-y-3">
              {getBankStats().slice(0, 5).map(([bank, count]) => (
                <div key={bank} className="flex items-center gap-3">
                  <span className="w-24 truncate text-sm font-medium">{bank}</span>
                  <div className="flex-1 h-2 bg-surface rounded-full overflow-hidden">
                    <div style={{ width: `${(count / total) * 100}%` }} className="h-full bg-white/20" />
                  </div>
                  <span className="font-mono w-6 text-right">{count}</span>
                </div>
              ))}
              {getBankStats().length === 0 && <p className="text-text-muted text-sm text-center">No data</p>}
            </div>
          </div>

          <div>
            <h3 className="font-sora font-semibold mb-4 text-lg">Networks</h3>
            <div className="bg-surface-elevated p-4 rounded-xl border border-border flex flex-wrap gap-4">
              {getNetworkStats().map(([net, count]) => (
                <div key={net} className="flex-1 min-w-[80px] text-center">
                  <p className="text-sm text-text-muted mb-1">{net}</p>
                  <p className="text-xl font-mono font-medium">{count}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
