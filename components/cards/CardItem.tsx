"use client";
import { Card } from '../../store/db';
import CardVisual from './CardVisual';
import { motion } from 'framer-motion';
import { useUiStore } from '../../store/uiStore';
import { getCardUtilization, getBillDueStatus } from '../../lib/cardUtils';
import { Calendar } from 'lucide-react';

export default function CardItem({ card }: { card: Card }) {
  const { openSheet } = useUiStore();
  const utilization = getCardUtilization(card.usedCredit, card.limit);
  const billStatus = getBillDueStatus(card.dueDateDay);

  const hasCreditInfo = card.type === 'Credit' && card.limit !== undefined && card.limit > 0;

  return (
    <motion.div 
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95 }}
      whileHover={{ y: -6, scale: 1.015 }}
      whileTap={{ scale: 0.985 }}
      transition={{ type: "spring", stiffness: 400, damping: 25 }}
      onClick={() => openSheet('cardDetail', card.id)}
      className="cursor-pointer flex flex-col gap-3 group"
    >
      <div className="relative">
        <CardVisual card={card} />
      </div>
      
      {hasCreditInfo && (
        <div className="bg-surface-elevated/45 border border-border/40 hover:border-border/60 hover:bg-surface-elevated/60 rounded-2xl p-3.5 flex flex-col gap-2.5 transition-all duration-300 backdrop-blur-sm -mt-1 shadow-sm">
          {/* Utilization bar and stats */}
          <div className="flex justify-between items-center text-xs">
            <span className="text-text-secondary font-medium font-sora">Credit Utilization</span>
            <span className={`font-mono font-bold ${
              utilization >= 75 ? 'text-rose-400' : utilization >= 50 ? 'text-amber-400' : 'text-emerald-400'
            }`}>
              {utilization}% ({`₹${(card.usedCredit || 0).toLocaleString('en-IN')} / ₹${card.limit!.toLocaleString('en-IN')}`})
            </span>
          </div>
          
          <div className="h-1.5 bg-surface rounded-full overflow-hidden">
            <div 
              className={`h-full bg-gradient-to-r rounded-full transition-all duration-500 ${
                utilization >= 75 ? 'from-rose-500 to-red-500 shadow-[0_0_8px_rgba(244,63,94,0.3)]' :
                utilization >= 50 ? 'from-amber-400 to-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.3)]' :
                'from-emerald-400 to-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]'
              }`}
              style={{ width: `${utilization}%` }}
            />
          </div>
          
          {/* Billing alerts and info */}
          {billStatus && (
            <div className="flex justify-between items-center text-[11px] border-t border-border/30 pt-2.5 mt-0.5">
              <span className="text-text-muted flex items-center gap-1.5 font-medium font-sora">
                <Calendar size={12.5} className="text-text-muted/70" />
                <span>Due on {billStatus.dueDay}th of month</span>
              </span>
              
              {billStatus.dueToday ? (
                <span className="text-rose-400 font-bold bg-rose-500/10 border border-rose-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1 animate-pulse">
                  <span className="w-1 h-1 rounded-full bg-rose-500" />
                  <span>Due Today</span>
                </span>
              ) : billStatus.dueSoon ? (
                <span className="text-amber-400 font-bold bg-amber-500/10 border border-amber-500/25 px-2.5 py-0.5 rounded-full flex items-center gap-1">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
                  <span>Due in {billStatus.daysRemaining} days</span>
                </span>
              ) : (
                <span className="text-text-secondary font-semibold bg-surface/80 border border-border/40 px-2 py-0.5 rounded-full font-mono text-[10px]">
                  Due in {billStatus.daysRemaining} days
                </span>
              )}
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
