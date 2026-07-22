# Operação & Rollout — Marketplace Split (J42–J50)

> Guia operacional da frente de marketplace/split. Ativação gradual, env vars,
> webhook, reconciliação e monitoramento. Atualizado: 2026-07-22.

## Flags e env vars

| Var | Valor | Papel |
|---|---|---|
| `MARKETPLACE_SPLIT` | `on` para habilitar (default off) | Porta toda a frente de split. Só tem efeito com `PAYMENT_GATEWAY=asaas`. |
| `PAYMENT_GATEWAY` | `asaas` em produção | Gateway real (o adapter `manual` é bloqueado em produção). |
| `MARKETPLACE_ENC_KEY` | 32 bytes hex (64 chars) | Cripto AES-256-GCM da apiKey da subconta. **Estável** — rotacionar torna segredos cifrados indecifráveis. |
| `ASAAS_API_KEY` | master key | Chave da conta-mãe. |
| `ASAAS_ENVIRONMENT` | `production` \| `sandbox` | Ambiente da API. |
| `ASAAS_WEBHOOK_TOKEN` | token do painel Asaas | **Auth primária** do webhook (header `asaas-access-token`, validado em tempo constante). Impede POST forjado confirmar pagamento. Recomendado em produção. |
| `ASAAS_WEBHOOK_IPS` | IPs oficiais do Asaas (csv) | Whitelist do webhook (defesa **secundária**, spoofável via XFF se o proxy não sanear). |
| `NEXT_PUBLIC_BASE_URL` | URL pública | successUrl/cancelUrl e invoiceUrl. |
| `TRUST_PROXY_HEADERS` | `1` atrás de proxy | Resolve o IP real para a whitelist do webhook. |

Gerar `MARKETPLACE_ENC_KEY`: `node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"`.

## Webhook

- Endpoint único: `POST /api/webhooks/gateway`. Configurar no painel Asaas (conta-mãe **e** subcontas — ver abaixo).
- Eventos necessários: pagamento (`PAYMENT_CONFIRMED`/`PAYMENT_RECEIVED`/`PAYMENT_OVERDUE`) e conta/KYC (`ACCOUNT_STATUS_*`).
- Roteamento interno (transparente): assinatura → `aplicarEventoWebhook`; conta/KYC → `aplicarEventoSubconta` (J46); pagamento de obra (externalReference `xconstrucao-obra|...`) → `aplicarEventoSplit` (J48).
- **Autenticação (crítico — o webhook confirma dinheiro):** definir `ASAAS_WEBHOOK_TOKEN` no painel Asaas e na env. É validado em tempo constante no header `asaas-access-token`. **Fail-closed:** com `MARKETPLACE_SPLIT=on`, se nem token nem `ASAAS_WEBHOOK_IPS` estiverem configurados, o webhook é RECUSADO. A whitelist de IP é defesa secundária (spoofável por `X-Forwarded-For` se o edge proxy não sanear o header de entrada — confirmar que sim).
- **Subcontas**: configurar o webhook já na criação da subconta (o Asaas recomenda, para não perder eventos de KYC). Hoje a criação (J45) usa `/accounts` sem webhook embutido — se necessário, os eventos de conta chegam pela conta-mãe.

## Reconciliação (proteção contra webhook perdido)

- Job: `features/marketplace/reconciliacao-split-job.ts` (`reconciliarSplitsPendentes`). Varre `pagamentos_split` presos em `pendente` (15min–72h, com `asaas_payment_id`), consulta `getPayment` no Asaas e, se `CONFIRMED`/`RECEIVED`, reaplica `aplicarEventoSplit` (idempotente). No-op se `MARKETPLACE_SPLIT` off.
- Disparo periódico: `npx tsx scripts/reconciliar-split.ts` via **Replit Scheduled Deployment** (sugerido: a cada hora).
- Disparo manual: `POST /api/admin/marketplace/reconciliar` (admin) ou o botão "Reconciliar agora" no painel financeiro.

## Métricas

- `GET /api/admin/marketplace/metricas` → total confirmado/repassado/comissão, pendentes (qtd + valor), confirmados, falhos, total sacado, saques pendentes.
- Visíveis na seção "Marketplace / Split" do painel admin de financeiro.

## Plano de rollout gradual

1. **Sandbox**: `MARKETPLACE_SPLIT=on` + `PAYMENT_GATEWAY=asaas` + `ASAAS_ENVIRONMENT=sandbox`. Rodar o E2E completo (subconta → KYC → checkout split → confirmação → saldo/saque). Confirmar reconciliação recuperando um webhook simulado como perdido.
2. **Piloto em produção**: manter `MARKETPLACE_SPLIT=off` por padrão; habilitar para um subconjunto de empreiteiros de confiança (hoje o gate é global via env — para piloto por-usuário, avaliar mover para `platform_settings` como toggle segmentado). Monitorar erros de webhook/split (J33/Sentry) e a métrica de `pendentes`.
3. **Geral**: com o piloto estável (sem splits presos, sem erros de KYC), habilitar `MARKETPLACE_SPLIT=on` para todos.
4. **Rollback**: `MARKETPLACE_SPLIT=off` restaura instantaneamente o fluxo manual (`quitarLancamento`) — o CTA "Pagar via plataforma" some, e o pagamento manual permanece. Nenhum dado é perdido; splits pendentes podem ser reconciliados depois.

## Monitorar

- Splits `pendente` antigos (webhook perdido) → a métrica `qtdPendentes`/`valorPendente` e o job de reconciliação.
- Splits `falhou` → investigar (walletId inválido, subconta não aprovada, recusa do pagador).
- Saques `pendente` que não concluem → checar `/transfers` no Asaas.
- Erros de decifragem de apiKey → indica `MARKETPLACE_ENC_KEY` trocada/ausente.

## Pendências conhecidas (sub-itens futuros)

- **Estorno/chargeback**: o parse já reconhece REFUNDED/CHARGEBACK como falha na reconciliação (marca `falhou`), mas a **reversão do caixa** (`financeiro` de volta a pendente + ajuste de `obras.valorPago`) não está implementada — tratar quando o volume justificar.
- **Taxa do Asaas nas métricas**: as métricas refletem os valores do split (bruto), não o líquido após a taxa do Asaas. Refinar se o negócio exigir o líquido.
- **Valor mínimo/taxa de saque**: não implementados (decisão de negócio).
- **Webhook por-subconta**: avaliar embutir config de webhook na criação da subconta (J45) para eventos de KYC não dependerem da conta-mãe.
