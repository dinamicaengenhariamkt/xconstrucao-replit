# PRD — Rollout global do efeito luminous (3 visões)

> **Status**: Waves 0–3 concluídas. Wave 4 (configurações) opcional, pendente.
> **Última atualização**: 2026-05-05.

## Contexto

O efeito visual "luminous" (borda gradient sutil + hover refinado em KPIs; borda transparente + leve degradê interno em cards de seção) foi calibrado e validado no `/empreiteiro/dashboard` e em mais 3 páginas empreiteiro (`/pagamentos`, `/dashboard/atividades-recentes`, `/notificacoes`). Este documento serve como **checklist de execução** pra coordenar a substituição em ondas, marcando o que está feito vs pendente.

## Recap dos efeitos

**`luminous-card`** (KPIs/stat cards) — borda branca gradient sutil via `::before`; hover adiciona top-line primary, bg gradient, label vira primary, ícone com border + scale. Encapsulado no shared `<StatsCard luminous>` em [features/shared/components/StatsCard/StatsCard.tsx](../features/shared/components/StatsCard/StatsCard.tsx).

**`luminous-section`** (cards de seção / list containers) — borda gradient cinza com 0.06 alpha + degradê interno cinza→branco→cinza muito sutil. **Pré-requisito**: neutralizar o `border` + `shadow-sm` default do shadcn Card adicionando `border-transparent shadow-none`. Pattern em [features/empreiteiro/dashboard/components/RecentActivities.tsx](../features/empreiteiro/dashboard/components/RecentActivities.tsx) (linhas 41-46).

CSS implementado em [app/globals.css](../app/globals.css) (linhas 361-406).

## Componente novo: `<SectionCard luminous>`

Após o rollout, ~30 componentes usarão a mesma combinação `cn(luminous && 'luminous-section border-transparent shadow-none')`. Vale extrair um wrapper fininho:

```tsx
// features/shared/components/SectionCard/SectionCard.tsx
'use client';
import { Card } from '@shared/components/ui/card';
import { cn } from '@shared/lib/utils';

interface SectionCardProps extends React.HTMLAttributes<HTMLDivElement> {
  luminous?: boolean;
}

export function SectionCard({ luminous, className, ...props }: SectionCardProps) {
  return (
    <Card
      className={cn(
        luminous && 'luminous-section border-transparent shadow-none',
        className,
      )}
      {...props}
    />
  );
}
```

**Decisão**: criar antes da Wave 1. Componentes Wave 0 não migram retroativamente nesta etapa (sem ROI).

---

## Status

### Wave 0 — empreiteiro core ✅ DONE

- [x] `/empreiteiro/dashboard` — StatsGrid (5 KPIs), HealthSummary, ProfitSummary, FinancialOverview (3 mini-KPIs trocados por StatsCard), RecentActivities + ActivityItem (hover refinado).
- [x] `/empreiteiro/pagamentos` — 6 KPIs, RecebimentosBreakdown, RecebimentosEvolutionChart, tabela de medições.
- [x] `/empreiteiro/dashboard/atividades-recentes` — container da lista.
- [x] `/empreiteiro/notificacoes` — `NotificationsListView luminous` (prop opt-in adicionada ao shared).

### Pré-Wave 1 — Componente shared ✅ DONE

- [x] Criar `<SectionCard>` em `features/shared/components/SectionCard/`.

---

### Wave 1 — Contratante ✅ DONE

#### `/contratante/dashboard` ✅
- [x] StatsGrid (5 KPIs)
- [x] EvolutionChart
- [x] PhaseDistributionChart
- [x] RecentActivitiesCard
- [x] PendenciasCard
- [x] ValoresContratados
- [x] HealthSummary (passar prop existente)

#### `/contratante/pagamentos` ✅
- [x] StatsCard (4 KPIs)
- [x] PagamentosEvolutionChart
- [x] Histórico (div inline)

#### `/contratante/medicoes` ✅
- [x] StatsCard (5 KPIs)
- [x] Tabela de medições

#### `/contratante/atividades` ✅
- [x] Activities Card

#### `/contratante/notificacoes` ✅
- [x] `NotificationsListView`

#### `/contratante/nova-obra` ✅
- [x] Form section cards (cardClass constante atualizada)

**Skip Wave 1**: `/contratante/minhas-obras` (ObraCard ornado), `/contratante/planos` (pricing), `/contratante/chat`, `/contratante/faq`, `/contratante/configuracoes` (Wave 4).

---

### Wave 2 — Admin ✅ DONE

