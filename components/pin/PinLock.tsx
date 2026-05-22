"use client";
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PinDots from './PinDots';
import PinNumpad from './PinNumpad';
import { usePinStore } from '../../store/pinStore';
import { Wallet } from 'lucide-react';

export default function PinLock() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const [timer, setTimer] = useState<string>('');
  const { verifyPin, attempts, lockoutUntil, resetApp } = usePinStore();

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (lockoutUntil && lockoutUntil > Date.now()) {
      interval = setInterval(() => {
        const remaining = lockoutUntil - Date.now();
        if (remaining <= 0) {
          clearInterval(interval);
          setTimer('');
        } else {
          const m = Math.floor(remaining / 60000);
          const s = Math.floor((remaining % 60000) / 1000);
          setTimer(`${m}:${s.toString().padStart(2, '0')}`);
        }
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [lockoutUntil]);

  const handleKeyPress = async (key: string) => {
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 6) {
        const success = await verifyPin(newPin);
        if (!success) {
          setError(true);
          setTimeout(() => setPin(''), 500); // clear after animation
        }
      }
    }
  };

  const handleBackspace = () => setPin(prev => prev.slice(0, -1));
  const handleClear = () => setPin('');

  const isLockedOut = lockoutUntil !== null && lockoutUntil > Date.now();

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center mb-12">
        <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
          <Wallet size={32} />
        </div>
        <h1 className="text-2xl font-bold font-sora">Tijori 🔐</h1>
      </div>

      <div className="h-20 flex items-center justify-center mb-8 w-full">
        {isLockedOut ? (
          <div className="text-danger text-center">
            <p className="text-lg font-medium mb-1">Too many attempts</p>
            <p className="font-mono text-xl">Try again in {timer}</p>
          </div>
        ) : (
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <PinDots pinLength={pin.length} />
          </motion.div>
        )}
      </div>

      {!isLockedOut && (
        <PinNumpad 
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onClear={handleClear}
          disabled={pin.length === 6}
        />
      )}

      {attempts > 0 && !isLockedOut && (
        <p className="mt-8 text-warning text-sm font-medium">
          {3 - attempts} attempt{3 - attempts !== 1 ? 's' : ''} remaining
        </p>
      )}

      <button 
        onClick={async () => {
          if (confirm('Are you sure you want to clear all data? This cannot be undone.')) {
            await resetApp();
            window.location.reload();
          }
        }}
        className="mt-12 text-sm text-text-muted hover:text-text-primary transition-colors pb-safe"
      >
        Forgot PIN? Clear all data
      </button>
    </motion.div>
  );
}
