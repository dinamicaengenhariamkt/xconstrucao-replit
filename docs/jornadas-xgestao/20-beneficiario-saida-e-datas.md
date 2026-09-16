# Jornada — XG20: Para quem foi o dinheiro, e quando foi escrito

> Status: ✅ pronto (aguarda validação visual do cliente) | Prioridade: alta | Wave: xgestão-20
> Última atualização: 2026-09-16

> **Ponto de retomada:** o checklist da §9 é a fonte de verdade. Cada item marcado `[x]`
> está feito e verificado; `[ ]` é o que falta.

## 1. Contexto & Objetivo

Dois pedidos do cliente após usar o console em obra real, com transcrição e print em
[`docs/novo-fluxo/ajustes/`](../novo-fluxo/ajustes/).

**O beneficiário da saída:**

> *"Quando vai cadastrar a saída é bom eu ter um card para colocar qual que é a pessoa que
> vai receber. Cadastrei lá o Jefferson de elétrica. Eu quero fazer um pagamento para ele, eu
> posso selecionar ele aqui. Porque depois no filtro eu posso colocar lá Jefferson elétrica e
> eu vejo quanto eu paguei só para ele."*

Hoje o beneficiário só existe como texto solto dentro da descrição — é literalmente o
placeholder do campo (*"Ex.: Pagamento para o Jefferson (hidráulica)"*). Texto livre não
filtra: "Jefferson Elétrica" numa saída e "jefferson eletrica" na outra já quebram o total.
**O pedido não é o campo — é o filtro.** Sem ele o select não serve a nada.

**A data do diário e das ocorrências:**

> *"Na parte de diário de obra e, se não me engano, ocorrências, coloca a data, pede pra
> mostrar a data ali e o horário que foi feita as entradas. Porque ele mostra tipo 'há dois
> dias', 'há três dias', mas ele não mostra a data."*

O print anexado carrega um sintoma que ele não relatou: uma ocorrência criada naquele instante
exibida como **"em 1 minuto"** — no futuro.

## 2. Personas

- **Empreiteiro (dono da obra)** — lança a saída, escolhe quem recebeu, e depois filtra por
  pessoa para saber quanto já pagou a ela. É quem pediu as duas coisas.
- **Contratante / visitante do link público** — não lança nada, mas lê diário, fotos e
  ocorrências. Herda a data absoluta pelos mesmos componentes.

## 3. Fluxo ponta-a-ponta

```mermaid
flowchart LR
  A[Empreiteiro cadastra<br/>Jefferson na Equipe] --> B[(obra_equipe)]
  B --> C[Modal Lançar saída<br/>select Para quem]
  C --> D[(financeiro<br/>fornecedor_id + nome)]
  D --> E[Filtro Para quem<br/>na listagem]
  E --> F[Total responde<br/>quanto paguei a ele]
```

## 4. Telas envolvidas

- [app/empreiteiro/minhas-obras/[id]/page.tsx](../../app/empreiteiro/minhas-obras/[id]/page.tsx) — console da obra: aba Financeiro, abas Diário/Fotos/Ocorrências e o bloco Equipe
- [app/admin/obras/[id]/page.tsx](../../app/admin/obras/[id]/page.tsx) — mesma leitura pelo admin
- Link público — [TabDiarioPublica](../../features/xgestao/obra-publica/components/TabDiarioPublica.tsx), [TabOcorrenciasPublica](../../features/xgestao/obra-publica/components/TabOcorrenciasPublica.tsx), [TabFotosPublica](../../features/xgestao/obra-publica/components/TabFotosPublica.tsx)

## 5. Componentes-chave

- [LancamentoFinanceiroModal](../../features/empreiteiro/minhas-obras/components/LancamentoFinanceiroModal.tsx) — ganha o select "Para quem"
- [FinanceiroTab](../../features/empreiteiro/minhas-obras/components/FinanceiroTab.tsx) — ganha o terceiro filtro e o badge na linha
- [EquipeSection](../../features/empreiteiro/minhas-obras/components/EquipeSection.tsx) — origem da lista de pessoas (não muda)
- [OcorrenciasJ06Card](../../features/obras/medicoes/components/OcorrenciasJ06Card.tsx) · [DiarioJ06Card](../../features/obras/medicoes/components/DiarioJ06Card.tsx) · [FotosJ06Card](../../features/obras/medicoes/components/FotosJ06Card.tsx) — data absoluta
- [formatDateTime](../../shared/lib/formatters.ts) — **já existe**, formato `DD/MM/YYYY · HH:mm`

## 6. Schema (Drizzle)

Tabelas existentes em [shared/db/schema.ts](../../shared/db/schema.ts): `financeiro` (linha 379),
`obra_equipe` (linha 982).

**Alteração em `financeiro`:**

