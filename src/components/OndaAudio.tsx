'use client';

import { useEffect, useRef, useState } from 'react';
import { nivel, PASSO_MS, resumir, ultimas } from '@/lib/onda.ts';

/**
 * Lê o volume do microfone enquanto `ativo` (pausado congela) e devolve o histórico
 * de níveis, um a cada PASSO_MS. Tudo no aparelho: o som não sai daqui.
 * Recomeça do zero a cada gravação nova (fluxo novo).
 */
export function useNiveisMicrofone(fluxo: MediaStream | null, ativo: boolean): number[] {
  const [niveis, setNiveis] = useState<number[]>([]);
  const analisador = useRef<AnalyserNode | null>(null);

  useEffect(() => {
    setNiveis([]);
    if (!fluxo) return;
    const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
    const Contexto = w.AudioContext || w.webkitAudioContext;
    if (!Contexto) return;
    let ctx: AudioContext;
    try {
      ctx = new Contexto();
      const a = ctx.createAnalyser();
      a.fftSize = 512;
      ctx.createMediaStreamSource(fluxo).connect(a);
      // No iPhone o contexto pode nascer suspenso (criado fora do toque).
      ctx.resume().catch(() => {});
      analisador.current = a;
    } catch {
      // Sem onda: a gravação continua igual.
      return;
    }
    return () => {
      analisador.current = null;
      ctx.close().catch(() => {});
    };
  }, [fluxo]);

  useEffect(() => {
    if (!ativo) return;
    const id = setInterval(() => {
      const a = analisador.current;
      if (!a) return;
      const amostras = new Uint8Array(a.fftSize);
      a.getByteTimeDomainData(amostras);
      setNiveis((n) => [...n, nivel(amostras)]);
    }, PASSO_MS);
    return () => clearInterval(id);
  }, [ativo, fluxo]);

  return niveis;
}

type Props = {
  niveis: readonly number[];
  /** Quantas barras cabem. */
  barras?: number;
  /** Ao vivo: mostra as últimas e corre pra esquerda. Senão: o áudio inteiro resumido. */
  aoVivo?: boolean;
  /** 0 a 1: pinta as barras já tocadas (ouvir antes de enviar). */
  progresso?: number;
  className?: string;
};

const LARGURA = 3;
const ESPACO = 2.5;
const ALTURA = 28;

/** As barras da onda, na cor do texto (currentColor). Decorativa: o tempo é lido à parte. */
export function Onda({ niveis, barras = 32, aoVivo = false, progresso, className = '' }: Props) {
  const valores = aoVivo ? ultimas(niveis, barras) : resumir(niveis, barras);
  const passo = LARGURA + ESPACO;
  return (
    <svg
      viewBox={`0 0 ${barras * passo - ESPACO} ${ALTURA}`}
      preserveAspectRatio="none"
      aria-hidden="true"
      className={`onda h-7 ${className}`}
    >
      {valores.map((v, i) => {
        const h = Math.max(LARGURA, v * ALTURA);
        const tocada = progresso != null && i / barras < progresso;
        return (
          <rect
            key={i}
            x={i * passo}
            y={(ALTURA - h) / 2}
            width={LARGURA}
            height={h}
            rx={LARGURA / 2}
            fill="currentColor"
            opacity={progresso == null || tocada ? 1 : 0.35}
          />
        );
      })}
    </svg>
  );
}
