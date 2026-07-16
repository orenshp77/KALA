import { NextRequest } from 'next/server';
import { supabase } from '@/lib/supabase';

// POST - receive contacts from iOS Shortcut
export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, contacts } = body;

  if (!token || !contacts) {
    return Response.json({ error: 'missing data' }, { status: 400 });
  }

  // Save contacts to import_sessions table
  const { error } = await supabase
    .from('import_sessions')
    .update({
      contacts: JSON.stringify(contacts),
      status: 'ready',
    })
    .eq('token', token);

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ success: true, count: contacts.length });
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
