# Jornada — Pagamentos da Obra

> Status: parcial | Prioridade: alta | Wave: 2
> Última atualização: 2026-05-05

## 1. Contexto & Objetivo
Gerir o fluxo de pagamento entre contratante e empreiteiro: medição aprovada (J06) gera lançamento "a pagar" → contratante quita → empreiteiro vê em pagamentos recebidos → admin agrega no caixa (J09).

## 2. Personas
- **Contratante**: vê faturas a pagar, paga.
- **Empreiteiro**: vê pagamentos a receber e histórico.
- **Admin**: monitora todos os fluxos.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  M[Medição aprovada J06] --> L[(financeiro: a_pagar)]
  L --> CT[/contratante/pagamentos]
  CT --> P[POST quitar]
  P --> L2[(financeiro: pago)]
  L2 --> EM[/empreiteiro/pagamentos]
  L2 --> AD[Caixa admin J09]
```

## 4. Telas envolvidas
- [app/contratante/pagamentos/](../../app/contratante/pagamentos/)
- [app/empreiteiro/pagamentos/](../../app/empreiteiro/pagamentos/)
- [app/admin/financeiro/](../../app/admin/financeiro/) e [app/admin/caixa/](../../app/admin/caixa/) (J09)

## 5. Componentes-chave
- [features/contratante/pagamentos/](../../features/contratante/pagamentos/)
- [features/empreiteiro/pagamentos/](../../features/empreiteiro/pagamentos/)
- [features/financeiro/](../../features/financeiro/) — service compartilhado

## 6. Schema (Drizzle)
Existente: `financeiro` (`tipo, descricao, valor, data, obraId, categoria`).

**A estender / avaliar**:
- Status do lançamento: `pendente | pago | atrasado | cancelado` (enum).
- `dataVencimento`, `dataPagamento`, `metodoPagamento`, `comprovanteUrl`.
- Relação a `medicaoId` (origem) e `pagadorUserId` / `recebedorUserId`.
- Avaliar separar em duas tabelas: `lancamentos` (a pagar/receber) e `transacoes` (efetivadas).

## 7. Endpoints
- `GET /api/contratante/pagamentos` (existente como rota, conferir implementação)
- `POST /api/contratante/pagamentos/[id]/quitar`
- `GET /api/empreiteiro/pagamentos`
- `GET /api/admin/financeiro` (existe)

## 8. Mocks a remover
- [features/contratante/pagamentos/mocks/pagamentos.mock.ts](../../features/contratante/pagamentos/mocks/pagamentos.mock.ts)
- [features/empreiteiro/pagamentos/mocks/pagamentos.mock.ts](../../features/empreiteiro/pagamentos/mocks/pagamentos.mock.ts)

## 9. Checklist de implementação
- [ ] Estender schema `financeiro` (status, datas, método, comprovante, relações)
- [ ] Hook em J06: ao aprovar medição, criar lançamento `pendente`
- [ ] Endpoint `quitar` (manual no MVP — anexa comprovante, marca pago, notifica)
- [ ] Substituir mocks contratante/empreiteiro
- [ ] Lista filtrável por status (pendente/pago/atrasado)
- [ ] Cálculo de "a pagar total" / "a receber total" no header
- [ ] Avaliar integração com gateway (Pix/cartão) — fora do MVP, mas projetar com ele em mente

## 10. Critérios de aceite
1. Aprovar medição (J06) → lançamento `pendente` aparece em `/contratante/pagamentos`.
2. Quitar → `financeiro.status='pago'`, comprovante salvo, empreiteiro vê em "recebidos".
3. Soma de "a pagar" do contratante = soma de "a receber" do empreiteiro vinculado nas obras correspondentes.
4. Lançamento aparece no caixa admin (J09 quando pronto).

## 11. Riscos / Pontos de atenção
- Sem gateway no MVP, "quitação" é declaração — abrir espaço para disputa (J10).
- Atrasos automáticos: cron que marca `atrasado` após `dataVencimento`.
- Reversão de pagamento (estorno) — modelar agora ou só em J10?

## 12. Links cruzados
- Depende de: J06.
- Alimenta: J09, J10.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- _Sem registros ainda._
