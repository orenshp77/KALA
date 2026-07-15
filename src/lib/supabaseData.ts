import { supabase } from './supabase';
import { Event, Guest } from '@/types';

function generateId(): string {
  return Math.random().toString(36).substring(2, 11);
}

function generateToken(): string {
  return Math.random().toString(36).substring(2, 18);
}

// Map DB row to Event type
function mapEvent(row: any): Event {
  return {
    id: row.id,
    userId: row.user_id,
    coupleName1: row.couple_name1 || '',
    coupleName2: row.couple_name2 || '',
    date: row.date || '',
    venueName: row.venue_name || '',
    venueAddress: row.venue_address || '',
    selectedDesign: row.selected_design || 1,
  };
}

// Map DB row to Guest type
function mapGuest(row: any): Guest {
  return {
    id: row.id,
    eventId: row.event_id,
    name: row.name,
    phone: row.phone || '',
    guestsCount: row.guests_count || 1,
    status: row.status || 'pending',
    roundSent: row.round_sent || 0,
    respondedAt: row.responded_at || undefined,
    tableNumber: row.table_number || undefined,
    token: row.token,
  };
}

export async function getOrCreateProfile(supabaseUserId: string, email: string): Promise<{ eventId: string }> {
  // Check if profile exists
  const { data: profile } = await supabase.from('profiles').select('*').eq('id', supabaseUserId).single();
  if (profile) return { eventId: profile.event_id };

  // Create new event + profile
  const eventId = generateId();
  await supabase.from('events').insert({
    id: eventId,
    user_id: supabaseUserId,
    couple_name1: '',
    couple_name2: '',
    date: '',
    venue_name: '',
    venue_address: '',
    selected_design: 1,
  });
  await supabase.from('profiles').insert({
    id: supabaseUserId,
    email,
    role: 'couple',
    event_id: eventId,
  });
  return { eventId };
}

export async function getEvent(eventId: string): Promise<Event | null> {
  const { data } = await supabase.from('events').select('*').eq('id', eventId).single();
  return data ? mapEvent(data) : null;
}

export async function updateEventInDB(eventId: string, updates: Partial<Event>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.coupleName1 !== undefined) dbUpdates.couple_name1 = updates.coupleName1;
  if (updates.coupleName2 !== undefined) dbUpdates.couple_name2 = updates.coupleName2;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.venueName !== undefined) dbUpdates.venue_name = updates.venueName;
  if (updates.venueAddress !== undefined) dbUpdates.venue_address = updates.venueAddress;
  if (updates.selectedDesign !== undefined) dbUpdates.selected_design = updates.selectedDesign;
  await supabase.from('events').update(dbUpdates).eq('id', eventId);
}

export async function getGuests(eventId: string): Promise<Guest[]> {
  const { data } = await supabase.from('guests').select('*').eq('event_id', eventId);
  return (data || []).map(mapGuest);
}

export async function addGuestToDB(guest: Omit<Guest, 'id' | 'token' | 'status' | 'roundSent'>): Promise<Guest> {
  const newGuest = {
    id: generateId(),
    event_id: guest.eventId,
    name: guest.name,
    phone: guest.phone,
    guests_count: guest.guestsCount,
    status: 'pending',
    round_sent: 0,
    token: generateToken(),
  };
  const { data } = await supabase.from('guests').insert(newGuest).select().single();
  return mapGuest(data);
}

export async function updateGuestInDB(id: string, updates: Partial<Guest>): Promise<void> {
  const dbUpdates: any = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.roundSent !== undefined) dbUpdates.round_sent = updates.roundSent;
  if (updates.tableNumber !== undefined) dbUpdates.table_number = updates.tableNumber;
  if (updates.respondedAt !== undefined) dbUpdates.responded_at = updates.respondedAt;
  if (updates.guestsCount !== undefined) dbUpdates.guests_count = updates.guestsCount;
  await supabase.from('guests').update(dbUpdates).eq('id', id);
}

export async function deleteGuestFromDB(id: string): Promise<void> {
  await supabase.from('guests').delete().eq('id', id);
}

export async function getGuestByToken(token: string): Promise<{ guest: Guest; event: Event } | null> {
  const { data: guestRow } = await supabase.from('guests').select('*').eq('token', token).single();
  if (!guestRow) return null;
  const guest = mapGuest(guestRow);
  const { data: eventRow } = await supabase.from('events').select('*').eq('id', guestRow.event_id).single();
  if (!eventRow) return null;
  return { guest, event: mapEvent(eventRow) };
}

export async function respondToInviteInDB(token: string, status: 'confirmed' | 'declined', guestsCount?: number): Promise<Guest | null> {
  const updates: any = { status, responded_at: new Date().toISOString() };
  if (guestsCount !== undefined) updates.guests_count = guestsCount;
  const { data } = await supabase.from('guests').update(updates).eq('token', token).select().single();
  return data ? mapGuest(data) : null;
}

export async function getAllEventsAdmin(): Promise<{ profiles: any[]; events: Event[]; guests: Guest[] }> {
  const { data: profiles } = await supabase.from('profiles').select('*').eq('role', 'couple');
  const { data: events } = await supabase.from('events').select('*');
  const { data: guests } = await supabase.from('guests').select('*');
  return {
    profiles: profiles || [],
    events: (events || []).map(mapEvent),
    guests: (guests || []).map(mapGuest),
  };
}

export async function deleteUserFromDB(profileId: string): Promise<void> {
  await supabase.from('profiles').delete().eq('id', profileId);
}

export async function updateProfileEmail(profileId: string, newEmail: string): Promise<void> {
  await supabase.from('profiles').update({ email: newEmail }).eq('id', profileId);
}

export async function updateGuestRoundSentBatch(eventId: string, round: 1 | 2 | 3): Promise<void> {
  // Round 1: update guests where round_sent = 0
  // Round 2: update guests where round_sent = 1 and status = 'pending'
  // Round 3: update guests where round_sent = 2 and status = 'pending'
  let query = supabase.from('guests').update({ round_sent: round }).eq('event_id', eventId);
  if (round === 1) {
    query = query.eq('round_sent', 0);
  } else if (round === 2) {
    query = query.eq('round_sent', 1).eq('status', 'pending');
  } else if (round === 3) {
    query = query.eq('round_sent', 2).eq('status', 'pending');
  }
  await query;
}
