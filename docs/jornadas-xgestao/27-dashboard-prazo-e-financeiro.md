# Jornada — XG27: o dashboard mostra prazo e dinheiro, não percentual

> Status: ✅ implementado (verificação visual pendente) | Prioridade: alta | Wave: xgestão-27
> Última atualização: 2026-09-20

## 1. Contexto

Áudio e print de `docs/novo-fluxo/ajustes/`, no mesmo lote da [XG26](26-remocao-mapa-localizacao.md).
O cliente abre o dashboard do xgestão, vê os números das suas obras e não reconhece nenhum deles.

## 2. O achado

> *"esse apartamento do Fernando, eu já coloquei lá no cronograma os executados, as porcentagens,
> tudo, mas é de etapas, né? E ele conta como 0%. E o outro, 100%. E eu acho que esse 0% e 100%
> que está aqui é aquilo que a gente pediu para tirar, né? Acho que tem que tirar do dashboard
> também."*
>
> *"o que pode mostrar no dashboard, eu acho que é saúde financeira, eu acho que é mais
> importante aqui. Só mostra no dashboard se está no prazo e o financeiro da obra como está. Se
> está verdinho, se está vermelho, entendeu?"*

São **duas queixas**, e só a segunda é um pedido de produto. A primeira é um bug.

