# Jornada — XG23: a etapa vira dona do próprio avanço

> Status: ✅ implementado (verificação visual pendente) | Prioridade: alta | Wave: xgestão-23
> Última atualização: 2026-09-17

## 1. Contexto

Um pedido de `docs/novo-fluxo/ajustes/`, com duas transcrições e três prints. O cliente
descreve um defeito de comportamento e, no mesmo fôlego, propõe a solução — que passa por
desfazer uma decisão de arquitetura tomada na XG10.

## 2. O achado

> *"essa barra que fica ali embaixo, que seria a porcentagem da obra (...) tá vinculada com
> essa parte de etapas. Cara, tá uma bagunça aqui, tipo, eu crio uma etapa, uma tarefa dentro
> da etapa, aí se eu conclui essa tarefa, ela conclui a etapa (...) **exclui essa aba
> atualizações, exclui essa aba tarefas e exclui essa barra de porcentagem**, tá? Pode excluir,
> deixa 100. E aí (...) na parte de etapas (...) **eu coloco uma barrinha de cursor ali mesmo**,
> se eu colocar 10, 15, 20% e 100% na etapa (...) aí eu consigo pôr manualmente mesmo, porque
> eu acho mais fácil de fazer."*

A reclamação é verificável em código, e a causa é uma linha:

- [`tarefas/[tarefaId]/route.ts:84`](../../app/api/obras/[id]/tarefas/[tarefaId]/route.ts) —
  concluir tarefa força `progresso = 100`.
- Vinte linhas abaixo, a etapa é recalculada como **média não-ponderada** das tarefas.

Numa etapa com **uma tarefa só**, a média de um valor é o próprio valor: concluir a tarefa
fechava a etapa inteira. Exatamente o que ele narrou.

Havia um segundo defeito, que ele percebeu de outro ângulo ao pedir "deixa 100": `obras.progresso`
e `obra_etapas.progresso` eram **grandezas desconectadas**, com fórmulas diferentes —
acumulador de medições × média de tarefas. Dava para ter todas as etapas em 100% e a barra
"Progresso Geral" em 0%.

## 3. A inversão

O servidor **proibia** o que o cliente pediu. A XG10 havia fechado o caminho em
[`etapas/[etapaId]/route.ts`](../../app/api/obras/[id]/etapas/[etapaId]/route.ts) com um 409
`PROGRESSO_DERIVADO`, cuja mensagem dizia literalmente *"Registre uma atualização em vez de
digitar a porcentagem"*.

A XG10 estava certa **na premissa dela**: com o progresso derivado das tarefas, aceitar valor
digitado criava segunda fonte de verdade. O que mudou é a premissa. Desligamos a derivação; o
valor digitado passa a ser o único. Por isso o comentário no lugar do guard avisa que restaurá-lo
exige restaurar junto o que o alimentava — senão a etapa fica sem forma nenhuma de ter progresso.

## 4. Decisões

- **Só no xgestão.** O console é o mesmo arquivo para as duas rotas (`ObraConsoleView` serve
  `/empreiteiro/minhas-obras/[id]` e `/xgestao/obras/[id]`). No marketplace a atualização é
  medição contratual — o contratante aprova e isso libera pagamento. Tudo condicionado a
  `obra.isObraPropria` na UI e a `clienteId !== null` no servidor.
