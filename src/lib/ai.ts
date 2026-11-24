import { ListaDeAudioSchema, ListaSugeridaSchema, type ItemSugerido, type ListaDeAudio } from './items.ts';

/**
 * A IA é opcional e configurável por URL (COFU_IA_URL). A chamada sai só do
 * servidor do app, com token; o navegador nunca vê chave nem token. Toda resposta
 * é validada com Zod antes de usar.
 * Sem IA configurada, ou se ela falhar, o app usa o leitor simples no aparelho.
 */

const TIMEOUT_MS = 28_000;

export class IAIndisponivel extends Error {}

export async function montarLista(texto: string, clienteIp = 'desconhecido'): Promise<ItemSugerido[]> {
  const url = process.env.COFU_IA_URL;
  const token = process.env.COFU_IA_TOKEN;
  if (!url || !token) throw new IAIndisponivel('IA não configurada');

  const res = await fetch(`${url.replace(/\/$/, '')}/v1/lista`, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: { 'content-type': 'application/json', authorization: `Bearer ${token}`, 'x-cliente-ip': clienteIp },
    body: JSON.stringify({ texto }),
  }).catch((err) => {
    throw new IAIndisponivel(err?.name === 'TimeoutError' ? 'IA demorou demais' : 'IA fora do ar');
  });
  if (!res.ok) throw new IAIndisponivel(`IA respondeu ${res.status}`);

  const validado = ListaSugeridaSchema.safeParse(await res.json().catch(() => null));
  if (!validado.success) throw new IAIndisponivel('resposta fora do formato');
  return validado.data.itens;
}

/** Código HTTP que a IA devolveu, pra a rota repassar (limite, formato). */
export class PedidoRecusado extends Error {
  constructor(
    public status: number,
    public erro: string,
  ) {
    super(`recusado: ${status}`);
  }
}

// Áudio demora mais que texto pra a IA responder.
const TIMEOUT_AUDIO_MS = 50_000;

/** Manda o WAV pra IA, que devolve os itens e o que ouviu. */
export async function montarListaDeAudio(wav: ArrayBuffer, clienteIp = 'desconhecido'): Promise<ListaDeAudio> {
  const url = process.env.COFU_IA_URL;
  const token = process.env.COFU_IA_TOKEN;
  if (!url || !token) throw new IAIndisponivel('IA não configurada');

  const res = await fetch(`${url.replace(/\/$/, '')}/v1/audio`, {
    method: 'POST',
    signal: AbortSignal.timeout(TIMEOUT_AUDIO_MS),
    headers: { 'content-type': 'audio/wav', authorization: `Bearer ${token}`, 'x-cliente-ip': clienteIp },
    body: wav,
  }).catch((err) => {
    throw new IAIndisponivel(err?.name === 'TimeoutError' ? 'IA demorou demais' : 'IA fora do ar');
  });
  const json = await res.json().catch(() => null);
  if ([400, 413, 415, 429].includes(res.status)) {
    throw new PedidoRecusado(res.status, typeof json?.erro === 'string' ? json.erro : 'Áudio recusado.');
  }
  if (!res.ok) throw new IAIndisponivel(`IA respondeu ${res.status}`);

  const validado = ListaDeAudioSchema.safeParse(json);
  if (!validado.success) throw new IAIndisponivel('resposta fora do formato');
  return validado.data;
}
