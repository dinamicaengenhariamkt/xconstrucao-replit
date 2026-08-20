(globalThis["TURBOPACK"] || (globalThis["TURBOPACK"] = [])).push([typeof document === "object" ? document.currentScript : undefined,
"[project]/features/empreiteiro/minhas-obras/api/minhas-obras-service.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getMinhaObraDetalhe",
    ()=>getMinhaObraDetalhe,
    "getMinhasObras",
    ()=>getMinhasObras
]);
async function getMinhasObras() {
    const response = await fetch('/api/empreiteiro/minhas-obras');
    if (!response.ok) {
        throw new Error('Erro ao buscar obras');
    }
    return response.json();
}
async function getMinhaObraDetalhe(id) {
    const response = await fetch(`/api/empreiteiro/minhas-obras/${id}`);
    if (!response.ok) {
        if (response.status === 404) throw new Error('Obra não encontrada');
        throw new Error('Erro ao buscar detalhes da obra');
    }
    return response.json();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/empreiteiro/minhas-obras/components/MinhaObraCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MinhaObraCard",
    ()=>MinhaObraCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ObraCard$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/features/shared/components/ObraCard/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ObraCard$2f$ObraCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/ObraCard/ObraCard.tsx [app-client] (ecmascript)");
'use client';
;
;
function MinhaObraCard({ obra, healthStatus, basePath = "/empreiteiro/minhas-obras" }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ObraCard$2f$ObraCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ObraCard"], {
        obraId: obra.id,
        titulo: obra.titulo,
        endereco: obra.endereco,
        imagemUrl: obra.imagemUrl,
        status: obra.status,
        progresso: obra.progresso,
        orcamento: obra.orcamento,
        dataInicio: obra.dataInicio,
        dataPrevisaoFim: obra.dataPrevisaoFim,
        tipo: obra.tipo,
        parteContraria: obra.contratante,
        parteContrariaRole: "Contratante",
        basePath: basePath,
        dateMode: "range",
        healthStatus: healthStatus
    }, void 0, false, {
        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhaObraCard.tsx",
        lineNumber: 13,
        columnNumber: 5
    }, this);
}
_c = MinhaObraCard;
var _c;
__turbopack_context__.k.register(_c, "MinhaObraCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MinhasObrasGrid",
    ()=>MinhasObrasGrid
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$components$2f$MinhaObraCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/empreiteiro/minhas-obras/components/MinhaObraCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/shared/components/icons.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiToolsLine__as__IconConstruction$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiToolsLine as IconConstruction>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/features/shared/health/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/hooks/use-obras-health.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function MinhasObrasGrid({ obras, basePath }) {
    _s();
    const { data: healthMap } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useObrasHealthMap"])('empreiteiro');
    if (obras.length === 0) {
        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
            className: "text-center py-20",
            "data-testid": "empty-state-minhas-obras",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiToolsLine__as__IconConstruction$3e$__["IconConstruction"], {
                    className: "text-5xl text-gray-300 mb-4 block"
                }, void 0, false, {
                    fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx",
                    lineNumber: 14,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                    className: "text-lg font-bold text-gray-500 dark:text-gray-400",
                    children: "Nenhuma obra encontrada"
                }, void 0, false, {
                    fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx",
                    lineNumber: 15,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                    className: "text-sm text-gray-400 dark:text-gray-500 mt-1",
                    children: "Tente alterar os filtros de busca."
                }, void 0, false, {
                    fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx",
                    lineNumber: 16,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx",
            lineNumber: 13,
            columnNumber: 7
        }, this);
    }
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10",
        children: obras.map((obra)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$components$2f$MinhaObraCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MinhaObraCard"], {
                obra: obra,
                healthStatus: healthMap?.[obra.id]?.status,
                basePath: basePath
            }, obra.id, false, {
                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx",
                lineNumber: 24,
                columnNumber: 9
            }, this))
    }, void 0, false, {
        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx",
        lineNumber: 22,
        columnNumber: 5
    }, this);
}
_s(MinhasObrasGrid, "FOedZb4NA8QoW0nCZikbnR9nn/Q=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useObrasHealthMap"]
    ];
});
_c = MinhasObrasGrid;
var _c;
__turbopack_context__.k.register(_c, "MinhasObrasGrid");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MinhasObrasSkeleton",
    ()=>MinhasObrasSkeleton
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function MinhasObrasSkeleton() {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-10 p-10 animate-pulse",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "space-y-3",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-12 bg-gray-200 dark:bg-gray-800 rounded-lg w-64"
                    }, void 0, false, {
                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                        lineNumber: 7,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-5 bg-gray-200 dark:bg-gray-800 rounded w-96"
                    }, void 0, false, {
                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                        lineNumber: 8,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                lineNumber: 6,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex gap-2 flex-wrap",
                children: Array.from({
                    length: 5
                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "h-9 bg-gray-200 dark:bg-gray-800 rounded-full w-28"
                    }, i, false, {
                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                        lineNumber: 12,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                lineNumber: 10,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10",
                children: Array.from({
                    length: 3
                }).map((_, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "bg-white dark:bg-gray-900 rounded-3xl overflow-hidden border border-gray-100 dark:border-gray-800",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "aspect-[16/9] bg-gray-200 dark:bg-gray-800"
                            }, void 0, false, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                                lineNumber: 18,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-6 space-y-4",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-4 bg-gray-200 dark:bg-gray-800 rounded w-3/4"
                                    }, void 0, false, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                                        lineNumber: 20,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-3 bg-gray-200 dark:bg-gray-800 rounded w-1/2"
                                    }, void 0, false, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                                        lineNumber: 21,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-2 bg-gray-200 dark:bg-gray-800 rounded-full"
                                    }, void 0, false, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                                        lineNumber: 22,
                                        columnNumber: 15
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "h-4 bg-gray-200 dark:bg-gray-800 rounded w-1/3"
                                    }, void 0, false, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                                        lineNumber: 23,
                                        columnNumber: 15
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                                lineNumber: 19,
                                columnNumber: 13
                            }, this)
                        ]
                    }, i, true, {
                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                        lineNumber: 17,
                        columnNumber: 11
                    }, this))
            }, void 0, false, {
                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
                lineNumber: 15,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx",
        lineNumber: 5,
        columnNumber: 5
    }, this);
}
_c = MinhasObrasSkeleton;
var _c;
__turbopack_context__.k.register(_c, "MinhasObrasSkeleton");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MinhasObrasView",
    ()=>MinhasObrasView
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$PageHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/PageHeader.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$components$2f$MinhasObrasGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/empreiteiro/minhas-obras/components/MinhasObrasGrid.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$components$2f$MinhasObrasSkeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/empreiteiro/minhas-obras/components/MinhasObrasSkeleton.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$hooks$2f$use$2d$minhas$2d$obras$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/empreiteiro/minhas-obras/hooks/use-minhas-obras.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/empreiteiro/minhas-obras/constants.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/constants/status.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/features/shared/health/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthFilterSelect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthFilterSelect.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/hooks/use-obras-health.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$saude$2d$filter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/hooks/use-saude-filter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$AdvancedFiltersPopover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$ActiveFilterChip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/filters/ActiveFilterChip.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$MultiSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/filters/MultiSelectDropdown.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$RangeNumberInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/filters/RangeNumberInput.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/pagination.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$pagination$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/pagination.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/formatters.ts [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
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
;
;
;
;
;
;
;
function MinhasObrasView({ basePath }) {
    _s();
    const { data: obras, isLoading } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$hooks$2f$use$2d$minhas$2d$obras$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMinhasObras"])();
    const { data: healthMap } = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useObrasHealthMap"])('empreiteiro');
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const saude = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$saude$2d$filter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSaudeFilter"])();
    const [statusSelected, setStatusSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])({
        "MinhasObrasView.useState": ()=>{
            const param = searchParams?.get('status');
            if (!param) return [];
            return param.split(',').map({
                "MinhasObrasView.useState": (s)=>s.trim()
            }["MinhasObrasView.useState"]).filter({
                "MinhasObrasView.useState": (s)=>s.length > 0 && s in __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STATUS_LABELS"]
            }["MinhasObrasView.useState"]);
        }
    }["MinhasObrasView.useState"]);
    const [searchQuery, setSearchQuery] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [tipoSelected, setTipoSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [contratanteSelected, setContratanteSelected] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])([]);
    const [orcamentoMin, setOrcamentoMin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [orcamentoMax, setOrcamentoMax] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [progressoMin, setProgressoMin] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [progressoMax, setProgressoMax] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const [currentPage, setCurrentPage] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(1);
    const orcMinNum = orcamentoMin === '' ? undefined : Number(orcamentoMin);
    const orcMaxNum = orcamentoMax === '' ? undefined : Number(orcamentoMax);
    const progMinNum = progressoMin === '' ? undefined : Number(progressoMin);
    const progMaxNum = progressoMax === '' ? undefined : Number(progressoMax);
    const onFilterChange = (setter)=>(v)=>{
            setter(v);
            setCurrentPage(1);
        };
    const statusOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MinhasObrasView.useMemo[statusOptions]": ()=>{
            const counts = {};
            (obras ?? []).forEach({
                "MinhasObrasView.useMemo[statusOptions]": (o)=>{
                    counts[o.status] = (counts[o.status] || 0) + 1;
                }
            }["MinhasObrasView.useMemo[statusOptions]"]);
            return Object.entries(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STATUS_LABELS"]).map({
                "MinhasObrasView.useMemo[statusOptions]": ([value, label])=>({
                        value,
                        label: `${label} (${counts[value] || 0})`
                    })
            }["MinhasObrasView.useMemo[statusOptions]"]);
        }
    }["MinhasObrasView.useMemo[statusOptions]"], [
        obras
    ]);
    const tipoOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MinhasObrasView.useMemo[tipoOptions]": ()=>{
            const set = new Set((obras ?? []).map({
                "MinhasObrasView.useMemo[tipoOptions]": (o)=>o.tipo
            }["MinhasObrasView.useMemo[tipoOptions]"]));
            return Array.from(set).sort({
                "MinhasObrasView.useMemo[tipoOptions]": (a, b)=>a.localeCompare(b, 'pt-BR')
            }["MinhasObrasView.useMemo[tipoOptions]"]).map({
                "MinhasObrasView.useMemo[tipoOptions]": (t)=>({
                        value: t,
                        label: t
                    })
            }["MinhasObrasView.useMemo[tipoOptions]"]);
        }
    }["MinhasObrasView.useMemo[tipoOptions]"], [
        obras
    ]);
    const contratanteOptions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MinhasObrasView.useMemo[contratanteOptions]": ()=>{
            const set = new Set((obras ?? []).map({
                "MinhasObrasView.useMemo[contratanteOptions]": (o)=>o.contratante.nome
            }["MinhasObrasView.useMemo[contratanteOptions]"]));
            return Array.from(set).sort({
                "MinhasObrasView.useMemo[contratanteOptions]": (a, b)=>a.localeCompare(b, 'pt-BR')
            }["MinhasObrasView.useMemo[contratanteOptions]"]).map({
                "MinhasObrasView.useMemo[contratanteOptions]": (n)=>({
                        value: n,
                        label: n
                    })
            }["MinhasObrasView.useMemo[contratanteOptions]"]);
        }
    }["MinhasObrasView.useMemo[contratanteOptions]"], [
        obras
    ]);
    const filteredObras = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MinhasObrasView.useMemo[filteredObras]": ()=>{
            if (!obras) return [];
            let result = obras;
            if (statusSelected.length > 0) result = result.filter({
                "MinhasObrasView.useMemo[filteredObras]": (o)=>statusSelected.includes(o.status)
            }["MinhasObrasView.useMemo[filteredObras]"]);
            if (saude.value) result = result.filter({
                "MinhasObrasView.useMemo[filteredObras]": (o)=>healthMap?.[o.id]?.status === saude.value
            }["MinhasObrasView.useMemo[filteredObras]"]);
            if (tipoSelected.length > 0) result = result.filter({
                "MinhasObrasView.useMemo[filteredObras]": (o)=>tipoSelected.includes(o.tipo)
            }["MinhasObrasView.useMemo[filteredObras]"]);
            if (contratanteSelected.length > 0) {
                result = result.filter({
                    "MinhasObrasView.useMemo[filteredObras]": (o)=>contratanteSelected.includes(o.contratante.nome)
                }["MinhasObrasView.useMemo[filteredObras]"]);
            }
            if (orcMinNum !== undefined) result = result.filter({
                "MinhasObrasView.useMemo[filteredObras]": (o)=>o.orcamento >= orcMinNum
            }["MinhasObrasView.useMemo[filteredObras]"]);
            if (orcMaxNum !== undefined) result = result.filter({
                "MinhasObrasView.useMemo[filteredObras]": (o)=>o.orcamento <= orcMaxNum
            }["MinhasObrasView.useMemo[filteredObras]"]);
            if (progMinNum !== undefined) result = result.filter({
                "MinhasObrasView.useMemo[filteredObras]": (o)=>o.progresso >= progMinNum
            }["MinhasObrasView.useMemo[filteredObras]"]);
            if (progMaxNum !== undefined) result = result.filter({
                "MinhasObrasView.useMemo[filteredObras]": (o)=>o.progresso <= progMaxNum
            }["MinhasObrasView.useMemo[filteredObras]"]);
            if (searchQuery.trim()) {
                const query = searchQuery.toLowerCase();
                result = result.filter({
                    "MinhasObrasView.useMemo[filteredObras]": (o)=>o.titulo.toLowerCase().includes(query) || o.endereco.toLowerCase().includes(query)
                }["MinhasObrasView.useMemo[filteredObras]"]);
            }
            return result;
        }
    }["MinhasObrasView.useMemo[filteredObras]"], [
        obras,
        healthMap,
        statusSelected,
        saude.value,
        tipoSelected,
        contratanteSelected,
        orcMinNum,
        orcMaxNum,
        progMinNum,
        progMaxNum,
        searchQuery
    ]);
    const totalPages = Math.ceil(filteredObras.length / __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ITEMS_PER_PAGE"]);
    const paginatedObras = filteredObras.slice((currentPage - 1) * __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ITEMS_PER_PAGE"], currentPage * __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ITEMS_PER_PAGE"]);
    const healthSummary = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMemo"])({
        "MinhasObrasView.useMemo[healthSummary]": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["summarizeHealthMap"])(healthMap)
    }["MinhasObrasView.useMemo[healthSummary]"], [
        healthMap
    ]);
    const advancedActiveCount = (statusSelected.length > 0 ? 1 : 0) + (saude.value ? 1 : 0) + (tipoSelected.length > 0 ? 1 : 0) + (contratanteSelected.length > 0 ? 1 : 0) + (orcMinNum !== undefined || orcMaxNum !== undefined ? 1 : 0) + (progMinNum !== undefined || progMaxNum !== undefined ? 1 : 0);
    const clearAllAdvanced = ()=>{
        setStatusSelected([]);
        saude.setValue(undefined);
        setTipoSelected([]);
        setContratanteSelected([]);
        setOrcamentoMin('');
        setOrcamentoMax('');
        setProgressoMin('');
        setProgressoMax('');
        setCurrentPage(1);
    };
    if (isLoading) return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$components$2f$MinhasObrasSkeleton$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MinhasObrasSkeleton"], {}, void 0, false, {
        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
        lineNumber: 158,
        columnNumber: 25
    }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "mb-12 flex flex-col gap-10 p-10",
        "data-testid": "minhas-obras-empreiteiro-page",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "flex flex-col gap-6",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$PageHeader$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PageHeader"], {
                        title: "Minhas Obras",
                        subtitle: "Gerencie suas obras em execução e acompanhe o progresso operacional."
                    }, void 0, false, {
                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                        lineNumber: 163,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex flex-col gap-3",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-col gap-3 sm:flex-row sm:items-center",
                                children: [
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$AdvancedFiltersPopover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AdvancedFiltersPopover"], {
                                        activeCount: advancedActiveCount,
                                        onClearAll: clearAllAdvanced,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$MultiSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MultiSelectDropdown"], {
                                                label: "Status",
                                                options: statusOptions,
                                                values: statusSelected,
                                                onChange: onFilterChange(setStatusSelected),
                                                placeholder: "Todos os status",
                                                testIdPrefix: "filter-status"
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 170,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthFilterSelect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HealthFilterSelect"], {
                                                value: saude.value,
                                                onChange: onFilterChange(saude.setValue),
                                                summary: healthSummary
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 178,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$MultiSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MultiSelectDropdown"], {
                                                label: "Tipo de obra",
                                                options: tipoOptions,
                                                values: tipoSelected,
                                                onChange: onFilterChange(setTipoSelected),
                                                placeholder: "Todos os tipos",
                                                testIdPrefix: "filter-tipo"
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 183,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$MultiSelectDropdown$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MultiSelectDropdown"], {
                                                label: "Contratante",
                                                options: contratanteOptions,
                                                values: contratanteSelected,
                                                onChange: onFilterChange(setContratanteSelected),
                                                placeholder: "Todos os contratantes",
                                                searchPlaceholder: "Buscar contratante...",
                                                testIdPrefix: "filter-contratante"
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 191,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$RangeNumberInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeNumberInput"], {
                                                label: "Orçamento",
                                                min: orcamentoMin,
                                                max: orcamentoMax,
                                                onMinChange: onFilterChange(setOrcamentoMin),
                                                onMaxChange: onFilterChange(setOrcamentoMax),
                                                prefix: "R$ ",
                                                placeholderMin: "100.000",
                                                placeholderMax: "5.000.000",
                                                testIdPrefix: "filter-orcamento"
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 200,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$RangeNumberInput$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RangeNumberInput"], {
                                                label: "Progresso (%)",
                                                min: progressoMin,
                                                max: progressoMax,
                                                onMinChange: onFilterChange(setProgressoMin),
                                                onMaxChange: onFilterChange(setProgressoMax),
                                                placeholderMin: "0",
                                                placeholderMax: "100",
                                                testIdPrefix: "filter-progresso"
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 211,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                        lineNumber: 169,
                                        columnNumber: 13
                                    }, this),
                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "relative w-full sm:ml-auto sm:max-w-md sm:flex-1",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RiSearchLine"], {
                                                className: "absolute left-3 top-1/2 size-4 -translate-y-1/2 text-gray-400"
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 224,
                                                columnNumber: 15
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                                placeholder: "Buscar por título ou endereço...",
                                                value: searchQuery,
                                                onChange: (event)=>onFilterChange(setSearchQuery)(event.target.value),
                                                className: "border-gray-200 bg-white pl-9 dark:border-gray-700 dark:bg-gray-900",
                                                "data-testid": "input-search-obras"
                                            }, void 0, false, {
                                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                                lineNumber: 225,
                                                columnNumber: 15
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                        lineNumber: 223,
                                        columnNumber: 13
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                lineNumber: 168,
                                columnNumber: 11
                            }, this),
                            advancedActiveCount > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "flex flex-wrap items-center gap-2",
                                children: [
                                    statusSelected.map((status)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$ActiveFilterChip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActiveFilterChip"], {
                                            label: `Status: ${__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STATUS_LABELS"][status] ?? status}`,
                                            onRemove: ()=>onFilterChange(setStatusSelected)(statusSelected.filter((value)=>value !== status)),
                                            testId: `active-chip-status-${status}`
                                        }, status, false, {
                                            fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                            lineNumber: 238,
                                            columnNumber: 17
                                        }, this)),
                                    saude.value && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$ActiveFilterChip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActiveFilterChip"], {
                                        label: `Saúde: ${__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_LABELS"][saude.value]}`,
                                        onRemove: ()=>onFilterChange(saude.setValue)(undefined),
                                        dotClassName: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_DOT_CLASSES"][saude.value],
                                        testId: "active-chip-saude"
                                    }, void 0, false, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                        lineNumber: 248,
                                        columnNumber: 17
                                    }, this),
                                    tipoSelected.map((tipo)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$ActiveFilterChip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActiveFilterChip"], {
                                            label: `Tipo: ${tipo}`,
                                            onRemove: ()=>onFilterChange(setTipoSelected)(tipoSelected.filter((value)=>value !== tipo)),
                                            testId: `active-chip-tipo-${tipo}`
                                        }, tipo, false, {
                                            fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                            lineNumber: 256,
                                            columnNumber: 17
                                        }, this)),
                                    contratanteSelected.map((nome)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$ActiveFilterChip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActiveFilterChip"], {
                                            label: `Contratante: ${nome}`,
                                            onRemove: ()=>onFilterChange(setContratanteSelected)(contratanteSelected.filter((value)=>value !== nome)),
                                            testId: `active-chip-contratante-${nome}`
                                        }, nome, false, {
                                            fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                            lineNumber: 266,
                                            columnNumber: 17
                                        }, this)),
                                    (orcMinNum !== undefined || orcMaxNum !== undefined) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$ActiveFilterChip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActiveFilterChip"], {
                                        label: `Orçamento: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatRange"])(orcamentoMin, orcamentoMax, {
                                            prefix: 'R$ '
                                        })}`,
                                        onRemove: ()=>{
                                            onFilterChange(setOrcamentoMin)('');
                                            setOrcamentoMax('');
                                        },
                                        testId: "active-chip-orcamento"
                                    }, void 0, false, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                        lineNumber: 278,
                                        columnNumber: 17
                                    }, this),
                                    (progMinNum !== undefined || progMaxNum !== undefined) && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$filters$2f$ActiveFilterChip$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ActiveFilterChip"], {
                                        label: `Progresso: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatRange"])(progressoMin, progressoMax, {
                                            suffix: '%'
                                        })}`,
                                        onRemove: ()=>{
                                            onFilterChange(setProgressoMin)('');
                                            setProgressoMax('');
                                        },
                                        testId: "active-chip-progresso"
                                    }, void 0, false, {
                                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                        lineNumber: 288,
                                        columnNumber: 17
                                    }, this)
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                lineNumber: 236,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                        lineNumber: 167,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                lineNumber: 162,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$components$2f$MinhasObrasGrid$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["MinhasObrasGrid"], {
                obras: paginatedObras,
                basePath: basePath
            }, void 0, false, {
                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                lineNumber: 302,
                columnNumber: 7
            }, this),
            totalPages > 1 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Pagination"], {
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationContent"], {
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationItem"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationPrevious"], {
                                href: "#",
                                onClick: (event)=>{
                                    event.preventDefault();
                                    setCurrentPage((page)=>Math.max(1, page - 1));
                                },
                                "aria-disabled": currentPage === 1,
                                className: currentPage === 1 ? 'pointer-events-none opacity-50' : '',
                                "data-testid": "empreiteiro-obras-pagination-prev"
                            }, void 0, false, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                lineNumber: 308,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                            lineNumber: 307,
                            columnNumber: 13
                        }, this),
                        (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$pagination$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getPaginationRange"])(currentPage, totalPages).map((item, index)=>item === 'ellipsis' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationItem"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationEllipsis"], {}, void 0, false, {
                                    fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                    lineNumber: 322,
                                    columnNumber: 19
                                }, this)
                            }, `ellipsis-${index}`, false, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                lineNumber: 321,
                                columnNumber: 17
                            }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationItem"], {
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationLink"], {
                                    href: "#",
                                    isActive: currentPage === item,
                                    onClick: (event)=>{
                                        event.preventDefault();
                                        setCurrentPage(item);
                                    },
                                    "data-testid": `empreiteiro-obras-pagination-page-${item}`,
                                    children: item
                                }, void 0, false, {
                                    fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                    lineNumber: 326,
                                    columnNumber: 19
                                }, this)
                            }, item, false, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                lineNumber: 325,
                                columnNumber: 17
                            }, this)),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationItem"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$pagination$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PaginationNext"], {
                                href: "#",
                                onClick: (event)=>{
                                    event.preventDefault();
                                    setCurrentPage((page)=>Math.min(totalPages, page + 1));
                                },
                                "aria-disabled": currentPage === totalPages,
                                className: currentPage === totalPages ? 'pointer-events-none opacity-50' : '',
                                "data-testid": "empreiteiro-obras-pagination-next"
                            }, void 0, false, {
                                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                                lineNumber: 341,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                            lineNumber: 340,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                    lineNumber: 306,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
                lineNumber: 305,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/empreiteiro/minhas-obras/components/MinhasObrasView.tsx",
        lineNumber: 161,
        columnNumber: 5
    }, this);
}
_s(MinhasObrasView, "2CZ0g1cRcz1UtG1+i+O+c9oJLTw=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$hooks$2f$use$2d$minhas$2d$obras$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useMinhasObras"],
        __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useObrasHealthMap"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$saude$2d$filter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSaudeFilter"]
    ];
});
_c = MinhasObrasView;
var _c;
__turbopack_context__.k.register(_c, "MinhasObrasView");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/empreiteiro/minhas-obras/constants.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ITEMS_PER_PAGE",
    ()=>ITEMS_PER_PAGE,
    "QUERY_CONFIG",
    ()=>QUERY_CONFIG
]);
const QUERY_CONFIG = {
    staleTime: 5 * 60 * 1000,
    refetchOnWindowFocus: true
};
const ITEMS_PER_PAGE = 6;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/empreiteiro/minhas-obras/hooks/use-minhas-obras.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useMinhaObraDetalhe",
    ()=>useMinhaObraDetalhe,
    "useMinhasObras",
    ()=>useMinhasObras
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$api$2f$minhas$2d$obras$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/empreiteiro/minhas-obras/api/minhas-obras-service.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/empreiteiro/minhas-obras/constants.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature(), _s1 = __turbopack_context__.k.signature();
;
;
;
function useMinhasObras() {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'empreiteiro',
            'minhas-obras'
        ],
        queryFn: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$api$2f$minhas$2d$obras$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMinhasObras"],
        staleTime: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QUERY_CONFIG"].staleTime,
        refetchOnWindowFocus: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QUERY_CONFIG"].refetchOnWindowFocus
    });
}
_s(useMinhasObras, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function useMinhaObraDetalhe(id) {
    _s1();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'empreiteiro',
            'minhas-obras',
            id
        ],
        queryFn: {
            "useMinhaObraDetalhe.useQuery": ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$api$2f$minhas$2d$obras$2d$service$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["getMinhaObraDetalhe"])(id)
        }["useMinhaObraDetalhe.useQuery"],
        staleTime: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QUERY_CONFIG"].staleTime,
        refetchOnWindowFocus: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$empreiteiro$2f$minhas$2d$obras$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["QUERY_CONFIG"].refetchOnWindowFocus,
        enabled: !!id
    });
}
_s1(useMinhaObraDetalhe, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/obras/adapters.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Adapters DB → UI shapes para obras.
 * Usado por contratante/empreiteiro/admin para mapear linhas do DB
 * (shape de `obras` em shared/db/schema.ts) para os tipos esperados
 * pelos componentes de listagem/detalhe já existentes.
 *
 * Campos ricos que não existem no schema (etapas, timeline, equipe,
 * fotos, sinapi, etc.) ficam como arrays/objetos vazios; os componentes
 * tratam estados vazios graciosamente.
 */ __turbopack_context__.s([
    "VISIBILIDADE_BADGE_CLASSES",
    ()=>VISIBILIDADE_BADGE_CLASSES,
    "VISIBILIDADE_LABELS",
    ()=>VISIBILIDADE_LABELS,
    "dbToNovaObra",
    ()=>dbToNovaObra,
    "dbToObraContratante",
    ()=>dbToObraContratante,
    "dbToObraContratanteDetalhe",
    ()=>dbToObraContratanteDetalhe,
    "dbToObraDetalheEmpreiteiro",
    ()=>dbToObraDetalheEmpreiteiro,
    "mapAnexoTipoToCategoria",
    ()=>mapAnexoTipoToCategoria,
    "mapDbStatusToContratante",
    ()=>mapDbStatusToContratante
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/formatters.ts [app-client] (ecmascript)");
;
const DEFAULT_IMG = 'https://images.unsplash.com/photo-1541888946425-d81bb19240f5?w=1200';
function mapDbStatusToContratante(s) {
    switch(s){
        case 'em_andamento':
            return 'em_execucao';
        case 'concluida':
            return 'finalizada';
        case 'pausada':
            return 'com_pendencias';
        case 'planejamento':
            return 'planejamento';
        default:
            return 'planejamento';
    }
}
function mapAnexoTipoToCategoria(tipo) {
    switch(tipo){
        case 'contrato':
            return 'contrato';
        case 'art_rrt':
            return 'art_rrt';
        case 'alvara':
            return 'alvara';
        case 'projeto_arquitetonico':
        case 'projeto_estrutural':
            return 'planta';
        case 'foto_local':
            return 'foto';
        case 'outros':
        default:
            return 'outros';
    }
}
const VISIBILIDADE_LABELS = {
    rascunho: 'Rascunho',
    publicada: 'Publicada',
    pausada: 'Pausada',
    arquivada: 'Arquivada'
};
const VISIBILIDADE_BADGE_CLASSES = {
    rascunho: 'bg-gray-200 text-gray-700 dark:bg-gray-700 dark:text-gray-300',
    publicada: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
    pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
    arquivada: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
};
/** Gera iniciais (até 2 letras) a partir de um nome. */ function iniciaisFromNome(nome) {
    return nome.trim().split(/\s+/).filter(Boolean).slice(0, 2).map((w)=>w[0].toUpperCase()).join('');
}
/** DB status de medição → status usado pela UI do contratante. */ function mapDbMedicaoStatus(s) {
    if (s === 'pendente') return 'aguardando_aprovacao';
    if (s === 'contestada') return 'rejeitada';
    return 'aprovada';
}
function toNumber(v, fallback = 0) {
    if (v === null || v === undefined || v === '') return fallback;
    const n = Number(v);
    return Number.isFinite(n) ? n : fallback;
}
function formatRelative(date) {
    if (!date) return '—';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (Number.isNaN(d.getTime())) return '—';
    const diff = Date.now() - d.getTime();
    const days = Math.floor(diff / 86_400_000);
    if (days < 1) return 'Hoje';
    if (days === 1) return 'Ontem';
    if (days < 30) return `Há ${days} dias`;
    const months = Math.floor(days / 30);
    if (months < 12) return `Há ${months} ${months === 1 ? 'mês' : 'meses'}`;
    return d.toLocaleDateString('pt-BR');
}
function fullEndereco(o) {
    // Junta rua + número (ex.: "Rua X, 123") antes de cidade/UF, para exibir
    // e geocodar o endereço com a maior precisão disponível.
    const ruaComNumero = o.numero ? [
        o.endereco,
        o.numero
    ].filter(Boolean).join(', ') : o.endereco;
    const partes = [
        ruaComNumero,
        o.complemento,
        o.cidade,
        o.uf
    ].filter(Boolean);
    return partes.join(' - ') || o.endereco || '—';
}
function dbToObraContratante(o) {
    const semEmpreiteira = !o.empreiteiraId;
    const empNome = !semEmpreiteira && o.empreiteiraInfo?.nome ? o.empreiteiraInfo.nome : semEmpreiteira ? 'Aguardando' : 'Empreiteira vinculada';
    const empIniciais = semEmpreiteira ? 'AG' : iniciaisFromNome(empNome) || 'EC';
    return {
        id: o.id,
        titulo: o.nome,
        endereco: fullEndereco(o),
        imagemUrl: o.fotoCapaUrl ?? DEFAULT_IMG,
        status: mapDbStatusToContratante(o.status),
        progresso: o.progresso ?? 0,
        orcamento: toNumber(o.valorTotal),
        dataInicio: o.dataInicio ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(o.dataInicio) : '—',
        dataPrevisaoFim: o.dataPrevisao ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(o.dataPrevisao) : '—',
        empreiteiro: semEmpreiteira ? {
            nome: 'Aguardando',
            iniciais: 'AG',
            cor: 'bg-gray-400'
        } : {
            nome: empNome,
            iniciais: empIniciais,
            cor: 'bg-primary',
            telefone: o.empreiteiraInfo?.telefone ?? undefined,
            email: o.empreiteiraInfo?.email ?? undefined,
            avatarUrl: o.empreiteiraInfo?.avatarUrl ?? undefined
        },
        tipo: o.tipo ?? '—',
        candidaturas: o.candidaturasCount ?? 0,
        visibilidade: o.visibilidade,
        statusModeracao: o.statusModeracao ?? null,
        motivoModeracao: o.motivoModeracao ?? null,
        // Flag real (substitui o antigo teste `empreiteiro.nome === 'Aguardando'`).
        empreiteiroVinculado: !semEmpreiteira
    };
}
function dbToObraContratanteDetalhe(o, anexos = []) {
    const base = dbToObraContratante(o);
    const orcamento = base.orcamento;
    // Computa valorPago a partir da soma das medições aprovadas (status='aprovada').
    // obras.valorPago no DB NÃO é atualizado quando medições são aprovadas — apenas
    // `progresso` é recalculado. Por isso, somamos direto das medições retornadas
    // pela API. Se não houver medições aprovadas, usa o campo DB como fallback.
    const valorPagoFromMedicoes = (o.medicoes ?? []).filter((m)=>m.status === 'aprovada').reduce((s, m)=>s + toNumber(m.valor), 0);
    const valorPago = valorPagoFromMedicoes > 0 ? valorPagoFromMedicoes : toNumber(o.valorPago);
    const valorRestante = Math.max(0, orcamento - valorPago);
    const documentos = anexos.map((a)=>({
            id: a.id,
            nome: a.originalName || a.tipo,
            categoria: mapAnexoTipoToCategoria(a.tipo),
            tamanho: a.sizeBytes ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : undefined,
            data: a.createdAt ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(String(a.createdAt)) : '—',
            url: a.url ?? undefined,
            observacoes: a.observacao ?? undefined
        }));
    // Mapeamento DB medições → ObraMedicaoContratante
    const medicoesUi = (o.medicoes ?? []).map((m)=>({
            id: m.id,
            numero: m.numero,
            periodo: m.etapa,
            dataEnvio: m.createdAt ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(String(m.createdAt)) : '—',
            valor: Math.max(0, toNumber(m.valor)),
            status: mapDbMedicaoStatus(m.status),
            descricao: m.descricao ?? undefined
        }));
    return {
        ...base,
        imagemUrl: o.fotoCapaUrl ?? DEFAULT_IMG,
        candidaturas: o.candidaturasCount ?? base.candidaturas,
        descricao: o.descricao ?? '',
        valorPago,
        valorRestante,
        diasRestantes: o.diasRestantes ?? 0,
        tarefasConcluidas: 0,
        tarefasTotal: 0,
        etapas: [],
        tarefas: [],
        timeline: [],
        ocorrencias: [],
        equipe: [],
        financeiro: {
            valorContratado: orcamento,
            aditivos: 0,
            valorTotal: orcamento,
            valorPago,
            medicoes: medicoesUi
        },
        fotos: [],
        documentos,
        checklists: [],
        localizacao: {
            cidade: o.cidade ?? '',
            estado: o.uf ?? '',
            bairro: '',
            rua: o.endereco ?? '',
            numero: o.numero ?? undefined,
            complemento: o.complemento ?? undefined,
            cep: o.cep ?? ''
        },
        candidaturasLista: []
    };
}
function mapComplexidade(o) {
    const v = toNumber(o.valorTotal);
    if (v >= 1_500_000) return 'alta';
    if (v >= 400_000) return 'media';
    return 'baixa';
}
function dbToNovaObra(o) {
    return {
        id: o.id,
        titulo: o.nome,
        endereco: fullEndereco(o),
        // Usa a capa real quando a origem a fornece (`fotoCapaUrl`); DEFAULT_IMG é
        // só placeholder de imagem (não é dado de negócio mockado). O grid de
        // browse do empreiteiro (`/api/obras`) hoje não resolve a capa por linha
        // para não onerar a rota paginada — cai no placeholder, sem number falso.
        imagemUrl: o.fotoCapaUrl ?? DEFAULT_IMG,
        tipo: o.tipo ?? 'Geral',
        complexidade: mapComplexidade(o),
        status: 'recebendo_propostas',
        orcamento: toNumber(o.valorTotal),
        prazo: o.dataPrevisao ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(o.dataPrevisao) : '—',
        descricao: o.descricao ?? '',
        // Identidade do contratante NÃO é exposta no marketplace: GET /api/obras
        // faz strip de `clienteId` (PII) para o empreiteiro, então não há dado
        // real a mapear aqui. Campos vazios — a UI omite os blocos que dependiam
        // deles em vez de exibir o antigo literal 'Contratante' / 'CT'.
        contratante: {
            nome: '',
            iniciais: '',
            cor: 'bg-primary'
        },
        // Curadoria do admin: a coluna já chega via `getTableColumns(obras)` em
        // /api/obras (o strip por role remove só clienteId/candidaturasCount).
        // Antes era `false` fixo — o selo em NovaObraCard era código inalcançável.
        destaque: o.destaque ?? false,
        // Vem de /api/obras/[id] (detalhe). Na listagem o campo não é enviado e o
        // fallback 'nao_aplicado' é correto: obras já candidatadas são filtradas
        // fora pelo anti-self do GET /api/obras.
        applicationStatus: o.applicationStatus ?? 'nao_aplicado',
        dataPublicacao: formatRelative(o.createdAt ?? null),
        // Grid de browse do empreiteiro não expõe contagem de propostas de
        // concorrentes (por design) — usa `candidaturasCount` só quando a origem
        // fornece, senão 0. Não é o mesmo "0 falso" do hero do contratante (J40 #10).
        candidaturas: o.candidaturasCount ?? 0,
        materiaisPor: o.materiaisPor ?? undefined,
        modalidade: o.modalidade ?? undefined,
        anexosCount: typeof o.anexosCount === 'number' ? o.anexosCount : 0,
        naMinhaZona: o.naMinhaZona === true
    };
}
/** Status do banco → status da UI. Qualquer valor inesperado vira 'pendente'. */ function mapEtapaStatus(s) {
    return s === 'em_andamento' || s === 'concluida' ? s : 'pendente';
}
function dbToObraDetalheEmpreiteiro(o, anexos = [], etapas = []) {
    const base = dbToNovaObra(o);
    const area = o.areaM2 ? `${o.areaM2} m²` : '—';
    const documentos = anexos.map((a)=>({
            id: a.id,
            nome: a.originalName || a.tipo,
            tipo: a.tipo,
            tamanho: a.sizeBytes ? `${(a.sizeBytes / 1024 / 1024).toFixed(1)} MB` : '—',
            url: a.url ?? ''
        }));
    return {
        ...base,
        areaTotal: area,
        tipoObra: o.tipo ?? '—',
        inicioPrevisto: o.dataInicio ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(o.dataInicio) : undefined,
        situacaoProjeto: undefined,
        observacoes: o.descricao ?? undefined,
        localizacao: {
            cidade: o.cidade ?? '—',
            estado: o.uf ?? '—',
            bairro: '',
            rua: o.endereco ?? undefined,
            numero: o.numero ?? undefined,
            complemento: o.complemento ?? undefined,
            cep: o.cep ?? undefined
        },
        // Escopo real definido pelo contratante (tabela obra_etapas). Lista vazia
        // é legítima — o componente omite o bloco inteiro nesse caso.
        etapas: etapas.map((e)=>({
                id: e.id,
                nome: e.nome,
                descricao: e.descricao ?? '',
                prazo: e.prazo ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatDate"])(e.prazo) : '—',
                status: mapEtapaStatus(e.status)
            })),
        documentos,
        // Requisitos não têm origem no schema hoje; o componente já guarda por
        // `.length > 0`, então a lista vazia simplesmente não renderiza nada.
        requisitos: []
    };
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/ObraCard/ObraCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ObraCard",
    ()=>ObraCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/formatters.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ProgressBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/ProgressBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/constants/status.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$index$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/features/shared/health/index.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$obras$2f$adapters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/obras/adapters.ts [app-client] (ecmascript)");
'use client';
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
function ObraCard({ obraId, titulo, endereco, imagemUrl, status, progresso, orcamento, dataInicio, dataPrevisaoFim, tipo, parteContraria, parteContrariaRole, basePath, dateMode, candidaturas, visibilidade, statusModeracao, motivoModeracao, healthStatus }) {
    // Só faz sentido sinalizar moderação em obras publicadas (Task #86).
    // Aprovadas não recebem badge extra (o status "publicada" já comunica isso).
    const showModBadge = visibilidade === 'publicada' && (statusModeracao === 'pendente' || statusModeracao === 'rejeitada');
    const modBadgeLabel = statusModeracao === 'pendente' ? 'Em revisão' : 'Rejeitada';
    const modBadgeClass = statusModeracao === 'pendente' ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/40 dark:text-amber-200' : 'bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200';
    const borderColor = __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STATUS_BORDER_COLORS"][status] || 'border-l-gray-300';
    const progressColor = __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PROGRESS_COLORS"][status] || 'primary';
    const showCandidaturas = typeof candidaturas === 'number' && candidaturas > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
        href: `${basePath}/${obraId}`,
        "data-testid": `obra-card-${obraId}`,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
            whileHover: {
                y: -8,
                boxShadow: '0 20px 50px rgba(0,0,0,0.10)'
            },
            transition: {
                type: 'spring',
                stiffness: 300,
                damping: 25
            },
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('group relative bg-white dark:bg-gray-900 rounded-3xl overflow-hidden', 'shadow-[0_4px_30px_rgba(0,0,0,0.03)] border border-gray-50 dark:border-gray-800', 'border-l-4', borderColor),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "aria-hidden": true,
                    className: "pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-primary to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[3]"
                }, void 0, false, {
                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                    lineNumber: 77,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                    "aria-hidden": true,
                    className: "pointer-events-none absolute inset-0 bg-gradient-to-b from-primary/[0.03] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
                }, void 0, false, {
                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                    lineNumber: 81,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "relative aspect-[16/9] overflow-hidden rounded-t-3xl",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "w-full h-full bg-cover bg-center grayscale contrast-[1.1] group-hover:grayscale-0 group-hover:contrast-100 transition-[filter] duration-300",
                            style: {
                                backgroundImage: `url('${imagemUrl}')`
                            }
                        }, void 0, false, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 86,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent"
                        }, void 0, false, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 90,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-4 left-4 flex items-center gap-2",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center font-bold rounded-full uppercase tracking-wider text-[10px] px-2.5 py-1 backdrop-blur-sm', __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STATUS_BADGE_CLASSES"][status] || 'bg-gray-800/80 text-white'),
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$constants$2f$status$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["STATUS_LABELS"][status] || status
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 92,
                                    columnNumber: 13
                                }, this),
                                healthStatus && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HealthBadge"], {
                                    status: healthStatus,
                                    size: "sm",
                                    variant: "solid",
                                    className: "backdrop-blur-sm"
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 101,
                                    columnNumber: 15
                                }, this),
                                visibilidade && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center font-bold rounded-full uppercase tracking-wider text-[10px] px-2.5 py-1 backdrop-blur-sm', __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$obras$2f$adapters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VISIBILIDADE_BADGE_CLASSES"][visibilidade] || 'bg-gray-200 text-gray-700'),
                                    "data-testid": `badge-visibilidade-${obraId}`,
                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$obras$2f$adapters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["VISIBILIDADE_LABELS"][visibilidade] || visibilidade
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 109,
                                    columnNumber: 15
                                }, this),
                                showModBadge && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center font-bold rounded-full uppercase tracking-wider text-[10px] px-2.5 py-1 backdrop-blur-sm', modBadgeClass),
                                    title: statusModeracao === 'rejeitada' && motivoModeracao ? `Motivo: ${motivoModeracao}` : undefined,
                                    "data-testid": `badge-moderacao-${obraId}`,
                                    children: modBadgeLabel
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 120,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 91,
                            columnNumber: 11
                        }, this),
                        showCandidaturas && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "absolute top-4 right-4 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm rounded-full px-3 py-1",
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "text-[10px] font-bold text-primary",
                                children: [
                                    candidaturas,
                                    " candidaturas"
                                ]
                            }, void 0, true, {
                                fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                lineNumber: 134,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 133,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                    lineNumber: 85,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "p-6 flex flex-col gap-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1",
                                    children: tipo
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 143,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                    className: "text-lg font-bold text-gray-900 dark:text-white leading-tight",
                                    children: titulo
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 146,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-sm text-gray-500 dark:text-gray-400 mt-1 flex items-center gap-1",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RiMapPinLine"], {
                                            className: "w-3.5 h-3.5 text-gray-400"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 150,
                                            columnNumber: 15
                                        }, this),
                                        endereco
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 149,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 142,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col gap-1",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex items-center justify-between gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs text-gray-500",
                                            children: "Progresso"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 157,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-xs font-bold text-gray-700 dark:text-gray-300",
                                            children: [
                                                progresso,
                                                "%"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 158,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 156,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ProgressBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProgressBar"], {
                                    value: progresso,
                                    color: progressColor,
                                    size: "sm"
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 162,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 155,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-center justify-between gap-2 text-sm",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-400 text-xs",
                                            children: "Orçamento"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 167,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-bold text-gray-900 dark:text-white",
                                            children: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$formatters$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["formatCurrencyRounded"])(orcamento)
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 168,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 166,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "text-right",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-gray-400 text-xs",
                                            children: dateMode === 'range' ? 'Prazo' : 'Entrega'
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 173,
                                            columnNumber: 15
                                        }, this),
                                        dateMode === 'range' ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-semibold text-gray-700 dark:text-gray-300 text-xs",
                                            children: [
                                                dataInicio,
                                                " - ",
                                                dataPrevisaoFim
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 177,
                                            columnNumber: 17
                                        }, this) : /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "font-semibold text-gray-700 dark:text-gray-300 text-xs flex items-center gap-1 justify-end",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RiCalendarLine"], {
                                                    className: "w-3 h-3"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                                    lineNumber: 182,
                                                    columnNumber: 19
                                                }, this),
                                                dataPrevisaoFim
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 181,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 172,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 165,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border-t border-gray-100 dark:border-gray-800 pt-4 flex items-center gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold', parteContraria.cor),
                                    children: parteContraria.iniciais
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 190,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs font-semibold text-gray-700 dark:text-gray-300",
                                            children: parteContraria.nome
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 199,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-[10px] text-gray-400",
                                            children: parteContrariaRole
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                            lineNumber: 202,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                                    lineNumber: 198,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 189,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "block w-full text-center py-2.5 rounded-xl text-sm font-semibold transition-colors bg-primary/10 text-primary hover:bg-primary/20",
                            children: "Ver detalhes"
                        }, void 0, false, {
                            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                            lineNumber: 206,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
                    lineNumber: 141,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
            lineNumber: 65,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/shared/components/ObraCard/ObraCard.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
_c = ObraCard;
var _c;
__turbopack_context__.k.register(_c, "ObraCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/ObraCard/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ObraCard$2f$ObraCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/ObraCard/ObraCard.tsx [app-client] (ecmascript)");
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/PageHeader.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PageHeader",
    ()=>PageHeader
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
'use client';
;
function PageHeader({ title, subtitle }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h1", {
                className: "text-5xl font-extrabold tracking-tighter text-[#101819] dark:text-white",
                children: title
            }, void 0, false, {
                fileName: "[project]/features/shared/components/PageHeader.tsx",
                lineNumber: 11,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-gray-500 dark:text-gray-400 mt-2 text-lg",
                children: subtitle
            }, void 0, false, {
                fileName: "[project]/features/shared/components/PageHeader.tsx",
                lineNumber: 14,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/components/PageHeader.tsx",
        lineNumber: 10,
        columnNumber: 5
    }, this);
}
_c = PageHeader;
var _c;
__turbopack_context__.k.register(_c, "PageHeader");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/ProgressBar.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProgressBar",
    ()=>ProgressBar
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
'use client';
;
;
const COLOR_MAP = {
    success: 'bg-success',
    warning: 'bg-warning',
    error: 'bg-red-500',
    info: 'bg-info',
    primary: 'bg-primary'
};
function ProgressBar({ value, color = 'primary', size = 'sm', showLabel = false }) {
    const clampedValue = Math.min(100, Math.max(0, value));
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "flex items-center gap-2",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex-1 rounded-full bg-gray-200 dark:bg-gray-700 overflow-hidden', size === 'sm' ? 'h-1.5' : 'h-2'),
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-full rounded-full transition-all duration-500', COLOR_MAP[color]),
                    style: {
                        width: `${clampedValue}%`
                    }
                }, void 0, false, {
                    fileName: "[project]/features/shared/components/ProgressBar.tsx",
                    lineNumber: 25,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/shared/components/ProgressBar.tsx",
                lineNumber: 24,
                columnNumber: 7
            }, this),
            showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "text-xs font-bold text-gray-600 dark:text-gray-400 tabular-nums",
                children: [
                    clampedValue,
                    "%"
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/components/ProgressBar.tsx",
                lineNumber: 30,
                columnNumber: 21
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/components/ProgressBar.tsx",
        lineNumber: 23,
        columnNumber: 5
    }, this);
}
_c = ProgressBar;
var _c;
__turbopack_context__.k.register(_c, "ProgressBar");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/filters/ActiveFilterChip.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ActiveFilterChip",
    ()=>ActiveFilterChip
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/shared/components/icons.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCloseLine__as__IconClose$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiCloseLine as IconClose>");
'use client';
;
;
;
function ActiveFilterChip({ label, onRemove, className, dotClassName, testId }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-2 pl-3 pr-1 py-1 rounded-full border text-xs font-semibold', className ?? 'bg-gray-100 text-gray-700 border-gray-200 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-700'),
        "data-testid": testId,
        children: [
            dotClassName && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-1.5 h-1.5 rounded-full', dotClassName)
            }, void 0, false, {
                fileName: "[project]/features/shared/components/filters/ActiveFilterChip.tsx",
                lineNumber: 35,
                columnNumber: 24
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: label
            }, void 0, false, {
                fileName: "[project]/features/shared/components/filters/ActiveFilterChip.tsx",
                lineNumber: 36,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                type: "button",
                onClick: onRemove,
                className: "w-5 h-5 rounded-full flex items-center justify-center hover:bg-black/10 dark:hover:bg-white/10 transition-colors cursor-pointer",
                "aria-label": `Remover filtro ${label}`,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCloseLine__as__IconClose$3e$__["IconClose"], {
                    className: "w-3 h-3"
                }, void 0, false, {
                    fileName: "[project]/features/shared/components/filters/ActiveFilterChip.tsx",
                    lineNumber: 43,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/shared/components/filters/ActiveFilterChip.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/components/filters/ActiveFilterChip.tsx",
        lineNumber: 28,
        columnNumber: 5
    }, this);
}
_c = ActiveFilterChip;
var _c;
__turbopack_context__.k.register(_c, "ActiveFilterChip");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "AdvancedFiltersPopover",
    ()=>AdvancedFiltersPopover
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/popover.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
function AdvancedFiltersPopover({ activeCount = 0, label = 'Filtros avançados', children, onClearAll, contentClassName }) {
    _s();
    const [open, setOpen] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])(false);
    const hasActive = activeCount > 0;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Popover"], {
        open: open,
        onOpenChange: setOpen,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopoverTrigger"], {
                asChild: true,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                    type: "button",
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-2 px-3.5 py-2 rounded-lg border text-sm font-semibold transition-colors cursor-pointer', hasActive ? 'bg-primary/10 text-primary border-primary/30 hover:bg-primary/15' : 'bg-white dark:bg-gray-900 text-gray-700 dark:text-gray-300 border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'),
                    "data-testid": "advanced-filters-trigger",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RiFilter3Line"], {
                            className: "w-4 h-4"
                        }, void 0, false, {
                            fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                            lineNumber: 48,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            children: label
                        }, void 0, false, {
                            fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                            lineNumber: 49,
                            columnNumber: 11
                        }, this),
                        hasActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold tabular-nums",
                            children: activeCount
                        }, void 0, false, {
                            fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                            lineNumber: 51,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                    lineNumber: 38,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                lineNumber: 37,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopoverContent"], {
                align: "start",
                sideOffset: 8,
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-80 space-y-4 max-h-[calc(100vh-6rem)] overflow-y-auto', contentClassName),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "flex items-center justify-between",
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h4", {
                                className: "text-sm font-bold text-gray-900 dark:text-gray-100",
                                children: label
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                                lineNumber: 66,
                                columnNumber: 11
                            }, this),
                            onClearAll && hasActive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                type: "button",
                                onClick: ()=>{
                                    onClearAll();
                                },
                                className: "text-xs text-primary font-semibold hover:underline cursor-pointer",
                                "data-testid": "advanced-filters-clear-all",
                                children: "Limpar todos"
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                                lineNumber: 68,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                        lineNumber: 65,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "space-y-3",
                        children: children
                    }, void 0, false, {
                        fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                        lineNumber: 80,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
                lineNumber: 57,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/components/filters/AdvancedFiltersPopover.tsx",
        lineNumber: 36,
        columnNumber: 5
    }, this);
}
_s(AdvancedFiltersPopover, "xG1TONbKtDWtdOTrXaTAsNhPg/Q=");
_c = AdvancedFiltersPopover;
var _c;
__turbopack_context__.k.register(_c, "AdvancedFiltersPopover");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/filters/MultiSelectDropdown.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MultiSelectDropdown",
    ()=>MultiSelectDropdown
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/popover.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/checkbox.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/input.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript)");
;
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
;
;
;
function MultiSelectDropdown({ label, options, values, onChange, placeholder = 'Selecionar...', searchPlaceholder = 'Buscar...', showSearch, testIdPrefix }) {
    _s();
    const [search, setSearch] = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useState"])('');
    const shouldShowSearch = showSearch ?? options.length > 6;
    const filtered = search ? options.filter((o)=>o.label.toLowerCase().includes(search.toLowerCase())) : options;
    const toggle = (v)=>{
        if (values.includes(v)) {
            onChange(values.filter((x)=>x !== v));
        } else {
            onChange([
                ...values,
                v
            ]);
        }
    };
    const triggerLabel = values.length === 0 ? placeholder : values.length === 1 ? options.find((o)=>o.value === values[0])?.label ?? String(values[0]) : `${values.length} selecionados`;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-1.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider",
                children: label
            }, void 0, false, {
                fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                lineNumber: 65,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Popover"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopoverTrigger"], {
                        asChild: true,
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                            type: "button",
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-full flex items-center justify-between gap-2 px-3 py-2 rounded-lg border text-sm transition-colors cursor-pointer', values.length > 0 ? 'bg-primary/5 border-primary/30 text-gray-900 dark:text-gray-100' : 'bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700 text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800'),
                            "data-testid": testIdPrefix ? `${testIdPrefix}-trigger` : undefined,
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "truncate",
                                    children: triggerLabel
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                    lineNumber: 80,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "flex items-center gap-1.5 shrink-0",
                                    children: [
                                        values.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "inline-flex items-center justify-center min-w-[20px] h-5 px-1.5 rounded-full bg-primary text-white text-[10px] font-bold tabular-nums",
                                            children: values.length
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                            lineNumber: 83,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RiArrowDownSLine"], {
                                            className: "w-4 h-4 text-gray-400"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                            lineNumber: 87,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                    lineNumber: 81,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                            lineNumber: 70,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$popover$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["PopoverContent"], {
                        align: "start",
                        sideOffset: 6,
                        className: "w-72 p-0",
                        children: [
                            shouldShowSearch && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "p-2 border-b border-gray-100 dark:border-gray-800",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "relative",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["RiSearchLine"], {
                                            className: "absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                            lineNumber: 95,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                            placeholder: searchPlaceholder,
                                            value: search,
                                            onChange: (e)=>setSearch(e.target.value),
                                            className: "h-8 pl-8 text-sm"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                            lineNumber: 96,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                    lineNumber: 94,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                lineNumber: 93,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "max-h-60 overflow-y-auto p-1",
                                children: filtered.length === 0 ? /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "px-3 py-6 text-xs text-center text-muted-foreground",
                                    children: "Nenhum resultado."
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                    lineNumber: 107,
                                    columnNumber: 15
                                }, this) : filtered.map((opt)=>{
                                    const checked = values.includes(opt.value);
                                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                                        className: "flex items-center gap-2 px-2 py-1.5 rounded-md cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800",
                                        "data-testid": testIdPrefix ? `${testIdPrefix}-option-${opt.value}` : undefined,
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$checkbox$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Checkbox"], {
                                                checked: checked,
                                                onCheckedChange: ()=>toggle(opt.value)
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                                lineNumber: 119,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "text-sm text-gray-700 dark:text-gray-300",
                                                children: opt.label
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                                lineNumber: 120,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, String(opt.value), true, {
                                        fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                        lineNumber: 114,
                                        columnNumber: 19
                                    }, this);
                                })
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                lineNumber: 105,
                                columnNumber: 11
                            }, this),
                            values.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "border-t border-gray-100 dark:border-gray-800 p-2",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                    type: "button",
                                    onClick: ()=>onChange([]),
                                    className: "w-full text-xs text-primary font-semibold hover:underline cursor-pointer",
                                    children: [
                                        "Limpar seleção (",
                                        values.length,
                                        ")"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                    lineNumber: 128,
                                    columnNumber: 15
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                                lineNumber: 127,
                                columnNumber: 13
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                        lineNumber: 91,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/components/filters/MultiSelectDropdown.tsx",
        lineNumber: 64,
        columnNumber: 5
    }, this);
}
_s(MultiSelectDropdown, "xMSft3/sbCidYXUzqinUsZIh+qY=");
_c = MultiSelectDropdown;
var _c;
__turbopack_context__.k.register(_c, "MultiSelectDropdown");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/components/filters/RangeNumberInput.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "RangeNumberInput",
    ()=>RangeNumberInput
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/input.tsx [app-client] (ecmascript)");
'use client';
;
;
function RangeNumberInput({ label, min, max, onMinChange, onMaxChange, placeholderMin = 'Mín.', placeholderMax = 'Máx.', prefix, testIdPrefix }) {
    const sanitize = (v)=>v.replace(/[^\d]/g, '');
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: "space-y-1.5",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                className: "text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider",
                children: label
            }, void 0, false, {
                fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                lineNumber: 32,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid grid-cols-2 gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            prefix && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none",
                                children: prefix
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                                lineNumber: 38,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                inputMode: "numeric",
                                placeholder: placeholderMin,
                                value: min,
                                onChange: (e)=>onMinChange(sanitize(e.target.value)),
                                className: prefix ? 'pl-8 h-9 text-sm' : 'h-9 text-sm',
                                "data-testid": testIdPrefix ? `${testIdPrefix}-min` : undefined
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                                lineNumber: 42,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                        lineNumber: 36,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                        className: "relative",
                        children: [
                            prefix && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                className: "absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-muted-foreground pointer-events-none",
                                children: prefix
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                                lineNumber: 53,
                                columnNumber: 13
                            }, this),
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$input$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Input"], {
                                inputMode: "numeric",
                                placeholder: placeholderMax,
                                value: max,
                                onChange: (e)=>onMaxChange(sanitize(e.target.value)),
                                className: prefix ? 'pl-8 h-9 text-sm' : 'h-9 text-sm',
                                "data-testid": testIdPrefix ? `${testIdPrefix}-max` : undefined
                            }, void 0, false, {
                                fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                        lineNumber: 51,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
                lineNumber: 35,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/components/filters/RangeNumberInput.tsx",
        lineNumber: 31,
        columnNumber: 5
    }, this);
}
_c = RangeNumberInput;
var _c;
__turbopack_context__.k.register(_c, "RangeNumberInput");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/calculate.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "calculateHealth",
    ()=>calculateHealth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
