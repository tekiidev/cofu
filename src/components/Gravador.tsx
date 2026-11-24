'use client';

import { useEffect, useRef, useState } from 'react';
import { IconeEnviar, IconeLixeira, IconeMicrofone, IconePausar, IconeSubir, IconeTocar } from '@/components/Icones.tsx';
import { Onda, useNiveisMicrofone } from '@/components/OndaAudio.tsx';
import { guardarAudio } from '@/lib/db.ts';
import { moverDedo, progressoGesto, soltarDedo } from '@/lib/gesto.ts';
import { MAX_SEGUNDOS, paraWav } from '@/lib/wav.ts';

export function podeGravar() {
  return typeof window !== 'undefined' && 'MediaRecorder' in window && Boolean(navigator.mediaDevices?.getUserMedia);
}

/** O navegador só libera o microfone em https (ou localhost). Ex.: abrir pelo IP da rede no celular. */
export function microfoneBloqueadoSemHttps() {
  return typeof window !== 'undefined' && !window.isSecureContext;
}

type Props = {
  /** Áudio guardado na fila do aparelho. */
  onGuardado: (segundos: number) => void;
  onErro: (mensagem: string) => void;
};

/**
 * parado → abrindo (microfone abrindo) → segurando (dedo no botão) ou travado (mãos livres)
 * travado ⇄ pausado. De qualquer um: enviar (guardando) ou cancelar (volta a parado).
 */
type Estado = 'parado' | 'abrindo' | 'segurando' | 'travado' | 'pausado' | 'guardando' | 'apagando';

/** Tempo da animação do microfone caindo na lixeira (ms). */
const APAGAR_MS = 900;

function semAnimacao() {
  return typeof window !== 'undefined' && window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
}


function relogio(s: number) {
  const t = Math.floor(s);
  return `${Math.floor(t / 60)}:${String(t % 60).padStart(2, '0')}`;
}

function vibrar() {
  try {
    navigator.vibrate?.(25);
  } catch {
    // Sem vibração (iPhone): tudo bem.
  }
}

/**
 * Grava a lista falada sem precisar de internet, no jeito do WhatsApp:
 * - segure o microfone e fale; solte pra enviar;
 * - arraste pra esquerda pra cancelar, ou pra cima pra travar e soltar o dedo;
 * - travado dá pra pausar, continuar, apagar ou enviar.
 * Um toque simples (ou teclado) já começa travado: segurar nunca é o único jeito.
 * O áudio vira WAV no celular e fica guardado; quando a conexão volta, a IA monta a lista (src/lib/fila.ts).
 */
