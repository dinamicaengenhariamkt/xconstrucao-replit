# Jornada — XG14: Auditoria do console antes do teste com o cliente

> Status: pronto (2 partes) | Prioridade: alta | Wave: xgestão-14
> Última atualização: 2026-09-14

## 1. Contexto

Pedido de revalidação antes de levar o produto ao cliente: *"está tudo ok certo? sem
dados mockados no xgestão todo... persistência está toda 100%... link de compartilhamento
tudo ok... responsabilidades das abas coerentes e funcionais"*.

A pergunta foi tratada como **auditoria, não como confirmação**: o trabalho foi procurar
o que estava quebrado, não validar o que já se supunha certo. A distinção importa porque
o histórico desta wave tem dois casos de afirmação que sobreviveu sem ser verificada — o
`OcorrenciasSection` que "salvava" e não salvava (XG12 A2), e o risco da XG12 §9 que
seguiu dizendo que quatro seções não persistiam **depois de elas passarem a persistir**.

Resultado: **cinco das seis garantias se confirmaram com evidência. A sexta revelou um
bug que travava o usuário no celular.**

## 2. O que foi verificado, e como

| Garantia | Veredito | Como foi provado |
|---|---|---|
| Sem dados mockados | ✅ | Varredura por array literal renderizado, número fixo em texto de UI, `Math.random()` em dado exibido, `= 0` hardcoded, TODO/FIXME/mock. `getMockHealth`/`getMockProfitSummary` **não existem mais no repo** — só comentários registrando a substituição. Saúde, Receita/Custo/Margem e Aditivos saem de `db.select()`/`SUM()` |
| Persistência 100% | ✅ | Cada handler de criar/editar/excluir rastreado até o `fetch`, e cada endpoint conferido em `app/api/**`. **Não bastou o import** — foi verificado que a mutation é chamada no handler |
| Edição na mesma tela | ✅ | Capa, informações, localização e link são modais. `/editar` permanece só para o cadastro guiado (5 seções) e a exclusão — decisão da XG12 §6 |
| Link público | ✅ | A projeção **não seleciona nenhum campo financeiro**; `numero`, `cep` e coordenadas nunca entram; logradouro só com a seção ligada. Confirmado abrindo a página anônima: status 200 sem login, zero termos financeiros no corpo |
| Abas coerentes | ✅ | Etapas (CRUD) × Cronograma (as mesmas etapas no eixo do tempo) × Tarefas. Campo de % some em obra própria (`progressoDerivado`). Saúde é a última com `HealthCard` fixo acima; Atualizações é a primeira e a padrão |
| Tour de ajuda | ⚠️→✅ | Abre sozinho, "Pular" grava a preferência, "Ajuda" reabre. **Mas travava no passo 6 no celular** — corrigido nesta jornada |

### A1 — o tour travava o usuário no passo 6 de 7

Percorrer os passos num viewport de 390×844 e medir o balão a cada um:

```
Passo 5 de 7 | "A cara da obra"       | h=219 bottom=530 | ok
Passo 6 de 7 | "Detalhes e endereço"  | h=267 bottom=856 | vh=844  ← FORA DA TELA
```

[GuidedTour.tsx](../../features/xgestao/components/GuidedTour.tsx) usava um literal
`200` como altura presumida do balão para decidir se ele cabia abaixo do alvo. O balão
do passo 6 mede 267px. Somado ao `document.body.style.overflow = 'hidden'` que o tour
aplica, **o botão "Próximo" ficava inalcançável e não havia como rolar até ele.**

Não era exclusivo daquele passo: qualquer texto mais longo, ou uma tela menor (iPhone SE
tem 568px de altura), reproduz.

### A2 — dispensar por acidente valia para sempre

`Esc` e clique no fundo escuro chamavam o mesmo `onClose` do botão "Pular", que grava
`localStorage`. No celular, um toque fora do balão tirava o tour **definitivamente** de
quem talvez ainda precisasse dele.

