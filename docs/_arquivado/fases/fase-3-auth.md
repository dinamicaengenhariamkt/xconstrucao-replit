# Fase 3: Extrair Feature de Auth

## Status
- ✅ **Completa** (sub-fases 3.1-3.5 concluídas, 3.6 opcional)
- **Iniciado em:** Hoje
- **Concluído em:** Hoje

## Objetivo
Consolidar toda lógica de autenticação em `/features/auth`, incluindo server-side (auth.ts, storage), client-side (hooks), schemas, types, emails e components.

## Passos Executados

### 3.1 - Server-side Auth ✅
- [x] Criar estrutura de diretórios `/features/auth/api/`
- [x] Copiar `/server/auth.ts` → `/features/auth/api/auth-service.ts`
- [x] Copiar `/server/auth-utils.ts` → `/features/auth/api/auth-utils.ts`
- [x] Extrair métodos de user de `/server/storage.ts`:
  - `getUserByEmail()`, `getUserByUsername()`, `getUser()`, `createUser()`, `updateUserPassword()`, `updateUserEmailVerified()`
  - Criado `/features/auth/api/auth-storage.ts`
- [x] Atualizar imports em `/app/api/auth/**/route.ts`
- [x] Corrigir imports antigos (`@shared/schema` → `@shared/db/schema`)
- [x] TypeScript compila sem erros
- [x] ✅ Testado login funciona
- [x] ✅ Testado registro funciona

### 3.2 - Client-side Auth ✅
- [x] Copiar `/lib/auth.tsx` → `/features/auth/hooks/use-auth.tsx`
- [x] Atualizar import de queryClient para `@shared/lib/queryClient`
- [x] Atualizar imports em `/app/dashboard/layout.tsx`, `/app/login/page.tsx`, `/app/cadastro/page.tsx`
- [x] TypeScript compila sem erros

### 3.3 - Auth Schemas ✅
- [x] Criar `/features/auth/schemas/index.ts`
- [x] Extraído `loginSchema`, `registerSchema`, `forgotPasswordSchema`, `resetPasswordSchema`
- [x] **Tabelas Drizzle permanecem em `/shared/db/schema.ts`**
- [x] Atualizar imports em API routes de auth (login, register)
- [x] Atualizar imports em páginas de login/cadastro
- [x] TypeScript compila sem erros

### 3.4 - Auth Types ✅
- [x] Criado `/features/auth/types/index.ts`
- [x] Exportados tipos: User, InsertUser, Session, AuthUser
- [x] TypeScript compila sem erros

### 3.5 - Email Templates ✅
- [x] Criado `/features/auth/emails/`
- [x] Copiado `/emails/verification.tsx` → `/features/auth/emails/verification.tsx`
- [x] Copiado `/emails/password-reset.tsx` → `/features/auth/emails/password-reset.tsx`
- [x] Copiado `/emails/welcome.tsx` → `/features/auth/emails/welcome.tsx`

### 3.6 - Auth Components (OPCIONAL - Fase Futura)
- [ ] **Pode ser feito em iteração futura se necessário**
- [ ] Extrair forms das páginas para components reutilizáveis
- [ ] Extrair de `/app/login/page.tsx`:
  - Criar `LoginForm.tsx`
  - Manter página como wrapper que usa `<LoginForm />`
- [ ] Extrair de `/app/cadastro/page.tsx`:
  - Criar `RegisterForm.tsx`
  - Criar `OAuthButton.tsx` (reutilizável)
- [ ] Extrair de `/app/recuperar-senha/page.tsx`:
  - Criar `ForgotPasswordForm.tsx`
- [ ] Extrair de `/app/reset-senha/page.tsx`:
  - Criar `ResetPasswordForm.tsx`
- [ ] Testar todos os formulários funcionam

## Problemas Encontrados

### Problema 1: AuthProvider import não atualizado em providers.tsx
- **Erro:** `useAuth deve ser usado dentro de um AuthProvider` em `features/auth/hooks/use-auth.tsx:270:11`
- **Causa:** O arquivo `/shared/components/providers.tsx` não teve seus imports atualizados durante a migração
- **Arquivos afetados:**
  - Linha 6: `import { AuthProvider } from "@/lib/auth";` (antigo)
  - Linha 7: `import { ThemeProvider } from "@/components/theme-provider";` (antigo)
- **Solução:**
  - Atualizado linha 6 para: `import { AuthProvider } from "@features/auth/hooks/use-auth";`
  - Atualizado linha 7 para: `import { ThemeProvider } from "@shared/components/theme-provider";`
- **Status:** ✅ Resolvido - TypeScript compila sem erros

## Validações e Testes

### Funcionalidades de Auth:
- [x] ✅ Login funciona (email/password) - Testado pelo usuário
- [x] ✅ Registro funciona - Testado pelo usuário
- [x] TypeScript compila sem erros
- [x] App roda sem erros (confirmado pelo usuário)

## Arquivos Afetados

**Criados:**
- `/features/auth/api/auth-service.ts` (copiado de server/auth.ts)
- `/features/auth/api/auth-utils.ts` (copiado de server/auth-utils.ts)
- `/features/auth/api/auth-storage.ts` (extraído 6 métodos de storage.ts)
- `/features/auth/hooks/use-auth.tsx` (copiado de lib/auth.tsx)
- `/features/auth/schemas/index.ts` (loginSchema, registerSchema, forgot/reset)
- `/features/auth/types/index.ts` (User, InsertUser, Session, AuthUser)
- `/features/auth/emails/verification.tsx` (copiado)
- `/features/auth/emails/password-reset.tsx` (copiado)
- `/features/auth/emails/welcome.tsx` (copiado)

**Modificados:**
- `/app/api/auth/**/route.ts` (10 arquivos - imports atualizados)
- `/app/dashboard/layout.tsx` (import useAuth atualizado)
- `/app/login/page.tsx` (imports atualizados)
- `/app/cadastro/page.tsx` (imports atualizados)
- `/shared/components/providers.tsx` (imports AuthProvider e ThemeProvider atualizados)

**Mantidos (deletar na Fase 6):**
- `/server/auth.ts`
- `/server/auth-utils.ts`
- `/server/storage.ts` (parcialmente)
- `/lib/auth.tsx`
- `/emails/*`

## Resultado

(Será preenchido ao finalizar a fase)

## Próximos Passos

- Fase 4.1: Extrair Feature Obras (feature compartilhada)

## Resultado

✅ **Fase 3 COMPLETA - Feature de Auth Consolidada**

### Resumo:
- ✅ **Server-side auth** migrado para `/features/auth/api/`
  - auth-service.ts, auth-utils.ts, auth-storage.ts (6 métodos extraídos)
- ✅ **Client-side auth** migrado para `/features/auth/hooks/use-auth.tsx`
- ✅ **Auth schemas** criados em `/features/auth/schemas/`
  - loginSchema, registerSchema, forgotPasswordSchema, resetPasswordSchema
- ✅ **Auth types** criados em `/features/auth/types/`
  - User, InsertUser, Session, AuthUser
- ✅ **Email templates** copiados para `/features/auth/emails/`
  - verification.tsx, password-reset.tsx, welcome.tsx

### Arquivos migrados:
- 10 API routes de auth atualizadas
- 3 páginas de auth atualizadas (login, cadastro, dashboard/layout)
- TypeScript compila sem erros
- Login e registro funcionando (validado pelo usuário)

### Próximos Passos:
- Fase 4.1: Extrair Feature Obras (feature compartilhada)
