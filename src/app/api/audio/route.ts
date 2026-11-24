import { NextResponse } from 'next/server';
import { IAIndisponivel, RecusadoPeloServidor, montarListaDeAudio } from '@/lib/ai.ts';
import { criarLimitador, ipDoCliente } from '@/lib/limite.ts';

/**
 * POST /api/audio (corpo: WAV) -> { itens, ouvido }
 * O app grava e converte pra WAV no celular; aqui só confere o básico e repassa
 * pro servidor do Cofu, que valida o áudio de verdade e chama a IA.
 */

// Áudio demora mais que texto pra a IA responder.
export const maxDuration = 60;

const MAX_BYTES = 2_500_000;
// Áudio custa mais que texto: limite menor que o da lista por texto.
const limitado = criarLimitador({ janelaMs: 10 * 60_000, max: 6 });

export async function POST(req: Request) {
  const ip = ipDoCliente(req.headers);
  if (limitado(ip)) return NextResponse.json({ erro: 'Muitos áudios seguidos. Espere uns minutos.' }, { status: 429 });

  if (!req.headers.get('content-type')?.startsWith('audio/wav')) {
    return NextResponse.json({ erro: 'Áudio em formato errado.' }, { status: 415 });
  }
  const declarado = Number(req.headers.get('content-length') || 0);
  if (declarado > MAX_BYTES) return NextResponse.json({ erro: 'Áudio muito longo (máximo 60 segundos).' }, { status: 413 });

  const wav = await req.arrayBuffer().catch(() => null);
  if (!wav || wav.byteLength < 44) return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 });
  if (wav.byteLength > MAX_BYTES) return NextResponse.json({ erro: 'Áudio muito longo (máximo 60 segundos).' }, { status: 413 });

  try {
    return NextResponse.json(await montarListaDeAudio(wav, ip));
  } catch (err) {
    if (err instanceof RecusadoPeloServidor) return NextResponse.json({ erro: err.erro }, { status: err.status });
    const motivo = err instanceof IAIndisponivel ? err.message : 'erro inesperado';
    console.error('[cofu/audio]', motivo);
    // Sem servidor configurado o áudio não tem como virar lista: o app guarda e avisa.
    const status = motivo === 'servidor do Cofu não configurado' ? 501 : 503;
    return NextResponse.json({ erro: status === 501 ? 'Lista por áudio ainda não está disponível.' : 'IA indisponível agora.' }, { status });
  }
}
