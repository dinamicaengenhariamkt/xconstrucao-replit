module.exports = [
"[externals]/@aws-sdk/client-s3 [external] (@aws-sdk/client-s3, cjs, [project]/node_modules/@aws-sdk/client-s3)", ((__turbopack_context__, module, exports) => {

var mod = __turbopack_context__.x("@aws-sdk/client-s3-ecbef8e33fd0b8f0", () => require("@aws-sdk/client-s3-ecbef8e33fd0b8f0"));

module.exports = mod;
}),
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
"[project]/node_modules/@aws-sdk/core/dist-es/submodules/util/util-format-url/format-url.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "formatUrl",
    ()=>formatUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$querystring$2d$builder$2f$buildQueryString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/protocols/querystring-builder/buildQueryString.js [app-route] (ecmascript)");
;
function formatUrl(request) {
    const { port, query } = request;
    let { protocol, path, hostname } = request;
    if (protocol && protocol.slice(-1) !== ":") {
        protocol += ":";
    }
    if (port) {
        hostname += `:${port}`;
    }
    if (path && path.charAt(0) !== "/") {
        path = `/${path}`;
    }
    let queryString = query ? (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$querystring$2d$builder$2f$buildQueryString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["buildQueryString"])(query) : "";
    if (queryString && queryString[0] !== "?") {
        queryString = `?${queryString}`;
    }
    let auth = "";
    if (request.username != null || request.password != null) {
        const username = request.username ?? "";
        const password = request.password ?? "";
        auth = `${username}:${password}@`;
    }
    let fragment = "";
    if (request.fragment) {
        fragment = `#${request.fragment}`;
    }
    return `${protocol}//${auth}${hostname}${path}${queryString}${fragment}`;
}
}),
"[project]/node_modules/@aws-sdk/s3-request-presigner/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALGORITHM_IDENTIFIER",
    ()=>ALGORITHM_IDENTIFIER,
    "ALGORITHM_QUERY_PARAM",
    ()=>ALGORITHM_QUERY_PARAM,
    "AMZ_DATE_QUERY_PARAM",
    ()=>AMZ_DATE_QUERY_PARAM,
    "CREDENTIAL_QUERY_PARAM",
    ()=>CREDENTIAL_QUERY_PARAM,
    "EXPIRES_QUERY_PARAM",
    ()=>EXPIRES_QUERY_PARAM,
    "HOST_HEADER",
    ()=>HOST_HEADER,
    "SHA256_HEADER",
    ()=>SHA256_HEADER,
    "SIGNED_HEADERS_QUERY_PARAM",
    ()=>SIGNED_HEADERS_QUERY_PARAM,
    "UNSIGNED_PAYLOAD",
    ()=>UNSIGNED_PAYLOAD
]);
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
const SHA256_HEADER = "X-Amz-Content-Sha256";
const ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
const CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
const AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
const SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
const EXPIRES_QUERY_PARAM = "X-Amz-Expires";
const HOST_HEADER = "host";
const ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
}),
"[project]/node_modules/@aws-sdk/s3-request-presigner/dist-es/getSignedUrl.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSignedUrl",
    ()=>getSignedUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$util$2f$util$2d$format$2d$url$2f$format$2d$url$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@aws-sdk/core/dist-es/submodules/util/util-format-url/format-url.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/index.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/httpRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$presigner$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@aws-sdk/s3-request-presigner/dist-es/presigner.js [app-route] (ecmascript)");
