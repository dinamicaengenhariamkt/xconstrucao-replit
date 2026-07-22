# Jornada — Integração de Gateway de Pagamento

> Status: concluída | Prioridade: média | Wave: 3
> Última atualização: 2026-07-21
>
> **CONCLUÍDA**: o gateway escolhido foi o **Asaas**. O adapter real já está
> implementado e faz chamadas HTTP verdadeiras (`shared/lib/asaas-client.ts` +
> `features/planos/gateway/asaas-gateway.ts`): checkout hospedado (PIX/Boleto/
> Cartão), `findOrCreateCustomer`, cancelamento e `parseWebhook` com verificação
> de IP. Registrado na factory por `PAYMENT_GATEWAY`. Ir para produção é
> configuração de env vars (`PAYMENT_GATEWAY=asaas`, `ASAAS_API_KEY`,
> `ASAAS_ENVIRONMENT`, `ASAAS_WEBHOOK_IPS`, `NEXT_PUBLIC_BASE_URL`) — ver J11 §9.

## 1. Contexto & Objetivo
A Jornada 11 (Planos & Assinatura) já está funcional ponta-a-ponta usando um
**adapter de gateway "manual"** que ativa assinaturas direto no banco, sem
cobrança real. Esta jornada substitui o adapter manual por um **gateway de
pagamento real** — cobrança recorrente, checkout hospedado, webhooks
autenticados. Decisão de negócio adiada de propósito: o ecossistema foi
construído com abstração para que a troca seja barata e isolada.

## 2. Personas
- **Contratante / Empreiteiro**: paga de verdade (cartão/PIX/boleto) no checkout do gateway.
- **Admin**: acompanha receita real conciliada com o gateway.
- **Sistema (gateway)**: chama o webhook em eventos de cobrança.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  U[Persona /planos] --> CK[POST /api/assinaturas/checkout]
  CK --> ADP[Adapter real: createCheckout]
  ADP --> RDR[redirect p/ checkout do gateway]
  RDR --> GW[(Gateway cobra)]
  GW --> WH[POST /api/webhooks/gateway]
  WH --> DB[(assinaturas: ativa)]
  DB --> CX[entrada no caixa J09]
