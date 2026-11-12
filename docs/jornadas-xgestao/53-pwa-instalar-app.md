# 53. PWA: instalar o xgestão no celular

Data: 11/11/2026. Pedido do Ramon depois da conversa com o Eder: o app nas lojas (Play Store e App Store) fica para a fase 2; até lá, o xgestão vira PWA para o pessoal usar como app no celular.

## O que a pessoa vê

| Onde | Como |
|---|---|
| Home (`/`), seção "Leve o xgestão no celular" | No computador: QR code para `/instalar`. No celular: o passo a passo do aparelho. |
| `/instalar` (destino do QR code) | Android com convite do Chrome: botão "Instalar o app" (1 toque e confirmar). Android sem convite: menu ⋮ > Instalar app. iPhone: Compartilhar > Adicionar à Tela de Início. Instagram/Facebook: abrir no navegador. Aberto pelo app instalado: vai direto ao painel. |
| Painel do xgestão | Item "Instalar app" no menu lateral (diálogo com o mesmo passo a passo; QR no computador). No celular, faixa fina "Use o xgestão como app no celular" que some ao instalar ou fechar (guardado no aparelho). Nada disso aparece dentro do app instalado. |

## Técnico

- `app/manifest.ts`: `start_url` = `/xgestao/dashboard` (sem sessão, passa pelo login), `scope` = `/` (login, cadastro, termos e recuperar senha ficam dentro do app), `display: standalone`.
- Ícones: o símbolo do logo em fundo branco. `public/icons/` (192, 512, maskable 512), `app/apple-icon.png` (iPhone) e `app/icon.png` (favicon do site, que não existia).
- `app/layout.tsx`: `appleWebApp`, `applicationName`, `viewport.themeColor` e um script curto que guarda o `beforeinstallprompt` do Android antes de o React montar (`features/pwa/lib/captura-instalacao.ts`).
- Detecção do aparelho: `features/pwa/lib/plataforma.ts` (função pura, com teste).
- **Sem service worker**, de propósito: o Chrome instala sem ele, e cache de página poderia prender alguém numa versão antiga depois de um publish. Se um dia houver modo offline ou notificação push, ele entra com cache só de arquivos estáticos.
- Nada muda em rotas, API, banco, login, Asaas, `.replit` ou deploy. Para quem usa só pelo navegador, o manifesto é ignorado.

## Testes

- Unitário: `tests/unit/pwa-plataforma.test.ts` (aparelhos, script de captura, manifesto).
- Navegador: `tests/e2e/pwa-instalar.browser.spec.ts` (manifesto e ícones, home com QR, `/instalar` em iPhone, Android, Instagram e já instalado, faixa e menu do painel, navegação dentro do app instalado). O convite do Android é simulado com o mesmo evento do Chrome.

## Falta testar em aparelho de verdade

O navegador de teste não instala app. Antes de anunciar:

1. Android (Chrome): instalar pela home, pelo QR e pela faixa do painel; abrir pelo ícone; sair e entrar.
2. iPhone (Safari): Adicionar à Tela de Início; abrir pelo ícone; login (no iPhone o app tem login separado do Safari).
3. Pelo app instalado: assinar um plano no sandbox. O checkout do Asaas abre em outra página e volta para `/xgestao/planos/sucesso`; conferir que volta para dentro do app e que o plano aparece ativo.
4. Pelo app instalado: abrir PDF/documento, compartilhar no WhatsApp e o link do cliente.

## Fase 2 (lojas)

O mesmo botão passa a mandar o Android para a Play Store e o iPhone para a App Store. O Android pode sair do próprio PWA (TWA); a App Store pede app nativo, que é um projeto à parte consumindo a mesma API, com login por token.
