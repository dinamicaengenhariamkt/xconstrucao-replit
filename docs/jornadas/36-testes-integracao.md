# Jornada — Testes de Integração (API + banco)

> Status: planejada | Prioridade: alta | Wave: 9
> Última atualização: 2026-06-20
>
> Parte do trio de testes (J35 unitários · **J36 integração** · J37 E2E). É o **meio
> da pirâmide**: testa vários pedaços juntos — tipicamente um endpoint de API
> executando contra um banco real — sem subir o navegador. Mais lento que unitário,
> mais rápido e estável que E2E. Pega bugs que o unitário não vê (query errada,
> validação que não barra, status HTTP errado, dado que não persiste).

## 1. Contexto & Objetivo
Os endpoints em `app/api/**` falam com Postgres via Drizzle ([server/storage.ts](../../server/storage.ts)).
Hoje **nada testa** que um `POST /api/obras` realmente grava na tabela certa, que uma
validação rejeita payload inválido, ou que uma rota admin-only barra não-admin. O
objetivo é cobrir os **endpoints críticos** chamando-os de verdade contra um banco de
teste e verificando o efeito no banco e a resposta HTTP.

> **Pré-requisito:** a fundação (Vitest) vem da [J35](35-testes-unitarios.md). Esta
> jornada adiciona a camada de **banco de teste isolado**.

## 2. O desafio central — banco de teste isolado
Teste de integração precisa de um Postgres que **não seja o de produção/dev**. Opções
(decidir na execução):
- **Banco de teste dedicado** (schema/db separado), recriado/migrado antes da suíte e
  limpo entre testes (truncate ou transação com rollback).
- **Testcontainers** (sobe Postgres efêmero em container) — mais isolado, mais setup.
- **Transação por teste** (cada teste roda numa transação revertida no fim) — rápido e
  limpo, exige o código aceitar injeção da conexão.

> Reusar o bootstrap de schema já existente ([instrumentation.ts](../../instrumentation.ts))
> para preparar o banco de teste com as mesmas tabelas. Atenção ao ambiente Replit
> (banco único) — o banco de teste **não pode** ser o de produção.

## 3. O que cobrir (checklist vivo — endpoints críticos)
Priorizar os fluxos que, se quebrarem, derrubam o negócio:

- **Auth & sessão** — `app/api/auth/**`: cadastro, verificação de email, login, logout,
  expiração de sessão, 2FA (J22). Inclui: rota protegida barra não-autenticado.
- **Obras** — `POST/GET /api/obras` ([referência de padrão real](../../app/api/obras/route.ts)):
  cria, lista, valida campos obrigatórios, vínculo com contratante.
- **Candidatura & aceite** (J05) — empreiteiro candidata, contratante aceita, vínculo persiste.
- **Medições & pagamentos** (J06/J08) — criar medição, aprovar, pagar; estado correto no banco.
- **Moderação de obras** — aprovar/rejeitar muda status; reflete no marketplace.
- **Financeiro admin** — endpoints de `app/api/admin/financeiro/**` retornam shape correto e respeitam admin-only.
- **Autorização (transversal)** — para CADA grupo: contratante não acessa rota de admin; empreiteiro não acessa dado de outro (IDOR). Reforça a J19 (hardening).
- **Validação (transversal)** — payloads inválidos retornam 4xx com mensagem, não 500; **campos obrigatórios realmente barram** (responde o medo do dono).

## 4. Schema (Drizzle)
Sem novas tabelas de produção. Pode exigir infra de **seed/fixtures** de teste
(usuários, obras de exemplo) — em utilitário de teste, não no schema de produção.

## 5. Padrões a seguir
- Testar o **handler real** do endpoint (importar a route ou bater via `fetch` num
  servidor de teste), não reimplementar a lógica.
- Reusar os **endpoints test-only** já existentes (`/api/test/emails`,
  `/api/test/oauth-simulate`, flag `E2E_TEST_AUTH`) — ver [playwright.config.ts](../../playwright.config.ts)
  e [tests/e2e/helpers.ts](../../tests/e2e/helpers.ts).
- Cada teste: preparar estado → chamar endpoint → asserir resposta **e** estado no banco → limpar.
- Isolamento: nunca depender de ordem entre testes; limpar/reverter sempre.

## 6. Checklist de implementação
**Fundação de integração:**
- [ ] Definir estratégia de banco de teste (dedicado vs. transação vs. testcontainers).
- [ ] Script `test:integration` (Vitest com setup de banco) separado do unit run.
- [ ] Helper de setup/teardown (migrar schema, seed, limpeza entre testes).
- [ ] Helper de autenticação de teste (criar sessão/usuário de cada role rapidamente).

**Primeira leva (críticos):**
- [ ] Auth: cadastro → verificação → login → rota protegida.
- [ ] Obras: criar/listar/validar obrigatórios.
- [ ] Candidatura → aceite → vínculo persistido.
- [ ] Medição → pagamento (estado correto).
- [ ] Autorização: admin-only barra não-admin; IDOR barrado em ao menos 1 recurso por role.
- [ ] Validação: payload inválido → 4xx (não 500) em ao menos os cadastros principais.

**Expansão contínua (vivo):**
- [ ] Cobrir cada novo endpoint crítico conforme criado.

## 7. Critérios de aceite
1. `npm run test:integration` sobe banco de teste isolado, roda e passa — **sem tocar dados de dev/produção**.
2. Um `POST` de criação realmente grava no banco (verificado por query no próprio teste).
3. Rota admin-only retorna 401/403 para não-admin.
4. Payload sem campo obrigatório retorna 4xx com mensagem clara.
5. Suíte é repetível (rodar 2x seguidas dá o mesmo resultado — isolamento ok).

## 8. Riscos / Pontos de atenção
- **NUNCA apontar para o banco de produção** — guardar `DATABASE_URL` de teste separada; falhar ruidosamente se a URL parecer de produção.
- **Lentidão** — integração é mais lenta; manter a suíte enxuta (só críticos) e paralelizável onde o isolamento permitir.
- **Flakiness por estado compartilhado** — disciplina de limpeza/transação.
- **Replit (banco único)** — provisionar um schema/db de teste à parte; documentar como.

## 9. Links cruzados
- Depende de: J35 (fundação Vitest).
- Reforça: J19 (hardening/autorização), J05/J06/J08 (fluxos de negócio).
- Complementa: J37 (E2E cobre o fluxo pelo navegador; integração cobre o contrato da API).

## 10. Gaps descobertos durante execução
> Doc viva. Uma linha por item, com data.

- 2026-06-20: Jornada criada. Projeto tem endpoints reais (Drizzle/Postgres) sem
  cobertura de integração. Já existe infra test-only (emails em memória, `E2E_TEST_AUTH`)
  reaproveitável. Desafio principal mapeado: banco de teste isolado no ambiente Replit
  (banco único) — definir estratégia na execução.
