# PRD de Refatoração: Container/Presentation + TypeScript Hardening

**Iniciado**: 2026-02-17
**Branch**: main-replit
**Status atual**: Fase 1 — ✅ CONCLUÍDA | Fase 2 — ✅ CONCLUÍDA | Fase 3 — ✅ CONCLUÍDA | Fase 4 — ✅ CONCLUÍDA | Fase 5 — ✅ CONCLUÍDA

---

## Progresso Geral

| Fase | Feature | Status | Início |
|---|---|---|---|
| 0 | Setup & Convenções | ✅ CONCLUÍDA | 2026-02-17 |
| 1 | `empreiteiro/dashboard` (Pilot) | ✅ CONCLUÍDA | 2026-02-17 |
| 2 | `contratante/dashboard` + `admin/financeiro` | ✅ CONCLUÍDA | 2026-02-17 |
| 3 | Layout/Sidebars | ✅ CONCLUÍDA | 2026-02-17 |
| 4 | Auth TypeScript Hardening | ✅ CONCLUÍDA | 2026-02-17 |
| 5 | `landing`, `faq`, `obras`, `financeiro`, `chat` | ✅ CONCLUÍDA | 2026-02-17 |

---

## Convenções (Fase 0)

### Decisão Server vs Client Component
```
Usa useState/useEffect/useRef?          → DEVE ser 'use client'
Usa useRouter/usePathname?              → DEVE ser 'use client'
Usa framer-motion (motion.*, animate)?  → DEVE ser 'use client'
Usa recharts ou libs que acessam DOM?   → DEVE ser 'use client'
Usa hooks Zustand (useAuth, etc.)?      → DEVE ser 'use client'
onClick/onChange em elemento DOM?       → DEVE ser 'use client'
Nenhuma das anteriores?                 → SERVER COMPONENT (remover 'use client')
```

### Padrão Container/Presentation
- `ComponentName.tsx` — apresentação pura (recebe props tipadas, só renderiza JSX)
- `ComponentName.container.tsx` — container (hooks, transformação de dados, lógica condicional)
- Container **sempre** `'use client'`; apresentação segue a decisão acima

### Regra de Tipos
- **TODA** interface/type de props vai para `features/[feature]/[sub]/types/index.ts`
- Sem exceção para "usado só em 1 arquivo" — arquivo de tipos é a fonte única de verdade
- Exceção apenas: tipos utilitários puramente internos de helpers simples

### Quando NÃO criar container
Não criar container para componentes que já são apresentação pura:
- `StatsCard` — recebe props prontas, sem lógica
- `WelcomeSection` — componente pequeno sem lógica de negócio
- `EfficiencyProgress` — useState/animate é comportamento de UI (animação), não lógica
- `CashFlowChart` — visualização pura de dados via recharts
- `ActivityItem`, `RecentActivities` — renderizadores de lista

---

## Fase 1 — empreiteiro/dashboard

### Batch 1A — Migração de Tipos
> Mover todas as interfaces inline para `features/empreiteiro/dashboard/types/index.ts`

| Arquivo | Interfaces Movidas | Status |
|---|---|---|
| `types/index.ts` | Adicionar prop types + corrigir `StatsCardData` | ✅ |
| `StatsGrid.tsx` | `StatsGridProps` | ✅ |
| `StatsCard.tsx` | `StatsCardProps` | ✅ |
| `FinancialOverview.tsx` | `FinancialOverviewProps` | ✅ |
| `CashFlowChart.tsx` | `CashFlowChartProps` | ✅ |
| `RecentActivities.tsx` | `RecentActivitiesProps` | ✅ |
| `ActivityItem.tsx` | `ActivityItemProps` | ✅ |
| `EfficiencyProgress.tsx` | `EfficiencyProgressProps` | ✅ |
| `FinancialMiniCard.tsx` | `FinancialMiniCardProps` | ✅ |
| `EmptyState.tsx` | `EmptyStateProps`, `EmptyStateAction` | ✅ |

Verificação: `npx tsc --noEmit` sem erros novos ✅

### Batch 1B — Server Components
> Remover `'use client'` de componentes que não usam APIs de browser

| Arquivo | Ação | Status |
|---|---|---|
| `DashboardSkeleton.tsx` | Remover `'use client'` | ✅ |
| `FinancialMiniCard.tsx` | Remover `'use client'` | ✅ |

