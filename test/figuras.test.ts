import { test } from 'node:test';
import assert from 'node:assert/strict';
import { FIGURAS, PALETA, figuraDoItem, retangulos } from '../src/lib/figuras.ts';
import { textoFalado } from '../src/lib/fala.ts';

test('toda figura é 12x12 e só usa cores da paleta', () => {
  for (const [nome, linhas] of Object.entries(FIGURAS)) {
    assert.equal(linhas.length, 12, `${nome}: número de linhas`);
    linhas.forEach((l, i) => {
      assert.equal(l.length, 12, `${nome}: linha ${i + 1} com ${l.length} colunas`);
      for (const ch of l) assert.ok(ch === '.' || ch in PALETA, `${nome}: cor "${ch}" fora da paleta`);
    });
  }
});

test('acha a figura pelo nome, sem acento e no plural', () => {
  assert.equal(figuraDoItem('Feijão carioca', 'Mercearia'), 'feijao');
  assert.equal(figuraDoItem('Ovos', 'Laticínios e ovos'), 'ovo');
  assert.equal(figuraDoItem('Pães', 'Padaria'), 'pao');
});

test('frase mais longa ganha: água sanitária não é água', () => {
  assert.equal(figuraDoItem('Água sanitária', 'Limpeza'), 'detergente');
  assert.equal(figuraDoItem('Leite em pó', 'Mercearia'), 'saco');
  assert.equal(figuraDoItem('Leite', 'Laticínios e ovos'), 'leite');
});

test('sem figura própria usa a da categoria', () => {
  assert.equal(figuraDoItem('Macaxeira', 'Hortifrúti'), 'cenoura');
  assert.equal(figuraDoItem('Pilha', 'Outros'), 'caixa');
});

test('retângulos juntam pixels iguais vizinhos', () => {
  assert.deepEqual(retangulos(['.kk.', 'kwwk']), [
    { x: 1, y: 0, w: 2, cor: 'k' },
    { x: 0, y: 1, w: 1, cor: 'k' },
    { x: 1, y: 1, w: 2, cor: 'w' },
    { x: 3, y: 1, w: 1, cor: 'k' },
  ]);
});

test('fala a unidade por extenso', () => {
  assert.equal(textoFalado({ nome: 'Arroz', quantidade: 2, unidade: 'kg' }), 'Arroz, 2 quilos');
  assert.equal(textoFalado({ nome: 'Ovos', quantidade: 1, unidade: 'dz' }), 'Ovos, 1 dúzia');
  assert.equal(textoFalado({ nome: 'Queijo', quantidade: 0.5, unidade: 'kg' }), 'Queijo, meio quilo');
  assert.equal(textoFalado({ nome: 'Café', quantidade: null, unidade: null }), 'Café');
});
