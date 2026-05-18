import { create } from 'zustand';
import { db, FamilyMember } from './db';
import { SEED_FAMILY } from '../lib/seedData';
import { nanoid } from 'nanoid';

interface FamilyState {
  members: FamilyMember[];
  isLoading: boolean;
  
  loadMembers: () => Promise<void>;
  addMember: (member: Omit<FamilyMember, 'id' | 'addedAt'>) => Promise<void>;
  updateMember: (member: FamilyMember) => Promise<void>;
  deleteMember: (id: string) => Promise<void>;
  seedIfEmpty: () => Promise<void>;
}

export const useFamilyStore = create<FamilyState>((set, get) => ({
  members: [],
  isLoading: true,

  loadMembers: async () => {
    set({ isLoading: true });
    try {
      const members = await db.family.toArray();
      set({ members, isLoading: false });
    } catch (e) {
      console.error(e);
      set({ members: [], isLoading: false });
    }
  },

  addMember: async (memberData) => {
    const newMember: FamilyMember = {
      ...memberData,
      id: nanoid(),
      addedAt: Date.now()
    };
    await db.family.add(newMember);
    await get().loadMembers();
  },

  updateMember: async (member) => {
    await db.family.put(member);
    await get().loadMembers();
  },

  deleteMember: async (id: string) => {
    await db.family.delete(id);
    await get().loadMembers();
  },

  seedIfEmpty: async () => {
    const count = await db.family.count();
    if (count === 0) {
      for (const member of SEED_FAMILY) {
        await get().addMember(member as Omit<FamilyMember, 'id' | 'addedAt'>);
      }
    }
  }
}));
