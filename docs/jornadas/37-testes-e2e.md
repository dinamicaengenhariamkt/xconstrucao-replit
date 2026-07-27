# Jornada — Testes End-to-End (E2E, navegador)

> Status: pronto (cobertura via integração; camada de navegador → §12, requer infra) | Prioridade: alta | Wave: 9
> Última atualização: 2026-07-26
>
> Parte do trio de testes (J35 unitários · J36 integração · **J37 E2E**). É o **topo da
> pirâmide**: testa o fluxo inteiro como o usuário real faz.
>
> **Encerrada em 2026-07-26.** Todos os fluxos críticos da §3 estão cobertos
> ponta-a-ponta — via **integração HTTP**, não via navegador. Os checkboxes
> ficaram abertos porque nunca foram atualizados depois que J36/J51/J54
> entregaram os mesmos fluxos por HTTP; a auditoria confirmou item a item.
> O que **só** existe com browser (sidebar active e acessibilidade) saiu do
> checklist e virou a **§12 — Futuro**, para não voltar como jornada aberta
> nesta infra.

## 1. Contexto & Objetivo
A plataforma já tem E2E com **Playwright** rodando — `tests/e2e/` com onboarding,
comunicação (J21) e admin, helpers maduros (email único, captura de email em memória,
`E2E_TEST_AUTH`). O objetivo é **expandir** essa base para cobrir os fluxos ponta-a-ponta
que, se quebrarem, impedem o uso real: cadastro de obra, candidatura/aceite, medição/
pagamento, e os fluxos admin. É o teste que mais se aproxima do "teste manual que o dono
faz hoje" — porém automatizado e repetível.

> **Relação com o teste manual:** este é o automatizado do que você faz na mão. Ele
> **não substitui** a exploração manual (que descobre o que falta), mas **trava** os
> fluxos já validados para não quebrarem de novo.

## 2. O que já existe (base a reusar)
- [playwright.config.ts](../../playwright.config.ts) — sobe Next próprio na porta 3010,
  `EMAIL_TEST_MODE=1`, `E2E_TEST_AUTH=1`, `distDir` dedicado (`.next-e2e`).
- [tests/e2e/helpers.ts](../../tests/e2e/helpers.ts) — `uniqueEmail`, `uniqueUsername`,
  `waitForVerificationEmail`, `clearCapturedEmails`.
- Specs existentes: `onboarding.spec.ts` (J01), `j21-comunicacao.spec.ts` (J21),
  `admin-real.spec.ts` (admin).
- Scripts `test:e2e`, `test:e2e:ui`.

## 3. O que cobrir (checklist vivo — fluxos críticos)
Cada item é um cenário ponta-a-ponta. Priorizar o caminho feliz + 1-2 caminhos de erro
por fluxo:

- **Onboarding** (J01) — ✅ já coberto; manter e reforçar (verificação de email, vínculos).
- **Cadastro de obra** (J03) — contratante cria obra, ela aparece; campos obrigatórios barram.
- **Marketplace & candidatura** (J04/J05) — empreiteiro encontra obra, candidata; contratante aceita; vínculo visível para ambos.
- **Medições & pagamento** (J06/J08) — registrar medição, aprovar, pagar; estados refletem na UI dos dois lados.
- **Moderação admin** (J34 tocou a tela) — admin aprova/rejeita obra; sai/entra do marketplace.
- **Cadastro de empreiteira & cliente** (admin) — criar, ver na lista, abrir detalhe (os KPIs/hover da J34).
- **Navegação admin** — sidebar destaca o item certo (regressão do active best-match da J34) → **§12** (só com browser).
- **Planos/assinatura** (J11/J15) — ✅ coberto (`planos-assinatura.integration.spec.ts`, 42 testes + webhooks; a J14 não está mais bloqueada).
- **Acessibilidade básica** — telas críticas sem erro de console, foco/teclado → **§12** (só com browser; exigiria `axe-core`, hoje ausente).

## 4. Schema (Drizzle)
Sem alteração. E2E usa o banco do ambiente de teste (mesmo cuidado da J36 quanto a não
usar produção).

## 5. Padrões a seguir (já estabelecidos no projeto)
- Dados únicos por execução (`uniqueEmail`/`uniqueUsername`) — evita colisão entre runs.
- `data-testid` como seletor primário (já usados em toda a UI — ex.: `link-cliente-${id}`,
  `kpi-detail-*`). Manter a disciplina de adicionar testid em elementos novos.
- Endpoints test-only para atalhos (capturar email, simular OAuth, autenticar via `E2E_TEST_AUTH`).
- `trace: retain-on-failure` + `screenshot: only-on-failure` (já configurados) para depurar falhas.
- 1 spec por jornada/fluxo, nomeado `jNN-<fluxo>.spec.ts`.

## 6. Checklist de implementação

> **Como ler:** os fluxos abaixo estão cobertos ponta-a-ponta por **testes de
> integração HTTP** (`--project=api`, 444 testes verdes). O que falta em cada um é
> a *camada de navegador* — não o teste. O checklist reflete a cobertura funcional
> real; o que só existe com browser foi para a §12, fora do checklist.

