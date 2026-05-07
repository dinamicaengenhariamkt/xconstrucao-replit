# Jornada — Chat & Notificações

> Status: mock | Prioridade: média | Wave: 2
> Última atualização: 2026-05-05

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
- [ ] Schema + migration (threads, mensagens, notificacoes)
- [ ] Hook em J05 aceitar criando thread automaticamente
- [ ] Endpoints de chat (listar threads, listar mensagens, enviar)
- [ ] Endpoints de notificações
- [ ] Helper `notificar(userId, tipo, payload)` em [server/storage.ts](../../server/storage.ts)
- [ ] Plugar helper em J05, J06, J08 (geradoras)
- [ ] Componente sino no header com contagem de não-lidas
- [ ] Real-time: avaliar polling (simples) vs. SSE/WebSocket (correto). MVP: polling 30s.
- [ ] Email para tipos críticos (respeitar preferências J02)
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

- _Sem registros ainda._
