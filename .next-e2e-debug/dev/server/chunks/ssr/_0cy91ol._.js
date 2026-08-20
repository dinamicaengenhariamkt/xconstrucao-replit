module.exports = [
"[project]/app/not-found.tsx [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>NotFound
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/ssr/react-jsx-dev-runtime.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/image.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/hooks/use-auth.ts [app-ssr] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$icons$2e$tsx__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/shared/components/icons.tsx [app-ssr] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__RiHomeLine__as__IconHome$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-ssr] (ecmascript) <export RiHomeLine as IconHome>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__RiToolsLine__as__IconConstruction$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-ssr] (ecmascript) <export RiToolsLine as IconConstruction>");
'use client';
;
;
;
;
;
function NotFound() {
    const { user, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$hooks$2f$use$2d$auth$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuth"])();
    const dashboardUrl = user?.role === 'empreiteiro' ? '/empreiteiro/dashboard' : user?.role === 'contratante' ? '/contratante/dashboard' : user?.role === 'admin' ? '/admin/financeiro' : '/';
    const buttonLabel = user?.role === 'admin' ? 'Ir para o admin' : user ? 'Ir para meu painel' : 'Voltar ao início';
    const subMessage = user ? 'Mas não se preocupe — seu painel está pronto para você.' : 'Mas não se preocupe — a home está intacta.';
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "min-h-screen bg-white dark:bg-[#1C1F22] flex flex-col items-center justify-center px-6 text-center transition-colors duration-300",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$image$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                src: "/images/logo-xconstrucao-horizontal-01.png",
                alt: "XConstrução",
                width: 180,
                height: 40,
                className: "h-9 w-auto mb-12 opacity-80 dark:invert",
                priority: true
            }, void 0, false, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 27,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "w-20 h-20 rounded-2xl bg-[#333333]/5 dark:bg-white/5 flex items-center justify-center mb-6",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__RiToolsLine__as__IconConstruction$3e$__["IconConstruction"], {
                    className: "text-[#333333] dark:text-white/60 text-4xl"
                }, void 0, false, {
                    fileName: "[project]/app/not-found.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "text-[140px] md:text-[180px] font-extrabold tracking-tighter leading-none select-none mb-[-20px]",
                style: {
                    color: 'transparent',
                    WebkitTextStroke: '2px rgba(51,51,51,0.08)'
                },
                "aria-hidden": "true",
                children: "404"
            }, void 0, false, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 42,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-3xl md:text-4xl font-extrabold tracking-tight text-[#101819] dark:text-white mb-3 mt-4",
                children: "Essa página está em obras."
            }, void 0, false, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 51,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-slate-500 dark:text-slate-400 text-base md:text-lg max-w-sm mb-10 leading-relaxed",
                children: isLoading ? 'Verificando sua conta...' : subMessage
            }, void 0, false, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 56,
                columnNumber: 7
            }, this),
            isLoading ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "h-14 w-48 rounded-full bg-[#333333]/10 dark:bg-white/10 animate-pulse"
            }, void 0, false, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 64,
                columnNumber: 9
            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col sm:flex-row gap-3 items-center",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: dashboardUrl,
                        className: "inline-flex items-center gap-2 bg-[#333333] dark:bg-white text-white dark:text-[#1C1F22] font-bold h-14 px-10 rounded-full hover:brightness-110 transition-all",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__$3c$export__RiHomeLine__as__IconHome$3e$__["IconHome"], {
                                className: "text-xl"
                            }, void 0, false, {
                                fileName: "[project]/app/not-found.tsx",
                                lineNumber: 71,
                                columnNumber: 13
                            }, this),
                            buttonLabel
                        ]
                    }, void 0, true, {
                        fileName: "[project]/app/not-found.tsx",
                        lineNumber: 67,
                        columnNumber: 11
                    }, this),
                    user && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["default"], {
                        href: "/login",
                        className: "text-sm text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition-colors underline-offset-4 hover:underline",
                        children: "Trocar de conta"
                    }, void 0, false, {
                        fileName: "[project]/app/not-found.tsx",
                        lineNumber: 76,
                        columnNumber: 13
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 66,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$ssr$2f$react$2d$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "mt-16 text-xs text-slate-300 dark:text-slate-600",
                children: "XConstrução · erro 404"
            }, void 0, false, {
                fileName: "[project]/app/not-found.tsx",
                lineNumber: 87,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/app/not-found.tsx",
        lineNumber: 25,
        columnNumber: 5
    }, this);
}
}),
"[project]/features/auth/hooks/use-auth.ts [app-ssr] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useAuth",
    ()=>useAuth,
    "useIsAuthenticated",
    ()=>useIsAuthenticated,
    "useIsLoading",
    ()=>useIsLoading,
    "useUser",
    ()=>useUser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/auth/store/auth-store.ts [app-ssr] (ecmascript)");
/**
 * Hook de autenticação - Wrapper do Zustand store
 * Mantém compatibilidade com código existente que usava Context API
 */ 'use client';
;
function useAuth() {
    // Subscriptions seletivas para melhor performance
    const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.user);
    const isLoading = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.isLoading);
    const login = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.login);
    const verifyTwoFactor = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.verifyTwoFactor);
    const logout = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.logout);
    const register = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.register);
    const refreshToken = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.refreshToken);
    const checkAuth = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.checkAuth);
    return {
        user,
        isLoading,
        login,
        verifyTwoFactor,
        logout,
        register,
        refreshToken,
        checkAuth
    };
}
const useUser = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.user);
const useIsLoading = ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.isLoading);
const useIsAuthenticated = ()=>{
    const user = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$auth$2f$store$2f$auth$2d$store$2e$ts__$5b$app$2d$ssr$5d$__$28$ecmascript$29$__["useAuthStore"])((state)=>state.user);
    return !!user;
};
}),
"[project]/shared/components/icons.tsx [app-ssr] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Central icon registry — all icons used in the app are exported from here.
 * To swap icon libraries in the future, update this file only.
 * All icons come from react-icons/ri (Remix Icons).
 */ __turbopack_context__.s([]);
;
}),
];

//# sourceMappingURL=_0cy91ol._.js.map