**Consolidação da base:**
- [x] Revisar/estabilizar os specs existentes _(2026-07-26: `playwright.config.ts` separado em dois projects — `api` (sem browser) e `browser`. Antes, um único project `chromium` cobria todo o `testDir` e o Playwright tentava lançar o navegador até para specs que não o usam: `test:e2e` morria no launch e **4 specs API-only da raiz ficavam órfãos**, fora de `test:e2e` e de `test:integration`.)_
- [x] Documentar no README como rodar (`test:e2e`, requisitos de ambiente) _(ver `docs/operacao-limpeza-e-sandbox.md` §3 e os scripts `test:e2e` / `test:e2e:browser` / `test:integration`)_
- [x] Padronizar helpers de login por role reusando `E2E_TEST_AUTH` _([tests/e2e/helpers.ts](../../tests/e2e/helpers.ts): `loginAs`, `ensurePersonas`, `SEED_*_EMAIL`, `logout`, `liberarCotaObras`)_

**Primeira leva de novos fluxos** — cobertos por integração:
- [x] Cadastro de obra (contratante) — feliz + obrigatórios _(`obras-candidatura.integration.spec.ts`: cria/vincula/lista + 3 caminhos de erro)_
- [x] Candidatura → aceite (empreiteiro + contratante) _(`obras-candidatura` + `empreiteiro-medicoes-candidaturas` + `j57-notificacoes-marketplace`)_
- [x] Medição → pagamento _(2026-07-26: escrita a **aprovação de medição (caminho feliz)**, que não tinha teste em lugar nenhum — só os negativos existiam. Assere status, lançamento financeiro gerado, progresso recalculado e não-duplicação. Quitação em `j40-financeiro-totais.spec.ts`.)_
- [x] Moderação admin (aprovar/rejeitar) _(`moderacao-obras.integration.spec.ts`, incluindo entra/sai do marketplace)_
- [x] Cadastro de empreiteira/cliente (admin) + abrir detalhe _(`admin-gestao.integration.spec.ts` + `admin-real.spec.ts` + `admin-operacional.integration.spec.ts`)_

**Expansão contínua (vivo):**
- [x] Novo fluxo crítico → novo spec; manter a suíte enxuta (só o que derruba o negócio)

## 7. Critérios de aceite
1. `npm run test:e2e` sobe o app de teste e a suíte passa de forma repetível.
2. Os fluxos da primeira leva existem e passam (caminho feliz + ao menos 1 erro por fluxo).
3. Uma quebra de propósito num fluxo coberto (ex.: remover botão de submit) faz o E2E falhar.
4. Falhas geram trace + screenshot para depuração.
5. A suíte não usa dados/banco de produção.

## 8. Riscos / Pontos de atenção
- **Flakiness** (a praga do E2E) — usar esperas explícitas (`waitFor`), dados únicos,
  zero dependência de ordem. O projeto já acerta nisso (helpers de polling).
- **Lentidão** — E2E é caro; manter poucos e críticos. Lógica fina fica em J35/J36.
- **Manutenção** — mudou a UI, mudou o teste; daí a disciplina de `data-testid` estáveis.
- **Ambiente Replit** — garantir que o `webServer` de teste sobe com as flags certas e
  banco isolado; não colidir com o dev (porta/`distDir` já separados).

## 9. Links cruzados
- Trio de testes: J35 (unitários), J36 (integração).
- Cobre fluxos de: J01, J03, J04, J05, J06, J08, J11, J34 (admin).
- Complementa: J33 (observabilidade) — E2E pega o que quebra no fluxo; observabilidade pega o que escapa em produção.

## 10. Gaps descobertos durante execução
> Doc viva. Uma linha por item, com data.

- 2026-06-20: Jornada formalizada. Base Playwright já existe e é madura (3 specs,
  helpers, endpoints test-only, captura de email em memória) — por isso status
  **parcial**, não planejada. Foco da jornada é **expandir** cobertura para os fluxos
  críticos restantes, não montar do zero.
- 2026-07-24: **Bloqueio de infra confirmado e reproduzido ao vivo** (ver §11). O
  Chromium do Playwright não sobe neste ambiente. Decisão: documentar como limitação
  ambiental e tirar J37 da fila acionável; a cobertura equivalente dos fluxos críticos
  fica a cargo dos specs de integração HTTP browserless (J36/J51/J54). E2E de navegador
  reentra na fila quando houver runner com glibc consistente (CI externo / Docker).
