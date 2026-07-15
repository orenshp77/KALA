'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { Shield } from 'lucide-react';

export default function AdminLoginPage() {
  const router = useRouter();
  const { adminLogin } = useStore();
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    await new Promise((r) => setTimeout(r, 300));
    const ok = adminLogin(password);
    if (ok) {
      router.push('/admin');
    } else {
      setError('סיסמה שגויה');
    }
    setLoading(false);
  };

  return (
    <div className="screen" style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '24px' }}>
      <div style={{ textAlign: 'center', marginBottom: '48px' }}>
        <div style={{ width: '72px', height: '72px', background: '#1a1a1a', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
          <Shield size={36} color="#d4a843" />
        </div>
        <div style={{ fontSize: '28px', fontWeight: '800' }}>כניסת מנהל</div>
        <div style={{ fontSize: '14px', color: '#888', marginTop: '6px' }}>גישה לניהול כל האירועים</div>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <div>
          <label className="label">סיסמת מנהל</label>
          <input
            className="input-field"
            type="password"
            placeholder="הכנס סיסמה"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
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
          {loading ? '...' : 'כניסה'}
        </button>
      </form>

      <div style={{ marginTop: '24px', textAlign: 'center' }}>
        <button
          onClick={() => router.push('/login')}
          style={{ color: '#555', fontSize: '13px', background: 'none', border: 'none', cursor: 'pointer' }}
        >
          חזרה לכניסת זוגות
        </button>
      </div>

      <div style={{ marginTop: '16px', textAlign: 'center' }}>
        <div style={{ fontSize: '12px', color: '#444' }}>הסיסמה לדמו: admin123</div>
      </div>
    </div>
  );
}
