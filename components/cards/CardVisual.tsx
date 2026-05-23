"use client";
import { Card } from '../../store/db';
import { maskCardNumber, getExpiryStatus } from '../../lib/cardUtils';
import { getBankColorClass } from '../../lib/constants';

interface CardVisualProps {
  card: Card;
  showFullNumber?: boolean;
}

export default function CardVisual({ card, showFullNumber = false }: CardVisualProps) {
  const bgClass = card.color && card.color.includes('from-') 
    ? card.color 
    : getBankColorClass(card.bank);
  const status = getExpiryStatus(card.expiry);
  const displayNum = showFullNumber ? card.number : maskCardNumber(card.number);

  const nearExpiryBorder = status === 'expiring' 
    ? 'shadow-[0_0_20px_rgba(245,158,11,0.25)] border-amber-500/40' 
    : 'border-white/10';

  return (
    <div 
      className={`relative w-full max-w-[420px] mx-auto rounded-[16px] text-white overflow-hidden shadow-2xl bg-gradient-to-br ${bgClass} border ${nearExpiryBorder} transition-all duration-300 group`}
      style={{ aspectRatio: '1.586' }}
    >
      {/* Grayscaled contents wrapper (for expired cards) */}
      <div className={`w-full h-full p-6 flex flex-col justify-between relative ${status === 'expired' ? 'grayscale opacity-50 contrast-75' : ''}`}>
        {/* Noise Texture */}
        <div className="absolute inset-0 opacity-20 pointer-events-none mix-blend-overlay bg-[url('data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHdpZHRoPSI0MDAiIGhlaWdodD0iNDAwIj4KICA8ZmlsdGVyIGlkPSJub2lzZSI+CiAgICA8ZmVUdXJidWxlbmNlIHR5cGU9ImZyYWN0YWxOb2lzZSIgYmFzZUZyZXF1ZW5jeT0iMC44IiBudW1PY3RhdmVzPSIzIiBzdGl0Y2hUaWxlcz0ic3RpdGNoIiAvPgogIDwvZmlsdGVyPgogIDxyZWN0IHdpZHRoPSIxMDAlIiBoZWlnaHQ9IjEwMCUiIGZpbHRlcj0idXJsKCNub2lzZSkiIC8+Cjwvc3ZnPg==')]" />
        


        {/* Abstract Background Orbs */}
        <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/3 blur-3xl pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-48 h-48 bg-black/10 rounded-full translate-y-1/3 -translate-x-1/4 blur-2xl pointer-events-none" />

        {/* Top row */}
        <div className="relative flex justify-between items-start mb-6 z-10">
          {/* Authentic Smart Chip SVG */}
          <svg width="42" height="32" viewBox="0 0 42 32" fill="none" xmlns="http://www.w3.org/2000/svg" className="rounded-md shadow-sm shrink-0">
            <rect width="42" height="32" rx="6" fill="url(#chipGrad)" />
            {/* Circuit lines */}
            <rect x="3" y="3" width="36" height="26" rx="4" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" fill="none" />
            <path d="M14 3v26M28 3v26M3 11h36M3 21h36" stroke="rgba(0,0,0,0.15)" strokeWidth="0.8" />
            {/* Inner contact pad */}
            <rect x="15" y="9" width="12" height="14" rx="2" fill="url(#chipInnerGrad)" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <path d="M21 9v14" stroke="rgba(0,0,0,0.2)" strokeWidth="0.8" />
            <defs>
              <linearGradient id="chipGrad" x1="0" y1="0" x2="42" y2="32" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffd700" />
                <stop offset="25%" stopColor="#f7c51e" />
                <stop offset="50%" stopColor="#eab308" />
                <stop offset="75%" stopColor="#ca8a04" />
                <stop offset="100%" stopColor="#854d0e" />
              </linearGradient>
              <linearGradient id="chipInnerGrad" x1="15" y1="9" x2="27" y2="23" gradientUnits="userSpaceOnUse">
                <stop offset="0%" stopColor="#ffffff" stopOpacity="0.3" />
                <stop offset="100%" stopColor="#000000" stopOpacity="0.1" />
              </linearGradient>
            </defs>
          </svg>

          <div className="text-right select-none">
            <span className="font-sora font-extrabold text-lg tracking-wider block drop-shadow-[0_2px_4px_rgba(0,0,0,0.3)]">{card.bank.toUpperCase()}</span>
            <span className="text-[9px] uppercase tracking-widest opacity-80 font-medium font-sora">{card.variant}</span>
          </div>
        </div>

        {/* Number */}
        <div className="relative mb-6 z-10 mt-auto select-all">
          <div className="font-mono text-xl tracking-[0.16em] drop-shadow-[0_2px_3px_rgba(0,0,0,0.5)]">
            {displayNum}
          </div>
        </div>

        {/* Bottom row */}
        <div className="relative flex justify-between items-end z-10 select-none">
          <div className="flex gap-6">
            <div>
              <div className="text-[8px] opacity-75 uppercase tracking-widest mb-1 font-sora font-medium">Valid Thru</div>
              <div className="font-mono text-sm tracking-widest drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">{card.expiry}</div>
            </div>
            <div className="flex flex-col justify-end">
              <div className="font-sora text-sm font-semibold tracking-wide uppercase drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)] pb-0.5">{card.holder}</div>
            </div>
          </div>

          {/* Network Logo */}
          <div className="h-9 flex items-end justify-end shrink-0">
            {card.network === 'Visa' && (
              <svg className="w-14 h-auto text-white fill-current drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]" viewBox="0 0 130 42" xmlns="http://www.w3.org/2000/svg">
                <path fillRule="evenodd" clipRule="evenodd" d="M32.4128 41.0541H21.1928L12.7791 8.95549C12.3798 7.47895 11.5319 6.17361 10.2846 5.55839C7.17185 4.01231 3.74183 2.78186 0 2.16129V0.925493H18.0746C20.5691 0.925493 22.4401 2.78186 22.7519 4.93782L27.1174 28.0916L38.3319 0.925493H49.2401L32.4128 41.0541ZM55.4767 41.0541H44.8803L53.6058 0.925493H64.2022L55.4767 41.0541ZM77.9109 12.0423C78.2227 9.88101 80.0936 8.64522 82.2763 8.64522C85.7063 8.33493 89.4427 8.9555 92.5609 10.4962L94.4318 1.85637C91.3136 0.620572 87.8836 0 84.7709 0C74.4863 0 67.0026 5.5584 67.0026 13.2728C67.0026 19.1415 72.3036 22.2229 76.0454 24.0793C80.0936 25.9303 81.6527 27.1661 81.3409 29.0171C81.3409 31.7936 78.2227 33.0294 75.11 33.0294C71.3681 33.0294 67.6263 32.1039 64.2017 30.5578L62.3308 39.2031C66.0727 40.7438 70.1208 41.3644 73.8627 41.3644C85.3945 41.6693 92.5609 36.1163 92.5609 27.7813C92.5609 17.2851 77.9109 16.6699 77.9109 12.0423V12.0423ZM129.646 41.0541L121.232 0.925493H112.195C110.324 0.925493 108.453 2.16129 107.83 4.01231L92.2495 41.0541H103.158L105.335 35.1907H118.738L119.985 41.0541H129.646ZM113.754 11.732L116.867 26.8558H108.141L113.754 11.732Z" />
              </svg>
            )}
            {card.network === 'Mastercard' && (
              <svg width="42" height="26" viewBox="0 0 44 28" xmlns="http://www.w3.org/2000/svg" className="drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]">
                <circle cx="14" cy="14" r="13" fill="#eb001b" fillOpacity="0.9" />
                <circle cx="30" cy="14" r="13" fill="#f79e1b" fillOpacity="0.9" />
                <path d="M22 4.25a9.75 9.75 0 0 1 3.75 9.75 9.75 9.75 0 0 1-3.75 9.75 9.75 9.75 0 0 1-3.75-9.75 9.75 9.75 0 0 1 3.75-9.75z" fill="#ff5f00" />
              </svg>
            )}
            {card.network === 'Amex' && (
              <div className="bg-[#0070d2] text-white border border-white/20 rounded px-2 py-0.5 text-[9px] font-extrabold tracking-widest font-sora flex items-center justify-center h-7 shadow-inner select-none drop-shadow-[0_1px_2px_rgba(0,0,0,0.4)]">
                AMEX
              </div>
            )}
            {card.network === 'RuPay' && (
              <div className="flex items-center gap-1 font-sora italic font-extrabold text-lg tracking-tighter select-none drop-shadow-[0_1.5px_2px_rgba(0,0,0,0.4)]">
                <span className="text-white">RuPay</span>
                <span className="flex">
                  <span className="w-1.5 h-3.5 bg-[#0a85ea] skew-x-[-20deg]"></span>
                  <span className="w-1.5 h-3.5 bg-[#f25e1f] skew-x-[-20deg] -ml-0.5"></span>
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Non-grayscaled Overlays */}
      {status === 'expiring' && (
        <div className="absolute top-4 right-4 bg-amber-500/15 backdrop-blur-md border border-amber-500/30 text-amber-300 text-[10px] font-semibold px-2.5 py-0.5 rounded-full flex items-center gap-1.5 shadow-md z-20">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
          <span>Expiring Soon</span>
        </div>
      )}
      
      {status === 'expired' && (
        <div className="absolute inset-0 backdrop-blur-[3px] bg-slate-950/40 z-20 flex items-center justify-center">
          <div className="bg-rose-500/15 border border-rose-500/30 text-rose-300 font-sora font-semibold text-xs px-4 py-2 rounded-full backdrop-blur-md shadow-lg flex items-center gap-2 tracking-wide">
            <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse shrink-0" />
            <span>CARD EXPIRED</span>
          </div>
        </div>
      )}
    </div>
  );
}