export function Gravador({ onGuardado, onErro }: Props) {
  const [estado, setEstadoTela] = useState<Estado>('parado');
  // Os eventos do gravador e do dedo leem o estado na hora, sem esperar o React.
  const estadoAgora = useRef<Estado>('parado');
  const setEstado = (e: Estado) => {
    estadoAgora.current = e;
    setEstadoTela(e);
  };
  const [segundos, setSegundos] = useState(0);
  const [puxao, setPuxao] = useState({ x: 0, y: 0 });
  // Microfone aberto, pra desenhar a onda; o histórico de níveis serve pra onda do áudio inteiro.
  const [fluxo, setFluxo] = useState<MediaStream | null>(null);
  const niveis = useNiveisMicrofone(fluxo, estado === 'segurando' || estado === 'travado');
  const gravador = useRef<MediaRecorder | null>(null);
  const relogioId = useRef<ReturnType<typeof setInterval> | null>(null);
  // Tempo gravado: o que já foi antes da pausa + o trecho atual (desde = 0 quando pausado).
  const tempo = useRef({ acumulado: 0, desde: 0 });
  const dedo = useRef<{ id: number; x: number; y: number; t: number } | null>(null);
  const descartar = useRef(false);
  const travarAoComecar = useRef(false);
  const ignorarClique = useRef(false);
  // Ouvir antes de enviar: pedaços gravados até agora, o áudio montado com eles e o play.
  const pedacosAteAgora = useRef<Blob[]>([]);
  const querPrevia = useRef(false);
  const tocador = useRef<HTMLAudioElement | null>(null);
  const [previa, setPrevia] = useState<string | null>(null);
  const [tocando, setTocando] = useState(false);
  const [tocado, setTocado] = useState(0);

  useEffect(
    () => () => {
      if (relogioId.current) clearInterval(relogioId.current);
      if (gravador.current && gravador.current.state !== 'inactive') gravador.current.stop();
    },
    [],
  );

  function decorrido() {
    const t = tempo.current;
    return (t.acumulado + (t.desde ? Date.now() - t.desde : 0)) / 1000;
  }

  async function comecar(travado: boolean) {
    // Abrir o microfone demora um pouco: só mostra "Gravando" quando já está gravando,
    // senão a pessoa começa a falar antes e perde as primeiras palavras.
    setEstado('abrindo');
    travarAoComecar.current = travado;
    descartar.current = false;
    let fluxo: MediaStream;
    try {
      fluxo = await navigator.mediaDevices.getUserMedia({ audio: true });
    } catch {
      setEstado('parado');
      onErro('O Cofu precisa de permissão pro microfone. Libere nas configurações do navegador.');
      return;
    }
    // Cancelou enquanto o microfone abria.
    if (estadoAgora.current !== 'abrindo') {
      fluxo.getTracks().forEach((t) => t.stop());
      return;
    }
    const pedacos: Blob[] = [];
    pedacosAteAgora.current = pedacos;
    const r = new MediaRecorder(fluxo);
    r.ondataavailable = (e) => {
      if (e.data.size) pedacos.push(e.data);
      // Pausou: monta o que já foi gravado pra dar play (o gravador continua o mesmo).
      if (querPrevia.current && r.state === 'paused') {
        querPrevia.current = false;
        setPrevia(URL.createObjectURL(new Blob(pedacos, { type: r.mimeType })));
      }
    };
    r.onstop = async () => {
      fecharPrevia();
      fluxo.getTracks().forEach((t) => t.stop());
      setFluxo(null);
      if (relogioId.current) clearInterval(relogioId.current);
      setSegundos(0);
      if (descartar.current) {
        // Microfone cai na lixeira e só depois volta ao normal.
        if (semAnimacao()) setEstado('parado');
        else {
          setEstado('apagando');
          setTimeout(() => {
            if (estadoAgora.current === 'apagando') setEstado('parado');
          }, APAGAR_MS);
        }
        return;
      }
      setEstado('guardando');
      try {
        const { wav, segundos: duracao } = await paraWav(new Blob(pedacos, { type: r.mimeType }));
        if (duracao < 0.5) onErro('Áudio curto demais. Segure o microfone enquanto fala os itens.');
        else {
          await guardarAudio(wav, duracao);
          onGuardado(duracao);
        }
      } catch (erro) {
        console.error('[Gravador] falhou ao converter/guardar o áudio', erro, { mimeType: r.mimeType, pedacos: pedacos.length });
        onErro('Não deu pra guardar o áudio. Tente de novo.');
      } finally {
        setEstado('parado');
      }
    };
    r.onstart = () => {
      setFluxo(fluxo);
      tempo.current = { acumulado: 0, desde: Date.now() };
      setEstado(travarAoComecar.current ? 'travado' : 'segurando');
      vibrar();
      relogioId.current = setInterval(() => {
        const s = decorrido();
        setSegundos(s);
        if (s >= MAX_SEGUNDOS && r.state !== 'inactive') r.stop();
      }, 250);
    };
    gravador.current = r;
    r.start();
  }

  function travar() {
    if (estadoAgora.current === 'abrindo') travarAoComecar.current = true;
    else if (estadoAgora.current === 'segurando') {
      setEstado('travado');
      vibrar();
    }
  }

  function parar() {
    const r = gravador.current;
    if (r && r.state !== 'inactive') r.stop();
  }

  function enviar() {
    vibrar();
    parar();
  }

  function cancelar() {
    descartar.current = true;
    setPuxao({ x: 0, y: 0 });
    if (estadoAgora.current === 'abrindo') setEstado('parado');
    else parar(); // o onstop vê o descartar e joga fora
    vibrar();
  }

  function pausar() {
    const r = gravador.current;
    if (!r || r.state !== 'recording') return;
    r.pause();
    tempo.current = { acumulado: tempo.current.acumulado + Date.now() - tempo.current.desde, desde: 0 };
    setEstado('pausado');
    // Pede o que já foi gravado; chega no ondataavailable e vira o áudio pra ouvir.
    querPrevia.current = true;
    try {
      r.requestData();
    } catch {
      querPrevia.current = false;
    }
  }

  function fecharPrevia() {
    querPrevia.current = false;
    tocador.current?.pause();
    setTocando(false);
    setTocado(0);
    setPrevia((url) => {
      if (url) URL.revokeObjectURL(url);
      return null;
    });
  }

  function tocarOuParar() {
    const a = tocador.current;
    if (!a) return;
    if (tocando) {
      a.pause();
      setTocando(false);
      return;
    }
    if (a.ended || tocado >= 1) a.currentTime = 0;
    a.play()
      .then(() => setTocando(true))
      .catch(() => fecharPrevia());
  }

  function continuar() {
    const r = gravador.current;
    if (!r || r.state !== 'paused') return;
    fecharPrevia();
    r.resume();
    tempo.current = { ...tempo.current, desde: Date.now() };
    setEstado('travado');
  }

  function aoDescer(e: React.PointerEvent<HTMLButtonElement>) {
    if (e.button !== 0 || estadoAgora.current !== 'parado') return;
    e.currentTarget.setPointerCapture(e.pointerId);
    dedo.current = { id: e.pointerId, x: e.clientX, y: e.clientY, t: Date.now() };
    ignorarClique.current = true;
    setPuxao({ x: 0, y: 0 });
    comecar(false);
  }

  function aoMover(e: React.PointerEvent) {
    const d = dedo.current;
    if (!d || d.id !== e.pointerId) return;
    const m = moverDedo(e.clientX - d.x, e.clientY - d.y);
    if (m.tipo === 'cancelar') {
      dedo.current = null;
      cancelar();
    } else if (m.tipo === 'travar') {
      dedo.current = null;
      setPuxao({ x: 0, y: 0 });
      travar();
    } else setPuxao({ x: m.x, y: m.y });
  }

  function aoSoltar(e: React.PointerEvent) {
    const d = dedo.current;
    if (!d || d.id !== e.pointerId) return;
    dedo.current = null;
    setPuxao({ x: 0, y: 0 });
    const acao = soltarDedo(Date.now() - d.t, estadoAgora.current);
    if (acao === 'travar') travar();
    else if (acao === 'enviar') enviar();
  }

  function aoPerderDedo(e: React.PointerEvent) {
    // O navegador tomou o toque (rolagem, notificação): trava em vez de perder o áudio.
    const d = dedo.current;
    if (!d || d.id !== e.pointerId) return;
    dedo.current = null;
    setPuxao({ x: 0, y: 0 });
    travar();
  }

  const segurando = estado === 'segurando';
  const travado = estado === 'travado' || estado === 'pausado';
  const pausado = estado === 'pausado';
  const gesto = progressoGesto(puxao.x, puxao.y);
  const volume = niveis.length ? niveis[niveis.length - 1] : 0;
  const podePausar = typeof MediaRecorder !== 'undefined' && 'pause' in MediaRecorder.prototype;
  const anuncio = {
    parado: '',
    abrindo: 'Preparando o microfone',
    segurando: 'Gravando. Solte pra enviar',
    travado: 'Gravando sem segurar',
    pausado: 'Gravação pausada',
    guardando: 'Guardando o áudio',
    apagando: 'Gravação apagada',
  }[estado];

  // A árvore é sempre a mesma (barra opcional + botão redondo): o botão não pode ser
  // recriado no meio do toque, senão perde o dedo.
  return (
    <>
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>
      {previa && (
        <audio
          ref={tocador}
          src={previa}
          preload="auto"
          onTimeUpdate={(e) => setTocado(Math.min(1, e.currentTarget.currentTime / Math.max(0.1, segundos)))}
          onEnded={() => {
            setTocando(false);
            setTocado(1);
          }}
          // Não deu pra tocar o pedaço (alguns navegadores): some o play, o resto segue igual.
          onError={fecharPrevia}
          className="hidden"
        />
      )}
      {estado !== 'parado' && (
        // Cobre o campo de escrever, do lado do botão redondo, como no WhatsApp.
        <div className="absolute inset-y-0 left-0 right-16 flex items-center gap-2 rounded-3xl bg-white px-2 text-lg tabular-nums shadow-sm ring-1 ring-babacu/15">
          {estado === 'abrindo' && <p className="px-2 text-base text-babacu/80">Preparando o microfone…</p>}
          {estado === 'guardando' && <p className="entrar px-2 text-base text-babacu/80">Guardando o áudio…</p>}
          {estado === 'apagando' && <LixeiraAnimada />}
          {(segurando || travado) && (
            <>
              {travado ? (
                <button
                  type="button"
                  onClick={cancelar}
                  aria-label="Apagar gravação"
                  className="entrar flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-terracota"
                >
                  <IconeLixeira className="h-7 w-7" />
                </button>
              ) : (
                <span aria-hidden="true" className="piscar ml-2 h-3 w-3 shrink-0 rounded-full bg-terracota" />
              )}
              {pausado && previa && (
                <button
                  type="button"
                  onClick={tocarOuParar}
                  aria-label={tocando ? 'Parar de ouvir' : 'Ouvir o que gravou'}
                  className="entrar flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-babacu"
                >
                  {tocando ? <IconePausar className="h-6 w-6" /> : <IconeTocar className="h-6 w-6" />}
                </button>
              )}
              {!pausado && <span className="shrink-0">{relogio(segundos)}</span>}
              {/* Segurando, como no WhatsApp, a voz aparece no halo do botão; a onda vem travado. */}
              {travado &&
                (pausado ? (
                  // Pausado: a onda do áudio inteiro, pintada conforme toca.
                  <Onda niveis={niveis} barras={20} progresso={tocado} className="min-w-0 flex-1 text-babacu" />
                ) : (
                  <Onda niveis={niveis} aoVivo barras={22} className="min-w-0 flex-1 text-terracota" />
                ))}
              {pausado && <span className="shrink-0 text-base">{relogio(tocando || tocado > 0 ? tocado * segundos : segundos)}</span>}
              {segurando && (
                // Segue o dedo pra esquerda e some conforme chega perto de cancelar.
                <span className="flex min-w-0 flex-1 justify-end overflow-hidden pr-2">
                  <span
                    className="flex shrink-0 items-center gap-1 text-base"
                    style={{ transform: `translateX(${puxao.x}px)`, opacity: 1 - gesto.cancelar * 0.8 }}
                  >
                    <span aria-hidden="true" className="cutucar text-babacu/60">
                      ‹
                    </span>
                    <span className="brilho">Deslize pra cancelar</span>
                  </span>
                </span>
              )}
              {travado && podePausar && (
                <button
                  type="button"
                  onClick={pausado ? continuar : pausar}
                  aria-label={pausado ? 'Continuar gravando' : 'Pausar gravação'}
                  className="entrar flex h-12 w-12 shrink-0 items-center justify-center rounded-full text-terracota"
                >
                  {pausado ? <IconeMicrofone className="h-7 w-7" /> : <IconePausar className="h-7 w-7" />}
                </button>
              )}
            </>
          )}
        </div>
      )}
      <div className="relative shrink-0">
        {/* Cadeado: arraste o dedo até aqui pra gravar sem segurar */}
        {segurando && (
          // Sobe junto com o dedo; a trava vai fechando até travar.
          <div
            aria-hidden="true"
            className="surgir absolute bottom-full left-1/2 mb-4 flex flex-col items-center gap-1 rounded-full bg-white px-2.5 pb-2 pt-2.5 text-babacu shadow-md ring-1 ring-babacu/10"
            style={{ transform: `translate(-50%, ${puxao.y * 0.5}px)` }}
          >
            <CadeadoAnimado fechado={gesto.travar} />
            <span className="subir" style={{ opacity: 1 - gesto.travar }}>
              <IconeSubir className="h-4 w-4" />
            </span>
          </div>
        )}
        {travado && (
          // Acabou de travar: o cadeado fecha, dá um pulo e some.
          <div
            aria-hidden="true"
            className="trancar pointer-events-none absolute bottom-full left-1/2 mb-4 flex -translate-x-1/2 rounded-full bg-white p-2.5 text-babacu shadow-md ring-1 ring-babacu/10"
          >
            <CadeadoAnimado fechado={1} />
          </div>
        )}
        {segurando && (
          // Halo que pulsa com o volume da voz.
          <span
            aria-hidden="true"
            className="halo pointer-events-none absolute inset-0 rounded-full bg-terracota/30"
            style={{ transform: `translate(${puxao.x}px, ${puxao.y}px) scale(${1.55 + volume * 0.9})` }}
          />
        )}
        <button
          type="button"
          onPointerDown={aoDescer}
          onPointerMove={aoMover}
          onPointerUp={aoSoltar}
          onPointerCancel={aoPerderDedo}
          onContextMenu={(e) => e.preventDefault()}
          onClick={() => {
            // O clique que o navegador manda depois do toque de começar já foi tratado no dedo.
            if (ignorarClique.current) {
              ignorarClique.current = false;
              return;
            }
            if (estadoAgora.current === 'parado') comecar(true); // teclado / leitor de tela
            else if (travado) enviar();
          }}
          disabled={estado === 'guardando'}
          aria-label={travado ? 'Enviar gravação' : 'Gravar a lista. Segure e fale, ou toque pra gravar sem segurar'}
          style={{
            touchAction: 'none',
            transform: `translate(${puxao.x}px, ${puxao.y}px) scale(${segurando ? 1.3 : 1})`,
            transition: dedo.current ? 'background-color 150ms' : 'transform 150ms, background-color 150ms',
          }}
          className={`relative flex h-14 w-14 select-none items-center justify-center rounded-full text-areia shadow-md disabled:opacity-50 ${
            segurando || estado === 'abrindo' ? 'bg-terracota' : 'bg-folha'
          }`}
        >
          {travado ? <IconeEnviar className="pulo h-7 w-7" /> : <IconeMicrofone className="h-7 w-7" />}
        </button>
      </div>
    </>
  );
}

