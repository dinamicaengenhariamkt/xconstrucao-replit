# Jornada — Testes de Integração (API + banco)

> Status: em andamento — 4 fases + G1–G4 concluídos, expansão para 100% | Prioridade: alta | Wave: 9
> Última atualização: 2026-07-18
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
- [x] Definir estratégia de banco de teste (dedicado vs. transação vs. testcontainers). → **Decisão:** reusar a suíte Playwright existente contra o banco de DEV do Replit (banco único), com guard anti-produção + limpeza cirúrgica por nome "E2E" (não TRUNCATE). Ver `tests/e2e/guards.ts`.
- [x] Script `test:integration` separado do unit/E2E-browser. → `npm run test:integration` roda `tests/e2e/integration/**` (Playwright). *(Vitest fica para a J35.)*
- [x] Helper de setup/teardown (limpeza entre testes). → Reusa `/api/test/cleanup-obras` + `liberarCotaObras`; guard anti-produção via `globalSetup` em `playwright.config.ts`.
- [x] Helper de autenticação de teste (criar sessão/usuário de cada role rapidamente). → Reusa `/api/test/login-as` (`E2E_TEST_AUTH=1`) — já existente.

**Primeira leva (críticos):**
- [x] Auth: rota protegida barra email-não-verificado (403); login inválido → 400; credencial errada / email inexistente → 401 genérico. → `auth-authz.integration.spec.ts`. *(cadastro→verificação→login já coberto por `onboarding.spec.ts`.)*
- [x] Obras: criar/listar/validar obrigatórios. → `obras-candidatura.integration.spec.ts` (POST grava de fato + GET confirma + aparece na listagem; nome curto/endereço ausente/publicar sem obrigatórios → 400).
- [x] Candidatura → aceite → vínculo persistido. → mesmo spec: candidatura → aceite → obra vira `em_andamento` + thread de chat criada; 2º aceite e não-dono barrados (409/422, nunca 200).
- [x] Medição → pagamento (estado correto). → caminho feliz (valorTotal/valorPago) em `j40-financeiro-totais.spec.ts`; guards de medição + **webhook de gateway (idempotência por gatewayEventId + ramo ignored + público)** em `financeiro-webhook.integration.spec.ts`.
- [x] Autorização: admin-only barra não-admin (contratante/empreiteiro → 403, anônimo → 401, admin → 200); IDOR barrado — thread alheia (chat) e rota cross-persona (medicoes/garantir-thread). → `auth-authz.integration.spec.ts` + `chat.integration.spec.ts`.
- [x] Validação: payload inválido → 4xx (não 500) — login (400), chat (anexo/arquivo → 400) e cadastro de obra (nome curto / endereço ausente / publicar sem obrigatórios → 400).

**Expansão contínua (vivo) — rumo a 100% dos críticos:**
- [x] Radar de gaps: `npm run test:integration:gaps` (`scripts/integration-coverage-gaps.ts`)
  cruza os endpoints de `app/api/**` com os specs e lista os críticos/mutação sem cobertura,
  priorizados. Rodar ao criar endpoint novo para saber o próximo teste a escrever.
- [ ] Cobrir cada novo endpoint crítico conforme criado (usar o radar acima como guia).

**Grupos de expansão (mapa de rastreio — detalhe na §11):** 128 endpoints críticos
mapeados em 2026-07-18 (`--json --all`), agrupados por tema e ordenados por risco de
negócio. Marcar `[x]` conforme o spec do grupo entra verde. Progresso medido pela queda
do número "sem cobertura" no radar.