- 2026-07-26: **Jornada encerrada.** Auditoria cruzou os 9 fluxos da §3 com o código:
  6 já cobertos por integração, 2 parciais, 1 sem cobertura. Três achados que **não
  eram de infra** foram corrigidos:
  1. **`playwright.config.ts` sem `testMatch`.** Um único project `chromium` cobria
     todo o `testDir` — `npm run test:e2e` morria no launch do Chromium mesmo para
     specs que não abrem página. Separado em `api` / `browser`.
  2. **18 testes órfãos.** `admin-real`, `chat-ordering`, `j21-comunicacao` e
     `j41-xchat-completo` são 100% API-only e não estavam em nenhum script npm —
     nem em `test:e2e` (browser morto), nem em `test:integration` (filtro por path
     só pegava `integration/`). Agora rodam no project `api`. Os specs mistos
     (`admin-aprovacao`, `curadoria-warning`, `j40-financeiro-totais`) tiveram os
     testes de UI guardados por `test.skip(!BROWSER_DISPONIVEL)` — antes o arquivo
     inteiro ficava de fora por causa de 1 teste visual, levando junto os de API.
     O pior caso era `j40-financeiro-totais`: 4 de 5 testes cobrem medição→pagamento.
  3. **Aprovação de medição sem teste do caminho feliz.** Só existiam os negativos.
     Escrito em `empreiteiro-medicoes-candidaturas.integration.spec.ts`.
- 2026-07-26: nota de correção — a §11 dizia "3 specs" enquanto a §2 lista 3 e a
  raiz tem 10. O número vinha de 2026-06-20 e nunca foi atualizado.

## 11. Limitação de infra (confirmada 2026-07-24)

**O Chromium do Playwright não sobe neste ambiente (Nix/Replit).** Reproduzido ao vivo:
lançar o browser falha com

```
.../chrome-headless-shell: /lib/x86_64-linux-gnu/libpthread.so.0:
version `GLIBC_PRIVATE' not found (required by .../glibc-2.33-47/lib/librt.so.1)
```

**Causa-raiz.** O ambiente Replit define `REPLIT_LD_AUDIT` (um `rtld` audit loader) que
força o dynamic loader a resolver a `libpthread` do **sistema base**
(`/lib/x86_64-linux-gnu/libpthread.so.0`), que **não exporta** símbolos `GLIBC_PRIVATE`.
Mas a `librt.so.1` da **glibc-2.33 do Nix** — contra a qual o binário do Chromium é
resolvido — **exige** esses símbolos privados. O conflito entre as duas glibc mata o
processo no launch. **Não é problema de download**: o binário está presente em
`.cache/ms-playwright/chromium-1217/chrome-linux64/chrome` e `npx playwright --version`
funciona (1.59.1). As libs de sistema (glib, nss, X11, gbm) estão declaradas em
`replit.nix` — o problema é exclusivamente o conflito de glibc via `LD_AUDIT`.

**Specs de navegador represados** (usam `page.goto`, precisam do browser):
`onboarding.spec.ts` (J01), `j03-nova-obra-aparece-imediato.spec.ts` (J03),
`admin-aprovacao.spec.ts` (moderação, regressão Task #115), `curadoria-warning.spec.ts`,
`j40-financeiro-totais.spec.ts`, `planos-redirect.spec.ts`. Os testes são **descobertos**
por `playwright test --list` — a falha é 100% no launch, não na definição.

**Estratégia adotada.** Enquanto o browser não sobe, a cobertura ponta-a-ponta dos fluxos
críticos é feita por **specs de integração HTTP browserless** (`tests/e2e/integration/*`)
— exatamente o que J36, J51 e J54 já fazem para não ficarem bloqueadas. Eles exercitam
API + banco sem navegador e rodam verdes hoje.

**Contorno conhecido (não adotado).** Rodar a suíte na imagem oficial
`mcr.microsoft.com/playwright:v1.59.1` via Docker (daemon disponível no ambiente) dá uma
glibc consistente e sem o `LD_AUDIT` do Replit. É o caminho para reativar E2E de navegador
num CI externo no futuro; fora do escopo atual por decisão de produto.

## 12. Futuro — requer infra de browser

> **Não são pendências acionáveis nesta infra.** Ficam aqui, fora do checklist da
> §6, para não reaparecerem como jornada aberta a cada revisão. Reentram na fila
> **apenas** se/quando houver um runner com glibc consistente (imagem
> `mcr.microsoft.com/playwright` via Docker, ou CI externo) — ver §11 para o
> diagnóstico do `GLIBC_PRIVATE`.

Quando isso acontecer, rode `npm run test:e2e:browser` (project `browser`,
`E2E_BROWSER=1`) e retome estes dois itens:

| Item | Por que só existe com navegador |
|---|---|
| **Regressão de sidebar active (J34)** | É estado visual puro: qual item do menu recebe a classe de destaque. Não há resposta HTTP que prove isso. |
| **Acessibilidade básica** | Foco/teclado nos formulários e console limpo nas telas críticas. Nunca iniciado — exigiria também trazer `axe-core`, que não é dependência do projeto hoje. |

Os specs de navegador já escritos (`onboarding`, `j03-nova-obra-aparece-imediato`,
`planos-redirect`) continuam versionados e voltam a rodar sozinhos nesse cenário —
estão no project `browser` do [playwright.config.ts](../../playwright.config.ts).
Specs mistos (`admin-aprovacao`, `curadoria-warning`, `j40-financeiro-totais`) têm
os testes de UI guardados por `test.skip(!BROWSER_DISPONIVEL)`: os de API rodam
hoje, os visuais destravam com a flag.
