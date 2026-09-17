# Jornada — XG21: o checklist que se repete e o mapa que foi acusado à toa

> Status: ✅ implementado (verificação visual pendente) | Prioridade: alta | Wave: xgestão-21
> Última atualização: 2026-09-17

## 1. Contexto

Dois pedidos de `docs/novo-fluxo/ajustes/`. Um era uma feature que faltava; o outro era um
relato de bug cuja causa **não estava no código acusado** — mas a investigação encontrou dois
bugs reais ao lado.

## 2. Os achados

### A1 — o checklist precisava ser recriado todo dia

> *"Tem que colocar algum tipo de recorrência, ou diário, ou semanal, porque senão eu tenho que
> criar todo dia que for fazer o checklist (...) deu meia-noite, ele zera, o stick some, daí eu
> tenho que ir lá na obra e ticar tudo de novo (...) Aí o cliente entra no dia lá, se tiver sem
> ticar, quer dizer que não foi feito no dia."*

São **duas** necessidades, e a segunda é a difícil: zerar **e** conseguir provar depois o que
foi feito em cada dia. O estado ticado era `obra_checklist_itens.concluida`, um booleano
destrutivo — zerar ali apagaria a evidência de que os EPIs foram conferidos ontem.

O campo `tipo` já tinha o valor "Diário", mas é só rótulo, ícone e cor: nenhum comportamento.
E o pedido foi reset diário num checklist de **Segurança/EPIs** — então recorrência tinha de
ser um eixo próprio, não um quarto tipo.

### A2 — não existe cron neste projeto

Sem `vercel.json`, sem `node-cron`, sem worker. O padrão do repo
(`scripts/aviso-expiracao-inadimplente.ts`) é script `tsx` agendado **à mão** no painel do
Replit. Uma feature que só funciona se alguém lembrar de configurar um agendamento é uma
feature quebrada — e "zera à meia-noite" é exatamente o tipo de promessa que não pode depender
disso.

### A3 — o endereço que "não aparecia no mapa" tinha o CEP trocado

O relato: "Rua dos Carvalhos, 400, CEP 06070-212" mostrava *"Não foi possível localizar este
endereço no mapa"*. Testado contra as APIs reais em 2026-09-17:

| Teste | Resultado |
|---|---|
| CEP `06070-212` no ViaCEP (base dos Correios) | **não existe** |
| "Rua dos Carvalhos" em Osasco | **não existe** |
| Busca por logradouro em Cotia/SP | **Rua dos Carvalhos, CEP `06701-212`** |
| `Rua dos Carvalhos, 400, Cotia, SP` no Nominatim | **achou a rua exata** (`-23.6150111, -46.9711208`) |
| 6 endereços brasileiros reais | 5 resolveram na rua; o 6º no bairro/cidade |

O endereço **existe**, em Cotia, e o CEP real é `06701-212` — o que foi cadastrado tem os
dígitos transpostos (`701`→`070`). O mapa acertou em não inventar um ponto; o dado é que estava
errado. **Nenhum serviço de mapa do mundo acharia aquele CEP.**

A causa raiz é de produto: **nada validava o CEP no cadastro da obra**. O `lookupCep` (ViaCEP)
já existia em `shared/lib/masks.ts:67` e já era usado em `features/perfil/components/CepInput.tsx`
— só nunca foi ligado ao formulário da obra.

### A4 — o travessão envenenava a busca e mostrava o lugar errado, calado

`features/obras/adapters.ts:425` usava `cidade: o.cidade ?? '—'`. Como `cidade`/`uf` são
nullable, uma obra sem cidade gerava a query `"—, —, Brasil"` — que o Nominatim **resolve com
sucesso**, para o centro geográfico do Brasil (Mato Grosso, `-10.33, -53.20`).

O usuário via um marcador confiante no lugar errado. **Isso é pior que a mensagem de erro que
foi reportada**, porque não avisa nada. Era placeholder de *exibição* vazando para dado de
*busca*.

### A5 — o bairro dos Correios derruba a busca do OSM

