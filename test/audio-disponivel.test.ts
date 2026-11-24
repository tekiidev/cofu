import { test } from 'node:test';
import assert from 'node:assert/strict';
import { GET } from '../src/app/api/audio/route.ts';

// Cada versão do app liga a IA de um jeito (URL e token, ou chave do modelo):
// o teste liga e desliga todas, pra valer em qualquer uma.
const VARIAVEIS = { COFU_IA_URL: 'http://ia.local', COFU_IA_TOKEN: 'x', GOOGLE_API_KEY: 'x' };

function semIA() {
  for (const nome of Object.keys(VARIAVEIS)) delete process.env[nome];
}

test('GET /api/audio: sem IA configurada, o microfone não manda áudio', async () => {
  semIA();
  const res = GET();
  assert.equal(res.headers.get('cache-control'), 'no-store');
  assert.deepEqual(await res.json(), { disponivel: false });
});

test('GET /api/audio: com a IA configurada, o áudio vai direto pra ela', async () => {
  Object.assign(process.env, VARIAVEIS);
  try {
    assert.deepEqual(await GET().json(), { disponivel: true });
  } finally {
    semIA();
  }
});
