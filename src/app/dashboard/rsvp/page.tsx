'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Send, Lock } from 'lucide-react';

function buildWhatsAppMessage(name: string, coupleName1: string, coupleName2: string, date: string, venueName: string, token: string): string {
  const formattedDate = date
    ? new Intl.DateTimeFormat('he-IL', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date))
    : '';
  const inviteUrl = `${typeof window !== 'undefined' ? window.location.origin : ''}/invite/${token}`;
  return `שלום ${name}! 👋\n\nנשמח להזמין אותך לחגוג איתנו את חתונתנו של ${coupleName1} ו${coupleName2}!\n\n📅 ${formattedDate}\n🏛️ ${venueName}\n\nלאישור הגעה לחץ/י על הקישור:\n${inviteUrl}`;
}

export default function RsvpPage() {
  const { currentUser, currentEvent, guests, sendRound } = useStore();
  const event = currentEvent;
  const eventGuests = guests.filter((g) => g.eventId === currentUser?.eventId);

  const [confirmModal, setConfirmModal] = useState<{ round: 1 | 2 | 3; targets: typeof eventGuests } | null>(null);
  const [sending, setSending] = useState(false);

  const round1Targets = eventGuests.filter((g) => g.roundSent === 0);
  const round2Targets = eventGuests.filter((g) => g.roundSent === 1 && g.status === 'pending');
  const round3Targets = eventGuests.filter((g) => g.roundSent === 2 && g.status === 'pending');

  const round1Sent = eventGuests.some((g) => g.roundSent >= 1);
  const round2Sent = eventGuests.some((g) => g.roundSent >= 2);

  const round1Locked = false;
  const round2Locked = !round1Sent;
  const round3Locked = !round2Sent;

  const handleSendRound = async (round: 1 | 2 | 3, targets: typeof eventGuests) => {
    setConfirmModal({ round, targets });
  };

  const confirmSend = async () => {
    if (!confirmModal || !event) return;
    setSending(true);

    // Open WhatsApp for each guest with a small delay
    for (let i = 0; i < confirmModal.targets.length; i++) {
      const g = confirmModal.targets[i];
      const msg = buildWhatsAppMessage(g.name, event.coupleName1, event.coupleName2, event.date, event.venueName, g.token);
      const url = `https://wa.me/${g.phone.replace('+', '')}?text=${encodeURIComponent(msg)}`;
      window.open(url, '_blank');
      if (i < confirmModal.targets.length - 1) {
        await new Promise((r) => setTimeout(r, 500));
      }
    }

    await sendRound(event.id, confirmModal.round);
    setSending(false);
    setConfirmModal(null);
  };

  const rounds = [
    {
      num: 1 as const,
      label: 'סבב 1 — הזמנות ראשוניות',
      sub: `${round1Targets.length} מוזמנים שטרם קיבלו הזמנה`,
      targets: round1Targets,
      locked: round1Locked,
      color: '#d4a843',
      sentCount: eventGuests.filter((g) => g.roundSent >= 1).length,
      totalSent: round1Sent,
    },
    {
      num: 2 as const,
      label: 'סבב 2 — תזכורת ראשונה',
      sub: `${round2Targets.length} ממתינים לתגובה`,
      targets: round2Targets,
      locked: round2Locked,
      color: '#f0a030',
      sentCount: eventGuests.filter((g) => g.roundSent >= 2).length,
      totalSent: round2Sent,
    },
    {
      num: 3 as const,
      label: 'סבב 3 — תזכורת אחרונה',
      sub: `${round3Targets.length} עדיין לא ענו`,
      targets: round3Targets,
      locked: round3Locked,
      color: '#e87820',
      sentCount: eventGuests.filter((g) => g.roundSent >= 3).length,
      totalSent: false,
    },
  ];

  const confirmed = eventGuests.filter((g) => g.status === 'confirmed');
  const pending = eventGuests.filter((g) => g.status === 'pending');
  const declined = eventGuests.filter((g) => g.status === 'declined');

  return (
    <div className="screen" style={{ padding: '24px 16px 100px' }}>
      <h1 className="section-title">סבבי אישורים</h1>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#22c55e' }}>{confirmed.length}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>אישרו</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#6b7280' }}>{pending.length}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>ממתינים</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '12px 8px' }}>
          <div style={{ fontSize: '24px', fontWeight: '800', color: '#ef4444' }}>{declined.length}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>ביטלו</div>
        </div>
      </div>

      {/* Round buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {rounds.map((round) => (
          <div
            key={round.num}
            className="card"
            style={{
              opacity: round.locked ? 0.5 : 1,
              border: `1px solid ${round.locked ? '#2a2a2a' : round.color + '44'}`,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '700' }}>{round.label}</div>
                <div style={{ fontSize: '13px', color: '#888', marginTop: '2px' }}>{round.sub}</div>
              </div>
              <div
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '12px',
                  background: round.locked ? '#2a2a2a' : `${round.color}22`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                }}
              >
                {round.locked ? <Lock size={18} color="#555" /> : <Send size={18} color={round.color} />}
              </div>
            </div>

            {/* Progress */}
            {round.sentCount > 0 && (
              <div style={{ marginBottom: '12px' }}>
                <div style={{ fontSize: '12px', color: '#888', marginBottom: '4px' }}>
                  נשלח ל-{round.sentCount} מוזמנים
                </div>
                <div style={{ background: '#2a2a2a', borderRadius: '4px', height: '4px' }}>
                  <div style={{ width: `${(round.sentCount / eventGuests.length) * 100}%`, height: '100%', background: round.color, borderRadius: '4px' }} />
                </div>
              </div>
            )}

            <button
              onClick={() => !round.locked && round.targets.length > 0 && handleSendRound(round.num, round.targets)}
              disabled={round.locked || round.targets.length === 0}
              style={{
                width: '100%',
                height: '48px',
                borderRadius: '12px',
                background: round.locked || round.targets.length === 0 ? '#2a2a2a' : round.color,
                color: round.locked || round.targets.length === 0 ? '#555' : '#000',
                fontSize: '15px',
                fontWeight: '700',
                border: 'none',
                cursor: round.locked || round.targets.length === 0 ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
              }}
            >
              {round.locked ? (
                <>
                  <Lock size={16} />
                  נעול — שלח סבב {round.num - 1} תחילה
                </>
              ) : round.targets.length === 0 ? (
                '✓ הסבב הסתיים'
              ) : (
                <>
                  <Send size={16} />
                  שלח ל-{round.targets.length} מוזמנים
                </>
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Confirmation Modal */}
      {confirmModal && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(0,0,0,0.85)',
            display: 'flex',
            alignItems: 'flex-end',
            justifyContent: 'center',
            zIndex: 200,
            padding: '0 16px',
          }}
          onClick={() => !sending && setConfirmModal(null)}
        >
          <div
            style={{
              background: '#1a1a1a',
              borderRadius: '24px 24px 0 0',
              padding: '24px',
              width: '100%',
              maxWidth: '440px',
              marginBottom: 'env(safe-area-inset-bottom)',
            }}
            onClick={(e) => e.stopPropagation()}
          >
            <div style={{ width: '40px', height: '4px', background: '#3a3a3a', borderRadius: '2px', margin: '0 auto 20px' }} />
            <div style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>
              שליחת סבב {confirmModal.round}
            </div>
            <div style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>
              ייפתחו {confirmModal.targets.length} חלונות WhatsApp לשליחת הודעה לכל אחד מהמוזמנים.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <button
                className="btn-primary"
                onClick={confirmSend}
                disabled={sending}
                style={{ opacity: sending ? 0.7 : 1 }}
              >
                {sending ? 'שולח...' : `שלח ל-${confirmModal.targets.length} מוזמנים`}
              </button>
              <button
                className="btn-secondary"
                onClick={() => !sending && setConfirmModal(null)}
                disabled={sending}
              >
                ביטול
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
