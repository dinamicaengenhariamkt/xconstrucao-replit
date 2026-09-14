# Jornada — XG13: O console no celular + acabamento visual

> Status: pronto (3 partes) | Prioridade: alta | Wave: xgestão-13
> Última atualização: 2026-09-14

## Contexto

A XG12 fechou o console em tela única e a conferência item a item da
[transcrição de 2026-09-12](../novo-fluxo/reuniao-xconstrucao-testes-xgestao.json)
contra os checklists da XG10 e da XG12 não achou **nenhum requisito funcional em
aberto**. O último `[ ]` da XG10 (anexo de nota fiscal) tinha sido entregue pela XG12
Bloco 7; só o doc não fora atualizado.

O que sobrou eram três coisas, nenhuma delas funcionalidade nova.

### O pedido que nenhuma jornada tinha endereçado

Guilherme falou de celular **duas vezes**, e nenhum dos dois docs tem bloco, critério
ou checklist de responsividade — só a linha "Gantt legível no celular" na XG10:

> *"Isso aqui tem que funcionar no celular. Ele já funciona na plataforma do celular?"* (16:41)
>
> *"Quem tá na obra tem que ter praticidade. O cara tem que conseguir fazer esse
> lançamento rápido. **O cara não vai pegar um computador pra lançar.**"* (17:06)
>
> *"Depois vocês conseguirem também **validando pelo celular mesmo**. Até pra a gente
> ter uma percepção, ver se tá legal ali a **formatação** e tal."* (29:10)

A resposta na reunião foi *"ele tem a versão responsiva"*. **Tinha, mas não no console
da obra** — justamente a tela que o cliente ia testar em obra. A XG11 (PWA) foi aberta
para o app nativo, e a responsividade da web acabou caindo no vão entre as duas.

### A1 — o hero engolia o próprio conteúdo

A captura em 390px mostra o defeito melhor do que qualquer descrição: **o título da
obra, o endereço e a entrega prevista não apareciam.** Sobravam dois botões flutuando
sobre um retângulo escuro.

A causa: a capa é `aspect-[16/7]` e **todo** o conteúdo do hero morava em
`absolute inset-0` dentro dela — badges, título `text-3xl md:text-5xl`, endereço,
metadados e quatro botões. Num aparelho de 360-390px a capa tem ~157px de altura útil;
o conteúdo transbordava e o `overflow-hidden` do card cortava o resto.

Não era regressão da XG12: o hero sempre foi assim. **Ninguém tinha aberto a tela num
celular** — o teste em obra real de 12/09 foi feito compartilhando tela de desktop.

### A2 — `p-10` fixo em toda a área logada

O container do console é `p-10`: 80px de padding lateral consumidos numa tela de 360px,
sobrando 280px úteis. O mesmo vale para o skeleton e o estado de erro.

O detalhe que fecha o diagnóstico: o `XGestaoDashboard` já usava `p-6 md:p-10`. **O
console é o desvio, não o padrão** — mas `p-10` fixo se repete em ~15 telas da área
logada (`minhas-candidaturas`, `novas-obras`, `obras-salvas`, `faq`…), e nenhuma tela
do projeto usava `p-4 sm:p-*`. Corrigido aqui só no console; o resto fica como dívida
anotada em §5.

### A3 — o acabamento que existia e não era usado

O projeto tem um sistema de cards pronto e documentado em
[globals.css §Luminous card border](../../app/globals.css):

| Classe | Efeito |
|---|---|
| `.luminous-card` | borda branca em gradiente **225°**: transparente 0% → 0.85 no meio → transparente 100% |
| `.luminous-section` | a mesma ideia em cinza, para cards grandes, + degradê interno "papel suave" |

Mais o `LuminousHoverCard`, que acrescenta a linha primary no topo ao hover, gradiente
de fundo e `scale: 1.01`. Admin e contratante usam em ~40 arquivos. **O console da obra
não usava nada disso** — os 5 KPIs eram `div`s cruas com `border-gray-100` e um
`hover:border-<cor>/30` diferente em cada card.

> **Sobre o "tracejado":** o relato descrevia a borda como tracejada. Não é — não existe
> `border-dashed` em card nenhum do produto (no repo inteiro ele só aparece em empty
> state e dropzone de upload). O que lê como traço interrompido é o gradiente mascarado:
> a borda é **invisível em dois cantos opostos e sólida no meio**. Reproduzir com
> `border-dashed` de verdade teria ficado errado. **A descrição do usuário estava
> perfeita; o nome é que enganava.**

E no dashboard do xgestão o caso era ainda mais simples: os 4 KPIs **já** usavam o
`StatsCard` certo, apenas sem passar `luminous` (default `false`). O painel renderizava
card liso enquanto o dashboard do empreiteiro, com o mesmo componente, tinha o efeito
completo.

## 2. Decisões

