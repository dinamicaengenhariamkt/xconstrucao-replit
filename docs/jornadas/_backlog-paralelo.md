# Backlog Paralelo

Coisas descobertas durante o trabalho que estão **fora do MVP atual** mas valem rastreio. O agent `product-owner` lê este arquivo no `/jornada` para não perder evoluções futuras.

Cada item: jornada de origem, descoberto em (data/contexto), motivação, prioridade sugerida (P0 crítico / P1 importante / P2 nice-to-have).

---

## J13 — Chat & Notificações

### Backfill retroativo de threads
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29, planejamento de saída do mock
- **Motivação:** se algum dia o produto crescer com candidaturas aceitas ANTES da implementação real do chat, será necessário um script standalone idempotente (`scripts/backfill-chat-threads.ts`) que cria threads retroativas pra candidaturas aceitas sem chat correspondente.
- **Prioridade:** P2 (só vira P1 se houver demanda de cliente)

### Padronizar URLs inconsistentes das rotas de chat
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** o client contratante chama `/api/contratante/chat/messages/[id]` e o empreiteiro chama `/api/empreiteiro/chat/[id]/messages` — estrutura diferente. No MVP optamos por manter pra não mexer no client, mas é dívida técnica.
- **Prioridade:** P2

### Enum `notificacao_tipo` ganhar `nova_mensagem_chat`
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** no MVP usamos `"info"` com `href` indicando chat. Se design quiser ícone próprio ou agrupamento "X mensagens novas" no badge, precisa estender o enum (ALTER TYPE ADD VALUE).
- **Prioridade:** P1 se design pedir, senão P2

### Status `read` real exposto na UI
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** `chat_mensagens.lida_em` é registrado mas a UI mantém status em `delivered` permanente. Pra mostrar "lida" de verdade no balão da mensagem, precisa expor `lidaEm` no DTO de Message e atualizar o store.
- **Prioridade:** P2

### Email de notificação de chat
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** decisão de produto. Chat é canal síncrono — email pode atrasar e ser ruído. Mas talvez valha pra mensagem após X horas de inatividade.
- **Prioridade:** P2 (decisão de produto)

### Anexos de arquivo/imagem no chat
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** MVP só suporta `ObraRefAttachment` (coluna `anexo_obra_id` específica). Pra arquivos/imagens precisa nova coluna (`anexo_url`, `anexo_mime`, `anexo_nome`) ou JSONB polimórfico.
- **Prioridade:** P1 se uso real pedir, senão P2

### Chat com 3+ participantes
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** schema é 1:1 por obra (UNIQUE obra_id). Pra adicionar fornecedor/cliente final/admin numa conversa, precisa tabela `chat_thread_participantes`.
- **Prioridade:** P2

### Search server-side dentro do chat
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** filtro atual é client-side no `ConversationList`. Pra buscar dentro de mensagens, precisa endpoint + índice GIN em `chat_mensagens.texto`.
- **Prioridade:** P2

### WebSocket / SSE
- **Origem:** J13 MVP
- **Descoberto:** 2026-05-29
- **Motivação:** polling 30-60s é suficiente pro MVP. Se Replit suportar bem WS/SSE e a latência percebida virar problema, vale migrar.
- **Prioridade:** P2

### Avaliar janela de coalescing 5min
- **Origem:** J13 MVP — T6
- **Descoberto:** 2026-05-29
- **Motivação:** decidimos 5 min de janela pro coalescing anti-spam. Após uso real pode ser curto demais (usuário ainda vê N notifs em sequência) ou longo demais (mensagem importante atrasa).
- **Prioridade:** P1 (monitorar)

