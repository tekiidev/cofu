/**
 * Áudio gravado vira WAV mono 16 kHz no próprio celular, mesmo sem internet.
 * O gravador do navegador solta formatos diferentes (WebM no Chrome, MP4 no iPhone);
 * WAV é um só formato, que a IA aceita, e com fala em 16 kHz fica leve (~2 MB por minuto).
 */

export const TAXA = 16_000;
export const MAX_SEGUNDOS = 60;

/** Amostras (-1 a 1) para WAV PCM de 16 bits mono. */
export function codificarWav(amostras: Float32Array, taxa = TAXA): ArrayBuffer {
  const dados = amostras.length * 2;
  const buf = new ArrayBuffer(44 + dados);
  const v = new DataView(buf);
  const texto = (pos: number, s: string) => {
    for (let i = 0; i < s.length; i += 1) v.setUint8(pos + i, s.charCodeAt(i));
  };
  texto(0, 'RIFF');
  v.setUint32(4, 36 + dados, true);
  texto(8, 'WAVE');
  texto(12, 'fmt ');
  v.setUint32(16, 16, true); // tamanho do bloco fmt
  v.setUint16(20, 1, true); // PCM
  v.setUint16(22, 1, true); // mono
  v.setUint32(24, taxa, true);
  v.setUint32(28, taxa * 2, true); // bytes por segundo
  v.setUint16(32, 2, true); // bytes por amostra
  v.setUint16(34, 16, true); // bits
  texto(36, 'data');
  v.setUint32(40, dados, true);
  for (let i = 0; i < amostras.length; i += 1) {
    const s = Math.max(-1, Math.min(1, amostras[i]));
    v.setInt16(44 + i * 2, s < 0 ? s * 0x8000 : s * 0x7fff, true);
  }
  return buf;
}

/** Converte a gravação do navegador para WAV mono 16 kHz (só no navegador). */
export async function paraWav(gravacao: Blob): Promise<{ wav: Blob; segundos: number }> {
  const w = window as unknown as { AudioContext?: typeof AudioContext; webkitAudioContext?: typeof AudioContext };
  const Contexto = w.AudioContext || w.webkitAudioContext;
  if (!Contexto) throw new Error('sem AudioContext');
  const ctx = new Contexto();
  let som: AudioBuffer;
  try {
    som = await ctx.decodeAudioData(await gravacao.arrayBuffer());
  } finally {
    ctx.close().catch(() => {});
  }
  const segundos = Math.min(som.duration, MAX_SEGUNDOS);
  // O contexto offline com 1 canal a 16 kHz junta os canais e reamostra de uma vez.
  const offline = new OfflineAudioContext(1, Math.max(1, Math.ceil(segundos * TAXA)), TAXA);
  const fonte = offline.createBufferSource();
  fonte.buffer = som;
  fonte.connect(offline.destination);
  fonte.start();
  const pronto = await offline.startRendering();
  return { wav: new Blob([codificarWav(pronto.getChannelData(0))], { type: 'audio/wav' }), segundos };
}
