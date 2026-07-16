'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { registerUser, loginUser, getEvent } from '@/lib/supabaseData';
import { User } from '@/types';

export default function LoginPage() {
  const router = useRouter();
  const { setCurrentUser } = useStore();
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !password) {
      setError('נא למלא את כל השדות');
      setLoading(false);
      return;
    }

    if (mode === 'register') {
      if (password.length < 6) {
        setError('הסיסמה חייבת להכיל לפחות 6 תווים');
        setLoading(false);
        return;
      }

      const result = await registerUser(email, password);

      if (!result) {
        setError('אימייל כבר קיים');
        setLoading(false);
        return;
      }

      const user: User = { id: result.userId, email, password: '', role: 'couple', eventId: result.eventId };
      setCurrentUser(user);
      router.push('/onboarding');
    } else {
      const result = await loginUser(email, password);

      if (!result) {
        setError('אימייל או סיסמה שגויים');
        setLoading(false);
        return;
      }

      const user: User = { id: result.userId, email, password: '', role: 'couple', eventId: result.eventId };
      setCurrentUser(user);

      // Check if onboarding is complete
      const event = await getEvent(result.eventId);
      if (event && event.coupleName1) {
        router.push('/dashboard');
      } else {
        router.push('/onboarding');
      }
    }

    setLoading(false);
  };

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
      {/* Logo */}
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ fontSize: '48px', fontWeight: '900', color: '#d4a843', letterSpacing: '-1px', lineHeight: 1 }}>
          KALA
        </div>
        <div style={{ fontSize: '14px', color: '#888', marginTop: '6px' }}>ניהול הזמנות לאירועים</div>
      </div>

      {/* Toggle */}
      <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '14px', padding: '4px', marginBottom: '32px', border: '1px solid #2a2a2a' }}>
        <button
          onClick={() => { setMode('login'); setError(''); }}
          style={{
            flex: 1,
            height: '44px',
            borderRadius: '10px',
            background: mode === 'login' ? '#d4a843' : 'transparent',
            color: mode === 'login' ? '#000' : '#888',
            fontWeight: 700,
            fontSize: '15px',
            transition: 'all 0.2s',
          }}
        >
          כניסה
        </button>
        <button
          onClick={() => { setMode('register'); setError(''); }}
          style={{
            flex: 1,
            height: '44px',
            borderRadius: '10px',
            background: mode === 'register' ? '#d4a843' : 'transparent',
            color: mode === 'register' ? '#000' : '#888',
            fontWeight: 700,
            fontSize: '15px',
            transition: 'all 0.2s',
          }}
        >
          הרשמה
        </button>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="label">כתובת אימייל</label>
          <input
            className="input-field"
            type="email"
            placeholder="your@email.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            inputMode="email"
            dir="ltr"
            style={{ textAlign: 'left' }}
          />
        </div>
        <div>
          <label className="label">סיסמה</label>
          <input
            className="input-field"
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={mode === 'login' ? 'current-password' : 'new-password'}
          />
        </div>

        {error && (
          <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px' }}>
            {error}
          </div>
        )}

        <button
          type="submit"
          className="btn-primary"
          disabled={loading}
          style={{ marginTop: '8px', opacity: loading ? 0.7 : 1 }}
        >
          {loading ? '...' : mode === 'login' ? 'כניסה' : 'הרשמה'}
        </button>
      </form>

      {/* Admin link */}
      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={() => router.push('/admin/login')}
          style={{ color: '#555', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          כניסת מנהל
        </button>
      </div>
    </div>
  );
}
