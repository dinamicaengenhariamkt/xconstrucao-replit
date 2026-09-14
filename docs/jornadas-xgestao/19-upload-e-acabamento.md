# Jornada — XG19: O upload que a meia correção quebrou

> Status: 🔄 em execução | Prioridade: alta | Wave: xgestão-19
> Última atualização: 2026-09-14

> **Ponto de retomada:** o checklist da §4 é a fonte de verdade. Cada item marcado `[x]`
> está feito e verificado; `[ ]` é o que falta.

## 1. Contexto

Uso real, anexando documento na obra:

> *"Eu coloquei um Excel. Ele mostrou 'não foi possível confirmá-lo: chave inválida'. Uma
> imagem também não. Acho interessante colocar uma mensagem amigável, tipo 'extensão não
> permitida'."*

A hipótese do relato — extensão bloqueada — estava errada, e a mensagem era o motivo: ela
apontava para o lugar errado. **Excel e imagem sempre estiveram na lista de formatos aceitos.**

## 2. Os achados

### A1 — a mesma regra escrita em dois lugares, e eles divergiram

O upload tem **dois portões de permissão**:

| Portão | Onde | Roles que aceitava para `obra_anexo` |
|---|---|---|
| presign | `validateUpload` ([validation.ts](../../shared/lib/storage/validation.ts)) | contratante, **empreiteiro**, superadmin |
| commit | `validateKeyForOwner` ([key-builder.ts](../../shared/lib/storage/key-builder.ts)) | contratante, superadmin — **sem empreiteiro** |

A XG10 liberou `obra_anexo` para o empreiteiro — *"no xgestão ele É o dono da obra, e a regra
herdada do marketplace o impedia de anexar documento à própria obra"* — e **mudou só o
primeiro**. A lista do commit era escrita à mão dentro de cada `if`, em outro arquivo.

O arranjo resultante era o pior possível: o presign aprovava, **o arquivo subia inteiro para
o R2**, e o commit rejeitava. A chave gerada estava correta; falhava só no gate de role.

Prova de que era só esse `kind`: `obra_capa` e `obra_foto`, no mesmo arquivo, **já incluíam**
`empreiteiro`. Por isso trocar capa e subir fotos funcionavam, e só o documento falhava.

**Dois agravantes.** O commit faz `deleteObject` ao rejeitar: o usuário perdia o upload, a
banda e o arquivo. E a mensagem dizia *"Chave inválida"* — vocabulário de servidor para um
problema de permissão, apontando para o lugar errado.

### A2 — o teste de regressão cobria a metade que já estava certa

A XG10 escreveu um teste **explicitamente** para isso:
`const empreiteiro = { kind: "obra_anexo", role: "empreiteiro" }`, com o comentário
*"Regressão: `obra_anexo` só aceitava contratante, e o empreiteiro é o dono"*.

Ele importava **só `validateUpload`**. Nunca tocou `validateKeyForOwner`. O teste passava
verde enquanto o upload estava quebrado em produção.

### A3 — o mapa da XG18 atravessava os modais

Regressão da jornada anterior. O `leaflet.css` define z-index próprios e altos: panes de 200 a
700, `.leaflet-control` em **800**, `.leaflet-top/.leaflet-bottom` em **1000**. Os modais Radix
usam `z-50` — **50**.

O que fecha o diagnóstico: o wrapper do mapa era `relative` **sem z-index** — `z-index: auto`,
que **não cria stacking context**. Os panes subiam para a raiz do documento e competiam de
igual para igual com o Portal do modal, onde só o número decide.

### A4 — o avatar dizia "??"

`gerarIniciais(nomeValue) || '??'`: sem nome digitado, o círculo do cabeçalho mostrava os dois
pontos de interrogação literais, parecendo dado quebrado.

### A5 — o preview de documento já existia

O pedido era preview de PDF e download para o resto. **Já estava pronto desde a XG10**
([DocumentoPreviewModal](../../features/empreiteiro/minhas-obras/components/DocumentoPreviewModal.tsx)):
imagem inline, PDF em `<iframe>`, e para DWG/planilha/Word um texto honesto com botão de
download. Sem biblioteca extra. O que impedia de ver funcionando era o upload, que barrava
antes.

## 3. Decisões

- **Eliminar a duplicação, não corrigir a linha.** Trocar `contratante` por `empreiteiro` num
  `if` resolveria hoje e deixaria a armadilha montada. A tabela de roles passou a ter **fonte
  única** (`KIND_ROLES`), lida pelos dois portões.
- **A tabela mora no `key-builder`**, o módulo mais baixo: `validation.ts` já importa dele, e
  o inverso criaria dependência circular.
