# Jornada — Ajustes Finos de UX (Visões Empreiteiro & Contratante)

> Status: revisão | Prioridade: média | Wave: 8
> Última atualização: 2026-06-20

## 1. Contexto & Objetivo
Jornada **agrupadora** de ajustes finos de UX — irmã da J34 (que cobriu a visão admin), agora nas visões **empreiteiro e contratante**. Identificados em uso real. Não é feature nova: é **consistência e correção pontual reusando o que já existe**. Quase tudo aqui foi "ligar o que já estava construído mas não plugado" (ex.: o componente de anúncio dinâmico já existia, só não estava nas sidebars).

## 2. Personas
- **empreiteiro** e **contratante**: telas de sidebar, FAQ, Nova Obra, Minhas Obras.
- **admin**: tocado de leve (mesmo fix de FAQ, por consistência).

## 3. Fluxo ponta-a-ponta
Sem fluxo de dados novo. Correções de apresentação + religação de UI a serviços/persistência já existentes.

## 4. Telas envolvidas
- [features/empreiteiro/components/EmpreiteiroSidebar.tsx](../../features/empreiteiro/components/EmpreiteiroSidebar.tsx), [features/contratante/components/ContratanteSidebar.tsx](../../features/contratante/components/ContratanteSidebar.tsx) — anúncio na sidebar
- [app/empreiteiro/faq/page.tsx](../../app/empreiteiro/faq/page.tsx), [app/contratante/faq/page.tsx](../../app/contratante/faq/page.tsx), [app/admin/faq/page.tsx](../../app/admin/faq/page.tsx) — cards de FAQ
- [app/contratante/nova-obra/page.tsx](../../app/contratante/nova-obra/page.tsx) — margem
- [features/contratante/components/ContratanteTopbar.tsx](../../features/contratante/components/ContratanteTopbar.tsx), [app/contratante/minhas-obras/page.tsx](../../app/contratante/minhas-obras/page.tsx) — meus rascunhos

## 5. Componentes-chave (reuso)
- [features/shared/anuncios/components/AdSidebarSlot.tsx](../../features/shared/anuncios/components/AdSidebarSlot.tsx) — slot que busca anúncio ativo e some quando não há (`if (!anuncio) return null`)
- [features/shared/components/filters/ActiveFilterChip.tsx](../../features/shared/components/filters/ActiveFilterChip.tsx) — chip do indicador de rascunho
- [features/contratante/minhas-obras/api/minhas-obras-service.ts](../../features/contratante/minhas-obras/api/minhas-obras-service.ts) — já aceita `visibilidade`

## 6. Schema (Drizzle)
Nenhuma alteração. Rascunho reusa o enum `obra_visibilidade` (valor `rascunho`) já existente em [shared/db/schema.ts](../../shared/db/schema.ts).

## 7. Endpoints
Nenhum novo. `GET /api/obras` já honra `?visibilidade=rascunho` (filtro existente). Anúncios já usam `GET /api/anuncios?zona=`.

## 8. Mocks a remover
- Banner hardcoded (imagem fixa do Unsplash) nas duas sidebars — removido e substituído pelo `AdSidebarSlot`.

## 9. Checklist de implementação

### Item 1 — Anúncio da sidebar (ocultar quando não há anúncio ativo)
- [x] Substituir banner hardcoded por `<AdSidebarSlot zoneId="sidebar-sup-empreiteiro" />` em `EmpreiteiroSidebar.tsx`
- [x] Substituir banner hardcoded por `<AdSidebarSlot zoneId="sidebar-sup-contratante" />` em `ContratanteSidebar.tsx`
- [x] Zonas de sidebar (`sidebar-sup-*`) são distintas das do dashboard (`banner-dashboard-*`) — sem duplicação. Dashboard/chat inalterados.

### Item 2 — FAQ: ocultar cards de categoria com 0 perguntas
- [x] Filtrar `count > 0` antes do grid em empreiteiro, contratante e admin
- [x] Empty-state já existente (`FAQEmptyState` / `filteredItems.length === 0`) cobre o caso de nenhuma pergunta
- [x] Admin: cards vazios somem do grid, mas o `NovaPerguntaModal` mantém a lista completa de categorias — criar numa categoria antes vazia faz o card reaparecer. Backend (`listarFaqPorVisao`) já filtrava por visão corretamente (sem vazamento)

### Item 3 — Nova Obra: margem padrão
- [x] Adicionar `p-6 md:p-10` ao container raiz de `nova-obra/page.tsx`

### Item 4 — Meus rascunhos (reusar Minhas Obras com filtro)
- [x] Item "Meus rascunhos" no dropdown do contratante (`ContratanteTopbar.tsx`) → `/contratante/minhas-obras?visibilidade=rascunho`
- [x] Minhas Obras lê `?visibilidade=` e passa ao hook (`useObrasContratanteInfinite`) — serviço e endpoint já suportavam
- [x] Indicador visual: título contextual "Meus rascunhos" + `ActiveFilterChip` removível ("Visibilidade: Rascunho") que limpa o filtro
- [x] Escopo: só contratante (empreiteiro não cria obra). Sem schema/endpoint novo (rascunho já persistia)

### Item 5 — Boas práticas
- [x] Imports órfãos removidos; `data-testid` preservados; `npm run check` limpo

## 10. Critérios de aceite
1. Sem anúncio ativo nas zonas de sidebar → slot não aparece (empreiteiro e contratante); com anúncio ativo → aparece. Dashboard/chat inalterados.
2. FAQ: categorias sem pergunta não mostram card nas 3 visões; com ≥1 aparecem com contagem certa; empty-state quando nenhuma.
3. Nova Obra ganha o respiro lateral padrão (não cola na sidebar/topbar).
4. Dropdown do contratante tem "Meus rascunhos" → Minhas Obras filtrada por rascunho, com chip removível. Salvar rascunho na Nova Obra → aparece nessa lista.
5. `npm run check` limpo.

## 11. Riscos / Pontos de atenção
- Zonas de anúncio: garantir que a zona da sidebar (sup) não conflite com a do dashboard — confirmado distinto.
- FAQ admin: não esconder o caminho de gerenciar categoria vazia — o modal de cadastro mantém todas as categorias.

## 12. Links cruzados
- Irmã de: J34 (ajustes finos UX admin).
- Reusa: J16/J23/J24 (anúncios / `AdSidebarSlot`), J03 (cadastro de obra / rascunho), J32 (FAQ).

## 13. Gaps descobertos durante execução
> Doc viva. Uma linha por item, com data.

- 2026-06-20: O anúncio dinâmico (`AdSidebarSlot`) já existia e já era usado no dashboard/chat — só as sidebars principais tinham banner hardcoded. Fix foi religar, não construir.
- 2026-06-20: "Salvar rascunho" já persistia no banco (`visibilidade='rascunho'`) e o `GET /api/obras` já filtrava por isso; faltava só a UI expor o filtro. Reusado Minhas Obras (decisão do dono) em vez de criar tela nova.
- 2026-06-20: FAQ não tinha vazamento entre visões (backend correto) — o bug era só o grid renderizar categorias de um dicionário fixo sem checar `count > 0`. Mesmo fix aplicado também no admin por consistência.
