import { test } from 'node:test';
import assert from 'node:assert/strict';
import { lerPedido, temPedido } from '../src/lib/pedido.ts';

const ler = (q: string) => lerPedido(new URLSearchParams(q));

test('texto no link monta a lista', () => {
  assert.deepEqual(ler('texto=2%20kg%20de%20arroz%20e%20caf%C3%A9'), { texto: '2 kg de arroz e café', falar: false, modo: null });
});

test('compartilhar do Android: usa text, e title quando não tem text', () => {
  assert.equal(ler('title=Recado&text=p%C3%A3o%20e%20leite').texto, 'pão e leite');
  assert.equal(ler('title=p%C3%A3o%20e%20leite&text=').texto, 'pão e leite');
});

test('falar=1 liga o microfone, mas não quando já veio texto', () => {
  assert.equal(ler('falar=1').falar, true);
  assert.equal(ler('falar=1&texto=arroz').falar, false);
});

test('modo só aceita valores conhecidos', () => {
  assert.equal(ler('modo=figuras').modo, 'figuras');
  assert.equal(ler('modo=xyz').modo, null);
});

test('sem nada no link não é pedido', () => {
  assert.equal(temPedido(ler('')), false);
  assert.equal(temPedido(ler('texto=%20%20')), false);
});

test('texto longo é cortado no limite da rota', () => {
  assert.equal(ler(`texto=${'a'.repeat(2000)}`).texto?.length, 1200);
});
