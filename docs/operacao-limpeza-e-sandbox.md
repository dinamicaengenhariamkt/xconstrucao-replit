# Operação: limpar a base e testar com Asaas sandbox

Guia das operações usadas para preparar a plataforma para testes com clientes reais:
limpar a base, rodar sandbox no ambiente publicado, executar a suíte e corrigir o
documento fiscal dos usuários existentes.

---

## 1. Zerar a base preservando o administrador

`scripts/limpar-base.ts` apaga todos os usuários e operações, preservando apenas os
administradores e o catálogo de configuração.

```bash
# 1. Ver o que seria apagado, sem apagar nada
npm run db:limpar:preview

# 2. Executar (dev)
CONFIRM_LIMPAR=SIM npm run db:limpar

# 3. Preservar apenas administradores específicos
KEEP_ADMINS="voce@empresa.com" CONFIRM_LIMPAR=SIM npm run db:limpar

# 4. Em produção — exige a segunda confirmação
CONFIRM_LIMPAR=SIM CONFIRM_LIMPAR_PROD=SIM npm run db:limpar
```

**Preservado:** usuários `admin`/`superadmin` e todo o seu rastro · `planos` ·
`platform_settings` · `legal_documents` · `anuncio_config` · `faq` · `schema_migrations`.

**Apagado:** contratantes, empreiteiros, anunciantes, obras, candidaturas, medições,
contratos, pagamentos, anúncios, chat, notificações, disputas, surveys, arquivos e logs
operacionais.

### Detalhes que importam

- **O seed não desfaz a limpeza.** `server/seed.ts` retorna assim que encontra qualquer
  usuário; como o admin permanece, joão/maria **não** voltam no próximo boot. Verificado
  reiniciando a aplicação após a limpeza.
- **Usa `DELETE` filtrado, não `TRUNCATE CASCADE`.** O TRUNCATE ignora `ON DELETE SET NULL`
  e esvaziaria tabelas que deveriam apenas ter a coluna anulada — além de não permitir
  preservar o admin.
- **A ordem das tabelas é obrigatória.** `financeiro.obra_id`, `candidaturas.obra_id`,
  `candidaturas.empreiteiro_id` e `pagamentos_split.obra_id` não têm CASCADE e bloqueiam o
  DELETE se vierem fora de ordem.
- **`KEEP_ADMINS` aborta em e-mail inexistente**, para que um erro de digitação não apague
  a conta que você queria manter.
- **Não confundir com `scripts/reset-and-seed.ts`**, que apaga TODOS os usuários (inclusive
  admins) e reexecuta o seed de demonstração.

### Guard anti-produção

A classificação da `DATABASE_URL` vive em [shared/lib/db-env.ts](../shared/lib/db-env.ts) e é
compartilhada por `limpar-base.ts`, `reset-and-seed.ts` e `tests/e2e/guards.ts` — os três
respondem a mesma pergunta do mesmo jeito. Host desconhecido conta como produção
(fail-closed). Antes, o guard do `reset-and-seed` procurava literalmente `.prod`/`production`
na URL e **não reconhecia hosts Neon/Supabase/Railway**: o TRUNCATE rodava contra produção
sem pedir confirmação.

---

## 2. Base de demonstração xgestão (somente desenvolvimento)

Para demonstrar o xgestão sem apagar os dados existentes do marketplace, use o
seed aditivo abaixo. Ele recusa produção e bancos com host desconhecido, não
executa `DELETE` e só cria/atualiza as contas de demonstração reservadas.

```bash
# Prévia sem escrita
npm run db:demo:xgestao:preview

# Criar/atualizar a base de demonstração
CONFIRM_XGESTAO_DEMO=SIM npm run db:demo:xgestao

# Conferir que as contas, a obra própria e o modo público xgestão estão prontos
npm run db:demo:xgestao:check

# Executar as salvaguardas automatizadas do seed (sem conectar ao banco)
npm run test:seed:xgestao
```

O processo preserva todos os usuários, obras e configurações do marketplace,
inclusive o administrador global. Caso ainda não exista, cria
`admin@xconstrucao.com` como administrador global; se já existir, não o altera.

Além dele, garante duas identidades exclusivas de desenvolvimento:

| Conta | Finalidade |
|---|---|
| `admin.xgestao@xconstrucao.test` | Administrador limitado ao painel xgestão |
| `demo.xgestao@xconstrucao.test` | Empreiteiro com entitlement xgestão, perfil completo e obra própria |

As duas contas de demonstração usam a senha de desenvolvimento
`Xgestao@2026!Demo`. O seed também desliga `marketplaceVisivel`, deixando a
superfície pública focada no xgestão. Para reativar o marketplace depois, basta
religar o toggle administrativo; nenhum dado foi removido.

Depois de executar o seed com a aplicação já aberta, recarregue a página após
até 30 segundos ou reinicie a aplicação. Esse é o TTL do leitor público de
configurações; o comando altera o banco diretamente e não consegue limpar o
cache de outro processo.

> Não use `db:limpar` para essa finalidade. A limpeza remove todos os usuários
> não administrativos e as operações do marketplace, que este seed foi criado
> justamente para preservar.

---

## 3. Asaas sandbox no ambiente publicado

A escolha do ambiente Asaas é **independente de `NODE_ENV`** — de propósito. Dá para publicar
a aplicação, apontando para o banco de produção, com os pagamentos ainda simulados. É o modo
usado para os clientes testarem sem cobrança real.

