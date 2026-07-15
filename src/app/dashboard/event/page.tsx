'use client';

import { useState, useEffect } from 'react';
import { useStore } from '@/store/useStore';
import { MapPin, Navigation } from 'lucide-react';
import toast from 'react-hot-toast';

export default function EventPage() {
  const { currentEvent, updateEvent } = useStore();
  const event = currentEvent;

  const [coupleName1, setCoupleName1] = useState('');
  const [coupleName2, setCoupleName2] = useState('');
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (event) {
      setCoupleName1(event.coupleName1 || '');
      setCoupleName2(event.coupleName2 || '');
      setDate(event.date ? event.date.slice(0, 16) : '');
      setVenueName(event.venueName || '');
      setVenueAddress(event.venueAddress || '');
    }
  }, [event?.id]);

  const handleSave = async () => {
    if (!event) {
      toast.error('שגיאה: לא נמצא אירוע');
      return;
    }
    await updateEvent(event.id, {
      coupleName1,
      coupleName2,
      date: date ? new Date(date).toISOString() : '',
      venueName,
      venueAddress,
    });
    setSaved(true);
    toast.success('הפרטים נשמרו בהצלחה ✓');
    setTimeout(() => setSaved(false), 2000);
  };

  const wazeUrl = `https://waze.com/ul?q=${encodeURIComponent(venueAddress)}&navigate=yes`;

  return (
    <div className="screen" style={{ padding: '24px 16px 100px' }}>
      <h1 className="section-title">פרטי האירוע</h1>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
        {/* Couple names */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#d4a843', marginBottom: '16px' }}>שמות בני הזוג</div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="label">שם ראשון</label>
              <input
                className="input-field"
                placeholder="למשל: יעל"
                value={coupleName1}
                onChange={(e) => setCoupleName1(e.target.value)}
              />
            </div>
            <div>
              <label className="label">שם שני</label>
              <input
                className="input-field"
                placeholder="למשל: דניאל"
                value={coupleName2}
                onChange={(e) => setCoupleName2(e.target.value)}
              />
            </div>
          </div>
        </div>

        {/* Date */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#d4a843', marginBottom: '16px' }}>תאריך האירוע</div>
          <label className="label">תאריך ושעה</label>
          <input
            className="input-field"
            type="datetime-local"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            style={{ direction: 'ltr', textAlign: 'left' }}
          />
        </div>

        {/* Venue */}
        <div className="card">
          <div style={{ fontSize: '14px', fontWeight: '600', color: '#d4a843', marginBottom: '16px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <MapPin size={16} />
              פרטי המקום
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div>
              <label className="label">שם האולם</label>
              <input
                className="input-field"
                placeholder="שם המקום"
                value={venueName}
                onChange={(e) => setVenueName(e.target.value)}
              />
            </div>
            <div>
              <label className="label">כתובת</label>
              <input
                className="input-field"
                placeholder="רחוב, עיר"
                value={venueAddress}
                onChange={(e) => setVenueAddress(e.target.value)}
              />
            </div>

            {venueAddress && (
              <a href={wazeUrl} target="_blank" rel="noopener noreferrer">
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: '44px',
                    background: '#1a4d1a',
                    borderRadius: '12px',
                    color: '#4ade80',
                    fontSize: '14px',
                    fontWeight: '600',
                    border: '1px solid #22c55e33',
                  }}
                >
                  <Navigation size={16} />
                  פתח ב-Waze
                </div>
              </a>
            )}
          </div>
        </div>
      </div>

      {/* Save button */}
      <button
        className="btn-primary"
        onClick={handleSave}
        style={{ marginTop: '24px', background: saved ? '#22c55e' : '#d4a843', transition: 'background 0.3s' }}
      >
        {saved ? '✓ נשמר!' : 'שמור פרטים'}
      </button>
    </div>
  );
}
