import { test } from 'node:test';
import assert from 'node:assert/strict';
import { comparacao, situacao } from '../src/lib/money.ts';

const itens = [
  { preco: 30, estado: 'cofo' as const },
  { preco: 20, estado: 'lista' as const },
  { preco: 99, estado: 'casa' as const },
  { preco: null, estado: 'cofo' as const },
];

test('sem orçamento e todos com preço: progresso é o valor que já está no cofo', () => {
  const comPreco = itens.filter((i) => i.preco != null);
  const s = situacao(comPreco, null);
  assert.equal(s.noCofo, 30);
  assert.equal(s.totalLista, 50);
  assert.equal(s.progresso, 0.6);
  assert.equal(s.estourou, false);
});

test('sem orçamento e algum sem preço: progresso é quantos itens já estão no cofo', () => {
  // 2 no cofo de 3 na feira (o de casa não conta), mesmo com um sem preço.
  assert.equal(situacao(itens, null).progresso, 2 / 3);
});

test('lista falada sem nenhum preço enche um pedaço por item', () => {
  const semPreco = [
    { preco: null, estado: 'cofo' as const },
    { preco: null, estado: 'lista' as const },
    { preco: null, estado: 'lista' as const },
    { preco: null, estado: 'lista' as const },
  ];
  assert.equal(situacao(semPreco, null).progresso, 0.25);
  assert.equal(situacao([], null).progresso, 0);
});

test('dentro do orçamento mostra quanto ainda cabe', () => {
  const s = situacao(itens, 100);
  assert.equal(s.estourou, false);
  assert.match(s.mensagem, /Ainda cabem R\$\s?70,00/);
  assert.match(s.mensagem, /5 kg de frango/);
});

test('passou do orçamento: estourou e mensagem concreta', () => {
  const s = situacao(itens, 20);
  assert.equal(s.estourou, true);
  assert.ok(s.progresso > 1);
  assert.match(s.mensagem, /Passou R\$\s?10,00/);
});

test('comparação só aparece quando dá pelo menos 1 unidade', () => {
  assert.equal(comparacao(5), null);
  assert.equal(comparacao(26), 'uns 2 kg de frango');
});
