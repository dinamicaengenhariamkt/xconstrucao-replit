# Jornada — Planos & Assinatura

> Status: pronto | Prioridade: média | Wave: 3
> Última atualização: 2026-06-01
>
> Observação: ecossistema completo e funcional via **adapter de gateway "manual"**
> (ativa sem cobrança real). A integração com gateway real (Stripe/PayPal/
> MercadoPago/Asaas) está documentada e **bloqueada** na Jornada 14, aguardando
> decisão do gateway — basta plugar o adapter, nada mais muda.

## 1. Contexto & Objetivo
Monetização da plataforma via assinatura. Admin define planos com preço e limites (nº de obras ativas, candidaturas/mês, recursos premium); contratante e empreiteiro escolhem e pagam; status de assinatura gateia features nas demais jornadas.

## 2. Personas
- **Admin**: CRUD de planos.
- **Contratante / Empreiteiro**: escolhe, paga, gerencia, cancela.

## 3. Fluxo ponta-a-ponta
1. Admin cria/edita planos em `/admin/planos`.
2. Persona em `/contratante/planos` ou `/empreiteiro/planos` vê opções → seleciona → checkout.
3. Status `assinaturas` muda para `ativa` → libera limites no produto.
4. Renovação automática mensal/anual; falha de cobrança → status `inadimplente` → restringe.

## 4. Telas envolvidas
- [app/admin/planos/](../../app/admin/planos/)
- [app/contratante/planos/](../../app/contratante/planos/)
- [app/empreiteiro/planos/](../../app/empreiteiro/planos/)

## 5. Componentes-chave
- [features/admin/planos/](../../features/admin/planos/) (mocks)
- Componentes de plano em [features/contratante/](../../features/contratante/) e [features/empreiteiro/](../../features/empreiteiro/)

## 6. Schema (Drizzle)
**A criar**:
- `planos` (id, nome, descricao, valorMensal, valorAnual, persona [contratante|empreiteiro|ambos], limitesJson jsonb, ativo bool)
- `assinaturas` (id, userId, planoId, status [ativa|cancelada|inadimplente|expirada], iniciadaEm, renovaEm, canceladaEm, gatewayCustomerId, gatewaySubscriptionId)
- `assinatura_eventos` (id, assinaturaId, tipo, payloadJson, criadoEm) — webhook do gateway

## 7. Endpoints
- `GET/POST /api/admin/planos`
- `PATCH/DELETE /api/admin/planos/[id]`
- `GET /api/planos` — listagem pública por persona
- `POST /api/assinaturas/checkout` — inicia
- `POST /api/assinaturas/cancelar`
- `POST /api/webhooks/gateway` — confirmação de cobrança

## 8. Mocks a remover
- [features/admin/planos/mocks/](../../features/admin/planos/mocks/)
- Mocks análogos nas personas (verificar).

