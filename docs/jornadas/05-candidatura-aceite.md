# Jornada — Candidatura & Aceite

> Status: pronto | Prioridade: alta | Wave: 1
> Última atualização: 2026-05-25

## 1. Contexto & Objetivo
Empreiteiro envia proposta para uma obra; contratante avalia múltiplas e aceita uma. O aceite vincula `obra.empreiteiraId`, muda status para `em_andamento`, rejeita as concorrentes e abre o canal de comunicação (J13). É a junção do marketplace.

## 2. Personas
- **Empreiteiro**: envia proposta (valor, prazo, descrição).
- **Contratante**: vê propostas recebidas, aceita uma, rejeita outras.
- **Admin**: observador (auditoria).

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  E[Empreiteiro detalhe obra] --> AP[Form aplicar]
  AP --> P[POST /api/empreiteiro/candidaturas]
  P --> CDB[(candidaturas pendente)]
  CDB --> CTR[Contratante: minhas-obras/[id]]
  CTR --> AC[POST /aceitar]
  AC --> O[(obras: empreiteiraId, em_andamento)]
  AC --> R[(candidaturas concorrentes: rejeitada)]
  AC --> N[Notificações J13]
```

## 4. Telas envolvidas
- [app/empreiteiro/novas-obras/](../../app/empreiteiro/novas-obras/) — botão "aplicar" no detalhe
- [app/contratante/minhas-obras/](../../app/contratante/minhas-obras/) — aba "propostas recebidas" no detalhe
- [app/admin/obras/](../../app/admin/obras/) — coluna com candidaturas

## 5. Componentes-chave
- [features/empreiteiro/novas-obras/](../../features/empreiteiro/novas-obras/) — fluxo de aplicar
- [features/contratante/detalhes-obra/](../../features/contratante/detalhes-obra/) — listagem e aceite
- Schema Zod: `insertCandidaturaSchema` em [shared/db/schema.ts](../../shared/db/schema.ts)

## 6. Schema (Drizzle)
Existente: `candidaturas` (`obraId, empreiteiroId, valorProposta, prazoEstimado, dataInicio, dataTermino, descricao, observacoesPrazo, status [pendente|aceita|rejeitada], atividades`).

**A avaliar**:
- Coluna `motivoRejeicao text` para feedback ao empreiteiro.
- Coluna `mensagemContratante text` se o contratante quiser justificar aceite.

## 7. Endpoints
- `POST /api/empreiteiro/candidaturas` — criar (existente)
- `GET /api/empreiteiro/candidaturas` — minhas propostas
- `GET /api/contratante/minhas-obras/[id]/candidaturas` — listar propostas recebidas
- `POST /api/contratante/candidaturas/[id]/aceitar` — aceita uma, rejeita outras numa transação
- `POST /api/contratante/candidaturas/[id]/rejeitar`
- `POST /api/empreiteiro/candidaturas/[id]/cancelar` — antes de aceite

## 8. Mocks a remover
- Mocks de detalhe em [features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts](../../features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts) (parte do fluxo aplicar).
- Verificar se [features/contratante/minhas-obras/mocks/](../../features/contratante/minhas-obras/mocks/) injeta candidaturas mock.

## 9. Checklist de implementação
- [x] Endpoint `aceitar` em transação: update da `obras` (empreiteiraId, status='em_andamento') + update das demais candidaturas para `rejeitada` _(Task #64 — `POST /api/contratante/candidaturas/[id]/aceitar` com `SELECT ... FOR UPDATE` na obra dentro de `db.transaction`)_
- [x] Validação: empreiteiro não pode candidatar duas vezes na mesma obra _(Task #64 — UNIQUE index `uq_candidaturas_obra_empreiteiro_unique` + captura `code=23505` → 409)_
- [x] Validação: contratante não pode candidatar na própria obra _(Task #64 — `role !== 'empreiteiro'` ⇒ 403 no POST)_
- [x] Tela de "propostas recebidas" no detalhe de obra do contratante _(Task #64 — `CandidaturasCard` refatorado consome `GET /api/contratante/obras/[id]/candidaturas`)_
- [x] Tela de "minhas candidaturas" para empreiteiro _(Task #64 — `/empreiteiro/minhas-candidaturas` + item na sidebar)_
- [x] Disparo de notificação ao empreiteiro em aceite/rejeição (link J13) _(Task #65 — `dispararNotificacaoCandidaturaDecidida()` em `features/notificacoes/candidatura-dispatcher.ts` flip-atômico da flag + in-app (`criarNotificacao`) + e-mail Brevo (`sendCandidaturaDecididaEmail`). Job de fallback `dispatchPendingCandidaturaNotifications()` rodando no boot e via CLI `scripts/dispatch-candidatura-notifications.ts`.)_
- [x] Cancelamento de candidatura própria pelo empreiteiro (antes do aceite) _(Task #64 — `POST /api/empreiteiro/candidaturas/[id]/cancelar`; reusa enum `rejeitada` + flag `cancelada_pelo_empreiteiro=true`)_

## 10. Critérios de aceite
1. Empreiteiro candidata em obra → aparece em "propostas recebidas" do contratante.
2. Contratante aceita uma de N → `obras.empreiteira_id` setado, `obras.status='em_andamento'`, demais candidaturas com `status='rejeitada'`.
3. Obra some do marketplace J04.
4. Empreiteiro vê obra em "minhas-obras" e canal de chat fica disponível (J13).
5. Notificação visível para o empreiteiro vencedor e os rejeitados.

## 11. Riscos / Pontos de atenção
- Aceite precisa ser **atômico** (transação) — risco de inconsistência se falhar no meio.
- Race condition: dois aceites simultâneos em propostas diferentes da mesma obra. Resolver com lock otimista ou `SELECT ... FOR UPDATE`.
- `candidaturas.empreiteiroId` referencia `users.id` — verificar se o front está mandando o id certo (ou se devia referenciar `empreiteiras.id`).

## 12. Links cruzados
- Depende de: J01, J03, J04.
- Alimenta: J06, J08, J13.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #41): Índices `idx_candidaturas_obra_empreiteiro` (`obra_id, empreiteiro_id`) e `idx_candidaturas_status` foram criados nesta task pra destravar a query anti-self-apply do marketplace (J04). O mesmo composto resolve o ranking de candidaturas por obra (J05), e o índice em `status` acelera o filtro "propostas pendentes" no detalhe do contratante — então J05 herda o ganho sem custo adicional.
- 2026-05-25 (Task #64): Decidido reusar enum `candidatura_status` em vez de adicionar `cancelada`. Cancelamento pelo empreiteiro vira `status='rejeitada' + cancelada_pelo_empreiteiro=true + motivo_rejeicao='Cancelada pelo empreiteiro'`. UI distingue pela flag. Evita migração de enum + simplifica filtros do contratante (cancelada não aparece como "à decidir").
- 2026-05-25 (Task #64): Anexos da candidatura ficaram fora de escopo (form de aplicar coleta nome/size mas não faz upload). Quando J05.B/J13 entrarem, criar tabela `candidatura_anexos` análoga a `obra_anexos`, com `kind='candidatura_anexo'` no R2 e endpoints `POST/DELETE /api/empreiteiro/candidaturas/[id]/anexos`.
- 2026-05-25 (Task #64): Notificação real ao empreiteiro em aceite/rejeição ficou para J13 (flag `notificacao_disparada` plantada como gancho idempotente). _(Hidratado pela Task #65 — dispatcher idempotente + e-mail Brevo `candidatura-decidida` + job de fallback no boot e CLI `scripts/dispatch-candidatura-notifications.ts`. Cancelamento pelo empreiteiro flipa a flag em modo `silencioso` pra não re-notificar o próprio actor.)_
- 2026-05-25 (Task #65): Aceite em cascata gera N notificações (1 vencedor + N-1 rejeitados via `Outra proposta foi selecionada`) — disparadas best-effort pelo endpoint `aceitar` em paralelo, sem bloquear a resposta. Idempotência protegida pelo flip atômico (`UPDATE ... WHERE notificacao_disparada=false RETURNING`).
- 2026-05-25 (Task #64): Coluna `observacoes_financeiras` finalmente tem persistência. Form `aplicar` já enviava o campo no body, mas o schema antigo não tinha coluna — silently descartado até esta task.
- 2026-05-25 (Task #64): O check antes do INSERT (anti-self-apply do empreiteiro) é mantido como guarda explícita de UX, mas a corrida agora é resolvida pelo UNIQUE no DB (não-racy). Mensagens 409 trazem texto amigável.
