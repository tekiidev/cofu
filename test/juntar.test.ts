import { test } from 'node:test';
import assert from 'node:assert/strict';
import { planejarJuntar } from '../src/lib/juntar.ts';
import type { ItemSugerido } from '../src/lib/items.ts';

const sug = (nome: string, quantidade: number | null, unidade: string | null, preco: number | null): ItemSugerido => ({
  nome,
  quantidade,
  unidade,
  preco,
  categoria: 'Mercearia',
});

test('mesmo nome e unidade na lista: soma quantidade e preço', () => {
  const atuais = [{ id: 'a', nome: 'Arroz', unidade: 'kg', quantidade: 2, preco: 12, estado: 'lista' as const }];
  const ops = planejarJuntar(atuais, [sug('arroz', 3, 'kg', 18)]);
  assert.deepEqual(ops, [{ tipo: 'somar', id: 'a', quantidade: 5, preco: 30 }]);
});

test('unidade diferente vira item novo', () => {
  const atuais = [{ id: 'a', nome: 'Arroz', unidade: 'kg', quantidade: 2, preco: 12, estado: 'lista' as const }];
  const ops = planejarJuntar(atuais, [sug('Arroz', 1, 'pacote', 6)]);
  assert.equal(ops.length, 1);
  assert.equal(ops[0]?.tipo, 'novo');
});

test('item que já está no cofo não recebe soma: entra de novo na lista', () => {
  const atuais = [{ id: 'a', nome: 'Café', unidade: null, quantidade: 1, preco: 15, estado: 'cofo' as const }];
  const ops = planejarJuntar(atuais, [sug('Café', 1, null, 15)]);
  assert.equal(ops[0]?.tipo, 'novo');
});

test('repetido no mesmo pedido vira uma linha só', () => {
  const ops = planejarJuntar([], [sug('Ovos', 12, 'un', 10), sug('ovos', 6, 'un', 5)]);
  assert.equal(ops.length, 1);
  const op = ops[0];
  assert.ok(op?.tipo === 'novo');
  assert.equal(op.item.quantidade, 18);
  assert.equal(op.item.preco, 15);
});

test('repetido no pedido e já na lista: uma soma só', () => {
  const atuais = [{ id: 'a', nome: 'Leite', unidade: 'l', quantidade: 1, preco: 5, estado: 'lista' as const }];
  const ops = planejarJuntar(atuais, [sug('Leite', 2, 'l', 10), sug('leite', 1, 'L', 5)]);
  assert.deepEqual(ops, [{ tipo: 'somar', id: 'a', quantidade: 4, preco: 20 }]);
});

test('sem quantidade de um lado: mantém a que existe', () => {
  const atuais = [{ id: 'a', nome: 'Sal', unidade: null, quantidade: null, preco: null, estado: 'lista' as const }];
  const ops = planejarJuntar(atuais, [sug('Sal', 1, null, 3)]);
  assert.deepEqual(ops, [{ tipo: 'somar', id: 'a', quantidade: 1, preco: 3 }]);
});
