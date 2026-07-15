'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Users, CheckSquare, LayoutGrid, Share2 } from 'lucide-react';

const navItems = [
  { href: '/dashboard', icon: Home, label: 'בית' },
  { href: '/dashboard/guests', icon: Users, label: 'מוזמנים' },
  { href: '/dashboard/rsvp', icon: CheckSquare, label: 'אישורים' },
  { href: '/dashboard/seating', icon: LayoutGrid, label: 'שולחנות' },
  { href: '/dashboard/qr', icon: Share2, label: 'שיתוף' },
];

export default function BottomNav() {
  const pathname = usePathname();

  return (
    <nav
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        background: '#111111',
        borderTop: '1px solid #2a2a2a',
        display: 'flex',
        justifyContent: 'space-around',
        alignItems: 'center',
        paddingBottom: 'env(safe-area-inset-bottom)',
        zIndex: 50,
        height: '64px',
      }}
    >
      {navItems.map(({ href, icon: Icon, label }) => {
        const isActive = pathname === href;
        return (
          <Link
            key={href}
            href={href}
            style={{
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '2px',
              minWidth: '44px',
              minHeight: '44px',
              color: isActive ? '#d4a843' : '#888888',
              textDecoration: 'none',
              flex: 1,
              padding: '4px 0',
            }}
          >
            <Icon size={22} />
            <span style={{ fontSize: '10px', fontWeight: isActive ? '600' : '400' }}>{label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
