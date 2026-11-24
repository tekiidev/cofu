/**
 * Limite de pedidos por IP, guardado na memória do servidor.
 * Vale por instância: se a hospedagem subir várias, cada uma conta separado,
 * e um reinício zera a contagem. Serve pra segurar abuso simples, não ataque.
 */

export function criarLimitador({ janelaMs, max, maxChaves = 5000 }: { janelaMs: number; max: number; maxChaves?: number }) {
  const chamadas = new Map<string, number[]>();

  /** true = passou do limite (não conta a chamada). */
  return function limitado(chave: string, agora = Date.now()) {
    const recentes = (chamadas.get(chave) || []).filter((t) => agora - t < janelaMs);
    if (recentes.length >= max) {
      chamadas.set(chave, recentes);
      return true;
    }
    recentes.push(agora);
    chamadas.set(chave, recentes);
    // Limpeza simples pra o mapa não crescer pra sempre.
    if (chamadas.size > maxChaves) {
      for (const [k, v] of chamadas) if (!v.some((t) => agora - t < janelaMs)) chamadas.delete(k);
    }
    return false;
  };
}

/**
 * IP de quem chamou. O x-forwarded-for chega como "cliente, proxy1, proxy2":
 * o começo da lista quem escreve é o próprio cliente (dá pra inventar), então
 * usa o último valor, que é o que o proxy da hospedagem acrescentou.
 */
export function ipDoCliente(headers: Headers) {
  const encaminhado = headers
    .get('x-forwarded-for')
    ?.split(',')
    .map((s) => s.trim())
    .filter(Boolean);
  return encaminhado?.at(-1) || headers.get('x-real-ip')?.trim() || 'local';
}