- **Refresh: nada a fazer.** A sessão não expira mais desde a XG10 Bloco 1 — o
  `AuthInit` renova a cada 10 min e no `visibilitychange`, com retry no 401 serializado
  no auth-store. A revalidação de dados por invalidação após salvar é suficiente para
  gestão; polling fica para quando houver marketplace com concorrência de escrita.
- **Sem suíte de integração nesta jornada** (decisão de MVP). A validação é visual.
- **Marketplace não muda de aparência.** O console é arquivo compartilhado: o
  acabamento luminous é condicionado a `obra.isObraPropria`. A responsividade, essa
  sim, vale para os dois — é correção de layout, e o marketplace só ganha.
- **`StatsCard` não foi alterado.** É consumido por ~30 telas (admin, contratante,
  marketplace); mexer nele vazaria para todas.

## 3. O que foi feito

### Parte 1 — Responsividade (console + modais)

| Onde | Antes | Depois |
|---|---|---|
| Container, skeleton e 404 | `p-10` | `p-4 sm:p-6 lg:p-10` |
| Capa do hero | `aspect-[16/7]` | `h-40 sm:h-56 md:aspect-[16/7]` |
| Conteúdo do hero | `absolute` sempre | fluxo normal no mobile, `md:absolute` |
| Botões do hero | linha que estourava | coluna full-width, "Adicionar Atualização" em 1º (`order-1`) |
| Grid do skeleton | `grid-cols-5` | `grid-cols-2 sm:grid-cols-3 lg:grid-cols-5` |
| Grid dos KPIs | `md:grid-cols-2 lg:grid-cols-5` (5º órfão) | `grid-cols-2 lg:grid-cols-5` |
| Tab bar (12 abas) | scroll sem dica visual | + `mask-image` de fade à direita, padding menor |
| Conteúdo das abas | `p-6` | `p-4 sm:p-6` |
| Modais (7) | `w-full` colado nas bordas | `w-[calc(100%-2rem)] sm:w-full` |

O `DialogContent` base **não** foi tocado: é compartilhado por 55 modais. O gutter
entrou nos sete que vivem no console (`TrocarCapa`, `EditarInformacoes`,
`EditarLocalizacao`, `Compartilhar`, `RegistrarMedicao`, `LancamentoFinanceiro`).

Sobre a `mask-image` na tab bar: um overlay posicionado por cima intercepta o clique
da última aba; a máscara não, porque não é elemento. Some em `md`.

### Parte 2 — Acabamento visual (só xgestão)

- **`KpiCardShell`** — casca local no próprio `page.tsx`, com `luminous-card group` e
  as duas `<span>` decorativas de `LuminousHoverCard`. Não reusa o `LuminousHoverCard`
  direto porque ele envolve o `<Card>` do shadcn, cuja estrutura quebraria os KPIs (que
  têm barra de progresso, legenda e badge condicional próprios).
- **`kpiIconClasses`** — ícone com `group-hover:border-primary/40` + `scale-105`. O
  `border-transparent` em repouso evita salto de layout quando a borda aparece.
- **`.luminous-section`** no `DetalhesObraCard` e no bloco das abas.
- **Dashboard:** `luminous` nos 4 `StatsCard`, `luminous-section` nos dois cards de
  seção, e a barra primary que cresce no hover das obras recentes (padrão do
  `ActivityItem` do dashboard do empreiteiro).
- O `border-l-4` âmbar do card de prazo **ficou**: é sinal de estado, não decoração.

### Parte 3 — Dois defeitos do diff da XG12

1. **`TrocarCapaModal` não fechava.** O `CapaObraEditor` expõe `onSaved` e chama o
   callback ao salvar; o modal simplesmente nunca passava a prop. Escolher a capa é a
   única ação daquele modal — ficar aberto depois só pedia um clique a mais.
2. **`useInvalidarObra` não invalidava `['obras', obraId]`.** Trocar a capa atualizava
   o hero mas deixava a grade de fotos do próprio editor servindo cache. Uma chave de
   prefixo cobre fotos, medições, lançamentos e health de uma vez.

## 4. Verificação

`npm run check` limpo.

Validação **visual**, e aqui vale registrar o achado de ambiente: a XG12 concluiu que
browser não roda neste Replit por falta de `libglib-2.0.so.0`. Isso vale para o Chromium
que o **Playwright baixa** — mas existe um Chromium de sistema em
`/repl/tools/bin/chromium` (v152) que funciona, e o `playwright-core` o dirige via
`executablePath`. Screenshots em 390 / 768 / 1280px, antes e depois:

- `scrollWidth === innerWidth` nos três breakpoints — **zero overflow horizontal**.
- 390px antes: título, endereço e entrega **ausentes** (cortados pela capa).
- 390px depois: tudo visível, botões full-width empilhados, KPIs em duas colunas.

