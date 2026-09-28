# Jornada — XG31: vários usuários na mesma empresa (gestores e colaboradores)

> Status: 🟢 implementada (acesso por obra, equipe, convites e admin verificados por integração; ver pendências de cobertura abaixo) | Prioridade: alta | Wave: xgestão-31
> Última atualização: 2026-09-28

## 1. Contexto

O cliente quer que a empresa tenha mais de um login. Hoje os dois sócios da Dinâmica entram com
**a mesma conta**: quem criou a obra é o único usuário que a empresa tem.

> *"Outra coisa que é importante, Ramon, não sei como você vai executar isso, tá, vai pensando
> que a gente vai ter que fazer com uma segunda etapa. Eu criei meu login aqui e eu criei a obra,
> por exemplo. Aí o Dedé, meu sócio, o ideal é que ele conseguisse modificar essa obra, fazer as
> coisas na obra também, porém com o login dele, né? Não precisaria ser meu login. Então eu
> poderia criar dentro do produto da empresa, tipo a Dinâmica, eu crio os gestores (...) daí todo
> mundo consegue entrar e acessar. E aí eu consigo pôr as permissões necessárias também: uma
> pessoa só consegue fazer lançamento de mão de obra, outra consegue fazer lançamento financeiro
> (...) essas permissões também seria importante colocar para cada utilizador do perfil lá."*

São **dois pedidos**, com custos e riscos diferentes:

1. **Mais de um login por empresa**, com acesso definido por papel e, para colaboradores, por obra.
2. **Permissões por área** para cada login ("só mão de obra", "só financeiro"), que ficam para
   uma fase posterior.

O escopo da Fase A está decidido abaixo: dono com acesso total, gestor com acesso de edição a todas
as obras e colaborador com acesso de visualização ou edição apenas às obras atribuídas. A Fase B,
de permissões por área, fica para depois (§3).

## 2. Os achados

Verificado no código em 2026-09-28, não presumido.

### A1 — a empresa tem exatamente um login, por constraint do banco

`empreiteiras.userId` é `.unique()` ([`schema.ts:155`](../../shared/db/schema.ts)). O cadastro
depende disso: `onConflictDoNothing({ target: empreiteiras.userId })` em
[`auth-storage.ts`](../../features/auth/api/auth-storage.ts) (2 pontos) e em
[`roles-service.ts`](../../features/auth/api/roles-service.ts). Tirar o `unique` quebraria o
cadastro. **Membro precisa de tabela própria**, não de uma segunda linha em `empreiteiras`.

### A2 — todo acesso passa por "qual é a empresa deste usuário"

- [`findObraAccess`](../../features/obras/api/access.ts) (linha 61) concede acesso quando
  `obra.empreiteiraId` é a empresa **cujo `userId` é o usuário logado**.
- [`assertXgestaoUser`](../../features/xgestao/lib/entitlement.ts) (linha 38) resolve o
  `empreiteiraId` do xgestão do mesmo jeito.

Esses dois pontos cobrem **24 das 28 rotas** de `app/api/obras/[id]/**`, as rotas
`app/api/xgestao/*` e as páginas do xgestão. As 4 restantes (`health`, `contrato`,
`contrato/assinar`, `contrato/cancelar`) fazem a checagem por conta própria.

Fora deles, há **29 consultas `eq(empreiteiras.userId, …)` em 26 arquivos**, sem helper comum.
Cerca de 22 respondem à mesma pergunta, "qual é a empresa do usuário atual". Exemplos:
`app/api/obras/route.ts` (criar obra), `build-detalhe-server.ts` (tela da obra),
`lancamentos-service.ts` (financeiro), `app/api/uploads/commit`, `app/api/atividades`,
`app/api/perfil/plano`. **Cada uma é um lugar onde o membro "não teria empresa"** e receberia
404 ou tela vazia.

### A3 — não existe permissão por área, e o que parece existir não serve

- O acesso é **tudo ou nada por obra**: `canWriteObraContent` (`access.ts:95`) não conhece áreas.
- "Mão de obra" não é módulo, é **uma categoria do lançamento financeiro**
  (`mao_de_obra | material | outras_despesas`,
  [`lancamentos.ts:19`](../../features/financeiro/lancamentos.ts)). "Só lança mão de obra"
  significa filtrar o financeiro por categoria, não esconder uma aba.
