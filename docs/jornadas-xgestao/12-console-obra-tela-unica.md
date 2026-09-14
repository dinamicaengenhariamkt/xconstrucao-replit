# Jornada — XG12: Console da obra em tela única

> Status: pronto (9 blocos) | Prioridade: alta | Wave: xgestão-12
> Última atualização: 2026-09-14

## Contexto

A XG10 fechou os 8 blocos do teste em obra real e entregou o que faltava de
funcionalidade — financeiro, aditivos, Gantt, documentos, storage. **O que sobrou não é
falta de recurso, é dispersão:** o que o empreiteiro precisa fazer está espalhado entre a
tela de detalhe, uma tela de edição separada e blocos soltos no rodapé.

O relato que abre esta jornada: *"falaram para mim que ficou confuso essa parte de
adicionar a atualização da obra lá em cima"*. O diagnóstico do código mostra que a
confusão tem causa objetiva — **o botão cria um registro que não tem onde ser visto**.

Objetivo: o empreiteiro resolve a obra inteira numa tela só, abrindo modal aqui ou ali,
sem navegar para outra página.

### As quatro causas

| Sintoma relatado | Causa raiz verificada no código |
|---|---|
| "adicionar atualização ficou confuso" | O botão está no hero e grava em `medicoes`. **Nenhuma aba lista `medicoes`.** Não existe `GET /api/obras/[id]/medicoes` |
| "isso tudo daria para colocar na tela inicial" | Capa, localização, descrição e link público só se editam em `/xgestao/obras/[id]/editar` |
| "ficaria mais feio tudo lá embaixo" | 6 blocos soltos abaixo das abas, dois deles duplicando abas existentes |
| "não sei se está mostrando o aditivo" | **Está.** `AditivosCard` na aba Financeiro (XG10 Bloco 3). O que engana é outra coisa — ver o achado A1 |

### A1 — o achado que muda o desenho

