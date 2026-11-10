# XG47: auditoria completa pré-lançamento (10/11/2026)

Raio-X do xgestão feito por 5 auditores em paralelo, cada um com um recorte: empreiteiro e uploads, link do cliente, planos/valores/Asaas, admin, testes e mocks. Todos os achados abaixo citam `arquivo:linha`, e os críticos foram conferidos de novo no código. Banco consultado: o de dev do Replit.

Estado dos testes no dia: unitários do xgestão 168/168. Integração do xgestão + planos + webhook + uploads + authz: 214 passaram, 0 falharam, com os specs rodando em série. Com 2 workers em paralelo, 4 falham porque comparam totais globais entre duas leituras (TST-19). Typecheck limpo.

Dados mockados: nenhum em código de produção (sem mock, faker, lorem, `Math.random` em valor exibido). Ressalvas: propaganda com "IA" (TST-05) e restos da sentinela 9999 (TST-16).

## Decisões do Ramon (10/11/2026)

- **Troca para plano maior:** vale na hora, sem nova cobrança imediata. A diferença proporcional aos dias que faltam até a renovação, (novo - atual) x dias restantes / dias do ciclo, entra somada só na próxima fatura. Depois disso, o valor novo cheio.
- **Troca para plano menor:** o plano atual vale até a renovação. No momento da troca, aparece um aviso de que obras, pessoas e links acima do limite vão ficar só para visualização. Ele escolhe ali quais obras continuam editáveis. A escolha não muda mais. Para voltar a editar todas, assina de novo um plano maior. Nada é excluído.
- **Troca de plano implementada (XG48, 10/11/2026):** homologada no Asaas sandbox (`PUT /subscriptions` com `updatePendingPayments` e `PUT /payments` na cobrança pendente de cartão). **Antes de produção, pedir ao Asaas a tokenização de cartão**: sem ela, alterar o valor de assinatura de cartão pode ser recusado. Ver [XG48](48-troca-de-plano.md).
- **Troca, cancelamento e reassinatura em qualquer momento** (no teste, no mês bônus, com fatura atrasada, no meio de outra troca): cada caso tratado e coberto por teste de unidade, de integração e de navegador. A troca proporcional é homologada no Asaas sandbox. Em produção, pedir ao Asaas a **tokenização de cartão**.
- **Cancelar com o mês bônus ainda não pago:** o bônus só vale se a assinatura chegar ao 1º pagamento. Cancelou antes: acesso até o fim do teste + 24h. Se já estava no mês bônus: 24h a partir do cancelamento. O mês bônus vale uma única vez por conta.
- **Link do cliente com o plano vencido de vez (somente leitura):** a obra sai do ar com a mensagem "Esta obra não está disponível no momento. Fale com o responsável pela obra.", sem citar pagamento. Volta sozinha quando o empreiteiro regulariza.
- **Texto de IA na divulgação:** sai agora. Volta quando houver IA no produto.
- **CPF no pagamento:** aceito. Os Termos devem dizer pessoa física ou jurídica.
- **Premium:** links ilimitados por obra.
- **Ocorrências:** edição completa no MVP. Editar título, descrição e gravidade; excluir; reabrir; observação da resolução. Mesmas permissões do diário.

## Já corrigido nesta rodada

- [x] **PAG-01** A rota real do webhook (`app/api/webhooks/gateway/route.ts:61`) descartava o `paymentId`. Por isso renovações e a 1ª cobrança após o bônus não entravam no caixa. Regressão do XG45, corrigida: 38/38 nos specs de webhook, tsc limpo. Falta o teste que faz POST na rota real (TST-20).

## 1. Bloqueia o lançamento