Descoberto ao testar o resgate por CEP: o ViaCEP devolve "Residencial Recanto Verde" e o OSM
conhece "Recanto Verde". Incluir o bairro na query **zera o resultado**; sem ele, acha na hora.
A cascata passou a tentar sempre **sem bairro primeiro**.

### A6 — `User-Agent` para o Nominatim é impossível no browser

A política do Nominatim exige UA identificável, e fora do navegador ele responde **403** sem
isso (confirmado: mesmo endereço, 403 sem UA, 200 com UA). Mas o browser **proíbe** o JS de
definir `User-Agent` — manda o do próprio Chrome/Safari. O item saiu do escopo por ser
inexequível onde o código roda: atender a política de verdade exige geocodificar **no
servidor**, o que só faz sentido junto com persistir `lat`/`lng` (§5).

## 3. Decisões

- **Reset calculado, não executado.** Cada tique vira uma linha ancorada num `periodo_ref`; o
  "zerar" é o período novo nascendo sem linhas. Dispensa cron, funciona mesmo se ninguém abrir
  o app à meia-noite, e **preserva o histórico** — que é a metade do pedido que um UPDATE
  destrutivo não atenderia.
- **Ancorar em `item_ordem`, não em `item_id`.** O PATCH de edição faz DELETE + reinsert dos
  itens, então os IDs não sobrevivem a uma correção de texto. Uma FK para `item_id` apagaria o
  histórico inteiro por causa de um typo arrumado.
- **Recorrência ortogonal ao `tipo`.** Amarrá-la ao tipo "Diário" obrigaria o cliente a
  escolher entre a cor certa (vermelho de Segurança) e o comportamento certo.
- **Fuso fixo `America/Sao_Paulo`, calculado no servidor.** A virada tem de ser a meia-noite da
  obra, não a do navegador de quem abriu a tela. Mesmo fuso de
  `features/planos/aviso-expiracao-job.ts:185`.
- **Manter o mapa.** Funciona para a maioria dos endereços reais; o caso relatado era dado
  inválido. Mas ficou **menor** (1/3 da largura, `h-64`) e **honesto** (selo de precisão).
- **Selo de precisão.** Um mapa que caiu no fallback de cidade parece tão exato quanto o que
  achou a porta. É a mesma armadilha do placeholder que a XG18 removeu — ver §6 daquela
  jornada.

## 4. Checklist de execução

### Parte 1 — Recorrência do checklist
- [x] Enum `obra_checklist_recorrencia` + colunas `recorrencia` / `recorrencia_dia_semana`
      (default `'nenhuma'`: todo checklist existente segue igual)
- [x] Tabela `obra_checklist_marcacoes` com UNIQUE `(checklist_id, item_ordem, periodo_ref)`
- [x] `migrations/0006_checklist_recorrencia.sql` + bootstrap idempotente (é o bootstrap que
      aplica de fato; a migration é documental, como as demais)
- [x] `checklist-periodo.ts` — cálculo puro do período, **11 testes unitários**
- [x] `checklist-recorrencia.ts` — projeção compartilhada pelos 4 consumidores (API, console,
      contratante, obra pública), para nenhum divergir do outro
- [x] GET/POST/PATCH projetando o período corrente
- [x] Campo "Recorrência" no modal + seletor de dia para o ciclo semanal
- [x] Selo "Repete todo dia" e aviso **"Não foi feito hoje"** nos cards
- [x] Duplicar herda o ciclo
- [x] Tabela nova incluída em `limpar-base.ts` e no script de exclusão de obra

### Parte 2 — Mapa
- [x] `?? '—'` → `?? ''` nos adapters (o bug do centro do Brasil)
- [x] `preenchido()` nos dois componentes — defesa em profundidade
- [x] Cascata nova: rua sem bairro → rua com bairro → bairro → cidade → **ViaCEP**
- [x] `resposta.ok` checado: 429/503 vira "Mapa temporariamente indisponível", não "endereço
      não encontrado"
- [x] Selo "Localização exata" × "Local aproximado — confira o endereço"
- [x] Ícones do marcador servidos de `public/leaflet/` (era CDN unpkg) — nos **dois** mapas
- [x] Mapa 1/3 + `h-64`; endereço e ações com 2/3
- [x] "Cidade não informada" no lugar do traço solto
- [x] `CepInput` ligado ao modal de endereço da obra — a causa raiz do `06070-212`

