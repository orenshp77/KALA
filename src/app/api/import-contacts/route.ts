import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

interface ParsedContact {
  name: string;
  phone: string;
}

// Parse vCard format string into contacts
function parseVCard(text: string): ParsedContact[] {
  const results: ParsedContact[] = [];
  const blocks = text.split('BEGIN:VCARD');
  for (const block of blocks) {
    if (!block.includes('END:VCARD')) continue;

    let fullName = '';
    const phones: string[] = [];

    // Extract FN (Full Name)
    const fnMatch = block.match(/FN[;:]([^\r\n]+)/);
    if (fnMatch) fullName = fnMatch[1].replace(/^.*:/, '').trim();

    // Fallback to N field
    if (!fullName) {
      const nMatch = block.match(/\nN[;:]([^\r\n]+)/);
      if (nMatch) {
        const parts = nMatch[1].replace(/^.*:/, '').split(';');
        fullName = [parts[1], parts[0]].filter(Boolean).join(' ').trim();
      }
    }

    // Extract all TEL fields
    const telMatches = block.matchAll(/TEL[^:\r\n]*:([\d\s\-\+\(\)]+)/g);
    for (const m of telMatches) {
      const cleaned = m[1].trim();
      if (cleaned.replace(/\D/g, '').length >= 7) {
        phones.push(cleaned);
      }
    }

    if (fullName && phones.length > 0) {
      // Add one entry per phone number
      for (const phone of phones) {
        results.push({ name: fullName, phone });
      }
    }
  }
  return results;
}

// Try to extract contacts from any possible format
function extractContacts(body: any): { contacts: ParsedContact[]; debug: any } {
  const debug: any = {
    bodyType: typeof body,
    bodyKeys: typeof body === 'object' && body !== null ? Object.keys(body) : [],
    rawSample: JSON.stringify(body).substring(0, 500),
  };

  // Collect all values that might contain contacts
  const candidates: any[] = [];

  if (typeof body === 'object' && body !== null) {
    for (const key of Object.keys(body)) {
      if (key.toLowerCase() !== 'token') {
        candidates.push({ key, value: body[key] });
      }
    }
  }

  const allParsed: ParsedContact[] = [];

  // Also check the entire body as a potential contacts source
  candidates.push({ key: '_body', value: body });

  for (const { key, value } of candidates) {
    debug[`candidate_${key}_type`] = typeof value;

    // Case 1: value is a vCard string
    if (typeof value === 'string' && value.includes('BEGIN:VCARD')) {
      const parsed = parseVCard(value);
      debug[`candidate_${key}_format`] = 'vcard';
      debug[`candidate_${key}_count`] = parsed.length;
      allParsed.push(...parsed);
      continue;
    }

    // Case 2: value is a string with phone-like patterns (one contact per line)
    if (typeof value === 'string' && value.includes('\n')) {
      const lines = value.split('\n').filter((l: string) => l.trim());
      for (const line of lines) {
        const phoneMatch = line.match(/([\d\-\+\(\)\s]{7,})/);
        if (phoneMatch) {
          const phone = phoneMatch[1].trim();
          const name = line.replace(phoneMatch[0], '').replace(/[,\-–—|]/g, '').trim();
          if (name && phone) allParsed.push({ name, phone });
        }
      }
      continue;
    }

    // Case 3: value is an array
    if (Array.isArray(value)) {
      debug[`candidate_${key}_format`] = 'array';
      debug[`candidate_${key}_length`] = value.length;
      if (value.length > 0) {
        debug[`candidate_${key}_firstItem`] = JSON.stringify(value[0]).substring(0, 200);
      }

      for (const item of value) {
        if (typeof item === 'string') {
          // Could be vCard
          if (item.includes('BEGIN:VCARD')) {
            allParsed.push(...parseVCard(item));
          } else {
            // Try name + phone extraction
            const phoneMatch = item.match(/([\d\-\+\(\)\s]{7,})/);
            if (phoneMatch) {
              const phone = phoneMatch[1].trim();
              const name = item.replace(phoneMatch[0], '').trim() || item;
              allParsed.push({ name, phone });
            }
          }
        } else if (typeof item === 'object' && item !== null) {
          // Object with name/phone properties
          const name = item.name || item.Name || item.fullName || item.displayName ||
                       item.givenName || item.firstName ||
                       item['First Name'] || item['שם'] ||
                       [item.givenName || item['First Name'] || '', item.familyName || item['Last Name'] || ''].filter(Boolean).join(' ') ||
                       [item.namePrefix, item.givenName, item.middleName, item.familyName, item.nameSuffix].filter(Boolean).join(' ') ||
                       '';

          let phones = item.phone || item.Phone || item.phoneNumber || item.phoneNumbers ||
                       item['Phone Number'] || item['טלפון'] || item.tel || item.telephone || '';

          // Handle phoneNumbers array (Apple format)
          if (Array.isArray(phones)) {
            for (const p of phones) {
              const phoneStr = typeof p === 'string' ? p :
                              p?.value || p?.stringValue || p?.digits || p?.number ||
                              (typeof p === 'object' ? JSON.stringify(p) : String(p));
              if (phoneStr && name) {
                allParsed.push({ name: String(name).trim(), phone: String(phoneStr).trim() });
              }
            }
            continue;
          }

          if (typeof phones === 'object' && phones !== null && !Array.isArray(phones)) {
            phones = phones.value || phones.stringValue || phones.digits || phones.number || '';
          }

          if (name && phones) {
            allParsed.push({ name: String(name).trim(), phone: String(phones).trim() });
          }
        }
      }
      continue;
    }

    // Case 4: value is a single object (one contact)
    if (typeof value === 'object' && value !== null && key !== '_body') {
      const name = value.name || value.Name || value.fullName ||
                   [value.givenName, value.familyName].filter(Boolean).join(' ') || '';
      let phone = value.phone || value.Phone || value.phoneNumber || value.phoneNumbers || '';

      if (Array.isArray(phone)) {
        phone = phone[0]?.value || phone[0]?.stringValue || phone[0] || '';
      }
      if (typeof phone === 'object' && phone !== null) {
        phone = phone.value || phone.stringValue || '';
      }

      if (name && phone) {
        allParsed.push({ name: String(name).trim(), phone: String(phone).trim() });
      }
    }
  }

  debug.totalParsed = allParsed.length;
  return { contacts: allParsed, debug };
}

