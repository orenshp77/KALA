'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getAllEventsAdmin, deleteUserFromDB, updateProfileEmail } from '@/lib/supabaseData';
import { Event, Guest } from '@/types';
import { LogOut, Users, CheckCircle, X, Pencil, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';

interface ProfileRow { id: string; email: string; role: string; event_id: string; }

type Modal =
  | { type: 'delete'; profileId: string; email: string }
  | { type: 'edit'; profileId: string; email: string };

export default function AdminPage() {
  const router = useRouter();
  const { currentUser, logout } = useStore();

  const [profiles, setProfiles] = useState<ProfileRow[]>([]);
  const [events, setEvents] = useState<Event[]>([]);
  const [guests, setGuests] = useState<Guest[]>([]);
  const [loadingData, setLoadingData] = useState(true);
  const [modal, setModal] = useState<Modal | null>(null);
  const [editEmail, setEditEmail] = useState('');
  const [saving, setSaving] = useState(false);

  const loadData = () => {
    getAllEventsAdmin().then(({ profiles: p, events: e, guests: g }) => {
      setProfiles(p);
      setEvents(e);
      setGuests(g);
      setLoadingData(false);
    });
  };

  useEffect(() => {
    if (!currentUser || currentUser.role !== 'admin') {
      router.replace('/admin/login');
      return;
    }
    loadData();
  }, [currentUser, router]);

  if (!currentUser || currentUser.role !== 'admin') {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d4a843' }}>טוען...</div>
      </div>
    );
  }

  const couples = profiles.filter((p) => p.role === 'couple');
  const totalGuests = guests.length;
  const totalConfirmed = guests.filter((g) => g.status === 'confirmed').length;

  const handleLogout = () => { logout(); router.push('/admin/login'); };

  const handleDelete = async () => {
    if (!modal || modal.type !== 'delete') return;
    setSaving(true);
    await deleteUserFromDB(modal.profileId);
    toast.success('המשתמש נמחק');
    setModal(null);
    setSaving(false);
    loadData();
  };

  const handleEditSave = async () => {
    if (!modal || modal.type !== 'edit') return;
    if (!editEmail.trim() || !editEmail.includes('@')) {
      toast.error('אימייל לא תקין');
      return;
    }
    setSaving(true);
    await updateProfileEmail(modal.profileId, editEmail.trim());
    toast.success('האימייל עודכן');
    setModal(null);
    setSaving(false);
    loadData();
  };

  return (
    <div className="screen" style={{ padding: '24px 16px 32px' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px' }}>
        <div>
          <div style={{ fontSize: '13px', color: '#888' }}>לוח בקרה</div>
          <h1 style={{ fontSize: '24px', fontWeight: '800' }}>מנהל מערכת</h1>
        </div>
        <button onClick={handleLogout} style={{ width: '44px', height: '44px', background: '#1a1a1a', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1px solid #2a2a2a' }}>
          <LogOut size={18} color="#ef4444" />
        </button>
      </div>

      {/* Stats */}
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

      <div style={{ fontSize: '15px', fontWeight: '700', marginBottom: '12px', color: '#d4a843' }}>כל האירועים</div>

      {loadingData ? (
        <div style={{ textAlign: 'center', color: '#888', padding: '40px 0', fontSize: '14px' }}>טוען נתונים...</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {couples.map((profile) => {
            const event = events.find((e) => e.id === profile.event_id);
            const eventGuests = guests.filter((g) => g.eventId === profile.event_id);
            const confirmed = eventGuests.filter((g) => g.status === 'confirmed');
            const pending = eventGuests.filter((g) => g.status === 'pending');

            return (
              <div key={profile.id} className="card">
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: '16px', fontWeight: '700' }}>
                      {event?.coupleName1 && event?.coupleName2 ? `${event.coupleName1} & ${event.coupleName2}` : profile.email}
                    </div>
                    <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{profile.email}</div>
                    {event?.date && (
                      <div style={{ fontSize: '12px', color: '#d4a843', marginTop: '4px' }}>
                        {new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.date))}
                      </div>
                    )}
                    {event?.venueName && <div style={{ fontSize: '12px', color: '#666', marginTop: '2px' }}>{event.venueName}</div>}
                  </div>

                  {/* Action buttons */}
                  <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginRight: '8px' }}>
                    <button
                      onClick={() => { setEditEmail(profile.email); setModal({ type: 'edit', profileId: profile.id, email: profile.email }); }}
                      style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Pencil size={14} color="#d4a843" />
                    </button>
                    <button
                      onClick={() => setModal({ type: 'delete', profileId: profile.id, email: profile.email })}
                      style={{ width: '34px', height: '34px', borderRadius: '10px', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                    >
                      <Trash2 size={14} color="#ef4444" />
                    </button>
                  </div>
                </div>

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
            <div style={{ textAlign: 'center', color: '#555', padding: '40px 0', fontSize: '14px' }}>אין אירועים רשומים</div>
          )}
        </div>
      )}

      {/* Modal */}
      {modal && (
        <div
          onClick={() => setModal(null)}
          style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.75)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '24px' }}
        >
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1a1a1a', borderRadius: '20px', padding: '24px', width: '100%', border: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <div>
                <div style={{ fontSize: '16px', fontWeight: '700' }}>
                  {modal.type === 'delete' ? '🗑 מחיקת משתמש' : '✏️ עריכת משתמש'}
                </div>
                <div style={{ fontSize: '12px', color: '#888', marginTop: '2px' }}>{modal.email}</div>
              </div>
              <button onClick={() => setModal(null)} style={{ width: '36px', height: '36px', background: '#2a2a2a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer' }}>
                <X size={16} color="#888" />
              </button>
            </div>

            {modal.type === 'delete' ? (
              <>
                <div style={{ fontSize: '14px', color: '#ccc', marginBottom: '20px', lineHeight: '1.5' }}>
                  האם למחוק את המשתמש <strong>{modal.email}</strong>?<br />
                  <span style={{ color: '#ef4444', fontSize: '12px' }}>כל האירועים והמוזמנים שלו יימחקו לצמיתות.</span>
                </div>
                <button
                  className="btn-primary"
                  onClick={handleDelete}
                  disabled={saving}
                  style={{ background: '#ef4444' }}
                >
                  {saving ? 'מוחק...' : 'מחק משתמש'}
                </button>
              </>
            ) : (
              <>
                <label className="label">אימייל חדש</label>
                <input
                  className="input-field"
                  type="email"
                  value={editEmail}
                  onChange={(e) => setEditEmail(e.target.value)}
                  autoFocus
                  style={{ marginBottom: '20px', direction: 'ltr', textAlign: 'left' }}
                />
                <button
                  className="btn-primary"
                  onClick={handleEditSave}
                  disabled={saving}
                  style={{ background: '#d4a843' }}
                >
                  {saving ? 'שומר...' : 'שמור שינויים'}
                </button>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
// force rebuild Wed Jul 15 15:26:35 JDT 2026
