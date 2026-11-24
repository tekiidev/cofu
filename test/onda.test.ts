import { test } from 'node:test';
import assert from 'node:assert/strict';
import { nivel, resumir, ultimas } from '../src/lib/onda.ts';

const onda = (amplitude: number, n = 256) =>
  Uint8Array.from({ length: n }, (_, i) => Math.round(128 + amplitude * 127 * Math.sin((i / n) * Math.PI * 8)));

test('silêncio e chiado baixinho ficam em 0', () => {
  assert.equal(nivel(new Uint8Array(256).fill(128)), 0);
  assert.equal(nivel(onda(0.01)), 0);
  assert.equal(nivel(new Uint8Array(0)), 0);
});

test('voz mais alta dá barra maior, sem passar de 1', () => {
  const baixa = nivel(onda(0.05));
  const normal = nivel(onda(0.15));
  const grito = nivel(onda(1));
  assert.ok(baixa > 0);
  assert.ok(normal > baixa);
  assert.ok(grito >= normal);
  assert.ok(grito <= 1);
});

test('onda ao vivo: últimas barras, completando com zeros na esquerda', () => {
  assert.deepEqual(ultimas([0.5, 0.7], 4), [0, 0, 0.5, 0.7]);
  assert.deepEqual(ultimas([0.1, 0.2, 0.3, 0.4, 0.5], 3), [0.3, 0.4, 0.5]);
  assert.deepEqual(ultimas([0.1], 0), []);
});

test('onda do áudio inteiro: pico de cada pedaço, sempre do tamanho pedido', () => {
  assert.deepEqual(resumir([0.1, 0.9, 0.2, 0.3], 2), [0.9, 0.3]);
  assert.deepEqual(resumir([0.4, 0.8], 4), [0.4, 0.4, 0.8, 0.8]);
  assert.deepEqual(resumir([], 3), [0, 0, 0]);
  const longa = Array.from({ length: 1000 }, (_, i) => (i === 500 ? 1 : 0.1));
  const r = resumir(longa, 40);
  assert.equal(r.length, 40);
  assert.ok(r.includes(1), 'uma palavra curta não some no resumo');
});