;
;
;
;
const getSignedUrl = async (client, command, options = {})=>{
    let s3Presigner;
    let region;
    if (typeof client.config.endpointProvider === "function") {
        const endpointV2 = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$index$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["getEndpointFromInstructions"])(command.input, command.constructor, client.config);
        const authScheme = endpointV2.properties?.authSchemes?.[0];
        if (authScheme?.name === "sigv4a") {
            region = authScheme?.signingRegionSet?.join(",");
        } else {
            region = authScheme?.signingRegion;
        }
        s3Presigner = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$presigner$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["S3RequestPresigner"]({
            ...client.config,
            signingName: authScheme?.signingName,
            region: async ()=>region
        });
    } else {
        s3Presigner = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$presigner$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["S3RequestPresigner"](client.config);
    }
    const presignInterceptMiddleware = (next, context)=>async (args)=>{
            const { request } = args;
            if (!__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].isInstance(request)) {
                throw new Error("Request to be presigned is not an valid HTTP request.");
            }
            delete request.headers["amz-sdk-invocation-id"];
            delete request.headers["amz-sdk-request"];
            delete request.headers["x-amz-user-agent"];
            let presigned;
            const presignerOptions = {
                ...options,
                signingRegion: options.signingRegion ?? context["signing_region"] ?? region,
                signingService: options.signingService ?? context["signing_service"]
            };
            if (context.s3ExpressIdentity) {
                presigned = await s3Presigner.presignWithCredentials(request, context.s3ExpressIdentity, presignerOptions);
            } else {
                presigned = await s3Presigner.presign(request, presignerOptions);
            }
            return {
                response: {},
                output: {
                    $metadata: {
                        httpStatusCode: 200
                    },
                    presigned
                }
            };
        };
    const middlewareName = "presignInterceptMiddleware";
    const clientStack = client.middlewareStack.clone();
    clientStack.addRelativeTo(presignInterceptMiddleware, {
        name: middlewareName,
        relation: "before",
        toMiddleware: "awsAuthMiddleware",
        override: true
    });
    const handler = command.resolveMiddleware(clientStack, client.config, {});
    const { output } = await handler({
        input: command.input
    });
    const { presigned } = output;
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$core$2f$dist$2d$es$2f$submodules$2f$util$2f$util$2d$format$2d$url$2f$format$2d$url$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["formatUrl"])(presigned);
};
}),
"[project]/node_modules/@aws-sdk/s3-request-presigner/dist-es/presigner.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "S3RequestPresigner",
    ()=>S3RequestPresigner
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$SignatureV4MultiRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@aws-sdk/signature-v4-multi-region/dist-es/SignatureV4MultiRegion.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@aws-sdk/s3-request-presigner/dist-es/constants.js [app-route] (ecmascript)");
;
;
class S3RequestPresigner {
    signer;
    constructor(options){
        const resolvedOptions = {
            service: options.signingName || options.service || "s3",
            uriEscapePath: options.uriEscapePath || false,
            applyChecksum: options.applyChecksum || false,
            ...options
        };
        this.signer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$SignatureV4MultiRegion$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignatureV4MultiRegion"](resolvedOptions);
    }
    presign(requestToSign, { unsignableHeaders = new Set(), hoistableHeaders = new Set(), unhoistableHeaders = new Set(), ...options } = {}) {
        this.prepareRequest(requestToSign, {
            unsignableHeaders,
            unhoistableHeaders,
            hoistableHeaders
        });
        return this.signer.presign(requestToSign, {
            expiresIn: 900,
            unsignableHeaders,
            unhoistableHeaders,
            ...options
        });
    }
    presignWithCredentials(requestToSign, credentials, { unsignableHeaders = new Set(), hoistableHeaders = new Set(), unhoistableHeaders = new Set(), ...options } = {}) {
        this.prepareRequest(requestToSign, {
            unsignableHeaders,
            unhoistableHeaders,
            hoistableHeaders
        });
        return this.signer.presignWithCredentials(requestToSign, credentials, {
            expiresIn: 900,
            unsignableHeaders,
            unhoistableHeaders,
            ...options
        });
    }
    prepareRequest(requestToSign, { unsignableHeaders = new Set(), unhoistableHeaders = new Set(), hoistableHeaders = new Set() } = {}) {
        unsignableHeaders.add("content-type");
        Object.keys(requestToSign.headers).map((header)=>header.toLowerCase()).filter((header)=>header.startsWith("x-amz-server-side-encryption")).forEach((header)=>{
            if (!hoistableHeaders.has(header)) {
                unhoistableHeaders.add(header);
            }
        });
        requestToSign.headers[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHA256_HEADER"]] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$s3$2d$request$2d$presigner$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UNSIGNED_PAYLOAD"];
        const currentHostHeader = requestToSign.headers.host;
        const port = requestToSign.port;
        const expectedHostHeader = `${requestToSign.hostname}${requestToSign.port != null ? ":" + port : ""}`;
        if (!currentHostHeader || currentHostHeader === requestToSign.hostname && requestToSign.port != null) {
            requestToSign.headers.host = expectedHostHeader;
        }
    }
}
}),
"[project]/node_modules/@aws-sdk/signature-v4-multi-region/dist-es/SignatureV4MultiRegion.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignatureV4MultiRegion",
    ()=>SignatureV4MultiRegion
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$signature$2d$v4a$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/signature-v4a-container.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$signature$2d$v4$2d$crt$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@aws-sdk/signature-v4-multi-region/dist-es/signature-v4-crt-container.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$SignatureV4SignWithCredentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@aws-sdk/signature-v4-multi-region/dist-es/SignatureV4SignWithCredentials.js [app-route] (ecmascript)");
;
;
;
class SignatureV4MultiRegion {
    sigv4aSigner;
    sigv4Signer;
    signerOptions;
    static sigv4aDependency() {
        if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$signature$2d$v4$2d$crt$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signatureV4CrtContainer"].CrtSignerV4 === "function") {
            return "crt";
        } else if (typeof __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$signature$2d$v4a$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signatureV4aContainer"].SignatureV4a === "function") {
            return "js";
        }
        return "none";
    }
    constructor(options){
        this.sigv4Signer = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$SignatureV4SignWithCredentials$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignatureV4SignWithCredentials"](options);
        this.signerOptions = options;
    }
    async sign(requestToSign, options = {}) {
        if (options.signingRegion === "*") {
            return this.getSigv4aSigner().sign(requestToSign, options);
        }
        return this.sigv4Signer.sign(requestToSign, options);
    }
    async signWithCredentials(requestToSign, credentials, options = {}) {
        if (options.signingRegion === "*") {
            const signer = this.getSigv4aSigner();
            const CrtSignerV4 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$signature$2d$v4$2d$crt$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signatureV4CrtContainer"].CrtSignerV4;
            if (CrtSignerV4 && signer instanceof CrtSignerV4) {
                return signer.signWithCredentials(requestToSign, credentials, options);
            } else {
                throw new Error(`signWithCredentials with signingRegion '*' is only supported when using the CRT dependency @aws-sdk/signature-v4-crt. ` + `Please check whether you have installed the "@aws-sdk/signature-v4-crt" package explicitly. ` + `You must also register the package by calling [require("@aws-sdk/signature-v4-crt");] ` + `or an ESM equivalent such as [import "@aws-sdk/signature-v4-crt";]. ` + `For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
            }
        }
        return this.sigv4Signer.signWithCredentials(requestToSign, credentials, options);
    }
    async presign(originalRequest, options = {}) {
        if (options.signingRegion === "*") {
            const signer = this.getSigv4aSigner();
            const CrtSignerV4 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$signature$2d$v4$2d$crt$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signatureV4CrtContainer"].CrtSignerV4;
            if (CrtSignerV4 && signer instanceof CrtSignerV4) {
                return signer.presign(originalRequest, options);
            } else {
                throw new Error(`presign with signingRegion '*' is only supported when using the CRT dependency @aws-sdk/signature-v4-crt. ` + `Please check whether you have installed the "@aws-sdk/signature-v4-crt" package explicitly. ` + `You must also register the package by calling [require("@aws-sdk/signature-v4-crt");] ` + `or an ESM equivalent such as [import "@aws-sdk/signature-v4-crt";]. ` + `For more information please go to https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt`);
            }
        }
        return this.sigv4Signer.presign(originalRequest, options);
    }
    async presignWithCredentials(originalRequest, credentials, options = {}) {
        if (options.signingRegion === "*") {
            throw new Error("Method presignWithCredentials is not supported for [signingRegion=*].");
        }
        return this.sigv4Signer.presignWithCredentials(originalRequest, credentials, options);
    }
    getSigv4aSigner() {
        if (!this.sigv4aSigner) {
            const CrtSignerV4 = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$aws$2d$sdk$2f$signature$2d$v4$2d$multi$2d$region$2f$dist$2d$es$2f$signature$2d$v4$2d$crt$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signatureV4CrtContainer"].CrtSignerV4;
            const JsSigV4aSigner = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$signature$2d$v4a$2d$container$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["signatureV4aContainer"].SignatureV4a;
            if (this.signerOptions.runtime === "node") {
                if (!CrtSignerV4 && !JsSigV4aSigner) {
                    throw new Error("Neither CRT nor JS SigV4a implementation is available. " + "Please load either @aws-sdk/signature-v4-crt or @aws-sdk/signature-v4a. " + "For more information please go to " + "https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt");
                }
                if (CrtSignerV4 && typeof CrtSignerV4 === "function") {
                    this.sigv4aSigner = new CrtSignerV4({
                        ...this.signerOptions,
                        signingAlgorithm: 1
                    });
                } else if (JsSigV4aSigner && typeof JsSigV4aSigner === "function") {
                    this.sigv4aSigner = new JsSigV4aSigner({
                        ...this.signerOptions
                    });
                } else {
                    throw new Error("Available SigV4a implementation is not a valid constructor. " + "Please ensure you've properly imported @aws-sdk/signature-v4-crt or @aws-sdk/signature-v4a." + "For more information please go to " + "https://github.com/aws/aws-sdk-js-v3#functionality-requiring-aws-common-runtime-crt");
                }
            } else {
                if (!JsSigV4aSigner || typeof JsSigV4aSigner !== "function") {
                    throw new Error("JS SigV4a implementation is not available or not a valid constructor. " + "Please check whether you have installed the @aws-sdk/signature-v4a package explicitly. The CRT implementation is not available for browsers. " + "You must also register the package by calling [require('@aws-sdk/signature-v4a');] " + "or an ESM equivalent such as [import '@aws-sdk/signature-v4a';]. " + "For more information please go to " + "https://github.com/aws/aws-sdk-js-v3#using-javascript-non-crt-implementation-of-sigv4a");
                }
                this.sigv4aSigner = new JsSigV4aSigner({
                    ...this.signerOptions
                });
            }
        }
        return this.sigv4aSigner;
    }
}
}),
"[project]/node_modules/@aws-sdk/signature-v4-multi-region/dist-es/SignatureV4SignWithCredentials.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SESSION_TOKEN_HEADER",
    ()=>SESSION_TOKEN_HEADER,
    "SESSION_TOKEN_QUERY_PARAM",
    ()=>SESSION_TOKEN_QUERY_PARAM,
    "SignatureV4SignWithCredentials",
    ()=>SignatureV4SignWithCredentials
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/SignatureV4.js [app-route] (ecmascript)");
;
const SESSION_TOKEN_QUERY_PARAM = "X-Amz-S3session-Token";
const SESSION_TOKEN_HEADER = SESSION_TOKEN_QUERY_PARAM.toLowerCase();
class SignatureV4SignWithCredentials extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignatureV4"] {
    async signWithCredentials(requestToSign, credentials, options) {
        const credentialsWithoutSessionToken = getCredentialsWithoutSessionToken(credentials);
        requestToSign.headers[SESSION_TOKEN_HEADER] = credentials.sessionToken;
        const privateAccess = this;
        setSingleOverride(privateAccess, credentialsWithoutSessionToken);
        return privateAccess.signRequest(requestToSign, options ?? {});
    }
    async presignWithCredentials(requestToSign, credentials, options) {
        const credentialsWithoutSessionToken = getCredentialsWithoutSessionToken(credentials);
        delete requestToSign.headers[SESSION_TOKEN_HEADER];
        requestToSign.headers[SESSION_TOKEN_QUERY_PARAM] = credentials.sessionToken;
        requestToSign.query = requestToSign.query ?? {};
        requestToSign.query[SESSION_TOKEN_QUERY_PARAM] = credentials.sessionToken;
        const privateAccess = this;
        setSingleOverride(privateAccess, credentialsWithoutSessionToken);
        return this.presign(requestToSign, options);
    }
}
function getCredentialsWithoutSessionToken(credentials) {
    return {
        accessKeyId: credentials.accessKeyId,
        secretAccessKey: credentials.secretAccessKey,
        expiration: credentials.expiration
    };
}
function setSingleOverride(privateAccess, credentialsWithoutSessionToken) {
    const currentCredentialProvider = privateAccess.credentialProvider;
    privateAccess.credentialProvider = ()=>{
        privateAccess.credentialProvider = currentCredentialProvider;
        return Promise.resolve(credentialsWithoutSessionToken);
    };
}
}),
"[project]/node_modules/@aws-sdk/signature-v4-multi-region/dist-es/signature-v4-crt-container.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "signatureV4CrtContainer",
    ()=>signatureV4CrtContainer
]);
const signatureV4CrtContainer = {
    CrtSignerV4: null
};
}),
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
"[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/configLoader.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadConfig",
    ()=>loadConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/chain.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/memoize.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/fromEnv.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$fromSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/fromSharedConfigFiles.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$fromStatic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/fromStatic.js [app-route] (ecmascript)");
;
;
;
;
;
const loadConfig = ({ environmentVariableSelector, configFileSelector, default: defaultValue }, configuration = {})=>{
    const { signingName, logger } = configuration;
    const envOptions = {
        signingName,
        logger
    };
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$memoize$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["memoize"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$chain$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["chain"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$fromEnv$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromEnv"])(environmentVariableSelector, envOptions), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$fromSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromSharedConfigFiles"])(configFileSelector, configuration), (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$fromStatic$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromStatic"])(defaultValue)));
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/fromEnv.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromEnv",
    ()=>fromEnv
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/CredentialsProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/getSelectorName.js [app-route] (ecmascript)");
;
;
const fromEnv = (envVarSelector, options)=>async ()=>{
        try {
            const config = envVarSelector(process.env, options);
            if (config === undefined) {
                throw new Error();
            }
            return config;
        } catch (e) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"](e.message || `Not found in ENV: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSelectorName"])(envVarSelector.toString())}`, {
                logger: options?.logger
            });
        }
    };
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/fromSharedConfigFiles.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromSharedConfigFiles",
    ()=>fromSharedConfigFiles
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/CredentialsProviderError.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getProfileName.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$loadSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/loadSharedConfigFiles.js [app-route] (ecmascript) <locals>");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/getSelectorName.js [app-route] (ecmascript)");
;
;
;
;
const fromSharedConfigFiles = (configSelector, { preferredFile = "config", ...init } = {})=>async ()=>{
        const profile = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getProfileName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getProfileName"])(init);
        const { configFile, credentialsFile } = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$loadSharedConfigFiles$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__$3c$locals$3e$__["loadSharedConfigFiles"])(init);
        const profileFromCredentials = credentialsFile[profile] || {};
        const profileFromConfig = configFile[profile] || {};
        const mergedProfile = preferredFile === "config" ? {
            ...profileFromCredentials,
            ...profileFromConfig
        } : {
            ...profileFromConfig,
            ...profileFromCredentials
        };
        try {
            const cfgFile = preferredFile === "config" ? configFile : credentialsFile;
            const configValue = configSelector(mergedProfile, cfgFile);
            if (configValue === undefined) {
                throw new Error();
            }
            return configValue;
        } catch (e) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$CredentialsProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CredentialsProviderError"](e.message || `Not found in config files w/ profile [${profile}]: ${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$getSelectorName$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSelectorName"])(configSelector.toString())}`, {
                logger: init.logger
            });
        }
    };
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/fromStatic.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromStatic",
    ()=>fromStatic
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$fromValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/fromValue.js [app-route] (ecmascript)");
;
const isFunction = (func)=>typeof func === "function";
const fromStatic = (defaultValue)=>isFunction(defaultValue) ? async ()=>await defaultValue() : (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$fromValue$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromValue"])(defaultValue);
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/getSelectorName.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSelectorName",
    ()=>getSelectorName
]);
function getSelectorName(functionString) {
    try {
        const constants = new Set(Array.from(functionString.match(/([A-Z_]){3,}/g) ?? []));
        constants.delete("CONFIG");
        constants.delete("CONFIG_PREFIX_SEPARATOR");
        constants.delete("ENV");
        return [
            ...constants
        ].join(", ");
    } catch (ignored) {
        return functionString;
    }
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/CredentialsProviderError.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CredentialsProviderError",
    ()=>CredentialsProviderError
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/ProviderError.js [app-route] (ecmascript)");
;
class CredentialsProviderError extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProviderError"] {
    name = "CredentialsProviderError";
    constructor(message, options = true){
        super(message, options);
        Object.setPrototypeOf(this, CredentialsProviderError.prototype);
    }
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/ProviderError.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ProviderError",
    ()=>ProviderError
]);
class ProviderError extends Error {
    name = "ProviderError";
    tryNextLink;
    constructor(message, options = true){
        let logger;
        let tryNextLink = true;
        if (typeof options === "boolean") {
            logger = undefined;
            tryNextLink = options;
        } else if (options != null && typeof options === "object") {
            logger = options.logger;
            tryNextLink = options.tryNextLink ?? true;
        }
        super(message);
        this.tryNextLink = tryNextLink;
        Object.setPrototypeOf(this, ProviderError.prototype);
        logger?.debug?.(`@smithy/property-provider ${tryNextLink ? "->" : "(!)"} ${message}`);
    }
    static from(error, options = true) {
        return Object.assign(new this(error.message, options), error);
    }
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/chain.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "chain",
    ()=>chain
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/ProviderError.js [app-route] (ecmascript)");
;
const chain = (...providers)=>async ()=>{
        if (providers.length === 0) {
            throw new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$property$2d$provider$2f$ProviderError$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ProviderError"]("No providers in chain");
        }
        let lastProviderError;
        for (const provider of providers){
            try {
                const credentials = await provider();
                return credentials;
            } catch (err) {
                lastProviderError = err;
                if (err?.tryNextLink) {
                    continue;
                }
                throw err;
            }
        }
        throw lastProviderError;
    };
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/fromValue.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromValue",
    ()=>fromValue
]);
const fromValue = (staticValue)=>()=>Promise.resolve(staticValue);
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/property-provider/memoize.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "memoize",
    ()=>memoize
]);
const memoize = (provider, isExpired, requiresRefresh)=>{
    let resolved;
    let pending;
    let hasResult;
    let isConstant = false;
    const coalesceProvider = async ()=>{
        if (!pending) {
            pending = provider();
        }
        try {
            resolved = await pending;
            hasResult = true;
            isConstant = false;
        } finally{
            pending = undefined;
        }
        return resolved;
    };
    if (isExpired === undefined) {
        return async (options)=>{
            if (!hasResult || options?.forceRefresh) {
                resolved = await coalesceProvider();
            }
            return resolved;
        };
    }
    return async (options)=>{
        if (!hasResult || options?.forceRefresh) {
            resolved = await coalesceProvider();
        }
        if (isConstant) {
            return resolved;
        }
        if (requiresRefresh && !requiresRefresh(resolved)) {
            isConstant = true;
            return resolved;
        }
        if (isExpired(resolved)) {
            await coalesceProvider();
            return resolved;
        }
        return resolved;
    };
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG_PREFIX_SEPARATOR",
    ()=>CONFIG_PREFIX_SEPARATOR
]);
const CONFIG_PREFIX_SEPARATOR = ".";
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getConfigData.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getConfigData",
    ()=>getConfigData
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/types/dist-es/profile.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/constants.js [app-route] (ecmascript)");
;
;
const getConfigData = (data)=>Object.entries(data).filter(([key])=>{
        const indexOfSeparator = key.indexOf(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]);
        if (indexOfSeparator === -1) {
            return false;
        }
        return Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IniSectionType"]).includes(key.substring(0, indexOfSeparator));
    }).reduce((acc, [key, value])=>{
        const indexOfSeparator = key.indexOf(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]);
        const updatedKey = key.substring(0, indexOfSeparator) === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IniSectionType"].PROFILE ? key.substring(indexOfSeparator + 1) : key;
        acc[updatedKey] = value;
        return acc;
    }, {
        ...data.default && {
            default: data.default
        }
    });
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getConfigFilepath.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ENV_CONFIG_PATH",
    ()=>ENV_CONFIG_PATH,
    "getConfigFilepath",
    ()=>getConfigFilepath
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getHomeDir.js [app-route] (ecmascript)");
;
;
const ENV_CONFIG_PATH = "AWS_CONFIG_FILE";
const getConfigFilepath = ()=>process.env[ENV_CONFIG_PATH] || (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHomeDir"])(), ".aws", "config");
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getCredentialsFilepath.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ENV_CREDENTIALS_PATH",
    ()=>ENV_CREDENTIALS_PATH,
    "getCredentialsFilepath",
    ()=>getCredentialsFilepath
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getHomeDir.js [app-route] (ecmascript)");
;
;
const ENV_CREDENTIALS_PATH = "AWS_SHARED_CREDENTIALS_FILE";
const getCredentialsFilepath = ()=>process.env[ENV_CREDENTIALS_PATH] || (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHomeDir"])(), ".aws", "credentials");
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getHomeDir.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getHomeDir",
    ()=>getHomeDir
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:os [external] (node:os, cjs)");
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
;
;
const homeDirCache = {};
const getHomeDirCacheKey = ()=>{
    if (process && process.geteuid) {
        return `${process.geteuid()}`;
    }
    return "DEFAULT";
};
const getHomeDir = ()=>{
    const { HOME, USERPROFILE, HOMEPATH, HOMEDRIVE = `C:${__TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["sep"]}` } = process.env;
    if (HOME) return HOME;
    if (USERPROFILE) return USERPROFILE;
    if (HOMEPATH) return `${HOMEDRIVE}${HOMEPATH}`;
    const homeDirCacheKey = getHomeDirCacheKey();
    if (!homeDirCache[homeDirCacheKey]) homeDirCache[homeDirCacheKey] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$os__$5b$external$5d$__$28$node$3a$os$2c$__cjs$29$__["homedir"])();
    return homeDirCache[homeDirCacheKey];
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getProfileName.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DEFAULT_PROFILE",
    ()=>DEFAULT_PROFILE,
    "ENV_PROFILE",
    ()=>ENV_PROFILE,
    "getProfileName",
    ()=>getProfileName
]);
const ENV_PROFILE = "AWS_PROFILE";
const DEFAULT_PROFILE = "default";
const getProfileName = (init)=>init.profile || process.env[ENV_PROFILE] || DEFAULT_PROFILE;
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/loadSharedConfigFiles.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "loadSharedConfigFiles",
    ()=>loadSharedConfigFiles
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:path [external] (node:path, cjs)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getConfigData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getConfigData.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getConfigFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getConfigFilepath.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getCredentialsFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getCredentialsFilepath.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/getHomeDir.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/parseIni.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/readFile.js [app-route] (ecmascript)");
;
;
;
;
;
;
;
const swallowError = ()=>({});
;
const loadSharedConfigFiles = async (init = {})=>{
    const { filepath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getCredentialsFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCredentialsFilepath"])(), configFilepath = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getConfigFilepath$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getConfigFilepath"])() } = init;
    const homeDir = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getHomeDir$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getHomeDir"])();
    const relativeHomeDirPrefix = "~/";
    let resolvedFilepath = filepath;
    if (filepath.startsWith(relativeHomeDirPrefix)) {
        resolvedFilepath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(homeDir, filepath.slice(2));
    }
    let resolvedConfigFilepath = configFilepath;
    if (configFilepath.startsWith(relativeHomeDirPrefix)) {
        resolvedConfigFilepath = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$path__$5b$external$5d$__$28$node$3a$path$2c$__cjs$29$__["join"])(homeDir, configFilepath.slice(2));
    }
    const parsedFiles = await Promise.all([
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readFile"])(resolvedConfigFilepath, {
            ignoreCache: init.ignoreCache
        }).then(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseIni"]).then(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$getConfigData$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getConfigData"]).catch(swallowError),
        (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$readFile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["readFile"])(resolvedFilepath, {
            ignoreCache: init.ignoreCache
        }).then(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$parseIni$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseIni"]).catch(swallowError)
    ]);
    return {
        configFile: parsedFiles[0],
        credentialsFile: parsedFiles[1]
    };
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/parseIni.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseIni",
    ()=>parseIni
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/types/dist-es/profile.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/constants.js [app-route] (ecmascript)");
;
;
const prefixKeyRegex = /^([\w-]+)\s(["'])?([\w-@+.%:/]+)\2$/;
const profileNameBlockList = [
    "__proto__",
    "profile __proto__"
];
const parseIni = (iniData)=>{
    const map = {};
    let currentSection;
    let currentSubSection;
    for (const iniLine of iniData.split(/\r?\n/)){
        const trimmedLine = iniLine.split(/(^|\s)[;#]/)[0].trim();
        const isSection = trimmedLine[0] === "[" && trimmedLine[trimmedLine.length - 1] === "]";
        if (isSection) {
            currentSection = undefined;
            currentSubSection = undefined;
            const sectionName = trimmedLine.substring(1, trimmedLine.length - 1);
            const matches = prefixKeyRegex.exec(sectionName);
            if (matches) {
                const [, prefix, , name] = matches;
                if (Object.values(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$profile$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["IniSectionType"]).includes(prefix)) {
                    currentSection = [
                        prefix,
                        name
                    ].join(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]);
                }
            } else {
                currentSection = sectionName;
            }
            if (profileNameBlockList.includes(sectionName)) {
                throw new Error(`Found invalid profile name "${sectionName}"`);
            }
        } else if (currentSection) {
            const indexOfEqualsSign = trimmedLine.indexOf("=");
            if (![
                0,
                -1
            ].includes(indexOfEqualsSign)) {
                const [name, value] = [
                    trimmedLine.substring(0, indexOfEqualsSign).trim(),
                    trimmedLine.substring(indexOfEqualsSign + 1).trim()
                ];
                if (value === "") {
                    currentSubSection = name;
                } else {
                    if (currentSubSection && iniLine.trimStart() === iniLine) {
                        currentSubSection = undefined;
                    }
                    map[currentSection] = map[currentSection] || {};
                    const key = currentSubSection ? [
                        currentSubSection,
                        name
                    ].join(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]) : name;
                    map[currentSection][key] = value;
                }
            }
        }
    }
    return map;
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/readFile.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fileIntercept",
    ()=>fileIntercept,
    "filePromises",
    ()=>filePromises,
    "readFile",
    ()=>readFile
]);
var __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__ = __turbopack_context__.i("[externals]/node:fs/promises [external] (node:fs/promises, cjs)");
;
const filePromises = {};
const fileIntercept = {};
const readFile = (path, options)=>{
    if (fileIntercept[path] !== undefined) {
        return fileIntercept[path];
    }
    if (!filePromises[path] || options?.ignoreCache) {
        filePromises[path] = (0, __TURBOPACK__imported__module__$5b$externals$5d2f$node$3a$fs$2f$promises__$5b$external$5d$__$28$node$3a$fs$2f$promises$2c$__cjs$29$__["readFile"])(path, "utf8");
    }
    return filePromises[path];
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/util-config-provider/booleanSelector.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "booleanSelector",
    ()=>booleanSelector
]);
const booleanSelector = (obj, key, type)=>{
    if (!(key in obj)) return undefined;
    if (obj[key] === "true") return true;
    if (obj[key] === "false") return false;
    throw new Error(`Cannot load ${type} "${key}". Expected "true" or "false", got ${obj[key]}.`);
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/config/util-config-provider/types.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SelectorType",
    ()=>SelectorType
]);
var SelectorType;
(function(SelectorType) {
    SelectorType["ENV"] = "env";
    SelectorType["CONFIG"] = "shared config entry";
})(SelectorType || (SelectorType = {}));
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/index.js [app-route] (ecmascript) <locals>", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "endpointMiddleware",
    ()=>endpointMiddleware,
    "getEndpointFromInstructions",
    ()=>getEndpointFromInstructions,
    "getEndpointPlugin",
    ()=>getEndpointPlugin,
    "resolveEndpointConfig",
    ()=>resolveEndpointConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getEndpointFromConfig.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromInstructions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getEndpointFromInstructions.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$endpointMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/endpointMiddleware.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$getEndpointPlugin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/getEndpointPlugin.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$resolveEndpointConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/resolveEndpointConfig.js [app-route] (ecmascript)");
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
const getEndpointFromInstructions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromInstructions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bindGetEndpointFromInstructions"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointFromConfig"]);
const resolveEndpointConfig = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$resolveEndpointConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bindResolveEndpointConfig"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointFromConfig"]);
const endpointMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$endpointMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bindEndpointMiddleware"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointFromConfig"]);
const getEndpointPlugin = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$getEndpointPlugin$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bindGetEndpointPlugin"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointFromConfig"]);
;
;
;
;
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/createConfigValueProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "createConfigValueProvider",
    ()=>createConfigValueProvider
]);
const createConfigValueProvider = (configKey, canonicalEndpointParamKey, config, isClientContextParam = false)=>{
    const configProvider = async ()=>{
        let configValue;
        if (isClientContextParam) {
            const clientContextParams = config.clientContextParams;
            const nestedValue = clientContextParams?.[configKey];
            configValue = nestedValue ?? config[configKey] ?? config[canonicalEndpointParamKey];
        } else {
            configValue = config[configKey] ?? config[canonicalEndpointParamKey];
        }
        if (typeof configValue === "function") {
            return configValue();
        }
        return configValue;
    };
    if (configKey === "credentialScope" || canonicalEndpointParamKey === "CredentialScope") {
        return async ()=>{
            const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
            const configValue = credentials?.credentialScope ?? credentials?.CredentialScope;
            return configValue;
        };
    }
    if (configKey === "accountId" || canonicalEndpointParamKey === "AccountId") {
        return async ()=>{
            const credentials = typeof config.credentials === "function" ? await config.credentials() : config.credentials;
            const configValue = credentials?.accountId ?? credentials?.AccountId;
            return configValue;
        };
    }
    if (configKey === "endpoint" || canonicalEndpointParamKey === "endpoint") {
        return async ()=>{
            if (config.isCustomEndpoint === false) {
                return undefined;
            }
            const endpoint = await configProvider();
            if (endpoint && typeof endpoint === "object") {
                if ("url" in endpoint) {
                    return endpoint.url.href;
                }
                if ("hostname" in endpoint) {
                    const { protocol, hostname, port, path } = endpoint;
                    return `${protocol}//${hostname}${port ? ":" + port : ""}${path}`;
                }
            }
            return endpoint;
        };
    }
    return configProvider;
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getEndpointFromConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getEndpointFromConfig",
    ()=>getEndpointFromConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/node-config-provider/configLoader.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointUrlConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getEndpointUrlConfig.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getIgnoreConfiguredEndpointUrls$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getIgnoreConfiguredEndpointUrls.js [app-route] (ecmascript)");