#### `/admin/financeiro` ✅
- [x] StatsCard (6 KPIs)
- [x] AdoptionMetricsSection (outer Card + 5 KPIs internos)
- [x] SatisfactionMetricsSection
- [x] HealthSummary
- [x] ProfitSummary
- [x] PaymentsEvolutionChart
- [x] StatusDistributionChart
- [x] ObrasAtencaoTable
- [x] TopClientesTable / TopEmpreiteirasTable (via TopRankingTable)
- [x] ReceitasPlataformaTable

#### `/admin/caixa` ✅
- [x] KpiGridContainer (6 KPIs)
- [x] IndicadoresEconomicosSection / IndicadorCard — alinhado ao padrão `luminous-card` preservando sparkline e tons temáticos por indicador (iconBgClass/iconColorClass/badgeClass/sparklineColor). Campo `hoverBorderClass` no type marcado como deprecated (não consumido).
- [x] CaixaChart
- [x] FluxoResumo
- [x] MovimentacoesTable

#### `/admin/clientes` ✅
- [x] 3 KPIs — refatorados pra `StatsCard` shared

#### `/admin/obras` ✅
- [x] 2 KPIs — refatorados pra `StatsCard` shared

#### `/admin/empreiteiras` ✅
- [x] 2 KPIs — refatorados pra `StatsCard` shared

#### `/admin/anuncios` ✅
- [x] StatsCard (6 KPIs)
- [x] Tabela Campanhas (inline)
- [x] Tabela Anunciantes (inline)

#### `/admin/auditoria` ✅
- [x] 6 KPIs — refatorados pra `StatsCard` shared (loading state troca skeleton por placeholder `'—'`)

#### `/admin/planos` ✅
- [x] 4 KPIs — refatorados pra `StatsCard` shared (loading state idem)

#### `/admin/disputas` ✅
- [x] StatsCard (5 KPIs)

**Skip Wave 2 confirmado**: ClienteCard, EmpreiteiraCard, ZonaCard, PlanoCard (ornados); IndicadorCard (temático); audit timeline; `/admin/configuracoes` (Wave 4).

---

### Wave 3 — Shared components (obra detail) ✅ DONE

Componentes shared usados em telas de detalhe de obra — props adicionados, mas **ainda não consumidos** pelas páginas de detalhe (consumir per-view conforme decisão visual):

- [x] `HealthCard` ([features/shared/health/components/HealthCard.tsx](../features/shared/health/components/HealthCard.tsx)) — prop `luminous` adicionada
- [x] `ProfitCard` ([features/shared/profit/components/ProfitCard.tsx](../features/shared/profit/components/ProfitCard.tsx)) — prop adicionada + propagada pros 4 StatsCards internos
- [x] `LocalizacaoCard` ([features/shared/components/LocalizacaoCard.tsx](../features/shared/components/LocalizacaoCard.tsx)) — prop adicionada
- [x] `HealthDetailPanel` ([features/shared/health/components/HealthDetailPanel.tsx](../features/shared/health/components/HealthDetailPanel.tsx)) — prop adicionada (4 Cards internos — flag global)

**Pendente decisão**:
- `ObraCard` shared — tem `border-l-4` colorido por status; luminous pode conflitar. **Skip por padrão**.
- `TimelineDisplay` — eventos com bg temático (problema = amber); luminous pode descaracterizar. **Skip por padrão**.

---

### Wave 4 — Configurações (opcional, todas as visões)

- [ ] `/empreiteiro/configuracoes` — múltiplos Cards de form
- [ ] `/contratante/configuracoes` — múltiplos Cards de form
- [ ] `/admin/configuracoes` — múltiplos Cards de form

**Reavaliar visualmente após Waves 1-2**: se as outras telas ficarem com luminous e configurações sem, pode parecer inconsistente. Decidir caso a caso.

---

## Skip definitivo (todas as visões)

- **Cards de obra**: `ObraCard`, `MinhaObraCard`, `NovaObraCard`, `ClienteCard`, `EmpreiteiraCard`, `PlanoCard`, `ZonaCard` — design ornado/temático intencional.
- **Pricing cards**: `/empreiteiro/planos`, `/contratante/planos`, `/admin/planos` (cards de plano).
- **FAQ**: accordions custom em todas as visões.
- **Chat**: layouts sem padrão Card.
- **TimelineDisplay**: eventos com bg temático.
- **Auditoria timeline** (admin): grupos verticais, não cards.

---

## Pattern de aplicação (referência rápida)

### KPI (StatsCard shared)
```tsx
<StatsCard label="..." value={...} icon={...} iconBgColor="..." luminous />
```

