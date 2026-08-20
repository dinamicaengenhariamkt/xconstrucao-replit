(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/instrumentation-client.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "register",
    ()=>register
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = /*#__PURE__*/ __turbopack_context__.i("[project]/node_modules/next/dist/build/polyfills/process.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@sentry/nextjs/build/esm/client/index.js [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sentry$2d$scrub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/sentry-scrub.ts [app-client] (ecmascript)");
globalThis["_sentryRouteManifest"] = "{\"dynamicRoutes\":[{\"path\":\"/admin/clientes/:id\",\"regex\":\"^/admin/clientes/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/admin/clientes/:id/obras\",\"regex\":\"^/admin/clientes/([^/]+)/obras$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/admin/empreiteiras/:id\",\"regex\":\"^/admin/empreiteiras/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/admin/empreiteiras/:id/obras\",\"regex\":\"^/admin/empreiteiras/([^/]+)/obras$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/admin/financeiro/obras/:id\",\"regex\":\"^/admin/financeiro/obras/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/admin/obras/:id\",\"regex\":\"^/admin/obras/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/contratante/minhas-obras/:id\",\"regex\":\"^/contratante/minhas-obras/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/empreiteiro/minhas-obras/:id\",\"regex\":\"^/empreiteiro/minhas-obras/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/empreiteiro/novas-obras/:id\",\"regex\":\"^/empreiteiro/novas-obras/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/empreiteiro/novas-obras/:id/aplicar\",\"regex\":\"^/empreiteiro/novas-obras/([^/]+)/aplicar$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false},{\"path\":\"/xgestao/obras/:id\",\"regex\":\"^/xgestao/obras/([^/]+)$\",\"paramNames\":[\"id\"],\"hasOptionalPrefix\":false}],\"staticRoutes\":[{\"path\":\"/\"},{\"path\":\"/acesso-plataforma\"},{\"path\":\"/admin/anuncios\"},{\"path\":\"/admin/auditoria\"},{\"path\":\"/admin/caixa\"},{\"path\":\"/admin/clientes\"},{\"path\":\"/admin/comunicacao\"},{\"path\":\"/admin/configuracoes\"},{\"path\":\"/admin/contratos\"},{\"path\":\"/admin/disputas\"},{\"path\":\"/admin/empreiteiras\"},{\"path\":\"/admin/entradas\"},{\"path\":\"/admin/faq\"},{\"path\":\"/admin/financeiro\"},{\"path\":\"/admin/legal\"},{\"path\":\"/admin/marketplace-leads\"},{\"path\":\"/admin/obras\"},{\"path\":\"/admin/obras/moderacao\"},{\"path\":\"/admin/obras-destaque\"},{\"path\":\"/admin/planos\"},{\"path\":\"/admin/saidas\"},{\"path\":\"/admin/saude\"},{\"path\":\"/anunciante/configuracoes\"},{\"path\":\"/anunciante/dashboard\"},{\"path\":\"/anunciante/faq\"},{\"path\":\"/anunciante/meus-anuncios\"},{\"path\":\"/anunciante/novo-pedido\"},{\"path\":\"/auth/oauth-success\"},{\"path\":\"/cadastro\"},{\"path\":\"/contratante/atividades\"},{\"path\":\"/contratante/chat\"},{\"path\":\"/contratante/configuracoes\"},{\"path\":\"/contratante/dashboard\"},{\"path\":\"/contratante/faq\"},{\"path\":\"/contratante/medicoes\"},{\"path\":\"/contratante/meus-anuncios\"},{\"path\":\"/contratante/minhas-obras\"},{\"path\":\"/contratante/notificacoes\"},{\"path\":\"/contratante/nova-obra\"},{\"path\":\"/contratante/pagamentos\"},{\"path\":\"/contratante/planos\"},{\"path\":\"/definir-senha-inicial\"},{\"path\":\"/empreiteiro/chat\"},{\"path\":\"/empreiteiro/configuracoes\"},{\"path\":\"/empreiteiro/dashboard\"},{\"path\":\"/empreiteiro/dashboard/atividades-recentes\"},{\"path\":\"/empreiteiro/faq\"},{\"path\":\"/empreiteiro/meus-anuncios\"},{\"path\":\"/empreiteiro/minhas-candidaturas\"},{\"path\":\"/empreiteiro/minhas-obras\"},{\"path\":\"/empreiteiro/notificacoes\"},{\"path\":\"/empreiteiro/novas-obras\"},{\"path\":\"/empreiteiro/obras-salvas\"},{\"path\":\"/empreiteiro/pagamentos\"},{\"path\":\"/empreiteiro/planos\"},{\"path\":\"/empreiteiro/saldo\"},{\"path\":\"/login\"},{\"path\":\"/manutencao\"},{\"path\":\"/onboarding\"},{\"path\":\"/planos\"},{\"path\":\"/planos/sucesso\"},{\"path\":\"/politica-privacidade\"},{\"path\":\"/recuperar-senha\"},{\"path\":\"/reset-senha\"},{\"path\":\"/termos\"},{\"path\":\"/trocar-senha-obrigatoria\"},{\"path\":\"/verificar-email\"},{\"path\":\"/xgestao\"},{\"path\":\"/xgestao/configuracoes\"},{\"path\":\"/xgestao/dashboard\"},{\"path\":\"/xgestao/obras\"},{\"path\":\"/xgestao/planos\"},{\"path\":\"/xgestao-inteligente\"}],\"isrRoutes\":[]}";
globalThis["_sentryNextJsVersion"] = "16.3.0";
;
;
const dsn = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$build$2f$polyfills$2f$process$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"].env.NEXT_PUBLIC_SENTRY_DSN;
async function register() {
    if (dsn) {
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$sentry$2f$nextjs$2f$build$2f$esm$2f$client$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["init"]({
            dsn,
            tracesSampleRate: 0.1,
            replaysSessionSampleRate: 0,
            replaysOnErrorSampleRate: 0,
            environment: ("TURBOPACK compile-time value", "development") ?? "development",
            beforeSend (event) {
                return (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$sentry$2d$scrub$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["scrubEvent"])(event);
            }
        });
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/lib/sentry-scrub.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "scrubEvent",
    ()=>scrubEvent
]);
/**
 * Scrubbing de PII para eventos Sentry.
 * Remove CPF, e-mail, senhas, tokens e cookies antes do envio.
 */ const CPF_FORMATTED = /\b\d{3}\.\d{3}\.\d{3}-\d{2}\b/g;
const CPF_RAW = /(?<![0-9])\d{11}(?![0-9])/g;
const EMAIL = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g;
const SENSITIVE_KEYS = /(password|senha|token|secret|authorization|cookie|cpf|cnpj|api[_-]?key)/i;
function scrubString(value) {
    return value.replace(CPF_FORMATTED, "[CPF]").replace(CPF_RAW, "[CPF_RAW]").replace(EMAIL, "[EMAIL]");
}
function scrubValue(value, key) {
    if (key && SENSITIVE_KEYS.test(key)) return "[REDACTED]";
    if (typeof value === "string") return scrubString(value);
    if (Array.isArray(value)) return value.map((v)=>scrubValue(v));
    if (value !== null && typeof value === "object") return scrubObject(value);
    return value;
}
function scrubObject(obj) {
    const result = {};
    for (const [k, v] of Object.entries(obj)){
        result[k] = scrubValue(v, k);
    }
    return result;
}
function scrubEvent(event) {
    if (!event || typeof event !== "object") return event;
    try {
        return scrubObject(event);
    } catch  {
        return null;
    }
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_09et0kt._.js.map