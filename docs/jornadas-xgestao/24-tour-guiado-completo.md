# Jornada — XG24: o tour passa pela obra inteira

> Status: ✅ implementado (verificação visual pendente) | Prioridade: média | Wave: xgestão-24
> Última atualização: 2026-09-17

## 1. Contexto

Um pedido curto, feito em cima do tour que a XG23 acabara de reescrever. O cliente contou os
passos e percebeu que o roteiro não cobria a tela que ele tinha na frente.

## 2. O achado

> *"vi que tem 6 etapas... acha que não poderíamos fazer um tour completo? que passasse por
> todas as abas? (...) de modo que ele mostre de forma completa pq ele não passou por algumas
> abas, não passou por equipe nem edição de localização"*

A conta confere. `tourConsole()` tinha **6 passos** e o console da obra própria tem **9 abas
visíveis** mais cinco cards fora delas. O roteiro tocava a barra de abas por fora — dois passos
genéricos, "As etapas da obra" e "O dia a dia da obra" —, entrava de fato só em Etapas e não
mencionava Cronograma, Fotos, Diário, Ocorrências, Checklists, Documentos, Timeline, Financeiro,
Equipe nem Localização.

Não foi descuido de quem escreveu: **o roteiro encolheu**. Ele tinha 7 passos e perdeu três de
uma vez na XG23, quando a barra "Progresso geral" saiu da obra própria e a aba "Atualizações"
foi removida. Entraram dois sobre Etapas, que virou o centro da tela. O resultado ficou correto
e curto — e ninguém o reavaliou contra a tela que sobrou.

Ao abrir o componente para ampliar, apareceu o defeito que tornava isso invisível.

## 3. O silêncio que escondia o problema

[`GuidedTour.tsx`](../../features/xgestao/components/GuidedTour.tsx) media o alvo assim:

```ts
const element = document.querySelector(step.target);
setRect(element ? rectOf(element) : null);
```

Com `rect` em `null`, o balão é **centralizado na tela sem spotlight**. Alvo ausente e passo
deliberadamente sem alvo produziam exatamente o mesmo resultado — sem erro, sem log, sem
diferença visível para quem não conhece o roteiro.

A prova estava no próprio repositório: **dois `data-tour` órfãos** sobreviviam sem que ninguém
notasse. `progresso-geral` ([page.tsx:828](../../app/empreiteiro/minhas-obras/[id]/page.tsx)),
num elemento que só existe no marketplace, e `adicionar-atualizacao-aba`
([AtualizacoesTab.tsx:87](../../features/empreiteiro/minhas-obras/components/AtualizacoesTab.tsx)),
numa aba oculta na obra própria desde a XG23.

A espera pelo alvo também era curta demais para o roteiro novo: um `requestAnimationFrame` e um
`setTimeout` de 320ms, calibrados para a rolagem suave, não para o carregamento de uma aba. O
`AnimatePresence mode="wait"` com `duration: 0.15` consome parte dessa janela antes do painel
novo montar, e abas com fetch (Cronograma, Diário, Financeiro) consomem o resto. Passado o
prazo, nada remedia.

Com 6 passos numa página síncrona, isso nunca apareceu. Com 16 passos atravessando nove abas,
seria o comportamento padrão.

## 4. Decisões

- **Um tour único, não um menu de tours.** Anterior, Próximo, Pular, setas e Esc já existem no
  componente. Um roteiro linear usa o que está pronto; um menu exigiria tela nova e vários
  roteiros para manter. O hook já é parametrizado por nome (`useGuidedTour(tour, habilitado)`),
  então o menu, se vier, não obriga a refazer nada.

- **Escopo: o console da obra.** O botão "Ajuda" continua só nessa tela. Tour de dashboard,
  lista de obras e configurações ficou para outro momento, a pedido do cliente — e o custo real
  está registrado em §7.

- **Alvos na raiz do card, não no conteúdo.** `gantt-svg` só existe com etapas datadas,
  `valores-do-contrato` depende de contrato lançado, `button-nova-etapa` depende de permissão.
  Obra recém-criada é justamente quem vê o tour: mirar conteúdo condicional quebraria para o
  público certo. O Financeiro aponta para o painel da aba (`painel-aba`) pelo mesmo motivo.

- **Corrigir o motor junto, não depois.** Ampliar o roteiro sobre um componente que falha em
  silêncio seria multiplicar o silêncio por dezesseis.

- **O pulo automático respeita a direção da navegação.** Pular sempre para frente prenderia quem
  clicou "Anterior" num passo sem alvo: voltaria e seria empurrado de volta, sem entender por
  quê. Nas pontas do roteiro não há para onde pular, e aí o balão centralizado é a saída honesta
  — fechar o tour sozinho o marcaria como visto sem ter sido.

