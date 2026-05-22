import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ShieldCheck, Users, ArrowRight, Check } from 'lucide-react';
import TijoriLogo from '../ui/TijoriLogo';

const slides = [
  {
    icon: TijoriLogo,
    title: 'Welcome to Tijori',
    description: 'Your secure, offline-first digital wallet for managing family cards.',
    color: 'text-primary',
    bg: 'bg-primary/20',
    isCustomLogo: true
  },
  {
    icon: ShieldCheck,
    title: 'Bank-Grade Security',
    description: 'All your data is encrypted and stored locally. It never leaves your device.',
    color: 'text-success',
    bg: 'bg-success/20'
  },
  {
    icon: Users,
    title: 'Family Organized',
    description: 'Easily manage and filter cards by family members with intuitive tags.',
    color: 'text-warning',
    bg: 'bg-warning/20'
  }
];

export default function Walkthrough({ onComplete }: { onComplete: () => void }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const nextSlide = () => {
    if (currentSlide < slides.length - 1) {
      setCurrentSlide(prev => prev + 1);
    } else {
      onComplete();
    }
  };

  const skipWalkthrough = () => {
    onComplete();
  };

  return (
    <motion.div 
      className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-between p-6"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
    >
      <div className="w-full flex justify-end">
        <button 
          onClick={skipWalkthrough}
          className="text-text-secondary text-sm font-medium py-2 px-4 rounded-full hover:bg-surface transition-colors"
        >
          Skip
        </button>
      </div>

      <div className="flex-1 flex flex-col items-center justify-center w-full max-w-sm relative">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentSlide}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col items-center text-center absolute w-full"
          >
            <div className={`w-24 h-24 rounded-full ${slides[currentSlide].bg} ${slides[currentSlide].color} flex items-center justify-center mb-8`}>
              {(() => {
                const Icon = slides[currentSlide].icon;
                if ('isCustomLogo' in slides[currentSlide] && slides[currentSlide].isCustomLogo) {
                  return <Icon size={56} />;
                }
                // @ts-ignore
                return <Icon size={48} strokeWidth={1.5} />;
              })()}
            </div>
            <h2 className="text-2xl font-bold font-sora mb-4 text-text-primary">
              {slides[currentSlide].title}
            </h2>
            <p className="text-text-secondary text-lg leading-relaxed">
              {slides[currentSlide].description}
            </p>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="w-full max-w-sm flex flex-col items-center gap-8 mb-8">
        <div className="flex gap-2">
          {slides.map((_, index) => (
            <div 
              key={index}
              className={`h-2 rounded-full transition-all duration-300 ${
                index === currentSlide ? 'w-8 bg-primary' : 'w-2 bg-border'
              }`}
            />
          ))}
        </div>

        <button
          onClick={nextSlide}
          className="w-full bg-primary text-primary-foreground py-4 rounded-xl font-semibold flex items-center justify-center gap-2 hover:bg-primary/90 active:scale-[0.98] transition-all"
        >
          {currentSlide === slides.length - 1 ? (
            <>
              Get Started <Check size={20} />
            </>
          ) : (
            <>
              Next <ArrowRight size={20} />
            </>
          )}
        </button>
      </div>
    </motion.div>
  );
}
