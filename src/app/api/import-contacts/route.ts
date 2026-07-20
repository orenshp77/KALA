import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ParsedContact {
  name: string;
  phone: string;
}

function normalizePhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  if (digits.length >= 7) return `+972${digits}`;
  return digits;
}

// POST - receive contacts from iOS Shortcut
export async function POST(req: NextRequest) {
  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return Response.json({ error: 'failed to read body' }, { status: 400 });
  }

  let body: any;
  try {
    body = JSON.parse(rawText);
  } catch {
    return Response.json({ error: 'invalid json', raw: rawText.substring(0, 300) }, { status: 400 });
  }

  const token = body.token || body.Token || '';
  let rawContacts = body.contacts || body.Contacts || [];

  if (typeof rawContacts === 'string') {
    try { rawContacts = JSON.parse(rawContacts); } catch { rawContacts = []; }
  }
  if (!Array.isArray(rawContacts)) {
    rawContacts = rawContacts ? [rawContacts] : [];
  }

  // Parse contacts: accept { name, phone } objects
  const contacts: ParsedContact[] = [];
  for (const item of rawContacts) {
    if (!item || typeof item !== 'object') continue;
    const name = String(item.name || item.Name || '').trim();
    let phone = item.phone || item.Phone || item.phoneNumber || '';
    if (Array.isArray(phone)) phone = phone[0] || '';
    if (typeof phone === 'object' && phone) phone = phone.value || phone.stringValue || '';
    phone = String(phone).trim();
    if (!name || !phone) continue;
    const normalized = normalizePhone(phone);
    if (normalized.replace(/\D/g, '').length >= 7) {
      contacts.push({ name, phone: normalized });
    }
  }

  // Find session to update
  let sessionToken = token;
  if (!sessionToken) {
    const { data: session } = await supabase
      .from('import_sessions')
      .select('token')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
    if (session) sessionToken = session.token;
  }

  if (sessionToken) {
    await supabase
      .from('import_sessions')
      .update({
        contacts: JSON.stringify(contacts),
        status: contacts.length > 0 ? 'ready' : 'debug',
        raw_body: rawText.substring(0, 10000),
      })
      .eq('token', sessionToken);

    return Response.json({ success: true, count: contacts.length });
  }

  return Response.json({ error: 'no active session', count: contacts.length }, { status: 400 });
}

// GET - check if contacts have been imported (polling)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) return Response.json({ status: 'missing token' }, { status: 400 });

  const { data } = await supabase
    .from('import_sessions')
    .select('*')
    .eq('token', token)
    .single();

  if (!data) return Response.json({ status: 'not_found' });

  if (data.status === 'ready') {
    return Response.json({
      status: 'ready',
      contacts: JSON.parse(data.contacts || '[]'),
    });
  }

  if (data.status === 'debug') {
    return Response.json({
      status: 'debug',
      contacts: [],
      raw: data.raw_body?.substring(0, 500),
    });
  }

  return Response.json({ status: 'waiting' });
}