/** Cadeado que fecha conforme `fechado` vai de 0 (aberto, alça levantada) a 1 (travado). */
function CadeadoAnimado({ fechado }: { fechado: number }) {
  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" aria-hidden="true">
      <rect x="5" y="11" width="14" height="9" rx="2" fill={fechado >= 1 ? 'currentColor' : 'none'} />
      <path d="M8 11V8a4 4 0 0 1 8 0v3" style={{ transform: `translateY(${(1 - fechado) * -3}px)`, transition: 'transform 80ms' }} />
    </svg>
  );
}

/** Microfone pula e cai na lixeira, que sobe, fecha a tampa e desce (como no WhatsApp). */
function LixeiraAnimada() {
  return (
    <span aria-hidden="true" className="relative ml-2 block h-12 w-10 text-terracota">
      <span className="lixo-mic absolute left-1/2 top-1/2 -ml-3 -mt-3">
        <IconeMicrofone className="h-6 w-6" />
      </span>
      <svg viewBox="0 0 24 24" className="lixo-balde absolute bottom-0 left-1/2 -ml-4 h-8 w-8" fill="none" stroke="currentColor" strokeWidth={2.25} strokeLinecap="round" strokeLinejoin="round">
        <g className="lixo-tampa">
          <path d="M4 7h16" />
          <path d="M9.5 7V4.5h5V7" />
        </g>
        <path d="M6 7l1 13h10l1-13" />
        <path d="M10 11v5.5M14 11v5.5" />
      </svg>
    </span>
  );
}