**"Medições Realizadas", no Resumo Financeiro, não são medições.**
[build-detalhe-server.ts:561](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts#L561)
monta a lista a partir de `finRows` — linhas da tabela `financeiro` — com `numero: i + 1`
gerado pelo índice do array:

```ts
medicoes: finRows.map((f, i) => ({ id: f.id, numero: i + 1, data: f.data, valor: ... }))
```

São lançamentos financeiros com rótulo de medição. Não têm etapa, percentual, descrição,
fotos nem autor — e nunca terão, porque a origem é outra tabela. É o mesmo padrão que a
XG10 §10 já nomeou: *"card sem fonte de dado é dívida que o usuário cobra"*.

Consequência colateral: [page.tsx:685](../../app/empreiteiro/minhas-obras/[id]/page.tsx#L685)
passa esses IDs para `TabDisputas` como `tipo: 'medicao'`. É bug de marketplace, hoje,
independente desta jornada.

### A2 — a aba Ocorrências não salva

[OcorrenciasSection.tsx:250](../../features/empreiteiro/minhas-obras/components/OcorrenciasSection.tsx#L250)
é `useState(obra.ocorrencias)` com `gerarId()` local — sem `useMutation`, sem `fetch`. O
que o usuário cria ali evapora no F5. Quem persiste é o `OcorrenciasJ06Card` do rodapé.
A duplicação é pior do que parecia: **a versão bonita é falsa, a feia é a verdadeira.**

## 2. Personas

- **Empreiteiro (xgestão)** — o cliente pagante. É quem opera esta tela.
- **Cliente final** — lê o link público. Não é usuário. Afetado só pela migração dos
  toggles de visibilidade, que não muda o que ele vê.
- **Marketplace** — o console é arquivo compartilhado. Toda mudança em `TABS` exige
  regressão (princípio da XG10 §8).

## 3. Decisão de produto — a aba "Atualizações"

Sua dúvida foi a certa: com Timeline, Etapas, Cronograma e Tarefas, **faz falta uma aba
de progresso?** A resposta é sim, e a verificação mostra por quê.

Cada atualização registrada grava em dois lugares:

| Destino | O que guarda | O que perde |
|---|---|---|
| `medicoes` (tabela) | etapa, **percentual, descrição, valor, fotos, autor, data** | — nada é perdido, mas **nada lê** |
| `atividades` → Timeline | tipo, etapa, percentual, valor ([medicoes/route.ts:299](../../app/api/empreiteiro/medicoes/route.ts#L299)) | **descrição e fotos** |

A Timeline mostra que houve avanço, misturado a todos os outros eventos da obra. Não
mostra o que foi feito nem as fotos. **O dado mais rico do produto está gravado e não é
lido por ninguém no console** — só o cliente final o vê, pelo link público
([TabAtualizacoesPublica.tsx](../../features/xgestao/obra-publica/components/TabAtualizacoesPublica.tsx)).

O dono está vendo menos da própria obra do que o cliente dele.

**Nome: "Atualizações"** — não "Progresso". Três razões:
1. `SECOES_PUBLICAS` já tem a chave `'atualizacoes'` e o cliente já vê uma aba com esse
   nome. Dois nomes para a mesma coisa entre o dono e o cliente é confusão nova.
2. O botão já diz "Adicionar Atualização". Onde se cria e onde se vê têm que usar a mesma palavra.
3. "Progresso" já está ocupado duas vezes na tela (barra do hero + KPI).

**Timeline fica.** Ela persiste de verdade (`useAtividadesObra`, tabela `atividades`) e é
o histórico de tudo — o registro de auditoria da obra. Atualizações é o feed de execução,
com fotos. São coisas diferentes; nenhuma substitui a outra.

## 4. Ordem das abas

Frequência de uso decrescente, com adjacência semântica preservada:

| # | Aba | Por que aqui |
|---|---|---|
| 1 | **Atualizações** 🆕 | O ciclo central. Vira a aba padrão (hoje abre em `tarefas`) |
| 2 | Tarefas | O que fazer a seguir; alimenta o KPI "Em andamento" |
| 3 | Etapas | O plano macro; tarefa pertence a etapa |
| 4 | Cronograma | As mesmas etapas no eixo do tempo |
| 5 | Fotos | Evidência; abastece a capa e o link público |
| 6 | **Diário** 🆕 | Promovido do rodapé; par natural de Fotos |
| 7 | Ocorrências | Exceção, não rotina; sobe no KPI quando importa |
| 8 | Checklists | Conferência por marco |
| 9 | Documentos | Consulta esporádica |
| 10 | Timeline | Histórico completo; consulta, não operação |
| 11 | Financeiro | Fim do dia/mês: baixa frequência, alta densidade |
| 12 | Saúde | **Desce de 1º para último** — é resumo derivado de tudo acima. O `HealthCard` continua sempre visível acima das abas; a aba é só o "por que estou amarelo?" |
| — | Disputas | Segue oculta no xgestão; no marketplace, entre Financeiro e Saúde |

## 5. O que sai do rodapé

| Hoje | Destino | Por quê |
|---|---|---|
| `ObraJ06Section` (bloco) | **Dissolvido** | O título "(dados ao vivo)" era confissão de que o resto não é |
| `DiarioJ06Card` | Vira **aba Diário** | Mesma instância, mesmas props |
| `FotosJ06Card` (do rodapé) | **Removido** | Duplicata literal da aba Fotos, mesmas props |
| `OcorrenciasJ06Card` | **Substitui** `OcorrenciasSection` na aba | É o que persiste (A2) |
| `OcorrenciasSection` | Sai da página, **arquivo preservado** | Reversibilidade, como `features/disputas/` |
| `FinanceiroSection` (bloco) | **Fundido** na aba Financeiro | Não é só apagar: os 4 KPIs de contrato migram (ver §6) |
| `EquipeSection`, `ContratoCard`, `LocalizacaoCard` | **Continuam no rodapé** | Contexto da obra, não fluxo de trabalho. `LocalizacaoCard` ganha botão "Editar" |
| `DetalhesObraCard` | **Continua acima das abas** | Espelha o link público por design; o link "Editar informações" passa a abrir modal |

A fusão do Financeiro não é deduplicação: a aba **não** tem Valor Contratado, Valor Total,
Saldo a Receber nem as barras % recebido/executado. Esses migram para o topo da aba. A
lista "Medições Realizadas" morre — são lançamentos (A1), e a aba já os lista corretamente
logo abaixo.

## 6. Modais na tela principal

**Backend: zero trabalho.** `PATCH /api/obras/[id]` já aceita tudo, verificado em
[app/api/obras/[id]/route.ts](../../app/api/obras/[id]/route.ts):
`fotoCapaFileId` (com anti-IDOR pronto para os dois caminhos), todos os campos de
endereço, e a permissão já exige `clienteId === null` — o marketplace fica protegido por
construção.

| Modal | Gatilho | Reusa |
|---|---|---|
| **Trocar capa** | Botão sobre a capa, no hero | `FileUploader` + grade de `GET /api/obras/[id]/fotos` |
| **Editar informações** | `DetalhesObraCard` → "Editar informações" | `Input`/`Textarea` + validações existentes |
| **Editar localização** | `LocalizacaoCard` → "Editar endereço" | `Input` |
| **Link público** | Já existe (`CompartilharModal`), agora com os toggles | `Switch` + `useAtualizarSecoes` |

O link público hoje está **fragmentado**, não duplicado: gerar/copiar no modal, mas
decidir o que o cliente vê só na tela de edição. Os toggles `SECOES_PUBLICAS` vão para
dentro do `CompartilharModal`, que já lê a mesma query.

**A tela `/editar` fica.** Serve dois papéis que modal não substitui: o onboarding guiado
de obra nova (a barra "Progresso do cadastro N/5" — preencher 15 campos em 4 modais
separados é pior) e a exclusão da obra, ação destrutiva que deve morar atrás de navegação
deliberada. Só a seção de link público migra.

> ⚠️ A ordem de `SECTIONS` em `EditarObraPage.tsx:214` é contrato com `completion.sections`
> por índice ([comentário nas linhas 206-213](../../features/xgestao/components/EditarObraPage.tsx#L206)).
> Não reordenar — a quinta entrada segue sendo `Boolean(shareQuery.data)`.

## 7. Blocos de execução

| # | Bloco | Entrega | Status |
|---|---|---|---|
| 1 | `GET /api/obras/[id]/medicoes` | O dado que falta | ✅ |
| 2 | Spec de integração do endpoint | Gate obrigatório (§9) | ✅ |
| 3 | `AtualizacoesTab` | A aba que fecha o relato | ✅ |
| 4 | Modais na tela principal | Capa, informações, localização, link | ✅ |
| 5 | Reordenar abas + dissolver o rodapé | A tela única | ✅ |
| 6 | Ocorrências que persistem + teste reescrito | Corrige A2 | ✅ |
| 7 | Nota fiscal no lançamento financeiro | Pendência da XG10 | ✅ |
| 8 | `TabDisputas` com IDs corretos | Corrige A1 (marketplace) | ✅ |
| 9 | **Tour guiado** | **Por último**, com a tela estável | ✅ |

> **Verificado ao final:** `npm run check` limpo; **331 specs da suíte de
> integração passando, zero falhas**; gate de cobertura OK (0 gaps novos).
> A suíte de browser (`test:e2e:xgestao`) **não pôde rodar neste ambiente** —
> falta `libglib-2.0.so.0` no sistema para o Chromium (o binário baixa, mas não
> inicia); o teste de ocorrências foi reescrito e **precisa rodar numa máquina
> com as libs antes do próximo teste com o cliente**.

### Revisão de código — 3 correções aplicadas

Um passe de revisão sobre o diff encontrou três defeitos reais, todos corrigidos:

1. **`comprovanteFileId` sem validação de posse** (segurança). O campo era aceito
   desde a XG10 mas nenhuma UI o preenchia; o anexo de nota fiscal ativou o caminho.
   Dava para referenciar arquivo alheio no próprio lançamento — não vazaria o conteúdo
   (`/api/uploads/sign` checa o dono antes de assinar), mas criaria FK entre tenants,
   e com `onDelete: set null` o ciclo de vida do arquivo de um afetaria a linha de outro.
   Corrigido com `features/financeiro/api/validar-comprovante.ts`, aplicado no POST e no
   PATCH, seguindo o padrão que `contratante/pagamentos/[id]/quitar` já usava. **Com spec.**
2. **`data-tour` duplicado.** Hero e aba usavam o mesmo seletor; `querySelector` pega o
   primeiro do DOM, então o passo "Registrar um avanço" iluminava o botão do hero — o
   mesmo elemento do passo anterior, com a troca de aba sem efeito visível. A aba passou
   a usar `adicionar-atualizacao-aba`.
3. **`medir` disparava o `scroll` que reagendava `medir`.** Ao dar `onEnter` ao tour,
   o `scrollIntoView` entrou dentro de `medir`, que também é handler de `scroll`. O
   `scrollIntoView` voltou para fora, chamado uma vez no `requestAnimationFrame`.

Mais três ajustes menores: `open` nas dependências do `TrocarCapaModal` (consistência com
os modais irmãos), `enabled` no `fotosQuery`, e `obra?.id` nas deps do deep-link
`?tab=medicoes`, que saía pelo guard do ref e nunca voltava a rodar.

### Arquivos criados

- `app/api/obras/[id]/medicoes/route.ts`
- `features/empreiteiro/minhas-obras/hooks/use-obra-medicoes.ts`
- `features/empreiteiro/minhas-obras/components/AtualizacoesTab.tsx`
- `features/xgestao/hooks/use-editar-obra.ts` — `patchObra`, validações e payloads, antes duplicados na tela de edição
- `features/xgestao/components/CapaObraEditor.tsx` — a seção de capa, compartilhada entre modal e tela
- `features/xgestao/components/{TrocarCapa,EditarInformacoes,EditarLocalizacao}Modal.tsx`
- `tests/e2e/integration/xgestao-atualizacoes.integration.spec.ts`

### Bloco 1 — endpoint
Criar `app/api/obras/[id]/medicoes/route.ts`. Reusar `listMedicoesForObra()` de
[app/api/contratante/medicoes/_shared.ts](../../app/api/contratante/medicoes/_shared.ts) —
já devolve etapa, descrição, percentual, valor, fotos, status e datas. Molde de guard:
`app/api/admin/obras/[id]/medicoes/route.ts`.
Guard: `findObraAccess` **sem** `allowDiscovery` (fail-closed, como diário e fotos).

Único ajuste no dado: `mapToApiShape` faz `empreiteiroNome: empreiteiraNome ?? empreiteiroNome`
— prioriza a **empresa**. No xgestão toda obra é da mesma empreiteira, então o campo seria
inútil. Adicionar `autorNome: r.empreiteiroNome` de forma **aditiva**, sem remover
`empreiteiroNome` (o contratante e o admin dependem dele). Sem migration.

### Bloco 3 — a aba
`useObraMedicoes(obraId)` com `queryKey: ['obras', obraId, 'medicoes']` — o
`RegistrarMedicaoModal` já invalida `['obras', obraId]` e o React Query casa por prefixo:
**a lista atualiza sozinha, sem tocar no modal.**

O botão "Adicionar atualização" vai **dentro da aba** (e permanece no hero). O empty state
é o convite: "Nenhuma atualização registrada ainda" + o botão. Badge de status só quando
`!isOwnWork` — na obra própria toda medição nasce aprovada, o badge seria ruído.

### Bloco 4 — antes dos modais, extrair
Criar `features/xgestao/hooks/use-editar-obra.ts` movendo `patchObra()`
([EditarObraPage.tsx:107](../../features/xgestao/components/EditarObraPage.tsx#L107),
incluindo o desempacotamento de `fieldErrors` que faz o erro de CEP chegar legível),
`invalidateObra()` (linha 316) e as validações do `saveMutation` (linhas 326-342).
A seção de capa (linhas 574-637) vira `CapaObraEditor.tsx` compartilhado entre o modal e a
tela de edição — senão a próxima mudança de capa precisa ser feita duas vezes.

> Remover o comentário obsoleto em [page.tsx:333-339](../../app/empreiteiro/minhas-obras/[id]/page.tsx#L333)
> ("Sem 'Alterar foto de capa' aqui…"). A premissa dele — "o PATCH recusa empreiteiro por
> design" — já não vale para obra própria xgestão.

### Bloco 7 — nota fiscal
Único item `[ ]` da XG10 e pedido explícito: *"E poder anexar nota fiscal também, se for o
caso"* (06:02). A API já aceita `comprovanteFileId`
([financeiro/route.ts:40](../../app/api/obras/[id]/financeiro/route.ts#L40)); falta o
`FileUploader` no `LancamentoFinanceiroModal` e o link do comprovante na lista.

### Bloco 9 — tour, por último
`GuidedTour` ganha `TourStep.onEnter?: () => void` (aditivo) para trocar de aba antes de
medir o alvo — hoje um passo que aponta para dentro de uma aba mede um elemento que não
existe e cai em `setRect(null)`. Chamar `onEnter` antes do `querySelector` e adiar a
medição um frame.

Roteiro novo de 7 passos, com os dois primeiros resolvendo o relato de origem lado a lado:
progresso geral → **aba Atualizações (onde vejo)** → **botão adicionar (onde crio)** →
abas do dia a dia → trocar capa → detalhes e endereço → compartilhar link.

Trocar a chave para `xgestao-tour-console-v2-visto`: quem já viu o roteiro antigo viu uma
tela que não existe mais.

## 8. Critérios de aceite

1. Registrar atualização → ela aparece **na aba Atualizações**, com etapa, %, descrição, autor e fotos, sem recarregar.
2. A aba Atualizações é a primeira e a padrão ao abrir a obra.
3. Trocar a capa pelo hero → a capa muda e sobrevive ao F5.
4. Editar endereço pelo modal do `LocalizacaoCard` → o card reflete; CEP inválido dá erro por campo.
5. Gerenciar link público → gerar, copiar **e** marcar o que o cliente vê, tudo no mesmo modal.
6. Criar ocorrência → **continua lá depois do F5** (hoje não continua).
7. Nenhum bloco duplicado abaixo das abas: Diário e Ocorrências só como aba.
8. Aba Financeiro traz Valor Contratado, Valor Total, Saldo a Receber e as duas barras.
9. Anexar nota fiscal a uma saída → o comprovante abre pela lista.
10. **Regressão marketplace:** aba Disputas presente, `FinanceiroTab` com `podeLancar={false}`, `ContatoContratanteCard` presente, badge de status nas medições, `PATCH` de obra alheia segue **403**.
11. **Regressão contratante:** `/contratante/minhas-obras/[id]` e `ValoresContratados` compilam e renderizam sem mudança (props novas são opcionais).
12. Tour: 7 passos, troca de aba entre eles, "Pular" dispensa, "Ajuda" reabre.

## 9. Riscos

- **`tests/e2e/xgestao-obras.browser.spec.ts:313` vai quebrar.** Exercita a aba Ocorrências
  pela UI da `OcorrenciasSection` (`Reportar Problema`, `input-data-abertura-ocorrencia`).
  O `OcorrenciasJ06Card` não tem esses campos. O teste valida mascaramento de data **num
  formulário que não salva**. Reescrever para o fluxo que persiste — criar, recarregar,
  verificar que continua lá — e não preservar o componente só para o teste passar. Fazer
  Ocorrências em commit separado, depois do resto verde.
- **Gate de cobertura é total:** `scripts/integration-coverage-baseline.json` tem
  `"endpoints": []`. Endpoint novo sem spec reprova `npm run test:integration:gaps:strict`.
  Por isso o Bloco 2 vem logo após o 1.
- **`LocalizacaoCard` e `FinanceiroTab` são compartilhados** com o contratante. Props novas
  **sempre opcionais**.
- **A ordem de `SECTIONS`** na edição é contrato por índice (§6).
- **Dois componentes ficaram sem import:** `FinanceiroSection.tsx` (130 linhas) e
  `OcorrenciasSection.tsx` (445). Preservados de propósito — mesmo princípio de
  `features/disputas/` na XG10: reversibilidade é entregável, e apagar não era pedido.
  Somam-se aos órfãos que a XG10 já listou (`CronogramaSection`, `FotoGallerySection`,
  `RelatoriosSection`). **Cinco componentes órfãos é sinal de que uma limpeza merece
  tarefa própria**, com busca por referências antes de remover.
- ~~**Os outros blocos também não persistem:** `TaskManagerSection`, `ChecklistsSection`,
  `DocumentosSection` e `EquipeSection` seguem o mesmo padrão de estado local que a A2
  encontrou em Ocorrências.~~
  **Corrigido na XG13 — o risco estava errado.** A auditoria pedida foi feita e os
  quatro **persistem via API**: `TaskManagerSection`, `ChecklistsSection` e
  `EquipeSection` consomem as mutations de
  [use-obra-operacao.ts](../../features/empreiteiro/minhas-obras/hooks/use-obra-operacao.ts)
  (`useCreateTarefa`, `useUpdateTarefa`, `useCreateChecklist`, `useCreateMembro`…) e
  `DocumentosSection` usa `useExcluirAnexo` de `use-obra-anexos.ts`, com a lista vinda
  do servidor desde a XG10 Bloco 6. O texto descrevia o estado *anterior* à XG10 e
  sobreviveu por inércia. **Risco herdado também é afirmação: vale reconferir no código
  antes de repetir.**

## 10. Verificação

```bash
npm run check                          # TypeScript
npm run test:integration:gaps:strict   # gate do endpoint novo
npm run test:integration               # ambiente dev; nunca produção
npm run test:e2e:xgestao               # browser — espera-se a quebra do Bloco 6
```

Specs a rodar por bloco: `xgestao-atualizacoes` (novo), `empreiteiro-medicoes-candidaturas`
(trava do `empreiteiroNome`), `xgestao-obras` (PATCH e guard), `xgestao-share` (toggles
migrados), `xgestao-obra-publica` (projeção intacta), `xgestao-financeiro` (fusão),
`disputas` (Bloco 8).

Manual: abrir a mesma tela como **obra própria** (`/xgestao/obras/[id]`) e como **obra de
marketplace** (`/empreiteiro/minhas-obras/[id]`) — é o mesmo arquivo servindo os dois.

## 11. Fora de escopo

- **App nativo / PWA** — pedido na reunião (*"o cara não vai pegar um computador pra lançar"*,
  17:08), respondido na hora como segundo momento. É a [XG11](../../docs/jornadas-xgestao/11-offline-pwa.md), planejada.
- **Salvar diário automaticamente** — avaliado e recusado na XG10 Bloco 8: registro datado
  e assinado salvo a cada tecla cria entradas pela metade.
- **Persistência de Tarefas/Checklists/Documentos/Equipe** — ver §9.
- **Preview de mais formatos de documento** — PDF e imagem já abrem (XG10 Bloco 6).

## 12. Links cruzados

- Depende de: [XG09](../../docs/jornadas-xgestao/09-administracao-obra-ponta-a-ponta.md) (GuidedTour, DetalhesObraCard), [XG10](../../docs/jornadas-xgestao/10-ajustes-teste-obra-real.md) (financeiro, aditivos, etapas)
- Relacionada: [XG04](../../docs/jornadas-xgestao/04-link-publico-obra.md) (toggles de seção), J06 (medições), J07 (atividades/timeline)
- Origem: [transcrição de 2026-09-12](../../docs/novo-fluxo/reuniao-xconstrucao-testes-xgestao.json) + conversa de 2026-09-14

## 13. Gaps descobertos

> Doc viva. Uma linha por item, com data.

- **2026-09-14 — o dado mais rico do produto não é lido por ninguém:** `medicoes` guarda
  percentual, descrição, fotos e autor, e nenhuma tela autenticada faz `GET`. Só o cliente
  final vê, pelo link público. O dono está vendo menos da própria obra do que o cliente dele.
- **2026-09-14 — "Medições Realizadas" são lançamentos financeiros:** um `map` sobre
  `finRows` com `numero` gerado pelo índice. O rótulo errado sobreviveu porque ninguém
  cruzou a lista com a tabela `medicoes`. **Rótulo é contrato: dizer "medição" sobre outra
  tabela propaga o erro para quem consome** — o `TabDisputas` já passa esses IDs como
  `tipo: 'medicao'`.
- **2026-09-14 — a versão bonita é a falsa:** `OcorrenciasSection` (445 linhas, filtros,
  modais, máscara de data) não salva nada; o `OcorrenciasJ06Card` simples do rodapé é que
  persiste. Havia até teste de browser cobrindo o formulário fantasma — **cobertura de UI
  não é prova de persistência.** O assert que faltava era um F5.
- **2026-09-14 — o listener que rolava a página que ele mesmo media:** ao dar `onEnter` ao
  `GuidedTour`, o `medir()` original chamava `scrollIntoView` e estava registrado como
  handler de `scroll`. Rolar disparava medir, que rolava de novo. Separar `medir` (mede e
  rola, uma vez por passo) de `remedir` (só mede, nos listeners) resolveu. **Um handler de
  evento que provoca o próprio evento é um loop esperando a condição certa.**
- **2026-09-14 — a nota fiscal estava a um `FileUploader` de distância:** `comprovanteFileId`
  era aceito pela API, tipado em `NovoLancamentoInput` e persistido desde a XG10. O item
  ficou aberto por faltar o input. Vale olhar o backend antes de estimar um pedido de UI:
  metade já podia estar pronta.
- **2026-09-14 — o Chromium não roda neste ambiente:** falta `libglib-2.0.so.0`, e
  `replit.nix` não declara pacote de sistema algum. A suíte de browser falha no *launch*,
  não nos testes — **é bom saber distinguir as duas coisas antes de culpar um diff.**
- **2026-09-14 — o campo que esperava uma UI para virar buraco:** `comprovanteFileId` era
  aceito, tipado e persistido havia uma jornada inteira, sem validação de posse — e sem
  risco, porque nada o preenchia. Ligar o upload transformou código dormente em superfície
  de ataque. **Campo aceito por uma API é contrato, mesmo sem UI:** quem ativa o caminho
  herda a obrigação de validá-lo, e a rota irmã já tinha o padrão pronto.
- **2026-09-14 — dois elementos, um seletor:** o passo do tour apontava para
  `[data-tour="adicionar-atualizacao"]` e existiam dois no DOM. `querySelector` não erra
  nem avisa — devolve o primeiro. O passo "funcionava", destacando o elemento errado.
  **Seletor de tour é identificador único disfarçado de atributo.**
