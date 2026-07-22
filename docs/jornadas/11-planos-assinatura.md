# Jornada — Planos & Assinatura

> Status: pronto | Prioridade: média | Wave: 3
> Última atualização: 2026-07-21
>
> Observação: ecossistema completo e funcional. O adapter de gateway **"manual"**
> (ativa sem cobrança real) é o default de dev/E2E e é **bloqueado em produção**.
> **O adapter ASAAS real já existe e faz chamadas HTTP verdadeiras** à API do Asaas
> (`shared/lib/asaas-client.ts` + `features/planos/gateway/asaas-gateway.ts`) — a
> Jornada 14 está **concluída**. O CPF/CNPJ **já é enviado ao Asaas**:
> `iniciarCheckout` busca `clientes.cnpjCpf`/`empreiteiras.cnpj` e o passa ao
> gateway; se ausente, retorna `PERFIL_INCOMPLETO` (acionável). O CPF/CNPJ passou
> a ser **coletado no cadastro** (J44 parcial). A página `/planos/aguardando`
> **existe**. Ir para produção é apenas configuração de env vars (ver seção 9).

## 1. Contexto & Objetivo
Monetização da plataforma via assinatura. Admin define planos com preço e limites (nº de obras ativas, candidaturas/mês, recursos premium); contratante e empreiteiro escolhem e pagam; status de assinatura gateia features nas demais jornadas.

## 2. Personas
- **Admin**: CRUD de planos.
- **Contratante / Empreiteiro**: escolhe, paga, gerencia, cancela.

## 3. Fluxo ponta-a-ponta
1. Admin cria/edita planos em `/admin/planos`.
2. Persona em `/contratante/planos` ou `/empreiteiro/planos` vê opções → seleciona → checkout.
3. Status `assinaturas` muda para `ativa` → libera limites no produto.
4. Renovação automática mensal/anual; falha de cobrança → status `inadimplente` → restringe.

## 4. Telas envolvidas
- [app/admin/planos/](../../app/admin/planos/)
- [app/contratante/planos/](../../app/contratante/planos/)
- [app/empreiteiro/planos/](../../app/empreiteiro/planos/)

## 5. Componentes-chave
- [features/admin/planos/](../../features/admin/planos/) (mocks)
- Componentes de plano em [features/contratante/](../../features/contratante/) e [features/empreiteiro/](../../features/empreiteiro/)

## 6. Schema (Drizzle)
**A criar**:
- `planos` (id, nome, descricao, valorMensal, valorAnual, persona [contratante|empreiteiro|ambos], limitesJson jsonb, ativo bool)
- `assinaturas` (id, userId, planoId, status [ativa|cancelada|inadimplente|expirada], iniciadaEm, renovaEm, canceladaEm, gatewayCustomerId, gatewaySubscriptionId)
- `assinatura_eventos` (id, assinaturaId, tipo, payloadJson, criadoEm) — webhook do gateway

## 7. Endpoints
- `GET/POST /api/admin/planos`
- `PATCH/DELETE /api/admin/planos/[id]`
- `GET /api/planos` — listagem pública por persona
- `POST /api/assinaturas/checkout` — inicia
- `POST /api/assinaturas/cancelar`
- `POST /api/webhooks/gateway` — confirmação de cobrança

## 8. Mocks a remover
- [features/admin/planos/mocks/](../../features/admin/planos/mocks/)
- Mocks análogos nas personas (verificar).

