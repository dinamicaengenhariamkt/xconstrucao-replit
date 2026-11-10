# XG43 — Fim do teste e assinatura

**Status:** implementado no dev em 09/11/2026, sem commit (Ramon commita pelo Replit).
**Decisões:** Ramon e cliente, 09/11/2026. Substituem o trecho "trial Premium" da XG41.

## 1. Regras

| Situação | Regra | Onde no código |
|---|---|---|
| Plano do teste | **Basic**, 90 dias, uma vez por conta | `getConfigTesteXgestao` (settings-reader), `TESTE_NOVA_OFERTA` |
| Início do teste | Automático no 1º acesso do responsável a `/xgestao` (não para membro, não quando o admin visualiza a conta, não para ex-assinante) | `app/xgestao/layout.tsx`, `iniciarTesteAutomatico` |
| Fim do teste | Somente leitura **24h** depois do prazo | `TOLERANCIA_FIM_TESTE_MS` em `features/xgestao/lib/acesso-plano.ts` |
| Assinar durante o teste (qualquer plano) | Vale na hora; **1ª cobrança 1 mês após o fim do teste**; depois mensal, valor cheio | `iniciarCheckout` (`primeiraCobrancaEm`), Asaas `nextDueDate`, webhook `payment_created` |
| Cancelamento | Para as cobranças; acesso completo até `renovaEm` (fim do período pago); depois somente leitura | `cancelarAssinatura` (`canceladaEm` com status `ativa`), `encerrarCancelamentosVencidos` |
| Assinar de novo com cancelamento agendado | Permitido; 1ª cobrança no fim do período já pago | `iniciarCheckout` |
| Pagamento recusado | **7 dias** de carência a partir do vencimento, com aviso; depois somente leitura | `CARENCIA_INADIMPLENCIA_DIAS` |
| Ciclo | Só mensal, sem fidelidade de 12 meses | checkout recusa `anual` no xgestão |

Toda leitura de vigência (escrita, cotas, aba Plano, admin) passa por
`assinaturaXgestaoVigente` / `situacaoPlanoXgestao`, para as telas não discordarem.

## 2. Tela

- Faixa no topo, em toda página, só para o responsável: relógio regressivo do teste
  (`12d 04h 31min`; com segundos nas últimas 24h), contagem das 24h de tolerância,
  "Assine agora e ganhe +1 mês grátis" no último mês, cancelamento agendado e pagamento pendente.
- Aba Plano: data da 1ª cobrança com o bônus, aviso de cancelamento agendado e botão
  "Cancelar assinatura" com confirmação (antes não havia cancelamento na tela do xgestão).

## 3. Asaas

- Checkout com `subscription.nextDueDate` = dia (São Paulo) da 1ª cobrança.
- Com 1ª cobrança futura, o pagamento só chega no vencimento. A assinatura é ativada
  no `PAYMENT_CREATED` (só ref `xconstrucao|...`, vencimento > 24h, e só para quem está
  no teste ou com cancelamento agendado). Obra e anúncio continuam ignorando esse evento.
- `PAYMENT_CONFIRMED`/`RECEIVED` de assinatura ativa renovam `renovaEm` = vencimento + 1 mês
  (idempotente entre os dois eventos). Antes `renovaEm` não avançava nos pagamentos mensais.
- `SUBSCRIPTION_DELETED` depois de cancelamento pedido pelo assinante não corta o período pago.

## 4. Pendências

- **Homologar no Asaas sandbox com cartão de teste** (checkout tem reCAPTCHA, não automatizável):
  confirmar que o checkout aceita `nextDueDate` futuro sem cobrar na hora e que chega
  `PAYMENT_CREATED` com `externalReference` e `dueDate`. Sem isso, não ligar em produção.
- Testes em andamento iniciados no Premium antes de 09/11 seguem no Premium até o fim.
- Renovações mensais não lançam receita no caixa (comportamento anterior, fora do escopo).
- Avisos por e-mail do funil (lembretes antes do fim) dependem de agendador: o deploy não tem cron.
- Termos v2 (minuta) atualizados; §5.7 (exclusão após 90 dias do encerramento) conflita com
  "somente leitura sem apagar": decidir com o jurídico.

## 5. Testes

- Unitários: `tests/unit/xgestao-fim-teste.test.ts` (regras, +1 mês, data do Asaas, webhook, relógio).
- Integração: `tests/e2e/integration/xgestao-fim-teste.integration.spec.ts` e
  `xgestao-teste-gratis.integration.spec.ts` (atualizado).
- Navegador: `tests/e2e/xgestao-fim-teste.browser.spec.ts` (faixa no celular, cancelamento no desktop).
- Specs antigos que contavam com o teste Premium passaram a assinar o Premium pelo gateway
  manual na preparação (`iniciarTesteOperacionalXgestao`, opção `assinar` do helper de homologação).

**Resultado em 10/11/2026 (dev):** typecheck 0; unitários 76/76; integração 242 aprovados,
7 pulados, 3 falhas pré-existentes em `admin-xgestao.integration.spec.ts` (não inicia teste e
compra o plano `pro`, fora do catálogo desde a XG41); navegador 25/25 em 4 lotes.
Asaas sandbox: checkout recorrente aceito com `nextDueDate` futuro (`2027-02-12 00:00:00`).
Observado: o Asaas limita o nome do item a 30 caracteres.
