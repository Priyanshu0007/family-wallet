"use client";
import { useState, useMemo } from 'react';
import { useCardStore } from '../../store/cardStore';
import { useFamilyStore } from '../../store/familyStore';
import { getExpiryStatus, parseExpiry, maskCardNumber } from '../../lib/cardUtils';
import { Calendar, PieChart, Users, Building, ShieldAlert, CheckCircle, CreditCard, Clock, AlertTriangle, Trophy, Gem } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface ChartData {
  label: string;
  count: number;
  color: string;
}

function DonutChart({ data }: { data: ChartData[] }) {
  const total = data.reduce((sum, item) => sum + item.count, 0);
  const size = 180;
  const radius = 60;
  const strokeWidth = 20;
  const circumference = 2 * Math.PI * radius;
  
  if (total === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-6 h-full min-h-[180px] bg-surface/30 rounded-2xl border border-border/50">
        <p className="text-text-muted text-xs font-medium">No cards registered yet</p>
      </div>
    );
  }

  // Pre-calculate cumulative offsets purely to satisfy React Compiler purity rules
  const activeItems = data.filter(item => item.count > 0);
  const itemsWithOffsets = activeItems.map((item, index) => {
    const pct = (item.count / total) * 100;
    const previousPctSum = activeItems
      .slice(0, index)
      .reduce((sum, prevItem) => sum + (prevItem.count / total) * 100, 0);
    return { item, pct, offset: previousPctSum };
  });

  return (
    <div className="flex flex-col sm:flex-row items-center gap-8 py-4">
      {/* SVG Donut */}
      <div className="relative w-[180px] h-[180px] shrink-0">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="rotate-[-90deg]">
          {itemsWithOffsets.map(({ item, pct, offset }) => {
            const strokeLength = (pct / 100) * circumference;
            const strokeOffset = circumference - (offset / 100) * circumference;
            
            return (
              <circle
                key={item.label}
                cx={size / 2}
                cy={size / 2}
                r={radius}
                fill="transparent"
                stroke={item.color}
                strokeWidth={strokeWidth}
                strokeDasharray={`${strokeLength} ${circumference}`}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                className="transition-all duration-700 ease-out hover:stroke-[22px] origin-center cursor-pointer"
                style={{ transformOrigin: 'center' }}
              >
                <title>{`${item.label}: ${item.count} (${Math.round(pct)}%)`}</title>
              </circle>
            );
          })}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-3xl font-bold font-sora text-text-primary">{total}</span>
          <span className="text-[10px] text-text-muted uppercase tracking-widest font-semibold font-sora">Cards</span>
        </div>
      </div>
      
      {/* Legend */}
      <div className="flex-1 w-full space-y-2">
        {data.map(item => {
          if (item.count === 0) return null;
          const pct = Math.round((item.count / total) * 100);
          return (
            <div key={item.label} className="flex items-center justify-between hover:bg-surface/30 p-2 rounded-xl transition-all duration-200">
              <div className="flex items-center gap-2">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-xs font-semibold text-text-primary">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] text-text-muted font-mono">{item.count} card{item.count !== 1 ? 's' : ''}</span>
                <span className="text-[10px] font-bold font-mono w-10 text-right bg-surface-elevated/80 px-2 py-0.5 rounded border border-border/30 text-text-secondary">{pct}%</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export default function StatsScreen() {
  const { cards } = useCardStore();
  const { members } = useFamilyStore();
  const [donutMode, setDonutMode] = useState<'type' | 'network'>('type');
  
  const total = cards.length;
  const credits = cards.filter(c => c.type === 'Credit').length;
  const debits = cards.filter(c => c.type === 'Debit').length;
  
  const expiring = cards.filter(c => getExpiryStatus(c.expiry) === 'expiring').length;
  const expired = cards.filter(c => getExpiryStatus(c.expiry) === 'expired').length;

  // Reward points calculations — each card has its own pointValue (₹ per point)
  const DEFAULT_POINT_VALUE = 0.25;
  const totalRewardPoints = cards.reduce((sum, c) => sum + (c.rewardPoints ?? 0), 0);
  const totalPointsValue = cards.reduce((sum, c) => sum + (c.rewardPoints ?? 0) * (c.pointValue ?? DEFAULT_POINT_VALUE), 0);
  const cardsWithPoints = cards.filter(c => (c.rewardPoints ?? 0) > 0);
  const maxCardPoints = Math.max(...cardsWithPoints.map(c => c.rewardPoints ?? 0), 1);

  const rewardsByMember = useMemo(() => {
    const memberMap: Record<string, { name: string; points: number; value: number; cardCount: number; color: string }> = {};
    cards.forEach(c => {
      if (!memberMap[c.holder]) {
        const member = members.find(m => m.name === c.holder);
        memberMap[c.holder] = { name: c.holder, points: 0, value: 0, cardCount: 0, color: member?.color || '#6b7280' };
      }
      memberMap[c.holder].points += (c.rewardPoints ?? 0);
      memberMap[c.holder].value += (c.rewardPoints ?? 0) * (c.pointValue ?? DEFAULT_POINT_VALUE);
      memberMap[c.holder].cardCount++;
    });
    return Object.values(memberMap).sort((a, b) => b.value - a.value);
  }, [cards, members]);

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

  const getNetworkColor = (network: string) => {
    switch (network.toLowerCase()) {
      case 'visa': return '#2563eb'; // blue-600
      case 'mastercard': return '#ea580c'; // orange-600
      case 'amex': return '#0891b2'; // cyan-600
      case 'rupay': return '#059669'; // emerald-600
      default: return '#6b7280'; // gray
    }
  };

  const typeData = useMemo<ChartData[]>(() => [
    { label: 'Credit', count: credits, color: '#a855f7' }, // purple-500
    { label: 'Debit', count: debits, color: '#06b6d4' } // cyan-500
  ], [credits, debits]);

  const networkData = useMemo<ChartData[]>(() => {
    const networkCounts = getNetworkStats();
    return networkCounts.map(([net, val]) => ({
      label: net,
      count: val,
      color: getNetworkColor(net)
    }));
  }, [cards]);

  // Expiry Timeline logic
  const getMonthsRemaining = (expiry: string): number => {
    if (!expiry) return 999;
    try {
      const [month, year] = expiry.split('/');
      const expiryDate = new Date(2000 + parseInt(year, 10), parseInt(month, 10), 0); // last day of month
      const now = new Date();
      const diffMs = expiryDate.getTime() - now.getTime();
      const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
      return Math.max(-1, Math.ceil(diffDays / 30.4));
    } catch {
      return 999;
    }
  };

  const timelineCards = useMemo(() => {
    return [...cards]
      .filter(c => {
        const months = getMonthsRemaining(c.expiry);
        return months <= 12 || getExpiryStatus(c.expiry) === 'expired';
      })
      .sort((a, b) => {
        try {
          const dateA = parseExpiry(a.expiry).getTime();
          const dateB = parseExpiry(b.expiry).getTime();
          return dateA - dateB;
        } catch {
          return 0;
        }
      });
  }, [cards]);

  const holdersToRender = useMemo(() => {
    const definedMembers = members.map(m => ({
      id: m.id,
      name: m.name,
      relation: m.relation,
      color: m.color,
    }));
    
    const uniqueCardHolders = Array.from(new Set(cards.map(c => c.holder)))
      .filter(name => !members.some(m => m.name === name))
      .map(name => ({
        id: `temp-${name}`,
        name,
        relation: 'Custom',
        color: '#6b7280' // Gray fallback
      }));

    return [...definedMembers, ...uniqueCardHolders];
  }, [members, cards]);

  return (
    <div className="flex flex-col min-h-screen pb-24 px-4 py-8 md:px-12 md:py-12 max-w-4xl mx-auto w-full">
      <h2 className="text-2xl font-sora font-bold mb-8">Dashboard Statistics</h2>
      
      {/* Summary Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
        <div className="bg-surface-elevated p-4 rounded-2xl border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
          <p className="text-text-muted text-xs uppercase tracking-wider font-semibold font-sora mb-1">Total Cards</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className="text-3xl font-bold font-mono text-text-primary">{total}</span>
            <span className="text-xs text-text-secondary">active</span>
          </div>
        </div>
        <div className="bg-surface-elevated p-4 rounded-2xl border border-border/80 flex flex-col justify-between hover:border-primary/30 transition-all duration-300">
          <p className="text-text-muted text-xs uppercase tracking-wider font-semibold font-sora mb-1">Distribution</p>
          <div className="flex justify-between mt-2">
            <div>
              <p className="text-[10px] text-text-muted font-sora uppercase font-medium">Credit</p>
              <p className="text-xl font-bold font-mono text-purple-400">{credits}</p>
            </div>
            <div>
              <p className="text-[10px] text-text-muted font-sora uppercase font-medium">Debit</p>
              <p className="text-xl font-bold font-mono text-cyan-400">{debits}</p>
            </div>
          </div>
        </div>
        <div className={`p-4 rounded-2xl border transition-all duration-300 ${
          expiring > 0 ? 'bg-warning/10 border-warning/20 hover:border-warning/45' : 'bg-surface-elevated border-border/80'
        }`}>
          <p className={`text-xs uppercase tracking-wider font-semibold font-sora mb-1 ${expiring > 0 ? 'text-warning' : 'text-text-muted'}`}>Expiring Soon</p>
          <div className="flex items-baseline gap-2 mt-2">
            <span className={`text-3xl font-bold font-mono ${expiring > 0 ? 'text-warning' : 'text-text-primary'}`}>{expiring}</span>
            <span className="text-xs text-text-secondary">next 3m</span>
          </div>
        </div>
      </div>

      {/* Rewards Summary Strip */}
      <div className="bg-gradient-to-r from-amber-500/10 via-yellow-500/5 to-amber-500/10 p-5 rounded-2xl border border-amber-500/20 mb-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 bg-amber-500/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-2xl pointer-events-none" />
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-amber-500/25 to-yellow-500/25 flex items-center justify-center border border-amber-500/20 shadow-lg shadow-amber-500/10">
            <Trophy size={20} className="text-amber-400" />
          </div>
          <div>
            <h3 className="font-sora font-semibold text-base text-amber-200">Rewards Overview</h3>
            <p className="text-[10px] text-amber-300/50 font-medium">Point value varies per card</p>
          </div>
        </div>
        <div className="grid grid-cols-3 gap-4 relative z-10">
          <div>
            <p className="text-[10px] text-amber-300/60 uppercase tracking-wider font-semibold font-sora mb-1">Total Points</p>
            <p className="text-2xl font-bold font-mono text-amber-300">{totalRewardPoints.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-[10px] text-amber-300/60 uppercase tracking-wider font-semibold font-sora mb-1">Est. Value</p>
            <p className="text-2xl font-bold font-mono text-amber-400">₹{totalPointsValue.toLocaleString('en-IN')}</p>
          </div>
          <div>
            <p className="text-[10px] text-amber-300/60 uppercase tracking-wider font-semibold font-sora mb-1">Cards w/ Points</p>
            <p className="text-2xl font-bold font-mono text-amber-300">{cardsWithPoints.length}<span className="text-sm text-amber-400/50 ml-1">/ {total}</span></p>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-2 gap-8">
        {/* Left Column: Donut & Banks */}
        <div className="space-y-8">
          {/* Card Distribution (Donut Chart) */}
          <div className="bg-surface-elevated p-6 rounded-2xl border border-border/80">
            <div className="flex items-center justify-between mb-4 border-b border-border/40 pb-4">
              <h3 className="font-sora font-semibold text-base flex items-center gap-2">
                <PieChart size={18} className="text-primary" />
                <span>Card Distribution</span>
              </h3>
              
              {/* Segmented Control */}
              <div className="flex bg-surface p-0.5 rounded-lg border border-border/50 text-[10px] font-semibold">
                <button
                  type="button"
                  onClick={() => setDonutMode('type')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    donutMode === 'type' 
                      ? 'bg-surface-elevated text-primary shadow-sm font-bold' 
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  By Type
                </button>
                <button
                  type="button"
                  onClick={() => setDonutMode('network')}
                  className={`px-2.5 py-1 rounded-md transition-all ${
                    donutMode === 'network' 
                      ? 'bg-surface-elevated text-primary shadow-sm font-bold' 
                      : 'text-text-muted hover:text-text-secondary'
                  }`}
                >
                  By Network
                </button>
              </div>
            </div>

            <DonutChart data={donutMode === 'type' ? typeData : networkData} />
          </div>

          {/* Banks distribution */}
          <div className="bg-surface-elevated p-6 rounded-2xl border border-border/80">
            <h3 className="font-sora font-semibold text-base mb-5 flex items-center gap-2 border-b border-border/40 pb-4">
              <Building size={18} className="text-primary" />
              <span>Cards per Bank</span>
            </h3>
            <div className="space-y-4">
              {getBankStats().slice(0, 5).map(([bank, count]) => (
                <div key={bank} className="space-y-1 group">
                  <div className="flex justify-between items-center text-xs font-semibold">
                    <span className="text-text-secondary truncate max-w-[200px]">{bank}</span>
                    <span className="font-mono text-text-muted">{count} card{count !== 1 ? 's' : ''}</span>
                  </div>
                  <div className="h-2 bg-surface rounded-full overflow-hidden relative">
                    <div 
                      style={{ width: `${(count / total) * 100}%` }} 
                      className="h-full bg-gradient-to-r from-primary/80 to-primary rounded-full transition-all duration-1000 ease-out group-hover:from-primary group-hover:to-indigo-500" 
                    />
                  </div>
                </div>
              ))}
              {getBankStats().length === 0 && (
                <p className="text-text-muted text-xs text-center py-4 font-medium">No registered cards</p>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Members Breakdown */}
        <div className="space-y-8">
          <div className="bg-surface-elevated p-6 rounded-2xl border border-border/80">
            <h3 className="font-sora font-semibold text-base mb-5 flex items-center gap-2 border-b border-border/40 pb-4">
              <Users size={18} className="text-primary" />
              <span>Cards per Member</span>
            </h3>
            <div className="space-y-5">
              {holdersToRender.map(member => {
                const s = getHolderStats(member.name);
                return (
                  <div key={member.id} className="group hover:bg-surface/30 p-2 -mx-2 rounded-xl transition-all duration-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="font-semibold text-xs text-text-primary">{member.name}</span>
                        <span className="text-[10px] text-text-muted bg-surface/50 px-1.5 py-0.5 rounded border border-border/30">{member.relation}</span>
                      </div>
                      <span className="font-mono font-bold text-sm text-text-primary">{s.count}</span>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden mb-2">
                      <div 
                        style={{ 
                          width: `${s.pct}%`, 
                          backgroundColor: member.color,
                          boxShadow: `0 0 8px ${member.color}40`
                        }} 
                        className="h-full rounded-full transition-all duration-1000 ease-out" 
                      />
                    </div>
                    <div className="flex justify-between text-[10px] text-text-muted font-medium px-0.5">
                      <span>{s.cred} Credit · {s.deb} Debit</span>
                      <span>{s.pct}% of total</span>
                    </div>
                  </div>
                );
              })}
              {holdersToRender.length === 0 && (
                <p className="text-text-muted text-xs text-center py-4 font-medium">No family members registered</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* 12-Month Upcoming Expiries Timeline */}
      <div className="bg-surface-elevated p-6 rounded-2xl border border-border/80 mt-8">
        <h3 className="font-sora font-semibold text-base mb-5 flex items-center gap-2 border-b border-border/40 pb-4">
          <Calendar className="text-primary" size={18} />
          <span>12-Month Expiry Timeline</span>
        </h3>
        
        {timelineCards.length === 0 ? (
          <div className="text-center py-8 px-4 flex flex-col items-center">
            <CheckCircle size={36} className="text-success mb-2 opacity-80" />
            <p className="text-text-muted text-xs font-semibold">All cards are secure and valid</p>
            <p className="text-[10px] text-text-secondary mt-1">No cards are expiring in the next 12 months.</p>
          </div>
        ) : (
          <div className="relative pl-6 border-l border-border/80 space-y-6 ml-3">
            {timelineCards.map((card) => {
              const status = getExpiryStatus(card.expiry);
              const months = getMonthsRemaining(card.expiry);
              
              let tagColor = '';
              let tagText = '';
              let dotColor = '';
              let alertIcon = null;
              
              if (status === 'expired') {
                tagColor = 'bg-danger/10 text-danger border-danger/20';
                tagText = 'Expired';
                dotColor = 'bg-danger ring-danger/20';
                alertIcon = <ShieldAlert size={12} className="text-danger inline" />;
              } else if (status === 'expiring') {
                tagColor = 'bg-warning/10 text-warning border-warning/20';
                tagText = months <= 0 ? 'Expires this month' : `Expires in ${months}m`;
                dotColor = 'bg-warning ring-warning/20';
                alertIcon = <Clock size={12} className="text-warning inline" />;
              } else {
                tagColor = 'bg-success/10 text-success border-success/20';
                tagText = `Valid (${months}m left)`;
                dotColor = 'bg-success ring-success/20';
              }
              
              return (
                <div key={card.id} className="relative group">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[31px] top-2 w-2.5 h-2.5 rounded-full ring-4 ${dotColor} transition-transform group-hover:scale-125`} />
                  
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-surface/40 hover:bg-surface-elevated/40 border border-border/50 rounded-xl transition-all duration-300">
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="font-sora font-semibold text-xs text-text-primary">{card.bank}</span>
                        <span className="text-[10px] text-text-muted">• {card.variant}</span>
                      </div>
                      <p className="text-[11px] text-text-secondary font-mono">
                        {maskCardNumber(card.number)}
                      </p>
                      <p className="text-[10px] text-text-muted mt-0.5">
                        Holder: <span className="text-text-secondary font-semibold">{card.holder}</span>
                      </p>
                    </div>
                    
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold bg-surface-elevated px-2 py-0.5 rounded border border-border/40 text-text-secondary">
                        {card.expiry}
                      </span>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border flex items-center gap-1 ${tagColor}`}>
                        {alertIcon}
                        <span>{tagText}</span>
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Rewards Breakdown Section */}
      {cardsWithPoints.length > 0 && (
        <div className="bg-surface-elevated p-6 rounded-2xl border border-border/80 mt-8">
          <h3 className="font-sora font-semibold text-base mb-5 flex items-center gap-2 border-b border-border/40 pb-4">
            <Gem size={18} className="text-amber-400" />
            <span>Rewards Breakdown</span>
          </h3>

          {/* Per-member reward aggregation */}
          <div className="mb-6">
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold font-sora mb-3">Points by Member</p>
            <div className="space-y-3">
              {rewardsByMember.filter(m => m.points > 0).map(member => {
                const pct = totalPointsValue > 0 ? Math.round((member.value / totalPointsValue) * 100) : 0;
                return (
                  <div key={member.name} className="group hover:bg-surface/30 p-2 -mx-2 rounded-xl transition-all duration-200">
                    <div className="flex justify-between items-center mb-1.5">
                      <div className="flex items-center gap-2">
                        <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: member.color }} />
                        <span className="font-semibold text-xs text-text-primary">{member.name}</span>
                        <span className="text-[10px] text-text-muted bg-surface/50 px-1.5 py-0.5 rounded border border-border/30">{member.cardCount} card{member.cardCount !== 1 ? 's' : ''}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-bold text-xs text-amber-300">{member.points.toLocaleString('en-IN')} pts</span>
                        <span className="text-[10px] font-bold font-mono bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/15 text-amber-400">₹{member.value.toLocaleString('en-IN')}</span>
                      </div>
                    </div>
                    <div className="h-2 w-full bg-surface rounded-full overflow-hidden">
                      <div 
                        style={{ 
                          width: `${pct}%`,
                          boxShadow: '0 0 8px rgba(245, 158, 11, 0.3)'
                        }} 
                        className="h-full rounded-full transition-all duration-1000 ease-out bg-gradient-to-r from-amber-500/80 to-yellow-500/80" 
                      />
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Per-card breakdown */}
          <div>
            <p className="text-xs text-text-muted uppercase tracking-wider font-semibold font-sora mb-3">Points by Card</p>
            <div className="space-y-2.5 max-h-[320px] overflow-y-auto no-scrollbar">
              {[...cardsWithPoints]
                .sort((a, b) => (b.rewardPoints ?? 0) - (a.rewardPoints ?? 0))
                .map(card => {
                  const pts = card.rewardPoints ?? 0;
                  const pv = card.pointValue ?? DEFAULT_POINT_VALUE;
                  const barPct = Math.round((pts / maxCardPoints) * 100);
                  const value = (pts * pv).toLocaleString('en-IN');
                  return (
                    <div key={card.id} className="group">
                      <div className="flex justify-between items-center mb-1">
                        <div className="flex items-center gap-2 min-w-0">
                          <span className="text-xs font-semibold text-text-primary truncate">{card.bank}</span>
                          <span className="text-[10px] text-text-muted truncate">• {card.variant}</span>
                          <span className="text-[9px] text-amber-400/40 font-mono">@₹{pv}/pt</span>
                        </div>
                        <div className="flex items-center gap-2 shrink-0">
                          <span className="text-[11px] font-mono font-bold text-amber-300">{pts.toLocaleString('en-IN')}</span>
                          <span className="text-[10px] text-amber-400/60 font-mono">≈₹{value}</span>
                        </div>
                      </div>
                      <div className="h-1.5 bg-surface rounded-full overflow-hidden">
                        <div 
                          style={{ width: `${barPct}%` }} 
                          className="h-full bg-gradient-to-r from-amber-500/60 to-yellow-500/60 rounded-full transition-all duration-1000 ease-out group-hover:from-amber-500 group-hover:to-yellow-500" 
                        />
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
