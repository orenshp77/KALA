'use client';

import { create } from 'zustand';
import { User, Event, Guest } from '@/types';
import {
  updateEventInDB,
  addGuestToDB,
  updateGuestInDB,
  deleteGuestFromDB,
  getGuestByToken,
  respondToInviteInDB,
  updateGuestRoundSentBatch,
} from '@/lib/supabaseData';

const adminUser: User = {
  id: 'admin-001',
  email: 'admin',
  password: 'admin123',
  role: 'admin',
  eventId: '',
};

interface StoreState {
  currentUser: User | null;
  currentEvent: Event | null;
  users: User[];
  guests: Guest[];
  // Setters for loading from DB
  setCurrentUser: (user: User | null) => void;
  setEvent: (event: Event | null) => void;
  setGuests: (guests: Guest[]) => void;
  // Auth actions
  adminLogin: (password: string) => boolean;
  logout: () => void;
  // Guest actions (call DB + update local state)
  addGuest: (guest: Omit<Guest, 'id' | 'token' | 'status' | 'roundSent'>) => Promise<void>;
  updateGuest: (id: string, updates: Partial<Guest>) => Promise<void>;
  deleteGuest: (id: string) => Promise<void>;
  // Event actions
  updateEvent: (id: string, updates: Partial<Event>) => Promise<void>;
  // Invite rounds
  sendRound: (eventId: string, round: 1 | 2 | 3) => Promise<void>;
  assignTable: (guestId: string, tableNumber: number) => Promise<void>;
  // Public page actions (no auth needed)
  respondToInvite: (token: string, status: 'confirmed' | 'declined', guestsCount?: number) => Promise<Guest | null>;
  getGuestByTokenAsync: (token: string) => Promise<{ guest: Guest; event: Event } | null>;
}

export const useStore = create<StoreState>()((set, get) => ({
  currentUser: null,
  currentEvent: null,
  users: [adminUser],
  guests: [],

  setCurrentUser: (user) => set({ currentUser: user }),

  setEvent: (event) => set({ currentEvent: event }),

  setGuests: (guests) => set({ guests }),

  adminLogin: (password: string) => {
    if (password === adminUser.password) {
      set({ currentUser: adminUser });
      return true;
    }
    return false;
  },

  logout: () => {
    set({ currentUser: null, currentEvent: null, guests: [] });
  },

  addGuest: async (guest) => {
    const newGuest = await addGuestToDB(guest);
    set((state) => ({ guests: [...state.guests, newGuest] }));
  },

  updateGuest: async (id, updates) => {
    await updateGuestInDB(id, updates);
    set((state) => ({
      guests: state.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  },

  deleteGuest: async (id) => {
    await deleteGuestFromDB(id);
    set((state) => ({ guests: state.guests.filter((g) => g.id !== id) }));
  },

  updateEvent: async (id, updates) => {
    await updateEventInDB(id, updates);
    set((state) => ({
      currentEvent: state.currentEvent?.id === id
        ? { ...state.currentEvent, ...updates }
        : state.currentEvent,
    }));
  },

  sendRound: async (eventId, round) => {
    await updateGuestRoundSentBatch(eventId, round);
    set((state) => ({
      guests: state.guests.map((g) => {
        if (g.eventId !== eventId) return g;
        if (round === 1 && g.roundSent === 0) return { ...g, roundSent: 1 };
        if (round === 2 && g.roundSent === 1 && g.status === 'pending') return { ...g, roundSent: 2 };
        if (round === 3 && g.roundSent === 2 && g.status === 'pending') return { ...g, roundSent: 3 };
        return g;
      }),
    }));
  },

  assignTable: async (guestId, tableNumber) => {
    await updateGuestInDB(guestId, { tableNumber });
    set((state) => ({
      guests: state.guests.map((g) =>
        g.id === guestId ? { ...g, tableNumber } : g
      ),
    }));
  },

  respondToInvite: async (token, status, guestsCount) => {
    const result = await respondToInviteInDB(token, status, guestsCount);
    return result;
  },

  getGuestByTokenAsync: async (token) => {
    return getGuestByToken(token);
  },
}));