## 3. Decisões

- **Dispensa deliberada × acidental.** Só "Pular" e concluir os 7 passos marcam como
  visto. `Esc` e toque no fundo passam a fechar apenas desta vez. *Dispensar de vez é
  decisão que merece o clique no botão certo.*
- **Marketplace intacto.** Nenhuma mudança de aparência; verificado ao final.
- Os quatro achados menores entraram todos, por decisão do usuário.

## 4. O que foi feito

### Parte 1 — O tour
- **Medir em vez de estimar.** `balloonPosition` passa a receber a altura **real** do
  balão, medida por `ResizeObserver` sobre o `balloonRef` que já existia. O
  `ResizeObserver` cobre também rotação de tela e zoom de fonte do sistema.
- **Prender na viewport.** O `top` nunca ultrapassa `vh - altura - 16`.
- **Rede de segurança.** `max-height: calc(100vh - 32px)` + `overflow-y: auto` no balão:
  numa tela mais baixa que ele, o conteúdo rola **dentro** do balão e o `body` continua
  travado, como o tour precisa. Isso fecha a classe do bug, não só o passo 6.
- **`onDismiss` aditivo.** `useGuidedTour` ganha `dispensar()` ao lado de `fechar()`.
  Sem a prop, o componente mantém o comportamento antigo.

### Parte 2 — Os quatro achados
1. **Validade do link público.** O suporte já existia **inteiro** — coluna `expira_em`,
   filtro `or(isNull, gt(now))` na validação do token, Zod na rota, e o hook já recebia
   o parâmetro. Só o modal mandava `null` sempre. Agora há "Sem prazo · 7 · 30 · 90
   dias" e o aviso "O link atual expira em <data>". **Zero backend novo.**
2. **Tarefas agrupadas pela FK.** `TaskManagerSection` agrupava por `tarefa.etapa`
   (texto) enquanto `etapaId` era gravado corretamente. Renomear uma etapa espalhava as
   tarefas em dois grupos. Agora agrupa por `etapaId`, casando com o nome atual, e o
   texto vira fallback para tarefas sem vínculo (legadas ou de etapa excluída).
3. **Cronograma com saída.** O estado vazio já dizia onde informar as datas; ganhou o
   botão — "Cadastrar etapas" quando não há etapa, "Informar datas nas etapas" quando
   há sem data. Prop opcional: o card também serve telas sem abas.
4. **1.900 linhas de código morto removidas.** `OcorrenciasSection` (465),
   `FotoGallerySection` (648), `CronogramaSection` (409), `FinanceiroSection` (143),
   `RelatoriosSection` (235) e o helper `foto-gallery/`. Todos fora da árvore de render
   e **todos a versão falsa que não persiste** — o risco era alguém reimportar, que foi
   exatamente o bug A2 da XG12. A reversibilidade fica no git.
   Junto: a prop `xgestaoReadOnly` de `EquipeSection` e seu aviso "Gestão de equipe em
   breve" — inalcançável (default `false`, ninguém passava) e contradizendo a XG10.

Extra encontrado durante a validação: o título da obra não quebrava linha
(`break-words`) nem no console nem na página pública. Nome de obra é texto do usuário e
costuma ser longo; corrigido nos dois.

## 5. Verificação

`npm run check` limpo em cada etapa.

**Tour — 7 passos × 3 tamanhos (390×844, 360×640, 320×568):**
```
21 passos medidos | 0 balões fora da viewport | botão "Próximo" alcançável em todos
Esc   -> flag=null | reabriu após F5? SIM (correto)
Pular -> flag=1    | reabriu após F5? não   (correto)
=== FALHAS: 0 ===
```

**Console — 12 abas em 390px:** todas renderizam, `overflow=não` em todas, **nenhum erro
de JavaScript**. Botão do Cronograma vazio leva à aba Etapas.