// POST - receive contacts from iOS Shortcut
export async function POST(req: NextRequest) {
  let rawText = '';
  let body: any;

  try {
    rawText = await req.text();
    body = JSON.parse(rawText);
  } catch {
    // Maybe it's form data or vCard directly
    if (rawText.includes('BEGIN:VCARD')) {
      const contacts = parseVCard(rawText);
      // Find most recent waiting session
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
          .update({ contacts: JSON.stringify(contacts), status: 'ready' })
          .eq('token', session.token);
        return Response.json({ success: true, count: contacts.length, format: 'raw-vcard' });
      }
      return Response.json({ error: 'no active session', count: contacts.length }, { status: 400 });
    }
    return Response.json({ error: 'invalid body', rawSample: rawText.substring(0, 300) }, { status: 400 });
  }

  const token = body.token || body.Token || '';
  const { contacts, debug } = extractContacts(body);

  // Log debug info to import_sessions for troubleshooting
  const debugStr = JSON.stringify(debug);

  if (!token) {
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
        .update({
          contacts: JSON.stringify(contacts),
          status: contacts.length > 0 ? 'ready' : 'debug',
        })
        .eq('token', session.token);
      return Response.json({ success: true, count: contacts.length, debug });
    }
    return Response.json({ error: 'no active session', debug }, { status: 400 });
  }

  const { error } = await supabase
    .from('import_sessions')
    .update({
      contacts: JSON.stringify(contacts),
      status: contacts.length > 0 ? 'ready' : 'debug',
    })
    .eq('token', token);

  if (error) {
    return Response.json({ error: error.message, debug }, { status: 500 });
  }

  return Response.json({ success: true, count: contacts.length, debug });
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

  // Return debug info if status is 'debug' (contacts came but count was 0)
  if (data.status === 'debug') {
    return Response.json({
      status: 'debug',
      contacts: [],
      raw: data.contacts,
    });
  }

  return Response.json({ status: 'waiting' });
}