```bash
PAYMENT_GATEWAY=asaas
ASAAS_ENVIRONMENT=sandbox      # troque para "production" no go-live
```

Decidido em uma única linha: [shared/lib/asaas-client.ts](../shared/lib/asaas-client.ts),
`getBaseUrl()`.

### Salvaguardas

| Onde | O que faz |
|---|---|
| `AvisoAmbienteTeste` | Faixa "Ambiente de testes — pagamentos simulados" nas telas de planos (contratante e empreiteiro), pagamentos da obra e checkout de anúncio. Some sozinha em produção real. |
| `instrumentation.ts` | Aviso no boot quando `NODE_ENV=production` + `ASAAS_ENVIRONMENT≠production`. Caso contrário, um `[boot] pagamentos: …` discreto. |
| `asaas-client.ts` | Valor fora de `sandbox\|production` agora é **erro**. Antes, `ASAAS_ENVIRONMENT=prod` caía silenciosamente em sandbox. |

O flag chega ao client por `GET /api/plataforma/public-config` (campo `pagamentoSandbox`).
O default do hook é `true`: na dúvida, avisar que é teste é inofensivo; omitir o aviso num
ambiente que de fato é sandbox faria o usuário acreditar que pagou de verdade.

### Checklist do go-live

1. `ASAAS_ENVIRONMENT=production` — só isso liga a cobrança real.
2. **`ASAAS_WEBHOOK_TOKEN` (obrigatório).** O fail-closed do webhook agora vale em qualquer
   aplicação em produção. Antes dependia de `MARKETPLACE_SPLIT=on`, cujo default é `off` —
   então, na configuração real, um POST forjado confirmava assinatura ou pedido de anúncio.
   Sem token nem `ASAAS_WEBHOOK_IPS`, todo webhook é recusado.
3. `TRUST_PROXY_HEADERS=1` — sem isso o rate-limit por IP fica neutralizado (J19).
4. `NEXT_PUBLIC_BASE_URL` — monta as URLs de retorno do checkout.
5. Apontar o webhook do Asaas para `POST /api/webhooks/gateway`.
6. Confirmar que a faixa "Ambiente de testes" **desapareceu** das telas de pagamento.

---

## 4. Testes continuam só em desenvolvimento

`tests/e2e/guards.ts` roda como `globalSetup` e aborta a suíte se a `DATABASE_URL` não for de
um host de dev conhecido, ou se `PAYMENT_GATEWAY` não for `manual`. Nada muda aqui.

A suíte **não depende mais** do `server/seed.ts`: `POST /api/test/ensure-users` cria as
personas necessárias, então ela roda normalmente sobre uma base recém-limpa.

```bash
npm run test:integration          # project "api" — 444 testes, sem browser
npm run test:e2e                  # mesmo project (alias)
npm run test:integration:gaps     # radar de endpoints sem cobertura

# Só num runner com browser (Docker / CI externo — ver J37 §11):
npm run test:e2e:browser          # project "browser", com E2E_BROWSER=1
```

---

## 5. Backfill de `users.cpf_cnpj` (rodar uma vez por banco)

```bash
npx tsx scripts/backfill-user-cpf-cnpj.ts --dry-run   # mostra o que faria
npx tsx scripts/backfill-user-cpf-cnpj.ts            # aplica
```

**Por que existe.** Até 2026-07-26 o cadastro gravava o CPF/CNPJ apenas em
`clientes.cnpj_cpf` / `empreiteiras.cnpj` — **nunca** em `users.cpf_cnpj`. Como
`subconta-service.ts` lê justamente essa coluna para abrir a subconta Asaas do
empreiteiro, o onboarding de recebimento respondia `PERFIL_INCOMPLETO` para quem já
tinha informado o documento. O cadastro foi corrigido; o script recupera as contas
anteriores, copiando do perfil e normalizando para dígitos.

Só preenche onde está `NULL` — nunca sobrescreve. Idempotente.

**Rodar antes de ligar `MARKETPLACE_SPLIT=on` em produção.** Conferir depois:

```sql
SELECT role, count(*) AS total, count(cpf_cnpj) AS com_doc
FROM users GROUP BY role;
```

Contratantes e empreiteiros devem ter `com_doc = total`. Quem sobrar sem documento
é porque o perfil também não tinha — precisa informar pelo perfil antes de
configurar recebimento ou assinar plano.

**Regra por persona** (desde 2026-07-26): empreiteiro exige **CNPJ** (pessoa
jurídica); contratante aceita **CPF ou CNPJ**; anunciante é isento — o documento
dele é coletado no checkout do anúncio.

**Onde o documento é pedido** (mudou em 2026-07-29, [J61](jornadas/61-perfil-minimo-operar.md)):
não é mais no cadastro. A primeira tela pede só os dados básicos; o CPF/CNPJ é
coletado no **wizard de onboarding** (pulável) ou nas **Configurações**, e vira
obrigatório na porta da ação — publicar obra, enviar proposta, assinar plano ou
configurar recebimento. Consequência para os testes com clientes reais: um
usuário recém-cadastrado **não terá documento** até passar pelo wizard, e
`users.cpf_cnpj` nascerá nulo. Isso é esperado. Ao publicar a primeira obra ou
enviar a primeira proposta, ele recebe um aviso listando o que falta preencher.
