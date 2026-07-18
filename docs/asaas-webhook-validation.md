# Validação do fluxo de webhook ASAS — Documentação

## O que foi validado

### Formato real do payload ASAS vs. parsing implementado

Comparamos a documentação oficial ASAS (`https://docs.asaas.com/reference/notifications`)
contra `AsaasGateway.parseWebhook` e `aplicarEventoWebhook`. Os formatos estão
corretos e alinhados. Todos os campos críticos são extraídos corretamente:

| Campo no payload                  | Extraído como              | Comportamento com null/ausente |
|-----------------------------------|----------------------------|-------------------------------|
| `payment.id`                      | parte do `eventId`         | fallback para `subscription.id` |
| `payment.subscription`            | `gatewaySubscriptionId`    | `undefined` se ausente        |
| `payment.customer`                | `gatewayCustomerId`        | `undefined` se ausente        |
| `payment.externalReference`       | `externalReference`        | `undefined` se null ou ausente|
| `payment.value`                   | `valor`                    | `undefined` se não for number |
| `subscription.id`                 | `gatewaySubscriptionId`    | usado em eventos SUBSCRIPTION_* |
| `subscription.externalReference`  | fallback de `externalReference` | só presente em eventos SUBSCRIPTION_* |

### Bugs encontrados e corrigidos

#### Bug 1 — Falsa deduplicação de eventos distintos no mesmo pagamento

**Cenário**: ASAS envia `PAYMENT_OVERDUE` para `pay_abc`. O boleto é então
pago → ASAS envia `PAYMENT_CONFIRMED` para o mesmo `pay_abc`.

**Antes**: `eventId = "pay_abc"` para ambos → o segundo era descartado como
duplicata → a assinatura nunca era reativada.

**Depois**: `eventId = "PAYMENT_OVERDUE:pay_abc"` e `"PAYMENT_CONFIRMED:pay_abc"` →
eventos distintos, ambos processados corretamente.

**Arquivo**: `features/planos/gateway/asaas-gateway.ts`

#### Bug 2 — Assinatura inadimplente não reativava após pagamento recebido

**Cenário**: Assinatura vai a `inadimplente`. Cliente paga. ASAS envia
`PAYMENT_CONFIRMED` com `payment.subscription = "sub_xxx"`. A assinatura é
encontrada no banco via `gatewaySubscriptionId`, mas não havia código para
reativá-la.

**Antes**: Assinatura ficava presa como `inadimplente`. `users.plano` não voltava
para o tier pago.

**Depois**: Quando `type = "payment_succeeded"` e a assinatura estava `inadimplente`,
o sistema: (1) muda status → `ativa`, (2) recalcula `renovaEm` (+1 mês), (3)
busca o tier do plano e atualiza `users.plano`.

**Arquivo**: `features/planos/assinatura-service.ts`

---

## Fluxo completo — Sandbox manual (roteiro)

Para executar o fluxo no sandbox ASAS quando as credenciais estiverem disponíveis:

### Pré-requisitos
- `ASAAS_API_KEY` configurado (prefixo `$aact_hmlg_` no sandbox)
- `ASAAS_ENVIRONMENT=sandbox`
- `PAYMENT_GATEWAY=asaas`
- URL pública acessível para receber webhooks (usar ngrok ou túnel Replit)
- Webhook configurado no painel ASAS para apontar ao `POST /api/webhooks/gateway`

### Passo a passo

1. **Criar checkout** — autenticar como `contratante`, acessar `/contratante/planos`,
   selecionar um plano pago e clicar em "Assinar". O sistema chama
   `POST /api/planos/checkout`, que invoca `AsaasGateway.createCheckout`. A resposta
   é um redirect para o checkout hospedado ASAS.

2. **Simular PIX no sandbox** — no checkout ASAS, escolher PIX e usar a opção
   "Simular pagamento" disponível no ambiente sandbox.

3. **Verificar webhook recebido** — nos logs do servidor, confirmar a linha:
   ```
   [asaas] webhook event="PAYMENT_CONFIRMED" mapped="payment_succeeded" paymentId="pay_xxx" subId="sub_xxx"
   [asaas] assinatura criada via webhook: userId=<uid> plano=<nome> assinaturaId=<id>
   ```

4. **Verificar banco** — assinatura deve aparecer em `assinaturas` com `status="ativa"`
   e o `users.plano` do usuário deve refletir o tier do plano contratado.

5. **Simular inadimplência e reativação** (opcional):
   - No painel ASAS sandbox, marcar o próximo pagamento como vencido → confirmar
     webhook `PAYMENT_OVERDUE` → assinatura muda para `inadimplente`.
   - Simular pagamento do boleto em atraso → confirmar webhook `PAYMENT_CONFIRMED`
     com o mesmo `payment.id` → assinatura volta para `ativa`.

### Validação automatizada do parsing

O script `scripts/test-asaas-webhook.ts` valida o parsing de payloads sem
necessidade de banco ou credenciais ASAS:

```bash
npx tsx scripts/test-asaas-webhook.ts
# → 12 testes — 12 passaram, 0 falharam.
```

Cobre: PIX/boleto/cartão, segundo mês com `externalReference=null`, OVERDUE→CONFIRMED
no mesmo `payment.id`, SUBSCRIPTION_DELETED, eventos desconhecidos, payload vazio.

---

## Limitações conhecidas (gaps em J14 §13)

- **Sem verificação de assinatura HMAC**: ASAS não inclui HMAC por padrão.
  Mitigar via IP whitelist ASAS no firewall/proxy de produção.
- **Sem retry persistente**: Se o DB cair durante processamento, o evento é perdido
  após as retentativas do ASAS. Ver task #172 para fila persistente.
- **Reativação usa +1 mês fixo**: Não respeita o ciclo anual da assinatura no
  cenário de reativação pós-inadimplência. Ver task #170.