- [x] **G1 · auth-links / tokens** — verify-email, forgot/reset-password, resend-verification, definir-senha-inicial (validações). → `auth-links.integration.spec.ts` (13 testes). *(o fluxo feliz + reuso single-use de definir-senha-inicial foi coberto no **G4**, que emite o setup token; confirmar-novo-email/trocar-email ficam p/ um refino do G1 — ver §10.)*
- [x] **G2 · auth-conta & 2FA** — change-password(-forced), desativar-conta, refresh, register, 2fa/{setup,confirmar,desativar,status}, exportar-dados. → `auth-conta.integration.spec.ts` (22 testes). *(2fa/verificar fica no fluxo de login, não no G2 — ver §10.)*
- [x] **G3 · moderação de obras (admin)** — admin/obras/[id]/{aprovar,rejeitar,destaque}, admin/obras/destaque, admin/obras/[id]/medicoes. → `moderacao-obras.integration.spec.ts` (10 testes; assert de marketplace após aprovar/rejeitar).
- [x] **G4 · resets de acesso admin** — admin/clientes/[id]/reset-senha, admin/empreiteiras/[id]/reset-acesso, admin/usuarios/[id]/reset-password. → `reset-acesso-admin.integration.spec.ts` (11 testes; **fecha o G1**: definir-senha-inicial feliz + reuso single-use).
- [ ] **G5 · disputas** — disputas + disputas/[id]/mensagens (persona) e admin/disputas/[id]/{assumir,resolver,mensagens} (admin) + GETs.
- [ ] **G6 · obras — sub-recursos** — obras/[id]/{anexos,checklists,diario,equipe,etapas,fotos,ocorrencias,tarefas} (16 mutação + health/disputas).
- [ ] **G7 · candidaturas & medições (personas)** — contratante/candidaturas/[id]/rejeitar, contratante/medicoes/[id]/contestar, empreiteiro/candidaturas/[id]/{anexos,cancelar}, empreiteiro/medicoes.
- [ ] **G8 · usuários & config admin** — admin/usuarios(+[id]/ativo), admin/configuracoes, admin/legal, admin/faq/[id], admin/integracoes/api-key, admin/marketplace-leads/[id], admin/planos/[id], perfil/admin.
- [ ] **G9 · anúncios admin** — admin/anuncios/{anunciantes,campanhas(+[id]),config,pedidos/[id]} + KPIs.
- [ ] **G10 · financeiro admin (read-only shape+authz)** — admin/{financeiro,caixa,entradas,saidas}/** GETs (shape correto + admin-only).
- [ ] **G11 · uploads & assinaturas** — uploads/{presign,commit,sign,[id]}, chat/[threadId]/upload/presign, assinaturas/{checkout,cancelar}.
- [ ] **G12 · impersonate** — admin/impersonate/[id] + exit (fecha gap T2.4 da §10; exige helper test-only p/ montar cookie).

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
- 2026-07-17: **Estratégia definida** — reusar a suíte Playwright existente (specs de
  API contra o servidor real), NÃO montar Vitest+banco isolado. Motivo: banco único no
  Replit + suíte E2E madura que já testa API contra Postgres real (login test-only,
  cleanup por nome "E2E", cursor keyset). Menor risco de quebrar o projeto.
- 2026-07-17: **Guard anti-produção implementado** (`tests/e2e/guards.ts`, ligado como
  `globalSetup` nos dois configs Playwright). Inspeciona `DATABASE_URL`: permite hosts de
  dev conhecidos (localhost, 127.0.0.1, helium/heliumdb), bloqueia marcadores de produção
  (`prod`/`live`/…) e faz fail-closed em host desconhecido (liberável com `E2E_ALLOW_ANY_DB=1`).
  Responde à dúvida do dono: os testes NÃO apagam dados em massa (só lixo "E2E"); o guard
  garante que a suíte aborta ANTES de tocar no banco se a URL parecer de produção.
- 2026-07-17: **Fase 1 (Chat) concluída** — `tests/e2e/integration/chat.integration.spec.ts`
  (7 testes, todos passando). Cobre: IDOR de thread alheia → 403 em GET/POST/marcar-lida;
  thread inexistente → 403 (não 500); anexoObraId de obra alheia → 400; arquivoUrl de host
  não-R2 → 400; unread-count coerente + marcar-lida idempotente; marcar-lida não zera as
  próprias mensagens; restaurar conversa após "F5" (Task #159). Descoberta: o par de seed
  joão↔maria compartilha thread, então IDOR exige um 3º par (ramon↔ramon) — o spec descobre
  a thread alheia dinamicamente e usa test.skip se o seed não tiver o par.
- 2026-07-17: **Fase 2 (Auth & Autorização) concluída** — `auth-authz.integration.spec.ts`
  (9 testes, todos passando). Descobertas: (a) `/api/contratante/minhas-obras` NÃO usa
  `requireVerifiedUser` nem role-gate estrito (responde 200) — a rota que aplica os gates é
  `/api/contratante/medicoes` (verifica email → depois role). (b) Guard admin (`requireAdmin`)
  lê o role do JWT, não do DB, então `login-as` funciona para testar admin-only.
  **Gap registrado:** T2.4 (impersonation read-only → 403 em mutação) não coberto — exige
  um endpoint test-only para montar o cookie de impersonation, que só o fluxo de superadmin
  emite. Item de expansão futura.
- 2026-07-17: **Fase 3 (Obras + Candidatura/Aceite) concluída** — `obras-candidatura.integration.spec.ts`
  (8 testes, todos passando, `describe.serial`). Descobertas: (a) o limite do plano free é
  1 obra aberta → criar obra retorna **402** se a cota não for liberada; o helper conclui as
  obras abertas do contratante via admin. (b) O PATCH de obra faz merge+revalidação com
  `insertObraSchemaStrict`, então concluir uma obra publicada sem `numero` (resíduo do j40)
  dava 400 — o helper envia `numero` junto. (c) Após o 1º aceite a obra fica com
  `empreiteiraId != null`, então 2º aceite / não-dono retornam **409** (SELECT FOR UPDATE
  detecta obra já vinculada antes do check de ownership) — nunca 200. **Refinamento futuro:**
  testar não-dono com obra ainda pendente (exige 2ª obra no setup) para 403 puro.
- 2026-07-17: **Fase 4 (Financeiro/Medições + Webhook) concluída** — `financeiro-webhook.integration.spec.ts`
  (6 testes, todos passando). Descobertas: (a) o adapter de gateway em teste é o `manual`
  (`PAYMENT_GATEWAY` indefinido) — ele NÃO valida assinatura e só mapeia `type` **ausente**
  para "ignored" (type presente é repassado literalmente e É processado). Por isso o teste
  "assinatura inválida → 400" só vale para adapter real (J14) — **gap registrado**. (b)
  Idempotência confirmada: mesmo `gatewayEventId` 2x → 1ª `processed:true`, 2ª `false`.
  Eventos de teste usam `gatewaySubscriptionId` inexistente → nenhum UPDATE em assinaturas
  reais (efeito colateral nulo). **Gap:** aprovar/contestar medição de verdade exige setup
  pesado (obra+candidatura+medição pendente); aqui cobrimos só os guards. O caminho feliz
  financeiro segue no j40.
- 2026-07-17: **Como rodar** — `npm run test:integration` (roda `tests/e2e/integration/`),
  ou `make test-e2e SPEC=tests/e2e/integration/<spec>.spec.ts` para spec isolada sem
  EADDRINUSE. Exige `E2E_TEST_AUTH=1` (injetado pelo `playwright.config.ts`) e ambiente
  de **dev**. Contra o dev server 5000 já rodando:
  `npx playwright test --config=playwright.e2e-dev.config.ts tests/e2e/integration`.
- 2026-07-18: **4 fases encerradas + suíte re-verificada verde** — `npm run test:integration`
  → **27 passed, 3 skipped, 0 falhas**. (Nota: rodar contra o dev server 5000 dá falso-negativo
  porque ele sobe sem `E2E_TEST_AUTH=1` → `/api/test/*` responde 404; a via canônica sobe o Next
  próprio na 3010 com as flags.) **Início da expansão por grupos rumo a 100%.** Radar mapeado
  com `--json --all`: **128 endpoints críticos** (73 com mutação) organizados em 12 grupos —
  ver §6 (checklist) e §11 (detalhe por grupo). Ritmo acordado: **um grupo por rodada, validando
  cada um** (suíte verde → OK na §6 → linha aqui). Sem unitários (J35) até a J36 fechar 100%.
- 2026-07-18: **Descoberta técnica p/ G1 (auth-links)** — verify-email e reset-password são
  **JWT HMAC stateless** (`features/auth/api/auth-service.ts`, sem coluna no banco): assertável
  expiração (24h / 15min) e assinatura, **não reuso** (verify reusado → `already_verified`;
  reset reusado → redefine de novo, 200). O único token com **single-use real** é o de
  `definir-senha-inicial`, persistido em `password_setup_tokens.usedAt` (`shared/db/schema.ts`).
  Token de teste sai de `/api/test/emails?to=` via `meta.kind` (`verification`→`verificationUrl`,
  `password-reset`→`resetUrl`, `password-setup`→`setupUrl`) — padrão já usado em `onboarding.spec.ts`.
- 2026-07-18: **G1 (auth-links) concluído** — `tests/e2e/integration/auth-links.integration.spec.ts`
  (13 testes, todos passando). Suíte total: **40 passed, 3 skipped, 0 falhas** (2 rodadas seguidas,
  isolamento ok); `tsc` limpo. Radar caiu de **150 → 145** endpoints sem cobertura (saíram
  verify-email, forgot-password, reset-password, resend-verification, definir-senha-inicial).
  Descobertas: (a) as rotas públicas de auth (`forgot-password`, `register`) passam por
  `validateAntiBot` — o teste precisa mandar `mountedAt` no passado (>1.5s) e sem honeypot
  `website`, senão 400 antes da validação de negócio. (b) Fluxo feliz de verify-email e reset
  usa um usuário **recém-registrado** (fica não-verificado) e extrai o token do
  `/api/test/emails` — auto-contido, sem depender de conta de seed; `test.skip` se o cadastro
  de contratante estiver desabilitado no ambiente. (c) `definir-senha-inicial`: cobrimos as
  validações que não exigem token válido (senhas divergentes/schema/token inexistente → 400);
  o fluxo feliz + reuso→400 (single-use real) encadeia com o **G4** (resets admin emitem o
  setup token) — deixado para quando o G4 for implementado. **Refino futuro do G1:**
  `confirmar-novo-email` + `trocar-email` (fluxo de troca de email por token) ainda não cobertos.
- 2026-07-18: **G2 (auth-conta & 2FA) concluído** — `tests/e2e/integration/auth-conta.integration.spec.ts`
  (22 testes, todos passando). Suíte total: **62 passed, 3 skipped, 0 falhas** (2 rodadas
  seguidas, isolamento ok); `tsc` limpo. Radar caiu de **145 → 136** endpoints sem cobertura
  (saíram change-password, change-password-forced, 2fa/{setup,confirmar,status,desativar},
  register, refresh, desativar-conta, exportar-dados). Descobertas: (a) **2FA testável de ponta
  a ponta** — o projeto usa `otplib` v13 (`features/auth/api/totp.ts`) e `/2fa/setup` retorna o
  `secret` base32 em claro; `generateSync({ secret })` do próprio otplib gera um TOTP válido no
  teste, então o ciclo setup→confirmar→status→desativar roda inteiro (código inválido "000000"
  → 400 INVALID_CODE; ativo → status.enabled=true; setup repetido → 409 ALREADY_ENABLED). (b) os
  fluxos felizes (change-password, desativar-conta, refresh, 2FA) exigem **usuário verificado**,
  não só logado — `login-as` só neutraliza `mustChangePassword`, não `emailVerified`; o helper
  `usuarioVerificadoLogado` registra → extrai o link de `/api/test/emails` → GET verify-email →
  login-as, tudo com conta descartável `@xconstrucao-e2e.test` (nunca toca seed). (c) **efeito real
  assertado por login**: após change-password, `POST /login` com senha antiga → 401 e nova → 200;
  após desativar-conta, `POST /login` → 403 ACCOUNT_DISABLED (prova `users.ativo=false`). (d)
  `change-password-forced`: só o guard de pré-condição (`mustChangePassword` ausente → 400) — o
  fluxo feliz depende de emitir a flag, que sai dos **resets do G4**; deixado para lá. (e)
  **`2fa/verificar` NÃO entra no G2**: é o 2º passo do login (público, exige `challengeToken` do
  1º passo), pertence ao fluxo de login — segue no radar como pendência desse fluxo, não deste grupo.
- 2026-07-18: **G3 (moderação de obras — admin) concluído** — `tests/e2e/integration/moderacao-obras.integration.spec.ts`
  (10 testes, todos passando). Suíte total: **72 passed, 3 skipped, 0 falhas** (2 rodadas seguidas,
  isolamento ok); `tsc` limpo. Radar caiu de **136 → 131** (saíram admin/obras/[id]/{aprovar,rejeitar,
  destaque,medicoes} e admin/obras/destaque — grupo admin/obras 100% coberto). Descobertas: (a)
  **pré-condição de moderação**: aprovar/rejeitar exigem `visibilidade='publicada'` (senão 409
  `OBRA_NAO_PUBLICADA`); obra recém-criada via POST é rascunho+pendente. A receita é criar rascunho →
  `PATCH visibilidade:'publicada'`, e a **transição para publicada reseta a moderação para 'pendente'**
  (`app/api/obras/[id]/route.ts:315-324`) — só então dá para aprovar/rejeitar. (b) **assert de marketplace
  end-to-end**: não há rota `/marketplace`; é o próprio `GET /api/obras` como empreiteiro que filtra
  `publicada AND statusModeracao='aprovada' AND empreiteiraId IS NULL`. O teste prova o efeito de negócio:
  antes de aprovar (pendente) a obra NÃO aparece; depois de aprovar aparece; rejeitada não aparece. (c)
  **cota do plano free = 1 obra aberta** → o spec cria a obra que cada teste precisa via `comObraPublicada`
  e a conclui logo em seguida (`concluirObra` via admin), nunca 3 obras simultâneas; `liberarCotaObras`
  antes de cada criação + `afterAll` de segurança mantêm cota e marketplace limpos. (d) aprovar é
  **idempotente** (2ª vez → 200, sem re-atividade, via `SELECT FOR UPDATE` + WHERE condicional); rejeitar
  exige `motivo` ≥ 5 chars (< 5 → 400). (e) `destaque` liga com exigência de capa válida (422
  `CAPA_INVALIDA`) — o teste usa o **desligar** (`{destaque:false}` → 200 `{ok:true}`) para o caminho feliz
  sem precisar montar `fotoCapaFileId`. (f) guards mistos: aprovar/rejeitar/medições usam
  `requireVerifiedUser`+`isAdminLike`; destaque usa `requireAdmin` — ambos 401 anônimo / 403 não-admin.
- 2026-07-18: **G4 (resets de acesso admin) concluído** — `tests/e2e/integration/reset-acesso-admin.integration.spec.ts`
  (11 testes, todos passando). Suíte total: **83 passed, 3 skipped, 0 falhas** (2 rodadas seguidas,
  isolamento ok); `tsc` limpo. Radar caiu de **131 → 126**. **Fecha a pendência do G1**: o fluxo feliz +
  **reuso single-use** de `definir-senha-inicial` agora é coberto, porque quem emite o `password_setup_token`
  é justamente um reset admin. Descobertas: (a) os 3 resets emitem um setup token real (`issueSetupToken`),
  setam `mustChangePassword=true` e invalidam a senha atual; disparam email `kind='password-setup'` com
  `meta.setupUrl` (token em claro só no email — a tabela guarda só o hash). (b) **`admin@xconstrucao.com` é
  promovido a `superadmin` no boot** (`server/bootstrap-superadmin.ts`) — por isso passa em `hasUsersTabAccess`
  e pode resetar qualquer role; o endpoint `usuarios/[id]/reset-password` ficou coberto por completo (authz +
  modo `link`, que retorna `setupUrl` **no corpo**, dispensando o polling de email). Corrige a suposição do
  plano de que o admin de seed seria role `admin` sem `canManageUsers`. (c) `clientes/reset-senha` e
  `empreiteiras/reset-acesso` resolvem o id da linha `clientes`/`empreiteiras` (não `users.id`) via as
  listagens admin (`GET /api/admin/{clientes,empreiteiras}` → array com `id`+`email`); só a linha do João/
  Maria tem `user_id` vinculado. (d) **política de senha** bloqueia senha que contenha nome/username/email do
  alvo — os fluxos felizes usam senhas neutras (sem "joao"/"maria"). (e) `definir-senha-inicial` valida a
  política **antes** de consumir → senha fraca dá 400 **sem queimar o token** (asserido: fraca→400, depois
  forte com o mesmo token→200, reuso→400). (f) **isolamento**: cada reset de João/Maria conclui com um
  `definir-senha-inicial` bem-sucedido, restaurando `mustChangePassword=false`; os demais specs usam
  `login-as` (ignora senha), então a troca de senha do seed não afeta nada.

## 11. Mapa de expansão — grupos e o que asserir
> Previsão de 2026-07-18 a partir do radar (`npm run test:integration:gaps --json --all`).
> **Guia, não contrato:** ao implementar cada grupo, esperar refinamentos (status codes,
> setup) — registrar as descobertas na §10, como nas 4 fases. Um spec por grupo em
> `tests/e2e/integration/`. Reusar sempre: `login-as`, helpers de email (`tests/e2e/helpers.ts`),
> cleanup por nome/domínio "E2E", `test.skip` condicional a seed.

**G1 · auth-links / tokens** → `auth-links.integration.spec.ts` *(1º)*
- `GET /api/auth/verify-email?token=` (redirect 302): ausente→`error=token_missing`; adulterado→`error=token_invalid`; válido→`success=verified` + `users.emailVerified` setado; reuso→`already_verified`.
- `POST /api/auth/forgot-password`: email inexistente→`{success:true}` 200 (anti-enumeração); rate-limit 3/h→429.
- `POST /api/auth/reset-password` (token no body): senha<8→400; token inválido→400; senha fraca→400; feliz→200 + login com nova senha ok.
- `POST /api/auth/definir-senha-inicial`: confirmação divergente→400; senha fraca→400 **sem queimar token**; feliz consome; **reuso→400** (único single-use real).
- `POST /api/auth/resend-verification`: inexistente→`{success:true}`; já verificado→`{alreadyVerified:true}`; rate-limit 4/h.
- `GET /api/auth/confirmar-novo-email` + `POST /api/auth/trocar-email`: fluxo de troca de email (token) — mapear detalhes ao implementar.

**G2 · auth-conta & 2FA** → `auth-conta.integration.spec.ts` *(concluído — ver §10, 2026-07-18)*
- `change-password` / `change-password-forced`: senha atual errada→4xx; nova fraca→400; feliz→200 + hash muda no banco.
- `2fa/{setup,confirmar,desativar,status}`: setup gera segredo; código inválido→4xx; desativar exige verificação; status reflete estado. *(`2fa/verificar` = 2º passo do login, coberto no fluxo de login, não aqui.)*
- `register` (payload inválido→400, duplicado→409), `refresh` (sem cookie→401, feliz→200), `desativar-conta`, `exportar-dados` (authz + shape).

**G3 · moderação de obras (admin)** → `moderacao-obras.integration.spec.ts` *(concluído — ver §10, 2026-07-18)*
- `POST admin/obras/[id]/aprovar`: não-admin→403; feliz→`statusModeracao='aprovada'` + moderadoEm/Por; **já aprovada→200 idempotente** (não 409); inexistente→404; não-publicada→409 `OBRA_NAO_PUBLICADA`; **assert: obra aparece no marketplace (`GET /api/obras` como empreiteiro) após aprovar, some quando rejeitada**.
- `POST admin/obras/[id]/rejeitar`: motivo <5→400; grava `rejeitada`+`motivoModeracao`; não-publicada→409.
- `PATCH admin/obras/[id]/destaque` (desligar, evita capa), `GET admin/obras/[id]/medicoes`, `GET admin/obras/destaque`: authz + shape.

**G4 · resets de acesso admin** → `reset-acesso-admin.integration.spec.ts` *(concluído — ver §10, 2026-07-18)*
- `POST admin/clientes/[id]/reset-senha`, `admin/empreiteiras/[id]/reset-acesso`, `admin/usuarios/[id]/reset-password`: não-admin→403; feliz→emite setup token (`password_setup_tokens`) + `mustChangePassword`; alvo inexistente→404. **Fecha o G1**: `definir-senha-inicial` consome o token (feliz→200, senha fraca não queima, reuso→400 single-use). O de `usuarios` (modo `link`) devolve `setupUrl` no corpo; `admin@xconstrucao.com` é superadmin no boot.

**G5 · disputas** → `disputas.integration.spec.ts`
- Persona: `GET/POST disputas`, `POST disputas/[id]/mensagens`, `GET disputas/[id]` — não-participante→403 (IDOR); criar sem obra válida→4xx.
- Admin: `POST admin/disputas/[id]/{assumir,resolver,mensagens}` — não-admin→403; resolver sem assumir→transição inválida 4xx (não 500); + GETs (`admin/disputas`, `[id]`, `kpi`).

**G6 · obras — sub-recursos** → `obras-subrecursos.integration.spec.ts` (pode dividir)
- 8 famílias sob `obras/[id]/`: anexos, checklists, diario, equipe, etapas, fotos, ocorrencias, tarefas (todos GET/POST + PATCH/DELETE no filho). Padrão por família: não-membro da obra→403 (IDOR); POST grava e GET reflete; DELETE de item alheio→403/404; payload inválido→400. + `ocorrencias/[id]/resolver`, `obras/[id]/{health,disputas}` (GET authz).

**G7 · candidaturas & medições (personas)** → `candidaturas-medicoes.integration.spec.ts`
- `contratante/candidaturas/[id]/rejeitar`, `contratante/medicoes/[id]/contestar`, `empreiteiro/candidaturas/[id]/{anexos,cancelar}`, `empreiteiro/medicoes` (GET/POST): guards de persona/ownership + transição de estado. Complementa Fase 3/4.

**G8 · usuários & config admin** → `admin-gestao.integration.spec.ts`
- `admin/usuarios`(+`[id]`,`[id]/ativo`), `admin/configuracoes`, `admin/legal`, `admin/faq/[id]`, `admin/integracoes/api-key`, `admin/marketplace-leads/[id]`, `admin/planos/[id]`, `perfil/admin`: admin-only→403 p/ não-admin; mutação grava e GET reflete; payload inválido→400.

**G9 · anúncios admin** → `admin-anuncios.integration.spec.ts`
- `admin/anuncios/{anunciantes,campanhas,campanhas/[id],config,pedidos/[id]}` + KPIs (kpi,pedidos,zonas): admin-only; CRUD grava/reflete; validação→400.

**G10 · financeiro admin (read-only)** → `admin-financeiro-shape.integration.spec.ts`
- GETs de `admin/{financeiro,caixa,entradas,saidas}/**`: **admin-only→403** para não-admin e **shape correto** (campos esperados presentes, não 500). Baixo risco de mutação, alto valor de contrato.

**G11 · uploads & assinaturas** → `uploads-assinaturas.integration.spec.ts`
- `uploads/{presign,commit,sign,[id]}`, `chat/[threadId]/upload/presign`: authz + validação de host/tipo (reforça o que o chat já testa); DELETE de upload alheio→403.
- `assinaturas/{checkout,cancelar}`: guards de persona + estado da assinatura.

**G12 · impersonate** → `impersonate.integration.spec.ts` *(fecha gap T2.4)*
- `POST admin/impersonate/[id]` + `exit`: só superadmin monta cookie read-only; **mutação sob impersonation→403**. Exige helper test-only para emitir o cookie (registrado como pendência na Fase 2). Deixar por último — maior custo de setup.
