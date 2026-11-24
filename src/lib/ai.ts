import { ListaDeAudioSchema, ListaSugeridaSchema, type ItemSugerido, type ListaDeAudio } from './items.ts';

/**
 * A IA da lista roda num serviço separado (COFU_SERVER_URL): prompt, modelos e
 * ajustes ficam lá. Este app só repassa o pedido, com o token compartilhado,
 * e valida a resposta com Zod antes de usar.
 * Sem o servidor configurado, ou se ele falhar, o app usa o leitor simples no aparelho.
 */

const TIMEOUT_MS = 28_000;

export class IAIndisponivel extends Error {}

export async function montarLista(texto: string, clienteIp = 'desconhecido'): Promise<ItemSugerido[]> {
  const url = process.env.COFU_SERVER_URL;
  const token = process.env.COFU_SERVER_TOKEN;
  if (!url || !token) throw new IAIndisponivel('servidor do Cofu não configurado');

  const res = await fetch(`${url.replace(/\/$/, '')}/v1/lista`, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'x-cliente-ip': clienteIp },
    body: JSON.stringify({ texto }),
  }).catch((err) => {
    throw new IAIndisponivel(err?.name === 'TimeoutError' ? 'servidor demorou demais' : 'servidor fora do ar');
  });
  if (!res.ok) throw new IAIndisponivel(`servidor respondeu ${res.status}`);

  const validado = ListaSugeridaSchema.safeParse(await res.json().catch(() => null));
  if (!validado.success) throw new IAIndisponivel('resposta fora do formato');
  return validado.data.itens;
}

/** Código HTTP que o servidor do Cofu devolveu, pra a rota repassar (limite, formato). */
export class RecusadoPeloServidor extends Error {
  constructor(
    public status: number,
    public erro: string,
  ) {
    super(`servidor recusou: ${status}`);
  }
}

// Áudio demora mais: o servidor dá até 45 s pra IA.
const TIMEOUT_AUDIO_MS = 50_000;

/** Manda o WAV pro servidor do Cofu, que devolve os itens e o que a IA ouviu. */
export async function montarListaDeAudio(wav: ArrayBuffer, clienteIp = 'desconhecido'): Promise<ListaDeAudio> {
  const url = process.env.COFU_SERVER_URL;
  const token = process.env.COFU_SERVER_TOKEN;
  if (!url || !token) throw new IAIndisponivel('servidor do Cofu não configurado');

  const res = await fetch(`${url.replace(/\/$/, '')}/v1/audio`, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_AUDIO_MS),
    headers: { 'content-type': 'audio/wav', authorization: `Bearer ${token}`, 'x-cliente-ip': clienteIp },
    body: wav,
  }).catch((err) => {
    throw new IAIndisponivel(err?.name === 'TimeoutError' ? 'servidor demorou demais' : 'servidor fora do ar');
  });
  const json = await res.json().catch(() => null);
  if ([400, 413, 415, 429].includes(res.status)) {
    throw new RecusadoPeloServidor(res.status, typeof json?.erro === 'string' ? json.erro : 'Áudio recusado.');
  }
  if (!res.ok) throw new IAIndisponivel(`servidor respondeu ${res.status}`);

  const validado = ListaDeAudioSchema.safeParse(json);
  if (!validado.success) throw new IAIndisponivel('resposta fora do formato');
  return validado.data;
}
