'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { LogOut, Users, CheckCircle, KeyRound, X } from 'lucide-react';
import toast from 'react-hot-toast';

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, users, events, guests, logout, updateUser } = useStore();

  const [resetUserId, setResetUserId] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      router.replace('/admin/login');
    }
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d4a843' }}>טוען...</div>
      </div>
    );
  }

  const couples = users.filter((u) => u.role === 'couple');
  const totalGuests = guests.length;
  const totalConfirmed = guests.filter((g) => g.status === 'confirmed').length;

  const handleLogout = () => {
    logout();
    router.push('/admin/login');
  };

  const handleResetPassword = () => {
    if (!resetUserId || newPassword.trim().length < 4) {
      toast.error('סיסמה חייבת להיות לפחות 4 תווים');
      return;
    }
    updateUser(resetUserId, { password: newPassword.trim() });
    toast.success('הסיסמה אופסה בהצלחה');
    setResetUserId(null);
    setNewPassword('');
  };

  const resetUser = users.find((u) => u.id === resetUserId);

  return (
    <div className="screen" style={{ padding: '24px 16px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#888' }}>לוח בקרה</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>מנהל מערכת</h1>
        </div>
        <button
          onClick={handleLogout}
          style={{
            width: '44px', height: '44px', background: '#1a1a1a',
            borderRadius: '12px', display: 'flex', alignItems: 'center',
            justifyContent: 'center', border: '1px solid #2a2a2a',
          }}
        >
          <LogOut size={18} color="#ef4444" />
        </button>
      </div>

      {/* Global stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#d4a843' }}>{couples.length}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>אירועים</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#888' }}>{totalGuests}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>מוזמנים</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '26px', fontWeight: '800', color: '#22c55e' }}>{totalConfirmed}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>אישרו</div>
        </div>
      </div>

      {/* Events list */}
      <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#d4a843' }}>כל האירועים</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
        {couples.map((user) => {
          const event = events.find((e) => e.id === user.eventId);
          const eventGuests = guests.filter((g) => g.eventId === user.eventId);
          const confirmed = eventGuests.filter((g) => g.status === 'confirmed');
          const pending = eventGuests.filter((g) => g.status === 'pending');

          return (
            <div key={user.id} className="card">
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                <div>
                  <div style={{ fontSize: '16px', fontWeight: '700' }}>
                    {event?.coupleName1 && event?.coupleName2
                      ? `${event.coupleName1} & ${event.coupleName2}`
                      : user.email}
                  </div>
                  <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{user.email}</div>
                  {event?.date && (
                    <div style={{ fontSize: '12px', color: '#d4a843', marginTop: '4px' }}>
                      {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.date))}
                    </div>
                  )}
                  {event?.venueName && (
                    <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{event.venueName}</div>
                  )}
                </div>

                {/* Reset password button */}
                <button
                  onClick={() => { setResetUserId(user.id); setNewPassword(''); }}
                  title="איפוס סיסמה"
                  style={{
                    width: '36px', height: '36px', borderRadius: '10px',
                    background: '#1a1a1a', border: '1px solid #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <KeyRound size={15} color="#d4a843" />
                </button>
              </div>

              {/* Stats row */}
              <div style={{ display: 'flex', gap: '16px', borderTop: '1px solid #2a2a2a', paddingTop: '12px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <Users size={13} color="#888" />
                  <span style={{ fontSize: '13px', color: '#888' }}>{eventGuests.length} מוזמנים</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <CheckCircle size={13} color="#22c55e" />
                  <span style={{ fontSize: '13px', color: '#22c55e' }}>{confirmed.length} אישרו</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: '#6b7280', display: 'inline-block' }} />
                  <span style={{ fontSize: '13px', color: '#6b7280' }}>{pending.length} ממתינים</span>
                </div>
              </div>

              {eventGuests.length > 0 && (
                <div style={{ marginTop: '10px' }}>
                  <div style={{ fontSize: '11px', color: '#555', marginBottom: '4px' }}>
                    אחוז אישורים: {Math.round((confirmed.length / eventGuests.length) * 100)}%
                  </div>
                  <div style={{ background: '#2a2a2a', borderRadius: '4px', height: '4px', overflow: 'hidden' }}>
                    <div style={{ width: `${(confirmed.length / eventGuests.length) * 100}%`, height: '100%', background: '#22c55e', borderRadius: '4px' }} />
                  </div>
                </div>
              )}
            </div>
          );
        })}

        {couples.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '40px 0', fontSize: '14px' }}>
            אין אירועים רשומים
          </div>
        )}
      </div>

      {/* Reset Password Modal */}
      {resetUserId && (
        <div
          onClick={() => setResetUserId(null)}
          style={{
            position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            zIndex: 999, padding: '24px',
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#1a1a1a', borderRadius: '20px', padding: '24px',
              width: '100%', border: '1px solid #2a2a2a',
            }}
          >
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>איפוס סיסמה</div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{resetUser?.email}</div>
              </div>
              <button
                onClick={() => setResetUserId(null)}
                style={{ width: '36px', height: '36px', background: '#2a2a2a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}
              >
                <X size={16} color="#888" />
              </button>
            </div>

            <label className="label">סיסמה חדשה</label>
            <input
              className="input-field"
              type="text"
              placeholder="הקלד סיסמה חדשה..."
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              autoFocus
              style={{ marginBottom: '20px' }}
            />

            <button
              className="btn-primary"
              onClick={handleResetPassword}
              style={{ background: '#d4a843' }}
            >
              אפס סיסמה
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
