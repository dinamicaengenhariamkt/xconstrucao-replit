# Jornada — XG28: a tabela de visão geral, e o dashboard como porta de entrada

> Status: ✅ implementado (verificação visual pendente) | Prioridade: alta | Wave: xgestão-28
> Última atualização: 2026-09-21

## 1. Contexto

Segunda rodada sobre o mesmo dashboard, desta vez com o print da
[XG27](27-dashboard-prazo-e-financeiro.md) **já em produção**. Os dois sinais que aquela jornada
entregou — prazo e orçamento — aparecem corretos na tela do cliente. A queixa mudou de natureza:
não é mais "o número está errado", é "a tela não me serve como visão geral".

## 2. O achado

> *"na tabela, ele está mostrando, na esquerda, o nome da obra, e, na direita, apenas se está no
> prazo e a porcentagem do orçamento. Acho que seria interessante a gente fazer em formato de
> tabela (...) Veja direitinho para a gente ter essa tabela rica aí, para o cara ter a visão
> geral ali logo no começo."*
>
> *"Assim, quando a gente logar na plataforma do xgestão com os nossos usuários, ele pode estar
> direcionado para a parte de dashboard. O cara vai ter a visão geral, e se ele quiser, para
> minhas obras, ele navega até o menu."*

Três problemas, e o segundo não estava à vista no print:

1. **"Obras recentes" não era uma tabela.** Era uma lista de duas colunas — nome à esquerda, dois
   semáforos à direita. Sem cabeçalho, cada sinal só significava algo para quem já sabia o que
   era, e não havia como comparar obras entre si.
2. **O dashboard não era a porta de entrada.** Verificado no código: **onze** pontos mandavam o
   usuário do xgestão para `/xgestao/obras` — login, callback do OAuth, cadastro, três landings,
   o `/xgestao` nu, o layout, o "Ver como" do admin e os dois logouts. O dashboard só era
   alcançável clicando no menu. Exatamente o inverso do fluxo que o cliente descreveu — e ele
   pediu a mudança sem saber que o produto fazia o contrário.
3. **Espaço ocioso.** Com uma obra, dois terços da tela ficavam vazios abaixo da lista.

## 3. Decisões

- **Tabela de verdade, com cabeçalho.** Sete colunas: Obra, Status, Entrega, Prazo, Gasto,
  Orçamento e Ocorrências. O cabeçalho é metade do ponto — é ele que diz o que a bolinha verde
  significa sem o dono da obra precisar adivinhar.

- **O percentual de execução continua fora.** A XG27 o removeu porque **mentia** (lia
  `obras.progresso`, coluna sem escritor desde a XG23). Essa causa foi corrigida e o número hoje
  está certo — mesmo assim o cliente, perguntado diretamente, preferiu não trazê-lo de volta.
  **Consertar o dado não reabre automaticamente a decisão de exibi-lo**: ele saiu por errado e
  ficou fora por não ser o que o dono da obra quer ver no primeiro olhar.

- **As colunas novas são todas campo que já existia.** `ocorrenciasAbertas`, `custoReal`,
  `diasAtraso` e `consumoOrcamento` vieram da XG27; `dataPrevisaoFim` já era exposto formatado. A
  única adição é `statusObra`, e ela **sobe** de `MinhaObraDetalhe` — mesma manobra que a XG27 fez
  com `diasAtraso`, custo zero porque a query já traz a linha inteira de `obras`.

- **`statusObra`, não `status`.** O `status` que a listagem já expunha é o **derivado da UI do
  marketplace** (`em_execucao | com_atrasos | com_pendencias`): ele mistura atraso e pendências,
  que agora têm coluna própria. Uma obra pausada apareceria como "com atraso". A coluna Status
  pede o estado que o dono escolheu, que é o enum cru — renderizado por `obraStatusDbLabel`, que
  existe justamente para impedir que `em_andamento` vaze com underscore para a tela.

- **Linha inteira clicável, e isso não tinha precedente.** Todas as tabelas do projeto usam link
  ou botão por célula. Inaugurar o padrão custa o cuidado de não transformar "clicar na linha" em
  recurso exclusivo de quem usa mouse: o nome da obra **continua sendo um `<Link>` real** (é o
  que o leitor de tela anuncia e o que faz ctrl+clique abrir em nova aba), e o `onClick` da linha
  existe só para ampliar a área de acerto — decisivo no celular, que é onde o dono da obra abre
  isso, em campo. A linha **não** recebe `role="link"` nem `tabIndex`: duplicar o alvo de teclado
  faria a mesma obra ser anunciada duas vezes.

