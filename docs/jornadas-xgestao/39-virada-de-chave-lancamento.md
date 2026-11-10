# Jornada XG39: virada de chave do lançamento (limites e pagamento real)

> Status: planejada (executar só com o OK de lançamento do Ramon) | Prioridade: alta | Wave: xgestão-39
> Última atualização: 2026-11-10 (oferta atual e Secrets de produção, auditoria 47: PAG-08, PAG-10, PAG-12)

## 1. Contexto & Objetivo

A oferta comercial e os limites já estão no código e valem desde a XG41/XG43. O pagamento segue em
**sandbox** no ambiente de desenvolvimento. Esta jornada junta o que precisa mudar no dia do
lançamento, como uma lista curta de passos conferíveis.

### Oferta vigente (fonte: `features/xgestao/lib/oferta-comercial.ts`)

| Plano | Preço/mês | Obras ativas | Pessoas na empresa | Links públicos por obra | Valores no link do cliente |
|---|---|---|---|---|---|
| Basic | R$ 99 | 1 | 2 | 1 | não |
| Basic Plus | R$ 179 | 3 | 5 | 3 | sim |
| Premium | R$ 299 | 10 | 15 | ilimitado | sim |

- Teste grátis: 90 dias no Basic, começa sozinho no 1º acesso, uma vez por conta; 24h depois do fim, somente leitura.
- Bônus: assinando durante o teste, a 1ª cobrança é 1 mês após o fim do teste. Só vale com o 1º pagamento e uma vez por conta (regra de 10/11/2026; ver XG43 e Termos §5.1-A).
- Documento: CPF ou CNPJ válido (pessoa física ou jurídica).
- Tiers legados do xgestão (`free`, `pro`, `enterprise`): `ativo = false` em `planos` (bootstrap idempotente e `migrations/0010`). Não são vendidos; assinaturas antigas do sandbox seguem lidas pelo catálogo. O limite temporário `9999` foi removido.

## 2. Personas

- **Ramon / admin**: executa a virada e confere.
- **Assinantes**: passam a ter cobrança real.

## 3. Fluxo ponta-a-ponta

1. Ramon dá o OK de lançamento.
2. Secrets de produção configurados no deploy (seção 9).
3. Boot do publicado sem erro de configuração do Asaas.
4. Conferência ponta a ponta com uma assinatura real de valor baixo.

## 4. Telas envolvidas

- Aba Plano do xgestão: preços, limites e textos de bônus e cancelamento
- Faixa "Ambiente de testes" nas telas de pagamento: precisa sumir com `ASAAS_ENVIRONMENT=production`

## 5. Componentes-chave

- [features/xgestao/lib/oferta-comercial.ts](../../features/xgestao/lib/oferta-comercial.ts): oferta e limites
- [shared/lib/plans-catalog.ts](../../shared/lib/plans-catalog.ts): catálogo por persona (xgestão lê a oferta)
- [server/bootstrap-planos.ts](../../server/bootstrap-planos.ts): seed, colunas do bônus e tiers legados inativos
- [shared/lib/asaas-client.ts](../../shared/lib/asaas-client.ts): `conferirChaveAsaas` (chave x ambiente) e recusa de checkout em produção
- [instrumentation.ts](../../instrumentation.ts): aviso de sandbox em produção e erro de chave incoerente no boot
- [features/planos/gateway/asaas-gateway.ts](../../features/planos/gateway/asaas-gateway.ts): checkout e webhook

## 6. Schema (Drizzle)

- `assinaturas.fim_teste_em` e `assinaturas.primeiro_pagamento_em` (regra do bônus), via `migrations/0011_assinaturas_bonus_teste.sql` e bootstrap.

## 7. Endpoints

- `POST /api/assinaturas/checkout`: em produção recusa (502 `GATEWAY_ERROR`) se a chave não combinar com o ambiente
- `POST /api/webhooks/gateway`: em produção exige `ASAAS_WEBHOOK_TOKEN` (ou lista de IPs)

## 8. Mocks a remover

Nenhum.

## 9. Checklist de implementação

### Secrets do deploy (o `.replit` NÃO define mais estes valores para produção)
- [ ] `PAYMENT_GATEWAY=asaas` (sem ele o publicado cai no adapter manual, que é recusado em produção)
- [ ] `ASAAS_ENVIRONMENT=production` e `ASAAS_API_KEY` de produção (sem `_hmlg_`); o boot loga erro se não combinarem e o checkout fica recusado
- [ ] `ASAAS_WEBHOOK_TOKEN` igual ao do painel do Asaas (webhook de produção apontando para `/api/webhooks/gateway`)
- [ ] `TRUST_PROXY_HEADERS=1` no publicado
- [ ] No Asaas de produção, webhook com os eventos: PAYMENT_CREATED, PAYMENT_CONFIRMED, PAYMENT_RECEIVED, PAYMENT_OVERDUE, PAYMENT_DELETED, PAYMENT_REFUNDED, PAYMENT_REFUND_IN_PROGRESS, PAYMENT_CHARGEBACK_REQUESTED, PAYMENT_CHARGEBACK_DISPUTE, PAYMENT_AWAITING_CHARGEBACK_REVERSAL, SUBSCRIPTION_DELETED

### No dia da virada
- [ ] Conferir `SELECT tier, valor_mensal, ativo FROM planos WHERE persona='xgestao';`: só basic, basic_plus e premium ativos
- [ ] Faixa "Ambiente de testes" sumiu
- [ ] Assinaturas e obras de teste: decidir se limpa ou mantém antes de abrir

## 10. Critérios de aceite

1. Boot do publicado sem `[boot] ERRO de configuração do Asaas`.
2. Conta Basic não cria a 2ª obra (402) nem convida a 3ª pessoa.
3. Uma assinatura real de valor baixo ativa o plano pelo webhook, entra uma vez no caixa e aparece no admin.

## 11. Riscos / Pontos de atenção

- Contas criadas na fase de teste podem ter mais obras/usuários que o limite: nada some, só bloqueia criar (XG35).
- Trocar de sandbox para produção invalida assinaturas sandbox: avisar testadores.
- Deploy sem os Secrets acima: checkout fora do ar até configurar.

## 12. Links cruzados

- Depende de: [XG33](33-ajustes-pendentes-mvp.md) (AJ-01, AJ-02), [XG35](35-teste-gratis-e-fim-do-teste.md), [XG37](37-equipe-empresa-fechamento.md), [XG38](38-termos-privacidade-no-ar.md), [XG43](43-fim-teste-assinatura.md), [XG47](47-auditoria-pre-lancamento.md)

## 13. Gaps descobertos durante execução

- 2026-10-04: jornada criada; recebe AJ-10/AJ-11 da XG33 e o limite de usuários da XG37.
- 2026-11-10: oferta atualizada (Basic, Basic Plus, Premium); tiers legados inativos; `9999` removido; Secrets de pagamento saem do `.replit` (PAG-08).
