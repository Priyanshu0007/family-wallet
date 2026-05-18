"use client";
import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import PinDots from './PinDots';
import PinNumpad from './PinNumpad';
import { usePinStore } from '../../store/pinStore';
import { useUiStore } from '../../store/uiStore';
import { Shield, X } from 'lucide-react';

export default function ChangePinModal({ isOpen, onClose }: { isOpen: boolean, onClose: () => void }) {
  const [step, setStep] = useState(1); // 1: old, 2: new, 3: confirm
  const [oldPin, setOldPin] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  
  const { changePin } = usePinStore();
  const { addToast } = useUiStore();

  if (!isOpen) return null;

  const handleKeyPress = async (key: string) => {
    if (step === 1) {
      if (oldPin.length < 6) {
        const pin = oldPin + key;
        setOldPin(pin);
        if (pin.length === 6) {
          setTimeout(() => setStep(2), 300);
        }
      }
    } else if (step === 2) {
      if (newPin.length < 6) {
        const pin = newPin + key;
        setNewPin(pin);
        if (pin.length === 6) {
          setTimeout(() => setStep(3), 300);
        }
      }
    } else {
      if (confirmPin.length < 6) {
        const pin = confirmPin + key;
        setConfirmPin(pin);
        setError(false);
        setErrorMsg('');
        
        if (pin.length === 6) {
          if (pin === newPin) {
            const success = await changePin(oldPin, newPin);
            if (success) {
              addToast('PIN changed successfully', 'success');
              handleClose();
            } else {
              setError(true);
              setErrorMsg('Incorrect old PIN');
              setTimeout(() => {
                setOldPin('');
                setNewPin('');
                setConfirmPin('');
                setStep(1);
              }, 1000);
            }
          } else {
            setError(true);
            setErrorMsg('PINs do not match. Try again.');
            setTimeout(() => {
              setConfirmPin('');
            }, 500);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 1) setOldPin(prev => prev.slice(0, -1));
    else if (step === 2) setNewPin(prev => prev.slice(0, -1));
    else setConfirmPin(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (step === 1) setOldPin('');
    else if (step === 2) setNewPin('');
    else setConfirmPin('');
  };

  const handleClose = () => {
    setOldPin('');
    setNewPin('');
    setConfirmPin('');
    setStep(1);
    setError(false);
    setErrorMsg('');
    onClose();
  };

  const getPinLength = () => {
    if (step === 1) return oldPin.length;
    if (step === 2) return newPin.length;
    return confirmPin.length;
  };

  const getTitle = () => {
    if (step === 1) return 'Enter Old PIN';
    if (step === 2) return 'Enter New PIN';
    return 'Confirm New PIN';
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
          <h1 className="text-2xl font-bold font-sora mb-2">{getTitle()}</h1>
          <p className="text-text-secondary text-center">
            {step === 1 ? 'Verify your identity to change PIN' : step === 2 ? 'Set a new 6-digit PIN' : 'Confirm your new 6-digit PIN'}
          </p>
        </div>

        <div className="h-16 flex items-center justify-center mb-8 w-full">
          <motion.div
            animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
            transition={{ duration: 0.4 }}
          >
            <PinDots pinLength={getPinLength()} />
          </motion.div>
        </div>
        
        {error && <p className="text-danger text-sm mb-4">{errorMsg}</p>}

        <PinNumpad 
          onKeyPress={handleKeyPress}
          onBackspace={handleBackspace}
          onClear={handleClear}
        />
      </motion.div>
    </AnimatePresence>
  );
}
