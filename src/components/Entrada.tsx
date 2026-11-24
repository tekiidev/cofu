'use client';

import { useEffect, useRef, useState } from 'react';
import { Gravador, microfoneBloqueadoSemHttps, podeGravar } from '@/components/Gravador.tsx';
import { IconeEnviar, IconeMicrofone } from '@/components/Icones.tsx';
import { lerLista } from '@/lib/parse.ts';
import type { ItemSugerido } from '@/lib/items.ts';

type Reconhecimento = {
  lang: string;
  interimResults: boolean;
  continuous: boolean;
  start: () => void;
  stop: () => void;
  abort?: () => void;
  onresult: ((e: { resultIndex: number; results: ArrayLike<ArrayLike<{ transcript: string }> & { isFinal: boolean }> }) => void) | null;
  onend: (() => void) | null;
  onerror: ((e: { error: string }) => void) | null;
};

function criarReconhecimento(): Reconhecimento | null {
  if (typeof window === 'undefined') return null;
  const w = window as unknown as { SpeechRecognition?: new () => Reconhecimento; webkitSpeechRecognition?: new () => Reconhecimento };
  const Classe = w.SpeechRecognition || w.webkitSpeechRecognition;
  return Classe ? new Classe() : null;
}

/** Monta a lista: tenta a IA online; sem internet ou se ela falhar, usa o leitor simples. */
async function montar(texto: string): Promise<{ itens: ItemSugerido[]; semIA: boolean; aviso?: string }> {
  if (typeof navigator !== 'undefined' && !navigator.onLine) return { itens: lerLista(texto), semIA: true };
  try {
    const res = await fetch('/api/lista', {
      method: 'POST',
      headers: { 'content-type': 'application/json' },
      body: JSON.stringify({ texto }),
    });
    const json = await res.json().catch(() => ({}));
    if (res.ok && Array.isArray(json.itens)) return { itens: json.itens, semIA: false };
    if (res.status === 400 || res.status === 413 || res.status === 429) {
      return { itens: res.status === 429 ? lerLista(texto) : [], semIA: true, aviso: json.erro };
    }
  } catch {
    // rede caiu no meio: segue pro leitor simples
  }
  return { itens: lerLista(texto), semIA: true };
}

type Props = {
  onItens: (itens: ItemSugerido[], semIA: boolean, aviso?: string) => void;
  /** Veio do link de abertura (Siri, compartilhar, atalho do ícone). */
  pedido?: { texto: string | null; falar: boolean } | null;
  /** Avisa que o pedido foi usado, pra não repetir se a entrada for montada de novo. */
  onPedidoUsado?: () => void;
  online?: boolean;
  /** Áudio gravado e guardado na fila (vira lista quando a internet voltar). */
  onAudioGuardado?: (segundos: number) => void;
};

