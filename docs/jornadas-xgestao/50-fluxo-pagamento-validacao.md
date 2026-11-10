# XG50 · Fluxo de pagamento: validação final

**Status:** implementado e testado no dev em 10/11/2026, sem commit (Ramon commita pelo Replit).
**Pedido do dono:** conferir de ponta a ponta mensal, anual (preparado e desligado), cancelar e voltar sem abuso, admin e primeiro acesso.
**Asaas:** só sandbox. Nada de mock no fluxo de produção (item 6).

Testes:
- Integração: `tests/e2e/integration/xgestao-pagamento-validacao.integration.spec.ts` (10 cenários).
- Unitário: `tests/unit/xgestao-pagamento-validacao.test.ts` (9 casos).

## 1. Mensal

| Cenário | Resultado | Teste | Onde no código |
|---|---|---|---|
| Cada pagamento libera 1 mês a partir do vencimento pago | ok | integração :170 | `aplicarEventoWebhook`, `assinatura-service.ts:758-763` |
| CONFIRMED + RECEIVED do mesmo pagamento | 1 mês, 1 lançamento no caixa | integração :170 | `pagamentoJaContado`, `assinatura-service.ts:746, 1205` |
| Reenvio (retry) e eventos fora de ordem | sem pular nem duplicar mês | integração :170 | idem |
| RECEIVED atrasado de pagamento já contado | não reativa nem estende | integração :170 | `assinatura-service.ts:746` |
| OVERDUE de pagamento já pago | ignorado | integração :170 | `assinatura-service.ts:795` |
| CONFIRMED antes do PAYMENT_CREATED | a assinatura nasce do pagamento, mês bônus preservado | integração :236 | `assinatura-service.ts:969` |
| 2º checkout com plano pago ativo | servidor recusa (`USAR_TROCA`, 409). Se mesmo assim chegar assinatura nova no gateway: cancelada lá, sem 2ª linha nem 2º lançamento. Pagamento já confirmado/recebido: estorno automático pelo gateway, uma vez só (10/11/2026) | integração :254, `xgestao-estorno-duplicado` | `assinatura-service.ts:217, 947, 1055` |
| Tela do empreiteiro e admin | plano, valor, próxima cobrança e situação vêm do mesmo cálculo (`/api/perfil/plano` → `cobranca`) | integração :170, :288 | `app/api/perfil/plano/route.ts`, `XGestaoPlanosSection.tsx:368` |

## 2. Anual (preparado, desligado)

Só aparece e só é aceito com as DUAS condições: `planos.valor_anual` preenchido e a chave `anualAtivo: true` em `platform_settings` (chave `xgestao`). Hoje está desligado.

| Cenário | Resultado | Teste | Onde |
|---|---|---|---|
| Desligado, mesmo com preço anual | não aparece; checkout anual dá 400 `CICLO_INVALIDO` | integração :480, unit :37 | `checkout/route.ts:100`, `assinatura-service.ts:197` |
| Ligado | cobra o valor anual (`YEARLY`), libera 12 meses | integração :480 | `lib/ciclo-plano.ts`, `assinatura-service.ts:256, 395` |
| Webhook anual | 12 meses a partir do vencimento, 1 lançamento "Anuidade" | integração :480 | `assinatura-service.ts:1143-1158` |
| MRR no admin | valor anual / 12 | integração :480, unit :31 | `admin/server/preco-sql.ts` |
| Troca de plano | proporcional sobre o ciclo anual, valor anual do plano novo | integração :480 | `troca-plano-service.ts:110-148, 444`, `troca-marcas.ts:279` |
| Cancelamento | acesso até o fim do ano pago | integração :480 | `cancelarAssinaturaXgestao` |

O preço anual só existe dentro do teste e é restaurado no fim.

## 3. Cancelar e voltar (anti-abuso)

| Cenário | Resultado | Teste | Onde |
|---|---|---|---|
| Mês bônus | uma vez por conta | integração :337 | `assinatura-service.ts:235-239` |
| Teste e bônus por CPF/CNPJ | outra conta com o mesmo documento não ganha teste nem bônus; registra `teste_negado` / `bonus_negado` | integração :354 | `server/documento-antiabuso.ts`, `teste-service.ts:143, 181` |
| Reassinar com cancelamento agendado | mantém o período pago; 1ª cobrança no fim dele; sem cobrança imediata nem duplicada | integração :288, unit :44 | `primeiraCobrancaAoAssinar` |
| Duas assinaturas cobrando | nunca: checkout recusa e o webhook cancela a duplicada | integração :254, :288 | ver item 1 |
| Inadimplente volta | assinatura antiga sai do gateway, a nova vale | integração :394 | `iniciarCheckout` |
| Estorno e reassinar | idem, sem herdar acesso estornado | integração :394 | idem |
| Trocar e cancelar ao mesmo tempo (REV-09) | mesmo lock da troca + `FOR UPDATE`; cancelar com troca `pendente_gateway` dá 409 `TROCA_EM_ANDAMENTO`. Testado nas duas ordens em paralelo | integração :419 | `assinatura-service.ts:580-605`, `cancelar/route.ts:80` |

