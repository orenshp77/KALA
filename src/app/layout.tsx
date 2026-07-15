import type { Metadata } from 'next';
import './globals.css';
import PhoneFrame from '@/components/PhoneFrame';
import { Toaster } from 'react-hot-toast';

export const metadata: Metadata = {
  title: 'KALA - ניהול הזמנות',
  description: 'מערכת ניהול הזמנות לאירועים',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body>
        <PhoneFrame>{children}</PhoneFrame>
        <Toaster
          position="top-center"
          toastOptions={{
            duration: 2500,
            style: {
              background: '#1a1a1a',
              color: '#fff',
              border: '1px solid #d4a843',
              borderRadius: '12px',
              fontFamily: 'Heebo, sans-serif',
              fontSize: '15px',
              direction: 'rtl',
            },
          }}
        />
      </body>
    </html>
  );
}
