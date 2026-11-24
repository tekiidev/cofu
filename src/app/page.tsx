'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { lerPedido, temPedido } from '@/lib/pedido.ts';
import { enviarFila } from '@/lib/fila.ts';
import { useLiveQuery } from 'dexie-react-hooks';
import { Cofo } from '@/components/Cofo.tsx';
import { Entrada } from '@/components/Entrada.tsx';
import { IconeVoltar } from '@/components/Icones.tsx';
import { Pixel } from '@/components/Pixel.tsx';
import { ItemLinha } from '@/components/ItemLinha.tsx';
import { ModoFiguras } from '@/components/ModoFiguras.tsx';
import {
  adicionarItens,
  atualizarItem,
  db,
  lerModo,
  lerOrcamento,
  mudarEstado,
  novaFeira,
  removerItem,
  salvarModo,
  salvarOrcamento,
  type Modo,
} from '@/lib/db.ts';
import { CATEGORIAS, type Item, type ItemSugerido } from '@/lib/items.ts';
import { reais, situacao } from '@/lib/money.ts';
import { Assinatura } from '@/components/Assinatura.tsx';

export default function Inicio() {
  const itens = useLiveQuery(() => db.itens.orderBy('criadoEm').toArray(), [], [] as Item[]);
  const [orcamento, setOrcamento] = useState<number | null>(null);
  const [aviso, setAviso] = useState<string | null>(null);
  const [pulso, setPulso] = useState(0);
  const [online, setOnline] = useState(true);
  const [modo, setModo] = useState<Modo>('lista');

  function trocarModo() {
    const novo = modo === 'lista' ? 'figuras' : 'lista';
    setModo(novo);
    salvarModo(novo);
  }

  // Pedido do link de abertura (Siri, compartilhar, atalho do ícone): lido uma vez só.
  const [pedido, setPedido] = useState<{ texto: string | null; falar: boolean } | null>(null);
  const pedidoLido = useRef(false);
  useEffect(() => {
    if (pedidoLido.current) return;
    pedidoLido.current = true;
    const p = lerPedido(new URLSearchParams(window.location.search));
    // Tira da URL pra recarregar a página não adicionar a lista de novo.
    if (temPedido(p)) window.history.replaceState(null, '', window.location.pathname);
    lerModo().then((salvo) => {
      setModo(p.modo ?? salvo);
      if (p.modo) salvarModo(p.modo);
      if (p.texto || p.falar) setPedido({ texto: p.texto, falar: p.falar });
    });
  }, []);

  useEffect(() => {
    lerOrcamento().then(setOrcamento);
    const atualizar = () => setOnline(navigator.onLine);
    atualizar();
    window.addEventListener('online', atualizar);
    window.addEventListener('offline', atualizar);
    return () => {
      window.removeEventListener('online', atualizar);
      window.removeEventListener('offline', atualizar);
    };
  }, []);

  // Áudios gravados sem internet: viram lista quando a conexão volta.
  const pendentes = useLiveQuery(() => db.audios.count(), [], 0);
  const [montandoAudio, setMontandoAudio] = useState(false);
  useEffect(() => {
    if (!online || !pendentes) return;
    setMontandoAudio(true);
    enviarFila(async (r) => {
      await adicionarItens(r.itens);
      const n = r.itens.length;
      setAviso(
        n
          ? `Do áudio: ${n} ${n === 1 ? 'item' : 'itens'} na lista.${r.ouvido ? ` Ouvi: "${r.ouvido}"` : ''}`
          : `Não achei itens no áudio.${r.ouvido ? ` Ouvi: "${r.ouvido}"` : ''}`,
      );
    })
      .then((res) => {
        if (res.aviso) setAviso(res.aviso);
      })
      .finally(() => setMontandoAudio(false));
  }, [online, pendentes]);

  function audioGuardado() {
    setAviso(
      navigator.onLine
        ? 'Áudio guardado. Montando a lista…'
        : 'Áudio guardado. Quando a internet voltar, o Cofu monta a lista sozinho.',
    );
  }

  const lista = itens.filter((i) => i.estado === 'lista');
  const cofo = itens.filter((i) => i.estado === 'cofo');
  const casa = itens.filter((i) => i.estado === 'casa');
  const s = situacao(itens, orcamento);

  // Agrupa por categoria, na ordem de um mercado.
  const grupos = useMemo(
    () => CATEGORIAS.map((cat) => ({ cat, itens: lista.filter((i) => i.categoria === cat) })).filter((g) => g.itens.length),
    [lista],
  );

  async function receber(novos: ItemSugerido[], semIA: boolean, msg?: string) {
    if (!novos.length) {
      setAviso(msg || 'Não entendi nenhum item. Tente "2 kg de arroz, feijão".');
      return;
    }
    await adicionarItens(novos);
    const n = novos.length;
    setAviso(
      msg || (semIA ? `${n} ${n === 1 ? 'item' : 'itens'} na lista (sem internet: confira as quantidades)` : `${n} ${n === 1 ? 'item' : 'itens'} na lista`),
    );
  }

  async function mudarOrcamento(valor: string) {
    const v = Number(valor.replace(/[^\d,.]/g, '').replace(',', '.'));
    const novo = Number.isFinite(v) && v > 0 ? v : null;
    setOrcamento(novo);
    await salvarOrcamento(novo);
  }

  async function confirmarNovaFeira() {
    const msg = cofo.length
      ? `Começar nova feira? Os ${cofo.length} itens do cofo saem. O que não comprou continua na lista.`
      : 'Começar nova feira? O que não comprou continua na lista.';
    if (window.confirm(msg)) {
      await novaFeira();
      setAviso('Cofo vazio. Boa feira!');
    }
  }

  const props = {
    onCofo: (i: Item) => mudarEstado(i.id, 'cofo').then(() => setPulso((p) => p + 1)),
    onCasa: (i: Item) => mudarEstado(i.id, 'casa'),
    onVoltar: (i: Item) => mudarEstado(i.id, 'lista'),
    onPreco: (i: Item, preco: number | null) => atualizarItem(i.id, { preco }),
    onRemover: (i: Item) => removerItem(i.id),
  };

  const avisos = (
    <>
      {aviso && (
        <p role="status" className="rounded-2xl bg-folha/10 px-4 py-3 text-base text-folha">
          {aviso}
        </p>
      )}
      {pendentes > 0 && (
        <p className="rounded-2xl bg-palha-clara/60 px-4 py-3 text-base text-babacu">
          {montandoAudio
            ? 'Montando a lista do áudio…'
            : `${pendentes} ${pendentes === 1 ? 'áudio esperando' : 'áudios esperando'} ${
                online ? 'pra virar lista.' : 'a internet voltar pra virar lista.'
              }`}
        </p>
      )}
    </>
  );

  return (
    // pb: espaço pra lista não ficar atrás da caixa de escrever, que fica presa embaixo.
    <main className="mx-auto flex max-w-xl flex-col gap-4 px-4 pb-40 pt-5">
      <header className="flex items-center justify-between">
        <h1 className="font-titulo text-4xl font-semibold text-babacu">cofu</h1>
        <div className="flex items-center gap-2">
          {!online && <span className="rounded-full bg-areia-escura px-3 py-1 text-sm text-babacu">sem internet</span>}
          <button
            type="button"
            onClick={trocarModo}
            aria-pressed={modo === 'figuras'}
            className={`flex min-h-11 items-center gap-2 rounded-full px-3 text-base font-bold ring-2 ${
              modo === 'figuras' ? 'bg-babacu text-areia ring-babacu' : 'bg-white/70 text-babacu ring-babacu/25'
            }`}
          >
            <Pixel figura="banana" className="h-6 w-6" />
            Figuras
          </button>
        </div>
      </header>

      {modo === 'figuras' && (
        <>
          {avisos}
          <ModoFiguras
            lista={lista}
            cofo={cofo}
            noCofo={s.noCofo}
            // Sem preço nenhum, o cofo enche pela quantidade de itens.
            progresso={s.totalLista > 0 ? s.progresso : cofo.length / Math.max(1, lista.length + cofo.length)}
            temPreco={s.totalLista > 0}
            estourou={s.estourou}
            pulso={pulso}
            onCofo={props.onCofo}
            onVoltar={props.onVoltar}
          />
        </>
      )}

      {modo === 'lista' && (
        <>
      {/* Cofo + orçamento */}
      <section className="flex items-center gap-4 rounded-3xl bg-areia-escura/70 p-4">
        <Cofo progresso={s.progresso} estourou={s.estourou} pulso={pulso} />
        <div className="min-w-0 flex-1">
          <p className="text-base text-babacu/80">No cofo</p>
          <p className={`font-titulo text-3xl font-semibold ${s.estourou ? 'text-terracota' : 'text-noite'}`}>{reais(s.noCofo)}</p>
          <p className={`text-base ${s.estourou ? 'font-bold text-terracota' : 'text-folha'}`} aria-live="polite">
            {s.mensagem}
          </p>
          <label className="mt-2 flex items-center gap-2 text-base text-babacu/80">
            Orçamento
            <input
              suppressHydrationWarning // autofill do celular injeta __gcruniqueid
              inputMode="decimal"
              defaultValue={orcamento ?? ''}
              key={orcamento ?? 'vazio'}
              placeholder="R$ 0"
              onBlur={(e) => mudarOrcamento(e.target.value)}
              className="h-11 w-full min-w-0 max-w-28 rounded-xl border border-babacu/25 bg-areia px-2 text-base"
            />
          </label>
        </div>
      </section>

      {avisos}

      {/* Lista agrupada */}
      {grupos.map((g) => (
        <section key={g.cat}>
          <h2 className="mb-2 font-titulo text-xl text-babacu">{g.cat}</h2>
          <ul className="flex flex-col gap-2">
            {g.itens.map((item) => (
              <ItemLinha key={item.id} item={item} {...props} />
            ))}
          </ul>
        </section>
      ))}

      {!itens.length && (
        <p className="px-2 text-center text-base text-babacu/70">
          Sua lista aparece aqui. Fale ou escreva o que vai comprar, do jeito que você falaria.
        </p>
      )}

      {cofo.length > 0 && (
        <section>
          <h2 className="mb-2 font-titulo text-xl text-folha">No cofo ({cofo.length})</h2>
          <ul className="flex flex-col gap-2">
            {cofo.map((item) => (
              <ItemLinha key={item.id} item={item} {...props} />
            ))}
          </ul>
        </section>
      )}
        </>
      )}

      {casa.length > 0 && (
        <section className="rounded-3xl bg-areia-escura/60 p-4">
          <h2 className="font-titulo text-xl text-babacu">Prateleira: tem em casa</h2>
          <ul className="mt-2 flex flex-wrap gap-2">
            {casa.map((item) => (
              <li key={item.id}>
                <button
                  type="button"
                  onClick={() => mudarEstado(item.id, 'lista')}
                  className="flex min-h-11 items-center gap-2 rounded-full bg-white/80 px-4 text-base ring-1 ring-babacu/15"
                  aria-label={`${item.nome}: acabou, voltar pra lista`}
                >
                  {item.nome} <IconeVoltar className="h-4 w-4 text-babacu/50" />
                </button>
              </li>
            ))}
          </ul>
          <p className="mt-2 text-sm text-babacu/70">Acabou? Toque pra voltar pra lista.</p>
        </section>
      )}

      {itens.length > 0 && (
        <button
          type="button"
          onClick={confirmarNovaFeira}
          className="min-h-14 rounded-2xl border-2 border-babacu/30 text-lg font-bold text-babacu"
        >
          Nova feira
        </button>
      )}

      <footer className="pt-4 text-center text-sm text-babacu/60">
        Preços com ~ são estimativas. Seus dados ficam só neste aparelho.
      </footer>

      <Entrada onItens={receber} pedido={pedido} onPedidoUsado={() => setPedido(null)} online={online} onAudioGuardado={audioGuardado} />
      <Assinatura />
    </main>
  );
}
