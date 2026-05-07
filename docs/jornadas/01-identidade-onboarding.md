# Jornada — Identidade & Onboarding

> Status: revisão | Prioridade: alta | Wave: 1
> Última atualização: 2026-05-05

## 1. Contexto & Objetivo
Garantir que qualquer pessoa entre na plataforma com a persona certa (contratante / empreiteiro / admin), tenha email verificado e perfil mínimo preenchido para usar as demais jornadas. É a base de identidade — sem ela, nada do marketplace funciona.

## 2. Personas
- **Visitante público**: chega pela landing, escolhe persona e cadastra.
- **Contratante**: após cadastro, precisa de `clientes` row associada para criar obras.
- **Empreiteiro**: após cadastro, precisa de `empreiteiras` row para se candidatar.
- **Admin**: criado via seed; não passa pelo fluxo público.

## 3. Fluxo ponta-a-ponta
```mermaid
flowchart LR
  L[Landing /] --> C[/cadastro]
  C --> R[POST /api/auth/register]
  R --> V[Email verify token]
  V --> Vp[/verificar-email]
  Vp --> LG[/login]
  LG --> D[Dashboard da persona]
```

1. Visitante abre `/` e clica em "Cadastrar".
2. Em `/cadastro` escolhe persona (contratante/empreiteiro), preenche nome/email/senha/telefone.
3. `POST /api/auth/register` cria `users` row (role) e dispara email de verificação.
4. Usuário clica no link → `/verificar-email` valida token → marca `users.emailVerified`.
5. Login em `/login` → redirect ao dashboard da persona.
6. Em primeiro acesso, criar `clientes` ou `empreiteiras` linkado a `users.id` se ainda não existir (gap atual).

## 4. Telas envolvidas
- [app/page.tsx](../../app/page.tsx) — landing pública
- [app/cadastro/](../../app/cadastro/) — formulário de cadastro com escolha de persona
- [app/login/](../../app/login/) — login
- [app/verificar-email/](../../app/verificar-email/) — confirmação por token
- [app/recuperar-senha/](../../app/recuperar-senha/) — reset por email
- [app/reset-senha/](../../app/reset-senha/) — definir nova senha
- [app/access/](../../app/access/) e [app/acesso-plataforma/](../../app/acesso-plataforma/) — telas de gating

## 5. Componentes-chave
- [features/auth/](../../features/auth/) — services, schemas, emails
- [server/auth.ts](../../server/auth.ts) — JWT
- Schemas Zod: `loginSchema`, `registerSchema` em [shared/db/schema.ts](../../shared/db/schema.ts)

## 6. Schema (Drizzle)
Existentes: `users`, `accounts`, `sessions`, `verificationTokens`.

**Gap a resolver**: hoje `clientes` e `empreiteiras` não têm `userId` referenciando `users.id`. Sem essa ligação não dá para saber que obra é "minha" no front. Propostas:
- Adicionar coluna `userId varchar references users(id)` em ambas.
- Backfill: para usuários existentes criados antes do registro, criar a row vinculada no primeiro login.

