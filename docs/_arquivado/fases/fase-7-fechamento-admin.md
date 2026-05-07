# Fase 7: Fechamento da Visão Administrador

## Status
- ⏳ **Em andamento** (7.1, 7.2 e 7.3 concluídas; 7.4 → 7.11 pendentes)
- **Iniciado em:** 2026-04-30
- **Objetivo:** Padronizar, completar e endurecer a divisão administrador antes de pular para contratante e empreiteiro, reaproveitando shared sempre que possível.

## Contexto

Auditoria recente (3 frentes: qualidade técnica, react-icons, consistência UX) revelou:

- **Sólido:** 100% dos ícones em `react-icons/ri`; 10/12 páginas já usam `AdvancedFiltersPopover`; tipos de domínio (`Obra`, `Cliente`, `Empreiteira`) já centralizados em `features/shared/types/`; sistema de saúde (`features/shared/health/`) e de lucro (`features/shared/profit/`) já existem com `calculateHealth`, `HealthDetailPanel`, `HealthCard`, `FACTOR_LABELS`, `HEALTH_WEIGHTS`.
- **Inconsistências:** caixa/financeiro fora do padrão de filtros; paginação tem 5 estilos diferentes; helpers como `formatRange`, `getPaginationRange`, `getInitials`, `formatDateTime` duplicados em 3-4 páginas; 10/12 features admin sem `constants.ts`; páginas gigantes (anuncios 1160 linhas, configuracoes 1030, saidas 875, entradas 678).
- **Configurações duplicada:** admin/contratante/empreiteiro têm 3 páginas de configurações praticamente clones (1030 + 872 + 880 = 2782 linhas), com helpers `SectionTitle`, `FieldRow`, `SwitchRow`, `SelectField` redefinidos 3 vezes. Forte candidato a um shell compartilhado.
- **Gaps funcionais:** drilldown de saúde de obra, drilldown de inadimplência, filtro por cliente em obras, exportação CSV, modais de criação faltantes em metade das listas, ações em massa.

A visão admin trabalha com **dados mockados** ainda — foco é visual + funcionalidade do componente, sem chamada de serviço real.

## Princípios

1. **Não duplicar com contratante/empreiteiro.** Antes de criar algo em admin, checar se já existe em `features/shared/` (especialmente `health/`, `profit/`, `xchat/`, `faq/`).
2. **Tipos de domínio são source of truth.** `STATUS_OPTIONS` deve derivar de mapas de label que vivem nos `types/index.ts` da feature, não ser redefinido no `page.tsx`.
3. **Detalhes de UX viram regra:** `cursor-pointer` em todo elemento clicável; ícones em tamanhos consistentes por contexto (`w-4 h-4` para ações, `w-5 h-5` para KPIs); `data-testid` em ações.
4. **KPI clicável vira filtro.** Quando faz sentido (Inadimplência → filtra clientes inadimplentes; Alertas → filtra eventos de risco), o card aplica o filtro.
5. **Paginação obrigatória** quando uma tabela pode passar de ~20 linhas. Padrão: shadcn `Pagination`. Excessões só quando o domínio pede outro padrão (timeline cronológica → "Carregar mais").

## Fases

Cada fase tem critérios de pronto e pode ser interrompida sem deixar a aplicação quebrada.

---

### Fase 7.1 — Helpers compartilhados ✅ baixo risco

Promover funções duplicadas para `@shared/lib/`. Sem mudança visual.

- [x] Estender `shared/lib/formatters.ts` com:
  - `formatRange(min, max, options?: { prefix?, suffix? }): string` — formata "min – max" com `∞` quando ausente.
  - `formatDate(iso: string): string` — DD/MM/YYYY.
  - `formatDateTime(iso: string): string` — DD/MM/YYYY HH:mm.
  - `getInitials(name: string): string` — primeiras 2 iniciais maiúsculas.
- [x] Criar `shared/lib/pagination.ts` com `getPaginationRange(current, total): (number | 'ellipsis')[]`.
- [x] Substituir nas páginas que duplicam: clientes, empreiteiras, obras, anuncios, entradas, saidas, planos.
- [x] `npx tsc --noEmit` sem erros.

**Critério de pronto:** todas as páginas admin importam helpers de shared, nenhuma definição local sobrevive. ✅

---

### Fase 7.2 — `constants.ts` por feature admin