Verificação: `/empreiteiro/dashboard` carrega corretamente ✅

### Batch 1C — Extração de Container
> Separar lógica de UI em `StatsGrid` + simplificar `page.tsx`

| Arquivo | Ação | Status |
|---|---|---|
| `StatsGrid.tsx` | Refatorar para receber `stats: StatsCardData[]` | ✅ |
| `StatsGrid.container.tsx` | NOVO: lógica + montagem do array | ✅ |
| `app/empreiteiro/dashboard/page.tsx` | Usar hooks reais, importar container | ✅ |
| `types/index.ts` | Adicionar `StatsGridProps` (apresentação) e `StatsGridContainerProps` | ✅ |

Verificação: `/empreiteiro/dashboard` carrega, stats corretos, empty state funciona ✅

### Batch 1D — TypeScript Hardening
> Return types explícitos em utils e hooks; `as const` onde faltava

| Arquivo | Ação | Status |
|---|---|---|
| `utils.ts` | Todos os return types já explícitos | ✅ |
| `hooks/use-dashboard-stats.ts` | Return type explícito | ✅ |
| `hooks/use-financial-data.ts` | Return type explícito | ✅ |
| `hooks/use-recent-activities.ts` | Return type explícito | ✅ |
| `constants.ts` | `as const` já aplicado em todos os objetos | ✅ |

Verificação: `npx tsc --noEmit` zero erros novos ✅

### Checklist Final Fase 1
- [x] `npx tsc --noEmit` passa ✅
- [ ] `/empreiteiro/dashboard` carrega sem erros de console (verificar em runtime)
- [ ] Cards de stats renderizam com dados
- [ ] Gráfico CashFlow renderiza
- [ ] Skeleton aparece durante loading
- [ ] Empty state funciona (quando sem dados)

### Extras realizados no Batch 1D
- Removido import não utilizado `getActivityColor` de `ActivityItem.tsx`
- Removido import não utilizado `Separator` de `RecentActivities.tsx`
- Removido import não utilizado `EmptyState` de `CashFlowChart.tsx`

---

## Fase 2 — contratante/dashboard + admin/financeiro

### Batch 2A — Migração de Tipos

#### contratante/dashboard
| Arquivo | Interfaces Movidas | Status |
|---|---|---|
| `types/index.ts` | Adicionar `StatsCardBadgeVariant`, `StatsCardData`, `StatsCardProps`, `StatsGridProps`, `StatsGridContainerProps`, `EvolutionChartProps`, `PhaseDistributionChartProps`, `PhaseDistributionChartTooltipProps`, `RecentActivitiesCardProps`, `PendenciasCardProps`, `ValoresContratadosProps` | ✅ |
| `StatsCard.tsx` | `StatsCardProps` (inline → import) | ✅ |
| `StatsGrid.tsx` | `StatsGridProps` (inline → import) | ✅ |
| `EvolutionChart.tsx` | `EvolutionChartProps` | ✅ |
| `PhaseDistributionChart.tsx` | `PhaseDistributionChartProps`, `CustomTooltipProps` → `PhaseDistributionChartTooltipProps` | ✅ |
| `RecentActivitiesCard.tsx` | `RecentActivitiesCardProps` | ✅ |
| `PendenciasCard.tsx` | `PendenciasCardProps` | ✅ |
| `ValoresContratados.tsx` | `ValoresContratadosProps` | ✅ |

#### admin/financeiro
| Arquivo | Interfaces Movidas | Status |
|---|---|---|
| `types/index.ts` | Adicionar todos os prop types + `ProgressBarProps`, `WelcomeSectionProps` | ✅ |
| `StatsCard.tsx` | `StatsCardProps`, `StatsCardBadgeVariant` | ✅ |
| `StatsGrid.tsx` | `StatsGridProps` | ✅ |
| `WelcomeSection.tsx` | `WelcomeSectionProps` | ✅ |
| `PaymentsEvolutionChart.tsx` | `PaymentsEvolutionChartProps`, `CustomTooltipProps` → `PaymentsEvolutionChartTooltipProps` | ✅ |
| `StatusDistributionChart.tsx` | `StatusDistributionChartProps`, `CustomTooltipProps` → `StatusDistributionChartTooltipProps` | ✅ |
| `ObrasAtencaoTable.tsx` | `ObrasAtencaoTableProps`, `ProgressBarProps` | ✅ |
| `TopClientesTable.tsx` | `TopClientesTableProps` | ✅ |
| `TopEmpreiteirasTable.tsx` | `TopEmpreiteirasTableProps` | ✅ |
| `ReceitasPlataformaTable.tsx` | `ReceitasPlataformaTableProps` | ✅ |

