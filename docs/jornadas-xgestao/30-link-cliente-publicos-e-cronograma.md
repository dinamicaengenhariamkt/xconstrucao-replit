# Jornada — XG30: um link por público, cronograma no link e o que é interno sai

> Status: ✅ implementado (verificação visual pendente) | Prioridade: alta | Wave: xgestão-30
> Última atualização: 2026-09-28

## 1. Contexto

O Dedé passou a preencher uma obra real, o "Apartamento Fernanda", e mandou o link público para
acompanharmos junto (`link-cliente-002.txt`). Nos outros três áudios ele aponta, olhando a página
como o cliente dele a veria, o que sobra e o que falta.

Conferido ao vivo em 2026-09-28 no link de produção: as abas visíveis são **Atualizações** (vazia),
**Etapas**, **Fotos** e **Checklists**. Não há cronograma nem pagamentos. O print
`link-cliente-img-001.jpeg` mostra a aba Atualizações aberta com "Nenhuma atualização registrada
ainda.".

## 2. Os achados

### A1 — o checklist é interno e aparece para o cliente

> *"O checklist eu acho bom não acompanhar, não tem porquê, eu criei um checklist aí, por exemplo,
> no nosso interno de obra que aparece para o cliente, não tem porquê aparecer, daí dá para tirar
> também."*

`checklists` nasce **ligado** em `SECOES_PADRAO`
([`secoes.ts`](../../features/xgestao/obra-publica/secoes.ts)). Todo link sem preferência salva
publica o checklist, e foi o que aconteceu com o do Dedé. A frase dele não pede "desligado por
padrão": pede que o checklist **não seja conteúdo do link**. É registro operacional, como a XG04 §8
já classificava diário e ocorrências.

### A2 — a aba Atualizações não tem quem a alimente

> *"Essa aba de atualizações não está puxando nada. E na parte do nosso de preenchimento não tem
> como eu pôr nada nessa aba também (...) ou coloca alguma coisa para ela puxar alguma informação
> (...) ou tira, porque não está puxando nada, tá?"*

A aba lê `medicoes` com `status='aprovada'`. Na [XG23](23-etapas-progresso-manual.md) o próprio
Dedé pediu *"exclui essa aba atualizações"*, e `tabsVisiveis()` passou a ocultá-la na obra
própria. Só que o link público **só existe para obra própria** (`resolveActiveObraShareToken`
exige `clienteId IS NULL`). O resultado: uma aba pública cuja única porta de entrada foi fechada
de propósito. A XG23 §dívidas já registrava o sintoma.

**Decisão desta sessão: remover.** Alimentar a aba pela timeline interna (tabela `atividades`)
exigiria um filtro de eventos seguros para expor, e qualquer tipo novo de atividade poderia vazar
sem ninguém perceber. Com cronograma (A3) e fotos, o cliente já vê a evolução.

### A3 — o cliente vê as etapas, mas não o cronograma

> *"Nesse link ele tá aparecendo as etapas. Melhor do que a etapa era aparecer o cronograma
> também, né? Pode manter a etapa, mas acho que é importante aparecer o cronograma pro cliente."*

O cronograma não é tabela própria: é `obra_etapas.dataInicio` + `prazo`, desenhado por
[`CronogramaGanttCard`](../../features/empreiteiro/minhas-obras/components/CronogramaGanttCard.tsx)
(Gantt em SVG, com o atraso da [XG25](25-cronograma-atraso-visivel.md)). Dois bloqueios:

1. A projeção pública seleciona das etapas só nome, descrição, progresso e status: **as datas não
   saem do banco**.
2. O card sempre busca os dados sozinho, via `useObraEtapas` → `/api/obras/[id]/etapas`, que é
   rota autenticada. Não tem prop `data`, ao contrário dos cards J06 que o link já reusa.

### A4 — pagamentos para o cliente, e só para ele

> *"O que seria bom o cliente ver seria a parte de pagamento, porém, não poderia aparecer em todos
> os links, teria que ter um link só para o cliente (...) e outro link, por exemplo, arquiteto, às
> vezes o arquiteto não precisa saber de pagamento, ou outras pessoas não precisam saber de
> valores."*

Aqui há dois pedidos, e o primeiro é pré-requisito do segundo:

- **Mais de um link por obra.** Hoje o índice parcial `obra_share_links_one_active_obra_uniq`
  garante **no máximo um link ativo por obra**, e gerar outro revoga o anterior
  (`createOrRotateObraShareLink`). Não há como o cliente e o arquiteto terem visões diferentes.
