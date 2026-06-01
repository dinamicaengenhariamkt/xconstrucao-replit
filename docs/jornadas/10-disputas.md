# Jornada — Disputas

> Status: pronto | Prioridade: baixa | Wave: 3
> Última atualização: 2026-06-01

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
- [x] Schema + migration (bootstrap idempotente `server/bootstrap-disputas.ts`)
- [x] Endpoints CRUD + ação de resolução (`app/api/disputas`, `app/api/admin/disputas`)
- [x] Disparo de notificação (J13) em abertura/resolução (`features/notificacoes/disputa-dispatcher.ts`)
- [x] Efeito financeiro da resolução: contra-lançamento em `financeiro` escopo plataforma (idempotente por origem)
- [x] Bloquear novo pagamento em alvo com disputa aberta (J08 `quitar` → 409 `EM_DISPUTA`)
- [x] Abertura automática de disputa ao contestar medição (J06)
- [x] Tela admin: service real (mock removido) — fila/filtros já existentes em `features/admin/disputas`
- [ ] Aba dedicada dentro do detalhe da obra para as partes (UI — endpoints `/api/disputas` prontos)

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

- **2026-06-01** — Modelo rico no DB (status `aberta/em_analise/aguardando_partes/resolvida/cancelada` + `resolucao_tipo` separado `favor_contratante/favor_empreiteiro/meio_termo`) mapeado para o contrato de UI já existente em `features/admin/disputas/types` no endpoint GET admin — evitou reescrever a tela. `cancelada` é exibida como `resolvida` na UI legada.
- **2026-06-01** — Idempotência da abertura garantida por índice único PARCIAL `uq_disputas_alvo_aberta` (só quando status NOT IN resolvida/cancelada) — permite reabrir disputa sobre o mesmo alvo após encerramento.
- **2026-06-01** — Efeito financeiro usa `criarLancamentoPlataforma` (escopo=plataforma, categoria=`disputa_estorno`, idempotente por `origem_tipo='disputa'`). `favor_empreiteiro` sobre pagamento cancelado reverte o lançamento para `pendente`.
- **2026-06-01** — Endpoints das partes (`/api/disputas`, `/api/disputas/[id]`, `/api/disputas/[id]/mensagens`) prontos com ownership + notas internas só p/ admin. Falta apenas a **UI da aba de disputas** no detalhe da obra (contratante/empreiteiro) — backend 100% funcional.
- **2026-06-01** — SLA/cron de escalonamento automático (risco §11) não implementado nesta fase — candidato a item futuro.
