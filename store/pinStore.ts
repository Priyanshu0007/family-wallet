import { create } from 'zustand';
import { deriveKeyFromPin, hashPinForVerification, exportKeyToBase64, importKeyFromBase64, encryptText, decryptText } from './crypto';
import { 
  checkBiometricsSupport, 
  registerBiometrics, 
  authenticateBiometrics, 
  encryptWithPrfKey, 
  decryptWithPrfKey 
} from '../lib/biometrics';

interface PinState {
  isLocked: boolean;
  isFirstLaunch: boolean;
  cryptoKey: CryptoKey | null;
  attempts: number;
  lockoutUntil: number | null;
  timeoutDuration: number;
  isBiometricsSupported: boolean;
  isBiometricsEnabled: boolean;
  
  initialize: () => Promise<void>;
  setupPin: (pin: string) => Promise<void>;
  verifyPin: (pin: string) => Promise<boolean>;
  changePin: (oldPin: string, newPin: string) => Promise<boolean>;
  setTimeoutDuration: (minutes: number) => void;
  lock: () => void;
  enableBiometrics: (pin: string) => Promise<boolean>;
  disableBiometrics: () => Promise<void>;
  unlockWithBiometrics: () => Promise<boolean>;
  resetApp: () => Promise<void>;
}

export const usePinStore = create<PinState>((set, get) => ({
  isLocked: true,
  isFirstLaunch: true,
  cryptoKey: null,
  attempts: 0,
  lockoutUntil: null,
  timeoutDuration: 2,
  isBiometricsSupported: false,
  isBiometricsEnabled: false,

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

    const isSupported = await checkBiometricsSupport();
    const credIdBase64 = localStorage.getItem('biometric_cred_id');
    const encryptedPin = localStorage.getItem('biometric_encrypted_pin');
    const isBiometricsEnabled = !!(isSupported && credIdBase64 && encryptedPin);

    set({
      isFirstLaunch: !pinHash,
      isLocked,
      cryptoKey,
      attempts,
      lockoutUntil: lockoutUntil > Date.now() ? lockoutUntil : null,
      timeoutDuration,
      isBiometricsSupported: isSupported,
      isBiometricsEnabled
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
      
      // Step 3: Re-encrypt all cards from old key to new key in memory first
      // Dynamic import db to avoid circular dependency
      const { db } = await import('./db');
      const ENCRYPTED_FIELDS = ['number', 'cvv', 'holder', 'notes'];
      
      const allCards = await db.cards.toArray();
      const updates: any[] = [];
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
        updates.push(reEncrypted);
      }

      // Step 4: Write all updates to the database inside a transaction
      // This ensures either all cards are successfully re-encrypted in the DB or none are.
      await db.transaction('rw', db.cards, async () => {
        for (const reEncryptedCard of updates) {
          // Write directly using update, bypassing encryption middleware
          // (since data is already encrypted with the new key)
          await db.table('cards').update(reEncryptedCard.id, reEncryptedCard);
        }
      });
      
      // Step 5: Store new credentials
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

  enableBiometrics: async (pin: string) => {
    try {
      const storedHash = localStorage.getItem('pin_hash');
      const hash = await hashPinForVerification(pin);
      if (hash !== storedHash) {
        return false;
      }

      const { credentialId, prfOutput } = await registerBiometrics();
      let finalPrfOutput = prfOutput;

      if (!finalPrfOutput) {
        // Fallback: if creation ceremony didn't return PRF output, run get ceremony immediately
        finalPrfOutput = await authenticateBiometrics(credentialId);
      }

      const encryptedPin = await encryptWithPrfKey(pin, finalPrfOutput);
      const credentialIdBase64 = btoa(String.fromCharCode(...credentialId));

      localStorage.setItem('biometric_cred_id', credentialIdBase64);
      localStorage.setItem('biometric_encrypted_pin', encryptedPin);

      set({ isBiometricsEnabled: true });
      return true;
    } catch (err) {
      console.error("[Biometrics] Failed to enable:", err);
      throw err;
    }
  },

  disableBiometrics: async () => {
    localStorage.removeItem('biometric_cred_id');
    localStorage.removeItem('biometric_encrypted_pin');
    set({ isBiometricsEnabled: false });
  },

  unlockWithBiometrics: async () => {
    try {
      const credIdBase64 = localStorage.getItem('biometric_cred_id');
      const encryptedPin = localStorage.getItem('biometric_encrypted_pin');

      if (!credIdBase64 || !encryptedPin) {
        throw new Error("Biometrics not enabled.");
      }

      const credentialId = Uint8Array.from(atob(credIdBase64), c => c.charCodeAt(0));
      const prfOutput = await authenticateBiometrics(credentialId);
      const decryptedPin = await decryptWithPrfKey(encryptedPin, prfOutput);

      const success = await get().verifyPin(decryptedPin);
      return success;
    } catch (err) {
      console.error("[Biometrics] Unlock failed:", err);
      throw err;
    }
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
      lockoutUntil: null,
      isBiometricsEnabled: false
    });
  }
}));
