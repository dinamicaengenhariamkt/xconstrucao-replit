---
description: db-architect avalia schema, índices e divergências
---

Invoque o agent `db-architect` para:

1. Verificar mudanças recentes em `shared/db/schema.ts` (`git log -10 --oneline -- shared/db/schema.ts`)
2. Detectar divergência entre schema declarado e DB (`npx drizzle-kit check` se disponível)
3. Avaliar índices nas tabelas tocadas recentemente — flagear FKs sem índice e colunas frequentemente filtradas sem índice
4. Reportar N+1 ou queries suspeitas em features alteradas na branch

**Não execute** `drizzle-kit push`, `drop` ou qualquer mutation. Só análise.