- [ ] **EMP-02 (LGPD)** Anexos de obra, contratos de prestador, fotos e capa são gravados como `public` (`shared/lib/storage/key-builder.ts:94-102`). A chave é previsível, a URL não expira e continua viva depois de revogar o link do cliente. São 276 arquivos no dev. Correção: `private` + URL assinada, e migrar os objetos já gravados.
- [ ] **EMP-01** "Anexar comprovante" no lançamento financeiro sempre falha para o empreiteiro, porque o kind `comprovante_pagamento` só aceita contratante (`key-builder.ts:40`). Nenhum dos 307 lançamentos do dev tem comprovante. O teste existente cria o arquivo por rota de teste e não pegou.
- [ ] **EMP-13 (conferir)** O `R2_KEY_PREFIX` não está definido. Se o publicado usa os mesmos `R2_*` do workspace, dev, testes de integração e produção dividem o mesmo bucket. Ramon confere em Deployments → Secrets.
- [ ] **PAG-03** `PAYMENT_DELETED` vira `payment_failed` (`features/planos/gateway/asaas-gateway.ts:116`) e marca inadimplente sem olhar o status atual. Ao cancelar ou trocar de plano, o Asaas apaga a cobrança pendente, e quem cancelou vira "inadimplente". Confirmar no sandbox.
- [ ] **PAG-04** Estorno e chargeback são ignorados (`asaas-gateway.ts:112-118`): a pessoa mantém o acesso e o caixa não registra a saída. Inclui o arrependimento de 7 dias do CDC.
- [ ] **PAG-06** Inadimplente que assina de novo fica com a assinatura antiga viva no Asaas, que continua cobrando o cartão (`assinatura-service.ts:~690`, só cancela status `ativa`).
- [ ] **PAG-02** Os Termos publicados (v1) não falam de assinatura, preço, teste, bônus, cancelamento nem inadimplência. A v2 ainda tem `[RAZÃO SOCIAL]`, `[CNPJ]` e `[COMARCA]` em aberto. Depende de dados do Ramon e do jurídico.
- [ ] **PAG-08** `ASAAS_ENVIRONMENT=sandbox` e `PAYMENT_GATEWAY` estão em `[userenv.shared]` do `.replit`. Virar ali derruba o dev. Mover para `[userenv.production]` ou Secret do deploy, e validar no boot que a chave combina com o ambiente.
- [ ] **ADM-02** Não há como marcar conta interna ou de teste. As contas de homologação do time entram em MRR, conversão, cancelamentos e mês a mês. Criar a marca e aplicar em todas as métricas.

## 2. Alta (fazer antes de abrir ao público)

- [ ] **EMP-03** Excluir obra apaga as linhas mas deixa todos os arquivos no R2, públicos (`app/api/obras/[id]/route.ts:705-777`).
- [ ] **PUB-01** A seção "Endereço" do link promete esconder número e CEP, mas manda o endereço inteiro. O campo da criação pede "Rua, número e complemento" (`features/xgestao/obra-publica/server/projection.ts:144`). Hoje nenhum link ativo tem a seção ligada.
- [ ] **ADM-01** O detalhe de obra do admin reaproveita a projeção do cliente. Em conta Basic ou somente leitura, o admin não vê parcelas. Também faltam financeiro interno, equipe, anexos e quais seções cada link mostra. Atrapalha o suporte.
- [ ] **ADM-03** Falha de pagamento e webhook com erro não aparecem no admin do xgestão. Criar o card "Cobrança com problema" na home.
- [ ] **TST-01** A autenticação do webhook (token, IPs, trava em produção) não tem teste. Webhook forjado ativaria assinatura.
- [ ] **TST-02** Os testes de permissão por área do membro (`features/xgestao/equipe/permissions.test.ts`) não rodam em nenhum script.
- [ ] **TST-03 / EMP-05** O somente leitura só é testado em POST de coleção e na obra. Faltam PATCH/DELETE de subitens, link, membros e uploads. Escape real: presign/commit sem `obraId` e `DELETE /api/uploads/:id` funcionam em conta somente leitura.
- [ ] **TST-04** Troca de id entre obras (IDOR) só é testada no diário. O código filtra certo, mas falta teste para financeiro, etapas, tarefas, checklists, fotos, anexos, aditivos e equipe.

## 3. Decisões do Ramon

