# XG48 — Troca de plano

**Status:** implementado no dev em 10/11/2026, sem commit (Ramon commita pelo Replit).
**Decisões:** Ramon, 10/11/2026 (doc 47, "Decisões do Ramon"). Resolve o PAG-05.

## 1. Regras

| Situação | Regra | Onde no código |
|---|---|---|
| Subir com assinatura paga | Vale **na hora** (limites novos já), sem cobrança agora e sem digitar cartão. A diferença `(novo − atual) × dias restantes ÷ dias do ciclo` entra **somada só na próxima fatura**; depois, valor novo cheio. Ex.: 99 → 179 faltando 15 de 30 dias: próxima fatura 179 + 40 = 219 | `calcularProporcional` (`features/xgestao/lib/troca-plano.ts`), `confirmarTroca` (`features/planos/troca-plano-service.ts`) |
| Ciclo do proporcional | Do início do período pago (`renovaEm` menos 1 mês de calendário) até `renovaEm`; dias contados no calendário de São Paulo; arredondado a centavos | `calcularProporcional`, `diasEntreSp` |
| Descer com assinatura paga | O plano atual vale até `renovaEm`; a próxima fatura já vem com o valor menor | `confirmarTroca` (troca `agendada`), `aplicarTrocasVencidas` (`features/xgestao/server/troca-marcas.ts`) |
| Escolha na descida | Antes de confirmar: "Você tem N obras em andamento e o {plano} permite editar M. As outras ficarão só para visualização a partir de {data}." Escolhe as obras e as pessoas que continuam, até o limite. **A escolha é única**: outra descida é recusada; só volta a editar tudo assinando um plano maior | `validarEscolha`, `DialogoTroca` (`XGestaoPlanosSection.tsx`) |
| Obras não escolhidas | Só para visualização (`obras.xgestao_bloqueada_por_plano`). Nada é excluído | `findObraAccess`, `erroMutacaoXgestao`, `erroSomenteLeituraUpload` |
| Pessoas não escolhidas | Pausadas (`xgestao_membros.status = 'pausado'`): não entram no xgestão da empresa; não ocupam vaga | `aplicarMarcas`, `resolverEmpresaDoUsuario` (filtra `ativo`) |
| Links do cliente | Acima do limite por obra: os mais antigos continuam, os demais ficam pausados (`obra_share_links.pausado_por_plano`) e respondem "Esta obra não está disponível no momento". Valores somem do link se o plano novo não tem | `linksExcedentes`, `resolveActiveObraShareToken` |
| Obra concluída | Não conta no limite; concluir libera vaga. Obra bloqueada também não ocupa vaga. Reabrir só com vaga (regra existente) | `create-obra.ts`, `PATCH /api/obras/[id]` |
| Data efetiva | Aplicada na primeira leitura do plano depois de `renovaEm` e no boot (idempotente) | `situacaoPlanoXgestao` (`plano-empresa.ts`), `instrumentation.ts` |
| Obras criadas ou pessoas convidadas depois da escolha | Só ficam com vaga que sobrar (escolhida concluída, por exemplo); o resto fica bloqueado/pausado na data efetiva | `selecionarMantidos` |

### Casos de borda

| Caso | Regra |
|---|---|
| Subir e cancelar antes de pagar a fatura com a diferença | Volta ao plano anterior pelo resto do período; o cancelamento segue a regra do XG43 (`reverterTrocasAoCancelar`) |
| Descer e subir de novo antes da data efetiva | Voltar ao plano atual **desfaz** a descida, sem cobrança (valor da assinatura no Asaas volta). Subir acima do atual desfaz e sobe com proporcional. A escolha agendada é descartada |
| Subir depois da descida efetivada | Obras, pessoas e links voltam, até o limite do plano novo (os mais antigos primeiro), com proporcional normal. Assinar pelo checkout um plano maior que o da última descida também devolve |
| Fatura atrasada | Bloqueado: "Há uma fatura em atraso. Regularize o pagamento antes de mudar de plano." |
| Cancelamento agendado | Bloqueado na troca; a tela oferece o checkout (assinar de novo, cobrança só no fim do período pago, regra do XG43) |
| Teste sem assinatura | É o checkout normal, não troca |
| Teste com assinatura feita (mês bônus não pago) | Só muda o plano e o valor da 1ª cobrança, sem proporcional; o bônus continua uma única vez. Descer nesse caso vale na hora, com a mesma escolha |
| Clique duplo, requisição repetida, webhook repetido | Uma troca por `chave` (índice único) e `pg_advisory_xact_lock` por titular; webhook deduplicado por evento; o valor da cobrança é sempre absoluto |
| Falha do Asaas no meio | PUT da assinatura recusado: nada muda (transação desfeita), troca `falhou` e erro em `app_errors`. PUT da cobrança recusado: troca aplicada com `ajuste_pendente`, erro em `app_errors`, retry no `PAYMENT_CREATED`, no boot e na próxima troca. Nunca soma duas vezes |
| Pagamento da fatura com diferença falha | Segue a inadimplência existente (7 dias de carência) |
| Estorno ou cancelamento pelo painel do Asaas | Troca pendente cancelada |
| Quem troca | Só o responsável; membro (ativo, convidado ou pausado) recebe 403; admin e superadmin não têm plano (403) |

