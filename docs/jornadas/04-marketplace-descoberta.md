# Jornada — Marketplace & Descoberta de Obras

> Status: parcial | Prioridade: alta | Wave: 1
> Última atualização: 2026-05-25

## 1. Contexto & Objetivo
Empreiteiro descobre obras disponíveis para se candidatar — com filtros (UF, cidade, modalidade, materiais por, faixa de orçamento, busca textual) e a habilidade de salvar favoritas para revisitar. Sem esta jornada, J05 (Candidatura & Aceite) não tem porta de entrada e o trabalho da J03 (Cadastro de Obra) fica invisível.

Princípio de produto: o marketplace é a vitrine pública das obras `visibilidade='publicada'` (Task #32). `status` é dimensão de execução; `visibilidade` é dimensão de exposição — uma obra `em_andamento` com `visibilidade='arquivada'` não aparece aqui (ortogonal por design).

## 2. Personas
- **Empreiteiro**: persona principal. Lista, filtra, busca, salva, abre detalhe, candidata-se.
- **Contratante**: indireto — sua obra precisa estar `publicada` e bem apresentada (carries da J03 alimentam isto: descrição, anexos, modalidade, materiais por).
- **Admin/Superadmin**: observador — pode ver qualquer obra em qualquer visibilidade (gates do tipo `isAdminLike`).

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  C[Contratante J03 cria/publica obra] --> O[(obras visibilidade=publicada)]
  E[Empreiteiro /novas-obras] --> F[Filtros UF/Cidade/Modalidade/Valor]
  F --> API[GET /api/obras?visibilidade=publicada&...]
  API --> O
  API --> EXCL{exclui obras<br/>que já candidatei<br/>+ minhas próprias}
  EXCL --> LIST[Listagem paginada 20/pg]
  LIST --> SAVE[♥ Favoritar]
  SAVE --> OS[(obras_salvas)]
  LIST --> DET[/novas-obras/[id]]
  DET --> J05[Aplicar → J05]
  E --> FAV[/empreiteiro/obras-salvas]
  FAV --> OS
```

## 4. Telas envolvidas
- [app/empreiteiro/novas-obras/](../../app/empreiteiro/novas-obras/) — listagem com filtros + chips
- [app/empreiteiro/novas-obras/[id]/](../../app/empreiteiro/novas-obras/) — detalhe (hero + accordion + estados de candidatura)
- [app/empreiteiro/obras-salvas/](../../app/empreiteiro/obras-salvas/) — favoritas (a criar na J04.C)

## 5. Componentes-chave
- [features/empreiteiro/novas-obras/](../../features/empreiteiro/novas-obras/) — api/, components/, hooks/, store/, mocks/
- Service em [features/empreiteiro/novas-obras/api/](../../features/empreiteiro/novas-obras/api/) — substituir mocks por chamada real à `GET /api/obras` paginada.
- Hooks novos (J04.B/C): `useObrasSalvas`, `useToggleObraSalva`.
- Schema: `obrasSalvas` em [shared/db/schema.ts](../../shared/db/schema.ts) (Task #41).

## 6. Schema (Drizzle)
Existente: `obras` (extendida pela Task #32 com `visibilidade`, `tipo`, `descricao`, `cep`, `cidade`, `uf`, `lat`, `lng`, `modalidade`, `materiaisPor`, `areaM2`, `padraoAcabamento`, `acessibilidadeObs`).

**Criado (Task #41)**:
- Tabela `obras_salvas` (id PK, `user_id` FK→users CASCADE, `obra_id` FK→obras CASCADE, `created_at`, UNIQUE(user_id, obra_id), idx em `user_id`).
- Índices em `candidaturas`: `(obra_id, empreiteiro_id)` para query anti-self-apply e `(status)` para ranking/filtros (também alimenta J05).

**Já existente (Task #32)**:
- Índice `idx_obras_visibilidade_uf_cidade` — query default do marketplace bate direto nele.

## 7. Endpoints
- `GET /api/obras` (existente — **breaking change na J04.B**):
  - Default: `visibilidade='publicada'` quando chamado por empreiteiro; contratante recebe só as suas; admin/superadmin enxerga tudo (gate por role).
  - Query params: `?uf=&cidade=&modalidade=&materiaisPor=&minValor=&maxValor=&q=&page=&pageSize=` (page default 1, pageSize default 20, máx 100).
  - Resposta vira `{ items: Obra[], total: number, page: number, pageSize: number }` (era array puro — auditar consumers: empreiteiro `novas-obras`, contratante `minhas-obras`, hook órfão `features/obras/hooks/use-obras.ts` a deletar).
  - Para empreiteiro: excluir obras em que o próprio user já tem candidatura ativa (subquery em `candidaturas` usando o novo índice composto) e obras com `empreiteiraId IS NOT NULL` (ocupadas).
- `GET /api/obras/[id]` (existente — endurecer na J04.B): empreiteiro só lê se `visibilidade='publicada'` OU se já candidatou; contratante dono lê sempre; admin/superadmin sempre. Nunca expor email/telefone do contratante (só fica visível no chat após aceite — J05/J13).
- `POST /api/empreiteiro/obras-salvas` (J04.B — a criar): `{ obraId }` → idempotente via UNIQUE.
- `DELETE /api/empreiteiro/obras-salvas/[obraId]` (J04.B — a criar).
- `GET /api/empreiteiro/obras-salvas` (J04.B — a criar): paginado, JOIN com `obras` para devolver o card pronto.

## 8. Mocks a remover
- [features/empreiteiro/novas-obras/mocks/novas-obras.mock.ts](../../features/empreiteiro/novas-obras/mocks/novas-obras.mock.ts)
- [features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts](../../features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts)
- Flag a apagar: `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` — esta é a flag *original* deste módulo.
- Hook órfão `features/obras/hooks/use-obras.ts` (auditoria em #41 confirmou zero consumers vivos).
- Favoritos hoje persistidos só em Zustand+localStorage (`features/empreiteiro/novas-obras/store/`) — migrar pra `obras_salvas`.

## 9. Checklist de implementação
- [x] **Schema + doc (Task J04.A)** — tabela `obras_salvas`, índices em `candidaturas`, doc reescrita _(Task #41)_
- [x] Endpoint `GET /api/obras` paginado + filtros + exclusões (anti-self-apply, ocupadas, role-aware) _(Task #42)_
- [x] Endpoint `GET /api/obras/[id]` com gate de visibilidade + ocultação de PII _(Task #36 / #42 já cobre via `findObraWithAccess`)_
- [x] Endpoints `GET/POST/DELETE /api/empreiteiro/obras-salvas` _(Task #42)_
- [x] Auditar e migrar consumers do shape antigo de `GET /api/obras` (empreiteiro novas-obras + contratante minhas-obras + apagar hook órfão `features/obras/hooks/use-obras.ts`) _(Task #42)_
- [x] Service de [features/empreiteiro/novas-obras/api/](../../features/empreiteiro/novas-obras/api/) consumindo API real + filtros server-side (cidade/tipo/materiaisPor/orcamento) _(Task #43)_
- [x] Tela `/empreiteiro/obras-salvas` listando do banco via `useObrasSalvas` _(Task #43)_
- [x] Migrar favoritos do Zustand+localStorage pra `obras_salvas` com optimistic update + rollback (`useToggleObraSalva`); store Zustand deletado _(Task #43)_
- [x] Bookmark inline em `NovaObraCard` + detalhe empreiteiro via novo hook (shim `toggleSave/isSaved`) _(Task #43)_
- [x] Paginação shadcn `Pagination` server-side no `/empreiteiro/novas-obras` _(Task #43, substituído por infinite scroll na Task #45)_
- [x] Promover status da jornada para `revisão` no índice de `docs/jornadas/README.md` _(Task #43)_
- [ ] Carries de J03 no card do marketplace: badge de anexos, faixa de valor enriquecida _(carry — visível no detalhe; card mantém minimal por ora)_
- [ ] Estado bloqueado quando `perfilCompleto=false` _(carry — depende de J02 expor flag estável)_
- [ ] Remover mocks + flag `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` deste módulo _(carry — flag ainda usada por outros módulos empreiteiro)_

## 10. Critérios de aceite
1. Contratante publica obra (J03 com visibilidade='publicada') → empreiteiro abre `/empreiteiro/novas-obras` → obra aparece na primeira página.
2. Filtrar por UF=SP, cidade=Campinas → resposta consistente com `SELECT ... WHERE visibilidade='publicada' AND uf='SP' AND cidade='Campinas'`.
3. Filtrar por modalidade=`empreitada_global` + faixa R$ 50k–200k → só obras casando ambos os critérios.
4. Busca textual em `q=reforma` → ILIKE em `nome` e `descricao` (case-insensitive).
5. Paginação: pageSize=20 default, response inclui `{ items, total, page, pageSize }`. pageSize=100 é o máximo aceito.
6. Empreiteiro candidato a obra X → obra X some da listagem dele (mas continua visível pra outros empreiteiros).
7. Obra com `empreiteiraId` definido (ocupada após aceite J05) → some do marketplace.
8. Favoritar obra → aparece em `/empreiteiro/obras-salvas`. Refresh mantém. Desfavoritar → some.
9. Tentar POST `/api/empreiteiro/obras-salvas` 2x com mesma `obraId` → UNIQUE garante idempotência (não cria duplicata, 200 ok).
10. Contratante chamando `GET /api/obras` recebe só as suas (não vê obras de outros contratantes); admin recebe todas em todas visibilidades.
11. Empreiteiro tentando `GET /api/obras/[id]` de uma obra `visibilidade='rascunho'` recebe 404 (mesmo erro de obra inexistente — não vaza existência).
12. Card no marketplace mostra cidade/UF, modalidade, materiais por e faixa de valor — nunca email/telefone do contratante.

## 11. Riscos / Pontos de atenção
- **Breaking change no `GET /api/obras`**: shape vira `{ items, total, page, pageSize }` em vez de array. Os 2 consumers vivos (empreiteiro novas-obras service, contratante minhas-obras service) precisam ser migrados na MESMA task (J04.C) — auditoria feita em #41.
- **PII do contratante**: nunca expor `users.email`/`users.phone` em listagens públicas. Só liberar via chat pós-aceite (J05/J13).
- **Anti-self-apply**: query precisa do índice composto `(obra_id, empreiteiro_id)` criado na #41 — sem ele vira seq scan a cada filtro.
- **Race condition em favoritar**: UNIQUE constraint resolve em DB; front mostra optimistic update + rollback em erro.
- **Performance**: filtros combinados usam `idx_obras_visibilidade_uf_cidade` (#32); demais filtros (modalidade, materiaisPor, faixa de valor) ficam em filtro residual no result set já reduzido.
- **Mocks**: a mesma flag `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` controla outros módulos (dashboard, minhas-obras, etc.) — só remover do **módulo `novas-obras`**, não global.
- **Hook órfão `features/obras/hooks/use-obras.ts`**: deletar na J04.C (auditoria #41 confirmou zero usos).

## 12. Links cruzados
- Depende de: J01 (auth/role empreiteiro), J03 (obras com `visibilidade='publicada'` e carries de filtragem).
- Alimenta: J05 (porta de entrada da candidatura), J13 (chat pós-aceite que cita a obra vinda daqui).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #32): J04 passa a depender de `obras.visibilidade='publicada'` (não mais de `status`). Filtros novos disponíveis pós-#33: `uf`, `cidade`, `modalidade`, `materiaisPor`. Backfill já marcou como `publicada` toda obra pré-existente com vínculo de empreiteira OU status diferente de `planejamento` — resto ficou em `rascunho` (não aparece no marketplace).
- 2026-05-25 (Task #41): Auditoria de `GET /api/obras` mapeou 3 consumers — empreiteiro `novas-obras` service, contratante `minhas-obras` service, e hook órfão `features/obras/hooks/use-obras.ts` (zero usos vivos, deletar na J04.C). Resposta vira objeto paginado em J04.B → os 2 consumers vivos serão migrados na J04.C **no mesmo PR**, sem janela de inconsistência.
- 2026-05-25 (Task #41): Favoritos hoje vivem só em Zustand+localStorage do módulo `novas-obras` — migração pra `obras_salvas` perde estado local de usuários atuais (esperado: feature ainda não anunciada).
- 2026-05-25 (Task #41): Filtros previstos `especialidade` e `zonaAtuacao` exigem colunas que ainda não existem em `empreiteiras`/`obras` no modelo final — registrado como gap em J02§13 (perfil do empreiteiro). Vai ficar fora da J04.B/C; será habilitado quando J02 entregar essas colunas.
- 2026-05-25 (Task #42): Envelope final escolhido foi `{ rows, total, page, pageSize, totalPages }` (e não `{ items, ... }` como rascunhado em §10 c.5/§11) para casar com o shape que `useNovasObras`/`useObrasContratante` já adotam. Atualizar §10 c.5 / §11 em uma próxima passada de docs (apenas terminologia, sem impacto funcional).
- 2026-05-25 (Task #42): Busca textual `q=` (§10 c.4) ficou fora — toda filtragem por texto (`nome`/`descricao`) é client-side hoje nos 6 callsites e nenhum consumer pediu server-side. Avaliar em J04.C se a paginação real exigir reposicionar a busca para o servidor.
- 2026-05-25 (Task #42): Hooks `useNovasObras({pageSize})` e `useObrasContratante({pageSize})` foram ajustados em **todos os 6 callsites** com `pageSize: 100` (mantém compat com paginação client-side existente). Migração para paginação server-side propriamente dita fica para J04.C.
- 2026-05-25 (Task #43): Filtros server-side adotados em `/empreiteiro/novas-obras` (cidade, tipo, materiaisPor, faixa de orçamento) → demais filtros (status, complexidade, busca textual) permanecem client-side sobre o slice da página atual. Estratégia híbrida intencional enquanto não há volume.
- 2026-05-25 (Task #43): Favoritos migrados pra `obras_salvas` — store Zustand `obras-salvas-store.ts` deletado. Detalhe empreiteiro recebeu shim `toggleSave/isSaved` em cima do novo hook pra evitar reescrever a página inteira. Refatorar pro hook direto numa próxima passada.
- 2026-05-25 (Task #43): Card `NovaObraCard` ganhou bookmark inline (top-3 right-3) via `useToggleObraSalva`; carries de J03 (badge de anexos, faixa enriquecida) e estado bloqueado por `perfilCompleto` ficam carry — primeiro só visíveis no detalhe; segundo depende de J02 expor flag estável.
- 2026-05-25 (Task #45): `/empreiteiro/novas-obras` migrou de `Pagination` shadcn para infinite scroll via `useInfiniteQuery` + `IntersectionObserver` (rootMargin 300px, fallback "Carregar mais" se o observer não disparar). Filtros server-side resetam a lista via `queryKey` (TanStack faz cache por params). Spinner inline durante `fetchNextPage`. `useNovasObras` (one-shot) preservada para outros callsites.
