'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, Event, Guest } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 18);
}

const DEMO_EVENT_ID = 'event-demo-001';
const DEMO_USER_ID = 'user-demo-001';

const demoGuests: Guest[] = [
  { id: 'g1', eventId: DEMO_EVENT_ID, name: 'אורן כהן', phone: '+972501234567', guestsCount: 2, status: 'confirmed', roundSent: 1, respondedAt: '2025-05-10T10:00:00Z', tableNumber: 3, token: 'tok-g1-abc123' },
  { id: 'g2', eventId: DEMO_EVENT_ID, name: 'מיכל לוי', phone: '+972521234568', guestsCount: 1, status: 'confirmed', roundSent: 1, respondedAt: '2025-05-11T12:00:00Z', tableNumber: 5, token: 'tok-g2-def456' },
  { id: 'g3', eventId: DEMO_EVENT_ID, name: 'דוד ישראלי', phone: '+972531234569', guestsCount: 3, status: 'declined', roundSent: 1, respondedAt: '2025-05-09T09:00:00Z', token: 'tok-g3-ghi789' },
  { id: 'g4', eventId: DEMO_EVENT_ID, name: 'רחל אברהם', phone: '+972541234570', guestsCount: 2, status: 'pending', roundSent: 1, token: 'tok-g4-jkl012' },
  { id: 'g5', eventId: DEMO_EVENT_ID, name: 'יוסי בן דוד', phone: '+972551234571', guestsCount: 1, status: 'pending', roundSent: 1, token: 'tok-g5-mno345' },
  { id: 'g6', eventId: DEMO_EVENT_ID, name: 'שרה גולדברג', phone: '+972561234572', guestsCount: 4, status: 'confirmed', roundSent: 1, respondedAt: '2025-05-12T14:00:00Z', tableNumber: 2, token: 'tok-g6-pqr678' },
  { id: 'g7', eventId: DEMO_EVENT_ID, name: 'אבי מזרחי', phone: '+972571234573', guestsCount: 2, status: 'pending', roundSent: 0, token: 'tok-g7-stu901' },
  { id: 'g8', eventId: DEMO_EVENT_ID, name: 'נועה שפירו', phone: '+972581234574', guestsCount: 1, status: 'confirmed', roundSent: 1, respondedAt: '2025-05-13T16:00:00Z', tableNumber: 3, token: 'tok-g8-vwx234' },
  { id: 'g9', eventId: DEMO_EVENT_ID, name: 'גיל פרידמן', phone: '+972591234575', guestsCount: 2, status: 'declined', roundSent: 1, respondedAt: '2025-05-08T11:00:00Z', token: 'tok-g9-yza567' },
  { id: 'g10', eventId: DEMO_EVENT_ID, name: 'תמר רוזן', phone: '+972501234576', guestsCount: 3, status: 'pending', roundSent: 1, token: 'tok-g10-bcd890' },
];

const demoEvent: Event = {
  id: DEMO_EVENT_ID,
  userId: DEMO_USER_ID,
  coupleName1: 'יעל',
  coupleName2: 'דניאל',
  date: '2025-06-15T18:00:00Z',
  venueName: 'אולם המלכות',
  venueAddress: 'רחוב הרצל 45, תל אביב',
  venueLat: 32.0853,
  venueLng: 34.7818,
  selectedDesign: 1,
};

const demoUser: User = {
  id: DEMO_USER_ID,
  email: 'demo@test.com',
  password: '1234',
  role: 'couple',
  eventId: DEMO_EVENT_ID,
};

const adminUser: User = {
  id: 'admin-001',
  email: 'admin',
  password: 'admin123',
  role: 'admin',
  eventId: '',
};

