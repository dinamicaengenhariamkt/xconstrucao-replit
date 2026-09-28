# Jornada — XG31: vários usuários na mesma empresa (sócios e gestores)

> Status: 🟡 planejada (aguardando decisão de fase) | Prioridade: alta | Wave: xgestão-31
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

São **dois pedidos**, e o próprio cliente já sinaliza que não é para agora ("segunda etapa"):

1. **Mais de um login por empresa**, todos enxergando e editando as obras da empresa.
2. **Permissões por área** para cada login ("só mão de obra", "só financeiro").

O custo e o risco dos dois são muito diferentes, por isso a jornada os separa em **Fase A** e
**Fase B** (§3).

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

## 3. Avaliação: dá para fazer agora?

| | **Fase A: sócios e gestores com acesso total** | **Fase B: permissões por área** |
|---|---|---|
| Resolve | O Dedé entra com o login dele, trabalha em tudo da empresa, e o sistema sabe quem fez o quê | "Fulano só lança mão de obra", "Ciclano só mexe no financeiro" |
| Onde mexe | 1 tabela nova, 1 helper central, ~22 consultas trocadas, limite do plano pelo dono, convite, tela de equipe | As 28 rotas de obra, filtro por categoria no financeiro e UI escondendo o que o usuário não pode |
| Esforço, dev com IA | **~3 a 4 dias** + 1 a 2 de homologação | **~4 a 6 dias a mais**, e a maior parte vai para teste |
| Risco | **Médio.** Mexe no coração do acesso, mas concentrado em 2 pontos | **Alto.** Cada rota esquecida é uma permissão furada, e o erro não aparece: a pessoa só consegue fazer o que não devia |
| Recomendação | **Pode entrar agora**, se o cronograma do MVP comportar ~1 semana | **Depois do teste do MVP** |

**Por que a Fase A vale agora.** O objetivo do MVP é o produto rodando nas obras reais do Dedé
(README, objetivo redefinido em 2026-08-19). Hoje os dois sócios usam o mesmo login, o que tira
fidelidade do teste: ninguém sabe quem lançou o quê, e o fluxo testado não é o fluxo real de uma
empresa. Com IA acelerando a varredura dos ~22 pontos, a Fase A é trabalho mecânico sobre um
desenho simples; o risco está concentrado e os testes cobrem bem.

**Por que a Fase B espera.** O próprio cliente chamou de "segunda etapa". As áreas ainda não
estão definidas: "mão de obra" nem é módulo hoje. Desenhar permissões antes do uso real é chutar
a granularidade, e errar para mais gera uma tela de permissões que ninguém configura. Com a Fase A
em uso, o cliente vai dizer quais separações sentiu falta.

**Alternativa sem custo:** manter o login compartilhado até o fim do teste do MVP e fazer as duas
fases depois. É a escolha certa se o cronograma não tiver folga de uma semana.

> **Decisão pendente (usuário + cliente):** Fase A agora ou depois do MVP? Ver §8.

## 4. Decisões propostas (Fase A)

- **Tabela nova `empreiteira_membros`**: `empreiteira_id`, `user_id` (**UNIQUE**), `papel`
  (`socio` | `gestor`), `permissoes jsonb null` (reservado para a Fase B; nulo = acesso total),
  `status` (`convidado` | `ativo` | `revogado`), `convidado_por`, `criado_em`. O `unique` de
  `empreiteiras.userId` **fica**: o dono continua sendo a linha em `empreiteiras`.
- **Um usuário pertence a uma empresa só**, como dono **ou** como membro. Quem já tem empresa
  própria não pode ser convidado na Fase A (o convite responde 409). Membro de várias empresas é
  outro produto (seletor de empresa, sessão por empresa) e fica fora.
- **Helper único `resolverEmpresaDoUsuario(userId)`** → `{ empreiteiraId, donoUserId, papel:
  'dono' | 'socio' | 'gestor' }`. Substitui a consulta em `access.ts`, em `entitlement.ts` e nas
  ~22 consultas de A2. Paga de passagem a dívida da falta de helper: hoje são 26 arquivos
  escrevendo a mesma query.
- **O que só o dono faz:** plano e assinatura, membros (convidar, revogar), dados cadastrais da
  empresa. **O membro faz tudo nas obras**, inclusive criar obra, que conta no limite **do plano
  do dono** (`getLimiteRecurso(donoUserId, …)`).
