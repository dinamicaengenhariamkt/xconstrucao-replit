---
description: Roda Playwright E2E (com filtro opcional)
argument-hint: [arquivo ou pattern, opcional]
---

Rode os testes Playwright.

- Se houver argumento (`$ARGUMENTS`), use como filtro: `npm run test:e2e -- $ARGUMENTS`
- Caso contrário: `npm run test:e2e` completo

Reporte apenas os falhos com trace curto. Se passou tudo, 1 linha confirmando.

Se precisar escrever novo teste, invoque o agent `test-engineer`.
