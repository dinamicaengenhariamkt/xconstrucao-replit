# Jornada — Chat & Notificações

> Status: pronto | Prioridade: média | Wave: 2
> Última atualização: 2026-05-29

## 1. Contexto & Objetivo
Comunicação assíncrona entre contratante e empreiteiro vinculada a uma obra (chat 1:1) + notificações in-app/email para eventos do sistema (candidatura aceita, medição aprovada, pagamento recebido, etc.). Sem isso, as personas não fecham o ciclo de informação.

## 2. Personas
- **Contratante ↔ Empreiteiro**: thread 1:1 por obra após aceite (J05).
- **Admin**: pode ver canais (auditoria) e enviar mensagem broadcast/suporte.

## 3. Fluxo ponta-a-ponta
1. Aceite de candidatura (J05) cria thread `obra↔contratante↔empreiteiro` automaticamente.
2. Mensagens trocadas em `/contratante/chat` e `/empreiteiro/chat`.
3. Cada evento de outras jornadas dispara notificação (in-app sempre; email conforme preferência J02).
4. Sino de notificação no header mostra não-lidas; clique leva ao objeto.

## 4. Telas envolvidas
- [app/contratante/chat/](../../app/contratante/chat/)
- [app/empreiteiro/chat/](../../app/empreiteiro/chat/)
- [app/contratante/notificacoes/](../../app/contratante/notificacoes/)
- [app/empreiteiro/notificacoes/](../../app/empreiteiro/notificacoes/)

## 5. Componentes-chave
- [features/chat/](../../features/chat/) — api, components, hooks, schemas
- [features/shared/xchat/](../../features/shared/xchat/) — UI compartilhada
- [features/contratante/xchat/](../../features/contratante/xchat/) e [features/empreiteiro/xchat/](../../features/empreiteiro/xchat/)
- [features/contratante/notifications/](../../features/contratante/notifications/) e [features/empreiteiro/notifications/](../../features/empreiteiro/notifications/)
- [features/admin/notifications/](../../features/admin/notifications/)

## 6. Schema (Drizzle)
**A criar**:
- `chat_threads` (id, obraId, contratanteUserId, empreiteiroUserId, criadaEm, ultimaMensagemEm)
- `chat_mensagens` (id, threadId, autorUserId, texto, anexoUrl, lidaEm nullable, criadaEm)
- `notificacoes` (id, destinatarioUserId, tipo, titulo, descricao, link, lidaEm nullable, criadaEm, metadataJson)
- Enum `notificacao_tipo` (espelha em parte os tipos de J07).

## 7. Endpoints
- `GET /api/chat/threads` — minhas threads
- `GET /api/chat/threads/[id]/mensagens`
- `POST /api/chat/threads/[id]/mensagens`
- `POST /api/contratante/chat` — existe em [app/api/contratante/chat/](../../app/api/contratante/chat/) (verificar)
- `GET /api/notificacoes?lida=`
- `POST /api/notificacoes/[id]/marcar-lida`
- `POST /api/notificacoes/marcar-todas-lidas`

## 8. Mocks a remover
- [features/contratante/xchat/mocks/chat.mock.ts](../../features/contratante/xchat/mocks/chat.mock.ts)
- [features/empreiteiro/xchat/mocks/chat.mock.ts](../../features/empreiteiro/xchat/mocks/chat.mock.ts)
- [features/contratante/notifications/mocks/](../../features/contratante/notifications/mocks/)
- [features/empreiteiro/notifications/mocks/](../../features/empreiteiro/notifications/mocks/)
- [features/admin/notifications/mocks/](../../features/admin/notifications/mocks/)

