'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function RootPage() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);
  const [hydrated, setHydrated] = useState(false);

  useEffect(() => {
    if (useStore.persist.hasHydrated()) setHydrated(true);
    else useStore.persist.onFinishHydration(() => setHydrated(true));
  }, []);

  useEffect(() => {
    if (!hydrated) return;
    if (currentUser) {
      if (currentUser.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [currentUser, router, hydrated]);

  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#d4a843', fontSize: 24, fontWeight: 700 }}>KALA</div>
    </div>
  );
}
