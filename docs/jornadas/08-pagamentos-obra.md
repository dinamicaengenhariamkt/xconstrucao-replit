# Jornada — Pagamentos da Obra

> Status: revisão | Prioridade: alta | Wave: 2
> Última atualização: 2026-05-25

## 1. Contexto & Objetivo
Gerir o fluxo de pagamento entre contratante e empreiteiro: medição aprovada (J06) gera lançamento "a pagar" → contratante quita (anexando comprovante) → empreiteiro vê em pagamentos recebidos → admin agrega no caixa (J09).

## 2. Personas
- **Contratante**: vê faturas a pagar, paga.
- **Empreiteiro**: vê pagamentos a receber e histórico.
- **Admin**: monitora todos os fluxos.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  M[Medição aprovada J06] --> L[(financeiro: pendente)]
  L --> CT[/contratante/pagamentos]
  CT --> P[POST quitar + comprovante R2]
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
- [features/financeiro/lancamentos-service.ts](../../features/financeiro/lancamentos-service.ts) — service compartilhado (lista/quita/criação a partir de medição)

## 6. Schema (Drizzle)
Tabela `financeiro` estendida em Task #48 (bootstrap idempotente em `server/bootstrap-pagamentos.ts`):
- Enum `financeiro_status`: `pendente | pago | atrasado | cancelado`.
- Novas colunas: `status`, `data_vencimento`, `data_pagamento`, `metodo_pagamento`, `comprovante_url`, `comprovante_file_id` (FK `user_files`), `medicao_id`, `pagador_user_id` (FK `users`), `recebedor_user_id` (FK `users`), `created_at`.
- Backfill: lançamentos legados ficam como `pago` com `data_pagamento = data`.
- Índices: `status`, `pagador_user_id`, `recebedor_user_id`, `obra_id`, `medicao_id`.

## 7. Endpoints
- `GET /api/contratante/pagamentos` — lista (mapeia status `pendente`+vencido → `atrasado` em leitura).
- `GET /api/contratante/pagamentos/kpi` — KPIs (entradas, saídas, pendentes, total contratado).
- `POST /api/contratante/pagamentos/[id]/quitar` — body `{ metodoPagamento, dataPagamento?, comprovanteFileId? }`. Valida ownership + kind `comprovante_pagamento`. Audit `pagamentos.quitar`.
- `GET /api/empreiteiro/pagamentos` — adapta `financeiro` para shape histórica `MedicaoEmpreiteiro` (numera por obra, traduz status).
- `GET /api/empreiteiro/pagamentos/kpi` — KPIs (contratado, recebido, a liberar, rejeitado, prazo médio, taxa de rejeição).
- `GET /api/admin/financeiro` (existe).

## 8. Mocks removidos
- ~~`features/contratante/pagamentos/mocks/pagamentos.mock.ts`~~ (deletado em Task #48)
- ~~`features/empreiteiro/pagamentos/mocks/pagamentos.mock.ts`~~ (deletado em Task #48)
- Serviços `pagamentos-service.ts` (contratante e empreiteiro) consomem só os endpoints reais.

## 9. Checklist de implementação
- [x] Estender schema `financeiro` (status, datas, método, comprovante, relações) _(Task #48)_
- [ ] Hook em J06: ao aprovar medição, criar lançamento `pendente` — **bloqueado**: J06 ainda não existe. Helper `criarLancamentoFromMedicao()` em `features/financeiro/lancamentos-service.ts` pronto para ser chamado pelo endpoint de aprovação quando J06 for implementada _(Task #48)_
- [x] Endpoint `quitar` (manual no MVP — anexa comprovante, marca pago) _(Task #48)_
- [x] Substituir mocks contratante/empreiteiro _(Task #48)_
- [x] Lista filtrável por status (pendente/pago/atrasado) _(Task #48 — filtros existentes na UI seguem funcionando sobre os dados reais)_
- [x] Cálculo de "a pagar total" / "a receber total" no header _(Task #48)_
- [ ] Avaliar integração com gateway (Pix/cartão) — fora do MVP, mas projetar com ele em mente
- [ ] Cron que marca lançamentos vencidos como `atrasado` no banco (hoje a marcação é só em tempo de leitura)
- [ ] Notificações ao empreiteiro quando lançamento é quitado

## 10. Critérios de aceite
1. Aprovar medição (J06) → lançamento `pendente` aparece em `/contratante/pagamentos`. **Bloqueado por J06** — verificável manualmente via INSERT em `financeiro` com `pagador_user_id` do contratante.
2. Quitar → `financeiro.status='pago'`, comprovante salvo em R2 (privado, signed URL), empreiteiro vê em "recebidos" — ✅.
3. Soma de "a pagar" do contratante coincide com soma "a receber" (a liberar) do empreiteiro vinculado às mesmas obras — ✅ (mesma fonte `financeiro` filtrada por `pagador_user_id` vs `recebedor_user_id`).
4. Lançamento aparece no caixa admin (J09 quando pronto).

## 11. Riscos / Pontos de atenção
- Sem gateway no MVP, "quitação" é declaração — abrir espaço para disputa (J10).
- Atrasos automáticos: cron pendente; hoje a marcação `atrasado` é só em leitura (compara `data_vencimento` com hoje).
- Reversão de pagamento (estorno) — modelar agora ou só em J10?

## 12. Links cruzados
- Depende de: J06 (medições).
- Alimenta: J09 (caixa), J10 (disputas).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-25 (Task #48): J06 (medições) ainda não existe — helper `criarLancamentoFromMedicao()` foi criado e exportado, mas não há callsite. Critério #1 só é verificável manualmente até J06 entrar em campo.
- 2026-05-25 (Task #48): cron de marcação automática de `atrasado` no banco ficou para depois — hoje só marca em tempo de leitura no GET contratante.
- 2026-05-25 (Task #48): não há endpoint POST público para criar lançamento avulso do lado contratante; pendentes nascerão sempre via J06. Se surgir necessidade de adiantamentos/avulsos, abrir nova task.
- 2026-05-25 (Task #48): novo `UploadKind` `comprovante_pagamento` (private, 8MB, image+pdf, role contratante/superadmin) — path `private/contratante/{userId}/comprovantes/{ts}-{slug}.{ext}`. Side-effect aplicado no endpoint `quitar` (não em `commit`).
- 2026-05-25 (Task #77): `computeProfitFromObra` deixou de estimar custo como 65% da receita — agora recebe `{ receitaTotal, custoTotal }` reais. `build-detalhe-server.ts` agrega de `financeiro` (status=`pago`): receita = lançamentos com `recebedorUserId = empreiteiro` (+ fallback legados tipo=`saida` sem recebedor/pagador), custo = lançamentos com `pagadorUserId = empreiteiro`. `ObraFinanceiro` ganhou `receitaTotal`/`custoTotal`. **Carry**: não há ainda UI para o empreiteiro registrar saídas próprias (materiais/mão de obra/equipamentos) — enquanto não existir, o custo realizado fica 0 e a margem aparece como 100%. Abrir jornada/task dedicada de "Custos do empreiteiro" quando entrar no roadmap.