Cada feature em `features/admin/<X>/` ganha um `constants.ts` com labels, opções e mapas hoje inline no `page.tsx`. Reduz cada `page.tsx` em 30-80 linhas e desbloqueia reuso entre páginas relacionadas (entradas/saidas).

- [x] anuncios — `STATUS_CAMPANHA_OPTIONS`, `ZONA_OPTIONS`, `STATUS_ANUNCIANTE_OPTIONS`, `statusClasses`, `statusLabels`, `PAGE_SIZE_CAMPANHAS`, `PAGE_SIZE_ANUNCIANTES`. (`AnuncianteStatus` movido para `types/index.ts`.)
- [x] auditoria — `EVENTO_CONFIG`, `TIPO_LABEL`, `MODULO_LABEL`, `CATEGORIA_LABEL`, `CATEGORIA_BADGE_CLASS`, `INITIAL_DAYS`, `DAYS_INCREMENT`, `getCategoria()`, `TIPO_OPTIONS`, `MODULO_OPTIONS`, `CATEGORIA_OPTIONS`.
- [x] clientes — `STATUS_OPTIONS` (derivado do tipo `AdminCliente['status']`), `ITEMS_PER_PAGE`.
- [x] empreiteiras — `statusConfig`, `STATUS_OPTIONS`, `ITEMS_PER_PAGE` (novo, p/ 7.3).
- [x] entradas — `tipoReceitaLabels`, `tipoReceitaClasses`, `origemLabels`, `statusLabels`, `statusClasses`, `ORIGEM_OPTIONS`, `TIPO_RECEITA_OPTIONS`, `STATUS_OPTIONS`, `PERIOD_OPTIONS`, `PAGE_SIZE`.
- [x] obras — `STATUS_OPTIONS` (derivado de `OBRA_STATUS_LABEL`), `SAUDE_OPTIONS` (derivado de `HEALTH_LABELS`), `ITEMS_PER_PAGE`.
- [x] planos — `STATUS_OPTIONS` derivado de `PLANO_STATUS_LABEL`, `PAGE_SIZE`.
- [x] saidas — `tipoSaidaLabels`, `tipoSaidaClasses`, `statusLabels`, `statusClasses`, `destinoPerfilLabels`, `destinoPerfilClasses`, `TIPO_SAIDA_OPTIONS`, `DESTINO_PERFIL_OPTIONS`, `STATUS_OPTIONS`, `PERIOD_OPTIONS`, `SEM_OBRA`, `PAGE_SIZE`, `PAGE_SIZE_FUTURAS`.
- [x] caixa — **não aplica**: constantes vivem dentro de `MovimentacoesTable.tsx` e não há duplicação fora dali.

**Critério de pronto:** os `page.tsx` afetados ficam só com lógica de UI/state; nenhum mapa estático sobrevive inline. ✅

---

### Fase 7.3 — Padronização de filtros e paginação

- [x] **caixa e financeiro: não aplica** — ambos já usam `AdvancedFiltersPopover` em seus sub-componentes (`MovimentacoesTable`, `ObrasAtencaoTable`, `TopRankingTable`). As tabs de período em WelcomeSection são corretas (afetam KPIs+gráfico+tabelas) e devem permanecer.
- [x] Padronizar paginação em **shadcn `Pagination`** nas páginas que ainda usam botões ad-hoc:
  - [x] planos (Anterior/Próximo custom → shadcn)
  - [x] obras (botões custom → shadcn)
  - [x] anuncios (2 blocos numerados custom → shadcn)
  - [x] entradas e saidas (SVG inline → shadcn; saidas tem 2 blocos: principal + futuras)
  - [x] caixa MovimentacoesTable (Anterior/Próxima custom → shadcn)
  - [x] empreiteiras (paginação inédita adicionada com `ITEMS_PER_PAGE = 12`)
- [x] Manter "Carregar mais" só na auditoria (timeline cronológica).
- [x] Garantir `setCurrentPage(1)` automático ao mudar qualquer filtro (helper `onFilterChange` introduzido em empreiteiras; demais já tinham reset).

**Critério de pronto:** todas as listas com >20 itens potenciais usam shadcn `Pagination`. Nenhuma página tem filtro ad-hoc fora do popover. ✅

---

### Fase 7.4 — Configurações shell compartilhada

Maior alavanca de simplificação. Hoje admin/contratante/empreiteiro têm 3 páginas de Configurações de ~900-1030 linhas cada com layout idêntico.