- **Chave `console-v4`.** Padrão do projeto desde a XG12 (`console` → `-v2` → `-v3`): roteiro
  reorganizado troca o sufixo. Sem isso, quem já usa o produto nunca veria o que foi acrescentado.

## 5. Execução

- [x] Espera ativa do alvo via `MutationObserver`, com teto de 1,5s, no lugar da janela fixa de
      320ms — o observer avisa no instante em que o painel monta, em vez de apostar num prazo
- [x] Passo com alvo declarado que não aparece é **pulado**, na direção em que o usuário navegava;
      passo sem `target` continua centralizado, como antes
- [x] `console.warn` em dev nomeando o passo e o seletor que não casou
- [x] Barra de progresso ao lado do contador: "Passo 9 de 16" não diz se vale continuar
- [x] Timer da rolagem suave cancelado no cleanup — sem isso, trocar de passo durante a rolagem
      mediria o alvo anterior e o spotlight pousaria no elemento errado
- [x] Seis âncoras novas: `aba-cronograma`, `aba-checklists`, `aba-documentos`, `aba-timeline`,
      `equipe-obra`, `localizacao-obra`, mais `painel-aba` para o Financeiro
- [x] Os dois `data-tour` órfãos removidos (os `data-testid` do mesmo elemento ficam — os specs usam)
- [x] Roteiro de 6 para **16 passos**, na ordem do ciclo de trabalho: abas → Etapas → avanço →
      Cronograma → Fotos → Diário → Ocorrências → Checklists → Documentos → Timeline → Financeiro
      → **Equipe** → capa → detalhes → **Localização** → link público
- [x] Chave `console-v3` → `console-v4`

## 6. Testes

- [x] Teste novo percorre o roteiro inteiro e assere **spotlight em cada passo** — é o que faltava
      e o que teria pego os dois órfãos. A obra é criada vazia de propósito: sem etapas, sem
      contrato, sem lançamento, que é o estado de quem acabou de entrar no produto
- [x] O mesmo teste confirma que concluir grava a preferência, que o F5 não reexibe e que "Ajuda"
      reabre no passo 1
- [x] `npm run check` limpo
- [x] `npm run test:e2e`: **505 passaram, 13 falharam** — as mesmas 13 pré-existentes da XG23
      (aprovação admin, curadoria, FAQ, entitlements, planos, J40), em arquivos que esta jornada
      não toca
- [ ] **Browser spec não executado neste ambiente**: faltam 22 bibliotecas de sistema para o
      Chromium subir (`libglib-2.0.so.0` entre elas). Vale para toda a suíte `--project=browser`,
      não só para o teste novo. Rodar `npm run test:e2e:xgestao` onde o browser exista
- [ ] Verificação visual pendente: desktop e celular (390×844, 320×568), obra com dados e obra vazia

## 7. Dívidas

- **Tour das demais telas do xgestão** (dashboard, lista de obras, configurações) — adiado a
  pedido do cliente. Registro do custo, para quando o tema voltar: o `GuidedTour` é
  **single-page** — mede via `querySelector` no DOM corrente e trava `body.overflow`. Cruzar
  rotas exige persistir o índice do passo entre navegações e retomar depois do carregamento.
  É mecanismo novo, não ampliação do atual. O hook já aceita nome de tour, então a parte de
  múltiplos roteiros está pronta.
- **A preferência do tour vive no `localStorage`**, não no perfil (dívida aberta desde a
  [XG09](09-administracao-obra-ponta-a-ponta.md)). Com 16 passos em vez de 6, trocar de
  dispositivo custa mais caro ao usuário do que custava antes.
- **Migração legada morta** em [`use-guided-tour.ts`](../../features/xgestao/hooks/use-guided-tour.ts):
  o branch de `xgestao-operation-guide-dismissed` só dispara para `tour === 'console'`, e a chave
  em uso é `console-v4` há três jornadas. Não atrapalha; é linha a limpar quando alguém passar por ali.
- **Sem `placement` no `TourStep`.** A posição do balão é automática (abaixo, ou acima se não
  couber). Funcionou para todos os 16 passos, mas um alvo muito alto no futuro pode pedir controle
  explícito.

## 8. Links cruzados

- Depende de: [XG23](23-etapas-progresso-manual.md) — que reescreveu o roteiro e o deixou com 6 passos
- Origem do componente: [XG09](09-administracao-obra-ponta-a-ponta.md) · encaixe no console:
  [XG12](12-console-obra-tela-unica.md) · correção no celular: [XG14](14-auditoria-console.md)
- Origem: print da conversa de 2026-09-17 (tour guiado incompleto)
