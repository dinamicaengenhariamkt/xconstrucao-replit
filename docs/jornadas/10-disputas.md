# Jornada — Disputas

> Status: mock | Prioridade: baixa | Wave: 3
> Última atualização: 2026-05-05

## 1. Contexto & Objetivo
Mecanismo de resolução quando contratante e empreiteiro discordam — tipicamente sobre uma medição (J06) ou pagamento (J08). Admin medeia e tem poder de aplicar efeito financeiro (estornar, liberar, partir o valor).

## 2. Personas
- **Contratante / Empreiteiro**: abre disputa, anexa evidências, comenta.
- **Admin**: analisa, decide, fecha com efeito.

## 3. Fluxo ponta-a-ponta
1. Parte abre disputa anexada a uma medição ou lançamento financeiro.
2. Status: `aberta` → `em_analise` (admin assume) → `resolvida` (com decisão registrada).
3. Resolução pode: aprovar medição parcialmente, liberar pagamento, estornar valor, escalar.

## 4. Telas envolvidas
- [app/admin/disputas/](../../app/admin/disputas/) — fila do admin
- Aba "disputas" dentro do detalhe de obra para contratante e empreiteiro (a criar)

## 5. Componentes-chave
- [features/admin/disputas/](../../features/admin/disputas/) (hooks, mocks)

## 6. Schema (Drizzle)
**A criar**:
- `disputas` (id, obraId, abertaPorUserId, contraparteUserId, alvoTipo [`medicao`|`pagamento`], alvoId, motivo, status [enum], resolvedAt, resolvedByUserId, decisao text)
- `disputa_mensagens` (id, disputaId, autorUserId, texto, anexoUrl, criadaEm)
- Enum `disputa_status` (`aberta`, `em_analise`, `resolvida_a_favor_contratante`, `resolvida_a_favor_empreiteiro`, `resolvida_meio_termo`, `cancelada`).

## 7. Endpoints
- `POST /api/disputas` — abrir
- `GET /api/disputas/[id]`
- `POST /api/disputas/[id]/mensagens`
- `POST /api/admin/disputas/[id]/resolver` — admin-only

## 8. Mocks a remover
- [features/admin/disputas/mocks/](../../features/admin/disputas/mocks/)

## 9. Checklist de implementação
- [ ] Schema + migration
- [ ] Endpoints CRUD + ação de resolução
- [ ] Tela admin com fila e filtros (status, idade)
- [ ] Aba dentro do detalhe da obra para as partes
- [ ] Disparo de notificação (J13) em abertura/resolução
- [ ] Efeito financeiro da resolução: gerar contra-lançamento em `financeiro` (J08)
- [ ] Bloquear novo pagamento em alvo com disputa aberta

## 10. Critérios de aceite
1. Empreiteiro contesta medição (J06) → cria disputa automaticamente.
2. Admin abre `/admin/disputas` → vê na fila → assume → resolve a favor do empreiteiro.
3. Lançamento financeiro correspondente reverte/libera conforme decisão.
4. Ambas partes recebem notificação da decisão.

## 11. Riscos / Pontos de atenção
- Decisões irreversíveis: prever auditoria detalhada.
- SLA: tempo máximo para admin assumir? Cron para escalar.
- Conflito com J08: pagamento em curso quando disputa abre — congelar.

## 12. Links cruzados
- Depende de: J06, J08.
- Relacionada: J13.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- _Sem registros ainda._
