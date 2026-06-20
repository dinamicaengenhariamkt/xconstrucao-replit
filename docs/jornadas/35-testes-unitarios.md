# Jornada — Testes Unitários (fundação de qualidade)

> Status: planejada | Prioridade: alta | Wave: 9
> Última atualização: 2026-06-20
>
> Parte do trio de testes (J35 unitários · J36 integração · J37 E2E), criado a partir
> da demanda do dono de dar **robustez pré-produção** à plataforma: além do teste
> manual (descobrir o que falta), uma **rede de segurança automatizada** que impede
> regressão quando novas mudanças entram. Esta jornada é a **base da pirâmide** —
> muitos testes rápidos e baratos sobre a lógica pura — e carrega a **fundação** que
> as outras herdam (Vitest, ESLint, hook de auto-validação).

## 1. Contexto & Objetivo
Hoje o projeto tem **zero testes unitários** (só E2E Playwright). Há muita lógica pura
sem rede: formatadores, cálculos financeiros, validações, helpers de rota. O objetivo
é instalar a fundação de teste unitário (**Vitest**) e cobrir progressivamente essa
lógica, garantindo que funções como `safePercent` (que já causou `NaN%`) ou o
best-match da sidebar **não regridam**.

> **Escopo realista (decisão do dono):** NÃO testar tudo de uma vez — é checklist vivo,
> marcado item a item ao longo do tempo. Unitário só onde há **lógica que pode errar**;
> componentes triviais e telas ficam para integração/E2E.

## 2. Por que Vitest (e não Jest)
- Mais rápido (motor Vite/esbuild), TypeScript/ESM nativos sem config pesada.
- API compatível com Jest (`describe/it/expect`) — curva mínima.
- Integra com o ecossistema do projeto (Next + TS). **Jest seria a opção legada.**

## 3. Fundação a montar (itens iniciais desta jornada)
1. **Vitest** — instalar (`vitest`, `@vitest/coverage-v8`), config (`vitest.config.ts`)
   com alias `@shared`/`@features` espelhando o `tsconfig.json`, ambiente `node` (e
   `jsdom`/`happy-dom` só se for testar hooks/componentes), e `globals: true`.
2. **Scripts** no `package.json`: `test` (unit run), `test:watch`, `test:cov`.
3. **Separação clara do Playwright** — Vitest cobre `**/*.test.ts(x)`; o `testDir` do
   Playwright já é `tests/e2e/`. Garantir que um não rode os arquivos do outro
   (excludes no `vitest.config.ts`).
4. **ESLint** — o projeto **não tem lint hoje**. Configurar ESLint (flat config) +
   regras TS/React/Next, script `lint`. Pego "quebra de código" que o `tsc` não pega
   (variáveis não usadas, hooks mal usados, etc.). *(Decisão do dono: type-check + lint
   sempre; CI no GitHub Actions NÃO agora — deploy é direto no Replit.)*
5. **Hook de auto-validação (substitui o CI no fluxo Replit):** configurar no
   `.claude/settings.json` um hook que, ao terminar de editar arquivos, rode
   `npm run check` + `npm run lint` + `npm test` (ou ao menos os testes afetados) — pra
   que, sempre que mexermos numa tela/lógica, a quebra apareça na hora. Alternativa
   leve: um skill `/validate` invocável. *(Ver `update-config` skill para hooks.)*

## 4. O que cobrir (checklist vivo — lógica pura prioritária)
Mapa do que tem lógica testável hoje (expandir conforme a plataforma cresce):

- **Formatadores / utils financeiros**
  - [shared/lib/formatters.ts](../../shared/lib/formatters.ts) — `formatCurrency`, `formatRange`, `getInitials`.
  - [features/admin/financeiro/utils.ts](../../features/admin/financeiro/utils.ts) — `safePercent` (casos: total 0, negativo, NaN), `formatPercentage`, `formatCompactCurrency`.
- **Cálculos / regras de negócio (puras)**
  - `calcularDeltaPercent`, `pct()` e afins em [caixa-service.ts](../../features/admin/financeiro/api/caixa-service.ts) — extrair as partes puras se necessário para testar sem banco.
  - Regras de status/health (saúde da obra), margens/lucro (J17/J18).