- [ ] Criar `features/shared/configuracoes/` com:
  - `ConfiguracoesShell.tsx` — recebe `sections: Section[]` e renderiza nav lateral + conteúdo via search param `?secao=`.
  - `components/SectionTitle.tsx`, `FieldRow.tsx`, `SwitchRow.tsx`, `SelectField.tsx` — promovidos das 3 páginas.
  - `sections/SecaoPerfil.tsx` — 100% compartilhada entre as 3 visões.
  - `sections/SecaoNotificacoes.tsx` — estrutura compartilhada, labels parametrizadas.
- [ ] Refatorar `app/admin/configuracoes/page.tsx` para usar o shell + seções específicas (Geral, Plataforma, Segurança, Integrações).
- [ ] Refatorar `app/contratante/configuracoes/page.tsx` (Empresa, Privacidade, Plano).
- [ ] Refatorar `app/empreiteiro/configuracoes/page.tsx` (Empresa, Privacidade, Plano).
- [ ] Mover `MOCK_SESSIONS` (sessões ativas) para `features/admin/configuracoes/mocks/`.

**Critério de pronto:** as 3 páginas de configurações somam menos linhas que o admin sozinho tinha; helpers só existem em shared; navegação por `?secao=` funciona idêntica nas 3 visões.

---

### Fase 7.5 — Stores e dados compartilhados

- [ ] Promover `termos-store` (hoje duplicado em `features/contratante/termos/store/` e `features/empreiteiro/termos/store/`) para `features/shared/termos/store/`. Atualizar imports.
- [ ] Avaliar promoção de constantes/helpers da página de Notificações (contratante e empreiteiro têm 226 linhas cada, com `ICON_MAP`/`FILTER_TABS` idênticos) para `features/shared/notifications/`.

**Critério de pronto:** nenhuma store está duplicada entre visões.

---

### Fase 7.6 — Drilldown de saúde de obra

`features/shared/health/` já tem `calculateHealth`, `HealthDetailPanel`, `FACTOR_LABELS` (atraso, custo, medições, etc.). Plugar isso no admin.

- [ ] Garantir que `app/admin/obras/page.tsx` mostra `HealthCard` com badge clicável.
- [ ] No clique do badge/linha, abrir `HealthDetailPanel` em sheet/dialog mostrando os fatores de saúde da obra (qual indicador puxou pra "atenção"/"risco").
- [ ] Adicionar `cursor-pointer` em todas as células/badges clicáveis da listagem.
- [ ] Filtro por saúde (`SAUDE_OPTIONS`) já existe — confirmar que está conectado ao popover.

**Critério de pronto:** admin clica no card de obra → vê em qual fator (atraso/custo/medições) está o problema.

---

### Fase 7.7 — Drilldown de inadimplência e filtros faltantes

- [ ] **Inadimplência clicável**: card "Inadimplência" em `app/admin/clientes/page.tsx` recebe `onClick` que aplica filtro pré-definido (status `inadimplente` ou `valorTotalContratado > valorTotalPago`). `cursor-pointer` quando clicável.
- [ ] **Filtro por cliente em obras**: adicionar `MultiSelectDropdown` "Cliente" no popover de `app/admin/obras/page.tsx`. Opções derivadas dos clientes únicos da listagem.
- [ ] **Filtro por estado/UF** em `app/admin/clientes/page.tsx` e `app/admin/empreiteiras/page.tsx`. Já temos os dados de localização.
- [ ] **Filtro por horário** em `app/admin/auditoria/page.tsx` (range hh:mm dentro do popover).

**Critério de pronto:** os 4 filtros aplicam, paginação reseta para 1 ao aplicar, chips ativos exibem corretamente.

---

### Fase 7.8 — Modais "Novo X" faltantes

Hoje só clientes, anúncios e FAQ têm modal de criação. O admin precisa criar empreiteiras, obras, planos, entradas, saídas direto da listagem.

- [ ] `NovaEmpreiteiraModal` em `features/admin/empreiteiras/components/` (já existe no padrão de cliente — replicar).
- [ ] `NovaObraModal` em `features/admin/obras/components/`.
- [ ] `NovoPlanoModal` em `features/admin/planos/components/`.
- [ ] `NovaEntradaModal` em `features/admin/entradas/components/`.
- [ ] `NovaSaidaModal` em `features/admin/saidas/components/`.
- [ ] Cada modal abre por botão no header da página, no padrão de [clientes/page.tsx](app/admin/clientes/page.tsx).

**Critério de pronto:** todas as listas admin têm botão "Novo X" no header com modal funcional (mock — não persiste backend).