## 7. Endpoints
- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout`
- `GET /api/auth/me`
- `POST /api/auth/verify-email`
- `POST /api/auth/resend-verification`
- `POST /api/auth/forgot-password`
- `POST /api/auth/reset-password`
- `POST /api/auth/refresh`
- `[...nextauth]` em [app/api/auth/[...nextauth]/](../../app/api/auth/[...nextauth]/)

## 8. Mocks a remover
Nenhum mock relevante aqui — auth é real. Auditar se restou alguma flag.

## 9. Checklist de implementação
- [x] Confirmar que `register` cria `clientes`/`empreiteiras` row vinculada — `createUserWithProfile` em transação Drizzle
- [x] Adicionar coluna `userId` em `clientes` e `empreiteiras` se ainda não existir — com `UNIQUE` para idempotência
- [x] Validar redirect pós-login para dashboard correto por role — `resolvePostLoginRedirect` com allowlist por prefixo
- [x] Verificar fluxo de email em produção (provider Resend configurado) — domínio `dinamicareforma.com.br` verificado, `EMAIL_FROM=noreply@dinamicareforma.com.br`
- [x] Forçar `emailVerified` antes de liberar criação de obra (J03) e candidatura (J05) — guard `requireVerifiedUser` em `/api/obras`, `/api/empreiteiro/candidaturas`, `/api/clientes`, `/api/empreiteiras`
- [x] Cobrir reset de senha ponta-a-ponta — fluxo email→token→nova senha funciona; suíte automatizada fica como follow-up
- [x] Documentar credenciais seed (`admin@xconstrucao.com / 123456`, `joao@construtora.com / 123456`, `maria@empreiteira.com / 123456`)

## 10. Critérios de aceite
1. Cadastrar como contratante → receber email → verificar → fazer login → cair em `/contratante/dashboard`.
2. Mesmo fluxo como empreiteiro → cair em `/empreiteiro/dashboard`.
3. Tentar criar obra sem email verificado → ser bloqueado.
4. `SELECT u.email, c.id FROM users u LEFT JOIN clientes c ON c.user_id = u.id WHERE u.role='contratante'` — todos contratantes têm cliente.
5. Reset de senha: solicitar, abrir email, redefinir, login com nova senha.

## 11. Riscos / Pontos de atenção
- httpOnly cookies + Replit: documentado em [../_arquivado/DEBUG_AUTH_FLOW.md](../_arquivado/DEBUG_AUTH_FLOW.md).
- `SESSION_SECRET` precisa estar definido em produção.
- Conflito entre NextAuth e auth custom em [server/auth.ts](../../server/auth.ts): definir qual é canônico.

## 12. Links cruzados
- Bloqueia: J02, J03, J04, J05, todas as outras.

## 13. Gaps descobertos durante execução
> Doc viva. Registrar aqui o que apareceu no caminho e não estava no roteiro original. Uma linha por item, com data.

- 2026-05-07 — **Auth canônica formalizada**: JWT custom em `server/auth.ts` é o caminho oficial; NextAuth `[...nextauth]` existe **só** para handshake do Google OAuth, com `oauth-convert` traduzindo a sessão NextAuth nos cookies httpOnly `access_token`/`refresh_token`. Documentado no header de `server/auth.ts`.
- 2026-05-07 — **Persona OAuth via cookie short-lived**: a landing/login seta cookie `x_signup_persona` (10min, SameSite=Lax) antes do `signIn("google", ...)`. O `oauth-convert` lê o cookie e, se for primeiro login (sem profile row), atualiza `users.role` para a persona escolhida **antes** de chamar `ensureProfileRow` — evita criar a row errada. Cookie é limpo após consumo.
- 2026-05-07 — **Atomicidade no register**: `createUserWithProfile` envolve user-insert + profile-insert em uma transação Drizzle. Se o profile falha, o user também é descartado, eliminando o estado "user órfão sem clientes/empreiteiras".
- 2026-05-07 — **Idempotência via UNIQUE constraint**: `clientes.user_id` e `empreiteiras.user_id` viraram `UNIQUE`, e `ensureProfileRow` usa `onConflictDoNothing` para resistir a chamadas concorrentes do register, do verify-email e do oauth-convert sem condição de corrida.
- 2026-05-07 — **Defaults de domínio na auto-criação**: contratantes nascem como `tipo='Pessoa Física'`, `status='aprovacao'`; empreiteiros como `status='aprovacao'` com `responsavel = user.name`. O preenchimento rico (CPF/CNPJ, endereço, especialidades, foto) fica para a Jornada 02.
- 2026-05-07 — **Seed reset automático**: `server/seed.ts` detecta seed legado (sem `user_id` linkado) e zera `financeiro→candidaturas→obras→clientes→empreiteiras→accounts→sessions→verification_tokens→users` antes de re-seedar com `joao@construtora.com → cliente "João Oliveira"` e `maria@empreiteira.com → empreiteira "Maria Fernandes"` já vinculados. Demais clientes/empreiteiras ficam como rows admin-criadas (`userId=NULL`).
- 2026-05-07 — **Banner persistente + toast em mutations**: `EmailVerificationBanner` (amber, não-dispensável) montado nos layouts de `/contratante` e `/empreiteiro`, com botão "Reenviar email". O `MutationCache` global em `lib/queryClient.ts` faz toast destrutivo padronizado quando qualquer mutation devolve `403 EMAIL_NOT_VERIFIED`.
- 2026-05-07 — **Redirect pós-login com allowlist por role**: `resolvePostLoginRedirect(role, next)` aceita `?next=` apenas se for path interno (começa com `/`, não com `//`) e o prefixo bater com a role do usuário (`/admin*` para admin, `/contratante*` para contratante, etc.). Bloqueia open redirect e escalação cruzada de role.
- 2026-05-07 — **Validação E2E (curl)**: login `joão@construtora.com` → `POST /api/obras` = 201; com `email_verified=NULL` → 403 `{ error: "EMAIL_NOT_VERIFIED" }`. Register transacional cria user + empreiteira juntos. Suíte Playwright completa fica como follow-up (#4).
