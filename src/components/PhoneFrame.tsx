'use client';

import { useEffect, useState } from 'react';

export default function PhoneFrame({ children }: { children: React.ReactNode }) {
  const [isMobile, setIsMobile] = useState(true);

  useEffect(() => {
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  if (isMobile) {
    return <>{children}</>;
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
      }}
    >
      <div
        style={{
          width: '390px',
          height: '844px',
          borderRadius: '40px',
          overflow: 'hidden',
          boxShadow: '0 40px 100px rgba(0,0,0,0.7), 0 0 0 1px rgba(255,255,255,0.1)',
          position: 'relative',
          background: '#0f0f0f',
          flexShrink: 0,
        }}
      >
        {/* Phone notch */}
        <div
          style={{
            position: 'absolute',
            top: 0,
            left: '50%',
            transform: 'translateX(-50%)',
            width: '120px',
            height: '30px',
            background: '#000',
            borderBottomLeftRadius: '16px',
            borderBottomRightRadius: '16px',
            zIndex: 100,
          }}
        />
        <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
          {children}
        </div>
      </div>
    </div>
  );
}
