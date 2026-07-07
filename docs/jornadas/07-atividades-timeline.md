# Jornada — Atividades & Timeline

> Status: pronto | Prioridade: média | Wave: 3
> Última atualização: 2026-05-25 (Task #83)

## 1. Contexto & Objetivo
Feed cronológico unificado de eventos (candidatura criada, aceite, medição, pagamento, mensagem) por obra e por usuário. Ajuda contratante e empreiteiro a verem "o que aconteceu" sem entrar em cada subtela; alimenta a sensação de progresso.

## 2. Personas
- **Contratante / Empreiteiro**: timeline pessoal e por obra.
- **Admin**: auditoria global (`features/admin/auditoria/`).

## 3. Fluxo ponta-a-ponta
1. Cada jornada que origina um evento (J05, J06, J08, J13) grava uma row em `atividades`.
2. Front consome `GET /api/atividades` filtrando por obra ou por usuário.
3. UI mostra ícone, descrição, link para o objeto relacionado, timestamp relativo.

## 4. Telas envolvidas
- [app/contratante/atividades/](../../app/contratante/atividades/)
- [app/empreiteiro/dashboard/](../../app/empreiteiro/dashboard/) (widget de atividades recentes)
- [app/contratante/dashboard/](../../app/contratante/dashboard/) (widget)
- [app/admin/auditoria/](../../app/admin/auditoria/) (visão admin)

## 5. Componentes-chave
- [features/contratante/dashboard/mocks/activities.mock.ts](../../features/contratante/dashboard/mocks/activities.mock.ts)
- [features/empreiteiro/dashboard/mocks/activities.mock.ts](../../features/empreiteiro/dashboard/mocks/activities.mock.ts)
- [features/admin/auditoria/](../../features/admin/auditoria/)

## 6. Schema (Drizzle)
**A criar**:
- `atividades` (id, tipo [enum], obraId nullable, atorUserId, objetoId, objetoTipo, descricao, metadata jsonb, criadaEm)
- Enum `atividade_tipo` (`candidatura_criada`, `candidatura_aceita`, `candidatura_rejeitada`, `medicao_criada`, `medicao_aprovada`, `medicao_contestada`, `pagamento_efetuado`, `mensagem_enviada`, `obra_criada`, `obra_concluida`, ...).

## 7. Endpoints
- `GET /api/atividades?obraId=&userId=&limit=&cursor=`
- `GET /api/admin/auditoria` — superset com mais detalhes técnicos

## 8. Mocks a remover
- [features/contratante/dashboard/mocks/activities.mock.ts](../../features/contratante/dashboard/mocks/activities.mock.ts)
- [features/empreiteiro/dashboard/mocks/activities.mock.ts](../../features/empreiteiro/dashboard/mocks/activities.mock.ts)
- [features/admin/auditoria/mocks/](../../features/admin/auditoria/mocks/)

## 9. Checklist de implementação
- [x] Definir lista canônica de tipos de evento _(Task #83 — 13 tipos no enum `atividade_tipo`)_
- [x] Criar tabela + enum + migration _(Task #83 — bootstrap idempotente em `server/bootstrap-atividades.ts`)_
- [x] Helper `registrarAtividade(tipo, ator, objeto, metadata)` _(Task #83 — `features/atividades/api/registrar.ts`, suporta `tx?` para uso dentro de `db.transaction()`)_
- [x] Plugar o helper nas jornadas geradoras (J03, J05, J06, J08, J13) _(Task #83 — 12 endpoints J03/J05/J06/J08; J13/chat fora de escopo)_
- [x] Endpoint paginado por cursor _(Task #83 — `GET /api/atividades` cursor-based `base64url(iso|id)`, gate por persona)_
- [x] Substituir mocks dos widgets de dashboard _(Task #83 — empreiteiro/contratante via `useAtividadesRecentes`; admin auditoria fica em `audit_logs` separado)_
- [x] Página dedicada `/contratante/atividades` _(2026-06-02 — plugada em `GET /api/atividades` via novo hook `useAtividadesFeed` (cursor + "carregar mais"); mock `activities.mock.ts` removido. Filtros por tipo/obra/busca operam sobre os dados reais.)_

## 10. Critérios de aceite
1. Após contratante criar obra → aparece "Obra X criada" no feed.
2. Após empreiteiro candidatar → aparece "Y se candidatou para X".
3. Filtrar por obra mostra todos os eventos só dela.
4. Atividade tem link para o objeto relacionado (clica em "candidatura aceita" → vai pro detalhe).

## 11. Riscos / Pontos de atenção
- Volume: `atividades` pode crescer rápido. Indexar `(obra_id, criada_em DESC)` e `(ator_user_id, criada_em DESC)`.
- Não duplicar com J13 (notificações). Distinção: atividade = registro histórico, notificação = alerta com canal/leitura. Mesmo evento pode gerar ambos.
- Privacidade: ator não deve ver eventos de obras que não são dele.

## 12. Links cruzados
- Depende de: J05, J06, J08 (geradoras de evento) — escrever a infra primeiro mas plugar gradualmente.
- Relacionada: J13.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #83): admin/auditoria continua lendo `audit_logs` (já existente, mais granular técnico). Não unificado com `atividades` — manter os dois feeds (atividade = visível ao negócio, audit = forense). Gap potencial: cross-link visual no admin.
- 2026-05-25 (Task #83): `registrarAtividade` aceita `tx?` opcional — quando passado roda dentro da transação e propaga erro (medição aprovada exige atividade + lançamento dentro da mesma tx). Quando omitido, erros viram `console.error` silencioso (best-effort no audit-style).
- 2026-05-25 (Task #83): cascade de candidaturas rejeitadas (no aceite) gera N rows `candidatura_rejeitada` com `payload.cascata=true` — front pode agrupar visualmente se virar ruído.
- 2026-05-25 (Task #83): `app/api/financeiro POST` (admin/legacy) instrumenta `lancamento_criado` apenas quando `medicaoId` é nulo, pra não duplicar com o hook da aprovação. Endpoint não usa `requireVerifiedUser` — futuramente migrar pro padrão atual.
- 2026-05-25 (Task #83): página dedicada `/contratante/atividades` (link "Ver todas" do widget) continua mockada — abrir task separada quando rolar. _Resolvido 2026-06-02: migrada para `useAtividadesFeed` (cursor real + "carregar mais"); mock deletado. Era o último mock vivo em runtime fora do gate `ENABLE_MOCK`._
- 2026-05-25 (Task #83): chat/mensagens (J13) não emite atividade — propositalmente fora do feed (J13 tem canal próprio de notificação). Reavaliar se UX pedir.
- 2026-05-25 (Task #83): `TabTimeline` contratante combina `TimelineDisplay` (atividades J07) + `DiarioJ06Card` (entradas de diário com fotos). Diário continua na sua tabela (`obra_diario`) — atividades só registra o evento "diario_postado", sem duplicar o conteúdo.
- 2026-05-25 (Task #83 fix code-review): emissores de candidatura agora populam `target_user_id` (criada→contratante via `clientes.userId`, aceita/rejeitada→empreiteiro via `empreiteiras.userId`, cancelada→contratante, cascade de rejeitadas resolve em batch por `inArray`). Gates contratante/empreiteiro do `GET /api/atividades` agora incluem `target_user_id=$me` (cobre candidaturas decididas em obras ainda não vinculadas à empreiteira). Bootstrap ganhou índice `idx_atividades_target_created(target_user_id, created_at DESC)`.