- [x] **PAG-05** Upgrade e downgrade cobram o valor cheio na hora e perdem o que restava do mês pago. Resolvido no [XG48](48-troca-de-plano.md): subir vale na hora com proporcional na próxima fatura; descer vale na renovação.
- [ ] **PAG-07** Quem assina no teste e cancela logo depois ganha +1 mês sem pagar nada. Sugestão: nesse caso, acesso até o fim do teste + 24h.
- [ ] **PUB-02** Link do cliente continua ativo com plano vencido ou cancelado. Manter (o cliente final não tem culpa) ou derrubar?
- [ ] **TST-05** A página `/xgestao-inteligente` vende "IA para Construção" e "tempo real", e o produto não tem nada disso. Tirar o texto?
- [ ] **PAG-14** O checkout exige CNPJ. Aceitar CPF?
- [ ] **TST-15** O Premium tem links ilimitados por obra, sem o teto de segurança de 5. Manter?
- [ ] **EMP-09** Ocorrência não pode ser editada, excluída nem reaberta, e a resolução não guarda observação. Entra no MVP?

## 4. Média

- [ ] **EMP-04** A quota de 200 MB por obra não conta fotos de diário e de ocorrência. Upload sem `obraId` escapa da quota, e o mesmo arquivo pode ser vinculado a várias obras.
- [ ] **EMP-06** Membro com área "equipe" sem "financeiro" vê valor de contrato e PIX dos prestadores.
- [ ] **EMP-07** Dono e gestor não conseguem excluir foto nem diário de colaborador.
- [ ] **EMP-08** Assinatura do checklist sem prova: nome livre e hora do relógio do cliente, guardada só como "HH:MM".
- [ ] **ADM-04** Erro de upload só vai para o console. Gravar em `app_errors` e contar por assinante.
- [ ] **ADM-05** Armazenamento usado por assinante não aparece no admin.
- [ ] **ADM-06** A home conta responsáveis sem empresa (8 no dev) e a lista não. Os totais divergem.
- [ ] **ADM-07** A home escolhe o plano por regra diferente da lista e do Financeiro.
- [ ] **ADM-08** Fuso: obra atrasada, vencidos do financeiro e mensalidade no caixa usam data UTC. Das 21h às 24h o dia vira antes da hora.
- [ ] **ADM-09** "Pagamentos atrasados" depende de um job que só roda no boot do servidor. Também mistura a receber e a pagar.
- [ ] **PAG-09** Se `ASAAS_WEBHOOK_IPS` for definido sem `TRUST_PROXY_HEADERS=1`, todos os webhooks são recusados. Usar só o token.
- [ ] **PAG-10** Assinaturas legadas `pro`/`enterprise` têm equipe ilimitada, e os planos legados seguem `ativo=true`.
- [ ] **PUB-03** O rate limit do link é em memória, cresce sem limite e, sem IP confiável, todos os visitantes dividem a mesma cota.
- [ ] **PUB-04** O token do link vaza para o Sentry pela URL.
- [ ] **TST-06 a TST-09** Faltam 401/403 em export CSV, `/api/xgestao/*` sem sessão, `admin/xgestao/obras/[id]`, e validação em tarefas e checklists.
- [ ] **TST-10** `/xgestao/planos/sucesso` (volta do checkout) sem teste de navegador.
- [ ] **TST-11** O CSV não neutraliza Tab e CR no início da célula (injeção de fórmula). `montarCsv` não tem unitário.
- [ ] **TST-12 / TST-13** Spec de API usando navegador sem skip, e testes que se pulam quando falta seed.
- [ ] **TST-19** Os specs do admin comparam totais globais entre duas chamadas e falham com 2 workers. Comparar só o delta da conta criada no teste.
- [ ] **TST-20** Teste de integração com POST na rota real do webhook (CONFIRMED + RECEIVED → um lançamento no caixa).

## 5. Baixa

