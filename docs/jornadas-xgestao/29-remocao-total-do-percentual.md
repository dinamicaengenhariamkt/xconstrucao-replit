# Jornada — XG29: o percentual de execução sai das telas do xgestão, por inteiro

> Status: ✅ implementado (verificação visual pendente) | Prioridade: alta | Wave: xgestão-29
> Última atualização: 2026-09-21

## 1. Contexto

Terceira vez que o mesmo percentual volta à conversa. A [XG23](23-etapas-progresso-manual.md)
tirou do console e do link público; a [XG27](27-dashboard-prazo-e-financeiro.md) e a
[XG28](28-dashboard-tabela-e-entrada.md) tiraram do dashboard. O cliente abriu **Minhas Obras** e
encontrou o número lá.

## 2. O achado

> *"Aqui em minhas obras também tá aparecendo esse progresso aqui ó. Só que a gente não tem
> controle sobre essa quantidade, entendeu? Independente da informação que você coloque lá, ele
> não tá modificando essa porcentagem. (...) Uma vez que a gente removeu essa porcentagem, peço
> que você rastreie em todos os itens do gestão, seja no card, seja na interna da obra, seja no
> dashboard."*

A frase do meio é a mais importante e muda o diagnóstico. **O número não está mais errado.** Desde
a XG27 o progresso da obra própria vem da média das etapas, não da coluna morta — ele responde,
sim, ao que o dono digita no cronograma. O que o cliente descreve é outra coisa: ele mexe no
cronograma, vê o card não refletir o que esperava, e conclui que o número é decorativo. Um
percentual que agrega etapas de pesos diferentes **nunca** vai se mover como a intuição pede.

Por isso a resposta certa não era consertar de novo. Era terminar a remoção.

**Rastreamento do produto inteiro** (verificado no código, não presumido):

| Tela | Estado antes desta jornada |
|---|---|
| Console da obra (hero e KPI) | ✅ XG23, atrás de `!obra.isObraPropria` |
| Abas Atualizações / Tarefas / Saúde | ✅ inalcançáveis — `tabsVisiveis()` as oculta |
| Link público | ✅ XG23 |
| Dashboard | ✅ XG27 / XG28 |
| **Card da listagem** | 🔴 exibia — é o print |
| **Aba Financeiro → "Percentual executado"** | 🔴 exibia o mesmo número com outro rótulo |
| **Filtro "Progresso (%)"** | 🔴 8 pontos |
| **Badge SAUDÁVEL/RISCO no card** | 🔴 resquício da [XG17](17-acabamento-console.md) |

## 3. A causa raiz: a flag que não se propagava

`MinhasObrasView` recebe `xgestao` e usa a flag em dez lugares — mas **chamava
`MinhasObrasGrid` sem ela**, e nem `MinhasObrasGridProps` nem `MinhaObraCardProps` tinham campo de
produto. O card compartilhado **não tinha como saber em que produto estava**.

Isso explica por que três jornadas passaram por perto sem resolver: quem olhou o card não tinha o
discriminador à mão, e quem tinha o discriminador não estava olhando o card. E explica por que o
percentual **e** o badge de saúde sobreviveram na mesma tela — uma lacuna, dois sintomas.

## 4. Decisões

- **Slot, não flag, no componente compartilhado.** A primeira versão desta jornada deu ao
  `ObraCard` uma prop `isObraPropria` e um `if` interno. Isso fez `features/shared/` importar de
  `features/xgestao/` — **inversão de dependência**: o card do contratante passaria a arrastar o
  xgestão junto. A versão final troca por `indicadores?: React.ReactNode`, um slot que o
  `MinhaObraCard` preenche. O compartilhado não sabe que o xgestão existe; quem conhece o produto
  é o card do produto.

- **O que entra no lugar são os sinais do dashboard.** Prazo e orçamento consumido, de
  [`indicadores-obra.ts`](../../features/xgestao/lib/indicadores-obra.ts) — as duas perguntas que
  o dono responde de cabeça, e que a XG27 já havia escolhido. Card e dashboard passam a falar a
  mesma língua.

