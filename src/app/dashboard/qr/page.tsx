'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Copy, Download } from 'lucide-react';

export default function QrPage() {
  const { currentUser, guests } = useStore();
  const eventGuests = guests.filter((g) => g.eventId === currentUser?.eventId);
  const [selectedToken, setSelectedToken] = useState<string>(eventGuests[0]?.token || '');
  const [copied, setCopied] = useState(false);

  const baseUrl = typeof window !== 'undefined' ? window.location.origin : 'https://kala.app';
  const inviteUrl = selectedToken ? `${baseUrl}/invite/${selectedToken}` : '';
  const tableUrl = selectedToken ? `${baseUrl}/table/${selectedToken}` : '';
  const qrInviteUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(inviteUrl)}&bgcolor=0f0f0f&color=d4a843&margin=20`;
  const qrTableUrl = `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(tableUrl)}&bgcolor=0f0f0f&color=d4a843&margin=20`;

  const selectedGuest = eventGuests.find((g) => g.token === selectedToken);

  const copyToClipboard = async (text: string) => {
    await navigator.clipboard.writeText(text).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownloadQr = (url: string, filename: string) => {
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.target = '_blank';
    a.click();
  };

  const eventUrl = currentUser?.eventId ? `${baseUrl}/e/${currentUser.eventId}` : '';
  const [eventUrlCopied, setEventUrlCopied] = useState(false);

  const copyEventUrl = async () => {
    await navigator.clipboard.writeText(eventUrl).catch(() => {});
    setEventUrlCopied(true);
    setTimeout(() => setEventUrlCopied(false), 2000);
  };

  return (
    <div className="screen" style={{ padding: '24px 16px 100px' }}>
      <h1 className="section-title">QR ושיתוף</h1>

      {/* Public event URL */}
      {eventUrl && (
        <div className="card" style={{ marginBottom: '20px' }}>
          <div style={{ fontSize: '14px', fontWeight: '700', color: '#d4a843', marginBottom: '12px' }}>
            קישור ציבורי לאירוע
          </div>
          <div style={{ fontSize: '12px', color: '#888', marginBottom: '12px' }}>
            שתפו קישור זה בכל מקום - מתאים לסטורי, הודעה קבוצתית ועוד
          </div>
          <div
            style={{
              background: '#0f0f0f',
              borderRadius: '10px',
              padding: '10px 14px',
              fontSize: '12px',
              color: '#888',
              wordBreak: 'break-all',
              direction: 'ltr',
              textAlign: 'left',
              marginBottom: '12px',
            }}
          >
            {eventUrl}
          </div>
          <button
            onClick={copyEventUrl}
            style={{
              width: '100%',
              height: '44px',
              background: eventUrlCopied ? '#22c55e' : '#d4a843',
              borderRadius: '10px',
              color: '#0f0f0f',
              fontSize: '14px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
              border: 'none',
              cursor: 'pointer',
            }}
          >
            <Copy size={14} />
            {eventUrlCopied ? 'הועתק!' : 'העתק קישור אירוע'}
          </button>
        </div>
      )}

      {/* Guest selector */}
      <div style={{ marginBottom: '20px' }}>
        <label className="label">בחר מוזמן</label>
        <select
          value={selectedToken}
          onChange={(e) => setSelectedToken(e.target.value)}
          style={{
            width: '100%',
            height: '52px',
            background: '#1a1a1a',
            border: '1px solid #2a2a2a',
            borderRadius: '14px',
            padding: '0 16px',
            color: '#ffffff',
            fontSize: '16px',
            outline: 'none',
            direction: 'rtl',
          }}
        >
          {eventGuests.map((g) => (
            <option key={g.token} value={g.token}>
              {g.name} — {g.phone}
            </option>
          ))}
        </select>
      </div>

      {selectedGuest && (
        <>
          {/* Invite QR */}
          <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#d4a843', marginBottom: '16px' }}>
              QR להזמנה — {selectedGuest.name}
            </div>
            {inviteUrl && (
              <img
                src={qrInviteUrl}
                alt="QR הזמנה"
                style={{ width: '200px', height: '200px', borderRadius: '12px', margin: '0 auto', display: 'block' }}
              />
            )}
            <div
              style={{
                marginTop: '16px',
                background: '#0f0f0f',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '11px',
                color: '#888',
                wordBreak: 'break-all',
                direction: 'ltr',
                textAlign: 'left',
              }}
            >
              {inviteUrl}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={() => copyToClipboard(inviteUrl)}
                style={{
                  flex: 1,
                  height: '44px',
                  background: '#2a2a2a',
                  borderRadius: '10px',
                  color: copied ? '#22c55e' : '#d4a843',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Copy size={14} />
                {copied ? 'הועתק!' : 'העתק קישור'}
              </button>
              <button
                onClick={() => handleDownloadQr(qrInviteUrl, `invite-qr-${selectedGuest.name}.png`)}
                style={{
                  flex: 1,
                  height: '44px',
                  background: '#2a2a2a',
                  borderRadius: '10px',
                  color: '#888',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} />
                הורד QR
              </button>
            </div>
          </div>

          {/* Table QR */}
          <div className="card" style={{ marginBottom: '16px', textAlign: 'center' }}>
            <div style={{ fontSize: '14px', fontWeight: '700', color: '#d4a843', marginBottom: '16px' }}>
              QR למציאת שולחן — {selectedGuest.name}
            </div>
            {tableUrl && (
              <img
                src={qrTableUrl}
                alt="QR שולחן"
                style={{ width: '200px', height: '200px', borderRadius: '12px', margin: '0 auto', display: 'block' }}
              />
            )}
            <div
              style={{
                marginTop: '16px',
                background: '#0f0f0f',
                borderRadius: '10px',
                padding: '10px 14px',
                fontSize: '11px',
                color: '#888',
                wordBreak: 'break-all',
                direction: 'ltr',
                textAlign: 'left',
              }}
            >
              {tableUrl}
            </div>
            <div style={{ display: 'flex', gap: '10px', marginTop: '12px' }}>
              <button
                onClick={() => copyToClipboard(tableUrl)}
                style={{
                  flex: 1,
                  height: '44px',
                  background: '#2a2a2a',
                  borderRadius: '10px',
                  color: '#d4a843',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Copy size={14} />
                העתק קישור
              </button>
              <button
                onClick={() => handleDownloadQr(qrTableUrl, `table-qr-${selectedGuest.name}.png`)}
                style={{
                  flex: 1,
                  height: '44px',
                  background: '#2a2a2a',
                  borderRadius: '10px',
                  color: '#888',
                  fontSize: '13px',
                  fontWeight: '600',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                }}
              >
                <Download size={14} />
                הורד QR
              </button>
            </div>
          </div>

          {/* WhatsApp share */}
          <a
            href={`https://wa.me/${selectedGuest.phone.replace('+', '')}?text=${encodeURIComponent(`שלום ${selectedGuest.name}! הנה הקישור להזמנה שלך: ${inviteUrl}`)}`}
            target="_blank"
            rel="noopener noreferrer"
          >
            <button
              className="btn-primary"
              style={{ background: '#22c55e', color: '#fff', gap: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
            >
              💬 שלח הזמנה ב-WhatsApp
            </button>
          </a>
        </>
      )}

      {eventGuests.length === 0 && (
        <div style={{ textAlign: 'center', color: '#555', padding: '40px 0', fontSize: '14px' }}>
          אין מוזמנים עדיין. הוסף מוזמנים ראשית.
        </div>
      )}
    </div>
  );
}
