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

### Mover `garantirChatThread` pra fora da tx de aceitar
- **Origem:** J13 review (code-reviewer)
- **Descoberto:** 2026-05-29
- **Motivação:** try/catch interno da chamada `garantirChatThread` dentro da tx pode abortar a tx do aceite se houver erro inesperado (ex: FK violation). Postgres invalida a tx inteira; queries seguintes falham com "current transaction is aborted". Mover criação da thread pra pós-commit, fire-and-forget, com job de backfill.
- **Prioridade:** P1 (risco de aceite quebrar em edge case)

### Validar ownership de anexo de obra (defense in depth ampliado)
- **Origem:** J13 review (security-auditor)
- **Descoberto:** 2026-05-29
- **Motivação:** corrigimos IDOR restringindo anexo à própria obra da thread. Se algum dia o produto quiser permitir anexar OUTRAS obras do próprio user (ex: "olha aquela obra que terminamos"), validar que `autorUserId` é dono/empreiteira da obra anexada.
- **Prioridade:** P2 (só vira P1 se o anexo expandir além da thread)