**O bug tem causa única e verificável.** A [XG23](23-etapas-progresso-manual.md) moveu o avanço
para a barrinha de cada etapa e deixou `obras.progresso` **sem nenhum escritor** — dívida que a
própria XG23 registrou por escrito ("a coluna continua no banco e é lida por KPIs e projeções,
mas nada a atualiza"). O dashboard continuou lendo a coluna morta. Os dois números do print são
o mesmo defeito em dois estados:

- **0%** — obra cujo cronograma foi preenchido depois da XG23: a coluna nunca foi escrita.
- **100%** — valor congelado da última medição de **antes** da mudança.

Confirmado no banco de dev antes de escrever a correção: obras próprias com `obras.progresso = 0`
e média real das etapas em **80%**, **65%** e **30%**. Era exatamente isso que a tela exibia
como "0% executado".

## 3. Decisões

- **Consertar a origem, mesmo com o número saindo da tela.** Seria tentador só remover o
  percentual do dashboard e declarar resolvido — mas a mesma coluna morta alimenta o detalhe da
  obra e a aba Financeiro, que continuam mostrando o percentual. Remover o sintoma de uma tela
  deixaria o defeito vivo nas outras.

- **Na obra própria, a verdade é a média das etapas; no marketplace, a coluna.** Lá ela tem
  escritor ativo — é o acumulador das medições que o contratante aprova, com peso contratual — e
  substituí-la pela média de valores digitados sem aprovação inverteria o significado do número.
  O discriminador é o `clienteId` que o projeto já usa, **reusado** de `etapaProgressoEhDerivado`
  ([etapa-progresso.ts](../../features/obras/api/etapa-progresso.ts)) em vez de reimplementado.

- **Obra sem etapa devolve `null`, nunca 0.** Zero é uma afirmação — "esta obra não avançou" — e
  o que se sabe é outra coisa: que não há cronograma para medir. Devolver 0 reproduziria, com
  outra fonte, exatamente o defeito que esta jornada corrige. Daí o campo `progressoDisponivel`.

- **Isto não é o `HealthSummary` da [XG17](17-acabamento-console.md) voltando.** Aquela removeu a
  Saúde do xgestão inteiro porque ela "media, mas não comunicava": um score de 0 a 100 com três
  fatores ponderados exigia conhecer a régua por trás para significar alguma coisa. O que entra
  aqui são **duas perguntas que o dono da obra responde de cabeça** — atrasou? gastei mais do que
  o orçado? —, cada uma com **o número visível ao lado da cor**. Cor pura obrigaria a decorar a
  régua, que foi o defeito original. Por isso as funções são puras e curtas: a regra tem de caber
  numa frase, senão vira o que foi removido.

- **A paleta da Saúde é copiada, não importada.** Os tons verde/âmbar/vermelho de
  `HEALTH_DOT_CLASSES` servem, mas importar de `features/shared/health/**` traria junto o
  vocabulário "SAUDÁVEL / ATENÇÃO / RISCO". Volta o tom, não a régua.

- **Nenhum componente novo.** O [`StatsCard`](../../features/shared/components/StatsCard/StatsCard.tsx)
  já aceita `badge={{label, variant}}` com as variantes `success | warning | error | neutral` —
  exatamente os quatro estados de `Semaforo`. O dashboard do xgestão simplesmente nunca usava a
  prop.

- **`consumoOrcamento` do card do topo é razão de somas, não média de percentuais.** Média daria
  a uma obra de R$ 5 mil o mesmo peso de uma de R$ 500 mil, e o card responde "quanto da minha
  carteira já virou custo?".

- **Sem orçamento lançado o badge é cinza, não verde.** Sem denominador não há percentual, e
  verde afirmaria uma folga que ninguém verificou. Mesmo princípio do `null` do progresso.

- **"0 atrasadas" não vira badge.** Um selo verde permanente para dizer "tudo normal" é ruído; o
  sinal de prazo no card só aparece quando há atraso.

## 4. Execução

### Backend — de onde vem o número
- [x] [`progresso-obra.ts`](../../features/obras/api/progresso-obra.ts) — `resolverProgressoObra`
      (qual fonte, por produto) e `mediaProgressoEtapas` (soma em JS, para quem já tem as etapas
      em memória). Irmão de `etapa-progresso.ts`, um nível acima
- [x] [`indicadores-obra.ts`](../../features/xgestao/lib/indicadores-obra.ts) — `Semaforo`,
      `semaforoPrazo`, `semaforoFinanceiro` (verde <80%, âmbar 80–100, vermelho >100) e
      `situacaoObra`
- [x] [`build-detalhe-server.ts`](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts)
      — `mediaEtapasMap` (um `AVG` em lote, no padrão do `problemMap` que já existia) e `custoMap`
      (saídas pagas onde o dono é o pagador, agregadas no Postgres). Uma query por **lista**, não
      por obra
- [x] [`types/index.ts`](../../features/empreiteiro/minhas-obras/types/index.ts) — `MinhaObra`
      ganha `progressoDisponivel`, `diasAtraso`, `custoReal`, `consumoOrcamento` e
      `ocorrenciasAbertas`; `diasAtraso` **subiu** de `MinhaObraDetalhe`, onde era redeclarado

### UI — [`XGestaoDashboard.tsx`](../../features/xgestao/components/XGestaoDashboard.tsx)
- [x] `resumo`: sai a média de `obra.progresso`, entram `custoReal`, `consumo` e `atrasadas`
- [x] Card **"Progresso médio" → "Saúde financeira"**: custo real em R$ com badge colorido
      ("82% do orçamento" / "orçamento não lançado")
- [x] Card **"Obras ativas"** ganha o badge de atraso, que só aparece quando há alguma
- [x] Lista "Obras recentes": sai `{obra.progresso}% / executado`, entram as duas linhas de
      semáforo (prazo e financeiro), via o helper local `LinhaSemaforo`
- [x] `RiLineChartLine` sai do import; entra `RiWallet3Line`

## 5. Testes

- [x] **17 testes unitários passam** (`npm run test:xgestao:indicadores`): 9 do progresso, 8 dos
      semáforos. Cobrem as fronteiras que erram em silêncio — 79/80/100/101 no financeiro,
      "vence hoje ≠ atrasada" no prazo — e a não-regressão que mais importa: **marketplace
      continua lendo a coluna** mesmo com etapas preenchidas
- [x] `npm run check` limpo — é o que pegaria o import órfão do ícone e campo inexistente
- [x] **Verificado contra o banco de dev**, que é o que prova a correção do relato: obras próprias
      que a listagem reportava como `0` passaram a reportar **65%**, **30%** e **80%**, batendo
      com a média das etapas apurada por query independente
- [x] `npm run test:e2e`: **503 passaram, 15 falharam, 4 não rodaram** — as falhas estão em
      `curadoria-warning` (4), `xgestao-obras` (3), `admin-aprovacao` (3), `j40-financeiro-totais`,
      `xgestao-planos`, `xgestao-fundacoes`, `xgestao-atualizacoes`, `asaas-webhook-simulation` e
      `admin-real`. **Nenhum spec de dashboard, listagem ou cronograma falhou** — o caminho
      alterado aqui está verde
- [x] `xgestao-obras.integration.spec.ts`: **3 falhas, todas pré-existentes** — confirmado
      rodando a mesma suíte com as mudanças desta jornada em `git stash`, que reproduziu
      exatamente as mesmas três. Duas assertam o comportamento **anterior** à XG23 (`progresso: 10`
      vindo de medição na obra própria, e recálculo de etapa por média de tarefas) e ficaram
      desatualizadas quando aquela jornada inverteu a regra; a terceira é o Chromium que não sobe
      neste ambiente. Nenhuma toca o caminho alterado aqui — mas as duas primeiras são
      **dívida de teste da XG23**, registrada abaixo
- [ ] **Sem spec de browser**: nenhum teste cobre `data-testid="xgestao-dashboard-page"` hoje, e o
      Chromium não sobe neste ambiente (faltam bibliotecas de sistema), como
      [XG24](24-tour-guiado-completo.md), [XG25](25-cronograma-atraso-visivel.md) e
      [XG26](26-remocao-mapa-localizacao.md) já constataram. Escrever o spec quando houver browser
- [ ] Verificação visual em `/xgestao/dashboard`: nenhum "% executado" na tela; card "Saúde
      financeira" com a cor certa; obra sem orçamento em cinza e não em verde; obra atrasada em
      vermelho com a contagem de dias

## 6. Dívidas

- **O percentual continua em `/xgestao/obras` e no relatório PDF.** O card da lista usa o
  [`ObraCard`](../../features/shared/components/ObraCard/ObraCard.tsx), **compartilhado** com
  marketplace e contratante: mudá-lo exige prop opt-in, no padrão do `luminous` da XG13. Decisão
  explícita de escopo — o pedido era sobre o dashboard. Agora o número está **certo** nas duas
  telas, então a divergência é de formato, não de dado.
- **O filtro "Progresso (%)"** ([MinhasObrasView.tsx:243](../../features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx))
  segue ativo. Enquanto o percentual existir na lista ele não fica órfão — mas fica no dia em que
  a dívida acima for paga. É o mesmo gap que a XG17 registrou com o `?saude=`.
- **`obras.progresso` continua sem escritor no xgestão.** Esta jornada para de **ler** a coluna
  morta na obra própria, mas não a remove nem a preenche. Enquanto ela existir, qualquer leitor
  novo pode repetir o defeito.
- **Dois testes da XG10 asseveram o comportamento que a XG23 removeu.** Em
  [`xgestao-obras.integration.spec.ts:103`](../../tests/e2e/integration/xgestao-obras.integration.spec.ts)
  (medição na obra própria devolvendo `progresso: 10`) e `:421` (etapa recalculada por média das
  tarefas). Falham desde a XG23 e **não** foram introduzidos aqui — verificado por execução com
  as mudanças em stash. Não foram corrigidos nesta jornada porque decidir o que eles **deveriam**
  assertar é decisão da XG23, não desta: se medição na obra própria ainda deve mexer em algum
  progresso, e se a rota de tarefa deve mesmo parar de recalcular a etapa. Enquanto isso, são
  duas falhas vermelhas que mascaram regressões futuras no mesmo arquivo.

## 7. Gaps descobertos

- **2026-09-20 — remover um número da tela não conserta o número.** O pedido do cliente era "tira
  do dashboard", e obedecer só a isso teria escondido o defeito em vez de corrigi-lo — a mesma
  coluna morta segue alimentando o detalhe e a aba Financeiro. **Quando o pedido é remover algo
  que está errado, vale perguntar se o erro é só daquela tela.**
- **2026-09-20 — dívida registrada não é dívida contida.** A XG23 anotou com todas as letras que
  `obras.progresso` ficaria sem escritor, e ainda assim o defeito chegou ao cliente três jornadas
  depois. **Registrar a dívida documenta a decisão, mas não protege quem lê a coluna: só um
  `null` explícito, ou a remoção da coluna, faria isso.**
- **2026-09-20 — o cliente rejeitou a métrica, não a cor.** A XG17 removeu a Saúde por ilegível, e
  aqui o mesmo cliente pediu espontaneamente "se está verdinho, se está vermelho". A diferença
  entre o que ele recusou e o que pediu não é o semáforo — é o que fica ao lado dele: um score
  ponderado que exige conhecer a régua, contra um número que ele mesmo digitou. **Cor é bom
  resumo de um dado legível e disfarce ruim de um dado que não é.**

## 8. Links cruzados

- Depende de: [XG23](23-etapas-progresso-manual.md) — que moveu o avanço para as etapas e criou a
  coluna órfã · [XG22](22-valores-contrato-e-contrato-prestador.md) — que já havia abandonado
  `obras.valor_pago` e derivado o financeiro dos lançamentos, regra reusada no `custoReal`
- Relacionado: [XG17](17-acabamento-console.md) — a saída da Saúde, cujo erro este dashboard
  evita repetir · [XG15](15-coerencia-saude-e-progresso.md) — a primeira tentativa de alinhar
  Saúde e progresso
- Origem: `docs/novo-fluxo/ajustes/solicitacao-dashboard-ajuste-xgestao.{json,jpeg,ogg}` (2026-09-20)