## 9. Checklist de implementação
- [x] **Abstração de gateway**: porta `PaymentGateway` + adapter `manual` ativo + factory por env `PAYMENT_GATEWAY` (`features/planos/gateway/`)
- [x] Schema + migration (idempotente `server/bootstrap-planos.ts`): `planos`, `assinaturas`, `assinatura_eventos`
- [x] Seed do catálogo a partir de `shared/lib/plans-catalog` (fonte de verdade dos limites)
- [x] CRUD admin de planos (`GET /api/admin/planos`, `PATCH /api/admin/planos/[id]`, kpi, assinantes)
- [x] Checkout (`POST /api/assinaturas/checkout`) — adapter manual ativa imediato; gateway real retornaria redirect
- [x] Webhook idempotente (`POST /api/webhooks/gateway`) — dedupe por `gateway_event_id`
- [x] Helper `userTemAssinaturaAtiva(userId)` + `getLimiteRecurso` para gating
- [x] Gating aplicado: obras abertas (J03) e propostas/mês (J05) → HTTP 402 `LIMITE_PLANO`
- [x] Lançamento de entrada em J09 ao ativar (escopo plataforma, categoria `assinatura`, idempotente)
- [x] Cancelar (`POST /api/assinaturas/cancelar`) → rebaixa para free
- [x] **Gateway REAL (Asaas) escrito e registrado na factory** (`features/planos/gateway/asaas-gateway.ts`) — checkout hospedado RECURRENT (PIX/Boleto/Cartão), cancelamento, checkPaymentStatus, parseWebhook. _(descoberto na auditoria 2026-07-19; a J14 não estava mais bloqueada)_
- [ ] **[BLOQUEANTE PRODUÇÃO] Enviar CPF/CNPJ ao Asaas** — `CheckoutInput.userCpfCnpj` existe mas `iniciarCheckout` (`assinatura-service.ts`) nunca o popula; Asaas exige para cobrança real → **Jornada 44**
- [ ] Criar página `app/planos/aguardando/page.tsx` (referenciada pelo modo pendente do adapter manual; Asaas real usa `/planos/sucesso`, que existe)
- [ ] Configurar env vars de produção: `PAYMENT_GATEWAY=asaas`, `ASAAS_API_KEY`, `ASAAS_ENVIRONMENT=production`, `ASAAS_WEBHOOK_IPS` (IPs oficiais do Asaas — sem isso o webhook aceita sem verificação de IP), `TRUST_PROXY_HEADERS=1`, `NEXT_PUBLIC_BASE_URL`
- [ ] Apontar o webhook do Asaas para `POST /api/webhooks/gateway`
- [ ] Refund/estorno ativo (hoje só reação passiva a `PAYMENT_DELETED`) — baixa prioridade
- [x] Tela "minha assinatura" persona-facing consumindo os endpoints _(Task #206)_
- [x] Item "Planos" no nav lateral de empreiteiro e contratante _(Task #206)_
- [x] CTA upgrade destacado na aba "Plano & Uso" das Configurações (banner free-only) _(Task #206)_
- [x] Notificações admin in-app em eventos de assinatura (checkout, cancelamento, inadimplente, reativação) _(Task #206)_
- [x] Testes E2E ponta-a-ponta: 5 fluxos (empreiteiro assina Pro, contratante upsell 402, downgrade, cancel 409, admin view) em `tests/e2e/integration/planos-assinatura.integration.spec.ts` _(Task #208)_
- [ ] Proration na troca de plano no meio do ciclo (hoje: cancela a anterior + cria nova)

## 10. Critérios de aceite
1. Admin cria plano "Empreiteiro Pro R$99/mês limite 30 candidaturas".
2. Empreiteiro assina → checkout → webhook → status `ativa`.
3. Empreiteiro consegue candidatar até o limite; ao tentar 31ª recebe upsell.
4. Cancelar → status `cancelada`, limites caem para tier free no fim do ciclo.
5. Entrada aparece em J09.

## 11. Riscos / Pontos de atenção
- Webhook idempotente — duplicar evento não pode duplicar lançamento.
- Mudança de plano no meio do ciclo (proration).
- Tier free precisa estar bem definido em todas as jornadas.

## 12. Links cruzados
- Depende de: J01.
- Alimenta: J09 (entradas).
- Gateia: J03, J05 (limites).

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- **2026-06-01** — Já existia `shared/lib/plans-catalog.ts` (limites/preços por persona/tier) consumido por `/api/perfil/plano`. Decisão: catálogo é a FONTE DE VERDADE dos limites; `planos` (DB) é seedado dele; `users.plano` continua sendo o tier ATIVO. `assinaturas` dita `users.plano`. Sem duplicar regra de limites.
- **2026-06-01** — **Abstração de gateway** (porta + adapter): `features/planos/gateway/payment-gateway.ts` (interface), `manual-gateway.ts` (adapter ativo, sem cobrança), `index.ts` (factory por `PAYMENT_GATEWAY`). Trocar de gateway = 1 adapter novo + env. Service/rotas/schema intocados. Integração real → Jornada 14.
- **2026-06-01** — Idempotência: `uq_assinaturas_user_ativa` (1 ativa por user), `uq_assinatura_eventos_gateway` (webhook dedupe), `uq_financeiro_origem` (entrada de receita não duplica). Verificado e2e: webhook duplicado → `processed:false`.
- **2026-06-01** — Gating retorna **HTTP 402** com `code: "LIMITE_PLANO"` em J03 (obras abertas) e J05 (propostas/mês). Tier free = catálogo (empreiteiro: 5 propostas, 2 obras; contratante: 1 obra). Enterprise (9999) tratado como ilimitado (gate não dispara).
- **2026-06-01** — Backend 100% pronto; falta a **UI persona-facing** ("minha assinatura"/checkout) consumir `/api/planos` + `/api/assinaturas/*`. Páginas `/contratante/planos` e `/empreiteiro/planos` existem mas ainda não plugadas aos endpoints — candidato a fase de UI.
- **2026-06-01** — Item de backlog `userTemAssinaturaAtiva` (precondição estratégica) materializado de verdade nesta fase.
- **2026-07-19 (Task #206)** — UI persona-facing completa: nav item "Planos" (empreiteiro + contratante), painel "Minha Assinatura" com badge de status/data/valor, dialog de confirmação na troca de plano, cancelamento direto na página de planos, banner de upgrade nas Configurações para free. `alert()` substituído por toast. Dispatcher `assinatura-admin-dispatcher.ts` integrado no `assinatura-service.ts` (fire-and-forget pós-commit para checkout, cancelamento, inadimplente, reativação).
- **2026-07-19 (Task #207)** — Dialog de upsell contextual (`features/planos/ui/PlanoUpsellDialog.tsx`) exibido quando backend retorna 402 `LIMITE_PLANO` em J03 (nova-obra) e J05 (aplicar/candidatura). Job `aviso-expiracao-job.ts` agora dispara notificação in-app `tipo: "alerta"` para admin/superadmin por inadimplente com mensagem "[Nome] está inadimplente no [Plano] há X dias. Renova em [data]." via `dispararNotificacaoAssinaturaAdmin` com `descricaoOverride` + `tipoNotificacao: "alerta"`. Dispatcher estendido com params opcionais `descricaoOverride` e `tipoNotificacao`.
- **2026-07-19 (auditoria de método de pagamento)** — Auditoria exaustiva revelou que o **adapter Asaas real já existe e faz `fetch` verdadeiro** (`shared/lib/asaas-client.ts` + `features/planos/gateway/asaas-gateway.ts`), registrado na factory por `PAYMENT_GATEWAY`. A J14 estava marcada "bloqueada" mas o gateway estava escrito — header e checklist corrigidos. Gaps para produção: (1) **CPF/CNPJ nunca enviado ao Asaas** (bloqueante → J44); (2) página `/planos/aguardando` inexistente (só afeta modo pendente do manual/E2E); (3) env vars de produção a configurar; (4) proration e refund ativo não implementados (baixa prioridade). Além disso, mapeou-se que **não existe o papel de recebedor** (empreiteiro receber pela obra e sacar) — nova frente documentada em J42–J50 (marketplace com split real via Asaas). Ver `_backlog-paralelo.md` e as jornadas 42–50.
- **2026-07-19 (Task #208)** — Testes E2E ponta-a-ponta em `tests/e2e/integration/planos-assinatura.integration.spec.ts`. 5 fluxos: (1) empreiteiro E2E fresh assina Pro → 201 activated → `GET /api/perfil/plano` tier=pro; (2) contratante cria 1ª obra e tenta 2ª → 402 LIMITE_PLANO; (3) downgrade: assina Pro + cancela → tier volta a free; (4) guards de cancelamento: sem assinatura ativa → 409, anônimo → 401, admin → 403; (5) admin: `GET /api/admin/planos`, kpi, assinantes retornam shape correto + authz (403 persona, 401 anônimo). Validação registrada como `e2e-planos`. Isolamento: fluxos 1–3 usam usuários E2E criados via `/api/auth/register` + `/api/test/login-as` (nunca tocam em maria/joao seed para não quebrar outros specs).