- **Uma seção de pagamentos.** O contrato `ObraPublicaView` diz, literalmente, *"Não acrescente
  finanças"*, e o modal promete *"Valores, lucro, equipe e o endereço exato nunca são
  compartilhados"*. A regra existiu porque o link era um só: sem controle de público, qualquer
  valor ia para todos. Com links separados, o risco fica sob controle, desde que a seção nasça
  **desligada** e a projeção exponha só o lado do recebimento.

## 3. Decisões

- **Vários links nomeados por obra** (decisão do usuário, 2026-09-28). Cada link tem um `nome`
  ("Cliente", "Arquiteto"…), suas próprias seções, validade e contador de visualizações. O índice
  de unicidade sai, e o teto de **5 links ativos por obra** passa a ser checado no servidor. Links
  existentes viram "Cliente" pelo default da coluna.
- **Revogar e trocar seções passam a ser por link**, com rotas `share/[linkId]`. O `linkId` é
  sempre validado contra a `obraId` da URL (IDOR). "Gerar novo link" deixa de revogar o anterior:
  vira "Novo link". Para trocar o endereço, o dono revoga e cria outro.
- **Checklist e Atualizações saem do link inteiro**, não só do padrão. Saem de
  `SECOES_PUBLICAS`, da projeção, do shell e do contrato. `normalizarSecoes` ignora chaves
  desconhecidas, então o `secoes` jsonb salvo nos links antigos continua válido **sem migration
  de dados**. As telas internas não mudam.
- **Cronograma é seção nova, ligada por padrão.** É exatamente "evidência de andamento", o
  critério da XG04 §8. O `CronogramaGanttCard` ganha `data?` e `readOnly?` no padrão J06: estende
  o componente, não o copia (README, decisão de arquitetura nº 5).
- **Pagamentos é seção nova, desligada por padrão**, com o aviso "Mostra valores do contrato e
  parcelas" no toggle. O conteúdo:
  - **Resumo:** valor do contrato (`obras.valorTotal` + aditivos), recebido e saldo a receber,
    **pela mesma regra da aba Financeiro** (XG22: o recebido vem dos lançamentos pagos em que o
    empreiteiro é recebedor, e não de `obras.valor_pago`). A classificação receita/custo é
    extraída de `build-detalhe-server.ts` para um helper puro, usado pelas duas telas.
  - **Parcelas:** só os lançamentos classificados como **receita**, sem `cancelado`, com
    descrição, valor, vencimento, data de pagamento e status (pago / pendente / atrasado).
  - **Nunca sai:** despesa/custo, fornecedor ou beneficiário, lucro, resultado, método de
    pagamento, comprovante, PIX, equipe.
- **O contrato `types.ts` é reescrito**, e não apenas relaxado: a lista do que nunca entra fica
  explícita, e `pagamentos` é o único bloco financeiro permitido. O texto do modal passa a dizer
  que valores só aparecem com Pagamentos ligado, e que lucro, custos e equipe nunca aparecem.
- **O `progresso` morto sai da projeção** (dívida da [XG29](29-remocao-total-do-percentual.md)).

## 4. Checklist de execução

### Parte 1 — Checklist e Atualizações saem do link (A1, A2)
- [x] `secoes.ts`: remover `checklists` e `atualizacoes` de `SECOES_PUBLICAS`, `SECOES_PADRAO` e
      `SECAO_LABELS`
- [x] `projection.ts`: remover as queries de checklists e medições e o `progresso` da obra
- [x] `ObraPublicaShell.tsx`: remover as duas abas e o import de `TabChecklists`; Etapas vira a
      aba padrão; apagar `TabAtualizacoesPublica.tsx`
- [x] `types.ts`: remover `atualizacoes`, `checklists` e `obra.progresso` do `ObraPublicaView`

### Parte 2 — Cronograma no link (A3)
- [x] Projeção: `dataInicio` e `prazo` nas etapas; seção `cronograma` reaproveita a mesma query
- [x] `CronogramaGanttCard`: props `data?` (pula o fetch) e `readOnly?` (esconde "ir para etapas")
- [x] Seção `cronograma` (padrão ligado) + `TabCronogramaPublica.tsx` como wrapper fino

### Parte 3 — Vários links nomeados (A4)
- [x] Migration: `obra_share_links.nome text not null default 'Cliente'`; remover
      `obra_share_links_one_active_obra_uniq`
- [x] `token.ts`: listar, criar (teto de 5), alterar seções, renomear e revogar **por id**
- [x] API: `GET`/`POST` em `share/`; `PATCH`/`DELETE` em `share/[linkId]/` com checagem
      `linkId ∈ obraId`
