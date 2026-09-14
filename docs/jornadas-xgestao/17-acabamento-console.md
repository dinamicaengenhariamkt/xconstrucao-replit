# Jornada — XG17: Acabamento do console — hero, atualizações e saída da Saúde

> Status: 🔄 em execução | Prioridade: alta | Wave: xgestão-17
> Última atualização: 2026-09-14

> **Ponto de retomada:** o checklist da §5 é a fonte de verdade. Cada item marcado `[x]`
> está feito e verificado; `[ ]` é o que falta. Se a sessão cair, continuar do primeiro
> `[ ]` de cima para baixo.

## 1. Contexto

Uso real, obra `Vestiarios Cotia`. O relato que abriu a jornada:

> *"O título e a entrega prevista ficam fixos na tela quando eu desço a barra de rolagem."*

E, na sequência: a capa ocupa quase 80% da tela, a aba Atualizações gera rolagem demais, e a
Saúde da Obra *"está um pouquinho ilegível para o usuário final conseguir entender"*.

O relato do "fixo" **precisou de duas rodadas**. Na primeira, foi diagnosticado como efeito
geométrico e tratado com a redução da capa — o sintoma continuou. Na segunda, o usuário
trouxe o HTML renderizado do bloco, e aí a causa apareceu: um `relative` faltando (§2, A1).

## 2. Os achados

### A1 — o "fixo" era um `relative` faltando no hero

> **Esta seção foi reescrita.** A primeira leitura da jornada concluiu que o efeito era
> geométrico — capa alta demais numa área de rolagem curta — e a altura fixa foi tratada
> como *a* correção. **Estava errado.** O sintoma continuou depois do ajuste, e o usuário
> voltou com o HTML renderizado do bloco. O registro anterior fica abaixo como o que foi
> descartado.

**A causa real.** O bloco de título, endereço e entrega é `md:absolute md:bottom-0`. Um
`position: absolute` ancora no **ancestral posicionado mais próximo** — e a cadeia inteira
não tinha nenhum:

| Elemento | Classes relevantes |
|---|---|
| Raiz do console | `p-4 … flex flex-col` — sem `relative` |
| **Hero (`hero-minha-obra`)** | `bg-white rounded-3xl overflow-hidden …` — **sem `relative`** |
| Capa | `relative h-40 … md:h-[340px]` ✅ — mas o bloco **não** está dentro dela |
| Bloco título/entrega/botão | `md:absolute md:bottom-0` ← sem âncora |

Sem ancestral posicionado, o navegador sobe a cadeia inteira e ancora no **bloco contenedor
inicial** — o viewport. **É funcionalmente um `fixed`**: o bloco gruda na tela e acompanha a
rolagem, sem que a palavra `fixed` apareça em lugar nenhum.

**A regressão nasceu na XG13**, que tirou o bloco de dentro da capa para o texto sair de cima
da imagem no celular. A capa é `relative` e o continha; ao virar irmão dela, o bloco perdeu a
âncora e ninguém repôs no novo pai. O `md:relative` interno não resolve — está **dentro** do
elemento absoluto, não acima dele.

Prova pelo contraste: nos heros equivalentes
([ObraDetalheHero](../../features/empreiteiro/novas-obras/components/ObraDetalheHero.tsx),
console do contratante) o bloco segue **dentro** da capa `relative` — e lá o hero pai também
não tem `relative`, porque nunca precisou.

**Primeira tentativa de correção — errada.** Pôr `relative` no **hero** deu âncora ao bloco,
mas a âncora errada: o hero tem **três** filhos (capa, bloco e barra de progresso), então
`bottom-0` passou a mirar o rodapé do **card inteiro**. O título caiu em cima do
"PROGRESSO GERAL / 45%".

**Correção final — um wrapper `relative` em volta da capa e do bloco**, com a barra de
progresso **fora** dele:

```
<motion.div hero>              ← sem relative
  <div className="relative">   ← wrapper: a fronteira certa
    <div capa md:h-[420px]>
    <div bloco md:absolute md:bottom-0>
  </div>
  <div progress-bar-section>   ← fora, intocada
</motion.div>
```

Funciona porque no desktop o bloco é `absolute` e sai do fluxo: o wrapper colapsa para a
altura da capa, e `bottom-0` mira o rodapé dela. No mobile o wrapper fica em fluxo e cresce
com os dois — a XG13 segue intacta, sem tocar em nenhuma classe responsiva do bloco.

A capa subiu para **420px** (pedido do cliente e necessidade: o bloco sobreposto ocupa ~200px
e em 340px ficaria espremido contra a imagem).

#### O que foi descartado

A hipótese geométrica: capa em `md:aspect-[16/7]` sem `max-width` rendendo ~720px num monitor
largo, contra uma área rolável de ~800px (`h-screen` menos a topbar `h-20`). O cálculo estava
certo e a capa *era* grande demais — mas isso explicava a **aparência**, não o
comportamento. **A altura fixa continua valendo por mérito próprio**, porque o usuário pediu
a capa menor ("está pegando quase uns 80%"); só não era a correção do "fixo".

