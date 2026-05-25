# Jornada — Marketplace & Descoberta de Obras

> Status: parcial | Prioridade: alta | Wave: 1
> Última atualização: 2026-05-05

## 1. Contexto & Objetivo
Empreiteiro descobre obras disponíveis para se candidatar — com filtros (zona, especialidade, orçamento, prazo) e a habilidade de salvar favoritas. Sem esta jornada, J05 não tem porta de entrada.

## 2. Personas
- **Empreiteiro**: lista, filtra, salva, abre detalhe.
- **Contratante**: indireto — sua obra precisa estar visível e bem apresentada.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  E[Empreiteiro /novas-obras] --> F[Filtros]
  F --> A[GET /api/obras?disponivel=true]
  A --> O[(obras)]
  E --> S[/empreiteiro/obras-salvas]
  S --> SAVE[(obras_salvas)]
  E --> DET[/novas-obras/[id]]
  DET --> J05[Aplicar → J05]
```

## 4. Telas envolvidas
- [app/empreiteiro/novas-obras/](../../app/empreiteiro/novas-obras/) — listagem com filtros
- [app/empreiteiro/novas-obras/[id]/](../../app/empreiteiro/novas-obras/) — detalhe
- [app/empreiteiro/obras-salvas/](../../app/empreiteiro/obras-salvas/) — favoritas

## 5. Componentes-chave
- [features/empreiteiro/novas-obras/](../../features/empreiteiro/novas-obras/) — api/, components/, hooks/, store/, mocks/
- Service em [features/empreiteiro/novas-obras/api/](../../features/empreiteiro/novas-obras/api/)

## 6. Schema (Drizzle)
Existente: `obras`.

**A criar**:
- Tabela `obras_salvas` (id, userId, obraId, createdAt) — relação m:n.

Considerar: campos de filtragem podem precisar de índices (`status`, `cidade`, `valorTotal`).

## 7. Endpoints
- `GET /api/obras` (existente) — **filtrar por `visibilidade='publicada'` como default** (Task #32 introduziu coluna). Demais query params: `?uf=&cidade=&minValor=&maxValor=&modalidade=&materiaisPor=&especialidade=`. Usar índice `idx_obras_visibilidade_uf_cidade`.
- `GET /api/obras/[id]` (existente) — só devolver pra empreiteiro quando `visibilidade='publicada'`; contratante dono e admin/superadmin podem ler em qualquer visibilidade.
- `POST/DELETE /api/empreiteiro/obras-salvas`
- `GET /api/empreiteiro/obras-salvas`

## 8. Mocks a remover
- [features/empreiteiro/novas-obras/mocks/novas-obras.mock.ts](../../features/empreiteiro/novas-obras/mocks/novas-obras.mock.ts)
- [features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts](../../features/empreiteiro/novas-obras/mocks/obra-detalhe.mock.ts)
- Flag: `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` — esta é a flag *original* dela.

## 9. Checklist de implementação
- [ ] Substituir mocks no service de [features/empreiteiro/novas-obras/api/](../../features/empreiteiro/novas-obras/api/) por chamadas reais
- [ ] Adicionar filtros server-side em `GET /api/obras`
- [ ] Criar tabela `obras_salvas` + migration
- [ ] Endpoints de obras salvas (POST/DELETE/GET)
- [ ] Tela `/empreiteiro/obras-salvas` listando do banco
- [ ] Esconder obras já candidatadas pelo próprio empreiteiro (ou marcar visualmente)
- [ ] Esconder obras já com `empreiteiraId` definido (ocupadas)
- [ ] Remover flag `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` deste módulo

## 10. Critérios de aceite
1. Contratante cria obra (J03) → empreiteiro abre `/empreiteiro/novas-obras` → obra aparece.
2. Filtrar por cidade/estado → resultados consistentes com banco.
3. Salvar obra → aparece em `/empreiteiro/obras-salvas`. Recarregar mantém.
4. Remover dos salvos → some.
5. Quando obra muda para `em_andamento` (J05 aceita uma candidatura) → some do marketplace.

## 11. Riscos / Pontos de atenção
- Performance de filtros: indexar colunas usadas em WHERE.
- Privacidade: não expor email do contratante na listagem pública (somente no chat após aceite).
- Paginação obrigatória — listas grandes podem matar performance no front.

## 12. Links cruzados
- Depende de: J01, J03.
- Alimenta: J05.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #32): J04 passa a depender de `obras.visibilidade='publicada'` (não mais de `status`). Filtros novos disponíveis pós-#33: `uf`, `cidade`, `modalidade`, `materiaisPor`. Backfill já marcou como `publicada` toda obra pré-existente com vínculo de empreiteira OU status diferente de `planejamento` — resto ficou em `rascunho` (não aparece no marketplace).
