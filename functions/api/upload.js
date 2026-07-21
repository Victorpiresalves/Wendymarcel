import { verifySession } from '../_lib/auth.js';
import { commitFiles } from '../_lib/github.js';

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

function arrayBufferToBase64(buf) {
  const bytes = new Uint8Array(buf);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

const ALLOWED_TYPES = { 'image/jpeg': 'jpeg', 'image/png': 'png', 'image/webp': 'webp' };
const MAX_SIZE = 8 * 1024 * 1024;

export async function onRequestPost({ request, env }) {
  const session = await verifySession(request, env.SESSION_SECRET);
  if (!session) return json({ error: 'Não autenticado.' }, 401);

  const contentType = request.headers.get('Content-Type') || '';
  if (!contentType.includes('multipart/form-data')) {
    return json({ error: 'Envie como multipart/form-data.' }, 400);
  }

  let form;
  try {
    form = await request.formData();
  } catch (e) {
    return json({ error: 'Formulário inválido.' }, 400);
  }

  const code = (form.get('code') || 'imovel').toString().replace(/[^a-zA-Z0-9_-]/g, '') || 'imovel';
  const entries = form.getAll('files');
  if (!entries.length) return json({ error: 'Nenhum arquivo enviado.' }, 400);

  const files = [];
  const filenames = [];
  const stamp = Date.now();
  let i = 0;
  for (const entry of entries) {
    if (!(entry instanceof File)) continue;
    const ext = ALLOWED_TYPES[entry.type];
    if (!ext) return json({ error: `Tipo de arquivo não suportado: ${entry.type || entry.name}` }, 400);
    if (entry.size > MAX_SIZE) return json({ error: `Arquivo muito grande: ${entry.name}` }, 400);
    const buf = await entry.arrayBuffer();
    const filename = `${code}-${stamp}-${i}.${ext}`;
    files.push({ path: `fotos/${filename}`, content: arrayBufferToBase64(buf), encoding: 'base64' });
    filenames.push(filename);
    i++;
  }
  if (!files.length) return json({ error: 'Nenhum arquivo válido enviado.' }, 400);

  try {
    await commitFiles(env, files, `Painel: enviar ${files.length} foto(s) do imóvel ${code}`);
    return json({ ok: true, filenames });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
}
