'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useStore } from '@/store/useStore';
import { getEvent } from '@/lib/supabaseData';
import Swal from 'sweetalert2';

const designs = [
  { id: 1, name: 'זהב ואלגנטיות', bg: 'linear-gradient(160deg, #1a1200 0%, #2d1f00 100%)', textColor: '#d4a843', accent: '#f0c96e', fontStyle: 'Georgia, serif', emoji: '✨' },
  { id: 2, name: 'מינימליסטי לבן', bg: 'linear-gradient(160deg, #f5f0eb 0%, #ede8e3 100%)', textColor: '#1a1a1a', accent: '#333', fontStyle: 'inherit', emoji: '⬜' },
  { id: 3, name: 'פרחים ורומנטיקה', bg: 'linear-gradient(160deg, #3d1521 0%, #5c2035 100%)', textColor: '#ffd4e0', accent: '#ff9ab5', fontStyle: 'Georgia, serif', emoji: '🌸' },
  { id: 4, name: 'כחול ים', bg: 'linear-gradient(160deg, #0a1628 0%, #0d2447 100%)', textColor: '#ffffff', accent: '#7eb8f7', fontStyle: 'inherit', emoji: '🌊' },
  { id: 5, name: 'ירוק טבעי', bg: 'linear-gradient(160deg, #1a2d1a 0%, #2d4a2d 100%)', textColor: '#d4e8c2', accent: '#8bc34a', fontStyle: 'inherit', emoji: '🌿' },
];

