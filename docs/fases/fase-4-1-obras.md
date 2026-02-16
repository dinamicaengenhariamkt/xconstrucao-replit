# Fase 4.1: Extrair Feature Obras (Compartilhada)

## Status
- ✅ **Completa**
- **Iniciado em:** 2026-02-16
- **Concluído em:** 2026-02-16

## Objetivo
Consolidar toda lógica de obras em `/features/obras`, criando uma feature compartilhada usada por admin, contratante e empreiteiro. Cada papel terá componentes específicos, mas compartilhará a mesma API/hooks.

## Contexto
Obras é uma feature central usada por múltiplas jornadas:
- **Admin**: Gestão completa de todas as obras
- **Contratante**: Criar e acompanhar suas obras
- **Empreiteiro**: Visualizar obras disponíveis e em andamento

## Passos a Executar

### 4.1.1 - API Layer (Lógica Compartilhada) ✅
- [x] Ler `/server/storage.ts` para identificar métodos de obras
- [x] Criar `/features/obras/api/obras-service.ts`
- [x] Extrair métodos: `getObras()`, `getObra(id)`, `createObra()`, `deleteObra()`
  - Nota: `updateObra()` não existe no código original
- [x] Testar TypeScript compila
- [x] Identificar API routes de obras existentes
- [x] Atualizar imports em `/app/api/obras/route.ts`
- [x] Atualizar imports em `/app/api/obras/[id]/route.ts`
- [x] Testar TypeScript compila

### 4.1.2 - Schemas e Types ✅
- [x] Ler `/shared/db/schema.ts` para identificar schemas de obras
- [x] Criar `/features/obras/schemas/index.ts`
- [x] Extrair `insertObraSchema` (Zod schema)
  - Nota: `updateObraSchema` não existe, pode ser criado futuramente se necessário
- [x] **NÃO MOVER** tabela `obras` do Drizzle (permanece em `/shared/db/schema.ts`)
- [x] Criar `/features/obras/types/index.ts`
- [x] Definir tipos: `Obra`, `InsertObra`, `ObraStatus`
- [x] Atualizar imports nos API routes que usam schemas de obras
- [x] Testar TypeScript compila

### 4.1.3 - Hooks Compartilhados ✅
- [x] Criar `/features/obras/hooks/use-obras.ts`
- [x] Implementar hooks usando React Query:
  - `useObras()` - lista todas as obras
  - `useObra(id)` - detalhes de uma obra específica
  - `useCreateObra()` - criar nova obra
  - `useDeleteObra()` - deletar obra
- [x] Testar TypeScript compila

### 4.1.4 - Components Compartilhados ⏭️ PULADO
- Estrutura de diretórios criada (components/shared, admin, contratante, empreiteiro)
- Componentes ainda não existem como arquivos separados
- **Decisão:** Manter componentes inline nas páginas por enquanto
- Extração de componentes pode ser feita em iteração futura quando necessário

### 4.1.5 - Atualizar Páginas Existentes ✅
- [x] Identificar páginas que usam obras
- [x] Atualizar imports em `/app/dashboard/obras/page.tsx`:
  - `insertObraSchema` de `@shared/db/schema` → `@features/obras/schemas`
  - Tipos `Obra`, `InsertObra` de `@shared/db/schema` → `@features/obras/types`
- [x] Testar TypeScript compila

## Problemas Encontrados

Nenhum problema encontrado durante a execução. Migração ocorreu sem erros.

## Validações e Testes

### Funcionalidades de Obras:
- [x] API endpoints de obras funcionam (GET, POST, DELETE)
  - Nota: PUT/UPDATE não implementado originalmente
- [x] TypeScript compila sem erros
- [x] Páginas de obras carregam corretamente (imports atualizados)
- [x] Estrutura pronta para uso por admin, contratante e empreiteiro

## Arquivos Afetados

**Criados:**
- `/features/obras/api/obras-service.ts` - Métodos `getObras()`, `getObra(id)`, `createObra()`, `deleteObra()`
- `/features/obras/schemas/index.ts` - Schema `insertObraSchema`
- `/features/obras/types/index.ts` - Tipos `Obra`, `InsertObra`, `ObraStatus`
- `/features/obras/hooks/use-obras.ts` - Hooks React Query: `useObras()`, `useObra()`, `useCreateObra()`, `useDeleteObra()`
- Estrutura de diretórios para componentes (vazia, pronta para uso futuro):
  - `/features/obras/components/shared/`
  - `/features/obras/components/admin/`
  - `/features/obras/components/contratante/`
  - `/features/obras/components/empreiteiro/`

**Modificados:**
- `/app/api/obras/route.ts` - Imports atualizados para usar `@features/obras` e `@features/auth`
- `/app/api/obras/[id]/route.ts` - Imports atualizados para usar `@features/obras` e `@features/auth`
- `/app/dashboard/obras/page.tsx` - Imports de schemas e types atualizados

**Mantidos (deletar na Fase 6):**
- `/server/storage.ts` (parcialmente - métodos de obras)

## Resultado

✅ **Fase 4.1 COMPLETA - Feature Obras Consolidada**

### Resumo:
- ✅ **API Layer** criada em `/features/obras/api/obras-service.ts`
  - 4 métodos extraídos: getObras, getObra, createObra, deleteObra
- ✅ **Schemas** criados em `/features/obras/schemas/`
  - insertObraSchema migrado de @shared/db/schema
- ✅ **Types** criados em `/features/obras/types/`
  - Obra, InsertObra, ObraStatus
- ✅ **Hooks React Query** criados em `/features/obras/hooks/use-obras.ts`
  - useObras, useObra, useCreateObra, useDeleteObra
- ✅ **Estrutura de componentes** criada (pronta para expansão futura)
  - shared/, admin/, contratante/, empreiteiro/

### Arquivos migrados:
- 2 API routes atualizadas (route.ts, [id]/route.ts)
- 1 página atualizada (dashboard/obras/page.tsx)
- TypeScript compila sem erros
- Feature compartilhada pronta para uso por admin, contratante e empreiteiro

### Notas:
- Tabela `obras` do Drizzle permanece em `/shared/db/schema.ts` (conforme planejado)
- Método `updateObra()` não existe no código original, pode ser adicionado futuramente
- Componentes não foram extraídos (mantidos inline nas páginas por enquanto)

## Próximos Passos

- Fase 4.2: Extrair Feature Financeiro
