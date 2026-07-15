'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';

export default function RootPage() {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);

  useEffect(() => {
    if (currentUser) {
      if (currentUser.role === 'admin') {
        router.replace('/admin');
      } else {
        router.replace('/dashboard');
      }
    } else {
      router.replace('/login');
    }
  }, [currentUser, router]);

  return (
    <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
      <div style={{ color: '#d4a843', fontSize: 24, fontWeight: 700 }}>KALA</div>
    </div>
  );
}
