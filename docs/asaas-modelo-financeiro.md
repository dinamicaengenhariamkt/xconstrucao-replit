# Modelo Financeiro ASAAS — XConstrução

> Fonte de verdade única de **quem tem conta no ASAAS, quem paga/recebe onde, e o
> papel da conta-mãe**. O modelo está implementado no código (gated por
> `PAYMENT_GATEWAY=asaas` + `MARKETPLACE_SPLIT=on`), mas espalhado por várias
> jornadas — este doc consolida. Última atualização: 2026-07-22.

## Princípio central

Existe **uma única conta ASAAS "mãe": a da própria plataforma (XConstrução)**. A
chave dela é `ASAAS_API_KEY`. **Todo dinheiro entra nessa conta-mãe.** O único
repasse a terceiros é o **split de obra**, que devolve a fatia do empreiteiro para
a **subconta** dele. Ninguém mais tem conta própria no ASAAS — nem admin, nem
contratante, nem anunciante.

## Quadro-resumo por papel

| Papel | Customer ASAAS (pagador) | Subconta ASAAS (recebedor) | Fluxo de dinheiro |
|---|---|---|---|
| **Contratante** | Sim — criado no cadastro se informar CPF/CNPJ | Não | Paga assinatura → **conta-mãe**. Paga obra → total na conta-mãe, com split repassando a fatia do empreiteiro |
| **Empreiteiro** | Sim — criado no cadastro se informar CPF/CNPJ | **Sim** — único que tem (`POST /accounts`), criado ao configurar recebimento | Paga assinatura → **conta-mãe**. **Recebe** o repasse da obra na subconta (`walletId`) |
| **Anunciante** | **Não hoje** (isento de CPF/CNPJ no cadastro) | Não | Pagamento de anúncio é **protótipo** (não cobra ainda — J31 pendente). Quando real, paga a conta-mãe |
| **Admin / Superadmin** | Não | Não | **Nenhuma conta ASAAS.** Só opera fluxos (reconciliação, moderação) |
| **Plataforma (conta-mãe)** | — | — | `ASAAS_API_KEY`. Recebe **100% das assinaturas** e a **comissão** de cada obra (a parte não destinada ao split) |

## Customer vs Subconta — a distinção que importa

São **dois conceitos diferentes** do ASAAS, e é fácil confundir:

- **Customer** = um "cliente" de cobrança **dentro da conta-mãe**. É o **pagador**
  (quem é cobrado). Não é uma conta separada — é só um registro na conta-mãe. Criado
  por [features/marketplace/customer-service.ts](../features/marketplace/customer-service.ts)
  (`provisionarCustomerAsaas`), chamado no cadastro **sempre que há CPF/CNPJ**
  ([app/api/auth/register/route.ts](../app/api/auth/register/route.ts) `if (cpfCnpj)`).
  Como o gate é a presença do documento e o anunciante é isento dele, hoje só
  **contratante e empreiteiro** ganham customer proativo.

- **Subconta** = uma **conta ASAAS filha de verdade** (`POST /accounts`), com
  `walletId` e apiKey própria (cifrada em repouso). É o **recebedor**. Criada por
  [features/marketplace/subconta-service.ts](../features/marketplace/subconta-service.ts)
  (`criarOuAtualizarSubconta`), **exclusivamente para o empreiteiro** — o endpoint
  [app/api/empreiteiro/recebimento/subconta/route.ts](../app/api/empreiteiro/recebimento/subconta/route.ts)
  tem `guardEmpreiteiro` que rejeita qualquer outra role com 403. Não é criada no
  cadastro; é criada quando o empreiteiro configura "dados de recebimento".

**Regra de ouro:** customer nunca recebe; recebimento é sempre via subconta/`walletId`.

## Fluxo do dinheiro por operação

### Assinatura de plano (contratante ou empreiteiro)
`iniciarCheckout` ([features/planos/assinatura-service.ts](../features/planos/assinatura-service.ts))
→ `AsaasGateway.createCheckout` ([features/planos/gateway/asaas-gateway.ts](../features/planos/gateway/asaas-gateway.ts)).
A cobrança (`POST /checkouts`, `chargeType: RECURRENT`) usa a **master key** e **não
tem campo `split`**. → **100% do valor fica na conta-mãe.** Vale igual para as duas
personas (só muda de onde busca o CPF/CNPJ: `clientes` vs `empreiteiras`).

