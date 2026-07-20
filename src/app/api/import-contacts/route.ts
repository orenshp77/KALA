import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ParsedContact {
  name: string;
  phone: string;
}

function cleanPhone(raw: string): string {
  const digits = raw.replace(/\D/g, '');
  if (digits.startsWith('972')) return `+${digits}`;
  if (digits.startsWith('0')) return `+972${digits.slice(1)}`;
  if (digits.length >= 7) return `+972${digits}`;
  return digits;
}

// Parse vCard format
function parseVCard(text: string): ParsedContact[] {
  const results: ParsedContact[] = [];
  const blocks = text.split('BEGIN:VCARD');
  for (const block of blocks) {
    if (!block.includes('END:VCARD')) continue;
    let fullName = '';
    const phones: string[] = [];
    const fnMatch = block.match(/FN[;:]([^\r\n]+)/);
    if (fnMatch) fullName = fnMatch[1].replace(/^.*:/, '').trim();
    if (!fullName) {
      const nMatch = block.match(/\nN[;:]([^\r\n]+)/);
      if (nMatch) {
        const parts = nMatch[1].replace(/^.*:/, '').split(';');
        fullName = [parts[1], parts[0]].filter(Boolean).join(' ').trim();
      }
    }
    const telMatches = block.matchAll(/TEL[^:\r\n]*:([\d\s\-\+\(\)]+)/g);
    for (const m of telMatches) {
      const cleaned = m[1].trim();
      if (cleaned.replace(/\D/g, '').length >= 7) phones.push(cleaned);
    }
    if (fullName && phones.length > 0) {
      for (const phone of phones) results.push({ name: fullName, phone });
    }
  }
  return results;
}

// Parse contact text lines: "name phone" or "name\nphone" etc
function parseTextLines(text: string): ParsedContact[] {
  const results: ParsedContact[] = [];
  // Split by newline
  const lines = text.split('\n').map(l => l.trim()).filter(l => l.length > 0);

  for (const line of lines) {
    // Try to find phone number in line
    const phoneMatch = line.match(/([\d\-\+\(\)\s]{7,})/);
    if (phoneMatch) {
      const phone = phoneMatch[1].trim();
      const name = line.replace(phoneMatch[0], '').replace(/[,\-–—|]/g, '').trim();
      if (name && phone) results.push({ name, phone });
    } else {
      // Line might be just a name — skip if no phone
    }
  }
  return results;
}

// POST - receive contacts from iOS Shortcut
export async function POST(req: NextRequest) {
  let rawText = '';

  try {
    rawText = await req.text();
  } catch {
    return Response.json({ error: 'failed to read body' }, { status: 400 });
  }

  // Save raw body for debugging
  const saveRaw = async (token: string) => {
    await supabase.from('import_sessions').update({ raw_body: rawText.substring(0, 10000) }).eq('token', token);
  };

  let contacts: ParsedContact[] = [];
  let token = '';
  let format = 'unknown';

  // Try 1: raw vCard
  if (rawText.includes('BEGIN:VCARD')) {
    contacts = parseVCard(rawText);
    format = 'raw-vcard';
  }

  // Try 2: JSON body
  if (contacts.length === 0) {
    try {
      const body = JSON.parse(rawText);
      token = body.token || body.Token || '';

      // Check all keys for contact data
      for (const [key, value] of Object.entries(body)) {
        if (key.toLowerCase() === 'token') continue;

        const valStr = typeof value === 'string' ? value : '';
        const keyAndVal = key + valStr;

        // Check if contacts are embedded in the key name (iOS Shortcuts bug)
        if (key.length > 20 || key.includes('\n')) {
          const textToParse = key + (valStr ? '\n' + valStr : '');
          // Remove "contacts" prefix if present
          const cleaned = textToParse.replace(/^contacts/i, '');
          const parsed = parseTextLines(cleaned);
          if (parsed.length > 0) {
            contacts = parsed;
            format = 'key-embedded';
            break;
          }
          // If no phone numbers found, treat each line as a name
          // (contacts without phone numbers from iOS)
          const names = cleaned.split('\n').map(l => l.trim()).filter(l => l.length > 1);
          if (names.length > 0) {
            contacts = names.map(n => ({ name: n, phone: '' }));
            format = 'names-only';
            break;
          }
        }

        // Normal: value is a string with contact data
        if (typeof value === 'string' && value.includes('\n')) {
          if (value.includes('BEGIN:VCARD')) {
            contacts = parseVCard(value);
            format = 'json-vcard';
          } else {
            contacts = parseTextLines(value);
            format = 'json-text';
          }
          if (contacts.length > 0) break;
        }

        // Value is an array
        if (Array.isArray(value)) {
          for (const item of value) {
            if (typeof item === 'string') {
              if (item.includes('BEGIN:VCARD')) {
                contacts.push(...parseVCard(item));
              } else {
                const phoneMatch = item.match(/([\d\-\+\(\)\s]{7,})/);
                if (phoneMatch) {
                  contacts.push({ name: item.replace(phoneMatch[0], '').trim(), phone: phoneMatch[1].trim() });
                }
              }
            } else if (typeof item === 'object' && item) {
              const name = item.name || item.Name || item.fullName || item.displayName ||
                [item.givenName, item.familyName].filter(Boolean).join(' ') ||
                [item.firstName, item.lastName].filter(Boolean).join(' ') || '';
              let phone = item.phone || item.Phone || item.phoneNumber || item.phoneNumbers || item.tel || '';
              if (Array.isArray(phone)) phone = phone[0]?.value || phone[0] || '';
              if (typeof phone === 'object' && phone) phone = phone.value || phone.stringValue || '';
              if (name) contacts.push({ name: String(name), phone: String(phone || '') });
            }
          }
          format = 'json-array';
          if (contacts.length > 0) break;
        }

        // Value is a single object
        if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
          const name = (value as any).name || (value as any).Name || '';
          let phone = (value as any).phone || (value as any).Phone || '';
          if (name) {
            contacts.push({ name: String(name), phone: String(phone || '') });
            format = 'json-object';
          }
        }
      }
    } catch {
      // Not valid JSON — try as plain text
      contacts = parseTextLines(rawText);
      format = 'plain-text';
    }
  }

  // Filter contacts with valid phones, but keep names-only too
  const withPhones = contacts.filter(c => c.phone && c.phone.replace(/\D/g, '').length >= 7);
  const finalContacts = withPhones.length > 0 ? withPhones : contacts.filter(c => c.name);

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
        contacts: JSON.stringify(finalContacts),
        status: finalContacts.length > 0 ? 'ready' : 'debug',
        raw_body: rawText.substring(0, 10000),
      })
      .eq('token', sessionToken);

    return Response.json({ success: true, count: finalContacts.length, format });
  }

  return Response.json({ error: 'no active session', count: finalContacts.length, format }, { status: 400 });
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
