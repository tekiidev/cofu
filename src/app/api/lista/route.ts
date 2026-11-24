import { NextResponse } from 'next/server';
import { IAIndisponivel, montarLista } from '@/lib/ai.ts';
import { criarLimitador, ipDoCliente } from '@/lib/limite.ts';

/**
 * POST /api/lista { texto } -> { itens }
 * Rota pública: limita tamanho do texto e quantas chamadas cada IP faz, e repassa
 * pro serviço da IA (COFU_SERVER_URL). Se ele falhar, responde 503
 * e o app usa o leitor simples no aparelho.
 */

const MAX_TEXTO = 1200;
const limitado = criarLimitador({ janelaMs: 10 * 60_000, max: 20 });

export async function POST(req: Request) {
  const ip = ipDoCliente(req.headers);
  if (limitado(ip)) {
    return NextResponse.json({ erro: 'Muitos pedidos seguidos. Espere uns minutos.' }, { status: 429 });
  }

  let texto = '';
  try {
    const body = await req.json();
    texto = typeof body?.texto === 'string' ? body.texto.trim() : '';
  } catch {
    return NextResponse.json({ erro: 'Pedido inválido.' }, { status: 400 });
  }
  if (!texto) return NextResponse.json({ erro: 'Escreva ou fale o que vai comprar.' }, { status: 400 });
  if (texto.length > MAX_TEXTO) {
    return NextResponse.json({ erro: `Texto muito longo (máximo ${MAX_TEXTO} letras).` }, { status: 413 });
  }

  try {
    const itens = await montarLista(texto, ip);
    return NextResponse.json({ itens });
  } catch (err) {
    const motivo = err instanceof IAIndisponivel ? err.message : 'erro inesperado';
    console.error('[cofu/lista]', motivo);
    return NextResponse.json({ erro: 'IA indisponível agora.' }, { status: 503 });
  }
}
