# Jornada — Financeiro Admin (Caixa, Entradas, Saídas)

> Status: mock | Prioridade: média | Wave: 3
> Última atualização: 2026-05-05

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
- [ ] Decidir modelo: escopo na mesma tabela vs. tabelas separadas
- [ ] Migration aplicando a decisão
- [ ] Pluga assinatura (J11) gerando entrada
- [ ] Pluga aceite/conclusão (J05/J06) gerando taxa de plataforma se houver
- [ ] Plug J12 (anúncios) gerando entrada
- [ ] Endpoint `caixa` agregando por período (`day_trunc`/`month_trunc`)
- [ ] Substituir mocks
- [ ] Filtros por período (mês, trimestre, custom range)
- [ ] Exportação CSV (já era item da fase 7.9 arquivada — recuperar)

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

- _Sem registros ainda._
