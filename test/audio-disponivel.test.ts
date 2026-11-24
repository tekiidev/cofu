import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/app/api/audio/route.ts';

test('GET /api/audio: sem IA configurada, o microfone não manda áudio', async () => {
  delete process.env.COFU_IA_URL;
  delete process.env.COFU_IA_TOKEN;
  const res = GET();
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await res.json(), { disponivel: false });
});

test('GET /api/audio: com URL e token, o áudio vai direto pra IA', async () => {
  process.env.COFU_IA_URL = 'http://ia.local';
  process.env.COFU_IA_TOKEN = 'x';
  assert.deepEqual(await GET().json(), { disponivel: true });
  delete process.env.COFU_IA_URL;
  delete process.env.COFU_IA_TOKEN;
});
