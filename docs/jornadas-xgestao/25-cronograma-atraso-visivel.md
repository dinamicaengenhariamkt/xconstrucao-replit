# Jornada — XG25: a barra do cronograma mostra o atraso

> Status: ✅ implementado (verificação visual pendente) | Prioridade: média | Wave: xgestão-25
> Última atualização: 2026-09-18

## 1. Contexto

Um pedido de uma frase, com print da obra real do cliente. Ele apontou duas etapas pelo nome e
descreveu exatamente o que via.

## 2. O achado

> *"aqui na parte de cronograma, poderia mudar a cor da barra quando está em atraso? Exemplo
> Gesso liso e paredes.. está como andamento mas já esgotou o prazo, poderia ficar vermelha a barra"*

O print confirma linha por linha. "Forros de gesso" e "Gesso liso e paredes…" terminam **à
esquerda da linha tracejada de hoje** e continuam azuis, como "Em andamento".

A causa está numa linha:

- [`CronogramaGanttCard.tsx:226`](../../features/empreiteiro/minhas-obras/components/CronogramaGanttCard.tsx) —
  `const cor = STATUS_COR[etapa.status]`.

E `status` é escolhido à mão. Ninguém volta na etapa para marcá-la de atrasada no dia em que o
prazo vira — então o gráfico desenhava a **intenção**, não o fato. A informação já estava na
tela, porque a linha "Hoje" é desenhada desde a XG10; faltava o usuário não precisar comparar
barra a barra com ela.

Havia um segundo sintoma, interno: o fator "atraso" do card de Saúde já leva o usuário a esta
aba ([page.tsx:1234](../../app/empreiteiro/minhas-obras/[id]/page.tsx),
`atraso: { label: 'Ver cronograma' }`). Ele chegava aqui procurando o atraso e não encontrava.

## 3. Decisões

- **Atraso é derivado, nunca gravado.** O [`obraEtapaStatusEnum`](../../shared/db/schema.ts) tem
  quatro valores e não ganhou um quinto: "atrasada" é `prazo < hoje && status !== 'concluido'`,
  recalculado a cada render. É o que o projeto já faz para a obra, onde `mapStatus` deriva
  `com_atrasos` de `diasAtraso`. Sem migração — e a etapa não fica com um status errado gravado
  no dia em que alguém corrigir a data.

- **A regra é código novo, e isso custou uma dívida.** A única implementação existente é
  `diasAtrasoFor` ([build-detalhe-server.ts:75-81](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts)),
  privada do módulo, server-only e sobre a obra. Não dá para reusar no client. Mantivemos a
  forma, cientes de que a regra passa a existir em três lugares — ver §7.

- **Vermelho mais fechado, com contorno.** `bloqueado` já era `#ef4444`. Atrasada é `#b91c1c`
  com contorno `#7f1d1d`: dois vermelhos próximos só se distinguem lado a lado, e o contorno
  resolve também para quem tem dificuldade com matizes. Fica no trilho, não no preenchimento —
  ele envolve a barra inteira, então marca o atraso mesmo numa etapa com pouco avanço, onde o
  preenchimento é um toco de poucos pixels.

- **A cor do atraso mora fora de `STATUS_COR`.** Duas razões: a legenda itera
  `Object.keys(STATUS_COR)`, e uma chave a mais ali apareceria como se atraso fosse status; e o
  tipo daquele mapa é `Record<ObraEtapaApi['status'], …>`, que só aceita os quatro do enum. A
  entrada da legenda é avulsa, no mesmo estilo da de "Hoje".

- **Atraso vence sobre bloqueado.** Uma etapa bloqueada e vencida está nos dois estados, e o
  prazo estourado é o urgente. O status original continua legível no tooltip da barra e no badge
  da aba Etapas, que não mudou.

- **`hoje` não é recalculado.** `grafico.hoje` já existe, já passou por `meiaNoite()` e está em
  escopo no `.map` das barras; cada `plotadas[i].fim` também já é `Date` à meia-noite. Herda a
  limitação de o `useMemo` não reavaliar na virada da meia-noite — o mesmo que já vale para a
  linha "Hoje", então é consistente em vez de ser um caso novo.

- **Sem dark mode nas barras.** O arquivo é misto de propósito: barras e linha "Hoje" usam hex
  inline; grade e textos usam `currentColor` + classe. Converter `STATUS_COR` para classes seria
  refatoração maior que o pedido.

## 4. Execução

