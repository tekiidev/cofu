import { ajustar } from './quantidade.ts';
import Dexie, { type EntityTable } from 'dexie';
import type { Estado, Item, ItemSugerido } from './items.ts';
import { planejarJuntar } from './juntar.ts';

/**
 * Tudo fica no aparelho (IndexedDB), então a lista funciona sem internet.
 * Só sai do aparelho o texto ou o áudio que a pessoa manda pra IA montar a lista.
 */

type Config = { chave: string; valor: unknown };

/** Áudio gravado sem internet, esperando pra virar lista (WAV mono 16 kHz). */
export type AudioGuardado = { id: string; criadoEm: number; wav: Blob; segundos: number };

class CofuDB extends Dexie {
  itens!: EntityTable<Item, 'id'>;
  config!: EntityTable<Config, 'chave'>;
  audios!: EntityTable<AudioGuardado, 'id'>;

  constructor() {
    super('cofu');
    this.version(1).stores({
      itens: 'id, estado, criadoEm',
      config: 'chave',
    });
    this.version(2).stores({ audios: 'id, criadoEm' });
  }
}

export const db = new CofuDB();

function novoId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`;
}

/** Junta com o que já está na lista: mesmo nome soma quantidade em vez de duplicar. */
export async function adicionarItens(sugeridos: ItemSugerido[]) {
  const agora = Date.now();
  await db.transaction('rw', db.itens, async () => {
    const atuais = await db.itens.where('estado').equals('lista').toArray();
    for (const op of planejarJuntar(atuais, sugeridos)) {
      if (op.tipo === 'somar') await db.itens.update(op.id, { quantidade: op.quantidade, preco: op.preco });
      else await db.itens.add({ ...op.item, id: novoId(), estado: 'lista', criadoEm: agora + op.ordem });
    }
  });
}

export function mudarQuantidade(id: string, direcao: 1 | -1) {
  return db.transaction('rw', db.itens, async () => {
    const item = await db.itens.get(id);
    if (!item || item.estado !== 'lista') return;
    const ajuste = ajustar(item, direcao);
    if (ajuste) await db.itens.update(id, ajuste);
  });
}

export function mudarEstado(id: string, estado: Estado) {
  return db.itens.update(id, { estado });
}

export function atualizarItem(id: string, dados: Partial<Item>) {
  return db.itens.update(id, dados);
}

export function removerItem(id: string) {
  return db.itens.delete(id);
}

/** Nova feira: o que foi pro cofo sai (já comprou); o que tem em casa continua na prateleira. */
export async function novaFeira() {
  await db.itens.where('estado').equals('cofo').delete();
}

export type Modo = 'lista' | 'figuras';

export async function lerModo(): Promise<Modo> {
  const linha = await db.config.get('modo');
  return linha?.valor === 'figuras' ? 'figuras' : 'lista';
}

export function salvarModo(modo: Modo) {
  return db.config.put({ chave: 'modo', valor: modo });
}

export async function lerOrcamento(): Promise<number | null> {
  const linha = await db.config.get('orcamento');
  return typeof linha?.valor === 'number' ? linha.valor : null;
}

export function salvarOrcamento(valor: number | null) {
  return valor ? db.config.put({ chave: 'orcamento', valor }) : db.config.delete('orcamento');
}

export async function guardarAudio(wav: Blob, segundos: number) {
  await db.audios.add({ id: novoId(), criadoEm: Date.now(), wav, segundos });
}
