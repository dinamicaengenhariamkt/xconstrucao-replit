# PRD — Rollout global do efeito luminous (3 visões)

> **Status**: Wave 0 concluída. Wave 1 pronta pra iniciar.
> **Última atualização**: 2026-05-04.

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

### Pré-Wave 1 — Componente shared

- [ ] Criar `<SectionCard>` em `features/shared/components/SectionCard/`.

---

### Wave 1 — Contratante (10-14 alvos)

#### `/contratante/dashboard`
- [ ] StatsGrid (5 KPIs) — passar `luminous`
- [ ] EvolutionChart — adicionar prop + passar
- [ ] PhaseDistributionChart — adicionar prop + passar
- [ ] RecentActivitiesCard — adicionar prop + passar
- [ ] PendenciasCard — adicionar prop + passar
- [ ] ValoresContratados — adicionar prop + passar

#### `/contratante/pagamentos`
- [ ] StatsCard (4 KPIs) — passar `luminous`
- [ ] PagamentosEvolutionChart — adicionar prop + passar
- [ ] Histórico (Card) — aplicar inline

#### `/contratante/medicoes`
- [ ] StatsCard (5 KPIs) — passar `luminous`
- [ ] Tabela de medições (div) — aplicar inline

#### `/contratante/atividades`
- [ ] Activities Card — aplicar inline

#### `/contratante/notificacoes`
- [ ] `NotificationsListView` — passar `luminous` (prop já existe)

#### `/contratante/nova-obra` (lower priority)
- [ ] Form section cards — aplicar inline

**Skip Wave 1**: `/contratante/minhas-obras` (ObraCard ornado), `/contratante/planos` (pricing), `/contratante/chat`, `/contratante/faq`, `/contratante/configuracoes` (Wave 4).

---

### Wave 2 — Admin (15-22 alvos)

#### `/admin/financeiro`
- [ ] StatsCard (3 KPIs) — passar `luminous`
- [ ] AdoptionMetricsSection — adicionar prop + passar
- [ ] SatisfactionMetricsSection — adicionar prop + passar
- [ ] HealthSummary — passar `luminous` (prop existe)
- [ ] ProfitSummary — passar `luminous` (prop existe)
- [ ] PaymentsEvolutionChart — adicionar prop + passar
- [ ] StatusDistributionChart — adicionar prop + passar
- [ ] ObrasAtencaoTable — adicionar prop + passar
- [ ] TopRankingTable (clientes + empreiteiras) — adicionar prop + passar

#### `/admin/caixa`
- [ ] KpiGridContainer — passar `luminous`
- [ ] IndicadoresEconomicosSection — adicionar prop + passar
- [ ] CaixaChart — adicionar prop + passar
- [ ] FluxoResumo — adicionar prop + passar
- [ ] MovimentacoesTable — adicionar prop + passar

#### `/admin/clientes`
- [ ] 3 KPIs (Card manual) — refatorar pra `StatsCard` ou aplicar `luminous-card` inline

#### `/admin/obras`
- [ ] 2 KPIs (Card manual) — mesmo
- [ ] Tabela de obras (div) — aplicar inline

#### `/admin/empreiteiras`
- [ ] 2 KPIs (Card manual) — mesmo

#### `/admin/anuncios`
- [ ] StatsCard (6 KPIs) — passar `luminous`
- [ ] Tabela Campanhas (Card) — aplicar inline
- [ ] Tabela Anunciantes (Card) — aplicar inline

#### `/admin/auditoria`
- [ ] 6 KPIs (Card manual) — refatorar ou aplicar inline

#### `/admin/planos`
- [ ] 4 KPIs (Card manual) — mesmo
- [ ] Tabela de assinantes (div) — aplicar inline

#### `/admin/disputas`
- [ ] StatsCard — passar `luminous`

**Skip Wave 2**: ClienteCard, EmpreiteiraCard, ZonaCard, PlanoCard (ornados); audit timeline; `/admin/configuracoes` (Wave 4).

---

### Wave 3 — Shared components (obra detail) (4 alvos)

Componentes shared usados em telas de detalhe de obra:

- [ ] `HealthCard` ([features/shared/health/components/HealthCard.tsx](../features/shared/health/components/HealthCard.tsx)) — adicionar prop `luminous`
- [ ] `ProfitCard` ([features/shared/profit/components/ProfitCard.tsx](../features/shared/profit/components/ProfitCard.tsx)) — adicionar prop + propagar pros StatsCards aninhados
- [ ] `LocalizacaoCard` ([features/shared/components/LocalizacaoCard.tsx](../features/shared/components/LocalizacaoCard.tsx)) — adicionar prop
- [ ] `HealthDetailPanel` ([features/shared/health/components/HealthDetailPanel.tsx](../features/shared/health/components/HealthDetailPanel.tsx)) — adicionar prop (5 Cards internos — flag global)

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
