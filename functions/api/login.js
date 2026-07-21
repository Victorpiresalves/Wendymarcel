import { createSessionCookie, timingSafeEqualString } from '../_lib/auth.js';

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_USER || !env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({ error: 'Painel não configurado: faltam variáveis de ambiente no Cloudflare Pages.' }, 500);
  }

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  const user = (body.user || '').trim();
  const pass = body.pass || '';

  const [userOk, passOk] = await Promise.all([
    timingSafeEqualString(user, env.ADMIN_USER),
    timingSafeEqualString(pass, env.ADMIN_PASSWORD),
  ]);

  if (!userOk || !passOk) {
    return json({ error: 'Usuário ou senha inválidos.' }, 401);
  }

  const maxAge = 60 * 60 * 8; // 8h
  const cookie = await createSessionCookie(user, env.SESSION_SECRET, maxAge);
  return new Response(JSON.stringify({ ok: true }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Set-Cookie': cookie },
  });
}
