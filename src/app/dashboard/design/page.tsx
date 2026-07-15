'use client';

import { useStore } from '@/store/useStore';

const designs = [
  {
    id: 1,
    name: 'זהב ואלגנטיות',
    bg: 'linear-gradient(160deg, #1a1200 0%, #2d1f00 100%)',
    textColor: '#d4a843',
    accent: '#f0c96e',
    fontStyle: 'Georgia, serif',
    emoji: '✨',
  },
  {
    id: 2,
    name: 'מינימליסטי לבן',
    bg: 'linear-gradient(160deg, #f5f0eb 0%, #ede8e3 100%)',
    textColor: '#1a1a1a',
    accent: '#333',
    fontStyle: 'inherit',
    emoji: '⬜',
  },
  {
    id: 3,
    name: 'פרחים ורומנטיקה',
    bg: 'linear-gradient(160deg, #3d1521 0%, #5c2035 100%)',
    textColor: '#ffd4e0',
    accent: '#ff9ab5',
    fontStyle: 'Georgia, serif',
    emoji: '🌸',
  },
  {
    id: 4,
    name: 'כחול ים',
    bg: 'linear-gradient(160deg, #0a1628 0%, #0d2447 100%)',
    textColor: '#ffffff',
    accent: '#7eb8f7',
    fontStyle: 'inherit',
    emoji: '🌊',
  },
  {
    id: 5,
    name: 'ירוק טבעי',
    bg: 'linear-gradient(160deg, #1a2d1a 0%, #2d4a2d 100%)',
    textColor: '#d4e8c2',
    accent: '#8bc34a',
    fontStyle: 'inherit',
    emoji: '🌿',
  },
];

export default function DesignPage() {
  const { currentEvent, updateEvent } = useStore();
  const event = currentEvent;
  const selectedDesign = event?.selectedDesign || 1;

  const handleSelect = (id: number) => {
    if (event) updateEvent(event.id, { selectedDesign: id });
  };

  const coupleName1 = event?.coupleName1 || 'יעל';
  const coupleName2 = event?.coupleName2 || 'דניאל';
  const dateStr = event?.date
    ? new Intl.DateTimeFormat('he-IL', { day: 'numeric', month: 'long', year: 'numeric' }).format(new Date(event.date))
    : '15 ביוני 2025';

  return (
    <div className="screen" style={{ padding: '24px 16px 100px' }}>
      <h1 className="section-title">עיצוב ההזמנה</h1>
      <p style={{ fontSize: '14px', color: '#888', marginBottom: '24px' }}>בחר את העיצוב שמתאים לאירוע שלכם</p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {designs.map((design) => {
          const isSelected = selectedDesign === design.id;
          return (
            <div
              key={design.id}
              onClick={() => handleSelect(design.id)}
              style={{
                borderRadius: '20px',
                overflow: 'hidden',
                border: isSelected ? '2.5px solid #d4a843' : '2px solid #2a2a2a',
                cursor: 'pointer',
                transition: 'border-color 0.2s',
                boxShadow: isSelected ? '0 0 20px rgba(212,168,67,0.3)' : 'none',
              }}
            >
              {/* Preview frame */}
              <div
                style={{
                  background: design.bg,
                  padding: '24px 16px',
                  minHeight: '140px',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  textAlign: 'center',
                  direction: 'rtl',
                }}
              >
                <div style={{ fontSize: '11px', color: design.accent, letterSpacing: '3px', marginBottom: '8px', fontFamily: design.fontStyle }}>
                  הזמנה לחתונה
                </div>
                <div style={{ fontSize: '22px', fontWeight: '700', color: design.textColor, fontFamily: design.fontStyle }}>
                  {coupleName1} & {coupleName2}
                </div>
                <div style={{ width: '40px', height: '1px', background: design.accent, margin: '10px auto' }} />
                <div style={{ fontSize: '13px', color: design.accent, fontFamily: design.fontStyle }}>{dateStr}</div>
              </div>

              {/* Card footer */}
              <div
                style={{
                  background: '#1a1a1a',
                  padding: '12px 16px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{design.emoji}</span>
                  <span style={{ fontSize: '14px', fontWeight: '600' }}>{design.name}</span>
                </div>
                <div
                  style={{
                    width: '24px',
                    height: '24px',
                    borderRadius: '50%',
                    border: isSelected ? 'none' : '2px solid #3a3a3a',
                    background: isSelected ? '#d4a843' : 'transparent',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  {isSelected && <span style={{ color: '#000', fontSize: '14px', fontWeight: '700' }}>✓</span>}
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
