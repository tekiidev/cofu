import type { Item, ItemSugerido } from './items.ts';

type Atual = Pick<Item, 'id' | 'nome' | 'unidade' | 'quantidade' | 'preco' | 'estado'>;

export type Operacao =
  | { tipo: 'somar'; id: string; quantidade: number | null; preco: number | null }
  | { tipo: 'novo'; item: ItemSugerido; ordem: number };

function soma(a: number | null, b: number | null) {
  return a != null && b != null ? a + b : (a ?? b);
}

function chave(i: Pick<Item, 'nome' | 'unidade'>) {
  return `${i.nome.trim().toLowerCase()}|${i.unidade?.trim().toLowerCase() ?? ''}`;
}

/**
 * Decide o que fazer com cada item sugerido: se já tem um igual na lista
 * (mesmo nome e unidade, ainda não foi pro cofo), soma quantidade e preço;
 * se não, vira item novo. Itens repetidos no mesmo pedido também se juntam.
 */
export function planejarJuntar(atuais: Atual[], sugeridos: ItemSugerido[]): Operacao[] {
  const naLista = new Map<string, { id: string; quantidade: number | null; preco: number | null }>();
  for (const a of atuais) if (a.estado === 'lista') naLista.set(chave(a), { id: a.id, quantidade: a.quantidade, preco: a.preco });

  const novos = new Map<string, Extract<Operacao, { tipo: 'novo' }>>();
  const somas = new Map<string, Extract<Operacao, { tipo: 'somar' }>>();
  const ops: Operacao[] = [];

  for (const [i, s] of sugeridos.entries()) {
    const k = chave(s);
    const existente = naLista.get(k);
    if (existente) {
      const op = somas.get(existente.id) ?? { tipo: 'somar', id: existente.id, quantidade: existente.quantidade, preco: existente.preco };
      op.quantidade = soma(op.quantidade, s.quantidade);
      op.preco = soma(op.preco, s.preco);
      if (!somas.has(existente.id)) {
        somas.set(existente.id, op);
        ops.push(op);
      }
      continue;
    }
    const jaNovo = novos.get(k);
    if (jaNovo) {
      jaNovo.item = { ...jaNovo.item, quantidade: soma(jaNovo.item.quantidade, s.quantidade), preco: soma(jaNovo.item.preco, s.preco) };
      continue;
    }
    const op = { tipo: 'novo' as const, item: s, ordem: i };
    novos.set(k, op);
    ops.push(op);
  }
  return ops;
}
