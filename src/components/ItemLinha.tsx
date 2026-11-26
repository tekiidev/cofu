'use client';

import { useState } from 'react';
import { AjusteQuantidade } from '@/components/AjusteQuantidade.tsx';
import { IconeCerto, IconeFechar } from '@/components/Icones.tsx';
import { rotuloQuantidade, type Item } from '@/lib/items.ts';
import { reais } from '@/lib/money.ts';

type Props = {
  item: Item;
  onCofo: (item: Item) => void;
  onCasa: (item: Item) => void;
  onVoltar: (item: Item) => void;
  onPreco: (item: Item, preco: number | null) => void;
  onRemover: (item: Item) => void;
  onQuantidade: (item: Item, direcao: 1 | -1) => void;
};

/** Tocar no item = ele cai no cofo. "Tem em casa" manda pra prateleira. Tocar na quantidade abre o − e +. */
export function ItemLinha({ item, onCofo, onCasa, onVoltar, onPreco, onRemover, onQuantidade }: Props) {
  const [saindo, setSaindo] = useState(false);
  const [editando, setEditando] = useState(false);
  const [ajustando, setAjustando] = useState(false);
  const noCofo = item.estado === 'cofo';
  const qtd = rotuloQuantidade(item);

  function tocar() {
    if (noCofo) return onVoltar(item);
    setSaindo(true);
    setTimeout(() => onCofo(item), 240);
  }

  return (
    <li className={`flex flex-col rounded-2xl bg-white/80 p-2 ring-1 ring-babacu/10 ${saindo ? 'cair' : ''}`}>
      <div className="flex items-center gap-2">
      <button
        type="button"
        onClick={tocar}
        aria-label={noCofo ? `Tirar ${item.nome} do cofo` : `Colocar ${item.nome} no cofo`}
        className="flex min-h-12 flex-1 items-center gap-3 rounded-xl px-2 text-left"
      >
        <span
          aria-hidden="true"
          className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full border-2 ${
            noCofo ? 'border-folha bg-folha text-areia' : 'border-babacu/40'
          }`}
        >
          {noCofo && <IconeCerto />}
        </span>
        <span className="min-w-0">
          <span className={`block truncate text-lg ${noCofo ? 'text-babacu/50 line-through' : ''}`}>{item.nome}</span>
          {noCofo && qtd && <span className="block text-base text-babacu/70">{qtd}</span>}
        </span>
      </button>

      {editando ? (
        <input
          autoFocus
          inputMode="decimal"
          defaultValue={item.preco != null ? String(item.preco).replace('.', ',') : ''}
          aria-label={`Preço de ${item.nome}`}
          placeholder="R$"
          className="h-12 w-24 rounded-xl border border-babacu/30 bg-areia px-2 text-right text-base"
          onBlur={(e) => {
            const v = Number(e.target.value.replace(/[^\d,.]/g, '').replace(',', '.'));
            onPreco(item, Number.isFinite(v) && v > 0 ? v : null);
            setEditando(false);
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') (e.target as HTMLInputElement).blur();
          }}
        />
      ) : (
        <button
          type="button"
          onClick={() => setEditando(true)}
          className="min-h-12 min-w-20 rounded-xl px-2 text-right text-base text-babacu"
          aria-label={item.preco != null ? `Preço de ${item.nome}: ${reais(item.preco)}. Toque pra mudar` : `Colocar preço de ${item.nome}`}
        >
          {item.preco != null ? `~${reais(item.preco)}` : <span className="text-babacu/40">R$ ?</span>}
        </button>
      )}

      {!noCofo && (
        <button
          type="button"
          onClick={() => onCasa(item)}
          className="min-h-12 rounded-xl px-2 text-sm font-bold text-folha"
          aria-label={`${item.nome}: tem em casa`}
        >
          Tem em casa
        </button>
      )}
      <button
        type="button"
        onClick={() => onRemover(item)}
        className="flex h-12 w-11 items-center justify-center rounded-xl text-babacu/40"
        aria-label={`Apagar ${item.nome}`}
      >
        <IconeFechar />
      </button>
      </div>
      {!noCofo &&
        (ajustando ? (
          <div className="flex items-center gap-2 pl-11">
            <AjusteQuantidade item={item} onMudar={onQuantidade} />
            <button
              type="button"
              onClick={() => setAjustando(false)}
              aria-label={`Pronto, quantidade de ${item.nome}`}
              className="flex h-11 w-11 items-center justify-center rounded-xl text-folha"
            >
              <IconeCerto />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => setAjustando(true)}
            aria-label={`Quantidade de ${item.nome}: ${qtd || 'sem quantidade'}. Toque pra mudar`}
            className="-mt-2 ml-12 min-h-11 self-start rounded-lg px-1 text-base text-babacu/70 underline decoration-babacu/30 decoration-dotted underline-offset-4"
          >
            {qtd || 'quantidade?'}
          </button>
        ))}
    </li>
  );
}
