'use client';

import { useState } from 'react';
import { useStore } from '@/store/useStore';
import { Guest } from '@/types';

export default function SeatingPage() {
  const { currentUser, guests, assignTable } = useStore();
  const eventGuests = guests.filter((g) => g.eventId === currentUser?.eventId && g.status === 'confirmed');
  const unassigned = eventGuests.filter((g) => !g.tableNumber);
  const assigned = eventGuests.filter((g) => g.tableNumber);

  const [editingId, setEditingId] = useState<string | null>(null);
  const [tableInput, setTableInput] = useState('');
  const [view, setView] = useState<'list' | 'tables'>('list');

  // Group by table
  const tableMap: Record<number, Guest[]> = {};
  for (const g of assigned) {
    if (!tableMap[g.tableNumber!]) tableMap[g.tableNumber!] = [];
    tableMap[g.tableNumber!].push(g);
  }
  const tableNumbers = Object.keys(tableMap).map(Number).sort((a, b) => a - b);

  const handleAssign = (guestId: string) => {
    const num = parseInt(tableInput);
    if (!isNaN(num) && num > 0) {
      assignTable(guestId, num);
      setEditingId(null);
      setTableInput('');
    }
  };

  return (
    <div className="screen" style={{ padding: '24px 16px 100px' }}>
      <h1 className="section-title">שיבוץ שולחנות</h1>

      {/* Stats bar */}
      <div className="card" style={{ marginBottom: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#22c55e' }}>{assigned.length}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>שובצו</div>
        </div>
        <div style={{ width: '1px', height: '36px', background: '#2a2a2a' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#6b7280' }}>{unassigned.length}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>ממתינים לשיבוץ</div>
        </div>
        <div style={{ width: '1px', height: '36px', background: '#2a2a2a' }} />
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '22px', fontWeight: '800', color: '#d4a843' }}>{tableNumbers.length}</div>
          <div style={{ fontSize: '11px', color: '#888' }}>שולחנות</div>
        </div>
      </div>

      {/* View toggle */}
      <div style={{ display: 'flex', background: '#1a1a1a', borderRadius: '12px', padding: '4px', marginBottom: '16px', border: '1px solid #2a2a2a' }}>
        <button
          onClick={() => setView('list')}
          style={{
            flex: 1,
            height: '40px',
            borderRadius: '8px',
            background: view === 'list' ? '#2a2a2a' : 'transparent',
            color: view === 'list' ? '#fff' : '#888',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          לפי אורח
        </button>
        <button
          onClick={() => setView('tables')}
          style={{
            flex: 1,
            height: '40px',
            borderRadius: '8px',
            background: view === 'tables' ? '#2a2a2a' : 'transparent',
            color: view === 'tables' ? '#fff' : '#888',
            fontWeight: 600,
            fontSize: '14px',
          }}
        >
          לפי שולחן
        </button>
      </div>

      {view === 'list' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
          {unassigned.length > 0 && (
            <>
              <div style={{ fontSize: '13px', color: '#888', marginBottom: '4px' }}>ממתינים לשיבוץ</div>
              {unassigned.map((guest) => (
                <div key={guest.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600' }}>{guest.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{guest.guestsCount} אורחים</div>
                    </div>
                    {editingId === guest.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="שולחן"
                          value={tableInput}
                          onChange={(e) => setTableInput(e.target.value)}
                          style={{
                            width: '80px',
                            height: '40px',
                            background: '#2a2a2a',
                            border: '1px solid #d4a843',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '16px',
                            textAlign: 'center',
                            outline: 'none',
                            direction: 'ltr',
                          }}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAssign(guest.id)}
                        />
                        <button
                          onClick={() => handleAssign(guest.id)}
                          style={{ height: '40px', padding: '0 14px', background: '#d4a843', borderRadius: '8px', color: '#000', fontWeight: '700', fontSize: '14px' }}
                        >
                          שמור
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(guest.id); setTableInput(''); }}
                        style={{
                          height: '40px',
                          padding: '0 16px',
                          background: '#2a2a2a',
                          borderRadius: '10px',
                          color: '#d4a843',
                          fontSize: '13px',
                          fontWeight: '600',
                          border: '1px solid #d4a84333',
                        }}
                      >
                        שבץ שולחן
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {assigned.length > 0 && (
            <>
              <div style={{ fontSize: '13px', color: '#888', marginTop: '8px', marginBottom: '4px' }}>שובצו</div>
              {assigned.map((guest) => (
                <div key={guest.id} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div>
                      <div style={{ fontSize: '15px', fontWeight: '600' }}>{guest.name}</div>
                      <div style={{ fontSize: '12px', color: '#888' }}>{guest.guestsCount} אורחים</div>
                    </div>
                    {editingId === guest.id ? (
                      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                        <input
                          type="number"
                          inputMode="numeric"
                          placeholder="שולחן"
                          value={tableInput}
                          onChange={(e) => setTableInput(e.target.value)}
                          style={{
                            width: '80px',
                            height: '40px',
                            background: '#2a2a2a',
                            border: '1px solid #d4a843',
                            borderRadius: '8px',
                            color: '#fff',
                            fontSize: '16px',
                            textAlign: 'center',
                            outline: 'none',
                            direction: 'ltr',
                          }}
                          autoFocus
                          onKeyDown={(e) => e.key === 'Enter' && handleAssign(guest.id)}
                        />
                        <button
                          onClick={() => handleAssign(guest.id)}
                          style={{ height: '40px', padding: '0 14px', background: '#d4a843', borderRadius: '8px', color: '#000', fontWeight: '700', fontSize: '14px' }}
                        >
                          שמור
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => { setEditingId(guest.id); setTableInput(guest.tableNumber?.toString() || ''); }}
                        style={{
                          height: '40px',
                          padding: '0 16px',
                          background: '#1a2a1a',
                          borderRadius: '10px',
                          color: '#22c55e',
                          fontSize: '15px',
                          fontWeight: '800',
                          border: '1px solid #22c55e33',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '4px',
                        }}
                      >
                        שולחן {guest.tableNumber}
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </>
          )}

          {eventGuests.length === 0 && (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px 0', fontSize: '14px' }}>
              אין מוזמנים שאישרו הגעה עדיין
            </div>
          )}
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {tableNumbers.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#555', padding: '40px 0', fontSize: '14px' }}>
              טרם שובצו שולחנות
            </div>
          ) : (
            tableNumbers.map((tNum) => {
              const tableGuests = tableMap[tNum];
              const totalPeople = tableGuests.reduce((s, g) => s + g.guestsCount, 0);
              return (
                <div key={tNum} className="card">
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ fontSize: '18px', fontWeight: '800', color: '#d4a843' }}>שולחן {tNum}</div>
                    <div style={{ fontSize: '13px', color: '#888' }}>{totalPeople} אנשים</div>
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {tableGuests.map((g) => (
                      <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px 0', borderTop: '1px solid #2a2a2a' }}>
                        <span style={{ fontSize: '14px' }}>{g.name}</span>
                        <span style={{ fontSize: '12px', color: '#888' }}>{g.guestsCount} 👤</span>
                      </div>
                    ))}
                  </div>
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}
