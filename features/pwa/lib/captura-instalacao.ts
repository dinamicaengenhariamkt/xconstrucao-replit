/**
 * PWA — script curto que vai no `<body>` do layout raiz, antes de tudo.
 *
 * O Android dispara `beforeinstallprompt` uma vez, cedo, às vezes antes de o
 * React montar. O script guarda o evento em `window.__pwaEvento` e avisa com
 * `pwa:mudou`; o hook `useInstalarApp` só lê. Fica fora do módulo do hook
 * (que é `use client`) para o layout do servidor receber a string de verdade.
 */
export const AVISO_PWA = 'pwa:mudou';

export const SCRIPT_CAPTURA_INSTALACAO = `(function(){var a=function(){window.dispatchEvent(new Event('${AVISO_PWA}'))};window.addEventListener('beforeinstallprompt',function(e){e.preventDefault();window.__pwaEvento=e;a()});window.addEventListener('appinstalled',function(){window.__pwaEvento=null;window.__pwaInstalado=true;a()})})();`;