### Section card via shadcn Card (componente próprio)
```tsx
interface XProps { /* ... */ luminous?: boolean }
export function X({ ..., luminous = false }: XProps) {
  return (
    <SectionCard luminous={luminous}>
      ...
    </SectionCard>
  );
}
```

> ⚠️ **Sem o wrapper** (Card com `className` customizado pré-existente que não dá pra trocar pelo `<SectionCard>`), a aplicação manual **precisa** neutralizar a borda do shadcn:
> ```tsx
> <Card className={cn(luminous && 'luminous-section border-transparent shadow-none', className)}>
> ```
> Sem `border-transparent shadow-none`, o `border` + `shadow-sm` default do shadcn brigam com o gradiente e o efeito fica sujo.

### Section card via div (list containers)
```tsx
<div className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden luminous-section">
```

> ⚠️ Os 3 utilitários do bloco são todos **necessários**: `bg-white dark:bg-gray-900` (gradiente interno precisa de fundo pra contrastar — sem isso o efeito some), `rounded-2xl overflow-hidden` (sem o overflow o gradiente vaza nas bordas).

### KPIs feitos com Card manual (admin/clientes, obras, empreiteiras, auditoria, planos)
**Recomendação**: refatorar pra usar `StatsCard` shared (padronização + luminous embutido). Alternativa: aplicar `luminous-card` className inline + 2 spans de hover (mais trabalho).

> ⚠️ **Decidir antes da Wave 2 começar** — uma decisão única vale pras 5 páginas (clientes, obras, empreiteiras, auditoria, planos = **17 KPIs**). Se a opção for inline, cada KPI precisa também receber **os 2 spans de hover** (top-line primary + bg gradient), senão fica com a borda sem o hover refinado, divergindo dos KPIs feitos via `StatsCard`.

---

## Princípio editorial: replicar o padrão do `/empreiteiro/dashboard`, preservar o que já está legal

**Referência canônica**: o `/empreiteiro/dashboard` (Wave 0) é a tela de referência. Qualquer componente nas outras visões só deve receber `luminous` se **bater com o padrão equivalente** lá:

- KPIs: card neutro (bg-white, border + shadow-sm padrão, ícone + label + valor) → recebe `luminous-card` (mesmo formato dos 5 KPIs do StatsGrid empreiteiro).
- Section cards de gráfico/lista/resumo: container neutro com header + corpo (HealthSummary, ProfitSummary, FinancialOverview, RecentActivities) → recebe `luminous-section`.

**Não tocar** em componentes que **fogem desse padrão**:

- Tabelas com tratamento próprio funcionando bem (cabeçalho colorido, zebra, badges, hover de linha custom) — o container externo até pode ganhar `luminous-section`, mas só se isso **não** descaracterizar o header/cell já estilizado. Se houver dúvida, manter o original.
- Cards ornados, temáticos, com `border-l-4` colorido por status, accent bar, ou identidade visual já estabelecida (ObraCard, ClienteCard, PlanoCard, ZonaCard, EmpreiteiraCard, MinhaObraCard).
- Accordions, timelines, cards de pricing, FAQ, chat — sem padrão Card neutro que case com Wave 0.

**Filtro prático antes de aplicar**: comparar antes/depois lado a lado. Se o "depois" deixar o componente com cara de Wave 0 empreiteiro **e** o "antes" não tinha identidade visual forte → aplicar. Se o "depois" descaracterizar algo que estava bom → **manter o original** e adicionar 1 linha em "Skip definitivo" abaixo com a justificativa.

---

## Verificação por Wave

1. `npx tsc --noEmit` exit 0.
2. **Visual smoke** nas páginas modificadas — confirmar:
   - KPIs: borda branca sutil + hover (top line primary, bg gradient, ícone scale).
   - Sections: borda gradient cinza muito sutil, sem sombra dura, leve degradê interno.
   - Cards de obra/plano/FAQ inalterados.
3. **Cross-view**: outras visões não tocadas naquela wave continuam visualmente iguais.

---

## Riscos & mitigações

- **Componentes shared**: prop `luminous?: boolean` default `false` — sem regressão em views não opt-in.
- **KPIs feitos com Card manual em admin**: refactor pra `StatsCard` é maior. Aceitar maior delta nessas páginas ou deixar inline `luminous-card`.
- **Dark mode**: efeito calibrado pra light. Se algum card em dark mode ficar sujo, ajustar alphas em globals.css.
- **Wave 4**: pode parecer pesado em telas de form. Decidir após Waves 1-2.
