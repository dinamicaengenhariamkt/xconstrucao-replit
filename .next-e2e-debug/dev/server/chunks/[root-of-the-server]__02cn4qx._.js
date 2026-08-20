module.exports = [
"[externals]/node:crypto [external] (node:crypto, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:crypto", () => require("node:crypto"));

module.exports = mod;
}),
"[project]/features/marketplace/customer-service.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "provisionarCustomerAsaas",
    ()=>provisionarCustomerAsaas
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/db.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/schema.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/planos/gateway/index.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$asaas$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/planos/gateway/asaas-gateway.ts [app-route] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
async function provisionarCustomerAsaas(args) {
    try {
        const gateway = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$index$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPaymentGateway"])();
        if (gateway.provider !== "asaas") return {
            ok: false
        };
        // Já provisionado? Não refaz.
        const [row] = await __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].select({
            asaasCustomerId: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].asaasCustomerId
        }).from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, args.userId)).limit(1);
        if (row?.asaasCustomerId) return {
            ok: true,
            customerId: row.asaasCustomerId
        };
        const customer = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$asaas$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findOrCreateCustomer"])(args.email, args.name, args.cpfCnpj ?? undefined);
        await __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["db"].update(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"]).set({
            asaasCustomerId: customer.id
        }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["users"].id, args.userId));
        return {
            ok: true,
            customerId: customer.id
        };
    } catch (err) {
        // Best-effort: não propaga. O customer será criado lazy no 1º checkout.
        console.warn(`[marketplace] provisionarCustomerAsaas falhou (userId=${args.userId}):`, err);
        return {
            ok: false
        };
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/features/planos/gateway/asaas-gateway.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AsaasGateway",
    ()=>AsaasGateway,
    "findOrCreateCustomer",
    ()=>findOrCreateCustomer,
    "parseExternalRef",
    ()=>parseExternalRef
]);
/**
 * Adapter ASAAS — J14.
 *
 * Implementa `PaymentGateway` usando o checkout hospedado do ASAS (redirect).
 * PIX, Boleto e Cartão de crédito disponíveis. Cobrança recorrente gerenciada
 * pelo ASAS; ativação da assinatura via webhook (PAYMENT_CONFIRMED/RECEIVED).
 *
 * Env vars obrigatórias (server-side):
 *   ASAAS_API_KEY        — chave de API (prefixo $aact_hmlg_ em sandbox)
 *   ASAAS_ENVIRONMENT    — "sandbox" | "production" (default: sandbox)
 *
 * Segurança: webhooks verificados via IP whitelist configurável.
 *   ASAAS_WEBHOOK_IPS    — lista de IPs autorizados separados por vírgula
 *                          (ex: "54.94.97.128,18.228.149.104"). Se não
 *                          configurada, apenas um aviso é emitido (sandbox).
 *   TRUST_PROXY_HEADERS  — se "1", lê X-Forwarded-For para extrair o IP real.
 */ var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:crypto [external] (node:crypto, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/asaas-client.ts [app-route] (ecmascript)");
;
;
// ── Helpers ──────────────────────────────────────────────────────────────────
/** Formato do externalReference: permite recuperar userId/planoId/ciclo do webhook. */ function buildExternalRef(userId, planoId, ciclo) {
    // Separador "|" é seguro — UUIDs só contêm hex + hifens, planoIds não contêm "|"
    return `xconstrucao|${userId}|${planoId}|${ciclo}`;
}
function parseExternalRef(ref) {
    const parts = ref.split("|");
    if (parts.length !== 4 || parts[0] !== "xconstrucao") return null;
    return {
        userId: parts[1],
        planoId: parts[2],
        ciclo: parts[3]
    };
}
async function findOrCreateCustomer(email, name, cpfCnpj) {
    // Tenta encontrar por email
    const list = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("GET", `/customers?email=${encodeURIComponent(email)}&limit=1`);
    if (list.data?.length > 0) {
        const existing = list.data[0];
        // Se o customer existente não tem cpfCnpj mas agora temos, atualiza via PUT.
        if (cpfCnpj && !existing.cpfCnpj) {
            try {
                return await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("PUT", `/customers/${existing.id}`, {
                    name,
                    email,
                    cpfCnpj
                });
            } catch (err) {
                console.warn(`[asaas] falha ao atualizar cpfCnpj do customer ${existing.id}:`, err);
            }
        }
        return existing;
    }
    // Cria novo customer
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("POST", "/customers", {
        name,
        email,
        ...cpfCnpj ? {
            cpfCnpj
        } : {},
        notificationDisabled: false
    });
}
const CYCLE_MAP = {
    mensal: "MONTHLY",
    anual: "YEARLY"
};
// ── Mapeamento de eventos ────────────────────────────────────────────────────
// Apenas eventos explicitamente mapeados são processados — todos os outros
// são tratados como "ignored" pelo fallback `?? "ignored"` em parseWebhook.
// SUBSCRIPTION_CREATED NÃO está aqui: a ativação da assinatura ocorre SOMENTE
// após confirmação de pagamento (PAYMENT_CONFIRMED/RECEIVED), nunca na criação
// do contrato. Isso evita ativação prematura antes de cobrança confirmada.
const EVENT_TYPE_MAP = {
    PAYMENT_CONFIRMED: "payment_succeeded",
    PAYMENT_RECEIVED: "payment_succeeded",
    PAYMENT_OVERDUE: "payment_failed",
    PAYMENT_DELETED: "payment_failed",
    SUBSCRIPTION_DELETED: "subscription_canceled"
};
class AsaasGateway {
    provider = "asaas";
    async createCheckout(input) {
        const email = input.userEmail ?? `user_${input.userId}@xconstrucao.placeholder`;
        const name = input.userName ?? `Usuário ${input.userId.slice(0, 8)}`;
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "https://xconstrucao.com.br";
        // J44 — resolve o customer Asaas. Prioridade: ID cacheado → lookup por email.
        //
        // O ID cacheado é VALIDADO contra o ambiente atual antes de ser usado:
        // um ID de sandbox não existe em produção (e vice-versa), então a rota
        // GET /customers/{id} retornaria HTTP 400/404. Nesse caso fazemos fallback
        // silencioso para findOrCreateCustomer, que encontra ou cria o customer
        // correto no ambiente atual.
        //
        // O ID resolvido é devolvido no CheckoutResult.redirect.gatewayCustomerId
        // para que assinatura-service o persista em users.asaas_customer_id — assim
        // o próximo checkout usa o ID correto sem precisar revalidar.
        let customerId;
        if (input.userAsaasCustomerId) {
            try {
                const cached = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("GET", `/customers/${input.userAsaasCustomerId}`);
                // Customer válido no ambiente atual. Atualiza CPF se estava faltando.
                if (input.userCpfCnpj && !cached.cpfCnpj) {
                    try {
                        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("PUT", `/customers/${cached.id}`, {
                            name,
                            email,
                            cpfCnpj: input.userCpfCnpj
                        });
                        console.info(`[asaas] cpfCnpj atualizado no customer ${cached.id}`);
                    } catch (e) {
                        console.warn(`[asaas] falha ao atualizar cpfCnpj do customer ${cached.id}:`, e);
                    }
                }
                customerId = cached.id;
                console.info(`[asaas] customer cacheado válido: ${customerId}`);
            } catch (err) {
                // ID inválido no ambiente atual (ex: ID de sandbox reutilizado em produção
                // ou vice-versa). Recria o customer via lookup por e-mail.
                console.warn(`[asaas] customer ID cacheado "${input.userAsaasCustomerId}" inválido no ambiente atual ` + `— recriando via e-mail. Motivo: ${err}`);
                const fresh = await findOrCreateCustomer(email, name, input.userCpfCnpj);
                customerId = fresh.id;
            }
        } else {
            const fresh = await findOrCreateCustomer(email, name, input.userCpfCnpj);
            customerId = fresh.id;
        }
        const externalRef = buildExternalRef(input.userId, input.planoId, input.ciclo);
        const tierLabel = {
            free: "Free",
            pro: "Pro",
            enterprise: "Enterprise"
        };
        const cicloLabel = {
            mensal: "Mensal",
            anual: "Anual"
        };
        const itemName = input.planoNome ?? `Plano XConstrução ${tierLabel[input.tier] ?? input.tier} – ${cicloLabel[input.ciclo] ?? input.ciclo}`;
        const checkout = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("POST", "/checkouts", {
            billingType: "UNDEFINED",
            chargeType: "RECURRENT",
            cycle: CYCLE_MAP[input.ciclo] ?? "MONTHLY",
            items: [
                {
                    name: itemName,
                    value: input.valor,
                    quantity: 1
                }
            ],
            externalReference: externalRef,
            customer: customerId,
            callback: {
                successUrl: input.successUrl ?? `${baseUrl}/planos/sucesso`,
                cancelUrl: input.cancelUrl ?? `${baseUrl}/planos`
            }
        });
        // NÃO retornamos gatewaySubscriptionId aqui: `checkout.id` é o ID de um
        // /checkouts, NÃO de uma /subscriptions. A subscription só é criada pelo
        // ASAAS APÓS o pagamento, e seu ID real chega no webhook via
        // `payment.subscription` (parseWebhook) — é ele que é persistido em
        // `assinaturas.gatewaySubscriptionId`. Devolver o checkout.id aqui faria
        // cancelSubscription/checkPaymentStatus baterem em /subscriptions/{id}
        // inexistente (404). O checkout.id é usado apenas para rastreio via log.
        //
        // Retornamos `gatewayCustomerId` para que assinatura-service persista o ID
        // resolvido em users.asaas_customer_id — garantindo que checkouts futuros
        // usem o ID correto para o ambiente atual sem precisar revalidar.
        console.info(`[asaas] checkout criado: checkoutId=${checkout.id} customer=${customerId}`);
        return {
            kind: "redirect",
            url: checkout.url,
            gatewayCustomerId: customerId
        };
    }
    async cancelSubscription(gatewaySubscriptionId) {
        if (!gatewaySubscriptionId) return;
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("DELETE", `/subscriptions/${gatewaySubscriptionId}`);
        } catch (err) {
            // Ignora 404 (já cancelada no ASAS) mas propaga outros erros
            if (err instanceof Error && err.message.includes("HTTP 404")) return;
            throw err;
        }
    }
    async checkPaymentStatus(gatewaySubscriptionId) {
        if (!gatewaySubscriptionId) return "unknown";
        try {
            // Primeiro: verifica o status da assinatura no gateway.
            const sub = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("GET", `/subscriptions/${gatewaySubscriptionId}`);
            if (sub.status === "ACTIVE") return "paid";
            if (sub.status === "EXPIRED" || sub.status === "INACTIVE") return "unpaid";
            // Fallback: lista os últimos pagamentos e verifica se há algum confirmado.
            const payments = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$asaas$2d$client$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["asaasRequest"])("GET", `/subscriptions/${gatewaySubscriptionId}/payments?limit=5`);
            const hasPaid = payments.data?.some((p)=>p.status === "CONFIRMED" || p.status === "RECEIVED");
            if (hasPaid) return "paid";
            if (payments.data && payments.data.length > 0) return "unpaid";
            return "unknown";
        } catch (err) {
            console.warn("[asaas] checkPaymentStatus falhou — retornando unknown:", err);
            return "unknown";
        }
    }
    async parseWebhook(rawBody, headers = {}, clientIp) {
        // ── Auth criptográfica: token do webhook (asaas-access-token) ────────────
        // Auth PRIMÁRIA, independente de IP/proxy. O token é definido no painel Asaas
        // (Integrações → Webhooks) e enviado no header `asaas-access-token`.
        // Comparação em tempo constante (timingSafeEqual sobre SHA-256 dos valores,
        // para não vazar comprimento). Este é o controle que impede um POST forjado
        // de confirmar pagamento de obra / aprovar subconta.
        const expectedToken = process.env.ASAAS_WEBHOOK_TOKEN ?? "";
        const allowedIps = (process.env.ASAAS_WEBHOOK_IPS ?? "").split(",").map((s)=>s.trim()).filter(Boolean);
        if (expectedToken) {
            // Header vem em minúsculas (normalizado pelo route). Aceita algumas grafias.
            const received = headers["asaas-access-token"] ?? headers["Asaas-Access-Token"] ?? headers["access_token"] ?? "";
            const a = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update(received).digest();
            const b = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["createHash"])("sha256").update(expectedToken).digest();
            if (!(0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$crypto__$5b$external$5d$__$28$node$3a$crypto$2c$__cjs$29$__["timingSafeEqual"])(a, b)) {
                console.warn("[asaas] webhook rejeitado: token inválido");
                throw new Error("[asaas] webhook token inválido");
            }
        } else if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
        ;
        // ── IP whitelist (defesa secundária) ─────────────────────────────────────
        // `clientIp` é resolvido pelo route handler via `getClientIp(request)` que
        // já aplica corretamente a política TRUST_PROXY_HEADERS. Não lemos headers
        // de IP aqui — o chamador poderia forjar X-Real-IP ou X-Forwarded-For.
        if (allowedIps.length === 0) {
            if (!expectedToken) {
                console.warn("[asaas] ASAAS_WEBHOOK_IPS/TOKEN não configurados — aceitando webhook sem verificação (modo sandbox). " + "Configure ASAAS_WEBHOOK_TOKEN em produção.");
            }
        } else {
            const resolvedIp = clientIp ?? "unknown";
            if (!allowedIps.includes(resolvedIp)) {
                console.warn(`[asaas] webhook rejeitado: IP "${resolvedIp}" não está na whitelist`);
                throw new Error(`[asaas] IP não autorizado: ${resolvedIp}`);
            }
            console.info(`[asaas] webhook aceito de IP autorizado: ${resolvedIp}`);
        }
        // ───────────────────────────────────────────────────────────────────────
        let body = {};
        try {
            body = rawBody ? JSON.parse(rawBody) : {};
        } catch  {
            throw new Error("[asaas] webhook body inválido (não é JSON)");
        }
        const event = body.event ?? "";
        const payment = body.payment ?? {};
        const subscription = body.subscription ?? {};
        // J46 — eventos de status de subconta (KYC). Formato Asaas:
        //   { event: "ACCOUNT_STATUS_*", id: "<evtId>", account: { id }, accountStatus: {...} }
        // A subconta só fica APTA a receber na aprovação GERAL; as demais etapas
        // (bank/commercial/document) são intermediárias → segue aguardando.
        if (event.startsWith("ACCOUNT_STATUS_")) {
            const account = body.account ?? {};
            const accountId = account.id ?? "";
            const evtUniqueId = body.id ?? "";
            const eventId = `${event}:${accountId || evtUniqueId || `asaas_conta`}`;
            let accountStatus;
            if (event === "ACCOUNT_STATUS_GENERAL_APPROVAL_APPROVED") accountStatus = "approved";
            else if (event.endsWith("_REJECTED")) accountStatus = "rejected";
            else accountStatus = "pending";
            console.info(`[asaas] webhook conta event="${event}" accountId="${accountId}" status="${accountStatus}"`);
            return {
                eventId,
                type: "account_status_changed",
                accountId: accountId || undefined,
                accountStatus,
                raw: body
            };
        }
        // ID do evento: preferir payment.id, depois subscription.id.
        // IMPORTANTE: o eventId DEVE incluir o tipo do evento para evitar falsa
        // deduplicação entre eventos distintos no mesmo recurso. Ex: PAYMENT_OVERDUE
        // e PAYMENT_CONFIRMED podem chegar para o mesmo payment.id — sem o prefixo
        // do evento, o segundo seria silenciosamente descartado como duplicata.
        const paymentId = payment.id ?? "";
        const subscriptionId = payment.subscription ?? subscription.id ?? "";
        const resourceId = paymentId || subscriptionId || `asaas_${Date.now()}`;
        const eventId = `${event}:${resourceId}`;
        // externalReference: permite reconectar o evento ao usuário/plano
        const externalReference = payment.externalReference ?? subscription.externalReference ?? undefined;
        const normalizedType = EVENT_TYPE_MAP[event] ?? "ignored";
        console.info(`[asaas] webhook event="${event}" mapped="${normalizedType}" paymentId="${paymentId}" subId="${subscriptionId}"`);
        return {
            eventId,
            type: normalizedType,
            gatewaySubscriptionId: subscriptionId || undefined,
            gatewayCustomerId: payment.customer ?? subscription.customer ?? undefined,
            externalReference,
            valor: typeof payment.value === "number" ? payment.value : undefined,
            raw: body
        };
    }
}
}),
"[project]/features/planos/gateway/index.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_overrideGatewayForTest",
    ()=>_overrideGatewayForTest,
    "getPaymentGateway",
    ()=>getPaymentGateway
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$manual$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/planos/gateway/manual-gateway.ts [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$asaas$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/planos/gateway/asaas-gateway.ts [app-route] (ecmascript)");
;
;
/**
 * Factory do gateway de pagamento. Resolve o adapter por `PAYMENT_GATEWAY`
 * (default "manual"). Para plugar um gateway real (J14): adicionar o adapter
 * e mapear aqui — nenhum caller muda.
 *
 * Adapters disponíveis:
 *   manual — stub sem cobrança (testes/dev; bloqueado em produção)
 *   asaas  — ASAS checkout hospedado (PIX, Boleto, Cartão); sandbox e prod
 */ let cached = null;
function _overrideGatewayForTest(gw) {
    cached = gw;
}
function getPaymentGateway() {
    if (cached) return cached;
    const provider = (process.env.PAYMENT_GATEWAY ?? "manual").toLowerCase();
    // O adapter manual não valida assinatura de webhook — proibido em produção.
    if ("TURBOPACK compile-time falsy", 0) //TURBOPACK unreachable
    ;
    switch(provider){
        case "manual":
            cached = new __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$manual$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ManualGateway"]();
            break;
        case "asaas":
            cached = new __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$asaas$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AsaasGateway"]();
            break;
        default:
            console.warn(`[payment-gateway] provider "${provider}" desconhecido — usando manual.`);
            cached = new __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$planos$2f$gateway$2f$manual$2d$gateway$2e$ts__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ManualGateway"]();
    }
    return cached;
}
}),
"[project]/features/planos/gateway/manual-gateway.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ManualGateway",
    ()=>ManualGateway
]);
class ManualGateway {
    provider = "manual";
    async createCheckout(input) {
        const ts = Date.now();
        const gwSubId = `manual_sub_${input.userId}_${input.planoId}_${ts}`;
        if (input.pendingMode) {
            // Modo pendente: simula gateway hospedado que redireciona para pagar.
            // O externalReference segue o contrato "xconstrucao|userId|planoId|ciclo"
            // e é embutido na URL para que o chamador o use no webhook de confirmação.
            // A URL usa NEXT_PUBLIC_BASE_URL (ou o fallback sandbox do ASAAS) para
            // que o campo `url` comece com https:// — espelhando o contrato do gateway
            // real — e os testes E2E possam verificar o formato de redirect.
            const extRef = `xconstrucao|${input.userId}|${input.planoId}|${input.ciclo}`;
            const base = process.env.NEXT_PUBLIC_BASE_URL?.replace(/\/$/, "") ?? "https://sandbox.asaas.com";
            const url = `${base}/planos/aguardando` + `?ext=${encodeURIComponent(extRef)}` + `&gwSub=${encodeURIComponent(gwSubId)}`;
            return {
                kind: "redirect",
                url,
                gatewaySubscriptionId: gwSubId
            };
        }
        // Modo direto (padrão): ativa imediatamente, sem cobrança.
        // Sufixo de timestamp garante que o mesmo user+plano pode ser re-assinado
        // após cancelamento sem violar o unique constraint de assinaturaEventos.
        return {
            kind: "activated",
            gatewayCustomerId: `manual_cus_${input.userId}`,
            gatewaySubscriptionId: gwSubId
        };
    }
    async cancelSubscription(_gatewaySubscriptionId) {
    // No-op: não há assinatura remota para cancelar.
    }
    async parseWebhook(rawBody, _headers = {}, _clientIp) {
        let parsed = {};
        try {
            parsed = rawBody ? JSON.parse(rawBody) : {};
        } catch  {
            parsed = {};
        }
        // ── Formato ASAAS (contrato de produção) ────────────────────────────────
        // Payload canônico: { "event": "PAYMENT_RECEIVED", "payment": { ... } }
        // Permite que testes E2E chamem POST /api/webhooks/gateway com o mesmo
        // payload que o ASAAS enviaria em produção.
        const asaasEventMap = {
            PAYMENT_CONFIRMED: "payment_succeeded",
            PAYMENT_RECEIVED: "payment_succeeded",
            PAYMENT_OVERDUE: "payment_failed",
            PAYMENT_DELETED: "payment_failed",
            SUBSCRIPTION_CANCELED: "subscription_canceled",
            SUBSCRIPTION_INACTIVATED: "subscription_canceled",
            SUBSCRIPTION_ACTIVATED: "subscription_activated"
        };
        if (typeof parsed.event === "string" && parsed.event in asaasEventMap) {
            const payment = parsed.payment ?? {};
            const subscription = typeof payment.subscription === "string" ? payment.subscription : undefined;
            const eventId = typeof payment.id === "string" ? `asaas_${payment.id}` : `manual_asaas_${Date.now()}`;
            const extRef = typeof payment.externalReference === "string" ? payment.externalReference : undefined;
            const valor = typeof payment.value === "number" ? payment.value : typeof payment.value === "string" ? Number(payment.value) : undefined;
            return {
                eventId,
                type: asaasEventMap[parsed.event],
                gatewaySubscriptionId: subscription,
                externalReference: extRef,
                valor: valor !== undefined && !Number.isNaN(valor) ? valor : undefined,
                raw: parsed
            };
        }
        // ── Formato interno (compatibilidade com test shortcut e seeds) ──────────
        const eventId = typeof parsed.eventId === "string" ? parsed.eventId : `manual_evt_${Date.now()}`;
        const type = parsed.type ?? "ignored";
        const extRef = typeof parsed.externalReference === "string" ? parsed.externalReference : undefined;
        const valor = typeof parsed.valor === "number" ? parsed.valor : typeof parsed.valor === "string" ? Number(parsed.valor) : undefined;
        return {
            eventId,
            type,
            gatewaySubscriptionId: typeof parsed.gatewaySubscriptionId === "string" ? parsed.gatewaySubscriptionId : undefined,
            gatewayCustomerId: typeof parsed.gatewayCustomerId === "string" ? parsed.gatewayCustomerId : undefined,
            externalReference: extRef,
            valor: valor !== undefined && !Number.isNaN(valor) ? valor : undefined,
            raw: parsed
        };
    }
    async checkPaymentStatus(_gatewaySubscriptionId) {
        // O adapter manual não tem gateway real para consultar. Retorna "unknown" para
        // que o job de downgrade adote o comportamento conservador (expira a assinatura).
        return "unknown";
    }
}
}),
"[project]/shared/lib/asaas-client.ts [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "asaasRequest",
    ()=>asaasRequest,
    "createPaymentWithSplit",
    ()=>createPaymentWithSplit,
    "createSubaccount",
    ()=>createSubaccount,
    "getAsaasEnvironment",
    ()=>getAsaasEnvironment,
    "getBalance",
    ()=>getBalance,
    "getPayment",
    ()=>getPayment,
    "getSubaccount",
    ()=>getSubaccount,
    "isAsaasSandbox",
    ()=>isAsaasSandbox,
    "requestTransfer",
    ()=>requestTransfer
]);
/**
 * Cliente HTTP base para a API do ASAS — server-side ONLY.
 * Nunca importar em componentes 'use client' ou no browser.
 *
 * Docs: https://docs.asaas.com
 */ const BASE_URLS = {
    sandbox: "https://api-sandbox.asaas.com/v3",
    production: "https://api.asaas.com/v3"
};
/**
 * Resolve a base URL a partir de `ASAAS_ENVIRONMENT`.
 *
 * Note que a escolha é INDEPENDENTE de `NODE_ENV`: rodar sandbox no ambiente
 * publicado é um cenário legítimo (clientes testando em produção sem cobrança
 * real). Quem avisa o usuário disso é o banner de `getAsaasEnvironment()`.
 *
 * Um valor fora de `sandbox|production` é erro, não fallback. Antes,
 * `ASAAS_ENVIRONMENT=prod` caía silenciosamente em sandbox — a plataforma
 * pareceria em produção enquanto cobrava em ambiente de testes.
 */ function getBaseUrl() {
    const env = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
    const baseUrl = BASE_URLS[env];
    if (!baseUrl) {
        throw new Error(`[asaas] ASAAS_ENVIRONMENT inválido: "${env}". ` + `Valores aceitos: ${Object.keys(BASE_URLS).join(" | ")} (minúsculas).`);
    }
    return baseUrl;
}
function getAsaasEnvironment() {
    const env = process.env.ASAAS_ENVIRONMENT ?? "sandbox";
    if (env !== "sandbox" && env !== "production") {
        throw new Error(`[asaas] ASAAS_ENVIRONMENT inválido: "${env}". Valores aceitos: sandbox | production.`);
    }
    return env;
}
function isAsaasSandbox() {
    return getAsaasEnvironment() === "sandbox";
}
function getApiKey() {
    const key = process.env.ASAAS_API_KEY;
    if (!key) throw new Error("[asaas] ASAAS_API_KEY não configurado");
    return key;
}
async function asaasRequest(method, path, body, // J43 — operações de subconta (saldo/saque) exigem a apiKey DA SUBCONTA no
// header `access_token`, não a master key. Passe-a aqui para sobrescrever.
// Nunca logar este valor. Ausente → usa a master key (getApiKey()).
apiKeyOverride) {
    const url = `${getBaseUrl()}${path}`;
    const res = await fetch(url, {
        method,
        headers: {
            access_token: apiKeyOverride ?? getApiKey(),
            "Content-Type": "application/json",
            "User-Agent": "XConstrucao/1.0 (Node.js; +https://xconstrucao.com.br)"
        },
        body: body !== undefined ? JSON.stringify(body) : undefined
    });
    if (!res.ok) {
        let message = res.statusText;
        try {
            const err = await res.json();
            if (err.errors?.[0]?.description) message = err.errors[0].description;
        } catch  {
        // ignore parse error, use statusText
        }
        throw new Error(`[asaas] HTTP ${res.status}: ${message}`);
    }
    // 204 No Content
    if (res.status === 204) return undefined;
    return res.json();
}
function createSubaccount(input) {
    return asaasRequest("POST", "/accounts", input);
}
async function getSubaccount(accountIdOrCpfCnpj) {
    const digits = accountIdOrCpfCnpj.replace(/\D/g, "");
    // Heurística: 11 (CPF) ou 14 (CNPJ) dígitos → busca por cpfCnpj; senão, por id.
    if (digits.length === 11 || digits.length === 14) {
        const list = await asaasRequest("GET", `/accounts?cpfCnpj=${encodeURIComponent(digits)}&limit=1`);
        return list.data?.[0] ?? null;
    }
    return asaasRequest("GET", `/accounts/${encodeURIComponent(accountIdOrCpfCnpj)}`);
}
function createPaymentWithSplit(input) {
    return asaasRequest("POST", "/payments", input);
}
function getPayment(id) {
    return asaasRequest("GET", `/payments/${encodeURIComponent(id)}`);
}
function getBalance(apiKeyOverride) {
    return asaasRequest("GET", "/finance/balance", undefined, apiKeyOverride);
}
function requestTransfer(input, apiKeyOverride) {
    return asaasRequest("POST", "/transfers", input, apiKeyOverride);
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__02cn4qx._.js.map