- [x] `estaAtrasada(etapa, fim, hoje)` junto dos helpers de data, com comparação **estrita**: a
      barra cobre o dia final inteiro, então a etapa que vence hoje ainda está no prazo
- [x] `COR_ATRASADA` / `COR_ATRASADA_BORDA` fora do mapa de status
- [x] Barra pinta por atraso antes de status, com contorno no trilho
- [x] Tooltip ganha "Atrasada há N dias" **preservando** o status original — é onde "Bloqueado"
      continua legível numa etapa bloqueada e vencida
- [x] Entrada "Atrasada" na legenda, avulsa
- [x] `data-testid="gantt-legenda"` para o teste escopar a legenda: "Atrasada" também aparece
      nos tooltips das barras, e um `getByText` na página inteira casaria com os dois

## 5. Testes

- [x] Browser spec novo cobre os quatro casos: vencida em andamento (o print do cliente), etapa
      no prazo (continua azul — é o contraste que prova que a cor veio da data, não de uma
      mudança global), concluída com prazo vencido (segue verde: entregou atrasado, mas entregou)
      e bloqueada vencida (vermelho de atraso, a decisão de precedência)
- [x] As datas do fixture saem de `Date.now()`, não de constantes. O spec de integração da XG10
      fixa `2026-10-01/20`, e um fixture com data absoluta "passa a atrasar" sozinho quando o
      calendário o alcança — o teste diria a verdade por acidente
- [x] A contagem de dias é assertada por padrão (`/Atrasada há \d+ dias?/`), não no número exato:
      os deslocamentos são em horas e o arredondamento vira na fronteira do dia, o que faria o
      teste piscar conforme a hora em que roda
- [x] Regra validada isoladamente em 8 casos, incluindo os limites (vence hoje ≠ atrasada; venceu
      ontem = 1 dia) — o browser não roda neste ambiente, então a lógica foi exercitada à parte
- [x] `npm run check` limpo
- [x] `npm run test:e2e`: **505 passaram, 13 falharam** — as mesmas 13 pré-existentes
      (aprovação admin, curadoria, FAQ, entitlements, planos, J40), em arquivos que esta jornada
      não toca
- [ ] **Browser spec não executado**: faltam 22 bibliotecas de sistema para o Chromium subir
      neste ambiente (`libglib-2.0.so.0` entre elas), como já constatado na
      [XG24](24-tour-guiado-completo.md). Rodar `npm run test:e2e:xgestao` onde o browser exista
- [ ] Verificação visual: confirmar que atrasada e bloqueada se distinguem lado a lado, e a
      legenda com cinco entradas mais "Hoje"

## 6. Descoberta de caminho

O `POST /api/obras/[id]/etapas` **não aceita `status`** — a etapa sempre nasce `pendente`, e é o
PATCH que define o resto. O teste cria e depois ajusta; sem o segundo passo todas as barras
sairiam cinza e o teste mediria outra coisa. Vale para qualquer spec futuro que precise de etapa
num status específico.

## 7. Dívidas

- **A regra de atraso agora existe em três lugares**: `diasAtrasoFor`
  ([build-detalhe-server.ts:75](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts)),
  reimplementada inline em [`summary-server.ts:47-50`](../../features/shared/health/summary-server.ts),
  e `estaAtrasada` aqui. As duas primeiras são server-side sobre a **obra**; esta é client-side
  sobre a **etapa**. Unificar exigiria um helper puro fora da fronteira client/server — não é
  difícil, mas é trabalho que o pedido não pedia. Quando a terceira cópia virar a quarta, fazer.
- **O Gantt não reavalia na virada da meia-noite.** Uma sessão aberta durante a noite mostra a
  linha "Hoje" e as cores do dia anterior até o próximo render. Já era assim antes desta jornada;
  agora tem uma consequência a mais.
- **Barras sem dark mode.** `STATUS_COR`, `COR_ATRASADA` e a linha "Hoje" são hex fixos. O padrão
  para resolver já existe no próprio arquivo (`currentColor` + classe, usado na grade e nos
  textos), se algum dia valer a refatoração.

## 8. Links cruzados

- Depende de: [XG10](10-ajustes-teste-obra-real.md) — que criou o par de datas e o Gantt
- Relacionado: [XG15](15-coerencia-saude-e-progresso.md) — o fator "atraso" da Saúde que aponta
  para esta aba · [XG23](23-etapas-progresso-manual.md) — o percentual manual da etapa
- Origem: `docs/novo-fluxo/ajustes/solicitacao-cronograma.jpeg` (2026-09-18)
