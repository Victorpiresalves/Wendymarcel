import { verifySession } from '../_lib/auth.js';
import { getFile, commitFiles } from '../_lib/github.js';
import { buildImoveisJs, buildPropertyPage, buildSitemap } from '../_lib/generate.js';

function json(obj, status) {
  return new Response(JSON.stringify(obj), { status, headers: { 'Content-Type': 'application/json' } });
}

async function requireAuth(request, env) {
  return verifySession(request, env.SESSION_SECRET);
}

function toNumOrNull(v) {
  return v === '' || v === null || v === undefined ? null : Number(v);
}

function normalizeListing(raw) {
  if (!raw) return null;
  const c = String(raw.c || '').trim();
  const t = String(raw.t || '').trim();
  const n = String(raw.n || '').trim();
  if (!c || !t || !n) return null;
  return {
    c,
    t,
    n,
    l: String(raw.l || '').trim(),
    p: toNumOrNull(raw.p),
    q: toNumOrNull(raw.q),
    b: toNumOrNull(raw.b),
    v: toNumOrNull(raw.v),
    a: raw.a ? String(raw.a) : null,
    f: raw.f ? String(raw.f) : '',
    imgs: Array.isArray(raw.imgs) ? raw.imgs.map((x) => String(x).trim()).filter(Boolean) : [],
    d: raw.d ? String(raw.d) : '',
    lat: toNumOrNull(raw.lat),
    lng: toNumOrNull(raw.lng),
  };
}

export async function onRequestGet({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: 'Não autenticado.' }, 401);
  try {
    const file = await getFile(env, 'imoveis-data.json');
    const listings = file ? JSON.parse(file.content) : [];
    return json({ listings });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
}

export async function onRequestPost({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: 'Não autenticado.' }, 401);

  let body;
  try {
    body = await request.json();
  } catch (e) {
    return json({ error: 'Requisição inválida.' }, 400);
  }

  const im = normalizeListing(body.listing);
  if (!im) return json({ error: 'Preencha ao menos código, tipo e nome do imóvel.' }, 400);

  try {
    const dataFile = await getFile(env, 'imoveis-data.json');
    const listings = dataFile ? JSON.parse(dataFile.content) : [];
    const idx = listings.findIndex((x) => String(x.c) === String(im.c));
    if (idx >= 0) listings[idx] = im;
    else listings.push(im);

    const templateFile = await getFile(env, 'imovel-template.html');
    if (!templateFile) throw new Error('imovel-template.html não encontrado no repositório.');

    const files = [
      { path: 'imoveis-data.json', content: JSON.stringify(listings, null, 4) + '\n' },
      { path: 'imoveis-data.js', content: buildImoveisJs(listings) },
      { path: `imoveis/${im.c}.html`, content: buildPropertyPage(templateFile.content, im) },
      { path: 'sitemap.xml', content: buildSitemap(listings) },
    ];
    await commitFiles(env, files, `Painel: salvar imóvel ${im.c} - ${im.n}`);
    return json({ ok: true, listing: im });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
}

export async function onRequestDelete({ request, env }) {
  if (!(await requireAuth(request, env))) return json({ error: 'Não autenticado.' }, 401);

  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  if (!code) return json({ error: 'Código do imóvel é obrigatório.' }, 400);

  try {
    const dataFile = await getFile(env, 'imoveis-data.json');
    const listings = dataFile ? JSON.parse(dataFile.content) : [];
    const next = listings.filter((x) => String(x.c) !== String(code));
    if (next.length === listings.length) return json({ error: 'Imóvel não encontrado.' }, 404);

    const files = [
      { path: 'imoveis-data.json', content: JSON.stringify(next, null, 4) + '\n' },
      { path: 'imoveis-data.js', content: buildImoveisJs(next) },
      { path: `imoveis/${code}.html`, delete: true },
      { path: 'sitemap.xml', content: buildSitemap(next) },
    ];
    await commitFiles(env, files, `Painel: remover imóvel ${code}`);
    return json({ ok: true });
  } catch (e) {
    return json({ error: String(e.message || e) }, 502);
  }
}