- **Convite:** o dono informa nome e e-mail. O sistema cria o usuário (`role = 'empreiteiro'` +
  `xgestao` em `user_roles`, **sem** linha em `empreiteiras`), grava o membro como `convidado` e
  manda o link de definir senha, reaproveitando o fluxo do admin. Ao definir a senha, o membro
  vira `ativo`.
- **Tela "Equipe da empresa"** no perfil do xgestão, visível só para o dono: lista, convidar,
  reenviar link, revogar.
- **"Quem lançou"** no financeiro e na timeline da obra, a partir do `actorUserId` que já é
  gravado. É o ganho imediato de ter logins separados.

## 5. Fase B (esboço, detalhar só quando for priorizada)

- Áreas candidatas: `financeiro` (com filtro por categoria, para cobrir "só mão de obra"),
  `etapas_cronograma`, `diario_fotos`, `ocorrencias`, `links_publicos`, `equipe`.
- `ObraAccess` passa a carregar as permissões do membro, com um guard por área em cada rota. As
  telas escondem o que o usuário não pode, e o servidor recusa mesmo assim.
- Tela de permissões por membro, com presets ("Financeiro", "Encarregado de obra") em vez de
  dezenas de caixas soltas.
- **Pré-requisitos:** Fase A em uso e a lista de áreas fechada com o cliente.

## 6. Checklist de execução (Fase A)

### Parte 1 — Modelo
- [ ] Migration + bootstrap de `empreiteira_membros` (padrão de `server/bootstrap-*.ts`) e
      entrada no `schema-health`
- [ ] `resolverEmpresaDoUsuario` com teste unitário (dono, membro ativo, membro revogado, sem
      empresa)

### Parte 2 — Acesso
- [ ] `findObraAccess` e `assertXgestaoUser` passam a usar o helper
- [ ] Varredura das ~22 consultas `eq(empreiteiras.userId, …)` de "empresa do usuário atual";
      as de junção (admin, chat, candidaturas) ficam como estão
- [ ] Limite de obras e recursos do plano resolvidos pelo **dono**
- [ ] Rotas só do dono (plano, assinatura, perfil da empresa, membros) recusam membro com 403

### Parte 3 — Convite e equipe
- [ ] API `GET/POST /api/xgestao/membros` e `DELETE /api/xgestao/membros/[id]`, com reenvio de
      convite
- [ ] E-mail de convite a partir do fluxo de definir senha
- [ ] Tela "Equipe da empresa"

### Parte 4 — Auditoria visível
- [ ] "Lançado por" no financeiro e autor na timeline da obra

### Fechamento
- [ ] README: status da XG31
- [ ] `/admin/xgestao` mostra os membros da empresa

## 7. Testes planejados

- [ ] Membro acessa e edita obra da empresa (etapas, financeiro, fotos, link público)
- [ ] Membro **não** acessa obra de outra empresa (404)
- [ ] Membro revogado perde o acesso no request seguinte
- [ ] Membro não altera plano, assinatura nem membros (403)
- [ ] Obra criada por membro conta no limite do plano do dono
- [ ] Convite para e-mail de quem já tem empresa → 409
- [ ] **Guarda de regressão:** um check no `test:integration:gaps` (ou script próprio) que
      reprova `eq(empreiteiras.userId` fora do helper e das junções listadas. Sem isso, a próxima
      rota nova esquece o membro e ninguém percebe

## 8. Pendências para o cliente

1. **Fase A agora ou depois do MVP?** A recomendação está em §3.
2. **Limite de usuários por plano?** Ex.: Freemium 1, Basic 3, Pro ilimitado. Hoje nenhum plano
   fala em usuários.
3. **Membro pode excluir obra?** A proposta é que não: excluir é irreversível e fica com o dono.
4. **Membro pode criar e revogar links públicos (XG30)?** A proposta é que sim, na Fase A.
5. **Quais áreas separar na Fase B?** Só depois da Fase A em uso.

## 9. Riscos e fora de escopo

- **Risco principal:** uma das ~22 consultas escapar da varredura. O membro recebe 404 ou tela
  vazia naquele ponto; não é vazamento, mas é bug visível. Mitigação: o check da §7 e a lista
  fechada de arquivos na execução.
- **Fora de escopo:** membros para empreiteiro do marketplace; um usuário em mais de uma empresa;
  transferência de titularidade da empresa; permissões por obra (membro só vê a obra X).
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