### A2 — três botões disputando a capa

Hero tinha "Editar obra", "Compartilhar link" e "Adicionar Atualização". Dois deles já
existiam no caminho natural do usuário: editar no card "Detalhes da obra" logo abaixo, e
registrar avanço na aba Atualizações — a primeira do console, com botão no cabeçalho **e** no
estado vazio. Os três somados empurravam o conteúdo para fora da tela.

### A3 — a aba Atualizações renderizava tudo

`atualizacoes.map(...)` sem paginação, e `item.fotos.map(...)` sem teto. Cada item com fotos
mede ~340px: uma obra com 20 atualizações virava uma página de **~7000px** de rolagem. Um
lançamento com 15 fotos ocupava três linhas de grid sozinho.

**A ordenação já estava certa** — verificado o caminho inteiro (`useObraMedicoes` →
`/api/obras/[id]/medicoes` → `listMedicoesForObra`): `orderBy desc(medicoes.createdAt)`, sem
reordenação no cliente. A mais recente já vinha primeiro; o que pesava era o volume.

### A4 — a Saúde media, mas não comunicava

Score numérico, fatores ponderados e rótulos como "Requer atenção" exigem conhecer a régua
por trás para significar alguma coisa. Para o dono da obra, viravam alarme sem ação — o
oposto do que a XG15 tinha buscado ao corrigir o cálculo.

## 3. Decisões

- **Altura fixa (`md:h-[340px]`) em vez de proporção.** Altura previsível não depende da
  largura do monitor; é o que fecha o problema de raiz.
- **Saúde sai do xgestão inteiro** — console, dashboard e filtro da lista —, não só do
  console. Se o motivo é ser ilegível, o resumo e o filtro têm o mesmo defeito.
- **Ocultar, não apagar.** Nada em `features/shared/health/**` foi removido: admin e
  contratante seguem usando, e a aba continua no marketplace.
- **"Carregar mais" em vez de paginação numérica:** menos toques no celular, que é onde o
  usuário está em obra, e não faz perder o lugar na lista.

## 4. Checklist de execução

### Parte 1 — Hero
- [x] **Wrapper `relative` envolvendo capa + bloco**, com a barra de progresso fora dele —
      a correção do "fixo" (A1), na terceira tentativa
- [x] `relative` **removido** do hero: ancorar ali fazia o bloco cair sobre o progresso
- [x] Comentários no hero, no wrapper e no bloco registrando a dependência entre os três
- [x] Verificado que os outros `absolute` (degradê e "Trocar capa") seguem **dentro** da
      capa `relative` e não mudam de âncora
- [x] Capa `md:h-[420px]` — ligeiramente maior, para comportar o bloco sobreposto sem
      espremer o texto (antes `md:aspect-[16/7]`, que rendia ~720px em monitor largo)
- [x] Estrutura verificada por contagem de profundidade do DOM, ignorando comentários **e
      tags auto-fechadas**: capa e bloco irmãos em depth 1, barra em depth 0
- [x] "Editar obra" e "Adicionar Atualização" saem do hero; fica só "Compartilhar link"
- [x] Verificado que nenhum passo do tour ficou órfão — `adicionar-atualizacao-aba` já
      apontava para o botão da aba, e `compartilhar-link` permanece
- [x] Verificado que nenhum teste usava os `data-testid` removidos

### Parte 2 — Link público no card de detalhes
- [x] Bloco `LinkPublicoBloco` no `DetalhesObraCard`: status, URL, visualizações e ação
- [x] **Input + botão "Copiar"** em vez do texto puro da tela de edição — lá o link é `<p>` e
      exige selecionar à mão
- [x] Reaproveita `useObraShare`: gerar/revogar reflete no card, no modal e na edição sem
      sincronização manual
- [x] Fica fora do estado `vazio` — o link independe de a obra ter descrição ou prazos

### Parte 3 — Aba Atualizações
- [x] `INITIAL_VISIBLE = 5` + `LOAD_INCREMENT = 5`, padrão de `ClienteHistoricoTab`
- [x] Botão "Carregar mais (N)" com contador "Mostrando X de Y"
- [x] Grid mais denso (`grid-cols-4 sm:grid-cols-6 md:grid-cols-8`)
- [x] Teto de 6 miniaturas por item, com bloco "+N" abrindo a próxima foto
- [x] Ordenação **verificada, não alterada**: já vinha `desc(createdAt)` do servidor

### Parte 4 — Saúde fora do xgestão
- [x] `HealthCard` removido do console (BLOCO 3.5)
- [x] `tabsVisiveis()` filtra `saude` junto com `disputas` na obra própria
- [x] `HealthDetailPanel` mantido no arquivo — inalcançável na obra própria, ativo no
      marketplace
