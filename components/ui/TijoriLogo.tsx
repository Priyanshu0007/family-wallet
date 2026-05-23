import React from 'react';

interface TijoriLogoProps {
  size?: number;
  className?: string;
}

export default function TijoriLogo({ size = 32, className = "" }: TijoriLogoProps) {
  return (
    <svg 
      width={size} 
      height={size} 
      viewBox="0 0 100 100" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Outer safe box/vault frame */}
      <rect x="8" y="8" width="84" height="84" rx="20" fill="url(#tijori-bg)" stroke="url(#tijori-border)" strokeWidth="4" />
      
      {/* Corner rivet accents representing heavy metal safe */}
      <circle cx="18" cy="18" r="3" fill="#8888a0" opacity="0.6" />
      <circle cx="82" cy="18" r="3" fill="#8888a0" opacity="0.6" />
      <circle cx="18" cy="82" r="3" fill="#8888a0" opacity="0.6" />
      <circle cx="82" cy="82" r="3" fill="#8888a0" opacity="0.6" />

      {/* Vault door hinges / mechanical side bars */}
      <rect x="4" y="24" width="4" height="12" rx="2" fill="url(#gold-grad)" />
      <rect x="4" y="64" width="4" height="12" rx="2" fill="url(#gold-grad)" />
      
      {/* Safe dial outline */}
      <circle cx="50" cy="50" r="26" fill="url(#dial-bg)" stroke="url(#gold-grad)" strokeWidth="3" />
      
      {/* Dial tick marks */}
      <line x1="50" y1="28" x2="50" y2="32" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="50" y1="68" x2="50" y2="72" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="28" y1="50" x2="32" y2="50" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      <line x1="68" y1="50" x2="72" y2="50" stroke="#f59e0b" strokeWidth="2" strokeLinecap="round" />
      
      <line x1="34.4" y1="34.4" x2="37.3" y2="37.3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="65.6" y1="65.6" x2="62.7" y2="62.7" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="65.6" y1="34.4" x2="62.7" y2="37.3" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />
      <line x1="34.4" y1="65.6" x2="37.3" y2="62.7" stroke="#d97706" strokeWidth="1.5" strokeLinecap="round" />

      {/* Central Wheel / Handle */}
      <circle cx="50" cy="50" r="11" fill="url(#gold-grad-dark)" stroke="url(#gold-grad)" strokeWidth="1.5" />
      
      {/* Three spokes (traditional safe rotating handle) */}
      <line x1="50" y1="50" x2="50" y2="39" stroke="url(#gold-grad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2="40.5" y2="55.5" stroke="url(#gold-grad)" strokeWidth="3" strokeLinecap="round" />
      <line x1="50" y1="50" x2="59.5" y2="55.5" stroke="url(#gold-grad)" strokeWidth="3" strokeLinecap="round" />
      
      {/* Spokes Knobs */}
      <circle cx="50" cy="39" r="3.5" fill="url(#gold-grad)" />
      <circle cx="40.5" cy="55.5" r="3.5" fill="url(#gold-grad)" />
      <circle cx="59.5" cy="55.5" r="3.5" fill="url(#gold-grad)" />
      
      {/* Keyhole and lock mechanism */}
      <circle cx="50" cy="50" r="4.5" fill="#0d0d11" />
      <path d="M48.5 50 L51.5 50 L52 58 L48 58 Z" fill="#0d0d11" />

      <defs>
        {/* Background gradient of the safe box: deep slate metallic */}
        <linearGradient id="tijori-bg" x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1e1e27" />
          <stop offset="50%" stopColor="#121217" />
          <stop offset="100%" stopColor="#08080b" />
        </linearGradient>
        
        {/* Border gradient: primary theme violet/purple */}
        <linearGradient id="tijori-border" x1="8" y1="8" x2="92" y2="92" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" />
          <stop offset="50%" stopColor="#6c63ff" />
          <stop offset="100%" stopColor="#4f46e5" />
        </linearGradient>
        
        {/* Gold/Brass metallic gradients for traditional tijori accent */}
        <linearGradient id="gold-grad" x1="24" y1="24" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#fbbf24" />
          <stop offset="50%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#b45309" />
        </linearGradient>
        
        <linearGradient id="gold-grad-dark" x1="39" y1="39" x2="61" y2="61" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#d97706" />
          <stop offset="100%" stopColor="#78350f" />
        </linearGradient>
        
        {/* Dial interior background */}
        <linearGradient id="dial-bg" x1="24" y1="24" x2="76" y2="76" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#1f1f2a" />
          <stop offset="100%" stopColor="#0b0b0f" />
        </linearGradient>
      </defs>
    </svg>
  );
}
