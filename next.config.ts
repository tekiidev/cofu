import { networkInterfaces } from 'node:os';
import type { NextConfig } from 'next';

// Em dev, libera abrir pelo IP desta máquina na rede (testar no celular pelo Wi-Fi).
const ipsDaRede = Object.values(networkInterfaces())
  .flat()
  .filter((i) => i && i.family === 'IPv4' && !i.internal)
  .map((i) => i!.address);

// Variáveis vêm do .env desta pasta (local) ou do painel da hospedagem.
// Versão do build: troca o cache do service worker a cada deploy.
const versao = process.env.VERCEL_GIT_COMMIT_SHA?.slice(0, 8) || Date.now().toString(36);

const config: NextConfig = {
  env: { NEXT_PUBLIC_VERSAO: versao },
  // E o túnel HTTPS (cloudflared) pra testar o microfone no celular.
  allowedDevOrigins: [...ipsDaRede, '*.trycloudflare.com'],
  poweredByHeader: false,
  // Não gerar AGENTS.md na raiz a cada `next dev`.
  agentRules: false,
  reactStrictMode: true,
  async headers() {
    return [
      {
        // Cabeçalhos básicos de segurança em todas as páginas.
        source: '/:path*',
        headers: [
          { key: 'X-Content-Type-Options', value: 'nosniff' },
          { key: 'Referrer-Policy', value: 'strict-origin-when-cross-origin' },
          { key: 'X-Frame-Options', value: 'DENY' },
          { key: 'Permissions-Policy', value: 'camera=(), geolocation=(), microphone=(self)' },
        ],
      },
      {
        // O service worker nunca fica velho no cache do navegador.
        source: '/sw.js',
        headers: [{ key: 'Cache-Control', value: 'no-cache' }],
      },
    ];
  },
};

export default config;
