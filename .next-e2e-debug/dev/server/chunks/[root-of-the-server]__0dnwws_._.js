module.exports = [
"[externals]/next/dist/compiled/next-server/app-page-turbo.runtime.dev.js [external] (next/dist/compiled/next-server/app-page-turbo.runtime.dev.js, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js", () => require("next/dist/compiled/next-server/app-page-turbo.runtime.dev.js"));

module.exports = mod;
}),
"[externals]/node:stream [external] (node:stream, cjs)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("node:stream", () => require("node:stream"));

module.exports = mod;
}),
"[project]/features/auth/api/audit.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "recordAudit",
    ()=>recordAudit
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/db.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/schema.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2f$rate$2d$limit$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/api/rate-limit.ts [instrumentation] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
async function recordAudit(input) {
    try {
        const ip = input.request ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2f$rate$2d$limit$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["getClientIp"])(input.request) : null;
        const userAgent = input.request?.headers.get("user-agent") ?? null;
        await __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["db"].insert(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["auditLogs"]).values({
            actorId: input.actorId,
            action: input.action,
            targetUserId: input.targetUserId ?? null,
            payload: input.payload ?? {},
            ip,
            userAgent
        });
    } catch (err) {
        console.error("[audit] falha ao gravar log:", err);
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/features/auth/api/rate-limit.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getClientIp",
    ()=>getClientIp,
    "isRateLimited",
    ()=>isRateLimited
]);
const store = new Map();
function isRateLimited(key, max, windowMs) {
    // Bypass total quando em modo de teste E2E — evita falsos positivos quando
    // a suíte registra/loga várias vezes do mesmo IP (127.0.0.1).
    if (process.env.EMAIL_TEST_MODE === "1") return false;
    const now = Date.now();
    const entry = store.get(key);
    if (!entry || now > entry.resetAt) {
        store.set(key, {
            count: 1,
            resetAt: now + windowMs
        });
        return false;
    }
    entry.count += 1;
    return entry.count > max;
}
function getClientIp(request) {
    const headers = new Headers(request.headers);
    const trustProxy = process.env.TRUST_PROXY_HEADERS === '1';
    if (trustProxy) {
        return headers.get('x-forwarded-for')?.split(',')[0]?.trim() ?? headers.get('x-real-ip') ?? 'unknown';
    }
    return headers.get('x-real-ip') ?? 'unknown';
}
}),
"[project]/features/auth/emails/password-reset.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PasswordResetEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function PasswordResetEmail({ resetUrl, userName = 'Usuário' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/auth/emails/password-reset.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "Recuperação de Senha"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 28,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                userName,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Você solicitou a recuperação de senha da sua conta ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "XConstrução"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/password-reset.tsx",
                                    lineNumber: 35,
                                    columnNumber: 64
                                }, this),
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Clique no botão abaixo para redefinir sua senha:"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: resetUrl,
                                children: "Redefinir Senha"
                            }, void 0, false, {
                                fileName: "[project]/features/auth/emails/password-reset.tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Ou copie e cole este link no seu navegador:"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: link,
                            children: resetUrl
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 52,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Importante:"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/password-reset.tsx",
                                    lineNumber: 59,
                                    columnNumber: 13
                                }, this),
                                " Este link expira em 15 minutos por questões de segurança."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: "Se você não solicitou esta recuperação de senha, ignore este email. Sua senha permanecerá inalterada."
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: [
                                "© ",
                                new Date().getFullYear(),
                                " XConstrução. Todos os direitos reservados."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-reset.tsx",
                            lineNumber: 67,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/auth/emails/password-reset.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/auth/emails/password-reset.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/auth/emails/password-reset.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
// Estilos inline (necessário para compatibilidade com clientes de email)
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    marginTop: '40px',
    marginBottom: '40px',
    borderRadius: '8px',
    maxWidth: '600px'
};
const h1 = {
    color: '#1e293b',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 24px',
    padding: '0',
    textAlign: 'center'
};
const text = {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '32px 0'
};
const button = {
    backgroundColor: '#3b82f6',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '14px 32px'
};
const link = {
    color: '#3b82f6',
    fontSize: '14px',
    textDecoration: 'underline',
    wordBreak: 'break-all',
    marginBottom: '24px'
};
const hr = {
    borderColor: '#e2e8f0',
    margin: '32px 0'
};
const footer = {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 12px'
};
}),
"[project]/features/auth/emails/password-setup.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PasswordSetupEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function PasswordSetupEmail({ setupUrl, userName = 'Usuário', invitedByName, roleLabel = 'usuário' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/auth/emails/password-setup.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "Bem-vindo à XConstrução"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                userName,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 33,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                invitedByName ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["Fragment"], {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: invitedByName
                                        }, void 0, false, {
                                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                                            lineNumber: 35,
                                            columnNumber: 32
                                        }, this),
                                        " criou "
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/auth/emails/password-setup.tsx",
                                    lineNumber: 35,
                                    columnNumber: 30
                                }, this) : 'Foi criada ',
                                "uma conta de ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: roleLabel
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/password-setup.tsx",
                                    lineNumber: 36,
                                    columnNumber: 26
                                }, this),
                                " para você na plataforma ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "XConstrução"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/password-setup.tsx",
                                    lineNumber: 36,
                                    columnNumber: 79
                                }, this),
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Para definir sua primeira senha e ativar o acesso, clique no botão abaixo:"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: setupUrl,
                                children: "Definir minha senha"
                            }, void 0, false, {
                                fileName: "[project]/features/auth/emails/password-setup.tsx",
                                lineNumber: 42,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Ou copie e cole este link no seu navegador:"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 44,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: link,
                            children: setupUrl
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 46,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "Importante:"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/password-setup.tsx",
                                    lineNumber: 48,
                                    columnNumber: 13
                                }, this),
                                " Este link expira em 24 horas. Se você não esperava receber este e-mail, ignore — nenhuma ação é necessária."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: [
                                "© ",
                                new Date().getFullYear(),
                                " XConstrução. Todos os direitos reservados."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/password-setup.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/auth/emails/password-setup.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/auth/emails/password-setup.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/auth/emails/password-setup.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    marginTop: '40px',
    marginBottom: '40px',
    borderRadius: '8px',
    maxWidth: '600px'
};
const h1 = {
    color: '#1e293b',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 24px',
    padding: '0',
    textAlign: 'center'
};
const text = {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '32px 0'
};
const button = {
    backgroundColor: '#333333',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '14px 32px'
};
const link = {
    color: '#333333',
    fontSize: '14px',
    textDecoration: 'underline',
    wordBreak: 'break-all',
    marginBottom: '24px'
};
const hr = {
    borderColor: '#e2e8f0',
    margin: '32px 0'
};
const footer = {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 12px'
};
}),
"[project]/features/auth/emails/verification.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>VerificationEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function VerificationEmail({ userName = 'Usuário', verificationUrl = 'http://localhost:3000/api/auth/verify-email?token=xxx' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/auth/emails/verification.tsx",
                lineNumber: 25,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "Confirme seu Email"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 28,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                userName,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 30,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Obrigado por se cadastrar na ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "XConstrução"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/verification.tsx",
                                    lineNumber: 33,
                                    columnNumber: 42
                                }, this),
                                "! Para começar a usar sua conta, por favor confirme seu endereço de email."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: verificationUrl,
                                children: "Verificar Email"
                            }, void 0, false, {
                                fileName: "[project]/features/auth/emails/verification.tsx",
                                lineNumber: 38,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 37,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Ou copie e cole este link no seu navegador:"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: linkText,
                            children: verificationUrl
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 46,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: "Este link é válido por 24 horas. Se você não criou esta conta, pode ignorar este email."
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: [
                                "© ",
                                new Date().getFullYear(),
                                " XConstrução. Todos os direitos reservados."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/verification.tsx",
                            lineNumber: 55,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/auth/emails/verification.tsx",
                    lineNumber: 27,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/auth/emails/verification.tsx",
                lineNumber: 26,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/auth/emails/verification.tsx",
        lineNumber: 24,
        columnNumber: 5
    }, this);
}
// Estilos inline (necessário para compatibilidade com clientes de email)
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    marginTop: '40px',
    marginBottom: '40px',
    borderRadius: '8px',
    maxWidth: '600px'
};
const h1 = {
    color: '#1e293b',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 24px',
    padding: '0',
    textAlign: 'center'
};
const text = {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px'
};
const linkText = {
    color: '#64748b',
    fontSize: '14px',
    lineHeight: '20px',
    wordBreak: 'break-all',
    margin: '0 0 16px'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '32px 0'
};
const button = {
    backgroundColor: '#3b82f6',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '14px 32px'
};
const hr = {
    borderColor: '#e2e8f0',
    margin: '32px 0'
};
const footer = {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 12px'
};
}),
"[project]/features/auth/emails/welcome.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WelcomeEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function WelcomeEmail({ userName = 'Usuário', userRole = 'contratante', dashboardUrl }) {
    // dashboardUrl is resolved server-side by the caller (from NEXTAUTH_URL),
    // so it works correctly at runtime in production — unlike NEXT_PUBLIC_BASE_URL
    // which is baked in at build time and may be empty if not set during `next build`.
    const resolvedDashboardUrl = dashboardUrl ?? (process.env.NEXTAUTH_URL ?? '') + '/dashboard';
    const roleText = userRole === 'empreiteiro' ? 'Empreiteiro' : 'Contratante';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/auth/emails/welcome.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "Bem-vindo à XConstrução!"
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                userName,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Sua conta foi criada com sucesso! Estamos muito felizes em tê-lo(a) conosco na ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: "XConstrução"
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/welcome.tsx",
                                    lineNumber: 44,
                                    columnNumber: 24
                                }, this),
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Você se cadastrou como: ",
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: roleText
                                }, void 0, false, {
                                    fileName: "[project]/features/auth/emails/welcome.tsx",
                                    lineNumber: 48,
                                    columnNumber: 37
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: resolvedDashboardUrl,
                                children: "Acessar Minha Conta"
                            }, void 0, false, {
                                fileName: "[project]/features/auth/emails/welcome.tsx",
                                lineNumber: 52,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Com a XConstrução você pode gerenciar suas obras de forma inteligente, controlar finanças, acompanhar o progresso e muito mais."
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 57,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 62,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: "Se você não criou esta conta, por favor ignore este email ou entre em contato com nosso suporte."
                        }, void 0, false, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 64,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: [
                                "© ",
                                new Date().getFullYear(),
                                " XConstrução. Todos os direitos reservados."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/auth/emails/welcome.tsx",
                            lineNumber: 69,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/auth/emails/welcome.tsx",
                    lineNumber: 35,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/auth/emails/welcome.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/auth/emails/welcome.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
// Estilos inline (necessário para compatibilidade com clientes de email)
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '40px 20px',
    marginTop: '40px',
    marginBottom: '40px',
    borderRadius: '8px',
    maxWidth: '600px'
};
const h1 = {
    color: '#1e293b',
    fontSize: '28px',
    fontWeight: 'bold',
    margin: '0 0 24px',
    padding: '0',
    textAlign: 'center'
};
const text = {
    color: '#475569',
    fontSize: '16px',
    lineHeight: '24px',
    margin: '0 0 16px'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '32px 0'
};
const button = {
    backgroundColor: '#3b82f6',
    borderRadius: '6px',
    color: '#ffffff',
    fontSize: '16px',
    fontWeight: 'bold',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '14px 32px'
};
const hr = {
    borderColor: '#e2e8f0',
    margin: '32px 0'
};
const footer = {
    color: '#94a3b8',
    fontSize: '14px',
    lineHeight: '20px',
    margin: '0 0 12px'
};
}),
"[project]/features/notificacoes/candidatura-dispatcher.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "dispararNotificacaoCandidaturaDecidida",
    ()=>dispararNotificacaoCandidaturaDecidida,
    "dispatchPendingCandidaturaNotifications",
    ()=>dispatchPendingCandidaturaNotifications
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/db.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/schema.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/email.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2f$audit$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/api/audit.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$preferences$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/notificacoes/preferences.ts [instrumentation] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2f$audit$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$preferences$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2f$audit$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$preferences$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
function formatarValorBRL(valor) {
    const num = Number(valor);
    return new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL"
    }).format(Number.isFinite(num) ? num : 0);
}
async function dispararNotificacaoCandidaturaDecidida(args) {
    const { candidaturaId, request = null, source = "api", silencioso = false } = args;
    // 1) Stage: validações & tx (lock + insert + flip flag).
    let staged;
    try {
        staged = await __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["db"].transaction(async (tx)=>{
            // Advisory lock keyed na UUID (hashtext determinístico no PG).
            const lockRows = await tx.execute(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`SELECT pg_try_advisory_xact_lock(hashtext(${candidaturaId})) AS got`);
            const got = (lockRows?.rows?.[0] ?? lockRows?.[0])?.got;
            if (got !== true) {
                return {
                    kind: "locked"
                };
            }
            // Re-leitura sob lock — confiável.
            const [cand] = await tx.select().from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"].id, candidaturaId));
            if (!cand) return {
                kind: "not_found"
            };
            if (cand.notificacaoDisparada) return {
                kind: "skipped"
            };
            if (!cand.decididaEm || cand.status === "pendente") {
                return {
                    kind: "no_decision"
                };
            }
            if (!cand.empreiteiroId) return {
                kind: "no_user"
            };
            const silentMode = silencioso || cand.canceladaPeloEmpreiteiro;
            if (silentMode) {
                // Cancel pelo próprio empreiteiro: só flipa a flag pra remover do
                // fallback. Sem insert de notif, sem email.
                await tx.update(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"]).set({
                    notificacaoDisparada: true
                }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"].id, candidaturaId));
                return {
                    kind: "silent"
                };
            }
            // Carrega obra + empreiteiro (dentro da tx, sem custo extra).
            const [obra] = cand.obraId ? await tx.select({
                id: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["obras"].id,
                nome: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["obras"].nome
            }).from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["obras"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["obras"].id, cand.obraId)) : [
                undefined
            ];
            const [empreiteiro] = await tx.select({
                id: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["users"].id,
                name: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["users"].name,
                email: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["users"].email
            }).from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["users"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["users"].id, cand.empreiteiroId));
            if (!empreiteiro) return {
                kind: "no_user"
            };
            const resultado = cand.status === "aceita" ? "aceita" : "rejeitada";
            const obraNome = obra?.nome ?? "sua obra";
            const valorFormatado = formatarValorBRL(cand.valorProposta);
            const href = obra ? resultado === "aceita" ? `/empreiteiro/minhas-obras/${obra.id}` : `/empreiteiro/minhas-candidaturas` : `/empreiteiro/minhas-candidaturas`;
            const titulo = resultado === "aceita" ? "Sua proposta foi aceita!" : "Sua proposta não foi selecionada";
            const descricao = resultado === "aceita" ? `O contratante aceitou sua proposta de ${valorFormatado} para a obra ${obraNome}.` : `O contratante seguiu com outra proposta para a obra ${obraNome}.`;
            // INSERT in-app notif + UPDATE flag são atômicos na mesma tx.
            // Rollback se qualquer um falhar — fallback retoma na próxima rodada.
            const [notif] = await tx.insert(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["notificacoes"]).values({
                userId: empreiteiro.id,
                tipo: resultado === "aceita" ? "sucesso" : "info",
                titulo,
                descricao,
                href
            }).returning({
                id: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["notificacoes"].id
            });
            await tx.update(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"]).set({
                notificacaoDisparada: true
            }).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"].id, candidaturaId));
            return {
                kind: "sent",
                empreiteiroEmail: empreiteiro.email ?? null,
                empreiteiroNome: empreiteiro.name ?? "Empreiteiro",
                empreiteiroId: empreiteiro.id,
                obraId: cand.obraId ?? null,
                obraNome,
                resultado,
                valorFormatado,
                href,
                motivoRejeicao: cand.motivoRejeicao ?? null,
                mensagemContratante: cand.mensagemContratante ?? null,
                notifId: notif?.id ?? null
            };
        });
    } catch (err) {
        console.error("[candidatura-dispatcher] tx falhou:", err);
        // Tx rollback ⇒ flag continua false ⇒ fallback retoma.
        return {
            status: "failed"
        };
    }
    if (staged.kind !== "sent" || !("empreiteiroEmail" in staged)) {
        return {
            status: staged.kind
        };
    }
    // 2) Pós-commit: e-mail best-effort, respeitando preferência do empreiteiro
    // (J02 §4). In-app já foi criada acima — opt-out vale só pro email.
    // O email vai pro EMPREITEIRO; gateamos por `email_contrato` (chave que ele
    // controla no settings — a decisão da proposta é o vínculo contratual), e não
    // por `email_novaProposta`, que é uma chave da persona contratante.
    let emailSent = false;
    const emailPermitido = staged.empreiteiroEmail ? await (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$preferences$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["emailPreferenceEnabled"])(staged.empreiteiroId, "email_contrato") : false;
    if (staged.empreiteiroEmail && emailPermitido) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
        const link = baseUrl ? `${baseUrl}${staged.href}` : staged.href;
        try {
            await (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$email$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["sendCandidaturaDecididaEmail"])(staged.empreiteiroEmail, {
                empreiteiroNome: staged.empreiteiroNome,
                obraNome: staged.obraNome,
                resultado: staged.resultado,
                valorFormatado: staged.valorFormatado,
                motivoRejeicao: staged.motivoRejeicao,
                mensagemContratante: staged.mensagemContratante,
                link
            });
            emailSent = true;
        } catch (err) {
            console.error("[candidatura-dispatcher] falha ao enviar email:", err);
        }
    }
    void (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$api$2f$audit$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["recordAudit"])({
        actorId: staged.empreiteiroId,
        action: "candidaturas.notificar",
        targetUserId: staged.empreiteiroId,
        payload: {
            candidaturaId,
            obraId: staged.obraId,
            resultado: staged.resultado,
            emailSent,
            notifId: staged.notifId,
            source
        },
        request: request ?? undefined
    });
    return {
        status: "sent",
        emailSent,
        notifCreated: !!staged.notifId
    };
}
async function dispatchPendingCandidaturaNotifications(opts) {
    const limit = Math.max(1, Math.min(opts?.limit ?? 200, 1000));
    const pendentes = await __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["db"].select({
        id: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"].id,
        canceladaPeloEmpreiteiro: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"].canceladaPeloEmpreiteiro
    }).from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["and"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"].notificacaoDisparada, false), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["isNotNull"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["candidaturas"].decididaEm))).limit(limit);
    let sent = 0;
    let silent = 0;
    let failed = 0;
    let skipped = 0;
    for (const row of pendentes){
        try {
            const r = await dispararNotificacaoCandidaturaDecidida({
                candidaturaId: row.id,
                source: "cron",
                silencioso: row.canceladaPeloEmpreiteiro === true
            });
            if (r.status === "sent") sent++;
            else if (r.status === "silent") silent++;
            else if (r.status === "skipped" || r.status === "locked") skipped++;
            else failed++;
        } catch  {
            failed++;
        }
    }
    return {
        checked: pendentes.length,
        sent,
        silent,
        skipped,
        failed
    };
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/features/notificacoes/emails/aviso-expiracao.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>AvisoExpiracaoEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function AvisoExpiracaoEmail({ userName = 'Usuário', planoNome = 'Plano', diasRestantes = 3, expiracaoFormatada = '', link = '#' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                lineNumber: 31,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "Seu acesso expira em breve"
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                userName,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Identificamos uma pendência de pagamento na sua assinatura",
                                ' ',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: planoNome
                                }, void 0, false, {
                                    fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                                    lineNumber: 40,
                                    columnNumber: 13
                                }, this),
                                ". Se o pagamento não for regularizado, seu acesso será encerrado em",
                                ' ',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: diasRestantes === 1 ? '1 dia' : `${diasRestantes} dias`
                                }, void 0, false, {
                                    fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                                    lineNumber: 42,
                                    columnNumber: 13
                                }, this),
                                expiracaoFormatada ? ` (${expiracaoFormatada})` : '',
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: alertBox,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                style: alertText,
                                children: [
                                    "⚠️ Após o vencimento você perderá acesso às funcionalidades do plano ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: planoNome
                                    }, void 0, false, {
                                        fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                                        lineNumber: 53,
                                        columnNumber: 21
                                    }, this),
                                    " e será migrado para o plano gratuito."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                                lineNumber: 51,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Para manter seu acesso, regularize o pagamento pelo seu painel de assinaturas."
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 58,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: link,
                                children: "Regularizar pagamento"
                            }, void 0, false, {
                                fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                                lineNumber: 64,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 69,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: "Você recebeu este aviso porque possui uma assinatura com pagamento em aberto na XConstrução. Em caso de dúvidas, entre em contato com nosso suporte."
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                    lineNumber: 33,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/notificacoes/emails/aviso-expiracao.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '32px 24px',
    maxWidth: '560px',
    borderRadius: '12px'
};
const h1 = {
    color: '#333333',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 16px'
};
const text = {
    color: '#444444',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 12px'
};
const alertBox = {
    backgroundColor: '#fff8e1',
    border: '1px solid #ffe082',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0'
};
const alertText = {
    color: '#795548',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '24px 0'
};
const button = {
    backgroundColor: '#333333',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 24px'
};
const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0'
};
const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px'
};
}),
"[project]/features/notificacoes/emails/candidatura-decidida.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>CandidaturaDecididaEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function CandidaturaDecididaEmail({ empreiteiroNome = 'Empreiteiro', obraNome = 'a obra', resultado = 'aceita', valorFormatado = 'R$ 0,00', motivoRejeicao = null, mensagemContratante = null, link = '#' }) {
    const aceita = resultado === 'aceita';
    const titulo = aceita ? 'Sua proposta foi aceita!' : 'Sua proposta não foi selecionada';
    const introducao = aceita ? `Boas notícias! O contratante aceitou sua proposta para a obra ${obraNome}.` : `O contratante decidiu seguir com outra proposta para a obra ${obraNome}.`;
    const ctaLabel = aceita ? 'Acessar a obra' : 'Ver candidatura';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: titulo
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                empreiteiroNome,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                            lineNumber: 47,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: introducao
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: infoBox,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Obra:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                            lineNumber: 52,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        obraNome
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                    lineNumber: 51,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Valor proposto:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                            lineNumber: 55,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        valorFormatado
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                    lineNumber: 54,
                                    columnNumber: 13
                                }, this),
                                aceita && mensagemContratante ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Mensagem do contratante:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                            lineNumber: 59,
                                            columnNumber: 17
                                        }, this),
                                        " ",
                                        mensagemContratante
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                    lineNumber: 58,
                                    columnNumber: 15
                                }, this) : null,
                                !aceita && motivoRejeicao ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Motivo:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                            lineNumber: 64,
                                            columnNumber: 17
                                        }, this),
                                        " ",
                                        motivoRejeicao
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                    lineNumber: 63,
                                    columnNumber: 15
                                }, this) : null
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: link,
                                children: ctaLabel
                            }, void 0, false, {
                                fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                                lineNumber: 70,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                            lineNumber: 69,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                            lineNumber: 75,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: "Você recebeu este email porque enviou uma proposta para esta obra na XConstrução."
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                            lineNumber: 77,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                    lineNumber: 44,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
                lineNumber: 43,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/notificacoes/emails/candidatura-decidida.tsx",
        lineNumber: 41,
        columnNumber: 5
    }, this);
}
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '32px 24px',
    maxWidth: '560px',
    borderRadius: '12px'
};
const h1 = {
    color: '#333333',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 16px'
};
const text = {
    color: '#444444',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 12px'
};
const infoBox = {
    backgroundColor: '#f6f9fc',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0'
};
const infoLine = {
    color: '#333333',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '4px 0'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '24px 0'
};
const button = {
    backgroundColor: '#333333',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 24px'
};
const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0'
};
const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px'
};
}),
"[project]/features/notificacoes/emails/nova-obra-zona.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NovaObraZonaEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function NovaObraZonaEmail({ empreiteiroNome = 'Empreiteiro', obraNome = 'uma nova obra', cidade = null, uf = null, valorFormatado = null, link = '#' }) {
    const local = cidade && uf ? `${cidade} - ${uf}` : cidade || uf || 'sua região';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "Nova obra na sua zona de atuação"
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                            lineNumber: 39,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                empreiteiroNome,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                            lineNumber: 41,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: "Uma nova obra acaba de ser publicada no marketplace e bate com a sua zona de atuação. Dê uma olhada antes que outro empreiteiro se candidate."
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                            lineNumber: 43,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: infoBox,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Obra:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                                            lineNumber: 51,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        obraNome
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                                    lineNumber: 50,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Local:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                                            lineNumber: 54,
                                            columnNumber: 15
                                        }, this),
                                        " ",
                                        local
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                                    lineNumber: 53,
                                    columnNumber: 13
                                }, this),
                                valorFormatado ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Valor estimado:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                                            lineNumber: 58,
                                            columnNumber: 17
                                        }, this),
                                        " ",
                                        valorFormatado
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                                    lineNumber: 57,
                                    columnNumber: 15
                                }, this) : null
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                            lineNumber: 49,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: link,
                                children: "Ver detalhes da obra"
                            }, void 0, false, {
                                fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                                lineNumber: 64,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                            lineNumber: 63,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                            lineNumber: 69,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: 'Você recebeu este email porque a UF ou a cidade desta obra estão na sua zona de atuação na XConstrução. Você pode desativar este aviso em Configurações → Notificações → "Novas obras".'
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                            lineNumber: 71,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/notificacoes/emails/nova-obra-zona.tsx",
        lineNumber: 35,
        columnNumber: 5
    }, this);
}
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '32px 24px',
    maxWidth: '560px',
    borderRadius: '12px'
};
const h1 = {
    color: '#333333',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 16px'
};
const text = {
    color: '#444444',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 12px'
};
const infoBox = {
    backgroundColor: '#f6f9fc',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0'
};
const infoLine = {
    color: '#333333',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '4px 0'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '24px 0'
};
const button = {
    backgroundColor: '#333333',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 24px'
};
const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0'
};
const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px'
};
}),
"[project]/features/notificacoes/emails/pagamento-recebido.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>PagamentoRecebidoEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function PagamentoRecebidoEmail({ empreiteiroNome = 'Empreiteiro', obraNome = 'sua obra', valorFormatado = 'R$ 0,00', metodoPagamento = '-', dataPagamento = '-', link = '#' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                lineNumber: 33,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "Pagamento recebido"
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                empreiteiroNome,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "O contratante quitou um pagamento referente à obra",
                                ' ',
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                    children: obraNome
                                }, void 0, false, {
                                    fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                    lineNumber: 42,
                                    columnNumber: 13
                                }, this),
                                "."
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                            lineNumber: 40,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: infoBox,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Valor:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                            lineNumber: 46,
                                            columnNumber: 36
                                        }, this),
                                        " ",
                                        valorFormatado
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                    lineNumber: 46,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Método:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                            lineNumber: 47,
                                            columnNumber: 36
                                        }, this),
                                        " ",
                                        metodoPagamento
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                    lineNumber: 47,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: infoLine,
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                            children: "Data:"
                                        }, void 0, false, {
                                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                            lineNumber: 48,
                                            columnNumber: 36
                                        }, this),
                                        " ",
                                        dataPagamento
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                    lineNumber: 48,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                            lineNumber: 45,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: link,
                                children: "Ver detalhes do pagamento"
                            }, void 0, false, {
                                fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                                lineNumber: 52,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                            lineNumber: 51,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                            lineNumber: 57,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: "Você recebeu este email porque é o empreiteiro responsável pela obra associada a este pagamento na XConstrução."
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                            lineNumber: 59,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                    lineNumber: 35,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
                lineNumber: 34,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/notificacoes/emails/pagamento-recebido.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '32px 24px',
    maxWidth: '560px',
    borderRadius: '12px'
};
const h1 = {
    color: '#333333',
    fontSize: '24px',
    fontWeight: '700',
    margin: '0 0 16px'
};
const text = {
    color: '#444444',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 12px'
};
const infoBox = {
    backgroundColor: '#f6f9fc',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0'
};
const infoLine = {
    color: '#333333',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '4px 0'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '24px 0'
};
const button = {
    backgroundColor: '#333333',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 24px'
};
const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0'
};
const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px'
};
}),
"[project]/features/notificacoes/emails/webhook-dead.tsx [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>WebhookDeadAlertEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-dev-runtime.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/html/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/head/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/body/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/container/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/heading/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/text/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/button/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/hr/dist/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/section/dist/index.mjs [instrumentation] (ecmascript)");
;
;
function WebhookDeadAlertEmail({ adminName = 'Administrador', count = 1, events = [], dashboardUrl = '#' }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$html$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Html"], {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$head$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Head"], {}, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                lineNumber: 29,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$body$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Body"], {
                style: main,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$container$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Container"], {
                    style: container,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$heading$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Heading"], {
                            style: h1,
                            children: "⚠️ Webhooks de pagamento não processados"
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 32,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: [
                                "Olá ",
                                adminName,
                                ","
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 34,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: text,
                            children: count === 1 ? 'Um evento de webhook de pagamento esgotou todas as tentativas de reprocessamento e não pôde ser processado.' : `${count} eventos de webhook de pagamento esgotaram todas as tentativas de reprocessamento e não puderam ser processados.`
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 36,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: alertBox,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                style: alertText,
                                children: [
                                    "⚠️ Esses eventos foram marcados como ",
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                        children: "dead-letter"
                                    }, void 0, false, {
                                        fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                        lineNumber: 44,
                                        columnNumber: 52
                                    }, this),
                                    " e não serão retentados automaticamente. É necessário revisão manual para garantir que nenhum pagamento foi perdido."
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                lineNumber: 43,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 42,
                            columnNumber: 11
                        }, this),
                        events.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: tableSection,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                    style: tableHeader,
                                    children: "Eventos afetados:"
                                }, void 0, false, {
                                    fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                    lineNumber: 51,
                                    columnNumber: 15
                                }, this),
                                events.map((evt)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                                        style: eventRow,
                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                                            style: eventText,
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Tipo:"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                                    lineNumber: 55,
                                                    columnNumber: 21
                                                }, this),
                                                " ",
                                                evt.eventType,
                                                '  ·  ',
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "ID Gateway:"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                                    lineNumber: 57,
                                                    columnNumber: 21
                                                }, this),
                                                " ",
                                                evt.gatewayEventId,
                                                '  ·  ',
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                    children: "Tentativas:"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                                    lineNumber: 59,
                                                    columnNumber: 21
                                                }, this),
                                                " ",
                                                evt.retryCount
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                            lineNumber: 54,
                                            columnNumber: 19
                                        }, this)
                                    }, evt.id, false, {
                                        fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                        lineNumber: 53,
                                        columnNumber: 17
                                    }, this))
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 50,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$section$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Section"], {
                            style: buttonContainer,
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$button$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Button"], {
                                style: button,
                                href: dashboardUrl,
                                children: "Ver painel de saúde"
                            }, void 0, false, {
                                fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                                lineNumber: 67,
                                columnNumber: 13
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 66,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$hr$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Hr"], {
                            style: hr
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 72,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$text$2f$dist$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["Text"], {
                            style: footer,
                            children: "Você recebeu este alerta porque é administrador da XConstrução. Acesse o painel de saúde da plataforma para investigar e, se necessário, reprocessar os eventos manualmente."
                        }, void 0, false, {
                            fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                            lineNumber: 74,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                    lineNumber: 31,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
                lineNumber: 30,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/notificacoes/emails/webhook-dead.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
const main = {
    backgroundColor: '#f6f9fc',
    fontFamily: 'Manrope, -apple-system, BlinkMacSystemFont, sans-serif'
};
const container = {
    backgroundColor: '#ffffff',
    margin: '0 auto',
    padding: '32px 24px',
    maxWidth: '560px',
    borderRadius: '12px'
};
const h1 = {
    color: '#333333',
    fontSize: '22px',
    fontWeight: '700',
    margin: '0 0 16px'
};
const text = {
    color: '#444444',
    fontSize: '15px',
    lineHeight: '24px',
    margin: '0 0 12px'
};
const alertBox = {
    backgroundColor: '#fff3e0',
    border: '1px solid #ffcc80',
    borderRadius: '8px',
    padding: '16px',
    margin: '16px 0'
};
const alertText = {
    color: '#e65100',
    fontSize: '14px',
    lineHeight: '22px',
    margin: '0'
};
const tableSection = {
    margin: '16px 0'
};
const tableHeader = {
    color: '#333333',
    fontSize: '14px',
    fontWeight: '700',
    margin: '0 0 8px'
};
const eventRow = {
    backgroundColor: '#f8f9fa',
    borderRadius: '6px',
    padding: '10px 12px',
    marginBottom: '6px'
};
const eventText = {
    color: '#555555',
    fontSize: '13px',
    lineHeight: '20px',
    margin: '0'
};
const buttonContainer = {
    textAlign: 'center',
    margin: '24px 0'
};
const button = {
    backgroundColor: '#c62828',
    borderRadius: '8px',
    color: '#ffffff',
    fontSize: '15px',
    fontWeight: '700',
    textDecoration: 'none',
    textAlign: 'center',
    display: 'inline-block',
    padding: '12px 24px'
};
const hr = {
    borderColor: '#e6ebf1',
    margin: '24px 0'
};
const footer = {
    color: '#8898aa',
    fontSize: '12px',
    lineHeight: '18px'
};
}),
"[project]/features/notificacoes/preferences.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "emailEnabledFromPrefs",
    ()=>emailEnabledFromPrefs,
    "emailPreferenceEnabled",
    ()=>emailPreferenceEnabled
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/expressions/conditions.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/db.ts [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/schema.ts [instrumentation] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
function emailEnabledFromPrefs(prefs, key) {
    if (!prefs) return true;
    return prefs[key] !== false;
}
async function emailPreferenceEnabled(userId, key) {
    try {
        const [row] = await __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$db$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["db"].select({
            notificacoes: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["userPreferencias"].notificacoes
        }).from(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["userPreferencias"]).where((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$expressions$2f$conditions$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["eq"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["userPreferencias"].userId, userId)).limit(1);
        return emailEnabledFromPrefs(row?.notificacoes ?? null, key);
    } catch (err) {
        console.error("[notificacoes] falha ao ler preferência de email:", userId, key, err);
        return true;
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/shared/db/db.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "db",
    ()=>db,
    "pool",
    ()=>pool
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__ = __turbopack_context__.i("[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/node-postgres/driver.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/db/schema.ts [instrumentation] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
if (!process.env.DATABASE_URL) {
    throw new Error("DATABASE_URL must be set");
}
const pool = new __TURBOPACK__imported__module__$5b$externals$5d2f$pg__$5b$external$5d$__$28$pg$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$pg$29$__["Pool"]({
    connectionString: process.env.DATABASE_URL
});
const db = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$node$2d$postgres$2f$driver$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["drizzle"])(pool, {
    schema: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$db$2f$schema$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__
});
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/shared/db/schema.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "accounts",
    ()=>accounts,
    "anuncianteStatusEnum",
    ()=>anuncianteStatusEnum,
    "anunciantes",
    ()=>anunciantes,
    "anuncioConfig",
    ()=>anuncioConfig,
    "anuncioEventoTipoEnum",
    ()=>anuncioEventoTipoEnum,
    "anuncioEventos",
    ()=>anuncioEventos,
    "anuncioStatusEnum",
    ()=>anuncioStatusEnum,
    "anuncios",
    ()=>anuncios,
    "appErrors",
    ()=>appErrors,
    "asaasSubcontaStatusEnum",
    ()=>asaasSubcontaStatusEnum,
    "asaasSubcontas",
    ()=>asaasSubcontas,
    "assinaturaEventos",
    ()=>assinaturaEventos,
    "assinaturaStatusEnum",
    ()=>assinaturaStatusEnum,
    "assinaturas",
    ()=>assinaturas,
    "atividadeTipoEnum",
    ()=>atividadeTipoEnum,
    "atividades",
    ()=>atividades,
    "auditLogs",
    ()=>auditLogs,
    "candidaturaAnexos",
    ()=>candidaturaAnexos,
    "candidaturaStatusEnum",
    ()=>candidaturaStatusEnum,
    "candidaturas",
    ()=>candidaturas,
    "chatMensagens",
    ()=>chatMensagens,
    "chatThreads",
    ()=>chatThreads,
    "clienteDocumentos",
    ()=>clienteDocumentos,
    "clientes",
    ()=>clientes,
    "consentDocumentEnum",
    ()=>consentDocumentEnum,
    "contratoAssinaturas",
    ()=>contratoAssinaturas,
    "contratoPapelEnum",
    ()=>contratoPapelEnum,
    "disputaAlvoEnum",
    ()=>disputaAlvoEnum,
    "disputaCategoriaEnum",
    ()=>disputaCategoriaEnum,
    "disputaMensagens",
    ()=>disputaMensagens,
    "disputaPrioridadeEnum",
    ()=>disputaPrioridadeEnum,
    "disputaResolucaoEnum",
    ()=>disputaResolucaoEnum,
    "disputaStatusEnum",
    ()=>disputaStatusEnum,
    "disputas",
    ()=>disputas,
    "empreiteiras",
    ()=>empreiteiras,
    "empreiteiroDocumentos",
    ()=>empreiteiroDocumentos,
    "empreiteiroPortfolio",
    ()=>empreiteiroPortfolio,
    "faq",
    ()=>faq,
    "faqVisaoEnum",
    ()=>faqVisaoEnum,
    "financeiro",
    ()=>financeiro,
    "financeiroEscopoEnum",
    ()=>financeiroEscopoEnum,
    "financeiroStatusEnum",
    ()=>financeiroStatusEnum,
    "insertCandidaturaSchema",
    ()=>insertCandidaturaSchema,
    "insertClienteSchema",
    ()=>insertClienteSchema,
    "insertEmpreiteiraSchema",
    ()=>insertEmpreiteiraSchema,
    "insertFinanceiroSchema",
    ()=>insertFinanceiroSchema,
    "insertMarketplaceLeadSchema",
    ()=>insertMarketplaceLeadSchema,
    "insertMedicaoSchema",
    ()=>insertMedicaoSchema,
    "insertObraSalvaSchema",
    ()=>insertObraSalvaSchema,
    "insertObraSchema",
    ()=>insertObraSchema,
    "insertPlatformSettingSchema",
    ()=>insertPlatformSettingSchema,
    "insertSurveySchema",
    ()=>insertSurveySchema,
    "insertUserConsentSchema",
    ()=>insertUserConsentSchema,
    "insertUserPreferenciasSchema",
    ()=>insertUserPreferenciasSchema,
    "insertUserSchema",
    ()=>insertUserSchema,
    "jobRuns",
    ()=>jobRuns,
    "kpiSnapshots",
    ()=>kpiSnapshots,
    "legalDocuments",
    ()=>legalDocuments,
    "loginSchema",
    ()=>loginSchema,
    "marketplaceLeadSchema",
    ()=>marketplaceLeadSchema,
    "marketplaceLeadStatusEnum",
    ()=>marketplaceLeadStatusEnum,
    "marketplaceLeads",
    ()=>marketplaceLeads,
    "medicaoStatusEnum",
    ()=>medicaoStatusEnum,
    "medicoes",
    ()=>medicoes,
    "notificacaoTipoEnum",
    ()=>notificacaoTipoEnum,
    "notificacoes",
    ()=>notificacoes,
    "obraAnexoTipoEnum",
    ()=>obraAnexoTipoEnum,
    "obraAnexos",
    ()=>obraAnexos,
    "obraChecklistItens",
    ()=>obraChecklistItens,
    "obraChecklistStatusEnum",
    ()=>obraChecklistStatusEnum,
    "obraChecklistTipoEnum",
    ()=>obraChecklistTipoEnum,
    "obraChecklists",
    ()=>obraChecklists,
    "obraContratoStatusEnum",
    ()=>obraContratoStatusEnum,
    "obraDiario",
    ()=>obraDiario,
    "obraEquipe",
    ()=>obraEquipe,
    "obraEquipePermissaoEnum",
    ()=>obraEquipePermissaoEnum,
    "obraEquipeTipoEnum",
    ()=>obraEquipeTipoEnum,
    "obraEtapaStatusEnum",
    ()=>obraEtapaStatusEnum,
    "obraEtapas",
    ()=>obraEtapas,
    "obraFotoFaseEnum",
    ()=>obraFotoFaseEnum,
    "obraFotos",
    ()=>obraFotos,
    "obraMateriaisPorEnum",
    ()=>obraMateriaisPorEnum,
    "obraModalidadeEnum",
    ()=>obraModalidadeEnum,
    "obraOcorrenciaGravidadeEnum",
    ()=>obraOcorrenciaGravidadeEnum,
    "obraOcorrenciaStatusEnum",
    ()=>obraOcorrenciaStatusEnum,
    "obraOcorrencias",
    ()=>obraOcorrencias,
    "obraStatusEnum",
    ()=>obraStatusEnum,
    "obraStatusModeracaoEnum",
    ()=>obraStatusModeracaoEnum,
    "obraTarefaPrioridadeEnum",
    ()=>obraTarefaPrioridadeEnum,
    "obraTarefaStatusEnum",
    ()=>obraTarefaStatusEnum,
    "obraTarefas",
    ()=>obraTarefas,
    "obraVisibilidadeEnum",
    ()=>obraVisibilidadeEnum,
    "obras",
    ()=>obras,
    "obrasSalvas",
    ()=>obrasSalvas,
    "pagamentosSplit",
    ()=>pagamentosSplit,
    "passwordSetupTokens",
    ()=>passwordSetupTokens,
    "pedidoAnuncioStatusEnum",
    ()=>pedidoAnuncioStatusEnum,
    "pedidoCobrancaStatusEnum",
    ()=>pedidoCobrancaStatusEnum,
    "pedidoPagamentoEventos",
    ()=>pedidoPagamentoEventos,
    "pedidoSlots",
    ()=>pedidoSlots,
    "pedidosAnuncio",
    ()=>pedidosAnuncio,
    "planoEnum",
    ()=>planoEnum,
    "planoPersonaEnum",
    ()=>planoPersonaEnum,
    "planos",
    ()=>planos,
    "platformSettings",
    ()=>platformSettings,
    "registerSchema",
    ()=>registerSchema,
    "saqueStatusEnum",
    ()=>saqueStatusEnum,
    "saques",
    ()=>saques,
    "sessions",
    ()=>sessions,
    "splitPagamentoStatusEnum",
    ()=>splitPagamentoStatusEnum,
    "statusEnum",
    ()=>statusEnum,
    "surveyPersonaEnum",
    ()=>surveyPersonaEnum,
    "surveyRespostas",
    ()=>surveyRespostas,
    "surveyStatusEnum",
    ()=>surveyStatusEnum,
    "surveyTipoEnum",
    ()=>surveyTipoEnum,
    "surveys",
    ()=>surveys,
    "userAdditiveRoleEnum",
    ()=>userAdditiveRoleEnum,
    "userConsents",
    ()=>userConsents,
    "userFileVisibilityEnum",
    ()=>userFileVisibilityEnum,
    "userFiles",
    ()=>userFiles,
    "userPreferencias",
    ()=>userPreferencias,
    "userRoleEnum",
    ()=>userRoleEnum,
    "userRoleOrigemEnum",
    ()=>userRoleOrigemEnum,
    "userRoles",
    ()=>userRoles,
    "userTotp",
    ()=>userTotp,
    "users",
    ()=>users,
    "verificationTokens",
    ()=>verificationTokens
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/table.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/text.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/varchar.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/integer.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/numeric.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/timestamp.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/enum.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/boolean.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/jsonb.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/indexes.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$date$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/pg-core/columns/date.js [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-zod/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [instrumentation] (ecmascript) <export * as z>");
;
;
;
;
const userRoleEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("user_role", [
    "superadmin",
    "admin",
    "contratante",
    "empreiteiro",
    "anunciante"
]);
const statusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("status", [
    "ativo",
    "inativo",
    "aprovacao"
]);
const obraStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_status", [
    "em_andamento",
    "concluida",
    "pausada",
    "planejamento"
]);
const obraContratoStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_contrato_status", [
    "pendente_contratante",
    "pendente_empreiteiro",
    "assinado"
]);
const obraVisibilidadeEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_visibilidade", [
    "rascunho",
    "publicada",
    "pausada",
    "arquivada"
]);
const obraStatusModeracaoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_status_moderacao", [
    "pendente",
    "aprovada",
    "rejeitada"
]);
const obraModalidadeEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_modalidade", [
    "administracao",
    "empreitada_global",
    "empreitada_etapa"
]);
const obraMateriaisPorEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_materiais_por", [
    "contratante",
    "empreiteiro",
    "misto"
]);
const obraAnexoTipoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_anexo_tipo", [
    "projeto_arquitetonico",
    "projeto_estrutural",
    "art_rrt",
    "alvara",
    "foto_local",
    "contrato",
    "outros"
]);
const planoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("plano", [
    "free",
    "pro",
    "enterprise"
]);
const atividadeTipoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("atividade_tipo", [
    "obra_publicada",
    "candidatura_criada",
    "candidatura_aceita",
    "candidatura_rejeitada",
    "candidatura_cancelada",
    "medicao_criada",
    "medicao_aprovada",
    "medicao_contestada",
    "diario_postado",
    "ocorrencia_aberta",
    "ocorrencia_resolvida",
    "lancamento_criado",
    "lancamento_quitado",
    "disputa_aberta",
    "disputa_resolvida"
]);
const users = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("users", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    username: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("username").unique(),
    password: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("password"),
    name: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("name").notNull(),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email").notNull().unique(),
    emailVerified: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("email_verified"),
    image: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("image"),
    role: userRoleEnum("role").notNull().default("contratante"),
    phone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("phone"),
    avatarUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("avatar_url"),
    bio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("bio"),
    idioma: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("idioma", {
        length: 16
    }).notNull().default("pt-BR"),
    timezone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("timezone", {
        length: 64
    }).notNull().default("America/Sao_Paulo"),
    plano: planoEnum("plano").notNull().default("free"),
    planoStartedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("plano_started_at").defaultNow(),
    mustChangePassword: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("must_change_password").notNull().default(false),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("created_by"),
    ativo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("ativo").notNull().default(true),
    canManageUsers: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("can_manage_users").notNull().default(false),
    // XG06/XG07 — escopo do administrador. "global" = admin de plataforma (todas as
    // seções, comportamento histórico); "xgestao" = admin restrito ao recorte do
    // xgestão. TEXT e não enum Postgres de propósito: `ALTER TYPE ... ADD VALUE`
    // roda fora de transação (mesma ressalva de XG01 §6) e esta coluna tende a
    // ganhar valores. Default "global" torna a coluna retrocompatível por
    // construção — nenhum admin existente muda de comportamento. Irrelevante para
    // não-admins. Superadmin é SEMPRE global, independentemente do que está gravado
    // aqui (ver getAdminEscopo em features/auth/api/admin-scope.ts).
    adminEscopo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("admin_escopo").notNull().default("global"),
    avatarFileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("avatar_file_id"),
    // J29 — rastreio de último login para churn por inatividade.
    lastLoginAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("last_login_at"),
    // J42/J44 — marketplace split: documento fiscal (papel pagador e recebedor)
    // e id do customer Asaas (criado proativamente no cadastro; elimina lookup
    // lazy por email). Nullable — não quebra registros existentes.
    cpfCnpj: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cpf_cnpj"),
    asaasCustomerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("asaas_customer_id"),
    // J51 — gate do wizard de onboarding (primeiro acesso). Marcado `true` ao
    // concluir OU pular o wizard. Distinto de clientes/empreiteiras.perfilCompleto
    // (que é derivado e exige perfil rico); esta flag é só "já viu o onboarding".
    onboardingConcluido: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("onboarding_concluido").notNull().default(false),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const auditLogs = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("audit_logs", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    actorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("actor_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    action: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("action").notNull(),
    targetUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("target_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    payload: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("payload").$type().notNull().default({}),
    ip: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ip"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const passwordSetupTokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("password_setup_tokens", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    tokenHash: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("token_hash").notNull().unique(),
    expiresAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("expires_at").notNull(),
    usedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("used_at"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("created_by").references(()=>users.id, {
        onDelete: "set null"
    })
});
const clientes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("clientes", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").references(()=>users.id, {
        onDelete: "set null"
    }).unique(),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    tipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo").notNull().default("Pessoa Jurídica"),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email").notNull(),
    telefone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("telefone"),
    cnpjCpf: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cnpj_cpf"),
    cep: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cep"),
    endereco: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("endereco"),
    cidade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cidade"),
    estado: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("estado"),
    avatarUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("avatar_url"),
    perfilCompleto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("perfil_completo").notNull().default(false),
    obrasCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("obras_count").default(0),
    volumeFinanceiro: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("volume_financeiro", {
        precision: 15,
        scale: 2
    }).default("0"),
    status: statusEnum("status").notNull().default("ativo"),
    /** Nota interna do admin sobre o cliente (nunca exposta ao próprio cliente). */ observacoes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("observacoes")
});
const empreiteiras = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("empreiteiras", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").references(()=>users.id, {
        onDelete: "set null"
    }).unique(),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    responsavel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("responsavel").notNull(),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email").notNull(),
    telefone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("telefone"),
    cnpj: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cnpj"),
    especialidade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("especialidade"),
    especialidades: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("especialidades").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    raioKm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("raio_km"),
    cep: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cep"),
    endereco: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("endereco"),
    cidade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cidade"),
    estado: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("estado"),
    avatarUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("avatar_url"),
    portfolioUrls: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("portfolio_urls").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    portfolioDocs: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("portfolio_docs").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    zonaAtuacaoUfs: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("zona_atuacao_ufs").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    zonaAtuacaoCidades: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("zona_atuacao_cidades").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    anoFundacao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("ano_fundacao"),
    tamanhoEquipe: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tamanho_equipe"),
    siteUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("site_url"),
    instagramUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("instagram_url"),
    linkedinUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("linkedin_url"),
    registroProfissional: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("registro_profissional"),
    perfilCompleto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("perfil_completo").notNull().default(false),
    obrasCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("obras_count").default(0),
    avaliacao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("avaliacao", {
        precision: 3,
        scale: 1
    }).default("0"),
    status: statusEnum("status").notNull().default("ativo"),
    /**
   * Nota interna do admin (nunca exposta à empreiteira nem ao público).
   * Distinta de `descricao`, que é a bio pública do perfil.
   */ observacoesInternas: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("observacoes_internas")
});
const userRoleOrigemEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("user_role_origem", [
    "signup",
    "upgrade",
    "backfill"
]);
const userAdditiveRoleEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("user_additive_role", [
    "contratante",
    "empreiteiro",
    "anunciante",
    "xgestao"
]);
const userRoles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("user_roles", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    role: userAdditiveRoleEnum("role").notNull(),
    origem: userRoleOrigemEnum("origem").notNull().default("signup"),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull()
}, (t)=>({
        // Um papel por usuário, sem duplicar (idempotência do backfill + upgrade).
        uniqUserRole: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uniq_user_roles_user_role").on(t.userId, t.role),
        idxUser: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_user_roles_user").on(t.userId)
    }));