export function Entrada({ onItens, pedido, onPedidoUsado, online = true, onAudioGuardado }: Props) {
  const [texto, setTexto] = useState('');
  const [ouvindo, setOuvindo] = useState(false);
  const [carregando, setCarregando] = useState(false);
  const [temVoz, setTemVoz] = useState(false);
  const [temGravador, setTemGravador] = useState(false);
  // O navegador diz que está online, mas o reconhecimento de voz não alcançou o servidor.
  const [vozSemRede, setVozSemRede] = useState(false);
  useEffect(() => setVozSemRede(false), [online]);
  const [dica, setDica] = useState<string | null>(null);
  // A IA entende áudio: aí o microfone grava e manda o som direto pra ela, que já
  // devolve os itens separados. É mais confiável que o reconhecimento de voz do
  // navegador, que falha calado no iPhone e no app instalado na tela inicial.
  const [audioIA, setAudioIA] = useState(false);
  const rec = useRef<Reconhecimento | null>(null);
  const textoAtual = useRef('');
  // Já mandou o que foi falado nesta escuta (o fim pode chegar pelo toque e pelo navegador).
  const enviado = useRef(false);
  textoAtual.current = texto;
  const base = useRef('');
  const botaoVoz = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    setTemVoz(Boolean(criarReconhecimento()));
    setTemGravador(podeGravar());
    // Acontece ao testar pelo IP da rede (http://192.168…): o navegador esconde o microfone.
    if (microfoneBloqueadoSemHttps()) setDica('O microfone só aparece com https. Abra o Cofu por um link https pra gravar.');
    fetch('/api/audio')
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => setAudioIA(j?.disponivel === true))
      .catch(() => {});
  }, []);

  useEffect(() => {
    if (!pedido) return;
    onPedidoUsado?.();
    if (pedido.texto) {
      setTexto(pedido.texto);
      enviar(pedido.texto);
    } else if (pedido.falar) {
      // Alguns navegadores só ligam o microfone depois de um toque: aí fica a dica.
      if (!alternarVoz()) {
        botaoVoz.current?.focus();
        setDica('Toque no microfone e fale o que vai comprar.');
      }
    }
    // Roda uma vez por pedido.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pedido]);

  // Com a IA de áudio, sem internet ou sem reconhecimento de voz no navegador, o
  // microfone grava o áudio (online ele vira lista na hora; offline espera na fila).
  const gravarAudio = temGravador && (audioIA || !online || !temVoz || vozSemRede);

  /** true se começou a ouvir. */
  function alternarVoz(): boolean {
    setDica(null);
    if (ouvindo) {
      // No iPhone o navegador às vezes ignora o stop(): o toque para na hora, monta a
      // lista com o que já foi ouvido e, se ele continuar ligado, é cortado.
      const r = rec.current;
      r?.stop();
      setTimeout(() => r?.abort?.(), 800);
      terminarEscuta();
      return false;
    }
    const r = criarReconhecimento();
    if (!r) return false;
    r.lang = 'pt-BR';
    r.interimResults = true;
    r.continuous = true;
    base.current = texto ? `${texto.trim()}, ` : '';
    r.onresult = (e) => {
      let falado = '';
      for (let i = 0; i < e.results.length; i += 1) falado += e.results[i][0].transcript;
      setTexto(base.current + falado.trim());
    };
    r.onend = terminarEscuta;
    r.onerror = (e) => {
      setOuvindo(false);
      if (e.error === 'not-allowed') setDica('Toque no microfone e fale o que vai comprar.');
      // O reconhecimento de voz do navegador precisa de internet (no Chrome o áudio vai pro Google).
      if (e.error === 'network') {
        setVozSemRede(true);
        setDica('A internet caiu. Toque no microfone de novo pra gravar: o Cofu monta a lista quando a conexão voltar.');
      }
    };
    rec.current = r;
    enviado.current = false;
    try {
      r.start();
    } catch {
      return false;
    }
    setOuvindo(true);
    return true;
  }

  /** Parou de ouvir (toque ou navegador): a lista já sai, sem tocar em "Montar lista". */
  function terminarEscuta() {
    setOuvindo(false);
    if (enviado.current) return;
    enviado.current = true;
    if (textoAtual.current.trim()) enviar(textoAtual.current);
  }

  async function enviar(valor = texto) {
    const t = valor.trim();
    if (!t || carregando) return;
    // Se ainda estava ouvindo, o fim da escuta não manda de novo.
    enviado.current = true;
    rec.current?.stop();
    setOuvindo(false);
    setCarregando(true);
    const { itens, semIA, aviso } = await montar(t);
    setCarregando(false);
    onItens(itens, semIA, aviso);
    if (itens.length) setTexto('');
  }

  // Campo cresce com o texto até umas 4 linhas, depois rola (como no WhatsApp).
  const campo = useRef<HTMLTextAreaElement>(null);
  useEffect(() => {
    const c = campo.current;
    if (!c) return;
    c.style.height = 'auto';
    c.style.height = `${Math.min(c.scrollHeight, 136)}px`;
  }, [texto]);

  // Com texto, o botão redondo vira enviar. Ouvindo, continua sendo o microfone (pra parar).
  const mostrarEnviar = Boolean(texto.trim()) && !ouvindo;
  const redondo = 'flex h-14 w-14 shrink-0 items-center justify-center rounded-full text-areia shadow-md transition';

  return (
    // Preso embaixo da tela, como a caixa de mensagem do WhatsApp; a lista rola em cima.
    <section
      aria-label="Escrever ou gravar a lista"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-babacu/10 bg-areia/95 backdrop-blur"
      style={{ paddingBottom: 'env(safe-area-inset-bottom)' }}
    >
      <div className="mx-auto max-w-xl px-3 pb-3 pt-2">
        {ouvindo && <p className="mb-2 px-2 text-base text-terracota">Ouvindo… fale os itens e toque de novo pra parar.</p>}
        {dica && !ouvindo && (
          <p role="status" className="mb-2 rounded-2xl bg-folha/10 px-3 py-2 text-base text-folha">
            {dica}
          </p>
        )}
        <div className="relative flex items-end gap-2">
          <label htmlFor="entrada" className="sr-only">
            O que vai comprar?
          </label>
          <textarea
            ref={campo}
            suppressHydrationWarning // autofill do celular injeta __gcruniqueid
            id="entrada"
            value={texto}
            onChange={(e) => setTexto(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) enviar();
            }}
            rows={1}
            maxLength={1200}
            placeholder="O que vai comprar?"
            className="max-h-34 min-h-14 min-w-0 flex-1 resize-none rounded-3xl border border-babacu/20 bg-white px-5 py-3.5 text-lg leading-snug placeholder:text-babacu/50 focus:border-folha focus:outline-none"
          />
          {mostrarEnviar ? (
            <button
              type="button"
              onClick={() => enviar()}
              disabled={carregando}
              aria-label={carregando ? 'Montando a lista' : 'Montar lista'}
              className={`${redondo} bg-folha disabled:opacity-60`}
            >
              {carregando ? (
                <span aria-hidden="true" className="h-6 w-6 animate-spin rounded-full border-[3px] border-areia/40 border-t-areia" />
              ) : (
                <IconeEnviar className="h-7 w-7" />
              )}
            </button>
          ) : gravarAudio ? (
            <Gravador
              onGuardado={(s) => {
                setDica(null);
                onAudioGuardado?.(s);
              }}
              onErro={setDica}
            />
          ) : temVoz ? (
            <button
              ref={botaoVoz}
              type="button"
              onClick={alternarVoz}
              aria-pressed={ouvindo}
              aria-label={ouvindo ? 'Parar de ouvir' : 'Falar a lista'}
              className={`${redondo} ${ouvindo ? 'animate-pulse bg-terracota' : 'bg-folha'}`}
            >
              <IconeMicrofone className="h-7 w-7" />
            </button>
          ) : (
            <button
              type="button"
              disabled
              aria-label="Escreva a lista pra montar"
              className={`${redondo} bg-folha opacity-40`}
            >
              <IconeEnviar className="h-7 w-7" />
            </button>
          )}
        </div>
      </div>
    </section>
  );
}