> **O gate que a XG12 deixou aberto continua aberto:** a suíte
> `test:e2e:xgestao` não rodou — ela usa o Chromium do Playwright, não o do sistema.
> O teste de ocorrências reescrito na XG12 Bloco 6 **segue sem execução**. Apontar o
> `playwright.config.ts` para o binário do sistema é tarefa própria e provavelmente
> destrava a suíte inteira.

## 5. Riscos / dívidas

- **`p-10` fixo em ~15 telas da área logada** (`minhas-candidaturas`, `novas-obras`,
  `obras-salvas`, `faq`, `atividades-recentes`…). Corrigido só no console. Nenhuma tela
  do projeto usa `p-4 sm:p-*`; vale uma passada única em vez de tela a tela.
- **`useIsMobile()` existe e quase não é usado** (`shared/hooks/use-mobile.tsx`): só o
  `sidebar.tsx` consome. Toda a responsividade é por classe Tailwind — o que é bom, mas
  significa que não há proteção para casos que precisem de lógica em JS.
- **Dois `QueryClient` no repo:** `shared/lib/queryClient.ts` (o ativo, `staleTime`
  30 min) e `lib/queryClient.ts` (5 min + toast de `EMAIL_NOT_VERIFIED`). O segundo não
  é o do `Providers` — **o toast de e-mail não verificado provavelmente está morto.**
  Dois arquivos ainda o importam. Merece verificação própria.
- **`refetchOnWindowFocus` inconsistente:** `true` na query da obra (via `QUERY_CONFIG`
  local), `false` em medições e lançamentos. Voltar à aba atualiza hero e KPIs mas não
  as listas. Mantido de propósito nesta jornada.
- **`getJson` reimplementado 6×** (`EditarObraPage`, os três modais, `CapaObraEditor`,
  `use-obra-medicoes`). Candidato natural a um helper único.
- Os cinco componentes órfãos que a XG10/XG12 listaram continuam órfãos.

## 6. Gaps descobertos

> Doc viva. Uma linha por item, com data.

- **2026-09-14 — a tela que ninguém tinha aberto no celular:** o pedido mais repetido da
  reunião virou a XG11 (app nativo, prioridade baixa) e a responsividade da web ficou no
  vão. O hero escondia o título da obra em 390px havia jornadas. **Pedido que vira
  jornada futura sai do radar do presente:** "vamos ver isso depois" respondia o app, não
  o layout de hoje.
- **2026-09-14 — o risco que envelheceu e continuou assustando:** a XG12 §9 afirmava que
  `TaskManagerSection`, `ChecklistsSection`, `DocumentosSection` e `EquipeSection` não
  persistiam. Os quatro persistem — usam as mutations de `use-obra-operacao.ts` desde a
  XG10. O texto descrevia o estado anterior e sobreviveu por cópia. **Risco herdado é
  afirmação sobre o código: expira, e reconferir custa um grep.**
- **2026-09-14 — o efeito visual que estava a uma prop de distância:** o painel do
  xgestão usava o `StatsCard` certo sem passar `luminous`. Não faltava CSS, componente
  nem design — faltava uma palavra. **Antes de construir o acabamento, procure se o
  produto já o tem:** a XG12 tinha acabado de aprender isso com `comprovanteFileId`.
- **2026-09-14 — "tracejado" não era tracejado:** a descrição do efeito estava
  visualmente perfeita e levava ao CSS errado. Um gradiente mascarado a 225° fica
  invisível em dois cantos e sólido no meio — o olho lê traço. **Relato de usuário
  descreve o que se vê, não a implementação; procure o efeito, não a palavra.**
- **2026-09-14 — o Chromium que estava lá o tempo todo:** a XG12 registrou "o browser
  não roda neste ambiente" e a conclusão virou premissa. Faltava a lib para o binário
  *do Playwright*; o sistema tem um Chromium funcional em `/repl/tools/bin/`.
  **"Não dá para testar aqui" merece uma segunda pergunta: não dá com qual binário?**
- **2026-09-14 (visto na XG14) — validar a tela não valida o que aparece sobre ela:**
  esta jornada mediu o console em 390/768/1280px e deu zero overflow — mas a validação
  parou na página. O **tour**, que é um overlay `fixed` fora do fluxo, não foi
  percorrido passo a passo, e tinha um balão que saía da viewport travando o usuário no
  passo 6 (ver XG12 §13). A captura da página não mostra o defeito porque o tour foi
  dispensado antes do screenshot. **Overlay, modal e tour precisam do próprio passe de
  validação: eles não aparecem na foto da tela que cobrem.**

## 7. Links cruzados

- Depende de: [XG12](12-console-obra-tela-unica.md) (console em tela única), [XG10](10-ajustes-teste-obra-real.md)
- Relacionada: [XG11](11-offline-pwa.md) (app nativo — esta jornada é a web responsiva que a precede)
- Origem: [transcrição de 2026-09-12](../novo-fluxo/reuniao-xconstrucao-testes-xgestao.json) (16:41, 17:06, 29:10) + conversa de 2026-09-14
