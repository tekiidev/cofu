/**
 * Onda do áudio: o quanto a voz está alta, em barras de 0 a 1.
 * Funções puras (sem navegador) pra dar pra testar; quem lê o microfone é OndaAudio.tsx.
 */

/** A cada quantos ms entra uma barra nova na onda ao vivo. */
export const PASSO_MS = 90;

// Fala normal no celular fica com RMS ~0,05–0,2: o ganho leva isso pra perto de 1.
const GANHO = 5;
// Abaixo disso é chiado do ambiente, não voz.
const PISO = 0.02;

/**
 * Nível de 0 a 1 de um trecho do microfone (getByteTimeDomainData: bytes 0–255, silêncio = 128).
 * Raiz do RMS com ganho: voz baixa ainda aparece e grito não estoura tudo.
 */
export function nivel(amostras: Uint8Array): number {
  if (!amostras.length) return 0;
  let soma = 0;
  for (let i = 0; i < amostras.length; i += 1) {
    const v = (amostras[i] - 128) / 128;
    soma += v * v;
  }
  const rms = Math.sqrt(soma / amostras.length);
  if (rms < PISO) return 0;
  return Math.min(1, Math.sqrt(rms * GANHO));
}

/**
 * Últimas `quantas` barras pra onda ao vivo, que corre da direita pra esquerda.
 * Se ainda tem pouco áudio, completa com zeros na esquerda (pontinhos).
 */
export function ultimas(niveis: readonly number[], quantas: number): number[] {
  if (quantas <= 0) return [];
  const fim = niveis.slice(-quantas);
  return [...Array(quantas - fim.length).fill(0), ...fim];
}

/**
 * Onda do áudio inteiro em `quantas` barras (pra ouvir antes de enviar).
 * Cada barra é o pico do pedaço que ela cobre, pra uma palavra curta não sumir.
 */
export function resumir(niveis: readonly number[], quantas: number): number[] {
  if (quantas <= 0) return [];
  if (!niveis.length) return Array(quantas).fill(0);
  if (niveis.length <= quantas) {
    // Pouco áudio: estica repetindo, pra onda ocupar a barra toda.
    return Array.from({ length: quantas }, (_, i) => niveis[Math.floor((i * niveis.length) / quantas)]);
  }
  return Array.from({ length: quantas }, (_, i) => {
    const ini = Math.floor((i * niveis.length) / quantas);
    const fim = Math.floor(((i + 1) * niveis.length) / quantas);
    let pico = 0;
    for (let j = ini; j < fim; j += 1) pico = Math.max(pico, niveis[j]);
    return pico;
  });
}
