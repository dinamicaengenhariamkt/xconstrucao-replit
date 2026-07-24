# Jornada — Testes End-to-End (E2E, navegador)

> Status: parcial (bloqueado por infra — limitação documentada) | Prioridade: alta | Wave: 9
> Última atualização: 2026-07-24
>
> Parte do trio de testes (J35 unitários · J36 integração · **J37 E2E**). É o **topo da
> pirâmide**: testa o fluxo inteiro pelo navegador, como o usuário real faz (abre tela,
> preenche, clica, vê o resultado). Poucos, lentos e caros — reservados para os fluxos
> **críticos de negócio**. Status **parcial** porque o projeto **já tem base Playwright**
> funcionando; esta jornada formaliza e expande a cobertura.

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
- **Navegação admin** — sidebar destaca o item certo (regressão do active best-match da J34); trocar de seção funciona.
- **Planos/assinatura** (J11/J15) — fluxo de seleção de plano (até onde o gateway permite, J14 bloqueada).
- **Acessibilidade básica** — telas críticas sem erro de console, foco/teclado nos formulários principais.

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
**Consolidação da base:**
- [ ] Revisar/estabilizar os 3 specs existentes (garantir que passam de forma repetível).
- [ ] Documentar no README como rodar (`test:e2e`, requisitos de ambiente).
- [ ] Padronizar helpers de login por role (contratante/empreiteiro/admin) reusando `E2E_TEST_AUTH`.

**Primeira leva de novos fluxos:**
- [ ] Cadastro de obra (contratante) — feliz + obrigatórios.
- [ ] Candidatura → aceite (empreiteiro + contratante).
- [ ] Medição → pagamento.
- [ ] Moderação admin (aprovar/rejeitar).
- [ ] Cadastro de empreiteira/cliente (admin) + abrir detalhe.
- [ ] Regressão de navegação: sidebar active correto (J34).

**Expansão contínua (vivo):**
- [ ] Novo fluxo crítico → novo spec; manter a suíte enxuta (só o que derruba o negócio).

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
