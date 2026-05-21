import { create } from 'zustand';
import { deriveKeyFromPin, hashPinForVerification, exportKeyToBase64, importKeyFromBase64, encryptText, decryptText } from './crypto';

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
  resetApp: () => Promise<void>;
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
      // Step 1: Derive the old key to decrypt existing data
      const oldSalt = localStorage.getItem('pin_salt') || undefined;
      const { key: oldKey } = await deriveKeyFromPin(oldPin, oldSalt);
      
      // Step 2: Derive a new key for the new PIN
      const newHash = await hashPinForVerification(newPin);
      const { key: newKey, salt: newSalt } = await deriveKeyFromPin(newPin);
      
      // Step 3: Re-encrypt all cards from old key to new key
      // Dynamic import db to avoid circular dependency
      const { db } = await import('./db');
      const ENCRYPTED_FIELDS = ['number', 'cvv', 'holder', 'notes'];
      
      const allCards = await db.cards.toArray();
      for (const card of allCards) {
        const reEncrypted = { ...card };
        for (const field of ENCRYPTED_FIELDS) {
          const value = (card as any)[field];
          if (value) {
            try {
              // Decrypt with old key
              const plaintext = await decryptText(value, oldKey);
              // Re-encrypt with new key
              (reEncrypted as any)[field] = await encryptText(plaintext, newKey);
            } catch (err) {
              console.error(`[ChangePin] Failed to re-encrypt field "${field}" on card ${card.id}:`, err);
              throw new Error('Failed to re-encrypt data. PIN change aborted.');
            }
          }
        }
        // Write directly to the table, bypassing encryption middleware
        // (since data is already encrypted with the new key)
        await db.table('cards').update(card.id, reEncrypted);
      }
      
      // Step 4: Store new credentials
      localStorage.setItem('pin_hash', newHash);
      localStorage.setItem('pin_salt', newSalt);
      
      const keyBase64 = await exportKeyToBase64(newKey);
      sessionStorage.setItem('crypto_key', keyBase64);
      
      set({ cryptoKey: newKey });
      
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

  resetApp: async () => {
    const { db } = await import('./db');
    try {
      await Promise.all([
        db.cards.clear(),
        db.family.clear()
      ]);
    } catch (err) {
      console.error('[resetApp] Failed to clear IndexedDB tables:', err);
    }

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
