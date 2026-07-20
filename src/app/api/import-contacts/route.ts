import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ParsedContact {
  name: string;
  phone: string;
}

function normalizePhone(raw: string): string {
  // Strip all non-digit characters except leading +
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  if (digits.length >= 7) return `+972${digits}`;
  return digits;
}

function isValidPhone(phone: string): boolean {
  const digits = phone.replace(/\D/g, '');
  return digits.length >= 7;
}

function parseCSVData(data: string): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  const lines = data.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);

  for (const line of lines) {
    // Format: "Name,Phone" per line
    const commaIdx = line.lastIndexOf(',');
    if (commaIdx === -1) continue;

    const namePart = line.substring(0, commaIdx).trim();
    const phonePart = line.substring(commaIdx + 1).trim();

    if (!namePart || !phonePart) continue;

    // Check which part has the phone number
    const nameDigits = namePart.replace(/\D/g, '');
    const phoneDigits = phonePart.replace(/\D/g, '');

    let name: string;
    let phone: string;

    if (phoneDigits.length >= 7) {
      name = namePart;
      phone = phonePart;
    } else if (nameDigits.length >= 7) {
      // Reversed: phone,name
      name = phonePart;
      phone = namePart;
    } else {
      continue;
    }

    const normalized = normalizePhone(phone);
    if (isValidPhone(normalized)) {
      contacts.push({ name, phone: normalized });
    }
  }
  return contacts;
}

function parseJSONContacts(rawContacts: unknown[]): ParsedContact[] {
  const contacts: ParsedContact[] = [];
  for (const item of rawContacts) {
    if (!item || typeof item !== 'object') continue;
    const obj = item as Record<string, unknown>;
    const name = String(obj.name || obj.Name || '').trim();
    let phone = obj.phone || obj.Phone || obj.phoneNumber || '';
    if (Array.isArray(phone)) phone = phone[0] || '';
    if (typeof phone === 'object' && phone) {
      const phoneObj = phone as Record<string, unknown>;
      phone = phoneObj.value || phoneObj.stringValue || '';
    }
    phone = String(phone).trim();
    if (!name || !phone) continue;
    const normalized = normalizePhone(phone as string);
    if (isValidPhone(normalized)) {
      contacts.push({ name, phone: normalized });
    }
  }
  return contacts;
}

function parseKeyNameContacts(body: Record<string, unknown>): ParsedContact[] {
  // iOS Shortcuts bug: contacts embedded in key names
  // e.g. { "contactsאורן כהן\nמיכל": "" }
  const contacts: ParsedContact[] = [];
  for (const key of Object.keys(body)) {
    if (key === 'token' || key === 'Token') continue;
    // Try to extract names and phones from the key
    const text = key.replace(/^contacts/i, '');
    if (!text) continue;
    const lines = text.split('\n').map((l) => l.trim()).filter((l) => l.length > 0);
    for (const line of lines) {
      // Try to find a phone number in the line
      const phoneMatch = line.match(/([\d\-\+\(\)\s]{7,})/);
      if (phoneMatch) {
        const phone = phoneMatch[1].trim();
        const name = line.replace(phoneMatch[0], '').replace(/[,\-–—|]/g, '').trim();
        if (name && isValidPhone(phone)) {
          contacts.push({ name, phone: normalizePhone(phone) });
        }
      } else if (line.length >= 2) {
        // Just a name, no phone — skip
      }
    }
  }
  return contacts;
}

function deduplicateContacts(contacts: ParsedContact[]): ParsedContact[] {
  const seen = new Set<string>();
  const result: ParsedContact[] = [];
  for (const c of contacts) {
    const phoneKey = c.phone.replace(/\D/g, '');
    if (!seen.has(phoneKey)) {
      seen.add(phoneKey);
      result.push(c);
    }
  }
  return result;
}

// POST - receive contacts from iOS Shortcut
export async function POST(req: NextRequest) {
  // Add CORS headers
  const headers = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };

  let rawText = '';
  try {
    rawText = await req.text();
  } catch {
    return Response.json({ error: 'failed to read body' }, { status: 400, headers });
  }

  let body: Record<string, unknown>;
  try {
    body = JSON.parse(rawText);
  } catch {
    return Response.json({ error: 'invalid json', raw: rawText.substring(0, 300) }, { status: 400, headers });
  }

  const token = String(body.token || body.Token || '');
  let contacts: ParsedContact[] = [];

  // Format 1: JSON contacts array
  const rawContacts = body.contacts || body.Contacts;
  if (rawContacts) {
    let arr = rawContacts;
    if (typeof arr === 'string') {
      try { arr = JSON.parse(arr); } catch { arr = []; }
    }
    if (!Array.isArray(arr)) arr = arr ? [arr] : [];
    contacts = parseJSONContacts(arr as unknown[]);
  }

  // Format 2: CSV text data
  if (contacts.length === 0 && body.data) {
    const data = String(body.data);
    contacts = parseCSVData(data);
  }

  // Format 3: Contacts embedded in key names (iOS Shortcuts bug)
  if (contacts.length === 0) {
    contacts = parseKeyNameContacts(body);
  }

  // Deduplicate
  const allContacts = deduplicateContacts(contacts);
  const skipped = contacts.length - allContacts.length;

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
        contacts: JSON.stringify(allContacts),
        status: allContacts.length > 0 ? 'ready' : 'debug',
        raw_body: rawText.substring(0, 10000),
      })
      .eq('token', sessionToken);

    return Response.json({
      success: true,
      count: allContacts.length,
      imported: allContacts,
      skipped,
    }, { headers });
  }

  return Response.json({ error: 'no active session', count: allContacts.length }, { status: 400, headers });
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

// OPTIONS - CORS preflight
export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
