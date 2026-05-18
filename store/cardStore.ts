import { create } from 'zustand';
import { db, getDecryptedCards, Card } from './db';
import { SEED_CARDS } from '../lib/seedData';
import { nanoid } from 'nanoid';

interface CardState {
  cards: Card[];
  isLoading: boolean;
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

export const useCardStore = create<CardState>((set, get) => ({
  cards: [],
  isLoading: true,
  searchQuery: '',
  filter: 'All',
  sortBy: 'Recently added',

  loadCards: async () => {
    set({ isLoading: true });
    try {
      const cards = await getDecryptedCards();
      set({ cards, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ cards: [], isLoading: false });
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
