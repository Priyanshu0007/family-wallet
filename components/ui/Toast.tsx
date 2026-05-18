"use client";
import { useUiStore } from '../../store/uiStore';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, AlertCircle, Info } from 'lucide-react';

export default function Toast() {
  const toasts = useUiStore((s) => s.toasts);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-1/2 -translate-x-1/2 flex flex-col gap-2 z-[100] w-max max-w-[90vw] pointer-events-none">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
            className={`flex items-center gap-3 px-4 py-3 rounded-full shadow-lg border ${
              toast.type === 'success' ? 'bg-success/10 border-success/20 text-success' :
              toast.type === 'error' ? 'bg-danger/10 border-danger/20 text-danger' :
              'bg-primary/10 border-primary/20 text-primary'
            }`}
          >
            {toast.type === 'success' && <CheckCircle2 size={18} />}
            {toast.type === 'error' && <AlertCircle size={18} />}
            {toast.type === 'info' && <Info size={18} />}
            <span className="text-sm font-medium">{toast.message}</span>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
