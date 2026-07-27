# Jornada — Financeiro Admin (Caixa, Entradas, Saídas)

> Status: pronto | Prioridade: média | Wave: 3
> Última atualização: 2026-06-01
>
> Caixa/entradas/saídas + dashboard (KPIs, tabelas de obras-atenção, top
> clientes/empreiteiras, receitas, adoção) estão REAIS. O que sobrou — detalhe
> financeiro da obra (`/admin/financeiro/obras/[id]`), NPS/CSAT e gráficos de
> série temporal — foi movido para a [Jornada 18](18-financeiro-admin-completo.md)
> (depende de fonte externa / drill-down dedicado).

## 1. Contexto & Objetivo
Visão consolidada do dinheiro **da plataforma** para o admin: entradas (assinaturas J11, taxa por obra, anúncios J12), saídas (custos operacionais), saldo, indicadores. Diferente de J08 (que é financeiro **da obra**).

## 2. Personas
- **Admin**: única persona ativa nesta jornada.

## 3. Fluxo ponta-a-ponta
1. Eventos das outras jornadas geram lançamentos (assinatura cobrada, taxa de transação retida, campanha de anúncio paga, etc.).
2. Admin abre `/admin/caixa`, `/admin/entradas`, `/admin/saidas`, `/admin/financeiro`.
3. Vê KPIs por período (mês, trimestre), gráficos, drilldown por categoria.

## 4. Telas envolvidas
- [app/admin/financeiro/](../../app/admin/financeiro/) — dashboard
- [app/admin/caixa/](../../app/admin/caixa/) — fluxo
- [app/admin/entradas/](../../app/admin/entradas/) — receitas
- [app/admin/saidas/](../../app/admin/saidas/) — despesas

## 5. Componentes-chave
- [features/admin/caixa/](../../features/admin/caixa/) (hooks, mocks)
- [features/admin/entradas/](../../features/admin/entradas/)
- [features/admin/saidas/](../../features/admin/saidas/)
- [features/admin/financeiro/](../../features/admin/financeiro/)
- [features/financeiro/](../../features/financeiro/) — service compartilhado

## 6. Schema (Drizzle)
Existente: `financeiro` (genérica).

**A avaliar**:
- Distinguir lançamentos da **plataforma** dos lançamentos **da obra**: nova coluna `escopo` (`obra | plataforma`) ou tabela separada `plataforma_lancamentos`.
- Categorias normalizadas (enum ou tabela `categorias`).

## 7. Endpoints
- `GET /api/admin/caixa` — existente, conferir implementação real
- `GET /api/admin/entradas`
- `GET /api/admin/saidas`
- `GET /api/admin/financeiro`
- `POST /api/admin/saidas` — registrar despesa manual

## 8. Mocks a remover
- [features/admin/caixa/mocks/](../../features/admin/caixa/mocks/) — `mockCaixaResumo`, `mockMovimentacoes`, `mockIndicadoresEconomicos`
- [features/admin/entradas/mocks/](../../features/admin/entradas/mocks/)
- [features/admin/saidas/mocks/](../../features/admin/saidas/mocks/)
- [features/admin/financeiro/mocks/](../../features/admin/financeiro/mocks/)
- Flag `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK` nestes hooks.

## 9. Checklist de implementação
- [x] Decidir modelo: **escopo na mesma tabela** `financeiro` (coluna `escopo: obra|plataforma`) — bootstrap `server/bootstrap-financeiro-escopo.ts`
- [x] Migration aplicando a decisão (idempotente, default `obra` = backfill seguro)
- [x] Endpoints de caixa/entradas/saídas agregando por período (SUM ... FILTER no banco) — `features/admin/financeiro/api/caixa-service.ts`
- [x] `POST /api/admin/saidas` — despesa manual (escopo=plataforma)
- [x] Substituir mocks de caixa/entradas/saídas (deletados; hooks → API real)
- [x] Filtros por período (7/30/90 dias, ano, custom range)
- [x] KPIs reais do dashboard financeiro (`/api/admin/financeiro/dashboard-stats`)
- [x] Plug assinatura (J11) gerando entrada _(entregue: ativar assinatura lança entrada de escopo plataforma, categoria `assinatura`, idempotente — ver checklist da J11)_
- [x] Plug J12 (anúncios) gerando entrada _(entregue pela **J31**: `asaas-ad-billing.ts` + confirmação por webhook do pedido de anúncio)_
- [ ] Exportação CSV — **fase 2**: casa com o gate `isRelatoriosHabilitado` da **J30**, que hoje existe sem nenhum endpoint de export consumindo. Fazer as duas pontas juntas.