- **Rebaixar o Leaflet, não subir o Dialog.** Subir o `z-50` obrigaria a mexer em
  `alert-dialog`, `sheet`, `select`, `popover` e `dropdown-menu` — os três últimos aparecem
  *dentro* de modais — e a rebalancear a escala contra o `z-[100]` do toast. Uma regra CSS
  conserta todos os mapas de uma vez.
- **Manter o círculo colorido do avatar.** Ele não é enfeite de cabeçalho: é preview ao vivo da
  cor do avatar do membro. Só o texto `"??"` virou ícone.

## 4. Checklist de execução

### Parte 1 — O upload
- [x] `KIND_ROLES` + `roleAllowedForKind` no `key-builder`: **fonte única** de permissão
- [x] `validateKeyForOwner` checa role **uma vez**, no topo; os 10 gates manuais por `kind`
      foram removidos
- [x] `validateUpload` lê da mesma função; `KindRule.roles` marcado `@deprecated` como
      documentação
- [x] Mensagem do commit deixa de dizer "Chave inválida" e explica a causa
- [x] `descreverFormatos` traduz a allowlist para família ("imagem, PDF, planilha…") em vez de
      despejar 20 mime types crus

### Parte 2 — Os testes que faltavam
- [x] Teste que exercita **presign e commit juntos** com o caso do relato (empreiteiro + .xlsx)
- [x] Trava estrutural: varre todos os `kind` × `role` e falha se os dois portões discordarem
- [x] Casos de recusa preservados: role sem permissão e chave de outro usuário
      (o anti-tampering continua de pé)
- [x] **14/14 passando**

### Parte 3 — Mapa e acabamento
- [x] Regra global rebaixando a escala do Leaflet para abaixo de 50, preservando a ordem
      interna dos panes
- [x] `isolate` nos wrappers dos dois mapas — defesa local, independente do CSS global
- [x] Avatar do modal de membro: ícone no lugar de "??", círculo e preview de cor preservados
- [x] `reason` técnico vai para o console; a tela mostra só a mensagem em português

### Fechamento
- [x] `npm run check` limpo
- [x] Testes de storage 14/14 e de saúde 12/12
- [x] Dev server compila com o CSS novo
- [ ] `npm run test:integration`
- [ ] Verificação visual: subir .xlsx/.png/.pdf, abrir modal sobre o mapa, avatar sem nome

## 5. Fora de escopo (dívida)

- **Seis implementações de "iniciais" no projeto** (`getInitials`, `gerarIniciais`,
  `initialsOf`, `iniciaisFromNome` ×2, `initialsFrom`), com regras diferentes — umas pegam as
  duas primeiras palavras, outras primeira+última. Unificar exige decidir a regra e migrar os
  valores já persistidos.
- **`deleteObject` na rejeição do commit.** Faz sentido para chave forjada, mas com um erro de
  configuração como este o usuário perde o arquivo. Um período de carência antes de apagar
  seria mais gentil.

## 6. Gaps descobertos

- **2026-09-14 — regra duplicada é regra que vai divergir:** a permissão por role existia em
  dois arquivos, e bastou uma jornada mudar um lado. Não foi descuido pontual: o formato
  (lista escrita à mão dentro de dez `if`) **convidava** ao erro. **Quando a mesma decisão
  precisa ser escrita duas vezes, o problema não é a cópia errada — é haver duas.**
- **2026-09-14 — teste verde sobre produção quebrada:** o teste da XG10 mirava exatamente este
  bug e passava, porque exercitava só um dos dois portões. **Um fluxo com duas validações em
  sequência precisa de teste que atravesse as duas; cobrir a primeira dá a falsa sensação de
  cobrir o caminho.**
- **2026-09-14 — a mensagem de erro guiou o diagnóstico para o lugar errado:** "Chave inválida"
  levou o usuário a supor extensão bloqueada e a pedir "mensagem de extensão não permitida" —
  quando o formato sempre esteve liberado e o problema era permissão. **Mensagem em vocabulário
  de servidor não só confunde: ela fabrica hipóteses falsas e custa tempo de investigação.**
- **2026-09-14 — segunda meia correção da XG10 a voltar como bug:** a primeira foi a Saúde
  (fechada na XG15), esta é a segunda. O padrão se repete: corrigir onde o sintoma aparece e
  não onde o dado é decidido. **Vale reler o que mais aquela jornada tocou pela metade.**

## 7. Links cruzados

- Corrige: [XG10](10-ajustes-teste-obra-real.md) (o `obra_anexo` liberado pela metade),
  [XG18](18-consolidacao-edicao-e-mapa.md) (o mapa que introduzi)
- Relacionada: [XG15](15-coerencia-saude-e-progresso.md) — a outra meia correção da XG10
- Origem: uso real em 2026-09-14