- [x] Hooks: `useObraShares` (lista), criar, atualizar e revogar por id
- [x] `CompartilharModal`: lista de links, "Novo link" com nome e validade, seções por link
- [x] `LinkPublicoBloco` (página da obra): "N links ativos"

### Parte 4 — Seção Pagamentos (A4)
- [x] Helper puro de classificação receita/custo extraído de `build-detalhe-server.ts` e usado
      nos dois lugares
- [x] Projeção `pagamentos` (só roda com a seção ligada): resumo + parcelas de receita
- [x] `TabPagamentosPublica.tsx`: cards de resumo e lista com badge de status
- [x] Contrato `types.ts` e texto do modal atualizados

### Fechamento
- [x] README: status da XG30
- [x] Teste de vazamento reescrito: `valorTotal` deixou de ser proibido no contrato; em troca,
      custo, fornecedor, método, comprovante e lucro passaram a ser, e a projeção precisa
      conter a guarda `secoes.pagamentos ? buildPagamentos(...)`
- [x] Nota de dívida da XG23 ("Atualizações sempre vazia") marcada como resolvida aqui

## 5. Testes

- [x] `xgestao-share.integration.spec.ts`: dois links ativos na mesma obra; seções
      independentes; revogar um não derruba o outro; `PATCH`/`DELETE` com `linkId` de outra obra
      → 404; teto de links ativos → 409
- [x] `xgestao-obra-publica.integration.spec.ts`: payload sem `checklists`/`atualizacoes`;
      `pagamentos` ausente por padrão; presente só com a seção ligada; **nenhuma despesa** no
      payload (assert por descrição e valor conhecidos); etapas com datas; Gantt renderiza sem
      fetch
- [x] `tests/unit/xgestao-share-modal.test.ts` ajustado à lista
- [x] `npm run check` limpo · `npm run test:unit` 36/37, igual à base (a falha de
      `admin-xgestao-navigation` é pré-existente, ver XG29) · `test:integration:gaps` sem as
      rotas de link · specs `xgestao-share`, `xgestao-obra-publica`, `admin-xgestao` e
      `moderacao-obras`: 22/22 no banco de dev
- [x] Migration `0008_xgestao_share_links_por_publico.sql` aplicada no banco de dev. Em produção
      entra sozinha no próximo boot, pelo `bootstrap-obra-share-links.ts`
- [ ] **Verificação visual** (o browser não sobe neste ambiente): link "Cliente" com Etapas, Cronograma, Fotos e Pagamentos; link
      "Arquiteto" igual, sem Pagamentos; o link atual do Dedé segue abrindo, sem Checklist e sem
      Atualizações

**PAREI AQUI (2026-09-28): próximo = verificação visual.** No link real do Dedé, depois do
deploy: as abas Checklists e Atualizações somem, e Cronograma aparece. Ele precisa abrir
"Gerenciar links públicos", criar o link "Arquiteto" e ligar Pagamentos só no "Cliente".

## 6. Fora de escopo (dívida)

- **Parcelas planejadas não existem como entidade.** A lista mostra os lançamentos de receita
  (pagos e a receber). Se o Dedé quiser um plano de pagamento com parcelas futuras previstas no
  contrato, isso é jornada própria.
- **`medicoes` e a aba Atualizações seguem vivas no marketplace.** Só saem do link do xgestão.
- **O painel `/admin/xgestao` lê um link por obra** (`obra-detalhe.ts`, `limit` no ativo mais
  recente). Continua funcionando, mas mostra só um: ajustar junto com a jornada do admin.

## 7. Gaps descobertos

- **2026-09-28 — esconder uma aba interna não esconde a pública que ela alimentava.** A XG23
  ocultou Atualizações no console e deixou a aba homônima do link sem fonte. **Toda remoção de
  aba interna precisa rastrear quem consome o mesmo dado no link público**: é a lição da XG29
  ("remover por tela não remove do produto") aplicada ao outro lado do link.

## 8. Links cruzados

- [XG04](04-link-publico-obra.md) — link público, token e XG04 §8 (o que é publicável)
- [XG08](08-visao-obra-read-only.md) — wrappers somente leitura com `data` injetado
- [XG23](23-etapas-progresso-manual.md) — a remoção de Atualizações que deixou a aba órfã
- [XG22](22-valores-contrato-e-contrato-prestador.md) — regra do recebido e do saldo
- [XG25](25-cronograma-atraso-visivel.md) — o Gantt reaproveitado
- Origem: `docs/novo-fluxo/ajustes/link-cliente-001..004.txt` + `link-cliente-img-001.jpeg`
  (2026-09-28) e o link de produção da obra "Apartamento Fernanda"
