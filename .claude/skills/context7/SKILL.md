# Context7 - Documentação Atualizada para Código

## Quando Usar
Use **automaticamente** quando programar com libs que mudam frequentemente.

## Comandos

### Buscar biblioteca
```bash
npx ctx7 library <nome> "<query>"
# Exemplo:
npx ctx7 library nextjs "middleware"
npx ctx7 library react "hooks useEffect"
npx ctx7 library prisma "relations"
```

### Buscar docs específicos
```bash
npx ctx7 docs <libraryId> "<query>"
# Exemplo:
npx ctx7 docs /websites/nextjs "middleware authentication jwt"
npx ctx7 docs /facebook/react "useEffect cleanup"
npx ctx7 docs /prisma/prisma "one-to-many relations"
```

## Libraries Comuns

| Lib | Library ID |
|-----|------------|
| Next.js | /websites/nextjs |
| React | /facebook/react |
| Prisma | /prisma/prisma |
| Tailwind | /tailwindlabs/tailwindcss |
| shadcn/ui | /shadcn-ui/ui |

## Uso Automático

Quando gerar código com libs modernas:
1. Rodar `npx ctx7 docs <lib> "<funcionalidade>"`
2. Usar exemplos retornados como base
3. Adaptar para o caso específico

## Instalado
- CLI: `npx ctx7`
- MCP: `/usr/bin/context7-mcp` (para futuro uso)

---
*Instalado: 2026-03-20*