| Coluna | Tipo | Por quê |
|---|---|---|
| `fornecedor_id` | `varchar`, FK → `obra_equipe.id`, `ON DELETE SET NULL` | o vínculo exato que o filtro usa |
| `fornecedor_nome` | `text` | snapshot do nome — o lançamento continua legível se o membro sair da equipe |

**Sem `.references()` no Drizzle, por ordem de declaração.** `financeiro` está na linha 379 e
`obra_equipe` na 982; referenciar direto daria "used before declaration". O schema já resolve
assim em `medicaoId` (linha 396 → `medicoes` na 467): `varchar` puro, com a FK criada no SQL do
bootstrap, onde ordem não existe.

Migration: [`migrations/0005_financeiro_fornecedor.sql`](../../migrations/0005_financeiro_fornecedor.sql)
(registro) + `server/bootstrap-financeiro-fornecedor.ts` idempotente, que é o que de fato aplica.

## 7. Endpoints

- `POST /api/obras/[id]/financeiro` — aceita `fornecedorId` e `fornecedorNome`; **valida que o
  membro pertence a esta obra**; rejeita beneficiário em `tipo: "entrada"`
- `PATCH /api/obras/[id]/financeiro/[lancamentoId]` — mesmo tratamento; 409 de automáticos preservado
- `GET /api/obras/[id]/financeiro` — devolve a linha inteira, sem mudança de contrato

## 8. Mocks a remover

Nenhum. As duas áreas já leem do banco.

## 9. Checklist de implementação

### Parte 1 — Banco
- [x] `fornecedorId` e `fornecedorNome` em `financeiro` ([schema.ts](../../shared/db/schema.ts))
- [x] `server/bootstrap-financeiro-fornecedor.ts`: colunas, FK `ON DELETE SET NULL` e
      `idx_financeiro_obra_fornecedor`, tudo idempotente
- [x] Registrar em [instrumentation.ts](../../instrumentation.ts) via `runBootstrap`
- [x] `migrations/0005_financeiro_fornecedor.sql` como registro

### Parte 2 — API
- [x] `createSchema` aceita os dois campos
- [x] Validação de que o `fornecedorId` é membro **desta** obra
- [x] Beneficiário recusado em entrada (400)
- [x] `fornecedorNome` gravado como snapshot quando vem `fornecedorId`
- [x] Mesmo tratamento no PATCH
- [x] `ObraLancamentoApi` com os campos novos

### Parte 3 — Modal
- [x] Prop `equipe` e select "Para quem", só em saída, entre Categoria e Descrição
- [x] Opção "Outro (digitar nome)" com input de texto livre
- [x] Excluir inativos e ids virtuais (`isVirtualMembroId`)
- [x] Estado vazio apontando para o cadastro da equipe
- [x] Reidratação na edição
- [x] test-ids `select-fornecedor-lancamento` e `input-fornecedor-nome`

### Parte 4 — Listagem e filtro
- [x] `FinanceiroTab` passa `obra.equipe` ao modal
- [x] Terceiro `<Select>` "Para quem", com quem de fato aparece nos lançamentos
- [x] `filtrados` + `totalFiltrado` respondendo por pessoa
- [x] Badge do beneficiário na linha
- [x] Filtro de categoria passa a iterar `LANCAMENTO_CATEGORIAS` (dívida §13)
- [x] Conferir quebra no mobile com três filtros (`flex-wrap` já existente na barra)

### Parte 5 — Data e hora
- [x] `OcorrenciasJ06Card` (criação e resolução) → `formatDateTime`
- [x] `DiarioJ06Card` → `formatDateTime`
- [x] `FotosJ06Card` → `formatDateTime`
- [x] Imports órfãos de `formatDistanceToNow`/`ptBR` removidos
- [x] Link público conferido

### Parte 6 — Testes e fechamento
- [x] `npm run test:integration:gaps` — 0 endpoints críticos sem cobertura
- [x] Spec `tests/e2e/integration/financeiro-fornecedor.integration.spec.ts` — **4/4 passando**: vínculo + snapshot, nome avulso, as três recusas, e o PATCH (trocar, preservar em patch parcial, limpar)
- [x] `npm run check` limpo
- [x] `npm run test:integration` — 335 passando. As 13 falhas do ambiente são **pré-existentes**: 12 por `libglib-2.0.so.0` ausente (Chromium não sobe aqui) e 1 por seed de FAQ com `visao: "anunciante"` fora da lista do teste. Nenhuma toca arquivo desta jornada.
- [x] Verificação funcional contra o banco de dev: filtro por pessoa soma **R$ 1.500,50** exatos em 2 de 3 lançamentos; remover o membro zera `fornecedor_id` e **preserva** `fornecedor_nome`; bootstrap roda no boot real, depois de `obra-operacao`

## 10. Critérios de aceite

1. Lançar saída escolhendo o Jefferson; a linha mostra o nome como badge.
2. Lançar uma segunda saída para outra pessoa; filtrar "Para quem = Jefferson" — só a dele
   aparece e o total bate com o valor lançado.
