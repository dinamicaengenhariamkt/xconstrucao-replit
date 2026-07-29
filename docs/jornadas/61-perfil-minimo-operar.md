# Jornada — Perfil Mínimo para Operar (e saída do CPF/CNPJ do cadastro)

> Status: pronto | Prioridade: alta | Wave: 12
> Última atualização: 2026-07-29
>
> Move a coleta do documento fiscal do **cadastro** para o **wizard/perfil** e
> cria o portão que torna essa troca segura: um gate de perfil mínimo na porta
> das ações que exigem partes identificadas (publicar obra, enviar proposta).
>
> Reverte parcialmente a decisão da [J44](44-cadastro-cpf-customer-asaas.md), que
> tornou o CPF/CNPJ obrigatório no signup — e que a própria J44 §11 já apontava
> como risco de fricção no funil.

## 1. Contexto & Objetivo

A primeira tela de cadastro pedia CPF/CNPJ de contratante e empreiteiro. A
decisão de produto é que ela peça **apenas os dados básicos** — nome, e-mail,
usuário, telefone, senha. Documento fiscal é dado de cobrança, não de identidade:
cobrar ele antes de a pessoa ver o produto troca conversão por um dado que só
será usado semanas depois.

Mas tirar o campo sem mais nada abriria um buraco: contratante e empreiteiro
passariam a publicar obra e enviar proposta sem documento, sem endereço e sem
contato — e obra vira contrato, contrato vira cobrança. Por isso a jornada tem
duas metades inseparáveis: **tirar do cadastro** e **exigir na porta da ação**.

## 2. Personas

- **Contratante**: informa CPF **ou** CNPJ no wizard (pulável) ou nas
  Configurações. Sem documento + endereço + contato, não publica obra.
- **Empreiteiro**: informa **CNPJ** (pessoa jurídica). Sem isso — mais
  especialidades e raio de atuação — não envia proposta.
- **Anunciante**: inalterado. O documento continua sendo coletado no **checkout
  do anúncio** (customer lazy do Asaas), nunca no cadastro nem no wizard —
  duplicar a coleta criaria dois pontos de verdade para o mesmo dado.

## 3. Fluxo ponta-a-ponta

```mermaid
flowchart LR
  A[/cadastro — sem documento/] --> B[verificar email] --> C[/login]
  C --> W[/onboarding — Passo 1 pede documento/]
  W -- informou --> D[perfil + users.cpf_cnpj + customer Asaas]
  W -- pulou --> DASH[dashboard]
  DASH --> ACAO{publicar obra /<br/>enviar proposta}
  ACAO -- perfil ok --> OK[segue]
  ACAO -- incompleto --> E422[422 PERFIL_INCOMPLETO<br/>+ lista de campos]
  E422 --> CFG[Configurações] --> ACAO
```

## 4. Três noções de completude — não confundir

O projeto já tinha duas, e esta jornada adiciona a terceira. São deliberadamente
distintas:

| Predicado | Onde | Para que serve | Exige |
|---|---|---|---|
| `perfil_completo` | `isProfileComplete` nos PATCH de perfil | Gate da **curadoria do admin** | Perfil rico: +avatar (contratante); +avatar, descrição, portfólio (empreiteiro) |
| `completionPercentage` | `GET /api/empreiteiro/perfil-status` | Barra informativa | Checklist de 5 itens |
| **`podeOperar`** | `shared/lib/perfil-operacional.ts` | **Gate de operar (esta jornada)** | Identificação, contato, documento, endereço — e nada além |

O gate de operar é o mais enxuto de propósito: pede o indispensável para um
contrato e uma cobrança existirem. Exigir foto de perfil antes da primeira obra
seria fricção sem contrapartida.

## 5. Componentes-chave

- [shared/lib/perfil-operacional.ts](../../shared/lib/perfil-operacional.ts) —
  `contratantePodeOperar` / `empreiteiroPodeOperar`, `CODE_PERFIL_INCOMPLETO`,
  `mensagemPerfilIncompleto`. Fonte única: servidor, UI e testes leem daqui.
