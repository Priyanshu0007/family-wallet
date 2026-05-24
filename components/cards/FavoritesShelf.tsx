"use client";
import { useCardStore } from '../../store/cardStore';
import { useUiStore } from '../../store/uiStore';
import { getBankColorClass } from '../../lib/constants';
import { Pin } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

export default function FavoritesShelf() {
  const { cards } = useCardStore();
  const { openSheet } = useUiStore();
  
  const pinnedCards = cards.filter(c => c.isPinned);

  if (pinnedCards.length === 0) return null;

  return (
    <div className="py-4 border-b border-border bg-surface-elevated/10 flex flex-col gap-3 animate-in fade-in duration-300">
      <div className="flex items-center justify-between px-4">
        <div className="flex items-center gap-2 text-xs font-bold text-text-muted uppercase tracking-wider font-sora">
          <Pin size={14} className="text-amber-500 fill-amber-500/20 rotate-45" />
          <span>Pinned Favorites {pinnedCards.length > 0 && `(${pinnedCards.length})`}</span>
        </div>
      </div>

      {pinnedCards.length === 0 ? (
        <div className="px-4">
          <div className="border border-dashed border-border/70 rounded-2xl p-5 flex flex-col items-center justify-center text-center bg-surface-elevated/15 backdrop-blur-sm">
            <Pin size={18} className="text-text-muted mb-2.5 rotate-45 opacity-60" />
            <p className="text-xs font-semibold text-text-secondary mb-1">No pinned cards yet</p>
            <p className="text-[10px] text-text-muted max-w-[280px] leading-relaxed">
              Pin your top-used cards for one-tap access. Tap a card below and click the pin icon in the top right.
            </p>
          </div>
        </div>
      ) : (
        <div className="flex overflow-x-auto no-scrollbar gap-4 px-4 pb-2">
          <AnimatePresence mode="popLayout">
            {pinnedCards.map(card => {
              const bgClass = card.color && card.color.includes('from-') 
                ? card.color 
                : getBankColorClass(card.bank);
              const lastFour = card.number.replace(/\s/g, '').slice(-4);
              
              return (
                <motion.div
                  key={card.id}
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  whileHover={{ y: -4, scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  transition={{ type: "spring", stiffness: 400, damping: 25 }}
                  onClick={() => openSheet('cardDetail', card.id)}
                  className={`relative w-[190px] h-[120px] shrink-0 rounded-xl text-white overflow-hidden shadow-lg bg-gradient-to-br ${bgClass} border border-white/10 p-3.5 flex flex-col justify-between cursor-pointer select-none`}
                >
                  {/* Noise Overlay */}
                  <div className="absolute inset-0 opacity-15 pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj4KICA8ZmlsdGVyIGlkPSJub2lzZSI+CiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiAvPgogIDwvZmlsdGVyPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIC8+Cjwvc3ZnPg==')]" />
                  
                  {/* Glowing Orb */}
                  <div className="absolute top-0 right-0 w-24 h-24 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-xl pointer-events-none" />

                  {/* Top info */}
                  <div className="flex justify-between items-start z-10">
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="font-sora font-extrabold text-[10px] tracking-wider uppercase leading-none truncate">{card.bank}</span>
                      <span className="text-[7px] uppercase tracking-wider opacity-75 font-medium font-sora truncate">{card.variant}</span>
                    </div>
                    {/* Small Network label */}
                    <span className="text-[7.5px] font-bold font-mono tracking-wider bg-white/10 border border-white/15 px-1.5 py-0.5 rounded leading-none">
                      {card.network}
                    </span>
                  </div>

                  {/* Card Number & Holder info */}
                  <div className="z-10 mt-auto flex justify-between items-end">
                    <div className="flex flex-col min-w-0 pr-1">
                      <span className="text-[8px] opacity-75 font-medium tracking-wide uppercase truncate max-w-[100px] leading-tight mb-0.5">{card.holder}</span>
                      <span className="font-mono text-xs tracking-widest font-bold">
                        •••• {lastFour}
                      </span>
                    </div>
                    <span className="text-[8.5px] opacity-75 font-mono shrink-0 mb-0.5">
                      {card.expiry}
                    </span>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
