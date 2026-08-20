module.exports = [
"[externals]/bcryptjs [external] (bcryptjs, esm_import, [project]/node_modules/bcryptjs)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
var mod = await __turbopack_context__.y("bcryptjs-ee66c2bdc904f2cf");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/pg [external] (pg, esm_import, [project]/node_modules/pg)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
var mod = await __turbopack_context__.y("pg-587764f78a6c7a9c");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/pino [external] (pino, cjs, [project]/node_modules/pino)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("pino-28069d5257187539", () => require("pino-28069d5257187539"));

module.exports = mod;
}),
"[externals]/prettier/plugins/html [external] (prettier/plugins/html, esm_import, [project]/node_modules/prettier)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
var mod = await __turbopack_context__.y("prettier-3c69a91af3bc4731/plugins/html");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[externals]/prettier/standalone [external] (prettier/standalone, esm_import, [project]/node_modules/prettier)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
var mod = await __turbopack_context__.y("prettier-3c69a91af3bc4731/standalone");

__turbopack_context__.n(mod);
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, true);}),
"[project]/node_modules/@opentelemetry/api/build/esm/api/context.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ContextAPI",
    ()=>ContextAPI
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$NoopContextManager$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/diag.js [app-route] (ecmascript)");
;
;
;
const API_NAME = 'context';
const NOOP_CONTEXT_MANAGER = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$NoopContextManager$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NoopContextManager"]();
class ContextAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){}
    /** Get the singleton instance of the Context API */ static getInstance() {
        if (!this._instance) {
            this._instance = new ContextAPI();
        }
        return this._instance;
    }
    /**
     * Set the current context manager.
     *
     * @returns true if the context manager was successfully registered, else false
     */ setGlobalContextManager(contextManager) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, contextManager, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    /**
     * Get the currently active context
     */ active() {
        return this._getContextManager().active();
    }
    /**
     * Execute a function with an active context
     *
     * @param context context to be active during function execution
     * @param fn function to execute in a context
     * @param thisArg optional receiver to be used for calling fn
     * @param args optional arguments forwarded to fn
     */ with(context, fn, thisArg, ...args) {
        return this._getContextManager().with(context, fn, thisArg, ...args);
    }
    /**
     * Bind a context to a target function or event emitter
     *
     * @param context context to bind to the event emitter or function. Defaults to the currently active context
     * @param target function or event emitter to bind
     */ bind(context, target) {
        return this._getContextManager().bind(context, target);
    }
    _getContextManager() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || NOOP_CONTEXT_MANAGER;
    }
    /** Disable and remove the global context manager */ disable() {
        this._getContextManager().disable();
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/api/diag.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DiagAPI",
    ()=>DiagAPI
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$ComponentLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$internal$2f$logLevelLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag/types.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js [app-route] (ecmascript)");
;
;
;
;
const API_NAME = 'diag';
class DiagAPI {
    /** Get the singleton instance of the DiagAPI API */ static instance() {
        if (!this._instance) {
            this._instance = new DiagAPI();
        }
        return this._instance;
    }
    /**
     * Private internal constructor
     * @private
     */ constructor(){
        function _logProxy(funcName) {
            return function(...args) {
                const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGlobal"])('diag');
                // shortcut if logger not set
                if (!logger) return;
                return logger[funcName](...args);
            };
        }
        // Using self local variable for minification purposes as 'this' cannot be minified
        const self = this;
        // DiagAPI specific functions
        const setLogger = (logger, optionsOrLogLevel = {
            logLevel: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].INFO
        })=>{
            var _a, _b, _c;
            if (logger === self) {
                // There isn't much we can do here.
                // Logging to the console might break the user application.
                // Try to log to self. If a logger was previously registered it will receive the log.
                const err = new Error('Cannot use diag as the logger for itself. Please use a DiagLogger implementation like ConsoleDiagLogger or a custom implementation');
                self.error((_a = err.stack) !== null && _a !== void 0 ? _a : err.message);
                return false;
            }
            if (typeof optionsOrLogLevel === 'number') {
                optionsOrLogLevel = {
                    logLevel: optionsOrLogLevel
                };
            }
            const oldLogger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGlobal"])('diag');
            const newLogger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$internal$2f$logLevelLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createLogLevelDiagLogger"])((_b = optionsOrLogLevel.logLevel) !== null && _b !== void 0 ? _b : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].INFO, logger);
            // There already is an logger registered. We'll let it know before overwriting it.
            if (oldLogger && !optionsOrLogLevel.suppressOverrideMessage) {
                const stack = (_c = new Error().stack) !== null && _c !== void 0 ? _c : '<failed to generate stacktrace>';
                oldLogger.warn(`Current logger will be overwritten from ${stack}`);
                newLogger.warn(`Current logger will overwrite one already registered from ${stack}`);
            }
            return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerGlobal"])('diag', newLogger, self, true);
        };
        self.setLogger = setLogger;
        self.disable = ()=>{
            (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, self);
        };
        self.createComponentLogger = (options)=>{
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$ComponentLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagComponentLogger"](options);
        };
        self.verbose = _logProxy('verbose');
        self.debug = _logProxy('debug');
        self.info = _logProxy('info');
        self.warn = _logProxy('warn');
        self.error = _logProxy('error');
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/api/metrics.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "MetricsAPI",
    ()=>MetricsAPI
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeterProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeterProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/diag.js [app-route] (ecmascript)");
;
;
;
const API_NAME = 'metrics';
class MetricsAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){}
    /** Get the singleton instance of the Metrics API */ static getInstance() {
        if (!this._instance) {
            this._instance = new MetricsAPI();
        }
        return this._instance;
    }
    /**
     * Set the current global meter provider.
     * Returns true if the meter provider was successfully registered, else false.
     */ setGlobalMeterProvider(provider) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, provider, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    /**
     * Returns the global meter provider.
     */ getMeterProvider() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeterProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NOOP_METER_PROVIDER"];
    }
    /**
     * Returns a meter from the global meter provider.
     */ getMeter(name, version, options) {
        return this.getMeterProvider().getMeter(name, version, options);
    }
    /** Remove the global meter provider */ disable() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/api/propagation.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "PropagationAPI",
    ()=>PropagationAPI
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$NoopTextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/propagation/NoopTextMapPropagator.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$TextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/propagation/TextMapPropagator.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$context$2d$helpers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/baggage/context-helpers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/baggage/utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/diag.js [app-route] (ecmascript)");
;
;
;
;
;
;
const API_NAME = 'propagation';
const NOOP_TEXT_MAP_PROPAGATOR = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$NoopTextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NoopTextMapPropagator"]();
class PropagationAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){
        this.createBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createBaggage"];
        this.getBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$context$2d$helpers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getBaggage"];
        this.getActiveBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$context$2d$helpers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getActiveBaggage"];
        this.setBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$context$2d$helpers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setBaggage"];
        this.deleteBaggage = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$context$2d$helpers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deleteBaggage"];
    }
    /** Get the singleton instance of the Propagator API */ static getInstance() {
        if (!this._instance) {
            this._instance = new PropagationAPI();
        }
        return this._instance;
    }
    /**
     * Set the current propagator.
     *
     * @returns true if the propagator was successfully registered, else false
     */ setGlobalPropagator(propagator) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, propagator, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    /**
     * Inject context into a carrier to be propagated inter-process
     *
     * @param context Context carrying tracing data to inject
     * @param carrier carrier to inject context into
     * @param setter Function used to set values on the carrier
     */ inject(context, carrier, setter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$TextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultTextMapSetter"]) {
        return this._getGlobalPropagator().inject(context, carrier, setter);
    }
    /**
     * Extract context from a carrier
     *
     * @param context Context which the newly created context will inherit from
     * @param carrier Carrier to extract context from
     * @param getter Function used to extract keys from a carrier
     */ extract(context, carrier, getter = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$TextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultTextMapGetter"]) {
        return this._getGlobalPropagator().extract(context, carrier, getter);
    }
    /**
     * Return a list of all fields which may be used by the propagator.
     */ fields() {
        return this._getGlobalPropagator().fields();
    }
    /** Remove the global propagator */ disable() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
    }
    _getGlobalPropagator() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || NOOP_TEXT_MAP_PROPAGATOR;
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/api/trace.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TraceAPI",
    ()=>TraceAPI
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracerProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/diag.js [app-route] (ecmascript)");
;
;
;
;
;
const API_NAME = 'trace';
class TraceAPI {
    /** Empty private constructor prevents end users from constructing a new instance of the API */ constructor(){
        this._proxyTracerProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracerProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProxyTracerProvider"]();
        this.wrapSpanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["wrapSpanContext"];
        this.isSpanContextValid = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSpanContextValid"];
        this.deleteSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["deleteSpan"];
        this.getSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSpan"];
        this.getActiveSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getActiveSpan"];
        this.getSpanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSpanContext"];
        this.setSpan = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setSpan"];
        this.setSpanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setSpanContext"];
    }
    /** Get the singleton instance of the Trace API */ static getInstance() {
        if (!this._instance) {
            this._instance = new TraceAPI();
        }
        return this._instance;
    }
    /**
     * Set the current global tracer.
     *
     * @returns true if the tracer provider was successfully registered, else false
     */ setGlobalTracerProvider(provider) {
        const success = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["registerGlobal"])(API_NAME, this._proxyTracerProvider, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
        if (success) {
            this._proxyTracerProvider.setDelegate(provider);
        }
        return success;
    }
    /**
     * Returns the global tracer provider.
     */ getTracerProvider() {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGlobal"])(API_NAME) || this._proxyTracerProvider;
    }
    /**
     * Returns a tracer from the global tracer provider.
     */ getTracer(name, version) {
        return this.getTracerProvider().getTracer(name, version);
    }
    /** Remove the global tracer provider */ disable() {
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["unregisterGlobal"])(API_NAME, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance());
        this._proxyTracerProvider = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracerProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProxyTracerProvider"]();
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/baggage/context-helpers.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteBaggage",
    ()=>deleteBaggage,
    "getActiveBaggage",
    ()=>getActiveBaggage,
    "getBaggage",
    ()=>getBaggage,
    "setBaggage",
    ()=>setBaggage
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/context.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/context/context.js [app-route] (ecmascript)");
;
;
/**
 * Baggage key
 */ const BAGGAGE_KEY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createContextKey"])('OpenTelemetry Baggage Key');
function getBaggage(context) {
    return context.getValue(BAGGAGE_KEY) || undefined;
}
function getActiveBaggage() {
    return getBaggage(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance().active());
}
function setBaggage(context, baggage) {
    return context.setValue(BAGGAGE_KEY, baggage);
}
function deleteBaggage(context) {
    return context.deleteValue(BAGGAGE_KEY);
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/baggage/internal/baggage-impl.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ __turbopack_context__.s([
    "BaggageImpl",
    ()=>BaggageImpl
]);
class BaggageImpl {
    constructor(entries){
        this._entries = entries ? new Map(entries) : new Map();
    }
    getEntry(key) {
        const entry = this._entries.get(key);
        if (!entry) {
            return undefined;
        }
        return Object.assign({}, entry);
    }
    getAllEntries() {
        return Array.from(this._entries.entries());
    }
    setEntry(key, entry) {
        const newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.set(key, entry);
        return newBaggage;
    }
    removeEntry(key) {
        const newBaggage = new BaggageImpl(this._entries);
        newBaggage._entries.delete(key);
        return newBaggage;
    }
    removeEntries(...keys) {
        const newBaggage = new BaggageImpl(this._entries);
        for (const key of keys){
            newBaggage._entries.delete(key);
        }
        return newBaggage;
    }
    clear() {
        return new BaggageImpl();
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/baggage/internal/symbol.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * Symbol used to make BaggageEntryMetadata an opaque type
 */ __turbopack_context__.s([
    "baggageEntryMetadataSymbol",
    ()=>baggageEntryMetadataSymbol
]);
const baggageEntryMetadataSymbol = Symbol('BaggageEntryMetadata');
}),
"[project]/node_modules/@opentelemetry/api/build/esm/baggage/utils.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "baggageEntryMetadataFromString",
    ()=>baggageEntryMetadataFromString,
    "createBaggage",
    ()=>createBaggage
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/diag.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$internal$2f$baggage$2d$impl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/baggage/internal/baggage-impl.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$internal$2f$symbol$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/baggage/internal/symbol.js [app-route] (ecmascript)");
;
;
;
const diag = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance();
function createBaggage(entries = {}) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$internal$2f$baggage$2d$impl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["BaggageImpl"](new Map(Object.entries(entries)));
}
function baggageEntryMetadataFromString(str) {
    if (typeof str !== 'string') {
        diag.error(`Cannot create baggage metadata from unknown type: ${typeof str}`);
        str = '';
    }
    return {
        __TYPE__: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$internal$2f$symbol$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["baggageEntryMetadataSymbol"],
        toString () {
            return str;
        }
    };
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/context-api.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "context",
    ()=>context
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/context.js [app-route] (ecmascript)");
;
const context = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance();
}),
"[project]/node_modules/@opentelemetry/api/build/esm/context/NoopContextManager.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoopContextManager",
    ()=>NoopContextManager
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/context/context.js [app-route] (ecmascript)");
;
class NoopContextManager {
    active() {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ROOT_CONTEXT"];
    }
    with(_context, fn, thisArg, ...args) {
        return fn.call(thisArg, ...args);
    }
    bind(_context, target) {
        return target;
    }
    enable() {
        return this;
    }
    disable() {
        return this;
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/context/context.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * Get a key to uniquely identify a context value
 *
 * @since 1.0.0
 */ __turbopack_context__.s([
    "ROOT_CONTEXT",
    ()=>ROOT_CONTEXT,
    "createContextKey",
    ()=>createContextKey
]);
function createContextKey(description) {
    // The specification states that for the same input, multiple calls should
    // return different keys. Due to the nature of the JS dependency management
    // system, this creates problems where multiple versions of some package
    // could hold different keys for the same property.
    //
    // Therefore, we use Symbol.for which returns the same key for the same input.
    return Symbol.for(description);
}
class BaseContext {
    /**
     * Construct a new context which inherits values from an optional parent context.
     *
     * @param parentContext a context from which to inherit values
     */ constructor(parentContext){
        // for minification
        const self = this;
        self._currentContext = parentContext ? new Map(parentContext) : new Map();
        self.getValue = (key)=>self._currentContext.get(key);
        self.setValue = (key, value)=>{
            const context = new BaseContext(self._currentContext);
            context._currentContext.set(key, value);
            return context;
        };
        self.deleteValue = (key)=>{
            const context = new BaseContext(self._currentContext);
            context._currentContext.delete(key);
            return context;
        };
    }
}
const ROOT_CONTEXT = new BaseContext();
}),
"[project]/node_modules/@opentelemetry/api/build/esm/diag-api.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "diag",
    ()=>diag
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/diag.js [app-route] (ecmascript)");
;
const diag = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$diag$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagAPI"].instance();
}),
"[project]/node_modules/@opentelemetry/api/build/esm/diag/ComponentLogger.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DiagComponentLogger",
    ()=>DiagComponentLogger
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js [app-route] (ecmascript)");
;
class DiagComponentLogger {
    constructor(props){
        this._namespace = props.namespace || 'DiagComponentLogger';
    }
    debug(...args) {
        return logProxy('debug', this._namespace, args);
    }
    error(...args) {
        return logProxy('error', this._namespace, args);
    }
    info(...args) {
        return logProxy('info', this._namespace, args);
    }
    warn(...args) {
        return logProxy('warn', this._namespace, args);
    }
    verbose(...args) {
        return logProxy('verbose', this._namespace, args);
    }
}
function logProxy(funcName, namespace, args) {
    const logger = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$global$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getGlobal"])('diag');
    // shortcut if logger not set
    if (!logger) {
        return;
    }
    return logger[funcName](namespace, ...args);
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/diag/consoleLogger.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DiagConsoleLogger",
    ()=>DiagConsoleLogger,
    "_originalConsoleMethods",
    ()=>_originalConsoleMethods
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ const consoleMap = [
    {
        n: 'error',
        c: 'error'
    },
    {
        n: 'warn',
        c: 'warn'
    },
    {
        n: 'info',
        c: 'info'
    },
    {
        n: 'debug',
        c: 'debug'
    },
    {
        n: 'verbose',
        c: 'trace'
    }
];
const _originalConsoleMethods = {};
if (typeof console !== 'undefined') {
    const keys = [
        'error',
        'warn',
        'info',
        'debug',
        'trace',
        'log'
    ];
    for (const key of keys){
        // eslint-disable-next-line no-console
        if (typeof console[key] === 'function') {
            // eslint-disable-next-line no-console
            _originalConsoleMethods[key] = console[key];
        }
    }
}
class DiagConsoleLogger {
    constructor(){
        function _consoleFunc(funcName) {
            return function(...args) {
                // Prefer original (pre-instrumentation) methods saved at module load time.
                let theFunc = _originalConsoleMethods[funcName];
                // Some environments only expose the console when the F12 developer console is open
                if (typeof theFunc !== 'function') {
                    theFunc = _originalConsoleMethods['log'];
                }
                // Fall back in case console was not available at module load time but became available later.
                if (typeof theFunc !== 'function' && console) {
                    // eslint-disable-next-line no-console
                    theFunc = console[funcName];
                    if (typeof theFunc !== 'function') {
                        // eslint-disable-next-line no-console
                        theFunc = console.log;
                    }
                }
                if (typeof theFunc === 'function') {
                    return theFunc.apply(console, args);
                }
            };
        }
        for(let i = 0; i < consoleMap.length; i++){
            this[consoleMap[i].n] = _consoleFunc(consoleMap[i].c);
        }
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/diag/internal/logLevelLogger.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createLogLevelDiagLogger",
    ()=>createLogLevelDiagLogger
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag/types.js [app-route] (ecmascript)");
;
function createLogLevelDiagLogger(maxLevel, logger) {
    if (maxLevel < __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].NONE) {
        maxLevel = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].NONE;
    } else if (maxLevel > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].ALL) {
        maxLevel = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].ALL;
    }
    // In case the logger is null or undefined
    logger = logger || {};
    function _filterFunc(funcName, theLevel) {
        const theFunc = logger[funcName];
        if (typeof theFunc === 'function' && maxLevel >= theLevel) {
            return theFunc.bind(logger);
        }
        return function() {};
    }
    return {
        error: _filterFunc('error', __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].ERROR),
        warn: _filterFunc('warn', __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].WARN),
        info: _filterFunc('info', __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].INFO),
        debug: _filterFunc('debug', __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].DEBUG),
        verbose: _filterFunc('verbose', __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"].VERBOSE)
    };
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/diag/types.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * Defines the available internal logging levels for the diagnostic logger, the numeric values
 * of the levels are defined to match the original values from the initial LogLevel to avoid
 * compatibility/migration issues for any implementation that assume the numeric ordering.
 */ __turbopack_context__.s([
    "DiagLogLevel",
    ()=>DiagLogLevel
]);
var DiagLogLevel;
(function(DiagLogLevel) {
    /** Diagnostic Logging level setting to disable all logging (except and forced logs) */ DiagLogLevel[DiagLogLevel["NONE"] = 0] = "NONE";
    /** Identifies an error scenario */ DiagLogLevel[DiagLogLevel["ERROR"] = 30] = "ERROR";
    /** Identifies a warning scenario */ DiagLogLevel[DiagLogLevel["WARN"] = 50] = "WARN";
    /** General informational log message */ DiagLogLevel[DiagLogLevel["INFO"] = 60] = "INFO";
    /** General debug log message */ DiagLogLevel[DiagLogLevel["DEBUG"] = 70] = "DEBUG";
    /**
     * Detailed trace level logging should only be used for development, should only be set
     * in a development environment.
     */ DiagLogLevel[DiagLogLevel["VERBOSE"] = 80] = "VERBOSE";
    /** Used to set the logging level to include all logging */ DiagLogLevel[DiagLogLevel["ALL"] = 9999] = "ALL";
})(DiagLogLevel || (DiagLogLevel = {}));
}),
"[project]/node_modules/@opentelemetry/api/build/esm/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DiagConsoleLogger",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$consoleLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagConsoleLogger"],
    "DiagLogLevel",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DiagLogLevel"],
    "INVALID_SPANID",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INVALID_SPANID"],
    "INVALID_SPAN_CONTEXT",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INVALID_SPAN_CONTEXT"],
    "INVALID_TRACEID",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INVALID_TRACEID"],
    "ProxyTracer",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProxyTracer"],
    "ProxyTracerProvider",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracerProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProxyTracerProvider"],
    "ROOT_CONTEXT",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ROOT_CONTEXT"],
    "SamplingDecision",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$SamplingResult$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SamplingDecision"],
    "SpanKind",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$span_kind$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SpanKind"],
    "SpanStatusCode",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$status$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SpanStatusCode"],
    "TraceFlags",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TraceFlags"],
    "ValueType",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$Metric$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ValueType"],
    "baggageEntryMetadataFromString",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["baggageEntryMetadataFromString"],
    "context",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["context"],
    "createContextKey",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createContextKey"],
    "createNoopMeter",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createNoopMeter"],
    "createTraceState",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$internal$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createTraceState"],
    "default",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["default"],
    "defaultTextMapGetter",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$TextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultTextMapGetter"],
    "defaultTextMapSetter",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$TextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["defaultTextMapSetter"],
    "diag",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["diag"],
    "isSpanContextValid",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSpanContextValid"],
    "isValidSpanId",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidSpanId"],
    "isValidTraceId",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isValidTraceId"],
    "metrics",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["metrics"],
    "propagation",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["propagation"],
    "trace",
    ()=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["trace"]
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/context-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/metrics-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/propagation-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$baggage$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/baggage/utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/context/context.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$consoleLogger$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag/consoleLogger.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag/types.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$Metric$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/metrics/Metric.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2f$TextMapPropagator$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/propagation/TextMapPropagator.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracerProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$SamplingResult$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$span_kind$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$status$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/status.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$internal$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/internal/utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js [app-route] (ecmascript)");
}),
"[project]/node_modules/@opentelemetry/api/build/esm/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ __turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__
]);
// Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/context-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/diag-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/metrics-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/propagation-api.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace-api.js [app-route] (ecmascript)");
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
;
;
;
;
const __TURBOPACK__default__export__ = {
    context: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["context"],
    diag: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$diag$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["diag"],
    metrics: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["metrics"],
    propagation: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$propagation$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["propagation"],
    trace: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2d$api$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["trace"]
};
}),
"[project]/node_modules/@opentelemetry/api/build/esm/internal/global-utils.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getGlobal",
    ()=>getGlobal,
    "registerGlobal",
    ()=>registerGlobal,
    "unregisterGlobal",
    ()=>unregisterGlobal
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/version.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$semver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/internal/semver.js [app-route] (ecmascript)");
;
;
const major = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VERSION"].split('.')[0];
const GLOBAL_OPENTELEMETRY_API_KEY = Symbol.for(`opentelemetry.js.api.${major}`);
const _global = typeof globalThis === 'object' ? globalThis : typeof self === 'object' ? self : ("TURBOPACK compile-time falsy", 0) ? "TURBOPACK unreachable" : ("TURBOPACK compile-time truthy", 1) ? /*TURBOPACK member replacement*/ __turbopack_context__.g : "TURBOPACK unreachable";
function registerGlobal(type, instance, diag, allowOverride = false) {
    var _a;
    const api = _global[GLOBAL_OPENTELEMETRY_API_KEY] = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) !== null && _a !== void 0 ? _a : {
        version: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VERSION"]
    };
    if (!allowOverride && api[type]) {
        // already registered an API of this type
        const err = new Error(`@opentelemetry/api: Attempted duplicate registration of API: ${type}`);
        diag.error(err.stack || err.message);
        return false;
    }
    if (api.version !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VERSION"]) {
        // All registered APIs must be of the same version exactly
        const err = new Error(`@opentelemetry/api: Registration of version v${api.version} for ${type} does not match previously registered API v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VERSION"]}`);
        diag.error(err.stack || err.message);
        return false;
    }
    api[type] = instance;
    diag.debug(`@opentelemetry/api: Registered a global for ${type} v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VERSION"]}.`);
    return true;
}
function getGlobal(type) {
    var _a, _b;
    const globalVersion = (_a = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _a === void 0 ? void 0 : _a.version;
    if (!globalVersion || !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$internal$2f$semver$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCompatible"])(globalVersion)) {
        return;
    }
    return (_b = _global[GLOBAL_OPENTELEMETRY_API_KEY]) === null || _b === void 0 ? void 0 : _b[type];
}
function unregisterGlobal(type, diag) {
    diag.debug(`@opentelemetry/api: Unregistering a global for ${type} v${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VERSION"]}.`);
    const api = _global[GLOBAL_OPENTELEMETRY_API_KEY];
    if (api) {
        delete api[type];
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/internal/semver.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "_makeCompatibilityCheck",
    ()=>_makeCompatibilityCheck,
    "isCompatible",
    ()=>isCompatible
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/version.js [app-route] (ecmascript)");
;
const re = /^(\d+)\.(\d+)\.(\d+)(-(.+))?$/;
function _makeCompatibilityCheck(ownVersion) {
    const acceptedVersions = new Set([
        ownVersion
    ]);
    const rejectedVersions = new Set();
    const myVersionMatch = ownVersion.match(re);
    if (!myVersionMatch) {
        // we cannot guarantee compatibility so we always return noop
        return ()=>false;
    }
    const ownVersionParsed = {
        major: +myVersionMatch[1],
        minor: +myVersionMatch[2],
        patch: +myVersionMatch[3],
        prerelease: myVersionMatch[4]
    };
    // if ownVersion has a prerelease tag, versions must match exactly
    if (ownVersionParsed.prerelease != null) {
        return function isExactmatch(globalVersion) {
            return globalVersion === ownVersion;
        };
    }
    function _reject(v) {
        rejectedVersions.add(v);
        return false;
    }
    function _accept(v) {
        acceptedVersions.add(v);
        return true;
    }
    return function isCompatible(globalVersion) {
        if (acceptedVersions.has(globalVersion)) {
            return true;
        }
        if (rejectedVersions.has(globalVersion)) {
            return false;
        }
        const globalVersionMatch = globalVersion.match(re);
        if (!globalVersionMatch) {
            // cannot parse other version
            // we cannot guarantee compatibility so we always noop
            return _reject(globalVersion);
        }
        const globalVersionParsed = {
            major: +globalVersionMatch[1],
            minor: +globalVersionMatch[2],
            patch: +globalVersionMatch[3],
            prerelease: globalVersionMatch[4]
        };
        // if globalVersion has a prerelease tag, versions must match exactly
        if (globalVersionParsed.prerelease != null) {
            return _reject(globalVersion);
        }
        // major versions must match
        if (ownVersionParsed.major !== globalVersionParsed.major) {
            return _reject(globalVersion);
        }
        if (ownVersionParsed.major === 0) {
            if (ownVersionParsed.minor === globalVersionParsed.minor && ownVersionParsed.patch <= globalVersionParsed.patch) {
                return _accept(globalVersion);
            }
            return _reject(globalVersion);
        }
        if (ownVersionParsed.minor <= globalVersionParsed.minor) {
            return _accept(globalVersion);
        }
        return _reject(globalVersion);
    };
}
const isCompatible = _makeCompatibilityCheck(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$version$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["VERSION"]);
}),
"[project]/node_modules/@opentelemetry/api/build/esm/metrics-api.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "metrics",
    ()=>metrics
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$metrics$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/metrics.js [app-route] (ecmascript)");
;
const metrics = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$metrics$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MetricsAPI"].getInstance();
}),
"[project]/node_modules/@opentelemetry/api/build/esm/metrics/Metric.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * The Type of value. It describes how the data is reported.
 *
 * @since 1.3.0
 */ __turbopack_context__.s([
    "ValueType",
    ()=>ValueType
]);
var ValueType;
(function(ValueType) {
    ValueType[ValueType["INT"] = 0] = "INT";
    ValueType[ValueType["DOUBLE"] = 1] = "DOUBLE";
})(ValueType || (ValueType = {}));
}),
"[project]/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * NoopMeter is a noop implementation of the {@link Meter} interface. It reuses
 * constant NoopMetrics for all of its methods.
 */ __turbopack_context__.s([
    "NOOP_COUNTER_METRIC",
    ()=>NOOP_COUNTER_METRIC,
    "NOOP_GAUGE_METRIC",
    ()=>NOOP_GAUGE_METRIC,
    "NOOP_HISTOGRAM_METRIC",
    ()=>NOOP_HISTOGRAM_METRIC,
    "NOOP_METER",
    ()=>NOOP_METER,
    "NOOP_OBSERVABLE_COUNTER_METRIC",
    ()=>NOOP_OBSERVABLE_COUNTER_METRIC,
    "NOOP_OBSERVABLE_GAUGE_METRIC",
    ()=>NOOP_OBSERVABLE_GAUGE_METRIC,
    "NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC",
    ()=>NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC,
    "NOOP_UP_DOWN_COUNTER_METRIC",
    ()=>NOOP_UP_DOWN_COUNTER_METRIC,
    "NoopCounterMetric",
    ()=>NoopCounterMetric,
    "NoopGaugeMetric",
    ()=>NoopGaugeMetric,
    "NoopHistogramMetric",
    ()=>NoopHistogramMetric,
    "NoopMeter",
    ()=>NoopMeter,
    "NoopMetric",
    ()=>NoopMetric,
    "NoopObservableCounterMetric",
    ()=>NoopObservableCounterMetric,
    "NoopObservableGaugeMetric",
    ()=>NoopObservableGaugeMetric,
    "NoopObservableMetric",
    ()=>NoopObservableMetric,
    "NoopObservableUpDownCounterMetric",
    ()=>NoopObservableUpDownCounterMetric,
    "NoopUpDownCounterMetric",
    ()=>NoopUpDownCounterMetric,
    "createNoopMeter",
    ()=>createNoopMeter
]);
class NoopMeter {
    constructor(){}
    /**
     * @see {@link Meter.createGauge}
     */ createGauge(_name, _options) {
        return NOOP_GAUGE_METRIC;
    }
    /**
     * @see {@link Meter.createHistogram}
     */ createHistogram(_name, _options) {
        return NOOP_HISTOGRAM_METRIC;
    }
    /**
     * @see {@link Meter.createCounter}
     */ createCounter(_name, _options) {
        return NOOP_COUNTER_METRIC;
    }
    /**
     * @see {@link Meter.createUpDownCounter}
     */ createUpDownCounter(_name, _options) {
        return NOOP_UP_DOWN_COUNTER_METRIC;
    }
    /**
     * @see {@link Meter.createObservableGauge}
     */ createObservableGauge(_name, _options) {
        return NOOP_OBSERVABLE_GAUGE_METRIC;
    }
    /**
     * @see {@link Meter.createObservableCounter}
     */ createObservableCounter(_name, _options) {
        return NOOP_OBSERVABLE_COUNTER_METRIC;
    }
    /**
     * @see {@link Meter.createObservableUpDownCounter}
     */ createObservableUpDownCounter(_name, _options) {
        return NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC;
    }
    /**
     * @see {@link Meter.addBatchObservableCallback}
     */ addBatchObservableCallback(_callback, _observables) {}
    /**
     * @see {@link Meter.removeBatchObservableCallback}
     */ removeBatchObservableCallback(_callback) {}
}
class NoopMetric {
}
class NoopCounterMetric extends NoopMetric {
    add(_value, _attributes) {}
}
class NoopUpDownCounterMetric extends NoopMetric {
    add(_value, _attributes) {}
}
class NoopGaugeMetric extends NoopMetric {
    record(_value, _attributes) {}
}
class NoopHistogramMetric extends NoopMetric {
    record(_value, _attributes) {}
}
class NoopObservableMetric {
    addCallback(_callback) {}
    removeCallback(_callback) {}
}
class NoopObservableCounterMetric extends NoopObservableMetric {
}
class NoopObservableGaugeMetric extends NoopObservableMetric {
}
class NoopObservableUpDownCounterMetric extends NoopObservableMetric {
}
const NOOP_METER = new NoopMeter();
const NOOP_COUNTER_METRIC = new NoopCounterMetric();
const NOOP_GAUGE_METRIC = new NoopGaugeMetric();
const NOOP_HISTOGRAM_METRIC = new NoopHistogramMetric();
const NOOP_UP_DOWN_COUNTER_METRIC = new NoopUpDownCounterMetric();
const NOOP_OBSERVABLE_COUNTER_METRIC = new NoopObservableCounterMetric();
const NOOP_OBSERVABLE_GAUGE_METRIC = new NoopObservableGaugeMetric();
const NOOP_OBSERVABLE_UP_DOWN_COUNTER_METRIC = new NoopObservableUpDownCounterMetric();
function createNoopMeter() {
    return NOOP_METER;
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeterProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NOOP_METER_PROVIDER",
    ()=>NOOP_METER_PROVIDER,
    "NoopMeterProvider",
    ()=>NoopMeterProvider
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/metrics/NoopMeter.js [app-route] (ecmascript)");
;
class NoopMeterProvider {
    getMeter(_name, _version, _options) {
        return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$metrics$2f$NoopMeter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NOOP_METER"];
    }
}
const NOOP_METER_PROVIDER = new NoopMeterProvider();
}),
"[project]/node_modules/@opentelemetry/api/build/esm/propagation-api.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "propagation",
    ()=>propagation
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$propagation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/propagation.js [app-route] (ecmascript)");
;
const propagation = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$propagation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PropagationAPI"].getInstance();
}),
"[project]/node_modules/@opentelemetry/api/build/esm/propagation/NoopTextMapPropagator.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * No-op implementations of {@link TextMapPropagator}.
 */ __turbopack_context__.s([
    "NoopTextMapPropagator",
    ()=>NoopTextMapPropagator
]);
class NoopTextMapPropagator {
    /** Noop inject function does nothing */ inject(_context, _carrier) {}
    /** Noop extract function does nothing and returns the input context */ extract(context, _carrier) {
        return context;
    }
    fields() {
        return [];
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/propagation/TextMapPropagator.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * @since 1.0.0
 */ __turbopack_context__.s([
    "defaultTextMapGetter",
    ()=>defaultTextMapGetter,
    "defaultTextMapSetter",
    ()=>defaultTextMapSetter
]);
const defaultTextMapGetter = {
    get (carrier, key) {
        if (carrier == null) {
            return undefined;
        }
        return carrier[key];
    },
    keys (carrier) {
        if (carrier == null) {
            return [];
        }
        return Object.keys(carrier);
    }
};
const defaultTextMapSetter = {
    set (carrier, key, value) {
        if (carrier == null) {
            return;
        }
        carrier[key] = value;
    }
};
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace-api.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "trace",
    ()=>trace
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // Split module-level variable definition into separate files to allow
// tree-shaking on each api instance.
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$trace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/trace.js [app-route] (ecmascript)");
;
const trace = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$trace$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TraceAPI"].getInstance();
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NonRecordingSpan",
    ()=>NonRecordingSpan
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js [app-route] (ecmascript)");
;
class NonRecordingSpan {
    constructor(spanContext = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INVALID_SPAN_CONTEXT"]){
        this._spanContext = spanContext;
    }
    // Returns a SpanContext.
    spanContext() {
        return this._spanContext;
    }
    // By default does nothing
    setAttribute(_key, _value) {
        return this;
    }
    // By default does nothing
    setAttributes(_attributes) {
        return this;
    }
    // By default does nothing
    addEvent(_name, _attributes) {
        return this;
    }
    addLink(_link) {
        return this;
    }
    addLinks(_links) {
        return this;
    }
    // By default does nothing
    setStatus(_status) {
        return this;
    }
    // By default does nothing
    updateName(_name) {
        return this;
    }
    // By default does nothing
    end(_endTime) {}
    // isRecording always returns false for NonRecordingSpan.
    isRecording() {
        return false;
    }
    // By default does nothing
    recordException(_exception, _time) {}
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoopTracer",
    ()=>NoopTracer
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/context.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js [app-route] (ecmascript)");
;
;
;
;
const contextApi = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance();
class NoopTracer {
    // startSpan starts a noop span.
    startSpan(name, options, context = contextApi.active()) {
        const root = Boolean(options === null || options === void 0 ? void 0 : options.root);
        if (root) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonRecordingSpan"]();
        }
        const parentFromContext = context && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSpanContext"])(context);
        if (isSpanContext(parentFromContext) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$spancontext$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isSpanContextValid"])(parentFromContext)) {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonRecordingSpan"](parentFromContext);
        } else {
            return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonRecordingSpan"]();
        }
    }
    startActiveSpan(name, arg2, arg3, arg4) {
        let opts;
        let ctx;
        let fn;
        if (arguments.length < 2) {
            return;
        } else if (arguments.length === 2) {
            fn = arg2;
        } else if (arguments.length === 3) {
            opts = arg2;
            fn = arg3;
        } else {
            opts = arg2;
            ctx = arg3;
            fn = arg4;
        }
        const parentContext = ctx !== null && ctx !== void 0 ? ctx : contextApi.active();
        const span = this.startSpan(name, opts, parentContext);
        const contextWithSpanSet = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$context$2d$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["setSpan"])(parentContext, span);
        return contextApi.with(contextWithSpanSet, fn, undefined, span);
    }
}
function isSpanContext(spanContext) {
    return spanContext !== null && typeof spanContext === 'object' && 'spanId' in spanContext && typeof spanContext['spanId'] === 'string' && 'traceId' in spanContext && typeof spanContext['traceId'] === 'string' && 'traceFlags' in spanContext && typeof spanContext['traceFlags'] === 'number';
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "NoopTracerProvider",
    ()=>NoopTracerProvider
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NoopTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js [app-route] (ecmascript)");
;
class NoopTracerProvider {
    getTracer(_name, _version, _options) {
        return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NoopTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NoopTracer"]();
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProxyTracer",
    ()=>ProxyTracer
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NoopTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/NoopTracer.js [app-route] (ecmascript)");
;
const NOOP_TRACER = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NoopTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NoopTracer"]();
class ProxyTracer {
    constructor(provider, name, version, options){
        this._provider = provider;
        this.name = name;
        this.version = version;
        this.options = options;
    }
    startSpan(name, options, context) {
        return this._getTracer().startSpan(name, options, context);
    }
    startActiveSpan(_name, _options, _context, _fn) {
        const tracer = this._getTracer();
        return Reflect.apply(tracer.startActiveSpan, tracer, arguments);
    }
    /**
     * Try to get a tracer from the proxy tracer provider.
     * If the proxy tracer provider has no delegate, return a noop tracer.
     */ _getTracer() {
        if (this._delegate) {
            return this._delegate;
        }
        const tracer = this._provider.getDelegateTracer(this.name, this.version, this.options);
        if (!tracer) {
            return NOOP_TRACER;
        }
        this._delegate = tracer;
        return this._delegate;
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracerProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProxyTracerProvider",
    ()=>ProxyTracerProvider
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/ProxyTracer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NoopTracerProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/NoopTracerProvider.js [app-route] (ecmascript)");
;
;
const NOOP_TRACER_PROVIDER = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NoopTracerProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NoopTracerProvider"]();
class ProxyTracerProvider {
    /**
     * Get a {@link ProxyTracer}
     */ getTracer(name, version, options) {
        var _a;
        return (_a = this.getDelegateTracer(name, version, options)) !== null && _a !== void 0 ? _a : new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$ProxyTracer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProxyTracer"](this, name, version, options);
    }
    getDelegate() {
        var _a;
        return (_a = this._delegate) !== null && _a !== void 0 ? _a : NOOP_TRACER_PROVIDER;
    }
    /**
     * Set the delegate tracer provider
     */ setDelegate(delegate) {
        this._delegate = delegate;
    }
    getDelegateTracer(name, version, options) {
        var _a;
        return (_a = this._delegate) === null || _a === void 0 ? void 0 : _a.getTracer(name, version, options);
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/SamplingResult.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * @deprecated use the one declared in @opentelemetry/sdk-trace-base instead.
 * A sampling decision that determines how a {@link Span} will be recorded
 * and collected.
 *
 * @since 1.0.0
 */ __turbopack_context__.s([
    "SamplingDecision",
    ()=>SamplingDecision
]);
var SamplingDecision;
(function(SamplingDecision) {
    /**
     * `Span.isRecording() === false`, span will not be recorded and all events
     * and attributes will be dropped.
     */ SamplingDecision[SamplingDecision["NOT_RECORD"] = 0] = "NOT_RECORD";
    /**
     * `Span.isRecording() === true`, but `Sampled` flag in {@link TraceFlags}
     * MUST NOT be set.
     */ SamplingDecision[SamplingDecision["RECORD"] = 1] = "RECORD";
    /**
     * `Span.isRecording() === true` AND `Sampled` flag in {@link TraceFlags}
     * MUST be set.
     */ SamplingDecision[SamplingDecision["RECORD_AND_SAMPLED"] = 2] = "RECORD_AND_SAMPLED";
})(SamplingDecision || (SamplingDecision = {}));
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/context-utils.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteSpan",
    ()=>deleteSpan,
    "getActiveSpan",
    ()=>getActiveSpan,
    "getSpan",
    ()=>getSpan,
    "getSpanContext",
    ()=>getSpanContext,
    "setSpan",
    ()=>setSpan,
    "setSpanContext",
    ()=>setSpanContext
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/context/context.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/api/context.js [app-route] (ecmascript)");
;
;
;
/**
 * span key
 */ const SPAN_KEY = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$context$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createContextKey"])('OpenTelemetry Context Key SPAN');
function getSpan(context) {
    return context.getValue(SPAN_KEY) || undefined;
}
function getActiveSpan() {
    return getSpan(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$api$2f$context$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ContextAPI"].getInstance().active());
}
function setSpan(context, span) {
    return context.setValue(SPAN_KEY, span);
}
function deleteSpan(context) {
    return context.deleteValue(SPAN_KEY);
}
function setSpanContext(context, spanContext) {
    return setSpan(context, new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonRecordingSpan"](spanContext));
}
function getSpanContext(context) {
    var _a;
    return (_a = getSpan(context)) === null || _a === void 0 ? void 0 : _a.spanContext();
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-impl.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "TraceStateImpl",
    ()=>TraceStateImpl
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$internal$2f$tracestate$2d$validators$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-validators.js [app-route] (ecmascript)");
;
const MAX_TRACE_STATE_ITEMS = 32;
const MAX_TRACE_STATE_LEN = 512;
const LIST_MEMBERS_SEPARATOR = ',';
const LIST_MEMBER_KEY_VALUE_SPLITTER = '=';
class TraceStateImpl {
    constructor(rawTraceState){
        this._internalState = new Map();
        if (rawTraceState) this._parse(rawTraceState);
    }
    set(key, value) {
        // TODO: Benchmark the different approaches(map vs list) and
        // use the faster one.
        const traceState = this._clone();
        if (traceState._internalState.has(key)) {
            traceState._internalState.delete(key);
        }
        traceState._internalState.set(key, value);
        return traceState;
    }
    unset(key) {
        const traceState = this._clone();
        traceState._internalState.delete(key);
        return traceState;
    }
    get(key) {
        return this._internalState.get(key);
    }
    serialize() {
        return Array.from(this._internalState.keys())// Use reduceRight() because keys are stored in reverse insertion order.
        .reduceRight((agg, key)=>{
            agg.push(key + LIST_MEMBER_KEY_VALUE_SPLITTER + this.get(key));
            return agg;
        }, []).join(LIST_MEMBERS_SEPARATOR);
    }
    _parse(rawTraceState) {
        if (rawTraceState.length > MAX_TRACE_STATE_LEN) return;
        this._internalState = rawTraceState.split(LIST_MEMBERS_SEPARATOR)// Use reduceRight() so new keys (.set(...)) will be placed at the beginning
        .reduceRight((agg, part)=>{
            const listMember = part.trim(); // Optional Whitespace (OWS) handling
            const i = listMember.indexOf(LIST_MEMBER_KEY_VALUE_SPLITTER);
            if (i !== -1) {
                const key = listMember.slice(0, i);
                const value = listMember.slice(i + 1, part.length);
                if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$internal$2f$tracestate$2d$validators$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateKey"])(key) && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$internal$2f$tracestate$2d$validators$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["validateValue"])(value)) {
                    agg.set(key, value);
                } else {
                // TODO: Consider to add warning log
                }
            }
            return agg;
        }, new Map());
        // Because of the reverse() requirement, trunc must be done after map is created
        if (this._internalState.size > MAX_TRACE_STATE_ITEMS) {
            this._internalState = new Map(Array.from(this._internalState.entries()).reverse() // Use reverse same as original tracestate parse chain
            .slice(0, MAX_TRACE_STATE_ITEMS));
        }
    }
    // @ts-expect-error TS6133 Accessed in tests only.
    _keys() {
        return Array.from(this._internalState.keys()).reverse();
    }
    _clone() {
        const traceState = new TraceStateImpl();
        traceState._internalState = new Map(this._internalState);
        return traceState;
    }
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-validators.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "validateKey",
    ()=>validateKey,
    "validateValue",
    ()=>validateValue
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ const VALID_KEY_CHAR_RANGE = '[_0-9a-z-*/]';
const VALID_KEY = `[a-z]${VALID_KEY_CHAR_RANGE}{0,255}`;
const VALID_VENDOR_KEY = `[a-z0-9]${VALID_KEY_CHAR_RANGE}{0,240}@[a-z]${VALID_KEY_CHAR_RANGE}{0,13}`;
const VALID_KEY_REGEX = new RegExp(`^(?:${VALID_KEY}|${VALID_VENDOR_KEY})$`);
const VALID_VALUE_BASE_REGEX = /^[ -~]{0,255}[!-~]$/;
const INVALID_VALUE_COMMA_EQUAL_REGEX = /,|=/;
function validateKey(key) {
    return VALID_KEY_REGEX.test(key);
}
function validateValue(value) {
    return VALID_VALUE_BASE_REGEX.test(value) && !INVALID_VALUE_COMMA_EQUAL_REGEX.test(value);
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/internal/utils.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createTraceState",
    ()=>createTraceState
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$internal$2f$tracestate$2d$impl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/internal/tracestate-impl.js [app-route] (ecmascript)");
;
function createTraceState(rawTraceState) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$internal$2f$tracestate$2d$impl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TraceStateImpl"](rawTraceState);
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "INVALID_SPANID",
    ()=>INVALID_SPANID,
    "INVALID_SPAN_CONTEXT",
    ()=>INVALID_SPAN_CONTEXT,
    "INVALID_TRACEID",
    ()=>INVALID_TRACEID
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js [app-route] (ecmascript)");
;
const INVALID_SPANID = '0000000000000000';
const INVALID_TRACEID = '00000000000000000000000000000000';
const INVALID_SPAN_CONTEXT = {
    traceId: INVALID_TRACEID,
    spanId: INVALID_SPANID,
    traceFlags: __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$trace_flags$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TraceFlags"].NONE
};
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/span_kind.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * @since 1.0.0
 */ __turbopack_context__.s([
    "SpanKind",
    ()=>SpanKind
]);
var SpanKind;
(function(SpanKind) {
    /** Default value. Indicates that the span is used internally. */ SpanKind[SpanKind["INTERNAL"] = 0] = "INTERNAL";
    /**
     * Indicates that the span covers server-side handling of an RPC or other
     * remote request.
     */ SpanKind[SpanKind["SERVER"] = 1] = "SERVER";
    /**
     * Indicates that the span covers the client-side wrapper around an RPC or
     * other remote request.
     */ SpanKind[SpanKind["CLIENT"] = 2] = "CLIENT";
    /**
     * Indicates that the span describes producer sending a message to a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */ SpanKind[SpanKind["PRODUCER"] = 3] = "PRODUCER";
    /**
     * Indicates that the span describes consumer receiving a message from a
     * broker. Unlike client and server, there is no direct critical path latency
     * relationship between producer and consumer spans.
     */ SpanKind[SpanKind["CONSUMER"] = 4] = "CONSUMER";
})(SpanKind || (SpanKind = {}));
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/spancontext-utils.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isSpanContextValid",
    ()=>isSpanContextValid,
    "isValidSpanId",
    ()=>isValidSpanId,
    "isValidTraceId",
    ()=>isValidTraceId,
    "wrapSpanContext",
    ()=>wrapSpanContext
]);
/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/invalid-span-constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@opentelemetry/api/build/esm/trace/NonRecordingSpan.js [app-route] (ecmascript)");
;
;
// Valid characters (0-9, a-f, A-F) are marked as 1.
const isHex = new Uint8Array([
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    0,
    1,
    1,
    1,
    1,
    1,
    1
]);
function isValidHex(id, length) {
    // As of 1.9.0 the id was allowed to be a non-string value,
    // even though it was not possible in the types.
    if (typeof id !== 'string' || id.length !== length) return false;
    let r = 0;
    for(let i = 0; i < id.length; i += 4){
        r += (isHex[id.charCodeAt(i)] | 0) + (isHex[id.charCodeAt(i + 1)] | 0) + (isHex[id.charCodeAt(i + 2)] | 0) + (isHex[id.charCodeAt(i + 3)] | 0);
    }
    return r === length;
}
function isValidTraceId(traceId) {
    return isValidHex(traceId, 32) && traceId !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INVALID_TRACEID"];
}
function isValidSpanId(spanId) {
    return isValidHex(spanId, 16) && spanId !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$invalid$2d$span$2d$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["INVALID_SPANID"];
}
function isSpanContextValid(spanContext) {
    return isValidTraceId(spanContext.traceId) && isValidSpanId(spanContext.spanId);
}
function wrapSpanContext(spanContext) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$opentelemetry$2f$api$2f$build$2f$esm$2f$trace$2f$NonRecordingSpan$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["NonRecordingSpan"](spanContext);
}
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/status.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * An enumeration of status codes.
 *
 * @since 1.0.0
 */ __turbopack_context__.s([
    "SpanStatusCode",
    ()=>SpanStatusCode
]);
var SpanStatusCode;
(function(SpanStatusCode) {
    /**
     * The default status.
     */ SpanStatusCode[SpanStatusCode["UNSET"] = 0] = "UNSET";
    /**
     * The operation has been validated by an Application developer or
     * Operator to have completed successfully.
     */ SpanStatusCode[SpanStatusCode["OK"] = 1] = "OK";
    /**
     * The operation contains an error.
     */ SpanStatusCode[SpanStatusCode["ERROR"] = 2] = "ERROR";
})(SpanStatusCode || (SpanStatusCode = {}));
}),
"[project]/node_modules/@opentelemetry/api/build/esm/trace/trace_flags.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ /**
 * @since 1.0.0
 */ __turbopack_context__.s([
    "TraceFlags",
    ()=>TraceFlags
]);
var TraceFlags;
(function(TraceFlags) {
    /** Represents no flag set. */ TraceFlags[TraceFlags["NONE"] = 0] = "NONE";
    /** Bit to represent whether trace is sampled in trace flags. */ TraceFlags[TraceFlags["SAMPLED"] = 1] = "SAMPLED";
})(TraceFlags || (TraceFlags = {}));
}),
"[project]/node_modules/@opentelemetry/api/build/esm/version.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/*
 * Copyright The OpenTelemetry Authors
 * SPDX-License-Identifier: Apache-2.0
 */ // this is autogenerated file, see scripts/version-update.js
__turbopack_context__.s([
    "VERSION",
    ()=>VERSION
]);
const VERSION = '1.9.1';
}),
"[project]/node_modules/@react-email/body/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Body",
    ()=>Body
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/margin-properties.ts
const marginProperties = [
    "margin",
    "marginTop",
    "marginBottom",
    "marginRight",
    "marginLeft",
    "marginInline",
    "marginBlock",
    "marginBlockStart",
    "marginBlockEnd",
    "marginInlineStart",
    "marginInlineEnd"
];
const paddingProperties = [
    "padding",
    "paddingTop",
    "paddingBottom",
    "paddingRight",
    "paddingLeft",
    "paddingInline",
    "paddingBlock",
    "paddingBlockStart",
    "paddingBlockEnd",
    "paddingInlineStart",
    "paddingInlineEnd"
];
//#endregion
//#region src/body.tsx
const Body = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ children, style, ...props }, ref)=>{
    const bodyStyle = {
        background: style?.background,
        backgroundColor: style?.backgroundColor
    };
    if (style) for (const property of [
        ...marginProperties,
        ...paddingProperties
    ])bodyStyle[property] = style[property] !== void 0 ? 0 : void 0;
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("body", {
        ...props,
        style: bodyStyle,
        ref,
        children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("table", {
            border: 0,
            width: "100%",
            cellPadding: "0",
            cellSpacing: "0",
            role: "presentation",
            align: "center",
            children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("tbody", {
                children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("tr", {
                    children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("td", {
                        style,
                        children
                    })
                })
            })
        })
    });
});
Body.displayName = "Body";
;
}),
"[project]/node_modules/@react-email/button/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Button",
    ()=>Button
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/utils/parse-padding.ts
/**
* converts padding value to `px` equivalent.
* @example "1em" =\> 16
*/ function convertToPx(value) {
    let px = 0;
    if (!value) return px;
    if (typeof value === "number") return value;
    const matches = /^([\d.]+)(px|em|rem|%)$/.exec(value);
    if (matches && matches.length === 3) {
        const numValue = Number.parseFloat(matches[1]);
        switch(matches[2]){
            case "px":
                return numValue;
            case "em":
            case "rem":
                px = numValue * 16;
                return px;
            case "%":
                px = numValue / 100 * 600;
                return px;
            default:
                return numValue;
        }
    }
    return 0;
}
function parsePaddingValue(value) {
    if (typeof value === "number") return {
        paddingTop: value,
        paddingBottom: value,
        paddingLeft: value,
        paddingRight: value
    };
    if (typeof value === "string") {
        const values = value.toString().trim().split(/\s+/);
        if (values.length === 1) return {
            paddingTop: values[0],
            paddingBottom: values[0],
            paddingLeft: values[0],
            paddingRight: values[0]
        };
        if (values.length === 2) return {
            paddingTop: values[0],
            paddingRight: values[1],
            paddingBottom: values[0],
            paddingLeft: values[1]
        };
        if (values.length === 3) return {
            paddingTop: values[0],
            paddingRight: values[1],
            paddingBottom: values[2],
            paddingLeft: values[1]
        };
        if (values.length === 4) return {
            paddingTop: values[0],
            paddingRight: values[1],
            paddingBottom: values[2],
            paddingLeft: values[3]
        };
    }
    return {
        paddingTop: void 0,
        paddingBottom: void 0,
        paddingLeft: void 0,
        paddingRight: void 0
    };
}
/**
* Parses all the values out of a padding string to get the value for all padding props in `px`
* @example e.g. "10px" =\> pt: 10, pr: 10, pb: 10, pl: 10
*/ function parsePadding(properties) {
    let paddingTop;
    let paddingRight;
    let paddingBottom;
    let paddingLeft;
    for (const [key, value] of Object.entries(properties))if (key === "padding") ({ paddingTop, paddingBottom, paddingLeft, paddingRight } = parsePaddingValue(value));
    else if (key === "paddingTop") paddingTop = value;
    else if (key === "paddingRight") paddingRight = value;
    else if (key === "paddingBottom") paddingBottom = value;
    else if (key === "paddingLeft") paddingLeft = value;
    return {
        paddingTop: paddingTop ? convertToPx(paddingTop) : void 0,
        paddingRight: paddingRight ? convertToPx(paddingRight) : void 0,
        paddingBottom: paddingBottom ? convertToPx(paddingBottom) : void 0,
        paddingLeft: paddingLeft ? convertToPx(paddingLeft) : void 0
    };
}
//#endregion
//#region src/utils/px-to-pt.ts
const pxToPt = (px)=>typeof px === "number" && !Number.isNaN(Number(px)) ? px * 3 / 4 : void 0;
//#endregion
//#region src/button.tsx
const maxFontWidth = 5;
/**
* Computes a msoFontWidth \<= 5 and a count of space characters that,
* when applied, end up being as close to `expectedWidth` as possible.
*/ function computeFontWidthAndSpaceCount(expectedWidth) {
    if (expectedWidth === 0) return [
        0,
        0
    ];
    let smallestSpaceCount = 0;
    const computeRequiredFontWidth = ()=>{
        if (smallestSpaceCount > 0) return expectedWidth / smallestSpaceCount / 2;
        return Number.POSITIVE_INFINITY;
    };
    while(computeRequiredFontWidth() > maxFontWidth)smallestSpaceCount++;
    return [
        computeRequiredFontWidth(),
        smallestSpaceCount
    ];
}
const Button = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ children, style, target = "_blank", ...props }, ref)=>{
    const { paddingTop, paddingRight, paddingBottom, paddingLeft } = parsePadding(style ?? {});
    const textRaise = pxToPt((paddingTop ?? 0) + (paddingBottom ?? 0));
    const [plFontWidth, plSpaceCount] = computeFontWidthAndSpaceCount(paddingLeft ?? 0);
    const [prFontWidth, prSpaceCount] = computeFontWidthAndSpaceCount(paddingRight ?? 0);
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsxs"])("a", {
        ...props,
        ref,
        style: {
            lineHeight: "100%",
            textDecoration: "none",
            display: "inline-block",
            maxWidth: "100%",
            msoPaddingAlt: "0px",
            ...style,
            paddingTop,
            paddingRight,
            paddingBottom,
            paddingLeft
        },
        target,
        children: [
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("span", {
                dangerouslySetInnerHTML: {
                    __html: `<!--[if mso]><i style="mso-font-width:${plFontWidth * 100}%;mso-text-raise:${textRaise}" hidden>${"&#8202;".repeat(plSpaceCount)}</i><![endif]-->`
                }
            }),
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("span", {
                style: {
                    maxWidth: "100%",
                    display: "inline-block",
                    lineHeight: "120%",
                    msoPaddingAlt: "0px",
                    msoTextRaise: pxToPt(paddingBottom)
                },
                children
            }),
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("span", {
                dangerouslySetInnerHTML: {
                    __html: `<!--[if mso]><i style="mso-font-width:${prFontWidth * 100}%" hidden>${"&#8202;".repeat(prSpaceCount)}&#8203;</i><![endif]-->`
                }
            })
        ]
    });
});
Button.displayName = "Button";
;
}),
"[project]/node_modules/@react-email/container/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Container",
    ()=>Container
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/container.tsx
const Container = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ children, style, ...props }, ref)=>{
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("table", {
        align: "center",
        width: "100%",
        ...props,
        border: 0,
        cellPadding: "0",
        cellSpacing: "0",
        ref,
        role: "presentation",
        style: {
            maxWidth: "37.5em",
            ...style
        },
        children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("tbody", {
            children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("tr", {
                style: {
                    width: "100%"
                },
                children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("td", {
                    children
                })
            })
        })
    });
});
Container.displayName = "Container";
;
}),
"[project]/node_modules/@react-email/head/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Head",
    ()=>Head
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/head.tsx
const Head = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ children, ...props }, ref)=>/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsxs"])("head", {
        ...props,
        ref,
        children: [
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("meta", {
                content: "text/html; charset=UTF-8",
                httpEquiv: "Content-Type"
            }),
            /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("meta", {
                name: "x-apple-disable-message-reformatting"
            }),
            children
        ]
    }));
Head.displayName = "Head";
;
}),
"[project]/node_modules/@react-email/heading/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Heading",
    ()=>Heading
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/utils/spaces.ts
const withMargin = (props)=>{
    const candidates = [
        withSpace(props.m, [
            "margin"
        ]),
        withSpace(props.mx, [
            "marginLeft",
            "marginRight"
        ]),
        withSpace(props.my, [
            "marginTop",
            "marginBottom"
        ]),
        withSpace(props.mt, [
            "marginTop"
        ]),
        withSpace(props.mr, [
            "marginRight"
        ]),
        withSpace(props.mb, [
            "marginBottom"
        ]),
        withSpace(props.ml, [
            "marginLeft"
        ])
    ];
    const mergedStyles = {};
    for (const style of candidates)if (Object.keys(style).length > 0) Object.assign(mergedStyles, style);
    return mergedStyles;
};
const withSpace = (value, properties)=>{
    const styles = {};
    if (value === void 0) return styles;
    if (Number.isNaN(Number.parseFloat(String(value)))) return styles;
    for (const property of properties)styles[property] = `${value}px`;
    return styles;
};
//#endregion
//#region src/heading.tsx
const Heading = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ as: Tag = "h1", children, style, m, mx, my, mt, mr, mb, ml, ...props }, ref)=>{
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])(Tag, {
        ...props,
        ref,
        style: {
            ...withMargin({
                m,
                mx,
                my,
                mt,
                mr,
                mb,
                ml
            }),
            ...style
        },
        children
    });
});
Heading.displayName = "Heading";
;
}),
"[project]/node_modules/@react-email/hr/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Hr",
    ()=>Hr
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/hr.tsx
const Hr = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ style, ...props }, ref)=>/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("hr", {
        ...props,
        ref,
        style: {
            width: "100%",
            border: "none",
            borderTop: "1px solid #eaeaea",
            ...style
        }
    }));
Hr.displayName = "Hr";
;
}),
"[project]/node_modules/@react-email/html/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Html",
    ()=>Html
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/html.tsx
const Html = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ children, lang = "en", dir = "ltr", ...props }, ref)=>/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("html", {
        ...props,
        dir,
        lang,
        ref,
        children
    }));
Html.displayName = "Html";
;
}),
"[project]/node_modules/@react-email/render/dist/node/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

return __turbopack_context__.a(async (__turbopack_handle_async_dependencies__, __turbopack_async_result__) => { try {
__turbopack_context__.s([
    "plainTextSelectors",
    ()=>plainTextSelectors,
    "pretty",
    ()=>pretty,
    "render",
    ()=>render,
    "toPlainText",
    ()=>toPlainText,
    "unstableToPlainText",
    ()=>unstableToPlainText
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$plugins$2f$html__$5b$external$5d$__$28$prettier$2f$plugins$2f$html$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__ = __turbopack_context__.i("[externals]/prettier/plugins/html [external] (prettier/plugins/html, esm_import, [project]/node_modules/prettier)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$standalone__$5b$external$5d$__$28$prettier$2f$standalone$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__ = __turbopack_context__.i("[externals]/prettier/standalone [external] (prettier/standalone, esm_import, [project]/node_modules/prettier)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html$2d$to$2d$text$2f$lib$2f$html$2d$to$2d$text$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html-to-text/lib/html-to-text.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/decode.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html5parser$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/html5parser/dist/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:stream [external] (node:stream, cjs)");
var __turbopack_async_dependencies__ = __turbopack_handle_async_dependencies__([
    __TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$plugins$2f$html__$5b$external$5d$__$28$prettier$2f$plugins$2f$html$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__,
    __TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$standalone__$5b$external$5d$__$28$prettier$2f$standalone$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__
]);
[__TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$plugins$2f$html__$5b$external$5d$__$28$prettier$2f$plugins$2f$html$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__, __TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$standalone__$5b$external$5d$__$28$prettier$2f$standalone$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__] = __turbopack_async_dependencies__.then ? (await __turbopack_async_dependencies__)() : __turbopack_async_dependencies__;
;
;
;
;
;
;
;
;
//#region src/shared/utils/pretty.ts
function getHtmlNode(path) {
    const topNode = path.node;
    if (topNode) return topNode;
    return path.stack?.[path.stack.length - 1];
}
function recursivelyMapDoc(doc, callback) {
    if (Array.isArray(doc)) return doc.map((innerDoc)=>recursivelyMapDoc(innerDoc, callback));
    if (typeof doc === "object") {
        if (doc.type === "line") return callback(doc.soft ? "" : " ");
        if (doc.type === "group") return {
            ...doc,
            contents: recursivelyMapDoc(doc.contents, callback),
            expandedStates: recursivelyMapDoc(doc.expandedStates, callback)
        };
        if ("contents" in doc) return {
            ...doc,
            contents: recursivelyMapDoc(doc.contents, callback)
        };
        if ("parts" in doc) return {
            ...doc,
            parts: recursivelyMapDoc(doc.parts, callback)
        };
        if (doc.type === "if-break") return {
            ...doc,
            breakContents: recursivelyMapDoc(doc.breakContents, callback),
            flatContents: recursivelyMapDoc(doc.flatContents, callback)
        };
        const nextDoc = {
            ...doc
        };
        for (const [key, value] of Object.entries(nextDoc))if (value && typeof value === "object") nextDoc[key] = recursivelyMapDoc(value, callback);
        return nextDoc;
    }
    return callback(doc);
}
const modifiedHtml = {
    ...__TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$plugins$2f$html__$5b$external$5d$__$28$prettier$2f$plugins$2f$html$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__
};
if (modifiedHtml.printers) {
    const previousPrint = modifiedHtml.printers.html.print;
    modifiedHtml.printers.html.print = (path, options, print, args)=>{
        const node = getHtmlNode(path);
        const rawPrintingResult = previousPrint(path, options, print, args);
        if (node?.type === "ieConditionalComment" || node?.kind === "ieConditionalComment") return recursivelyMapDoc(rawPrintingResult, (doc)=>{
            if (typeof doc === "object" && doc.type === "line") return doc.soft ? "" : " ";
            return doc;
        });
        return rawPrintingResult;
    };
}
const defaults = {
    endOfLine: "lf",
    tabWidth: 2,
    plugins: [
        modifiedHtml
    ],
    bracketSameLine: true,
    parser: "html"
};
const pretty = (str, options = {})=>{
    return (0, __TURBOPACK__imported__module__$5b$externals$5d2f$prettier$2f$standalone__$5b$external$5d$__$28$prettier$2f$standalone$2c$__esm_import$2c$__$5b$project$5d2f$node_modules$2f$prettier$29$__["format"])(str.replaceAll("\0", ""), {
        ...defaults,
        ...options
    });
};
//#endregion
//#region src/shared/utils/to-plain-text.ts
const plainTextSelectors = [
    {
        selector: "img",
        format: "skip"
    },
    {
        selector: "[data-skip-in-text=true]",
        format: "skip"
    },
    {
        selector: "a",
        options: {
            linkBrackets: false,
            hideLinkHrefIfSameAsText: true
        }
    },
    {
        selector: "[data-text-format=\"dataTable\"]",
        format: "dataTable"
    }
];
function toPlainText(html, options) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html$2d$to$2d$text$2f$lib$2f$html$2d$to$2d$text$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["convert"])(html, {
        wordwrap: false,
        ...options,
        selectors: [
            ...plainTextSelectors,
            ...options?.selectors ?? []
        ]
    });
}
//#endregion
//#region src/shared/utils/unstable-to-plain-text.ts
const SKIPPED_TAGS = new Set([
    "img",
    "noscript",
    "script",
    "style",
    "template"
]);
const WHITESPACE_RUN = /([ \t\n\r\f\u200b]+)/;
const TAG_BLOCKS = {
    article: {
        open: 2,
        close: 2
    },
    aside: {
        open: 2,
        close: 2
    },
    blockquote: {
        open: 2,
        close: 2,
        prefix: {
            first: "> ",
            rest: "> "
        }
    },
    div: {
        open: 2,
        close: 2
    },
    footer: {
        open: 2,
        close: 2
    },
    form: {
        open: 2,
        close: 2
    },
    h1: {
        open: 3,
        close: 2
    },
    h2: {
        open: 3,
        close: 2
    },
    h3: {
        open: 3,
        close: 2
    },
    h4: {
        open: 3,
        close: 2
    },
    h5: {
        open: 3,
        close: 2
    },
    h6: {
        open: 3,
        close: 2
    },
    header: {
        open: 2,
        close: 2
    },
    hr: {
        open: 2,
        close: 2
    },
    main: {
        open: 2,
        close: 2
    },
    nav: {
        open: 2,
        close: 2
    },
    p: {
        open: 2,
        close: 2
    },
    pre: {
        open: 2,
        close: 2
    },
    section: {
        open: 2,
        close: 2
    },
    table: {
        open: 2,
        close: 2
    }
};
function unstableToPlainText(html) {
    const tree = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html5parser$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parse"])(html, {
        setAttributeMap: true
    });
    const body = findBody(tree);
    const blocks = [
        {
            block: {
                open: 0,
                close: 0
            },
            text: [],
            leading: 0,
            stash: 0,
            space: false
        }
    ];
    const stack = [
        {
            parent: body,
            children: body?.body ?? tree,
            index: 0,
            pre: false,
            opened: false,
            textFrom: 0,
            orderedList: void 0
        }
    ];
    while(stack.length > 0){
        const frame = stack[stack.length - 1];
        const node = frame.children[frame.index];
        if (node === void 0) {
            stack.pop();
            exitElement(frame.parent, frame);
            continue;
        }
        frame.index += 1;
        enterNode(node, frame);
    }
    function top() {
        return blocks[blocks.length - 1];
    }
    function writeWord(value) {
        const block = top();
        if (block.stash > 0) block.text.push("\n".repeat(block.stash));
        else if (block.space && block.text.length > 0) block.text.push(" ");
        block.stash = 0;
        block.space = false;
        block.text.push(value);
    }
    function enterNode(node, frame) {
        if (node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html5parser$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SyntaxKind"].Text) {
            const value = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["decodeHTML"])(node.value);
            if (frame.pre) {
                if (value.length > 0) writeWord(value);
            } else {
                const segments = value.split(WHITESPACE_RUN);
                for(let i = 0; i < segments.length; i++){
                    const segment = segments[i];
                    if (segment.length === 0) continue;
                    if (i % 2 === 1) top().space = true;
                    else writeWord(segment);
                }
            }
            return;
        }
        if (SKIPPED_TAGS.has(node.name) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["decodeHTMLAttribute"])(node.attributeMap?.["data-skip-in-text"]?.value?.value ?? "") === "true") return;
        const parentTag = frame.parent?.name;
        let block = TAG_BLOCKS[node.name];
        let orderedList;
        if (node.name === "ul") {
            const breaks = parentTag === "li" ? 1 : 2;
            block = {
                open: breaks,
                close: breaks
            };
        } else if (node.name === "li" && parentTag === "ul") block = {
            open: 1,
            close: 1,
            prefix: stack[stack.length - 2]?.parent?.name === "li" ? {
                first: "* ",
                rest: "  "
            } : {
                first: " * ",
                rest: "   "
            }
        };
        else if (node.name === "ol") {
            const nested = parentTag === "li";
            const parsedStart = Number.parseInt((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["decodeHTMLAttribute"])(node.attributeMap?.start?.value?.value ?? "1"), 10);
            const start = Number.isNaN(parsedStart) ? 1 : parsedStart;
            const itemCount = node.body?.filter((child)=>child.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html5parser$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SyntaxKind"].Tag && child.name === "li").length ?? 0;
            let prefixLength = 0;
            for(let index = start; index < start + itemCount; index++){
                const prefix = `${nested ? "" : " "}${index}. `;
                prefixLength = Math.max(prefixLength, prefix.length);
            }
            const breaks = nested ? 1 : 2;
            block = {
                open: breaks,
                close: breaks
            };
            orderedList = {
                next: start,
                prefixLength,
                nested
            };
        } else if (node.name === "li" && parentTag === "ol" && frame.orderedList) {
            const list = frame.orderedList;
            block = {
                open: 1,
                close: 1,
                prefix: {
                    first: `${list.nested ? "" : " "}${list.next++}. `.padEnd(list.prefixLength),
                    rest: " ".repeat(list.prefixLength)
                }
            };
        }
        if (block) blocks.push({
            block,
            text: [],
            leading: block.open,
            stash: 0,
            space: false
        });
        if (node.name === "hr") writeWord("-".repeat(40));
        else if (node.name === "br") {
            top().space = false;
            top().text.push("\n");
        }
        stack.push({
            parent: node,
            children: node.body ?? [],
            index: 0,
            pre: frame.pre || node.name === "pre",
            opened: block !== void 0,
            textFrom: top().text.length,
            orderedList
        });
    }
    function exitElement(element, frame) {
        if (element === void 0) return;
        if (element.name === "a") {
            const href = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["decodeHTMLAttribute"])(element.attributeMap?.href?.value?.value ?? "").replace(/^mailto:/, "");
            if (href.length > 0 && !href.startsWith("#")) {
                const anchorText = top().text.slice(frame.textFrom).join("");
                if (anchorText !== href) {
                    if (anchorText.length > 0) top().space = true;
                    writeWord(href);
                }
            }
        }
        if (frame.opened) closeBlock();
    }
    function closeBlock() {
        const child = blocks.pop();
        if (child === void 0) return;
        const parent = blocks[blocks.length - 1];
        let content = child.text.join("");
        const prefix = child.block.prefix;
        if (prefix !== void 0) {
            const trimmed = content.replace(/^\n+|\n+$/g, "");
            content = prefix.first + trimmed.replaceAll("\n", `\n${prefix.rest}`);
        }
        const breaks = Math.max(parent.stash, child.leading);
        if (parent.text.length > 0) {
            parent.text.push("\n".repeat(breaks));
            if (content.length > 0) parent.text.push(content);
        } else {
            if (content.length > 0) parent.text.push(content);
            parent.leading = breaks;
        }
        parent.stash = Math.max(child.stash, child.block.close);
    }
    return blocks[0].text.join("");
}
function findBody(tree) {
    for (const child of tree){
        if (child.type !== __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html5parser$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SyntaxKind"].Tag || child.name !== "html") continue;
        for (const inner of child.body ?? [])if (inner.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$html5parser$2f$dist$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SyntaxKind"].Tag && inner.name === "body") return inner;
    }
}
//#endregion
//#region src/shared/error-boundary.tsx
function createErrorBoundary(reject) {
    if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].Component) return (props)=>/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Fragment"], {
            children: props.children
        });
    return class ErrorBoundary extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"].Component {
        componentDidCatch(error) {
            reject(error);
        }
        render() {
            return this.props.children;
        }
    };
}
//#endregion
//#region src/shared/utils/strip-image-preload-links.ts
/**
* React injects `<link rel="preload" as="image" />` resource hints into the
* document `<head>` for every `<img>` it renders during server-side rendering.
*
* These hints are meant for browsers loading a web page, where they can speed
* up the initial paint. In an email they are dead weight: email clients ignore
* `<link rel="preload">`, and the tags only add noise to the rendered HTML.
*
* @see https://github.com/resend/react-email/issues/3034
*
* This removes only those auto-injected image preload links, leaving every
* other `<link>` (stylesheets, fonts, user-authored non-image preloads, ...)
* untouched. It parses each `<link>` tag's attributes instead of relying on a
* fixed string match, so it is not affected by attribute order or spacing.
*/ const stripImagePreloadLinks = (html)=>{
    return html.replace(/<link\b[^>]*\/?>/gi, (tag)=>isImagePreloadLink(tag) ? "" : tag);
};
const isImagePreloadLink = (tag)=>{
    const attributes = parseAttributes(tag);
    return attributes.rel === "preload" && attributes.as === "image";
};
const ATTRIBUTE_PATTERN = /([a-z][a-z0-9-]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"'>]+)))?/gi;
/**
* Parses the attributes of a single, already-isolated HTML tag string (e.g.
* `<link rel="preload" as="image" href="..." />`) into a name → value map.
* Attribute names are lower-cased; values are read from double, single, or
* unquoted forms.
*/ const parseAttributes = (tag)=>{
    const attributeSection = tag.replace(/^<[a-z][a-z0-9-]*/i, "");
    const attributes = {};
    for (const [, name, doubleQuoted, singleQuoted, unquoted] of attributeSection.matchAll(ATTRIBUTE_PATTERN))attributes[name.toLowerCase()] = doubleQuoted ?? singleQuoted ?? unquoted ?? "";
    return attributes;
};
//#endregion
//#region src/node/read-stream.ts
const readStream = async (stream)=>{
    let result = "";
    const decoder = new TextDecoder("utf-8");
    if ("pipeTo" in stream) {
        const writableStream = new WritableStream({
            write (chunk) {
                result += decoder.decode(chunk, {
                    stream: true
                });
            },
            close () {
                result += decoder.decode();
            }
        });
        await stream.pipeTo(writableStream);
    } else {
        const writable = new __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$stream__$5b$external$5d$__$28$node$3a$stream$2c$__cjs$29$__["Writable"]({
            write (chunk, _encoding, callback) {
                result += decoder.decode(chunk, {
                    stream: true
                });
                callback();
            },
            final (callback) {
                result += decoder.decode();
                callback();
            }
        });
        await new Promise((resolve, reject)=>{
            writable.on("pipe", (source)=>{
                source.on("error", (err)=>{
                    writable.destroy(err);
                });
            });
            writable.on("error", reject);
            writable.on("close", ()=>{
                resolve();
            });
            stream.pipe(writable);
        });
    }
    return result;
};
//#endregion
//#region src/node/render.tsx
const render = async (node, options)=>{
    const reactDOMServer = await __turbopack_context__.A("[project]/node_modules/next/dist/compiled/react-dom/server.node.js [app-route] (ecmascript, async loader)").then((m)=>{
        if ("default" in m) return m.default;
        return m;
    });
    let html;
    await new Promise((resolve, reject)=>{
        if (Object.hasOwn(reactDOMServer, "renderToReadableStream") && typeof WritableStream !== "undefined") {
            const ErrorBoundary = createErrorBoundary(reject);
            reactDOMServer.renderToReadableStream(/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])(ErrorBoundary, {
                children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Suspense"], {
                    children: node
                })
            }), {
                progressiveChunkSize: Number.POSITIVE_INFINITY,
                onError (error) {
                    reject(error);
                }
            }).then(async (stream)=>{
                await stream.allReady;
                return readStream(stream);
            }).then((result)=>{
                html = result;
                resolve();
            }).catch(reject);
        } else {
            const ErrorBoundary = createErrorBoundary(reject);
            const stream = reactDOMServer.renderToPipeableStream(/* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])(ErrorBoundary, {
                children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Suspense"], {
                    children: node
                })
            }), {
                async onAllReady () {
                    html = await readStream(stream).then((s)=>{
                        return s.replaceAll("\0", "");
                    });
                    resolve();
                },
                onError (error) {
                    reject(error);
                },
                progressiveChunkSize: Number.POSITIVE_INFINITY
            });
        }
    });
    html = stripImagePreloadLinks(html);
    if (options?.plainText) return options.unstableTextConversion ? unstableToPlainText(html) : toPlainText(html, options.htmlToTextOptions);
    const document = `<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Transitional//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-transitional.dtd">${html.replace(/<!DOCTYPE.*?>/, "")}`;
    if (options?.pretty) return pretty(document);
    return document;
};
;
__turbopack_async_result__();
} catch(e) { __turbopack_async_result__(e); } }, false);}),
"[project]/node_modules/@react-email/section/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Section",
    ()=>Section
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/section.tsx
const Section = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ children, style, ...props }, ref)=>{
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("table", {
        align: "center",
        width: "100%",
        border: 0,
        cellPadding: "0",
        cellSpacing: "0",
        role: "presentation",
        ...props,
        ref,
        style,
        children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("tbody", {
            children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("tr", {
                children: /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("td", {
                    children
                })
            })
        })
    });
});
Section.displayName = "Section";
;
}),
"[project]/node_modules/@react-email/text/dist/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Text",
    ()=>Text
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/next/dist/server/route-modules/app-page/vendored/rsc/react-jsx-runtime.js [app-route] (ecmascript)");
;
;
//#region src/utils/compute-margins.ts
function parseMarginValue(value) {
    if (typeof value === "number") return {
        marginTop: value,
        marginBottom: value,
        marginLeft: value,
        marginRight: value
    };
    if (typeof value === "string") {
        const values = value.toString().trim().split(/\s+/);
        if (values.length === 1) return {
            marginTop: values[0],
            marginBottom: values[0],
            marginLeft: values[0],
            marginRight: values[0]
        };
        if (values.length === 2) return {
            marginTop: values[0],
            marginRight: values[1],
            marginBottom: values[0],
            marginLeft: values[1]
        };
        if (values.length === 3) return {
            marginTop: values[0],
            marginRight: values[1],
            marginBottom: values[2],
            marginLeft: values[1]
        };
        if (values.length === 4) return {
            marginTop: values[0],
            marginRight: values[1],
            marginBottom: values[2],
            marginLeft: values[3]
        };
    }
    return {
        marginTop: void 0,
        marginBottom: void 0,
        marginLeft: void 0,
        marginRight: void 0
    };
}
/**
* Parses all the values out of a margin string to get the value for all margin props in the four margin properties
* @example e.g. "10px" =\> mt: "10px", mr: "10px", mb: "10px", ml: "10px"
*/ function computeMargins(properties) {
    let result = {
        marginTop: void 0,
        marginRight: void 0,
        marginBottom: void 0,
        marginLeft: void 0
    };
    for (const [key, value] of Object.entries(properties))if (key === "margin") result = parseMarginValue(value);
    else if (key === "marginTop") result.marginTop = value;
    else if (key === "marginRight") result.marginRight = value;
    else if (key === "marginBottom") result.marginBottom = value;
    else if (key === "marginLeft") result.marginLeft = value;
    return result;
}
//#endregion
//#region src/text.tsx
const Text = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["forwardRef"](({ style, ...props }, ref)=>{
    /**
	* we do this clunky way of spreading these default margins because
	* if we were to simply spread, the ordering of the margins would be lost
	*
	* ex:
	* ```js
	* { ...{ marginTop: '16px', marginBottom: '16px' }, ...{ marginTop: '24px' } }
	* // would result in
	* { marginTop: '24px', marginBottom: '16px' }
	* // not the expected
	* { marginBottom: '16px', marginTop: '24px' }
	* ```
	*/ const defaultMargins = {};
    if (style?.marginTop === void 0) defaultMargins.marginTop = "16px";
    if (style?.marginBottom === void 0) defaultMargins.marginBottom = "16px";
    const margins = computeMargins({
        ...defaultMargins,
        ...style
    });
    return /* @__PURE__ */ (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$next$2f$dist$2f$server$2f$route$2d$modules$2f$app$2d$page$2f$vendored$2f$rsc$2f$react$2d$jsx$2d$runtime$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["jsx"])("p", {
        ...props,
        ref,
        style: {
            fontSize: "14px",
            lineHeight: "24px",
            ...style,
            ...margins
        }
    });
});
Text.displayName = "Text";
;
}),
"[project]/node_modules/@selderee/plugin-htmlparser2/lib/hp2-builder.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "hp2Builder",
    ()=>hp2Builder
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$selderee$2f$lib$2f$selderee$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/selderee/lib/selderee.mjs [app-route] (ecmascript)");
;
;
function hp2Builder(nodes) {
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$selderee$2f$lib$2f$selderee$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Picker"](handleArray(nodes));
}
function handleArray(nodes) {
    const matchers = nodes.map(handleNode);
    return (el, ...tail)=>matchers.flatMap((m)=>m(el, ...tail));
}
function handleNode(node) {
    switch(node.type){
        case 'terminal':
            {
                const result = [
                    node.valueContainer
                ];
                return (el, ...tail)=>result;
            }
        case 'tagName':
            return handleTagName(node);
        case 'attrValue':
            return handleAttrValueName(node);
        case 'attrPresence':
            return handleAttrPresenceName(node);
        case 'pushElement':
            return handlePushElementNode(node);
        case 'popElement':
            return handlePopElementNode(node);
    }
}
function handleTagName(node) {
    const variants = {};
    for (const variant of node.variants){
        variants[variant.value] = handleArray(variant.cont);
    }
    return (el, ...tail)=>{
        const continuation = variants[el.name];
        return continuation ? continuation(el, ...tail) : [];
    };
}
function handleAttrPresenceName(node) {
    const attrName = node.name;
    const continuation = handleArray(node.cont);
    return (el, ...tail)=>Object.prototype.hasOwnProperty.call(el.attribs, attrName) ? continuation(el, ...tail) : [];
}
function handleAttrValueName(node) {
    const callbacks = [];
    for (const matcher of node.matchers){
        const predicate = matcher.predicate;
        const continuation = handleArray(matcher.cont);
        callbacks.push((attr, el, ...tail)=>predicate(attr) ? continuation(el, ...tail) : []);
    }
    const attrName = node.name;
    return (el, ...tail)=>{
        const attr = el.attribs[attrName];
        return attr || attr === '' ? callbacks.flatMap((cb)=>cb(attr, el, ...tail)) : [];
    };
}
function handlePushElementNode(node) {
    const continuation = handleArray(node.cont);
    const leftElementGetter = node.combinator === '+' ? getPrecedingElement : getParentElement;
    return (el, ...tail)=>{
        const next = leftElementGetter(el);
        if (next === null) {
            return [];
        }
        return continuation(next, el, ...tail);
    };
}
const getPrecedingElement = (el)=>{
    const prev = el.prev;
    if (prev === null) {
        return null;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(prev) ? prev : getPrecedingElement(prev);
};
const getParentElement = (el)=>{
    const parent = el.parent;
    return parent && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(parent) ? parent : null;
};
function handlePopElementNode(node) {
    const continuation = handleArray(node.cont);
    return (el, next, ...tail)=>continuation(next, ...tail);
}
;
}),
"[project]/node_modules/deepmerge/dist/cjs.js [app-route] (ecmascript)", ((__turbopack_context__, module, exports) => {
"use strict";

var isMergeableObject = function isMergeableObject(value) {
    return isNonNullObject(value) && !isSpecial(value);
};
function isNonNullObject(value) {
    return !!value && typeof value === 'object';
}
function isSpecial(value) {
    var stringValue = Object.prototype.toString.call(value);
    return stringValue === '[object RegExp]' || stringValue === '[object Date]' || isReactElement(value);
}
// see https://github.com/facebook/react/blob/b5ac963fb791d1298e7f396236383bc955f916c1/src/isomorphic/classic/element/ReactElement.js#L21-L25
var canUseSymbol = typeof Symbol === 'function' && Symbol.for;
var REACT_ELEMENT_TYPE = canUseSymbol ? Symbol.for('react.element') : 0xeac7;
function isReactElement(value) {
    return value.$$typeof === REACT_ELEMENT_TYPE;
}
function emptyTarget(val) {
    return Array.isArray(val) ? [] : {};
}
function cloneUnlessOtherwiseSpecified(value, options) {
    return options.clone !== false && options.isMergeableObject(value) ? deepmerge(emptyTarget(value), value, options) : value;
}
function defaultArrayMerge(target, source, options) {
    return target.concat(source).map(function(element) {
        return cloneUnlessOtherwiseSpecified(element, options);
    });
}
function getMergeFunction(key, options) {
    if (!options.customMerge) {
        return deepmerge;
    }
    var customMerge = options.customMerge(key);
    return typeof customMerge === 'function' ? customMerge : deepmerge;
}
function getEnumerableOwnPropertySymbols(target) {
    return Object.getOwnPropertySymbols ? Object.getOwnPropertySymbols(target).filter(function(symbol) {
        return Object.propertyIsEnumerable.call(target, symbol);
    }) : [];
}
function getKeys(target) {
    return Object.keys(target).concat(getEnumerableOwnPropertySymbols(target));
}
function propertyIsOnObject(object, property) {
    try {
        return property in object;
    } catch (_) {
        return false;
    }
}
// Protects from prototype poisoning and unexpected merging up the prototype chain.
function propertyIsUnsafe(target, key) {
    return propertyIsOnObject(target, key) // Properties are safe to merge if they don't exist in the target yet,
     && !(Object.hasOwnProperty.call(target, key) // unsafe if they exist up the prototype chain,
     && Object.propertyIsEnumerable.call(target, key)) // and also unsafe if they're nonenumerable.
    ;
}
function mergeObject(target, source, options) {
    var destination = {};
    if (options.isMergeableObject(target)) {
        getKeys(target).forEach(function(key) {
            destination[key] = cloneUnlessOtherwiseSpecified(target[key], options);
        });
    }
    getKeys(source).forEach(function(key) {
        if (propertyIsUnsafe(target, key)) {
            return;
        }
        if (propertyIsOnObject(target, key) && options.isMergeableObject(source[key])) {
            destination[key] = getMergeFunction(key, options)(target[key], source[key], options);
        } else {
            destination[key] = cloneUnlessOtherwiseSpecified(source[key], options);
        }
    });
    return destination;
}
function deepmerge(target, source, options) {
    options = options || {};
    options.arrayMerge = options.arrayMerge || defaultArrayMerge;
    options.isMergeableObject = options.isMergeableObject || isMergeableObject;
    // cloneUnlessOtherwiseSpecified is added to `options` so that custom arrayMerge()
    // implementations can use it. The caller may not replace it.
    options.cloneUnlessOtherwiseSpecified = cloneUnlessOtherwiseSpecified;
    var sourceIsArray = Array.isArray(source);
    var targetIsArray = Array.isArray(target);
    var sourceAndTargetTypesMatch = sourceIsArray === targetIsArray;
    if (!sourceAndTargetTypesMatch) {
        return cloneUnlessOtherwiseSpecified(source, options);
    } else if (sourceIsArray) {
        return options.arrayMerge(target, source, options);
    } else {
        return mergeObject(target, source, options);
    }
}
deepmerge.all = function deepmergeAll(array, options) {
    if (!Array.isArray(array)) {
        throw new Error('first argument should be an array');
    }
    return array.reduce(function(prev, next) {
        return deepmerge(prev, next, options);
    }, {});
};
var deepmerge_1 = deepmerge;
module.exports = deepmerge_1;
}),
"[project]/node_modules/dom-serializer/lib/esm/foreignNames.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "attributeNames",
    ()=>attributeNames,
    "elementNames",
    ()=>elementNames
]);
const elementNames = new Map([
    "altGlyph",
    "altGlyphDef",
    "altGlyphItem",
    "animateColor",
    "animateMotion",
    "animateTransform",
    "clipPath",
    "feBlend",
    "feColorMatrix",
    "feComponentTransfer",
    "feComposite",
    "feConvolveMatrix",
    "feDiffuseLighting",
    "feDisplacementMap",
    "feDistantLight",
    "feDropShadow",
    "feFlood",
    "feFuncA",
    "feFuncB",
    "feFuncG",
    "feFuncR",
    "feGaussianBlur",
    "feImage",
    "feMerge",
    "feMergeNode",
    "feMorphology",
    "feOffset",
    "fePointLight",
    "feSpecularLighting",
    "feSpotLight",
    "feTile",
    "feTurbulence",
    "foreignObject",
    "glyphRef",
    "linearGradient",
    "radialGradient",
    "textPath"
].map((val)=>[
        val.toLowerCase(),
        val
    ]));
const attributeNames = new Map([
    "definitionURL",
    "attributeName",
    "attributeType",
    "baseFrequency",
    "baseProfile",
    "calcMode",
    "clipPathUnits",
    "diffuseConstant",
    "edgeMode",
    "filterUnits",
    "glyphRef",
    "gradientTransform",
    "gradientUnits",
    "kernelMatrix",
    "kernelUnitLength",
    "keyPoints",
    "keySplines",
    "keyTimes",
    "lengthAdjust",
    "limitingConeAngle",
    "markerHeight",
    "markerUnits",
    "markerWidth",
    "maskContentUnits",
    "maskUnits",
    "numOctaves",
    "pathLength",
    "patternContentUnits",
    "patternTransform",
    "patternUnits",
    "pointsAtX",
    "pointsAtY",
    "pointsAtZ",
    "preserveAlpha",
    "preserveAspectRatio",
    "primitiveUnits",
    "refX",
    "refY",
    "repeatCount",
    "repeatDur",
    "requiredExtensions",
    "requiredFeatures",
    "specularConstant",
    "specularExponent",
    "spreadMethod",
    "startOffset",
    "stdDeviation",
    "stitchTiles",
    "surfaceScale",
    "systemLanguage",
    "tableValues",
    "targetX",
    "targetY",
    "textLength",
    "viewBox",
    "viewTarget",
    "xChannelSelector",
    "yChannelSelector",
    "zoomAndPan"
].map((val)=>[
        val.toLowerCase(),
        val
    ]));
}),
"[project]/node_modules/dom-serializer/lib/esm/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "default",
    ()=>__TURBOPACK__default__export__,
    "render",
    ()=>render
]);
/*
 * Module dependencies
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/escape.js [app-route] (ecmascript)");
/**
 * Mixed-case SVG and MathML tags & attributes
 * recognized by the HTML parser.
 *
 * @see https://html.spec.whatwg.org/multipage/parsing.html#parsing-main-inforeign
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$foreignNames$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dom-serializer/lib/esm/foreignNames.js [app-route] (ecmascript)");
;
;
;
const unencodedElements = new Set([
    "style",
    "script",
    "xmp",
    "iframe",
    "noembed",
    "noframes",
    "plaintext",
    "noscript"
]);
function replaceQuotes(value) {
    return value.replace(/"/g, "&quot;");
}
/**
 * Format attributes
 */ function formatAttributes(attributes, opts) {
    var _a;
    if (!attributes) return;
    const encode = ((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) === false ? replaceQuotes : opts.xmlMode || opts.encodeEntities !== "utf8" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["encodeXML"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeAttribute"];
    return Object.keys(attributes).map((key)=>{
        var _a, _b;
        const value = (_a = attributes[key]) !== null && _a !== void 0 ? _a : "";
        if (opts.xmlMode === "foreign") {
            /* Fix up mixed-case attribute names */ key = (_b = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$foreignNames$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["attributeNames"].get(key)) !== null && _b !== void 0 ? _b : key;
        }
        if (!opts.emptyAttrs && !opts.xmlMode && value === "") {
            return key;
        }
        return `${key}="${encode(value)}"`;
    }).join(" ");
}
/**
 * Self-enclosing tags
 */ const singleTag = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);
function render(node, options = {}) {
    const nodes = "length" in node ? node : [
        node
    ];
    let output = "";
    for(let i = 0; i < nodes.length; i++){
        output += renderNode(nodes[i], options);
    }
    return output;
}
const __TURBOPACK__default__export__ = render;
function renderNode(node, options) {
    switch(node.type){
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Root"]:
            return render(node.children, options);
        // @ts-expect-error We don't use `Doctype` yet
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Doctype"]:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Directive"]:
            return renderDirective(node);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Comment"]:
            return renderComment(node);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CDATA"]:
            return renderCdata(node);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Script"]:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Style"]:
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Tag"]:
            return renderTag(node, options);
        case __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Text"]:
            return renderText(node, options);
    }
}
const foreignModeIntegrationPoints = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignObject",
    "desc",
    "title"
]);
const foreignElements = new Set([
    "svg",
    "math"
]);
function renderTag(elem, opts) {
    var _a;
    // Handle SVG / MathML in HTML
    if (opts.xmlMode === "foreign") {
        /* Fix up mixed-case element names */ elem.name = (_a = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$foreignNames$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["elementNames"].get(elem.name)) !== null && _a !== void 0 ? _a : elem.name;
        /* Exit foreign mode at integration points */ if (elem.parent && foreignModeIntegrationPoints.has(elem.parent.name)) {
            opts = {
                ...opts,
                xmlMode: false
            };
        }
    }
    if (!opts.xmlMode && foreignElements.has(elem.name)) {
        opts = {
            ...opts,
            xmlMode: "foreign"
        };
    }
    let tag = `<${elem.name}`;
    const attribs = formatAttributes(elem.attribs, opts);
    if (attribs) {
        tag += ` ${attribs}`;
    }
    if (elem.children.length === 0 && (opts.xmlMode ? opts.selfClosingTags !== false : opts.selfClosingTags && singleTag.has(elem.name))) {
        if (!opts.xmlMode) tag += " ";
        tag += "/>";
    } else {
        tag += ">";
        if (elem.children.length > 0) {
            tag += render(elem.children, opts);
        }
        if (opts.xmlMode || !singleTag.has(elem.name)) {
            tag += `</${elem.name}>`;
        }
    }
    return tag;
}
function renderDirective(elem) {
    return `<${elem.data}>`;
}
function renderText(elem, opts) {
    var _a;
    let data = elem.data || "";
    // If entities weren't decoded, no need to encode them back
    if (((_a = opts.encodeEntities) !== null && _a !== void 0 ? _a : opts.decodeEntities) !== false && !(!opts.xmlMode && elem.parent && unencodedElements.has(elem.parent.name))) {
        data = opts.xmlMode || opts.encodeEntities !== "utf8" ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["encodeXML"])(data) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$escape$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeText"])(data);
    }
    return data;
}
function renderCdata(elem) {
    return `<![CDATA[${elem.children[0].data}]]>`;
}
function renderComment(elem) {
    return `<!--${elem.data}-->`;
}
}),
"[project]/node_modules/domelementtype/lib/esm/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

/** Types of elements found in htmlparser2's DOM */ __turbopack_context__.s([
    "CDATA",
    ()=>CDATA,
    "Comment",
    ()=>Comment,
    "Directive",
    ()=>Directive,
    "Doctype",
    ()=>Doctype,
    "ElementType",
    ()=>ElementType,
    "Root",
    ()=>Root,
    "Script",
    ()=>Script,
    "Style",
    ()=>Style,
    "Tag",
    ()=>Tag,
    "Text",
    ()=>Text,
    "isTag",
    ()=>isTag
]);
var ElementType;
(function(ElementType) {
    /** Type for the root element of a document */ ElementType["Root"] = "root";
    /** Type for Text */ ElementType["Text"] = "text";
    /** Type for <? ... ?> */ ElementType["Directive"] = "directive";
    /** Type for <!-- ... --> */ ElementType["Comment"] = "comment";
    /** Type for <script> tags */ ElementType["Script"] = "script";
    /** Type for <style> tags */ ElementType["Style"] = "style";
    /** Type for Any tag */ ElementType["Tag"] = "tag";
    /** Type for <![CDATA[ ... ]]> */ ElementType["CDATA"] = "cdata";
    /** Type for <!doctype ...> */ ElementType["Doctype"] = "doctype";
})(ElementType || (ElementType = {}));
function isTag(elem) {
    return elem.type === ElementType.Tag || elem.type === ElementType.Script || elem.type === ElementType.Style;
}
const Root = ElementType.Root;
const Text = ElementType.Text;
const Directive = ElementType.Directive;
const Comment = ElementType.Comment;
const Script = ElementType.Script;
const Style = ElementType.Style;
const Tag = ElementType.Tag;
const CDATA = ElementType.CDATA;
const Doctype = ElementType.Doctype;
}),
"[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DomHandler",
    ()=>DomHandler,
    "default",
    ()=>__TURBOPACK__default__export__
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)");
;
;
;
// Default options
const defaultOpts = {
    withStartIndices: false,
    withEndIndices: false,
    xmlMode: false
};
class DomHandler {
    /**
     * @param callback Called once parsing has completed.
     * @param options Settings for the handler.
     * @param elementCB Callback whenever a tag is closed.
     */ constructor(callback, options, elementCB){
        /** The elements of the DOM */ this.dom = [];
        /** The root element for the DOM */ this.root = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Document"](this.dom);
        /** Indicated whether parsing has been completed. */ this.done = false;
        /** Stack of open tags. */ this.tagStack = [
            this.root
        ];
        /** A data node that is still being written to. */ this.lastNode = null;
        /** Reference to the parser instance. Used for location information. */ this.parser = null;
        // Make it possible to skip arguments, for backwards-compatibility
        if (typeof options === "function") {
            elementCB = options;
            options = defaultOpts;
        }
        if (typeof callback === "object") {
            options = callback;
            callback = undefined;
        }
        this.callback = callback !== null && callback !== void 0 ? callback : null;
        this.options = options !== null && options !== void 0 ? options : defaultOpts;
        this.elementCB = elementCB !== null && elementCB !== void 0 ? elementCB : null;
    }
    onparserinit(parser) {
        this.parser = parser;
    }
    // Resets the handler back to starting state
    onreset() {
        this.dom = [];
        this.root = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Document"](this.dom);
        this.done = false;
        this.tagStack = [
            this.root
        ];
        this.lastNode = null;
        this.parser = null;
    }
    // Signals the handler that parsing is done
    onend() {
        if (this.done) return;
        this.done = true;
        this.parser = null;
        this.handleCallback(null);
    }
    onerror(error) {
        this.handleCallback(error);
    }
    onclosetag() {
        this.lastNode = null;
        const elem = this.tagStack.pop();
        if (this.options.withEndIndices) {
            elem.endIndex = this.parser.endIndex;
        }
        if (this.elementCB) this.elementCB(elem);
    }
    onopentag(name, attribs) {
        const type = this.options.xmlMode ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Tag : undefined;
        const element = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Element"](name, attribs, undefined, type);
        this.addNode(element);
        this.tagStack.push(element);
    }
    ontext(data) {
        const { lastNode } = this;
        if (lastNode && lastNode.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Text) {
            lastNode.data += data;
            if (this.options.withEndIndices) {
                lastNode.endIndex = this.parser.endIndex;
            }
        } else {
            const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Text"](data);
            this.addNode(node);
            this.lastNode = node;
        }
    }
    oncomment(data) {
        if (this.lastNode && this.lastNode.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Comment) {
            this.lastNode.data += data;
            return;
        }
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Comment"](data);
        this.addNode(node);
        this.lastNode = node;
    }
    oncommentend() {
        this.lastNode = null;
    }
    oncdatastart() {
        const text = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Text"]("");
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CDATA"]([
            text
        ]);
        this.addNode(node);
        text.parent = node;
        this.lastNode = text;
    }
    oncdataend() {
        this.lastNode = null;
    }
    onprocessinginstruction(name, data) {
        const node = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProcessingInstruction"](name, data);
        this.addNode(node);
    }
    handleCallback(error) {
        if (typeof this.callback === "function") {
            this.callback(error, this.dom);
        } else if (error) {
            throw error;
        }
    }
    addNode(node) {
        const parent = this.tagStack[this.tagStack.length - 1];
        const previousSibling = parent.children[parent.children.length - 1];
        if (this.options.withStartIndices) {
            node.startIndex = this.parser.startIndex;
        }
        if (this.options.withEndIndices) {
            node.endIndex = this.parser.endIndex;
        }
        parent.children.push(node);
        if (previousSibling) {
            node.prev = previousSibling;
            previousSibling.next = node;
        }
        node.parent = parent;
        this.lastNode = null;
    }
}
const __TURBOPACK__default__export__ = DomHandler;
}),
"[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CDATA",
    ()=>CDATA,
    "Comment",
    ()=>Comment,
    "DataNode",
    ()=>DataNode,
    "Document",
    ()=>Document,
    "Element",
    ()=>Element,
    "Node",
    ()=>Node,
    "NodeWithChildren",
    ()=>NodeWithChildren,
    "ProcessingInstruction",
    ()=>ProcessingInstruction,
    "Text",
    ()=>Text,
    "cloneNode",
    ()=>cloneNode,
    "hasChildren",
    ()=>hasChildren,
    "isCDATA",
    ()=>isCDATA,
    "isComment",
    ()=>isComment,
    "isDirective",
    ()=>isDirective,
    "isDocument",
    ()=>isDocument,
    "isTag",
    ()=>isTag,
    "isText",
    ()=>isText
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-route] (ecmascript)");
;
class Node {
    constructor(){
        /** Parent of the node */ this.parent = null;
        /** Previous sibling */ this.prev = null;
        /** Next sibling */ this.next = null;
        /** The start index of the node. Requires `withStartIndices` on the handler to be `true. */ this.startIndex = null;
        /** The end index of the node. Requires `withEndIndices` on the handler to be `true. */ this.endIndex = null;
    }
    // Read-write aliases for properties
    /**
     * Same as {@link parent}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get parentNode() {
        return this.parent;
    }
    set parentNode(parent) {
        this.parent = parent;
    }
    /**
     * Same as {@link prev}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get previousSibling() {
        return this.prev;
    }
    set previousSibling(prev) {
        this.prev = prev;
    }
    /**
     * Same as {@link next}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get nextSibling() {
        return this.next;
    }
    set nextSibling(next) {
        this.next = next;
    }
    /**
     * Clone this node, and optionally its children.
     *
     * @param recursive Clone child nodes as well.
     * @returns A clone of the node.
     */ cloneNode(recursive = false) {
        return cloneNode(this, recursive);
    }
}
class DataNode extends Node {
    /**
     * @param data The content of the data node
     */ constructor(data){
        super();
        this.data = data;
    }
    /**
     * Same as {@link data}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get nodeValue() {
        return this.data;
    }
    set nodeValue(data) {
        this.data = data;
    }
}
class Text extends DataNode {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Text;
    }
    get nodeType() {
        return 3;
    }
}
class Comment extends DataNode {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Comment;
    }
    get nodeType() {
        return 8;
    }
}
class ProcessingInstruction extends DataNode {
    constructor(name, data){
        super(data);
        this.name = name;
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Directive;
    }
    get nodeType() {
        return 1;
    }
}
class NodeWithChildren extends Node {
    /**
     * @param children Children of the node. Only certain node types can have children.
     */ constructor(children){
        super();
        this.children = children;
    }
    // Aliases
    /** First child of the node. */ get firstChild() {
        var _a;
        return (_a = this.children[0]) !== null && _a !== void 0 ? _a : null;
    }
    /** Last child of the node. */ get lastChild() {
        return this.children.length > 0 ? this.children[this.children.length - 1] : null;
    }
    /**
     * Same as {@link children}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get childNodes() {
        return this.children;
    }
    set childNodes(children) {
        this.children = children;
    }
}
class CDATA extends NodeWithChildren {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].CDATA;
    }
    get nodeType() {
        return 4;
    }
}
class Document extends NodeWithChildren {
    constructor(){
        super(...arguments);
        this.type = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Root;
    }
    get nodeType() {
        return 9;
    }
}
class Element extends NodeWithChildren {
    /**
     * @param name Name of the tag, eg. `div`, `span`.
     * @param attribs Object mapping attribute names to attribute values.
     * @param children Children of the node.
     */ constructor(name, attribs, children = [], type = name === "script" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Script : name === "style" ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Style : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Tag){
        super(children);
        this.name = name;
        this.attribs = attribs;
        this.type = type;
    }
    get nodeType() {
        return 1;
    }
    // DOM Level 1 aliases
    /**
     * Same as {@link name}.
     * [DOM spec](https://dom.spec.whatwg.org)-compatible alias.
     */ get tagName() {
        return this.name;
    }
    set tagName(name) {
        this.name = name;
    }
    get attributes() {
        return Object.keys(this.attribs).map((name)=>{
            var _a, _b;
            return {
                name,
                value: this.attribs[name],
                namespace: (_a = this["x-attribsNamespace"]) === null || _a === void 0 ? void 0 : _a[name],
                prefix: (_b = this["x-attribsPrefix"]) === null || _b === void 0 ? void 0 : _b[name]
            };
        });
    }
}
function isTag(node) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(node);
}
function isCDATA(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].CDATA;
}
function isText(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Text;
}
function isComment(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Comment;
}
function isDirective(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Directive;
}
function isDocument(node) {
    return node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Root;
}
function hasChildren(node) {
    return Object.prototype.hasOwnProperty.call(node, "children");
}
function cloneNode(node, recursive = false) {
    let result;
    if (isText(node)) {
        result = new Text(node.data);
    } else if (isComment(node)) {
        result = new Comment(node.data);
    } else if (isTag(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new Element(node.name, {
            ...node.attribs
        }, children);
        children.forEach((child)=>child.parent = clone);
        if (node.namespace != null) {
            clone.namespace = node.namespace;
        }
        if (node["x-attribsNamespace"]) {
            clone["x-attribsNamespace"] = {
                ...node["x-attribsNamespace"]
            };
        }
        if (node["x-attribsPrefix"]) {
            clone["x-attribsPrefix"] = {
                ...node["x-attribsPrefix"]
            };
        }
        result = clone;
    } else if (isCDATA(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new CDATA(children);
        children.forEach((child)=>child.parent = clone);
        result = clone;
    } else if (isDocument(node)) {
        const children = recursive ? cloneChildren(node.children) : [];
        const clone = new Document(children);
        children.forEach((child)=>child.parent = clone);
        if (node["x-mode"]) {
            clone["x-mode"] = node["x-mode"];
        }
        result = clone;
    } else if (isDirective(node)) {
        const instruction = new ProcessingInstruction(node.name, node.data);
        if (node["x-name"] != null) {
            instruction["x-name"] = node["x-name"];
            instruction["x-publicId"] = node["x-publicId"];
            instruction["x-systemId"] = node["x-systemId"];
        }
        result = instruction;
    } else {
        throw new Error(`Not implemented yet: ${node.type}`);
    }
    result.startIndex = node.startIndex;
    result.endIndex = node.endIndex;
    if (node.sourceCodeLocation != null) {
        result.sourceCodeLocation = node.sourceCodeLocation;
    }
    return result;
}
function cloneChildren(childs) {
    const children = childs.map((child)=>cloneNode(child, true));
    for(let i = 1; i < children.length; i++){
        children[i].prev = children[i - 1];
        children[i - 1].next = children[i];
    }
    return children;
}
}),
"[project]/node_modules/domutils/lib/esm/feeds.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getFeed",
    ()=>getFeed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/stringify.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/legacy.js [app-route] (ecmascript)");
;
;
function getFeed(doc) {
    const feedRoot = getOneElement(isValidFeed, doc);
    return !feedRoot ? null : feedRoot.name === "feed" ? getAtomFeed(feedRoot) : getRssFeed(feedRoot);
}
/**
 * Parse an Atom feed.
 *
 * @param feedRoot The root of the feed.
 * @returns The parsed feed.
 */ function getAtomFeed(feedRoot) {
    var _a;
    const childs = feedRoot.children;
    const feed = {
        type: "atom",
        items: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getElementsByTagName"])("entry", childs).map((item)=>{
            var _a;
            const { children } = item;
            const entry = {
                media: getMediaElements(children)
            };
            addConditionally(entry, "id", "id", children);
            addConditionally(entry, "title", "title", children);
            const href = (_a = getOneElement("link", children)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
            if (href) {
                entry.link = href;
            }
            const description = fetch("summary", children) || fetch("content", children);
            if (description) {
                entry.description = description;
            }
            const pubDate = fetch("updated", children);
            if (pubDate) {
                entry.pubDate = new Date(pubDate);
            }
            return entry;
        })
    };
    addConditionally(feed, "id", "id", childs);
    addConditionally(feed, "title", "title", childs);
    const href = (_a = getOneElement("link", childs)) === null || _a === void 0 ? void 0 : _a.attribs["href"];
    if (href) {
        feed.link = href;
    }
    addConditionally(feed, "description", "subtitle", childs);
    const updated = fetch("updated", childs);
    if (updated) {
        feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "email", childs, true);
    return feed;
}
/**
 * Parse a RSS feed.
 *
 * @param feedRoot The root of the feed.
 * @returns The parsed feed.
 */ function getRssFeed(feedRoot) {
    var _a, _b;
    const childs = (_b = (_a = getOneElement("channel", feedRoot.children)) === null || _a === void 0 ? void 0 : _a.children) !== null && _b !== void 0 ? _b : [];
    const feed = {
        type: feedRoot.name.substr(0, 3),
        id: "",
        items: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getElementsByTagName"])("item", feedRoot.children).map((item)=>{
            const { children } = item;
            const entry = {
                media: getMediaElements(children)
            };
            addConditionally(entry, "id", "guid", children);
            addConditionally(entry, "title", "title", children);
            addConditionally(entry, "link", "link", children);
            addConditionally(entry, "description", "description", children);
            const pubDate = fetch("pubDate", children) || fetch("dc:date", children);
            if (pubDate) entry.pubDate = new Date(pubDate);
            return entry;
        })
    };
    addConditionally(feed, "title", "title", childs);
    addConditionally(feed, "link", "link", childs);
    addConditionally(feed, "description", "description", childs);
    const updated = fetch("lastBuildDate", childs);
    if (updated) {
        feed.updated = new Date(updated);
    }
    addConditionally(feed, "author", "managingEditor", childs, true);
    return feed;
}
const MEDIA_KEYS_STRING = [
    "url",
    "type",
    "lang"
];
const MEDIA_KEYS_INT = [
    "fileSize",
    "bitrate",
    "framerate",
    "samplingrate",
    "channels",
    "duration",
    "height",
    "width"
];
/**
 * Get all media elements of a feed item.
 *
 * @param where Nodes to search in.
 * @returns Media elements.
 */ function getMediaElements(where) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getElementsByTagName"])("media:content", where).map((elem)=>{
        const { attribs } = elem;
        const media = {
            medium: attribs["medium"],
            isDefault: !!attribs["isDefault"]
        };
        for (const attrib of MEDIA_KEYS_STRING){
            if (attribs[attrib]) {
                media[attrib] = attribs[attrib];
            }
        }
        for (const attrib of MEDIA_KEYS_INT){
            if (attribs[attrib]) {
                media[attrib] = parseInt(attribs[attrib], 10);
            }
        }
        if (attribs["expression"]) {
            media.expression = attribs["expression"];
        }
        return media;
    });
}
/**
 * Get one element by tag name.
 *
 * @param tagName Tag name to look for
 * @param node Node to search in
 * @returns The element or null
 */ function getOneElement(tagName, node) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getElementsByTagName"])(tagName, node, true, 1)[0];
}
/**
 * Get the text content of an element with a certain tag name.
 *
 * @param tagName Tag name to look for.
 * @param where Node to search in.
 * @param recurse Whether to recurse into child nodes.
 * @returns The text content of the element.
 */ function fetch(tagName, where, recurse = false) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["textContent"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getElementsByTagName"])(tagName, where, recurse, 1)).trim();
}
/**
 * Adds a property to an object if it has a value.
 *
 * @param obj Object to be extended
 * @param prop Property name
 * @param tagName Tag name that contains the conditionally added property
 * @param where Element to search for the property
 * @param recurse Whether to recurse into child nodes.
 */ function addConditionally(obj, prop, tagName, where, recurse = false) {
    const val = fetch(tagName, where, recurse);
    if (val) obj[prop] = val;
}
/**
 * Checks if an element is a feed root node.
 *
 * @param value The name of the element to check.
 * @returns Whether an element is a feed root node.
 */ function isValidFeed(value) {
    return value === "rss" || value === "feed" || value === "rdf:RDF";
}
}),
"[project]/node_modules/domutils/lib/esm/helpers.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DocumentPosition",
    ()=>DocumentPosition,
    "compareDocumentPosition",
    ()=>compareDocumentPosition,
    "removeSubsets",
    ()=>removeSubsets,
    "uniqueSort",
    ()=>uniqueSort
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)");
;
function removeSubsets(nodes) {
    let idx = nodes.length;
    /*
     * Check if each node (or one of its ancestors) is already contained in the
     * array.
     */ while(--idx >= 0){
        const node = nodes[idx];
        /*
         * Remove the node if it is not unique.
         * We are going through the array from the end, so we only
         * have to check nodes that preceed the node under consideration in the array.
         */ if (idx > 0 && nodes.lastIndexOf(node, idx - 1) >= 0) {
            nodes.splice(idx, 1);
            continue;
        }
        for(let ancestor = node.parent; ancestor; ancestor = ancestor.parent){
            if (nodes.includes(ancestor)) {
                nodes.splice(idx, 1);
                break;
            }
        }
    }
    return nodes;
}
var DocumentPosition;
(function(DocumentPosition) {
    DocumentPosition[DocumentPosition["DISCONNECTED"] = 1] = "DISCONNECTED";
    DocumentPosition[DocumentPosition["PRECEDING"] = 2] = "PRECEDING";
    DocumentPosition[DocumentPosition["FOLLOWING"] = 4] = "FOLLOWING";
    DocumentPosition[DocumentPosition["CONTAINS"] = 8] = "CONTAINS";
    DocumentPosition[DocumentPosition["CONTAINED_BY"] = 16] = "CONTAINED_BY";
})(DocumentPosition || (DocumentPosition = {}));
function compareDocumentPosition(nodeA, nodeB) {
    const aParents = [];
    const bParents = [];
    if (nodeA === nodeB) {
        return 0;
    }
    let current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(nodeA) ? nodeA : nodeA.parent;
    while(current){
        aParents.unshift(current);
        current = current.parent;
    }
    current = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(nodeB) ? nodeB : nodeB.parent;
    while(current){
        bParents.unshift(current);
        current = current.parent;
    }
    const maxIdx = Math.min(aParents.length, bParents.length);
    let idx = 0;
    while(idx < maxIdx && aParents[idx] === bParents[idx]){
        idx++;
    }
    if (idx === 0) {
        return DocumentPosition.DISCONNECTED;
    }
    const sharedParent = aParents[idx - 1];
    const siblings = sharedParent.children;
    const aSibling = aParents[idx];
    const bSibling = bParents[idx];
    if (siblings.indexOf(aSibling) > siblings.indexOf(bSibling)) {
        if (sharedParent === nodeB) {
            return DocumentPosition.FOLLOWING | DocumentPosition.CONTAINED_BY;
        }
        return DocumentPosition.FOLLOWING;
    }
    if (sharedParent === nodeA) {
        return DocumentPosition.PRECEDING | DocumentPosition.CONTAINS;
    }
    return DocumentPosition.PRECEDING;
}
function uniqueSort(nodes) {
    nodes = nodes.filter((node, i, arr)=>!arr.includes(node, i + 1));
    nodes.sort((a, b)=>{
        const relative = compareDocumentPosition(a, b);
        if (relative & DocumentPosition.PRECEDING) {
            return -1;
        } else if (relative & DocumentPosition.FOLLOWING) {
            return 1;
        }
        return 0;
    });
    return nodes;
}
}),
"[project]/node_modules/domutils/lib/esm/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$stringify$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/stringify.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$traversal$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/traversal.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/querying.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$legacy$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/legacy.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$helpers$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/helpers.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/feeds.js [app-route] (ecmascript)");
/** @deprecated Use these methods from `domhandler` directly. */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
;
;
;
;
;
;
;
;
}),
"[project]/node_modules/domutils/lib/esm/legacy.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getElementById",
    ()=>getElementById,
    "getElements",
    ()=>getElements,
    "getElementsByClassName",
    ()=>getElementsByClassName,
    "getElementsByTagName",
    ()=>getElementsByTagName,
    "getElementsByTagType",
    ()=>getElementsByTagType,
    "testElement",
    ()=>testElement
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/querying.js [app-route] (ecmascript)");
;
;
/**
 * A map of functions to check nodes against.
 */ const Checks = {
    tag_name (name) {
        if (typeof name === "function") {
            return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(elem) && name(elem.name);
        } else if (name === "*") {
            return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"];
        }
        return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(elem) && elem.name === name;
    },
    tag_type (type) {
        if (typeof type === "function") {
            return (elem)=>type(elem.type);
        }
        return (elem)=>elem.type === type;
    },
    tag_contains (data) {
        if (typeof data === "function") {
            return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isText"])(elem) && data(elem.data);
        }
        return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isText"])(elem) && elem.data === data;
    }
};
/**
 * Returns a function to check whether a node has an attribute with a particular
 * value.
 *
 * @param attrib Attribute to check.
 * @param value Attribute value to look for.
 * @returns A function to check whether the a node has an attribute with a
 *   particular value.
 */ function getAttribCheck(attrib, value) {
    if (typeof value === "function") {
        return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(elem) && value(elem.attribs[attrib]);
    }
    return (elem)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(elem) && elem.attribs[attrib] === value;
}
/**
 * Returns a function that returns `true` if either of the input functions
 * returns `true` for a node.
 *
 * @param a First function to combine.
 * @param b Second function to combine.
 * @returns A function taking a node and returning `true` if either of the input
 *   functions returns `true` for the node.
 */ function combineFuncs(a, b) {
    return (elem)=>a(elem) || b(elem);
}
/**
 * Returns a function that executes all checks in `options` and returns `true`
 * if any of them match a node.
 *
 * @param options An object describing nodes to look for.
 * @returns A function that executes all checks in `options` and returns `true`
 *   if any of them match a node.
 */ function compileTest(options) {
    const funcs = Object.keys(options).map((key)=>{
        const value = options[key];
        return Object.prototype.hasOwnProperty.call(Checks, key) ? Checks[key](value) : getAttribCheck(key, value);
    });
    return funcs.length === 0 ? null : funcs.reduce(combineFuncs);
}
function testElement(options, node) {
    const test = compileTest(options);
    return test ? test(node) : true;
}
function getElements(options, nodes, recurse, limit = Infinity) {
    const test = compileTest(options);
    return test ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["filter"])(test, nodes, recurse, limit) : [];
}
function getElementById(id, nodes, recurse = true) {
    if (!Array.isArray(nodes)) nodes = [
        nodes
    ];
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["findOne"])(getAttribCheck("id", id), nodes, recurse);
}
function getElementsByTagName(tagName, nodes, recurse = true, limit = Infinity) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["filter"])(Checks["tag_name"](tagName), nodes, recurse, limit);
}
function getElementsByClassName(className, nodes, recurse = true, limit = Infinity) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["filter"])(getAttribCheck("class", className), nodes, recurse, limit);
}
function getElementsByTagType(type, nodes, recurse = true, limit = Infinity) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$querying$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["filter"])(Checks["tag_type"](type), nodes, recurse, limit);
}
}),
"[project]/node_modules/domutils/lib/esm/querying.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "existsOne",
    ()=>existsOne,
    "filter",
    ()=>filter,
    "find",
    ()=>find,
    "findAll",
    ()=>findAll,
    "findOne",
    ()=>findOne,
    "findOneChild",
    ()=>findOneChild
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)");
;
function filter(test, node, recurse = true, limit = Infinity) {
    return find(test, Array.isArray(node) ? node : [
        node
    ], recurse, limit);
}
function find(test, nodes, recurse, limit) {
    const result = [];
    /** Stack of the arrays we are looking at. */ const nodeStack = [
        Array.isArray(nodes) ? nodes : [
            nodes
        ]
    ];
    /** Stack of the indices within the arrays. */ const indexStack = [
        0
    ];
    for(;;){
        // First, check if the current array has any more elements to look at.
        if (indexStack[0] >= nodeStack[0].length) {
            // If we have no more arrays to look at, we are done.
            if (indexStack.length === 1) {
                return result;
            }
            // Otherwise, remove the current array from the stack.
            nodeStack.shift();
            indexStack.shift();
            continue;
        }
        const elem = nodeStack[0][indexStack[0]++];
        if (test(elem)) {
            result.push(elem);
            if (--limit <= 0) return result;
        }
        if (recurse && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(elem) && elem.children.length > 0) {
            /*
             * Add the children to the stack. We are depth-first, so this is
             * the next array we look at.
             */ indexStack.unshift(0);
            nodeStack.unshift(elem.children);
        }
    }
}
function findOneChild(test, nodes) {
    return nodes.find(test);
}
function findOne(test, nodes, recurse = true) {
    const searchedNodes = Array.isArray(nodes) ? nodes : [
        nodes
    ];
    for(let i = 0; i < searchedNodes.length; i++){
        const node = searchedNodes[i];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(node) && test(node)) {
            return node;
        }
        if (recurse && (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(node) && node.children.length > 0) {
            const found = findOne(test, node.children, true);
            if (found) return found;
        }
    }
    return null;
}
function existsOne(test, nodes) {
    return (Array.isArray(nodes) ? nodes : [
        nodes
    ]).some((node)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(node) && test(node) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(node) && existsOne(test, node.children));
}
function findAll(test, nodes) {
    const result = [];
    const nodeStack = [
        Array.isArray(nodes) ? nodes : [
            nodes
        ]
    ];
    const indexStack = [
        0
    ];
    for(;;){
        if (indexStack[0] >= nodeStack[0].length) {
            if (nodeStack.length === 1) {
                return result;
            }
            // Otherwise, remove the current array from the stack.
            nodeStack.shift();
            indexStack.shift();
            continue;
        }
        const elem = nodeStack[0][indexStack[0]++];
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(elem) && test(elem)) result.push(elem);
        if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(elem) && elem.children.length > 0) {
            indexStack.unshift(0);
            nodeStack.unshift(elem.children);
        }
    }
}
}),
"[project]/node_modules/domutils/lib/esm/stringify.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getInnerHTML",
    ()=>getInnerHTML,
    "getOuterHTML",
    ()=>getOuterHTML,
    "getText",
    ()=>getText,
    "innerText",
    ()=>innerText,
    "textContent",
    ()=>textContent
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dom-serializer/lib/esm/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-route] (ecmascript)");
;
;
;
function getOuterHTML(node, options) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(node, options);
}
function getInnerHTML(node, options) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(node) ? node.children.map((node)=>getOuterHTML(node, options)).join("") : "";
}
function getText(node) {
    if (Array.isArray(node)) return node.map(getText).join("");
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(node)) return node.name === "br" ? "\n" : getText(node.children);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCDATA"])(node)) return getText(node.children);
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isText"])(node)) return node.data;
    return "";
}
function textContent(node) {
    if (Array.isArray(node)) return node.map(textContent).join("");
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(node) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isComment"])(node)) {
        return textContent(node.children);
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isText"])(node)) return node.data;
    return "";
}
function innerText(node) {
    if (Array.isArray(node)) return node.map(innerText).join("");
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(node) && (node.type === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ElementType"].Tag || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isCDATA"])(node))) {
        return innerText(node.children);
    }
    if ((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isText"])(node)) return node.data;
    return "";
}
}),
"[project]/node_modules/domutils/lib/esm/traversal.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getAttributeValue",
    ()=>getAttributeValue,
    "getChildren",
    ()=>getChildren,
    "getName",
    ()=>getName,
    "getParent",
    ()=>getParent,
    "getSiblings",
    ()=>getSiblings,
    "hasAttrib",
    ()=>hasAttrib,
    "nextElementSibling",
    ()=>nextElementSibling,
    "prevElementSibling",
    ()=>prevElementSibling
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/node.js [app-route] (ecmascript)");
;
function getChildren(elem) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasChildren"])(elem) ? elem.children : [];
}
function getParent(elem) {
    return elem.parent || null;
}
function getSiblings(elem) {
    const parent = getParent(elem);
    if (parent != null) return getChildren(parent);
    const siblings = [
        elem
    ];
    let { prev, next } = elem;
    while(prev != null){
        siblings.unshift(prev);
        ({ prev } = prev);
    }
    while(next != null){
        siblings.push(next);
        ({ next } = next);
    }
    return siblings;
}
function getAttributeValue(elem, name) {
    var _a;
    return (_a = elem.attribs) === null || _a === void 0 ? void 0 : _a[name];
}
function hasAttrib(elem, name) {
    return elem.attribs != null && Object.prototype.hasOwnProperty.call(elem.attribs, name) && elem.attribs[name] != null;
}
function getName(elem) {
    return elem.name;
}
function nextElementSibling(elem) {
    let { next } = elem;
    while(next !== null && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(next))({ next } = next);
    return next;
}
function prevElementSibling(elem) {
    let { prev } = elem;
    while(prev !== null && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$node$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTag"])(prev))({ prev } = prev);
    return prev;
}
}),
"[project]/node_modules/drizzle-zod/index.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bufferSchema",
    ()=>bufferSchema,
    "createInsertSchema",
    ()=>createInsertSchema,
    "createSchemaFactory",
    ()=>createSchemaFactory,
    "createSelectSchema",
    ()=>createSelectSchema,
    "createUpdateSchema",
    ()=>createUpdateSchema,
    "isColumnType",
    ()=>isColumnType,
    "isPgEnum",
    ()=>isPgEnum,
    "isWithEnum",
    ()=>isWithEnum,
    "jsonSchema",
    ()=>jsonSchema,
    "literalSchema",
    ()=>literalSchema
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__ = __turbopack_context__.i("[project]/node_modules/zod/v3/external.js [app-route] (ecmascript) <export * as z>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/table.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/utils.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$entity$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/entity.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$column$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/column.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/drizzle-orm/sql/sql.js [app-route] (ecmascript)");
;
;
const CONSTANTS = {
    INT8_MIN: -128,
    INT8_MAX: 127,
    INT8_UNSIGNED_MAX: 255,
    INT16_MIN: -32768,
    INT16_MAX: 32767,
    INT16_UNSIGNED_MAX: 65535,
    INT24_MIN: -8388608,
    INT24_MAX: 8388607,
    INT24_UNSIGNED_MAX: 16777215,
    INT32_MIN: -2147483648,
    INT32_MAX: 2147483647,
    INT32_UNSIGNED_MAX: 4294967295,
    INT48_MIN: -140737488355328,
    INT48_MAX: 140737488355327,
    INT48_UNSIGNED_MAX: 281474976710655,
    INT64_MIN: -9223372036854775808n,
    INT64_MAX: 9223372036854775807n,
    INT64_UNSIGNED_MAX: 18446744073709551615n
};
function isColumnType(column, columnTypes) {
    return columnTypes.includes(column.columnType);
}
function isWithEnum(column) {
    return 'enumValues' in column && Array.isArray(column.enumValues) && column.enumValues.length > 0;
}
const isPgEnum = isWithEnum;
const literalSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].string(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].number(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].boolean(),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].null()
]);
const jsonSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].union([
    literalSchema,
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].record(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any()),
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].array(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any())
]);
const bufferSchema = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].custom((v)=>v instanceof Buffer); // eslint-disable-line no-instanceof/no-instanceof
function columnToSchema(column, factory) {
    const z$1 = factory?.zodInstance ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"];
    const coerce = factory?.coerce ?? {};
    let schema;
    if (isWithEnum(column)) {
        schema = column.enumValues.length ? z$1.enum(column.enumValues) : z$1.string();
    }
    if (!schema) {
        // Handle specific types
        if (isColumnType(column, [
            'PgGeometry',
            'PgPointTuple'
        ])) {
            schema = z$1.tuple([
                z$1.number(),
                z$1.number()
            ]);
        } else if (isColumnType(column, [
            'PgGeometryObject',
            'PgPointObject'
        ])) {
            schema = z$1.object({
                x: z$1.number(),
                y: z$1.number()
            });
        } else if (isColumnType(column, [
            'PgHalfVector',
            'PgVector'
        ])) {
            schema = z$1.array(z$1.number());
            schema = column.dimensions ? schema.length(column.dimensions) : schema;
        } else if (isColumnType(column, [
            'PgLine'
        ])) {
            schema = z$1.tuple([
                z$1.number(),
                z$1.number(),
                z$1.number()
            ]);
        } else if (isColumnType(column, [
            'PgLineABC'
        ])) {
            schema = z$1.object({
                a: z$1.number(),
                b: z$1.number(),
                c: z$1.number()
            });
        } else if (isColumnType(column, [
            'PgArray'
        ])) {
            schema = z$1.array(columnToSchema(column.baseColumn, z$1));
            schema = column.size ? schema.length(column.size) : schema;
        } else if (column.dataType === 'array') {
            schema = z$1.array(z$1.any());
        } else if (column.dataType === 'number') {
            schema = numberColumnToSchema(column, z$1, coerce);
        } else if (column.dataType === 'bigint') {
            schema = bigintColumnToSchema(column, z$1, coerce);
        } else if (column.dataType === 'boolean') {
            schema = coerce === true || coerce.boolean ? z$1.coerce.boolean() : z$1.boolean();
        } else if (column.dataType === 'date') {
            schema = coerce === true || coerce.date ? z$1.coerce.date() : z$1.date();
        } else if (column.dataType === 'string') {
            schema = stringColumnToSchema(column, z$1, coerce);
        } else if (column.dataType === 'json') {
            schema = jsonSchema;
        } else if (column.dataType === 'custom') {
            schema = z$1.any();
        } else if (column.dataType === 'buffer') {
            schema = bufferSchema;
        }
    }
    if (!schema) {
        schema = z$1.any();
    }
    return schema;
}
function numberColumnToSchema(column, z, coerce) {
    let unsigned = column.getSQLType().includes('unsigned');
    let min;
    let max;
    let integer = false;
    if (isColumnType(column, [
        'MySqlTinyInt',
        'SingleStoreTinyInt'
    ])) {
        min = unsigned ? 0 : CONSTANTS.INT8_MIN;
        max = unsigned ? CONSTANTS.INT8_UNSIGNED_MAX : CONSTANTS.INT8_MAX;
        integer = true;
    } else if (isColumnType(column, [
        'PgSmallInt',
        'PgSmallSerial',
        'MySqlSmallInt',
        'SingleStoreSmallInt'
    ])) {
        min = unsigned ? 0 : CONSTANTS.INT16_MIN;
        max = unsigned ? CONSTANTS.INT16_UNSIGNED_MAX : CONSTANTS.INT16_MAX;
        integer = true;
    } else if (isColumnType(column, [
        'PgReal',
        'MySqlFloat',
        'MySqlMediumInt',
        'SingleStoreMediumInt',
        'SingleStoreFloat'
    ])) {
        min = unsigned ? 0 : CONSTANTS.INT24_MIN;
        max = unsigned ? CONSTANTS.INT24_UNSIGNED_MAX : CONSTANTS.INT24_MAX;
        integer = isColumnType(column, [
            'MySqlMediumInt',
            'SingleStoreMediumInt'
        ]);
    } else if (isColumnType(column, [
        'PgInteger',
        'PgSerial',
        'MySqlInt',
        'SingleStoreInt'
    ])) {
        min = unsigned ? 0 : CONSTANTS.INT32_MIN;
        max = unsigned ? CONSTANTS.INT32_UNSIGNED_MAX : CONSTANTS.INT32_MAX;
        integer = true;
    } else if (isColumnType(column, [
        'PgDoublePrecision',
        'MySqlReal',
        'MySqlDouble',
        'SingleStoreReal',
        'SingleStoreDouble',
        'SQLiteReal'
    ])) {
        min = unsigned ? 0 : CONSTANTS.INT48_MIN;
        max = unsigned ? CONSTANTS.INT48_UNSIGNED_MAX : CONSTANTS.INT48_MAX;
    } else if (isColumnType(column, [
        'PgBigInt53',
        'PgBigSerial53',
        'MySqlBigInt53',
        'MySqlSerial',
        'SingleStoreBigInt53',
        'SingleStoreSerial',
        'SQLiteInteger'
    ])) {
        unsigned = unsigned || isColumnType(column, [
            'MySqlSerial',
            'SingleStoreSerial'
        ]);
        min = unsigned ? 0 : Number.MIN_SAFE_INTEGER;
        max = Number.MAX_SAFE_INTEGER;
        integer = true;
    } else if (isColumnType(column, [
        'MySqlYear',
        'SingleStoreYear'
    ])) {
        min = 1901;
        max = 2155;
        integer = true;
    } else {
        min = Number.MIN_SAFE_INTEGER;
        max = Number.MAX_SAFE_INTEGER;
    }
    let schema = coerce === true || coerce?.number ? z.coerce.number() : z.number();
    schema = schema.min(min).max(max);
    return integer ? schema.int() : schema;
}
function bigintColumnToSchema(column, z, coerce) {
    const unsigned = column.getSQLType().includes('unsigned');
    const min = unsigned ? 0n : CONSTANTS.INT64_MIN;
    const max = unsigned ? CONSTANTS.INT64_UNSIGNED_MAX : CONSTANTS.INT64_MAX;
    const schema = coerce === true || coerce?.bigint ? z.coerce.bigint() : z.bigint();
    return schema.min(min).max(max);
}
function stringColumnToSchema(column, z, coerce) {
    if (isColumnType(column, [
        'PgUUID'
    ])) {
        return z.string().uuid();
    }
    let max;
    let regex;
    let fixed = false;
    if (isColumnType(column, [
        'PgVarchar',
        'SQLiteText'
    ])) {
        max = column.length;
    } else if (isColumnType(column, [
        'MySqlVarChar',
        'SingleStoreVarChar'
    ])) {
        max = column.length ?? CONSTANTS.INT16_UNSIGNED_MAX;
    } else if (isColumnType(column, [
        'MySqlText',
        'SingleStoreText'
    ])) {
        if (column.textType === 'longtext') {
            max = CONSTANTS.INT32_UNSIGNED_MAX;
        } else if (column.textType === 'mediumtext') {
            max = CONSTANTS.INT24_UNSIGNED_MAX;
        } else if (column.textType === 'text') {
            max = CONSTANTS.INT16_UNSIGNED_MAX;
        } else {
            max = CONSTANTS.INT8_UNSIGNED_MAX;
        }
    }
    if (isColumnType(column, [
        'PgChar',
        'MySqlChar',
        'SingleStoreChar'
    ])) {
        max = column.length;
        fixed = true;
    }
    if (isColumnType(column, [
        'PgBinaryVector'
    ])) {
        regex = /^[01]+$/;
        max = column.dimensions;
    }
    let schema = coerce === true || coerce?.string ? z.coerce.string() : z.string();
    schema = regex ? schema.regex(regex) : schema;
    return max && fixed ? schema.length(max) : max ? schema.max(max) : schema;
}
function getColumns(tableLike) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTable"])(tableLike) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getTableColumns"])(tableLike) : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$utils$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getViewSelectedFields"])(tableLike);
}
function handleColumns(columns, refinements, conditions, factory) {
    const columnSchemas = {};
    for (const [key, selected] of Object.entries(columns)){
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$entity$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["is"])(selected, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$column$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Column"]) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$entity$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["is"])(selected, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SQL"]) && !(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$entity$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["is"])(selected, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SQL"].Aliased) && typeof selected === 'object') {
            const columns = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$table$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isTable"])(selected) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$sql$2f$sql$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isView"])(selected) ? getColumns(selected) : selected;
            columnSchemas[key] = handleColumns(columns, refinements[key] ?? {}, conditions, factory);
            continue;
        }
        const refinement = refinements[key];
        if (refinement !== undefined && typeof refinement !== 'function') {
            columnSchemas[key] = refinement;
            continue;
        }
        const column = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$entity$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["is"])(selected, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$drizzle$2d$orm$2f$column$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Column"]) ? selected : undefined;
        const schema = column ? columnToSchema(column, factory) : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].any();
        const refined = typeof refinement === 'function' ? refinement(schema) : schema;
        if (conditions.never(column)) {
            continue;
        } else {
            columnSchemas[key] = refined;
        }
        if (column) {
            if (conditions.nullable(column)) {
                columnSchemas[key] = columnSchemas[key].nullable();
            }
            if (conditions.optional(column)) {
                columnSchemas[key] = columnSchemas[key].optional();
            }
        }
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"].object(columnSchemas);
}
function handleEnum(enum_, factory) {
    const zod = factory?.zodInstance ?? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$zod$2f$v3$2f$external$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__$2a$__as__z$3e$__["z"];
    return zod.enum(enum_.enumValues);
}
const selectConditions = {
    never: ()=>false,
    optional: ()=>false,
    nullable: (column)=>!column.notNull
};
const insertConditions = {
    never: (column)=>column?.generated?.type === 'always' || column?.generatedIdentity?.type === 'always',
    optional: (column)=>!column.notNull || column.notNull && column.hasDefault,
    nullable: (column)=>!column.notNull
};
const updateConditions = {
    never: (column)=>column?.generated?.type === 'always' || column?.generatedIdentity?.type === 'always',
    optional: ()=>true,
    nullable: (column)=>!column.notNull
};
const createSelectSchema = (entity, refine)=>{
    if (isPgEnum(entity)) {
        return handleEnum(entity);
    }
    const columns = getColumns(entity);
    return handleColumns(columns, refine ?? {}, selectConditions);
};
const createInsertSchema = (entity, refine)=>{
    const columns = getColumns(entity);
    return handleColumns(columns, refine ?? {}, insertConditions);
};
const createUpdateSchema = (entity, refine)=>{
    const columns = getColumns(entity);
    return handleColumns(columns, refine ?? {}, updateConditions);
};
function createSchemaFactory(options) {
    const createSelectSchema = (entity, refine)=>{
        if (isPgEnum(entity)) {
            return handleEnum(entity, options);
        }
        const columns = getColumns(entity);
        return handleColumns(columns, refine ?? {}, selectConditions, options);
    };
    const createInsertSchema = (entity, refine)=>{
        const columns = getColumns(entity);
        return handleColumns(columns, refine ?? {}, insertConditions, options);
    };
    const createUpdateSchema = (entity, refine)=>{
        const columns = getColumns(entity);
        return handleColumns(columns, refine ?? {}, updateConditions, options);
    };
    return {
        createSelectSchema,
        createInsertSchema,
        createUpdateSchema
    };
}
;
}),
"[project]/node_modules/html-to-text/lib/html-to-text.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "compile",
    ()=>compile,
    "convert",
    ()=>convert,
    "htmlToText",
    ()=>convert
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$selderee$2f$plugin$2d$htmlparser2$2f$lib$2f$hp2$2d$builder$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@selderee/plugin-htmlparser2/lib/hp2-builder.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$selderee$2f$lib$2f$selderee$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/selderee/lib/selderee.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$deepmerge$2f$dist$2f$cjs$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/deepmerge/dist/cjs.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/dom-serializer/lib/esm/index.js [app-route] (ecmascript)");
;
;
;
;
;
/**
 * Make a recursive function that will only run to a given depth
 * and switches to an alternative function at that depth. \
 * No limitation if `n` is `undefined` (Just wraps `f` in that case).
 *
 * @param   { number | undefined } n   Allowed depth of recursion. `undefined` for no limitation.
 * @param   { Function }           f   Function that accepts recursive callback as the first argument.
 * @param   { Function }           [g] Function to run instead, when maximum depth was reached. Do nothing by default.
 * @returns { Function }
 */ function limitedDepthRecursive(n, f, g = ()=>undefined) {
    if (n === undefined) {
        const f1 = function(...args) {
            return f(f1, ...args);
        };
        return f1;
    }
    if (n >= 0) {
        return function(...args) {
            return f(limitedDepthRecursive(n - 1, f, g), ...args);
        };
    }
    return g;
}
/**
 * Return the same string or a substring with
 * the given character occurrences removed from each side.
 *
 * @param   { string } str  A string to trim.
 * @param   { string } char A character to be trimmed.
 * @returns { string }
 */ function trimCharacter(str, char) {
    let start = 0;
    let end = str.length;
    while(start < end && str[start] === char){
        ++start;
    }
    while(end > start && str[end - 1] === char){
        --end;
    }
    return start > 0 || end < str.length ? str.substring(start, end) : str;
}
/**
 * Return the same string or a substring with
 * the given character occurrences removed from the end only.
 *
 * @param   { string } str  A string to trim.
 * @param   { string } char A character to be trimmed.
 * @returns { string }
 */ function trimCharacterEnd(str, char) {
    let end = str.length;
    while(end > 0 && str[end - 1] === char){
        --end;
    }
    return end < str.length ? str.substring(0, end) : str;
}
/**
 * Return a new string will all characters replaced with unicode escape sequences.
 * This extreme kind of escaping can used to be safely compose regular expressions.
 *
 * @param { string } str A string to escape.
 * @returns { string } A string of unicode escape sequences.
 */ function unicodeEscape(str) {
    return str.replace(/[\s\S]/g, (c)=>'\\u' + c.charCodeAt().toString(16).padStart(4, '0'));
}
/**
 * Deduplicate an array by a given key callback.
 * Item properties are merged recursively and with the preference for last defined values.
 * Of items with the same key, merged item takes the place of the last item,
 * others are omitted.
 *
 * @param { any[] } items An array to deduplicate.
 * @param { (x: any) => string } getKey Callback to get a value that distinguishes unique items.
 * @returns { any[] }
 */ function mergeDuplicatesPreferLast(items, getKey) {
    const map = new Map();
    for(let i = items.length; i-- > 0;){
        const item = items[i];
        const key = getKey(item);
        map.set(key, map.has(key) ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$deepmerge$2f$dist$2f$cjs$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(item, map.get(key), {
            arrayMerge: overwriteMerge$1
        }) : item);
    }
    return [
        ...map.values()
    ].reverse();
}
const overwriteMerge$1 = (acc, src, options)=>[
        ...src
    ];
/**
 * Get a nested property from an object.
 *
 * @param   { object }   obj  The object to query for the value.
 * @param   { string[] } path The path to the property.
 * @returns { any }
 */ function get(obj, path) {
    for (const key of path){
        if (!obj) {
            return undefined;
        }
        obj = obj[key];
    }
    return obj;
}
/**
 * Convert a number into alphabetic sequence representation (Sequence without zeroes).
 *
 * For example: `a, ..., z, aa, ..., zz, aaa, ...`.
 *
 * @param   { number } num              Number to convert. Must be >= 1.
 * @param   { string } [baseChar = 'a'] Character for 1 in the sequence.
 * @param   { number } [base = 26]      Number of characters in the sequence.
 * @returns { string }
 */ function numberToLetterSequence(num, baseChar = 'a', base = 26) {
    const digits = [];
    do {
        num -= 1;
        digits.push(num % base);
        num = num / base >> 0; // quick `floor`
    }while (num > 0)
    const baseCode = baseChar.charCodeAt(0);
    return digits.reverse().map((n)=>String.fromCharCode(baseCode + n)).join('');
}
const I = [
    'I',
    'X',
    'C',
    'M'
];
const V = [
    'V',
    'L',
    'D'
];
/**
 * Convert a number to it's Roman representation. No large numbers extension.
 *
 * @param   { number } num Number to convert. `0 < num <= 3999`.
 * @returns { string }
 */ function numberToRoman(num) {
    return [
        ...num + ''
    ].map((n)=>+n).reverse().map((v, i)=>v % 5 < 4 ? (v < 5 ? '' : V[i]) + I[i].repeat(v % 5) : I[i] + (v < 5 ? V[i] : I[i + 1])).reverse().join('');
}
/**
 * Helps to build text from words.
 */ class InlineTextBuilder {
    /**
   * Creates an instance of InlineTextBuilder.
   *
   * If `maxLineLength` is not provided then it is either `options.wordwrap` or unlimited.
   *
   * @param { Options } options           HtmlToText options.
   * @param { number }  [ maxLineLength ] This builder will try to wrap text to fit this line length.
   */ constructor(options, maxLineLength = undefined){
        /** @type { string[][] } */ this.lines = [];
        /** @type { string[] }   */ this.nextLineWords = [];
        this.maxLineLength = maxLineLength || options.wordwrap || Number.MAX_VALUE;
        this.nextLineAvailableChars = this.maxLineLength;
        this.wrapCharacters = get(options, [
            'longWordSplit',
            'wrapCharacters'
        ]) || [];
        this.forceWrapOnLimit = get(options, [
            'longWordSplit',
            'forceWrapOnLimit'
        ]) || false;
        this.stashedSpace = false;
        this.wordBreakOpportunity = false;
    }
    /**
   * Add a new word.
   *
   * @param { string } word A word to add.
   * @param { boolean } [noWrap] Don't wrap text even if the line is too long.
   */ pushWord(word, noWrap = false) {
        if (this.nextLineAvailableChars <= 0 && !noWrap) {
            this.startNewLine();
        }
        const isLineStart = this.nextLineWords.length === 0;
        const cost = word.length + (isLineStart ? 0 : 1);
        if (cost <= this.nextLineAvailableChars || noWrap) {
            this.nextLineWords.push(word);
            this.nextLineAvailableChars -= cost;
        } else {
            // The word is moved to a new line - prefer to wrap between words.
            const [first, ...rest] = this.splitLongWord(word);
            if (!isLineStart) {
                this.startNewLine();
            }
            this.nextLineWords.push(first);
            this.nextLineAvailableChars -= first.length;
            for (const part of rest){
                this.startNewLine();
                this.nextLineWords.push(part);
                this.nextLineAvailableChars -= part.length;
            }
        }
    }
    /**
   * Pop a word from the currently built line.
   * This doesn't affect completed lines.
   *
   * @returns { string }
   */ popWord() {
        const lastWord = this.nextLineWords.pop();
        if (lastWord !== undefined) {
            const isLineStart = this.nextLineWords.length === 0;
            const cost = lastWord.length + (isLineStart ? 0 : 1);
            this.nextLineAvailableChars += cost;
        }
        return lastWord;
    }
    /**
   * Concat a word to the last word already in the builder.
   * Adds a new word in case there are no words yet in the last line.
   *
   * @param { string } word A word to be concatenated.
   * @param { boolean } [noWrap] Don't wrap text even if the line is too long.
   */ concatWord(word, noWrap = false) {
        if (this.wordBreakOpportunity && word.length > this.nextLineAvailableChars) {
            this.pushWord(word, noWrap);
            this.wordBreakOpportunity = false;
        } else {
            const lastWord = this.popWord();
            this.pushWord(lastWord ? lastWord.concat(word) : word, noWrap);
        }
    }
    /**
   * Add current line (and more empty lines if provided argument > 1) to the list of complete lines and start a new one.
   *
   * @param { number } n Number of line breaks that will be added to the resulting string.
   */ startNewLine(n = 1) {
        this.lines.push(this.nextLineWords);
        if (n > 1) {
            this.lines.push(...Array.from({
                length: n - 1
            }, ()=>[]));
        }
        this.nextLineWords = [];
        this.nextLineAvailableChars = this.maxLineLength;
    }
    /**
   * No words in this builder.
   *
   * @returns { boolean }
   */ isEmpty() {
        return this.lines.length === 0 && this.nextLineWords.length === 0;
    }
    clear() {
        this.lines.length = 0;
        this.nextLineWords.length = 0;
        this.nextLineAvailableChars = this.maxLineLength;
    }
    /**
   * Join all lines of words inside the InlineTextBuilder into a complete string.
   *
   * @returns { string }
   */ toString() {
        return [
            ...this.lines,
            this.nextLineWords
        ].map((words)=>words.join(' ')).join('\n');
    }
    /**
   * Split a long word up to fit within the word wrap limit.
   * Use either a character to split looking back from the word wrap limit,
   * or truncate to the word wrap limit.
   *
   * @param   { string }   word Input word.
   * @returns { string[] }      Parts of the word.
   */ splitLongWord(word) {
        const parts = [];
        let idx = 0;
        while(word.length > this.maxLineLength){
            const firstLine = word.substring(0, this.maxLineLength);
            const remainingChars = word.substring(this.maxLineLength);
            const splitIndex = firstLine.lastIndexOf(this.wrapCharacters[idx]);
            if (splitIndex > -1) {
                word = firstLine.substring(splitIndex + 1) + remainingChars;
                parts.push(firstLine.substring(0, splitIndex + 1));
            } else {
                idx++;
                if (idx < this.wrapCharacters.length) {
                    word = firstLine + remainingChars;
                } else {
                    if (this.forceWrapOnLimit) {
                        parts.push(firstLine);
                        word = remainingChars;
                        if (word.length > this.maxLineLength) {
                            continue;
                        }
                    } else {
                        word = firstLine + remainingChars;
                    }
                    break;
                }
            }
        }
        parts.push(word); // Add remaining part to array
        return parts;
    }
}
/* eslint-disable max-classes-per-file */ class StackItem {
    constructor(next = null){
        this.next = next;
    }
    getRoot() {
        return this.next ? this.next : this;
    }
}
class BlockStackItem extends StackItem {
    constructor(options, next = null, leadingLineBreaks = 1, maxLineLength = undefined){
        super(next);
        this.leadingLineBreaks = leadingLineBreaks;
        this.inlineTextBuilder = new InlineTextBuilder(options, maxLineLength);
        this.rawText = '';
        this.stashedLineBreaks = 0;
        this.isPre = next && next.isPre;
        this.isNoWrap = next && next.isNoWrap;
    }
}
class ListStackItem extends BlockStackItem {
    constructor(options, next = null, { interRowLineBreaks = 1, leadingLineBreaks = 2, maxLineLength = undefined, maxPrefixLength = 0, prefixAlign = 'left' } = {}){
        super(options, next, leadingLineBreaks, maxLineLength);
        this.maxPrefixLength = maxPrefixLength;
        this.prefixAlign = prefixAlign;
        this.interRowLineBreaks = interRowLineBreaks;
    }
}
class ListItemStackItem extends BlockStackItem {
    constructor(options, next = null, { leadingLineBreaks = 1, maxLineLength = undefined, prefix = '' } = {}){
        super(options, next, leadingLineBreaks, maxLineLength);
        this.prefix = prefix;
    }
}
class TableStackItem extends StackItem {
    constructor(next = null){
        super(next);
        this.rows = [];
        this.isPre = next && next.isPre;
        this.isNoWrap = next && next.isNoWrap;
    }
}
class TableRowStackItem extends StackItem {
    constructor(next = null){
        super(next);
        this.cells = [];
        this.isPre = next && next.isPre;
        this.isNoWrap = next && next.isNoWrap;
    }
}
class TableCellStackItem extends StackItem {
    constructor(options, next = null, maxColumnWidth = undefined){
        super(next);
        this.inlineTextBuilder = new InlineTextBuilder(options, maxColumnWidth);
        this.rawText = '';
        this.stashedLineBreaks = 0;
        this.isPre = next && next.isPre;
        this.isNoWrap = next && next.isNoWrap;
    }
}
class TransformerStackItem extends StackItem {
    constructor(next = null, transform){
        super(next);
        this.transform = transform;
    }
}
function charactersToCodes(str) {
    return [
        ...str
    ].map((c)=>'\\u' + c.charCodeAt(0).toString(16).padStart(4, '0')).join('');
}
/**
 * Helps to handle HTML whitespaces.
 *
 * @class WhitespaceProcessor
 */ class WhitespaceProcessor {
    /**
   * Creates an instance of WhitespaceProcessor.
   *
   * @param { Options } options    HtmlToText options.
   * @memberof WhitespaceProcessor
   */ constructor(options){
        this.whitespaceChars = options.preserveNewlines ? options.whitespaceCharacters.replace(/\n/g, '') : options.whitespaceCharacters;
        const whitespaceCodes = charactersToCodes(this.whitespaceChars);
        this.leadingWhitespaceRe = new RegExp(`^[${whitespaceCodes}]`);
        this.trailingWhitespaceRe = new RegExp(`[${whitespaceCodes}]$`);
        this.allWhitespaceOrEmptyRe = new RegExp(`^[${whitespaceCodes}]*$`);
        this.newlineOrNonWhitespaceRe = new RegExp(`(\\n|[^\\n${whitespaceCodes}])`, 'g');
        this.newlineOrNonNewlineStringRe = new RegExp(`(\\n|[^\\n]+)`, 'g');
        if (options.preserveNewlines) {
            const wordOrNewlineRe = new RegExp(`\\n|[^\\n${whitespaceCodes}]+`, 'gm');
            /**
       * Shrink whitespaces and wrap text, add to the builder.
       *
       * @param { string }                  text              Input text.
       * @param { InlineTextBuilder }       inlineTextBuilder A builder to receive processed text.
       * @param { (str: string) => string } [ transform ]     A transform to be applied to words.
       * @param { boolean }                 [noWrap] Don't wrap text even if the line is too long.
       */ this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = (str)=>str, noWrap = false) {
                if (!text) {
                    return;
                }
                const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
                let anyMatch = false;
                let m = wordOrNewlineRe.exec(text);
                if (m) {
                    anyMatch = true;
                    if (m[0] === '\n') {
                        inlineTextBuilder.startNewLine();
                    } else if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
                        inlineTextBuilder.pushWord(transform(m[0]), noWrap);
                    } else {
                        inlineTextBuilder.concatWord(transform(m[0]), noWrap);
                    }
                    while((m = wordOrNewlineRe.exec(text)) !== null){
                        if (m[0] === '\n') {
                            inlineTextBuilder.startNewLine();
                        } else {
                            inlineTextBuilder.pushWord(transform(m[0]), noWrap);
                        }
                    }
                }
                inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
            // No need to stash a space in case last added item was a new line,
            // but that won't affect anything later anyway.
            };
        } else {
            const wordRe = new RegExp(`[^${whitespaceCodes}]+`, 'g');
            this.shrinkWrapAdd = function(text, inlineTextBuilder, transform = (str)=>str, noWrap = false) {
                if (!text) {
                    return;
                }
                const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
                let anyMatch = false;
                let m = wordRe.exec(text);
                if (m) {
                    anyMatch = true;
                    if (previouslyStashedSpace || this.testLeadingWhitespace(text)) {
                        inlineTextBuilder.pushWord(transform(m[0]), noWrap);
                    } else {
                        inlineTextBuilder.concatWord(transform(m[0]), noWrap);
                    }
                    while((m = wordRe.exec(text)) !== null){
                        inlineTextBuilder.pushWord(transform(m[0]), noWrap);
                    }
                }
                inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch || this.testTrailingWhitespace(text);
            };
        }
    }
    /**
   * Add text with only minimal processing.
   * Everything between newlines considered a single word.
   * No whitespace is trimmed.
   * Not affected by preserveNewlines option - `\n` always starts a new line.
   *
   * `noWrap` argument is `true` by default - this won't start a new line
   * even if there is not enough space left in the current line.
   *
   * @param { string }            text              Input text.
   * @param { InlineTextBuilder } inlineTextBuilder A builder to receive processed text.
   * @param { boolean }           [noWrap] Don't wrap text even if the line is too long.
   */ addLiteral(text, inlineTextBuilder, noWrap = true) {
        if (!text) {
            return;
        }
        const previouslyStashedSpace = inlineTextBuilder.stashedSpace;
        let anyMatch = false;
        let m = this.newlineOrNonNewlineStringRe.exec(text);
        if (m) {
            anyMatch = true;
            if (m[0] === '\n') {
                inlineTextBuilder.startNewLine();
            } else if (previouslyStashedSpace) {
                inlineTextBuilder.pushWord(m[0], noWrap);
            } else {
                inlineTextBuilder.concatWord(m[0], noWrap);
            }
            while((m = this.newlineOrNonNewlineStringRe.exec(text)) !== null){
                if (m[0] === '\n') {
                    inlineTextBuilder.startNewLine();
                } else {
                    inlineTextBuilder.pushWord(m[0], noWrap);
                }
            }
        }
        inlineTextBuilder.stashedSpace = previouslyStashedSpace && !anyMatch;
    }
    /**
   * Test whether the given text starts with HTML whitespace character.
   *
   * @param   { string }  text  The string to test.
   * @returns { boolean }
   */ testLeadingWhitespace(text) {
        return this.leadingWhitespaceRe.test(text);
    }
    /**
   * Test whether the given text ends with HTML whitespace character.
   *
   * @param   { string }  text  The string to test.
   * @returns { boolean }
   */ testTrailingWhitespace(text) {
        return this.trailingWhitespaceRe.test(text);
    }
    /**
   * Test whether the given text contains any non-whitespace characters.
   *
   * @param   { string }  text  The string to test.
   * @returns { boolean }
   */ testContainsWords(text) {
        return !this.allWhitespaceOrEmptyRe.test(text);
    }
    /**
   * Return the number of newlines if there are no words.
   *
   * If any word is found then return zero regardless of the actual number of newlines.
   *
   * @param   { string }  text  Input string.
   * @returns { number }
   */ countNewlinesNoWords(text) {
        this.newlineOrNonWhitespaceRe.lastIndex = 0;
        let counter = 0;
        let match;
        while((match = this.newlineOrNonWhitespaceRe.exec(text)) !== null){
            if (match[0] === '\n') {
                counter++;
            } else {
                return 0;
            }
        }
        return counter;
    }
}
/**
 * Helps to build text from inline and block elements.
 *
 * @class BlockTextBuilder
 */ class BlockTextBuilder {
    /**
   * Creates an instance of BlockTextBuilder.
   *
   * @param { Options } options HtmlToText options.
   * @param { import('selderee').Picker<DomNode, TagDefinition> } picker Selectors decision tree picker.
   * @param { any} [metadata] Optional metadata for HTML document, for use in formatters.
   */ constructor(options, picker, metadata = undefined){
        this.options = options;
        this.picker = picker;
        this.metadata = metadata;
        this.whitespaceProcessor = new WhitespaceProcessor(options);
        /** @type { StackItem } */ this._stackItem = new BlockStackItem(options);
        /** @type { TransformerStackItem } */ this._wordTransformer = undefined;
    }
    /**
   * Put a word-by-word transform function onto the transformations stack.
   *
   * Mainly used for uppercasing. Can be bypassed to add unformatted text such as URLs.
   *
   * Word transformations applied before wrapping.
   *
   * @param { (str: string) => string } wordTransform Word transformation function.
   */ pushWordTransform(wordTransform) {
        this._wordTransformer = new TransformerStackItem(this._wordTransformer, wordTransform);
    }
    /**
   * Remove a function from the word transformations stack.
   *
   * @returns { (str: string) => string } A function that was removed.
   */ popWordTransform() {
        if (!this._wordTransformer) {
            return undefined;
        }
        const transform = this._wordTransformer.transform;
        this._wordTransformer = this._wordTransformer.next;
        return transform;
    }
    /**
   * Ignore wordwrap option in followup inline additions and disable automatic wrapping.
   */ startNoWrap() {
        this._stackItem.isNoWrap = true;
    }
    /**
   * Return automatic wrapping to behavior defined by options.
   */ stopNoWrap() {
        this._stackItem.isNoWrap = false;
    }
    /** @returns { (str: string) => string } */ _getCombinedWordTransformer() {
        const wt = this._wordTransformer ? (str)=>applyTransformer(str, this._wordTransformer) : undefined;
        const ce = this.options.encodeCharacters;
        return wt ? ce ? (str)=>ce(wt(str)) : wt : ce;
    }
    _popStackItem() {
        const item = this._stackItem;
        this._stackItem = item.next;
        return item;
    }
    /**
   * Add a line break into currently built block.
   */ addLineBreak() {
        if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
            return;
        }
        if (this._stackItem.isPre) {
            this._stackItem.rawText += '\n';
        } else {
            this._stackItem.inlineTextBuilder.startNewLine();
        }
    }
    /**
   * Allow to break line in case directly following text will not fit.
   */ addWordBreakOpportunity() {
        if (this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem) {
            this._stackItem.inlineTextBuilder.wordBreakOpportunity = true;
        }
    }
    /**
   * Add a node inline into the currently built block.
   *
   * @param { string } str
   * Text content of a node to add.
   *
   * @param { object } [param1]
   * Object holding the parameters of the operation.
   *
   * @param { boolean } [param1.noWordTransform]
   * Ignore word transformers if there are any.
   * Don't encode characters as well.
   * (Use this for things like URL addresses).
   */ addInline(str, { noWordTransform = false } = {}) {
        if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
            return;
        }
        if (this._stackItem.isPre) {
            this._stackItem.rawText += str;
            return;
        }
        if (str.length === 0 || this._stackItem.stashedLineBreaks && // stashed linebreaks make whitespace irrelevant
        !this.whitespaceProcessor.testContainsWords(str) // no words to add
        ) {
            return;
        }
        if (this.options.preserveNewlines) {
            const newlinesNumber = this.whitespaceProcessor.countNewlinesNoWords(str);
            if (newlinesNumber > 0) {
                this._stackItem.inlineTextBuilder.startNewLine(newlinesNumber);
                // keep stashedLineBreaks unchanged
                return;
            }
        }
        if (this._stackItem.stashedLineBreaks) {
            this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
        }
        this.whitespaceProcessor.shrinkWrapAdd(str, this._stackItem.inlineTextBuilder, noWordTransform ? undefined : this._getCombinedWordTransformer(), this._stackItem.isNoWrap);
        this._stackItem.stashedLineBreaks = 0; // inline text doesn't introduce line breaks
    }
    /**
   * Add a string inline into the currently built block.
   *
   * Use this for markup elements that don't have to adhere
   * to text layout rules.
   *
   * @param { string } str Text to add.
   */ addLiteral(str) {
        if (!(this._stackItem instanceof BlockStackItem || this._stackItem instanceof ListItemStackItem || this._stackItem instanceof TableCellStackItem)) {
            return;
        }
        if (str.length === 0) {
            return;
        }
        if (this._stackItem.isPre) {
            this._stackItem.rawText += str;
            return;
        }
        if (this._stackItem.stashedLineBreaks) {
            this._stackItem.inlineTextBuilder.startNewLine(this._stackItem.stashedLineBreaks);
        }
        this.whitespaceProcessor.addLiteral(str, this._stackItem.inlineTextBuilder, this._stackItem.isNoWrap);
        this._stackItem.stashedLineBreaks = 0;
    }
    /**
   * Start building a new block.
   *
   * @param { object } [param0]
   * Object holding the parameters of the block.
   *
   * @param { number } [param0.leadingLineBreaks]
   * This block should have at least this number of line breaks to separate it from any preceding block.
   *
   * @param { number }  [param0.reservedLineLength]
   * Reserve this number of characters on each line for block markup.
   *
   * @param { boolean } [param0.isPre]
   * Should HTML whitespace be preserved inside this block.
   */ openBlock({ leadingLineBreaks = 1, reservedLineLength = 0, isPre = false } = {}) {
        const maxLineLength = Math.max(20, this._stackItem.inlineTextBuilder.maxLineLength - reservedLineLength);
        this._stackItem = new BlockStackItem(this.options, this._stackItem, leadingLineBreaks, maxLineLength);
        if (isPre) {
            this._stackItem.isPre = true;
        }
    }
    /**
   * Finalize currently built block, add it's content to the parent block.
   *
   * @param { object } [param0]
   * Object holding the parameters of the block.
   *
   * @param { number } [param0.trailingLineBreaks]
   * This block should have at least this number of line breaks to separate it from any following block.
   *
   * @param { (str: string) => string } [param0.blockTransform]
   * A function to transform the block text before adding to the parent block.
   * This happens after word wrap and should be used in combination with reserved line length
   * in order to keep line lengths correct.
   * Used for whole block markup.
   */ closeBlock({ trailingLineBreaks = 1, blockTransform = undefined } = {}) {
        const block = this._popStackItem();
        const blockText = blockTransform ? blockTransform(getText(block)) : getText(block);
        addText(this._stackItem, blockText, block.leadingLineBreaks, Math.max(block.stashedLineBreaks, trailingLineBreaks));
    }
    /**
   * Start building a new list.
   *
   * @param { object } [param0]
   * Object holding the parameters of the list.
   *
   * @param { number } [param0.maxPrefixLength]
   * Length of the longest list item prefix.
   * If not supplied or too small then list items won't be aligned properly.
   *
   * @param { 'left' | 'right' } [param0.prefixAlign]
   * Specify how prefixes of different lengths have to be aligned
   * within a column.
   *
   * @param { number } [param0.interRowLineBreaks]
   * Minimum number of line breaks between list items.
   *
   * @param { number } [param0.leadingLineBreaks]
   * This list should have at least this number of line breaks to separate it from any preceding block.
   */ openList({ maxPrefixLength = 0, prefixAlign = 'left', interRowLineBreaks = 1, leadingLineBreaks = 2 } = {}) {
        this._stackItem = new ListStackItem(this.options, this._stackItem, {
            interRowLineBreaks: interRowLineBreaks,
            leadingLineBreaks: leadingLineBreaks,
            maxLineLength: this._stackItem.inlineTextBuilder.maxLineLength,
            maxPrefixLength: maxPrefixLength,
            prefixAlign: prefixAlign
        });
    }
    /**
   * Start building a new list item.
   *
   * @param {object} param0
   * Object holding the parameters of the list item.
   *
   * @param { string } [param0.prefix]
   * Prefix for this list item (item number, bullet point, etc).
   */ openListItem({ prefix = '' } = {}) {
        if (!(this._stackItem instanceof ListStackItem)) {
            throw new Error('Can\'t add a list item to something that is not a list! Check the formatter.');
        }
        const list = this._stackItem;
        const prefixLength = Math.max(prefix.length, list.maxPrefixLength);
        const maxLineLength = Math.max(20, list.inlineTextBuilder.maxLineLength - prefixLength);
        this._stackItem = new ListItemStackItem(this.options, list, {
            prefix: prefix,
            maxLineLength: maxLineLength,
            leadingLineBreaks: list.interRowLineBreaks
        });
    }
    /**
   * Finalize currently built list item, add it's content to the parent list.
   */ closeListItem() {
        const listItem = this._popStackItem();
        const list = listItem.next;
        const prefixLength = Math.max(listItem.prefix.length, list.maxPrefixLength);
        const spacing = '\n' + ' '.repeat(prefixLength);
        const prefix = list.prefixAlign === 'right' ? listItem.prefix.padStart(prefixLength) : listItem.prefix.padEnd(prefixLength);
        const text = prefix + getText(listItem).replace(/\n/g, spacing);
        addText(list, text, listItem.leadingLineBreaks, Math.max(listItem.stashedLineBreaks, list.interRowLineBreaks));
    }
    /**
   * Finalize currently built list, add it's content to the parent block.
   *
   * @param { object } param0
   * Object holding the parameters of the list.
   *
   * @param { number } [param0.trailingLineBreaks]
   * This list should have at least this number of line breaks to separate it from any following block.
   */ closeList({ trailingLineBreaks = 2 } = {}) {
        const list = this._popStackItem();
        const text = getText(list);
        if (text) {
            addText(this._stackItem, text, list.leadingLineBreaks, trailingLineBreaks);
        }
    }
    /**
   * Start building a table.
   */ openTable() {
        this._stackItem = new TableStackItem(this._stackItem);
    }
    /**
   * Start building a table row.
   */ openTableRow() {
        if (!(this._stackItem instanceof TableStackItem)) {
            throw new Error('Can\'t add a table row to something that is not a table! Check the formatter.');
        }
        this._stackItem = new TableRowStackItem(this._stackItem);
    }
    /**
   * Start building a table cell.
   *
   * @param { object } [param0]
   * Object holding the parameters of the cell.
   *
   * @param { number } [param0.maxColumnWidth]
   * Wrap cell content to this width. Fall back to global wordwrap value if undefined.
   */ openTableCell({ maxColumnWidth = undefined } = {}) {
        if (!(this._stackItem instanceof TableRowStackItem)) {
            throw new Error('Can\'t add a table cell to something that is not a table row! Check the formatter.');
        }
        this._stackItem = new TableCellStackItem(this.options, this._stackItem, maxColumnWidth);
    }
    /**
   * Finalize currently built table cell and add it to parent table row's cells.
   *
   * @param { object } [param0]
   * Object holding the parameters of the cell.
   *
   * @param { number } [param0.colspan] How many columns this cell should occupy.
   * @param { number } [param0.rowspan] How many rows this cell should occupy.
   */ closeTableCell({ colspan = 1, rowspan = 1 } = {}) {
        const cell = this._popStackItem();
        const text = trimCharacter(getText(cell), '\n');
        cell.next.cells.push({
            colspan: colspan,
            rowspan: rowspan,
            text: text
        });
    }
    /**
   * Finalize currently built table row and add it to parent table's rows.
   */ closeTableRow() {
        const row = this._popStackItem();
        row.next.rows.push(row.cells);
    }
    /**
   * Finalize currently built table and add the rendered text to the parent block.
   *
   * @param { object } param0
   * Object holding the parameters of the table.
   *
   * @param { TablePrinter } param0.tableToString
   * A function to convert a table of stringified cells into a complete table.
   *
   * @param { number } [param0.leadingLineBreaks]
   * This table should have at least this number of line breaks to separate if from any preceding block.
   *
   * @param { number } [param0.trailingLineBreaks]
   * This table should have at least this number of line breaks to separate it from any following block.
   */ closeTable({ tableToString, leadingLineBreaks = 2, trailingLineBreaks = 2 }) {
        const table = this._popStackItem();
        const output = tableToString(table.rows);
        if (output) {
            addText(this._stackItem, output, leadingLineBreaks, trailingLineBreaks);
        }
    }
    /**
   * Return the rendered text content of this builder.
   *
   * @returns { string }
   */ toString() {
        return getText(this._stackItem.getRoot());
    // There should only be the root item if everything is closed properly.
    }
}
function getText(stackItem) {
    if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) {
        throw new Error('Only blocks, list items and table cells can be requested for text contents.');
    }
    return stackItem.inlineTextBuilder.isEmpty() ? stackItem.rawText : stackItem.rawText + stackItem.inlineTextBuilder.toString();
}
function addText(stackItem, text, leadingLineBreaks, trailingLineBreaks) {
    if (!(stackItem instanceof BlockStackItem || stackItem instanceof ListItemStackItem || stackItem instanceof TableCellStackItem)) {
        throw new Error('Only blocks, list items and table cells can contain text.');
    }
    const parentText = getText(stackItem);
    const lineBreaks = Math.max(stackItem.stashedLineBreaks, leadingLineBreaks);
    stackItem.inlineTextBuilder.clear();
    if (parentText) {
        stackItem.rawText = parentText + '\n'.repeat(lineBreaks) + text;
    } else {
        stackItem.rawText = text;
        stackItem.leadingLineBreaks = lineBreaks;
    }
    stackItem.stashedLineBreaks = trailingLineBreaks;
}
/**
 * @param { string } str A string to transform.
 * @param { TransformerStackItem } transformer A transformer item (with possible continuation).
 * @returns { string }
 */ function applyTransformer(str, transformer) {
    return transformer ? applyTransformer(transformer.transform(str), transformer.next) : str;
}
/**
 * Compile selectors into a decision tree,
 * return a function intended for batch processing.
 *
 * @param   { Options } [options = {}]   HtmlToText options (defaults, formatters, user options merged, deduplicated).
 * @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
 * @static
 */ function compile$1(options = {}) {
    const selectorsWithoutFormat = options.selectors.filter((s)=>!s.format);
    if (selectorsWithoutFormat.length) {
        throw new Error('Following selectors have no specified format: ' + selectorsWithoutFormat.map((s)=>`\`${s.selector}\``).join(', '));
    }
    const picker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$selderee$2f$lib$2f$selderee$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DecisionTree"](options.selectors.map((s)=>[
            s.selector,
            s
        ])).build(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$selderee$2f$plugin$2d$htmlparser2$2f$lib$2f$hp2$2d$builder$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hp2Builder"]);
    if (typeof options.encodeCharacters !== 'function') {
        options.encodeCharacters = makeReplacerFromDict(options.encodeCharacters);
    }
    const baseSelectorsPicker = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$selderee$2f$lib$2f$selderee$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["DecisionTree"](options.baseElements.selectors.map((s, i)=>[
            s,
            i + 1
        ])).build(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$selderee$2f$plugin$2d$htmlparser2$2f$lib$2f$hp2$2d$builder$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hp2Builder"]);
    function findBaseElements(dom) {
        return findBases(dom, options, baseSelectorsPicker);
    }
    const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk, function(dom, builder) {
        builder.addInline(options.limits.ellipsis || '');
    });
    return function(html, metadata = undefined) {
        return process(html, metadata, options, picker, findBaseElements, limitedWalk);
    };
}
/**
 * Convert given HTML according to preprocessed options.
 *
 * @param { string } html HTML content to convert.
 * @param { any } metadata Optional metadata for HTML document, for use in formatters.
 * @param { Options } options HtmlToText options (preprocessed).
 * @param { import('selderee').Picker<DomNode, TagDefinition> } picker
 * Tag definition picker for DOM nodes processing.
 * @param { (dom: DomNode[]) => DomNode[] } findBaseElements
 * Function to extract elements from HTML DOM
 * that will only be present in the output text.
 * @param { RecursiveCallback } walk Recursive callback.
 * @returns { string }
 */ function process(html, metadata, options, picker, findBaseElements, walk) {
    const maxInputLength = options.limits.maxInputLength;
    if (maxInputLength && html && html.length > maxInputLength) {
        console.warn(`Input length ${html.length} is above allowed limit of ${maxInputLength}. Truncating without ellipsis.`);
        html = html.substring(0, maxInputLength);
    }
    const document = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["parseDocument"])(html, {
        decodeEntities: options.decodeEntities
    });
    const bases = findBaseElements(document.children);
    const builder = new BlockTextBuilder(options, picker, metadata);
    walk(bases, builder);
    return builder.toString();
}
function findBases(dom, options, baseSelectorsPicker) {
    const results = [];
    function recursiveWalk(walk, /** @type { DomNode[] } */ dom) {
        dom = dom.slice(0, options.limits.maxChildNodes);
        for (const elem of dom){
            if (elem.type !== 'tag') {
                continue;
            }
            const pickedSelectorIndex = baseSelectorsPicker.pick1(elem);
            if (pickedSelectorIndex > 0) {
                results.push({
                    selectorIndex: pickedSelectorIndex,
                    element: elem
                });
            } else if (elem.children) {
                walk(elem.children);
            }
            if (results.length >= options.limits.maxBaseElements) {
                return;
            }
        }
    }
    const limitedWalk = limitedDepthRecursive(options.limits.maxDepth, recursiveWalk);
    limitedWalk(dom);
    if (options.baseElements.orderBy !== 'occurrence') {
        results.sort((a, b)=>a.selectorIndex - b.selectorIndex);
    }
    return options.baseElements.returnDomByDefault && results.length === 0 ? dom : results.map((x)=>x.element);
}
/**
 * Function to walk through DOM nodes and accumulate their string representations.
 *
 * @param   { RecursiveCallback } walk    Recursive callback.
 * @param   { DomNode[] }         [dom]   Nodes array to process.
 * @param   { BlockTextBuilder }  builder Passed around to accumulate output text.
 * @private
 */ function recursiveWalk(walk, dom, builder) {
    if (!dom) {
        return;
    }
    const options = builder.options;
    const tooManyChildNodes = dom.length > options.limits.maxChildNodes;
    if (tooManyChildNodes) {
        dom = dom.slice(0, options.limits.maxChildNodes);
        dom.push({
            data: options.limits.ellipsis,
            type: 'text'
        });
    }
    for (const elem of dom){
        switch(elem.type){
            case 'text':
                {
                    builder.addInline(elem.data);
                    break;
                }
            case 'tag':
                {
                    const tagDefinition = builder.picker.pick1(elem);
                    const format = options.formatters[tagDefinition.format];
                    format(elem, walk, builder, tagDefinition.options || {});
                    break;
                }
        }
    }
    return;
}
/**
 * @param { Object<string,string | false> } dict
 * A dictionary where keys are characters to replace
 * and values are replacement strings.
 *
 * First code point from dict keys is used.
 * Compound emojis with ZWJ are not supported (not until Node 16).
 *
 * @returns { ((str: string) => string) | undefined }
 */ function makeReplacerFromDict(dict) {
    if (!dict || Object.keys(dict).length === 0) {
        return undefined;
    }
    /** @type { [string, string][] } */ const entries = Object.entries(dict).filter(([, v])=>v !== false);
    const regex = new RegExp(entries.map(([c])=>`(${unicodeEscape([
            ...c
        ][0])})`).join('|'), 'g');
    const values = entries.map(([, v])=>v);
    const replacer = (m, ...cgs)=>values[cgs.findIndex((cg)=>cg)];
    return (str)=>str.replace(regex, replacer);
}
/**
 * Dummy formatter that discards the input and does nothing.
 *
 * @type { FormatCallback }
 */ function formatSkip(elem, walk, builder, formatOptions) {
/* do nothing */ }
/**
 * Insert the given string literal inline instead of a tag.
 *
 * @type { FormatCallback }
 */ function formatInlineString(elem, walk, builder, formatOptions) {
    builder.addLiteral(formatOptions.string || '');
}
/**
 * Insert a block with the given string literal instead of a tag.
 *
 * @type { FormatCallback }
 */ function formatBlockString(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    builder.addLiteral(formatOptions.string || '');
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Process an inline-level element.
 *
 * @type { FormatCallback }
 */ function formatInline(elem, walk, builder, formatOptions) {
    walk(elem.children, builder);
}
/**
 * Process a block-level container.
 *
 * @type { FormatCallback }
 */ function formatBlock$1(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    walk(elem.children, builder);
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
function renderOpenTag(elem) {
    const attrs = elem.attribs && elem.attribs.length ? ' ' + Object.entries(elem.attribs).map(([k, v])=>v === '' ? k : `${k}=${v.replace(/"/g, '&quot;')}`).join(' ') : '';
    return `<${elem.name}${attrs}>`;
}
function renderCloseTag(elem) {
    return `</${elem.name}>`;
}
/**
 * Render an element as inline HTML tag, walk through it's children.
 *
 * @type { FormatCallback }
 */ function formatInlineTag(elem, walk, builder, formatOptions) {
    builder.startNoWrap();
    builder.addLiteral(renderOpenTag(elem));
    builder.stopNoWrap();
    walk(elem.children, builder);
    builder.startNoWrap();
    builder.addLiteral(renderCloseTag(elem));
    builder.stopNoWrap();
}
/**
 * Render an element as HTML block bag, walk through it's children.
 *
 * @type { FormatCallback }
 */ function formatBlockTag(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    builder.startNoWrap();
    builder.addLiteral(renderOpenTag(elem));
    builder.stopNoWrap();
    walk(elem.children, builder);
    builder.startNoWrap();
    builder.addLiteral(renderCloseTag(elem));
    builder.stopNoWrap();
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Render an element with all it's children as inline HTML.
 *
 * @type { FormatCallback }
 */ function formatInlineHtml(elem, walk, builder, formatOptions) {
    builder.startNoWrap();
    builder.addLiteral((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["render"])(elem, {
        decodeEntities: builder.options.decodeEntities
    }));
    builder.stopNoWrap();
}
/**
 * Render an element with all it's children as HTML block.
 *
 * @type { FormatCallback }
 */ function formatBlockHtml(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    builder.startNoWrap();
    builder.addLiteral((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$dom$2d$serializer$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["render"])(elem, {
        decodeEntities: builder.options.decodeEntities
    }));
    builder.stopNoWrap();
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Render inline element wrapped with given strings.
 *
 * @type { FormatCallback }
 */ function formatInlineSurround(elem, walk, builder, formatOptions) {
    builder.addLiteral(formatOptions.prefix || '');
    walk(elem.children, builder);
    builder.addLiteral(formatOptions.suffix || '');
}
var genericFormatters = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    block: formatBlock$1,
    blockHtml: formatBlockHtml,
    blockString: formatBlockString,
    blockTag: formatBlockTag,
    inline: formatInline,
    inlineHtml: formatInlineHtml,
    inlineString: formatInlineString,
    inlineSurround: formatInlineSurround,
    inlineTag: formatInlineTag,
    skip: formatSkip
});
function getRow(matrix, j) {
    if (!matrix[j]) {
        matrix[j] = [];
    }
    return matrix[j];
}
function findFirstVacantIndex(row, x = 0) {
    while(row[x]){
        x++;
    }
    return x;
}
function transposeInPlace(matrix, maxSize) {
    for(let i = 0; i < maxSize; i++){
        const rowI = getRow(matrix, i);
        for(let j = 0; j < i; j++){
            const rowJ = getRow(matrix, j);
            if (rowI[j] || rowJ[i]) {
                const temp = rowI[j];
                rowI[j] = rowJ[i];
                rowJ[i] = temp;
            }
        }
    }
}
function putCellIntoLayout(cell, layout, baseRow, baseCol) {
    for(let r = 0; r < cell.rowspan; r++){
        const layoutRow = getRow(layout, baseRow + r);
        for(let c = 0; c < cell.colspan; c++){
            layoutRow[baseCol + c] = cell;
        }
    }
}
function getOrInitOffset(offsets, index) {
    if (offsets[index] === undefined) {
        offsets[index] = index === 0 ? 0 : 1 + getOrInitOffset(offsets, index - 1);
    }
    return offsets[index];
}
function updateOffset(offsets, base, span, value) {
    offsets[base + span] = Math.max(getOrInitOffset(offsets, base + span), getOrInitOffset(offsets, base) + value);
}
/**
 * Render a table into a string.
 * Cells can contain multiline text and span across multiple rows and columns.
 *
 * Modifies cells to add lines array.
 *
 * @param { TablePrinterCell[][] } tableRows Table to render.
 * @param { number } rowSpacing Number of spaces between columns.
 * @param { number } colSpacing Number of empty lines between rows.
 * @returns { string }
 */ function tableToString(tableRows, rowSpacing, colSpacing) {
    const layout = [];
    let colNumber = 0;
    const rowNumber = tableRows.length;
    const rowOffsets = [
        0
    ];
    // Fill the layout table and row offsets row-by-row.
    for(let j = 0; j < rowNumber; j++){
        const layoutRow = getRow(layout, j);
        const cells = tableRows[j];
        let x = 0;
        for(let i = 0; i < cells.length; i++){
            const cell = cells[i];
            x = findFirstVacantIndex(layoutRow, x);
            putCellIntoLayout(cell, layout, j, x);
            x += cell.colspan;
            cell.lines = cell.text.split('\n');
            const cellHeight = cell.lines.length;
            updateOffset(rowOffsets, j, cell.rowspan, cellHeight + rowSpacing);
        }
        colNumber = layoutRow.length > colNumber ? layoutRow.length : colNumber;
    }
    transposeInPlace(layout, rowNumber > colNumber ? rowNumber : colNumber);
    const outputLines = [];
    const colOffsets = [
        0
    ];
    // Fill column offsets and output lines column-by-column.
    for(let x = 0; x < colNumber; x++){
        let y = 0;
        let cell;
        const rowsInThisColumn = Math.min(rowNumber, layout[x].length);
        while(y < rowsInThisColumn){
            cell = layout[x][y];
            if (cell) {
                if (!cell.rendered) {
                    let cellWidth = 0;
                    for(let j = 0; j < cell.lines.length; j++){
                        const line = cell.lines[j];
                        const lineOffset = rowOffsets[y] + j;
                        outputLines[lineOffset] = (outputLines[lineOffset] || '').padEnd(colOffsets[x]) + line;
                        cellWidth = line.length > cellWidth ? line.length : cellWidth;
                    }
                    updateOffset(colOffsets, x, cell.colspan, cellWidth + colSpacing);
                    cell.rendered = true;
                }
                y += cell.rowspan;
            } else {
                const lineOffset = rowOffsets[y];
                outputLines[lineOffset] = outputLines[lineOffset] || '';
                y++;
            }
        }
    }
    return outputLines.join('\n');
}
/**
 * Process a line-break.
 *
 * @type { FormatCallback }
 */ function formatLineBreak(elem, walk, builder, formatOptions) {
    builder.addLineBreak();
}
/**
 * Process a `wbr` tag (word break opportunity).
 *
 * @type { FormatCallback }
 */ function formatWbr(elem, walk, builder, formatOptions) {
    builder.addWordBreakOpportunity();
}
/**
 * Process a horizontal line.
 *
 * @type { FormatCallback }
 */ function formatHorizontalLine(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    builder.addInline('-'.repeat(formatOptions.length || builder.options.wordwrap || 40));
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Process a paragraph.
 *
 * @type { FormatCallback }
 */ function formatParagraph(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    walk(elem.children, builder);
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Process a preformatted content.
 *
 * @type { FormatCallback }
 */ function formatPre(elem, walk, builder, formatOptions) {
    builder.openBlock({
        isPre: true,
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    walk(elem.children, builder);
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Process a heading.
 *
 * @type { FormatCallback }
 */ function formatHeading(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2
    });
    if (formatOptions.uppercase !== false) {
        builder.pushWordTransform((str)=>str.toUpperCase());
        walk(elem.children, builder);
        builder.popWordTransform();
    } else {
        walk(elem.children, builder);
    }
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Process a blockquote.
 *
 * @type { FormatCallback }
 */ function formatBlockquote(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks || 2,
        reservedLineLength: 2
    });
    walk(elem.children, builder);
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks || 2,
        blockTransform: (str)=>(formatOptions.trimEmptyLines !== false ? trimCharacter(str, '\n') : str).split('\n').map((line)=>'> ' + line).join('\n')
    });
}
function withBrackets(str, brackets) {
    if (!brackets) {
        return str;
    }
    const lbr = typeof brackets[0] === 'string' ? brackets[0] : '[';
    const rbr = typeof brackets[1] === 'string' ? brackets[1] : ']';
    return lbr + str + rbr;
}
function pathRewrite(path, rewriter, baseUrl, metadata, elem) {
    const modifiedPath = typeof rewriter === 'function' ? rewriter(path, metadata, elem) : path;
    return modifiedPath[0] === '/' && baseUrl ? trimCharacterEnd(baseUrl, '/') + modifiedPath : modifiedPath;
}
/**
 * Process an image.
 *
 * @type { FormatCallback }
 */ function formatImage(elem, walk, builder, formatOptions) {
    const attribs = elem.attribs || {};
    const alt = attribs.alt ? attribs.alt : '';
    const src = !attribs.src ? '' : pathRewrite(attribs.src, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
    const text = !src ? alt : !alt ? withBrackets(src, formatOptions.linkBrackets) : alt + ' ' + withBrackets(src, formatOptions.linkBrackets);
    builder.addInline(text, {
        noWordTransform: true
    });
}
// a img baseUrl
// a img pathRewrite
// a img linkBrackets
// a     ignoreHref: false
//            ignoreText ?
// a     noAnchorUrl: true
//            can be replaced with selector
// a     hideLinkHrefIfSameAsText: false
//            how to compare, what to show (text, href, normalized) ?
// a     mailto protocol removed without options
// a     protocols: mailto, tel, ...
//            can be matched with selector?
// anchors, protocols - only if no pathRewrite fn is provided
// normalize-url ?
// a
// a[href^="#"] - format:skip by default
// a[href^="mailto:"] - ?
/**
 * Process an anchor.
 *
 * @type { FormatCallback }
 */ function formatAnchor(elem, walk, builder, formatOptions) {
    function getHref() {
        if (formatOptions.ignoreHref) {
            return '';
        }
        if (!elem.attribs || !elem.attribs.href) {
            return '';
        }
        let href = elem.attribs.href.replace(/^mailto:/, '');
        if (formatOptions.noAnchorUrl && href[0] === '#') {
            return '';
        }
        href = pathRewrite(href, formatOptions.pathRewrite, formatOptions.baseUrl, builder.metadata, elem);
        return href;
    }
    const href = getHref();
    if (!href) {
        walk(elem.children, builder);
    } else {
        let text = '';
        builder.pushWordTransform((str)=>{
            if (str) {
                text += str;
            }
            return str;
        });
        walk(elem.children, builder);
        builder.popWordTransform();
        const hideSameLink = formatOptions.hideLinkHrefIfSameAsText && href === text;
        if (!hideSameLink) {
            builder.addInline(!text ? href : ' ' + withBrackets(href, formatOptions.linkBrackets), {
                noWordTransform: true
            });
        }
    }
}
/**
 * @param { DomNode }           elem               List items with their prefixes.
 * @param { RecursiveCallback } walk               Recursive callback to process child nodes.
 * @param { BlockTextBuilder }  builder            Passed around to accumulate output text.
 * @param { FormatOptions }     formatOptions      Options specific to a formatter.
 * @param { () => string }      nextPrefixCallback Function that returns increasing index each time it is called.
 */ function formatList(elem, walk, builder, formatOptions, nextPrefixCallback) {
    const isNestedList = get(elem, [
        'parent',
        'name'
    ]) === 'li';
    // With Roman numbers, index length is not as straightforward as with Arabic numbers or letters,
    // so the dumb length comparison is the most robust way to get the correct value.
    let maxPrefixLength = 0;
    const listItems = (elem.children || [])// it might be more accurate to check only for html spaces here, but no significant benefit
    .filter((child)=>child.type !== 'text' || !/^\s*$/.test(child.data)).map(function(child) {
        if (child.name !== 'li') {
            return {
                node: child,
                prefix: ''
            };
        }
        const prefix = isNestedList ? nextPrefixCallback().trimStart() : nextPrefixCallback();
        if (prefix.length > maxPrefixLength) {
            maxPrefixLength = prefix.length;
        }
        return {
            node: child,
            prefix: prefix
        };
    });
    if (!listItems.length) {
        return;
    }
    builder.openList({
        interRowLineBreaks: 1,
        leadingLineBreaks: isNestedList ? 1 : formatOptions.leadingLineBreaks || 2,
        maxPrefixLength: maxPrefixLength,
        prefixAlign: 'left'
    });
    for (const { node, prefix } of listItems){
        builder.openListItem({
            prefix: prefix
        });
        walk([
            node
        ], builder);
        builder.closeListItem();
    }
    builder.closeList({
        trailingLineBreaks: isNestedList ? 1 : formatOptions.trailingLineBreaks || 2
    });
}
/**
 * Process an unordered list.
 *
 * @type { FormatCallback }
 */ function formatUnorderedList(elem, walk, builder, formatOptions) {
    const prefix = formatOptions.itemPrefix || ' * ';
    return formatList(elem, walk, builder, formatOptions, ()=>prefix);
}
/**
 * Process an ordered list.
 *
 * @type { FormatCallback }
 */ function formatOrderedList(elem, walk, builder, formatOptions) {
    let nextIndex = Number(elem.attribs.start || '1');
    const indexFunction = getOrderedListIndexFunction(elem.attribs.type);
    const nextPrefixCallback = ()=>' ' + indexFunction(nextIndex++) + '. ';
    return formatList(elem, walk, builder, formatOptions, nextPrefixCallback);
}
/**
 * Return a function that can be used to generate index markers of a specified format.
 *
 * @param   { string } [olType='1'] Marker type.
 * @returns { (i: number) => string }
 */ function getOrderedListIndexFunction(olType = '1') {
    switch(olType){
        case 'a':
            return (i)=>numberToLetterSequence(i, 'a');
        case 'A':
            return (i)=>numberToLetterSequence(i, 'A');
        case 'i':
            return (i)=>numberToRoman(i).toLowerCase();
        case 'I':
            return (i)=>numberToRoman(i);
        case '1':
        default:
            return (i)=>i.toString();
    }
}
/**
 * Given a list of class and ID selectors (prefixed with '.' and '#'),
 * return them as separate lists of names without prefixes.
 *
 * @param { string[] } selectors Class and ID selectors (`[".class", "#id"]` etc).
 * @returns { { classes: string[], ids: string[] } }
 */ function splitClassesAndIds(selectors) {
    const classes = [];
    const ids = [];
    for (const selector of selectors){
        if (selector.startsWith('.')) {
            classes.push(selector.substring(1));
        } else if (selector.startsWith('#')) {
            ids.push(selector.substring(1));
        }
    }
    return {
        classes: classes,
        ids: ids
    };
}
function isDataTable(attr, tables) {
    if (tables === true) {
        return true;
    }
    if (!attr) {
        return false;
    }
    const { classes, ids } = splitClassesAndIds(tables);
    const attrClasses = (attr['class'] || '').split(' ');
    const attrIds = (attr['id'] || '').split(' ');
    return attrClasses.some((x)=>classes.includes(x)) || attrIds.some((x)=>ids.includes(x));
}
/**
 * Process a table (either as a container or as a data table, depending on options).
 *
 * @type { FormatCallback }
 */ function formatTable(elem, walk, builder, formatOptions) {
    return isDataTable(elem.attribs, builder.options.tables) ? formatDataTable(elem, walk, builder, formatOptions) : formatBlock(elem, walk, builder, formatOptions);
}
function formatBlock(elem, walk, builder, formatOptions) {
    builder.openBlock({
        leadingLineBreaks: formatOptions.leadingLineBreaks
    });
    walk(elem.children, builder);
    builder.closeBlock({
        trailingLineBreaks: formatOptions.trailingLineBreaks
    });
}
/**
 * Process a data table.
 *
 * @type { FormatCallback }
 */ function formatDataTable(elem, walk, builder, formatOptions) {
    builder.openTable();
    elem.children.forEach(walkTable);
    builder.closeTable({
        tableToString: (rows)=>tableToString(rows, formatOptions.rowSpacing ?? 0, formatOptions.colSpacing ?? 3),
        leadingLineBreaks: formatOptions.leadingLineBreaks,
        trailingLineBreaks: formatOptions.trailingLineBreaks
    });
    function formatCell(cellNode) {
        const colspan = +get(cellNode, [
            'attribs',
            'colspan'
        ]) || 1;
        const rowspan = +get(cellNode, [
            'attribs',
            'rowspan'
        ]) || 1;
        builder.openTableCell({
            maxColumnWidth: formatOptions.maxColumnWidth
        });
        walk(cellNode.children, builder);
        builder.closeTableCell({
            colspan: colspan,
            rowspan: rowspan
        });
    }
    function walkTable(elem) {
        if (elem.type !== 'tag') {
            return;
        }
        const formatHeaderCell = formatOptions.uppercaseHeaderCells !== false ? (cellNode)=>{
            builder.pushWordTransform((str)=>str.toUpperCase());
            formatCell(cellNode);
            builder.popWordTransform();
        } : formatCell;
        switch(elem.name){
            case 'thead':
            case 'tbody':
            case 'tfoot':
            case 'center':
                elem.children.forEach(walkTable);
                return;
            case 'tr':
                {
                    builder.openTableRow();
                    for (const childOfTr of elem.children){
                        if (childOfTr.type !== 'tag') {
                            continue;
                        }
                        switch(childOfTr.name){
                            case 'th':
                                {
                                    formatHeaderCell(childOfTr);
                                    break;
                                }
                            case 'td':
                                {
                                    formatCell(childOfTr);
                                    break;
                                }
                        }
                    }
                    builder.closeTableRow();
                    break;
                }
        }
    }
}
var textFormatters = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    anchor: formatAnchor,
    blockquote: formatBlockquote,
    dataTable: formatDataTable,
    heading: formatHeading,
    horizontalLine: formatHorizontalLine,
    image: formatImage,
    lineBreak: formatLineBreak,
    orderedList: formatOrderedList,
    paragraph: formatParagraph,
    pre: formatPre,
    table: formatTable,
    unorderedList: formatUnorderedList,
    wbr: formatWbr
});
/**
 * Default options.
 *
 * @constant
 * @type { Options }
 * @default
 * @private
 */ const DEFAULT_OPTIONS = {
    baseElements: {
        selectors: [
            'body'
        ],
        orderBy: 'selectors',
        returnDomByDefault: true
    },
    decodeEntities: true,
    encodeCharacters: {},
    formatters: {},
    limits: {
        ellipsis: '...',
        maxBaseElements: undefined,
        maxChildNodes: undefined,
        maxDepth: undefined,
        maxInputLength: 1 << 24
    },
    longWordSplit: {
        forceWrapOnLimit: false,
        wrapCharacters: []
    },
    preserveNewlines: false,
    selectors: [
        {
            selector: '*',
            format: 'inline'
        },
        {
            selector: 'a',
            format: 'anchor',
            options: {
                baseUrl: null,
                hideLinkHrefIfSameAsText: false,
                ignoreHref: false,
                linkBrackets: [
                    '[',
                    ']'
                ],
                noAnchorUrl: true
            }
        },
        {
            selector: 'article',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'aside',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'blockquote',
            format: 'blockquote',
            options: {
                leadingLineBreaks: 2,
                trailingLineBreaks: 2,
                trimEmptyLines: true
            }
        },
        {
            selector: 'br',
            format: 'lineBreak'
        },
        {
            selector: 'div',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'footer',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'form',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'h1',
            format: 'heading',
            options: {
                leadingLineBreaks: 3,
                trailingLineBreaks: 2,
                uppercase: true
            }
        },
        {
            selector: 'h2',
            format: 'heading',
            options: {
                leadingLineBreaks: 3,
                trailingLineBreaks: 2,
                uppercase: true
            }
        },
        {
            selector: 'h3',
            format: 'heading',
            options: {
                leadingLineBreaks: 3,
                trailingLineBreaks: 2,
                uppercase: true
            }
        },
        {
            selector: 'h4',
            format: 'heading',
            options: {
                leadingLineBreaks: 2,
                trailingLineBreaks: 2,
                uppercase: true
            }
        },
        {
            selector: 'h5',
            format: 'heading',
            options: {
                leadingLineBreaks: 2,
                trailingLineBreaks: 2,
                uppercase: true
            }
        },
        {
            selector: 'h6',
            format: 'heading',
            options: {
                leadingLineBreaks: 2,
                trailingLineBreaks: 2,
                uppercase: true
            }
        },
        {
            selector: 'header',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'hr',
            format: 'horizontalLine',
            options: {
                leadingLineBreaks: 2,
                length: undefined,
                trailingLineBreaks: 2
            }
        },
        {
            selector: 'img',
            format: 'image',
            options: {
                baseUrl: null,
                linkBrackets: [
                    '[',
                    ']'
                ]
            }
        },
        {
            selector: 'main',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'nav',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'ol',
            format: 'orderedList',
            options: {
                leadingLineBreaks: 2,
                trailingLineBreaks: 2
            }
        },
        {
            selector: 'p',
            format: 'paragraph',
            options: {
                leadingLineBreaks: 2,
                trailingLineBreaks: 2
            }
        },
        {
            selector: 'pre',
            format: 'pre',
            options: {
                leadingLineBreaks: 2,
                trailingLineBreaks: 2
            }
        },
        {
            selector: 'section',
            format: 'block',
            options: {
                leadingLineBreaks: 1,
                trailingLineBreaks: 1
            }
        },
        {
            selector: 'table',
            format: 'table',
            options: {
                colSpacing: 3,
                leadingLineBreaks: 2,
                maxColumnWidth: 60,
                rowSpacing: 0,
                trailingLineBreaks: 2,
                uppercaseHeaderCells: true
            }
        },
        {
            selector: 'ul',
            format: 'unorderedList',
            options: {
                itemPrefix: ' * ',
                leadingLineBreaks: 2,
                trailingLineBreaks: 2
            }
        },
        {
            selector: 'wbr',
            format: 'wbr'
        }
    ],
    tables: [],
    whitespaceCharacters: ' \t\r\n\f\u200b',
    wordwrap: 80
};
const concatMerge = (acc, src, options)=>[
        ...acc,
        ...src
    ];
const overwriteMerge = (acc, src, options)=>[
        ...src
    ];
const selectorsMerge = (acc, src, options)=>acc.some((s)=>typeof s === 'object') ? concatMerge(acc, src) // selectors
     : overwriteMerge(acc, src) // baseElements.selectors
;
/**
 * Preprocess options, compile selectors into a decision tree,
 * return a function intended for batch processing.
 *
 * @param   { Options } [options = {}]   HtmlToText options.
 * @returns { (html: string, metadata?: any) => string } Pre-configured converter function.
 * @static
 */ function compile(options = {}) {
    options = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$deepmerge$2f$dist$2f$cjs$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(DEFAULT_OPTIONS, options, {
        arrayMerge: overwriteMerge,
        customMerge: (key)=>key === 'selectors' ? selectorsMerge : undefined
    });
    options.formatters = Object.assign({}, genericFormatters, textFormatters, options.formatters);
    options.selectors = mergeDuplicatesPreferLast(options.selectors, (s)=>s.selector);
    handleDeprecatedOptions(options);
    return compile$1(options);
}
/**
 * Convert given HTML content to plain text string.
 *
 * @param   { string }  html           HTML content to convert.
 * @param   { Options } [options = {}] HtmlToText options.
 * @param   { any }     [metadata]     Optional metadata for HTML document, for use in formatters.
 * @returns { string }                 Plain text string.
 * @static
 *
 * @example
 * const { convert } = require('html-to-text');
 * const text = convert('<h1>Hello World</h1>', {
 *   wordwrap: 130
 * });
 * console.log(text); // HELLO WORLD
 */ function convert(html, options = {}, metadata = undefined) {
    return compile(options)(html, metadata);
}
/**
 * Map previously existing and now deprecated options to the new options layout.
 * This is a subject for cleanup in major releases.
 *
 * @param { Options } options HtmlToText options.
 */ function handleDeprecatedOptions(options) {
    if (options.tags) {
        const tagDefinitions = Object.entries(options.tags).map(([selector, definition])=>({
                ...definition,
                selector: selector || '*'
            }));
        options.selectors.push(...tagDefinitions);
        options.selectors = mergeDuplicatesPreferLast(options.selectors, (s)=>s.selector);
    }
    function set(obj, path, value) {
        const valueKey = path.pop();
        for (const key of path){
            let nested = obj[key];
            if (!nested) {
                nested = {};
                obj[key] = nested;
            }
            obj = nested;
        }
        obj[valueKey] = value;
    }
    if (options['baseElement']) {
        const baseElement = options['baseElement'];
        set(options, [
            'baseElements',
            'selectors'
        ], Array.isArray(baseElement) ? baseElement : [
            baseElement
        ]);
    }
    if (options['returnDomByDefault'] !== undefined) {
        set(options, [
            'baseElements',
            'returnDomByDefault'
        ], options['returnDomByDefault']);
    }
    for (const definition of options.selectors){
        if (definition.format === 'anchor' && get(definition, [
            'options',
            'noLinkBrackets'
        ])) {
            set(definition, [
                'options',
                'linkBrackets'
            ], false);
        }
    }
}
;
}),
"[project]/node_modules/html5parser/dist/index.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SyntaxKind",
    ()=>SyntaxKind,
    "TokenKind",
    ()=>TokenKind,
    "parse",
    ()=>parse,
    "removeAttribute",
    ()=>removeAttribute,
    "setAttribute",
    ()=>setAttribute,
    "stringify",
    ()=>stringify,
    "tokenize",
    ()=>tokenize,
    "walk",
    ()=>walk
]);
// src/types.ts
var SyntaxKind = /* @__PURE__ */ ((SyntaxKind2)=>{
    SyntaxKind2["Text"] = "Text";
    SyntaxKind2["Tag"] = "Tag";
    return SyntaxKind2;
})(SyntaxKind || {});
// src/config.ts
var selfCloseTags = /* @__PURE__ */ new Set([
    "area",
    "base",
    "basefont",
    "bgsound",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "image",
    "img",
    "input",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr",
    "!doctype",
    "",
    "!",
    "!--"
]);
var noNestedTags = /* @__PURE__ */ new Set([
    "li",
    "option",
    "select",
    "textarea"
]);
var rcDataTags = /* @__PURE__ */ new Set([
    "title",
    "textarea"
]);
var rawTextTags = /* @__PURE__ */ new Set([
    "style",
    "xmp",
    "iframe",
    "noembed",
    "noframes"
]);
var scriptDataTags = /* @__PURE__ */ new Set([
    "script"
]);
var scriptingRawTextTags = /* @__PURE__ */ new Set([
    "noscript"
]);
var plainTextTags = /* @__PURE__ */ new Set([
    "plaintext"
]);
// src/tokenize.ts
var TokenKind = /* @__PURE__ */ ((TokenKind2)=>{
    TokenKind2[TokenKind2["Literal"] = 0] = "Literal";
    TokenKind2[TokenKind2["OpenTag"] = 1] = "OpenTag";
    TokenKind2[TokenKind2["OpenTagEnd"] = 2] = "OpenTagEnd";
    TokenKind2[TokenKind2["CloseTag"] = 3] = "CloseTag";
    TokenKind2[TokenKind2["Whitespace"] = 4] = "Whitespace";
    TokenKind2[TokenKind2["AttrValueEq"] = 5] = "AttrValueEq";
    TokenKind2[TokenKind2["AttrValueNq"] = 6] = "AttrValueNq";
    TokenKind2[TokenKind2["AttrValueSq"] = 7] = "AttrValueSq";
    TokenKind2[TokenKind2["AttrValueDq"] = 8] = "AttrValueDq";
    return TokenKind2;
})(TokenKind || {});
var state;
var buffer;
var bufSize;
var sectionStart;
var index;
var tokens;
var char;
var offset;
var textMode;
var textEndTag;
var pendingTextMode;
var pendingTextTag;
var tokenizeOptions;
function makeCodePoints(input) {
    return {
        lower: input.toLowerCase().split("").map((c)=>c.charCodeAt(0)),
        upper: input.toUpperCase().split("").map((c)=>c.charCodeAt(0)),
        length: input.length
    };
}
var doctype = makeCodePoints("!doctype");
function isWhiteSpace() {
    return char === 32 /* _S */  || char === 10 /* _N */  || char === 9 /* _T */  || char === 9 /* _T */  || char === 13 /* _R */  || char === 12 /* _F */ ;
}
function init(input, options) {
    state = 0 /* Literal */ ;
    buffer = input;
    bufSize = input.length;
    sectionStart = 0;
    index = 0;
    tokens = [];
    offset = 0;
    textMode = 0 /* Data */ ;
    textEndTag = void 0;
    pendingTextMode = 0 /* Data */ ;
    pendingTextTag = "";
    tokenizeOptions = options;
}
function getTextMode(tagName) {
    if (rcDataTags.has(tagName)) {
        return 1 /* RcData */ ;
    }
    if (rawTextTags.has(tagName)) {
        return 2 /* RawText */ ;
    }
    if (scriptDataTags.has(tagName)) {
        return 3 /* ScriptData */ ;
    }
    if (plainTextTags.has(tagName)) {
        return 4 /* PlainText */ ;
    }
    if (tokenizeOptions.scriptingEnabled && scriptingRawTextTags.has(tagName)) {
        return 2 /* RawText */ ;
    }
    return 0 /* Data */ ;
}
function setPendingTextMode(tagName) {
    pendingTextTag = tagName;
    pendingTextMode = getTextMode(tagName);
}
function activatePendingTextMode(openTagEnd) {
    if (openTagEnd !== "/" && pendingTextMode !== 0 /* Data */ ) {
        textMode = pendingTextMode;
        textEndTag = makeCodePoints(pendingTextTag);
        if (pendingTextTag === "textarea" && buffer.charCodeAt(sectionStart) === 10 /* _N */ ) {
            sectionStart++;
            index++;
        }
    }
    pendingTextMode = 0 /* Data */ ;
    pendingTextTag = "";
}
function resetTextMode() {
    textMode = 0 /* Data */ ;
    textEndTag = void 0;
}
function resetTextClosingTag() {
    sectionStart -= 2;
    state = 0 /* Literal */ ;
}
function tokenize(input, options = {}) {
    init(input, {
        scriptingEnabled: options.scriptingEnabled !== false
    });
    while(index < bufSize){
        char = buffer.charCodeAt(index);
        switch(state){
            case 0 /* Literal */ :
                parseLiteral();
                break;
            case 1 /* BeforeOpenTag */ :
                parseBeforeOpenTag();
                break;
            case 2 /* OpeningTag */ :
                parseOpeningTag();
                break;
            case 3 /* AfterOpenTag */ :
                parseAfterOpenTag();
                break;
            case 4 /* InValueNq */ :
                parseInValueNq();
                break;
            case 5 /* InValueSq */ :
                parseInValueSq();
                break;
            case 6 /* InValueDq */ :
                parseInValueDq();
                break;
            case 7 /* ClosingOpenTag */ :
                parseClosingOpenTag();
                break;
            case 8 /* OpeningSpecial */ :
                parseOpeningSpecial();
                break;
            case 9 /* OpeningDoctype */ :
                parseOpeningDoctype();
                break;
            case 10 /* OpeningNormalComment */ :
                parseOpeningNormalComment();
                break;
            case 11 /* InNormalComment */ :
                parseNormalComment();
                break;
            case 12 /* InShortComment */ :
                parseShortComment();
                break;
            case 13 /* ClosingNormalComment */ :
                parseClosingNormalComment();
                break;
            case 14 /* ClosingTag */ :
                parseClosingTag();
                break;
            default:
                unexpected();
        }
        index++;
    }
    switch(state){
        case 0 /* Literal */ :
        case 1 /* BeforeOpenTag */ :
        case 4 /* InValueNq */ :
        case 5 /* InValueSq */ :
        case 6 /* InValueDq */ :
        case 7 /* ClosingOpenTag */ :
        case 11 /* InNormalComment */ :
        case 12 /* InShortComment */ :
        case 13 /* ClosingNormalComment */ :
            emitToken(0 /* Literal */ );
            break;
        case 2 /* OpeningTag */ :
            emitToken(1 /* OpenTag */ );
            break;
        case 3 /* AfterOpenTag */ :
            break;
        case 8 /* OpeningSpecial */ :
            emitToken(1 /* OpenTag */ , 12 /* InShortComment */ );
            break;
        case 9 /* OpeningDoctype */ :
            if (index - sectionStart === doctype.length) {
                emitToken(1 /* OpenTag */ );
            } else {
                emitToken(1 /* OpenTag */ , void 0, sectionStart + 1);
                emitToken(0 /* Literal */ );
            }
            break;
        case 10 /* OpeningNormalComment */ :
            if (index - sectionStart === 2) {
                emitToken(1 /* OpenTag */ );
            } else {
                emitToken(1 /* OpenTag */ , void 0, sectionStart + 1);
                emitToken(0 /* Literal */ );
            }
            break;
        case 14 /* ClosingTag */ :
            emitToken(3 /* CloseTag */ );
            break;
        default:
            break;
    }
    const _tokens = tokens;
    init("", tokenizeOptions);
    return _tokens;
}
function emitToken(kind, newState = state, end = index) {
    let value = buffer.substring(sectionStart, end);
    if (kind === 1 /* OpenTag */  || kind === 3 /* CloseTag */ ) {
        value = value.toLowerCase();
    }
    if (kind === 1 /* OpenTag */ ) {
        setPendingTextMode(value);
    }
    if (kind === 3 /* CloseTag */ ) {
        resetTextMode();
    }
    if (!((kind === 0 /* Literal */  || kind === 4 /* Whitespace */ ) && end === sectionStart)) {
        tokens.push({
            type: kind,
            start: sectionStart,
            end,
            value
        });
    }
    if (kind === 2 /* OpenTagEnd */  || kind === 3 /* CloseTag */ ) {
        sectionStart = end + 1;
        state = 0 /* Literal */ ;
        if (kind === 2 /* OpenTagEnd */ ) {
            activatePendingTextMode(value);
        }
    } else {
        sectionStart = end;
        state = newState;
    }
}
function parseLiteral() {
    if (textMode === 4 /* PlainText */ ) {
        return;
    }
    if (char === 60 /* Lt */ ) {
        emitToken(0 /* Literal */ , 1 /* BeforeOpenTag */ );
    }
}
function parseBeforeOpenTag() {
    if (textMode !== 0 /* Data */ ) {
        if (char === 47 /* Sl */ ) {
            state = 14 /* ClosingTag */ ;
            sectionStart = index + 1;
        } else {
            state = 0 /* Literal */ ;
        }
        return;
    }
    if (char >= 97 /* La */  && char <= 122 /* Lz */  || char >= 65 /* Ua */  && char <= 90 /* Uz */ ) {
        state = 2 /* OpeningTag */ ;
        sectionStart = index;
    } else if (char === 47 /* Sl */ ) {
        state = 14 /* ClosingTag */ ;
        sectionStart = index + 1;
    } else if (char === 60 /* Lt */ ) {
        emitToken(0 /* Literal */ );
    } else if (char === 33 /* Ep */ ) {
        state = 8 /* OpeningSpecial */ ;
        sectionStart = index;
    } else if (char === 63 /* Qm */ ) {
        sectionStart = index;
        emitToken(1 /* OpenTag */ , 12 /* InShortComment */ );
    } else {
        state = 0 /* Literal */ ;
    }
}
function parseOpeningTag() {
    if (isWhiteSpace()) {
        emitToken(1 /* OpenTag */ , 3 /* AfterOpenTag */ );
    } else if (char === 62 /* Gt */ ) {
        emitToken(1 /* OpenTag */ );
        emitToken(2 /* OpenTagEnd */ );
    } else if (char === 47 /* Sl */ ) {
        emitToken(1 /* OpenTag */ , 7 /* ClosingOpenTag */ );
    }
}
function parseAfterOpenTag() {
    if (char === 62 /* Gt */ ) {
        emitToken(4 /* Whitespace */ );
        emitToken(2 /* OpenTagEnd */ );
    } else if (char === 47 /* Sl */ ) {
        emitToken(4 /* Whitespace */ , 7 /* ClosingOpenTag */ );
    } else if (char === 61 /* Eq */ ) {
        emitToken(4 /* Whitespace */ );
        emitToken(5 /* AttrValueEq */ , void 0, index + 1);
    } else if (char === 39 /* Sq */ ) {
        emitToken(4 /* Whitespace */ , 5 /* InValueSq */ );
    } else if (char === 34 /* Dq */ ) {
        emitToken(4 /* Whitespace */ , 6 /* InValueDq */ );
    } else if (!isWhiteSpace()) {
        emitToken(4 /* Whitespace */ , 4 /* InValueNq */ );
    }
}
function parseInValueNq() {
    if (char === 62 /* Gt */ ) {
        emitToken(6 /* AttrValueNq */ );
        emitToken(2 /* OpenTagEnd */ );
    } else if (char === 47 /* Sl */ ) {
        emitToken(6 /* AttrValueNq */ , 7 /* ClosingOpenTag */ );
    } else if (char === 61 /* Eq */ ) {
        emitToken(6 /* AttrValueNq */ );
        emitToken(5 /* AttrValueEq */ , 3 /* AfterOpenTag */ , index + 1);
    } else if (isWhiteSpace()) {
        emitToken(6 /* AttrValueNq */ , 3 /* AfterOpenTag */ );
    }
}
function parseInValueSq() {
    if (char === 39 /* Sq */ ) {
        emitToken(7 /* AttrValueSq */ , 3 /* AfterOpenTag */ , index + 1);
    }
}
function parseInValueDq() {
    if (char === 34 /* Dq */ ) {
        emitToken(8 /* AttrValueDq */ , 3 /* AfterOpenTag */ , index + 1);
    }
}
function parseClosingOpenTag() {
    if (char === 62 /* Gt */ ) {
        emitToken(2 /* OpenTagEnd */ );
    } else {
        emitToken(6 /* AttrValueNq */ , 3 /* AfterOpenTag */ );
        parseAfterOpenTag();
    }
}
function parseOpeningSpecial() {
    switch(char){
        case 45 /* Cl */ :
            state = 10 /* OpeningNormalComment */ ;
            break;
        case 100 /* Ld */ :
        // <!d
        case 68 /* Ud */ :
            state = 9 /* OpeningDoctype */ ;
            break;
        default:
            emitToken(1 /* OpenTag */ , 12 /* InShortComment */ );
            break;
    }
}
function parseOpeningDoctype() {
    offset = index - sectionStart;
    if (offset === doctype.length) {
        if (isWhiteSpace()) {
            emitToken(1 /* OpenTag */ , 3 /* AfterOpenTag */ );
        } else {
            unexpected();
        }
    } else if (char === 62 /* Gt */ ) {
        emitToken(1 /* OpenTag */ , void 0, sectionStart + 1);
        emitToken(0 /* Literal */ );
        emitToken(2 /* OpenTagEnd */ );
    } else if (doctype.lower[offset] !== char && doctype.upper[offset] !== char) {
        emitToken(1 /* OpenTag */ , 12 /* InShortComment */ , sectionStart + 1);
    }
}
function parseOpeningNormalComment() {
    if (char === 45 /* Cl */ ) {
        emitToken(1 /* OpenTag */ , 11 /* InNormalComment */ , index + 1);
    } else {
        emitToken(1 /* OpenTag */ , 12 /* InShortComment */ , sectionStart + 1);
    }
}
function parseNormalComment() {
    if (char === 45 /* Cl */ ) {
        emitToken(0 /* Literal */ , 13 /* ClosingNormalComment */ );
    }
}
function parseShortComment() {
    if (char === 62 /* Gt */ ) {
        emitToken(0 /* Literal */ );
        emitToken(2 /* OpenTagEnd */ );
    }
}
function parseClosingNormalComment() {
    offset = index - sectionStart;
    if (offset === 2) {
        if (char === 62 /* Gt */ ) {
            emitToken(2 /* OpenTagEnd */ );
        } else if (char === 45 /* Cl */ ) {
            emitToken(0 /* Literal */ , void 0, sectionStart + 1);
        } else {
            state = 11 /* InNormalComment */ ;
        }
    } else if (char !== 45 /* Cl */ ) {
        state = 11 /* InNormalComment */ ;
    }
}
function parseClosingTag() {
    offset = index - sectionStart;
    if (textMode !== 0 /* Data */ ) {
        const endTag = textEndTag;
        if (!endTag) {
            unexpected();
        }
        if (char === 60 /* Lt */ ) {
            resetTextClosingTag();
            emitToken(0 /* Literal */ , 1 /* BeforeOpenTag */ );
        } else if (offset < endTag.length) {
            if (endTag.lower[offset] !== char && endTag.upper[offset] !== char) {
                resetTextClosingTag();
            }
        } else if (char === 62 /* Gt */ ) {
            emitToken(3 /* CloseTag */ );
        } else if (!isWhiteSpace()) {
            resetTextClosingTag();
        }
    } else if (char === 62 /* Gt */ ) {
        emitToken(3 /* CloseTag */ );
    }
}
function unexpected() {
    throw new SyntaxError(`Unexpected token "${buffer.charAt(index)}" at ${index} when parse ${state}`);
}
// src/utils.ts
function getLineRanges(input) {
    return input.split("\n").reduce((arr, line)=>{
        arr.push(line.length + 1 + arr[arr.length - 1]);
        return arr;
    }, [
        0
    ]);
}
function getPosition(ranges, offset2) {
    let line = NaN;
    let column = NaN;
    for(let i = 1; i < ranges.length; i++){
        if (ranges[i] > offset2) {
            line = i;
            column = offset2 - ranges[i - 1] + 1;
            break;
        }
    }
    return [
        line,
        column
    ];
}
// src/walk.ts
function visit(node2, parent, index3, options) {
    options.enter && options.enter(node2, parent, index3);
    if (node2.type === "Tag" /* Tag */  && Array.isArray(node2.body)) {
        for(let i = 0; i < node2.body.length; i++){
            visit(node2.body[i], node2, i, options);
        }
    }
    options.leave && options.leave(node2, parent, index3);
}
function walk(ast, options) {
    for(let i = 0; i < ast.length; i++){
        visit(ast[i], void 0, i, options);
    }
}
// src/parse.ts
var index2;
var count;
var tokens2;
var tagChain;
var nodes;
var token;
var node;
var buffer2;
var lines;
var parseOptions;
function init2(input, options) {
    if (input === void 0) {
        count = 0;
        tokens2.length = 0;
        buffer2 = "";
    } else {
        tokens2 = tokenize(input, {
            scriptingEnabled: options?.scriptingEnabled
        });
        count = tokens2.length;
        buffer2 = input;
    }
    index2 = 0;
    tagChain = void 0;
    nodes = [];
    token = void 0;
    node = void 0;
    lines = void 0;
    parseOptions = options;
}
function pushNode(_node) {
    if (!tagChain) {
        nodes.push(_node);
    } else if (_node.type === "Tag" /* Tag */  && _node.name === tagChain.tag.name && noNestedTags.has(_node.name)) {
        tagChain = tagChain.parent;
        pushNode(_node);
    } else if (tagChain.tag.body) {
        tagChain.tag.end = _node.end;
        tagChain.tag.body.push(_node);
    }
}
function pushTagChain(tag) {
    tagChain = {
        parent: tagChain,
        tag
    };
    node = void 0;
}
function createLiteral(start = token.start, end = token.end, value = token.value) {
    return {
        start,
        end,
        value,
        type: "Text" /* Text */ 
    };
}
function createTag() {
    return {
        start: token.start - 1,
        // include <
        end: token.end,
        type: "Tag" /* Tag */ ,
        open: createLiteral(token.start - 1),
        // not finished
        name: token.value,
        rawName: buffer2.substring(token.start, token.end),
        attributes: [],
        attributeMap: void 0,
        body: null,
        close: null
    };
}
function createAttribute() {
    return {
        start: token.start,
        end: token.end,
        name: createLiteral(),
        value: void 0
    };
}
function createAttributeValue() {
    return {
        start: token.start,
        end: token.end,
        value: token.type === 6 /* AttrValueNq */  ? token.value : token.value.substr(1, token.value.length - 2),
        quote: token.type === 6 /* AttrValueNq */  ? void 0 : token.type === 7 /* AttrValueSq */  ? "'" : '"'
    };
}
function appendLiteral(_node = node) {
    _node.value += token.value;
    _node.end = token.end;
}
function unexpected2() {
    if (lines === void 0) {
        lines = getLineRanges(buffer2);
    }
    const [line, column] = getPosition(lines, token.start);
    throw new Error(`Unexpected token "${token.value}(${token.type})" at [${line},${column}]` + (tagChain ? ` when parsing tag: ${JSON.stringify(tagChain.tag.name)}.` : ""));
}
function buildAttributeMap(tag) {
    tag.attributeMap = {};
    for (const attr of tag.attributes){
        tag.attributeMap[attr.name.value] = attr;
    }
}
function parseOpenTag() {
    let state2 = 0 /* BeforeAttr */ ;
    let attr = void 0;
    const tag = createTag();
    pushNode(tag);
    if (tag.name === "" || tag.name === "!" || tag.name === "!--") {
        tag.open.value = "<" + tag.open.value;
        if (index2 === count) {
            return;
        } else {
            token = tokens2[++index2];
            if (token.type !== 2 /* OpenTagEnd */ ) {
                node = createLiteral();
                tag.body = [
                    node
                ];
                while(++index2 < count){
                    token = tokens2[index2];
                    if (token.type === 2 /* OpenTagEnd */ ) {
                        node = void 0;
                        break;
                    }
                    appendLiteral();
                }
            }
            tag.close = createLiteral(token.start, token.end + 1, `${token.value}>`);
            tag.end = tag.close.end;
        }
        return;
    }
    while(++index2 < count){
        token = tokens2[index2];
        if (token.type === 2 /* OpenTagEnd */ ) {
            tag.end = tag.open.end = token.end + 1;
            tag.open.value = buffer2.substring(tag.open.start, tag.open.end);
            if (token.value === "" && !selfCloseTags.has(tag.name)) {
                tag.body = [];
                pushTagChain(tag);
            } else {
                tag.body = void 0;
            }
            break;
        } else if (state2 === 0 /* BeforeAttr */ ) {
            if (token.type !== 4 /* Whitespace */ ) {
                attr = createAttribute();
                state2 = 1 /* InName */ ;
                tag.attributes.push(attr);
            }
        } else if (state2 === 1 /* InName */ ) {
            if (token.type === 4 /* Whitespace */ ) {
                state2 = 2 /* AfterName */ ;
            } else if (token.type === 5 /* AttrValueEq */ ) {
                state2 = 3 /* AfterEqual */ ;
            } else {
                appendLiteral(attr.name);
            }
        } else if (state2 === 2 /* AfterName */ ) {
            if (token.type !== 4 /* Whitespace */ ) {
                if (token.type === 5 /* AttrValueEq */ ) {
                    state2 = 3 /* AfterEqual */ ;
                } else {
                    attr = createAttribute();
                    state2 = 1 /* InName */ ;
                    tag.attributes.push(attr);
                }
            }
        } else if (state2 === 3 /* AfterEqual */ ) {
            if (token.type !== 4 /* Whitespace */ ) {
                attr.value = createAttributeValue();
                if (token.type === 6 /* AttrValueNq */ ) {
                    state2 = 4 /* InValue */ ;
                } else {
                    attr.end = attr.value.end;
                    state2 = 0 /* BeforeAttr */ ;
                }
            }
        } else {
            if (token.type === 4 /* Whitespace */ ) {
                attr.end = attr.value.end;
                state2 = 0 /* BeforeAttr */ ;
            } else {
                appendLiteral(attr.value);
            }
        }
    }
}
function parseCloseTag() {
    let _context = tagChain;
    while(true){
        if (!_context || token.value.trim() === _context.tag.name) {
            break;
        }
        _context = _context.parent;
    }
    if (!_context) {
        return;
    }
    _context.tag.close = createLiteral(token.start - 2, token.end + 1, buffer2.substring(token.start - 2, token.end + 1));
    _context.tag.end = _context.tag.close.end;
    _context = _context.parent;
    tagChain = _context;
}
function parse(input, options) {
    init2(input, {
        setAttributeMap: false,
        scriptingEnabled: true,
        ...options
    });
    while(index2 < count){
        token = tokens2[index2];
        switch(token.type){
            case 0 /* Literal */ :
                if (!node) {
                    node = createLiteral();
                    pushNode(node);
                } else {
                    appendLiteral(node);
                }
                break;
            case 1 /* OpenTag */ :
                node = void 0;
                parseOpenTag();
                break;
            case 3 /* CloseTag */ :
                node = void 0;
                parseCloseTag();
                break;
            default:
                unexpected2();
                break;
        }
        index2++;
    }
    const _nodes = nodes;
    if (parseOptions?.setAttributeMap) {
        walk(_nodes, {
            enter (node2) {
                if (node2.type === "Tag" /* Tag */ ) {
                    buildAttributeMap(node2);
                }
            }
        });
    }
    init2();
    return _nodes;
}
// src/stringify.ts
function setAttribute(tag, name, value) {
    const attr = findAttribute(tag, name);
    if (attr) {
        attr.name.value = name;
        attr.value = value === void 0 ? void 0 : {
            start: attr.value?.start ?? attr.end,
            end: attr.value?.end ?? attr.end,
            value,
            quote: attr.value?.quote ?? '"'
        };
        attr.end = attr.value?.end ?? attr.name.end;
    } else {
        tag.attributes.push(createAttribute2(name, value));
    }
    if (tag.attributeMap) {
        tag.attributeMap[name] = findAttribute(tag, name);
    }
}
function removeAttribute(tag, name) {
    for(let index3 = tag.attributes.length - 1; index3 >= 0; index3--){
        if (tag.attributes[index3].name.value === name) {
            tag.attributes.splice(index3, 1);
        }
    }
    if (tag.attributeMap) {
        delete tag.attributeMap[name];
    }
}
function stringify(ast) {
    if (Array.isArray(ast)) {
        return ast.map(stringifyNode).join("");
    }
    return stringifyNode(ast);
}
function stringifyNode(node2) {
    if (node2.type === "Text" /* Text */ ) {
        return node2.value;
    }
    return stringifyTag(node2);
}
function stringifyTag(tag) {
    if (tag.body === null) {
        return stringifyOpenTag(tag, false);
    }
    if (tag.name === "!--" || tag.name === "!" || tag.name === "") {
        return stringifySpecialTag(tag);
    }
    const open = stringifyOpenTag(tag);
    if (tag.body === void 0) {
        return open;
    }
    const close = tag.close === null ? "" : `</${tag.rawName}>`;
    return open + stringify(tag.body) + close;
}
function stringifySpecialTag(tag) {
    const body = tag.body ? stringify(tag.body) : "";
    if (tag.name === "!--") {
        return `<!--${body}${tag.close === null ? "" : "-->"}`;
    }
    if (tag.name === "!") {
        return `<!${body}${tag.close === null ? "" : ">"}`;
    }
    return `<${body}${tag.close === null ? "" : ">"}`;
}
function stringifyOpenTag(tag, close = true) {
    const attrs = tag.attributes.map(stringifyAttribute).join(" ");
    return `<${tag.rawName}${attrs ? ` ${attrs}` : ""}${close ? ">" : ""}`;
}
function stringifyAttribute(attr) {
    if (!attr.value) {
        return attr.name.value;
    }
    if (attr.value.quote === void 0) {
        return `${attr.name.value}=${attr.value.value}`;
    }
    return `${attr.name.value}=${attr.value.quote}${attr.value.value}${attr.value.quote}`;
}
function findAttribute(tag, name) {
    return tag.attributes.find((attr)=>attr.name.value === name);
}
function createAttribute2(name, value) {
    return {
        start: 0,
        end: 0,
        name: {
            start: 0,
            end: 0,
            type: "Text" /* Text */ ,
            value: name
        },
        value: value === void 0 ? void 0 : {
            start: 0,
            end: 0,
            value,
            quote: '"'
        }
    };
}
;
}),
"[project]/node_modules/htmlparser2/lib/esm/Parser.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Parser",
    ()=>Parser
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/lib/esm/Tokenizer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/decode.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode_codepoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/decode_codepoint.js [app-route] (ecmascript)");
;
;
const formTags = new Set([
    "input",
    "option",
    "optgroup",
    "select",
    "button",
    "datalist",
    "textarea"
]);
const pTag = new Set([
    "p"
]);
const tableSectionTags = new Set([
    "thead",
    "tbody"
]);
const ddtTags = new Set([
    "dd",
    "dt"
]);
const rtpTags = new Set([
    "rt",
    "rp"
]);
const openImpliesClose = new Map([
    [
        "tr",
        new Set([
            "tr",
            "th",
            "td"
        ])
    ],
    [
        "th",
        new Set([
            "th"
        ])
    ],
    [
        "td",
        new Set([
            "thead",
            "th",
            "td"
        ])
    ],
    [
        "body",
        new Set([
            "head",
            "link",
            "script"
        ])
    ],
    [
        "li",
        new Set([
            "li"
        ])
    ],
    [
        "p",
        pTag
    ],
    [
        "h1",
        pTag
    ],
    [
        "h2",
        pTag
    ],
    [
        "h3",
        pTag
    ],
    [
        "h4",
        pTag
    ],
    [
        "h5",
        pTag
    ],
    [
        "h6",
        pTag
    ],
    [
        "select",
        formTags
    ],
    [
        "input",
        formTags
    ],
    [
        "output",
        formTags
    ],
    [
        "button",
        formTags
    ],
    [
        "datalist",
        formTags
    ],
    [
        "textarea",
        formTags
    ],
    [
        "option",
        new Set([
            "option"
        ])
    ],
    [
        "optgroup",
        new Set([
            "optgroup",
            "option"
        ])
    ],
    [
        "dd",
        ddtTags
    ],
    [
        "dt",
        ddtTags
    ],
    [
        "address",
        pTag
    ],
    [
        "article",
        pTag
    ],
    [
        "aside",
        pTag
    ],
    [
        "blockquote",
        pTag
    ],
    [
        "details",
        pTag
    ],
    [
        "div",
        pTag
    ],
    [
        "dl",
        pTag
    ],
    [
        "fieldset",
        pTag
    ],
    [
        "figcaption",
        pTag
    ],
    [
        "figure",
        pTag
    ],
    [
        "footer",
        pTag
    ],
    [
        "form",
        pTag
    ],
    [
        "header",
        pTag
    ],
    [
        "hr",
        pTag
    ],
    [
        "main",
        pTag
    ],
    [
        "nav",
        pTag
    ],
    [
        "ol",
        pTag
    ],
    [
        "pre",
        pTag
    ],
    [
        "section",
        pTag
    ],
    [
        "table",
        pTag
    ],
    [
        "ul",
        pTag
    ],
    [
        "rt",
        rtpTags
    ],
    [
        "rp",
        rtpTags
    ],
    [
        "tbody",
        tableSectionTags
    ],
    [
        "tfoot",
        tableSectionTags
    ]
]);
const voidElements = new Set([
    "area",
    "base",
    "basefont",
    "br",
    "col",
    "command",
    "embed",
    "frame",
    "hr",
    "img",
    "input",
    "isindex",
    "keygen",
    "link",
    "meta",
    "param",
    "source",
    "track",
    "wbr"
]);
const foreignContextElements = new Set([
    "math",
    "svg"
]);
const htmlIntegrationElements = new Set([
    "mi",
    "mo",
    "mn",
    "ms",
    "mtext",
    "annotation-xml",
    "foreignobject",
    "desc",
    "title"
]);
const reNameEnd = /\s|\//;
class Parser {
    constructor(cbs, options = {}){
        var _a, _b, _c, _d, _e;
        this.options = options;
        /** The start index of the last event. */ this.startIndex = 0;
        /** The end index of the last event. */ this.endIndex = 0;
        /**
         * Store the start index of the current open tag,
         * so we can update the start index for attributes.
         */ this.openTagStart = 0;
        this.tagname = "";
        this.attribname = "";
        this.attribvalue = "";
        this.attribs = null;
        this.stack = [];
        this.foreignContext = [];
        this.buffers = [];
        this.bufferOffset = 0;
        /** The index of the last written buffer. Used when resuming after a `pause()`. */ this.writeIndex = 0;
        /** Indicates whether the parser has finished running / `.end` has been called. */ this.ended = false;
        this.cbs = cbs !== null && cbs !== void 0 ? cbs : {};
        this.lowerCaseTagNames = (_a = options.lowerCaseTags) !== null && _a !== void 0 ? _a : !options.xmlMode;
        this.lowerCaseAttributeNames = (_b = options.lowerCaseAttributeNames) !== null && _b !== void 0 ? _b : !options.xmlMode;
        this.tokenizer = new ((_c = options.Tokenizer) !== null && _c !== void 0 ? _c : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["default"])(this.options, this);
        (_e = (_d = this.cbs).onparserinit) === null || _e === void 0 ? void 0 : _e.call(_d, this);
    }
    // Tokenizer event handlers
    /** @internal */ ontext(start, endIndex) {
        var _a, _b;
        const data = this.getSlice(start, endIndex);
        this.endIndex = endIndex - 1;
        (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, data);
        this.startIndex = endIndex;
    }
    /** @internal */ ontextentity(cp) {
        var _a, _b;
        /*
         * Entities can be emitted on the character, or directly after.
         * We use the section start here to get accurate indices.
         */ const index = this.tokenizer.getSectionStart();
        this.endIndex = index - 1;
        (_b = (_a = this.cbs).ontext) === null || _b === void 0 ? void 0 : _b.call(_a, (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode_codepoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromCodePoint"])(cp));
        this.startIndex = index;
    }
    isVoidElement(name) {
        return !this.options.xmlMode && voidElements.has(name);
    }
    /** @internal */ onopentagname(start, endIndex) {
        this.endIndex = endIndex;
        let name = this.getSlice(start, endIndex);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        this.emitOpenTag(name);
    }
    emitOpenTag(name) {
        var _a, _b, _c, _d;
        this.openTagStart = this.startIndex;
        this.tagname = name;
        const impliesClose = !this.options.xmlMode && openImpliesClose.get(name);
        if (impliesClose) {
            while(this.stack.length > 0 && impliesClose.has(this.stack[this.stack.length - 1])){
                const element = this.stack.pop();
                (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, element, true);
            }
        }
        if (!this.isVoidElement(name)) {
            this.stack.push(name);
            if (foreignContextElements.has(name)) {
                this.foreignContext.push(true);
            } else if (htmlIntegrationElements.has(name)) {
                this.foreignContext.push(false);
            }
        }
        (_d = (_c = this.cbs).onopentagname) === null || _d === void 0 ? void 0 : _d.call(_c, name);
        if (this.cbs.onopentag) this.attribs = {};
    }
    endOpenTag(isImplied) {
        var _a, _b;
        this.startIndex = this.openTagStart;
        if (this.attribs) {
            (_b = (_a = this.cbs).onopentag) === null || _b === void 0 ? void 0 : _b.call(_a, this.tagname, this.attribs, isImplied);
            this.attribs = null;
        }
        if (this.cbs.onclosetag && this.isVoidElement(this.tagname)) {
            this.cbs.onclosetag(this.tagname, true);
        }
        this.tagname = "";
    }
    /** @internal */ onopentagend(endIndex) {
        this.endIndex = endIndex;
        this.endOpenTag(false);
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onclosetag(start, endIndex) {
        var _a, _b, _c, _d, _e, _f;
        this.endIndex = endIndex;
        let name = this.getSlice(start, endIndex);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        if (foreignContextElements.has(name) || htmlIntegrationElements.has(name)) {
            this.foreignContext.pop();
        }
        if (!this.isVoidElement(name)) {
            const pos = this.stack.lastIndexOf(name);
            if (pos !== -1) {
                if (this.cbs.onclosetag) {
                    let count = this.stack.length - pos;
                    while(count--){
                        // We know the stack has sufficient elements.
                        this.cbs.onclosetag(this.stack.pop(), count !== 0);
                    }
                } else this.stack.length = pos;
            } else if (!this.options.xmlMode && name === "p") {
                // Implicit open before close
                this.emitOpenTag("p");
                this.closeCurrentTag(true);
            }
        } else if (!this.options.xmlMode && name === "br") {
            // We can't use `emitOpenTag` for implicit open, as `br` would be implicitly closed.
            (_b = (_a = this.cbs).onopentagname) === null || _b === void 0 ? void 0 : _b.call(_a, "br");
            (_d = (_c = this.cbs).onopentag) === null || _d === void 0 ? void 0 : _d.call(_c, "br", {}, true);
            (_f = (_e = this.cbs).onclosetag) === null || _f === void 0 ? void 0 : _f.call(_e, "br", false);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onselfclosingtag(endIndex) {
        this.endIndex = endIndex;
        if (this.options.xmlMode || this.options.recognizeSelfClosing || this.foreignContext[this.foreignContext.length - 1]) {
            this.closeCurrentTag(false);
            // Set `startIndex` for next node
            this.startIndex = endIndex + 1;
        } else {
            // Ignore the fact that the tag is self-closing.
            this.onopentagend(endIndex);
        }
    }
    closeCurrentTag(isOpenImplied) {
        var _a, _b;
        const name = this.tagname;
        this.endOpenTag(isOpenImplied);
        // Self-closing tags will be on the top of the stack
        if (this.stack[this.stack.length - 1] === name) {
            // If the opening tag isn't implied, the closing tag has to be implied.
            (_b = (_a = this.cbs).onclosetag) === null || _b === void 0 ? void 0 : _b.call(_a, name, !isOpenImplied);
            this.stack.pop();
        }
    }
    /** @internal */ onattribname(start, endIndex) {
        this.startIndex = start;
        const name = this.getSlice(start, endIndex);
        this.attribname = this.lowerCaseAttributeNames ? name.toLowerCase() : name;
    }
    /** @internal */ onattribdata(start, endIndex) {
        this.attribvalue += this.getSlice(start, endIndex);
    }
    /** @internal */ onattribentity(cp) {
        this.attribvalue += (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode_codepoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromCodePoint"])(cp);
    }
    /** @internal */ onattribend(quote, endIndex) {
        var _a, _b;
        this.endIndex = endIndex;
        (_b = (_a = this.cbs).onattribute) === null || _b === void 0 ? void 0 : _b.call(_a, this.attribname, this.attribvalue, quote === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["QuoteType"].Double ? '"' : quote === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["QuoteType"].Single ? "'" : quote === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["QuoteType"].NoValue ? undefined : null);
        if (this.attribs && !Object.prototype.hasOwnProperty.call(this.attribs, this.attribname)) {
            this.attribs[this.attribname] = this.attribvalue;
        }
        this.attribvalue = "";
    }
    getInstructionName(value) {
        const index = value.search(reNameEnd);
        let name = index < 0 ? value : value.substr(0, index);
        if (this.lowerCaseTagNames) {
            name = name.toLowerCase();
        }
        return name;
    }
    /** @internal */ ondeclaration(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
            const name = this.getInstructionName(value);
            this.cbs.onprocessinginstruction(`!${name}`, `!${value}`);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onprocessinginstruction(start, endIndex) {
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex);
        if (this.cbs.onprocessinginstruction) {
            const name = this.getInstructionName(value);
            this.cbs.onprocessinginstruction(`?${name}`, `?${value}`);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ oncomment(start, endIndex, offset) {
        var _a, _b, _c, _d;
        this.endIndex = endIndex;
        (_b = (_a = this.cbs).oncomment) === null || _b === void 0 ? void 0 : _b.call(_a, this.getSlice(start, endIndex - offset));
        (_d = (_c = this.cbs).oncommentend) === null || _d === void 0 ? void 0 : _d.call(_c);
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ oncdata(start, endIndex, offset) {
        var _a, _b, _c, _d, _e, _f, _g, _h, _j, _k;
        this.endIndex = endIndex;
        const value = this.getSlice(start, endIndex - offset);
        if (this.options.xmlMode || this.options.recognizeCDATA) {
            (_b = (_a = this.cbs).oncdatastart) === null || _b === void 0 ? void 0 : _b.call(_a);
            (_d = (_c = this.cbs).ontext) === null || _d === void 0 ? void 0 : _d.call(_c, value);
            (_f = (_e = this.cbs).oncdataend) === null || _f === void 0 ? void 0 : _f.call(_e);
        } else {
            (_h = (_g = this.cbs).oncomment) === null || _h === void 0 ? void 0 : _h.call(_g, `[CDATA[${value}]]`);
            (_k = (_j = this.cbs).oncommentend) === null || _k === void 0 ? void 0 : _k.call(_j);
        }
        // Set `startIndex` for next node
        this.startIndex = endIndex + 1;
    }
    /** @internal */ onend() {
        var _a, _b;
        if (this.cbs.onclosetag) {
            // Set the end index for all remaining tags
            this.endIndex = this.startIndex;
            for(let index = this.stack.length; index > 0; this.cbs.onclosetag(this.stack[--index], true));
        }
        (_b = (_a = this.cbs).onend) === null || _b === void 0 ? void 0 : _b.call(_a);
    }
    /**
     * Resets the parser to a blank state, ready to parse a new HTML document
     */ reset() {
        var _a, _b, _c, _d;
        (_b = (_a = this.cbs).onreset) === null || _b === void 0 ? void 0 : _b.call(_a);
        this.tokenizer.reset();
        this.tagname = "";
        this.attribname = "";
        this.attribs = null;
        this.stack.length = 0;
        this.startIndex = 0;
        this.endIndex = 0;
        (_d = (_c = this.cbs).onparserinit) === null || _d === void 0 ? void 0 : _d.call(_c, this);
        this.buffers.length = 0;
        this.bufferOffset = 0;
        this.writeIndex = 0;
        this.ended = false;
    }
    /**
     * Resets the parser, then parses a complete document and
     * pushes it to the handler.
     *
     * @param data Document to parse.
     */ parseComplete(data) {
        this.reset();
        this.end(data);
    }
    getSlice(start, end) {
        while(start - this.bufferOffset >= this.buffers[0].length){
            this.shiftBuffer();
        }
        let slice = this.buffers[0].slice(start - this.bufferOffset, end - this.bufferOffset);
        while(end - this.bufferOffset > this.buffers[0].length){
            this.shiftBuffer();
            slice += this.buffers[0].slice(0, end - this.bufferOffset);
        }
        return slice;
    }
    shiftBuffer() {
        this.bufferOffset += this.buffers[0].length;
        this.writeIndex--;
        this.buffers.shift();
    }
    /**
     * Parses a chunk of data and calls the corresponding callbacks.
     *
     * @param chunk Chunk to parse.
     */ write(chunk) {
        var _a, _b;
        if (this.ended) {
            (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(".write() after done!"));
            return;
        }
        this.buffers.push(chunk);
        if (this.tokenizer.running) {
            this.tokenizer.write(chunk);
            this.writeIndex++;
        }
    }
    /**
     * Parses the end of the buffer and clears the stack, calls onend.
     *
     * @param chunk Optional final chunk to parse.
     */ end(chunk) {
        var _a, _b;
        if (this.ended) {
            (_b = (_a = this.cbs).onerror) === null || _b === void 0 ? void 0 : _b.call(_a, new Error(".end() after done!"));
            return;
        }
        if (chunk) this.write(chunk);
        this.ended = true;
        this.tokenizer.end();
    }
    /**
     * Pauses parsing. The parser won't emit events until `resume` is called.
     */ pause() {
        this.tokenizer.pause();
    }
    /**
     * Resumes parsing after `pause` was called.
     */ resume() {
        this.tokenizer.resume();
        while(this.tokenizer.running && this.writeIndex < this.buffers.length){
            this.tokenizer.write(this.buffers[this.writeIndex++]);
        }
        if (this.ended) this.tokenizer.end();
    }
    /**
     * Alias of `write`, for backwards compatibility.
     *
     * @param chunk Chunk to parse.
     * @deprecated
     */ parseChunk(chunk) {
        this.write(chunk);
    }
    /**
     * Alias of `end`, for backwards compatibility.
     *
     * @param chunk Optional final chunk to parse.
     * @deprecated
     */ done(chunk) {
        this.end(chunk);
    }
}
}),
"[project]/node_modules/htmlparser2/lib/esm/Tokenizer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "QuoteType",
    ()=>QuoteType,
    "default",
    ()=>Tokenizer
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/decode.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$generated$2f$decode$2d$data$2d$html$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__htmlDecodeTree$3e$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/generated/decode-data-html.js [app-route] (ecmascript) <export default as htmlDecodeTree>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$generated$2f$decode$2d$data$2d$xml$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__xmlDecodeTree$3e$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/generated/decode-data-xml.js [app-route] (ecmascript) <export default as xmlDecodeTree>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode_codepoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/entities/lib/esm/decode_codepoint.js [app-route] (ecmascript)");
;
var CharCodes;
(function(CharCodes) {
    CharCodes[CharCodes["Tab"] = 9] = "Tab";
    CharCodes[CharCodes["NewLine"] = 10] = "NewLine";
    CharCodes[CharCodes["FormFeed"] = 12] = "FormFeed";
    CharCodes[CharCodes["CarriageReturn"] = 13] = "CarriageReturn";
    CharCodes[CharCodes["Space"] = 32] = "Space";
    CharCodes[CharCodes["ExclamationMark"] = 33] = "ExclamationMark";
    CharCodes[CharCodes["Number"] = 35] = "Number";
    CharCodes[CharCodes["Amp"] = 38] = "Amp";
    CharCodes[CharCodes["SingleQuote"] = 39] = "SingleQuote";
    CharCodes[CharCodes["DoubleQuote"] = 34] = "DoubleQuote";
    CharCodes[CharCodes["Dash"] = 45] = "Dash";
    CharCodes[CharCodes["Slash"] = 47] = "Slash";
    CharCodes[CharCodes["Zero"] = 48] = "Zero";
    CharCodes[CharCodes["Nine"] = 57] = "Nine";
    CharCodes[CharCodes["Semi"] = 59] = "Semi";
    CharCodes[CharCodes["Lt"] = 60] = "Lt";
    CharCodes[CharCodes["Eq"] = 61] = "Eq";
    CharCodes[CharCodes["Gt"] = 62] = "Gt";
    CharCodes[CharCodes["Questionmark"] = 63] = "Questionmark";
    CharCodes[CharCodes["UpperA"] = 65] = "UpperA";
    CharCodes[CharCodes["LowerA"] = 97] = "LowerA";
    CharCodes[CharCodes["UpperF"] = 70] = "UpperF";
    CharCodes[CharCodes["LowerF"] = 102] = "LowerF";
    CharCodes[CharCodes["UpperZ"] = 90] = "UpperZ";
    CharCodes[CharCodes["LowerZ"] = 122] = "LowerZ";
    CharCodes[CharCodes["LowerX"] = 120] = "LowerX";
    CharCodes[CharCodes["OpeningSquareBracket"] = 91] = "OpeningSquareBracket";
})(CharCodes || (CharCodes = {}));
/** All the states the tokenizer can be in. */ var State;
(function(State) {
    State[State["Text"] = 1] = "Text";
    State[State["BeforeTagName"] = 2] = "BeforeTagName";
    State[State["InTagName"] = 3] = "InTagName";
    State[State["InSelfClosingTag"] = 4] = "InSelfClosingTag";
    State[State["BeforeClosingTagName"] = 5] = "BeforeClosingTagName";
    State[State["InClosingTagName"] = 6] = "InClosingTagName";
    State[State["AfterClosingTagName"] = 7] = "AfterClosingTagName";
    // Attributes
    State[State["BeforeAttributeName"] = 8] = "BeforeAttributeName";
    State[State["InAttributeName"] = 9] = "InAttributeName";
    State[State["AfterAttributeName"] = 10] = "AfterAttributeName";
    State[State["BeforeAttributeValue"] = 11] = "BeforeAttributeValue";
    State[State["InAttributeValueDq"] = 12] = "InAttributeValueDq";
    State[State["InAttributeValueSq"] = 13] = "InAttributeValueSq";
    State[State["InAttributeValueNq"] = 14] = "InAttributeValueNq";
    // Declarations
    State[State["BeforeDeclaration"] = 15] = "BeforeDeclaration";
    State[State["InDeclaration"] = 16] = "InDeclaration";
    // Processing instructions
    State[State["InProcessingInstruction"] = 17] = "InProcessingInstruction";
    // Comments & CDATA
    State[State["BeforeComment"] = 18] = "BeforeComment";
    State[State["CDATASequence"] = 19] = "CDATASequence";
    State[State["InSpecialComment"] = 20] = "InSpecialComment";
    State[State["InCommentLike"] = 21] = "InCommentLike";
    // Special tags
    State[State["BeforeSpecialS"] = 22] = "BeforeSpecialS";
    State[State["SpecialStartSequence"] = 23] = "SpecialStartSequence";
    State[State["InSpecialTag"] = 24] = "InSpecialTag";
    State[State["BeforeEntity"] = 25] = "BeforeEntity";
    State[State["BeforeNumericEntity"] = 26] = "BeforeNumericEntity";
    State[State["InNamedEntity"] = 27] = "InNamedEntity";
    State[State["InNumericEntity"] = 28] = "InNumericEntity";
    State[State["InHexEntity"] = 29] = "InHexEntity";
})(State || (State = {}));
function isWhitespace(c) {
    return c === CharCodes.Space || c === CharCodes.NewLine || c === CharCodes.Tab || c === CharCodes.FormFeed || c === CharCodes.CarriageReturn;
}
function isEndOfTagSection(c) {
    return c === CharCodes.Slash || c === CharCodes.Gt || isWhitespace(c);
}
function isNumber(c) {
    return c >= CharCodes.Zero && c <= CharCodes.Nine;
}
function isASCIIAlpha(c) {
    return c >= CharCodes.LowerA && c <= CharCodes.LowerZ || c >= CharCodes.UpperA && c <= CharCodes.UpperZ;
}
function isHexDigit(c) {
    return c >= CharCodes.UpperA && c <= CharCodes.UpperF || c >= CharCodes.LowerA && c <= CharCodes.LowerF;
}
var QuoteType;
(function(QuoteType) {
    QuoteType[QuoteType["NoValue"] = 0] = "NoValue";
    QuoteType[QuoteType["Unquoted"] = 1] = "Unquoted";
    QuoteType[QuoteType["Single"] = 2] = "Single";
    QuoteType[QuoteType["Double"] = 3] = "Double";
})(QuoteType || (QuoteType = {}));
/**
 * Sequences used to match longer strings.
 *
 * We don't have `Script`, `Style`, or `Title` here. Instead, we re-use the *End
 * sequences with an increased offset.
 */ const Sequences = {
    Cdata: new Uint8Array([
        0x43,
        0x44,
        0x41,
        0x54,
        0x41,
        0x5b
    ]),
    CdataEnd: new Uint8Array([
        0x5d,
        0x5d,
        0x3e
    ]),
    CommentEnd: new Uint8Array([
        0x2d,
        0x2d,
        0x3e
    ]),
    ScriptEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x73,
        0x63,
        0x72,
        0x69,
        0x70,
        0x74
    ]),
    StyleEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x73,
        0x74,
        0x79,
        0x6c,
        0x65
    ]),
    TitleEnd: new Uint8Array([
        0x3c,
        0x2f,
        0x74,
        0x69,
        0x74,
        0x6c,
        0x65
    ])
};
class Tokenizer {
    constructor({ xmlMode = false, decodeEntities = true }, cbs){
        this.cbs = cbs;
        /** The current state the tokenizer is in. */ this.state = State.Text;
        /** The read buffer. */ this.buffer = "";
        /** The beginning of the section that is currently being read. */ this.sectionStart = 0;
        /** The index within the buffer that we are currently looking at. */ this.index = 0;
        /** Some behavior, eg. when decoding entities, is done while we are in another state. This keeps track of the other state type. */ this.baseState = State.Text;
        /** For special parsing behavior inside of script and style tags. */ this.isSpecial = false;
        /** Indicates whether the tokenizer has been paused. */ this.running = true;
        /** The offset of the current buffer. */ this.offset = 0;
        this.currentSequence = undefined;
        this.sequenceIndex = 0;
        this.trieIndex = 0;
        this.trieCurrent = 0;
        /** For named entities, the index of the value. For numeric entities, the code point. */ this.entityResult = 0;
        this.entityExcess = 0;
        this.xmlMode = xmlMode;
        this.decodeEntities = decodeEntities;
        this.entityTrie = xmlMode ? __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$generated$2f$decode$2d$data$2d$xml$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__xmlDecodeTree$3e$__["xmlDecodeTree"] : __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$generated$2f$decode$2d$data$2d$html$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$export__default__as__htmlDecodeTree$3e$__["htmlDecodeTree"];
    }
    reset() {
        this.state = State.Text;
        this.buffer = "";
        this.sectionStart = 0;
        this.index = 0;
        this.baseState = State.Text;
        this.currentSequence = undefined;
        this.running = true;
        this.offset = 0;
    }
    write(chunk) {
        this.offset += this.buffer.length;
        this.buffer = chunk;
        this.parse();
    }
    end() {
        if (this.running) this.finish();
    }
    pause() {
        this.running = false;
    }
    resume() {
        this.running = true;
        if (this.index < this.buffer.length + this.offset) {
            this.parse();
        }
    }
    /**
     * The current index within all of the written data.
     */ getIndex() {
        return this.index;
    }
    /**
     * The start of the current section.
     */ getSectionStart() {
        return this.sectionStart;
    }
    stateText(c) {
        if (c === CharCodes.Lt || !this.decodeEntities && this.fastForwardTo(CharCodes.Lt)) {
            if (this.index > this.sectionStart) {
                this.cbs.ontext(this.sectionStart, this.index);
            }
            this.state = State.BeforeTagName;
            this.sectionStart = this.index;
        } else if (this.decodeEntities && c === CharCodes.Amp) {
            this.state = State.BeforeEntity;
        }
    }
    stateSpecialStartSequence(c) {
        const isEnd = this.sequenceIndex === this.currentSequence.length;
        const isMatch = isEnd ? isEndOfTagSection(c) : (c | 0x20) === this.currentSequence[this.sequenceIndex];
        if (!isMatch) {
            this.isSpecial = false;
        } else if (!isEnd) {
            this.sequenceIndex++;
            return;
        }
        this.sequenceIndex = 0;
        this.state = State.InTagName;
        this.stateInTagName(c);
    }
    /** Look for an end tag. For <title> tags, also decode entities. */ stateInSpecialTag(c) {
        if (this.sequenceIndex === this.currentSequence.length) {
            if (c === CharCodes.Gt || isWhitespace(c)) {
                const endOfText = this.index - this.currentSequence.length;
                if (this.sectionStart < endOfText) {
                    // Spoof the index so that reported locations match up.
                    const actualIndex = this.index;
                    this.index = endOfText;
                    this.cbs.ontext(this.sectionStart, endOfText);
                    this.index = actualIndex;
                }
                this.isSpecial = false;
                this.sectionStart = endOfText + 2; // Skip over the `</`
                this.stateInClosingTagName(c);
                return; // We are done; skip the rest of the function.
            }
            this.sequenceIndex = 0;
        }
        if ((c | 0x20) === this.currentSequence[this.sequenceIndex]) {
            this.sequenceIndex += 1;
        } else if (this.sequenceIndex === 0) {
            if (this.currentSequence === Sequences.TitleEnd) {
                // We have to parse entities in <title> tags.
                if (this.decodeEntities && c === CharCodes.Amp) {
                    this.state = State.BeforeEntity;
                }
            } else if (this.fastForwardTo(CharCodes.Lt)) {
                // Outside of <title> tags, we can fast-forward.
                this.sequenceIndex = 1;
            }
        } else {
            // If we see a `<`, set the sequence index to 1; useful for eg. `<</script>`.
            this.sequenceIndex = Number(c === CharCodes.Lt);
        }
    }
    stateCDATASequence(c) {
        if (c === Sequences.Cdata[this.sequenceIndex]) {
            if (++this.sequenceIndex === Sequences.Cdata.length) {
                this.state = State.InCommentLike;
                this.currentSequence = Sequences.CdataEnd;
                this.sequenceIndex = 0;
                this.sectionStart = this.index + 1;
            }
        } else {
            this.sequenceIndex = 0;
            this.state = State.InDeclaration;
            this.stateInDeclaration(c); // Reconsume the character
        }
    }
    /**
     * When we wait for one specific character, we can speed things up
     * by skipping through the buffer until we find it.
     *
     * @returns Whether the character was found.
     */ fastForwardTo(c) {
        while(++this.index < this.buffer.length + this.offset){
            if (this.buffer.charCodeAt(this.index - this.offset) === c) {
                return true;
            }
        }
        /*
         * We increment the index at the end of the `parse` loop,
         * so set it to `buffer.length - 1` here.
         *
         * TODO: Refactor `parse` to increment index before calling states.
         */ this.index = this.buffer.length + this.offset - 1;
        return false;
    }
    /**
     * Comments and CDATA end with `-->` and `]]>`.
     *
     * Their common qualities are:
     * - Their end sequences have a distinct character they start with.
     * - That character is then repeated, so we have to check multiple repeats.
     * - All characters but the start character of the sequence can be skipped.
     */ stateInCommentLike(c) {
        if (c === this.currentSequence[this.sequenceIndex]) {
            if (++this.sequenceIndex === this.currentSequence.length) {
                if (this.currentSequence === Sequences.CdataEnd) {
                    this.cbs.oncdata(this.sectionStart, this.index, 2);
                } else {
                    this.cbs.oncomment(this.sectionStart, this.index, 2);
                }
                this.sequenceIndex = 0;
                this.sectionStart = this.index + 1;
                this.state = State.Text;
            }
        } else if (this.sequenceIndex === 0) {
            // Fast-forward to the first character of the sequence
            if (this.fastForwardTo(this.currentSequence[0])) {
                this.sequenceIndex = 1;
            }
        } else if (c !== this.currentSequence[this.sequenceIndex - 1]) {
            // Allow long sequences, eg. --->, ]]]>
            this.sequenceIndex = 0;
        }
    }
    /**
     * HTML only allows ASCII alpha characters (a-z and A-Z) at the beginning of a tag name.
     *
     * XML allows a lot more characters here (@see https://www.w3.org/TR/REC-xml/#NT-NameStartChar).
     * We allow anything that wouldn't end the tag.
     */ isTagStartChar(c) {
        return this.xmlMode ? !isEndOfTagSection(c) : isASCIIAlpha(c);
    }
    startSpecial(sequence, offset) {
        this.isSpecial = true;
        this.currentSequence = sequence;
        this.sequenceIndex = offset;
        this.state = State.SpecialStartSequence;
    }
    stateBeforeTagName(c) {
        if (c === CharCodes.ExclamationMark) {
            this.state = State.BeforeDeclaration;
            this.sectionStart = this.index + 1;
        } else if (c === CharCodes.Questionmark) {
            this.state = State.InProcessingInstruction;
            this.sectionStart = this.index + 1;
        } else if (this.isTagStartChar(c)) {
            const lower = c | 0x20;
            this.sectionStart = this.index;
            if (!this.xmlMode && lower === Sequences.TitleEnd[2]) {
                this.startSpecial(Sequences.TitleEnd, 3);
            } else {
                this.state = !this.xmlMode && lower === Sequences.ScriptEnd[2] ? State.BeforeSpecialS : State.InTagName;
            }
        } else if (c === CharCodes.Slash) {
            this.state = State.BeforeClosingTagName;
        } else {
            this.state = State.Text;
            this.stateText(c);
        }
    }
    stateInTagName(c) {
        if (isEndOfTagSection(c)) {
            this.cbs.onopentagname(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    stateBeforeClosingTagName(c) {
        if (isWhitespace(c)) {
        // Ignore
        } else if (c === CharCodes.Gt) {
            this.state = State.Text;
        } else {
            this.state = this.isTagStartChar(c) ? State.InClosingTagName : State.InSpecialComment;
            this.sectionStart = this.index;
        }
    }
    stateInClosingTagName(c) {
        if (c === CharCodes.Gt || isWhitespace(c)) {
            this.cbs.onclosetag(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.state = State.AfterClosingTagName;
            this.stateAfterClosingTagName(c);
        }
    }
    stateAfterClosingTagName(c) {
        // Skip everything until ">"
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.state = State.Text;
            this.baseState = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeAttributeName(c) {
        if (c === CharCodes.Gt) {
            this.cbs.onopentagend(this.index);
            if (this.isSpecial) {
                this.state = State.InSpecialTag;
                this.sequenceIndex = 0;
            } else {
                this.state = State.Text;
            }
            this.baseState = this.state;
            this.sectionStart = this.index + 1;
        } else if (c === CharCodes.Slash) {
            this.state = State.InSelfClosingTag;
        } else if (!isWhitespace(c)) {
            this.state = State.InAttributeName;
            this.sectionStart = this.index;
        }
    }
    stateInSelfClosingTag(c) {
        if (c === CharCodes.Gt) {
            this.cbs.onselfclosingtag(this.index);
            this.state = State.Text;
            this.baseState = State.Text;
            this.sectionStart = this.index + 1;
            this.isSpecial = false; // Reset special state, in case of self-closing special tags
        } else if (!isWhitespace(c)) {
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        }
    }
    stateInAttributeName(c) {
        if (c === CharCodes.Eq || isEndOfTagSection(c)) {
            this.cbs.onattribname(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.state = State.AfterAttributeName;
            this.stateAfterAttributeName(c);
        }
    }
    stateAfterAttributeName(c) {
        if (c === CharCodes.Eq) {
            this.state = State.BeforeAttributeValue;
        } else if (c === CharCodes.Slash || c === CharCodes.Gt) {
            this.cbs.onattribend(QuoteType.NoValue, this.index);
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        } else if (!isWhitespace(c)) {
            this.cbs.onattribend(QuoteType.NoValue, this.index);
            this.state = State.InAttributeName;
            this.sectionStart = this.index;
        }
    }
    stateBeforeAttributeValue(c) {
        if (c === CharCodes.DoubleQuote) {
            this.state = State.InAttributeValueDq;
            this.sectionStart = this.index + 1;
        } else if (c === CharCodes.SingleQuote) {
            this.state = State.InAttributeValueSq;
            this.sectionStart = this.index + 1;
        } else if (!isWhitespace(c)) {
            this.sectionStart = this.index;
            this.state = State.InAttributeValueNq;
            this.stateInAttributeValueNoQuotes(c); // Reconsume token
        }
    }
    handleInAttributeValue(c, quote) {
        if (c === quote || !this.decodeEntities && this.fastForwardTo(quote)) {
            this.cbs.onattribdata(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.cbs.onattribend(quote === CharCodes.DoubleQuote ? QuoteType.Double : QuoteType.Single, this.index);
            this.state = State.BeforeAttributeName;
        } else if (this.decodeEntities && c === CharCodes.Amp) {
            this.baseState = this.state;
            this.state = State.BeforeEntity;
        }
    }
    stateInAttributeValueDoubleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes.DoubleQuote);
    }
    stateInAttributeValueSingleQuotes(c) {
        this.handleInAttributeValue(c, CharCodes.SingleQuote);
    }
    stateInAttributeValueNoQuotes(c) {
        if (isWhitespace(c) || c === CharCodes.Gt) {
            this.cbs.onattribdata(this.sectionStart, this.index);
            this.sectionStart = -1;
            this.cbs.onattribend(QuoteType.Unquoted, this.index);
            this.state = State.BeforeAttributeName;
            this.stateBeforeAttributeName(c);
        } else if (this.decodeEntities && c === CharCodes.Amp) {
            this.baseState = this.state;
            this.state = State.BeforeEntity;
        }
    }
    stateBeforeDeclaration(c) {
        if (c === CharCodes.OpeningSquareBracket) {
            this.state = State.CDATASequence;
            this.sequenceIndex = 0;
        } else {
            this.state = c === CharCodes.Dash ? State.BeforeComment : State.InDeclaration;
        }
    }
    stateInDeclaration(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.ondeclaration(this.sectionStart, this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateInProcessingInstruction(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.onprocessinginstruction(this.sectionStart, this.index);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeComment(c) {
        if (c === CharCodes.Dash) {
            this.state = State.InCommentLike;
            this.currentSequence = Sequences.CommentEnd;
            // Allow short comments (eg. <!-->)
            this.sequenceIndex = 2;
            this.sectionStart = this.index + 1;
        } else {
            this.state = State.InDeclaration;
        }
    }
    stateInSpecialComment(c) {
        if (c === CharCodes.Gt || this.fastForwardTo(CharCodes.Gt)) {
            this.cbs.oncomment(this.sectionStart, this.index, 0);
            this.state = State.Text;
            this.sectionStart = this.index + 1;
        }
    }
    stateBeforeSpecialS(c) {
        const lower = c | 0x20;
        if (lower === Sequences.ScriptEnd[3]) {
            this.startSpecial(Sequences.ScriptEnd, 4);
        } else if (lower === Sequences.StyleEnd[3]) {
            this.startSpecial(Sequences.StyleEnd, 4);
        } else {
            this.state = State.InTagName;
            this.stateInTagName(c); // Consume the token again
        }
    }
    stateBeforeEntity(c) {
        // Start excess with 1 to include the '&'
        this.entityExcess = 1;
        this.entityResult = 0;
        if (c === CharCodes.Number) {
            this.state = State.BeforeNumericEntity;
        } else if (c === CharCodes.Amp) {
        // We have two `&` characters in a row. Stay in the current state.
        } else {
            this.trieIndex = 0;
            this.trieCurrent = this.entityTrie[0];
            this.state = State.InNamedEntity;
            this.stateInNamedEntity(c);
        }
    }
    stateInNamedEntity(c) {
        this.entityExcess += 1;
        this.trieIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["determineBranch"])(this.entityTrie, this.trieCurrent, this.trieIndex + 1, c);
        if (this.trieIndex < 0) {
            this.emitNamedEntity();
            this.index--;
            return;
        }
        this.trieCurrent = this.entityTrie[this.trieIndex];
        const masked = this.trieCurrent & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BinTrieFlags"].VALUE_LENGTH;
        // If the branch is a value, store it and continue
        if (masked) {
            // The mask is the number of bytes of the value, including the current byte.
            const valueLength = (masked >> 14) - 1;
            // If we have a legacy entity while parsing strictly, just skip the number of bytes
            if (!this.allowLegacyEntity() && c !== CharCodes.Semi) {
                this.trieIndex += valueLength;
            } else {
                // Add 1 as we have already incremented the excess
                const entityStart = this.index - this.entityExcess + 1;
                if (entityStart > this.sectionStart) {
                    this.emitPartial(this.sectionStart, entityStart);
                }
                // If this is a surrogate pair, consume the next two bytes
                this.entityResult = this.trieIndex;
                this.trieIndex += valueLength;
                this.entityExcess = 0;
                this.sectionStart = this.index + 1;
                if (valueLength === 0) {
                    this.emitNamedEntity();
                }
            }
        }
    }
    emitNamedEntity() {
        this.state = this.baseState;
        if (this.entityResult === 0) {
            return;
        }
        const valueLength = (this.entityTrie[this.entityResult] & __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BinTrieFlags"].VALUE_LENGTH) >> 14;
        switch(valueLength){
            case 1:
                {
                    this.emitCodePoint(this.entityTrie[this.entityResult] & ~__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["BinTrieFlags"].VALUE_LENGTH);
                    break;
                }
            case 2:
                {
                    this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
                    break;
                }
            case 3:
                {
                    this.emitCodePoint(this.entityTrie[this.entityResult + 1]);
                    this.emitCodePoint(this.entityTrie[this.entityResult + 2]);
                }
        }
    }
    stateBeforeNumericEntity(c) {
        if ((c | 0x20) === CharCodes.LowerX) {
            this.entityExcess++;
            this.state = State.InHexEntity;
        } else {
            this.state = State.InNumericEntity;
            this.stateInNumericEntity(c);
        }
    }
    emitNumericEntity(strict) {
        const entityStart = this.index - this.entityExcess - 1;
        const numberStart = entityStart + 2 + Number(this.state === State.InHexEntity);
        if (numberStart !== this.index) {
            // Emit leading data if any
            if (entityStart > this.sectionStart) {
                this.emitPartial(this.sectionStart, entityStart);
            }
            this.sectionStart = this.index + Number(strict);
            this.emitCodePoint((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$entities$2f$lib$2f$esm$2f$decode_codepoint$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["replaceCodePoint"])(this.entityResult));
        }
        this.state = this.baseState;
    }
    stateInNumericEntity(c) {
        if (c === CharCodes.Semi) {
            this.emitNumericEntity(true);
        } else if (isNumber(c)) {
            this.entityResult = this.entityResult * 10 + (c - CharCodes.Zero);
            this.entityExcess++;
        } else {
            if (this.allowLegacyEntity()) {
                this.emitNumericEntity(false);
            } else {
                this.state = this.baseState;
            }
            this.index--;
        }
    }
    stateInHexEntity(c) {
        if (c === CharCodes.Semi) {
            this.emitNumericEntity(true);
        } else if (isNumber(c)) {
            this.entityResult = this.entityResult * 16 + (c - CharCodes.Zero);
            this.entityExcess++;
        } else if (isHexDigit(c)) {
            this.entityResult = this.entityResult * 16 + ((c | 0x20) - CharCodes.LowerA + 10);
            this.entityExcess++;
        } else {
            if (this.allowLegacyEntity()) {
                this.emitNumericEntity(false);
            } else {
                this.state = this.baseState;
            }
            this.index--;
        }
    }
    allowLegacyEntity() {
        return !this.xmlMode && (this.baseState === State.Text || this.baseState === State.InSpecialTag);
    }
    /**
     * Remove data that has already been consumed from the buffer.
     */ cleanup() {
        // If we are inside of text or attributes, emit what we already have.
        if (this.running && this.sectionStart !== this.index) {
            if (this.state === State.Text || this.state === State.InSpecialTag && this.sequenceIndex === 0) {
                this.cbs.ontext(this.sectionStart, this.index);
                this.sectionStart = this.index;
            } else if (this.state === State.InAttributeValueDq || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueNq) {
                this.cbs.onattribdata(this.sectionStart, this.index);
                this.sectionStart = this.index;
            }
        }
    }
    shouldContinue() {
        return this.index < this.buffer.length + this.offset && this.running;
    }
    /**
     * Iterates through the buffer, calling the function corresponding to the current state.
     *
     * States that are more likely to be hit are higher up, as a performance improvement.
     */ parse() {
        while(this.shouldContinue()){
            const c = this.buffer.charCodeAt(this.index - this.offset);
            switch(this.state){
                case State.Text:
                    {
                        this.stateText(c);
                        break;
                    }
                case State.SpecialStartSequence:
                    {
                        this.stateSpecialStartSequence(c);
                        break;
                    }
                case State.InSpecialTag:
                    {
                        this.stateInSpecialTag(c);
                        break;
                    }
                case State.CDATASequence:
                    {
                        this.stateCDATASequence(c);
                        break;
                    }
                case State.InAttributeValueDq:
                    {
                        this.stateInAttributeValueDoubleQuotes(c);
                        break;
                    }
                case State.InAttributeName:
                    {
                        this.stateInAttributeName(c);
                        break;
                    }
                case State.InCommentLike:
                    {
                        this.stateInCommentLike(c);
                        break;
                    }
                case State.InSpecialComment:
                    {
                        this.stateInSpecialComment(c);
                        break;
                    }
                case State.BeforeAttributeName:
                    {
                        this.stateBeforeAttributeName(c);
                        break;
                    }
                case State.InTagName:
                    {
                        this.stateInTagName(c);
                        break;
                    }
                case State.InClosingTagName:
                    {
                        this.stateInClosingTagName(c);
                        break;
                    }
                case State.BeforeTagName:
                    {
                        this.stateBeforeTagName(c);
                        break;
                    }
                case State.AfterAttributeName:
                    {
                        this.stateAfterAttributeName(c);
                        break;
                    }
                case State.InAttributeValueSq:
                    {
                        this.stateInAttributeValueSingleQuotes(c);
                        break;
                    }
                case State.BeforeAttributeValue:
                    {
                        this.stateBeforeAttributeValue(c);
                        break;
                    }
                case State.BeforeClosingTagName:
                    {
                        this.stateBeforeClosingTagName(c);
                        break;
                    }
                case State.AfterClosingTagName:
                    {
                        this.stateAfterClosingTagName(c);
                        break;
                    }
                case State.BeforeSpecialS:
                    {
                        this.stateBeforeSpecialS(c);
                        break;
                    }
                case State.InAttributeValueNq:
                    {
                        this.stateInAttributeValueNoQuotes(c);
                        break;
                    }
                case State.InSelfClosingTag:
                    {
                        this.stateInSelfClosingTag(c);
                        break;
                    }
                case State.InDeclaration:
                    {
                        this.stateInDeclaration(c);
                        break;
                    }
                case State.BeforeDeclaration:
                    {
                        this.stateBeforeDeclaration(c);
                        break;
                    }
                case State.BeforeComment:
                    {
                        this.stateBeforeComment(c);
                        break;
                    }
                case State.InProcessingInstruction:
                    {
                        this.stateInProcessingInstruction(c);
                        break;
                    }
                case State.InNamedEntity:
                    {
                        this.stateInNamedEntity(c);
                        break;
                    }
                case State.BeforeEntity:
                    {
                        this.stateBeforeEntity(c);
                        break;
                    }
                case State.InHexEntity:
                    {
                        this.stateInHexEntity(c);
                        break;
                    }
                case State.InNumericEntity:
                    {
                        this.stateInNumericEntity(c);
                        break;
                    }
                default:
                    {
                        // `this._state === State.BeforeNumericEntity`
                        this.stateBeforeNumericEntity(c);
                    }
            }
            this.index++;
        }
        this.cleanup();
    }
    finish() {
        if (this.state === State.InNamedEntity) {
            this.emitNamedEntity();
        }
        // If there is remaining data, emit it in a reasonable way
        if (this.sectionStart < this.index) {
            this.handleTrailingData();
        }
        this.cbs.onend();
    }
    /** Handle any trailing data. */ handleTrailingData() {
        const endIndex = this.buffer.length + this.offset;
        if (this.state === State.InCommentLike) {
            if (this.currentSequence === Sequences.CdataEnd) {
                this.cbs.oncdata(this.sectionStart, endIndex, 0);
            } else {
                this.cbs.oncomment(this.sectionStart, endIndex, 0);
            }
        } else if (this.state === State.InNumericEntity && this.allowLegacyEntity()) {
            this.emitNumericEntity(false);
        // All trailing data will have been consumed
        } else if (this.state === State.InHexEntity && this.allowLegacyEntity()) {
            this.emitNumericEntity(false);
        // All trailing data will have been consumed
        } else if (this.state === State.InTagName || this.state === State.BeforeAttributeName || this.state === State.BeforeAttributeValue || this.state === State.AfterAttributeName || this.state === State.InAttributeName || this.state === State.InAttributeValueSq || this.state === State.InAttributeValueDq || this.state === State.InAttributeValueNq || this.state === State.InClosingTagName) {
        /*
             * If we are currently in an opening or closing tag, us not calling the
             * respective callback signals that the tag should be ignored.
             */ } else {
            this.cbs.ontext(this.sectionStart, endIndex);
        }
    }
    emitPartial(start, endIndex) {
        if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
            this.cbs.onattribdata(start, endIndex);
        } else {
            this.cbs.ontext(start, endIndex);
        }
    }
    emitCodePoint(cp) {
        if (this.baseState !== State.Text && this.baseState !== State.InSpecialTag) {
            this.cbs.onattribentity(cp);
        } else {
            this.cbs.ontextentity(cp);
        }
    }
}
}),
"[project]/node_modules/htmlparser2/lib/esm/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createDomStream",
    ()=>createDomStream,
    "parseDOM",
    ()=>parseDOM,
    "parseDocument",
    ()=>parseDocument,
    "parseFeed",
    ()=>parseFeed
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Parser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/lib/esm/Parser.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domhandler/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Tokenizer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/htmlparser2/lib/esm/Tokenizer.js [app-route] (ecmascript)");
/*
 * All of the following exports exist for backwards-compatibility.
 * They should probably be removed eventually.
 */ var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domelementtype$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domelementtype/lib/esm/index.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/domutils/lib/esm/feeds.js [app-route] (ecmascript)");
;
;
;
;
function parseDocument(data, options) {
    const handler = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DomHandler"](undefined, options);
    new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Parser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Parser"](handler, options).end(data);
    return handler.root;
}
function parseDOM(data, options) {
    return parseDocument(data, options).children;
}
function createDomStream(callback, options, elementCallback) {
    const handler = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domhandler$2f$lib$2f$esm$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["DomHandler"](callback, options, elementCallback);
    return new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$htmlparser2$2f$lib$2f$esm$2f$Parser$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["Parser"](handler, options);
}
;
;
;
;
const parseFeedDefaultOptions = {
    xmlMode: true
};
function parseFeed(feed, options = parseFeedDefaultOptions) {
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$domutils$2f$lib$2f$esm$2f$feeds$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getFeed"])(parseDOM(feed, options));
}
;
}),
"[project]/node_modules/leac/lib/leac.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createLexer",
    ()=>o
]);
const e = /\n/g;
function n(n) {
    const o = [
        ...n.matchAll(e)
    ].map((e)=>e.index || 0);
    o.unshift(-1);
    const s = t(o, 0, o.length);
    return (e)=>r(s, e);
}
function t(e, n, r) {
    if (r - n == 1) return {
        offset: e[n],
        index: n + 1
    };
    const o = Math.ceil((n + r) / 2), s = t(e, n, o), l = t(e, o, r);
    return {
        offset: s.offset,
        low: s,
        high: l
    };
}
function r(e, n) {
    return function(e) {
        return Object.prototype.hasOwnProperty.call(e, "index");
    }(e) ? {
        line: e.index,
        column: n - e.offset
    } : r(e.high.offset < n ? e.high : e.low, n);
}
function o(e, t = "", r = {}) {
    const o1 = "string" != typeof t ? t : r, l = "string" == typeof t ? t : "", c = e.map(s), f = !!o1.lineNumbers;
    return function(e, t = 0) {
        const r = f ? n(e) : ()=>({
                line: 0,
                column: 0
            });
        let o = t;
        const s = [];
        e: for(; o < e.length;){
            let n = !1;
            for (const t of c){
                t.regex.lastIndex = o;
                const c = t.regex.exec(e);
                if (c && c[0].length > 0) {
                    if (!t.discard) {
                        const e = r(o), n = "string" == typeof t.replace ? c[0].replace(new RegExp(t.regex.source, t.regex.flags), t.replace) : c[0];
                        s.push({
                            state: l,
                            name: t.name,
                            text: n,
                            offset: o,
                            len: c[0].length,
                            line: e.line,
                            column: e.column
                        });
                    }
                    if (o = t.regex.lastIndex, n = !0, t.push) {
                        const n = t.push(e, o);
                        s.push(...n.tokens), o = n.offset;
                    }
                    if (t.pop) break e;
                    break;
                }
            }
            if (!n) break;
        }
        return {
            tokens: s,
            offset: o,
            complete: e.length <= o
        };
    };
}
function s(e, n) {
    return {
        ...e,
        regex: l(e, n)
    };
}
function l(e, n) {
    if (0 === e.name.length) throw new Error(`Rule #${n} has empty name, which is not allowed.`);
    if (function(e) {
        return Object.prototype.hasOwnProperty.call(e, "regex");
    }(e)) return function(e) {
        if (e.global) throw new Error(`Regular expression /${e.source}/${e.flags} contains the global flag, which is not allowed.`);
        return e.sticky ? e : new RegExp(e.source, e.flags + "y");
    }(e.regex);
    if (function(e) {
        return Object.prototype.hasOwnProperty.call(e, "str");
    }(e)) {
        if (0 === e.str.length) throw new Error(`Rule #${n} ("${e.name}") has empty "str" property, which is not allowed.`);
        return new RegExp(c(e.str), "y");
    }
    return new RegExp(c(e.name), "y");
}
function c(e) {
    return e.replace(/[-[\]{}()*+!<=:?./\\^$|#\s,]/g, "\\$&");
}
;
}),
"[project]/node_modules/parseley/lib/parseley.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Ast",
    ()=>ast,
    "compareSelectors",
    ()=>compareSelectors,
    "compareSpecificity",
    ()=>compareSpecificity,
    "normalize",
    ()=>normalize,
    "parse",
    ()=>parse,
    "parse1",
    ()=>parse1,
    "serialize",
    ()=>serialize
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leac$2f$lib$2f$leac$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/leac/lib/leac.mjs [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/peberminta/lib/core.mjs [app-route] (ecmascript)");
;
;
var ast = /*#__PURE__*/ Object.freeze({
    __proto__: null
});
const ws = `(?:[ \\t\\r\\n\\f]*)`;
const nl = `(?:\\n|\\r\\n|\\r|\\f)`;
const nonascii = `[^\\x00-\\x7F]`;
const unicode = `(?:\\\\[0-9a-f]{1,6}(?:\\r\\n|[ \\n\\r\\t\\f])?)`;
const escape = `(?:\\\\[^\\n\\r\\f0-9a-f])`;
const nmstart = `(?:[_a-z]|${nonascii}|${unicode}|${escape})`;
const nmchar = `(?:[_a-z0-9-]|${nonascii}|${unicode}|${escape})`;
const name = `(?:${nmchar}+)`;
const ident = `(?:[-]?${nmstart}${nmchar}*)`;
const string1 = `'([^\\n\\r\\f\\\\']|\\\\${nl}|${nonascii}|${unicode}|${escape})*'`;
const string2 = `"([^\\n\\r\\f\\\\"]|\\\\${nl}|${nonascii}|${unicode}|${escape})*"`;
const lexSelector = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leac$2f$lib$2f$leac$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createLexer"])([
    {
        name: 'ws',
        regex: new RegExp(ws)
    },
    {
        name: 'hash',
        regex: new RegExp(`#${name}`, 'i')
    },
    {
        name: 'ident',
        regex: new RegExp(ident, 'i')
    },
    {
        name: 'str1',
        regex: new RegExp(string1, 'i')
    },
    {
        name: 'str2',
        regex: new RegExp(string2, 'i')
    },
    {
        name: '*'
    },
    {
        name: '.'
    },
    {
        name: ','
    },
    {
        name: '['
    },
    {
        name: ']'
    },
    {
        name: '='
    },
    {
        name: '>'
    },
    {
        name: '|'
    },
    {
        name: '+'
    },
    {
        name: '~'
    },
    {
        name: '^'
    },
    {
        name: '$'
    }
]);
const lexEscapedString = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$leac$2f$lib$2f$leac$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createLexer"])([
    {
        name: 'unicode',
        regex: new RegExp(unicode, 'i')
    },
    {
        name: 'escape',
        regex: new RegExp(escape, 'i')
    },
    {
        name: 'any',
        regex: new RegExp('[\\s\\S]', 'i')
    }
]);
function sumSpec([a0, a1, a2], [b0, b1, b2]) {
    return [
        a0 + b0,
        a1 + b1,
        a2 + b2
    ];
}
function sumAllSpec(ss) {
    return ss.reduce(sumSpec, [
        0,
        0,
        0
    ]);
}
const unicodeEscapedSequence_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name === 'unicode' ? String.fromCodePoint(parseInt(t.text.slice(1), 16)) : undefined);
const escapedSequence_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name === 'escape' ? t.text.slice(1) : undefined);
const anyChar_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name === 'any' ? t.text : undefined);
const escapedString_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["many"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["or"](unicodeEscapedSequence_, escapedSequence_, anyChar_)), (cs)=>cs.join(''));
function unescape(escapedString) {
    const lexerResult = lexEscapedString(escapedString);
    const result = escapedString_({
        tokens: lexerResult.tokens,
        options: undefined
    }, 0);
    return result.value;
}
function literal(name) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name === name ? true : undefined);
}
const whitespace_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name === 'ws' ? null : undefined);
const optionalWhitespace_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["option"](whitespace_, null);
function optionallySpaced(parser) {
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["middle"](optionalWhitespace_, parser, optionalWhitespace_);
}
const identifier_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name === 'ident' ? unescape(t.text) : undefined);
const hashId_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name === 'hash' ? unescape(t.text.slice(1)) : undefined);
const string_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>t.name.startsWith('str') ? unescape(t.text.slice(1, -1)) : undefined);
const namespace_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["left"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["option"](identifier_, ''), literal('|'));
const qualifiedName_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eitherOr"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](namespace_, identifier_, (ns, name)=>({
        name: name,
        namespace: ns
    })), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](identifier_, (name)=>({
        name: name,
        namespace: null
    })));
const uniSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eitherOr"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](namespace_, literal('*'), (ns)=>({
        type: 'universal',
        namespace: ns,
        specificity: [
            0,
            0,
            0
        ]
    })), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](literal('*'), ()=>({
        type: 'universal',
        namespace: null,
        specificity: [
            0,
            0,
            0
        ]
    })));
const tagSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](qualifiedName_, ({ name, namespace })=>({
        type: 'tag',
        name: name,
        namespace: namespace,
        specificity: [
            0,
            0,
            1
        ]
    }));
const classSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](literal('.'), identifier_, (fullstop, name)=>({
        type: 'class',
        name: name,
        specificity: [
            0,
            1,
            0
        ]
    }));
const idSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](hashId_, (name)=>({
        type: 'id',
        name: name,
        specificity: [
            1,
            0,
            0
        ]
    }));
const attrModifier_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["token"]((t)=>{
    if (t.name === 'ident') {
        if (t.text === 'i' || t.text === 'I') {
            return 'i';
        }
        if (t.text === 's' || t.text === 'S') {
            return 's';
        }
    }
    return undefined;
});
const attrValue_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eitherOr"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](string_, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["option"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["right"](optionalWhitespace_, attrModifier_), null), (v, mod)=>({
        value: v,
        modifier: mod
    })), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](identifier_, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["option"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["right"](whitespace_, attrModifier_), null), (v, mod)=>({
        value: v,
        modifier: mod
    })));
const attrMatcher_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["choice"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](literal('='), ()=>'='), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](literal('~'), literal('='), ()=>'~='), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](literal('|'), literal('='), ()=>'|='), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](literal('^'), literal('='), ()=>'^='), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](literal('$'), literal('='), ()=>'$='), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](literal('*'), literal('='), ()=>'*='));
const attrPresenceSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["abc"](literal('['), optionallySpaced(qualifiedName_), literal(']'), (lbr, { name, namespace })=>({
        type: 'attrPresence',
        name: name,
        namespace: namespace,
        specificity: [
            0,
            1,
            0
        ]
    }));
const attrValueSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["middle"](literal('['), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["abc"](optionallySpaced(qualifiedName_), attrMatcher_, optionallySpaced(attrValue_), ({ name, namespace }, matcher, { value, modifier })=>({
        type: 'attrValue',
        name: name,
        namespace: namespace,
        matcher: matcher,
        value: value,
        modifier: modifier,
        specificity: [
            0,
            1,
            0
        ]
    })), literal(']'));
const attrSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eitherOr"](attrPresenceSelector_, attrValueSelector_);
const typeSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eitherOr"](uniSelector_, tagSelector_);
const subclassSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["choice"](idSelector_, classSelector_, attrSelector_);
const compoundSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eitherOr"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["flatten"](typeSelector_, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["many"](subclassSelector_)), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["many1"](subclassSelector_)), (ss)=>{
    return {
        type: 'compound',
        list: ss,
        specificity: sumAllSpec(ss.map((s)=>s.specificity))
    };
});
const combinator_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["choice"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](literal('>'), ()=>'>'), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](literal('+'), ()=>'+'), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](literal('~'), ()=>'~'), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ab"](literal('|'), literal('|'), ()=>'||'));
const combinatorSeparator_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["eitherOr"](optionallySpaced(combinator_), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](whitespace_, ()=>' '));
const complexSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leftAssoc2"](compoundSelector_, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](combinatorSeparator_, (c)=>(left, right)=>({
            type: 'compound',
            list: [
                ...right.list,
                {
                    type: 'combinator',
                    combinator: c,
                    left: left,
                    specificity: left.specificity
                }
            ],
            specificity: sumSpec(left.specificity, right.specificity)
        })), compoundSelector_);
const listSelector_ = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["leftAssoc2"](__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](complexSelector_, (s)=>({
        type: 'list',
        list: [
            s
        ]
    })), __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$core$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["map"](optionallySpaced(literal(',')), ()=>(acc, next)=>({
            type: 'list',
            list: [
                ...acc.list,
                next
            ]
        })), complexSelector_);
function parse_(parser, str) {
    if (!(typeof str === 'string' || str instanceof String)) {
        throw new Error('Expected a selector string. Actual input is not a string!');
    }
    const lexerResult = lexSelector(str);
    if (!lexerResult.complete) {
        throw new Error(`The input "${str}" was only partially tokenized, stopped at offset ${lexerResult.offset}!\n` + prettyPrintPosition(str, lexerResult.offset));
    }
    const result = optionallySpaced(parser)({
        tokens: lexerResult.tokens,
        options: undefined
    }, 0);
    if (!result.matched) {
        throw new Error(`No match for "${str}" input!`);
    }
    if (result.position < lexerResult.tokens.length) {
        const token = lexerResult.tokens[result.position];
        throw new Error(`The input "${str}" was only partially parsed, stopped at offset ${token.offset}!\n` + prettyPrintPosition(str, token.offset, token.len));
    }
    return result.value;
}
function prettyPrintPosition(str, offset, len = 1) {
    return `${str.replace(/(\t)|(\r)|(\n)/g, (m, t, r)=>t ? '\u2409' : r ? '\u240d' : '\u240a')}\n${''.padEnd(offset)}${'^'.repeat(len)}`;
}
function parse(str) {
    return parse_(listSelector_, str);
}
function parse1(str) {
    return parse_(complexSelector_, str);
}
function serialize(selector) {
    if (!selector.type) {
        throw new Error('This is not an AST node.');
    }
    switch(selector.type){
        case 'universal':
            return _serNs(selector.namespace) + '*';
        case 'tag':
            return _serNs(selector.namespace) + _serIdent(selector.name);
        case 'class':
            return '.' + _serIdent(selector.name);
        case 'id':
            return '#' + _serIdent(selector.name);
        case 'attrPresence':
            return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}]`;
        case 'attrValue':
            return `[${_serNs(selector.namespace)}${_serIdent(selector.name)}${selector.matcher}"${_serStr(selector.value)}"${selector.modifier ? selector.modifier : ''}]`;
        case 'combinator':
            return serialize(selector.left) + selector.combinator;
        case 'compound':
            return selector.list.reduce((acc, node)=>{
                if (node.type === 'combinator') {
                    return serialize(node) + acc;
                } else {
                    return acc + serialize(node);
                }
            }, '');
        case 'list':
            return selector.list.map(serialize).join(',');
    }
}
function _serNs(ns) {
    return ns || ns === '' ? _serIdent(ns) + '|' : '';
}
function _codePoint(char) {
    return `\\${char.codePointAt(0).toString(16)} `;
}
function _serIdent(str) {
    return str.replace(/(^[0-9])|(^-[0-9])|(^-$)|([-0-9a-zA-Z_]|[^\x00-\x7F])|(\x00)|([\x01-\x1f]|\x7f)|([\s\S])/g, (m, d1, d2, hy, safe, nl, ctrl, other)=>d1 ? _codePoint(d1) : d2 ? '-' + _codePoint(d2.slice(1)) : hy ? '\\-' : safe ? safe : nl ? '\ufffd' : ctrl ? _codePoint(ctrl) : '\\' + other);
}
function _serStr(str) {
    return str.replace(/(")|(\\)|(\x00)|([\x01-\x1f]|\x7f)/g, (m, dq, bs, nl, ctrl)=>dq ? '\\"' : bs ? '\\\\' : nl ? '\ufffd' : _codePoint(ctrl));
}
function normalize(selector) {
    if (!selector.type) {
        throw new Error('This is not an AST node.');
    }
    switch(selector.type){
        case 'compound':
            {
                selector.list.forEach(normalize);
                selector.list.sort((a, b)=>_compareArrays(_getSelectorPriority(a), _getSelectorPriority(b)));
                break;
            }
        case 'combinator':
            {
                normalize(selector.left);
                break;
            }
        case 'list':
            {
                selector.list.forEach(normalize);
                selector.list.sort((a, b)=>serialize(a) < serialize(b) ? -1 : 1);
                break;
            }
    }
    return selector;
}
function _getSelectorPriority(selector) {
    switch(selector.type){
        case 'universal':
            return [
                1
            ];
        case 'tag':
            return [
                1
            ];
        case 'id':
            return [
                2
            ];
        case 'class':
            return [
                3,
                selector.name
            ];
        case 'attrPresence':
            return [
                4,
                serialize(selector)
            ];
        case 'attrValue':
            return [
                5,
                serialize(selector)
            ];
        case 'combinator':
            return [
                15,
                serialize(selector)
            ];
    }
}
function compareSelectors(a, b) {
    return _compareArrays(a.specificity, b.specificity);
}
function compareSpecificity(a, b) {
    return _compareArrays(a, b);
}
function _compareArrays(a, b) {
    if (!Array.isArray(a) || !Array.isArray(b)) {
        throw new Error('Arguments must be arrays.');
    }
    const shorter = a.length < b.length ? a.length : b.length;
    for(let i = 0; i < shorter; i++){
        if (a[i] === b[i]) {
            continue;
        }
        return a[i] < b[i] ? -1 : 1;
    }
    return a.length - b.length;
}
;
}),
"[project]/node_modules/peberminta/lib/core.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ab",
    ()=>ab,
    "abc",
    ()=>abc,
    "action",
    ()=>action,
    "ahead",
    ()=>ahead,
    "all",
    ()=>all,
    "and",
    ()=>all,
    "any",
    ()=>any,
    "chain",
    ()=>chain,
    "chainReduce",
    ()=>chainReduce,
    "choice",
    ()=>choice,
    "condition",
    ()=>condition,
    "decide",
    ()=>decide,
    "discard",
    ()=>skip,
    "eitherOr",
    ()=>otherwise,
    "emit",
    ()=>emit,
    "end",
    ()=>end,
    "eof",
    ()=>end,
    "error",
    ()=>error,
    "fail",
    ()=>fail,
    "flatten",
    ()=>flatten,
    "flatten1",
    ()=>flatten1,
    "left",
    ()=>left,
    "leftAssoc1",
    ()=>leftAssoc1,
    "leftAssoc2",
    ()=>leftAssoc2,
    "longest",
    ()=>longest,
    "lookAhead",
    ()=>ahead,
    "make",
    ()=>make,
    "many",
    ()=>many,
    "many1",
    ()=>many1,
    "map",
    ()=>map,
    "map1",
    ()=>map1,
    "match",
    ()=>match,
    "middle",
    ()=>middle,
    "not",
    ()=>not,
    "of",
    ()=>emit,
    "option",
    ()=>option,
    "or",
    ()=>choice,
    "otherwise",
    ()=>otherwise,
    "parse",
    ()=>parse,
    "parserPosition",
    ()=>parserPosition,
    "peek",
    ()=>peek,
    "recursive",
    ()=>recursive,
    "reduceLeft",
    ()=>reduceLeft,
    "reduceRight",
    ()=>reduceRight,
    "remainingTokensNumber",
    ()=>remainingTokensNumber,
    "right",
    ()=>right,
    "rightAssoc1",
    ()=>rightAssoc1,
    "rightAssoc2",
    ()=>rightAssoc2,
    "satisfy",
    ()=>satisfy,
    "sepBy",
    ()=>sepBy,
    "sepBy1",
    ()=>sepBy1,
    "skip",
    ()=>skip,
    "some",
    ()=>many1,
    "start",
    ()=>start,
    "takeUntil",
    ()=>takeUntil,
    "takeUntilP",
    ()=>takeUntilP,
    "takeWhile",
    ()=>takeWhile,
    "takeWhileP",
    ()=>takeWhileP,
    "token",
    ()=>token,
    "tryParse",
    ()=>tryParse
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$util$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/peberminta/lib/util.mjs [app-route] (ecmascript)");
;
function emit(value) {
    return (data, i)=>({
            matched: true,
            position: i,
            value: value
        });
}
function make(f) {
    return (data, i)=>({
            matched: true,
            position: i,
            value: f(data, i)
        });
}
function action(f) {
    return (data, i)=>{
        f(data, i);
        return {
            matched: true,
            position: i,
            value: null
        };
    };
}
function fail(data, i) {
    return {
        matched: false
    };
}
function error(message) {
    return (data, i)=>{
        throw new Error(message instanceof Function ? message(data, i) : message);
    };
}
function token(onToken, onEnd) {
    return (data, i)=>{
        let position = i;
        let value = undefined;
        if (i < data.tokens.length) {
            value = onToken(data.tokens[i], data, i);
            if (value !== undefined) {
                position++;
            }
        } else {
            onEnd?.(data, i);
        }
        return value === undefined ? {
            matched: false
        } : {
            matched: true,
            position: position,
            value: value
        };
    };
}
function any(data, i) {
    return i < data.tokens.length ? {
        matched: true,
        position: i + 1,
        value: data.tokens[i]
    } : {
        matched: false
    };
}
function satisfy(test) {
    return (data, i)=>i < data.tokens.length && test(data.tokens[i], data, i) ? {
            matched: true,
            position: i + 1,
            value: data.tokens[i]
        } : {
            matched: false
        };
}
function mapInner(r, f) {
    return r.matched ? {
        matched: true,
        position: r.position,
        value: f(r.value, r.position)
    } : r;
}
function mapOuter(r, f) {
    return r.matched ? f(r) : r;
}
function map(p, mapper) {
    return (data, i)=>mapInner(p(data, i), (v, j)=>mapper(v, data, i, j));
}
function map1(p, mapper) {
    return (data, i)=>mapOuter(p(data, i), (m)=>mapper(m, data, i));
}
function peek(p, f) {
    return (data, i)=>{
        const r = p(data, i);
        f(r, data, i);
        return r;
    };
}
function option(p, def) {
    return (data, i)=>{
        const r = p(data, i);
        return r.matched ? r : {
            matched: true,
            position: i,
            value: def
        };
    };
}
function not(p) {
    return (data, i)=>{
        const r = p(data, i);
        return r.matched ? {
            matched: false
        } : {
            matched: true,
            position: i,
            value: true
        };
    };
}
function choice(...ps) {
    return (data, i)=>{
        for (const p of ps){
            const result = p(data, i);
            if (result.matched) {
                return result;
            }
        }
        return {
            matched: false
        };
    };
}
function otherwise(pa, pb) {
    return (data, i)=>{
        const r1 = pa(data, i);
        return r1.matched ? r1 : pb(data, i);
    };
}
function longest(...ps) {
    return (data, i)=>{
        let match = undefined;
        for (const p of ps){
            const result = p(data, i);
            if (result.matched && (!match || match.position < result.position)) {
                match = result;
            }
        }
        return match || {
            matched: false
        };
    };
}
function takeWhile(p, test) {
    return (data, i)=>{
        const values = [];
        let success = true;
        do {
            const r = p(data, i);
            if (r.matched && test(r.value, values.length + 1, data, i, r.position)) {
                values.push(r.value);
                i = r.position;
            } else {
                success = false;
            }
        }while (success)
        return {
            matched: true,
            position: i,
            value: values
        };
    };
}
function takeUntil(p, test) {
    return takeWhile(p, (value, n, data, i, j)=>!test(value, n, data, i, j));
}
function takeWhileP(pValue, pTest) {
    return takeWhile(pValue, (value, n, data, i)=>pTest(data, i).matched);
}
function takeUntilP(pValue, pTest) {
    return takeWhile(pValue, (value, n, data, i)=>!pTest(data, i).matched);
}
function many(p) {
    return takeWhile(p, ()=>true);
}
function many1(p) {
    return ab(p, many(p), (head, tail)=>[
            head,
            ...tail
        ]);
}
function ab(pa, pb, join) {
    return (data, i)=>mapOuter(pa(data, i), (ma)=>mapInner(pb(data, ma.position), (vb, j)=>join(ma.value, vb, data, i, j)));
}
function left(pa, pb) {
    return ab(pa, pb, (va)=>va);
}
function right(pa, pb) {
    return ab(pa, pb, (va, vb)=>vb);
}
function abc(pa, pb, pc, join) {
    return (data, i)=>mapOuter(pa(data, i), (ma)=>mapOuter(pb(data, ma.position), (mb)=>mapInner(pc(data, mb.position), (vc, j)=>join(ma.value, mb.value, vc, data, i, j))));
}
function middle(pa, pb, pc) {
    return abc(pa, pb, pc, (ra, rb)=>rb);
}
function all(...ps) {
    return (data, i)=>{
        const result = [];
        let position = i;
        for (const p of ps){
            const r1 = p(data, position);
            if (r1.matched) {
                result.push(r1.value);
                position = r1.position;
            } else {
                return {
                    matched: false
                };
            }
        }
        return {
            matched: true,
            position: position,
            value: result
        };
    };
}
function skip(...ps) {
    return map(all(...ps), ()=>null);
}
function flatten(...ps) {
    return flatten1(all(...ps));
}
function flatten1(p) {
    return map(p, (vs)=>vs.flatMap((v)=>v));
}
function sepBy1(pValue, pSep) {
    return ab(pValue, many(right(pSep, pValue)), (head, tail)=>[
            head,
            ...tail
        ]);
}
function sepBy(pValue, pSep) {
    return otherwise(sepBy1(pValue, pSep), emit([]));
}
function chainReduce(acc, f) {
    return (data, i)=>{
        let loop = true;
        let acc1 = acc;
        let pos = i;
        do {
            const r = f(acc1, data, pos)(data, pos);
            if (r.matched) {
                acc1 = r.value;
                pos = r.position;
            } else {
                loop = false;
            }
        }while (loop)
        return {
            matched: true,
            position: pos,
            value: acc1
        };
    };
}
function reduceLeft(acc, p, reducer) {
    return chainReduce(acc, (acc)=>map(p, (v, data, i, j)=>reducer(acc, v, data, i, j)));
}
function reduceRight(p, acc, reducer) {
    return map(many(p), (vs, data, i, j)=>vs.reduceRight((acc, v)=>reducer(v, acc, data, i, j), acc));
}
function leftAssoc1(pLeft, pOper) {
    return chain(pLeft, (v0)=>reduceLeft(v0, pOper, (acc, f)=>f(acc)));
}
function rightAssoc1(pOper, pRight) {
    return ab(reduceRight(pOper, (y)=>y, (f, acc)=>(y)=>f(acc(y))), pRight, (f, v)=>f(v));
}
function leftAssoc2(pLeft, pOper, pRight) {
    return chain(pLeft, (v0)=>reduceLeft(v0, ab(pOper, pRight, (f, y)=>[
                f,
                y
            ]), (acc, [f, y])=>f(acc, y)));
}
function rightAssoc2(pLeft, pOper, pRight) {
    return ab(reduceRight(ab(pLeft, pOper, (x, f)=>[
            x,
            f
        ]), (y)=>y, ([x, f], acc)=>(y)=>f(x, acc(y))), pRight, (f, v)=>f(v));
}
function condition(cond, pTrue, pFalse) {
    return (data, i)=>cond(data, i) ? pTrue(data, i) : pFalse(data, i);
}
function decide(p) {
    return (data, i)=>mapOuter(p(data, i), (m1)=>m1.value(data, m1.position));
}
function chain(p, f) {
    return (data, i)=>mapOuter(p(data, i), (m1)=>f(m1.value, data, i, m1.position)(data, m1.position));
}
function ahead(p) {
    return (data, i)=>mapOuter(p(data, i), (m1)=>({
                matched: true,
                position: i,
                value: m1.value
            }));
}
function recursive(f) {
    return function(data, i) {
        return f()(data, i);
    };
}
function start(data, i) {
    return i !== 0 ? {
        matched: false
    } : {
        matched: true,
        position: i,
        value: true
    };
}
function end(data, i) {
    return i < data.tokens.length ? {
        matched: false
    } : {
        matched: true,
        position: i,
        value: true
    };
}
function remainingTokensNumber(data, i) {
    return data.tokens.length - i;
}
function parserPosition(data, i, formatToken, contextTokens = 3) {
    const len = data.tokens.length;
    const lowIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$util$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clamp"])(0, i - contextTokens, len - contextTokens);
    const highIndex = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$util$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["clamp"])(contextTokens, i + 1 + contextTokens, len);
    const tokensSlice = data.tokens.slice(lowIndex, highIndex);
    const lines = [];
    const indexWidth = String(highIndex - 1).length + 1;
    if (i < 0) {
        lines.push(`${String(i).padStart(indexWidth)} >>`);
    }
    if (0 < lowIndex) {
        lines.push('...'.padStart(indexWidth + 6));
    }
    for(let j = 0; j < tokensSlice.length; j++){
        const index = lowIndex + j;
        lines.push(`${String(index).padStart(indexWidth)} ${index === i ? '>' : ' '} ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$peberminta$2f$lib$2f$util$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeWhitespace"])(formatToken(tokensSlice[j]))}`);
    }
    if (highIndex < len) {
        lines.push('...'.padStart(indexWidth + 6));
    }
    if (len <= i) {
        lines.push(`${String(i).padStart(indexWidth)} >>`);
    }
    return lines.join('\n');
}
function parse(parser, tokens, options, formatToken = JSON.stringify) {
    const data = {
        tokens: tokens,
        options: options
    };
    const result = parser(data, 0);
    if (!result.matched) {
        throw new Error('No match');
    }
    if (result.position < data.tokens.length) {
        throw new Error(`Partial match. Parsing stopped at:\n${parserPosition(data, result.position, formatToken)}`);
    }
    return result.value;
}
function tryParse(parser, tokens, options) {
    const result = parser({
        tokens: tokens,
        options: options
    }, 0);
    return result.matched ? result.value : undefined;
}
function match(matcher, tokens, options) {
    const result = matcher({
        tokens: tokens,
        options: options
    }, 0);
    return result.value;
}
;
}),
"[project]/node_modules/peberminta/lib/util.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clamp",
    ()=>clamp,
    "escapeWhitespace",
    ()=>escapeWhitespace
]);
function clamp(left, x, right) {
    return Math.max(left, Math.min(x, right));
}
function escapeWhitespace(str) {
    return str.replace(/(\t)|(\r)|(\n)/g, (m, t, r)=>t ? '\\t' : r ? '\\r' : '\\n');
}
;
}),
"[project]/node_modules/selderee/lib/selderee.mjs [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "Ast",
    ()=>Ast,
    "DecisionTree",
    ()=>DecisionTree,
    "Picker",
    ()=>Picker,
    "Treeify",
    ()=>TreeifyBuilder,
    "Types",
    ()=>Types
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parseley$2f$lib$2f$parseley$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/parseley/lib/parseley.mjs [app-route] (ecmascript)");
;
;
var Ast = /*#__PURE__*/ Object.freeze({
    __proto__: null
});
var Types = /*#__PURE__*/ Object.freeze({
    __proto__: null
});
const treeify = (nodes)=>'▽\n' + treeifyArray(nodes, thinLines);
const thinLines = [
    [
        '├─',
        '│ '
    ],
    [
        '└─',
        '  '
    ]
];
const heavyLines = [
    [
        '┠─',
        '┃ '
    ],
    [
        '┖─',
        '  '
    ]
];
const doubleLines = [
    [
        '╟─',
        '║ '
    ],
    [
        '╙─',
        '  '
    ]
];
function treeifyArray(nodes, tpl = heavyLines) {
    return prefixItems(tpl, nodes.map((n)=>treeifyNode(n)));
}
function treeifyNode(node) {
    switch(node.type){
        case 'terminal':
            {
                const vctr = node.valueContainer;
                return `◁ #${vctr.index} ${JSON.stringify(vctr.specificity)} ${vctr.value}`;
            }
        case 'tagName':
            return `◻ Tag name\n${treeifyArray(node.variants, doubleLines)}`;
        case 'attrValue':
            return `▣ Attr value: ${node.name}\n${treeifyArray(node.matchers, doubleLines)}`;
        case 'attrPresence':
            return `◨ Attr presence: ${node.name}\n${treeifyArray(node.cont)}`;
        case 'pushElement':
            return `◉ Push element: ${node.combinator}\n${treeifyArray(node.cont, thinLines)}`;
        case 'popElement':
            return `◌ Pop element\n${treeifyArray(node.cont, thinLines)}`;
        case 'variant':
            return `◇ = ${node.value}\n${treeifyArray(node.cont)}`;
        case 'matcher':
            return `◈ ${node.matcher} "${node.value}"${node.modifier || ''}\n${treeifyArray(node.cont)}`;
    }
}
function prefixItems(tpl, items) {
    return items.map((item, i, { length })=>prefixItem(tpl, item, i === length - 1)).join('\n');
}
function prefixItem(tpl, item, tail = true) {
    const tpl1 = tpl[tail ? 1 : 0];
    return tpl1[0] + item.split('\n').join('\n' + tpl1[1]);
}
var TreeifyBuilder = /*#__PURE__*/ Object.freeze({
    __proto__: null,
    treeify: treeify
});
class DecisionTree {
    constructor(input){
        this.branches = weave(toAstTerminalPairs(input));
    }
    build(builder) {
        return builder(this.branches);
    }
}
function toAstTerminalPairs(array) {
    const len = array.length;
    const results = new Array(len);
    for(let i = 0; i < len; i++){
        const [selectorString, val] = array[i];
        const ast = preprocess(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parseley$2f$lib$2f$parseley$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parse1"](selectorString));
        results[i] = {
            ast: ast,
            terminal: {
                type: 'terminal',
                valueContainer: {
                    index: i,
                    value: val,
                    specificity: ast.specificity
                }
            }
        };
    }
    return results;
}
function preprocess(ast) {
    reduceSelectorVariants(ast);
    __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parseley$2f$lib$2f$parseley$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalize"](ast);
    return ast;
}
function reduceSelectorVariants(ast) {
    const newList = [];
    ast.list.forEach((sel)=>{
        switch(sel.type){
            case 'class':
                newList.push({
                    matcher: '~=',
                    modifier: null,
                    name: 'class',
                    namespace: null,
                    specificity: sel.specificity,
                    type: 'attrValue',
                    value: sel.name
                });
                break;
            case 'id':
                newList.push({
                    matcher: '=',
                    modifier: null,
                    name: 'id',
                    namespace: null,
                    specificity: sel.specificity,
                    type: 'attrValue',
                    value: sel.name
                });
                break;
            case 'combinator':
                reduceSelectorVariants(sel.left);
                newList.push(sel);
                break;
            case 'universal':
                break;
            default:
                newList.push(sel);
                break;
        }
    });
    ast.list = newList;
}
function weave(items) {
    const branches = [];
    while(items.length){
        const topKind = findTopKey(items, (sel)=>true, getSelectorKind);
        const { matches, nonmatches, empty } = breakByKind(items, topKind);
        items = nonmatches;
        if (matches.length) {
            branches.push(branchOfKind(topKind, matches));
        }
        if (empty.length) {
            branches.push(...terminate(empty));
        }
    }
    return branches;
}
function terminate(items) {
    const results = [];
    for (const item of items){
        const terminal = item.terminal;
        if (terminal.type === 'terminal') {
            results.push(terminal);
        } else {
            const { matches, rest } = partition(terminal.cont, (node)=>node.type === 'terminal');
            matches.forEach((node)=>results.push(node));
            if (rest.length) {
                terminal.cont = rest;
                results.push(terminal);
            }
        }
    }
    return results;
}
function breakByKind(items, selectedKind) {
    const matches = [];
    const nonmatches = [];
    const empty = [];
    for (const item of items){
        const simpsels = item.ast.list;
        if (simpsels.length) {
            const isMatch = simpsels.some((node)=>getSelectorKind(node) === selectedKind);
            (isMatch ? matches : nonmatches).push(item);
        } else {
            empty.push(item);
        }
    }
    return {
        matches,
        nonmatches,
        empty
    };
}
function getSelectorKind(sel) {
    switch(sel.type){
        case 'attrPresence':
            return `attrPresence ${sel.name}`;
        case 'attrValue':
            return `attrValue ${sel.name}`;
        case 'combinator':
            return `combinator ${sel.combinator}`;
        default:
            return sel.type;
    }
}
function branchOfKind(kind, items) {
    if (kind === 'tag') {
        return tagNameBranch(items);
    }
    if (kind.startsWith('attrValue ')) {
        return attrValueBranch(kind.substring(10), items);
    }
    if (kind.startsWith('attrPresence ')) {
        return attrPresenceBranch(kind.substring(13), items);
    }
    if (kind === 'combinator >') {
        return combinatorBranch('>', items);
    }
    if (kind === 'combinator +') {
        return combinatorBranch('+', items);
    }
    throw new Error(`Unsupported selector kind: ${kind}`);
}
function tagNameBranch(items) {
    const groups = spliceAndGroup(items, (x)=>x.type === 'tag', (x)=>x.name);
    const variants = Object.entries(groups).map(([name, group])=>({
            type: 'variant',
            value: name,
            cont: weave(group.items)
        }));
    return {
        type: 'tagName',
        variants: variants
    };
}
function attrPresenceBranch(name, items) {
    for (const item of items){
        spliceSimpleSelector(item, (x)=>x.type === 'attrPresence' && x.name === name);
    }
    return {
        type: 'attrPresence',
        name: name,
        cont: weave(items)
    };
}
function attrValueBranch(name, items) {
    const groups = spliceAndGroup(items, (x)=>x.type === 'attrValue' && x.name === name, (x)=>`${x.matcher} ${x.modifier || ''} ${x.value}`);
    const matchers = [];
    for (const group of Object.values(groups)){
        const sel = group.oneSimpleSelector;
        const predicate = getAttrPredicate(sel);
        const continuation = weave(group.items);
        matchers.push({
            type: 'matcher',
            matcher: sel.matcher,
            modifier: sel.modifier,
            value: sel.value,
            predicate: predicate,
            cont: continuation
        });
    }
    return {
        type: 'attrValue',
        name: name,
        matchers: matchers
    };
}
function getAttrPredicate(sel) {
    if (sel.modifier === 'i') {
        const expected = sel.value.toLowerCase();
        switch(sel.matcher){
            case '=':
                return (actual)=>expected === actual.toLowerCase();
            case '~=':
                return (actual)=>actual.toLowerCase().split(/[ \t]+/).includes(expected);
            case '^=':
                return (actual)=>actual.toLowerCase().startsWith(expected);
            case '$=':
                return (actual)=>actual.toLowerCase().endsWith(expected);
            case '*=':
                return (actual)=>actual.toLowerCase().includes(expected);
            case '|=':
                return (actual)=>{
                    const lower = actual.toLowerCase();
                    return expected === lower || lower.startsWith(expected) && lower[expected.length] === '-';
                };
        }
    } else {
        const expected = sel.value;
        switch(sel.matcher){
            case '=':
                return (actual)=>expected === actual;
            case '~=':
                return (actual)=>actual.split(/[ \t]+/).includes(expected);
            case '^=':
                return (actual)=>actual.startsWith(expected);
            case '$=':
                return (actual)=>actual.endsWith(expected);
            case '*=':
                return (actual)=>actual.includes(expected);
            case '|=':
                return (actual)=>expected === actual || actual.startsWith(expected) && actual[expected.length] === '-';
        }
    }
}
function combinatorBranch(combinator, items) {
    const groups = spliceAndGroup(items, (x)=>x.type === 'combinator' && x.combinator === combinator, (x)=>__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parseley$2f$lib$2f$parseley$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["serialize"](x.left));
    const leftItems = [];
    for (const group of Object.values(groups)){
        const rightCont = weave(group.items);
        const leftAst = group.oneSimpleSelector.left;
        leftItems.push({
            ast: leftAst,
            terminal: {
                type: 'popElement',
                cont: rightCont
            }
        });
    }
    return {
        type: 'pushElement',
        combinator: combinator,
        cont: weave(leftItems)
    };
}
function spliceAndGroup(items, predicate, keyCallback) {
    const groups = {};
    while(items.length){
        const bestKey = findTopKey(items, predicate, keyCallback);
        const bestKeyPredicate = (sel)=>predicate(sel) && keyCallback(sel) === bestKey;
        const hasBestKeyPredicate = (item)=>item.ast.list.some(bestKeyPredicate);
        const { matches, rest } = partition1(items, hasBestKeyPredicate);
        let oneSimpleSelector = null;
        for (const item of matches){
            const splicedNode = spliceSimpleSelector(item, bestKeyPredicate);
            if (!oneSimpleSelector) {
                oneSimpleSelector = splicedNode;
            }
        }
        if (oneSimpleSelector == null) {
            throw new Error('No simple selector is found.');
        }
        groups[bestKey] = {
            oneSimpleSelector: oneSimpleSelector,
            items: matches
        };
        items = rest;
    }
    return groups;
}
function spliceSimpleSelector(item, predicate) {
    const simpsels = item.ast.list;
    const matches = new Array(simpsels.length);
    let firstIndex = -1;
    for(let i = simpsels.length; i-- > 0;){
        if (predicate(simpsels[i])) {
            matches[i] = true;
            firstIndex = i;
        }
    }
    if (firstIndex == -1) {
        throw new Error(`Couldn't find the required simple selector.`);
    }
    const result = simpsels[firstIndex];
    item.ast.list = simpsels.filter((sel, i)=>!matches[i]);
    return result;
}
function findTopKey(items, predicate, keyCallback) {
    const candidates = {};
    for (const item of items){
        const candidates1 = {};
        for (const node of item.ast.list.filter(predicate)){
            candidates1[keyCallback(node)] = true;
        }
        for (const key of Object.keys(candidates1)){
            if (candidates[key]) {
                candidates[key]++;
            } else {
                candidates[key] = 1;
            }
        }
    }
    let topKind = '';
    let topCounter = 0;
    for (const entry of Object.entries(candidates)){
        if (entry[1] > topCounter) {
            topKind = entry[0];
            topCounter = entry[1];
        }
    }
    return topKind;
}
function partition(src, predicate) {
    const matches = [];
    const rest = [];
    for (const x of src){
        if (predicate(x)) {
            matches.push(x);
        } else {
            rest.push(x);
        }
    }
    return {
        matches,
        rest
    };
}
function partition1(src, predicate) {
    const matches = [];
    const rest = [];
    for (const x of src){
        if (predicate(x)) {
            matches.push(x);
        } else {
            rest.push(x);
        }
    }
    return {
        matches,
        rest
    };
}
class Picker {
    constructor(f){
        this.f = f;
    }
    pickAll(el) {
        return this.f(el);
    }
    pick1(el, preferFirst = false) {
        const results = this.f(el);
        const len = results.length;
        if (len === 0) {
            return null;
        }
        if (len === 1) {
            return results[0].value;
        }
        const comparator = preferFirst ? comparatorPreferFirst : comparatorPreferLast;
        let result = results[0];
        for(let i = 1; i < len; i++){
            const next = results[i];
            if (comparator(result, next)) {
                result = next;
            }
        }
        return result.value;
    }
}
function comparatorPreferFirst(acc, next) {
    const diff = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parseley$2f$lib$2f$parseley$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["compareSpecificity"])(next.specificity, acc.specificity);
    return diff > 0 || diff === 0 && next.index < acc.index;
}
function comparatorPreferLast(acc, next) {
    const diff = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f$parseley$2f$lib$2f$parseley$2e$mjs__$5b$app$2d$route$5d$__$28$ecmascript$29$__["compareSpecificity"])(next.specificity, acc.specificity);
    return diff > 0 || diff === 0 && next.index > acc.index;
}
;
}),
];

//# sourceMappingURL=%5Broot-of-the-server%5D__0c4ga3d._.js.map