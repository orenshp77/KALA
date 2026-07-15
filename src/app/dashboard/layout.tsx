'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { supabase } from '@/lib/supabase';
import { getOrCreateProfile, getEvent, getGuests } from '@/lib/supabaseData';
import BottomNav from '@/components/BottomNav';
import { User } from '@/types';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const { currentUser, setCurrentUser, setEvent, setGuests } = useStore();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    // Admin users bypass Supabase auth
    if (currentUser && currentUser.role === 'admin') {
      setReady(true);
      return;
    }

    supabase.auth.getSession().then(async ({ data: { session } }) => {
      if (!session) {
        // No Supabase session — redirect to login
        router.replace('/login');
        return;
      }

      // Ensure profile exists and get eventId
      const { eventId } = await getOrCreateProfile(session.user.id, session.user.email || '');

      const user: User = {
        id: session.user.id,
        email: session.user.email || '',
        password: '',
        role: 'couple',
        eventId,
      };

      setCurrentUser(user);

      // Load event and guests into store
      const [event, guests] = await Promise.all([
        getEvent(eventId),
        getGuests(eventId),
      ]);

      setEvent(event);
      setGuests(guests);
      setReady(true);
    });
  }, []);

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
