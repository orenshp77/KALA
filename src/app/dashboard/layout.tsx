'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import BottomNav from '@/components/BottomNav';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const currentUser = useStore((s) => s.currentUser);

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'couple') {
      router.replace('/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'couple') {
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
