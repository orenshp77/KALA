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

  useEffect(() => {
    if (!currentUser) {
      if (currentUser !== undefined) router.replace('/login');
      return;
    }
    if (currentUser.role === 'admin') {
      setReady(true);
      return;
    }
    // Load data from Supabase
    getEvent(currentUser.eventId).then((ev) => { if (ev) setEvent(ev); });
    getGuests(currentUser.eventId).then((gs) => setGuests(gs));
    setReady(true);
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
