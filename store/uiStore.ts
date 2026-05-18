import { create } from 'zustand';

type ToastType = 'success' | 'error' | 'info';

interface Toast {
  id: string;
  message: string;
  type: ToastType;
}

interface UiState {
  toasts: Toast[];
  activeSheet: 'none' | 'addCard' | 'editCard' | 'sort' | 'cardDetail';
  activeCardId: string | null;

  addToast: (message: string, type?: ToastType) => void;
  removeToast: (id: string) => void;
  openSheet: (sheet: UiState['activeSheet'], cardId?: string | null) => void;
  closeSheet: () => void;
}

export const useUiStore = create<UiState>((set) => ({
  toasts: [],
  activeSheet: 'none',
  activeCardId: null,

  addToast: (message, type = 'info') => {
    const id = Math.random().toString(36).substring(7);
    set((state) => ({
      toasts: [...state.toasts, { id, message, type }].slice(-2) // Max 2
    }));
    setTimeout(() => {
      set((state) => ({
        toasts: state.toasts.filter(t => t.id !== id)
      }));
    }, 2500);
  },

  removeToast: (id) => set((state) => ({
    toasts: state.toasts.filter(t => t.id !== id)
  })),

  openSheet: (sheet, cardId = null) => set({ activeSheet: sheet, activeCardId: cardId }),
  closeSheet: () => set({ activeSheet: 'none', activeCardId: null })
}));
