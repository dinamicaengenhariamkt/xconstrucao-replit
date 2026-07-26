# Operação: limpar a base e testar com Asaas sandbox

Guia das duas operações usadas para preparar a plataforma para testes com clientes reais.

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

## 2. Asaas sandbox no ambiente publicado

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

## 3. Testes continuam só em desenvolvimento

`tests/e2e/guards.ts` roda como `globalSetup` e aborta a suíte se a `DATABASE_URL` não for de
um host de dev conhecido, ou se `PAYMENT_GATEWAY` não for `manual`. Nada muda aqui.

A suíte **não depende mais** do `server/seed.ts`: `POST /api/test/ensure-users` cria as
personas necessárias, então ela roda normalmente sobre uma base recém-limpa.

```bash
npm run test:integration          # ambiente dev
npm run test:integration:gaps     # radar de endpoints sem cobertura
```
