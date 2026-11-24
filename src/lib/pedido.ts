/**
 * Pedido que chega pelo link de abertura do app:
 * - /?texto=2kg de arroz e café   monta a lista direto (atalho da Siri, links)
 * - /?falar=1                     abre com o microfone ligado
 * - /?modo=figuras                abre no modo figuras
 * - /?title=..&text=..&url=..     o que o Android manda ao compartilhar com o Cofu
 */

export type Pedido = { texto: string | null; falar: boolean; modo: 'lista' | 'figuras' | null };

const MAX_TEXTO = 1200;

export function lerPedido(params: URLSearchParams): Pedido {
  // Compartilhar costuma mandar o conteúdo em "text"; alguns apps só preenchem "title".
  const partes = [params.get('texto'), params.get('text') || params.get('title')]
    .map((p) => p?.trim())
    .filter((p): p is string => Boolean(p));
  const texto = partes.length ? partes[0].slice(0, MAX_TEXTO) : null;

  const modo = params.get('modo');
  return {
    texto,
    falar: !texto && ['1', 'sim', 'true'].includes(params.get('falar') ?? ''),
    modo: modo === 'figuras' || modo === 'lista' ? modo : null,
  };
}

export function temPedido(p: Pedido) {
  return Boolean(p.texto || p.falar || p.modo);
}
