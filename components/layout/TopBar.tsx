"use client";
import { Lock, Search, SlidersHorizontal, Wallet } from 'lucide-react';
import { usePinStore } from '../../store/pinStore';
import { useUiStore } from '../../store/uiStore';

export default function TopBar() {
  const lock = usePinStore((s) => s.lock);
  const openSheet = useUiStore((s) => s.openSheet);

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-30">
      <div className="flex items-center gap-3">
        <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
          <Wallet size={18} />
        </div>
        <h1 className="font-sora font-bold text-lg hidden sm:block">Family Wallet</h1>
      </div>
      
      <div className="flex items-center gap-2">
        <button className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-elevated transition-colors">
          <Search size={20} className="text-text-secondary" />
        </button>
        <button 
          onClick={() => openSheet('sort')}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-elevated transition-colors"
        >
          <SlidersHorizontal size={20} className="text-text-secondary" />
        </button>
        <button 
          onClick={lock}
          className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-elevated transition-colors"
        >
          <Lock size={20} className="text-text-secondary" />
        </button>
      </div>
    </header>
  );
}