```

## 4. Telas envolvidas
- [app/contratante/planos/](../../app/contratante/planos/) e [app/empreiteiro/planos/](../../app/empreiteiro/planos/) — checkout passa a redirecionar para o gateway (hoje ativa direto).
- Sem telas novas — o checkout hospedado é do provedor.

## 5. Componentes-chave (já existem — só plugar)
- **Porta**: [features/planos/gateway/payment-gateway.ts](../../features/planos/gateway/payment-gateway.ts) — interface `PaymentGateway`.
- **Adapter manual (ativo)**: [features/planos/gateway/manual-gateway.ts](../../features/planos/gateway/manual-gateway.ts).
- **Factory**: [features/planos/gateway/index.ts](../../features/planos/gateway/index.ts) — resolve por env `PAYMENT_GATEWAY`.
- **Service de assinatura**: [features/planos/assinatura-service.ts](../../features/planos/assinatura-service.ts) — `iniciarCheckout`, `cancelarAssinatura`, `aplicarEventoWebhook` (idempotente).
- **Webhook**: [app/api/webhooks/gateway/route.ts](../../app/api/webhooks/gateway/route.ts).

## 6. Schema (Drizzle)
Nada novo. As tabelas de J11 já têm os campos agnósticos de gateway:
- `assinaturas.gatewayProvider`, `gatewayCustomerId`, `gatewaySubscriptionId`
- `assinatura_eventos.gatewayEventId` (único — idempotência de webhook)

## 7. Endpoints
Nenhum novo. Os de J11 já cobrem: `POST /api/assinaturas/checkout`,
`POST /api/assinaturas/cancelar`, `POST /api/webhooks/gateway`. O adapter real
muda o COMPORTAMENTO (retorna `redirect` em vez de `activated`), não a rota.

## 8. Mocks a remover
- Nenhum. O adapter manual NÃO é mock de UI — é uma implementação real da porta.
  Pode coexistir (ex: ambiente de dev/demo) mesmo após o gateway real entrar.

## 9. Checklist de implementação (quando desbloquear)
- [ ] **Decidir o gateway** (Stripe / PayPal / MercadoPago / Asaas) — input do usuário
- [ ] Provisionar conta + chaves de API (env: chaves secretas, webhook secret)
- [ ] Criar adapter `features/planos/gateway/<provider>-gateway.ts` implementando `PaymentGateway`
  - [ ] `createCheckout` → cria sessão/assinatura no gateway, retorna `{ kind: "redirect", url }`
  - [ ] `cancelSubscription` → cancela no gateway
  - [ ] `parseWebhook` → **valida a assinatura do payload** (rejeita se inválida) e normaliza para `NormalizedWebhookEvent`
- [ ] Mapear o provider no factory [features/planos/gateway/index.ts](../../features/planos/gateway/index.ts)
- [ ] Setar env `PAYMENT_GATEWAY=<provider>` + segredos
- [ ] Mapear preços/planos do catálogo para os price IDs do gateway
- [ ] Testar webhook real (evento duplicado não pode duplicar lançamento — já garantido por `uq_assinatura_eventos_gateway`)
- [ ] Conciliação: job que compara `assinaturas` com o estado do gateway
- [ ] Proration na troca de plano no meio do ciclo

## 10. Critérios de aceite
1. `PAYMENT_GATEWAY=<provider>` → checkout redireciona para o provedor.
2. Pagamento aprovado → webhook → `assinaturas.status='ativa'` + `users.plano` atualizado.
3. Reenvio do mesmo evento de webhook → `SELECT COUNT(*) FROM assinatura_eventos WHERE gateway_event_id='X'` continua 1.
4. Receita real aparece em J09 (`financeiro` escopo plataforma, categoria `assinatura`).
5. Cancelar no gateway → webhook `subscription_canceled` → rebaixa para free.

## 11. Riscos / Pontos de atenção
- **Verificação de assinatura do webhook é obrigatória** — sem ela, qualquer um ativa assinaturas. O adapter manual NÃO valida (aceita payload simulado); o real DEVE.
- Idempotência já coberta pelo schema; o adapter só precisa fornecer um `eventId` estável.
- Segredos do gateway nunca no client — só server/env.
- Moeda/locale: garantir BRL e impostos conforme o provedor.

## 12. Links cruzados
- Depende de: J11 (toda a fundação) + decisão de negócio do gateway.
- Desbloqueia: cobrança real (monetização efetiva da plataforma).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-06-01: Jornada criada como continuação natural de J11. Fundação (porta + adapter manual + idempotência) entregue em J11; esta jornada fica BLOQUEADA aguardando o usuário definir o gateway. Trocar = 1 adapter novo + env var, sem tocar service/rotas/schema.
- 2026-07-18: `POST /api/webhooks/gateway` aceitava qualquer chamada sem verificar origem — qualquer agente podia disparar eventos de pagamento falsos. _Resolvido_: `AsaasGateway.parseWebhook` agora verifica o IP do chamador contra a env var `ASAAS_WEBHOOK_IPS` (lista separada por vírgula). Se não configurada, emite aviso mas não bloqueia (compatibilidade sandbox). Usa `TRUST_PROXY_HEADERS=1` para ler `X-Forwarded-For` atrás de proxy.
- 2026-07-18: Eventos de webhook podiam ser perdidos permanentemente se o banco ficasse indisponível além do janela de retries do gateway. _Resolvido_: tabela `webhook_delivery_log` (bootstrap idempotente em `server/bootstrap-webhook-delivery-log.ts`) persiste o payload RAW antes do processamento; falhas marcam status `failed`; retry oportunístico (até 5 tentativas, janela 24h) executa em cada nova requisição ao endpoint. Se o próprio banco estiver fora, um `console.error` estruturado com o payload completo permite replay manual. OOS (fora de escopo mantido como gap): retry ativo via cron/job dedicado, fila externa (SQS/Redis), deduplicação por `(obraId,userId)` além de `assinatura_eventos.gateway_event_id`.
