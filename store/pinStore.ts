import { create } from 'zustand';
import { deriveKeyFromPin, hashPinForVerification, exportKeyToBase64, importKeyFromBase64 } from './crypto';

interface PinState {
  isLocked: boolean;
  isFirstLaunch: boolean;
  cryptoKey: CryptoKey | null;
  attempts: number;
  lockoutUntil: number | null;
  timeoutDuration: number;
  
  initialize: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  setTimeoutDuration: (minutes: number) => void;
  lock: () => void;
  resetApp: () => void;
}

export const usePinStore = create<PinState>((set, get) => ({
  isLocked: true,
  isFirstLaunch: true,
  cryptoKey: null,
  attempts: 0,
  lockoutUntil: null,
  timeoutDuration: 2,

  initialize: async () => {
    const pinHash = localStorage.getItem('pin_hash');
    const attempts = parseInt(localStorage.getItem('pin_attempts') || '0', 10);
    const lockoutUntil = parseInt(localStorage.getItem('pin_lockout') || '0', 10);
    const timeoutDuration = parseInt(localStorage.getItem('pin_timeout') || '2', 10);
    
    // Check if session has the key
    const sessionKeyBase64 = sessionStorage.getItem('crypto_key');
    let cryptoKey = null;
    let isLocked = true;
    
    if (sessionKeyBase64 && pinHash) {
      try {
        cryptoKey = await importKeyFromBase64(sessionKeyBase64);
        isLocked = false;
      } catch (e) {
        sessionStorage.removeItem('crypto_key');
      }
    }

    set({
      isFirstLaunch: !pinHash,
      isLocked,
      cryptoKey,
      attempts,
      lockoutUntil: lockoutUntil > Date.now() ? lockoutUntil : null,
      timeoutDuration
    });
  },

  setupPin: async (pin: string) => {
    const hash = await hashPinForVerification(pin);
    localStorage.setItem('pin_hash', hash);
    
    const { key, salt } = await deriveKeyFromPin(pin);
    localStorage.setItem('pin_salt', salt);
    
    const keyBase64 = await exportKeyToBase64(key);
    sessionStorage.setItem('crypto_key', keyBase64);
    
    set({
      isFirstLaunch: false,
      isLocked: false,
      cryptoKey: key,
      attempts: 0,
      lockoutUntil: null
    });
  },

  verifyPin: async (pin: string) => {
    const state = get();
    if (state.lockoutUntil && state.lockoutUntil > Date.now()) {
      return false; // Still locked out
    }

    const storedHash = localStorage.getItem('pin_hash');
    const hash = await hashPinForVerification(pin);
    
    if (hash === storedHash) {
      // Success
      const salt = localStorage.getItem('pin_salt') || undefined;
      const { key } = await deriveKeyFromPin(pin, salt);
      const keyBase64 = await exportKeyToBase64(key);
      sessionStorage.setItem('crypto_key', keyBase64);
      
      localStorage.removeItem('pin_attempts');
      localStorage.removeItem('pin_lockout');
      
      set({ isLocked: false, cryptoKey: key, attempts: 0, lockoutUntil: null });
      return true;
    } else {
      // Fail
      const newAttempts = state.attempts + 1;
      let newLockout = null;
      
      if (newAttempts >= 3) {
        newLockout = Date.now() + 5 * 60 * 1000; // 5 minutes
        localStorage.setItem('pin_lockout', newLockout.toString());
      }
      
      localStorage.setItem('pin_attempts', newAttempts.toString());
      set({ attempts: newAttempts, lockoutUntil: newLockout });
      return false;
    }
  },

  changePin: async (oldPin: string, newPin: string) => {
    const state = get();
    const storedHash = localStorage.getItem('pin_hash');
    const hash = await hashPinForVerification(oldPin);

    if (hash === storedHash) {
      // Valid old pin, setup new pin
      const newHash = await hashPinForVerification(newPin);
      localStorage.setItem('pin_hash', newHash);
      
      const { key, salt } = await deriveKeyFromPin(newPin);
      localStorage.setItem('pin_salt', salt);
      
      const keyBase64 = await exportKeyToBase64(key);
      sessionStorage.setItem('crypto_key', keyBase64);
      
      set({ cryptoKey: key });
      
      return true;
    }
    
    return false;
  },

  setTimeoutDuration: (minutes: number) => {
    localStorage.setItem('pin_timeout', minutes.toString());
    set({ timeoutDuration: minutes });
  },

  lock: () => {
    sessionStorage.removeItem('crypto_key');
    set({ isLocked: true, cryptoKey: null });
  },

  resetApp: () => {
    localStorage.clear();
    sessionStorage.clear();
    set({
      isLocked: true,
      isFirstLaunch: true,
      cryptoKey: null,
      attempts: 0,
      lockoutUntil: null
    });
  }
}));