- **Os sinais não substituem a linha "Orçamento / Prazo" do rodapé.** As duas coexistem porque
  respondem a perguntas diferentes: os sinais dizem **como está** (no prazo? estourou?), a linha
  diz **quanto é** (R$ 380.000, 10/08 a 30/11). Repetir o assunto não é repetir a informação.

- **`SinalObra` sai do dashboard e vira componente.** Nasceu local na XG27; com o card exibindo o
  mesmo sinal, ficar em dois lugares significaria duas paletas divergindo — e o ponto destes
  indicadores é justamente que as duas telas digam a mesma coisa da mesma forma.

- **O badge de saúde sai junto.** Mesma cadeia, mesmo corte: sem `healthStatus`, o `ObraCard` não
  renderiza badge — nenhuma mudança nele para isto. Fecha a decisão da XG17 ("Saúde sai do xgestão
  inteiro"), que parou antes desta tela.

- **O filtro sai, e sai inteiro.** Esconder só o campo deixaria um valor residual filtrando
  invisivelmente — exatamente o bug que o comentário da XG17 descreve sobre o `?saude=`. O guard
  vai também na lógica de filtragem e no contador.

- **"Percentual executado" sai da aba Financeiro.** É `financeiro.percentualExecutado`, que no
  servidor é **literalmente `progresso`** ([`build-detalhe-server.ts:678`](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts)):
  o mesmo número que o cliente mandou remover, com outro rótulo, numa aba que o xgestão alcança.
  **"Percentual recebido" fica** — aquele é financeiro de verdade.

- **Prop nova em vez de reusar `podeLancar`.** Os dois carregam `isObraPropria` hoje, mas
  significam coisas distintas: um é permissão de escrita, o outro é exibição. Misturá-los faria
  "quem pode lançar" decidir "o que se vê", e no dia em que a permissão mudasse a barra voltaria
  sem ninguém relacionar as coisas.

- **O admin fica de fora.** Decisão do usuário nesta sessão: `/admin/xgestao` vira jornada própria,
  com atenção dedicada. Ver dívidas.

## 5. Execução

- [x] `MinhasObrasGridProps` ganha `xgestao`; `MinhasObrasView` passa a flag adiante — o elo que
      faltava
- [x] [`ObraCard`](../../features/shared/components/ObraCard/ObraCard.tsx): slot `indicadores`
      substituindo o bloco de progresso quando preenchido
- [x] [`MinhaObraCard`](../../features/empreiteiro/minhas-obras/components/MinhaObraCard.tsx):
      monta os dois sinais na obra própria
- [x] [`MinhasObrasGrid`](../../features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx):
      `healthStatus` deixa de ser passado no xgestão
- [x] [`SinalObra`](../../features/shared/components/SinalObra.tsx) extraído do dashboard, com
      `textoPrazo` e `textoOrcamento`
- [x] Filtro "Progresso (%)": guard nos 8 pontos, no padrão da XG17
- [x] [`FinanceiroTab`](../../features/empreiteiro/minhas-obras/components/FinanceiroTab.tsx):
      barra "Percentual executado" fora na obra própria; o grid vira coluna única
- [x] **Bug latente da XG17 corrigido de passagem**: o `ActiveFilterChip` de Saúde não tinha guard
      `!xgestao`. Com `?saude=risco` na URL, o chip aparecia no xgestão anunciando um filtro que
      não filtrava nada
- [x] **Fetch desperdiçado cortado**: `useObrasHealthMap` ganhou `enabled` e é desligado no
      xgestão. Rodava **duas vezes** na árvore (View e Grid), e o resultado era inteiramente
      descartado — um request de rede e um `computeHealthMapForObras` sobre todas as obras da
      empreiteira, por nada

## 6. Testes

- [x] `npm run check` limpo — é o que pegaria o slot mal tipado e o import órfão
- [x] `npm run test:xgestao:indicadores` — 17/17
- [x] `npm run test:unit` — 35/36, igual à base (a falha de `admin-xgestao-navigation` é
      pré-existente, confirmada por execução com as mudanças em stash na XG28)
- [ ] **Verificação visual em `/xgestao/obras`**: nenhum "Progresso" e nenhuma barra; nenhum badge
      SAUDÁVEL/ATENÇÃO/RISCO; prazo e % do orçamento no lugar; "Filtros avançados" sem o campo
      Progresso; **e na aba Rede: nenhuma chamada a `/api/empreiteiro/obras-health`**
- [ ] **Não regrediu no marketplace**: `/empreiteiro/minhas-obras` e `/contratante/minhas-obras`
      seguem com progresso, badge de saúde e filtro. É a verificação que protege o outro produto
- [ ] Obra do xgestão, aba Financeiro: só "Percentual recebido"

## 7. Dívidas

- **O admin (`/admin/xgestao`) mostra progresso em 4 pontos** — card "Progresso médio" do painel,
  linha do painel, coluna da tabela e `StatsCard` do detalhe. E, achado desta investigação, **lê
  `obras.progresso` direto**: o painel interno ainda exibe o 0%/100% do bug original, que nunca foi
  corrigido lá. Fora de escopo por decisão do usuário; vira jornada própria.
- **`RelatorioObraModal` é código morto** — nenhum arquivo o importa, e exibe "Progresso Geral".
  Não é alcançável, mas é armadilha para quem o religar.
- **O payload do link público ainda projeta `progresso`**
  (`obra-publica/server/projection.ts:56,228`) embora nenhuma UI o leia.
- **`ObraPickerSheet` (xchat) mostra progresso** e é compartilhado. O xchat não está na navegação
  do xgestão hoje; se entrar, o percentual volta sem ninguém perceber.
- **Nenhum teste cobre a ausência.** O card e os filtros não têm spec assertando que o percentual
  *não* aparece no xgestão — e uma remoção sem teste é uma remoção que volta. O browser não sobe
  neste ambiente; quando subir, é o primeiro spec a escrever.

## 8. Gaps descobertos

- **2026-09-21 — remover por tela não remove do produto.** Três jornadas tiraram o percentual de
  onde estavam olhando, e ele sobreviveu exatamente onde ninguém rastreou. **Quando a decisão é
  "isto sai do produto", o trabalho é um inventário do produto inteiro, não uma edição na tela que
  motivou o pedido.**
- **2026-09-21 — a flag que não se propaga vira bug em cascata.** O mesmo `xgestao` parado na
  `View` manteve o percentual **e** o badge de saúde. Dois relatos distintos do cliente, em
  jornadas diferentes, com uma única causa. **Antes de investigar dois sintomas na mesma tela,
  vale checar se o discriminador chega até ela.**
- **2026-09-21 — o mesmo dado com dois rótulos escapa de qualquer busca por rótulo.**
  "Percentual executado" é `progresso` renomeado no servidor. Procurar por "Progresso" na UI nunca
  o encontraria. **Rastrear remoção pelo caminho do dado, não pelo texto na tela.**
- **2026-09-21 — o número consertado continuou incomodando.** A XG27 corrigiu a origem e ele
  passou a responder ao cronograma; o cliente ainda o descreve como travado. Uma média de etapas
  com pesos diferentes nunca se move como a intuição espera. **Dado correto que não corresponde ao
  modelo mental de quem lê é indistinguível de dado errado.**
- **2026-09-21 — prop opt-in num componente compartilhado pode inverter a dependência.** A
  primeira tentativa fez `features/shared/` importar `features/xgestao/`. Um slot resolve sem
  acoplar. **Quando o compartilhado precisa saber quem o chama, o que falta geralmente é um
  buraco, não uma flag.**

## 9. Links cruzados

- Depende de: [XG27](27-dashboard-prazo-e-financeiro.md) — os sinais de prazo/orçamento e os
  campos que os alimentam
- Fecha: [XG17](17-acabamento-console.md) — "Saúde sai do xgestão inteiro", que parou antes do
  card · [XG23](23-etapas-progresso-manual.md) — que começou a remoção do percentual
- Origem: print de `/xgestao/obras` em produção + áudio do cliente (2026-09-21)