Escolha registrada: assinatura cancelada no Asaas não pode ser reativada (o Asaas apaga). Reassinar cria uma assinatura nova com a 1ª cobrança no fim do período já pago.

## 4. Admin

| Item | Regra | Onde |
|---|---|---|
| Segmento "Voltou depois de cancelar" | teve saída (cancelamento, estorno) e depois nova assinatura paga | `lib/retorno-assinante.ts`, `segmentos-assinante.ts:31, 134` |
| Alerta "Cancela e volta com frequência" | 2 ou mais voltas em 90 dias, ou tentativa bloqueada de teste/bônus | idem, unit :57-88 |
| Lista, detalhe (linha do tempo) e CSV | chips nas duas telas; 5 colunas novas no CSV | `assinantes.ts:286, 410, 425`, `export/route.ts:101-123` |
| Contagem de bloqueios | eventos `bonus_negado` e `teste_negado` por conta | `assinatura_eventos.user_id` (migration 0015) |

## 5. Primeiro acesso e compra

| Etapa | Obrigatório | Opcional | Validado no servidor |
|---|---|---|---|
| Cadastro | nome (2+), e-mail, usuário (3+), senha (8+ e política), aceite dos termos | telefone, CPF/CNPJ (se vier, precisa ser válido) | sim, `registerSchema` |
| Perfil da empresa (Configurações) | nome (3+), responsável (3+) | telefone, CNPJ ou CPF (CPF só na conta xgestão), CEP, endereço | sim, `PATCH /api/perfil/empreiteiro`; grava também em `users.cpf_cnpj` |
| Checkout | CPF ou CNPJ válido (gateway real) | | sim, 422 `PERFIL_INCOMPLETO` (integração :457) |

As telas leem a mesma fonte: barra do teste (`/api/xgestao/teste`, `bonusDisponivel`), aba Plano e Configurações (o mesmo `XGestaoPlanosSection`), retorno do checkout (`/xgestao/planos/sucesso`, `xgestao-sucesso-cobranca`) e admin (`situacao-assinante.ts`). Sem bônus disponível, a barra do teste não promete o mês extra.

## 6. Sem mock em produção

- Rotas `app/api/test/**`: 404 em produção (`rotasDeTesteHabilitadas`).
- Gateway manual: bloqueado em produção (`conferirGatewayPagamento`).
- Header de modo pendente: só fora de produção.
- Preços: sempre do banco.

## 7. Banco

- `migrations/0015_xgestao_pagamento_antiabuso.sql`: `assinaturas.documento_fiscal`, `assinatura_eventos.user_id` e dois índices. Também no `server/bootstrap-colunas-essenciais.ts`. Já aplicada no banco de dev.

## 8. Resultado dos testes (10/11/2026)

- Typecheck limpo. Unitários: 368/368.
- Integração (planos, assinatura, webhook, troca, teste grátis, fim do teste, admin xgestão e este spec), em série: 127 passaram, 0 falharam, 5 pulados (condicionais).
- Navegador: retorno do checkout 1/1.
- Specs com CNPJ em sequência fixa repetiam o documento a cada rodada e passariam a perder o teste grátis pela trava nova. Agora usam um prefixo por execução (`CNPJ_PREFIXO_EXECUCAO`).

## 9. Decisões do dono

- [x] Pedir CPF/CNPJ antes de liberar o teste grátis. Feito em 10/11/2026 (seção 10): o responsável do xgestão informa CPF ou CNPJ no 1º passo do wizard, antes do 1º acesso ao `/xgestao`. A trava do mês bônus continua no checkout.
- [ ] Anual: preencher `valor_anual` dos planos e ligar `anualAtivo` quando quiser vender.
- [x] Pagamento em dobro (caso raro, quando o Asaas cria 2 assinaturas): estorno automático desde 10/11/2026 (seção 11). O painel só entra se o estorno falhar (alerta de erro e evento `pagamento_duplicado_estorno_falhou`).
- [ ] Reassinar depois de cancelar pede o cartão de novo (nova assinatura no Asaas). Aceitar assim ou guardar o cartão (depende da tokenização em produção).

