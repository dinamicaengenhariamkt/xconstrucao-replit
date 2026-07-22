# Jornada — Fechamento da UI de Pagamento de Anúncios & FAQ do Anunciante

> Status: pronto | Prioridade: alta | Wave: 11
> Última atualização: 2026-07-22
>
> Fecha o gap visual da J31: o backend de pagamento de anúncio (moderar-antes-de-pagar,
> link Asaas, webhook) estava 100% pronto, mas nenhuma tela do anunciante o consumia —
> um pedido aprovado ficava preso em "Aprovado" sem caminho para pagar. Também sana o
> menu do anunciante (link de FAQ quebrado → 404) criando a FAQ completa da persona.

## 1. Contexto & Objetivo
Ligar a UI ao pagamento real da J31 e dar paridade de navegação ao anunciante. Quando a
cobrança real está ligada (`AD_PAYMENT_GATEWAY=asaas`), o anunciante precisa de um caminho
claro: pedido aprovado → **Pagar** → checkout Asaas → publicação. A copy de "simulação" não
pode mentir quando a cobrança está ativa. E o item "Perguntas Frequentes" do menu não pode
levar a um 404.

## 2. Personas
- **Anunciante**: paga o pedido aprovado; consulta a FAQ da sua persona.
- **Admin**: cria/edita FAQs com a nova visão "anunciante".
- **Sistema**: expõe a flag `adPaymentEnabled` (não-sensível) ao client.

## 3. Fluxo ponta-a-ponta
1. Pedido criado → moderação → **aprovado** (`cobranca_status=pendente`).
2. No modo pago, o card do pedido mostra **Pagar**. Se já há `invoiceUrl`, redireciona
   direto; senão coleta CPF/CNPJ, chama `POST /api/anuncios/pedidos/[id]/pagar` e redireciona
   ao checkout Asaas.
3. Webhook confirma → materializa/publica (J31, já pronto).
4. FAQ do anunciante: item de menu → `/anunciante/faq` → perguntas da visão `anunciante` + `ambos`.

## 4. Telas/Componentes
- [features/anuncios/self-service/components/PedidoStatusCard.tsx](../../features/anuncios/self-service/components/PedidoStatusCard.tsx) — botão Pagar + dialog de CPF/CNPJ.
- [features/anuncios/self-service/components/MeusAnunciosLista.tsx](../../features/anuncios/self-service/components/MeusAnunciosLista.tsx) — lê `usePublicConfig` uma vez, passa `adPaymentEnabled`/`onPago`.
- [app/anunciante/dashboard/page.tsx](../../app/anunciante/dashboard/page.tsx) e [MontadorPedido.tsx](../../features/anuncios/self-service/components/MontadorPedido.tsx) — copy condicional à flag.
- [app/anunciante/faq/page.tsx](../../app/anunciante/faq/page.tsx) + [features/anunciante/faq/](../../features/anunciante/faq/) + [app/api/anunciante/faq/route.ts](../../app/api/anunciante/faq/route.ts) — FAQ da persona (clonada do contratante).

## 5. Flag ao client
`adPaymentEnabled: isAdPaymentEnabled()` adicionado ao [public-config](../../app/api/plataforma/public-config/route.ts)
e ao tipo/DEFAULTS de [use-public-config.ts](../../features/shared/hooks/use-public-config.ts)
(default `false` = fail-safe: nunca promete cobrança que não existe).

## 6. FAQ — visão nova
- Enum `faq_visao` ganhou `anunciante` ([schema.ts](../../shared/db/schema.ts) + `ALTER TYPE ADD VALUE IF NOT EXISTS` em [bootstrap-faq.ts](../../server/bootstrap-faq.ts)).
- `FAQVisao` e as validações zod (admin route + modal) incluem `anunciante`.
- Admin: opção "Anunciante" em `VISAO_OPTIONS` do [NovaPerguntaModal](../../features/admin/faq/components/NovaPerguntaModal.tsx).
- 5 FAQs pré-criadas (ids `afq-anun*`, editáveis pelo admin — `ON CONFLICT DO NOTHING`) cobrindo criar anúncio, zonas, moderação, pagamento e gestão.

## 7. Mocks removidos
Nenhum mock de dado foi introduzido. A copy hardcoded de "simulação — sem cobrança real"
(que enganava no modo pago) passou a ser condicional à flag real.

## 8. Checklist
- [x] `adPaymentEnabled` no public-config + hook (default false)
- [x] Botão Pagar (aprovado+pendente) → coleta CPF/CNPJ → `/pagar` → redirect `invoiceUrl`; idempotente com `invoiceUrl` existente
- [x] Copy de simulação condicional à flag (dashboard + montador)
- [x] FAQ do anunciante: enum + admin (modal/zod) + seeds + rota/hook/página; item de menu resolve
- [x] Teste de integração: `/pagar` responde 404 no modo manual; `public-config` expõe booleano; FAQ do anunciante responde

## 9. Critérios de aceite
1. Com `adPaymentEnabled=false` (protótipo), nenhum botão Pagar aparece e a copy diz "simulação".
2. Com `adPaymentEnabled=true`, pedido aprovado+pendente mostra Pagar; sem `invoiceUrl` coleta CPF/CNPJ e chama `/pagar`; com `invoiceUrl` redireciona direto.
3. `POST /pagar` no modo manual responde 404 (a cobrança real não está habilitada).
4. `GET /api/anunciante/faq` responde as perguntas da visão `anunciante` + `ambos`; o item de menu não é mais 404.
5. Admin consegue criar/editar FAQ com visão "Anunciante".

## 10. Links cruzados
- Fecha visualmente a J31 (pagamento de anúncios). Reusa J26 (public-config), J32 (FAQ).
- Testes de browser (fluxo visual do Pagar) ficam para a J37 (Chromium não sobe no ambiente atual).
