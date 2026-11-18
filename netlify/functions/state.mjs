import { getStore } from '@netlify/blobs';

export const config = { path: '/api/state' };

const RESET_KEY = '61039286';

const json = (data, status = 200) =>
  new Response(JSON.stringify(data), {
    status,
    headers: { 'content-type': 'application/json', 'cache-control': 'no-store' },
  });

async function readState(store) {
  const saved = await store.get('state', { type: 'json' });
  if (!saved) return { answered: false, startedAt: null };
  return { answered: saved.answered === true, startedAt: saved.startedAt || null };
}

export default async (req) => {
  const store = getStore('kiara');

  if (req.method === 'GET') {
    return json(await readState(store));
  }

  let body = {};
  try {
    body = await req.json();
  } catch (error) {
    body = {};
  }

  if (body.action === 'reset') {
    if (String(body.key) !== RESET_KEY) return json({ ok: false }, 403);
    await store.delete('state');
    return json({ answered: false, startedAt: null });
  }

  if (body.action === 'answer') {
    const current = await readState(store);
    if (current.answered) return json(current);
    const next = { answered: true, startedAt: Date.now() };
    await store.setJSON('state', next);
    return json(next);
  }

  return json({ ok: false }, 400);
};