**Link com prazo:** gerado com 7 dias pela UI → `expira_em = 2026-09-21` no banco
(~7 dias) → página pública abre **sem login** (200) → **nenhum termo financeiro**
no corpo.

**Regressão marketplace:** `luminous-card=0`, `luminous-section=0`, sem overflow, em
mobile e desktop.

> A suíte `test:e2e:xgestao` segue sem rodar (usa o Chromium do Playwright, não o do
> sistema). Apontar o `playwright.config.ts` para `/repl/tools/bin/chromium` é tarefa
> própria e provavelmente destrava a suíte inteira, incluindo o teste de ocorrências
> reescrito na XG12 Bloco 6 e nunca executado.

## 6. Fora de escopo (dívida registrada)

- **Contratante ainda passa lançamento como medição.** `app/contratante/minhas-obras/[id]/page.tsx:528`
  entrega `financeiro.medicoes` (linhas da tabela `financeiro`, com `numero` gerado por
  índice) ao `TabDisputas` como `tipo: 'medicao'` — o mesmo A1 que a XG12 corrigiu no
  console do empreiteiro, sobrevivendo do outro lado. **É marketplace**, e mexer ali sem
  pedido violaria o princípio de não tocar nele. Merece jornada própria.
- **`HealthDetailPanel`:** "Evolução do score" e "Recomendações" leem
  `health.trend`/`health.recommendations`, que nenhum produtor preenche. Têm guarda
  `&& length > 0`, então **não renderizam bloco vazio** — o usuário não vê promessa
  quebrada. Código morto inofensivo, mas é o mesmo padrão que a XG10 nomeou.
- **Score de saúde:** os inputs são 100% reais; os pesos (atraso 0.4 / financeiro 0.35 /
  tarefas 0.25) são escolha de produto. Vale dizer ao cliente que o número é um
  indicador proprietário, não medida de engenharia.
- **`p-10` fixo em ~15 telas** da área logada (herdado da XG13).
- **`obra_tarefas` guarda etapa em dois lugares** (FK + texto). A exibição foi
  corrigida, mas a duplicação de fonte continua no schema.

## 7. Gaps descobertos

> Doc viva. Uma linha por item, com data.

- **2026-09-14 — o recurso que estava a um `null` de distância:** a validade do link
  existia no schema, no filtro do token, no Zod da rota e na assinatura do hook. Faltava
  um select. É a terceira vez nesta wave (depois de `comprovanteFileId` na XG12 e da
  prop `luminous` na XG13) que o pedido já estava construído e só não tinha UI.
  **Antes de estimar um pedido, procure o quanto dele já existe.**
- **2026-09-14 — a garantia que se repetia sozinha:** o risco da XG12 §9 afirmava que
  quatro seções não persistiam, e continuou afirmando depois que elas passaram a
  persistir. Bastou seguir os handlers até o `fetch` para desmentir. **Risco herdado é
  afirmação sobre o código de ontem: reconferir custa um grep, repetir custa a confiança
  de quem lê.**
- **2026-09-14 — o overlay que a foto da tela não mostra:** a XG13 validou o console em
  três tamanhos e deu zero overflow, mas o tour era dispensado *antes* do screenshot.
  O bug que travava o passo 6 estava lá o tempo todo. **Modal, tour e overlay precisam
  do próprio passe: eles não aparecem na foto da tela que cobrem.**
- **2026-09-14 — "tracejado" não era `border-dashed`:** (da XG13, confirmado aqui) o
  relato do efeito estava visualmente correto e levava ao CSS errado. **Relato de
  usuário descreve o que se vê, não a implementação.**

## 8. Links cruzados

- Depende de: [XG12](12-console-obra-tela-unica.md), [XG13](13-mobile-e-polimento.md)
- Relacionada: [XG04](04-link-publico-obra.md) (link público e toggles de seção)
- Origem: conversa de 2026-09-14 (pedido de revalidação antes do teste com o cliente)
