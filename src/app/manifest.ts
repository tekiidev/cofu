import type { MetadataRoute } from 'next';

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Cofu · sua feira no cofo',
    short_name: 'Cofu',
    description: 'Fale ou escreva o que vai comprar e o Cofu monta a lista. Funciona sem internet.',
    start_url: '/',
    display: 'standalone',
    background_color: '#fbf6ec',
    theme_color: '#fbf6ec',
    lang: 'pt-BR',
    icons: [
      { src: '/icon.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'any' },
      { src: '/icon-maskable.svg', sizes: 'any', type: 'image/svg+xml', purpose: 'maskable' },
    ],
    // Segurar o ícone do app mostra esses atalhos.
    shortcuts: [
      { name: 'Falar a lista', short_name: 'Falar', url: '/?falar=1', icons: [{ src: '/icon.svg', sizes: 'any' }] },
      { name: 'Modo figuras', short_name: 'Figuras', url: '/?modo=figuras', icons: [{ src: '/icon.svg', sizes: 'any' }] },
    ],
    // Android: o Cofu aparece no "Compartilhar"; o texto vira lista (lido em src/lib/pedido.ts).
    share_target: {
      action: '/',
      method: 'GET',
      params: { title: 'title', text: 'text', url: 'url' },
    },
  };
}
