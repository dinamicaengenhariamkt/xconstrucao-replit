# XG49 · Admin: segmentos e contato (CRM)

**Status:** implementado no dev em 10/11/2026, sem commit (Ramon commita pelo Replit).
**Pedido do dono:** ver quem cancela, quem está prestes a expirar, quanto tempo falta do teste, separado por segmento e com o contato da pessoa, para contato e marketing.
**Fora deste lote (depende de decisão do dono):** opt-in de marketing e e-mails automáticos. Por isso o CSV não tem a coluna "Consentimento de marketing". Atualização: entrou no [XG52](52-marketing-e-emails.md), com as colunas de opt-in no CSV.

## 1. Regras

| Item | Regra | Onde no código |
|---|---|---|
| CRM-01 Contato | Telefone do usuário (`users.phone`), senão o da empresa (`empreiteiras.telefone`). CPF/CNPJ: CNPJ da empresa, senão o documento do usuário. Cidade e UF da empresa. Botão "WhatsApp" abre `https://wa.me/55<dígitos>` em nova aba e só aparece com telefone brasileiro válido (DDD + 8 ou 9 dígitos; celular começa com 9; aceita +55, 0 e máscara). Botão "E-mail" é `mailto:` | `escopo.ts` (`contato`), `lib/contato-assinante.ts`, `BotoesContato` (`AssinanteIndicadores.tsx`) |
| CRM-02 CSV por segmento | `GET /api/admin/xgestao/export?tipo=assinantes` aceita o mesmo recorte da lista (`situacao`, `janela`, `contato=nunca`, `q`, `ordem`) e aplica a MESMA função da tela (`aplicarSegmento`). O botão "Exportar CSV" manda o filtro ativo. Contas internas ficam fora sempre. O registro em `audit_logs` (`admin.xgestao.export`) leva o recorte, sem o texto da busca | `lib/segmentos-assinante.ts`, `export/route.ts` |
| CRM-03 Motivo do cancelamento | No diálogo de cancelar do empreiteiro: lista fechada OPCIONAL ("Preço alto", "Usei pouco", "Faltou alguma função", "Vou usar outra ferramenta", "Minhas obras acabaram", "Outro") e comentário livre opcional de até 500 caracteres. Fora da lista ou acima do limite: 400 e nada muda. Gateway de pagamento desligado: 503 `GATEWAY_NAO_CONFIGURADO`, como no checkout. A regra de acesso ao cancelar não muda. Marketplace ignora o motivo | `lib/motivo-cancelamento.ts`, `app/api/assinaturas/cancelar/route.ts`, `cancelarAssinatura` |
| CRM-04 Aguardando 1º pagamento | Situação nova "Assinou no teste, aguardando 1º pagamento": assinatura paga ativa, sem cancelamento, `primeiroPagamentoEm` nulo e 1ª cobrança (`renovaEm`) futura, **e** um sinal a mais: recebeu o mês bônus (`fimTesteEm`) ou o caixa não tem nenhuma mensalidade do cliente. A data mostrada é a da 1ª cobrança. Não entra no recorrente pago nem nos pagantes; aparece à parte no Financeiro. Com a 1ª cobrança em até 7 dias, entra em "Pedem atenção" (info) | `aguardandoPrimeiroPagamento` (`situacao-assinante.ts`), `calcularReceitaPorPlano` |
| CRM-06 Janelas e ordem | Filtros: "Teste acaba em até 7 / 3 / 1 dia" (em teste), "Renova em até 7 dias" (paga ou aguardando 1º pagamento), "Nunca usou no teste" (em teste ou na tolerância, sem nenhum registro nas obras). Ordenação por urgência (dias restantes, crescente), dias sem uso (quem nunca usou primeiro) e dias de atraso (decrescente). Tudo na URL | `casaJanela`, `ordenarSegmento` |
| CRM-07 Acompanhamento | Tabela `xgestao_admin_contatos` (responsável, empresa, admin, canal whatsapp/email/telefone/outro, nota até 1000 caracteres, data). No detalhe: "Registrar contato" e histórico. "Último contato" na lista e no CSV; filtro "Nunca contatado". Só admin; cada registro vai para `audit_logs` (`admin.xgestao.contato_registrado`) com canal e tamanho da nota, sem o texto | `server/contatos.ts`, `POST/GET /api/admin/xgestao/assinantes/[id]/contatos` |
| CRM-08 Cancelou / saiu | Chip e filtro próprios, separados de quem só terminou o teste sem assinar: já teve assinatura paga e hoje está em somente leitura. Mostra a data em que o acesso pago acabou (mesma regra da Conversão, `fimDoAcessoPago`), o motivo e o total já pago | `saidaDoAssinante` (`server/assinantes.ts`), `ChipsSegmento` |
| CRM-10 Trocas de plano | Chips e filtros "Descida agendada" (plano e data) e "Subiu de plano (30 dias)", lidos de `assinatura_trocas` só com status explícito (`agendada` / `aplicada`): `pendente_gateway` e `falhou` não contam | `trocasParaContato` |
| CRM-11 Estornos | Estorno e chargeback separados pelo `motivo` que o webhook grava no `payload_json` do evento `payment_refunded` (vem normalizado do gateway). Eventos antigos, sem o campo, caem no id guardado (`<EVENTO_ASAAS>:<paymentId>`): `PAYMENT_CHARGEBACK_*` e `PAYMENT_AWAITING_CHARGEBACK_REVERSAL` = chargeback; o resto = estorno. Lista no Financeiro por período (mês atual em São Paulo, 30 ou 90 dias) e CSV (`tipo=estornos&periodo=`) | `lib/estornos.ts`, `server/estornos.ts` |
| CRM-12 Dias em atraso | Inadimplente mostra "X dias em atraso" (desde o vencimento não pago) além do fim da carência | `situacaoAssinante` (`diasEmAtraso`) |
| Home | Atalhos para os segmentos mais urgentes: teste acaba em 7 dias, aguardando 1º pagamento, inadimplentes (por atraso) e cancelamentos agendados (por urgência) | `app/admin/xgestao/page.tsx` |

