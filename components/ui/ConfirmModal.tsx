"use client";
import { motion, AnimatePresence } from 'framer-motion';

interface ConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  isDanger?: boolean;
}

export default function ConfirmModal({ 
  isOpen, onClose, onConfirm, title, message, 
  confirmText = "Confirm", cancelText = "Cancel", isDanger = false 
}: ConfirmModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          <motion.div
            initial={{ scale: 0.95, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.95, opacity: 0 }}
            className="relative bg-surface rounded-[20px] p-6 max-w-sm w-full shadow-2xl border border-border"
          >
            <h3 className="text-xl font-sora font-semibold mb-2">{title}</h3>
            <p className="text-text-secondary mb-8">{message}</p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={onClose}
                className="px-4 py-2 rounded-xl font-medium text-text-secondary hover:bg-surface-elevated transition-colors"
              >
                {cancelText}
              </button>
              <button 
                onClick={() => { onConfirm(); onClose(); }}
                className={`px-4 py-2 rounded-xl font-medium text-white transition-colors ${
                  isDanger ? 'bg-danger hover:bg-danger/80' : 'bg-primary hover:bg-primary/80'
                }`}
              >
                {confirmText}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