const obras = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obras", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    endereco: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("endereco").notNull(),
    clienteId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("cliente_id").references(()=>clientes.id),
    empreiteiraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("empreiteira_id").references(()=>empreiteiras.id),
    status: obraStatusEnum("status").notNull().default("planejamento"),
    // J58 — estado do contrato entre as partes. null = obra sem fluxo de contrato.
    contratoStatus: obraContratoStatusEnum("contrato_status"),
    visibilidade: obraVisibilidadeEnum("visibilidade").notNull().default("rascunho"),
    statusModeracao: obraStatusModeracaoEnum("status_moderacao").notNull().default("pendente"),
    motivoModeracao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("motivo_moderacao"),
    moderadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("moderado_em"),
    moderadoPor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("moderado_por").references(()=>users.id, {
        onDelete: "set null"
    }),
    tipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo"),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    cep: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cep"),
    // Endereço detalhado: número (obrigatório ao publicar — validado no schema
    // Zod) e complemento (opcional). Separados de `endereco` (logradouro) para
    // permitir montar a query do Google Maps com precisão. J40 #18.
    numero: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("numero"),
    complemento: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("complemento"),
    cidade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cidade"),
    uf: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("uf", {
        length: 2
    }),
    lat: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("lat", {
        precision: 10,
        scale: 7
    }),
    lng: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("lng", {
        precision: 10,
        scale: 7
    }),
    modalidade: obraModalidadeEnum("modalidade"),
    materiaisPor: obraMateriaisPorEnum("materiais_por"),
    areaM2: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("area_m2", {
        precision: 10,
        scale: 2
    }),
    padraoAcabamento: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("padrao_acabamento"),
    acessibilidadeObs: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("acessibilidade_obs"),
    valorTotal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_total", {
        precision: 15,
        scale: 2
    }).default("0"),
    valorPago: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_pago", {
        precision: 15,
        scale: 2
    }).default("0"),
    progresso: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("progresso").default(0),
    dataInicio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("data_inicio"),
    dataPrevisao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("data_previsao"),
    // J25 — Obras em Destaque na Home (curadoria admin).
    destaque: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("destaque").notNull().default(false),
    destaqueOrdem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("destaque_ordem"),
    fotoCapaFileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("foto_capa_file_id").references(()=>userFiles.id, {
        onDelete: "set null"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow()
});
const obraAnexos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_anexos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    fileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("file_id").notNull().references(()=>userFiles.id, {
        onDelete: "cascade"
    }),
    tipo: obraAnexoTipoEnum("tipo").notNull(),
    observacao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("observacao"),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("created_by").references(()=>users.id, {
        onDelete: "set null"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const contratoPapelEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("contrato_papel", [
    "contratante",
    "empreiteiro"
]);
const contratoAssinaturas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("contrato_assinaturas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    candidaturaId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("candidatura_id").references(()=>candidaturas.id, {
        onDelete: "set null"
    }),
    papel: contratoPapelEnum("papel").notNull(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    versaoTemplate: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("versao_template").notNull(),
    assinadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("assinado_em").defaultNow().notNull(),
    ip: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ip"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_agent")
}, (t)=>({
        uniqObraPapel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("contrato_assinaturas_obra_papel_uniq").on(t.obraId, t.papel)
    }));
const financeiroStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("financeiro_status", [
    "pendente",
    "pago",
    "atrasado",
    "cancelado"
]);
const financeiroEscopoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("financeiro_escopo", [
    "obra",
    "plataforma"
]);
const financeiro = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("financeiro", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    tipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao").notNull(),
    valor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor", {
        precision: 15,
        scale: 2
    }).notNull(),
    data: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("data").notNull(),
    escopo: financeiroEscopoEnum("escopo").notNull().default("obra"),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").references(()=>obras.id),
    categoria: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("categoria"),
    status: financeiroStatusEnum("status").notNull().default("pendente"),
    dataVencimento: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("data_vencimento"),
    dataPagamento: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("data_pagamento"),
    metodoPagamento: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("metodo_pagamento"),
    comprovanteUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("comprovante_url"),
    comprovanteFileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("comprovante_file_id").references(()=>userFiles.id, {
        onDelete: "set null"
    }),
    medicaoId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("medicao_id"),
    // Referência polimórfica idempotente para a origem do lançamento de plataforma
    // (ex: origemTipo="assinatura", origemId=<assinatura.id>). Garante que reenvio
    // de webhook / re-resolução de disputa não duplique entradas (índice único parcial).
    origemTipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("origem_tipo"),
    origemId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("origem_id"),
    pagadorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("pagador_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    recebedorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("recebedor_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow()
}, (t)=>({
        // Caixa consolidado por escopo/período agrega muito por estas colunas.
        idxEscopoStatusData: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_financeiro_escopo_status_data").on(t.escopo, t.status, t.data),
        // Idempotência de lançamentos de plataforma por origem. Índice parcial
        // (WHERE origem_id IS NOT NULL no bootstrap) para não afetar lançamentos de obra.
        uqOrigem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_financeiro_origem").on(t.origemTipo, t.origemId).where(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.origemId} IS NOT NULL`)
    }));
const candidaturaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("candidatura_status", [
    "pendente",
    "aceita",
    "rejeitada"
]);
const candidaturas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("candidaturas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").references(()=>obras.id),
    empreiteiroId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("empreiteiro_id").references(()=>users.id),
    valorProposta: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_proposta", {
        precision: 15,
        scale: 2
    }).notNull(),
    prazoEstimado: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("prazo_estimado"),
    dataInicio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("data_inicio"),
    dataTermino: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("data_termino"),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    observacoesPrazo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("observacoes_prazo"),
    status: candidaturaStatusEnum("status").notNull().default("pendente"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow(),
    atividades: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("atividades"),
    observacoesFinanceiras: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("observacoes_financeiras"),
    motivoRejeicao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("motivo_rejeicao"),
    mensagemContratante: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("mensagem_contratante"),
    notificacaoDisparada: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("notificacao_disparada").notNull().default(false),
    canceladaPeloEmpreiteiro: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("cancelada_pelo_empreiteiro").notNull().default(false),
    decididaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("decidida_em")
});
const candidaturaAnexos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("candidatura_anexos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    candidaturaId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("candidatura_id").notNull().references(()=>candidaturas.id, {
        onDelete: "cascade"
    }),
    fileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("file_id").notNull().references(()=>userFiles.id, {
        onDelete: "cascade"
    }),
    createdBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("created_by").references(()=>users.id, {
        onDelete: "set null"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const obrasSalvas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obras_salvas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
}, (t)=>({
        uniqUserObra: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_obras_salvas_user_obra").on(t.userId, t.obraId)
    }));
const insertObraSalvaSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(obrasSalvas).omit({
    id: true,
    createdAt: true
});
const medicaoStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("medicao_status", [
    "pendente",
    "aprovada",
    "contestada"
]);
const medicoes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("medicoes", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    empreiteiroId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("empreiteiro_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    numero: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("numero").notNull(),
    etapa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("etapa").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    percentual: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("percentual", {
        precision: 5,
        scale: 2
    }).notNull(),
    valor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor", {
        precision: 15,
        scale: 2
    }).notNull().default("0"),
    fotos: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("fotos").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    status: medicaoStatusEnum("status").notNull().default("pendente"),
    motivoContestacao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("motivo_contestacao"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    decidedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("decided_at"),
    decidedBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("decided_by").references(()=>users.id, {
        onDelete: "set null"
    })
});
const insertMedicaoSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(medicoes).omit({
    id: true,
    numero: true,
    status: true,
    motivoContestacao: true,
    createdAt: true,
    decidedAt: true,
    decidedBy: true
});
const surveyTipoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("survey_tipo", [
    "nps",
    "csat"
]);
const surveyPersonaEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("survey_persona", [
    "contratante",
    "empreiteiro"
]);
const surveyStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("survey_status", [
    "pendente",
    "respondido",
    "expirado"
]);
const notificacaoTipoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("notificacao_tipo", [
    "lembrete",
    "alerta",
    "info",
    "sucesso"
]);
const notificacoes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("notificacoes", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    tipo: notificacaoTipoEnum("tipo").notNull().default("info"),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao").notNull(),
    href: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("href"),
    threadId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("thread_id").references(()=>chatThreads.id, {
        onDelete: "set null"
    }),
    lida: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("lida").notNull().default(false),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
}, (t)=>({
        // Dedupe de notificação não-lida por (user_id, href). Espelha o índice criado
        // em server/bootstrap-notificacoes.ts (J13 hardening). Re-disparo legítimo
        // segue possível: ao ler (lida=true), a linha sai do índice parcial.
        uniqUserHrefUnread: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uniq_notificacoes_user_href_unread").on(t.userId, t.href).where(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`${t.lida} = false AND ${t.href} IS NOT NULL`)
    }));
const chatThreads = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("chat_threads", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().unique("chat_threads_obra_unique").references(()=>obras.id, {
        onDelete: "cascade"
    }),
    contratanteUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("contratante_user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    empreiteiroUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("empreiteiro_user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    criadaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criada_em").defaultNow().notNull(),
    ultimaMensagemEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("ultima_mensagem_em").defaultNow().notNull()
});
const chatMensagens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("chat_mensagens", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    threadId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("thread_id").notNull().references(()=>chatThreads.id, {
        onDelete: "cascade"
    }),
    autorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("autor_user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    texto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("texto").notNull(),
    anexoObraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("anexo_obra_id").references(()=>obras.id, {
        onDelete: "set null"
    }),
    lidaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("lida_em"),
    criadaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criada_em").defaultNow().notNull(),
    arquivoUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("arquivo_url"),
    arquivoNome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("arquivo_nome"),
    arquivoMime: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("arquivo_mime")
});
const surveys = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("surveys", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    tipo: surveyTipoEnum("tipo").notNull(),
    persona: surveyPersonaEnum("persona").notNull(),
    // dono do convite (a quem foi enviado). O POST /responder valida contra isto.
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    // obra que originou o gatilho. set null p/ não bloquear a exclusão da obra.
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").references(()=>obras.id, {
        onDelete: "set null"
    }),
    // origem idempotente: ("obra_concluida", <obraId>) | ("pagamento_quitado", <lancamentoId>).
    origemTipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("origem_tipo").notNull(),
    origemId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("origem_id").notNull(),
    status: surveyStatusEnum("status").notNull().default("pendente"),
    enviadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("enviado_em").defaultNow().notNull()
}, (t)=>({
        // Um convite por (tipo, persona, origem) — idempotência do gatilho.
        uniqOrigem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_surveys_tipo_persona_origem").on(t.tipo, t.persona, t.origemTipo, t.origemId),
        // Listagem de pendências por usuário (card "responder pesquisa").
        idxUserStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_surveys_user_status").on(t.userId, t.status)
    }));
const surveyRespostas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("survey_respostas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    surveyId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("survey_id").notNull().references(()=>surveys.id, {
        onDelete: "cascade"
    }),
    // NPS 0-10 | CSAT 0-5. Faixa validada por tipo no endpoint (Zod).
    nota: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("nota").notNull(),
    comentario: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("comentario"),
    // Consentimento implícito ao responder (molde user_consents: IP/UA).
    ip: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ip"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    respondidoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("respondido_em").defaultNow().notNull()
}, (t)=>({
        // Uma resposta por convite (critério de aceite §5).
        uniqSurvey: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_survey_respostas_survey").on(t.surveyId),
        // Agregação por janela temporal (NPS/CSAT dos últimos 90 dias).
        idxRespondidoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_survey_respostas_respondido_em").on(t.respondidoEm)
    }));
