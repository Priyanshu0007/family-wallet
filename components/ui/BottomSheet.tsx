"use client";
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { useEffect } from 'react';

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
  headerActions?: React.ReactNode;
}

export default function BottomSheet({ isOpen, onClose, title, children, headerActions }: BottomSheetProps) {
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [isOpen]);

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
          />
          <motion.div
            initial={{ y: '100%' }}
            animate={{ y: 0 }}
            exit={{ y: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            className="fixed bottom-0 left-0 right-0 max-w-2xl mx-auto bg-surface rounded-t-[20px] shadow-2xl z-50 flex flex-col max-h-[90vh]"
          >
            <div className="flex items-center justify-between p-4 border-b border-border shrink-0">
              <h2 className="font-sora font-semibold text-lg">{title}</h2>
              <div className="flex items-center gap-2">
                {headerActions}
                <button 
                  onClick={onClose}
                  className="w-8 h-8 flex items-center justify-center rounded-full bg-surface-elevated hover:bg-border transition-colors text-text-secondary hover:text-text-primary"
                >
                  <X size={18} />
                </button>
              </div>
            </div>
            <div className="p-4 overflow-y-auto no-scrollbar pb-safe-offset-4">
              {children}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