- `obra_equipe.permissao` (visualizar/editar/admin) é gravada e exibida em
  `PermissoesMembroModal`, mas **nenhuma checagem de acesso a lê**. E a equipe foi desenhada na
  [XG10](10-ajustes-teste-obra-real.md) para gente **sem login** (`userId` nullable). Permissão de
  empresa não é permissão de obra; reaproveitar essa coluna misturaria as duas coisas.

### A4 — o plano é do usuário dono, não da empresa

O limite de obras sai de `getLimiteRecurso(userId, …)`
([`assinatura-service.ts`](../../features/planos/assinatura-service.ts)) e é aplicado em
[`create-obra.ts`](../../features/obras/api/create-obra.ts). Um membro criando obra precisa
**herdar o plano do dono**, senão cai no limite de uma conta sem assinatura. Nenhum plano
([`plans-catalog.ts`](../../shared/lib/plans-catalog.ts)) fala em número de usuários.

### A5 — o que já existe e encurta o caminho

- **Convite por link:** o admin já cria usuário sem senha e manda link de definir senha (modo
  "link" de `POST /api/admin/usuarios`: `issueSetupToken` + `sendPasswordSetupEmail` +
  `/api/auth/definir-senha-inicial`, tabela `password_setup_tokens`).
- **Role aditiva:** o membro ganha `xgestao` em `user_roles`, como qualquer usuário do produto
  (README, decisão de arquitetura nº 1).
- **Revogação imediata:** o JWT só carrega a role primária, e o resto é lido do banco a cada
  request. Revogar um membro corta o acesso no request seguinte, sem esperar o token expirar.
- **Auditoria quase de graça:** `atividades.actorUserId` já grava quem fez cada ação. Com logins
  separados, "quem lançou" passa a significar alguma coisa.

## 3. Fases e escopo decidido

| | **Fase A: usuários e permissões por obra** | **Fase B: permissões por área** |
|---|---|---|
| Acesso | Dono: todas as obras e ações. Gestor: todas as obras, com edição. Colaborador: somente as obras atribuídas, com permissão de visualizar ou editar em cada obra | Restrições por área dentro de uma obra, como somente financeiro ou somente mão de obra |
| Atribuição | Obras existentes são atribuídas explicitamente ao colaborador; obras novas **não** são atribuídas automaticamente | Configuração de áreas e presets de permissão |
| Limites de papel | Membros não gerenciam cobrança/plano, dados da empresa ou usuários, e não excluem obras. Essas ações ficam com o dono | — |
| Gestão | Convite e revogação pelo dono; `/admin/xgestao` exibe contagens e dados de membros somente para leitura | — |
| Decisão | **Fase A implementada e testada para acesso por obra, convites e revogação.** Pendências complementares estão indicadas no checklist (§6–7) | **Adiada** até a Fase A estar em uso e as áreas serem definidas com o cliente |

**Por que a Fase B espera.** As áreas ainda não estão definidas: "mão de obra" nem é módulo hoje.
Desenhar permissões antes do uso real seria chutar a granularidade. Com a Fase A em uso, o cliente
poderá indicar quais separações fazem falta.

## 4. Decisões fechadas (Fase A)

- **Membro e acesso:** o dono tem acesso total. O gestor pode visualizar e editar todas as obras.
  O colaborador só acessa obras atribuídas a ele; cada atribuição define `visualizar` ou `editar`.
  A atribuição é explícita e **obras criadas depois não entram automaticamente** na lista do
  colaborador. Permissões por área ficam para a Fase B.
- **Tabela nova `empreiteira_membros`**: `empreiteira_id`, `user_id` (**UNIQUE**), `papel`
  (`gestor` | `colaborador`), `status` (`convidado` | `ativo` | `revogado`), `convidado_por`,
  `criado_em`. O modelo também precisa registrar a atribuição de colaborador a cada obra e o
  nível `visualizar`/`editar`. O `unique` de `empreiteiras.userId` **fica**: o dono continua
  sendo a linha em `empreiteiras`.
