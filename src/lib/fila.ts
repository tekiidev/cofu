import { db } from './db.ts';
import { ListaDeAudioSchema, type ListaDeAudio } from './items.ts';

/**
 * Fila de áudios gravados sem internet. Quando a conexão volta, cada áudio vai
 * pra IA (pelo /api/audio) e vira lista. Só sai da fila depois que os itens
 * entraram na lista, ou quando o servidor diz que aquele áudio nunca vai dar certo.
 */

export type ResultadoFila = { listas: number; aviso?: string };

let enviando = false;

export async function enviarFila(aoReceber: (lista: ListaDeAudio) => Promise<void>): Promise<ResultadoFila> {
  if (enviando || (typeof navigator !== 'undefined' && !navigator.onLine)) return { listas: 0 };
  enviando = true;
  let listas = 0;
  try {
    const audios = await db.audios.orderBy('criadoEm').toArray();
    for (const audio of audios) {
      let res: Response;
      try {
        res = await fetch('/api/audio', { method: 'POST', headers: { 'content-type': 'audio/wav' }, body: audio.wav });
      } catch {
        return { listas }; // a rede caiu de novo: tenta na próxima
      }
      const json = await res.json().catch(() => ({}));

      if (res.ok) {
        const lista = ListaDeAudioSchema.safeParse(json);
        if (!lista.success) return { listas, aviso: 'A IA respondeu fora do formato. O áudio continua guardado.' };
        await aoReceber(lista.data);
        await db.audios.delete(audio.id);
        listas += 1;
        continue;
      }
      // Esse áudio nunca vai funcionar (formato, tamanho): sai da fila e avisa.
      if (res.status === 400 || res.status === 413 || res.status === 415) {
        await db.audios.delete(audio.id);
        return { listas, aviso: json.erro || 'Não deu pra usar um dos áudios.' };
      }
      // Limite, IA fora ou serviço não configurado: o áudio espera.
      return { listas, aviso: json.erro };
    }
    return { listas };
  } finally {
    enviando = false;
  }
}
