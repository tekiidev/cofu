'use client';

import { useEffect, useRef, useState } from 'react';
import { AjusteQuantidade } from '@/components/AjusteQuantidade.tsx';
import { Cofo } from '@/components/Cofo.tsx';
import { IconeSom } from '@/components/Icones.tsx';
import { Pixel } from '@/components/Pixel.tsx';
import { falar, podeFalar, textoFalado } from '@/lib/fala.ts';
import { figuraDoItem, type NomeFigura } from '@/lib/figuras.ts';
import type { Item } from '@/lib/items.ts';
import { reais } from '@/lib/money.ts';

type Props = {
  lista: Item[];
  cofo: Item[];
  noCofo: number;
  progresso: number;
  temPreco: boolean;
  estourou: boolean;
  pulso: number;
  onCofo: (item: Item) => void;
  onVoltar: (item: Item) => void;
  onQuantidade: (item: Item, direcao: 1 | -1) => void;
};

type Arrasto = { item: Item; figura: NomeFigura; x: number; y: number; sobre: boolean };

// Quanto o dedo anda pro lado antes de virar arrasto (pra cima/baixo continua rolando a lista).
const LIMIAR = 12;

/**
 * Modo figuras: itens com desenho numa coluna, cofo parado à direita.
 * Arraste o item pro cofo, ou só toque nele (arrastar nunca é o único jeito).
 * O botão de som lê o nome e a quantidade em voz alta.
 */
export function ModoFiguras({ lista, cofo, noCofo, progresso, temPreco, estourou, pulso, onCofo, onVoltar, onQuantidade }: Props) {
  const alvo = useRef<HTMLDivElement>(null);
  const inicio = useRef<{ id: number; x: number; y: number } | null>(null);
  const arrastou = useRef(false);
  const [arrasto, setArrasto] = useState<Arrasto | null>(null);
  const [anuncio, setAnuncio] = useState('');
  const [comVoz, setComVoz] = useState(false);

  useEffect(() => setComVoz(podeFalar()), []);

  function sobreCofo(x: number, y: number) {
    const r = alvo.current?.getBoundingClientRect();
    if (!r) return false;
    const folga = 24;
    return x >= r.left - folga && x <= r.right + folga && y >= r.top - folga && y <= r.bottom + folga;
  }

  function colocar(item: Item) {
    onCofo(item);
    setAnuncio(`${item.nome} no cofo`);
  }

  function tirar(item: Item) {
    onVoltar(item);
    setAnuncio(`${item.nome} voltou pra lista`);
  }

  function aoDescer(e: React.PointerEvent) {
    if (e.button !== 0) return;
    inicio.current = { id: e.pointerId, x: e.clientX, y: e.clientY };
    arrastou.current = false;
  }

  function aoMover(e: React.PointerEvent, item: Item) {
    const ini = inicio.current;
    if (!ini || ini.id !== e.pointerId) return;
    if (!arrasto) {
      const dx = e.clientX - ini.x;
      const dy = e.clientY - ini.y;
      if (Math.abs(dx) < LIMIAR || Math.abs(dx) < Math.abs(dy)) return;
      e.currentTarget.setPointerCapture(e.pointerId);
      arrastou.current = true;
    }
    setArrasto({
      item,
      figura: figuraDoItem(item.nome, item.categoria),
      x: e.clientX,
      y: e.clientY,
      sobre: sobreCofo(e.clientX, e.clientY),
    });
  }

  function aoSoltar(e: React.PointerEvent) {
    if (arrasto && sobreCofo(e.clientX, e.clientY)) colocar(arrasto.item);
    inicio.current = null;
    setArrasto(null);
  }

  function aoCancelar() {
    inicio.current = null;
    setArrasto(null);
  }

  return (
    <div className="grid grid-cols-[minmax(0,1fr)_7.5rem] gap-3">
      <p className="sr-only" aria-live="polite">
        {anuncio}
      </p>

      {/* Coluna da esquerda: o que falta pegar */}
      <ul className="flex flex-col gap-2" aria-label="Falta pegar">
        {lista.map((item) => {
          const figura = figuraDoItem(item.nome, item.categoria);
          const levantado = arrasto?.item.id === item.id;
          return (
            <li
              key={item.id}
              className={`relative rounded-2xl bg-white/80 pb-2 ring-1 ring-babacu/10 ${levantado ? 'opacity-30' : ''}`}
            >
              <button
                type="button"
                onPointerDown={aoDescer}
                onPointerMove={(e) => aoMover(e, item)}
                onPointerUp={aoSoltar}
                onPointerCancel={aoCancelar}
                onClick={() => {
                  // Depois de um arrasto o navegador ainda manda o clique: ignora.
                  if (arrastou.current) {
                    arrastou.current = false;
                    return;
                  }
                  colocar(item);
                }}
                aria-label={`Colocar ${textoFalado(item)} no cofo`}
                style={{ touchAction: 'pan-y' }}
                className="flex min-h-20 w-full select-none flex-col items-center justify-center gap-1 rounded-2xl p-2 text-center"
              >
                <Pixel figura={figura} className="h-14 w-14" />
                <span className="text-lg leading-tight break-words">{item.nome}</span>
              </button>
              <AjusteQuantidade item={item} onMudar={onQuantidade} />
              {comVoz && (
                <button
                  type="button"
                  onClick={() => falar(textoFalado(item))}
                  aria-label={`Ouvir: ${item.nome}`}
                  className="absolute right-1 top-1 flex h-11 w-11 items-center justify-center rounded-xl text-babacu/70"
                >
                  <IconeSom />
                </button>
              )}
            </li>
          );
        })}
        {!lista.length && (
          <li className="rounded-2xl bg-white/60 p-4 text-center text-base text-babacu/70">
            {cofo.length ? 'Tudo no cofo!' : 'Fale ou escreva o que vai comprar.'}
          </li>
        )}
      </ul>

      {/* Coluna da direita: o cofo, parado enquanto a lista rola */}
      <div
        ref={alvo}
        className={`sticky top-3 flex flex-col items-center gap-2 self-start rounded-3xl p-2 transition-colors ${
          arrasto?.sobre ? 'bg-palha-clara ring-4 ring-palha' : arrasto ? 'bg-areia-escura outline-2 outline-dashed outline-babacu/40' : 'bg-areia-escura/70'
        }`}
      >
        <Cofo progresso={progresso} estourou={estourou} pulso={pulso} className="h-24 w-24" />
        <p className={`font-titulo text-xl font-semibold ${estourou ? 'text-terracota' : 'text-noite'}`}>
          {temPreco ? reais(noCofo) : `${cofo.length} de ${cofo.length + lista.length}`}
        </p>
        {cofo.length > 0 && (
          <ul className="flex flex-wrap justify-center gap-1" aria-label="No cofo">
            {cofo.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => tirar(item)}
                  aria-label={`Tirar ${item.nome} do cofo`}
                  className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/70"
                >
                  <Pixel figura={figuraDoItem(item.nome, item.categoria)} className="h-8 w-8" />
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Figura que acompanha o dedo durante o arrasto */}
      {arrasto && (
        <div
          aria-hidden="true"
          className="pointer-events-none fixed z-50 -translate-x-1/2 -translate-y-1/2 rounded-2xl bg-white p-2 shadow-lg ring-2 ring-palha"
          style={{ left: arrasto.x, top: arrasto.y }}
        >
          <Pixel figura={arrasto.figura} className="h-14 w-14" />
        </div>
      )}
    </div>
  );
}
