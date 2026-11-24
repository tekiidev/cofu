import { test } from 'node:test';
import assert from 'node:assert/strict';
import { CANCELAR_PX, moverDedo, progressoGesto, soltarDedo, TOQUE_MS, TRAVAR_PX } from '../src/lib/gesto.ts';

test('arrastar bastante pra esquerda cancela; pra cima trava', () => {
  assert.deepEqual(moverDedo(-CANCELAR_PX, 0), { tipo: 'cancelar' });
  assert.deepEqual(moverDedo(-10, -TRAVAR_PX), { tipo: 'travar' });
});

test('no meio do caminho o botão segue só a direção que mais andou', () => {
  assert.deepEqual(moverDedo(-40, -10), { tipo: 'puxar', x: -40, y: 0 });
  assert.deepEqual(moverDedo(-10, -40), { tipo: 'puxar', x: 0, y: -40 });
});

test('pra direita e pra baixo não contam', () => {
  assert.deepEqual(moverDedo(200, 200), { tipo: 'puxar', x: 0, y: 0 });
});

test('soltar: toque rápido ou microfone abrindo trava; segurando envia', () => {
  assert.equal(soltarDedo(TOQUE_MS - 1, 'segurando'), 'travar');
  assert.equal(soltarDedo(2000, 'abrindo'), 'travar');
  assert.equal(soltarDedo(2000, 'segurando'), 'enviar');
  assert.equal(soltarDedo(2000, 'parado'), 'nada');
});

test('progresso do gesto vai de 0 a 1', () => {
  assert.deepEqual(progressoGesto(0, 0), { cancelar: 0, travar: 0 });
  assert.deepEqual(progressoGesto(-CANCELAR_PX / 2, -TRAVAR_PX), { cancelar: 0.5, travar: 1 });
  assert.deepEqual(progressoGesto(-999, 50), { cancelar: 1, travar: 0 });
});