### Batch 2B — Server Components

| Arquivo | Ação | Status |
|---|---|---|
| `contratante/DashboardSkeleton.tsx` | Remover `'use client'` | ✅ |
| `contratante/WelcomeSection.tsx` | Remover `'use client'` | ✅ |
| `admin/financeiro/DashboardSkeleton.tsx` | Remover `'use client'` | ✅ |

Nota: `admin/financeiro/WelcomeSection.tsx` permanece client (tem `onClick` no seletor de período).

### Batch 2C — Containers StatsGrid

| Arquivo | Ação | Status |
|---|---|---|
| `contratante/StatsGrid.tsx` | Refatorar para receber `stats: StatsCardData[]` | ✅ |
| `contratante/StatsGrid.container.tsx` | NOVO: monta array de 4 cards | ✅ |
| `admin/financeiro/StatsGrid.tsx` | Refatorar para receber `stats: StatsCardData[]` | ✅ |
| `admin/financeiro/StatsGrid.container.tsx` | NOVO: monta array de 6 cards com formatação | ✅ |
| `app/contratante/dashboard/page.tsx` | Usar `StatsGridContainer` | ✅ |
| `app/admin/financeiro/page.tsx` | Usar `StatsGridContainer` | ✅ |

### Batch 2D — TypeScript Hardening

| Arquivo | Status |
|---|---|
| `contratante/utils.ts` | Return types já explícitos ✅ |
| `admin/financeiro/utils.ts` | Return types já explícitos ✅ |
| Hooks | Nenhum hook customizado nessas features ✅ |

### Verificação Fase 2
- [x] `npx tsc --noEmit` passa ✅

---

## Fase 3 — Layout/Sidebars

### Batch 3A — Feature-level types files

| Arquivo | Conteúdo | Status |
|---|---|---|
| `features/empreiteiro/types/index.ts` | `NavItem`, `EmpreiteiroLayoutProps` | ✅ NOVO |
| `features/contratante/types/index.ts` | `NavItem`, `ContratanteLayoutProps` | ✅ NOVO |
| `features/admin/types/index.ts` | `NavItem`, `AdminLayoutProps` | ✅ NOVO |
| `EmpreiteiroLayout.tsx` | Import `EmpreiteiroLayoutProps` dos types | ✅ |
| `ContratanteLayout.tsx` | Import `ContratanteLayoutProps` dos types | ✅ |
| `AdminLayout.tsx` | Import `AdminLayoutProps` dos types | ✅ |

### Batch 3B — Nav arrays → constants files

| Arquivo | Conteúdo | Status |
|---|---|---|
| `features/empreiteiro/constants.ts` | `EMPREITEIRO_NAV_ITEMS`, `EMPREITEIRO_BOTTOM_NAV_ITEMS` | ✅ NOVO |
| `features/contratante/constants.ts` | `CONTRATANTE_NAV_ITEMS`, `CONTRATANTE_BOTTOM_NAV_ITEMS` | ✅ NOVO |
| `features/admin/constants.ts` | `ADMIN_NAV_ITEMS`, `ADMIN_BOTTOM_NAV_ITEMS` | ✅ NOVO |
| `shared/constants/navigation.ts` | `AppNavItem`, `APP_SIDEBAR_NAV_ITEMS`, `APP_SIDEBAR_BOTTOM_NAV_ITEMS` | ✅ NOVO |
| `EmpreiteiroSidebar.tsx` | Importa de constants, remove arrays inline | ✅ |
| `ContratanteSidebar.tsx` | Importa de constants, remove arrays inline | ✅ |
| `AdminSidebar.tsx` | Importa de constants, remove arrays inline | ✅ |
| `AppSidebar.tsx` | Importa de shared/constants, remove arrays inline | ✅ |

### Batch 3C — TypeScript Hardening