- [features/auth/schemas/index.ts](../../features/auth/schemas/index.ts) —
  `registerSchema`: `cpfCnpj` opcional; formato ainda validado **quando vem**.
- [app/cadastro/page.tsx](../../app/cadastro/page.tsx) — campo removido.
- [features/onboarding/OnboardingWizard.tsx](../../features/onboarding/OnboardingWizard.tsx)
  — `StepEmpresa` ganhou o campo, com rótulo e validação por persona.
- [app/api/perfil/contratante/route.ts](../../app/api/perfil/contratante/route.ts)
  e [empreiteiro](../../app/api/perfil/empreiteiro/route.ts) — validam formato e
  sincronizam `users.cpf_cnpj`.

## 6. Schema (Drizzle)

Nenhuma coluna nova. Reusa `users.cpf_cnpj` (J42/J44), `clientes.cnpj_cpf` e
`empreiteiras.cnpj`.

## 7. Endpoints

- `POST /api/auth/register` — deixa de exigir o documento.
- `PATCH /api/perfil/{contratante,empreiteiro}` — passam a **validar dígito
  verificador** (400 se inválido) e a provisionar o customer Asaas quando o
  documento chega. Empreiteiro recusa CPF.
- `POST /api/obras` — 422 `PERFIL_INCOMPLETO` com `faltando[]`.
- `POST /api/empreiteiro/candidaturas` — idem.

## 8. Mocks a remover

Nenhum.

## 9. Checklist de implementação

- [x] `cpfCnpj` opcional no `registerSchema`, mantendo validação de formato e a regra por persona
- [x] Campo removido de `app/cadastro/page.tsx` (o texto LGPD já existia no wizard — não se perdeu da jornada)
- [x] Campo no Passo 1 do wizard, pulável, rótulo/validação por persona, oculto p/ anunciante
- [x] PATCH de perfil valida dígito verificador (era `z.string()` cru — aceitava lixo)
- [x] PATCH de perfil sincroniza `users.cpf_cnpj` (fonte de verdade da subconta)
- [x] `provisionarCustomerAsaas` movido para o PATCH — best-effort, idempotente, não bloqueia
- [x] Gate ligado em `POST /api/obras` (depois de 401/403, status 422)
- [x] Gate ligado em `POST /api/empreiteiro/candidaturas` (antes do parse do corpo)
- [x] UI de nova obra e de aplicar tratam o 422 listando os campos pendentes
- [x] Testes de integração ajustados (cadastro sem documento → 201) e ampliados (G9–G11)
- [x] Suíte completa verde: **404 passed, 13 skipped**, 1 falha pré-existente e alheia à jornada (ver §13)
- [ ] Testes de browser ajustados mas **não executados** — Chromium falha neste ambiente (ver §11)

## 10. Critérios de aceite

1. `/cadastro?perfil=contratante` não mostra campo de documento; cadastro conclui e `users.cpf_cnpj` fica **nulo**.
2. Wizard Passo 1 mostra "CPF ou CNPJ" (contratante) e "CNPJ" (empreiteiro); anunciante não vê o campo.
3. Documento vazio no wizard não bloqueia o "Continuar"; documento inválido bloqueia.
4. Contratante sem endereço → `POST /api/obras` responde 422 com `code` e `faltando[]`.
5. Empreiteiro sem especialidades/raio → `POST /api/empreiteiro/candidaturas` responde 422 mesmo com `obraId` inexistente.
6. Anônimo recebe 401 e role errada recebe 403 — **nunca** 422.
7. `PATCH /api/perfil/empreiteiro` com CPF válido → 400.
8. Query: `SELECT role, count(*), count(cpf_cnpj) FROM users GROUP BY role;`

## 11. Riscos / Pontos de atenção

- **O status 422 não é livre.** A suíte trata **402** como cota de plano com
  `test.skip` — um gate devolvendo 402 viraria falso verde. Travado por teste (G8).
- **A ordem dos guards importa.** 401 e 403 precedem o 422: senão um anônimo
  receberia "complete seu perfil" em vez de "não autenticado", vazando a
  existência do recurso. Travado por teste (G3, G4).