- [ ] **EMP-10 / TST-18** Código morto: 6 modais sem uso e `XGestaoComingSoonPage`.
- [ ] **EMP-11** HEIC recusado com mensagem confusa, e `octet-stream` aceito como CAD.
- [ ] **EMP-12** Trocar contrato de membro ou capa deixa o arquivo antigo órfão.
- [ ] **EMP-14 / EMP-15 (suspeitas)** Data impossível (31/02) pode virar 500. Título de anexo com arquivo pode não aparecer.
- [ ] **ADM-10 a ADM-13** GET com efeito colateral, reativação fora do churn, busca de obras sem nome do link, 403 do export.
- [ ] **PUB-05 a PUB-09** Link sem validade por padrão, headers de segurança em `/publico`, token sem hash no banco, ocorrências e diário sem foto no link, id interno no payload.
- [ ] **PAG-12 / TST-16** Doc 39 desatualizado e restos do 9999.
- [ ] **PAG-13** Mudar preço no admin não altera as assinaturas já no Asaas. Documentar e avisar com 30 dias.
- [ ] **TST-14 / TST-17** Esperas fixas e unitários que procuram texto no arquivo-fonte.

## 6. Virada do Asaas para produção

Hoje o workspace usa chave sandbox, e nenhuma assinatura `asaas` passou ponta a ponta no banco de dev. Só cartão de crédito recorrente está habilitado (sem boleto e sem Pix).

Antes de virar:
- [ ] (código) Itens da seção 1 e PAG-08.
- [ ] (Ramon, Replit → Deployments → Secrets) O publicado tem os próprios valores:
  - `ASAAS_API_KEY` de produção;
  - `ASAAS_ENVIRONMENT=production` e `PAYMENT_GATEWAY=asaas`;
  - `ASAAS_WEBHOOK_TOKEN` novo;
  - `R2_*` com bucket ou prefixo de produção;
  - `E2E_TEST_AUTH` ausente;
  - `ASAAS_WEBHOOK_IPS` ausente.
- [ ] (Ramon) `NEXT_PUBLIC_BASE_URL` e `NEXTAUTH_URL` com o domínio final. Exige rebuild.
- [ ] (Ramon, painel Asaas de produção) Webhook em `https://<domínio>/api/webhooks/gateway`, com o token e os eventos PAYMENT_CREATED, CONFIRMED, RECEIVED, OVERDUE, DELETED, REFUNDED e SUBSCRIPTION_DELETED. Cadastrar o domínio do site e conferir que o cartão está liberado.
- [ ] (Ramon) Banco de produção: limpar assinaturas, eventos e `asaas_customer_id` de teste, e marcar `ativo=false` nos tiers legados.
- [ ] Depois do deploy: o log de boot mostra `asaas_env=production`, e a faixa "Ambiente de testes" sumiu.

Homologar já, no sandbox:
- Cartão de teste aprovado e recusado.
- "Confirmar recebimento" no painel, que gera CONFIRMED/RECEIVED e o lançamento no caixa.
- Antecipar o vencimento, que gera OVERDUE e inadimplente.
- Cancelar pela UI, que valida PAG-03.
- Estornar, que valida PAG-04.
- Assinar durante o teste, com 1ª cobrança futura.

Teste de compra em produção: o código não tem cupom nem plano oculto. Roteiro possível sem mudar código:
1. Conta própria, marcada como interna (ADM-02).
2. Baixar o Basic temporariamente para o mínimo do Asaas e assinar com cartão real.
3. Conferir assinatura, eventos, caixa e admin.
4. Cancelar e estornar no painel, depois voltar o preço.

O ideal é um plano `teste_interno` visível só para superadmin, com PAG-04 resolvido antes.

## Status da correção (10/11/2026, fim do dia)

Tudo sem commit, para o Ramon commitar pelo Replit.

**Feito e testado:**
- Uploads: EMP-01, EMP-02 (script de migração pronto, só simulado: `scripts/migrar-arquivos-obra-privados.ts --dry-run`), EMP-03, EMP-04, EMP-05, EMP-07, EMP-11, EMP-12, ADM-04.
- Equipe, checklist e ocorrências: EMP-06 (GET e PATCH), EMP-08, EMP-09 (edição completa: editar, excluir, reabrir, observação da resolução).
- Asaas e assinatura: PAG-01, PAG-03, PAG-04, PAG-05 (XG48, doc 48), PAG-06, PAG-07, PAG-08, PAG-10, PAG-12, PAG-14, TST-01, TST-20. A troca proporcional foi validada no Asaas sandbox real.
- Link do cliente: PUB-01, PUB-02 (fora do ar com conta em somente leitura), PUB-03, PUB-04, PUB-06.
- Admin: ADM-01 a ADM-13, conta interna, estorno na receita, obras e membros bloqueados pela troca de plano.
- Testes: TST-02 a TST-14, TST-16 e TST-19. DELETE de item inexistente ou de outra obra agora dá 404 (etapas, checklists, equipe).
- Texto de divulgação sem IA, sem "tempo real" e sem promessas que o produto não cumpre. A home troca "Comece pelo plano Freemium" por "Teste grátis por 3 meses".
- Mensalidade e estorno do xgestão entram no caixa com a data de São Paulo.

