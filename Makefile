# Makefile — atalhos para testes E2E sem conflitos de porta
#
# Problema: execuções anteriores do Playwright podem deixar um processo
# Next.js rodando na porta E2E (3010 por padrão), causando EADDRINUSE na
# próxima invocação. Os alvos abaixo matam qualquer processo legado antes
# de chamar o Playwright, garantindo um estado limpo.
#
# Uso:
#   make test-e2e                          # suite completa
#   make test-e2e-aprovacao                # apenas a spec de aprovação
#   make test-e2e SPEC=tests/e2e/foo.spec.ts  # spec arbitrária
#   make kill-e2e-port                     # só mata a porta (debug)

E2E_PORT ?= 3010

.PHONY: kill-e2e-port test-e2e test-e2e-aprovacao

## Mata qualquer processo que esteja ocupando a porta E2E.
kill-e2e-port:
	@echo "→ Liberando porta $(E2E_PORT)..."
	@lsof -ti:$(E2E_PORT) | xargs kill -9 2>/dev/null || true
	@echo "   Porta $(E2E_PORT) liberada."

## Roda a suite E2E completa (ou a SPEC informada) sem risco de EADDRINUSE.
test-e2e: kill-e2e-port
	npx playwright test $(SPEC)

## Atalho rápido para a spec de aprovação admin (regressão Task #115).
test-e2e-aprovacao: kill-e2e-port
	npx playwright test tests/e2e/admin-aprovacao.spec.ts
