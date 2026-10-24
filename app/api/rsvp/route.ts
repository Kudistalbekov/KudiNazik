import { NextResponse } from 'next/server';
export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error:'Invalid JSON'}, {status:400}); }
  if (!body || typeof body !== 'object') return NextResponse.json({error:'Invalid data'}, {status:400});
  const data = body as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const attendance = data.attendance;
  const guests = Number(data.guests);
  if (!name || name.length > 120 || !['yes','no'].includes(String(attendance)) || !Number.isInteger(guests) || guests < 0 || guests > 20 || (attendance === 'yes' && guests < 1) || (attendance === 'no' && guests !== 0)) return NextResponse.json({error:'Invalid form values'}, {status:400});
  const webhook = process.env.RSVP_WEBHOOK_URL;
  if (!webhook) return NextResponse.json({error:'RSVP is not configured. Please contact the hosts.'}, {status:503});
  try {
    const response = await fetch(webhook, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,attendance,guests,submittedAt:new Date().toISOString()}),cache:'no-store',redirect:'follow'});
    if (!response.ok) throw new Error('Webhook rejected request');
    const result = await response.json().catch(()=>null);
    if (!result || result.ok !== true) throw new Error('Webhook did not confirm saving');
    return NextResponse.json({ok:true});
  } catch {return NextResponse.json({error:'Could not save RSVP. Please try again later.'},{status:502});}
}
