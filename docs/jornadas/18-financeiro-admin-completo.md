# Jornada — Dashboard Financeiro Admin Completo

> Status: pronto | Prioridade: média | Wave: 3
> Última atualização: 2026-06-01
>
> A maior parte JÁ FOI FEITA no fechamento da J09 (2026-06-01): tabelas de
> obras-atenção, top clientes/empreiteiras (vol/pago/saldo), receitas-plataforma
> e adoção agora são REAIS, com endpoints sob `app/api/admin/financeiro/*`.
> RESTAM nesta jornada: (1) detalhe financeiro da obra `/admin/financeiro/obras/[id]`
> — drill-down rico com medições/histórico, ainda mock; (2) NPS/CSAT (sem fonte —
> exige sistema de surveys); (3) gráficos de série temporal (evolução de
> pagamentos, distribuição de status); (4) churn por last-login (sem rastreio hoje).

## 1. Contexto & Objetivo
No `/admin/financeiro` ainda são mock:
- Tabelas: obras em atenção financeira, top clientes, top empreiteiras, receitas da plataforma.
- Detalhe financeiro da obra (`/admin/financeiro/obras/[id]`) — 100% mock.
- Métricas de adoção (deriváveis do banco) e satisfação NPS/CSAT (sem fonte).
Esta jornada torna real tudo que o banco suporta e deixa claro o que é pendência
de fonte externa.

## 2. Personas
- **Admin**: visão financeira consolidada e confiável.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  D[/admin/financeiro] --> S[GET dashboard-stats ✅ já real]
  D --> T[GET tabelas: obras-atencao / top-clientes / top-empreiteiras]
  D --> AD[GET adoption ← derivado do banco]
  D --> NPS[satisfação ← fonte externa PENDENTE]
```

## 4. Telas envolvidas
- [app/admin/financeiro/](../../app/admin/financeiro/) — dashboard.
- [app/admin/financeiro/obras/](../../app/admin/financeiro/obras/) — detalhe financeiro da obra.

## 5. Componentes-chave
- [features/admin/financeiro/components/](../../features/admin/financeiro/components/) — `ObrasAtencaoTable`, `TopClientesTable`, `TopEmpreiteirasTable`, `ReceitasPlataformaTable`, `AdoptionMetricsSection`, `SatisfactionMetricsSection`.
- [features/admin/financeiro/api/caixa-service.ts](../../features/admin/financeiro/api/caixa-service.ts) — estender com as novas agregações.

## 6. Schema (Drizzle)
Provavelmente nada novo (deriva de `obras`, `financeiro`, `users`, `candidaturas`).
NPS/CSAT exigiria tabela `surveys`/`respostas` se for implementado (fora do MVP).

## 7. Endpoints (a criar)
- `GET /api/admin/financeiro/obras-atencao` — obras com lançamento atrasado/risco.
- `GET /api/admin/financeiro/top-clientes` e `/top-empreiteiras` — versão rica (vol contratado, pago, saldo).
- `GET /api/admin/financeiro/receitas-plataforma` — receitas por categoria (assinatura/anúncio).
- `GET /api/admin/financeiro/adoption` — usuários ativos, novos cadastros, conversão de candidatura, churn (derivado do banco).
- `GET /api/admin/financeiro/obras/[id]` — detalhe financeiro real da obra.

## 8. Mocks a remover
- [features/admin/financeiro/mocks/obras.mock.ts](../../features/admin/financeiro/mocks/obras.mock.ts)
- [features/admin/financeiro/mocks/adoption-metrics.mock.ts](../../features/admin/financeiro/mocks/adoption-metrics.mock.ts)
- [features/admin/financeiro/mocks/financial-data.mock.ts](../../features/admin/financeiro/mocks/financial-data.mock.ts)
- [features/admin/financeiro/mocks/obra-detalhe.mock.ts](../../features/admin/financeiro/mocks/obra-detalhe.mock.ts)
- **Manter como pendência externa documentada**: `satisfaction-metrics.mock.ts` (NPS/CSAT — sem fonte) e indicadores econômicos.

## 9. Checklist de implementação
- [x] Endpoint + tabela "obras em atenção" (lançamento atrasado / saldo a pagar alto)
- [x] Top clientes/empreiteiras ricos (vol contratado, pago, saldo) — não só soma de entradas
- [x] Receitas da plataforma por categoria (assinatura J11 + anúncio J12)
- [x] Adoção derivada do banco (ativos 30d, novos 30d, conversão candidatura→contrato; churn fica 0 — sem last-login)
- [x] Detalhe financeiro da obra real (`/admin/financeiro/obras/[id]`)
- [x] Séries temporais reais: evolução de pagamentos + distribuição de status (substituem os mocks de gráfico)
- [x] Saúde/lucro do portfólio reais (`portfolio-summary`) — substituem `getMockHealth/ProfitSummary`
- [x] Remover os mocks correspondentes (gráficos, satisfação, detalhe — não mais importados na UI)
- [x] NPS/CSAT: **ocultado** na UI (não inventar) — pendência movida para [J20](20-satisfacao-nps-csat.md)
- [x] Subir J09 para `pronto`

## 10. Critérios de aceite
1. Tabelas do `/admin/financeiro` batem com o banco (não números fixos).
2. Adoção mostra contagem real de usuários ativos/novos.
3. Detalhe financeiro da obra real abre sem mock.
4. NPS/CSAT exibe estado "dados pendentes" honesto.

## 11. Riscos / Pontos de atenção
- "Churn por last-login" exige rastrear último login — verificar se existe coluna; senão, derivar de outra atividade ou adiar.
- NPS/CSAT é projeto à parte (sistema de surveys) — não bloquear a maturidade por isso.
- Indicadores econômicos (Selic/IPCA/INCC): integração Banco Central (SGS) / IBGE é viável e gratuita, mas é nice-to-have.

## 12. Links cruzados
- Depende de: J09 (base), J11 e J12 (receitas), J17 (saúde/lucro).
- Fecha: J09.

## 13. Gaps descobertos durante execução
- 2026-06-01: **Implementada.** Novos endpoints: `GET /api/admin/financeiro/portfolio-summary` (saúde+lucro de todo o portfólio), `/payment-evolution`, `/status-distribution` e `/obras/[id]` (drill-down). Agregações em [features/admin/financeiro/api/caixa-service.ts](../../features/admin/financeiro/api/caixa-service.ts) (`getPaymentEvolution`, `getStatusDistribution`), [portfolio-summary-server.ts](../../features/admin/financeiro/api/portfolio-summary-server.ts) e [obra-detalhe-server.ts](../../features/admin/financeiro/api/obra-detalhe-server.ts).
- 2026-06-01: O drill-down (`obra-detalhe-server`) mapeia `medicoes` reais (status `aprovada`→`aprovada_contratante`, `contestada`→`rejeitada_contratante`) e o histórico vem de lançamentos `financeiro` da obra. **`aditivos` = 0** (não há tabela de aditivos no schema — mesmo gap de J17 §13).
- 2026-06-01: **Pendências externas mantidas (não inventar):** NPS/CSAT (ver [J20](20-satisfacao-nps-csat.md), bloqueada); `churnEmpreiteirosPercent` segue 0 (sem rastreio de last-login); indicadores econômicos (Selic/IPCA/INCC) seguem nice-to-have.
- 2026-06-01: `satisfaction-metrics.mock.ts` **preservado** como referência de shape para a J20 (não deletado), mas não é mais importado pela UI.