### Pagamento de obra com split (contratante paga, empreiteiro recebe)
`iniciarCheckoutSplit` ([features/marketplace/split-service.ts](../features/marketplace/split-service.ts)),
acionado por [app/api/contratante/pagamentos/[id]/checkout-split/route.ts](../app/api/contratante/pagamentos/[id]/checkout-split/route.ts).

```
valorTotal        = valor do lançamento (o que o contratante paga)
percentualPlataforma = getPercentualPlataforma()   // configurável em platform_settings
valorPlataforma   = valorTotal × percentual/100    // COMISSÃO — fica na conta-mãe
valorEmpreiteiro  = valorTotal − valorPlataforma    // REPASSE — vai p/ subconta
```

A cobrança (`createPaymentWithSplit`, master key) nasce na conta-mãe com
`split: [{ walletId: <subconta empreiteiro>, fixedValue: valorEmpreiteiro }]`. O
ASAAS repassa **só a fatia do empreiteiro** para a subconta dele; **a comissão fica
retida na conta-mãe por diferença** (não há regra de split para ela). O percentual é
**congelado** por pagamento em `pagamentos_split.percentual_plataforma` (snapshot).

Pré-condição: a subconta do empreiteiro precisa estar `aprovada` com `walletId`;
senão retorna `SUBCONTA_NAO_APROVADA` e o fluxo cai para pagamento manual (fallback
`quitarLancamento`). Confirmação chega por webhook (J48, `aplicar-evento-split.ts`).

### Pagamento de anúncio (anunciante) — GAP / protótipo
Hoje o billing é `PrototipoBilling` ([features/anuncios/self-service/billing-port.ts](../features/anuncios/self-service/billing-port.ts))
— **não cobra nada** (pedido nasce `cobrancaStatus: 'prototipo'`, vira `'isenta'` na
aprovação). A cobrança real é a **J31** (bloqueada por decisão comercial; o gateway já
existe). Quando implementada, o anunciante paga a **conta-mãe** (não tem subconta, pois
nunca recebe) e o customer dele será criado **lazy no checkout** (coletando CPF/CNPJ ali,
já que o cadastro de anunciante é isento) — ver decisão na J31.

## Por que o admin não tem conta ASAAS

A plataforma **é** a conta ASAAS (a conta-mãe, `ASAAS_API_KEY`). O admin não é nem
pagador nem recebedor — ele opera a plataforma (dispara reconciliação, modera,
configura o percentual de comissão). Não há em nenhum lugar do código criação de
customer ou subconta para `admin`/`superadmin`. Superadmin só aparece como role
autorizada a **disparar** um checkout-split em nome de operação, mas o dinheiro é
sempre do contratante/empreiteiro.

## Gaps conhecidos

- **Pagamento de anúncio (J31)** é protótipo — o único ponto do modelo que ainda não
  toca o ASAAS de verdade. Bloqueado por decisão comercial.
- **Customer do anunciante** não existe hoje (isento de CPF/CNPJ). Decisão: criar
  lazy no checkout de anúncio (J31), não no cadastro nem no wizard (J51).

## Links cruzados
- [J11 — Planos & Assinatura](jornadas/11-planos-assinatura.md) — cobrança de assinatura (conta-mãe).
- [J31 — Pagamento Real de Anúncios](jornadas/31-pagamento-anuncios.md) — billing do anunciante (pendente).
- [J44 — Cadastro: CPF/CNPJ + Customer Asaas Proativo](jornadas/44-cadastro-cpf-customer-asaas.md).
- [J45 — Onboarding de Subconta do Empreiteiro](jornadas/45-onboarding-subconta-empreiteiro.md).
- [J47/J48 — Checkout de Obra com Split / Confirmação](jornadas/47-checkout-obra-split.md).
- [Operação & Rollout do Split](jornadas/_rollout-marketplace-split.md) — env vars, webhook, reconciliação.
- [Validação do webhook ASAAS](asaas-webhook-validation.md).
