import { test } from 'node:test';
import assert from 'node:assert/strict';
import { criarLimitador, ipDoCliente } from '../src/lib/limite.ts';

test('bloqueia depois do máximo e libera quando a janela passa', () => {
  const limitado = criarLimitador({ janelaMs: 1000, max: 2 });
  assert.equal(limitado('ip', 0), false);
  assert.equal(limitado('ip', 10), false);
  assert.equal(limitado('ip', 20), true);
  assert.equal(limitado('outro', 20), false);
  assert.equal(limitado('ip', 1011), false);
});

test('limpa chaves vencidas quando o mapa enche', () => {
  const limitado = criarLimitador({ janelaMs: 100, max: 1, maxChaves: 2 });
  limitado('a', 0);
  limitado('b', 0);
  limitado('c', 500); // passa do tamanho: a e b vencidas saem
  assert.equal(limitado('a', 501), false);
});

test('ip: usa o último do x-forwarded-for, não o que o cliente inventou', () => {
  const h = new Headers({ 'x-forwarded-for': '1.1.1.1, 9.9.9.9' });
  assert.equal(ipDoCliente(h), '9.9.9.9');
});

test('ip: cai pro x-real-ip e depois pra "local"', () => {
  assert.equal(ipDoCliente(new Headers({ 'x-real-ip': ' 2.2.2.2 ' })), '2.2.2.2');
  assert.equal(ipDoCliente(new Headers()), 'local');
  assert.equal(ipDoCliente(new Headers({ 'x-forwarded-for': ' , ' })), 'local');
});
