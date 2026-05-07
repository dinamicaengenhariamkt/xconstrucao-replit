# Jornada — Planos & Assinatura

> Status: mock | Prioridade: média | Wave: 3
> Última atualização: 2026-05-05

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
- [ ] Decidir gateway (Stripe / Pagar.me / outro) e provisionar
- [ ] Schema + migration
- [ ] CRUD admin de planos
- [ ] Checkout iniciando sessão no gateway e redirect
- [ ] Webhook de confirmação atualizando `assinaturas.status`
- [ ] Helper `userTemAssinaturaAtiva(userId)` para gating em outras jornadas
- [ ] Aplicar gating: limite de obras ativas (J03), limite de candidaturas/mês (J05)
- [ ] Tela "minha assinatura" (renovação, cancelar, baixar nota)
- [ ] Lançamento entrada em J09 ao confirmar pagamento

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

- _Sem registros ainda._
