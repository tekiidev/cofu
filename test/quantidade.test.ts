import { test } from 'node:test';
import assert from 'node:assert/strict';
import { ajustar, escalarPreco, passo } from '../src/lib/quantidade.ts';

test('passo do − e +: meio quilo, 100 gramas, uma unidade', () => {
  assert.equal(passo('kg'), 0.5);
  assert.equal(passo('g'), 100);
  assert.equal(passo('dz'), 1);
  assert.equal(passo(null), 1);
});

test('+ e −: preço acompanha, e não passa do mínimo', () => {
  assert.deepEqual(ajustar({ quantidade: 2, unidade: 'kg', preco: 12 }, 1), { quantidade: 2.5, preco: 15 });
  assert.deepEqual(ajustar({ quantidade: 3, unidade: null, preco: 9 }, -1), { quantidade: 2, preco: 6 });
  assert.equal(ajustar({ quantidade: 1, unidade: null, preco: 3 }, -1), null);
  assert.equal(ajustar({ quantidade: 0.5, unidade: 'kg', preco: 3 }, -1), null);
});

test('sem quantidade: + começa em 1, − não faz nada', () => {
  assert.deepEqual(ajustar({ quantidade: null, unidade: null, preco: 5 }, 1), { quantidade: 1, preco: 5 });
  assert.equal(ajustar({ quantidade: null, unidade: null, preco: 5 }, -1), null);
});

test('preço sem quantidade de referência fica igual', () => {
  assert.equal(escalarPreco(10, null, 3), 10);
  assert.equal(escalarPreco(null, 1, 3), null);
});