- [x] `HealthSummary` e seu cálculo removidos do `XGestaoDashboard`
- [x] `HealthFilterSelect` oculto no modo xgestão (padrão `{!xgestao && …}`, o mesmo do
      filtro de contratante)
- [x] **`?saude=` ignorado no modo xgestão** — sem o controle na tela, um link antigo
      filtraria a lista sem nada explicando por que ela encolheu
- [x] Contador de filtros ativos não conta mais a saúde no xgestão

### Fechamento
- [x] `npm run check` limpo
- [x] Testes de saúde — 12/12 (a XG15 segue coberta)
- [x] Verificado que os testes de `health` são de API, que permanece intacta
- [ ] `npm run test:integration` (precisa do ambiente dev de pé)
- [ ] Verificação visual: rolagem sem sensação de fixo, com a janela sem DevTools acoplado

## 5. Fora de escopo (dívida)

- **`HealthDetailPanel` sem consumidor de produção no xgestão.** Não remover: é a porta de
  volta quando a Saúde for repensada numa leitura que o usuário final interprete sozinho.
- **`computeHealthFromObra` sem chamador no console.** Mantido — apagar jogaria fora a
  correção e os 12 testes da XG15.
- **`GET /api/obras/[id]/health` permanece:** o console nem a consumia (calculava no
  cliente), e ela serve o contratante.
- **Lightbox de fotos:** o "+N" abre a foto em nova aba, como as demais. Uma galeria modal na
  aba Atualizações é melhoria própria.

## 6. Gaps descobertos

- **2026-09-14 — `absolute` sem ancestral posicionado É um `fixed`:** a busca por
  `fixed`/`sticky` não achou nada e eu concluí que o efeito era só geométrico. Mas um
  `position: absolute` cuja cadeia de ancestrais não tem nenhum elemento posicionado ancora
  no viewport — produz exatamente o comportamento de `fixed`, **sem usar a palavra**.
  **Grep por sintoma não encontra causa: o que faltava era uma classe ausente, e ausência
  não aparece em busca textual.**
- **2026-09-14 — mover um elemento pode quebrar o que o continha:** a XG13 tirou o bloco de
  dentro da capa por um motivo legítimo (texto fora da imagem no celular) e, sem perceber,
  levou junto a contenção `relative` que o posicionava. O sintoma só aparecia de `md` para
  cima, e passou por duas jornadas. **Ao mudar um elemento de pai, verificar de quais
  propriedades do pai antigo ele dependia — `position` é a mais silenciosa delas.**
- **2026-09-14 — achar a causa não é achar a âncora:** o diagnóstico ("`absolute` sem
  ancestral posicionado") estava certo, e mesmo assim a correção quebrou a tela — porque
  `relative` foi parar no hero, que contém **três** filhos, e não na fronteira certa
  (capa + bloco). **Um containing block não é "qualquer ancestral": é o ancestral cuja
  geometria você quer que o `bottom-0` enxergue.**
- **2026-09-14 — o type-check não valida layout:** o `tsc` passou em versões onde a barra de
  progresso estava dentro do wrapper e onde um `</div>` tinha caído dentro de um comentário.
  JSX balanceado no total não significa aninhamento correto. **Estrutura de DOM se verifica
  contando profundidade, não confiando no compilador.**
- **2026-09-14 — o script de verificação também erra:** minha contagem somava
  `<div ... />` (auto-fechada, o overlay do degradê) como abertura sem fechamento, e por isso
  acusou desbalanço numa árvore correta — me fazendo alternar entre dois estados errados.
  **Antes de agir sobre a medição, validar o medidor.**
- **2026-09-14 — corrigir o sintoma parcial adia o diagnóstico:** reduzir a altura da capa
  melhorou a aparência o bastante para eu acreditar que tinha resolvido, e o relato voltou.
  **Quando a correção depende de uma explicação elaborada para justificar por que resolve,
  em vez de atacar um defeito nomeável, provavelmente não resolve.**
- **2026-09-14 — proporção não é responsiva a contexto:** `aspect-[16/7]` foi copiado dos
  heros do marketplace sem reavaliar que o console tem largura total. Proporção que funciona
  num container estreito vira um monstro num largo. **`aspect-ratio` amarra altura à largura:
  se a largura é imprevisível, a altura também é.**
- **2026-09-14 — remover o controle não remove o filtro:** ocultar o `HealthFilterSelect` sem
  neutralizar o `?saude=` deixaria um link antigo filtrando a lista com a explicação
  invisível. **Ao esconder um controle, verificar quem mais escreve no estado dele.**

## 7. Links cruzados

- Depende de: [XG12](12-console-obra-tela-unica.md) (console em tela única),
  [XG13](13-mobile-e-polimento.md) (hero responsivo), [XG15](15-coerencia-saude-e-progresso.md)
  (a Saúde que agora sai de cena)
- Origem: uso real da obra `Vestiarios Cotia` em 2026-09-14