**Resultado da bateria final:**
- Typecheck limpo.
- Unitários: 368/368.
- Integração, em série: 381 passaram, 0 falharam, 8 pulados (condicionais: Asaas real, e-mail não verificado, jornada visual). Inclui CRM (XG49) e validação de pagamento (XG50).
- Navegador: obras, link do cliente no celular, somente leitura, retorno do checkout e troca de plano 15/15.
- Pendente: os 5 specs de navegador do admin. O dev (porta 5000) ficou com o schema antigo em memória depois de muitas recargas e responde 500 no admin (`syntax error at or near ","`). O mesmo código passa 15/15 na integração do admin num servidor novo.

**Falta (Ramon):**
- [ ] Dar Stop e Run no Replit para recarregar o dev. Depois, o Claude roda os 5 specs de navegador do admin.
- [ ] **Antes do próximo deploy:** cadastrar nos Secrets do deploy `PAYMENT_GATEWAY=asaas`, `ASAAS_ENVIRONMENT` e a chave do mesmo ambiente. Eles saíram de `[userenv.shared]` do `.replit`. Sem isso, o checkout publicado fica fora do ar.
- [ ] Conferir `R2_*` e `R2_KEY_PREFIX` do deploy (EMP-13).
- [ ] Preencher razão social, CNPJ e comarca nos Termos v2 e publicar (PAG-02).
- [ ] Pedir ao Asaas a tokenização de cartão em produção (necessária para a troca de plano).
- [ ] Rodar de verdade a migração dos arquivos para privados, depois do deploy (o script só foi simulado).
- [ ] Homologação manual no sandbox: compra, cancelamento, estorno, troca de plano para cima e para baixo.

**Validação final do pagamento (XG50, doc 50):**
- Mensal: 1 mês por pagamento a partir do vencimento, 1 lançamento no caixa, com CONFIRMED + RECEIVED, reenvio e fora de ordem.
- Anual: pronto e desligado; só com `valor_anual` preenchido e `anualAtivo` ligado.
- Teste e mês bônus: uma vez por conta e por CPF/CNPJ; tentativas bloqueadas ficam registradas.
- Nunca duas assinaturas cobrando: o checkout recusa e o webhook cancela a duplicada. Se a duplicada já foi paga, o valor é estornado sozinho pelo gateway, uma vez só (10/11/2026, doc 50 seção 11).
- CPF ou CNPJ obrigatório no 1º passo do wizard para o responsável do xgestão, antes do teste grátis começar (10/11/2026, doc 50 seção 10).
- Cancelar durante uma troca pendente no gateway dá 409 (REV-09, com lock e `FOR UPDATE`).
- Admin: segmento "Voltou depois de cancelar" e alerta "Cancela e volta com frequência" na lista, no detalhe e no CSV.
- Banco: migration 0015 aplicada no dev e incluída no bootstrap.
- Testes: typecheck limpo, unitários 368/368, integração 127 ok / 0 falhas / 5 pulados, navegador do retorno do checkout 1/1.

**Ficou para depois (baixa):** PUB-05, PUB-07, PUB-08, PUB-09, EMP-14, EMP-15, TST-17, TST-18 e o código morto restante (4 modais sem uso e `XGestaoComingSoonPage`). O job de vencidos (`mark-overdue-job.ts`) e o de testes vencidos rodam só no boot. As telas do admin e do empreiteiro já calculam na hora.