3. "Outro (digitar nome)" grava e aparece no filtro.
4. Diário, Fotos e Ocorrências mostram `DD/MM/AAAA · HH:mm` no lugar de "há 2 dias".
5. Ocorrência criada agora mostra a data/hora de agora — **nunca "em 1 minuto"**.
6. Link público exibe as mesmas datas.
7. Verificação no banco:
   ```sql
   SELECT descricao, valor, fornecedor_id, fornecedor_nome
     FROM financeiro
    WHERE obra_id = '<id>' AND tipo = 'saida';
   ```

## 11. Riscos / Pontos de atenção

- **`pagador_user_id` / `recebedor_user_id` não servem para isto.** São FK → `users.id`, e o
  Jefferson não tem conta na plataforma. Pior: são essas duas colunas que fazem
  `receitaTotal`/`custoTotal` somarem em
  [build-detalhe-server.ts:527-549](../../features/empreiteiro/minhas-obras/api/build-detalhe-server.ts).
  Reaproveitá-las quebraria os KPIs do topo da aba.
- **Ids virtuais no select.** `contratante-*` e `empreiteira-*` são derivados e não existem em
  `obra_equipe` ([isVirtualMembroId](../../features/empreiteiro/minhas-obras/hooks/use-obra-operacao.ts));
  se entrarem no select, o FK falha no insert.
- **Membro removido da equipe.** `ON DELETE SET NULL` zera o vínculo — por isso o snapshot em
  `fornecedor_nome`, para o lançamento antigo não virar "pagamento para ninguém".
- **Lançamentos automáticos** (com `medicao_id` ou `origem_id`) não têm beneficiário e seguem
  respondendo 409 na edição.

## 12. Links cruzados

- Depende de: [XG10](10-ajustes-teste-obra-real.md) (lançamentos de entrada/saída e a equipe
  editável), [XG12](12-console-obra-tela-unica.md) (a aba Financeiro no console)
- Relacionada: [XG19](19-upload-e-acabamento.md) — jornada anterior de acabamento
- Origem: uso real em 2026-09-16, transcrições em [`docs/novo-fluxo/ajustes/`](../novo-fluxo/ajustes/)

## 13. Gaps descobertos durante execução

- **2026-09-16 — "fornecedor" não existia como entidade.** O pedido falava em fornecedores
  cadastrados, e a busca por `fornecedor|supplier` no repo devolveu só strings de marketing. O
  que o cliente cadastrou é a **Equipe da obra** — inclusive o comentário em
  [page.tsx:1125](../../app/empreiteiro/minhas-obras/[id]/page.tsx) cita ele falando do *mesmo*
  Jefferson. **O vocabulário do cliente nem sempre nomeia a entidade do sistema; confirmar
  onde o dado mora antes de projetar tabela nova.**
- **2026-09-16 — o "em 1 minuto" não era timezone.** A hipótese natural (coluna `timestamp`
  sem TZ, servidor em UTC, banco em São Paulo) levaria a uma migration de 98 colunas. Medido:
  Node em **UTC**, Postgres em **GMT**, skew de **35 ms**, e o ISO entregue com `Z` renderiza
  `14/09/2026 · 01:34` corretamente em Brasília. A causa é o **relógio do navegador do
  usuário** alguns segundos atrasado — `formatDistanceToNow` com `addSuffix` inverte o sufixo
  em *qualquer* delta positivo. **Medir as duas pontas antes de trocar schema por causa de
  data: a correção certa aqui era a que o cliente já tinha pedido.**
- **2026-09-16 — o formatador já existia.** `formatDateTime` em
  [shared/lib/formatters.ts](../../shared/lib/formatters.ts) produz exatamente o formato
  pedido. Contra as **seis** implementações de data relativa espalhadas pelo projeto, com
  regras divergentes — ver dívida abaixo.
- **2026-09-16 — filtro de categoria hardcoded.** As opções do filtro em `FinanceiroTab` são
  escritas à mão enquanto o modal itera `LANCAMENTO_CATEGORIAS`. Mesma classe de problema da
  XG19 (regra escrita em dois lugares diverge). Corrigido de passagem.

### Dívida registrada (fora de escopo)

- **Entidade Fornecedor reaproveitável entre obras.** Hoje o cadastro é por obra; quem
  trabalha em três precisa ser cadastrado três vezes. Vira necessário quando o pedido for
  "quanto paguei ao Jefferson no ano".
- **Seis implementações de data relativa** (`formatRelativeBr`, `formatRelative` ×2,
  `formatRelativeDate`, `formatRelativeShort` e o date-fns inline). Esta jornada remove só os
  três usos com `addSuffix`, que são os que produzem futuro.
- **Filtro por período no financeiro.** Não existe e não foi pedido.