export default function OnboardingPage() {
  const router = useRouter();
  const { currentUser, currentEvent, setEvent, updateEvent } = useStore();
  const [step, setStep] = useState<1 | 2>(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [showPreview, setShowPreview] = useState(false);

  const [coupleName1, setCoupleName1] = useState('');
  const [coupleName2, setCoupleName2] = useState('');
  const [date, setDate] = useState('');
  const [venueName, setVenueName] = useState('');
  const [venueAddress, setVenueAddress] = useState('');
  const [selectedDesign, setSelectedDesign] = useState(1);

  useEffect(() => {
    if (!currentUser) { router.replace('/login'); return; }
    getEvent(currentUser.eventId).then((ev) => {
      if (ev) {
        setEvent(ev);
        if (ev.coupleName1) { router.replace('/dashboard'); return; }
      }
      setLoading(false);
    });
  }, [currentUser]);

  const handleStep1Submit = async () => {
    setError('');
    if (!coupleName1.trim() || !coupleName2.trim()) { setError('נא למלא את שמות בני הזוג'); return; }
    if (!currentEvent) return;
    setSaving(true);
    await updateEvent(currentEvent.id, {
      coupleName1: coupleName1.trim(), coupleName2: coupleName2.trim(),
      date: date ? new Date(date).toISOString() : '',
      venueName: venueName.trim(), venueAddress: venueAddress.trim(),
    });
    setSaving(false);
    setStep(2);
  };

  const handleStep2Submit = async () => {
    if (!currentEvent) return;
    setSaving(true);
    await updateEvent(currentEvent.id, { selectedDesign });
    setSaving(false);

    const result = await Swal.fire({
      title: 'רוצים לשלוח את ההזמנה?',
      icon: 'question',
      background: '#1a1a1a',
      color: '#fff',
      confirmButtonText: 'כן, לשלוח עכשיו',
      cancelButtonText: 'לא, אני רוצה לחכות עם זה',
      showCancelButton: true,
      confirmButtonColor: '#d4a843',
      cancelButtonColor: '#333',
    });

    if (result.isConfirmed) {
      await Swal.fire({
        title: 'שימו לב',
        html: 'כדי ליצור סידורי שולחנות צריך להמתין לאורחים שיאשרו את הגעתם.<br><br>מוזמנים לבדוק בטבלה את המאשרים ולהתחיל לסדר.',
        icon: 'info',
        background: '#1a1a1a',
        color: '#fff',
        confirmButtonText: 'הבנתי',
        confirmButtonColor: '#d4a843',
      });
      router.push('/dashboard/guests');
    } else {
      router.push('/dashboard');
    }
  };

  const displayName1 = coupleName1 || 'שם 1';
  const displayName2 = coupleName2 || 'שם 2';
  const dateStr = date ? new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(date)) : '';
  const currentDesign = designs.find((d) => d.id === selectedDesign) || designs[0];

  if (loading) {
    return (
      <div className="screen" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ color: '#d4a843' }}>טוען...</div>
      </div>
    );
  }

  return (
    <div className="screen" style={{ padding: '24px 16px 40px', minHeight: '100dvh' }}>
      {/* Progress indicator */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0', marginBottom: '32px', marginTop: '16px' }}>
        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: '#d4a843', flexShrink: 0 }} />
        <div style={{ width: '60px', height: '2px', background: step === 2 ? '#d4a843' : '#2a2a2a', transition: 'background 0.3s' }} />
        <div style={{ width: '14px', height: '14px', borderRadius: '50%', background: step === 2 ? '#d4a843' : 'transparent', border: step === 2 ? '2px solid #d4a843' : '2px solid #2a2a2a', flexShrink: 0, transition: 'all 0.3s' }} />
      </div>

      {step === 1 && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>ברוכים הבאים! בואו נתחיל</h1>
            <p style={{ fontSize: '15px', color: '#888' }}>מלאו את פרטי האירוע</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label className="label">שם ראשון</label>
              <input className="input-field" placeholder="למשל: יעל" value={coupleName1} onChange={(e) => setCoupleName1(e.target.value)} />
            </div>
            <div>
              <label className="label">שם שני</label>
              <input className="input-field" placeholder="למשל: דניאל" value={coupleName2} onChange={(e) => setCoupleName2(e.target.value)} />
            </div>
            <div>
              <label className="label">תאריך</label>
              <input className="input-field" type="date" value={date} onChange={(e) => setDate(e.target.value)} style={{ direction: 'ltr', textAlign: 'left' }} />
            </div>
            <div>
              <label className="label">שם האולם</label>
              <input className="input-field" placeholder="שם המקום" value={venueName} onChange={(e) => setVenueName(e.target.value)} />
            </div>
            <div>
              <label className="label">כתובת</label>
              <input className="input-field" placeholder="רחוב, עיר" value={venueAddress} onChange={(e) => setVenueAddress(e.target.value)} />
            </div>
          </div>

          {error && (
            <div style={{ color: '#ef4444', fontSize: '14px', textAlign: 'center', padding: '8px', background: 'rgba(239,68,68,0.1)', borderRadius: '10px', marginTop: '16px' }}>{error}</div>
          )}

          <button className="btn-primary" onClick={handleStep1Submit} disabled={saving} style={{ marginTop: '24px', opacity: saving ? 0.7 : 1 }}>
            {saving ? '...' : 'המשך'}
          </button>
        </div>
      )}

      {step === 2 && (
        <div>
          <div style={{ textAlign: 'center', marginBottom: '24px' }}>
            <h1 style={{ fontSize: '24px', fontWeight: '800', color: '#ffffff', marginBottom: '8px' }}>בחרו עיצוב להזמנה</h1>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {designs.map((design) => {
              const isSelected = selectedDesign === design.id;
              return (
                <div key={design.id} onClick={() => setSelectedDesign(design.id)} style={{ borderRadius: '20px', overflow: 'hidden', border: isSelected ? '2.5px solid #d4a843' : '2px solid #2a2a2a', cursor: 'pointer', transition: 'border-color 0.2s', boxShadow: isSelected ? '0 0 20px rgba(212,168,67,0.3)' : 'none' }}>
                  <div style={{ background: design.bg, padding: '24px 16px', minHeight: '140px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', direction: 'rtl' }}>
                    <div style={{ fontSize: '11px', color: design.accent, letterSpacing: '3px', marginBottom: '8px', fontFamily: design.fontStyle }}>הזמנה לחתונה</div>
                    <div style={{ fontSize: '22px', fontWeight: '700', color: design.textColor, fontFamily: design.fontStyle }}>{displayName1} & {displayName2}</div>
                    <div style={{ width: '40px', height: '1px', background: design.accent, margin: '10px auto' }} />
                    <div style={{ fontSize: '13px', color: design.accent, fontFamily: design.fontStyle }}>{dateStr || 'תאריך האירוע'}</div>
                  </div>
                  <div style={{ background: '#1a1a1a', padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span>{design.emoji}</span>
                      <span style={{ fontSize: '14px', fontWeight: '600' }}>{design.name}</span>
                    </div>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', border: isSelected ? 'none' : '2px solid #3a3a3a', background: isSelected ? '#d4a843' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      {isSelected && <span style={{ color: '#000', fontSize: '14px', fontWeight: '700' }}>✓</span>}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          <button onClick={() => setShowPreview(true)} style={{ marginTop: '24px', width: '100%', height: '48px', background: 'transparent', border: '1px solid #d4a843', borderRadius: '14px', color: '#d4a843', fontSize: '15px', fontWeight: '600', cursor: 'pointer' }}>
            תצוגה מקדימה
          </button>

          <button className="btn-primary" onClick={handleStep2Submit} disabled={saving} style={{ marginTop: '12px', opacity: saving ? 0.7 : 1 }}>
            {saving ? '...' : 'סיום'}
          </button>
        </div>
      )}

      {/* Preview modal */}
      {showPreview && (
        <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: '24px' }} onClick={() => setShowPreview(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{ width: '280px', borderRadius: '32px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.1)', position: 'relative', background: '#000' }}>
            <div style={{ position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)', width: '90px', height: '22px', background: '#000', borderBottomLeftRadius: '12px', borderBottomRightRadius: '12px', zIndex: 10 }} />
            <div style={{ background: currentDesign.bg, padding: '60px 24px 40px', minHeight: '480px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', direction: 'rtl' }}>
              <div style={{ fontSize: '12px', color: currentDesign.accent, letterSpacing: '4px', marginBottom: '16px', fontFamily: currentDesign.fontStyle }}>הזמנה לחתונה</div>
              <div style={{ fontSize: '28px', fontWeight: '700', color: currentDesign.textColor, fontFamily: currentDesign.fontStyle, lineHeight: 1.4 }}>{displayName1} & {displayName2}</div>
              <div style={{ width: '50px', height: '1px', background: currentDesign.accent, margin: '16px auto' }} />
              {dateStr && <div style={{ fontSize: '15px', color: currentDesign.accent, fontFamily: currentDesign.fontStyle, marginBottom: '12px' }}>{dateStr}</div>}
              {venueName && <div style={{ fontSize: '14px', color: currentDesign.textColor, opacity: 0.7, fontFamily: currentDesign.fontStyle }}>{venueName}</div>}
            </div>
            <button onClick={() => setShowPreview(false)} style={{ position: 'absolute', top: '8px', right: '8px', width: '32px', height: '32px', borderRadius: '50%', background: 'rgba(0,0,0,0.6)', color: '#fff', fontSize: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 20, border: 'none', cursor: 'pointer' }}>✕</button>
          </div>
        </div>
      )}
    </div>
  );
}
