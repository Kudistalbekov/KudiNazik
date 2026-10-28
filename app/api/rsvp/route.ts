import { NextResponse } from 'next/server';

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{12,100}$/;

function getWebhook() {
  return process.env.RSVP_WEBHOOK_URL || '';
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get('guest')?.trim() || '';
  if (!TOKEN_PATTERN.test(token)) return NextResponse.json({error:'Invalid guest token'}, {status:400});
  const webhook = getWebhook();
  if (!webhook) return NextResponse.json({error:'RSVP is not configured'}, {status:503});
  try {
    const url = new URL(webhook);
    url.searchParams.set('action','guest');
    url.searchParams.set('token',token);
    const response = await fetch(url, {cache:'no-store',redirect:'follow'});
    const result = await response.json().catch(()=>null);
    if (!response.ok || !result || result.ok !== true || !result.guest) return NextResponse.json({error:'Guest not found'}, {status:404});
    const guest = result.guest as Record<string, unknown>;
    return NextResponse.json({ok:true,guest:{name:String(guest.name || ''),attendance:['yes','no'].includes(String(guest.attendance))?String(guest.attendance):null,guests:Number.isInteger(Number(guest.guests))?Number(guest.guests):null}});
  } catch {return NextResponse.json({error:'Could not load guest data'},{status:502});}
}

export async function PUT(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error:'Invalid JSON'}, {status:400}); }
  if (!body || typeof body !== 'object') return NextResponse.json({error:'Invalid data'}, {status:400});
  const data = body as Record<string, unknown>;
  const guestToken = typeof data.guestToken === 'string' ? data.guestToken.trim() : '';
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  if (!TOKEN_PATTERN.test(guestToken) || !name || name.length > 120) return NextResponse.json({error:'Invalid guest data'}, {status:400});
  const webhook = getWebhook();
  if (!webhook) return NextResponse.json({error:'RSVP is not configured'}, {status:503});
  try {
    const response = await fetch(webhook, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({action:'register',guestToken,name}),cache:'no-store',redirect:'follow'});
    const result = await response.json().catch(()=>null);
    if (!response.ok || !result || result.ok !== true || !result.guest) throw new Error('Registration failed');
    return NextResponse.json({ok:true,guest:result.guest});
  } catch {return NextResponse.json({error:'Could not register guest'},{status:502});}
}

export async function POST(request: Request) {
  let body: unknown;
  try { body = await request.json(); } catch { return NextResponse.json({error:'Invalid JSON'}, {status:400}); }
  if (!body || typeof body !== 'object') return NextResponse.json({error:'Invalid data'}, {status:400});
  const data = body as Record<string, unknown>;
  const name = typeof data.name === 'string' ? data.name.trim() : '';
  const attendance = data.attendance;
  const guests = Number(data.guests);
  const guestToken = typeof data.guestToken === 'string' ? data.guestToken.trim() : '';
  if (!name || name.length > 120 || !['yes','no'].includes(String(attendance)) || !Number.isInteger(guests) || guests < 0 || guests > 20 || (attendance === 'yes' && guests < 1) || (attendance === 'no' && guests !== 0)) return NextResponse.json({error:'Invalid form values'}, {status:400});
  if (guestToken && !TOKEN_PATTERN.test(guestToken)) return NextResponse.json({error:'Invalid guest token'}, {status:400});
  const webhook = getWebhook();
  if (!webhook) return NextResponse.json({error:'RSVP is not configured. Please contact the hosts.'}, {status:503});
  try {
    const response = await fetch(webhook, {method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({name,attendance,guests,guestToken:guestToken || null,submittedAt:new Date().toISOString()}),cache:'no-store',redirect:'follow'});
    if (!response.ok) throw new Error('Webhook rejected request');
    const result = await response.json().catch(()=>null);
    if (!result || result.ok !== true) throw new Error('Webhook did not confirm saving');
    return NextResponse.json({ok:true});
  } catch {return NextResponse.json({error:'Could not save RSVP. Please try again later.'},{status:502});}
}
