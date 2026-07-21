const API = 'https://api.github.com';

function ghHeaders(env) {
  return {
    Authorization: `Bearer ${env.GITHUB_TOKEN}`,
    Accept: 'application/vnd.github+json',
    'User-Agent': 'wendymarcel-painel',
    'X-GitHub-Api-Version': '2022-11-28',
  };
}

function repoBase(env) {
  return `${API}/repos/${env.GITHUB_OWNER}/${env.GITHUB_REPO}`;
}

function decodeBase64Utf8(b64) {
  const binary = atob(b64.replace(/\n/g, ''));
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
  return new TextDecoder('utf-8').decode(bytes);
}

function encodeUtf8Base64(str) {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  const chunk = 0x8000;
  for (let i = 0; i < bytes.length; i += chunk) {
    binary += String.fromCharCode.apply(null, bytes.subarray(i, i + chunk));
  }
  return btoa(binary);
}

async function assertOk(res, label) {
  if (!res.ok) {
    const body = await res.text().catch(() => '');
    throw new Error(`${label} falhou: ${res.status} ${body}`);
  }
}

/** Reads a file from the repo at the configured branch. Returns null if it doesn't exist. */
export async function getFile(env, path) {
  const url = `${repoBase(env)}/contents/${path}?ref=${encodeURIComponent(env.GITHUB_BRANCH)}`;
  const res = await fetch(url, { headers: ghHeaders(env) });
  if (res.status === 404) return null;
  await assertOk(res, `Ler ${path}`);
  const json = await res.json();
  return { content: decodeBase64Utf8(json.content), sha: json.sha };
}

/**
 * Commits multiple file changes atomically in a single commit on top of the
 * current branch head. Each entry: { path, content, encoding?: 'utf-8'|'base64', delete?: true }.
 */
export async function commitFiles(env, files, message) {
  const base = repoBase(env);
  const headers = ghHeaders(env);
  const branch = env.GITHUB_BRANCH;

  const refRes = await fetch(`${base}/git/refs/heads/${branch}`, { headers });
  await assertOk(refRes, 'Buscar ref da branch');
  const refJson = await refRes.json();
  const latestCommitSha = refJson.object.sha;

  const commitRes = await fetch(`${base}/git/commits/${latestCommitSha}`, { headers });
  await assertOk(commitRes, 'Buscar commit atual');
  const commitJson = await commitRes.json();
  const baseTreeSha = commitJson.tree.sha;

  const treeEntries = [];
  for (const f of files) {
    if (f.delete) {
      treeEntries.push({ path: f.path, mode: '100644', type: 'blob', sha: null });
      continue;
    }
    const contentBase64 = f.encoding === 'base64' ? f.content : encodeUtf8Base64(f.content);
    const blobRes = await fetch(`${base}/git/blobs`, {
      method: 'POST',
      headers,
      body: JSON.stringify({ content: contentBase64, encoding: 'base64' }),
    });
    await assertOk(blobRes, `Criar blob de ${f.path}`);
    const blobJson = await blobRes.json();
    treeEntries.push({ path: f.path, mode: '100644', type: 'blob', sha: blobJson.sha });
  }

  const treeRes = await fetch(`${base}/git/trees`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ base_tree: baseTreeSha, tree: treeEntries }),
  });
  await assertOk(treeRes, 'Criar árvore de arquivos');
  const treeJson = await treeRes.json();

  const newCommitRes = await fetch(`${base}/git/commits`, {
    method: 'POST',
    headers,
    body: JSON.stringify({ message, tree: treeJson.sha, parents: [latestCommitSha] }),
  });
  await assertOk(newCommitRes, 'Criar commit');
  const newCommitJson = await newCommitRes.json();

  const updateRefRes = await fetch(`${base}/git/refs/heads/${branch}`, {
    method: 'PATCH',
    headers,
    body: JSON.stringify({ sha: newCommitJson.sha, force: false }),
  });
  await assertOk(updateRefRes, 'Atualizar branch');

  return newCommitJson.sha;
}