## 9. Checklist de implementação
- [x] **Abstração de gateway**: porta `PaymentGateway` + adapter `manual` ativo + factory por env `PAYMENT_GATEWAY` (`features/planos/gateway/`)
- [x] Schema + migration (idempotente `server/bootstrap-planos.ts`): `planos`, `assinaturas`, `assinatura_eventos`
- [x] Seed do catálogo a partir de `shared/lib/plans-catalog` (fonte de verdade dos limites)
- [x] CRUD admin de planos (`GET /api/admin/planos`, `PATCH /api/admin/planos/[id]`, kpi, assinantes)
- [x] Checkout (`POST /api/assinaturas/checkout`) — adapter manual ativa imediato; gateway real retornaria redirect
- [x] Webhook idempotente (`POST /api/webhooks/gateway`) — dedupe por `gateway_event_id`
- [x] Helper `userTemAssinaturaAtiva(userId)` + `getLimiteRecurso` para gating
- [x] Gating aplicado: obras abertas (J03) e propostas/mês (J05) → HTTP 402 `LIMITE_PLANO`
- [x] Lançamento de entrada em J09 ao ativar (escopo plataforma, categoria `assinatura`, idempotente)
- [x] Cancelar (`POST /api/assinaturas/cancelar`) → rebaixa para free
- [ ] Decidir e plugar gateway REAL (Stripe/PayPal/MercadoPago/Asaas) → **Jornada 14 (bloqueada)**
- [x] Tela "minha assinatura" persona-facing consumindo os endpoints _(Task #206)_
- [x] Item "Planos" no nav lateral de empreiteiro e contratante _(Task #206)_
- [x] CTA upgrade destacado na aba "Plano & Uso" das Configurações (banner free-only) _(Task #206)_
- [x] Notificações admin in-app em eventos de assinatura (checkout, cancelamento, inadimplente, reativação) _(Task #206)_
- [ ] Proration na troca de plano no meio do ciclo (hoje: cancela a anterior + cria nova)

## 10. Critérios de aceite
1. Admin cria plano "Empreiteiro Pro R$99/mês limite 30 candidaturas".
2. Empreiteiro assina → checkout → webhook → status `ativa`.
3. Empreiteiro consegue candidatar até o limite; ao tentar 31ª recebe upsell.
4. Cancelar → status `cancelada`, limites caem para tier free no fim do ciclo.
5. Entrada aparece em J09.

## 11. Riscos / Pontos de atenção
- Webhook idempotente — duplicar evento não pode duplicar lançamento.
- Mudança de plano no meio do ciclo (proration).
- Tier free precisa estar bem definido em todas as jornadas.

## 12. Links cruzados
- Depende de: J01.
- Alimenta: J09 (entradas).
- Gateia: J03, J05 (limites).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- **2026-06-01** — Já existia `shared/lib/plans-catalog.ts` (limites/preços por persona/tier) consumido por `/api/perfil/plano`. Decisão: catálogo é a FONTE DE VERDADE dos limites; `planos` (DB) é seedado dele; `users.plano` continua sendo o tier ATIVO. `assinaturas` dita `users.plano`. Sem duplicar regra de limites.
- **2026-06-01** — **Abstração de gateway** (porta + adapter): `features/planos/gateway/payment-gateway.ts` (interface), `manual-gateway.ts` (adapter ativo, sem cobrança), `index.ts` (factory por `PAYMENT_GATEWAY`). Trocar de gateway = 1 adapter novo + env. Service/rotas/schema intocados. Integração real → Jornada 14.
- **2026-06-01** — Idempotência: `uq_assinaturas_user_ativa` (1 ativa por user), `uq_assinatura_eventos_gateway` (webhook dedupe), `uq_financeiro_origem` (entrada de receita não duplica). Verificado e2e: webhook duplicado → `processed:false`.
- **2026-06-01** — Gating retorna **HTTP 402** com `code: "LIMITE_PLANO"` em J03 (obras abertas) e J05 (propostas/mês). Tier free = catálogo (empreiteiro: 5 propostas, 2 obras; contratante: 1 obra). Enterprise (9999) tratado como ilimitado (gate não dispara).
- **2026-06-01** — Backend 100% pronto; falta a **UI persona-facing** ("minha assinatura"/checkout) consumir `/api/planos` + `/api/assinaturas/*`. Páginas `/contratante/planos` e `/empreiteiro/planos` existem mas ainda não plugadas aos endpoints — candidato a fase de UI.
- **2026-06-01** — Item de backlog `userTemAssinaturaAtiva` (precondição estratégica) materializado de verdade nesta fase.
- **2026-07-19 (Task #206)** — UI persona-facing completa: nav item "Planos" (empreiteiro + contratante), painel "Minha Assinatura" com badge de status/data/valor, dialog de confirmação na troca de plano, cancelamento direto na página de planos, banner de upgrade nas Configurações para free. `alert()` substituído por toast. Dispatcher `assinatura-admin-dispatcher.ts` integrado no `assinatura-service.ts` (fire-and-forget pós-commit para checkout, cancelamento, inadimplente, reativação).
