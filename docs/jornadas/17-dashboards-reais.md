# Jornada — Dashboards Reais (Contratante + Saúde/Lucro derivados)

> Status: pendente | Prioridade: alta | Wave: 3
> Última atualização: 2026-06-01
>
> Mata o maior bolsão de mock restante: o dashboard do contratante (hoje 100%
> mock) e os scores de saúde/lucro de obra (mock nas 3 visões). O cálculo real
> de saúde/lucro já existe parcialmente em `compute-from-obra.ts`.

## 1. Contexto & Objetivo
Vários painéis de leitura ainda servem dados fictícios:
- **Dashboard do contratante** (`/contratante/dashboard`): KPIs, gráficos de
  evolução, distribuição por fase e pendências — todos mock.
- **Saúde da obra** (`getMockHealth`): score 0–100 + status (saudável/atenção/
  risco) mockado em contratante, empreiteiro e admin.
- **Lucro consolidado** (`getMockProfit`): receita/custo/margem mock no dashboard
  de empreiteiro e admin.
Esta jornada torna tudo isso real, derivando do que já está no banco (obras,
medições, financeiro, candidaturas).

## 2. Personas
- **Contratante**: dashboard inicial real.
- **Empreiteiro**: saúde/lucro reais no dashboard.
- **Admin**: saúde/lucro reais nos painéis (cruza com J18).

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  D[/contratante/dashboard] --> API[GET /api/contratante/dashboard]
  API --> AGG[(agrega obras+medições+financeiro)]
  OBRA[card de obra] --> H[saúde computada de compute-from-obra]
```

## 4. Telas envolvidas
- [app/contratante/dashboard/](../../app/contratante/dashboard/) — hoje 100% mock.
- [app/empreiteiro/dashboard/](../../app/empreiteiro/dashboard/) — saúde/lucro mock.
- [app/contratante/minhas-obras/](../../app/contratante/minhas-obras/) e [app/empreiteiro/minhas-obras/](../../app/empreiteiro/minhas-obras/) — filtro/card de saúde mock.

## 5. Componentes-chave
- [features/shared/health/compute-from-obra.ts](../../features/shared/health/compute-from-obra.ts) — cálculo real de saúde (já existe, plugar).
- [features/shared/profit/compute-from-obra.ts](../../features/shared/profit/compute-from-obra.ts) — cálculo real de lucro (já existe).
- [features/shared/health/mocks.ts](../../features/shared/health/mocks.ts) e [features/shared/profit/mocks.ts](../../features/shared/profit/mocks.ts) — a remover/substituir.
- [features/contratante/dashboard/mocks/](../../features/contratante/dashboard/mocks/) — a remover.

## 6. Schema (Drizzle)
Nada novo provavelmente. Saúde/lucro derivam de `obras`, `medicoes`, `financeiro`.
Avaliar se vale materializar `obras.saude_score`/`obras.margem` para performance
(senão calcular on-the-fly com cache curto).

## 7. Endpoints
- `GET /api/contratante/dashboard` — KPIs + evolução + pendências (a criar).
- Saúde/lucro: expor no DTO de obra já existente (`/api/obras/[id]`, `/api/contratante/minhas-obras`) em vez de chamar mock no client.

## 8. Mocks a remover
- [features/contratante/dashboard/mocks/](../../features/contratante/dashboard/mocks/)
- `getMockHealth` / `getMockHealthSummary` ([features/shared/health/mocks.ts](../../features/shared/health/mocks.ts))
- `getMockProfit` / `getMockProfitSummary` ([features/shared/profit/mocks.ts](../../features/shared/profit/mocks.ts))

## 9. Checklist de implementação
- [ ] `GET /api/contratante/dashboard` agregando KPIs reais (obras ativas, valor contratado, pago, pendências de medição/pagamento)
- [ ] Série de evolução real (por mês) e distribuição por fase a partir das obras/medições
- [ ] Plugar `compute-from-obra` (saúde) no DTO de obra — remover `getMockHealth` do client
- [ ] Plugar cálculo real de lucro (empreiteiro/admin) — remover `getMockProfit`
- [ ] `HealthSummary`/`ProfitSummary` consumirem os valores reais
- [ ] Remover mocks e a flag dos dashboards

## 10. Critérios de aceite
1. Contratante com 2 obras vê KPIs batendo com o banco (não números fixos).
2. Obra sem medição há X dias aparece como "atenção"/"risco" pela regra real.
3. Lucro do empreiteiro reflete pagamentos reais, não 100% fixo.
4. Nenhum `getMock*` é chamado em runtime.

## 11. Riscos / Pontos de atenção
- Definir a REGRA de saúde (o que torna uma obra "risco"?) — hoje o mock inventa; o real precisa de critério acordado (atraso de medição, pagamento atrasado, etc.).
- Performance: agregação por contratante pode ser pesada — usar índices/cache.
- Empreiteiro "custos próprios" não existem (margem hoje é 100%) — lucro real depende disso (ver gap de J08).

## 12. Links cruzados
- Depende de: J03, J06, J08 (fontes de dados).
- Cruza com: J18 (dashboard admin usa os mesmos cálculos de saúde/lucro).

## 13. Gaps descobertos durante execução
- _Sem registros ainda._