## 2. Tela

- Aba Plano: com assinatura paga, os botões viram "Mudar para este plano".
- Subida: "Hoje: passa a ser {plano}. Próxima fatura em {data}: R$ {novo} + R$ {diferença} referente a {dias} dias = R$ {total}. Depois: R$ {novo} por mês."
- Descida: aviso, escolha de obras e pessoas (não confirma sem escolher até o limite), links pausados, perda de valores no link e a caixa "Entendi que as demais ficarão só para visualização e que essa escolha não poderá ser alterada".
- Faixa "Mudança agendada" com o botão "Desfazer mudança".
- Obra bloqueada: "Esta obra está só para visualização no seu plano atual. Para editar, mude para um plano maior."
- Equipe: status "Pausado pelo plano".

## 3. Asaas (sandbox, 10/11/2026)

Teste real com cliente e assinatura de cartão criados pela API sandbox (apagados ao final):

| Chamada | Resultado |
|---|---|
| `PUT /v3/subscriptions/{id}` `{ value: 179, updatePendingPayments: true }` | 200. A cobrança pendente passou de 99 para 179; a assinatura ficou com 179 e o próximo vencimento seguinte nasce com 179 |
| `PUT /v3/payments/{id}` `{ value: 219 }` em cobrança de cartão da assinatura | 200. Só a cobrança pendente ficou com 219; a assinatura seguiu com 179 |
| `PUT /v3/subscriptions/{id}` de novo com `updatePendingPayments` | Sobrescreve a cobrança pendente (a soma some). Por isso o sistema reaplica a soma depois de toda troca (`sincronizarCobrancaPendente`) |
| Plano B: `POST /v3/payments` avulsa com `creditCardToken` da assinatura | Aceita (mínimo R$ 5), mas o cartão é cobrado **na hora** (CONFIRMED), sem respeitar o vencimento. Não serve para "somar na próxima fatura"; não foi usado |

Em produção, pedir ao Asaas a **tokenização de cartão** antes de alterar valor de assinatura de cartão.

## 4. Banco

- `assinatura_trocas` (tabela nova): plano de/para, tipo, diferença, dias, status
  `agendada | aplicada | desfeita | cancelada | falhou`, `efetiva_em`, `payment_id_ajustado`,
  `ajuste_pendente`, `quitada_em`, `chave_idempotencia` (única), `escolhas` (jsonb).
- `obras.xgestao_bloqueada_por_plano`, `obra_share_links.pausado_por_plano`,
  `xgestao_membros.status_antes_pausa` e o status `pausado`.
- Migration `migrations/0012_xgestao_troca_plano.sql`; bootstrap `server/bootstrap-troca-plano.ts`.
- Eventos em `assinatura_eventos`: `troca_subir`, `troca_descer_agendada`, `troca_descer_aplicada`,
  `troca_desfeita`, `troca_cancelada`, `troca_revertida`, `troca_ajuste_cobranca`.

## 5. Endpoints

- `POST /api/assinaturas/trocar` `{ planoId, persona: 'xgestao', previa: true }`: cálculo e o que excede, sem efeito.
- `POST /api/assinaturas/trocar` `{ planoId, persona: 'xgestao', chave, obras?, membros?, ciente? }`: confirma.
- `GET /api/perfil/plano?persona=xgestao`: `assinaturaPaga` e `trocaAgendada`.

## 6. Testes

- Unidade: `tests/unit/xgestao-troca-plano.test.ts` (proporcional com meses de 28, 29, 30 e 31 dias, fuso de São Paulo, arredondamento, máquina de estados, escolha).
- Integração: `tests/e2e/integration/xgestao-troca-plano.integration.spec.ts` (gateway espião).
- Navegador: `tests/e2e/xgestao-troca-plano.browser.spec.ts` (project `browser`).

## 7. Pendências

- Tokenização de cartão no Asaas de produção.
- O início do ciclo é `renovaEm` menos 1 mês de calendário. Quem renova em 28/02 vindo de 31/01 tem o ciclo contado de 28/01 (31 dias, não 28): diferença levemente menor a favor do cliente.