const userTotp = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("user_totp", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().unique("user_totp_user_unique").references(()=>users.id, {
        onDelete: "cascade"
    }),
    secret: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("secret").notNull(),
    enabled: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("enabled").notNull().default(false),
    recoveryCodes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("recovery_codes").$type().notNull().default([]),
    confirmadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("confirmado_em"),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull(),
    atualizadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("atualizado_em").defaultNow().notNull()
});
const marketplaceLeadStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("marketplace_lead_status", [
    "pendente",
    "notificado",
    "descartado"
]);
const marketplaceLeads = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("marketplace_leads", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email").notNull(),
    telefone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("telefone").notNull(),
    isWhatsapp: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("is_whatsapp").notNull().default(false),
    status: marketplaceLeadStatusEnum("status").notNull().default("pendente"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const accounts = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("accounts", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    type: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("type").notNull(),
    provider: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("provider").notNull(),
    providerAccountId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("provider_account_id").notNull(),
    refresh_token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("refresh_token"),
    access_token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("access_token"),
    expires_at: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("expires_at"),
    token_type: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("token_type"),
    scope: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("scope"),
    id_token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("id_token"),
    session_state: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("session_state")
});
const sessions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("sessions", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    sessionToken: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("session_token").notNull().unique(),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    expires: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("expires").notNull(),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    ip: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ip"),
    lastUsedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("last_used_at"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow()
});
const consentDocumentEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("consent_document", [
    "termos",
    "privacidade",
    "termo_anunciante",
    "contrato_obra"
]);
const userConsents = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("user_consents", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    documento: consentDocumentEnum("documento").notNull(),
    versao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("versao").notNull(),
    aceitoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("aceito_em").defaultNow().notNull(),
    ip: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ip"),
    userAgent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("user_agent"),
    revogadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("revogado_em")
}, (t)=>({
        uniqUserDocVersao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("user_consents_user_doc_versao_uniq").on(t.userId, t.documento, t.versao)
    }));
const userPreferencias = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("user_preferencias", {
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").primaryKey().references(()=>users.id, {
        onDelete: "cascade"
    }),
    notificacoes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("notificacoes").$type().notNull().default({}),
    privacidade: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("privacidade").$type().notNull().default({}),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
});
const legalDocuments = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("legal_documents", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    tipo: consentDocumentEnum("tipo").notNull(),
    versao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("versao").notNull(),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    // Conteúdo em Markdown (renderizado sanitizado no client).
    conteudo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("conteudo").notNull(),
    vigenteEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("vigente_em").defaultNow().notNull(),
    ativo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("ativo").notNull().default(true),
    criadoPor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("criado_por").references(()=>users.id, {
        onDelete: "set null"
    }),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull()
}, (t)=>({
        uniqTipoVersao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("legal_documents_tipo_versao_uniq").on(t.tipo, t.versao),
        idxTipoAtivo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_legal_documents_tipo_ativo").on(t.tipo, t.ativo)
    }));
const platformSettings = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("platform_settings", {
    chave: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("chave").primaryKey(),
    valor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("valor").notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull(),
    updatedBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("updated_by").references(()=>users.id, {
        onDelete: "set null"
    })
});
const kpiSnapshots = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("kpi_snapshots", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    metrica: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("metrica").notNull(),
    valor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor").notNull(),
    periodo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$date$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["date"])("periodo").notNull(),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull()
}, (t)=>({
        uniqMetricaPeriodo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uniq_kpi_snapshots_metrica_periodo").on(t.metrica, t.periodo)
    }));
const verificationTokens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("verification_tokens", {
    identifier: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("identifier").notNull(),
    token: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("token").notNull().unique(),
    expires: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("expires").notNull()
});
const userFileVisibilityEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("user_file_visibility", [
    "public",
    "private"
]);
const userFiles = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("user_files", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    ownerUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("owner_user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    kind: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("kind").notNull(),
    visibility: userFileVisibilityEnum("visibility").notNull(),
    bucketKey: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("bucket_key").notNull().unique(),
    originalName: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("original_name").notNull(),
    mime: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("mime").notNull(),
    sizeBytes: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("size_bytes").notNull().default(0),
    publicUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("public_url"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    deletedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("deleted_at")
});
const empreiteiroDocumentos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("empreiteiro_documentos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    empreiteiroUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("empreiteiro_user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    fileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("file_id").notNull().references(()=>userFiles.id, {
        onDelete: "cascade"
    }),
    tipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo").notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status").notNull().default("enviado"),
    observacao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("observacao"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const clienteDocumentos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("cliente_documentos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    clienteId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("cliente_id").notNull().references(()=>clientes.id, {
        onDelete: "cascade"
    }),
    fileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("file_id").notNull().references(()=>userFiles.id, {
        onDelete: "cascade"
    }),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    tipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo").notNull().default("outro"),
    uploadedBy: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("uploaded_by").references(()=>users.id, {
        onDelete: "set null"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    deletedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("deleted_at")
});
const empreiteiroPortfolio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("empreiteiro_portfolio", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    empreiteiroUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("empreiteiro_user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    fileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("file_id").notNull().references(()=>userFiles.id, {
        onDelete: "cascade"
    }),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo"),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    ordem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("ordem").notNull().default(0),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const insertUserSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(users).omit({
    id: true
});
const insertClienteSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(clientes).omit({
    id: true
});
const insertEmpreiteiraSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(empreiteiras).omit({
    id: true
});
const insertObraSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(obras).omit({
    id: true
});
const insertFinanceiroSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(financeiro).omit({
    id: true
});
const insertCandidaturaSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(candidaturas).omit({
    id: true,
    createdAt: true
});
const insertMarketplaceLeadSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(marketplaceLeads).omit({
    id: true,
    createdAt: true,
    status: true
});
const insertSurveySchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(surveys).omit({
    id: true,
    status: true,
    enviadoEm: true
});
const insertUserConsentSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(userConsents).omit({
    id: true,
    aceitoEm: true,
    revogadoEm: true
});
const insertUserPreferenciasSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(userPreferencias).omit({
    updatedAt: true
});
const insertPlatformSettingSchema = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$zod$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["createInsertSchema"])(platformSettings).omit({
    updatedAt: true
});
const marketplaceLeadSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    nome: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(2, "Nome deve ter no mínimo 2 caracteres").max(120, "Nome muito longo"),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().email("Email inválido").max(160, "Email muito longo"),
    telefone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().trim().min(8, "Telefone inválido").max(30, "Telefone muito longo"),
    isWhatsapp: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean().default(false)
});
const loginSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("Email inválido"),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(6, "Senha deve ter no mínimo 6 caracteres")
});
const registerSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object({
    name: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(2, "Nome deve ter no mínimo 2 caracteres"),
    email: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().email("Email inválido"),
    username: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(3, "Usuário deve ter no mínimo 3 caracteres"),
    password: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    role: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].enum([
        "contratante",
        "empreiteiro",
        "anunciante"
    ]),
    phone: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string().optional(),
    acceptTerms: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].literal(true, {
        errorMap: ()=>({
                message: "Você deve aceitar os Termos de Uso e a Política de Privacidade"
            })
    })
});
const obraEtapaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_etapa_status", [
    "pendente",
    "em_andamento",
    "bloqueado",
    "concluido"
]);
const obraOcorrenciaGravidadeEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_ocorrencia_gravidade", [
    "critico",
    "medio",
    "baixo"
]);
const obraOcorrenciaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_ocorrencia_status", [
    "aberta",
    "resolvida"
]);
const obraFotoFaseEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_foto_fase", [
    "antes",
    "durante",
    "agora"
]);
const obraEtapas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_etapas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    ordem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("ordem").notNull().default(0),
    progresso: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("progresso").notNull().default(0),
    status: obraEtapaStatusEnum("status").notNull().default("pendente"),
    responsavel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("responsavel"),
    prazo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("prazo"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
});
const obraDiario = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_diario", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    autorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("autor_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    texto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("texto").notNull(),
    fotoFileIds: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("foto_file_ids").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const obraOcorrencias = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_ocorrencias", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    autorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("autor_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao").notNull(),
    gravidade: obraOcorrenciaGravidadeEnum("gravidade").notNull().default("medio"),
    status: obraOcorrenciaStatusEnum("status").notNull().default("aberta"),
    fotoFileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("foto_file_id").references(()=>userFiles.id, {
        onDelete: "set null"
    }),
    resolvidoPorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("resolvido_por_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    resolvidoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("resolvido_em"),
    notificacaoDisparada: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("notificacao_disparada").notNull().default(false),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const obraFotos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_fotos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    autorId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("autor_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    fileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("file_id").notNull().references(()=>userFiles.id, {
        onDelete: "cascade"
    }),
    fase: obraFotoFaseEnum("fase"),
    tag: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tag"),
    enviadaAoContratante: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("enviada_ao_contratante").notNull().default(true),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const obraTarefaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_tarefa_status", [
    "pendente",
    "em_andamento",
    "bloqueado",
    "concluido"
]);
const obraTarefaPrioridadeEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_tarefa_prioridade", [
    "alta",
    "media",
    "baixa"
]);
const obraChecklistTipoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_checklist_tipo", [
    "seguranca",
    "diario",
    "etapa"
]);
const obraChecklistStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_checklist_status", [
    "pendente",
    "em_andamento",
    "completo"
]);
const obraEquipeTipoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_equipe_tipo", [
    "contratante",
    "engenheiro",
    "mestre",
    "equipe"
]);
const obraEquipePermissaoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("obra_equipe_permissao", [
    "visualizar",
    "editar",
    "admin"
]);
const obraTarefas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_tarefas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    etapaId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("etapa_id").references(()=>obraEtapas.id, {
        onDelete: "set null"
    }),
    etapa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("etapa").notNull().default(""),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    responsavel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("responsavel").notNull().default(""),
    prazo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("prazo").notNull().default(""),
    status: obraTarefaStatusEnum("status").notNull().default("pendente"),
    prioridade: obraTarefaPrioridadeEnum("prioridade").notNull().default("media"),
    progresso: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("progresso"),
    bloqueioMotivo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("bloqueio_motivo"),
    bloqueioInfo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("bloqueio_info"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
});
const obraChecklists = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_checklists", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao").notNull().default(""),
    tipo: obraChecklistTipoEnum("tipo").notNull().default("seguranca"),
    status: obraChecklistStatusEnum("status").notNull().default("pendente"),
    completadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("completado_em"),
    assinadoPor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("assinado_por"),
    assinadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("assinado_em"),
    registroProfissional: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("registro_profissional"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
});
const obraChecklistItens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_checklist_itens", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    checklistId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("checklist_id").notNull().references(()=>obraChecklists.id, {
        onDelete: "cascade"
    }),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    concluida: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("concluida").notNull().default(false),
    ordem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("ordem").notNull().default(0),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const obraEquipe = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("obra_equipe", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    papel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("papel").notNull().default(""),
    tipo: obraEquipeTipoEnum("tipo").notNull().default("equipe"),
    cor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cor").notNull().default("bg-primary"),
    telefone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("telefone"),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email"),
    registro: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("registro"),
    membros: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("membros"),
    ativo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("ativo").notNull().default(true),
    permissao: obraEquipePermissaoEnum("permissao"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
});
const atividades = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("atividades", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    tipo: atividadeTipoEnum("tipo").notNull(),
    actorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("actor_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").references(()=>obras.id, {
        onDelete: "set null"
    }),
    targetUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("target_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    payload: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("payload").$type().notNull().default({}),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const disputaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("disputa_status", [
    "aberta",
    "em_analise",
    "aguardando_partes",
    "resolvida",
    "cancelada"
]);
const disputaAlvoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("disputa_alvo", [
    "medicao",
    "pagamento"
]);
const disputaResolucaoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("disputa_resolucao", [
    "favor_contratante",
    "favor_empreiteiro",
    "meio_termo"
]);
const disputaCategoriaEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("disputa_categoria", [
    "pagamento_atrasado",
    "medicao_rejeitada",
    "qualidade_obra",
    "descumprimento_prazo",
    "escopo_contrato",
    "outros"
]);
const disputaPrioridadeEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("disputa_prioridade", [
    "alta",
    "media",
    "baixa"
]);
const disputas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("disputas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").notNull().references(()=>obras.id, {
        onDelete: "cascade"
    }),
    abertaPorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("aberta_por_user_id").notNull().references(()=>users.id, {
        onDelete: "set null"
    }),
    contraparteUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("contraparte_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    alvoTipo: disputaAlvoEnum("alvo_tipo").notNull(),
    alvoId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("alvo_id").notNull(),
    categoria: disputaCategoriaEnum("categoria").notNull().default("outros"),
    prioridade: disputaPrioridadeEnum("prioridade").notNull().default("media"),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao").notNull(),
    valorEnvolvido: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_envolvido", {
        precision: 15,
        scale: 2
    }),
    status: disputaStatusEnum("status").notNull().default("aberta"),
    responsavelAdminId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("responsavel_admin_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    resolucaoTipo: disputaResolucaoEnum("resolucao_tipo"),
    resolucaoTexto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("resolucao_texto"),
    // Quanto, da resolução, foi estornado/ajustado no financeiro (auditoria).
    valorAjustado: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_ajustado", {
        precision: 15,
        scale: 2
    }),
    resolvedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("resolved_at"),
    resolvedByUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("resolved_by_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
}, (t)=>({
        idxObra: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_disputas_obra").on(t.obraId),
        idxStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_disputas_status").on(t.status),
        // Uma disputa ABERTA por alvo (impede duplicatas / bloqueia pagamento).
        // Índice parcial aplicado no bootstrap: WHERE status NOT IN ('resolvida','cancelada').
        uqAlvoAberta: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_disputas_alvo_aberta").on(t.alvoTipo, t.alvoId)
    }));