- **Helpers de rota / UI lógica**
  - Best-match `isActive` da sidebar ([AdminSidebar.tsx](../../features/admin/components/AdminSidebar.tsx)) — extrair a função pura `getActiveUrl(pathname, items)` para um util testável.
  - `buildObrasHealthUrl` e construtores de URL de filtro.
- **Validações de formulário (Zod/schemas)** — campos obrigatórios, formatos (CPF/CNPJ, email). **Responde diretamente ao medo do dono de "campo que deveria ser obrigatório".**
- **Helpers de teste E2E já existentes** ([tests/e2e/helpers.ts](../../tests/e2e/helpers.ts)) — `uniqueEmail`, `uniqueUsername` podem ganhar teste unitário.

## 5. Schema (Drizzle)
Nenhuma alteração. Testes unitários não tocam banco (por definição — isso é J36).

## 6. Padrões a seguir
- Arquivo de teste ao lado do código: `utils.test.ts` junto de `utils.ts` (co-locação),
  OU em `__tests__/` — definir 1 convenção e manter.
- Nomear claro: `describe('safePercent')` → `it('retorna 0 quando total é 0')`.
- AAA (Arrange-Act-Assert). Sem mock onde a função é pura.
- Cobertura como bússola, não meta cega: priorizar caminhos de erro (divisão por zero,
  vazio, null) — onde bugs moram.

## 7. Checklist de implementação
**Fundação:**
- [ ] Instalar Vitest + coverage; criar `vitest.config.ts` (alias, excludes do e2e).
- [ ] Scripts `test`, `test:watch`, `test:cov` no `package.json`.
- [ ] Configurar ESLint (flat config) + script `lint`; corrigir violações iniciais.
- [ ] Hook/skill de auto-validação (`check` + `lint` + `test`) no fluxo de edição.
- [ ] Doc curta no README de como rodar os testes.

**Primeira leva de testes (alto valor, baixo custo):**
- [ ] `safePercent` (total 0/negativo/NaN/normal) — trava o bug que já ocorreu.
- [ ] Formatadores (`formatCurrency`, `formatPercentage`, `formatCompactCurrency`, `formatRange`, `getInitials`).
- [ ] `getActiveUrl` da sidebar (extrair função pura + testar os pares de prefixo: obras/moderacao, obras-destaque).
- [ ] `calcularDeltaPercent` e percentuais puros do financeiro.
- [ ] Validações de schema/formulário dos cadastros principais (obra, usuário, empreiteira) — obrigatoriedade e formato.

**Expansão contínua (vivo):**
- [ ] Cobrir novas funções puras conforme forem criadas (regra: lógica nova → teste).

## 8. Critérios de aceite
1. `npm test` roda e passa localmente; `npm run lint` e `npm run check` limpos.
2. Os testes da primeira leva existem e passam, incluindo os casos de erro (ex.: `safePercent(10, 0) === 0`).
3. Editar uma função coberta e quebrá-la de propósito → o teste falha (rede funciona).
4. Vitest e Playwright não colidem (cada um roda só seus arquivos).

## 9. Riscos / Pontos de atenção
- **Funções acopladas a banco/rede não são unitárias** — se a lógica estiver dentro de
  um service com query, **extrair a parte pura** para testar (refactor leve), senão vira J36.
- **Não perseguir 100% de cobertura** — custo alto, valor baixo no fim. Foco em lógica de risco.
- **ESLint pode acusar muita coisa de início** — corrigir em lote, sem travar a entrega.
- **jsdom só se necessário** — testar componente React é mais caro; preferir extrair lógica.

## 10. Links cruzados
- Trio de testes: J36 (integração), J37 (E2E — já tem base Playwright).
- Complementa: J33 (observabilidade) — testes evitam regressão, observabilidade pega o que escapou.
- Beneficia: J34 (ajustes finos) — `safePercent`/sidebar nasceram lá e ganham teste aqui.

## 11. Gaps descobertos durante execução
> Doc viva. Uma linha por item, com data.

- 2026-06-20: Jornada criada. Projeto tinha 0 testes unitários; Playwright (E2E) já
  existe com padrões maduros (endpoints test-only, helpers de email único). CI no
  GitHub Actions fora de escopo por decisão do dono (deploy direto no Replit) —
  substituído por hook/skill local de auto-validação. ESLint inexistente → vira item de fundação.
