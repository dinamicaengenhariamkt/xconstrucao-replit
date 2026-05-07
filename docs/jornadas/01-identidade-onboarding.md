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
- [ ] Confirmar que `register` cria `clientes`/`empreiteiras` row vinculada
- [ ] Adicionar coluna `userId` em `clientes` e `empreiteiras` se ainda não existir
- [ ] Validar redirect pós-login para dashboard correto por role
- [ ] Verificar fluxo de email em produção (provider Resend configurado)
- [ ] Forçar `emailVerified` antes de liberar criação de obra (J03) e candidatura (J05)
- [ ] Cobrir reset de senha ponta-a-ponta com teste manual
- [ ] Documentar credenciais seed (`admin@xconstrucao.com`)

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

- _Sem registros ainda._