const disputaMensagens = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("disputa_mensagens", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    disputaId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("disputa_id").notNull().references(()=>disputas.id, {
        onDelete: "cascade"
    }),
    autorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("autor_user_id").notNull().references(()=>users.id, {
        onDelete: "set null"
    }),
    texto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("texto").notNull(),
    anexoFileId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("anexo_file_id").references(()=>userFiles.id, {
        onDelete: "set null"
    }),
    // true quando a mensagem é uma nota administrativa (visível só p/ admin).
    interna: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("interna").notNull().default(false),
    criadaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criada_em").defaultNow().notNull()
}, (t)=>({
        idxDisputa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_disputa_mensagens_disputa").on(t.disputaId)
    }));
const planoPersonaEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("plano_persona", [
    "contratante",
    "empreiteiro",
    "ambos"
]);
const assinaturaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("assinatura_status", [
    "ativa",
    "cancelada",
    "inadimplente",
    "expirada",
    "pendente_reativacao"
]);
const planos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("planos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    // Tier de referência no catálogo (free/pro/enterprise) — liga ao plans-catalog.
    tier: planoEnum("tier").notNull(),
    persona: planoPersonaEnum("persona").notNull(),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    descricao: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("descricao"),
    valorMensal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_mensal", {
        precision: 15,
        scale: 2
    }).notNull().default("0"),
    valorAnual: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_anual", {
        precision: 15,
        scale: 2
    }),
    limitesJson: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("limites_json").$type().notNull().default({}),
    features: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("features").array().notNull().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`ARRAY[]::text[]`),
    ativo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("ativo").notNull().default(true),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
}, (t)=>({
        // Um plano por (tier, persona) — catálogo canônico.
        uqTierPersona: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_planos_tier_persona").on(t.tier, t.persona)
    }));
const assinaturas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("assinaturas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    planoId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("plano_id").notNull().references(()=>planos.id),
    status: assinaturaStatusEnum("status").notNull().default("ativa"),
    ciclo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("ciclo").notNull().default("mensal"),
    iniciadaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("iniciada_em").defaultNow().notNull(),
    renovaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("renova_em"),
    canceladaEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("cancelada_em"),
    // Registra quando a assinatura entrou no estado pendente_reativacao.
    // Usado para detectar linhas presas no gateway-check limbo por muito tempo.
    pendenteReativacaoAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("pendente_reativacao_at"),
    // Campos agnósticos de gateway — preenchidos pelo adapter real (J14).
    gatewayProvider: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_provider").notNull().default("manual"),
    gatewayCustomerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_customer_id"),
    gatewaySubscriptionId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_subscription_id"),
    // Contador de execuções consecutivas do job de carência em que o gateway
    // devolveu "unknown" (inalcançável). Zerado ao sair de pendente_reativacao
    // (para ativa ou expirada). Quando atinge PENDENTE_REATIVACAO_MAX_RETRIES,
    // a assinatura é expirada com evento "gateway_unreachable_too_long".
    gatewayRetryCount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("gateway_retry_count").notNull().default(0),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
}, (t)=>({
        idxUser: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_assinaturas_user").on(t.userId),
        // No máximo uma assinatura ATIVA por usuário (índice parcial no bootstrap).
        uqUserAtiva: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_assinaturas_user_ativa").on(t.userId)
    }));
const assinaturaEventos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("assinatura_eventos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    assinaturaId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("assinatura_id").references(()=>assinaturas.id, {
        onDelete: "cascade"
    }),
    tipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo").notNull(),
    // ID único do evento no gateway — chave de idempotência do webhook.
    gatewayEventId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_event_id"),
    payloadJson: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("payload_json").$type().notNull().default({}),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull()
}, (t)=>({
        uqGatewayEvent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_assinatura_eventos_gateway").on(t.gatewayEventId)
    }));
const asaasSubcontaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("asaas_subconta_status", [
    "pendente",
    "aguardando_kyc",
    "aprovada",
    "rejeitada"
]);
const splitPagamentoStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("split_pagamento_status", [
    "pendente",
    "confirmado",
    "repassado",
    "falhou",
    "estornado"
]);
const asaasSubcontas = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("asaas_subcontas", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    // Uma subconta por empreiteiro (unique). Cascade: sumiu o user, some a subconta.
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    // IDs do Asaas: a subconta (/accounts) e o walletId (campo crítico do split).
    asaasAccountId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("asaas_account_id"),
    walletId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("wallet_id"),
    // apiKey da subconta, SEMPRE cifrada em repouso (AES-256-GCM). Nunca texto puro.
    asaasApiKeyEnc: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("asaas_api_key_enc"),
    onboardingStatus: asaasSubcontaStatusEnum("onboarding_status").notNull().default("pendente"),
    // Status bruto de KYC do Asaas (auditoria).
    kycStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("kyc_status"),
    // Dados de recebimento: PIX ou TED.
    tipoConta: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo_conta"),
    pixChave: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("pix_chave"),
    pixTipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("pix_tipo"),
    bancoCodigo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("banco_codigo"),
    agencia: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("agencia"),
    conta: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("conta"),
    contaDigito: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("conta_digito"),
    contaTipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("conta_tipo"),
    titularNome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titular_nome"),
    titularCpfCnpj: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titular_cpf_cnpj"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
}, (t)=>({
        uqUser: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_asaas_subcontas_user").on(t.userId),
        idxAccount: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_asaas_subcontas_account").on(t.asaasAccountId),
        idxWallet: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_asaas_subcontas_wallet").on(t.walletId)
    }));
const pagamentosSplit = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("pagamentos_split", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    financeiroId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("financeiro_id").references(()=>financeiro.id),
    obraId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("obra_id").references(()=>obras.id),
    medicaoId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("medicao_id"),
    pagadorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("pagador_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    recebedorUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("recebedor_user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    // ID do pagamento no Asaas — chave de idempotência do webhook (unique).
    asaasPaymentId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("asaas_payment_id"),
    asaasCheckoutId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("asaas_checkout_id"),
    // J56 — URL de pagamento reusada em reentrância (evita 2ª cobrança em double-click).
    invoiceUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("invoice_url"),
    valorTotal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_total", {
        precision: 15,
        scale: 2
    }),
    valorPlataforma: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_plataforma", {
        precision: 15,
        scale: 2
    }),
    valorEmpreiteiro: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_empreiteiro", {
        precision: 15,
        scale: 2
    }),
    // Snapshot da regra de comissão no momento (a regra viva fica em platform_settings).
    percentualPlataforma: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("percentual_plataforma", {
        precision: 5,
        scale: 2
    }),
    walletIdEmpreiteiro: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("wallet_id_empreiteiro"),
    status: splitPagamentoStatusEnum("status").notNull().default("pendente"),
    billingType: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("billing_type"),
    confirmadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("confirmado_em"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
}, (t)=>({
        uqAsaasPayment: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_pagamentos_split_asaas_payment").on(t.asaasPaymentId),
        idxObraStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_pagamentos_split_obra_status").on(t.obraId, t.status),
        idxFinanceiro: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_pagamentos_split_financeiro").on(t.financeiroId)
    }));
const saqueStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("saque_status", [
    "pendente",
    "concluido",
    "falhou"
]);
const saques = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("saques", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    valor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor", {
        precision: 15,
        scale: 2
    }).notNull(),
    status: saqueStatusEnum("status").notNull().default("pendente"),
    // id da transferência no Asaas (/transfers) — auditoria/reconciliação.
    asaasTransferId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("asaas_transfer_id"),
    // método usado: PIX | TED (snapshot dos dados de recebimento da subconta).
    metodo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("metodo"),
    erro: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("erro"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull(),
    updatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("updated_at").defaultNow().notNull()
}, (t)=>({
        idxUser: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_saques_user").on(t.userId),
        idxTransfer: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_saques_transfer").on(t.asaasTransferId)
    }));
const anuncioStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("anuncio_status", [
    "rascunho",
    "agendada",
    "ativa",
    "pausada",
    "expirada"
]);
const anuncioEventoTipoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("anuncio_evento_tipo", [
    "impressao",
    "clique"
]);
const anuncianteStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("anunciante_status", [
    "ativo",
    "inativo"
]);
const anunciantes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("anunciantes", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    // J23 — vínculo opcional com o usuário-anunciante (self-service). NULL = anunciante
    // legado criado manualmente pelo admin (advertiser externo sem conta). Preenchido
    // = anunciante com login próprio. Unifica o conceito de "anunciante" no banco.
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").references(()=>users.id, {
        onDelete: "set null"
    }).unique(),
    nome: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("nome").notNull(),
    sigla: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("sigla", {
        length: 8
    }),
    contato: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("contato"),
    email: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("email"),
    telefone: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("telefone"),
    cnpj: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cnpj"),
    status: anuncianteStatusEnum("status").notNull().default("ativo"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
});
const anuncios = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("anuncios", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    anuncianteId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("anunciante_id").notNull().references(()=>anunciantes.id, {
        onDelete: "cascade"
    }),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    subtitulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("subtitulo"),
    criativoUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("criativo_url"),
    ctaUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cta_url"),
    ctaTexto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cta_texto"),
    // J24 — template do criativo (validado em app contra o registry, como `zona`).
    template: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("template").notNull().default("imagem-card"),
    // J24 — campos estruturados específicos do template (texto/fonte/blocos…).
    // Shape validado por template (zod) na API antes de persistir.
    conteudo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("conteudo"),
    // Zona de exibição (ver AnuncioZonaId em features/shared/anuncios/types).
    zona: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("zona").notNull(),
    inicio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("inicio"),
    fim: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("fim"),
    orcamento: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("orcamento", {
        precision: 15,
        scale: 2
    }).notNull().default("0"),
    status: anuncioStatusEnum("status").notNull().default("rascunho"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
}, (t)=>({
        // Hot path: GET /api/anuncios filtra por zona+status. Período filtrado em SQL.
        idxZonaStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_anuncios_zona_status").on(t.zona, t.status),
        idxAnunciante: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_anuncios_anunciante").on(t.anuncianteId)
    }));
const anuncioEventos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("anuncio_eventos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    anuncioId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("anuncio_id").notNull().references(()=>anuncios.id, {
        onDelete: "cascade"
    }),
    tipo: anuncioEventoTipoEnum("tipo").notNull(),
    // LGPD: só preenchido se o viewer estiver logado; null para visitante público.
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull()
}, (t)=>({
        idxAnuncioTipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_anuncio_eventos_anuncio_tipo").on(t.anuncioId, t.tipo)
    }));
const anuncioConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("anuncio_config", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    chave: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("chave").notNull().unique(),
    visivel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("visivel").notNull().default(true),
    atualizadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("atualizado_em").defaultNow().notNull()
});
const pedidoAnuncioStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("pedido_anuncio_status", [
    "em_analise",
    "aprovado",
    "recusado",
    "publicado",
    "encerrado"
]);
const pedidoCobrancaStatusEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("pedido_cobranca_status", [
    "prototipo",
    "pendente",
    "paga",
    "isenta"
]);
const pedidosAnuncio = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("pedidos_anuncio", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    // Quem solicitou (anunciante puro OU cliente que também anuncia). FK direta ao
    // usuário — a identidade de anunciante (empresa/CNPJ) mora em `anunciantes`.
    solicitanteUserId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("solicitante_user_id").notNull().references(()=>users.id, {
        onDelete: "cascade"
    }),
    status: pedidoAnuncioStatusEnum("status").notNull().default("em_analise"),
    motivoRecusa: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("motivo_recusa"),
    valorTotal: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_total", {
        precision: 15,
        scale: 2
    }).notNull().default("0"),
    cobrancaStatus: pedidoCobrancaStatusEnum("cobranca_status").notNull().default("prototipo"),
    // J31 — cobrança real (one-off). Nullable: só populados no fluxo pago.
    gatewayProvider: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_provider"),
    gatewayCustomerId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_customer_id"),
    gatewayPaymentId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_payment_id"),
    cpfCnpj: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cpf_cnpj"),
    invoiceUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("invoice_url"),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull(),
    moderadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("moderado_em"),
    moderadoPor: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("moderado_por").references(()=>users.id, {
        onDelete: "set null"
    })
}, (t)=>({
        idxSolicitante: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_pedidos_anuncio_solicitante").on(t.solicitanteUserId),
        idxStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_pedidos_anuncio_status").on(t.status)
    }));
const pedidoPagamentoEventos = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("pedido_pagamento_eventos", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    pedidoId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("pedido_id").references(()=>pedidosAnuncio.id, {
        onDelete: "cascade"
    }),
    tipo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("tipo").notNull(),
    gatewayEventId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("gateway_event_id"),
    payloadJson: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("payload_json").$type().notNull().default({}),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull()
}, (t)=>({
        uqGatewayEvent: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["uniqueIndex"])("uq_pedido_pagamento_eventos_gateway").on(t.gatewayEventId),
        idxPedido: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_pedido_pagamento_eventos_pedido").on(t.pedidoId)
    }));
