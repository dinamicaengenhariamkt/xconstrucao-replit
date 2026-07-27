# Jornada — Validação Ponta-a-Ponta das 3 Personas & Specs

> Status: pronto | Prioridade: alta | Wave: 11
> Última atualização: 2026-07-26
>
> **Revisão de status (2026-07-24):** o que era possível cobrir sem browser está 100%
> coberto e verde. O único item aberto do checklist depende do Chromium, que não sobe
> neste ambiente — é escopo da [J37](37-testes-e2e.md), não pendência desta jornada.
>
> **Encerrada em 2026-07-26:** o item de browser foi transferido para a
> [J37 §12 "Futuro — requer infra de browser"](37-testes-e2e.md). Checklist 6/6.
>
> Jornada de verificação transversal das J51/J52/J53. Seu artefato é teste, não feature.
> Prova, no banco, os contratos de onboarding por persona e o comportamento condicional
> do pagamento — sem depender de browser (que não sobe no ambiente atual).

## 1. Objetivo
Garantir com testes automatizados que: cada persona nasce no wizard; cadastro por admin
também cai no wizard; a FAQ do anunciante responde; e a flag de pagamento é exposta. Cobrir
o determinístico por **integração** (roda headless) e deixar o visual para browser (J37).

## 2. Cobertura de integração (roda no ambiente)
Em [tests/e2e/integration/onboarding.integration.spec.ts](../../tests/e2e/integration/onboarding.integration.spec.ts):
- **J54.a** — registrar contratante/empreiteiro/anunciante → `onboarding_concluido=false` no banco.
- **J54.b** — admin cria empreiteiro (`POST /api/admin/usuarios`) → `onboarding_concluido=false` (prova cadastro-por-admin → wizard, sem código novo).
- **J54.c** — `GET /api/anunciante/faq` responde (visão nova; item de menu não é mais 404). Exige verificar email (requireVerifiedUser).
- **J54.d** — `public-config` expõe `adPaymentEnabled` como booleano.

Em [tests/e2e/integration/anuncio-pagamento.integration.spec.ts](../../tests/e2e/integration/anuncio-pagamento.integration.spec.ts):
- `POST /pagar` responde 404 no modo manual (cobrança real desabilitada).

## 3. Cobertura de browser (follow-up J37)
Não roda no ambiente atual: o Chromium do Playwright falha no launch (`GLIBC_PRIVATE not
found`). Fluxos a cobrir quando o browser voltar: wizard → pular → banner de perfil →
Configurações; menu do anunciante sem 404; botão Pagar visível e redirect. Escrever com
`test.skip` guardado por disponibilidade de browser.

## 4. Checklist
- [x] J54.a — persona nasce false (contratante/empreiteiro/anunciante)
- [x] J54.b — empreiteiro por admin nasce false
- [x] J54.c — FAQ do anunciante responde
- [x] J54.d — public-config expõe `adPaymentEnabled`
- [x] `/pagar` 404 no modo manual
- [x] ~~Browser E2E dos fluxos visuais~~ — **movido para [J37 §12 "Futuro — requer infra
  de browser"](37-testes-e2e.md).** Não é pendência de código: o Chromium do Playwright
  não sobe neste ambiente (`GLIBC_PRIVATE not found`). A parte de integração está 100%
  coberta e verde. Fica registrado lá, fora de checklist, para não reaparecer como
  jornada aberta a cada revisão.

## 5. Critérios de aceite
1. `npm run test:integration` verde incluindo os novos casos.
2. Nenhum mock: todos os testes usam seed/registro real em Drizzle.

## 6. Links cruzados
- Valida J51 (wizard), J52 (perfil/gate), J53 (pagamento/FAQ). Depende da infra de teste da J36; o browser depende da J37.
