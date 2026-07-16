'use client';

import { useState, useRef, useEffect, useCallback } from 'react';
import { useStore } from '@/store/useStore';
import { Guest } from '@/types';
import { Plus, Trash2, ChevronDown, ChevronUp, X, Upload, Users, UserPlus, ClipboardPaste, Smartphone, Check, Search, CheckSquare, Square, Loader2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { supabase } from '@/lib/supabase';

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

  const handleSelectContacts = async () => {
    if (!hasContactPicker()) {
      fileRef.current?.click();
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

  const [showPaste, setShowPaste] = useState(false);
  const [pasteText, setPasteText] = useState('');
  const [parsedContacts, setParsedContacts] = useState<{ name: string; phone: string }[]>([]);

  const parseContacts = (text: string) => {
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    const results: { name: string; phone: string }[] = [];

    for (const line of lines) {
      // Try common formats:
      // "שם 0501234567"  "שם, 0501234567"  "שם - 0501234567"  "0501234567 שם"
      // Tab separated (from Excel): "שם\t0501234567"

      // Split by tab, comma, dash, or multiple spaces
      const parts = line.split(/[\t,\-–—|]+/).map((p) => p.trim()).filter((p) => p);

      let name = '';
      let phone = '';

      for (const part of parts) {
        // Check if this part looks like a phone number (has 7+ digits)
        const digits = part.replace(/\D/g, '');
        if (digits.length >= 7) {
          phone = part;
        } else if (part.length >= 2 && !phone) {
          // It's probably a name
          name = name ? `${name} ${part}` : part;
        } else if (part.length >= 2) {
          name = name ? `${name} ${part}` : part;
        }
      }

      // If no split worked, try to find phone number anywhere in the line
      if (!phone) {
        const phoneMatch = line.match(/([\d\-\+\(\)\s]{7,})/);
        if (phoneMatch) {
          phone = phoneMatch[1].trim();
          name = line.replace(phoneMatch[0], '').replace(/[\t,\-–—|]/g, '').trim();
        }
      }

      if (name && phone) {
        const cleanedPhone = cleanPhone(phone);
        const exists = guests.some((g) => g.phone === cleanedPhone && g.eventId === currentUser?.eventId);
        if (!exists && !results.some((r) => cleanPhone(r.phone) === cleanedPhone)) {
          results.push({ name, phone });
        }
      }
    }
    return results;
  };

  const handlePasteChange = (text: string) => {
    setPasteText(text);
    if (text.trim()) {
      setParsedContacts(parseContacts(text));
    } else {
      setParsedContacts([]);
    }
  };

  const handlePasteImport = async () => {
    if (parsedContacts.length === 0) return;
    setImporting(true);
    let added = 0;
    for (const c of parsedContacts) {
      await addGuest({
        eventId: currentUser!.eventId,
        name: c.name,
        phone: cleanPhone(c.phone),
        guestsCount: 1,
      });
      added++;
    }
    toast.success(`${added} אנשי קשר נוספו`);
    setPasteText('');
    setParsedContacts([]);
    setShowPaste(false);
    setImporting(false);
  };

  // --- iOS Shortcut Import ---
  const [showIOSImport, setShowIOSImport] = useState(false);
  const [iosToken, setIosToken] = useState<string | null>(null);
  const [iosPolling, setIosPolling] = useState(false);
  const [iosContacts, setIosContacts] = useState<{ name: string; phone: string }[]>([]);
  const [iosSelected, setIosSelected] = useState<Set<number>>(new Set());
  const [iosSearch, setIosSearch] = useState('');
  const [iosImporting, setIosImporting] = useState(false);
  const pollRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const pollStartRef = useRef<number>(0);

  const SHORTCUT_INSTALL_URL = 'https://www.icloud.com/shortcuts/6bd76b839b104307821710661c745aa9';

  const startIOSImport = useCallback(async () => {
    const token = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 18) + Date.now().toString(36);

    const { error } = await supabase.from('import_sessions').insert({
      id: token,
      token,
      event_id: currentUser?.eventId || '',
      contacts: '[]',
      status: 'waiting',
    });

    if (error) {
      toast.error('שגיאה ביצירת הפגישה');
      return;
    }

    setIosToken(token);
    setIosContacts([]);
    setIosSelected(new Set());
    setIosSearch('');
    setShowIOSImport(true);
    setIosPolling(true);
    pollStartRef.current = Date.now();

    // Try to open the shortcut directly with the token as input
    const shortcutName = encodeURIComponent('קבלת תוכן של כתובת אינטרנט');
    window.location.href = `shortcuts://run-shortcut?name=${shortcutName}&input=text&text=${token}`;
  }, [currentUser?.eventId]);

  // Polling effect
  useEffect(() => {
    if (!iosPolling || !iosToken) return;

    const poll = async () => {
      // Stop after 5 minutes
      if (Date.now() - pollStartRef.current > 5 * 60 * 1000) {
        setIosPolling(false);
        if (pollRef.current) clearInterval(pollRef.current);
        return;
      }

      try {
        const res = await fetch(`/api/import-contacts?token=${iosToken}`);
        const data = await res.json();
        if (data.status === 'ready' && Array.isArray(data.contacts)) {
          setIosContacts(data.contacts);
          // Select all by default
          setIosSelected(new Set(data.contacts.map((_: unknown, i: number) => i)));
          setIosPolling(false);
          if (pollRef.current) clearInterval(pollRef.current);
        }
      } catch {
        // ignore network errors, keep polling
      }
    };

    pollRef.current = setInterval(poll, 3000);
    // Also poll immediately
    poll();

    return () => {
      if (pollRef.current) clearInterval(pollRef.current);
    };
  }, [iosPolling, iosToken]);

  const closeIOSImport = () => {
    setShowIOSImport(false);
    setIosPolling(false);
    if (pollRef.current) clearInterval(pollRef.current);
    setIosToken(null);
    setIosContacts([]);
    setIosSelected(new Set());
    setIosSearch('');
  };

  const toggleIOSContact = (index: number) => {
    setIosSelected((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const selectAllIOS = () => {
    setIosSelected(new Set(iosContacts.map((_, i) => i)));
  };

  const clearAllIOS = () => {
    setIosSelected(new Set());
  };

  const filteredIOSContacts = iosContacts.filter((c) =>
    c.name?.toLowerCase().includes(iosSearch.toLowerCase()) ||
    c.phone?.includes(iosSearch)
  );

  const handleIOSImportSelected = async () => {
    if (iosSelected.size === 0) return;
    setIosImporting(true);
    let added = 0;
    for (const idx of Array.from(iosSelected)) {
      const c = iosContacts[idx];
      if (!c?.name || !c?.phone) continue;
      const phone = cleanPhone(c.phone);
      const exists = guests.some((g) => g.phone === phone && g.eventId === currentUser?.eventId);
      if (!exists) {
        await addGuest({
          eventId: currentUser!.eventId,
          name: c.name,
          phone,
          guestsCount: 1,
        });
        added++;
      }
    }
    toast.success(`${added} אנשי קשר נוספו`);
    setIosImporting(false);
    closeIOSImport();
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
          onClick={() => {
            if (isIOS() && !hasContactPicker()) {
              startIOSImport();
            } else {
              handleSelectContacts();
            }
          }}
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
          {isIOS() && !hasContactPicker() ? <Smartphone size={18} /> : <Users size={18} />}
          {importing ? 'מייבא...' : 'ייבוא אנשי קשר'}
        </button>
        <button
          onClick={() => setShowPaste(true)}
          style={{
            height: '52px',
            background: '#1a1a1a',
            border: '1px solid #d4a843',
            borderRadius: '14px',
            color: '#d4a843',
            fontSize: '15px',
            fontWeight: '700',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '8px',
          }}
        >
          <ClipboardPaste size={18} />
          הדבק רשימה
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
            <UserPlus size={14} />
            הוסף ידנית
          </button>
        </div>
      </div>
      <input ref={fileRef} type="file" accept=".vcf,.csv,text/vcard,text/x-vcard,text/directory" onChange={handleFileImport} style={{ display: 'none' }} />

      {/* Paste modal */}
      {showPaste && (
        <div onClick={() => setShowPaste(false)} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999, padding: '20px', paddingTop: '60px', overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1a1a1a', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '390px', border: '1px solid #2a2a2a' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
              <div style={{ fontSize: '16px', fontWeight: '700', color: '#d4a843' }}>הדבק רשימה</div>
              <button onClick={() => setShowPaste(false)} style={{ width: '32px', height: '32px', background: '#2a2a2a', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none' }}>
                <X size={14} color="#888" />
              </button>
            </div>

            <div style={{ fontSize: '13px', color: '#888', marginBottom: '12px', lineHeight: '1.6' }}>
              הדביקו רשימה מ-Excel, פתקים, וואטסאפ או כל מקור אחר.<br />
              <span style={{ color: '#d4a843' }}>פורמט: שם ומספר טלפון בכל שורה</span>
            </div>

            <div style={{ fontSize: '11px', color: '#555', marginBottom: '8px', background: '#111', padding: '10px', borderRadius: '10px', direction: 'rtl', lineHeight: '1.8' }}>
              <div>דוגמאות:</div>
              <div style={{ direction: 'ltr', textAlign: 'left', fontFamily: 'monospace', fontSize: '11px' }}>
                אורן כהן 0501234567<br />
                מיכל לוי, 052-9876543<br />
                דוד ישראלי    054-1112233
              </div>
            </div>

            <textarea
              value={pasteText}
              onChange={(e) => handlePasteChange(e.target.value)}
              placeholder="הדביקו כאן את הרשימה..."
              style={{
                width: '100%',
                minHeight: '150px',
                background: '#0f0f0f',
                border: '1px solid #2a2a2a',
                borderRadius: '12px',
                color: '#fff',
                fontSize: '14px',
                padding: '14px',
                fontFamily: 'inherit',
                resize: 'vertical',
                direction: 'rtl',
              }}
            />

            {/* Preview parsed contacts */}
            {parsedContacts.length > 0 && (
              <div style={{ marginTop: '12px' }}>
                <div style={{ fontSize: '13px', color: '#22c55e', fontWeight: '600', marginBottom: '8px' }}>
                  זוהו {parsedContacts.length} אנשי קשר:
                </div>
                <div style={{ maxHeight: '150px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px' }}>
                  {parsedContacts.map((c, i) => (
                    <div key={i} style={{ fontSize: '13px', color: '#ccc', display: 'flex', justifyContent: 'space-between', padding: '6px 10px', background: '#111', borderRadius: '8px' }}>
                      <span>{c.name}</span>
                      <span style={{ color: '#888', direction: 'ltr' }}>{c.phone}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {pasteText.trim() && parsedContacts.length === 0 && (
              <div style={{ marginTop: '12px', fontSize: '13px', color: '#ef4444' }}>
                לא זוהו אנשי קשר. ודאו שכל שורה מכילה שם ומספר טלפון.
              </div>
            )}

            <button
              className="btn-primary"
              onClick={handlePasteImport}
              disabled={parsedContacts.length === 0 || importing}
              style={{ marginTop: '16px', opacity: parsedContacts.length === 0 ? 0.5 : 1 }}
            >
              {importing ? 'מייבא...' : `ייבא ${parsedContacts.length} אנשי קשר`}
            </button>
          </div>
        </div>
      )}

      {/* iOS Shortcut Import Modal */}
      {showIOSImport && (
        <div onClick={closeIOSImport} style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'flex-start', justifyContent: 'center', zIndex: 999, padding: '20px', paddingTop: '40px', overflowY: 'auto' }}>
          <div onClick={(e) => e.stopPropagation()} style={{ background: '#1a1a1a', borderRadius: '20px', padding: '20px', width: '100%', maxWidth: '390px', border: '1px solid #2a2a2a' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ fontSize: '17px', fontWeight: '700', color: '#d4a843' }}>ייבוא אנשי קשר מהאייפון</div>
              <button onClick={closeIOSImport} style={{ width: '36px', height: '36px', background: '#2a2a2a', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', minHeight: '44px', minWidth: '44px' }}>
                <X size={16} color="#888" />
              </button>
            </div>

            {iosContacts.length === 0 ? (
              <div>
                <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                  <div style={{ fontSize: '14px', color: '#ccc', lineHeight: '1.6' }}>
                    הכלי נפתח אוטומטית.<br/>
                    אם לא נפתח — לחצו למטה להתקנה:
                  </div>
                </div>

                <a
                  href={SHORTCUT_INSTALL_URL}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    height: '52px',
                    minHeight: '44px',
                    background: '#d4a843',
                    borderRadius: '14px',
                    color: '#000',
                    fontSize: '15px',
                    fontWeight: '700',
                    textDecoration: 'none',
                    marginBottom: '16px',
                  }}
                >
                  <Smartphone size={18} />
                  התקן כלי ייבוא (פעם אחת)
                </a>

                <button
                  onClick={() => {
                    if (iosToken) {
                      const shortcutName = encodeURIComponent('קבלת תוכן של כתובת אינטרנט');
                      window.location.href = `shortcuts://run-shortcut?name=${shortcutName}&input=text&text=${iosToken}`;
                    }
                  }}
                  style={{
                    width: '100%',
                    height: '48px',
                    background: '#1a1a1a',
                    border: '1px solid #d4a843',
                    borderRadius: '14px',
                    color: '#d4a843',
                    fontSize: '14px',
                    fontWeight: '600',
                    marginBottom: '20px',
                  }}
                >
                  הפעל שוב
                </button>

                {/* Waiting animation */}
                <div style={{ textAlign: 'center', padding: '16px 0' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', color: '#888', fontSize: '14px' }}>
                    <Loader2 size={20} style={{ animation: 'spin 1s linear infinite' }} color="#d4a843" />
                    ממתין לאנשי קשר...
                  </div>
                  <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
                </div>
              </div>
            ) : (
              /* Contacts received - selection mode */
              <div>
                {/* Success header */}
                <div style={{ background: '#0a2a0a', borderRadius: '12px', padding: '14px', marginBottom: '16px', border: '1px solid #22c55e33', textAlign: 'center' }}>
                  <div style={{ fontSize: '16px', fontWeight: '700', color: '#22c55e' }}>
                    נמצאו {iosContacts.length} אנשי קשר!
                  </div>
                </div>

                {/* Search */}
                <div style={{ position: 'relative', marginBottom: '12px' }}>
                  <Search size={16} style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', color: '#666' }} />
                  <input
                    value={iosSearch}
                    onChange={(e) => setIosSearch(e.target.value)}
                    placeholder="חיפוש..."
                    style={{
                      width: '100%',
                      height: '44px',
                      background: '#0f0f0f',
                      border: '1px solid #2a2a2a',
                      borderRadius: '10px',
                      color: '#fff',
                      fontSize: '14px',
                      paddingRight: '36px',
                      paddingLeft: '12px',
                    }}
                  />
                </div>

                {/* Select all / clear all */}
                <div style={{ display: 'flex', gap: '8px', marginBottom: '12px' }}>
                  <button
                    onClick={selectAllIOS}
                    style={{
                      flex: 1,
                      height: '44px',
                      background: '#111',
                      border: '1px solid #2a2a2a',
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
                    <CheckSquare size={14} />
                    בחר הכל
                  </button>
                  <button
                    onClick={clearAllIOS}
                    style={{
                      flex: 1,
                      height: '44px',
                      background: '#111',
                      border: '1px solid #2a2a2a',
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
                    <Square size={14} />
                    נקה הכל
                  </button>
                </div>

                {/* Contacts list */}
                <div style={{ maxHeight: '300px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '4px', marginBottom: '16px' }}>
                  {filteredIOSContacts.map((c) => {
                    const realIndex = iosContacts.indexOf(c);
                    const selected = iosSelected.has(realIndex);
                    return (
                      <button
                        key={realIndex}
                        onClick={() => toggleIOSContact(realIndex)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          gap: '10px',
                          padding: '10px 12px',
                          minHeight: '44px',
                          background: selected ? '#1a2a1a' : '#111',
                          borderRadius: '10px',
                          border: selected ? '1px solid #22c55e33' : '1px solid transparent',
                          textAlign: 'right',
                          width: '100%',
                        }}
                      >
                        <div style={{ width: '20px', height: '20px', borderRadius: '4px', border: selected ? '2px solid #22c55e' : '2px solid #555', background: selected ? '#22c55e' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          {selected && <Check size={12} color="#fff" />}
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: '14px', color: '#fff', fontWeight: '500' }}>{c.name}</div>
                          <div style={{ fontSize: '12px', color: '#888', direction: 'ltr', textAlign: 'right' }}>{c.phone}</div>
                        </div>
                      </button>
                    );
                  })}
                </div>

                {/* Import button */}
                <button
                  onClick={handleIOSImportSelected}
                  disabled={iosSelected.size === 0 || iosImporting}
                  style={{
                    width: '100%',
                    height: '52px',
                    minHeight: '44px',
                    background: iosSelected.size === 0 ? '#333' : '#d4a843',
                    borderRadius: '14px',
                    color: iosSelected.size === 0 ? '#888' : '#000',
                    fontSize: '15px',
                    fontWeight: '700',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '8px',
                    border: 'none',
                    opacity: iosImporting ? 0.7 : 1,
                  }}
                >
                  {iosImporting ? (
                    <>
                      <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                      מייבא...
                    </>
                  ) : (
                    `ייבא ${iosSelected.size} נבחרים`
                  )}
                </button>
              </div>
            )}
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
