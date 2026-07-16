'use client';

import { useState, useRef } from 'react';
import { useStore } from '@/store/useStore';
import { Guest } from '@/types';
import { Plus, Trash2, ChevronDown, ChevronUp, X, Upload, Users, UserPlus } from 'lucide-react';
import toast from 'react-hot-toast';

function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  return `+972${digits}`;
}

function statusColor(status: Guest['status']) {
  if (status === 'confirmed') return '#22c55e';
  if (status === 'declined') return '#ef4444';
  return '#6b7280';
}

function statusLabel(status: Guest['status']) {
  if (status === 'confirmed') return 'אישר';
  if (status === 'declined') return 'ביטל';
  return 'ממתין';
}

export default function GuestsPage() {
  const { currentUser, guests, addGuest, updateGuest, deleteGuest } = useStore();
  const eventGuests = guests.filter((g) => g.eventId === currentUser?.eventId);

  const [showAdd, setShowAdd] = useState(false);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [guestsCount, setGuestsCount] = useState(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [addingGuest, setAddingGuest] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const filtered = eventGuests.filter(
    (g) =>
      g.name.includes(searchQuery) ||
      g.phone.includes(searchQuery)
  );

  const handleAddGuest = async () => {
    if (!name.trim() || !phone.trim()) return;
    setAddingGuest(true);
    await addGuest({
      eventId: currentUser!.eventId,
      name: name.trim(),
      phone: cleanPhone(phone),
      guestsCount,
    });
    setName('');
    setPhone('');
    setGuestsCount(1);
    setShowAdd(false);
    setAddingGuest(false);
  };

  const [importing, setImporting] = useState(false);

  const hasContactPicker = () => {
    try { return 'contacts' in navigator && 'ContactsManager' in window; } catch { return false; }
  };

  const isIOS = () => {
    if (typeof navigator === 'undefined') return false;
    return /iPad|iPhone|iPod/.test(navigator.userAgent);
  };

  const [showIOSGuide, setShowIOSGuide] = useState(false);

  const handleSelectContacts = async () => {
    if (!hasContactPicker()) {
      if (isIOS()) {
        setShowIOSGuide(true);
      } else {
        fileRef.current?.click();
      }
      return;
    }
    try {
      setImporting(true);
      const contacts = await (navigator as unknown as { contacts: { select: (fields: string[], opts: object) => Promise<Array<{ name: string[]; tel: string[] }>> } }).contacts.select(['name', 'tel'], { multiple: true });
      let added = 0;
      for (const c of contacts) {
        if (c.name?.[0] && c.tel?.[0]) {
          const phone = cleanPhone(c.tel[0]);
          const exists = guests.some((g) => g.phone === phone && g.eventId === currentUser?.eventId);
          if (!exists) {
            await addGuest({ eventId: currentUser!.eventId, name: c.name[0], phone, guestsCount: 1 });
            added++;
          }
        }
      }
      toast.success(`${added} אנשי קשר נוספו`);
    } catch {
      // user cancelled
    }
    setImporting(false);
  };

  const handleUploadFile = () => {
    fileRef.current?.click();
  };

  const handleFileImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async (ev) => {
      const text = ev.target?.result as string;
      if (file.name.endsWith('.vcf')) {
        const blocks = text.split('BEGIN:VCARD');
        for (const block of blocks) {
          const nameMatch = block.match(/FN:(.*)/);
          const telMatch = block.match(/TEL[^:]*:([\d\s\-\+]+)/);
          if (nameMatch && telMatch) {
            await addGuest({
              eventId: currentUser!.eventId,
              name: nameMatch[1].trim(),
              phone: cleanPhone(telMatch[1].trim()),
              guestsCount: 1,
            });
          }
        }
      } else if (file.name.endsWith('.csv')) {
        const lines = text.split('\n').slice(1);
        for (const line of lines) {
          const parts = line.split(',');
          if (parts[0] && parts[1]) {
            await addGuest({
              eventId: currentUser!.eventId,
              name: parts[0].trim().replace(/"/g, ''),
              phone: cleanPhone(parts[1].trim().replace(/"/g, '')),
              guestsCount: 1,
            });
          }
        }
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const confirmed = eventGuests.filter((g) => g.status === 'confirmed').length;
  const total = eventGuests.length;

  return (
    <div className="screen" style={{ padding: '24px 16px 100px' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <h1 className="section-title" style={{ marginBottom: 0 }}>מוזמנים</h1>
        <div style={{ fontSize: '13px', color: '#888' }}>{confirmed}/{total} אישרו</div>
      </div>

      {/* Search */}
      <input
        className="input-field"
        placeholder="חיפוש לפי שם או טלפון..."
        value={searchQuery}
        onChange={(e) => setSearchQuery(e.target.value)}
        style={{ marginBottom: '16px' }}
      />

      {/* Import buttons */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '16px' }}>
        <button
          onClick={handleSelectContacts}
          disabled={importing}
          style={{
            height: '52px',
            background: '#d4a843',
            borderRadius: '14px',
            color: '#000',
            fontSize: '15px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
            opacity: importing ? 0.7 : 1,
          }}
        >
          {isIOS() ? <Upload size={18} /> : <Users size={18} />}
          {importing ? 'מייבא...' : isIOS() ? 'העלה אנשי קשר מהטלפון' : 'בחר אנשי קשר מהטלפון'}
        </button>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button
            onClick={handleUploadFile}
            style={{
              height: '44px',
              background: '#1a1a1a',
              border: '1px solid #2a2a2a',
              borderRadius: '12px',
              color: '#888',
              fontSize: '13px',
              fontWeight: '600',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <Upload size={14} />
            העלה קובץ
          </button>
          <button
            onClick={() => setShowAdd(true)}
            style={{
              height: '44px',
              background: '#1a1a1a',
              border: '1px solid #d4a843',
              borderRadius: '12px',
              color: '#d4a843',
              fontSize: '13px',
              fontWeight: '700',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '6px',
            }}
          >
            <UserPlus size={14} />
            הוסף ידנית
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".vcf,.csv,text/vcard,text/x-vcard" onChange={handleFileImport} style={{ display: 'none' }} />

      {/* iOS Guide Modal */}
      {showIOSGuide && (
        <div onClick={() => setShowIOSGuide(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 999, padding: '20px' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1a1a1a', borderRadius: '20px', padding: '24px', width: '100%', border: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#d4a843' }}>ייבוא אנשי קשר מאייפון</div>
              <button onClick={() => setShowIOSGuide(false)} style={{ width: '32px', height: '32px', background: '#2a2a2a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <X size={14} color="#888" />
              </button>
            </div>
            <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.8', marginBottom: '20px' }}>
              <div style={{ marginBottom: '8px', fontWeight: '600' }}>איך מייצאים אנשי קשר?</div>
              <div>1. פתחו את אפליקציית <strong>אנשי קשר</strong> באייפון</div>
              <div>2. לחצו על <strong>רשימות</strong> למעלה</div>
              <div>3. לחצו על <strong>כל אנשי הקשר</strong></div>
              <div>4. לחצו על <strong>⋯</strong> (שלוש נקודות) למעלה</div>
              <div>5. בחרו <strong>ייצוא</strong></div>
              <div>6. שמרו את הקובץ ב<strong>קבצים</strong></div>
              <div style={{ marginTop: '8px' }}>אחר כך לחצו על הכפתור למטה ובחרו את הקובץ.</div>
            </div>
            <button
              className="btn-primary"
              onClick={() => { setShowIOSGuide(false); fileRef.current?.click(); }}
              style={{ background: '#d4a843' }}
            >
              בחר קובץ אנשי קשר
            </button>
          </div>
        </div>
      )}

      {/* Add form */}
      {showAdd && (
        <div className="card" style={{ marginBottom: '16px', border: '1px solid #d4a843' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <div style={{ fontSize: '15px', fontWeight: '700', color: '#d4a843' }}>הוספת מוזמן</div>
            <button onClick={() => setShowAdd(false)}>
              <X size={20} color="#888" />
            </button>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <input
              className="input-field"
              placeholder="שם מלא"
              value={name}
              onChange={(e) => setName(e.target.value)}
            />
            <input
              className="input-field"
              placeholder="מספר טלפון"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              type="tel"
              inputMode="tel"
              dir="ltr"
              style={{ textAlign: 'left' }}
            />
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '14px', color: '#888' }}>מספר אורחים:</span>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <button
                  onClick={() => setGuestsCount(Math.max(1, guestsCount - 1))}
                  style={{ width: '36px', height: '36px', background: '#2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  −
                </button>
                <span style={{ fontSize: '18px', fontWeight: '700', minWidth: '24px', textAlign: 'center' }}>{guestsCount}</span>
                <button
                  onClick={() => setGuestsCount(Math.min(10, guestsCount + 1))}
                  style={{ width: '36px', height: '36px', background: '#2a2a2a', borderRadius: '8px', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                >
                  +
                </button>
              </div>
            </div>
            <button
              className="btn-primary"
              onClick={handleAddGuest}
              disabled={addingGuest}
              style={{ marginTop: '4px', opacity: addingGuest ? 0.7 : 1 }}
            >
              {addingGuest ? '...' : 'הוסף מוזמן'}
            </button>
          </div>
        </div>
      )}

      {/* Guest list */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
        {filtered.length === 0 && (
          <div style={{ textAlign: 'center', color: '#555', padding: '40px 0', fontSize: '14px' }}>
            {searchQuery ? 'לא נמצאו תוצאות' : 'עוד אין מוזמנים. הוסף את הראשון!'}
          </div>
        )}
        {filtered.map((guest) => {
          const isExpanded = expandedId === guest.id;
          const color = statusColor(guest.status);
          return (
            <div key={guest.id} className="card" style={{ padding: '0', overflow: 'hidden' }}>
              <div
                style={{ padding: '14px 16px', display: 'flex', alignItems: 'center', gap: '12px', cursor: 'pointer' }}
                onClick={() => setExpandedId(isExpanded ? null : guest.id)}
              >
                {/* Status dot */}
                <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: color, flexShrink: 0 }} />

                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: '15px', fontWeight: '600' }}>{guest.name}</div>
                  <div style={{ fontSize: '13px', color: '#888', marginTop: '2px', direction: 'ltr', textAlign: 'right' }}>
                    {guest.phone}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '2px' }}>
                  <span style={{ fontSize: '12px', color, fontWeight: '600' }}>{statusLabel(guest.status)}</span>
                  <span style={{ fontSize: '11px', color: '#666' }}>{guest.guestsCount} 👤</span>
                </div>

                {isExpanded ? <ChevronUp size={16} color="#555" /> : <ChevronDown size={16} color="#555" />}
              </div>

              {isExpanded && (
                <div style={{ padding: '0 16px 14px', borderTop: '1px solid #2a2a2a' }}>
                  <div style={{ paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    {/* Status */}
                    <div style={{ fontSize: '13px', color: '#888' }}>סטטוס: <span style={{ color }}>{statusLabel(guest.status)}</span></div>

                    {guest.tableNumber && (
                      <div style={{ fontSize: '13px', color: '#888' }}>שולחן: <span style={{ color: '#d4a843', fontWeight: '700' }}>{guest.tableNumber}</span></div>
                    )}

                    {/* Change status */}
                    <div style={{ display: 'flex', gap: '8px' }}>
                      {(['confirmed', 'pending', 'declined'] as const).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateGuest(guest.id, { status: s })}
                          style={{
                            flex: 1,
                            height: '36px',
                            borderRadius: '8px',
                            fontSize: '12px',
                            fontWeight: '600',
                            background: guest.status === s ? statusColor(s) : '#2a2a2a',
                            color: guest.status === s ? '#fff' : '#888',
                            border: 'none',
                          }}
                        >
                          {statusLabel(s)}
                        </button>
                      ))}
                    </div>

                    {/* WhatsApp */}
                    <a
                      href={`https://wa.me/${guest.phone.replace('+', '')}?text=${encodeURIComponent(`שלום ${guest.name}, זוהי הזמנה לאירוע שלנו!`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <div style={{
                        height: '40px',
                        background: '#1a3a1a',
                        borderRadius: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        gap: '8px',
                        color: '#22c55e',
                        fontSize: '13px',
                        fontWeight: '600',
                        border: '1px solid #22c55e33',
                      }}>
                        💬 שלח WhatsApp
                      </div>
                    </a>

                    {/* Delete */}
                    {confirmDelete === guest.id ? (
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={async () => { await deleteGuest(guest.id); setExpandedId(null); setConfirmDelete(null); }}
                          style={{ flex: 1, height: '40px', background: '#ef4444', borderRadius: '10px', color: '#fff', fontSize: '13px', fontWeight: '700' }}
                        >
                          מחק
                        </button>
                        <button
                          onClick={() => setConfirmDelete(null)}
                          style={{ flex: 1, height: '40px', background: '#2a2a2a', borderRadius: '10px', color: '#888', fontSize: '13px' }}
                        >
                          ביטול
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setConfirmDelete(guest.id)}
                        style={{
                          height: '40px',
                          background: 'transparent',
                          borderRadius: '10px',
                          color: '#ef4444',
                          fontSize: '13px',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          gap: '6px',
                          border: '1px solid #ef444433',
                        }}
                      >
                        <Trash2 size={14} />
                        הסר מוזמן
                      </button>
                    )}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
