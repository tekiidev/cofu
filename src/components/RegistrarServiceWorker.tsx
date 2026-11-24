'use client';

import { useEffect } from 'react';

/** Registra o service worker (offline) só em produção, pra não atrapalhar o dev. */
export function RegistrarServiceWorker() {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'production' || !('serviceWorker' in navigator)) return;
    // A versão na URL faz o navegador instalar o worker novo a cada deploy.
    const versao = encodeURIComponent(process.env.NEXT_PUBLIC_VERSAO || 'dev');
    navigator.serviceWorker.register(`/sw.js?v=${versao}`).catch(() => {});
  }, []);
  return null;
}