;
const clamp = (n)=>Math.min(100, Math.max(0, n));
const STATUS_RANK = {
    saudavel: 0,
    atencao: 1,
    risco: 2
};
function statusFromScore(score) {
    if (score >= __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_THRESHOLDS"].saudavel) return 'saudavel';
    if (score >= __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_THRESHOLDS"].atencao) return 'atencao';
    return 'risco';
}
function severityFromValue(value) {
    if (value < __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_THRESHOLDS"].individualRisco) return 'risco';
    if (value < __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_THRESHOLDS"].individualAtencao) return 'atencao';
    return 'saudavel';
}
const REASON_TEMPLATES = {
    atraso: {
        atencao: 'Cronograma com atrasos pontuais',
        risco: 'Cronograma significativamente atrasado'
    },
    financeiro: {
        atencao: 'Indicadores financeiros desalinhados',
        risco: 'Situação financeira crítica'
    },
    tarefas: {
        atencao: 'Tarefas com baixa execução recente',
        risco: 'Muitas tarefas pendentes ou bloqueadas'
    }
};
function calculateHealth(factorsInput, updatedAt = new Date().toISOString()) {
    const factors = {
        atraso: clamp(factorsInput.atraso),
        financeiro: clamp(factorsInput.financeiro),
        tarefas: clamp(factorsInput.tarefas)
    };
    const score = Math.round(factors.atraso * __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_WEIGHTS"].atraso + factors.financeiro * __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_WEIGHTS"].financeiro + factors.tarefas * __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_WEIGHTS"].tarefas);
    let status = statusFromScore(score);
    const reasons = [];
    Object.keys(factors).forEach((key)=>{
        const severity = severityFromValue(factors[key]);
        if (severity === 'saudavel') return;
        if (STATUS_RANK[severity] > STATUS_RANK[status]) status = severity;
        reasons.push({
            fator: key,
            severidade: severity,
            mensagem: REASON_TEMPLATES[key][severity]
        });
    });
    return {
        status,
        score,
        factors,
        reasons,
        updatedAt
    };
}
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/components/HealthBadge.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HealthBadge",
    ()=>HealthBadge
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
'use client';
;
;
;
function HealthBadge({ status, size = 'sm', showLabel = true, variant = 'subtle', className }) {
    const badgeClass = variant === 'solid' ? __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_BADGE_SOLID_CLASSES"][status] : __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_BADGE_CLASSES"][status];
    const dotClass = variant === 'solid' ? __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_DOT_SOLID_CLASSES"][status] : __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_DOT_CLASSES"][status];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "data-testid": `health-badge-${status}`,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('inline-flex items-center gap-1.5 rounded-full border font-semibold', size === 'sm' ? 'text-[10px] px-2 py-0.5' : 'text-xs px-2.5 py-1', badgeClass, className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-full', size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2', dotClass)
            }, void 0, false, {
                fileName: "[project]/features/shared/health/components/HealthBadge.tsx",
                lineNumber: 41,
                columnNumber: 7
            }, this),
            showLabel && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "uppercase tracking-wider",
                children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_LABELS"][status]
            }, void 0, false, {
                fileName: "[project]/features/shared/health/components/HealthBadge.tsx",
                lineNumber: 42,
                columnNumber: 21
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/health/components/HealthBadge.tsx",
        lineNumber: 32,
        columnNumber: 5
    }, this);
}
_c = HealthBadge;
var _c;
__turbopack_context__.k.register(_c, "HealthBadge");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/components/HealthCard.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HealthCard",
    ()=>HealthCard
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ProgressBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/ProgressBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/shared/components/icons.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiAlertLine__as__IconWarning$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiAlertLine as IconWarning>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCheckboxCircleLine__as__IconCheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiCheckboxCircleLine as IconCheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiErrorWarningLine__as__IconErrorOutline$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiErrorWarningLine as IconErrorOutline>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthBadge.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
const STATUS_ICON = {
    saudavel: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCheckboxCircleLine__as__IconCheckCircle$3e$__["IconCheckCircle"],
    atencao: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiAlertLine__as__IconWarning$3e$__["IconWarning"],
    risco: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiErrorWarningLine__as__IconErrorOutline$3e$__["IconErrorOutline"]
};
const FACTORS = [
    'atraso',
    'financeiro',
    'tarefas'
];
function HealthCard({ health, className, luminous = false }) {
    const StatusIcon = STATUS_ICON[health.status];
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            y: 8
        },
        animate: {
            opacity: 1,
            y: 0
        },
        transition: {
            duration: 0.25
        },
        className: className,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(luminous && 'luminous-section border-transparent shadow-none'),
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                    className: "flex flex-row items-start justify-between gap-4 space-y-0",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex items-start gap-3",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('p-2.5 rounded-lg border', __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_BADGE_CLASSES"][health.status]),
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusIcon, {
                                        className: "w-5 h-5"
                                    }, void 0, false, {
                                        fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                        lineNumber: 40,
                                        columnNumber: 15
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                    lineNumber: 39,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                            className: "text-base flex items-center gap-2",
                                            children: [
                                                "Saúde da obra",
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HealthBadge"], {
                                                    status: health.status,
                                                    size: "sm"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                                    lineNumber: 45,
                                                    columnNumber: 17
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                            lineNumber: 43,
                                            columnNumber: 15
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                            className: "mt-1",
                                            children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_DESCRIPTIONS"][health.status]
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                            lineNumber: 47,
                                            columnNumber: 15
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                    lineNumber: 42,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                            lineNumber: 38,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "text-right",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs text-muted-foreground",
                                    children: "Score"
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                    lineNumber: 51,
                                    columnNumber: 13
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-2xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100",
                                    children: health.score
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                    lineNumber: 52,
                                    columnNumber: 13
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                            lineNumber: 50,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                    lineNumber: 37,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                    className: "space-y-4",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "grid gap-3 sm:grid-cols-3",
                            children: FACTORS.map((key)=>{
                                const value = health.factors[key];
                                const reason = health.reasons.find((r)=>r.fator === key);
                                const color = reason ? __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_PROGRESS_COLOR"][reason.severidade] : 'success';
                                return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "space-y-1.5",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center justify-between text-xs",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-semibold text-gray-700 dark:text-gray-300",
                                                    children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FACTOR_LABELS"][key]
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                                    lineNumber: 64,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "font-bold tabular-nums text-gray-600 dark:text-gray-400",
                                                    children: value
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                                    lineNumber: 65,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                            lineNumber: 63,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ProgressBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProgressBar"], {
                                            value: value,
                                            color: color,
                                            size: "sm"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                            lineNumber: 67,
                                            columnNumber: 19
                                        }, this)
                                    ]
                                }, key, true, {
                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                    lineNumber: 62,
                                    columnNumber: 17
                                }, this);
                            })
                        }, void 0, false, {
                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                            lineNumber: 56,
                            columnNumber: 11
                        }, this),
                        health.reasons.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "border-t pt-3 space-y-1.5",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                    className: "text-xs font-semibold text-muted-foreground uppercase tracking-wider",
                                    children: "Pontos de atenção"
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                    lineNumber: 75,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                    className: "space-y-1",
                                    children: health.reasons.map((r)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                            className: "text-xs text-gray-700 dark:text-gray-300 flex items-center gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HealthBadge"], {
                                                    status: r.severidade,
                                                    size: "sm",
                                                    showLabel: false
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                                    lineNumber: 79,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("strong", {
                                                            children: [
                                                                __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FACTOR_LABELS"][r.fator],
                                                                ":"
                                                            ]
                                                        }, void 0, true, {
                                                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                                            lineNumber: 81,
                                                            columnNumber: 23
                                                        }, this),
                                                        " ",
                                                        r.mensagem
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                                    lineNumber: 80,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, r.fator, true, {
                                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                            lineNumber: 78,
                                            columnNumber: 19
                                        }, this))
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                                    lineNumber: 76,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                            lineNumber: 74,
                            columnNumber: 13
                        }, this),
                        health.reasons.length === 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                            className: "text-xs text-muted-foreground border-t pt-3",
                            children: "Todos os indicadores dentro do esperado."
                        }, void 0, false, {
                            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                            lineNumber: 90,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/health/components/HealthCard.tsx",
                    lineNumber: 55,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/shared/health/components/HealthCard.tsx",
            lineNumber: 36,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/shared/health/components/HealthCard.tsx",
        lineNumber: 30,
        columnNumber: 5
    }, this);
}
_c = HealthCard;
var _c;
__turbopack_context__.k.register(_c, "HealthCard");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/components/HealthDetailPanel.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HealthDetailPanel",
    ()=>HealthDetailPanel
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Area$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/recharts/es6/cartesian/Area.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$AreaChart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/recharts/es6/chart/AreaChart.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/recharts/es6/component/ResponsiveContainer.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/recharts/es6/component/Tooltip.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/recharts/es6/cartesian/XAxis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/recharts/es6/cartesian/YAxis.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ProgressBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/components/ProgressBar.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/shared/components/icons.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCheckboxCircleLine__as__IconCheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiCheckboxCircleLine as IconCheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiAlertLine__as__IconWarning$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiAlertLine as IconWarning>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiErrorWarningLine__as__IconErrorOutline$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiErrorWarningLine as IconErrorOutline>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiArrowRightLine__as__IconArrowForward$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiArrowRightLine as IconArrowForward>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiFocus3Line__as__IconTarget$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiFocus3Line as IconTarget>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiArrowRightUpLine__as__IconTrendingUp$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiArrowRightUpLine as IconTrendingUp>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCalendarLine__as__IconCalendarMonth$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiCalendarLine as IconCalendarMonth>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiMoneyDollarCircleLine__as__IconPayments$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiMoneyDollarCircleLine as IconPayments>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiTaskLine__as__IconTaskAlt$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiTaskLine as IconTaskAlt>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthBadge.tsx [app-client] (ecmascript)");
'use client';
;
;
;
;
;
;
;
;
;
const STATUS_ICON = {
    saudavel: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCheckboxCircleLine__as__IconCheckCircle$3e$__["IconCheckCircle"],
    atencao: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiAlertLine__as__IconWarning$3e$__["IconWarning"],
    risco: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiErrorWarningLine__as__IconErrorOutline$3e$__["IconErrorOutline"]
};
const FACTOR_ICON = {
    atraso: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCalendarLine__as__IconCalendarMonth$3e$__["IconCalendarMonth"],
    financeiro: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiMoneyDollarCircleLine__as__IconPayments$3e$__["IconPayments"],
    tarefas: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiTaskLine__as__IconTaskAlt$3e$__["IconTaskAlt"]
};
const FACTORS = [
    'atraso',
    'financeiro',
    'tarefas'
];
const OVERALL_RECOMMENDATION = {
    saudavel: 'Mantenha o ritmo. Continue monitorando os indicadores para sustentar a saúde da obra.',
    atencao: 'Alguns pontos precisam de atenção nesta semana para evitar escalada de risco.',
    risco: 'Intervenção recomendada imediatamente. Priorize ações de mitigação para recuperar a saúde da obra.'
};
function HealthDetailPanel({ health, actionsByFactor, className, luminous = false }) {
    const luminousClass = luminous ? 'luminous-section border-transparent shadow-none' : '';
    const StatusIcon = STATUS_ICON[health.status];
    const scoreFactorsCount = health.reasons.length;
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-6', className),
        "data-testid": "health-detail-panel",
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 8
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    duration: 0.25
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: luminousClass,
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                        className: "p-6 md:p-8",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            className: "flex flex-col md:flex-row items-start md:items-center gap-6",
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-24 h-24 rounded-full border-2 flex flex-col items-center justify-center flex-shrink-0', __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_BADGE_CLASSES"][health.status]),
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(StatusIcon, {
                                            className: "w-5 h-5 mb-1"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 74,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-2xl font-extrabold tabular-nums leading-none",
                                            children: health.score
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 75,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-[10px] font-semibold uppercase tracking-wider opacity-80 mt-0.5",
                                            children: "score"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 76,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 68,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                    className: "flex-1 min-w-0",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-center gap-2 flex-wrap mb-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HealthBadge"], {
                                                    status: health.status,
                                                    size: "md"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 80,
                                                    columnNumber: 19
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs text-muted-foreground",
                                                    children: scoreFactorsCount === 0 ? 'Todos os indicadores dentro do esperado' : `${scoreFactorsCount} ${scoreFactorsCount === 1 ? 'ponto requer' : 'pontos requerem'} atenção`
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 81,
                                                    columnNumber: 19
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 79,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                                            className: "text-xl font-extrabold text-gray-900 dark:text-gray-100 tracking-tight",
                                            children: [
                                                __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_LABELS"][health.status],
                                                ": ",
                                                __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_DESCRIPTIONS"][health.status]
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 87,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-sm text-muted-foreground mt-2",
                                            children: OVERALL_RECOMMENDATION[health.status]
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 90,
                                            columnNumber: 17
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-gray-400 mt-3",
                                            children: [
                                                "Última avaliação: ",
                                                new Date(health.updatedAt).toLocaleString('pt-BR')
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 91,
                                            columnNumber: 17
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 78,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                            lineNumber: 67,
                            columnNumber: 13
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                        lineNumber: 66,
                        columnNumber: 11
                    }, this)
                }, void 0, false, {
                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                    lineNumber: 65,
                    columnNumber: 9
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                lineNumber: 64,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: "grid gap-4 md:grid-cols-3",
                children: FACTORS.map((key, idx)=>{
                    const value = health.factors[key];
                    const reason = health.reasons.find((r)=>r.fator === key);
                    const severity = reason?.severidade ?? 'saudavel';
                    const color = __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_PROGRESS_COLOR"][severity];
                    const drivers = health.drivers?.[key] ?? [];
                    const action = actionsByFactor?.[key];
                    const FactorIcon = FACTOR_ICON[key];
                    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                        initial: {
                            opacity: 0,
                            y: 8
                        },
                        animate: {
                            opacity: 1,
                            y: 0
                        },
                        transition: {
                            duration: 0.25,
                            delay: idx * 0.05
                        },
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('h-full flex flex-col', luminousClass),
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                                    className: "pb-3",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                        className: "flex items-start justify-between gap-2",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                className: "flex items-center gap-2",
                                                children: [
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('p-2 rounded-lg border', __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_BADGE_CLASSES"][severity]),
                                                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(FactorIcon, {
                                                            className: "w-4 h-4"
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                            lineNumber: 123,
                                                            columnNumber: 25
                                                        }, this)
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                        lineNumber: 122,
                                                        columnNumber: 23
                                                    }, this),
                                                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                                        className: "text-sm",
                                                        children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["FACTOR_LABELS"][key]
                                                    }, void 0, false, {
                                                        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                        lineNumber: 125,
                                                        columnNumber: 23
                                                    }, this)
                                                ]
                                            }, void 0, true, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 121,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HealthBadge"], {
                                                status: severity,
                                                size: "sm",
                                                showLabel: false
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 127,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                        lineNumber: 120,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 119,
                                    columnNumber: 17
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                                    className: "flex-1 flex flex-col gap-4",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "flex items-baseline gap-2",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-3xl font-extrabold tabular-nums text-gray-900 dark:text-gray-100",
                                                    children: value
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 132,
                                                    columnNumber: 21
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                    className: "text-xs text-muted-foreground",
                                                    children: "/ 100"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 135,
                                                    columnNumber: 21
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 131,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$components$2f$ProgressBar$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ProgressBar"], {
                                            value: value,
                                            color: color,
                                            size: "md"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 137,
                                            columnNumber: 19
                                        }, this),
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                            className: "text-xs text-muted-foreground",
                                            children: reason?.mensagem ?? 'Indicador dentro do esperado.'
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 138,
                                            columnNumber: 19
                                        }, this),
                                        drivers.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                            className: "space-y-1.5",
                                            children: [
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                                                    className: "text-[11px] font-semibold text-muted-foreground uppercase tracking-wider",
                                                    children: "Evidências"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 144,
                                                    columnNumber: 23
                                                }, this),
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                                    className: "space-y-1",
                                                    children: drivers.map((d, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                                            className: "text-xs text-gray-700 dark:text-gray-300 flex items-start gap-2",
                                                            children: [
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-1.5 h-1.5 rounded-full mt-1.5 flex-shrink-0', severity === 'risco' ? 'bg-red-500' : severity === 'atencao' ? 'bg-amber-500' : 'bg-green-500')
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                                    lineNumber: 153,
                                                                    columnNumber: 29
                                                                }, this),
                                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                                    children: d
                                                                }, void 0, false, {
                                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                                    lineNumber: 163,
                                                                    columnNumber: 29
                                                                }, this)
                                                            ]
                                                        }, i, true, {
                                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                            lineNumber: 149,
                                                            columnNumber: 27
                                                        }, this))
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 147,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 143,
                                            columnNumber: 21
                                        }, this),
                                        action && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("button", {
                                            type: "button",
                                            onClick: action.onClick,
                                            className: "mt-auto inline-flex items-center gap-1.5 text-xs font-semibold text-primary hover:underline cursor-pointer self-start",
                                            "data-testid": `health-factor-action-${key}`,
                                            children: [
                                                action.label,
                                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiArrowRightLine__as__IconArrowForward$3e$__["IconArrowForward"], {
                                                    className: "w-3.5 h-3.5"
                                                }, void 0, false, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 178,
                                                    columnNumber: 23
                                                }, this)
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 171,
                                            columnNumber: 21
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 130,
                                    columnNumber: 17
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                            lineNumber: 118,
                            columnNumber: 15
                        }, this)
                    }, key, false, {
                        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                        lineNumber: 112,
                        columnNumber: 13
                    }, this);
                })
            }, void 0, false, {
                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                lineNumber: 101,
                columnNumber: 7
            }, this),
            health.trend && health.trend.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 8
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    duration: 0.25,
                    delay: 0.15
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: luminousClass,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                    className: "text-base flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiArrowRightUpLine__as__IconTrendingUp$3e$__["IconTrendingUp"], {
                                            className: "w-4 h-4 text-primary"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 198,
                                            columnNumber: 17
                                        }, this),
                                        "Evolução do score"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 197,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                    children: "Últimos 6 meses — comparação do score geral da obra."
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 201,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                            lineNumber: 196,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                                className: "h-40",
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$component$2f$ResponsiveContainer$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ResponsiveContainer"], {
                                    width: "100%",
                                    height: "100%",
                                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$chart$2f$AreaChart$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["AreaChart"], {
                                        data: health.trend,
                                        margin: {
                                            top: 4,
                                            right: 8,
                                            left: 0,
                                            bottom: 0
                                        },
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("defs", {
                                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("linearGradient", {
                                                    id: "health-trend-gradient",
                                                    x1: "0",
                                                    y1: "0",
                                                    x2: "0",
                                                    y2: "1",
                                                    children: [
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                            offset: "5%",
                                                            stopColor: "#22846D",
                                                            stopOpacity: 0.35
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                            lineNumber: 209,
                                                            columnNumber: 25
                                                        }, this),
                                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("stop", {
                                                            offset: "95%",
                                                            stopColor: "#22846D",
                                                            stopOpacity: 0
                                                        }, void 0, false, {
                                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                            lineNumber: 210,
                                                            columnNumber: 25
                                                        }, this)
                                                    ]
                                                }, void 0, true, {
                                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                    lineNumber: 208,
                                                    columnNumber: 23
                                                }, this)
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 207,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$XAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["XAxis"], {
                                                dataKey: "date",
                                                stroke: "currentColor",
                                                fontSize: 11,
                                                tickLine: false,
                                                axisLine: false,
                                                className: "text-muted-foreground"
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 213,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$YAxis$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["YAxis"], {
                                                domain: [
                                                    0,
                                                    100
                                                ],
                                                hide: true
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 221,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$component$2f$Tooltip$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Tooltip"], {
                                                formatter: (value)=>[
                                                        `${value} pts`,
                                                        'Score'
                                                    ],
                                                contentStyle: {
                                                    borderRadius: 8,
                                                    fontSize: 12
                                                }
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 222,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$recharts$2f$es6$2f$cartesian$2f$Area$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Area"], {
                                                type: "monotone",
                                                dataKey: "score",
                                                stroke: "#22846D",
                                                strokeWidth: 2,
                                                fill: "url(#health-trend-gradient)"
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 226,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, void 0, true, {
                                        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                        lineNumber: 206,
                                        columnNumber: 19
                                    }, this)
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 205,
                                    columnNumber: 17
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                lineNumber: 204,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                            lineNumber: 203,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                    lineNumber: 195,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                lineNumber: 190,
                columnNumber: 9
            }, this),
            health.recommendations && health.recommendations.length > 0 && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
                initial: {
                    opacity: 0,
                    y: 8
                },
                animate: {
                    opacity: 1,
                    y: 0
                },
                transition: {
                    duration: 0.25,
                    delay: 0.2
                },
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
                    className: luminousClass,
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardHeader"], {
                            children: [
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardTitle"], {
                                    className: "text-base flex items-center gap-2",
                                    children: [
                                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiFocus3Line__as__IconTarget$3e$__["IconTarget"], {
                                            className: "w-4 h-4 text-primary"
                                        }, void 0, false, {
                                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                            lineNumber: 251,
                                            columnNumber: 17
                                        }, this),
                                        "Recomendações de ação"
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 250,
                                    columnNumber: 15
                                }, this),
                                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardDescription"], {
                                    children: "Ações sugeridas com base no estado atual dos indicadores."
                                }, void 0, false, {
                                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                    lineNumber: 254,
                                    columnNumber: 15
                                }, this)
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                            lineNumber: 249,
                            columnNumber: 13
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
                            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
                                className: "space-y-2",
                                children: health.recommendations.map((rec, i)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
                                        className: "text-sm text-gray-700 dark:text-gray-300 flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800/50",
                                        children: [
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                className: "w-6 h-6 rounded-full bg-primary/10 text-primary text-xs font-bold flex items-center justify-center flex-shrink-0",
                                                children: i + 1
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 265,
                                                columnNumber: 21
                                            }, this),
                                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                                children: rec
                                            }, void 0, false, {
                                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                                lineNumber: 268,
                                                columnNumber: 21
                                            }, this)
                                        ]
                                    }, i, true, {
                                        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                        lineNumber: 261,
                                        columnNumber: 19
                                    }, this))
                            }, void 0, false, {
                                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                                lineNumber: 259,
                                columnNumber: 15
                            }, this)
                        }, void 0, false, {
                            fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                            lineNumber: 258,
                            columnNumber: 13
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                    lineNumber: 248,
                    columnNumber: 11
                }, this)
            }, void 0, false, {
                fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
                lineNumber: 243,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/health/components/HealthDetailPanel.tsx",
        lineNumber: 62,
        columnNumber: 5
    }, this);
}
_c = HealthDetailPanel;
var _c;
__turbopack_context__.k.register(_c, "HealthDetailPanel");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/components/HealthFilterSelect.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HealthFilterSelect",
    ()=>HealthFilterSelect
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/select.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/urls.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
;
const ALL_VALUE = '__all__';
const STATUSES = [
    'saudavel',
    'atencao',
    'risco'
];
function HealthFilterSelect({ value, onChange, summary, label = 'Saúde', className }) {
    function handleChange(next) {
        if (next === ALL_VALUE) {
            onChange(undefined);
        } else {
            onChange((0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseHealthStatus"])(next));
        }
    }
    const renderOption = (status)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectItem"], {
            value: status,
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "inline-flex items-center gap-2",
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-2 h-2 rounded-full', __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_DOT_CLASSES"][status])
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                        lineNumber: 40,
                        columnNumber: 9
                    }, this),
                    __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_LABELS"][status],
                    summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-muted-foreground",
                        children: [
                            "(",
                            summary[status],
                            ")"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                        lineNumber: 42,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                lineNumber: 39,
                columnNumber: 7
            }, this)
        }, status, false, {
            fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
            lineNumber: 38,
            columnNumber: 5
        }, this);
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('space-y-1.5', className),
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("label", {
                className: "text-xs font-semibold text-gray-600 dark:text-gray-400 uppercase tracking-wider",
                children: label
            }, void 0, false, {
                fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                lineNumber: 49,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Select"], {
                value: value ?? ALL_VALUE,
                onValueChange: handleChange,
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectTrigger"], {
                        "data-testid": "health-filter-select",
                        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectValue"], {}, void 0, false, {
                            fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                            lineNumber: 54,
                            columnNumber: 11
                        }, this)
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                        lineNumber: 53,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectContent"], {
                        children: [
                            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$select$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["SelectItem"], {
                                value: ALL_VALUE,
                                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                    className: "inline-flex items-center gap-2",
                                    children: [
                                        "Todas ",
                                        summary && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                                            className: "text-muted-foreground",
                                            children: [
                                                "(",
                                                summary.total,
                                                ")"
                                            ]
                                        }, void 0, true, {
                                            fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                                            lineNumber: 59,
                                            columnNumber: 33
                                        }, this)
                                    ]
                                }, void 0, true, {
                                    fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                                    lineNumber: 58,
                                    columnNumber: 13
                                }, this)
                            }, void 0, false, {
                                fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                                lineNumber: 57,
                                columnNumber: 11
                            }, this),
                            STATUSES.map(renderOption)
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                        lineNumber: 56,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
                lineNumber: 52,
                columnNumber: 7
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/health/components/HealthFilterSelect.tsx",
        lineNumber: 48,
        columnNumber: 5
    }, this);
}
_c = HealthFilterSelect;
var _c;
__turbopack_context__.k.register(_c, "HealthFilterSelect");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/components/HealthSummary.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HealthSummary",
    ()=>HealthSummary
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/client/app-dir/link.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/framer-motion/dist/es/render/components/motion/proxy.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/card.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$icons$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/shared/components/icons.tsx [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCheckboxCircleLine__as__IconCheckCircle$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiCheckboxCircleLine as IconCheckCircle>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiAlertLine__as__IconWarning$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiAlertLine as IconWarning>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiErrorWarningLine__as__IconErrorOutline$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiErrorWarningLine as IconErrorOutline>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiArrowRightLine__as__IconArrowForward$3e$__ = __turbopack_context__.i("[project]/node_modules/react-icons/ri/index.mjs [app-client] (ecmascript) <export RiArrowRightLine as IconArrowForward>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
'use client';
;
;
;
;
;
;
;
const ITEMS = [
    {
        key: 'saudavel',
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiCheckboxCircleLine__as__IconCheckCircle$3e$__["IconCheckCircle"]
    },
    {
        key: 'atencao',
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiAlertLine__as__IconWarning$3e$__["IconWarning"]
    },
    {
        key: 'risco',
        Icon: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiErrorWarningLine__as__IconErrorOutline$3e$__["IconErrorOutline"]
    }
];
function HealthSummaryItemContent({ status, Icon, count, pct, index, interactive, luminous = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$framer$2d$motion$2f$dist$2f$es$2f$render$2f$components$2f$motion$2f$proxy$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["motion"].div, {
        initial: {
            opacity: 0,
            y: 6
        },
        animate: {
            opacity: 1,
            y: 0
        },
        transition: {
            delay: index * 0.05,
            duration: 0.2
        },
        whileHover: interactive ? {
            y: -2
        } : undefined,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('rounded-xl border p-4 flex flex-col gap-2 h-full', __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_BADGE_CLASSES"][status], interactive && 'cursor-pointer transition-shadow hover:shadow-md', luminous && 'luminous-card group overflow-hidden'),
        children: [
            luminous && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Fragment"], {
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: "pointer-events-none absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-current to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-[2]"
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                        lineNumber: 57,
                        columnNumber: 11
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        "aria-hidden": true,
                        className: "pointer-events-none absolute inset-0 bg-gradient-to-b from-current/[0.04] to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500 z-0"
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                        lineNumber: 62,
                        columnNumber: 11
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                lineNumber: 55,
                columnNumber: 9
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('flex items-center justify-between', luminous && 'relative z-10'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(Icon, {
                        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('w-4 h-4', luminous && 'transition-transform duration-300 group-hover:scale-110')
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                        lineNumber: 69,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                        className: "text-[10px] font-bold uppercase tracking-wider opacity-80",
                        children: [
                            pct,
                            "%"
                        ]
                    }, void 0, true, {
                        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                        lineNumber: 70,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                lineNumber: 68,
                columnNumber: 7
            }, this),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(luminous && 'relative z-10'),
                children: [
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-2xl font-extrabold tabular-nums",
                        children: count
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                        lineNumber: 73,
                        columnNumber: 9
                    }, this),
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("p", {
                        className: "text-[11px] font-semibold uppercase tracking-wider opacity-90",
                        children: __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_LABELS"][status]
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                        lineNumber: 74,
                        columnNumber: 9
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                lineNumber: 72,
                columnNumber: 7
            }, this),
            interactive && /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])('mt-auto flex items-center gap-1 text-[10px] font-semibold uppercase tracking-wider opacity-80', luminous && 'relative z-10'),
                children: [
                    "Ver obras ",
                    /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$ri$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$export__RiArrowRightLine__as__IconArrowForward$3e$__["IconArrowForward"], {
                        className: "w-3 h-3"
                    }, void 0, false, {
                        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                        lineNumber: 78,
                        columnNumber: 21
                    }, this)
                ]
            }, void 0, true, {
                fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                lineNumber: 77,
                columnNumber: 9
            }, this)
        ]
    }, void 0, true, {
        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
        lineNumber: 42,
        columnNumber: 5
    }, this);
}
_c = HealthSummaryItemContent;
function HealthSummary({ summary, title = 'Saúde do portfólio de obras', className, hrefFor, luminous = false }) {
    return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Card"], {
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])(luminous && 'luminous-section border-transparent shadow-none', className),
        "data-testid": "health-summary",
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$card$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["CardContent"], {
            className: "p-6 space-y-4",
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "flex items-center justify-between",
                    children: [
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("h3", {
                            className: "text-sm font-bold text-gray-900 dark:text-gray-100",
                            children: title
                        }, void 0, false, {
                            fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                            lineNumber: 99,
                            columnNumber: 11
                        }, this),
                        /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                            className: "text-xs text-muted-foreground",
                            children: [
                                summary.total,
                                " obras"
                            ]
                        }, void 0, true, {
                            fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                            lineNumber: 100,
                            columnNumber: 11
                        }, this)
                    ]
                }, void 0, true, {
                    fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                    lineNumber: 98,
                    columnNumber: 9
                }, this),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                    className: "grid grid-cols-3 gap-3",
                    children: ITEMS.map(({ key, Icon }, idx)=>{
                        const count = summary[key];
                        const pct = summary.total ? Math.round(count / summary.total * 100) : 0;
                        const href = hrefFor?.(key);
                        const interactive = Boolean(href);
                        const item = /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(HealthSummaryItemContent, {
                            status: key,
                            Icon: Icon,
                            count: count,
                            pct: pct,
                            index: idx,
                            interactive: interactive,
                            luminous: luminous
                        }, void 0, false, {
                            fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                            lineNumber: 110,
                            columnNumber: 15
                        }, this);
                        if (href) {
                            return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$client$2f$app$2d$dir$2f$link$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["default"], {
                                href: href,
                                className: "block focus:outline-none focus-visible:ring-2 focus-visible:ring-primary rounded-xl",
                                "data-testid": `health-summary-link-${key}`,
                                children: item
                            }, key, false, {
                                fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                                lineNumber: 123,
                                columnNumber: 17
                            }, this);
                        }
                        return /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
                            children: item
                        }, key, false, {
                            fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                            lineNumber: 133,
                            columnNumber: 20
                        }, this);
                    })
                }, void 0, false, {
                    fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
                    lineNumber: 102,
                    columnNumber: 9
                }, this)
            ]
        }, void 0, true, {
            fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
            lineNumber: 97,
            columnNumber: 7
        }, this)
    }, void 0, false, {
        fileName: "[project]/features/shared/health/components/HealthSummary.tsx",
        lineNumber: 93,
        columnNumber: 5
    }, this);
}
_c1 = HealthSummary;
var _c, _c1;
__turbopack_context__.k.register(_c, "HealthSummaryItemContent");
__turbopack_context__.k.register(_c1, "HealthSummary");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/compute-from-obra.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "computeHealthFromObra",
    ()=>computeHealthFromObra
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$calculate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/features/shared/health/calculate.ts [app-client] (ecmascript) <locals>");
;
function clamp(n) {
    return Math.min(100, Math.max(0, n));
}
function computeHealthFromObra(obra) {
    const atraso = clamp(100 - obra.diasAtraso * 4);
    const total = obra.financeiro.valorTotal || obra.financeiro.valorContratado || 0;
    const pagoRatio = total > 0 ? Math.min(1, obra.valorPago / total) : 0;
    const progRatio = Math.min(1, (obra.progresso || 0) / 100);
    // Saudável quando pagamento acompanha execução (gap baixo).
    const gap = Math.abs(progRatio - pagoRatio);
    const financeiro = clamp(100 - gap * 120);
    let tarefas;
    if (obra.tarefasTotal > 0) {
        const concluidas = Math.max(0, obra.tarefasTotal - obra.tarefasPendentes);
        tarefas = clamp(concluidas / obra.tarefasTotal * 100 - obra.problemasAbertos * 8);
    } else if (obra.problemasAbertos > 0) {
        tarefas = clamp(70 - obra.problemasAbertos * 10);
    } else {
        tarefas = 100;
    }
    const iso = obra.updatedAt instanceof Date ? obra.updatedAt.toISOString() : typeof obra.updatedAt === 'string' ? obra.updatedAt : new Date().toISOString();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$calculate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__["calculateHealth"])({
        atraso,
        financeiro,
        tarefas
    }, iso);
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/constants.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "FACTOR_LABELS",
    ()=>FACTOR_LABELS,
    "HEALTH_BADGE_CLASSES",
    ()=>HEALTH_BADGE_CLASSES,
    "HEALTH_BADGE_SOLID_CLASSES",
    ()=>HEALTH_BADGE_SOLID_CLASSES,
    "HEALTH_DESCRIPTIONS",
    ()=>HEALTH_DESCRIPTIONS,
    "HEALTH_DOT_CLASSES",
    ()=>HEALTH_DOT_CLASSES,
    "HEALTH_DOT_SOLID_CLASSES",
    ()=>HEALTH_DOT_SOLID_CLASSES,
    "HEALTH_LABELS",
    ()=>HEALTH_LABELS,
    "HEALTH_PROGRESS_COLOR",
    ()=>HEALTH_PROGRESS_COLOR,
    "HEALTH_THRESHOLDS",
    ()=>HEALTH_THRESHOLDS,
    "HEALTH_WEIGHTS",
    ()=>HEALTH_WEIGHTS
]);
const HEALTH_LABELS = {
    saudavel: 'Saudável',
    atencao: 'Atenção',
    risco: 'Risco'
};
const HEALTH_DESCRIPTIONS = {
    saudavel: 'Obra em ritmo saudável, sem indicadores críticos.',
    atencao: 'Obra requer atenção em um ou mais indicadores.',
    risco: 'Obra em risco — intervenção recomendada.'
};
const HEALTH_BADGE_CLASSES = {
    saudavel: 'bg-green-500/15 text-green-700 dark:text-green-400 border-green-500/30',
    atencao: 'bg-amber-500/15 text-amber-700 dark:text-amber-400 border-amber-500/30',
    risco: 'bg-red-500/15 text-red-700 dark:text-red-400 border-red-500/30'
};
const HEALTH_BADGE_SOLID_CLASSES = {
    saudavel: 'bg-emerald-600/95 text-white border-emerald-700/40 shadow-sm',
    atencao: 'bg-amber-500/95 text-white border-amber-600/40 shadow-sm',
    risco: 'bg-red-600/95 text-white border-red-700/40 shadow-sm'
};
const HEALTH_DOT_CLASSES = {
    saudavel: 'bg-green-500',
    atencao: 'bg-amber-500',
    risco: 'bg-red-500'
};
const HEALTH_DOT_SOLID_CLASSES = {
    saudavel: 'bg-white',
    atencao: 'bg-white',
    risco: 'bg-white'
};
const HEALTH_PROGRESS_COLOR = {
    saudavel: 'success',
    atencao: 'warning',
    risco: 'error'
};
const FACTOR_LABELS = {
    atraso: 'Cronograma',
    financeiro: 'Financeiro',
    tarefas: 'Tarefas'
};
const HEALTH_THRESHOLDS = {
    saudavel: 75,
    atencao: 60,
    individualRisco: 40,
    individualAtencao: 60
};
const HEALTH_WEIGHTS = {
    atraso: 0.4,
    financeiro: 0.35,
    tarefas: 0.25
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/hooks/use-obra-health.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useObraHealth",
    ()=>useObraHealth
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useObraHealth(obraId) {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            'obra',
            'health',
            obraId
        ],
        queryFn: {
            "useObraHealth.useQuery": async ()=>{
                const res = await fetch(`/api/obras/${obraId}/health`);
                if (!res.ok) throw new Error('Erro ao buscar saúde da obra');
                return res.json();
            }
        }["useObraHealth.useQuery"],
        enabled: Boolean(obraId),
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false
    });
}
_s(useObraHealth, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/hooks/use-obras-health.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "summarizeHealthMap",
    ()=>summarizeHealthMap,
    "useObrasHealthMap",
    ()=>useObrasHealthMap
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@tanstack/react-query/build/modern/useQuery.js [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
;
function useObrasHealthMap(persona) {
    _s();
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"])({
        queryKey: [
            persona,
            'obras-health'
        ],
        queryFn: {
            "useObrasHealthMap.useQuery": async ()=>{
                const res = await fetch(`/api/${persona}/obras-health`);
                if (!res.ok) throw new Error('Erro ao buscar saúde das obras');
                return res.json();
            }
        }["useObrasHealthMap.useQuery"],
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false
    });
}
_s(useObrasHealthMap, "4ZpngI1uv+Uo3WQHEZmTQ5FNM+k=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$tanstack$2f$react$2d$query$2f$build$2f$modern$2f$useQuery$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useQuery"]
    ];
});
function summarizeHealthMap(map) {
    const values = Object.values(map ?? {});
    const summary = {
        saudavel: 0,
        atencao: 0,
        risco: 0,
        total: values.length
    };
    for (const h of values)summary[h.status] += 1;
    return summary;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/hooks/use-saude-filter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSaudeFilter",
    ()=>useSaudeFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/urls.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function useSaudeFilter() {
    _s();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseHealthStatus"])(searchParams?.get(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_QUERY_PARAM"]));
    const setValue = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSaudeFilter.useCallback[setValue]": (next)=>{
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            if (next) {
                params.set(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_QUERY_PARAM"], next);
            } else {
                params.delete(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_QUERY_PARAM"]);
            }
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname ?? '');
        }
    }["useSaudeFilter.useCallback[setValue]"], [
        pathname,
        router,
        searchParams
    ]);
    return {
        value,
        setValue
    };
}
_s(useSaudeFilter, "GEcCxg2Xt2CyTM1ilUnaQYjy0Zs=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/hooks/use-saude-multi-filter.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "useSaudeMultiFilter",
    ()=>useSaudeMultiFilter
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/navigation.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/urls.ts [app-client] (ecmascript)");
var _s = __turbopack_context__.k.signature();
'use client';
;
;
;
function useSaudeMultiFilter() {
    _s();
    const searchParams = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"])();
    const router = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"])();
    const pathname = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"])();
    const raw = searchParams?.get(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_QUERY_PARAM"]) ?? '';
    const values = raw.split(',').map((token)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["parseHealthStatus"])(token.trim())).filter((v)=>v !== undefined);
    const setValues = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useCallback"])({
        "useSaudeMultiFilter.useCallback[setValues]": (next)=>{
            const params = new URLSearchParams(searchParams?.toString() ?? '');
            if (next.length > 0) {
                params.set(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_QUERY_PARAM"], next.join(','));
            } else {
                params.delete(__TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["HEALTH_QUERY_PARAM"]);
            }
            const qs = params.toString();
            router.replace(qs ? `${pathname}?${qs}` : pathname ?? '');
        }
    }["useSaudeMultiFilter.useCallback[setValues]"], [
        pathname,
        router,
        searchParams
    ]);
    return {
        values,
        setValues
    };
}
_s(useSaudeMultiFilter, "0J33dY3TVoMmmDNzHYNqt2LldJk=", false, function() {
    return [
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useSearchParams"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["useRouter"],
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$navigation$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["usePathname"]
    ];
});
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/index.ts [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$calculate$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/features/shared/health/calculate.ts [app-client] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$compute$2d$from$2d$obra$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/compute-from-obra.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$constants$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/constants.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$urls$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/urls.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obras$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/hooks/use-obras-health.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$obra$2d$health$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/hooks/use-obra-health.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$saude$2d$filter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/hooks/use-saude-filter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$hooks$2f$use$2d$saude$2d$multi$2d$filter$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/hooks/use-saude-multi-filter.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthBadge$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthBadge.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthCard$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthCard.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthSummary$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthSummary.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthDetailPanel$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthDetailPanel.tsx [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$features$2f$shared$2f$health$2f$components$2f$HealthFilterSelect$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/features/shared/health/components/HealthFilterSelect.tsx [app-client] (ecmascript)");
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
;
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/features/shared/health/urls.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HEALTH_QUERY_PARAM",
    ()=>HEALTH_QUERY_PARAM,
    "buildObrasHealthUrl",
    ()=>buildObrasHealthUrl,
    "parseHealthStatus",
    ()=>parseHealthStatus
]);
const HEALTH_QUERY_PARAM = 'saude';
const VALID_STATUSES = [
    'saudavel',
    'atencao',
    'risco'
];
function parseHealthStatus(value) {
    if (!value) return undefined;
    return VALID_STATUSES.includes(value) ? value : undefined;
}
function buildObrasHealthUrl(basePath, status) {
    return `${basePath}?${HEALTH_QUERY_PARAM}=${status}`;
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/components/icons.tsx [app-client] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/**
 * Central icon registry — all icons used in the app are exported from here.
 * To swap icon libraries in the future, update this file only.
 * All icons come from react-icons/ri (Remix Icons).
 */ __turbopack_context__.s([]);
;
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/components/ui/card.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Card",
    ()=>Card,
    "CardContent",
    ()=>CardContent,
    "CardDescription",
    ()=>CardDescription,
    "CardFooter",
    ()=>CardFooter,
    "CardHeader",
    ()=>CardHeader,
    "CardTitle",
    ()=>CardTitle
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
const Card = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("shadcn-card rounded-xl border bg-card border-card-border text-card-foreground shadow-sm", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/card.tsx",
        lineNumber: 9,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Card;
Card.displayName = "Card";
const CardHeader = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c2 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-col space-y-1.5 p-6", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/card.tsx",
        lineNumber: 24,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = CardHeader;
CardHeader.displayName = "CardHeader";
const CardTitle = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-2xl font-semibold leading-none tracking-tight", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/card.tsx",
        lineNumber: 36,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = CardTitle;
CardTitle.displayName = "CardTitle";
const CardDescription = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("text-sm text-muted-foreground", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/card.tsx",
        lineNumber: 51,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c7 = CardDescription;
CardDescription.displayName = "CardDescription";
const CardContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c8 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/card.tsx",
        lineNumber: 63,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c9 = CardContent;
CardContent.displayName = "CardContent";
const CardFooter = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("div", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center p-6 pt-0", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/card.tsx",
        lineNumber: 71,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c11 = CardFooter;
CardFooter.displayName = "CardFooter";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "Card$React.forwardRef");
__turbopack_context__.k.register(_c1, "Card");
__turbopack_context__.k.register(_c2, "CardHeader$React.forwardRef");
__turbopack_context__.k.register(_c3, "CardHeader");
__turbopack_context__.k.register(_c4, "CardTitle$React.forwardRef");
__turbopack_context__.k.register(_c5, "CardTitle");
__turbopack_context__.k.register(_c6, "CardDescription$React.forwardRef");
__turbopack_context__.k.register(_c7, "CardDescription");
__turbopack_context__.k.register(_c8, "CardContent$React.forwardRef");
__turbopack_context__.k.register(_c9, "CardContent");
__turbopack_context__.k.register(_c10, "CardFooter$React.forwardRef");
__turbopack_context__.k.register(_c11, "CardFooter");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/components/ui/checkbox.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Checkbox",
    ()=>Checkbox
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-checkbox/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/lu/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
;
const Checkbox = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("peer h-4 w-4 shrink-0 rounded-sm border border-primary ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground", className),
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Indicator"], {
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex items-center justify-center text-current"),
            children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuCheck"], {
                className: "h-4 w-4"
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/checkbox.tsx",
                lineNumber: 22,
                columnNumber: 7
            }, ("TURBOPACK compile-time value", void 0))
        }, void 0, false, {
            fileName: "[project]/shared/components/ui/checkbox.tsx",
            lineNumber: 19,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/checkbox.tsx",
        lineNumber: 11,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = Checkbox;
Checkbox.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$checkbox$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"].displayName;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "Checkbox$React.forwardRef");
__turbopack_context__.k.register(_c1, "Checkbox");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/components/ui/pagination.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Pagination",
    ()=>Pagination,
    "PaginationContent",
    ()=>PaginationContent,
    "PaginationEllipsis",
    ()=>PaginationEllipsis,
    "PaginationItem",
    ()=>PaginationItem,
    "PaginationLink",
    ()=>PaginationLink,
    "PaginationNext",
    ()=>PaginationNext,
    "PaginationPrevious",
    ()=>PaginationPrevious
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/lu/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/shared/components/ui/button.tsx [app-client] (ecmascript)");
;
;
;
;
;
const Pagination = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("nav", {
        role: "navigation",
        "aria-label": "pagination",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("mx-auto flex w-full justify-center", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/pagination.tsx",
        lineNumber: 8,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c = Pagination;
Pagination.displayName = "Pagination";
const PaginationContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c1 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("ul", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex flex-row items-center gap-1", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/pagination.tsx",
        lineNumber: 21,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c2 = PaginationContent;
PaginationContent.displayName = "PaginationContent";
const PaginationItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c3 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("li", {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/pagination.tsx",
        lineNumber: 33,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c4 = PaginationItem;
PaginationItem.displayName = "PaginationItem";
const PaginationLink = ({ className, isActive, size = "icon", ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("a", {
        "aria-current": isActive ? "page" : undefined,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$shared$2f$components$2f$ui$2f$button$2e$tsx__$5b$app$2d$client$5d$__$28$ecmascript$29$__["buttonVariants"])({
            variant: isActive ? "outline" : "ghost",
            size
        }), className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/pagination.tsx",
        lineNumber: 48,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c5 = PaginationLink;
PaginationLink.displayName = "PaginationLink";
const PaginationPrevious = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PaginationLink, {
        "aria-label": "Go to previous page",
        size: "default",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("gap-1 pl-2.5", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuChevronLeft"], {
                className: "h-4 w-4"
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/pagination.tsx",
                lineNumber: 72,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: "Previous"
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/pagination.tsx",
                lineNumber: 73,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/shared/components/ui/pagination.tsx",
        lineNumber: 66,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c6 = PaginationPrevious;
PaginationPrevious.displayName = "PaginationPrevious";
const PaginationNext = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(PaginationLink, {
        "aria-label": "Go to next page",
        size: "default",
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("gap-1 pr-2.5", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                children: "Next"
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/pagination.tsx",
                lineNumber: 88,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuChevronRight"], {
                className: "h-4 w-4"
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/pagination.tsx",
                lineNumber: 89,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/shared/components/ui/pagination.tsx",
        lineNumber: 82,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c7 = PaginationNext;
PaginationNext.displayName = "PaginationNext";
const PaginationEllipsis = ({ className, ...props })=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
        "aria-hidden": true,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex h-9 w-9 items-center justify-center", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuEllipsis"], {
                className: "h-4 w-4"
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/pagination.tsx",
                lineNumber: 103,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "sr-only",
                children: "More pages"
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/pagination.tsx",
                lineNumber: 104,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/shared/components/ui/pagination.tsx",
        lineNumber: 98,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0));
_c8 = PaginationEllipsis;
PaginationEllipsis.displayName = "PaginationEllipsis";
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8;
__turbopack_context__.k.register(_c, "Pagination");
__turbopack_context__.k.register(_c1, "PaginationContent$React.forwardRef");
__turbopack_context__.k.register(_c2, "PaginationContent");
__turbopack_context__.k.register(_c3, "PaginationItem$React.forwardRef");
__turbopack_context__.k.register(_c4, "PaginationItem");
__turbopack_context__.k.register(_c5, "PaginationLink");
__turbopack_context__.k.register(_c6, "PaginationPrevious");
__turbopack_context__.k.register(_c7, "PaginationNext");
__turbopack_context__.k.register(_c8, "PaginationEllipsis");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/components/ui/popover.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Popover",
    ()=>Popover,
    "PopoverContent",
    ()=>PopoverContent,
    "PopoverTrigger",
    ()=>PopoverTrigger
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-popover/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
;
;
;
;
const Popover = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"];
const PopoverTrigger = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"];
const PopoverContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, align = "center", sideOffset = 4, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
            ref: ref,
            align: align,
            sideOffset: sideOffset,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("z-50 w-72 rounded-md border bg-popover p-4 text-popover-foreground shadow-md outline-none data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-popover-content-transform-origin]", className),
            ...props
        }, void 0, false, {
            fileName: "[project]/shared/components/ui/popover.tsx",
            lineNumber: 15,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/popover.tsx",
        lineNumber: 14,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = PopoverContent;
PopoverContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$popover$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"].displayName;
;
var _c, _c1;
__turbopack_context__.k.register(_c, "PopoverContent$React.forwardRef");
__turbopack_context__.k.register(_c1, "PopoverContent");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/components/ui/select.tsx [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Select",
    ()=>Select,
    "SelectContent",
    ()=>SelectContent,
    "SelectGroup",
    ()=>SelectGroup,
    "SelectItem",
    ()=>SelectItem,
    "SelectLabel",
    ()=>SelectLabel,
    "SelectScrollDownButton",
    ()=>SelectScrollDownButton,
    "SelectScrollUpButton",
    ()=>SelectScrollUpButton,
    "SelectSeparator",
    ()=>SelectSeparator,
    "SelectTrigger",
    ()=>SelectTrigger,
    "SelectValue",
    ()=>SelectValue
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/jsx-dev-runtime.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/compiled/react/index.js [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@radix-ui/react-select/dist/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/react-icons/lu/index.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/lib/utils.ts [app-client] (ecmascript)");
"use client";
;
;
;
;
;
const Select = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Root"];
const SelectGroup = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Group"];
const SelectValue = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Value"];
const SelectTrigger = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c = ({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex h-9 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background data-[placeholder]:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 [&>span]:line-clamp-1", className),
        ...props,
        children: [
            children,
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Icon"], {
                asChild: true,
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuChevronDown"], {
                    className: "h-4 w-4 opacity-50"
                }, void 0, false, {
                    fileName: "[project]/shared/components/ui/select.tsx",
                    lineNumber: 29,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/select.tsx",
                lineNumber: 28,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/shared/components/ui/select.tsx",
        lineNumber: 19,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c1 = SelectTrigger;
SelectTrigger.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Trigger"].displayName;
const SelectScrollUpButton = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollUpButton"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex cursor-default items-center justify-center py-1", className),
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuChevronUp"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/shared/components/ui/select.tsx",
            lineNumber: 47,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/select.tsx",
        lineNumber: 39,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c2 = SelectScrollUpButton;
SelectScrollUpButton.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollUpButton"].displayName;
const SelectScrollDownButton = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollDownButton"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("flex cursor-default items-center justify-center py-1", className),
        ...props,
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuChevronDown"], {
            className: "h-4 w-4"
        }, void 0, false, {
            fileName: "[project]/shared/components/ui/select.tsx",
            lineNumber: 64,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/select.tsx",
        lineNumber: 56,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c3 = SelectScrollDownButton;
SelectScrollDownButton.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ScrollDownButton"].displayName;
const SelectContent = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c4 = ({ className, children, position = "popper", ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Portal"], {
        children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"], {
            ref: ref,
            className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative z-50 max-h-[--radix-select-content-available-height] min-w-[8rem] overflow-y-auto overflow-x-hidden rounded-md border bg-popover text-popover-foreground shadow-md data-[state=open]:animate-in data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=open]:fade-in-0 data-[state=closed]:zoom-out-95 data-[state=open]:zoom-in-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 origin-[--radix-select-content-transform-origin]", position === "popper" && "data-[side=bottom]:translate-y-1 data-[side=left]:-translate-x-1 data-[side=right]:translate-x-1 data-[side=top]:-translate-y-1", className),
            position: position,
            ...props,
            children: [
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SelectScrollUpButton, {}, void 0, false, {
                    fileName: "[project]/shared/components/ui/select.tsx",
                    lineNumber: 86,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Viewport"], {
                    className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("p-1", position === "popper" && "h-[var(--radix-select-trigger-height)] w-full min-w-[var(--radix-select-trigger-width)]"),
                    children: children
                }, void 0, false, {
                    fileName: "[project]/shared/components/ui/select.tsx",
                    lineNumber: 87,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0)),
                /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(SelectScrollDownButton, {}, void 0, false, {
                    fileName: "[project]/shared/components/ui/select.tsx",
                    lineNumber: 96,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            ]
        }, void 0, true, {
            fileName: "[project]/shared/components/ui/select.tsx",
            lineNumber: 75,
            columnNumber: 5
        }, ("TURBOPACK compile-time value", void 0))
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/select.tsx",
        lineNumber: 74,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c5 = SelectContent;
SelectContent.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Content"].displayName;
const SelectLabel = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c6 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("py-1.5 pl-8 pr-2 text-sm font-semibold", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/select.tsx",
        lineNumber: 106,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c7 = SelectLabel;
SelectLabel.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Label"].displayName;
const SelectItem = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c8 = ({ className, children, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Item"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("relative flex w-full cursor-default select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50", className),
        ...props,
        children: [
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])("span", {
                className: "absolute left-2 flex h-3.5 w-3.5 items-center justify-center",
                children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ItemIndicator"], {
                    children: /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$react$2d$icons$2f$lu$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["LuCheck"], {
                        className: "h-4 w-4"
                    }, void 0, false, {
                        fileName: "[project]/shared/components/ui/select.tsx",
                        lineNumber: 128,
                        columnNumber: 9
                    }, ("TURBOPACK compile-time value", void 0))
                }, void 0, false, {
                    fileName: "[project]/shared/components/ui/select.tsx",
                    lineNumber: 127,
                    columnNumber: 7
                }, ("TURBOPACK compile-time value", void 0))
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/select.tsx",
                lineNumber: 126,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0)),
            /*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["ItemText"], {
                children: children
            }, void 0, false, {
                fileName: "[project]/shared/components/ui/select.tsx",
                lineNumber: 132,
                columnNumber: 5
            }, ("TURBOPACK compile-time value", void 0))
        ]
    }, void 0, true, {
        fileName: "[project]/shared/components/ui/select.tsx",
        lineNumber: 118,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c9 = SelectItem;
SelectItem.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Item"].displayName;
const SelectSeparator = /*#__PURE__*/ __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$index$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["forwardRef"](_c10 = ({ className, ...props }, ref)=>/*#__PURE__*/ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$compiled$2f$react$2f$jsx$2d$dev$2d$runtime$2e$js__$5b$app$2d$client$5d$__$28$ecmascript$29$__["jsxDEV"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Separator"], {
        ref: ref,
        className: (0, __TURBOPACK__imported__module__$5b$project$5d2f$lib$2f$utils$2e$ts__$5b$app$2d$client$5d$__$28$ecmascript$29$__["cn"])("-mx-1 my-1 h-px bg-muted", className),
        ...props
    }, void 0, false, {
        fileName: "[project]/shared/components/ui/select.tsx",
        lineNumber: 141,
        columnNumber: 3
    }, ("TURBOPACK compile-time value", void 0)));
_c11 = SelectSeparator;
SelectSeparator.displayName = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$radix$2d$ui$2f$react$2d$select$2f$dist$2f$index$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["Separator"].displayName;
;
var _c, _c1, _c2, _c3, _c4, _c5, _c6, _c7, _c8, _c9, _c10, _c11;
__turbopack_context__.k.register(_c, "SelectTrigger$React.forwardRef");
__turbopack_context__.k.register(_c1, "SelectTrigger");
__turbopack_context__.k.register(_c2, "SelectScrollUpButton");
__turbopack_context__.k.register(_c3, "SelectScrollDownButton");
__turbopack_context__.k.register(_c4, "SelectContent$React.forwardRef");
__turbopack_context__.k.register(_c5, "SelectContent");
__turbopack_context__.k.register(_c6, "SelectLabel$React.forwardRef");
__turbopack_context__.k.register(_c7, "SelectLabel");
__turbopack_context__.k.register(_c8, "SelectItem$React.forwardRef");
__turbopack_context__.k.register(_c9, "SelectItem");
__turbopack_context__.k.register(_c10, "SelectSeparator$React.forwardRef");
__turbopack_context__.k.register(_c11, "SelectSeparator");
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/constants/status.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PROGRESS_COLORS",
    ()=>PROGRESS_COLORS,
    "STATUS_BADGE_CLASSES",
    ()=>STATUS_BADGE_CLASSES,
    "STATUS_BADGE_VARIANTS",
    ()=>STATUS_BADGE_VARIANTS,
    "STATUS_BORDER_COLORS",
    ()=>STATUS_BORDER_COLORS,
    "STATUS_LABELS",
    ()=>STATUS_LABELS
]);
const STATUS_LABELS = {
    em_execucao: 'Em execução',
    com_atrasos: 'Com atraso',
    com_pendencias: 'Com pendências',
    planejamento: 'Planejamento',
    finalizada: 'Finalizada'
};
const STATUS_BORDER_COLORS = {
    em_execucao: 'border-l-primary',
    com_atrasos: 'border-l-red-500',
    com_pendencias: 'border-l-amber-500',
    planejamento: 'border-l-info',
    finalizada: 'border-l-success'
};
const STATUS_BADGE_VARIANTS = {
    em_execucao: 'primary',
    com_atrasos: 'error',
    com_pendencias: 'warning',
    planejamento: 'info',
    finalizada: 'success'
};
const PROGRESS_COLORS = {
    em_execucao: 'primary',
    com_atrasos: 'error',
    com_pendencias: 'warning',
    planejamento: 'info',
    finalizada: 'success'
};
const STATUS_BADGE_CLASSES = {
    em_execucao: 'bg-primary/90 text-white',
    com_atrasos: 'bg-red-500/90 text-white',
    com_pendencias: 'bg-amber-500/90 text-white',
    planejamento: 'bg-blue-500/90 text-white',
    finalizada: 'bg-green-600/90 text-white'
};
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/lib/formatters.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatCurrency",
    ()=>formatCurrency,
    "formatCurrencyCompact",
    ()=>formatCurrencyCompact,
    "formatCurrencyRounded",
    ()=>formatCurrencyRounded,
    "formatDate",
    ()=>formatDate,
    "formatDateTime",
    ()=>formatDateTime,
    "formatRange",
    ()=>formatRange,
    "getInitials",
    ()=>getInitials
]);
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL'
    }).format(value);
}
function formatCurrencyRounded(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
        maximumFractionDigits: 0
    }).format(value);
}
function formatCurrencyCompact(value) {
    if (value >= 1_000_000) return `R$ ${(value / 1_000_000).toFixed(1).replace('.', ',')}M`;
    if (value >= 1_000) return `R$ ${(value / 1_000).toFixed(0)}K`;
    return `R$ ${value}`;
}
function formatDate(iso, options) {
    if (!iso) return '';
    const d = iso.length === 10 ? new Date(iso + 'T00:00:00') : new Date(iso);
    if (options?.style === 'short') {
        return d.toLocaleDateString('pt-BR', {
            day: '2-digit',
            month: '2-digit'
        });
    }
    return d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
}
function formatDateTime(iso) {
    if (!iso) return '';
    const d = new Date(iso);
    const date = d.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric'
    });
    const time = d.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit'
    });
    return `${date} · ${time}`;
}
function formatRange(min, max, options) {
    const prefix = options?.prefix ?? '';
    const suffix = options?.suffix ?? '';
    const has = (v)=>v !== null && v !== undefined && v !== '';
    const minPart = has(min) ? `${prefix}${min}${suffix}` : `${prefix}0${suffix}`;
    const maxPart = has(max) ? `${prefix}${max}${suffix}` : '∞';
    return `${minPart} – ${maxPart}`;
}
function getInitials(name) {
    if (!name) return '';
    return name.split(' ').filter(Boolean).slice(0, 2).map((w)=>w[0]).join('').toUpperCase();
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/lib/pagination.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/**
 * Calcula a sequência de números/elipses a exibir num componente de paginação,
 * dado a página atual e o total de páginas. Mostra no máximo 7 itens.
 *
 * @example
 * getPaginationRange(1, 5)  // [1, 2, 3, 4, 5]
 * getPaginationRange(1, 10) // [1, 2, 3, 4, 5, 'ellipsis', 10]
 * getPaginationRange(7, 10) // [1, 'ellipsis', 6, 7, 8, 9, 10]
 * getPaginationRange(5, 10) // [1, 'ellipsis', 4, 5, 6, 'ellipsis', 10]
 */ __turbopack_context__.s([
    "getPaginationRange",
    ()=>getPaginationRange
]);
function getPaginationRange(current, total) {
    if (total <= 7) return Array.from({
        length: total
    }, (_, i)=>i + 1);
    if (current <= 4) return [
        1,
        2,
        3,
        4,
        5,
        'ellipsis',
        total
    ];
    if (current >= total - 3) return [
        1,
        'ellipsis',
        total - 4,
        total - 3,
        total - 2,
        total - 1,
        total
    ];
    return [
        1,
        'ellipsis',
        current - 1,
        current,
        current + 1,
        'ellipsis',
        total
    ];
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
"[project]/shared/lib/utils.ts [app-client] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "cn",
    ()=>cn
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/clsx/dist/clsx.mjs [app-client] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/tailwind-merge/dist/bundle-mjs.mjs [app-client] (ecmascript)");
;
;
function cn(...inputs) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$tailwind$2d$merge$2f$dist$2f$bundle$2d$mjs$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["twMerge"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$clsx$2f$dist$2f$clsx$2e$mjs__$5b$app$2d$client$5d$__$28$ecmascript$29$__["clsx"])(inputs));
}
if (typeof globalThis.$RefreshHelpers$ === 'object' && globalThis.$RefreshHelpers !== null) {
    __turbopack_context__.k.registerExports(__turbopack_context__.m, globalThis.$RefreshHelpers$);
}
}),
]);

//# sourceMappingURL=_0206fr0._.js.map