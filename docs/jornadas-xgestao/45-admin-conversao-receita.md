# XG45 — Admin: conversão, cancelamentos e receita (Lote B)

**Status:** implementado no dev em 10/11/2026, sem commit (Ramon commita pelo Replit).
**Pedido:** Ramon, 10/11/2026, depois do XG44. Lote C (engajamento e histórico mensal)
fica para depois.

## 1. Páginas

| Página | O que mostra | Leva a |
|---|---|---|
| `/admin/xgestao` (home) | Quatro números novos: conversão do teste, recorrente mensal (com ticket médio), saíram no mês, receita em risco | Conversão; Financeiro |
| `/admin/xgestao/conversao` (nova, no menu) | Funil do teste (começaram, assinaram, não assinaram, ainda no teste, assinaram no teste x depois, nunca começaram, mediana de dias até assinar), tabela por mês de início do teste, últimos 10 que assinaram e últimos 10 que terminaram o teste sem assinar, cancelamentos do mês e lista de quem está saindo | Detalhe de cada assinante; lista filtrada |
| `/admin/xgestao/financeiro` | Além do que já tinha: receita por plano (pagantes, recorrente, saindo, pendente, no teste), ticket médio e quem mais pagou | Detalhe do assinante |
| `/admin/xgestao/assinantes/[id]` | Além do XG44: quanto já pagou ao xgestão (total e nº de mensalidades) e como foi o teste grátis | — |

## 2. Regras

Todas em `features/xgestao/admin/lib/metricas-comerciais.ts` (puras, testadas sem banco).
Vigência e situação continuam vindo de `acesso-plano.ts` e `situacao-assinante.ts`.

- **Funil.** Entra quem teve teste. Convertido = 1ª assinatura paga criada depois do início
  do teste. Com o mês extra = assinou até o fim do teste + 24h. Perdido = teste passou das
  24h de tolerância sem assinatura paga. Taxa de conversão = convertidos / (convertidos +
  perdidos): quem ainda está no teste não entra na conta. Mês = fuso de São Paulo.
- **Recorrente mensal (MRR).** Só situação `pago`. Quem cancelou e ainda usa vai para
  "saindo"; pagamento pendente vai para "em risco". Antes do XG45 o recorrente somava os
  três; o número do Financeiro pode cair por isso, e é o certo.
- **Cancelamento é por assinante.** Trocar de plano encerra a assinatura antiga mas não é
  saída. Saiu no mês = não tem mais assinatura paga vigente e o fim do acesso caiu no mês
  corrente: fim do período pago (cancelamento agendado cumprido), fim da carência de 7
  dias (inadimplência) ou o dia do cancelamento imediato. Taxa = saíram no mês / pagantes
  no início do mês.

## 3. Mudança no caixa da plataforma

Antes só a 1ª cobrança de cada assinatura virava lançamento; renovações e a 1ª cobrança
adiada pelo mês extra nunca entravam na receita. Agora cada pagamento confirmado de
mensalidade do xgestão gera uma entrada paga no caixa da plataforma:

- `origemTipo = 'xgestao_mensalidade'`, `origemId = id do pagamento no Asaas`. O índice
  `uq_financeiro_origem` impede o dobro quando chegam CONFIRMED e RECEIVED do mesmo pagamento.
- Vale para renovação, 1ª cobrança e pagamento em atraso que reativa a assinatura.
- Sem o id do pagamento, não registra (não haveria como evitar o dobro).
- Valor = o do evento; sem valor, o preço do plano.
- O webhook passou a carregar o `paymentId` (`payment-gateway.ts`, `asaas-gateway.ts`,
  reprocessamento e a rota de simulação de teste). Marketplace sem mudança.
- A receita acumulada soma os lançamentos novos e os antigos de origem `assinatura` do
  xgestão.

## 4. Testes

| Tipo | Arquivo | O que prova |
|---|---|---|
| Unitário | `tests/unit/xgestao-admin-metricas-comerciais.test.ts` | Fuso de São Paulo, jornada (bônus, tolerância, paga antes do teste, troca de plano), funil e coortes, fim do acesso, cancelamentos (troca de plano não é saída, efetivado x imediato, carência), receita por plano |
| Integração | `tests/e2e/integration/xgestao-admin-comercial.integration.spec.ts` | CONFIRMED + RECEIVED = 1 lançamento; mês seguinte = outro; rota HTTP de simulação; sem id não registra; detalhe, Financeiro, Conversão e home batem; cancelamento agendado e teste perdido; acesso só admin |
| Navegador | `tests/e2e/xgestao-admin-comercial.browser.spec.ts` | Home → Conversão → assinante que pagou → Financeiro pelo menu; celular sem rolagem lateral |

O ciclo real de cobrança no Asaas sandbox não é provado aqui; os eventos passam pelo mesmo
`aplicarEventoWebhook` do handler real.
