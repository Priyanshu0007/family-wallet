"use client";
import { Card } from '../../store/db';
import { maskCardNumber, getExpiryStatus } from '../../lib/cardUtils';
import { getBankColorClass } from '../../lib/constants';

interface CardVisualProps {
  card: Card;
  showFullNumber?: boolean;
}

export default function CardVisual({ card, showFullNumber = false }: CardVisualProps) {
  const bgClass = getBankColorClass(card.bank);
  const status = getExpiryStatus(card.expiry);
  const displayNum = showFullNumber ? card.number : maskCardNumber(card.number);

  return (
    <div className={`relative w-full max-w-[420px] mx-auto rounded-[16px] p-6 text-white overflow-hidden shadow-2xl bg-gradient-to-br ${bgClass}`} style={{ aspectRatio: '1.586' }}>
      {/* Noise Texture */}
      <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj4KICA8ZmlsdGVyIGlkPSJub2lzZSI+CiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiAvPgogIDwvZmlsdGVyPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIC8+Cjwvc3ZnPg==')]" />
      
      {/* Network overlay abstract shapes (optional) */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none" />

      {/* Top row */}
      <div className="relative flex justify-between items-start mb-6 z-10">
        <div className="w-12 h-9 bg-gradient-to-br from-[#ffd700] to-[#b8860b] rounded-md relative overflow-hidden shadow-inner flex items-center justify-center">
          <div className="w-full h-[1px] bg-black/20 absolute top-1/3" />
          <div className="w-full h-[1px] bg-black/20 absolute bottom-1/3" />
          <div className="w-[1px] h-full bg-black/20 absolute left-1/3" />
          <div className="w-[1px] h-full bg-black/20 absolute right-1/3" />
          <div className="w-6 h-5 border border-black/20 rounded-sm absolute" />
        </div>
        <div className="text-right">
          <span className="font-sora font-bold text-lg tracking-wider block drop-shadow-md">{card.bank.toUpperCase()}</span>
          <span className="text-[10px] uppercase tracking-widest opacity-80 font-medium">{card.variant}</span>
        </div>
      </div>

      {/* Number */}
      <div className="relative mb-6 z-10 mt-auto">
        <div className="font-mono text-xl tracking-[0.15em] drop-shadow-md">
          {displayNum}
        </div>
      </div>

      {/* Bottom row */}
      <div className="relative flex justify-between items-end z-10">
        <div className="flex gap-6">
          <div>
            <div className="text-[8px] opacity-70 uppercase tracking-widest mb-1">Valid Thru</div>
            <div className="font-mono text-sm tracking-widest drop-shadow-md">{card.expiry}</div>
          </div>
          <div className="flex flex-col justify-end">
            <div className="font-sora text-sm font-medium tracking-wide uppercase drop-shadow-md pb-0.5">{card.holder}</div>
          </div>
        </div>

        {/* Network Logo */}
        <div className="h-10 w-16 flex items-end justify-end">
          {card.network === 'Visa' && (
            <span className="font-bold text-2xl italic tracking-tighter drop-shadow-md">VISA</span>
          )}
          {card.network === 'Mastercard' && (
            <div className="flex relative">
              <div className="w-8 h-8 rounded-full bg-red-500/90 mix-blend-screen relative z-10"></div>
              <div className="w-8 h-8 rounded-full bg-orange-500/90 mix-blend-screen absolute left-4 z-0"></div>
            </div>
          )}
          {card.network === 'Amex' && (
            <div className="bg-blue-600/90 px-2 py-1 rounded text-[10px] font-bold uppercase shadow-sm">
              AMEX
            </div>
          )}
          {card.network === 'RuPay' && (
            <span className="font-bold text-xl italic tracking-tight drop-shadow-md">RuPay</span>
          )}
        </div>
      </div>

      {/* Status Ribbons */}
      {status === 'expiring' && (
        <div className="absolute top-4 right-0 bg-warning text-white text-[10px] font-bold px-3 py-1 shadow-lg z-20 rounded-l-md uppercase tracking-wider">
          ⚠ Expiring Soon
        </div>
      )}
      
      {status === 'expired' && (
        <div className="absolute inset-0 bg-black/60 backdrop-blur-[2px] z-20 flex items-center justify-center">
          <div className="bg-danger text-white font-sora font-bold text-2xl px-6 py-2 rounded border-2 border-danger/50 shadow-2xl rotate-[-15deg] uppercase tracking-widest">
            Expired
          </div>
        </div>
      )}
    </div>
  );
}
