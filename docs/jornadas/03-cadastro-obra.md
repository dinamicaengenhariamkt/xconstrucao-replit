# Jornada — Cadastro de Obra

> Status: pronto | Prioridade: alta | Wave: 1
> Última atualização: 2026-05-25

## 1. Contexto & Objetivo
Contratante registra uma obra na plataforma — escopo, prazo, orçamento, endereço, anexos. É o gatilho que destrava o marketplace (J04) e tudo que vem depois (candidatura, execução, pagamento). A obra nasce em **rascunho** (contratante moldando) e só vai pro marketplace quando ele clica **Publicar**, momento em que validação estrita exige os campos mínimos pra empreiteiro decidir se candidata.

## 2. Personas
- **Contratante** (dono): cria, edita, publica, pausa, arquiva, deleta obras próprias.
- **Empreiteiro**: vê em J04 (somente leitura, somente quando `visibilidade='publicada'`).
- **Admin / Superadmin**: vê todas via `/api/admin/obras` (a criar em #33), modera, intervém em casos de disputa.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  C[Contratante /nova-obra] --> P[POST /api/obras visibilidade=rascunho]
  P --> O[(obras)]
  O --> ME[/contratante/minhas-obras]
  ME --> ED[Editar / anexos]
  ED --> PUB{Publicar}
  PUB -- válido --> PUBOK[PATCH visibilidade=publicada]
  PUBOK --> Mk[Marketplace J04]
  PUB -- inválido --> ERR[Erro inline 'campo X obrigatório pra publicar']
  ME --> PAUSE[Pausar/Arquivar]
```

1. Contratante abre `/contratante/nova-obra`.
2. Preenche o que tiver pronto (mínimo: `nome` ≥3, `endereco`). `POST /api/obras` cria row com `clienteId` derivado do usuário logado (NUNCA do body) e `visibilidade='rascunho'`.
3. Volta a `/contratante/minhas-obras` e abre o detalhe pra completar — tipo, descrição, CEP/cidade/UF, modalidade, materiais por, anexos.
4. Botão **Publicar** chama `PATCH /api/obras/[id]` com `visibilidade='publicada'`. Server roda `insertObraSchemaStrict` em modo publicada; falha devolve 422 com lista de campos faltantes.
5. Publicada → aparece em J04 (índice `idx_obras_visibilidade_uf_cidade`). Contratante pode pausar (some do marketplace, mantém candidaturas) ou arquivar (encerra).
6. Admin vê tudo via `/admin/obras` (independente de visibilidade); pode pausar/arquivar como moderação.

## 4. Telas envolvidas
- [app/contratante/nova-obra/](../../app/contratante/nova-obra/) — formulário inicial (rascunho)
- [app/contratante/minhas-obras/](../../app/contratante/minhas-obras/) — lista + detalhe com botão Publicar/Pausar/Arquivar
- [app/admin/obras/](../../app/admin/obras/) — visão admin (todas as obras, qualquer visibilidade)

## 5. Componentes-chave
- [features/contratante/nova-obra/](../../features/contratante/nova-obra/) — form, hooks, types
- [features/contratante/minhas-obras/](../../features/contratante/minhas-obras/) — list, detalhe
- [features/contratante/detalhes-obra/](../../features/contratante/detalhes-obra/)
- [features/obras/schemas/index.ts](../../features/obras/schemas/index.ts) — `insertObraSchemaStrict` (validação condicional por visibilidade) e `insertObraAnexoSchema`
- [server/bootstrap-obras.ts](../../server/bootstrap-obras.ts) — bootstrap idempotente do schema

## 6. Schema (Drizzle) — Task #32 ✅

### 6.1 Tabela `obras` estendida
Em [shared/db/schema.ts](../../shared/db/schema.ts):

| coluna | tipo | nullable | default | notas |
|---|---|---|---|---|
| id | varchar | no | gen_random_uuid() | PK |
| nome | text | no | — | mín. 3 chars no Zod strict |
| endereco | text | no | — | rua + número |
| clienteId | varchar | yes | — | FK clientes.id |
| empreiteiraId | varchar | yes | — | FK empreiteiras.id (null até J05 aceite) |
| status | obra_status | no | 'planejamento' | execução: planejamento → em_andamento → concluida (ou pausada) |
| **visibilidade** | obra_visibilidade | no | 'rascunho' | marketplace: rascunho → publicada → pausada/arquivada (NÃO inclui concluida — é dimensão ortogonal) |
| **tipo** | text | yes | — | residencial / comercial / reforma / industrial — obrigatório em publicada |
| **descricao** | text | yes | — | obrigatório (≥20 chars) em publicada |
| **cep** | text | yes | — | regex `00000-000` — obrigatório em publicada |
| **cidade** | text | yes | — | obrigatório em publicada |
| **uf** | varchar(2) | yes | — | uppercase 2 letras — obrigatório em publicada |
| lat | numeric(10,7) | yes | — | preenchido por geocode opcional (não bloqueia) |
| lng | numeric(10,7) | yes | — | idem |
| **modalidade** | obra_modalidade | yes | — | obrigatório em publicada |
| **materiaisPor** | obra_materiais_por | yes | — | obrigatório em publicada |
| areaM2 | numeric(10,2) | yes | — | opcional |
| padraoAcabamento | text | yes | — | popular / médio / alto / luxo |
| acessibilidadeObs | text | yes | — | observações de acesso/restrições |
| valorTotal | numeric(15,2) | yes | '0' | — |
| valorPago | numeric(15,2) | yes | '0' | — |
| progresso | integer | yes | 0 | — |
| dataInicio | text | yes | — | — |
| dataPrevisao | text | yes | — | — |
| createdAt | timestamp | yes | now() | — |
| updatedAt | timestamp | yes | now() | front patcha em toda edição |

### 6.2 Enums novos
- `obra_visibilidade`: `rascunho | publicada | pausada | arquivada` — **ortogonal a `status`**. Concluir uma obra é mudar `status='concluida'`, não a visibilidade.
- `obra_modalidade`: `administracao | empreitada_global | empreitada_etapa`.
- `obra_materiais_por`: `contratante | empreiteiro | misto`.
- `obra_anexo_tipo`: `projeto_arquitetonico | projeto_estrutural | art_rrt | alvara | foto_local | contrato | outros`.

### 6.3 Tabela `obra_anexos` (Wave 1: foto_local + contrato + outros mínimo)
```
id            varchar PK
obra_id       varchar NOT NULL FK obras(id) ON DELETE CASCADE
file_id       varchar NOT NULL FK user_files(id) ON DELETE CASCADE
tipo          obra_anexo_tipo NOT NULL
observacao    text
created_by    varchar FK users(id) ON DELETE SET NULL
created_at    timestamp NOT NULL DEFAULT now()
```
Reusa toda a infra R2 já existente (Task #26): presign público `public/obras/{obraId}/{tipo}/...` (Wave 1 só público; ART/RRT virá em Wave 2 como `private/`).

### 6.4 Índices
- `idx_obras_visibilidade_uf_cidade` — descoberta em J04.
- `idx_obras_cliente_id` — lista do contratante.
- `idx_obras_empreiteira_id` — agenda do empreiteiro.
- `idx_obra_anexos_obra_id_tipo` — agrupar anexos por tipo no detalhe.

### 6.5 Backfill
Migration idempotente em [server/bootstrap-obras.ts](../../server/bootstrap-obras.ts) (registrada em `instrumentation.ts` junto com `bootstrap-storage` e `bootstrap-superadmin`). Backfill: linhas pré-existentes com `empreiteira_id IS NOT NULL` OU `status<>'planejamento'` viram `visibilidade='publicada'`; resto fica `rascunho`. Smoke pós-migration em dev: 5 publicadas / 1 rascunho.

## 7. Endpoints (J03.B — Task #33)
- `GET/POST /api/obras` — [app/api/obras/route.ts](../../app/api/obras/route.ts)
  - GET: scoping por `userRole` — empreiteiro só vê `visibilidade='publicada'`; contratante só as próprias (`cliente_id` derivado do user logado); admin/superadmin vê tudo.
  - POST: força `clienteId` do user logado, força `visibilidade='rascunho'` na criação inicial, valida com `insertObraSchemaStrict` (modo rascunho — só `nome` + `endereco`).
- `GET/PATCH/DELETE /api/obras/[id]` — ownership server-side em PATCH/DELETE. PATCH valida com strict (modo derivado da `visibilidade` final).
- `POST /api/obras/[id]/anexos` — multipart ou commit pós-presign R2. Valida `tipo` + `observacao`. Cria row em `obra_anexos`.
- `DELETE /api/obras/[id]/anexos/[anexoId]` — remove R2 + DB + audit log.
- `GET /api/admin/obras` — **a criar** (#33). Lista todas obras com filtros (visibilidade, status, cidade, contratante).

## 8. Mocks a remover
- [features/contratante/minhas-obras/mocks/](../../features/contratante/minhas-obras/mocks/) — auditar se ainda é usado em fallback de detalhe.
- Mock de detalhe ([obra-detalhe.mock.ts](../../features/contratante/minhas-obras/mocks/obra-detalhe.mock.ts)) — substituir por `/api/obras/[id]`.

## 9. Checklist de implementação

### Schema (Task #32 — fechado)
- [x] Enums novos: `obra_visibilidade`, `obra_modalidade`, `obra_materiais_por`, `obra_anexo_tipo` _(Task #32)_
- [x] Estender `obras` com 13 colunas novas (tipo, descricao, cep, cidade, uf, lat/lng, modalidade, materiaisPor, areaM2, padraoAcabamento, acessibilidadeObs, visibilidade, createdAt/updatedAt) _(Task #32)_
- [x] Criar tabela `obra_anexos` + FK pra `user_files` _(Task #32)_
- [x] 4 índices (visibilidade+uf+cidade, cliente_id, empreiteira_id, obra_anexos por tipo) _(Task #32)_
- [x] Backfill `visibilidade` para linhas pré-existentes _(Task #32)_
- [x] `insertObraSchemaStrict` com `superRefine` condicional por visibilidade + `insertObraAnexoSchema` _(Task #32)_
- [x] Bootstrap idempotente em [server/bootstrap-obras.ts](../../server/bootstrap-obras.ts) registrado em `instrumentation.ts` _(Task #32)_

### Endpoints + UI (Task #33 — backend pronto, UI listas/detalhes mock)
- [x] `POST /api/obras` força `clienteId` do user logado + audit log; rejeita 403 se role≠contratante; 400 se contratante sem perfil _(Task #33)_
- [x] `PATCH/DELETE /api/obras/[id]` valida ownership; PATCH bloqueia 409 valor/descricao quando empreiteiraId≠null; DELETE 409 se candidatura pendente _(Task #33)_
- [x] `DELETE /api/obras/[id]` envelopado em `db.transaction` + `SELECT ... FOR UPDATE` na row da obra (fecha race candidatura↔delete); smoke em `scripts/smoke-task36-delete-obra-race.ts` _(Task #36)_
- [x] `GET /api/obras` scoping por role: empreiteiro → publicada+empreiteiraId NULL sem clienteId (PII); contratante → próprias; admin sem `?scope=admin` → vazio defensivo _(Task #33)_
- [x] `GET /api/admin/obras` paginado (page/pageSize 1..100) com filtros cliente_id/empreiteira_id/status/visibilidade/periodo/q + join clienteNome/empreiteiraNome _(Task #33)_
- [x] `GET /api/admin/obras/[id]` retorna detalhe + cliente + empreiteira + anexos + últimos 20 audit logs _(Task #33)_
- [x] `POST /api/obras/[id]/anexos` + `DELETE /api/obras/[id]/anexos/[anexoId]` + `GET` listagem; novo kind `obra_anexo` em KIND_RULES (15MB PDF/img, role contratante|superadmin), key `public/obras/{userId}/anexos/...` _(Task #33)_
- [x] UI `/contratante/nova-obra` reescrita: 6 cards (Identificação, Endereço c/ ViaCEP debounce 400ms, Escopo, Datas+Orçamento, Anexos, Ações), upload+bind sequencial, botões "Salvar rascunho" e "Publicar obra", coerção `valorTotal`/`areaM2` p/ string _(Task #33)_
- [x] UI contratante: botões Publicar / Pausar / Republicar / Arquivar no detalhe + uploader de anexos pós-criação (`ObraVisibilidadeActions` em `app/contratante/minhas-obras/[id]/page.tsx`) _(Task #43)_
- [x] UI admin: detalhe `/admin/obras/[id]` migrado para API real (`useAdminObraDetalhe` + adapter), mock `features/admin/obras/mocks/index.ts` deletado, badge de visibilidade no hero _(Task #43)_
- [x] UI admin: `/admin/obras` (rota nova) com filtros (visibilidade, status, cliente, empreiteira, período) consumindo `/api/admin/obras` paginado _(Task #34)_
- [x] UI empreiteiro: lista e detalhe de `/empreiteiro/novas-obras` consumindo `/api/obras` real (PII-sanitized) _(Task #34)_
- [x] Substituir `obra-detalhe.mock.ts`, `minhas-obras.mock.ts`, `novas-obras.mock.ts` e `features/admin/obras/mocks/list.mock.ts` por fetch real via adapters `features/obras/adapters.ts` _(Task #34)_
- [x] Listar `/contratante/minhas-obras` (lista + `[id]`) consumindo `/api/obras` + `/api/obras/[id]` _(Task #34)_

### Moderação admin (Task #86 — pronto)
- [x] Enum `obra_status_moderacao` (pendente/aprovada/rejeitada) + 4 colunas em `obras` (`statusModeracao`, `motivoModeracao`, `moderadoEm`, `moderadoPor` FK users) + índice `idx_obras_status_moderacao` _(Task #86)_
- [x] Bootstrap idempotente + backfill one-shot `obras_backfill_moderacao_v1` (publicada+pendente→aprovada) em `server/bootstrap-obras.ts` _(Task #86)_
- [x] PATCH `/api/obras/[id]` reseta moderação para `pendente` em transição → `publicada` (cobre publicação inicial e re-submissão pós-rejeição) _(Task #86)_
- [x] `GET /api/obras` (empreiteiro) e `findObraWithAccess` (detalhe) exigem `statusModeracao='aprovada'` — obra em revisão ou rejeitada não vaza pro marketplace _(Task #86)_
- [x] `GET /api/admin/obras` aceita filtro `?status_moderacao=` + hook `useAdminObras` propaga `statusModeracao` _(Task #86)_
- [x] `POST /api/admin/obras/[id]/aprovar` (emite atividade J07 `obra_publicada` na primeira aprovação + audit `obras.moderar.aprovar`) e `/rejeitar` (motivo 5–500 chars + audit `obras.moderar.rejeitar`) _(Task #86)_
- [x] Tela admin `/admin/obras/moderacao` com 3 tabs (Em revisão / Rejeitadas / Aprovadas), cards com aprovar/rejeitar (modal motivo), link de detalhe e "aprovar mesmo assim" para rejeitadas _(Task #86)_
- [x] Item de nav `Moderação` em `ADMIN_NAV_ITEMS` (logo após "Obras") _(Task #86)_
- [x] Banner de status no detalhe contratante (`ObraVisibilidadeActions`): amarelo "Aguardando aprovação", vermelho "Rejeitada + motivo", verde "Aprovada"; botão "Reenviar para moderação" pausa+republica em sequência _(Task #86)_

## 10. Critérios de aceite
1. Logado como contratante, criar obra apenas com `nome` + `endereco` → salva como `rascunho` → aparece em "minhas-obras" → NÃO aparece em J04.
2. Tentar publicar sem `descricao` → 422 com `{ issues: [{ path: 'descricao', message: '...' }] }` e mensagem inline na UI.
3. Publicar obra completa → `visibilidade='publicada'` → aparece em J04 pra empreiteiro.
4. Pausar obra → some de J04 → continua em "minhas-obras" com badge "Pausada".
5. Empreiteiro tenta `GET /api/obras/[id]` de obra em `rascunho` → 404 (não existe pra ele).
6. Contratante A tenta `PATCH /api/obras/[id]` de obra do contratante B → 403.
7. `SELECT visibilidade, COUNT(*) FROM obras GROUP BY visibilidade` após migration retorna `publicada=5, rascunho=1` em dev.

## 11. Riscos / Pontos de atenção
- `visibilidade` vs `status`: dimensões ortogonais. Documentar no PR/onboarding pra ninguém colapsar as duas.
- Anexos: tamanho máximo, tipos permitidos (reusa `KIND_RULES` do R2). ART/RRT é privado — Wave 2.
- Geocode (`lat/lng`): preenchimento assíncrono, não bloqueia publicação. Pode vir em #33 ou ficar pra Wave 2.
- Performance: índice composto `(visibilidade, uf, cidade)` cobre o filtro mais comum de J04; demais filtros ainda fazem seq scan em obras pequenas — ok pra Wave 1.
- Notificação `obra.publicada` (admin + empreiteiros compatíveis): **fora de escopo desta jornada** — gap rastreado em J13 seção 13.

## 12. Links cruzados
- Depende de: J01 (autenticação), J26/Task #26 (R2 pra anexos).
- Alimenta: J04 (descoberta), J05 (candidatura), J06 (medições), J07 (timeline), J08 (pagamentos).
- Relacionada: J13 (notificação `obra.publicada` — gap), J02 (perfil contratante usado no card da obra em J04).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #32): Notificação de `obra.publicada` (admin + empreiteiros com `especialidade`/raio compatível) ficou fora de escopo desta jornada — registrada como gap em J13 seção 13 pra ser implementada quando J13 sair do mock.
- 2026-05-25 (Task #32): Endpoint `/api/admin/obras` não existia (admin nunca enxergou obras de todos contratantes). Vai ser criado em #33.
- 2026-05-25 (Task #32): `POST/PATCH/DELETE /api/obras*` historicamente confiava em `clienteId`/permissão derivada do body (sem ownership server-side). Vai ser corrigido em #33.
- 2026-05-25 (Task #32): Decidido separar `status` (execução: planejamento/em_andamento/pausada/concluida) de `visibilidade` (marketplace: rascunho/publicada/pausada/arquivada). Ambos têm valor `pausada` (intencional — pausar execução ≠ pausar marketplace).
- 2026-05-25 (Task #32): Wave 1 mantém anexos só públicos (`public/obras/{id}/...`). ART/RRT como `private/` + signed URL fica pra Wave 2 (J06 ou J10).
- 2026-05-25 (Task #33): UI das listas e detalhes (contratante `/minhas-obras` + `[id]`, empreiteiro `/novas-obras` + `[id]`, admin `/obras`) seguem 100% mock — endpoints estão prontos e smoke-tested via curl, falta apenas trocar fetch nos hooks `use-minhas-obras`/`use-obra-detalhe`/etc. Carry pra próxima task (J03.C).
- 2026-05-25 (Task #33): Aprovação admin pré-publicação (fluxo "publicar" → review) NÃO existe — qualquer contratante publica direto. Avaliar regra de negócio antes de J04 ganhar volume real. _Resolvido em Task #86 (2026-05-26): gate de moderação com enum `obra_status_moderacao`, endpoints aprovar/rejeitar, tela admin `/admin/obras/moderacao`, marketplace filtra `aprovada`, contratante vê banner de status + CTA "Reenviar para moderação"._
- 2026-05-26 (Task #86): Notificação ao contratante quando moderação aprova/rejeita ficou fora de escopo (gap pra J13 — `obras.moderar.aprovar`/`obras.moderar.rejeitar` já estão no audit_log, basta J13 ouvir).
- 2026-05-26 (Task #86): Auto re-moderação após edição de obra já publicada não foi implementada — só transição rascunho/pausada → publicada reseta `statusModeracao` pra pendente. Edição "in-place" de obra aprovada não força nova revisão.
- 2026-05-26 (Task #86): Moderação assistida por IA (sinalizar obras suspeitas automaticamente) declarada fora de escopo.
- 2026-05-25 (Task #33): Aditivo de escopo/valor pós-vínculo com empreiteira (referenciado no 409 `OBRA_LOCKED_AFTER_BIND`) é stub na resposta — fluxo real fica em J10 (disputas/aditivos). Sem aditivo, alterações precisam de cancelamento+nova obra.
- 2026-05-25 (Task #33): Rate-limit em `POST /api/obras` e `POST /api/obras/[id]/anexos` não foi adicionado — contratante autenticado pode spammar criações/anexos. Reusar o helper existente de `rate-limit.ts` numa próxima rodada. _Resolvido em Task #35 (2026-05-25): obras=10/user/min + 30/ip/min; anexos=20/obra/min + 60/user/min + 120/ip/min; mensagens pt-BR; reusa `isRateLimited`/`getClientIp`._
- 2026-05-25 (Task #33): `lat/lng` ficou `null` em todas as obras criadas pela UI nova — geocode via Nominatim foi planejado mas não implementado (fora de escopo desta task; J04 não depende disso ainda).
- 2026-05-25 (Task #43): Detalhe admin (`/admin/obras/[id]`) renderiza `medicoes=[]`, `valorPago=0`, `aditivos=0` por enquanto — esses campos virão de J06 (medições) e J08 (pagamentos). Página segue funcional para gerência (cadastro/cliente/empreiteira/histórico/anexos) sem bloquear UX.
- 2026-05-25 (Task #43): `ObraVisibilidadeActions` chama o GET `/api/obras/[id]/anexos` separadamente (em vez de aproveitar o `documentos` mapeado pelo adapter do detalhe) — adapter mantém o shape antigo `documentos` p/ UI atual; refatorar quando o detalhe inteiro for migrado pra shape unificado.
- 2026-05-25 (Task #34): Botões de ação no detalhe contratante (Publicar / Pausar / Arquivar) + uploader de anexos pós-criação ainda não existem — listas/detalhes já leem da API real, falta a UI das mutações (carry para próxima task de J03).
- 2026-05-25 (Task #34): Adapter `dbToObraContratanteDetalhe` retorna `etapas/timeline/equipe/fotos/sinapi` como arrays vazios — schema atual não tem essas entidades (vêm de J06/J07/J08). Detalhe contratante renderiza tabs com estados vazios em vez de mock.
- 2026-05-25 (Task #34): Status DB `pausada` é mapeado pra `com_pendencias` no contratante (não existe `com_atrasos` real no schema) — pode confundir KPIs de "obras com atraso" até J07 trazer a noção de cronograma realizado.
- 2026-05-25 (Task #34): `features/admin/obras/mocks/index.ts` (`mockObrasDetalheMap`) ainda existe e é consumido pelo detalhe `/admin/obras/[id]` — Task #34 cobriu apenas a lista admin nova; trocar o detalhe admin por `/api/admin/obras/[id]` fica como carry.
