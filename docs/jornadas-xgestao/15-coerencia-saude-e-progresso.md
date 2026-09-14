# Jornada — XG15: Coerência da Saúde da obra, do progresso e da linguagem

> Status: ✅ pronto | Prioridade: alta | Wave: xgestão-15
> Última atualização: 2026-09-14

> **Ponto de retomada:** o checklist da §5 é a fonte de verdade. Cada item marcado `[x]`
> está feito e verificado; `[ ]` é o que falta. Se a sessão cair, continuar do primeiro
> `[ ]` de cima para baixo.

## 1. Contexto

Revisão final antes de subir. A pergunta que abriu a jornada:

> *"A parte de saúde da obra, que o cliente tinha reportado, está até na transcrição, que
> estava confuso... por que ficava com a saúde da obra comprometida, sendo que estava
> dentro do prazo? Você contemplou isso?"*

**Não estava contemplado.** A XG10 corrigiu metade do problema e a outra metade
sobreviveu — em silêncio, porque nenhum teste cobria o cenário.

## 2. Os achados

### A1 — a Saúde ainda punia quem trabalha

Simulação com os pesos reais do produto. Obra **no prazo**, nada pendente no financeiro,
o empreiteiro cria **1 tarefa e marca "em andamento"** (começou a trabalhar):

```
fator tarefas = 0  →  score 75  →  status: RISCO
```

É a fala da reunião, literal: *"Eu comecei só para encher, o negócio já está dando risco
para mim"* (11:42) e *"Eu tô executando o serviço, tá dando alerta"* (28:00).