interface StoreState {
  currentUser: User | null;
  users: User[];
  events: Event[];
  guests: Guest[];
  login: (email: string, password: string) => boolean;
  adminLogin: (password: string) => boolean;
  logout: () => void;
  register: (email: string, password: string) => boolean;
  addGuest: (guest: Omit<Guest, 'id' | 'token' | 'status' | 'roundSent'>) => void;
  updateGuest: (id: string, updates: Partial<Guest>) => void;
  deleteGuest: (id: string) => void;
  updateEvent: (id: string, updates: Partial<Event>) => void;
  updateUser: (id: string, updates: Partial<User>) => void;
  sendRound: (eventId: string, round: 1 | 2 | 3) => void;
  assignTable: (guestId: string, tableNumber: number) => void;
  respondToInvite: (token: string, status: 'confirmed' | 'declined', guestsCount?: number) => Guest | null;
  getGuestByToken: (token: string) => Guest | null;
  getEventByToken: (token: string) => Event | null;
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      currentUser: null,
      users: [demoUser, adminUser],
      events: [demoEvent],
      guests: demoGuests,

      login: (email: string, password: string) => {
        const user = get().users.find(
          (u) => u.email === email && u.password === password && u.role === 'couple'
        );
        if (user) {
          set({ currentUser: user });
          return true;
        }
        return false;
      },

      adminLogin: (password: string) => {
        const admin = get().users.find(
          (u) => u.role === 'admin' && u.password === password
        );
        if (admin) {
          set({ currentUser: admin });
          return true;
        }
        return false;
      },

      logout: () => set({ currentUser: null }),

      register: (email: string, password: string) => {
        const existing = get().users.find((u) => u.email === email);
        if (existing) return false;
        const newEventId = generateId();
        const newUserId = generateId();
        const newEvent: Event = {
          id: newEventId,
          userId: newUserId,
          coupleName1: '',
          coupleName2: '',
          date: '',
          venueName: '',
          venueAddress: '',
          selectedDesign: 1,
        };
        const newUser: User = {
          id: newUserId,
          email,
          password,
          role: 'couple',
          eventId: newEventId,
        };
        set((state) => ({
          users: [...state.users, newUser],
          events: [...state.events, newEvent],
          currentUser: newUser,
        }));
        return true;
      },

      addGuest: (guest) => {
        const newGuest: Guest = {
          ...guest,
          id: generateId(),
          token: generateToken(),
          status: 'pending',
          roundSent: 0,
        };
        set((state) => ({ guests: [...state.guests, newGuest] }));
      },

      updateGuest: (id, updates) => {
        set((state) => ({
          guests: state.guests.map((g) => (g.id === id ? { ...g, ...updates } : g)),
        }));
      },

      deleteGuest: (id) => {
        set((state) => ({ guests: state.guests.filter((g) => g.id !== id) }));
      },

      updateEvent: (id, updates) => {
        set((state) => ({
          events: state.events.map((e) => (e.id === id ? { ...e, ...updates } : e)),
        }));
      },

      updateUser: (id, updates) => {
        set((state) => ({
          users: state.users.map((u) => (u.id === id ? { ...u, ...updates } : u)),
        }));
      },

      sendRound: (eventId, round) => {
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

      assignTable: (guestId, tableNumber) => {
        set((state) => ({
          guests: state.guests.map((g) =>
            g.id === guestId ? { ...g, tableNumber } : g
          ),
        }));
      },

      respondToInvite: (token, status, guestsCount) => {
        const guest = get().guests.find((g) => g.token === token);
        if (!guest) return null;
        const updates: Partial<Guest> = {
          status,
          respondedAt: new Date().toISOString(),
          ...(guestsCount !== undefined ? { guestsCount } : {}),
        };
        set((state) => ({
          guests: state.guests.map((g) => (g.token === token ? { ...g, ...updates } : g)),
        }));
        return { ...guest, ...updates };
      },

      getGuestByToken: (token) => {
        return get().guests.find((g) => g.token === token) || null;
      },

      getEventByToken: (token) => {
        const guest = get().guests.find((g) => g.token === token);
        if (!guest) return null;
        return get().events.find((e) => e.id === guest.eventId) || null;
      },
    }),
    {
      name: 'kala_store',
      skipHydration: true,
    }
  )
);