## 10. Critérios de aceite
1. Assinar plano em J11 → aparece como entrada em `/admin/entradas`.
2. Registrar saída manual → aparece em `/admin/saidas` e baixa o saldo.
3. Saldo do caixa = entradas − saídas no período.
4. Gráfico de fluxo bate com os totais.

## 11. Riscos / Pontos de atenção
- Não confundir financeiro da plataforma com financeiro da obra — UI deve ser cristalina.
- Indicadores econômicos do mock podem virar feature de "comparar com Selic/IPCA" ou simplesmente sumir.
- Conciliação contábil: fora do escopo do MVP.

## 12. Links cruzados
- Depende de: J08, J11.
- Relacionada: J12.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- **2026-06-01** — Modelo escolhido: coluna `escopo` na tabela `financeiro` (não tabela separada). Caixa CONSOLIDADO = obra + plataforma. Service real em `features/admin/financeiro/api/caixa-service.ts`, agregação 100% no banco.
- **2026-06-01** — Páginas `/admin/caixa`, `/admin/entradas`, `/admin/saidas` estão REAIS (mocks deletados). ~17 endpoints sob `app/api/admin/{caixa,entradas,saidas}` com guard `isAdminLike`.
- **2026-06-01** — **Pendência de fonte externa** (status `revisão`, não `pronto`): indicadores macroeconômicos (Selic/IPCA/INCC/dólar/BTC/risco-Brasil), NPS/CSAT e métricas de adoção NÃO têm fonte de dados no projeto. Decisão: caixa real agora, esses três ficam como placeholder honesto ("—" / "dados pendentes"), sem inventar número. `GET /api/admin/caixa/indicadores` retorna `[]`; `features/admin/caixa/macro-impacto-placeholder.ts` mostra "—". Candidatos a jornada futura (integração Banco Central/IBGE + sistema de surveys).
- **2026-06-01** — `FluxoResumo` passou a derivar de `useCaixaKpis` (real). `ImpactoFinanceiroPanel` recebe `saldoDisponivel` real mas os indicadores macro são placeholder.
- **2026-06-01** — Dashboard composto `/admin/financeiro/page.tsx`: KPIs do topo (`StatsGridContainer`) são reais via `/api/admin/financeiro/dashboard-stats`. Tabelas secundárias (obras-atenção, top clientes/empreiteiras com vol/pago/saldo, distribuição de status, evolução de pagamentos) seguem em mock — candidatas a fase de polimento.
- **2026-06-01 (2ª rodada)** — Dashboard agora REAL: `obras-atenção`, `top-clientes`/`top-empreiteiras` (vol/pago/saldo), `receitas-plataforma` (assinatura/anúncio/obra) e `adoção` (usuários ativos/novos, conversão de candidatura) — endpoints sob `app/api/admin/financeiro/*` derivados do banco. Mocks `obras.mock.ts` e `adoption-metrics.mock.ts` deletados. J09 → `pronto`.
- **2026-06-01 (2ª rodada)** — Movido para J18: detalhe financeiro da obra (`/admin/financeiro/obras/[id]` — drill-down rico com medições/histórico, ainda mock), NPS/CSAT (sem fonte) e gráficos de série temporal (evolução/distribuição). `churnEmpreiteirosPercent` retorna 0 por não haver rastreio de last-login (limitação documentada).
