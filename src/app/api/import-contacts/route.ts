import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - receive contacts from iOS Shortcut
export async function POST(req: NextRequest) {
  let body: any;
  try {
    body = await req.json();
  } catch {
    return Response.json({ error: 'invalid json' }, { status: 400 });
  }

  const token = body.token || body.Token || '';
  let contacts = body.contacts || body.Contacts || body.contact || body.Contact || [];

  // If contacts is a string, try to parse it
  if (typeof contacts === 'string') {
    try {
      contacts = JSON.parse(contacts);
    } catch {
      contacts = [];
    }
  }

  // If contacts is not an array, wrap it or extract from object
  if (!Array.isArray(contacts)) {
    if (typeof contacts === 'object' && contacts !== null) {
      contacts = [contacts];
    } else {
      contacts = [];
    }
  }

  // Normalize contact format - iOS Shortcuts may send various formats
  const normalized = contacts.map((c: any) => {
    if (typeof c === 'string') {
      // Try to extract name and phone from string
      const phoneMatch = c.match(/([\d\-\+\(\)\s]{7,})/);
      const phone = phoneMatch ? phoneMatch[1].trim() : '';
      const name = c.replace(phoneMatch?.[0] || '', '').trim() || c;
      return { name, phone };
    }

    // Handle various property name formats from iOS
    const name = c.name || c.Name || c.firstName || c.givenName ||
                 c['First Name'] || c['שם'] ||
                 [c.givenName, c.familyName].filter(Boolean).join(' ') ||
                 [c['First Name'], c['Last Name']].filter(Boolean).join(' ') ||
                 'ללא שם';

    let phone = c.phone || c.Phone || c.phoneNumber || c.phoneNumbers ||
                c['Phone Number'] || c['טלפון'] || c.tel || '';

    // If phone is an array, take the first one
    if (Array.isArray(phone)) {
      phone = phone[0]?.value || phone[0]?.stringValue || phone[0] || '';
    }
    if (typeof phone === 'object' && phone !== null) {
      phone = phone.value || phone.stringValue || JSON.stringify(phone);
    }

    return { name: String(name), phone: String(phone) };
  }).filter((c: any) => c.name && c.phone);

  if (!token) {
    // If no token, try to find the most recent waiting session
    const { data: session } = await supabase
      .from('import_sessions')
      .select('token')
      .eq('status', 'waiting')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();

    if (session) {
      await supabase
        .from('import_sessions')
        .update({ contacts: JSON.stringify(normalized), status: 'ready' })
        .eq('token', session.token);
      return Response.json({ success: true, count: normalized.length });
    }
    return Response.json({ error: 'no active session' }, { status: 400 });
  }

  const { error } = await supabase
    .from('import_sessions')
    .update({ contacts: JSON.stringify(normalized), status: 'ready' })
    .eq('token', token);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, count: normalized.length });
}

// GET - check if contacts have been imported (polling)
export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get('token');
  if (!token) {
    return Response.json({ status: 'missing token' }, { status: 400 });
  }

  const { data } = await supabase
    .from('import_sessions')
    .select('*')
    .eq('token', token)
    .single();

  if (!data) {
    return Response.json({ status: 'not_found' });
  }

  if (data.status === 'ready') {
    return Response.json({
      status: 'ready',
      contacts: JSON.parse(data.contacts || '[]'),
    });
  }

  return Response.json({ status: 'waiting' });
}