- **Um usuário pertence a uma empresa só**, como dono **ou** como membro. Quem já tem empresa
  própria não pode ser convidado (o convite responde 409). Membro de várias empresas é outro
  produto (seletor de empresa, sessão por empresa) e fica fora.
- **Helper único `resolverEmpresaDoUsuario(userId)`** → `{ empreiteiraId, donoUserId, papel:
  `'dono' | 'gestor' | 'colaborador' }`. Substitui a consulta em `access.ts`, em `entitlement.ts`
  e nas ~22 consultas de A2. Paga de passagem a dívida da falta de helper: hoje são 26 arquivos
  escrevendo a mesma query.
- **Ações exclusivas do dono:** plano/cobrança, assinatura, dados cadastrais da empresa, usuários
  (convidar e revogar membros) e exclusão de obras. Membros não gerenciam esses recursos. Criação
  de obras segue as permissões do produto e conta no limite **do plano do dono**
  (`getLimiteRecurso(donoUserId, …)`); obras novas não são atribuídas automaticamente a
  colaboradores.
- **Convite:** o dono informa nome e e-mail. O sistema cria o usuário (`role = 'empreiteiro'` +
  `xgestao` em `user_roles`, **sem** linha em `empreiteiras`), grava o membro como `convidado` e
  manda o link de definir senha, reaproveitando o fluxo do admin. Ao definir a senha, o membro
  vira `ativo`. O dono também pode reenviar o convite e revogar o membro; a revogação corta o
  acesso no request seguinte.
- **Tela "Equipe da empresa"** no perfil do xgestão, visível só para o dono: lista, convidar,
  reenviar link, revogar e atribuir obras/permissões de visualização ou edição a colaboradores.
- **Admin:** `/admin/xgestao` exibe contagens e informações dos membros em modo somente leitura;
  não convida, altera permissões nem revoga.
- **"Quem lançou"** no financeiro e na timeline da obra, a partir do `actorUserId` que já é
  gravado. É o ganho imediato de ter logins separados.

## 5. Fase B (adiada; detalhar só quando for priorizada)

- Permissões por área dentro da obra, por exemplo `financeiro` (com filtro por categoria, para
  cobrir "só mão de obra"),
  `etapas_cronograma`, `diario_fotos`, `ocorrencias`, `links_publicos`, `equipe`.
- `ObraAccess` passa a carregar as permissões do membro, com um guard por área em cada rota. As
  telas escondem o que o usuário não pode, e o servidor recusa mesmo assim.
- Tela de permissões por membro, com presets ("Financeiro", "Encarregado de obra") em vez de
  dezenas de caixas soltas.
- **Pré-requisitos:** Fase A em uso e a lista de áreas fechada com o cliente. Não faz parte do
  checklist de implementação da Fase A.

## 6. Checklist de execução (Fase A)

### Parte 1 — Modelo
- [x] Schema + bootstrap de `xgestao_membros` e da atribuição/permissão por obra
      (padrão de `server/bootstrap-*.ts`), com entrada no `schema-health`
- [ ] `resolverEmpresaDoUsuario` com teste unitário (dono, membro ativo, membro revogado, sem
      empresa)

### Parte 2 — Acesso
- [x] `findObraAccess` e `assertXgestaoUser` passam a usar o helper
- [ ] Varredura das ~22 consultas `eq(empreiteiras.userId, …)` de "empresa do usuário atual";
      as de junção (admin, chat, candidaturas) ficam como estão
- [x] Limite de criação de obras resolvido pelo **dono**
- [x] Rotas só do dono (plano, assinatura, perfil da empresa, membros) recusam membro com 403

### Parte 3 — Convite e equipe
- [x] API `GET/POST /api/xgestao/membros`, `PATCH/DELETE /api/xgestao/membros/[id]`, com reenvio de
      convite; apenas o dono pode convidar ou revogar
- [x] E-mail de convite a partir do fluxo de definir senha
- [x] Tela "Equipe da empresa": atribuição explícita de obras e permissão `visualizar`/`editar`
      por obra para colaboradores; obras novas não são atribuídas automaticamente
- [x] Gestores editam todas as obras; colaboradores só acessam obras atribuídas e respeitam
      `visualizar`/`editar`
- [x] Membros não gerenciam cobrança/plano, dados da empresa ou usuários, nem excluem obras

### Parte 4 — Auditoria visível
- [x] "Registrado por" no financeiro quando há autor conhecido e autor na timeline da obra

### Fechamento
- [x] README: status da XG31
- [x] `/admin/xgestao` mostra contagens e dados de membros somente para leitura

## 7. Testes planejados

- [x] Colaborador atribuído com permissão `editar` acessa e edita a obra autorizada
      (etapas, financeiro, fotos, link público)
- [x] Gestor pode visualizar e editar todas as obras da empresa
- [x] Colaborador só acessa obras atribuídas; `visualizar` não permite alterações e `editar`
      permite as edições autorizadas
- [x] Obra nova não é atribuída automaticamente a colaboradores
- [ ] Membro **não** acessa obra de outra empresa (404)
- [x] Membro revogado perde o acesso no request seguinte
- [ ] Membro não altera plano/cobrança, assinatura, dados da empresa nem usuários (403)
- [x] Membro não exclui obra
- [x] `/admin/xgestao` exibe contagens/dados de membros sem ações de escrita
- [x] Obra criada por gestor usa o plano do dono
- [x] Convite para e-mail de quem já tem empresa → 409
- [ ] **Guarda de regressão:** um check no `test:integration:gaps` (ou script próprio) que
      reprova `eq(empreiteiras.userId` fora do helper e das junções listadas. Sem isso, a próxima
      rota nova esquece o membro e ninguém percebe

## 8. Pendências para o cliente

As decisões de escopo da Fase A estão fechadas (§3–4), e a Fase A foi implementada,
não fica para depois do MVP: gestor tem acesso de edição a todas as obras; colaborador recebe
acesso explícito por obra (visualização ou edição); membro não administra cobrança/empresa/usuários
nem exclui obras; convite e revogação cabem ao dono; o admin é somente leitura. Permissões por área
ficam adiadas para a Fase B.

1. **Limite de usuários por plano?** Ex.: Freemium 1, Basic 3, Pro ilimitado. Hoje nenhum plano
   fala em usuários.
2. **Membro pode criar e revogar links públicos (XG30)?** Não muda os limites acima; confirmar
   essa ação específica antes de incluí-la nas permissões de membro.
3. **Quais áreas separar na Fase B?** Definir com o cliente depois da Fase A em uso.

## 9. Riscos e fora de escopo

- **Risco principal:** uma das ~22 consultas escapar da varredura. O membro recebe 404 ou tela
  vazia naquele ponto; não é vazamento, mas é bug visível. Mitigação: o check da §7 e a lista
  fechada de arquivos na execução.
- **Fora de escopo:** membros para empreiteiro do marketplace; um usuário em mais de uma empresa;
  transferência de titularidade da empresa; permissões por área (Fase B). Permissões por obra
  para colaboradores fazem parte da Fase A.
- O alerta do README sobre o contratante vale aqui: *"auditar o que mais um `users.id` válido
  destrava no resto do sistema"*. O membro é um `empreiteiro` sem `empreiteiras`; as rotas de
  marketplace que assumem essa linha precisam responder com erro limpo, não com 500.

## 10. Links cruzados

- [XG03](03-planos-limites-trial.md) — planos e limites (o limite de usuários entra aqui)
- [XG04](04-link-publico-obra.md) / [XG30](30-link-cliente-publicos-e-cronograma.md) — links
  públicos (pendência 4)
- [XG10](10-ajustes-teste-obra-real.md) — a equipe da obra, feita para gente sem login
- README — decisões de arquitetura nº 1 (role aditiva) e a nota sobre o custo de um `users.id`
  novo
- Código: [`access.ts`](../../features/obras/api/access.ts),
  [`entitlement.ts`](../../features/xgestao/lib/entitlement.ts),
  [`schema.ts`](../../shared/db/schema.ts) (`empreiteiras`, `obra_equipe`, `user_roles`)
- Origem: `docs/novo-fluxo/ajustes/novo-item-fluxo-multi-usuarios-xgestao-001.json` (2026-09-28)
