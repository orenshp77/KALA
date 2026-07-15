'use client';

import { useState, use, useEffect } from 'react';
import { getGuestByToken, respondToInviteInDB } from '@/lib/supabaseData';
import { Guest, Event } from '@/types';

const designs = [
  { id: 1, bg: 'linear-gradient(160deg, #1a1200 0%, #2d2000 100%)', textColor: '#d4a843', accent: '#f0c96e', divider: '#d4a84366' },
  { id: 2, bg: 'linear-gradient(160deg, #f5f0eb 0%, #ede8e3 100%)', textColor: '#1a1a1a', accent: '#333', divider: '#33333344' },
  { id: 3, bg: 'linear-gradient(160deg, #2d1520 0%, #4a1a30 100%)', textColor: '#ffd4e0', accent: '#ff9ab5', divider: '#ff9ab544' },
  { id: 4, bg: 'linear-gradient(160deg, #0a1628 0%, #0d2447 100%)', textColor: '#ffffff', accent: '#7eb8f7', divider: '#7eb8f744' },
  { id: 5, bg: 'linear-gradient(160deg, #1a2d1a 0%, #2d4a2d 100%)', textColor: '#d4e8c2', accent: '#8bc34a', divider: '#8bc34a44' },
];

function formatHebrewDate(dateStr: string) {
  if (!dateStr) return '';
  try {
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function InvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [guest, setGuest] = useState<Guest | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [step, setStep] = useState<'invite' | 'count' | 'done'>('invite');
  const [guestsCount, setGuestsCount] = useState(1);
  const [finalStatus, setFinalStatus] = useState<'confirmed' | 'declined' | null>(null);

  useEffect(() => {
    getGuestByToken(token).then((result) => {
      if (result) {
        setGuest(result.guest);
        setEvent(result.event);
        setGuestsCount(result.guest.guestsCount || 1);
        if (result.guest.status !== 'pending') {
          setFinalStatus(result.guest.status as 'confirmed' | 'declined');
          setStep('done');
        }
      }
      setLoading(false);
    });
  }, [token]);

  const design = designs.find((d) => d.id === (event?.selectedDesign || 1)) || designs[0];

  if (loading) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'rtl',
        }}
      >
        <div style={{ color: '#d4a843', fontSize: '16px' }}>טוען...</div>
      </div>
    );
  }

  if (!guest || !event) {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: '#0f0f0f',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          direction: 'rtl',
          padding: '24px',
        }}
      >
        <div style={{ textAlign: 'center', color: '#888', fontSize: '16px' }}>
          קישור לא תקין או שפג תוקפו
        </div>
      </div>
    );
  }

  const handleDecline = async () => {
    await respondToInviteInDB(token, 'declined');
    setFinalStatus('declined');
    setStep('done');
  };

  const handleConfirm = () => {
    setStep('count');
  };

  const handleSubmitCount = async () => {
    await respondToInviteInDB(token, 'confirmed', guestsCount);
    setFinalStatus('confirmed');
    setStep('done');
  };

  if (step === 'done') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: design.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          direction: 'rtl',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '64px', marginBottom: '24px' }}>
          {finalStatus === 'confirmed' ? '🎉' : '💙'}
        </div>
        <div style={{ fontSize: '26px', fontWeight: '800', color: design.textColor, marginBottom: '12px' }}>
          {finalStatus === 'confirmed' ? 'מעולה! נתראה בחתונה!' : 'תודה על עדכונך'}
        </div>
        <div style={{ fontSize: '16px', color: design.accent }}>
          {finalStatus === 'confirmed'
            ? `${event.coupleName1} ו${event.coupleName2} שמחים לקראת הרגע!`
            : 'נשמח שתהיה/י איתנו בלב'}
        </div>
        {finalStatus === 'confirmed' && (
          <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(0,0,0,0.3)', borderRadius: '16px' }}>
            <div style={{ fontSize: '14px', color: design.accent, marginBottom: '4px' }}>מספר אורחים שאישרת</div>
            <div style={{ fontSize: '48px', fontWeight: '900', color: design.textColor }}>{guestsCount}</div>
          </div>
        )}
      </div>
    );
  }

  if (step === 'count') {
    return (
      <div
        style={{
          minHeight: '100vh',
          background: design.bg,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '32px 24px',
          direction: 'rtl',
          textAlign: 'center',
        }}
      >
        <div style={{ fontSize: '22px', fontWeight: '700', color: design.textColor, marginBottom: '8px' }}>
          כמה אורחים יגיעו?
        </div>
        <div style={{ fontSize: '14px', color: design.accent, marginBottom: '40px' }}>
          כולל{' '}{guest.name}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '24px', marginBottom: '48px' }}>
          <button
            onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              border: `2px solid ${design.accent}`,
              color: design.textColor,
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            −
          </button>
          <div style={{ fontSize: '72px', fontWeight: '900', color: design.textColor, minWidth: '80px' }}>
            {guestsCount}
          </div>
          <button
            onClick={() => setGuestsCount(Math.min(10, guestsCount + 1))}
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'rgba(0,0,0,0.3)',
              border: `2px solid ${design.accent}`,
              color: design.textColor,
              fontSize: '28px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            +
          </button>
        </div>

        <button
          onClick={handleSubmitCount}
          style={{
            width: '100%',
            maxWidth: '320px',
            height: '56px',
            background: '#22c55e',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '700',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
          }}
        >
          אשר הגעה
        </button>
      </div>
    );
  }

  return (
    <div
      style={{
        minHeight: '100vh',
        background: design.bg,
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
      }}
    >
      {/* Invitation content */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 24px', textAlign: 'center' }}>
        <div style={{ fontSize: '13px', color: design.accent, letterSpacing: '4px', marginBottom: '16px', textTransform: 'uppercase' }}>
          הזמנה לחתונה
        </div>

        <div style={{ fontSize: '14px', color: design.accent, marginBottom: '8px' }}>
          {guest.name} היקר/ה
        </div>

        <div style={{ fontSize: '32px', fontWeight: '900', color: design.textColor, marginBottom: '8px', lineHeight: 1.2 }}>
          {event.coupleName1}
        </div>
        <div style={{ fontSize: '20px', color: design.accent, marginBottom: '8px' }}>&</div>
        <div style={{ fontSize: '32px', fontWeight: '900', color: design.textColor, lineHeight: 1.2 }}>
          {event.coupleName2}
        </div>

        <div style={{ width: '60px', height: '1px', background: design.divider, margin: '24px auto' }} />

        <div style={{ fontSize: '15px', color: design.accent, marginBottom: '8px' }}>
          {formatHebrewDate(event.date)}
        </div>
        <div style={{ fontSize: '14px', color: design.textColor, opacity: 0.7 }}>
          {event.venueName}
        </div>
        <div style={{ fontSize: '13px', color: design.accent, opacity: 0.6, marginTop: '4px' }}>
          {event.venueAddress}
        </div>
      </div>

      {/* Action buttons */}
      <div style={{ padding: '16px 24px 40px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
        <button
          onClick={handleConfirm}
          style={{
            width: '100%',
            height: '56px',
            background: '#22c55e',
            color: '#fff',
            fontSize: '18px',
            fontWeight: '800',
            borderRadius: '16px',
            border: 'none',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          ✓ מגיע/ה
        </button>
        <button
          onClick={handleDecline}
          style={{
            width: '100%',
            height: '56px',
            background: 'rgba(239,68,68,0.2)',
            color: '#ef4444',
            fontSize: '18px',
            fontWeight: '700',
            borderRadius: '16px',
            border: '2px solid rgba(239,68,68,0.3)',
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          ✗ לא מגיע/ה
        </button>
      </div>
    </div>
  );
}
