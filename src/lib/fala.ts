import type { Item } from './items.ts';

/** Unidade como se fala, pra a voz do aparelho não ler "dz" ou "pct" letra por letra. */
const FALADA: Record<string, [string, string]> = {
  kg: ['quilo', 'quilos'],
  g: ['grama', 'gramas'],
  L: ['litro', 'litros'],
  ml: ['mililitro', 'mililitros'],
  un: ['unidade', 'unidades'],
  pct: ['pacote', 'pacotes'],
  cx: ['caixa', 'caixas'],
  dz: ['dúzia', 'dúzias'],
  lata: ['lata', 'latas'],
  garrafa: ['garrafa', 'garrafas'],
  maço: ['maço', 'maços'],
  bandeja: ['bandeja', 'bandejas'],
  vidro: ['vidro', 'vidros'],
  saco: ['saco', 'sacos'],
};

export function textoFalado(item: Pick<Item, 'nome' | 'quantidade' | 'unidade'>) {
  if (item.quantidade == null) return item.nome;
  const q = item.quantidade === 0.5 ? 'meio' : item.quantidade.toLocaleString('pt-BR');
  const par = item.unidade ? FALADA[item.unidade] : null;
  const unidade = par ? par[item.quantidade > 1 ? 1 : 0] : (item.unidade ?? '');
  return `${item.nome}, ${q}${unidade ? ` ${unidade}` : ''}`;
}

export function podeFalar() {
  return typeof window !== 'undefined' && 'speechSynthesis' in window;
}

/** Lê em voz alta com a voz do próprio aparelho (funciona sem internet na maioria dos celulares). */
export function falar(texto: string) {
  if (!podeFalar()) return;
  window.speechSynthesis.cancel();
  const fala = new SpeechSynthesisUtterance(texto);
  fala.lang = 'pt-BR';
  fala.rate = 0.9;
  window.speechSynthesis.speak(fala);
}