- **Ocultar, não apagar.** `tabsVisiveis()` ganhou `'atualizacoes'` e `'tarefas'`, ao lado de
  `'disputas'` e `'saude'` que já estavam lá. `AtualizacoesTab`, `TaskManagerSection`, a tabela
  `obra_tarefas` e as rotas seguem servindo marketplace, contratante e admin — e o cliente já
  avisou que as tarefas voltam ("posteriormente a gente vai querer implementar tarefas dentro da
  etapa"). README §3: reversibilidade é entregável.
- **Recálculo por média restrito ao marketplace**, via `etapaProgressoEhDerivado()`. Esconder a
  UI não bastava: as rotas continuam ativas, há **87 tarefas** em obras próprias no banco de dev,
  e bastaria tocar numa delas para a média apagar o valor digitado. Sem este gate, o defeito
  voltaria sozinho no dia em que as tarefas retornassem.
- **Barra de progresso fora, inclusive no link público.** Sem escritor, `obras.progresso`
  congelaria — e a barra do link público é a única leitura de avanço que o cliente final tem.
  Mostrar 0% para sempre é pior que não mostrar. O avanço continua visível lá, etapa por etapa.
- **Auto-coerência simétrica.** Já existia `progresso === 100 ⇒ concluido`. Com a barrinha,
  puxar de 100% para 80% é um gesto de um segundo, e a etapa ficaria "Concluído" exibindo 80%.
  Agora `< 100` reabre.
- **`input type="range"`, não o `Slider` do shadcn.** O componente Radix existe em
  `shared/components/ui/slider.tsx` mas **nenhum arquivo do projeto o usa**; os quatro modais com
  percentual usam `<input type="range" className="accent-primary">`. Seguimos o padrão real — e
  ele já é familiar ao cliente, porque vem de um dos modais que saíram.

## 5. Execução

- [x] `tabsVisiveis()` oculta Atualizações e Tarefas na obra própria
- [x] Guarda de aba inválida: `abaAtual` cai na primeira visível — sem isso a tela abriria com a
      barra de abas montada e o conteúdo vazio, porque o default era `'atualizacoes'`
- [x] Deep-link `?tab=medicoes` condicionado ao marketplace
- [x] Barra "Progresso Geral" e KPIs de Progresso/Tarefas escondidos na obra própria; grid de
      KPIs passa a 3 colunas
- [x] Barra de progresso removida do link público (`ObraPublicaShell`)
- [x] `ProgressoEtapaControl`: barrinha + número, com PATCH só ao soltar o cursor
- [x] Campo de percentual no modal "Editar etapa" (só na edição — etapa nasce em 0% e o POST não
      aceita o campo)
- [x] Prop `progressoDerivado` removida: com o percentual manual, ela valeria o mesmo nos quatro
      consumidores do card, e prop que ninguém varia é constante disfarçada
- [x] Guard 409 `PROGRESSO_DERIVADO` removido + auto-coerência simétrica
- [x] `etapaProgressoEhDerivado()` aplicado nos 4 pontos de recálculo
- [x] Tour reescrito e chave em `console-v3`: três dos sete passos apontavam para elementos que
      deixaram de existir

## 6. Testes

- [x] `xgestao-etapas-cronograma`: o teste do 409 **inverteu de lado** — agora assere que o valor
      digitado persiste, que 100% fecha e que voltar abaixo de 100 reabre
- [x] Teste novo de regressão: criar, concluir e excluir tarefa **não** mexem no percentual manual
      da etapa. É o que impede o defeito original de voltar quando as tarefas retornarem
- [x] `xgestao-share`: a asserção de `'35%'` virou `not.toContain('Progresso geral')`
- [x] Browser spec: trecho de tarefas trocado por edição do percentual com assert **depois do F5**
- [x] Bug pré-existente corrigido junto: o spec clicava na aba "Cronograma" esperando
      `card-etapas-j06`, que é da aba "Etapas"
- [x] Suíte: **505 passaram, 13 falharam** — as mesmas 13 pré-existentes, verificadas com
      `git stash` antes de começar (aprovação admin, curadoria, FAQ, entitlements, planos, J40)

## 7. Dívidas

- **`obras.progresso` sem escritor na obra própria.** A coluna continua no banco e é lida por
  KPIs e projeções, mas nada a atualiza. Não inventamos recálculo: o cliente pediu para tirar a
  consolidação, não para trocá-la. Quando as tarefas voltarem para dentro da etapa, a relação
  etapa↔obra se define de propósito.
- **Seção "Atualizações" do link público fica sempre vazia** em obra própria
  (`SECOES_PADRAO.atualizacoes = true`). Não mexemos no padrão porque isso alteraria links já
  emitidos.
  ✅ **Resolvida na [XG30](30-link-cliente-publicos-e-cronograma.md)**: a seção saiu do link.
- **`shared/components/ui/slider.tsx` continua sem nenhum uso** no projeto.