### Coalescing por threadId em coluna dedicada
- **Origem:** J13 review (security-auditor + code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** o discriminador atual de coalescing usa `eq(notificacoes.href, href)`. Se algum dia o href ganhar parâmetros adicionais (ex: `&from=push`), o eq quebra silenciosamente e cada mensagem volta a virar notificação. Considerar coluna `threadId` (ou metadata JSONB) em `notificacoes` para discriminação robusta.
- **Prioridade:** P1

### Rate-limit no POST de mensagens de chat
- **Origem:** J13 review
- **Descoberto:** 2026-05-29
- **Motivação:** J03 (`POST /api/obras`) já tem rate-limit. Chat é mais vulnerável a flood/abuso e cada POST roda transação. Limitar por `(userId, threadId)`.
- **Prioridade:** P1

### Paginação em `listarMensagensDaThread` e `listarConversasPorUsuario`
- **Origem:** J13 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** `listarMensagensDaThread` usa `LIMIT 100` hardcoded — thread longa corta silenciosamente. `listarConversasPorUsuario` carrega todas as threads + LATERAL subqueries por chamada. Indices já criados ajudam, mas precisa cursor antes de escala.
- **Prioridade:** P1 quando o uso real crescer; P2 enquanto MVP
- **✅ PARCIAL — Camada A (2026-06-05):** `listarMensagensDaThread` agora pagina por keyset `(criada_em, id)` DESC, retornando as N **mais recentes** (default 50) em ordem cronológica e expondo cursor no header `X-Next-Cursor` ([service.ts](../../features/chat/service.ts) + [cursor.ts](../../features/chat/cursor.ts) + índice `idx_chat_mensagens_thread_keyset`). Corrige o truncamento silencioso das mensagens recentes. O body permanece `Message[]` (não quebra o client).
- **Remanescente — Camada B (P2):** "carregar mais antigas" na UI (botão/scroll) com `useInfiniteQuery` + body `{ messages, nextCursor }`. O cursor já está pronto no header, então é só consumir. `listarConversasPorUsuario` segue sem paginação (lista de threads tende a ser pequena — revisitar se escalar).

### `refetchInterval` adaptativo no chat
- **Origem:** J13 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** 30s contratante / 60s empreiteiro fixo. Ideal: subir frequência quando há unread, baixar quando idle (`refetchInterval: (data) => hasUnread(data) ? 15000 : 60000`).
- **Prioridade:** P2

### Re-marcar lida ao chegar nova mensagem com thread aberta
- **Origem:** J13 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** `useEffect` de `marcar-lida` dispara apenas na primeira abertura. Se chega mensagem nova enquanto user tem thread aberta, fica `unread` no banco até ele trocar de thread. Disparar `marcar-lida` quando `serverMessages.length` aumenta e aba está visível.
- **Prioridade:** P1

### ~~Mover `garantirChatThread` pra fora da tx de aceitar~~ ✓ Resolvido 2026-05-29
- **Origem:** J13 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** try/catch interno da chamada `garantirChatThread` dentro da tx pode abortar a tx do aceite se houver erro inesperado (ex: FK violation). Postgres invalida a tx inteira; queries seguintes falham com "current transaction is aborted". Mover criação da thread pra pós-commit, fire-and-forget, com job de backfill.
- **Prioridade:** P1 (risco de aceite quebrar em edge case)
- **✅ RESOLVIDO (2026-05-29):** em [aceitar/route.ts](../../app/api/contratante/candidaturas/[id]/aceitar/route.ts) o lookup de `contratanteUserId` permanece DENTRO da tx (consistência), mas o INSERT da thread roda FORA, em `after()` pós-commit — fire-and-forget com 1 retry (500ms). `garantirChatThread` é idempotente (`onConflictDoNothing` em `chat_threads.obraId`). Nenhum erro de chat afeta o aceite (a resposta HTTP já foi enviada). _(Re-confirmado 2026-06-05 ao auditar o fluxo; o item seguia listado como aberto por engano.)_

### Validar ownership de anexo de obra (defense in depth ampliado)
- **Origem:** J13 review (security-auditor)
- **Descoberto:** 2026-05-29
- **Motivação:** corrigimos IDOR restringindo anexo à própria obra da thread. Se algum dia o produto quiser permitir anexar OUTRAS obras do próprio user (ex: "olha aquela obra que terminamos"), validar que `autorUserId` é dono/empreiteira da obra anexada.
- **Prioridade:** P2 (só vira P1 se o anexo expandir além da thread)

---

## Pós-review do Hardening J13 + Notif J06 (2026-05-29)

### Race condition no coalescing de notif de chat
- **Origem:** J13 hardening review (code-reviewer BLOCK)
- **Descoberto:** 2026-05-29
- **Motivação:** o SELECT (coalescing) e INSERT (criarNotificacao) não são atômicos. Duas mensagens em paralelo podem ambas ver "sem notif" e ambas inserir. Hoje é "best-effort coalescing" — funciona 99% dos casos. Mitigar requer advisory lock por `(userId, threadId)` ou índice único parcial `UNIQUE (user_id, thread_id) WHERE lida = false` (não trivial porque `lida` muda no tempo).
- **Prioridade:** P2 (impacto baixo — duplicar notif raro em condição de corrida)

### ~~`getClientIp` confia em `X-Forwarded-For` sem trusted proxy gate~~ ✓ Entregue 2026-05-29
- **Origem:** J13 hardening review (security-auditor MEDIUM)
- **Descoberto:** 2026-05-29
- **Motivação:** atacante pode rotacionar `X-Forwarded-For` por request e bypassar o tier IP do rate-limit. Tiers user/thread ainda protegem. Fix: gate por env `TRUST_PROXY_HEADERS=1` no `features/auth/api/rate-limit.ts`. Afeta TODOS os usos de rate-limit (J03 anexos, J13 chat, etc).
- **Resolução:** `getClientIp` agora ignora `X-Forwarded-For` quando `TRUST_PROXY_HEADERS != "1"`. Documentado em `.env.example` e `replit.md`. Os 7 endpoints continuam chamando `getClientIp` igual — o gate é centralizado.
- **⚠️ AÇÃO DE DEPLOY pendente (J19):** o código está completo, mas o tier IP do rate-limit só fica ativo quando **`TRUST_PROXY_HEADERS=1`** estiver setado nas variáveis de ambiente de **produção** — e somente se o app estiver atrás de um proxy confiável (Replit/Vercel/Cloudflare). Sem isso, o tier IP fica neutralizado (tiers user/thread seguem protegendo; não há buraco de segurança). Não é código — é configuração no painel de deploy. **Checklist de go-live.**

### Rate-limit in-memory não funciona em multi-instance
- **Origem:** J13 hardening review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** `Map` em memória do processo. Em ambiente serverless/multi-instance, contagem fragmenta — limite efetivo vira `max × instâncias`. Aceitável como soft limit; pra hard limit requer Redis ou similar.
- **Prioridade:** P2 (afeta produção em escala)

### Idempotência em medicao-dispatcher
- **Origem:** J06 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** sem flag de idempotência. Se a route retentar (raro em medições — são gestos manuais), notificação dispara duas vezes. Padrão do candidatura-dispatcher tem flag `notificacao_disparada` — vale análogo aqui se gerar reclamação real.
- **Prioridade:** P2

### Hook compartilhado pra auto-marcar lida
- **Origem:** J13 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** os 2 effects (re-marcar quando msg nova + listener `visibilitychange`) estão duplicados em `app/contratante/chat/page.tsx` e `app/empreiteiro/chat/page.tsx`. Próxima edição vai ser propensa a divergência. Extrair `useAutoMarcarLida(...)` em `features/shared/xchat/hooks/`.
- **Prioridade:** P2

### Gate de re-marcar lida por unread real
- **Origem:** J13 review (code-reviewer SUGGEST)
- **Descoberto:** 2026-05-29
- **Motivação:** listener de `visibilitychange` dispara `marcarLidaMutation` toda vez que aba volta — mesmo sem nada novo. Endpoint retorna `marcadas=0` mas é roundtrip desperdiçado. Gate por "tem unread no estado de conversas?" (consulta cache `useConversations`) reduz noise.
- **Prioridade:** P2

### Tipar `result.body` do aceitar candidatura
- **Origem:** J13 review (code-reviewer SUGGEST)
- **Descoberto:** 2026-05-29
- **Motivação:** o handler usa `(result.body as any).foo` em vários pontos. Union discriminada ou helper tipado reduz risco de typo silencioso. Padrão sistêmico do arquivo — não regressão.
- **Prioridade:** P2

### Testes pra novas funções
- **Origem:** J13 hardening + J06 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** sem cobertura unit/integration pras 3 funções de medicao-dispatcher, retry da chat thread, e os useEffects de auto-marcar lida. Padrão do projeto é light em testes — gap aceitável mas registrado.
- **Prioridade:** P2

---

## Gaps descobertos pós-sync (2026-05-29) — preparando wave 3

### Helper `userTemAssinaturaAtiva(userId)` — precondição J11
- **Origem:** J11 (descoberto durante exploração pós-hardening J13)
- **Descoberto:** 2026-05-29
- **Motivação:** J03 (criar obra) e J05 (candidatar-se) vão precisar gating por assinatura ativa quando J11 sair do mock. Sem o helper, esses endpoints precisarão de refactor cirúrgico no futuro. Vale prototipar `features/planos/assinatura-service.ts` com `userTemAssinaturaAtiva(userId): Promise<boolean>` retornando `true` no MVP, e plantar as chamadas em J03/J05. Quando J11 ganhar gateway real, só troca a implementação interna.
- **Prioridade:** P2 (precondição estratégica — vale plantar antes pra evitar fricção depois)
- **✅ RESOLVIDO (2026-06-01):** `userTemAssinaturaAtiva` + `getLimiteRecurso` implementados em `features/planos/assinatura-service.ts` (consultam `assinaturas`/`plans-catalog`). Gating de fato aplicado em J03 (obras abertas) e J05 (propostas/mês) com HTTP 402.

### ~~Dedupe em `nova-obra-zona-dispatcher` por `(obraId, userId)`~~ ✓ Resolvido 2026-06-05
- **Origem:** J13 §13 (Task #94) — confirmado durante exploração
- **Descoberto:** 2026-05-29
- **Motivação:** re-publicação de obra (admin re-aprova após pause→republish) dispara notif duplicada pra empreiteiro na zona. Sem dedupe por `(obraId, userId)` — empreiteiro pode receber 2+ avisos da mesma obra. Mitigação: índice único parcial em `notificacoes` ou flag idempotente na obra. Bate com o "agrupamento de 5 mensagens novas" do §11 J13.
- **Prioridade:** P1 (UX de spam é visível e gera saída de usuário)
- **✅ RESOLVIDO (2026-06-05):** índice único parcial `uniq_notificacoes_user_href_unread ON notificacoes (user_id, href) WHERE lida = false AND href IS NOT NULL` ([bootstrap-notificacoes.ts](../../server/bootstrap-notificacoes.ts), com pré-limpeza idempotente de duplicatas legadas + espelho em [schema.ts](../../shared/db/schema.ts)) + `onConflictDoNothing` no [dispatcher](../../features/notificacoes/nova-obra-zona-dispatcher.ts). Duplicata NÃO-LIDA é ignorada e o **email é suprimido junto** (não reforça aviso ainda não lido). Re-disparo legítimo preservado: ao ler, a linha sai do índice parcial.

### Decisão arquitetural J09 — `escopo: obra | plataforma`
- **Origem:** J09 (gap declarado em §6 do doc)
- **Descoberto:** 2026-05-29 (durante mapeamento de wave 3)
- **Motivação:** Caixa admin consome lançamentos financeiros. Mesma tabela `financeiro` + coluna `escopo` ou tabela separada? Afeta query de agregação, futuras integrações J08/J11/J12 (assinaturas + anúncios geram entradas de plataforma; obras geram entradas vinculadas). **Não é tarefa de código — é decisão a tomar antes de tirar J09 do mock**, pra evitar refactor de schema.
- **Prioridade:** P1 (bloqueia início de J09)
- **✅ RESOLVIDO (2026-06-01):** decisão = **coluna `escopo` na tabela `financeiro`** (não tabela separada). Bootstrap `server/bootstrap-financeiro-escopo.ts` (+ `origem_tipo`/`origem_id` para idempotência). J11 e J12 já geram entradas `escopo=plataforma`. Caixa consolidado em `features/admin/financeiro/api/caixa-service.ts`.

### Decisão estratégica J11 — gateway de pagamento
- **Origem:** J11 (decisão declarada em §9 do doc)
- **Descoberto:** 2026-05-29 (durante mapeamento de wave 3)
- **Motivação:** Stripe / Pagar.me / outro. Bloqueia J11 inteira → bloqueia aba Plano & Uso da J02 → bloqueia gating efetivo de J03/J05 (assinatura ativa). Stripe entrega DX melhor; Pagar.me tem PIX/boleto nativo (essencial pro mercado BR). Não é tarefa de código — é decisão de produto + compliance.
- **Prioridade:** P1 (bloqueia 3 jornadas em cascata)
- **✅ DESBLOQUEADO via abstração (2026-06-01):** J11 foi entregue COMPLETA sem travar na decisão, usando **porta `PaymentGateway` + adapter `manual`** (ativa sem cobrança real). A decisão do gateway real NÃO bloqueia mais J11/J02/J03/J05 — elas funcionam hoje. A integração real virou a **[Jornada 14](14-integracao-gateway-pagamento.md)** (status `bloqueada`): quando o gateway for escolhido, é só escrever 1 adapter + env var `PAYMENT_GATEWAY`. Decisão pendente movida para J14.

---

## Wave de des-mock + hardening (2026-06-01) — J15/J16/J17/J18/J19

### Remover fisicamente os ~28 branches `if (ENABLE_MOCK)`
- **Origem:** J19 (limpeza de flags)
- **Descoberto:** 2026-06-01
- **Motivação:** a flag `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` já é **inerte em produção** (`isMockEnabled()` retorna `false` quando `NODE_ENV==='production'`). Mas os ~28 branches `if (ENABLE_MOCK)` ainda vivem nos services (FAQ, chat, clientes, empreiteiras, auditoria, dashboards). Remover fisicamente reduz superfície e mock files órfãos — fazer **por feature-set, com teste**, fora desta wave para evitar regressão em fluxos não testados aqui.
- **Prioridade:** P2

### Tabela de aditivos de obra
- **Origem:** J17/J18 (descoberto ao des-mockar)
- **Descoberto:** 2026-06-01
- **Motivação:** `aditivos` aparece em `ValoresContratadosData` (contratante) e no detalhe financeiro da obra (admin), mas **não há tabela de aditivos** no schema — retornamos `0`. Quando o produto precisar de aditivos contratuais reais, criar `obra_aditivos` (valor, motivo, data, aprovador) e somar em `valorTotal`.
- **Prioridade:** P2

### Baseline histórico para deltas "vs período anterior"
- **Origem:** J17/J18 (descoberto ao des-mockar)
- **Descoberto:** 2026-06-01
- **Motivação:** vários `*Delta`/`desvioPercentual` foram zerados/ocultados porque não há **snapshot histórico** dos KPIs por período. Para deltas reais, materializar snapshots periódicos (ex: job diário gravando KPIs em `kpi_snapshots`) ou calcular janela anterior on-the-fly onde a query permitir.
- **Prioridade:** P2

### Churn de empreiteiros por last-login
- **Origem:** J18 (limitação já documentada, confirmada nesta wave)
- **Descoberto:** 2026-06-01
- **Motivação:** `churnEmpreiteirosPercent` segue `0` porque não há rastreio de último login. Para churn real, gravar `users.lastLoginAt` (ou derivar de atividade) e definir a janela de inatividade que conta como churn.
- **Prioridade:** P2

### Upsell na origem do 402 `LIMITE_PLANO`
- **Origem:** J15 (item §9 parcial)
- **Descoberto:** 2026-06-01
- **Motivação:** o servidor já retorna 402 `LIMITE_PLANO` em J03/J05 quando o limite do plano é excedido. Falta o **CTA de upgrade** (upsell) na UI desses fluxos (criar obra / candidatar-se) levando para `/<persona>/planos`. Não bloqueia J15 (a página de planos está pronta) — é refinamento de conversão na origem.
- **Prioridade:** P2

### Coleta de NPS/CSAT (surveys) → desbloquear J20
- **Origem:** J18 → J20
- **Descoberto:** 2026-06-01
- **Motivação:** NPS/CSAT não têm fonte de dados; o bloco foi ocultado no dashboard admin (nada inventado). Virou a **[Jornada 20](20-satisfacao-nps-csat.md)** (`bloqueada`): aguarda o cliente final definir a estratégia de coleta. Quando definido, criar `surveys`/`survey_respostas` + endpoint e reconectar `SatisfactionMetricsSection`.
- **Prioridade:** P2 (decisão de produto)

---

## Wave 12 — Camada contratual & percepção do marketplace (2026-07-24)

Descobertos ao documentar as J57–J60, que foram implementadas antes de terem doc.

### Email nos eventos de contrato e de moderação de obra
- **Origem:** J57 §13 e J58 §13
- **Descoberto:** 2026-07-24
- **Motivação:** nem os dispatchers de moderação (obra aprovada/rejeitada) nem os de contrato (vez de assinar, cancelado, efetivado) enviam email — a notificação existe só in-app, então só é vista por quem entra na plataforma. Um contratante que teve a obra rejeitada, ou um empreiteiro esperando a vez de assinar, não descobre até abrir o app. A assinatura de contrato é o evento mais relevante juridicamente da plataforma e hoje não deixa trilha fora do sistema. Infra já existe (`features/notificacoes/emails/` com 5 templates + Brevo).
- **Prioridade:** P1 (o contrato trava o início da obra; ninguém é lembrado)

### Lembrete/expiração de contrato parado
- **Origem:** J58 §13
- **Descoberto:** 2026-07-24
- **Motivação:** se o contratante assina e o empreiteiro nunca assina, a obra fica em `pendente_empreiteiro` **indefinidamente** — sem job de expiração, sem re-lembrete, sem visibilidade para o admin de quantos contratos estão parados. O contratante fica preso: a obra não anda e ele não sabe se deve cancelar. Casa com o email acima (o lembrete natural é por email).
- **Prioridade:** P1

### J60 — paginação, detalhe do contrato e exportação
- **Origem:** J60 §13
- **Descoberto:** 2026-07-24
- **Motivação:** três lacunas da área de Contratos do admin. (a) `LISTA_LIMIT = 500` trunca **em silêncio** — a tela não avisa que há mais (mesma dívida já registrada para o chat). (b) Não há visão de detalhe: o admin vê "fulano aceitou contrato_obra v1" mas não consegue abrir o conteúdo assinado. (c) Sem exportação CSV/PDF, que uso jurídico real vai exigir.
- **Prioridade:** P2 (vira P1 quando o volume de aceites crescer ou houver demanda jurídica)

### PDF do contrato é imagem, não texto
- **Origem:** J58 §13
- **Descoberto:** 2026-07-24
- **Motivação:** `generate-contrato-pdf.ts` usa `html2canvas`, então o PDF sai como imagem — sem texto selecionável nem pesquisável, e pesado. Aceitável enquanto o registro legal for o aceite eletrônico com IP/UA (que é o caso), mas ruim para quem precisa arquivar ou buscar dentro do documento.
- **Prioridade:** P2

### Suítes de integração que consomem cota de plano se auto-envenenam
- **Origem:** J58 §13 (descoberto ao rodar o spec)
- **Descoberto:** 2026-07-24
- **Motivação:** o limite de propostas/mês (J11) conta candidaturas criadas no mês corrente, independente do estado da obra — concluir a obra **não** devolve a cota. As suítes J57/J58 esgotavam as 5 propostas do plano free da maria em ~2 execuções e, a partir daí, todos os testes passavam a skipar em silêncio: **falso verde**. Resolvido nessas duas suítes (o `cleanup-obras` test-only passou a apagar as candidaturas das obras E2E, exposto pelo helper `limparObrasE2E`). O padrão precisa valer para qualquer spec futuro que crie propostas — e o mesmo raciocínio vale para outros recursos com cota mensal. Vale considerar um guard que falhe a suíte quando o skip for por cota, em vez de passar silenciosamente.
- **Prioridade:** P1 (um teste que skipa parece verde e não protege contra regressão)

### `?tab=contrato` confirma o P1 de coalescing por href
- **Origem:** J13 review → J58 §13
- **Descoberto:** 2026-07-24
- **Motivação:** o item "Coalescing por `threadId` em coluna dedicada" (P1 acima) previa que o dedupe por `eq(notificacoes.href, href)` quebraria quando o href ganhasse parâmetros. **Aconteceu**: a J58 introduziu `?tab=contrato` no href e o aviso de cancelamento, com href fixo, era descartado pelo índice parcial enquanto o primeiro não fosse lido — um empreiteiro nunca seria avisado do cancelamento de uma segunda obra. Contornado com href discriminante (`?obra=<id>`), mas o problema estrutural continua: o discriminador de dedupe é o href, que é também um dado de navegação e muda por motivos de UI. Reforça a proposta da coluna dedicada.
- **Prioridade:** P1

### Empreiteiros legados com CPF sob a nova regra de CNPJ
- **Origem:** J44 (regra de negócio definida em 2026-07-26)
- **Descoberto:** 2026-07-26
- **Motivação:** o cadastro passou a exigir **CNPJ** para empreiteiro (contratante e anunciante seguem aceitando CPF ou CNPJ). Contas de empreiteiro criadas antes disso podem ter CPF em `users.cpf_cnpj` — a validação só roda no `registerSchema`, então elas continuam funcionando, mas ficam inconsistentes com a regra. Hoje o impacto é zero (a base foi zerada); vira relevante depois que houver empreiteiros reais cadastrados. Decidir: migrar, pedir atualização no perfil, ou aceitar a coexistência. Não bloqueia nada.
- **Prioridade:** P2

### Auditoria ausente no PATCH de configurações críticas
- **Origem:** J30 (auditoria de documentação 2026-07-26)
- **Descoberto:** 2026-07-26
- **Motivação:** `PATCH /api/admin/configuracoes` altera timeout de sessão, máx. tentativas de login e bloqueio de cadastro por perfil — e **não chama `recordAudit`**. Não há rastro de quem mudou o quê. O `settings-reader` foi escrito de propósito sem importar `audit`/`auth-utils` (evitar ciclo de import), então o `recordAudit` cabe no route handler, que já tem o guard de admin. É o único item da J30 que não tem decisão de produto por trás — os outros três (2FA obrigatório, webhooks reais, export) são fase 2 declarada.
- **Prioridade:** P1 (é a jornada de *Configurações Críticas de Segurança*; alteração de auth sem trilha de auditoria é lacuna de compliance)