### Fechamento
- [x] `npm run check` (tsc) limpo
- [x] `npm run test:checklist:periodo` — 11/11
- [x] Integração de checklists — 6/6 (2 antigos + 4 novos)
- [x] Suíte `--project=api` completa — **495 passaram**; as 13 falhas são **pré-existentes**,
      confirmado rodando as mesmas specs com `git stash` (admin-aprovacao, admin-real FAQ,
      curadoria-warning, xgestao-obras/planos/fundacoes, j40)
- [x] `npm run test:integration:gaps` — 0 endpoints críticos sem cobertura
- [ ] Verificação visual: modal com o campo novo, virada de dia com o card zerado, selo do mapa,
      mapa abaixo dos modais (o `isolate` — regressão já vista na XG19 A3)

## 5. Fora de escopo (dívida)

- **`lat`/`lng` ainda não persistidos** (XG18 §5). Hoje geocodifica a cada visita, sem cache.
  Ganhou um motivo a mais: geocodificar no servidor é a **única** forma de enviar o
  `User-Agent` que o Nominatim pede (A6) e de parar de expor o IP de cada usuário.
- **`completado_em` continua TEXT `"21:14"`**, sem data e sem fuso. Para checklist recorrente o
  campo é projetado (some quando o período vira), mas o tipo segue frágil.
- **PATCH com `itens` continua DELETE + reinsert fora de transação** — risco já registrado em
  `16-revalidacao-pre-teste.md:174`. A ancoragem por `ordem` contorna o efeito no histórico,
  mas a rota em si não foi endurecida.
- **13 falhas pré-existentes na suíte** (cota/publicação de obra, aprovação admin, FAQ com
  `visao: "anunciante"`). Nenhuma tocada aqui; merecem jornada própria.

## 6. Gaps descobertos

- **2026-09-17 — o dado errado acusou o código certo.** O mapa foi reportado como quebrado, e
  estava correto: o CEP cadastrado não existe nos Correios. **Antes de consertar o componente
  acusado, vale testar o dado do relato contra a fonte externa** — 3 chamadas de API mostraram
  que o endereço real ficava em outra cidade.
- **2026-09-17 — um placeholder de exibição virou dado de busca.** `'—'` existia para a tela
  mostrar um traço bonito; quando o mesmo objeto passou a alimentar o geocoding, virou uma
  query válida com resposta válida e **errada**. **Objeto que serve exibição e busca ao mesmo
  tempo não pode carregar placeholder: o vazio tem de continuar vazio.**
- **2026-09-17 — "mais campos" pode significar menos resultado.** Somar o bairro à busca
  parecia refinar; na prática zerava o resultado quando OSM e Correios discordam do nome.
  **Numa cascata de geocoding, a tentativa mais específica não é a melhor primeira — a mais
  provável é.**
- **2026-09-17 — feature que depende de agendamento manual é feature opcional.** Sem cron no
  projeto, "zera à meia-noite" viraria uma promessa condicionada a alguém configurar um painel.
  **Calcular na leitura entregou o mesmo resultado sem infraestrutura — e de brinde preservou o
  histórico, que o job destrutivo teria apagado.**
- **2026-09-17 — a política externa pode ser inexequível onde o código roda.** O Nominatim pede
  `User-Agent` identificável; o browser proíbe defini-lo. **Antes de planejar conformidade com
  uma API externa, conferir se o ambiente de execução permite cumpri-la.**

## 7. Links cruzados

- Depende de: [XG18](18-consolidacao-edicao-e-mapa.md) (o mapa que esta jornada corrige e
  encolhe), [XG19](19-upload-e-acabamento.md) (o `isolate` do z-index do Leaflet)
- Origem: `docs/novo-fluxo/ajustes/solicitacao-checklist.json` + relato do endereço (2026-09-16)
- Os outros dois pedidos da mesma pasta (`solicitacao-card-saida.txt`,
  `solicitacao-ocorrencias.txt`) já haviam sido entregues na
  [XG20](20-beneficiario-saida-e-datas.md)
