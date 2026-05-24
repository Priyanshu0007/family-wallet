"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PinDots from './PinDots';
import PinNumpad from './PinNumpad';
import { Shield, X } from 'lucide-react';
import { hashPinForVerification } from '../../store/crypto';

interface VerifyPinModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (pin: string) => void;
  title?: string;
  description?: string;
}

export default function VerifyPinModal({ 
  isOpen, 
  onClose, 
  onSuccess,
  title = "Verify Identity",
  description = "Enter your 6-digit PIN to enable biometric unlock"
}: VerifyPinModalProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState(false);

  if (!isOpen) return null;

  const handleKeyPress = async (key: string) => {
    if (pin.length < 6) {
      const newPin = pin + key;
      setPin(newPin);
      setError(false);
      
      if (newPin.length === 6) {
        const storedHash = localStorage.getItem('pin_hash');
        const hash = await hashPinForVerification(newPin);
        
        if (hash === storedHash) {
          onSuccess(newPin);
          handleClose();
        } else {
          setError(true);
          setTimeout(() => setPin(''), 500);
        }
      }
    }
  };

  const handleBackspace = () => setPin(prev => prev.slice(0, -1));
  const handleClear = () => setPin('');

  const handleClose = () => {
    setPin('');
    setError(false);
    onClose();
  };

  return (
    <AnimatePresence>
      <motion.div 
        className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
        initial={{ opacity: 0, y: 50 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 50 }}
      >
        <button onClick={handleClose} className="absolute top-6 right-6 p-2 bg-surface rounded-full text-text-secondary">
          <X size={24} />
        </button>
        <div className="flex flex-col items-center mb-12">
          <div className="w-16 h-16 rounded-full bg-primary/20 text-primary flex items-center justify-center mb-4">
            <Shield size={32} />
          </div>
          <h1 className="text-2xl font-bold font-sora mb-2">{title}</h1>
          <p className="text-text-secondary text-center max-w-xs">{description}</p>
        </div>

        <div className="h-16 flex items-center justify-center mb-8 w-full">
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <PinDots pinLength={pin.length} />
          </motion.div>
        </div>

        <PinNumpad 
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onClear={handleClear}
          disabled={pin.length === 6}
        />
      </motion.div>
    </AnimatePresence>
  );
}
