import { create } from 'zustand';
import { db, getDecryptedCards, Card, repairDoubleEncryptedCards } from './db';
import { SEED_CARDS } from '../lib/seedData';
import { nanoid } from 'nanoid';

interface CardState {
  cards: Card[];
  isLoading: boolean;
  loadError: string | null;
  searchQuery: string;
  filter: string;
  sortBy: string;
  
  loadCards: () => Promise<void>;
  addCard: (card: Omit<Card, 'id' | 'addedAt'>) => Promise<void>;
  updateCard: (card: Card) => Promise<void>;
  deleteCard: (id: string) => Promise<void>;
  setSearchQuery: (query: string) => void;
  setFilter: (filter: string) => void;
  setSortBy: (sort: string) => void;
  seedIfEmpty: () => Promise<void>;
}

// Track whether we've already attempted repair this session
let hasAttemptedRepair = false;

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: true,
  loadError: null,
  searchQuery: '',
  filter: 'All',
  sortBy: 'Recently added',

  loadCards: async () => {
    set({ isLoading: true, loadError: null });
    try {
      const cards = await getDecryptedCards();
      set({ cards, isLoading: false });
    } catch (e: any) {
      console.error('[CardStore] Failed to load cards:', e);
      
      // If decryption failed and we haven't tried repair yet, attempt auto-repair
      if (!hasAttemptedRepair && e?.message?.includes('Decryption failed')) {
        hasAttemptedRepair = true;
        console.log('[CardStore] Attempting automatic data repair...');
        try {
          const repairedCount = await repairDoubleEncryptedCards();
          if (repairedCount > 0) {
            console.log(`[CardStore] Repaired ${repairedCount} cards. Reloading...`);
            // Retry loading after repair
            const cards = await getDecryptedCards();
            set({ cards, isLoading: false, loadError: null });
            return;
          }
        } catch (repairErr) {
          console.error('[CardStore] Auto-repair also failed:', repairErr);
        }
      }
      
      set({ 
        cards: [], 
        isLoading: false,
        loadError: 'Failed to decrypt card data. If you recently changed your PIN, the data may be corrupted.'
      });
    }
  },

  addCard: async (cardData) => {
    const newCard: Card = {
      ...cardData,
      id: nanoid(),
      addedAt: Date.now()
    };
    await db.cards.add(newCard);
    await get().loadCards();
  },

  updateCard: async (card) => {
    await db.cards.put(card);
    await get().loadCards();
  },

  deleteCard: async (id: string) => {
    await db.cards.delete(id);
    await get().loadCards();
  },

  setSearchQuery: (query) => set({ searchQuery: query }),
  setFilter: (filter) => set({ filter }),
  setSortBy: (sortBy) => set({ sortBy }),

  seedIfEmpty: async () => {
    const count = await db.cards.count();
    if (count === 0) {
      for (const card of SEED_CARDS) {
        await get().addCard(card as Omit<Card, 'id' | 'addedAt'>);
      }
    }
  }
}));