- **No empreiteiro o gate vem antes do parse do corpo** — senão um perfil
  incompleto com `obraId` inválido receberia 400/404 e o usuário nunca
  descobriria a causa real.
- **Customer Asaas sem documento no cadastro**: `provisionarCustomerAsaas` só
  roda quando o documento existe. Com a coleta migrada, ele passou a ser
  disparado também do PATCH de perfil. O fallback lazy no 1º checkout continua.
- **Contas criadas entre a J44 e esta jornada** têm documento; nada a migrar. O
  [backfill](../../scripts/backfill-user-cpf-cnpj.ts) segue válido e idempotente.
- **E2E de navegador não rodam neste ambiente** (Chromium falha no launch com
  `GLIBC_PRIVATE not found`, ver [J37 §12](37-testes-e2e.md)). Os três casos de
  `tests/e2e/onboarding.spec.ts` foram ajustados às cegas — validar quando houver
  runner com browser.

## 12. Links cruzados

- Revisa: [J44](44-cadastro-cpf-customer-asaas.md) (§13 — a coleta saiu do cadastro).
- Estende: [J51](51-wizard-onboarding.md) (Passo 1 ganhou o documento) e
  [J52](52-perfil-incompleto-continuidade-onboarding.md) (banner de perfil incompleto).
- Depende de: J42 (colunas), J45 (subconta lê `users.cpf_cnpj`).

## 13. Gaps descobertos durante execução

> Doc viva. Uma linha por item, com data.

- **2026-07-29 — O PATCH de perfil aceitava documento malformado.** `cnpjCpf` e
  `cnpj` eram `z.string().optional().nullable()` — sem validação de dígito
  verificador. A checagem só existia no client (telas de Configurações), então um
  PATCH direto à API gravava lixo, que o Asaas recusava depois, no checkout,
  longe da causa. Com a coleta migrando para cá, esse endpoint virou a porta de
  entrada principal do dado — corrigido nos dois handlers, coberto por G9/G11.

- **2026-07-29 — Empreiteiro com CPF no teste de browser.** O caso
  `empreiteiro: cadastro -> ...` de `tests/e2e/onboarding.spec.ts` preenchia CPF
  (`52998224725`) desde antes desta jornada, o que já violava a regra da J44 §13
  (empreiteiro = CNPJ). Passou despercebido porque os E2E de navegador não rodam
  neste ambiente. Corrigido para CNPJ, e o caso agora também exercita a recusa do
  CPF no wizard.

- **2026-07-29 — Helper de teste registrava empreiteiro com CPF.**
  `onboarding.integration.spec.ts` definia um `CPF_VALIDO` local e o mandava para
  as três personas, ignorando o `DOC_VALIDO_POR_ROLE` que os helpers já exportam
  justamente para isso — o registro do empreiteiro dava 400. Passava antes porque
  o teste era tolerante; ficou visível quando a suíte rodou inteira. Corrigido
  para usar o helper.

- **2026-07-29 — Falha pré-existente na suíte, fora do escopo desta jornada.**
  `planos-assinatura.integration.spec.ts:800` chama `GET /api/admin/financeiro`,
  rota que **não existe** (só há subrotas). O teste aceita `200 ou 404`, então
  nunca reprovaria; mas em dev o Next leva ~90s para resolver o 404 e o caso
  estoura o timeout. Não foi tocado pela J61 e não tem relação com o gate.
  Registrado no [_backlog-paralelo.md](_backlog-paralelo.md) como P2.

- **2026-07-29 — Fonte de verdade do documento ainda dividida (não resolvido).**
  `subconta-service.ts` lê `users.cpf_cnpj`; `assinatura-service.ts:124-141` lê
  `clientes.cnpj_cpf`/`empreiteiras.cnpj`. Foi a causa do bug de produção da
  J44 §13. Com a sincronização no PATCH os dois caminhos ficam consistentes, mas
  unificar a leitura em `users.cpf_cnpj` continua pendente — registrado no
  [_backlog-paralelo.md](_backlog-paralelo.md) como P1.
