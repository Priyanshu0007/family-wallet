"use client";
import { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PinDots from './PinDots';
import PinNumpad from './PinNumpad';
import { usePinStore } from '../../store/pinStore';
import TijoriLogo from '../ui/TijoriLogo';

export default function PinLock() {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);
  const { verifyPin, attempts, lockoutUntil, resetApp, isBiometricsEnabled, unlockWithBiometrics } = usePinStore();

  const [mounted, setMounted] = useState(false);
  const [currentTime, setCurrentTime] = useState<number>(0);

  useEffect(() => {
    const t = setTimeout(() => {
      setMounted(true);
      setCurrentTime(Date.now());
    }, 0);

    const interval = setInterval(() => {
      setCurrentTime(Date.now());
    }, 1000);

    return () => {
      clearTimeout(t);
      clearInterval(interval);
    };
  }, []);

  const isLockedOut = mounted && lockoutUntil !== null && lockoutUntil > currentTime;

  const handleBiometricUnlock = async () => {
    if (isLockedOut) return;
    try {
      setError(false);
      const success = await unlockWithBiometrics();
      if (!success) {
        setError(true);
        setTimeout(() => setPin(''), 500);
      }
    } catch (err) {
      console.warn("[Biometrics] Cancelled or failed biometric unlock:", err);
    }
  };

  useEffect(() => {
    if (mounted && isBiometricsEnabled && !isLockedOut) {
      const t = setTimeout(() => {
        handleBiometricUnlock();
      }, 300);
      return () => clearTimeout(t);
    }
  }, [mounted, isBiometricsEnabled, isLockedOut]);

  const timer = useMemo(() => {
    if (!lockoutUntil || !currentTime) return '';
    const remaining = lockoutUntil - currentTime;
    if (remaining <= 0) return '';
    const m = Math.floor(remaining / 60000);
    const s = Math.floor((remaining % 60000) / 1000);
    return `${m}:${s.toString().padStart(2, '0')}`;
  }, [lockoutUntil, currentTime]);

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

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="flex flex-col items-center mb-12">
        <div className="mb-4">
          <TijoriLogo size={64} />
        </div>
        <h1 className="text-2xl font-bold font-sora">Tijori</h1>
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
          showBiometric={isBiometricsEnabled}
          onBiometricClick={handleBiometricUnlock}
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
