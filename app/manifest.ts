import type { MetadataRoute } from 'next';
import { XGESTAO_HOME } from '@features/xgestao/routes';

/**
 * PWA (11/11/2026) — o app instalado é o xgestão: abre direto no painel (quem
 * não está logado passa pelo login antes). O escopo é o site todo para login,
 * cadastro, termos e recuperar senha continuarem dentro do app.
 *
 * Sem service worker de propósito: o Chrome já instala sem ele, e cache de
 * página é o que poderia deixar alguém preso numa versão antiga depois de um
 * publish.
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    id: '/xgestao',
    name: 'xgestão | XConstrução',
    short_name: 'xgestão',
    description: 'Gestão das suas obras na palma da mão.',
    lang: 'pt-BR',
    start_url: XGESTAO_HOME,
    scope: '/',
    display: 'standalone',
    background_color: '#ffffff',
    theme_color: '#ffffff',
    categories: ['business', 'productivity'],
    icons: [
      { src: '/icons/icon-192.png', sizes: '192x192', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-512.png', sizes: '512x512', type: 'image/png', purpose: 'any' },
      { src: '/icons/icon-maskable-512.png', sizes: '512x512', type: 'image/png', purpose: 'maskable' },
    ],
  };
}
