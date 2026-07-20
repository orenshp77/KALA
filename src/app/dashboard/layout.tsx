'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getEvent, getGuests } from '@/lib/supabaseData';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, setEvent, setGuests } = useStore();
  const [ready, setReady] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for Zustand hydration from localStorage
  useEffect(() => {
    const unsub = useStore.persist.onFinishHydration(() => setHydrated(true));
    // If already hydrated
    if (useStore.persist.hasHydrated()) setHydrated(true);
    return () => unsub();
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (!currentUser) {
      router.replace('/login');
      return;
    }
    if (currentUser.role === 'admin') {
      setReady(true);
      return;
    }
    // Load data from Supabase
    getEvent(currentUser.eventId).then((ev) => {
      if (ev) {
        // If onboarding not complete, redirect
        if (!ev.coupleName1) {
          router.replace('/onboarding');
          return;
        }
        setEvent(ev);
      }
      setReady(true);
    });
    getGuests(currentUser.eventId).then((gs) => setGuests(gs));
  }, [currentUser]);

  if (!ready) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d4a843' }}>טוען...</div>
      </div>
    );
  }

  if (!currentUser) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d4a843' }}>טוען...</div>
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', minHeight: '100dvh', background: '#0f0f0f' }}>
      <main style={{ paddingBottom: '64px' }}>{children}</main>
      <BottomNav />
    </div>
  );
}