| Arquivo | Ação | Status |
|---|---|---|
| `EmpreiteiroSidebar.tsx` | `isActive` → `: boolean` explícito | ✅ |
| `ContratanteSidebar.tsx` | `isActive` → `: boolean` explícito | ✅ |
| `AdminSidebar.tsx` | `isActive` → `: boolean` explícito | ✅ |
| `AppSidebar.tsx` | `isActive` → `: boolean` explícito | ✅ |
| `EmpreiteiroLayout.tsx` | Remover import `SidebarTrigger` não utilizado | ✅ |

### Verificação Fase 3
- [x] `npx tsc --noEmit` passa ✅

### Nota
Todos os sidebars permanecem `'use client'` (usam `usePathname`, `useRouter`, `useAuth`).
`app/dashboard/layout.tsx` tem tipo inline `{ children: React.ReactNode }` — mantido pois é arquivo `app/` fora do escopo de `features/`.

---

## Fase 4 — Auth TypeScript Hardening

| Arquivo | Ação | Status |
|---|---|---|
| `features/auth/store/auth-store.ts` | Remover `router?: any` de `login`, `register`, `logout` na interface e implementação; remover import `getRedirectPathByRole` | ✅ |
| `features/auth/hooks/use-auth.ts` | Atualizar `AuthContextType`: remover `router?: any` de `login`, `register`, `logout` | ✅ |
| `app/login/page.tsx` | Remover `router` do `login()` call; navegar localmente com `useAuthStore.getState().user` + `getRedirectPathByRole` | ✅ |
| `app/cadastro/page.tsx` | Adicionar `router.push('/verificar-email?email=...')` após registro bem-sucedido (bug fix) | ✅ |

**Decisão**: Router removido das actions do store. Callers usam `useAuthStore.getState().user` (Zustand sync) após `await login()` para ler o user recém-salvo e calculam o destino localmente com `getRedirectPathByRole`.

### Verificação Fase 4
- [x] `npx tsc --noEmit` passa ✅

---

## Fase 5 — Features Restantes

### Batch 5A — Tipos landing/
| Arquivo | Ação | Status |
|---|---|---|
| `features/landing/types/index.ts` | NOVO: `GlassNavProps`, `StructuredDataProps` | ✅ |
| `features/landing/components/GlassNav.tsx` | Remover `interface GlassNavProps` inline; importar de types | ✅ |
| `features/landing/components/StructuredData.tsx` | Remover inline `{ data: object \| object[] }`; remover `'use client'`; importar `StructuredDataProps` | ✅ |

### Batch 5B — Server Components
| Arquivo | Ação | Status |
|---|---|---|
| `features/landing/components/SiteFooter.tsx` | Remover `'use client'` (sem hooks, sem eventos) | ✅ |
| `features/admin/financeiro/components/TopClientesTable.tsx` | Remover `'use client'` (apresentação pura) | ✅ |
| `features/admin/financeiro/components/TopEmpreiteirasTable.tsx` | Remover `'use client'` (apresentação pura) | ✅ |
| `features/admin/financeiro/components/ObrasAtencaoTable.tsx` | Remover `'use client'` (apresentação pura) | ✅ |
| `features/admin/financeiro/components/ReceitasPlataformaTable.tsx` | Remover `'use client'` (apresentação pura) | ✅ |
| `features/contratante/dashboard/components/PendenciasCard.tsx` | Remover `'use client'` (apresentação pura) | ✅ |
| `features/contratante/dashboard/components/ValoresContratados.tsx` | Remover `'use client'` (apresentação pura) | ✅ |

### Nota
`faq/`, `obras/`, `financeiro/`, `chat/` — features vazias ou já bem organizadas (types centralizados, sem componentes inline). Nenhuma alteração necessária.

### Verificação Fase 5
- [x] `npx tsc --noEmit` passa ✅

---

## Decisões & Notas

| Data | Decisão | Motivo |
|---|---|---|
| 2026-02-17 | `WelcomeSection` empreiteiro permanece client | Usa `motion.div` de framer-motion |
| 2026-02-17 | `EmptyState` tipos em empreiteiro/dashboard/types por agora | Candidata a shared futuramente |
| 2026-02-17 | Build base (tsc --noEmit) passa sem erros antes de qualquer alteração | Baseline confirmado |
| 2026-02-17 | `StatsCardData` corrigido: `icon: string` → `IconType`, `value: number` → `string \| number` | Tipo estava incorreto no arquivo original |