## 9. Checklist de implementação
- [x] Schema + migration (threads, mensagens, notificacoes) _(2026-05-29 — `chat_threads`/`chat_mensagens` em [shared/db/schema.ts](../../shared/db/schema.ts) + bootstrap em [server/bootstrap-chat.ts](../../server/bootstrap-chat.ts); coluna `notificacoes.thread_id` adicionada com FK em [server/bootstrap-notificacoes.ts](../../server/bootstrap-notificacoes.ts))_
- [x] Hook em J05 aceitar criando thread automaticamente _(2026-05-29 — `garantirChatThread` em `after()` pós-commit do aceitar/route)_
- [x] Endpoints de chat (listar threads, listar mensagens, enviar) _(2026-05-29 — 6 rotas em [app/api/contratante/chat/](../../app/api/contratante/chat/) e [app/api/empreiteiro/chat/](../../app/api/empreiteiro/chat/), com rate-limit 3 tiers)_
- [x] Endpoints de notificações _(GET/POST in-app + `marcar-todas-lidas` em [app/api/notificacoes/](../../app/api/notificacoes/))_
- [x] Helper `notificar(userId, tipo, payload)` _(2026-05-29 — `criarNotificacao(args)` em [features/notificacoes/service.ts](../../features/notificacoes/service.ts) com suporte a `threadId`)_
- [x] Plugar helper em J05, J06, J08 (geradoras) _(J05 candidatura-dispatcher; J06 medicao-dispatcher 2026-05-29; J08 Task #52)_
- [x] Componente sino no header com contagem de não-lidas _(hooks de notif real em ambas as personas)_
- [x] Real-time: avaliar polling (simples) vs. SSE/WebSocket (correto). MVP: polling 30s. _(2026-05-29 — `refetchInterval` 30s contratante / 60s empreiteiro)_
- [ ] Email para tipos críticos (respeitar preferências J02) _(parcial: J05 candidatura usa Brevo; chat não envia email — decisão MVP)_
- [x] Nova obra aprovada → notificação in-app + email para empreiteiros na zona de atuação (respeita `email_novaObra`) _(Task #94)_
- [ ] Tela admin de monitoramento (auditoria)

## 10. Critérios de aceite
1. Após J05 aceite → contratante e empreiteiro abrem chat e veem thread vazia.
2. Empreiteiro envia mensagem → contratante recebe notificação + ponto vermelho no sino.
3. Marcar lidas → contagem zera.
4. Aprovar medição (J06) → empreiteiro recebe notificação "Medição X aprovada".
5. Desligar email da notificação X em J02 → comportamento respeitado.

## 11. Riscos / Pontos de atenção
- Real-time: WebSocket no Replit pode ser delicado — começar com polling.
- Anexos no chat: tamanho/tipo + storage.
- Spam de notificação: agrupar quando rajada do mesmo tipo (ex: "5 mensagens novas").
- Volume: indexar `(destinatario_user_id, lida_em, criada_em DESC)`.

## 12. Links cruzados
- Depende de: J05 (criação de thread).
- Consumida por: todas (canal de notificação).
- Relacionada: J07 (eventos), J02 (preferências).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #32): Evento `obra.publicada` precisa notificar **admin** (moderação opcional) e disparar emails segmentados pra empreiteiros com `especialidade` compatível + raio de cobertura — adicionar ao enum `notificacao_tipo` quando esta jornada sair do mock; integrar com J04 (descoberta) e J03 (publicação) no consumo. _Resolvido parcialmente em 2026-05-26 (Task #94)_: aprovação em moderação dispara in-app + email para empreiteiros com match por **UF/cidade** da zona de atuação (J02 §Task #87). Segmentação por especialidade e raio km continuam pendentes.
- 2026-05-26 (Task #94): Dispatcher `nova-obra-zona` é fire-and-forget pós-commit em `/api/admin/obras/[id]/aprovar` — sem retry/fila persistente. Se o processo morrer entre a aprovação e o disparo, a notificação se perde silenciosamente. Aceitável no MVP (in-app é "nice to have"; empreiteiro ainda vê a obra ao abrir o marketplace), mas vale virar `job + flag idempotente` (padrão do `candidatura-dispatcher`) se passar a ser canal crítico.
- 2026-05-26 (Task #94): Re-publicação após rejeição re-dispara a notificação (mesma paridade da atividade `obra_publicada`). Sem dedupe por `(obraId, userId)` — empreiteiro pode receber 2+ avisos da mesma obra em ciclos pause→republish. Resolver junto com o agrupamento de "5 mensagens novas" do §11.
- 2026-05-26 (Task #94): Sem segmentação por **especialidade**, sem **raio km**, sem normalização IBGE de cidades, sem unsubscribe-link direto no email (CTA pro `/empreiteiro/configuracoes` aba notificações via texto). Cada um vira refinamento próprio quando entrar no roteiro.
- 2026-05-29 (MVP + hardening): chat saiu do mock — schema, endpoints reais, polling 30/60s, dispatcher de chat com **coalescing 5min por `threadId`** (coluna dedicada em `notificacoes`), rate-limit 3 tiers no POST com tier `thread` após auth (anti-DoS), validação de anexo restrito à própria obra da thread, marcar-lida automático em mensagem nova com aba visível + listener `visibilitychange`. Detalhes e P1/P2 abertos em [_backlog-paralelo.md](_backlog-paralelo.md).
