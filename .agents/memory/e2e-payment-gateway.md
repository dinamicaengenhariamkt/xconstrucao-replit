---
name: E2E payment gateway isolation
description: Playwright webServer inherits PAYMENT_GATEWAY from system env; must override to "manual" to avoid calling real gateways in tests.
---

## Rule
Always add `PAYMENT_GATEWAY: "manual"` to the `webServer.env` block in `playwright.config.ts`.

**Why:** The system environment has `PAYMENT_GATEWAY=asaas` set (Replit secret). Without an explicit override, the Playwright webServer (port 3010) inherits this value and `getPaymentGateway()` returns `AsaasGateway`, which calls the real ASAAS API. ASAAS returns HTTP 400 for stub/test requests, causing all checkout-related E2E tests to fail with 500.

**How to apply:** Any time a new playwright.config.ts is created or the webServer env block is modified, ensure `PAYMENT_GATEWAY: "manual"` is present. All checkout flows in E2E should use the ManualGateway stub.

## Related
- `features/planos/gateway/index.ts` — `getPaymentGateway()` reads `process.env.PAYMENT_GATEWAY`, default "manual"
- `features/planos/gateway/manual-gateway.ts` — stub adapter; uses `_${Date.now()}` suffix on gatewaySubscriptionId to avoid unique constraint on re-subscription
- `features/planos/assinatura-service.ts` — `iniciarCheckout` wraps impl in try/catch, returns `INTERNAL_ERROR` result instead of throwing
