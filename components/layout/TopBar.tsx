"use client";
import { useState } from 'react';
import { Lock, Search, SlidersHorizontal, Wallet, X } from 'lucide-react';
import { usePinStore } from '../../store/pinStore';
import { useUiStore } from '../../store/uiStore';
import { useCardStore } from '../../store/cardStore';
import { motion, AnimatePresence } from 'framer-motion';

export default function TopBar() {
  const lock = usePinStore((s) => s.lock);
  const openSheet = useUiStore((s) => s.openSheet);
  const { searchQuery, setSearchQuery } = useCardStore();
  const [isSearching, setIsSearching] = useState(false);

  return (
    <header className="h-16 px-4 md:px-8 flex items-center justify-between border-b border-border bg-background/80 backdrop-blur-md sticky top-0 z-50 overflow-hidden relative">
      <AnimatePresence mode="wait">
        {!isSearching ? (
          <motion.div 
            key="default"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between w-full h-full"
          >
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-white">
                <Wallet size={18} />
              </div>
              <h1 className="font-sora font-bold text-lg hidden sm:block">Tijori 🔐</h1>
            </div>
            
            <div className="flex items-center gap-2">
              <button 
                onClick={() => setIsSearching(true)}
                className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-elevated transition-colors"
              >
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
          </motion.div>
        ) : (
          <motion.div 
            key="search"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.2 }}
            className="flex items-center w-full gap-2 absolute inset-0 px-4 md:px-8 bg-background/80 backdrop-blur-md"
          >
            <div className="flex-1 flex items-center bg-surface-elevated rounded-full px-4 py-2 border border-border h-10">
              <Search size={18} className="text-text-secondary mr-2 flex-shrink-0" />
              <input
                autoFocus
                type="text"
                placeholder="Search cards..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent border-none outline-none w-full text-text-primary placeholder:text-text-secondary text-sm h-full"
              />
            </div>
            <button 
              onClick={() => {
                setIsSearching(false);
                setSearchQuery('');
              }}
              className="w-10 h-10 rounded-full flex items-center justify-center hover:bg-surface-elevated transition-colors flex-shrink-0 bg-surface-elevated border border-border"
            >
              <X size={20} className="text-text-secondary" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
