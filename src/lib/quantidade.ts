import type { Item } from './items.ts';

/** De quanto em quanto o − e o + mudam: meio quilo, 100 gramas, uma unidade. */
export function passo(unidade: string | null) {
  if (unidade === 'kg' || unidade === 'L') return 0.5;
  if (unidade === 'g' || unidade === 'ml') return 100;
  return 1;
}

function arredondar(n: number, casas = 2) {
  const f = 10 ** casas;
  return Math.round(n * f) / f;
}

/**
 * O preço guardado é o da linha inteira: muda junto com a quantidade
 * (2 kg a R$ 12 virando 3 kg dá R$ 18). Sem as duas quantidades, mantém.
 */
export function escalarPreco(preco: number | null, antes: number | null, depois: number | null) {
  if (preco == null || !antes || !depois) return preco;
  return arredondar((preco * depois) / antes);
}

/** Um toque no − ou no +. null quando não muda (já está no mínimo). */
export function ajustar(
  item: Pick<Item, 'quantidade' | 'unidade' | 'preco'>,
  direcao: 1 | -1,
): { quantidade: number; preco: number | null } | null {
  const p = passo(item.unidade);
  if (item.quantidade == null) {
    if (direcao < 0) return null;
    return { quantidade: p >= 100 ? p : 1, preco: item.preco };
  }
  const nova = arredondar(item.quantidade + direcao * p, 3);
  if (nova <= 0) return null;
  return { quantidade: nova, preco: escalarPreco(item.preco, item.quantidade, nova) };
}
