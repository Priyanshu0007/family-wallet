"use client";
import { useState } from 'react';
import { motion } from 'framer-motion';
import PinDots from './PinDots';
import PinNumpad from './PinNumpad';
import { usePinStore } from '../../store/pinStore';
import { useCardStore } from '../../store/cardStore';
import { useFamilyStore } from '../../store/familyStore';
import Walkthrough from '../onboarding/Walkthrough';
import TijoriLogo from '../ui/TijoriLogo';

export default function PinSetup() {
  const [step, setStep] = useState(0);
  const [pin1, setPin1] = useState('');
  const [pin2, setPin2] = useState('');
  const [error, setError] = useState(false);
  
  const { setupPin } = usePinStore();
  const { seedIfEmpty: seedCards } = useCardStore();
  const { seedIfEmpty: seedFamily } = useFamilyStore();

  const handleKeyPress = async (key: string) => {
    if (step === 1) {
      if (pin1.length < 6) {
        const newPin = pin1 + key;
        setPin1(newPin);
        if (newPin.length === 6) {
          setTimeout(() => setStep(2), 300);
        }
      }
    } else {
      if (pin2.length < 6) {
        const newPin = pin2 + key;
        setPin2(newPin);
        setError(false);
        
        if (newPin.length === 6) {
          if (newPin === pin1) {
            await setupPin(newPin);
            await seedFamily();
            await seedCards();
          } else {
            setError(true);
            setTimeout(() => {
              setPin2('');
            }, 500);
          }
        }
      }
    }
  };

  const handleBackspace = () => {
    if (step === 1) setPin1(prev => prev.slice(0, -1));
    else setPin2(prev => prev.slice(0, -1));
  };

  const handleClear = () => {
    if (step === 1) setPin1('');
    else setPin2('');
  };

  if (step === 0) {
    return <Walkthrough onComplete={() => setStep(1)} />;
  }

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="flex flex-col items-center mb-12">
        <div className="mb-4">
          <TijoriLogo size={64} />
        </div>
        <h1 className="text-2xl font-bold font-sora mb-2">Welcome</h1>
        <p className="text-text-secondary text-center">
          {step === 1 ? 'Set a 6-digit PIN to secure your cards' : 'Confirm your 6-digit PIN'}
        </p>
      </div>

      <div className="h-16 flex items-center justify-center mb-8 w-full">
        <motion.div
          animate={error ? { x: [-10, 10, -10, 10, 0] } : {}}
          transition={{ duration: 0.4 }}
        >
          <PinDots pinLength={step === 1 ? pin1.length : pin2.length} />
        </motion.div>
      </div>
      
      {error && <p className="text-danger text-sm mb-4">PINs do not match. Try again.</p>}

      <PinNumpad 
        onKeyPress={handleKeyPress}
        onBackspace={handleBackspace}
        onClear={handleClear}
      />
    </motion.div>
  );
}
