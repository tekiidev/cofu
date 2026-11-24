/**
 * Gesto do microfone, no jeito do WhatsApp. Funções puras pra dar pra testar;
 * quem lê o dedo é o Gravador.
 */

/** Quanto arrastar pra esquerda (px) pra cancelar. */
export const CANCELAR_PX = 90;
/** Quanto arrastar pra cima (px) pra travar e soltar o dedo. */
export const TRAVAR_PX = 70;
/** Soltou antes disso (ms): foi um toque, não "segurar". Aí grava travado, com botões. */
export const TOQUE_MS = 350;

export type Movimento = { tipo: 'cancelar' } | { tipo: 'travar' } | { tipo: 'puxar'; x: number; y: number };

/**
 * O dedo andou (dx, dy) desde que tocou. Só conta pra esquerda e pra cima;
 * o botão segue só a direção que mais andou, como no WhatsApp.
 */
export function moverDedo(dx: number, dy: number): Movimento {
  const x = Math.min(0, dx);
  const y = Math.min(0, dy);
  if (x <= -CANCELAR_PX) return { tipo: 'cancelar' };
  if (y <= -TRAVAR_PX) return { tipo: 'travar' };
  return Math.abs(x) > Math.abs(y) ? { tipo: 'puxar', x, y: 0 } : { tipo: 'puxar', x: 0, y };
}

/**
 * Soltou o dedo depois de `ms`. Toque rápido ou microfone ainda abrindo: trava
 * (grava com botões na tela). Segurando de verdade: envia.
 */
export function soltarDedo(ms: number, estado: string): 'travar' | 'enviar' | 'nada' {
  if (ms < TOQUE_MS || estado === 'abrindo') return 'travar';
  if (estado === 'segurando') return 'enviar';
  return 'nada';
}

/** 0 a 1: o quanto já andou rumo a cancelar (texto some) ou travar (cadeado fecha). */
export function progressoGesto(x: number, y: number) {
  return {
    cancelar: Math.min(1, Math.max(0, -x / CANCELAR_PX)),
    travar: Math.min(1, Math.max(0, -y / TRAVAR_PX)),
  };
}
