'use client';

import { useState, use, useEffect } from 'react';
import { getPublicEvent } from '@/lib/supabaseData';
import { Event } from '@/types';

const designs = [
  { id: 1, bg: '#1a1a1a', accent: '#d4a843', text: '#ffffff', gradient: 'linear-gradient(160deg, #1a1200 0%, #2d2000 100%)', divider: '#d4a84366' },
  { id: 2, bg: '#faf8f5', accent: '#2c2c2c', text: '#1a1a1a', gradient: 'linear-gradient(160deg, #faf8f5 0%, #f0ece6 100%)', divider: '#2c2c2c33' },
  { id: 3, bg: '#fff0f5', accent: '#d4768c', text: '#4a1a2a', gradient: 'linear-gradient(160deg, #2d1520 0%, #4a1a30 100%)', divider: '#d4768c44' },
  { id: 4, bg: '#0c1b3a', accent: '#c9a84c', text: '#ffffff', gradient: 'linear-gradient(160deg, #0a1628 0%, #0d2447 100%)', divider: '#c9a84c44' },
  { id: 5, bg: '#f0f5ef', accent: '#6b8c6b', text: '#1a2d1a', gradient: 'linear-gradient(160deg, #1a2d1a 0%, #2d4a2d 100%)', divider: '#6b8c6b44' },
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

export default function PublicEventPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicEvent(id).then((result) => {
      setEvent(result);
      setLoading(false);
    });
  }, [id]);

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
        <div style={{ color: '#d4a843', fontSize: '16px' }}>...</div>
      </div>
    );
  }

  if (!event) {
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
          אירוע לא נמצא
        </div>
      </div>
    );
  }

  const wazeUrl = event.venueAddress
    ? `https://waze.com/ul?q=${encodeURIComponent(event.venueAddress)}`
    : null;

  return (
    <div
      style={{
        minHeight: '100vh',
        background: design.gradient,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        direction: 'rtl',
        overflow: 'hidden',
      }}
    >
      {/* Top decorative element */}
      <div
        style={{
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: `radial-gradient(circle, ${design.accent}15, transparent)`,
          position: 'absolute',
          top: '-60px',
          left: '50%',
          transform: 'translateX(-50%)',
          pointerEvents: 'none',
        }}
      />

      {/* Content */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px 24px 24px',
          textAlign: 'center',
          maxWidth: '420px',
          width: '100%',
          position: 'relative',
          zIndex: 1,
        }}
      >
        {/* Small label */}
        <div
          style={{
            fontSize: '12px',
            color: design.accent,
            letterSpacing: '6px',
            marginBottom: '32px',
            opacity: 0.8,
          }}
        >
          save the date
        </div>

        {/* Couple names */}
        <div
          style={{
            fontSize: '42px',
            fontWeight: '900',
            color: design.text,
            lineHeight: 1.2,
            marginBottom: '4px',
          }}
        >
          {event.coupleName1 || '---'}
        </div>
        <div
          style={{
            fontSize: '28px',
            color: design.accent,
            margin: '8px 0',
            fontWeight: '300',
          }}
        >
          &
        </div>
        <div
          style={{
            fontSize: '42px',
            fontWeight: '900',
            color: design.text,
            lineHeight: 1.2,
          }}
        >
          {event.coupleName2 || '---'}
        </div>

        {/* Divider */}
        <div
          style={{
            width: '80px',
            height: '1px',
            background: design.divider,
            margin: '32px auto',
          }}
        />

        {/* Date */}
        {event.date && (
          <div
            style={{
              fontSize: '17px',
              color: design.accent,
              marginBottom: '24px',
              fontWeight: '600',
            }}
          >
            {formatHebrewDate(event.date)}
          </div>
        )}

        {/* Venue */}
        {event.venueName && (
          <div style={{ marginBottom: '8px' }}>
            <div
              style={{
                fontSize: '18px',
                fontWeight: '700',
                color: design.text,
                opacity: 0.9,
              }}
            >
              {event.venueName}
            </div>
          </div>
        )}
        {event.venueAddress && (
          <div
            style={{
              fontSize: '14px',
              color: design.accent,
              opacity: 0.7,
              marginBottom: '32px',
              lineHeight: 1.5,
            }}
          >
            {event.venueAddress}
          </div>
        )}

        {/* Greeting */}
        <div
          style={{
            fontSize: '20px',
            fontWeight: '700',
            color: design.text,
            opacity: 0.6,
            marginBottom: '40px',
          }}
        >
          !נשמח לראותכם
        </div>

        {/* Waze button */}
        {wazeUrl && (
          <a
            href={wazeUrl}
            target="_blank"
            rel="noopener noreferrer"
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '10px',
              width: '100%',
              maxWidth: '300px',
              height: '56px',
              background: design.accent,
              color: design.id === 2 ? '#ffffff' : '#0f0f0f',
              fontSize: '17px',
              fontWeight: '800',
              borderRadius: '16px',
              textDecoration: 'none',
              cursor: 'pointer',
            }}
          >
            <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2C7.589 2 4 5.589 4 9.995c0 2.726 1.297 5.149 3.308 6.695L12 22l4.692-5.31C18.703 15.144 20 12.72 20 9.995 20 5.589 16.411 2 12 2zm0 11a3 3 0 110-6 3 3 0 010 6z" />
            </svg>
            נווט עם Waze
          </a>
        )}
      </div>

      {/* Bottom decorative */}
      <div
        style={{
          width: '100%',
          height: '80px',
          background: `linear-gradient(transparent, ${design.accent}10)`,
          pointerEvents: 'none',
        }}
      />
    </div>
  );
}