**Causa:** [build-detalhe-server.ts:321](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts#L321)
conta `tarefasPendentes` como *tudo que não está concluído* — incluindo `em_andamento`.
O comentário da linha seguinte cita a **mesma** frase do cliente e diz *"Separar dá ao
card o número que ele promete"*: a XG10 criou `tarefasEmAndamento` e corrigiu **o KPI
visível**, mas o **score continuou lendo o contador antigo**. Meia correção.

### A2 — planejar a obra derrubava a saúde

```
Obra no prazo, 0% de progresso, nada lançado:
  sem nenhuma tarefa cadastrada  →  score 100 · Saudável
  cadastrou 8 tarefas do plano   →  score  75 · Risco
```

O produto **premiava quem não o usava**. E explicava com uma frase falsa — *"Muitas
tarefas pendentes ou bloqueadas"* — numa obra sem nada bloqueado, onde o sujeito acabara
de planejar. Um fator individual abaixo de 40 sobrepõe o status geral
([calculate.ts:54](../../features/shared/health/calculate.ts#L54)), então bastava o fator
tarefas zerar para a obra inteira virar "Risco".

### A3 — a etapa despencava para 0% ao concluir tarefas pelo checkbox

Concluir tarefa pelo **checkbox** — o caminho mais natural para um leigo — enviava
`progresso: null`. O servidor tinha guarda para isso, mas só para `undefined`; o `null`
explícito passava. A tarefa ficava concluída **sem valor**, e o recálculo da etapa usa
`COALESCE(progresso, 0)` — contava como **zero**.

Efeito visível: o usuário conclui 7 de 7 tarefas, a aba Tarefas mostra **"7/7 completas"**
e a etapa vai para **0%**, com a barra do Gantt vazia.

### A4 — quatro nomes para o ato central do produto

Botão "Adicionar Atualização" → modal **"Registrar medição"** → erro "…registrar a
medição" → tour "Registrar um avanço". Em obra própria, "medição" é vocabulário de
marketplace (onde o contratante aprova) e não significa nada. O componente **já sabia
distinguir** (`isOwnWork ? 'Salvar atualização' : 'Enviar medição'`) — só não aplicava no
título nem no toast.

Mais dois textos apontando para o lugar errado: *"crie etapas pelo Cronograma"* e *"Use
'Nova etapa' para definir o cronograma"*. O Cronograma é só o gráfico; etapas se criam na
aba **Etapas**. Vocabulário antigo que sobreviveu à renomeação que o cliente pediu.

### Verificado e descartado

Duas acusações do levantamento que **não se confirmaram** na leitura do código:

- **A rota PATCH de tarefa já recalcula a etapa** (`shouldRecalculate`,
  [route.ts:85](../../app/api/obras/[id]/tarefas/[tarefaId]/route.ts#L85)). O defeito era
  só o `null` — escopo bem menor que o relatado.
- **O onboarding não está "desligado"** em `/empreiteiro/minhas-obras/[id]`: essa é a rota
  do **marketplace**, onde o empreiteiro não deve editar obra alheia. O X Gestão entra por
  `/xgestao/obras/[id]`, que recebe `allowOwnWorkEdit`. É separação de permissão por
  design, não falha.

## 3. Decisões

- **Corrigir, não remover** a Saúde. O cliente não pediu para tirar o indicador — pediu
  que ele fizesse sentido. A simulação mostrou que dá para corrigir sem transformá-lo em
  enfeite (§4).
- **Peso 0,7 para tarefa em andamento**, escolhido por simulação e não por palpite.
- **Progresso corrigido agora**, não depois do teste: o cliente vai concluir tarefas pelo
  checkbox e veria a etapa cair para zero.

## 4. A régua nova (simulada antes de escrever o código)

| cenário — obra no prazo | antes | depois |
|---|---|---|
| 1 tarefa em andamento | **75 Risco** | 93 Saudável |
| 10 tarefas todas em andamento | **75 Risco** | 93 Saudável |
| 8 tarefas só cadastradas (plano) | **75 Risco** | 100 Saudável |
| 10 tarefas, nenhuma iniciada, obra andando | 75 Risco | **75 Risco** (mantém) |
| 5 em andamento + 2 problemas abertos | Risco | **Risco** (mantém) |

Obra parada continua em risco. Problema aberto continua alertando. O que muda é só o
tratamento de **trabalho em curso** e de **plano recém-cadastrado**.

## 5. Checklist de execução

### Parte 1 — Saúde da obra
- [x] `HealthObraInput` aceita `tarefasEmAndamento` (aditivo, opcional)
- [x] Fator de tarefas com crédito parcial (`PESO_EM_ANDAMENTO = 0.7`)
- [x] Plano cadastrado e nada iniciado ⇒ fator neutro (100)
- [x] `build-detalhe-server.ts` passa `tarefasEmAndamento` ao cálculo — já enviava o
      campo (linha 710) e o console passa a obra inteira: fluiu sem alteração
- [x] `summary-server.ts` idem (lista, dashboard e `GET /api/obras/[id]/health`)
- [x] Mensagens com número e ação, no lugar das genéricas
- [x] Testes unitários dos cenários novos — **12/12 passando**

### Parte 2 — Progresso
- [x] Concluída grava 100 mesmo com `progresso: null` explícito
- [x] Reabrir zera para 0 em vez de `null`
- [x] Verificar se há etapas com valor errado no banco — **nenhuma**: nas 15 etapas com
      tarefas vinculadas o progresso bate com a média atual e não há tarefa concluída sem
      valor. O defeito existia no código mas ainda não fora acionado; **reconciliação
      desnecessária**

### Parte 3 — Linguagem
- [x] Um nome só para o ato central (título, toast e validação por `isOwnWork`)
      \+ ajuda no campo "Avanço", que era o mais consequente e não tinha nenhuma
- [x] Textos que mandavam ao "Cronograma" apontam para "Etapas"
- [x] Data de etapa: dizer a consequência + **datas na listagem**, com aviso
      "Sem datas — não aparece no cronograma" por etapa
- [x] Empty state de Etapas (explica o conceito + botão "Criar primeira etapa")
- [x] Empty states de Tarefas (separa "obra nova" de "filtro vazio"), Ocorrências
      (vocabulário aproximado do KPI "Problemas Abertos" + placeholders) e Lançamentos
      (botões de ação dentro do bloco vazio)

### Fechamento
- [x] `npm run check` limpo
- [x] Testes de saúde passando — **12/12**
- [x] Validação do cenário do cliente pela API (ver §5.1)
- [x] Regressão do console — 12 abas, sem overflow, **zero erro de JS**
- [x] Regressão do marketplace — `luminous-card=0`, `luminous-section=0`, sem overflow
- [x] Vocabulário por contexto (xgestão "atualização" × marketplace "medição") — ver §5.2
- [x] README e XG10 atualizados

### 5.1 — O cenário do cliente, validado pela API

Sequência real contra `/api/obras/[id]/health`, criando e limpando os dados:

```
[1] obra sem tarefa               → saudavel  score 100   (linha de base)
[2] plano cadastrado (1 tarefa)   → saudavel  score 100   (antes: RISCO 75)
[3] tarefa EM ANDAMENTO           → saudavel  score 100   (antes: RISCO — o relato)
[4] concluída pelo checkbox       → tarefa.progresso = 100 (antes: null)
                                     etapa.progresso  = 100 (antes: caía para 0)
```

E o indicador **continua alarmando** onde deve — senão a correção teria virado enfeite:

| cenário | fator | status |
|---|---|---|
| 10 tarefas, 1 andando, 9 nunca iniciadas | 7 | **risco** |
| metade do plano parada | 35 | **risco** |
| 3 problemas abertos, todos trabalhando | 46 | **atenção** |
| atraso de 20 dias | — | **risco** |
| trabalhando, sem problema | 70 | saudável |

### 5.2 — Vocabulário por contexto: o varrimento

A §4 (A4) corrigiu o **caminho principal** — botão, título do modal e toast de sucesso. O
varrimento completo achou mais seis pontos onde "medição" ainda chegava ao dono da obra, e
**um deles não era texto**: era um tipo de atividade ambíguo.

| onde | o que dizia | por que vazava |
|---|---|---|
| [use-atividades.ts](../../features/atividades/hooks/use-atividades.ts) (título + descrição) | "Medição aprovada" · "Medição #N aprovada em…" | **o mais grave** — ver abaixo |
| [AtualizarProgressoModal.tsx](../../features/empreiteiro/minhas-obras/components/AtualizarProgressoModal.tsx) ×2 | "nenhuma medição nova foi enviada" · "Não foi possível registrar a medição" | o modal **já recebia** `isOwnWork`; dois toasts ignoravam a flag |
| [RegistrarMedicaoModal.tsx](../../features/empreiteiro/minhas-obras/components/RegistrarMedicaoModal.tsx) ×2 | "a etapa que está sendo medida" · "valor definido para esta medição" | idem — validação e ajuda de campo ficaram de fora da A4 |
| [medicoes/route.ts](../../app/api/empreiteiro/medicoes/route.ts) | "Muitas medições enviadas em pouco tempo" | 429 chega ao usuário como toast |

**O achado que não era de texto.** A Timeline do console rotulava **toda atualização da
obra própria** como *"Medição aprovada"*. A causa: a rota grava
`tipo: ownWork ? "medicao_aprovada" : "medicao_criada"`, e o mesmo tipo carrega **dois
fatos diferentes** — no marketplace, "o contratante aprovou"; no xgestão, "o dono registrou
um avanço", onde não existe ninguém para aprovar. A camada de exibição não tinha como
distinguir: recebia só o tipo.

Corrigido gravando `ownWork` no payload e ramificando por ele → **"Avanço registrado"**.
Atividades gravadas antes da mudança não têm o campo e caem no rótulo antigo, que continua
correto para o marketplace. Sem migration.

> Um `case` que significa duas coisas conforme quem o gravou não é um texto errado — é um
> tipo que perdeu informação na origem. Renomear o rótulo teria quebrado o marketplace.

**Fora de alcance, verificado:** aba Disputas (filtrada na obra própria),
`/empreiteiro/pagamentos`, configurações e busca global do marketplace — nenhuma montada no
shell do xgestão. O tour do console e a `AtualizacoesTab` **já estavam corretos**, assim
como todos os cards J06 de `features/obras/medicoes/**`, que apesar do nome da pasta não
têm um único texto com "medição".

## 6. Fora de escopo (dívida)

- **Gantt no celular:** a coluna de nomes rola junto com o gráfico e some; o percentual
  só existe no `title` (hover, inacessível no toque); obra de 2 anos gera ~5.900px de
  scroll. **Está certo:** linha de "hoje", aviso de etapas sem data, legenda de status.
- **Duas fórmulas de progresso de etapa** (média quando há `etapaId`, acumulador quando
  casa por nome) em `app/api/empreiteiro/medicoes/route.ts:225-247`, e `status` da etapa
  editável à mão mas revertido pela medição seguinte. Muda regra de negócio e atinge o
  marketplace — merece jornada própria, com o cliente ciente.
- **Alerta de documento "vencendo"**: `venceEmDias` e `status: 'vencendo'` nunca são
  produzidos pelo servidor. Alerta inalcançável, código morto.
- **Contratante passando lançamento como medição** para disputas (marketplace, da XG14).

## 7. Gaps descobertos

- **2026-09-14 — meia correção é a mais perigosa:** a XG10 separou `tarefasEmAndamento`
  para o KPI e deixou o score lendo o contador antigo, com o comentário da correção
  **uma linha acima** do trecho não corrigido. O sintoma visível sumiu e o cliente
  acreditou que estava resolvido. **Corrigir o que aparece sem corrigir o que calcula
  esconde o bug em vez de fechá-lo.**
- **2026-09-14 — o teste que não existia era exatamente o do cliente:** os 7 testes de
  saúde cobriam só o financeiro — a metade que a XG10 arrumou. Nenhum tocava em tarefa em
  andamento. **Teste escrito junto com a correção cobre a correção, não o relato.**
- **2026-09-14 — renomear o botão não renomeia o ato:** a A4 trocou botão, título e toast
  do caminho principal e a linguagem *parecia* resolvida. O varrimento achou mais seis
  pontos, incluindo a Timeline chamando toda atualização de "Medição aprovada". Quatro
  deles estavam em componentes que **já recebiam `isOwnWork`** e simplesmente não o usavam.
  **Quando a correção é uma flag que já existe, o trabalho não é decidir — é varrer.**
- **2026-09-14 — vocabulário errado às vezes é modelagem errada:** "Medição aprovada" na
  obra própria não era escolha ruim de palavra; era um `tipo` de atividade carregando dois
  fatos distintos conforme quem gravou. **Antes de reescrever o texto, conferir se a camada
  que o exibe recebeu informação suficiente para escolher.**
- **2026-09-14 — o produto punia quem o usava:** cadastrar o plano de tarefas derrubava a
  obra de "Saudável" para "Risco". **Um indicador que piora quando o usuário trabalha
  está medindo uso, não saúde.**

## 8. Links cruzados

- Depende de: [XG10](10-ajustes-teste-obra-real.md) (Bloco 5 — Saúde e KPIs), [XG14](14-auditoria-console.md)
- Origem: conversa de 2026-09-14 + [transcrição de 2026-09-12](../novo-fluxo/reuniao-xconstrucao-testes-xgestao.json) (11:42, 25:39, 28:00)
