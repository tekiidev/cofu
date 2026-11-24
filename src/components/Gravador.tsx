'use client';

import { useEffect, useRef, useState } from 'react';
import { guardarAudio } from '@/lib/db.ts';
import { MAX_SEGUNDOS, paraWav } from '@/lib/wav.ts';

export function podeGravar() {
  return typeof window !== 'undefined' && 'MediaRecorder' in window && Boolean(navigator.mediaDevices?.getUserMedia);
}

type Props = {
  /** Áudio guardado na fila do aparelho. */
  onGuardado: (segundos: number) => void;
  onErro: (mensagem: string) => void;
};

function relogio(s: number) {
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

/**
 * Grava a lista falada sem precisar de internet. O áudio vira WAV no celular e
 * fica guardado; quando a conexão volta, a IA monta a lista (src/lib/fila.ts).
 */
export function Gravador({ onGuardado, onErro }: Props) {
  const [estado, setEstado] = useState<'parado' | 'abrindo' | 'gravando' | 'guardando'>('parado');
  const [segundos, setSegundos] = useState(0);
  const gravador = useRef<MediaRecorder | null>(null);
  const relogioId = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(
    () => () => {
      if (relogioId.current) clearInterval(relogioId.current);
      if (gravador.current?.state === 'recording') gravador.current.stop();
    },
    [],
  );

  async function comecar() {
    // Abrir o microfone demora um pouco: só mostra "Gravando" quando já está gravando,
    // senão a pessoa começa a falar antes e perde as primeiras palavras.
    setEstado('abrindo');
    let fluxo: MediaStream;
    try {
      fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setEstado('parado');
      onErro('O Cofu precisa de permissão pro microfone. Libere nas configurações do navegador.');
      return;
    }
    const pedacos: Blob[] = [];
    const r = new MediaRecorder(fluxo);
    r.ondataavailable = (e) => {
      if (e.data.size) pedacos.push(e.data);
    };
    r.onstop = async () => {
      fluxo.getTracks().forEach((t) => t.stop());
      if (relogioId.current) clearInterval(relogioId.current);
      setEstado('guardando');
      try {
        const { wav, segundos: duracao } = await paraWav(new Blob(pedacos, { type: r.mimeType }));
        if (duracao < 0.5) onErro('Áudio curto demais. Toque, fale os itens e toque de novo pra terminar.');
        else {
          await guardarAudio(wav, duracao);
          onGuardado(duracao);
        }
      } catch {
        onErro('Não deu pra guardar o áudio. Tente de novo.');
      } finally {
        setEstado('parado');
        setSegundos(0);
      }
    };
    r.onstart = () => {
      setEstado('gravando');
      const inicio = Date.now();
      relogioId.current = setInterval(() => {
        const s = (Date.now() - inicio) / 1000;
        setSegundos(s);
        if (s >= MAX_SEGUNDOS && r.state === 'recording') r.stop();
      }, 250);
    };
    gravador.current = r;
    r.start();
  }

  function alternar() {
    if (estado === 'gravando') gravador.current?.stop();
    else if (estado === 'parado') comecar();
  }

  const gravando = estado === 'gravando';
  return (
    <>
      <button
        type="button"
        onClick={alternar}
        disabled={estado === 'guardando' || estado === 'abrindo'}
        aria-pressed={gravando}
        aria-label={gravando ? 'Terminar gravação' : 'Gravar a lista'}
        className={`flex h-16 w-16 shrink-0 items-center justify-center rounded-full text-areia shadow-md transition disabled:opacity-50 ${
          gravando ? 'bg-terracota' : 'bg-folha'
        }`}
      >
        {gravando ? (
          <svg viewBox="0 0 24 24" className="h-7 w-7" fill="currentColor" aria-hidden="true">
            <rect x="6" y="6" width="12" height="12" rx="2.5" />
          </svg>
        ) : (
          <svg viewBox="0 0 24 24" className="h-8 w-8" fill="currentColor" aria-hidden="true">
            <path d="M12 15a3 3 0 0 0 3-3V6a3 3 0 1 0-6 0v6a3 3 0 0 0 3 3Zm5-3a5 5 0 0 1-10 0H5a7 7 0 0 0 6 6.92V21h2v-2.08A7 7 0 0 0 19 12h-2Z" />
          </svg>
        )}
      </button>
      {gravando && (
        <p className="sr-only" aria-live="polite">
          Gravando. Toque de novo pra terminar.
        </p>
      )}
      {estado !== 'parado' && (
        <span className="order-last basis-full text-base text-terracota">
          {estado === 'abrindo'
            ? 'Preparando o microfone… espere aparecer "Gravando".'
            : gravando
              ? `Gravando ${relogio(segundos)} de ${relogio(MAX_SEGUNDOS)}. Fale os itens e toque de novo pra terminar.`
              : 'Guardando o áudio…'}
        </span>
      )}
    </>
  );
}
