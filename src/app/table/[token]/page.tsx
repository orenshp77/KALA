'use client';

import { use, useEffect, useState } from 'react';
import { getGuestByToken } from '@/lib/supabaseData';
import { Guest, Event } from '@/types';
import { Navigation } from 'lucide-react';

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
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    }).format(new Date(dateStr));
  } catch {
    return dateStr;
  }
}

export default function TablePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);

  const [guest, setGuest] = useState<Guest | null>(null);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getGuestByToken(token).then((result) => {
      if (result) {
        setGuest(result.guest);
        setEvent(result.event);
      }
      setLoading(false);
    });
  }, [token]);

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
          קישור לא תקין
        </div>
      </div>
    );
  }

  const design = designs.find((d) => d.id === (event.selectedDesign || 1)) || designs[0];
  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(event.venueAddress)}`;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: design.bg,
        display: 'flex',
        flexDirection: 'column',
        direction: 'rtl',
        textAlign: 'center',
      }}
    >
      {/* Top section */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px 24px 24px' }}>
        <div style={{ fontSize: '14px', color: design.accent, letterSpacing: '3px', marginBottom: '24px' }}>
          חתונת
        </div>

        <div style={{ fontSize: '28px', fontWeight: '900', color: design.textColor, lineHeight: 1.2 }}>
          {event.coupleName1} & {event.coupleName2}
        </div>

        <div style={{ width: '60px', height: '1px', background: design.divider, margin: '20px auto' }} />

        <div style={{ fontSize: '16px', color: design.accent, marginBottom: '6px' }}>
          {formatHebrewDate(event.date)}
        </div>
        <div style={{ fontSize: '14px', color: design.textColor, opacity: 0.7 }}>
          {event.venueName}
        </div>

        {/* Welcome message */}
        <div style={{ marginTop: '32px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '20px', backdropFilter: 'blur(10px)' }}>
          <div style={{ fontSize: '16px', color: design.accent, marginBottom: '4px' }}>
            {guest.name} — נשמח לראותך! 🎊
          </div>
        </div>

        {/* Table number - LARGE */}
        {guest.tableNumber ? (
          <div style={{ marginTop: '40px', textAlign: 'center' }}>
            <div style={{ fontSize: '15px', color: design.accent, marginBottom: '12px', letterSpacing: '2px' }}>
              שולחן מספר
            </div>
            <div
              style={{
                fontSize: '100px',
                fontWeight: '900',
                color: design.textColor,
                lineHeight: 1,
                textShadow: `0 0 60px ${design.accent}44`,
              }}
            >
              {guest.tableNumber}
            </div>
          </div>
        ) : (
          <div style={{ marginTop: '40px', padding: '20px', background: 'rgba(0,0,0,0.2)', borderRadius: '16px' }}>
            <div style={{ fontSize: '15px', color: design.accent }}>
              מספר השולחן יתעדכן בקרוב
            </div>
          </div>
        )}
      </div>

      {/* Waze button */}
      <div style={{ padding: '16px 24px 48px' }}>
        <a href={wazeUrl} target="_blank" rel="noopener noreferrer" style={{ display: 'block' }}>
          <button
            style={{
              width: '100%',
              height: '56px',
              background: '#d4a843',
              color: '#000',
              fontSize: '18px',
              fontWeight: '800',
              borderRadius: '16px',
              border: 'none',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
            }}
          >
            <Navigation size={22} />
            נווט למקום
          </button>
        </a>
        <div style={{ fontSize: '13px', color: design.accent, opacity: 0.6, marginTop: '12px' }}>
          {event.venueAddress}
        </div>
      </div>
    </div>
  );
}
