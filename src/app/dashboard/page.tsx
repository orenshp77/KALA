'use client';

import { useStore } from '@/store/useStore';
import Link from 'next/link';
import { Calendar, MapPin, Users, ChevronLeft, Copy, Link2 } from 'lucide-react';
import { useState } from 'react';

function formatHebrewDate(dateStr: string) {
  if (!dateStr) return 'תאריך לא נקבע';
  try {
    const d = new Date(dateStr);
    return new Intl.DateTimeFormat('he-IL', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }).format(d);
  } catch {
    return dateStr;
  }
}

export default function DashboardPage() {
  const { currentUser, currentEvent, guests } = useStore();
  const event = currentEvent;
  const eventGuests = guests.filter((g) => g.eventId === currentUser?.eventId);

  const [eventUrlCopied, setEventUrlCopied] = useState(false);
  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kala.app';
  const eventUrl = currentUser?.eventId ? `${baseUrl}/e/${currentUser.eventId}` : '';

  const copyEventUrl = async () => {
    await navigator.clipboard.writeText(eventUrl).catch(() => {});
    setEventUrlCopied(true);
    setTimeout(() => setEventUrlCopied(false), 2000);
  };

  const confirmed = eventGuests.filter((g) => g.status === 'confirmed');
  const pending = eventGuests.filter((g) => g.status === 'pending');
  const declined = eventGuests.filter((g) => g.status === 'declined');
  const confirmedCount = confirmed.reduce((sum, g) => sum + g.guestsCount, 0);
  const totalCount = eventGuests.reduce((sum, g) => sum + g.guestsCount, 0);

  return (
    <div className="screen" style={{ padding: '24px 16px 16px' }}>
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>ברוכים הבאים 👋</div>
        <h1 style={{ fontSize: '26px', fontWeight: '800' }}>
          {event?.coupleName1 && event?.coupleName2
            ? `${event.coupleName1} & ${event.coupleName2}`
            : 'האירוע שלנו'}
        </h1>
        {event?.date && (
          <div style={{ fontSize: '14px', color: '#d4a843', marginTop: '4px' }}>
            {formatHebrewDate(event.date)}
          </div>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '10px', marginBottom: '24px' }}>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#22c55e' }}>{confirmed.length}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>אישרו</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#6b7280' }}>{pending.length}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>ממתינים</div>
        </div>
        <div className="card" style={{ textAlign: 'center', padding: '14px 8px' }}>
          <div style={{ fontSize: '28px', fontWeight: '800', color: '#ef4444' }}>{declined.length}</div>
          <div style={{ fontSize: '11px', color: '#888', marginTop: '2px' }}>ביטלו</div>
        </div>
      </div>

      {/* Confirmed guests count */}
      <div className="card" style={{ marginBottom: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <div style={{ fontSize: '13px', color: '#888' }}>סה"כ אורחים מאושרים</div>
            <div style={{ fontSize: '32px', fontWeight: '800', color: '#d4a843' }}>{confirmedCount}</div>
            <div style={{ fontSize: '12px', color: '#555' }}>מתוך {totalCount} מוזמנים</div>
          </div>
          <Users size={40} color="#d4a843" style={{ opacity: 0.3 }} />
        </div>
        {totalCount > 0 && (
          <div style={{ marginTop: '12px', background: '#2a2a2a', borderRadius: '8px', height: '8px', overflow: 'hidden' }}>
            <div
              style={{
                width: `${Math.round((confirmedCount / totalCount) * 100)}%`,
                height: '100%',
                background: '#d4a843',
                borderRadius: '8px',
                transition: 'width 0.5s ease',
              }}
            />
          </div>
        )}
      </div>

      {/* Event public URL */}
      {eventUrl && (
        <div className="card" style={{ marginBottom: '24px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '10px' }}>
            <Link2 size={16} color="#d4a843" />
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#d4a843' }}>קישור ציבורי לאירוע</div>
          </div>
          <div
            style={{
              background: '#0f0f0f',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '11px',
              color: '#888',
              wordBreak: 'break-all',
              direction: 'ltr',
              textAlign: 'left',
              marginBottom: '10px',
            }}
          >
            {eventUrl}
          </div>
          <button
            onClick={copyEventUrl}
            style={{
              width: '100%',
              height: '40px',
              background: eventUrlCopied ? '#22c55e' : '#2a2a2a',
              borderRadius: '10px',
              color: eventUrlCopied ? '#fff' : '#d4a843',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Copy size={14} />
            {eventUrlCopied ? 'הועתק!' : 'העתק קישור'}
          </button>
        </div>
      )}

      {/* Quick links */}
      <div style={{ fontSize: '15px', fontWeight: '600', color: '#888', marginBottom: '12px' }}>פעולות מהירות</div>
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        <Link href="/dashboard/event">
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#2a2a2a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Calendar size={20} color="#d4a843" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>פרטי האירוע</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {event?.venueName || 'עדכן פרטי אירוע'}
                </div>
              </div>
            </div>
            <ChevronLeft size={18} color="#555" />
          </div>
        </Link>

        <Link href="/dashboard/design">
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#2a2a2a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <span style={{ fontSize: '20px' }}>🎨</span>
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>עיצוב הזמנה</div>
                <div style={{ fontSize: '12px', color: '#888' }}>
                  {event?.selectedDesign ? `עיצוב ${event.selectedDesign} נבחר` : 'בחר עיצוב'}
                </div>
              </div>
            </div>
            <ChevronLeft size={18} color="#555" />
          </div>
        </Link>

        <Link href="/dashboard/rsvp">
          <div className="card" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', cursor: 'pointer' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <div style={{ width: '40px', height: '40px', background: '#2a2a2a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <MapPin size={20} color="#d4a843" />
              </div>
              <div>
                <div style={{ fontSize: '15px', fontWeight: '600' }}>סבבי אישורים</div>
                <div style={{ fontSize: '12px', color: '#888' }}>{pending.length} ממתינים לתגובה</div>
              </div>
            </div>
            <ChevronLeft size={18} color="#555" />
          </div>
        </Link>
      </div>
    </div>
  );
}
