# Jornada — XG22: a matemática do contrato e o contrato do prestador

> Status: ✅ implementado (verificação visual pendente) | Prioridade: alta | Wave: xgestão-22
> Última atualização: 2026-09-17

## 1. Contexto

Dois pedidos de `docs/novo-fluxo/ajustes/`, ambos com transcrição e print. Um era um bug de
cálculo que o cliente viu na tela; o outro, uma feature que transforma dado cadastral em
previsão de custo.

## 2. Os achados

### A1 — dois blocos da mesma tela discordando sobre o mesmo dinheiro

> *"Essa parte do financeiro está com erro de programação, e no dashboard também. Ele não está
> entrando ali com pagamentos, não está subtraindo quanto que falta receber. Tem que fazer essa
> parte de matemática aqui."*

O print prova o defeito melhor que o relato: **Receita total R$ 191.000** logo abaixo de
**Saldo a receber R$ 437.000,00** (o valor total cheio) e **Percentual recebido 0%**.

A causa estava em [`build-detalhe-server.ts`](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts):
`saldoReceber` e `percentualRecebido` derivavam de **`obras.valor_pago`**, enquanto vinte linhas
abaixo o mesmo arquivo já calculava `receitaTotal` corretamente, varrendo `financeiro` por
`recebedorUserId`. **Duas fontes de verdade para o mesmo número, e o saldo escolheu a errada.**

`obras.valor_pago` é escrita apenas por `quitarLancamento` e pelo webhook de split — fluxos do
**marketplace**, ocultado na XG05. No xgestão o lançamento **já nasce `status:"pago"`**, então
`quitarLancamento` nunca roda e nada jamais preenchia a coluna. Confirmado no banco de dev:
**de 519 obras, 1 tinha `valor_pago > 0`**.

### A2 — a armadilha que descartava a correção óbvia

