import { verifySession } from '../_lib/auth.js';

export async function onRequestGet({ request, env }) {
  const session = await verifySession(request, env.SESSION_SECRET);
  return new Response(JSON.stringify({ authenticated: !!session, user: session ? session.u : null }), {
    status: 200,
    headers: { 'Content-Type': 'application/json' },
  });
}