---

### Fase 7.9 — Exportação CSV

- [ ] Criar `shared/lib/export-csv.ts` com `exportToCsv(filename: string, rows: Array<Record<string, unknown>>, columns: { key, label }[])`.
- [ ] Adicionar botão "Exportar" no header das listagens admin que pagina dados (clientes, empreiteiras, obras, entradas, saidas, planos, anuncios). Botão exporta a coleção **filtrada** (não a página atual).
- [ ] Padrão visual: `<Button variant="outline">` com `RiDownloadLine`.

**Critério de pronto:** admin consegue baixar CSV de qualquer listagem aplicando filtros antes.

---

### Fase 7.10 — Quebra de páginas gigantes

Refator técnico, sem mudança visual.

- [ ] [anuncios/page.tsx](app/admin/anuncios/page.tsx) (1160 linhas): extrair `ZonaCard`, `CampanhaRow`, `AnuncianteRow`, `useCampanhasFilters`, `useAnunciantesFilters` para `features/admin/anuncios/components/` e `hooks/`.
- [ ] [saidas/page.tsx](app/admin/saidas/page.tsx) (875 linhas) e [entradas/page.tsx](app/admin/entradas/page.tsx) (678 linhas): criar `features/admin/financeiro-shared/hooks/usePeriodoFilters.ts` (lógica idêntica em ambas) e `useTabelaFilters.ts`.
- [ ] [configuracoes/page.tsx](app/admin/configuracoes/page.tsx): já será resolvida na Fase 7.4 via shell.

**Critério de pronto:** nenhuma `page.tsx` da divisão admin passa de 500 linhas.

---

### Fase 7.11 — Polimento (passada final)

Lista de checklist micro a aplicar página por página:

- [ ] `cursor-pointer` em todo card/linha/badge clicável.
- [ ] `data-testid` consistente em todos os botões/inputs/links.
- [ ] Tamanho de ícones: `w-4 h-4` para ações; `w-5 h-5` para KPIs; `w-3.5 h-3.5` para metadados em cards. Alinhar `RiEdit2Line` (hoje varia entre w-4 e w-6) e `RiArrowRightSLine` (varia entre w-4 e w-5).
- [ ] Botões realmente como `<button>` (substituir `<div onClick>` se sobrar algum).
- [ ] Empty states consistentes (ícone cinza + título bold + subtítulo + botão de ação primária quando aplicável).
- [ ] Skeletons consistentes em todas as listas.

**Critério de pronto:** sweep manual de cada página admin sem encontrar mais quebras de padrão.

---

## Sequência recomendada

1. **Hoje (sessão atual):** 7.1 → 7.2 → 7.3.
2. **Próxima sessão:** 7.4 (configurações shell — alta alavanca).
3. **Sessão seguinte:** 7.5 + 7.6 (drilldown saúde já tem 80% pronto em shared).
4. **Sessão seguinte:** 7.7 + 7.8.
5. **Encerramento:** 7.9 + 7.10 + 7.11.

Cada fase é interrompível: ao terminar uma, a aplicação fica funcional e o type-check limpo.

## Diário de execução

### 2026-04-30 (sessão 1)

- [x] PRD criado.
- [x] Fase 7.1 iniciada — `formatters.ts` estendido, `pagination.ts` criado, primeiras páginas migradas (clientes, empreiteiras, obras parcialmente).

### 2026-05-01 (sessão 2)

- [x] **Fase 7.1 fechada** — única edição restante (remover `formatDate` e `formatRangeFilterLabel` locais de `app/admin/anuncios/page.tsx`).
- [x] **Fase 7.2 fechada** — 8 `constants.ts` criados em `features/admin/{clientes,planos,empreiteiras,obras,entradas,saidas,anuncios,auditoria}/`. Caixa marcada como `não aplica`. `AnuncianteStatus` movido para `features/admin/anuncios/types/index.ts`.
- [x] **Fase 7.3 fechada** — paginação shadcn aplicada em 6 páginas + 2 sub-blocos (caixa MovimentacoesTable, anuncios x2, entradas, saidas x2, planos, obras, empreiteiras). Reavaliação: caixa/financeiro já usavam `AdvancedFiltersPopover` em sub-componentes — itens marcados como `não aplica`. Empreiteiras ganhou paginação nova com `onFilterChange` em todos os 8 filtros.
- [x] `npx tsc --noEmit` limpo após cada etapa.