- **Responsividade em cascata, com eco do dado escondido.** Nenhuma tabela do projeto que usa
  `ui/table` trata mobile — todas apenas rolam na horizontal. O padrão bom está em
  [`app/admin/obras/page.tsx`](../../app/admin/obras/page.tsx), e é o que seguimos: as colunas
  somem em `sm:` → `md:` → `lg:` → `xl:`, e o que some **reaparece como subtítulo sob o nome da
  obra**. No celular sobram Obra, Prazo e Orçamento, e nenhuma informação é perdida.

- **Zero ocorrência vira traço, não "0".** A ausência de problema não é um número a contar, e o
  traço deixa a coluna quieta quando está tudo bem.

- **Nenhum card novo.** O cliente perguntou se cabiam mais quatro. Não cabem: os quatro cards são
  a leitura da **carteira** (totais) e a tabela é a leitura **por obra**. Mais cards repetiriam,
  em agregado, o que cada linha já diz — e o espaço vazio do print não era falta de card, era
  tabela pobre.

- **"Orçamento gerenciado" → "Orçamento total".** É a soma do orçamento de todas as obras;
  "gerenciado" sugeria uma distinção inexistente, e o próprio cliente perguntou se era o valor de
  uma obra só. Quando o nome gera a pergunta, o nome é que está errado.

- **Uma constante para o destino de entrada, não onze edições.** `XGESTAO_HOME` mora em
  [`features/xgestao/routes.ts`](../../features/xgestao/routes.ts) — arquivo novo e **sem
  dependências**, separado de `constants.ts` de propósito: aquele importa ícones do `react-icons`
  para o menu, e quem consome a rota é o `redirect-by-role`, no caminho de login. Fazer o redirect
  arrastar a árvore de ícones seria acoplar coisas sem relação.

## 4. Execução

### A tabela — [`XGestaoDashboard.tsx`](../../features/xgestao/components/XGestaoDashboard.tsx)
- [x] `<Table>` de `@shared/components/ui/table` no lugar da lista com `divide-y`
- [x] `ObraRow` extraído como componente, no padrão do `MovimentacaoRow` do admin
- [x] Sete colunas com visibilidade em cascata + eco do dado escondido na primeira célula
- [x] `LinhaSemaforo` generalizado (ganhou `className`; o `justify-end` fixo servia à lista
      alinhada à direita e atrapalhava na célula)
- [x] Card renomeado e a `formatCurrency` **local** trocada pela `formatCurrencyRounded` do
      `shared` — eram idênticas, e o dashboard mantinha uma cópia privada sem motivo

### O dado — [`build-detalhe-server.ts`](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts) e [`types/index.ts`](../../features/empreiteiro/minhas-obras/types/index.ts)
- [x] `statusObra` sobe para `MinhaObra` e sai da redeclaração em `MinhaObraDetalhe`
- [x] Preenchido a partir de `o.status`, que já estava em memória

### A entrada — [`routes.ts`](../../features/xgestao/routes.ts) e os onze pontos
- [x] `XGESTAO_HOME`, `XGESTAO_OBRAS`, `XGESTAO_HOME_ENCODED` e `XGESTAO_LOGIN_HREF`
- [x] `redirect-by-role.ts` (destino pós-login), `login/page.tsx` (OAuth), `cadastro/page.tsx`,
      `xgestao/page.tsx`, `xgestao/layout.tsx`, as três landings, o `GlassNav` e os dois logouts
- [x] **`UsuariosTab.tsx` parou de reimplementar a regra à mão** e passou a chamar
      `getRedirectPathByRole`. A cópia manual já havia divergido: quando o destino mudou, só a
      função canônica acompanhou. O fallback local (`/contratante/dashboard`) foi preservado de
      propósito — ali já existe sessão de admin ativa, e o `/login` que a função devolve para role
      desconhecida seria um beco sem saída

## 5. Testes

- [x] **`xgestao-dashboard.integration.spec.ts` — novo, 2 testes, ambos passam.** Cobre o buraco
      que a XG27 deixou: os seis campos que alimentam a tabela **não tinham nenhuma asserção** (os
      specs existentes verificam só `id`, `temContratante` e `isObraPropria`). Protege também as
      duas decisões que um refactor desatento desfaz sem perceber — obra sem orçamento devolve
      `consumoOrcamento: null` (não 0, que pareceria folga total) e obra sem cronograma devolve
      `progressoDisponivel: false` (não 0%, que foi a queixa original)
- [x] **3 testes novos em `admin-xgestao-redirect.test.ts`** (8/8 passam). Havia um buraco real: os
      casos existentes passavam `/xgestao/obras` como `next` **explícito**, ou seja, testavam a
      allowlist, não o destino que o produto escolhe sozinho. O default — o que acontece quando
      alguém simplesmente loga — não tinha asserção nenhuma, e era exatamente o que esta jornada
      mudou