;
;
;
const getEndpointFromConfig = async (serviceId)=>{
    const ignore = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getIgnoreConfiguredEndpointUrls$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ignoreConfiguredEndpointUrlsConfigSelectors"])();
    if (ignore) {
        return undefined;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$node$2d$config$2d$provider$2f$configLoader$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["loadConfig"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointUrlConfig$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getEndpointUrlConfig"])(serviceId ?? ""))();
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getEndpointFromInstructions.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bindGetEndpointFromInstructions",
    ()=>bindGetEndpointFromInstructions,
    "resolveParams",
    ()=>resolveParams
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$service$2d$customizations$2f$s3$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/service-customizations/s3.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$createConfigValueProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/createConfigValueProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/toEndpointV1.js [app-route] (ecmascript)");
;
;
;
function bindGetEndpointFromInstructions(getEndpointFromConfig) {
    return async (commandInput, instructionsSupplier, clientConfig, context)=>{
        if (!clientConfig.isCustomEndpoint && !clientConfig.ignoreConfiguredEndpointUrls) {
            let endpointFromConfig;
            if (clientConfig.serviceConfiguredEndpoint) {
                endpointFromConfig = await clientConfig.serviceConfiguredEndpoint();
            } else {
                endpointFromConfig = await getEndpointFromConfig(clientConfig.serviceId);
            }
            if (endpointFromConfig) {
                clientConfig.endpoint = ()=>Promise.resolve((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toEndpointV1"])(endpointFromConfig));
                clientConfig.isCustomEndpoint = true;
                context?.logger?.debug?.(`@smithy/core/endpoints - resolved endpoint from config: ${endpointFromConfig}`);
            }
        }
        const endpointParams = await resolveParams(commandInput, instructionsSupplier, clientConfig);
        if (typeof clientConfig.endpointProvider !== "function") {
            throw new Error("config.endpointProvider is not set.");
        }
        const endpoint = clientConfig.endpointProvider(endpointParams, context);
        if (clientConfig.isCustomEndpoint && clientConfig.endpoint) {
            const customEndpoint = await clientConfig.endpoint();
            if (customEndpoint?.headers) {
                endpoint.headers ??= {};
                for (const [name, value] of Object.entries(customEndpoint.headers)){
                    endpoint.headers[name] = Array.isArray(value) ? value : [
                        value
                    ];
                }
            }
        }
        return endpoint;
    };
}
const resolveParams = async (commandInput, instructionsSupplier, clientConfig)=>{
    const endpointParams = {};
    const instructions = instructionsSupplier?.getEndpointParameterInstructions?.() || {};
    for (const [name, instruction] of Object.entries(instructions)){
        switch(instruction.type){
            case "staticContextParams":
                endpointParams[name] = instruction.value;
                break;
            case "contextParams":
                endpointParams[name] = commandInput[instruction.name];
                break;
            case "clientContextParams":
            case "builtInParams":
                endpointParams[name] = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$createConfigValueProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createConfigValueProvider"])(instruction.name, name, clientConfig, instruction.type !== "builtInParams")();
                break;
            case "operationContextParams":
                endpointParams[name] = instruction.get(commandInput);
                break;
            default:
                throw new Error("Unrecognized endpoint parameter instruction: " + JSON.stringify(instruction));
        }
    }
    if (Object.keys(instructions).length === 0) {
        Object.assign(endpointParams, clientConfig);
    }
    if (String(clientConfig.serviceId).toLowerCase() === "s3") {
        await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$service$2d$customizations$2f$s3$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["resolveParamsForS3"])(endpointParams);
    }
    return endpointParams;
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getEndpointUrlConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG_ENDPOINT_URL",
    ()=>CONFIG_ENDPOINT_URL,
    "ENV_ENDPOINT_URL",
    ()=>ENV_ENDPOINT_URL,
    "getEndpointUrlConfig",
    ()=>getEndpointUrlConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/shared-ini-file-loader/constants.js [app-route] (ecmascript)");
;
const ENV_ENDPOINT_URL = "AWS_ENDPOINT_URL";
const CONFIG_ENDPOINT_URL = "endpoint_url";
const getEndpointUrlConfig = (serviceId)=>({
        environmentVariableSelector: (env)=>{
            const serviceSuffixParts = serviceId.split(" ").map((w)=>w.toUpperCase());
            const serviceEndpointUrl = env[[
                ENV_ENDPOINT_URL,
                ...serviceSuffixParts
            ].join("_")];
            if (serviceEndpointUrl) return serviceEndpointUrl;
            const endpointUrl = env[ENV_ENDPOINT_URL];
            if (endpointUrl) return endpointUrl;
            return undefined;
        },
        configFileSelector: (profile, config)=>{
            if (profile.services) {
                const servicesSectionKey = [
                    "services",
                    profile.services
                ].join(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"]);
                if (!config || !config[servicesSectionKey]) {
                    throw new Error(`The services section "${profile.services}" specified in the profile is not present in the shared configuration file.`);
                }
                const servicesSection = config[servicesSectionKey];
                const servicePrefixParts = serviceId.split(" ").map((w)=>w.toLowerCase());
                const endpointUrl = servicesSection[[
                    servicePrefixParts.join("_"),
                    CONFIG_ENDPOINT_URL
                ].join(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$shared$2d$ini$2d$file$2d$loader$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CONFIG_PREFIX_SEPARATOR"])];
                if (endpointUrl) return endpointUrl;
            }
            const endpointUrl = profile[CONFIG_ENDPOINT_URL];
            if (endpointUrl) return endpointUrl;
            return undefined;
        },
        default: undefined
    });
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getIgnoreConfiguredEndpointUrls.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS",
    ()=>CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS,
    "ENV_IGNORE_CONFIGURED_ENDPOINT_URLS",
    ()=>ENV_IGNORE_CONFIGURED_ENDPOINT_URLS,
    "ignoreConfiguredEndpointUrlsConfigSelectors",
    ()=>ignoreConfiguredEndpointUrlsConfigSelectors
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$util$2d$config$2d$provider$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/util-config-provider/booleanSelector.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$util$2d$config$2d$provider$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/config/util-config-provider/types.js [app-route] (ecmascript)");
;
const ENV_IGNORE_CONFIGURED_ENDPOINT_URLS = "AWS_IGNORE_CONFIGURED_ENDPOINT_URLS";
const CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS = "ignore_configured_endpoint_urls";
const ignoreConfiguredEndpointUrlsConfigSelectors = {
    environmentVariableSelector: (env)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$util$2d$config$2d$provider$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["booleanSelector"])(env, ENV_IGNORE_CONFIGURED_ENDPOINT_URLS, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$util$2d$config$2d$provider$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SelectorType"].ENV),
    configFileSelector: (profile)=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$util$2d$config$2d$provider$2f$booleanSelector$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["booleanSelector"])(profile, CONFIG_IGNORE_CONFIGURED_ENDPOINT_URLS, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$config$2f$util$2d$config$2d$provider$2f$types$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SelectorType"].CONFIG),
    default: false
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/endpointMiddleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bindEndpointMiddleware",
    ()=>bindEndpointMiddleware
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$getSmithyContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/getSmithyContext.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromInstructions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/adaptors/getEndpointFromInstructions.js [app-route] (ecmascript)");
;
;
function setFeature(context, feature, value) {
    if (!context.__smithy_context) {
        context.__smithy_context = {
            features: {}
        };
    } else if (!context.__smithy_context.features) {
        context.__smithy_context.features = {};
    }
    context.__smithy_context.features[feature] = value;
}
function bindEndpointMiddleware(getEndpointFromConfig) {
    const getEndpointFromInstructions = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$adaptors$2f$getEndpointFromInstructions$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bindGetEndpointFromInstructions"])(getEndpointFromConfig);
    return ({ config, instructions })=>{
        return (next, context)=>async (args)=>{
                if (config.isCustomEndpoint) {
                    setFeature(context, "ENDPOINT_OVERRIDE", "N");
                }
                const endpoint = await getEndpointFromInstructions(args.input, {
                    getEndpointParameterInstructions () {
                        return instructions;
                    }
                }, {
                    ...config
                }, context);
                context.endpointV2 = endpoint;
                context.authSchemes = endpoint.properties?.authSchemes;
                const authScheme = context.authSchemes?.[0];
                if (authScheme) {
                    context["signing_region"] = authScheme.signingRegion;
                    context["signing_service"] = authScheme.signingName;
                    const smithyContext = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$getSmithyContext$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSmithyContext"])(context);
                    const httpAuthOption = smithyContext?.selectedHttpAuthScheme?.httpAuthOption;
                    if (httpAuthOption) {
                        httpAuthOption.signingProperties = Object.assign(httpAuthOption.signingProperties || {}, {
                            signing_region: authScheme.signingRegion,
                            signingRegion: authScheme.signingRegion,
                            signing_service: authScheme.signingName,
                            signingName: authScheme.signingName,
                            signingRegionSet: authScheme.signingRegionSet
                        }, authScheme.properties);
                    }
                }
                return next({
                    ...args
                });
            };
    };
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/getEndpointPlugin.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bindGetEndpointPlugin",
    ()=>bindGetEndpointPlugin,
    "endpointMiddlewareOptions",
    ()=>endpointMiddlewareOptions
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$endpointMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/endpointMiddleware.js [app-route] (ecmascript)");
;
const serializerMiddlewareOption = {
    name: "serializerMiddleware",
    step: "serialize",
    tags: [
        "SERIALIZER"
    ],
    override: true
};
const endpointMiddlewareOptions = {
    step: "serialize",
    tags: [
        "ENDPOINT_PARAMETERS",
        "ENDPOINT_V2",
        "ENDPOINT"
    ],
    name: "endpointV2Middleware",
    override: true,
    relation: "before",
    toMiddleware: serializerMiddlewareOption.name
};
function bindGetEndpointPlugin(getEndpointFromConfig) {
    const endpointMiddleware = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$endpoints$2f$middleware$2d$endpoint$2f$endpointMiddleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["bindEndpointMiddleware"])(getEndpointFromConfig);
    return (config, instructions)=>({
            applyToStack: (clientStack)=>{
                clientStack.addRelativeTo(endpointMiddleware({
                    config,
                    instructions
                }), endpointMiddlewareOptions);
            }
        });
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/resolveEndpointConfig.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "bindResolveEndpointConfig",
    ()=>bindResolveEndpointConfig
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/normalizeProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/toEndpointV1.js [app-route] (ecmascript)");
;
;
function bindResolveEndpointConfig(getEndpointFromConfig) {
    return (input)=>{
        const tls = input.tls ?? true;
        const { endpoint, useDualstackEndpoint, useFipsEndpoint } = input;
        const customEndpointProvider = endpoint != null ? async ()=>(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$toEndpointV1$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toEndpointV1"])(await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(endpoint)()) : undefined;
        const isCustomEndpoint = !!endpoint;
        const resolvedConfig = Object.assign(input, {
            endpoint: customEndpointProvider,
            tls,
            isCustomEndpoint,
            useDualstackEndpoint: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(useDualstackEndpoint ?? false),
            useFipsEndpoint: (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(useFipsEndpoint ?? false),
            ignoreConfiguredEndpointUrls: !!input.ignoreConfiguredEndpointUrls
        });
        let configuredEndpointPromise = undefined;
        resolvedConfig.serviceConfiguredEndpoint = async ()=>{
            if (input.serviceId && !configuredEndpointPromise) {
                configuredEndpointPromise = getEndpointFromConfig(input.serviceId);
            }
            return configuredEndpointPromise;
        };
        return resolvedConfig;
    };
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/endpoints/middleware-endpoint/service-customizations/s3.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "DOT_PATTERN",
    ()=>DOT_PATTERN,
    "S3_HOSTNAME_PATTERN",
    ()=>S3_HOSTNAME_PATTERN,
    "isArnBucketName",
    ()=>isArnBucketName,
    "isDnsCompatibleBucketName",
    ()=>isDnsCompatibleBucketName,
    "resolveParamsForS3",
    ()=>resolveParamsForS3
]);
const resolveParamsForS3 = async (endpointParams)=>{
    const bucket = endpointParams?.Bucket || "";
    if (typeof endpointParams.Bucket === "string") {
        endpointParams.Bucket = bucket.replace(/#/g, encodeURIComponent("#")).replace(/\?/g, encodeURIComponent("?"));
    }
    if (isArnBucketName(bucket)) {
        if (endpointParams.ForcePathStyle === true) {
            throw new Error("Path-style addressing cannot be used with ARN buckets");
        }
    } else if (!isDnsCompatibleBucketName(bucket) || bucket.indexOf(".") !== -1 && !String(endpointParams.Endpoint).startsWith("http:") || bucket.toLowerCase() !== bucket || bucket.length < 3) {
        endpointParams.ForcePathStyle = true;
    }
    if (endpointParams.DisableMultiRegionAccessPoints) {
        endpointParams.disableMultiRegionAccessPoints = true;
        endpointParams.DisableMRAP = true;
    }
    return endpointParams;
};
const DOMAIN_PATTERN = /^[a-z0-9][a-z0-9.-]{1,61}[a-z0-9]$/;
const IP_ADDRESS_PATTERN = /(\d+\.){3}\d+/;
const DOTS_PATTERN = /\.\./;
const DOT_PATTERN = /\./;
const S3_HOSTNAME_PATTERN = /^(.+\.)?s3(-fips)?(\.dualstack)?[.-]([a-z0-9-]+)\./;
const isDnsCompatibleBucketName = (bucketName)=>DOMAIN_PATTERN.test(bucketName) && !IP_ADDRESS_PATTERN.test(bucketName) && !DOTS_PATTERN.test(bucketName);
const isArnBucketName = (bucketName)=>{
    const [arn, partition, service, , , bucket] = bucketName.split(":");
    const isArn = arn === "arn" && bucketName.split(":").length >= 6;
    const isValidArn = Boolean(isArn && partition && service && bucket);
    if (isArn && !isValidArn) {
        throw new Error(`Invalid ARN: ${bucketName} was an invalid ARN.`);
    }
    return isValidArn;
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/protocols/querystring-builder/buildQueryString.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "buildQueryString",
    ()=>buildQueryString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/protocols/util-uri-escape/escape-uri.js [app-route] (ecmascript)");
;
function buildQueryString(query) {
    const parts = [];
    for (let key of Object.keys(query).sort()){
        const value = query[key];
        key = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(key);
        if (Array.isArray(value)) {
            for(let i = 0, iLen = value.length; i < iLen; i++){
                parts.push(`${key}=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value[i])}`);
            }
        } else {
            let qsEntry = key;
            if (value || typeof value === "string") {
                qsEntry += `=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value)}`;
            }
            parts.push(qsEntry);
        }
    }
    return parts.join("&");
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/protocols/util-uri-escape/escape-uri.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "escapeUri",
    ()=>escapeUri
]);
const escapeUri = (uri)=>encodeURIComponent(uri).replace(/[!'()*]/g, hexEncode);
const hexEncode = (c)=>`%${c.charCodeAt(0).toString(16).toUpperCase()}`;
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/serde/is-array-buffer/is-array-buffer.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "isArrayBuffer",
    ()=>isArrayBuffer
]);
const isArrayBuffer = (arg)=>typeof ArrayBuffer === "function" && arg instanceof ArrayBuffer || Object.prototype.toString.call(arg) === "[object ArrayBuffer]";
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-buffer-from/buffer-from.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromArrayBuffer",
    ()=>fromArrayBuffer,
    "fromString",
    ()=>fromString
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$is$2d$array$2d$buffer$2f$is$2d$array$2d$buffer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/is-array-buffer/is-array-buffer.js [app-route] (ecmascript)");
;
const fromArrayBuffer = (input, offset = 0, length = input.byteLength - offset)=>{
    if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$is$2d$array$2d$buffer$2f$is$2d$array$2d$buffer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isArrayBuffer"])(input)) {
        throw new TypeError(`The "input" argument must be ArrayBuffer. Received type ${typeof input} (${input})`);
    }
    return Buffer.from(input, offset, length);
};
const fromString = (input, encoding)=>{
    if (typeof input !== "string") {
        throw new TypeError(`The "input" argument must be of type string. Received type ${typeof input} (${input})`);
    }
    return encoding ? Buffer.from(input, encoding) : Buffer.from(input);
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-hex-encoding/hex-encoding.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromHex",
    ()=>fromHex,
    "toHex",
    ()=>toHex
]);
const SHORT_TO_HEX = {};
const HEX_TO_SHORT = {};
for(let i = 0; i < 256; i++){
    let encodedByte = i.toString(16).toLowerCase();
    if (encodedByte.length === 1) {
        encodedByte = `0${encodedByte}`;
    }
    SHORT_TO_HEX[i] = encodedByte;
    HEX_TO_SHORT[encodedByte] = i;
}
function fromHex(encoded) {
    if (encoded.length % 2 !== 0) {
        throw new Error("Hex encoded strings must have an even number length");
    }
    const out = new Uint8Array(encoded.length / 2);
    for(let i = 0; i < encoded.length; i += 2){
        const encodedByte = encoded.slice(i, i + 2).toLowerCase();
        if (encodedByte in HEX_TO_SHORT) {
            out[i / 2] = HEX_TO_SHORT[encodedByte];
        } else {
            throw new Error(`Cannot decode unrecognized sequence ${encodedByte} as hexadecimal`);
        }
    }
    return out;
}
function toHex(bytes) {
    let out = "";
    for(let i = 0; i < bytes.byteLength; i++){
        out += SHORT_TO_HEX[bytes[i]];
    }
    return out;
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/fromUtf8.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "fromUtf8",
    ()=>fromUtf8
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$buffer$2d$from$2f$buffer$2d$from$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-buffer-from/buffer-from.js [app-route] (ecmascript)");
;
const fromUtf8 = (input)=>{
    const buf = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$buffer$2d$from$2f$buffer$2d$from$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromString"])(input, "utf8");
    return new Uint8Array(buf.buffer, buf.byteOffset, buf.byteLength / Uint8Array.BYTES_PER_ELEMENT);
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/toUint8Array.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toUint8Array",
    ()=>toUint8Array
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/fromUtf8.js [app-route] (ecmascript)");
;
const toUint8Array = (data)=>{
    if (data instanceof Uint8Array) {
        return data;
    }
    if (typeof data === "string") {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(data);
    }
    if (ArrayBuffer.isView(data)) {
        return new Uint8Array(data.buffer, data.byteOffset, data.byteLength / Uint8Array.BYTES_PER_ELEMENT);
    }
    return new Uint8Array(data);
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/transport/getSmithyContext.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getSmithyContext",
    ()=>getSmithyContext
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/types/dist-es/middleware.js [app-route] (ecmascript)");
;
const getSmithyContext = (context)=>context[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SMITHY_CONTEXT_KEY"]] || (context[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$types$2f$dist$2d$es$2f$middleware$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SMITHY_CONTEXT_KEY"]] = {});
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/transport/httpRequest.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HttpRequest",
    ()=>HttpRequest
]);
class HttpRequest {
    method;
    protocol;
    hostname;
    port;
    path;
    query;
    headers;
    username;
    password;
    fragment;
    body;
    constructor(options){
        this.method = options.method || "GET";
        this.hostname = options.hostname || "localhost";
        this.port = options.port;
        this.query = options.query || {};
        this.headers = options.headers || {};
        this.body = options.body;
        this.protocol = options.protocol ? options.protocol.slice(-1) !== ":" ? `${options.protocol}:` : options.protocol : "https:";
        this.path = options.path ? options.path.charAt(0) !== "/" ? `/${options.path}` : options.path : "/";
        this.username = options.username;
        this.password = options.password;
        this.fragment = options.fragment;
    }
    static clone(request) {
        const cloned = new HttpRequest({
            ...request,
            headers: {
                ...request.headers
            }
        });
        if (cloned.query) {
            cloned.query = cloneQuery(cloned.query);
        }
        return cloned;
    }
    static isInstance(request) {
        if (!request) {
            return false;
        }
        const req = request;
        return "method" in req && "protocol" in req && "hostname" in req && "path" in req && typeof req["query"] === "object" && typeof req["headers"] === "object";
    }
    clone() {
        return HttpRequest.clone(this);
    }
}
function cloneQuery(query) {
    return Object.keys(query).reduce((carry, paramName)=>{
        const param = query[paramName];
        return {
            ...carry,
            [paramName]: Array.isArray(param) ? [
                ...param
            ] : param
        };
    }, {});
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/transport/normalizeProvider.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "normalizeProvider",
    ()=>normalizeProvider
]);
const normalizeProvider = (input)=>{
    if (typeof input === "function") return input;
    const promisified = Promise.resolve(input);
    return ()=>promisified;
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/transport/parseQueryString.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseQueryString",
    ()=>parseQueryString
]);
function parseQueryString(querystring) {
    const query = {};
    querystring = querystring.replace(/^\?/, "");
    if (querystring) {
        for (const pair of querystring.split("&")){
            let [key, value = null] = pair.split("=");
            key = decodeURIComponent(key);
            if (value) {
                value = decodeURIComponent(value);
            }
            if (!(key in query)) {
                query[key] = value;
            } else if (Array.isArray(query[key])) {
                query[key].push(value);
            } else {
                query[key] = [
                    query[key],
                    value
                ];
            }
        }
    }
    return query;
}
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/transport/parseUrl.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "parseUrl",
    ()=>parseUrl
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$parseQueryString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/parseQueryString.js [app-route] (ecmascript)");
;
const parseUrl = (url)=>{
    if (typeof url === "string") {
        return parseUrl(new URL(url));
    }
    const { hostname, pathname, port, protocol, search } = url;
    let query;
    if (search) {
        query = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$parseQueryString$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseQueryString"])(search);
    }
    return {
        hostname,
        port: port ? parseInt(port) : undefined,
        protocol,
        path: pathname,
        query
    };
};
}),
"[project]/node_modules/@smithy/core/dist-es/submodules/transport/toEndpointV1.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "toEndpointV1",
    ()=>toEndpointV1
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$parseUrl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/parseUrl.js [app-route] (ecmascript)");
;
const toEndpointV1 = (endpoint)=>{
    if (typeof endpoint === "object") {
        if ("url" in endpoint) {
            const v1Endpoint = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$parseUrl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseUrl"])(endpoint.url);
            if (endpoint.headers) {
                v1Endpoint.headers = {};
                for(const name in endpoint.headers){
                    v1Endpoint.headers[name.toLowerCase()] = endpoint.headers[name].join(", ");
                }
            }
            return v1Endpoint;
        }
        return endpoint;
    }
    return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$parseUrl$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["parseUrl"])(endpoint);
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/HeaderFormatter.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "HeaderFormatter",
    ()=>HeaderFormatter,
    "Int64",
    ()=>Int64
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-hex-encoding/hex-encoding.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/fromUtf8.js [app-route] (ecmascript)");
;
class HeaderFormatter {
    format(headers) {
        const chunks = [];
        for (const headerName of Object.keys(headers)){
            const bytes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(headerName);
            chunks.push(Uint8Array.from([
                bytes.byteLength
            ]), bytes, this.formatHeaderValue(headers[headerName]));
        }
        const out = new Uint8Array(chunks.reduce((carry, bytes)=>carry + bytes.byteLength, 0));
        let position = 0;
        for (const chunk of chunks){
            out.set(chunk, position);
            position += chunk.byteLength;
        }
        return out;
    }
    formatHeaderValue(header) {
        switch(header.type){
            case "boolean":
                return Uint8Array.from([
                    header.value ? HEADER_VALUE_TYPE.boolTrue : HEADER_VALUE_TYPE.boolFalse
                ]);
            case "byte":
                return Uint8Array.from([
                    HEADER_VALUE_TYPE.byte,
                    header.value
                ]);
            case "short":
                const shortView = new DataView(new ArrayBuffer(3));
                shortView.setUint8(0, HEADER_VALUE_TYPE.short);
                shortView.setInt16(1, header.value, false);
                return new Uint8Array(shortView.buffer);
            case "integer":
                const intView = new DataView(new ArrayBuffer(5));
                intView.setUint8(0, HEADER_VALUE_TYPE.integer);
                intView.setInt32(1, header.value, false);
                return new Uint8Array(intView.buffer);
            case "long":
                const longBytes = new Uint8Array(9);
                longBytes[0] = HEADER_VALUE_TYPE.long;
                longBytes.set(header.value.bytes, 1);
                return longBytes;
            case "binary":
                const binView = new DataView(new ArrayBuffer(3 + header.value.byteLength));
                binView.setUint8(0, HEADER_VALUE_TYPE.byteArray);
                binView.setUint16(1, header.value.byteLength, false);
                const binBytes = new Uint8Array(binView.buffer);
                binBytes.set(header.value, 3);
                return binBytes;
            case "string":
                const utf8Bytes = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$fromUtf8$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromUtf8"])(header.value);
                const strView = new DataView(new ArrayBuffer(3 + utf8Bytes.byteLength));
                strView.setUint8(0, HEADER_VALUE_TYPE.string);
                strView.setUint16(1, utf8Bytes.byteLength, false);
                const strBytes = new Uint8Array(strView.buffer);
                strBytes.set(utf8Bytes, 3);
                return strBytes;
            case "timestamp":
                const tsBytes = new Uint8Array(9);
                tsBytes[0] = HEADER_VALUE_TYPE.timestamp;
                tsBytes.set(Int64.fromNumber(header.value.valueOf()).bytes, 1);
                return tsBytes;
            case "uuid":
                if (!UUID_PATTERN.test(header.value)) {
                    throw new Error(`Invalid UUID received: ${header.value}`);
                }
                const uuidBytes = new Uint8Array(17);
                uuidBytes[0] = HEADER_VALUE_TYPE.uuid;
                uuidBytes.set((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["fromHex"])(header.value.replace(/-/g, "")), 1);
                return uuidBytes;
        }
    }
}
var HEADER_VALUE_TYPE;
(function(HEADER_VALUE_TYPE) {
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["boolTrue"] = 0] = "boolTrue";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["boolFalse"] = 1] = "boolFalse";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["byte"] = 2] = "byte";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["short"] = 3] = "short";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["integer"] = 4] = "integer";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["long"] = 5] = "long";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["byteArray"] = 6] = "byteArray";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["string"] = 7] = "string";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["timestamp"] = 8] = "timestamp";
    HEADER_VALUE_TYPE[HEADER_VALUE_TYPE["uuid"] = 9] = "uuid";
})(HEADER_VALUE_TYPE || (HEADER_VALUE_TYPE = {}));
const UUID_PATTERN = /^[a-f0-9]{8}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{4}-[a-f0-9]{12}$/;
class Int64 {
    bytes;
    constructor(bytes){
        this.bytes = bytes;
        if (bytes.byteLength !== 8) {
            throw new Error("Int64 buffers must be exactly 8 bytes");
        }
    }
    static fromNumber(number) {
        if (number > 9_223_372_036_854_775_807 || number < -9_223_372_036_854_775_808) {
            throw new Error(`${number} is too large (or, if negative, too small) to represent as an Int64`);
        }
        const bytes = new Uint8Array(8);
        for(let i = 7, remaining = Math.abs(Math.round(number)); i > -1 && remaining > 0; i--, remaining /= 256){
            bytes[i] = remaining;
        }
        if (number < 0) {
            negate(bytes);
        }
        return new Int64(bytes);
    }
    valueOf() {
        const bytes = this.bytes.slice(0);
        const negative = bytes[0] & 0b10000000;
        if (negative) {
            negate(bytes);
        }
        return parseInt((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(bytes), 16) * (negative ? -1 : 1);
    }
    toString() {
        return String(this.valueOf());
    }
}
function negate(bytes) {
    for(let i = 0; i < 8; i++){
        bytes[i] ^= 0xff;
    }
    for(let i = 7; i > -1; i--){
        bytes[i]++;
        if (bytes[i] !== 0) break;
    }
}
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/SignatureV4.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignatureV4",
    ()=>SignatureV4
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-hex-encoding/hex-encoding.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$HeaderFormatter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/HeaderFormatter.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4Base$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/SignatureV4Base.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/credentialDerivation.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/getCanonicalHeaders.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/getPayloadHash.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$headerUtil$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/headerUtil.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$moveHeadersToQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/moveHeadersToQuery.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$prepareRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/prepareRequest.js [app-route] (ecmascript)");
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
class SignatureV4 extends __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$SignatureV4Base$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SignatureV4Base"] {
    headerFormatter = new __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$HeaderFormatter$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HeaderFormatter"]();
    constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath = true }){
        super({
            applyChecksum,
            credentials,
            region,
            service,
            sha256,
            uriEscapePath
        });
    }
    async presign(originalRequest, options = {}) {
        const { signingDate = new Date(), expiresIn = 3600, unsignableHeaders, unhoistableHeaders, signableHeaders, hoistableHeaders, signingRegion, signingService } = options;
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const { longDate, shortDate } = this.formatDate(signingDate);
        if (expiresIn > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAX_PRESIGNED_TTL"]) {
            return Promise.reject("Signature version 4 presigned URLs" + " must have an expiration date less than one week in" + " the future");
        }
        const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createScope"])(shortDate, region, signingService ?? this.service);
        const request = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$moveHeadersToQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["moveHeadersToQuery"])((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$prepareRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prepareRequest"])(originalRequest), {
            unhoistableHeaders,
            hoistableHeaders
        });
        if (credentials.sessionToken) {
            request.query[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TOKEN_QUERY_PARAM"]] = credentials.sessionToken;
        }
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_QUERY_PARAM"]] = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_IDENTIFIER"];
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["CREDENTIAL_QUERY_PARAM"]] = `${credentials.accessKeyId}/${scope}`;
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AMZ_DATE_QUERY_PARAM"]] = longDate;
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EXPIRES_QUERY_PARAM"]] = expiresIn.toString(10);
        const canonicalHeaders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCanonicalHeaders"])(request, unsignableHeaders, signableHeaders);
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SIGNED_HEADERS_QUERY_PARAM"]] = this.getCanonicalHeaderList(canonicalHeaders);
        request.query[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SIGNATURE_QUERY_PARAM"]] = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate, signingService), this.createCanonicalRequest(request, canonicalHeaders, await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayloadHash"])(originalRequest, this.sha256)));
        return request;
    }
    async sign(toSign, options) {
        if (typeof toSign === "string") {
            return this.signString(toSign, options);
        } else if (toSign.headers && toSign.payload) {
            return this.signEvent(toSign, options);
        } else if (toSign.message) {
            return this.signMessage(toSign, options);
        } else {
            return this.signRequest(toSign, options);
        }
    }
    async signEvent({ headers, payload }, { signingDate = new Date(), priorSignature, signingRegion, signingService, eventStreamCredentials }) {
        const region = signingRegion ?? await this.regionProvider();
        const { shortDate, longDate } = this.formatDate(signingDate);
        const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createScope"])(shortDate, region, signingService ?? this.service);
        const hashedPayload = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayloadHash"])({
            headers: {},
            body: payload
        }, this.sha256);
        const hash = new this.sha256();
        hash.update(headers);
        const hashedHeaders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hash.digest());
        const stringToSign = [
            __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["EVENT_ALGORITHM_IDENTIFIER"],
            longDate,
            scope,
            priorSignature,
            hashedHeaders,
            hashedPayload
        ].join("\n");
        return this.signString(stringToSign, {
            signingDate,
            signingRegion: region,
            signingService,
            eventStreamCredentials
        });
    }
    async signMessage(signableMessage, { signingDate = new Date(), signingRegion, signingService, eventStreamCredentials }) {
        const promise = this.signEvent({
            headers: this.headerFormatter.format(signableMessage.message.headers),
            payload: signableMessage.message.body
        }, {
            signingDate,
            signingRegion,
            signingService,
            priorSignature: signableMessage.priorSignature,
            eventStreamCredentials
        });
        return promise.then((signature)=>{
            return {
                message: signableMessage.message,
                signature
            };
        });
    }
    async signString(stringToSign, { signingDate = new Date(), signingRegion, signingService, eventStreamCredentials } = {}) {
        const credentials = eventStreamCredentials ?? await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const { shortDate } = this.formatDate(signingDate);
        const hash = new this.sha256(await this.getSigningKey(credentials, region, shortDate, signingService));
        hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(stringToSign));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hash.digest());
    }
    async signRequest(requestToSign, { signingDate = new Date(), signableHeaders, unsignableHeaders, signingRegion, signingService } = {}) {
        const credentials = await this.credentialProvider();
        this.validateResolvedCredentials(credentials);
        const region = signingRegion ?? await this.regionProvider();
        const request = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$prepareRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["prepareRequest"])(requestToSign);
        const { longDate, shortDate } = this.formatDate(signingDate);
        const scope = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["createScope"])(shortDate, region, signingService ?? this.service);
        request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AMZ_DATE_HEADER"]] = longDate;
        if (credentials.sessionToken) {
            request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["TOKEN_HEADER"]] = credentials.sessionToken;
        }
        const payloadHash = await (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getPayloadHash$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getPayloadHash"])(request, this.sha256);
        if (!(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$headerUtil$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["hasHeader"])(__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHA256_HEADER"], request.headers) && this.applyChecksum) {
            request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHA256_HEADER"]] = payloadHash;
        }
        const canonicalHeaders = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalHeaders$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCanonicalHeaders"])(request, unsignableHeaders, signableHeaders);
        const signature = await this.getSignature(longDate, scope, this.getSigningKey(credentials, region, shortDate, signingService), this.createCanonicalRequest(request, canonicalHeaders, payloadHash));
        request.headers[__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["AUTH_HEADER"]] = `${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_IDENTIFIER"]} ` + `Credential=${credentials.accessKeyId}/${scope}, ` + `SignedHeaders=${this.getCanonicalHeaderList(canonicalHeaders)}, ` + `Signature=${signature}`;
        return request;
    }
    async getSignature(longDate, credentialScope, keyPromise, canonicalRequest) {
        const stringToSign = await this.createStringToSign(longDate, credentialScope, canonicalRequest, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALGORITHM_IDENTIFIER"]);
        const hash = new this.sha256(await keyPromise);
        hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(stringToSign));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hash.digest());
    }
    getSigningKey(credentials, region, shortDate, service) {
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$credentialDerivation$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getSigningKey"])(this.sha256, credentials, shortDate, region, service || this.service);
    }
}
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/SignatureV4Base.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SignatureV4Base",
    ()=>SignatureV4Base
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/normalizeProvider.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/protocols/util-uri-escape/escape-uri.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-hex-encoding/hex-encoding.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/getCanonicalQuery.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$utilDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/utilDate.js [app-route] (ecmascript)");
;
;
;
;
;
class SignatureV4Base {
    service;
    regionProvider;
    credentialProvider;
    sha256;
    uriEscapePath;
    applyChecksum;
    constructor({ applyChecksum, credentials, region, service, sha256, uriEscapePath = true }){
        this.service = service;
        this.sha256 = sha256;
        this.uriEscapePath = uriEscapePath;
        this.applyChecksum = typeof applyChecksum === "boolean" ? applyChecksum : true;
        this.regionProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(region);
        this.credentialProvider = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$normalizeProvider$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["normalizeProvider"])(credentials);
    }
    createCanonicalRequest(request, canonicalHeaders, payloadHash) {
        const sortedHeaders = Object.keys(canonicalHeaders).sort();
        return `${request.method}
${this.getCanonicalPath(request)}
${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$getCanonicalQuery$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["getCanonicalQuery"])(request)}
${sortedHeaders.map((name)=>`${name}:${canonicalHeaders[name]}`).join("\n")}

${sortedHeaders.join(";")}
${payloadHash}`;
    }
    async createStringToSign(longDate, credentialScope, canonicalRequest, algorithmIdentifier) {
        const hash = new this.sha256();
        hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(canonicalRequest));
        const hashedRequest = await hash.digest();
        return `${algorithmIdentifier}
${longDate}
${credentialScope}
${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(hashedRequest)}`;
    }
    getCanonicalPath({ path }) {
        if (this.uriEscapePath) {
            const normalizedPathSegments = [];
            for (const pathSegment of path.split("/")){
                if (pathSegment?.length === 0) continue;
                if (pathSegment === ".") continue;
                if (pathSegment === "..") {
                    normalizedPathSegments.pop();
                } else {
                    normalizedPathSegments.push(pathSegment);
                }
            }
            const normalizedPath = `${path?.startsWith("/") ? "/" : ""}${normalizedPathSegments.join("/")}${normalizedPathSegments.length > 0 && path?.endsWith("/") ? "/" : ""}`;
            const doubleEncoded = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(normalizedPath);
            return doubleEncoded.replace(/%2F/g, "/");
        }
        return path;
    }
    validateResolvedCredentials(credentials) {
        if (typeof credentials !== "object" || typeof credentials.accessKeyId !== "string" || typeof credentials.secretAccessKey !== "string") {
            throw new Error("Resolved credential object is not valid");
        }
    }
    formatDate(now) {
        const longDate = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$utilDate$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["iso8601"])(now).replace(/[-:]/g, "");
        return {
            longDate,
            shortDate: longDate.slice(0, 8)
        };
    }
    getCanonicalHeaderList(headers) {
        return Object.keys(headers).sort().join(";");
    }
}
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "ALGORITHM_IDENTIFIER",
    ()=>ALGORITHM_IDENTIFIER,
    "ALGORITHM_IDENTIFIER_V4A",
    ()=>ALGORITHM_IDENTIFIER_V4A,
    "ALGORITHM_QUERY_PARAM",
    ()=>ALGORITHM_QUERY_PARAM,
    "ALWAYS_UNSIGNABLE_HEADERS",
    ()=>ALWAYS_UNSIGNABLE_HEADERS,
    "AMZ_DATE_HEADER",
    ()=>AMZ_DATE_HEADER,
    "AMZ_DATE_QUERY_PARAM",
    ()=>AMZ_DATE_QUERY_PARAM,
    "AUTH_HEADER",
    ()=>AUTH_HEADER,
    "CREDENTIAL_QUERY_PARAM",
    ()=>CREDENTIAL_QUERY_PARAM,
    "DATE_HEADER",
    ()=>DATE_HEADER,
    "EVENT_ALGORITHM_IDENTIFIER",
    ()=>EVENT_ALGORITHM_IDENTIFIER,
    "EXPIRES_QUERY_PARAM",
    ()=>EXPIRES_QUERY_PARAM,
    "GENERATED_HEADERS",
    ()=>GENERATED_HEADERS,
    "HOST_HEADER",
    ()=>HOST_HEADER,
    "KEY_TYPE_IDENTIFIER",
    ()=>KEY_TYPE_IDENTIFIER,
    "MAX_CACHE_SIZE",
    ()=>MAX_CACHE_SIZE,
    "MAX_PRESIGNED_TTL",
    ()=>MAX_PRESIGNED_TTL,
    "PROXY_HEADER_PATTERN",
    ()=>PROXY_HEADER_PATTERN,
    "REGION_SET_PARAM",
    ()=>REGION_SET_PARAM,
    "SEC_HEADER_PATTERN",
    ()=>SEC_HEADER_PATTERN,
    "SHA256_HEADER",
    ()=>SHA256_HEADER,
    "SIGNATURE_HEADER",
    ()=>SIGNATURE_HEADER,
    "SIGNATURE_QUERY_PARAM",
    ()=>SIGNATURE_QUERY_PARAM,
    "SIGNED_HEADERS_QUERY_PARAM",
    ()=>SIGNED_HEADERS_QUERY_PARAM,
    "TOKEN_HEADER",
    ()=>TOKEN_HEADER,
    "TOKEN_QUERY_PARAM",
    ()=>TOKEN_QUERY_PARAM,
    "UNSIGNABLE_PATTERNS",
    ()=>UNSIGNABLE_PATTERNS,
    "UNSIGNED_PAYLOAD",
    ()=>UNSIGNED_PAYLOAD
]);
const ALGORITHM_QUERY_PARAM = "X-Amz-Algorithm";
const CREDENTIAL_QUERY_PARAM = "X-Amz-Credential";
const AMZ_DATE_QUERY_PARAM = "X-Amz-Date";
const SIGNED_HEADERS_QUERY_PARAM = "X-Amz-SignedHeaders";
const EXPIRES_QUERY_PARAM = "X-Amz-Expires";
const SIGNATURE_QUERY_PARAM = "X-Amz-Signature";
const TOKEN_QUERY_PARAM = "X-Amz-Security-Token";
const REGION_SET_PARAM = "X-Amz-Region-Set";
const AUTH_HEADER = "authorization";
const AMZ_DATE_HEADER = AMZ_DATE_QUERY_PARAM.toLowerCase();
const DATE_HEADER = "date";
const GENERATED_HEADERS = [
    AUTH_HEADER,
    AMZ_DATE_HEADER,
    DATE_HEADER
];
const SIGNATURE_HEADER = SIGNATURE_QUERY_PARAM.toLowerCase();
const SHA256_HEADER = "x-amz-content-sha256";
const TOKEN_HEADER = TOKEN_QUERY_PARAM.toLowerCase();
const HOST_HEADER = "host";
const ALWAYS_UNSIGNABLE_HEADERS = {
    authorization: true,
    "cache-control": true,
    connection: true,
    expect: true,
    from: true,
    "keep-alive": true,
    "max-forwards": true,
    pragma: true,
    referer: true,
    te: true,
    trailer: true,
    "transfer-encoding": true,
    upgrade: true,
    "user-agent": true,
    "x-amzn-trace-id": true
};
const PROXY_HEADER_PATTERN = /^proxy-/;
const SEC_HEADER_PATTERN = /^sec-/;
const UNSIGNABLE_PATTERNS = [
    /^proxy-/i,
    /^sec-/i
];
const ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256";
const ALGORITHM_IDENTIFIER_V4A = "AWS4-ECDSA-P256-SHA256";
const EVENT_ALGORITHM_IDENTIFIER = "AWS4-HMAC-SHA256-PAYLOAD";
const UNSIGNED_PAYLOAD = "UNSIGNED-PAYLOAD";
const MAX_CACHE_SIZE = 50;
const KEY_TYPE_IDENTIFIER = "aws4_request";
const MAX_PRESIGNED_TTL = 60 * 60 * 24 * 7;
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/credentialDerivation.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "clearCredentialCache",
    ()=>clearCredentialCache,
    "createScope",
    ()=>createScope,
    "getSigningKey",
    ()=>getSigningKey
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-hex-encoding/hex-encoding.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
const signingKeyCache = {};
const cacheQueue = [];
const createScope = (shortDate, region, service)=>`${shortDate}/${region}/${service}/${__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["KEY_TYPE_IDENTIFIER"]}`;
const getSigningKey = async (sha256Constructor, credentials, shortDate, region, service)=>{
    const credsHash = await hmac(sha256Constructor, credentials.secretAccessKey, credentials.accessKeyId);
    const cacheKey = `${shortDate}:${region}:${service}:${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(credsHash)}:${credentials.sessionToken}`;
    if (cacheKey in signingKeyCache) {
        return signingKeyCache[cacheKey];
    }
    cacheQueue.push(cacheKey);
    while(cacheQueue.length > __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["MAX_CACHE_SIZE"]){
        delete signingKeyCache[cacheQueue.shift()];
    }
    let key = `AWS4${credentials.secretAccessKey}`;
    for (const signable of [
        shortDate,
        region,
        service,
        __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["KEY_TYPE_IDENTIFIER"]
    ]){
        key = await hmac(sha256Constructor, key, signable);
    }
    return signingKeyCache[cacheKey] = key;
};
const clearCredentialCache = ()=>{
    cacheQueue.length = 0;
    Object.keys(signingKeyCache).forEach((cacheKey)=>{
        delete signingKeyCache[cacheKey];
    });
};
const hmac = (ctor, secret, data)=>{
    const hash = new ctor(secret);
    hash.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(data));
    return hash.digest();
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/getCanonicalHeaders.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanonicalHeaders",
    ()=>getCanonicalHeaders
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
const getCanonicalHeaders = ({ headers }, unsignableHeaders, signableHeaders)=>{
    const canonical = {};
    for (const headerName of Object.keys(headers).sort()){
        if (headers[headerName] == undefined) {
            continue;
        }
        const canonicalHeaderName = headerName.toLowerCase();
        if (canonicalHeaderName in __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["ALWAYS_UNSIGNABLE_HEADERS"] || unsignableHeaders?.has(canonicalHeaderName) || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["PROXY_HEADER_PATTERN"].test(canonicalHeaderName) || __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SEC_HEADER_PATTERN"].test(canonicalHeaderName)) {
            if (!signableHeaders || signableHeaders && !signableHeaders.has(canonicalHeaderName)) {
                continue;
            }
        }
        canonical[canonicalHeaderName] = headers[headerName].trim().replace(/\s+/g, " ");
    }
    return canonical;
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/getCanonicalQuery.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getCanonicalQuery",
    ()=>getCanonicalQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/protocols/util-uri-escape/escape-uri.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
const getCanonicalQuery = ({ query = {} })=>{
    const keys = [];
    const serialized = {};
    for (const key of Object.keys(query)){
        if (key.toLowerCase() === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SIGNATURE_HEADER"]) {
            continue;
        }
        const encodedKey = (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(key);
        keys.push(encodedKey);
        const value = query[key];
        if (typeof value === "string") {
            serialized[encodedKey] = `${encodedKey}=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value)}`;
        } else if (Array.isArray(value)) {
            serialized[encodedKey] = value.slice(0).reduce((encoded, value)=>encoded.concat([
                    `${encodedKey}=${(0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$protocols$2f$util$2d$uri$2d$escape$2f$escape$2d$uri$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["escapeUri"])(value)}`
                ]), []).sort().join("&");
        }
    }
    return keys.sort().map((key)=>serialized[key]).filter((serialized)=>serialized).join("&");
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/getPayloadHash.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "getPayloadHash",
    ()=>getPayloadHash
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$is$2d$array$2d$buffer$2f$is$2d$array$2d$buffer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/is-array-buffer/is-array-buffer.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-hex-encoding/hex-encoding.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/serde/util-utf8/toUint8Array.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
const getPayloadHash = async ({ headers, body }, hashConstructor)=>{
    for (const headerName of Object.keys(headers)){
        if (headerName.toLowerCase() === __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["SHA256_HEADER"]) {
            return headers[headerName];
        }
    }
    if (body == undefined) {
        return "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855";
    } else if (typeof body === "string" || ArrayBuffer.isView(body) || (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$is$2d$array$2d$buffer$2f$is$2d$array$2d$buffer$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["isArrayBuffer"])(body)) {
        const hashCtor = new hashConstructor();
        hashCtor.update((0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$utf8$2f$toUint8Array$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toUint8Array"])(body));
        return (0, __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$serde$2f$util$2d$hex$2d$encoding$2f$hex$2d$encoding$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["toHex"])(await hashCtor.digest());
    }
    return __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["UNSIGNED_PAYLOAD"];
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/headerUtil.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "deleteHeader",
    ()=>deleteHeader,
    "getHeaderValue",
    ()=>getHeaderValue,
    "hasHeader",
    ()=>hasHeader
]);
const hasHeader = (soughtHeader, headers)=>{
    soughtHeader = soughtHeader.toLowerCase();
    for (const headerName of Object.keys(headers)){
        if (soughtHeader === headerName.toLowerCase()) {
            return true;
        }
    }
    return false;
};
const getHeaderValue = (soughtHeader, headers)=>{
    soughtHeader = soughtHeader.toLowerCase();
    for (const headerName of Object.keys(headers)){
        if (soughtHeader === headerName.toLowerCase()) {
            return headers[headerName];
        }
    }
    return undefined;
};
const deleteHeader = (soughtHeader, headers)=>{
    soughtHeader = soughtHeader.toLowerCase();
    for (const headerName of Object.keys(headers)){
        if (soughtHeader === headerName.toLowerCase()) {
            delete headers[headerName];
        }
    }
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/moveHeadersToQuery.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "moveHeadersToQuery",
    ()=>moveHeadersToQuery
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/httpRequest.js [app-route] (ecmascript)");
;
const moveHeadersToQuery = (request, options = {})=>{
    const { headers, query = {} } = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].clone(request);
    for (const name of Object.keys(headers)){
        const lname = name.toLowerCase();
        if (lname.slice(0, 6) === "x-amz-" && !options.unhoistableHeaders?.has(lname) || options.hoistableHeaders?.has(lname)) {
            query[name] = headers[name];
            delete headers[name];
        }
    }
    return {
        ...request,
        headers,
        query
    };
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/prepareRequest.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "prepareRequest",
    ()=>prepareRequest
]);
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/core/dist-es/submodules/transport/httpRequest.js [app-route] (ecmascript)");
var __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__ = __turbopack_context__.i("[project]/node_modules/@smithy/signature-v4/dist-es/constants.js [app-route] (ecmascript)");
;
;
const prepareRequest = (request)=>{
    request = __TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$core$2f$dist$2d$es$2f$submodules$2f$transport$2f$httpRequest$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["HttpRequest"].clone(request);
    for (const headerName of Object.keys(request.headers)){
        if (__TURBOPACK__imported__module__$5b$project$5d2f$node_modules$2f40$smithy$2f$signature$2d$v4$2f$dist$2d$es$2f$constants$2e$js__$5b$app$2d$route$5d$__$28$ecmascript$29$__["GENERATED_HEADERS"].indexOf(headerName.toLowerCase()) > -1) {
            delete request.headers[headerName];
        }
    }
    return request;
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/signature-v4a-container.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "signatureV4aContainer",
    ()=>signatureV4aContainer
]);
const signatureV4aContainer = {
    SignatureV4a: null
};
}),
"[project]/node_modules/@smithy/signature-v4/dist-es/utilDate.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "iso8601",
    ()=>iso8601,
    "toDate",
    ()=>toDate
]);
const iso8601 = (time)=>toDate(time).toISOString().replace(/\.\d{3}Z$/, "Z");
const toDate = (time)=>{
    if (typeof time === "number") {
        return new Date(time * 1000);
    }
    if (typeof time === "string") {
        if (Number(time)) {
            return new Date(Number(time) * 1000);
        }
        return new Date(time);
    }
    return time;
};
}),
"[project]/node_modules/@smithy/types/dist-es/middleware.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "SMITHY_CONTEXT_KEY",
    ()=>SMITHY_CONTEXT_KEY
]);
const SMITHY_CONTEXT_KEY = "__smithy_context";
}),
"[project]/node_modules/@smithy/types/dist-es/profile.js [app-route] (ecmascript)", ((__turbopack_context__) => {
"use strict";

__turbopack_context__.s([
    "IniSectionType",
    ()=>IniSectionType
]);
var IniSectionType;
(function(IniSectionType) {
    IniSectionType["PROFILE"] = "profile";
    IniSectionType["SSO_SESSION"] = "sso-session";
    IniSectionType["SERVICES"] = "services";
})(IniSectionType || (IniSectionType = {}));
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
];

//# sourceMappingURL=%5Broot-of-the-server%5D__1dav0ep._.js.map