const pedidoSlots = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("pedido_slots", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    pedidoId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("pedido_id").notNull().references(()=>pedidosAnuncio.id, {
        onDelete: "cascade"
    }),
    // Zona validada em app contra ZONAS (isZonaValida) — TEXT como em `anuncios`.
    zona: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("zona").notNull(),
    // Template validado contra o registry (templateAceitoNaZona) — reuso J24.
    template: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("template").notNull().default("imagem-card"),
    titulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("titulo").notNull(),
    subtitulo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("subtitulo"),
    criativoUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("criativo_url"),
    ctaUrl: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cta_url"),
    ctaTexto: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("cta_texto"),
    conteudo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("conteudo"),
    periodoInicio: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("periodo_inicio"),
    periodoFim: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("periodo_fim"),
    valorSlot: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$numeric$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["numeric"])("valor_slot", {
        precision: 15,
        scale: 2
    }).notNull().default("0"),
    // Preenchido na materialização (aprovação) — liga ao `anuncios` real criado.
    anuncioId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("anuncio_id").references(()=>anuncios.id, {
        onDelete: "set null"
    })
}, (t)=>({
        idxPedido: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_pedido_slots_pedido").on(t.pedidoId)
    }));
const faqVisaoEnum = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$enum$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgEnum"])("faq_visao", [
    "contratante",
    "empreiteiro",
    "anunciante",
    "ambos"
]);
const faq = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("faq", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("id").primaryKey().default(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["sql"]`gen_random_uuid()`),
    question: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("question").notNull(),
    answer: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("answer").notNull(),
    category: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("category").notNull(),
    visao: faqVisaoEnum("visao").notNull().default("ambos"),
    ordem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("ordem").notNull().default(0),
    ativo: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$boolean$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["boolean"])("ativo").notNull().default(true),
    criadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("criado_em").defaultNow().notNull(),
    atualizadoEm: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("atualizado_em").defaultNow().notNull()
}, (t)=>({
        // Listagem ordena por categoria + ordem.
        idxCategoriaOrdem: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_faq_categoria_ordem").on(t.category, t.ordem)
    }));
const appErrors = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("app_errors", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("id").primaryKey().generatedAlwaysAsIdentity(),
    level: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("level").notNull().default("error"),
    message: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("message").notNull(),
    stack: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("stack"),
    route: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("route"),
    userId: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$varchar$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["varchar"])("user_id").references(()=>users.id, {
        onDelete: "set null"
    }),
    meta: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("meta"),
    fingerprint: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("fingerprint"),
    source: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("source").notNull().default("server"),
    createdAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("created_at").defaultNow().notNull()
}, (t)=>({
        idxCreatedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_app_errors_created_at").on(t.createdAt),
        idxRoute: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_app_errors_route").on(t.route),
        idxLevel: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_app_errors_level").on(t.level)
    }));
const jobRuns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$table$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["pgTable"])("job_runs", {
    id: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$integer$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["integer"])("id").primaryKey().generatedAlwaysAsIdentity(),
    job: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("job").notNull(),
    status: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("status").notNull(),
    startedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("started_at").defaultNow().notNull(),
    finishedAt: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$timestamp$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["timestamp"])("finished_at"),
    error: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$text$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["text"])("error"),
    meta: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$columns$2f$jsonb$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["jsonb"])("meta")
}, (t)=>({
        idxJobStarted: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_job_runs_job_started").on(t.job, t.startedAt),
        idxStatus: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$pg$2d$core$2f$indexes$2e$js__$5b$instrumentation$5d$__$28$ecmascript$29$__["index"])("idx_job_runs_status").on(t.status)
    }));
}),
"[project]/shared/lib/email.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "sendAvisoExpiracaoEmail",
    ()=>sendAvisoExpiracaoEmail,
    "sendCandidaturaDecididaEmail",
    ()=>sendCandidaturaDecididaEmail,
    "sendNovaObraZonaEmail",
    ()=>sendNovaObraZonaEmail,
    "sendPagamentoRecebidoEmail",
    ()=>sendPagamentoRecebidoEmail,
    "sendPasswordResetEmail",
    ()=>sendPasswordResetEmail,
    "sendPasswordSetupEmail",
    ()=>sendPasswordSetupEmail,
    "sendVerificationEmail",
    ()=>sendVerificationEmail,
    "sendWebhookDeadAlertEmail",
    ()=>sendWebhookDeadAlertEmail,
    "sendWelcomeEmail",
    ()=>sendWelcomeEmail
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@react-email/render/dist/node/index.mjs [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$password$2d$reset$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/emails/password-reset.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$welcome$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/emails/welcome.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$verification$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/emails/verification.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$password$2d$setup$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/emails/password-setup.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$pagamento$2d$recebido$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/notificacoes/emails/pagamento-recebido.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$candidatura$2d$decidida$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/notificacoes/emails/candidatura-decidida.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$nova$2d$obra$2d$zona$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/notificacoes/emails/nova-obra-zona.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$aviso$2d$expiracao$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/notificacoes/emails/aviso-expiracao.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$webhook$2d$dead$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/notificacoes/emails/webhook-dead.tsx [instrumentation] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/test-email-store.ts [instrumentation] (ecmascript)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__
]);
[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
;
;
;
const BREVO_API_URL = 'https://api.brevo.com/v3/smtp/email';
const SENDER_NAME = 'XConstrução';
const DEFAULT_SENDER_EMAIL = 'noreply@dinamicareforma.com.br';
async function sendViaBrevo({ to, subject, html, tag }) {
    const apiKey = process.env.BREVO_API_KEY;
    if (!apiKey) {
        console.error(`[email:${tag}] BREVO_API_KEY ausente — não é possível enviar email.`);
        throw new Error('Falha ao enviar email');
    }
    const senderEmail = process.env.EMAIL_FROM || DEFAULT_SENDER_EMAIL;
    const res = await fetch(BREVO_API_URL, {
        method: 'POST',
        headers: {
            'api-key': apiKey,
            'content-type': 'application/json',
            accept: 'application/json'
        },
        body: JSON.stringify({
            sender: {
                name: SENDER_NAME,
                email: senderEmail
            },
            to: [
                {
                    email: to
                }
            ],
            subject,
            htmlContent: html
        })
    });
    if (!res.ok) {
        let detail = undefined;
        try {
            detail = await res.json();
        } catch  {
            try {
                detail = await res.text();
            } catch  {
            // ignore
            }
        }
        console.error(`[email:${tag}] Brevo respondeu ${res.status}:`, detail);
        throw new Error('Falha ao enviar email');
    }
    const payload = await res.json().catch(()=>({}));
    return {
        success: true,
        data: {
            id: payload.messageId ?? ''
        }
    };
}
async function sendPasswordResetEmail(to, resetUrl, userName) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$password$2d$reset$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])({
        resetUrl,
        userName
    }));
    const subject = 'XConstrução - Recuperação de Senha';
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'password-reset',
                resetUrl,
                userName
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'password-reset'
        });
    } catch (error) {
        console.error('Erro ao enviar email de recuperação de senha:', error);
        throw error;
    }
}
async function sendWelcomeEmail(to, userName, userRole) {
    const baseUrl = process.env.NEXTAUTH_URL ?? '';
    const dashboardUrl = `${baseUrl}/dashboard`;
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$welcome$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])({
        userName,
        userRole,
        dashboardUrl
    }));
    const subject = 'Bem-vindo à XConstrução!';
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'welcome',
                userName,
                userRole
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'welcome'
        });
    } catch (error) {
        console.error('Erro ao enviar email de boas-vindas:', error);
        throw error;
    }
}
async function sendPasswordSetupEmail(to, setupUrl, userName, invitedByName, roleLabel) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$password$2d$setup$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])({
        setupUrl,
        userName,
        invitedByName: invitedByName ?? undefined,
        roleLabel
    }));
    const subject = 'XConstrução - Defina sua senha de acesso';
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'password-setup',
                setupUrl,
                userName,
                invitedByName,
                roleLabel
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'password-setup'
        });
    } catch (error) {
        console.error('Erro ao enviar email de definição de senha:', error);
        throw error;
    }
}
async function sendPagamentoRecebidoEmail(to, props) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$pagamento$2d$recebido$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])(props));
    const subject = `XConstrução - Pagamento recebido (${props.valorFormatado})`;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'pagamento-recebido',
                ...props
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'pagamento-recebido'
        });
    } catch (error) {
        console.error('Erro ao enviar email de pagamento recebido:', error);
        throw error;
    }
}
async function sendCandidaturaDecididaEmail(to, props) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$candidatura$2d$decidida$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])(props));
    const subject = props.resultado === 'aceita' ? `XConstrução - Sua proposta foi aceita (${props.obraNome})` : `XConstrução - Sua proposta não foi selecionada (${props.obraNome})`;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'candidatura-decidida',
                ...props
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'candidatura-decidida'
        });
    } catch (error) {
        console.error('Erro ao enviar email de candidatura decidida:', error);
        throw error;
    }
}
async function sendNovaObraZonaEmail(to, props) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$nova$2d$obra$2d$zona$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])(props));
    const subject = `XConstrução - Nova obra na sua zona: ${props.obraNome}`;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'nova-obra-zona',
                ...props
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'nova-obra-zona'
        });
    } catch (error) {
        console.error('Erro ao enviar email de nova obra na zona:', error);
        throw error;
    }
}
async function sendAvisoExpiracaoEmail(to, props) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$aviso$2d$expiracao$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])(props));
    const subject = `XConstrução - Seu acesso expira em ${props.diasRestantes === 1 ? '1 dia' : `${props.diasRestantes} dias`}`;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'aviso-expiracao',
                ...props
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'aviso-expiracao'
        });
    } catch (error) {
        console.error('Erro ao enviar email de aviso de expiração:', error);
        throw error;
    }
}
async function sendWebhookDeadAlertEmail(to, props) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$notificacoes$2f$emails$2f$webhook$2d$dead$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])(props));
    const subject = props.count === 1 ? `XConstrução - Alerta: webhook de pagamento não processado` : `XConstrução - Alerta: ${props.count} webhooks de pagamento não processados`;
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'webhook-dead-alert',
                ...props
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'webhook-dead-alert'
        });
    } catch (error) {
        console.error('Erro ao enviar email de alerta de webhook dead-letter:', error);
        throw error;
    }
}
async function sendVerificationEmail(to, verificationUrl, userName) {
    const html = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$react$2d$email$2f$render$2f$dist$2f$node$2f$index$2e$mjs__$5b$instrumentation$5d$__$28$ecmascript$29$__["render"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$emails$2f$verification$2e$tsx__$5b$instrumentation$5d$__$28$ecmascript$29$__["default"])({
        verificationUrl,
        userName
    }));
    const subject = 'XConstrução - Confirme seu Email';
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["isEmailTestMode"])()) {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$test$2d$email$2d$store$2e$ts__$5b$instrumentation$5d$__$28$ecmascript$29$__["captureTestEmail"])({
            to,
            subject,
            html,
            meta: {
                kind: 'verification',
                verificationUrl,
                userName
            }
        });
        return {
            success: true,
            data: {
                id: 'test-mode'
            }
        };
    }
    try {
        return await sendViaBrevo({
            to,
            subject,
            html,
            tag: 'verification'
        });
    } catch (error) {
        console.error('Erro ao enviar email de verificação:', error);
        throw error;
    }
}
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/shared/lib/test-email-store.ts [instrumentation] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * In-memory captura de emails enviados quando EMAIL_TEST_MODE=1.
 *
 * Usado pelos testes E2E para inspecionar o link de verificação enviado
 * (sem precisar bater na Brevo de verdade).
 *
 * NUNCA usar em produção — só é alimentado quando EMAIL_TEST_MODE=1.
 */ __turbopack_context__.s([
    "captureTestEmail",
    ()=>captureTestEmail,
    "clearTestEmails",
    ()=>clearTestEmails,
    "isEmailTestMode",
    ()=>isEmailTestMode,
    "listTestEmails",
    ()=>listTestEmails
]);
function getStore() {
    if (!globalThis.__X_TEST_EMAIL_STORE__) {
        globalThis.__X_TEST_EMAIL_STORE__ = [];
    }
    return globalThis.__X_TEST_EMAIL_STORE__;
}
function isEmailTestMode() {
    return process.env.EMAIL_TEST_MODE === "1";
}
function captureTestEmail(email) {
    const captured = {
        ...email,
        id: `test-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        sentAt: new Date().toISOString()
    };
    getStore().unshift(captured);
    return captured;
}
function listTestEmails(filter) {
    const all = getStore();
    if (!filter?.to) return all;
    const target = filter.to.toLowerCase();
    return all.filter((e)=>e.to.toLowerCase() === target);
}
function clearTestEmails() {
    getStore().length = 0;
}
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0dnwws_._.js.map