- [x] **`npm run test:unit` criado.** Os dez arquivos de `tests/unit/` rodavam e passavam, mas
      **nenhum script os executava** — existiam fora de qualquer rotina
- [x] `npm run check` limpo
- [x] `npm run test:xgestao:indicadores` — 17/17, sem regressão na régua dos semáforos
- [x] Verificado no servidor de dev que `/xgestao/dashboard` e `/xgestao` já redirecionam com
      `next=%2Fxgestao%2Fdashboard`
- [ ] **Verificação visual**: tabela com cabeçalho e colunas alinhadas; linha clicável por mouse e
      por teclado; `—` onde não há dado; **celular sem rolagem horizontal**, com os dados
      escondidos aparecendo sob o nome da obra
- [ ] **Fluxo de entrada ponta a ponta**: logar e confirmar que cai no dashboard; repetir pelo
      OAuth e por uma landing; confirmar que quem não concluiu o onboarding continua indo para
      `/onboarding`, que tem precedência sobre tudo isto

## 6. Dívidas

- **`/xgestao/obras` continua com o `ObraCard` antigo**, onde o percentual de execução ainda
  aparece. Herdada da XG27, agora com uma diferença a mais: a lista mostra percentual e o
  dashboard mostra prazo/orçamento. O card é compartilhado com marketplace e contratante, então
  mudá-lo exige prop opt-in.
- **O badge "SAUDÁVEL/ATENÇÃO/RISCO" ainda vive nos cards de `/xgestao/obras`**
  ([`MinhasObrasGrid.tsx:27`](../../features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx)
  passa `healthStatus` sem checar `xgestao`), além de um fetch de saúde que roda à toa. Registrado
  na XG27 e ainda em pé — a XG17 tirou o resumo, o card do console e o filtro, mas não este.
- **Sem paginação na origem**: `listMinhasObrasReal` traz todas as obras da empreiteira sem
  `limit`, e o dashboard corta em 5 no cliente. A carteira inteira trafega para exibir cinco
  linhas — irrelevante com dezenas de obras, relevante com centenas.
- **A tabela não ordena, e não dá para ordenar por data.** O projeto inteiro não tem sort de
  tabela (nenhum header clicável em lugar nenhum), e `dataInicio`/`dataPrevisao` são **`text`** no
  banco, não `date`, chegando ao cliente já formatados em pt-BR. Ordenar por prazo exigiria expor
  o ISO ao lado.
- **Os dois testes da XG10 que falham desde a XG23** continuam vermelhos
  (`xgestao-obras.integration.spec.ts:103` e `:421`). Não são desta jornada e decidir o que
  deveriam assertar é decisão da XG23.

## 7. Gaps descobertos

- **2026-09-21 — o cliente pediu uma mudança sem saber que o produto fazia o oposto.** Ele
  descreveu "quando logar, ele pode estar direcionado para o dashboard" como um ajuste, e o
  produto mandava todo mundo para a lista, por onze caminhos independentes. **Vale checar no
  código o fluxo que o pedido pressupõe: às vezes o "ajuste" é a descoberta de que o
  comportamento atual é outro.**
- **2026-09-21 — repetição idêntica esconde acoplamento.** Os onze hardcodes de `/xgestao/obras`
  conviviam sem incomodar ninguém justamente porque eram **iguais**. O problema só apareceu ao
  tentar mudá-los: trocar dez e esquecer um faria o destino depender de por onde a pessoa entrou.
  **Constante repetida só é inofensiva enquanto ninguém precisa mudá-la.**
- **2026-09-21 — consertar o dado não reabre a decisão de exibi-lo.** O percentual saiu na XG27
  por mentir; a causa foi corrigida e ele hoje está certo. Perguntado, o cliente preferiu mantê-lo
  fora. **"Estava errado" e "não deve aparecer" são dois motivos distintos, e corrigir o primeiro
  não revoga o segundo.**
- **2026-09-21 — campo novo sem teste é campo que some em silêncio.** A XG27 acrescentou cinco
  campos à listagem e nenhum ganhou asserção; a tabela inteira desta jornada depende deles. **Um
  campo de API sem teste não quebra ruidosamente: ele vira `undefined` numa célula e a tela só
  fica vazia.**

## 8. Links cruzados

- Depende de: [XG27](27-dashboard-prazo-e-financeiro.md) — que corrigiu o dado e expôs quase todos
  os campos que esta tabela exibe
- Relacionado: [XG23](23-etapas-progresso-manual.md) — origem da coluna morta ·
  [XG17](17-acabamento-console.md) — a saída da Saúde, cujo vocabulário esta tabela evita ·
  [XG22](22-valores-contrato-e-contrato-prestador.md) — o financeiro derivado dos lançamentos
- Origem: `docs/novo-fluxo/ajustes/` — print do dashboard em produção + áudio (2026-09-21)