A solução aparente seria materializar a coluna com o SQL de recompute que já existe. Ele filtra
`AND tipo = 'saida'` ([`lancamentos-service.ts:328`](../../features/financeiro/lancamentos-service.ts#L328)).

No marketplace, `saida` é saída **do contratante** — entrada para o empreiteiro. No xgestão,
`saida` é **custo**. Reusar aquele SQL somaria os R$ 60.400 de custo do print como "recebido":
um bug pior que o original, e silencioso.

### A3 — o contrato do prestador não existia em lugar nenhum

> *"No cadastro do prestador, coloca uma caixa para pôr a chave PIX dele também (...) e também o
> valor de contrato, ou até anexar um link, um PDF (...) E esse valor de contrato o sistema tem
> que puxar e colocar como prévia de gasto da obra (...) ele já vai conseguir mensurar meu custo
> de obra, não vai ser 100%, mas vai misturar uma boa parte."*

O pedido tem duas metades, e a segunda é a que dá valor: até aqui o console só sabia o custo
**depois** que o dinheiro saiu (`custoTotal` vem de saídas pagas). A soma dos contratos é o custo
previsto, disponível no dia em que o prestador é cadastrado.

A XG20 já havia ligado lançamento → membro (`fornecedorId`), então "quanto já paguei ao
Jefferson" era computável. Faltava o **previsto** para contrapor ao realizado.

## 3. Decisões

- **Saldo derivado dos lançamentos, não de coluna.** O loop de receita/custo subiu para antes do
  bloco de contrato e `valorPagoNum` passou a ser `receitaTotal`. Nenhuma query nova. Calcular na
  leitura é imune à ambiguidade do `tipo` (A2) e mantém os dois blocos coerentes **por
  construção** — mesma lição da XG21, que resolveu o reset do checklist sem cron.
- **Só entradas `pago` contam como recebido.** Fica idêntico à "Receita total" logo abaixo.
  Entrada pendente segue sendo "a receber", que é o sentido literal do rótulo.
- **A coluna morta não foi perseguida até o fim.** Outros 12 consumidores leem `obras.valor_pago`
  (dashboard do contratante, score de saúde, telas admin). Corrigi-los exige agregação **em
  lote**, não o loop por obra, e o marketplace depende da coluna de verdade via webhook Asaas.
  Esta jornada corrige o caminho do empreiteiro — o que o cliente relatou — e registra o resto
  como dívida (§5).
- **Reusar `obra_anexo` para o PDF**, em vez de criar um `kind` novo. Já aceita PDF, tem quota por
  obra e roles corretos. Um kind novo obrigaria a editar 9 arquivos, e
  `shared/lib/storage/key-builder.ts` registra que essa lista **já divergiu e quebrou upload em
  produção**.
- **"Arquivo OU link" validado sobre o estado final, não sobre o payload.** Num PATCH parcial, um
  `superRefine` só enxergaria o que veio no corpo: quem já tem PDF e manda só o link ficaria com
  os dois. A checagem compara o que **resultará** da edição.
- **`null` limpa, `undefined` preserva.** O formulário envia `null` explícito nos campos
  esvaziados — sem isso, remover o contrato ou a chave PIX não teria efeito nenhum no PATCH.
- **Prévia de gasto é soma de contratos firmados, não estimativa.** O rótulo diz de onde o número
  vem, e o card **some** quando não há contrato: zero ali não significa "obra barata", significa
  "ninguém preencheu ainda". Mesmo princípio que tirou o "lucro estimado" desta tela na XG12.
- **A soma sai de `equipeRows`, não do array `equipe`.** O array inclui contratante e empreiteira
  como entradas virtuais, que não têm linha no banco nem contrato. Inativos ficam de fora: quem
  saiu da obra não deve continuar pesando no custo previsto.

## 4. Checklist de execução

### Parte 1 — A matemática do contrato
- [x] Loop de receita/custo movido para antes do bloco de contrato; `valorPagoNum = receitaTotal`
- [x] Comentário longo no ponto da correção explicando por que `valor_pago` foi abandonada — sem
      ele, alguém "conserta" de volta para a coluna
- [x] `aReceber` do dashboard herda a correção (é o mesmo `saldoReceber`)
- [x] `Math.max(0, ...)` preservado: receita acima do contratado não vira saldo negativo

### Parte 2 — Contrato e PIX no prestador
- [x] `obra_equipe`: `pix_chave`, `valor_contrato NUMERIC(15,2)`, `contrato_file_id`,
      `contrato_link_url`
- [x] `server/bootstrap-obra-equipe-contrato.ts` + registro em `instrumentation.ts` **depois** de
      `obra-operacao` e `storage` (a FK aponta para `user_files`)
- [x] `migrations/0007_obra_equipe_contrato.sql` (documental, como as demais)
- [x] `features/obras/api/validar-contrato-membro.ts` — dono, `kind` e `deletedAt`
- [x] `equipe-contrato-schema.ts` compartilhado entre POST e PATCH
- [x] DELETE do membro passa a soft-deletar `user_files` + `deleteObject` best-effort — antes
      deixaria o PDF órfão no bucket
- [x] `MembroEquipe` + mapeamento na projeção, com URL assinada via `leftJoin` (sem N+1)
- [x] Modal: campos novos, os dois `form.reset`, `FileUploader`, `null` explícito ao limpar
- [x] Card do prestador exibe PIX, valor e link do contrato

### Parte 3 — A prévia de gasto
- [x] `custoPrevistoEquipe` em `ObraFinanceiro`, somado de `equipeRows` (ativos, com valor)
- [x] Card "Prévia de gasto com a equipe": previsto × já pago × ainda a desembolsar
- [x] Só aparece quando há contrato lançado

### Fechamento
- [x] `npm run check` (tsc) limpo
- [x] Bootstrap aplicado e conferido no banco: 4 colunas, tipos certos, FK presente,
      **idempotente** (rodado duas vezes)
- [x] 4 testes novos do saldo — entrada paga reduz, saída não mexe, pendente não conta, aditivo
      aumenta. A suíte antiga cobria `receitaTotal` mas **nunca** `saldoReceber`: foi por essa
      fresta que o bug passou
- [x] 3 testes novos da equipe — PIX/valor persistem e limpam, arquivo+link recusado, `javascript:`
      recusado, PATCH que criaria a combinação proibida recusado, soma ignora inativos
- [x] Teste de vazamento: PIX/valor/contrato ausentes da projeção pública (LGPD)
- [x] Suítes afetadas completas — **40/40 passando** (antigas + novas)
- [x] `npm run test:integration:gaps` — 0 endpoints críticos sem cobertura
- [x] **Verificação contra a projeção real** com os números do print: contratado 425.000 +
      aditivo 12.000, receita 191.000 → **saldo 246.000 e 44% recebido** (antes: 437.000 e 0%)
- [ ] Verificação visual: os dois blocos do financeiro batendo, modal com os campos novos, upload
      de PDF, card do prestador, prévia de gasto

## 5. Fora de escopo (dívida)

- **`obras.valor_pago` continua morta para 12 outros consumidores** — dashboard do contratante
  (`orcamentoExecutado` sempre 0), **score de saúde** (`shared/health/summary-server.ts`, cujo
  fator financeiro está permanentemente pessimista) e telas admin. Precisam de agregação em lote;
  o marketplace depende da coluna de verdade. Merece jornada própria.
- **`quitarLancamento` e `aplicar-evento-split` seguem com `AND tipo = 'saida'`** — correto para o
  marketplace, errado para o xgestão. Não tocado porque o xgestão não chama esses caminhos.
- **Um contrato por prestador.** Aditivo de contrato por prestador não entra agora; se o cliente
  pedir, o caminho é tabela própria, como foi com `obra_aditivos`.
- **Limites divergentes de validação** entre modal (80/50/200) e API (120/80/240) — dívida
  anterior, preservada.

## 6. Gaps descobertos

- **2026-09-17 — duas fontes de verdade a vinte linhas de distância.** O arquivo já calculava a
  receita certa e mesmo assim o saldo lia uma coluna estagnada. **Quando dois números da mesma
  tela saem de origens diferentes, a divergência é questão de tempo — e aparece primeiro para o
  usuário, não nos testes.**
- **2026-09-17 — a mesma palavra com sentidos opostos em dois subsistemas.** `tipo = 'saida'`
  significa recebimento no marketplace e despesa no xgestão. **Antes de reusar um SQL que já
  existe, conferir se o vocabulário dele é o mesmo do seu contexto** — aqui, reusar teria
  transformado custo em receita sem erro nenhum aparecendo.
- **2026-09-17 — o teste cobria o número certo pelo motivo errado.** A spec validava
  `receitaTotal` e passava, enquanto `saldoReceber` — derivado da mesma informação — estava
  quebrado e sem cobertura. **Cobrir uma métrica não cobre as que dependem dela.**
- **2026-09-17 — validação parcial não valida o resultado.** Num PATCH, checar só o que veio no
  corpo deixa passar combinações proibidas formadas com o que já estava no banco. **A regra vale
  sobre o estado final, não sobre o payload.**
- **2026-09-17 — `undefined` e `null` não são a mesma ausência.** Num PATCH parcial, `undefined`
  significa "não mexer": esvaziar um campo no formulário e mandar `undefined` faz o valor antigo
  sobreviver, sem erro. **Formulário que permite limpar precisa enviar `null` explícito.**

## 7. Links cruzados

- Depende de: [XG20](20-beneficiario-saida-e-datas.md) (o vínculo `fornecedorId` que torna o
  "já pago por prestador" computável), [XG12](12-console-obra-tela-unica.md) (a decisão de não
  exibir número estimado nesta tela)
- Origem: `docs/novo-fluxo/ajustes/solicitacao-valores-contrato.txt` + `.jpeg` e
  `solicitacao-membro-edicao.txt` + `.jpeg` (2026-09-17)