### Decisão: motivo em coluna da assinatura, não só no evento

O motivo fica em `assinaturas.motivo_cancelamento` e `motivo_cancelamento_texto`, e uma cópia vai no `payload_json` do evento `cancelamento_agendado` (histórico).

- Um cancelamento por assinatura: a coluna é o lugar natural e não precisa de JSON para contar.
- O resumo "Motivos de cancelamento" é um `GROUP BY` simples; o detalhe, a lista de saídas e o CSV leem a mesma coluna da assinatura que já carregam.
- O evento continua com o formato que o resto do sistema já lê (`acessoAte`, `motivo: "bonus_sem_primeiro_pagamento"`); a cópia usa outra chave (`motivoCancelamento`) para não colidir.

### Decisão: "aguardando 1º pagamento" exige um segundo sinal

`primeiro_pagamento_em` existe desde 10/11/2026. Assinaturas pagas antes disso têm a coluna nula. Olhar só a coluna faria clientes que já pagam aparecerem como "aguardando". Por isso a regra pede também o mês bônus (`fim_teste_em`) ou nenhuma mensalidade no caixa.

### Casos de borda

| Caso | Regra |
|---|---|
| Cancelou sem escolher motivo | Grava nulo; no resumo aparece como "Não informou" |
| Cancelou duas vezes | O 2º pedido não muda nada (regra existente); o motivo do 1º fica |
| Encerrada por estorno ou troca de plano | Não é pedido de cancelamento: não entra no resumo de motivos nem no campo "Motivo do cancelamento" |
| Telefone fora do padrão | Mostrado como veio, sem botão de WhatsApp |
| Conta interna | Fora da lista padrão, do CSV e dos estornos; o detalhe abre e aceita registro de contato |
| Tabelas ainda não criadas no ambiente | `xgestao_admin_contatos` e `assinatura_trocas` ausentes leem como vazias (sem quebrar a tela) |
| Busca no CSV | O texto da busca não vai para `audit_logs` (pode ser nome ou telefone); só se houve busca |

## 2. Tela

- **Lista** (`/admin/xgestao/assinantes`): chips de situação com "Assinou no teste, aguardando 1º pagamento", "Cancelou / saiu", "Descida agendada" e "Subiu de plano (30 dias)"; 2ª linha com as janelas e "Nunca contatado"; 3ª linha "Ordenar por". Coluna "Contato" compacta (telefone, cidade, botões). Sob o último acesso, "Contato em <data> (<canal>)" ou "Nunca contatado". A busca aceita telefone, CPF/CNPJ e cidade.
- **Detalhe**: telefone e botões no topo; chips de saída e trocas; "Motivo do cancelamento" no card do plano; cards "Contato" e "Acompanhamento" (registrar e histórico).
- **Conversão**: motivo e comentário em cada saída; card "Motivos de cancelamento" com período (mês atual, 30 ou 90 dias).
- **Financeiro**: "Aguardando o 1º pagamento" na nota da receita por plano; seção "Estornos e chargebacks" com período e CSV.
- **Home**: 4 atalhos de segmento, no mesmo card das métricas comerciais.
- **Empreiteiro** (aba Plano, diálogo de cancelar): motivo opcional e comentário com contador.

## 3. Dados

- Migration `migrations/0014_xgestao_admin_crm.sql`, espelhada em `server/bootstrap-xgestao-admin-crm.ts` (registrada em `instrumentation.ts`, dentro de `runBootstrap`: falha não derruba o boot). Aplicada no dev em 10/11/2026.
- `assinaturas.motivo_cancelamento TEXT`, `assinaturas.motivo_cancelamento_texto TEXT`.
- `xgestao_admin_contatos` com `CHECK` do canal e do tamanho da nota; índice `(user_id, criado_em)`.

## 4. Testes

| Teste | O que garante |
|---|---|
| `tests/unit/xgestao-admin-crm.test.ts` | Regras puras: aguardando 1º pagamento (com legado), dias em atraso, contato e WhatsApp, validação do contato, motivo, estorno x chargeback, janelas, ordem, URL x CSV, estrutura das telas |
| `tests/e2e/integration/xgestao-admin-crm.integration.spec.ts` | API e banco: situação nova fora do MRR, CSV do segmento, contato com 400/403/404/201 e audit, motivo na coluna/conversão/resumo, saída, chargeback no Financeiro e CSV, dias em atraso, trocas |
| `tests/e2e/xgestao-admin-crm.browser.spec.ts` | Navegador: empreiteiro cancela com motivo; admin vai da home ao segmento, vê contato e motivo, registra contato, Conversão e Financeiro |

## 5. Pendências

- Opt-in de marketing e e-mails automáticos por segmento (decisão do dono).
- Mascarar telefone e CPF/CNPJ para admin restrito, se o dono quiser limitar quem vê dado pessoal.