## 10. CPF/CNPJ no 1º passo do wizard (10/11/2026)

- Quem: o responsável do xgestão (empreiteiro com o papel `xgestao`, cadastro por e-mail ou Google). Membro convidado, contratante, anunciante e empreiteiro só do marketplace seguem como antes (documento opcional; empreiteiro do marketplace só CNPJ).
- Tela: o passo "Sobre sua empresa" pede "CPF ou CNPJ" com o texto "Para liberar seu teste grátis e emitir suas cobranças com segurança, precisamos do seu CPF ou CNPJ. Usamos só para isso." O "Pular por agora" só aparece com o documento válido salvo. Depois disso o resto continua pulável.
- Servidor: `POST /api/onboarding/concluir` responde 422 `DOCUMENTO_OBRIGATORIO` para o responsável do xgestão sem documento válido. O layout `/xgestao` manda para `/onboarding` quem ainda não concluiu o wizard e não tem documento, então o teste não começa sem a conferência.
- Base antiga: quem já concluiu o wizard sem documento não é desviado nem barrado; o documento continua sendo pedido no checkout.
- Teste grátis: com o documento salvo antes do 1º acesso, o início automático confere a regra de um teste por CPF/CNPJ. Documento que já usou o teste em outra conta: a conta começa sem teste, registra `teste_negado` (sem o documento no histórico) e a tela de planos mostra "Esse documento já usou o período de teste. Você pode assinar quando quiser." (`teste.testeNegadoPorDocumento` em `/api/perfil/plano`). Nada da outra conta aparece.
- Documento já cadastrado em outra conta: aceito como antes (sem bloqueio novo); só o teste e o bônus deixam de valer.
- Código: `features/onboarding/lib/documento-onboarding.ts` (regra pura), `features/onboarding/server/documento-pendente.ts`, `app/api/onboarding/concluir/route.ts`, `app/xgestao/layout.tsx`, `OnboardingWizard.tsx`.
- Testes: unit `tests/unit/xgestao-documento-onboarding-estorno.test.ts`; integração `xgestao-onboarding-documento.integration.spec.ts`; navegador `tests/e2e/onboarding.spec.ts` (bloco do xgestão).

## 11. Estorno automático do pagamento em dobro (10/11/2026)

- Quando: o webhook recebe pagamento confirmado/recebido de uma 2ª assinatura do gateway e a conta já tem plano pago valendo. A duplicada é cancelada no gateway (como antes) e o pagamento dela é estornado por inteiro (`refundPayment`, `POST /v3/payments/{id}/refund` no Asaas; no-op no gateway manual), fora da transação.
- Só criada ou pendente (1ª cobrança futura): cancelar a assinatura basta, o Asaas apaga a cobrança pendente junto. Sem estorno.
- Uma vez só: CONFIRMED e RECEIVED do mesmo pagamento passam por um lock por pagamento. Cada tentativa fica em `assinatura_duplicada_cancelada.estornoAutomatico`; o sucesso em `pagamento_duplicado_estornado`. Reenviar o mesmo evento não faz nada (dedup por `gatewayEventId`).
- Falha: evento `pagamento_duplicado_estorno_falhou` e alerta de erro ("estornar no painel do gateway"). A próxima entrega do webhook do mesmo pagamento tenta de novo.
- PAYMENT_REFUNDED que volta depois: a subscription duplicada não tem linha local, então a assinatura válida não perde acesso nem fica inadimplente.
- Caixa (decisão): nenhum dos dois lançamentos. A entrada da duplicada nunca é lançada e a saída do estorno também não. O caixa mostra só o que de fato ficou com a plataforma.
- O assinante recebe a notificação "Pagamento em dobro estornado".
- Código: `features/planos/lib/estorno-duplicado.ts` (decisão pura), `assinatura-service.ts` (`historicoEstornoDuplicado`, `estornarPagamentoDuplicado`), gateways em `features/planos/gateway/`.
- Testes: unit acima; integração `xgestao-estorno-duplicado.integration.spec.ts`.

Resultado (10/11/2026, seções 10 e 11): typecheck limpo; unitários 373/373; integração nova 10/10; regressão (onboarding, OAuth, planos, assinatura, webhook, retry, teste grátis, fim do teste, pagamento XG50, auditoria) 96 passaram, 0 falharam, 5 pulados (condicionais). Navegador do wizard escrito, ainda não rodado.
