# XConstrução - Construction Management Platform

## Overview
XConstrução is a comprehensive construction management platform that connects contractors (contratantes) with builders (empreiteiros). Built with Next.js 16 App Router + PostgreSQL (Drizzle ORM).

## Architecture
- **Framework**: Next.js 16 App Router (server/client components)
- **Frontend**: React 19 + TanStack Query + shadcn/ui + Tailwind CSS v4
- **Backend**: Next.js API Route Handlers (app/api/)
- **Database**: PostgreSQL via Drizzle ORM
- **Auth**: JWT tokens in httpOnly cookies
- **Font**: Manrope (Google Fonts)
- **Primary Color**: dark gray #333333
- **Port**: 5000 (bound to 0.0.0.0)

## Key Files
- `shared/schema.ts` - Database schema + Zod validation
- `server/auth.ts` - JWT authentication utilities
- `server/storage.ts` - Database operations (IStorage interface)
- `server/db.ts` - Database connection
- `server/seed.ts` - Seed data
- `server/index.ts` - Entry point (spawns Next.js dev server)
- `instrumentation.ts` - Next.js instrumentation (runs seed on startup)
- `app/layout.tsx` - Root layout with Manrope font
- `app/globals.css` - Tailwind v4 config with @theme blocks
- `app/page.tsx` - Landing page
- `app/login/page.tsx` - Login page
- `app/register/page.tsx` - Registration page
- `app/dashboard/layout.tsx` - Dashboard layout with sidebar + auth guard
- `app/dashboard/page.tsx` - Dashboard stats
- `app/dashboard/clientes/page.tsx` - Clients CRUD
- `app/dashboard/empreiteiras/page.tsx` - Contractors CRUD
- `app/dashboard/obras/page.tsx` - Projects CRUD
- `app/dashboard/financeiro/page.tsx` - Financial records CRUD
- `app/api/` - All API route handlers
- `components/app-sidebar.tsx` - Sidebar navigation
- `components/providers.tsx` - Client providers (QueryClient, Auth, Theme)
- `lib/auth.tsx` - Auth context (client-side)
- `lib/queryClient.ts` - TanStack Query client + apiRequest helper

## API Routes
- `POST /api/auth/login` - Returns `{ user }` + sets cookie
- `POST /api/auth/register` - Returns `{ user }` + sets cookie
- `POST /api/auth/logout` - Clears cookie
- `GET /api/auth/me` - Returns user data
- `GET /api/dashboard/stats` - Dashboard statistics
- `GET/POST /api/clientes` - List/Create clients
- `GET/PUT/DELETE /api/clientes/[id]` - Single client operations
- `GET/POST /api/empreiteiras` - List/Create contractors
- `GET/PUT/DELETE /api/empreiteiras/[id]` - Single contractor operations
- `GET/POST /api/obras` - List/Create projects
- `GET/PUT/DELETE /api/obras/[id]` - Single project operations
- `GET/POST /api/financeiro` - List/Create financial records

## User Preferences
- All UI text in Portuguese (pt-BR)
- Currency formatted as BRL (R$)
- Multi-role system: admin, contratante, empreiteiro
- Clean, professional design with Manrope font
- Dark/light mode toggle

## Test Accounts (senhas fortes — política "balanced")
- Super Admin (auto-promovido): admin@xconstrucao.com / Admin@2026!Constru
- Contratante: joao@construtora.com / Joao@2026!Obras
- Empreiteiro: maria@empreiteira.com / Maria@2026!Reforma

## Política de Senha (Task #10)
- Mínimo 8 caracteres + 3 das 4 categorias (maiúscula/minúscula/número/especial).
- Bloqueia senhas comuns e que contenham email/nome/usuário.
- Implementação: `features/auth/schemas/password.ts` (`evaluatePasswordPolicy`, `passwordStrength`).
- Aplicada em registerSchema e endpoint `/api/auth/reset-password`. Login só exige `min(1)` (não quebra contas legadas).

## Anti-bot (Task #10)
- Honeypot DOM (`<HoneypotField>`) + timing min 1.5s (`useAntiBotPayload` / `validateAntiBot`).
- Aplicado em login, cadastro e recuperar-senha.
- Em login/registro a falha vira mensagem genérica; em forgot-password vira "sucesso" silencioso.

## Reset destrutivo + reseed
- `scripts/reset-and-seed.ts` — em produção exige `CONFIRM_PROD_RESET=YES`.

## Configuration
- `next.config.ts` - Next.js config (port 5000, allowedDevOrigins)
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss
- `tsconfig.json` - TypeScript with path aliases (@/, @shared/)
- Tailwind CSS v4 uses CSS-based config in globals.css (no tailwind.config.ts)

## Transactional Email (Brevo)
- Provider: **Brevo** via HTTP API `POST https://api.brevo.com/v3/smtp/email` (header `api-key`).
- Service module: `shared/lib/email.ts` exposes `sendVerificationEmail`, `sendWelcomeEmail`, `sendPasswordResetEmail`. Templates in `features/auth/emails/*.tsx` rendered with `@react-email/render`.
- Required secret: `BREVO_API_KEY` (Replit Secret). Required env: `EMAIL_FROM=noreply@dinamicareforma.com.br` (domain must be verified inside the Brevo account).
- Sender exibido: `XConstrução <noreply@dinamicareforma.com.br>`.
- Test mode: `EMAIL_TEST_MODE=1` → emails são capturados em memória (`shared/lib/test-email-store.ts`) e expostos por `/api/test/emails` para os E2E. A API da Brevo NÃO é chamada nesse modo.

## Feature Architecture (Empreiteiro & Contratante)
Feature-based architecture under `features/empreiteiro/` and `features/contratante/`:
- Each feature has: types/, mocks/, hooks/, api/, components/ folders
- Mock data enabled via `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK=true` (shared for both roles)
- React Query hooks with 5min stale time, Zustand for state (xchat)
- Shared components in `features/shared/components/` (PageHeader, FilterChips, StatusBadge, ProgressBar)
- Shared types in `features/shared/types/`

### Empreiteiro Pages
- `/empreiteiro/dashboard` - Stats overview, financial charts, recent activities
- `/empreiteiro/minhas-obras` - Active projects with status filters (em execução, com atrasos, pendências, planejamento, finalizadas)
- `/empreiteiro/novas-obras` - Available projects with complexity filters, blocked state banner
- `/empreiteiro/novas-obras/[id]` - Project detail with hero, accordion sections, 3 application states
- `/empreiteiro/chat` - Two-panel messaging (conversations list + messages area)
- `/empreiteiro/faq` - FAQ with hero search, category tabs, accordion items

### Empreiteiro Nav Constants
- `features/empreiteiro/constants.ts` - EMPREITEIRO_NAV_ITEMS, EMPREITEIRO_BOTTOM_NAV_ITEMS
- Sidebar: `features/empreiteiro/components/EmpreiteiroSidebar.tsx`

### Contratante Pages
- `/contratante/dashboard` - Stats overview (already complete, do not modify)
- `/contratante/minhas-obras` - Projects with status filters, grayscale→color hover cards
- `/contratante/minhas-obras/[id]` - Project detail with hero, KPIs, tabs (Visão Geral, Etapas, Financeiro, Equipe, Fotos)
- `/contratante/nova-obra` - Multi-card form (Info, Location, Timeline/Budget, Documents)
- `/contratante/pagamentos` - Financial KPIs, filters, transaction table with status badges
- `/contratante/chat` - Two-panel messaging with Zustand store
- `/contratante/faq` - FAQ with hero search, category tabs, accordion items

### Contratante Nav Constants
- `features/contratante/constants.ts` - CONTRATANTE_NAV_ITEMS (Nova Obra, Minhas Obras, Dashboard, Pagamentos, xchat), CONTRATANTE_BOTTOM_NAV_ITEMS (FAQ, Configurações)
- Sidebar: `features/contratante/components/ContratanteSidebar.tsx`

### Admin Pages
- `/admin/financeiro` - Financial dashboard with KPIs, charts, tables (already complete)
- `/admin/clientes` - Client list with filters, stats, search
- `/admin/clientes/[id]` - Client detail (cadastro info, KPIs, tabs)
- `/admin/clientes/[id]/obras` - Client's projects subpage
- `/admin/clientes/novo` - New client form (useForm + zodResolver)
- `/admin/empreiteiras` - Contractors list with filters, stats, search
- `/admin/empreiteiras/[id]` - Contractor detail (cadastro, KPIs, especialidades, rating)
- `/admin/empreiteiras/[id]/obras` - Contractor's projects subpage
- `/admin/empreiteiras/nova` - New contractor form (useForm + zodResolver)
- `/admin/caixa` - Cash flow overview with KPIs, period filter, movements table
- `/admin/entradas` - Income entries with category filters, search, table
- `/admin/saidas` - Expense entries with category filters, search, table
- `/admin/anuncios` - Ads management with KPIs, status filters, ad cards
- `/admin/faq` - FAQ management with category filters, search, accordion

### Admin Nav Constants
- `features/admin/constants.ts` - ADMIN_NAV_ITEMS (Cliente, Empreiteira, Financeiro, Caixa, Entradas, Saídas, Anúncios), ADMIN_BOTTOM_NAV_ITEMS (FAQ, Configurações)
- Sidebar: `features/admin/components/AdminSidebar.tsx`
- Topbar: `features/admin/components/AdminTopbar.tsx`
- Layout: `features/admin/components/AdminLayout.tsx`

## Super Admin & Gestão de Usuários (Task #20)
- **Bootstrap automático**: `server/bootstrap-superadmin.ts` roda em toda inicialização — adiciona enum `superadmin`, colunas `must_change_password`/`created_by`/`ativo`/`can_manage_users`, tabelas `audit_logs` + `password_setup_tokens`, e promove `admin@xconstrucao.com` para `superadmin` (idempotente).
- **Bootstrap CLI**: `npx tsx scripts/bootstrap-superadmin.ts --email <e> --name <n> --password <p> [--force-reset-password]` (também aceita env `SUPERADMIN_EMAIL`/`NAME`/`PASSWORD`/`FORCE_RESET=YES` ou prompts interativos). Valida política, garante invariante de pelo menos 1 super admin ativo, **insere `user_consents` v1.0 (termos + privacidade) idempotentes** e grava `audit_logs` (`action="cli.bootstrap-superadmin"`, ip="cli").
- **Permissão "Gerenciar usuários"** (`can_manage_users`): super admin tem acesso implícito; admin precisa do flag (controlado por super admin no edit dialog). Aba Usuários e endpoints `/api/admin/usuarios*` aplicam o gate via `hasUsersTabAccess()`. `/api/auth/me` devolve `canManageUsers` para o front esconder a aba.
- **Aba Usuários**: `/admin/configuracoes?tab=usuarios` (`features/admin/components/UsuariosTab.tsx`) — listar/criar/editar (incluindo email com checagem 409)/desativar/resetar senha. Super admin gerencia todos; admin gerencia apenas contratante/empreiteiro (e somente se `can_manage_users=true`). Filtros (perfil, status), busca e paginação visíveis.
- **3 modos de senha** (criação ou reset): `random` (default — gera 16 chars + força troca), `manual` (define + checkbox "exigir troca no 1º login" default ON), `link` (e-mail Brevo com token URL-safe TTL 24h). **Em qualquer modo a credencial atual é invalidada imediatamente** — modo `link` grava um hash aleatório descartado e seta `must_change_password=true`, garantindo que a senha antiga deixa de funcionar no instante do reset/criação. Endpoint `/api/admin/usuarios` aceita `forceChangeOnFirstLogin` (default true; só desligável em modo manual).
- **Troca obrigatória 1º login**: `must_change_password=true` → `AuthSessionGuard` redireciona o front para `/trocar-senha-obrigatoria`; **enforcement no servidor** acontece em duas camadas — `requireVerifiedUser` rejeita 403 PASSWORD_CHANGE_REQUIRED em rotas que usam o guard, e `proxy.ts` (Edge) bloqueia GLOBALMENTE todas as rotas `/api/*` (lendo o claim `mustChangePassword` do JWT) com allowlist mínima (`change-password-forced`, `logout`, `me`, `refresh`, `definir-senha-inicial`). Endpoint `POST /api/auth/change-password-forced` valida política, remove flag, **persiste novo `sessions` row** (evita "Sessão revogada" no próximo refresh) e reemite cookies com `mustChangePassword:false`. `canManageUsers` e `mustChangePassword` viajam no payload de `/api/auth/login` e `/api/auth/refresh`.
- **Definição inicial via link**: `/definir-senha-inicial?token=...` consome token (sha256 hash em DB) e ativa conta. Endpoint `POST /api/auth/definir-senha-inicial`.
- **Modo "Ver como" (impersonation)**: `POST /api/admin/impersonate/[id]` (apenas super admin) emite cookie HMAC `impersonation_token` (TTL 1h). `requireVerifiedUser` substitui o `user` pelo target em verbos read-only. **Bloqueio global**: `proxy.ts` (Edge) intercepta TODAS rotas `/api/*` em verbos mutáveis e devolve **403 IMPERSONATION_READ_ONLY** sempre que o cookie `impersonation_token` está presente — cobre rotas legadas sem `requireVerifiedUser`. Layouts contratante/empreiteiro permitem `superadmin` quando impersonando, redirect por target.role. Banner persistente `ImpersonationBanner.tsx`. `POST /api/admin/impersonate/exit` encerra.
- **Conta inativa**: login devolve `403 ACCOUNT_DISABLED`; `requireVerifiedUser` bloqueia idem.
- **Audit log**: toda criação/edição/reset/impersonate é gravada em `audit_logs` (actor, action, target, payload, IP, UA).
- **Endpoints novos**:
  - `GET/POST /api/admin/usuarios`, `GET/PATCH/DELETE /api/admin/usuarios/[id]`
  - `POST /api/admin/usuarios/[id]/reset-password`, `POST /api/admin/usuarios/[id]/ativo`
  - `POST /api/admin/impersonate/[id]`, `POST /api/admin/impersonate/exit`
  - `POST /api/auth/change-password-forced`, `POST /api/auth/definir-senha-inicial`
- **Helpers**: `features/auth/api/{audit,password-generator,impersonation,password-setup-tokens}.ts`.

## Recent Changes
- 2026-05-12: Task #20 — super admin auto-promovido, aba Usuários CRUD, modo Ver como (read-only), troca obrigatória de senha 1º login, fix do cadastro silencioso (toast + erros inline), bloqueio de login para conta inativa.
- 2026-05-10: Transactional email migrated to Brevo (HTTP API, secret `BREVO_API_KEY`). Same function signatures in `shared/lib/email.ts`, same templates, same `EMAIL_TEST_MODE` capture path. Legacy `lib/email.ts` and previous provider package/secret removed.
- 2026-02-21: Built complete admin internal views (Clientes, Empreiteiras, Caixa, Entradas, Saídas, Anúncios, FAQ with full CRUD forms)
- 2026-02-20: Built complete contratante internal views (Minhas Obras, Detalhes da Obra, Nova Obra, Pagamentos, xchat, FAQ)
- 2026-02-20: Built complete empreiteiro internal views (Minhas Obras, Novas Obras, Detalhes da Obra, xchat, FAQ)
- 2026-02-13: Migrated from Vite+Express to Next.js 16 App Router
- All API routes migrated to Next.js Route Handlers
- All pages migrated to App Router with proper client/server component separation
- Tailwind CSS v4 with PostCSS plugin configured
- Auth flow: login returns { user } wrapper, /me returns user directly
- E2E tests passed: login, dashboard navigation, CRUD pages, empreiteiro features
- Old Vite/Express files cleaned up

## Replit Auth Notes
- Keep a stable `SESSION_SECRET` in Replit Secrets (required for JWT validation consistency across restarts)
- Access the app through a single canonical public URL during auth tests (avoid switching between preview/public domains)
- Login, refresh and protected APIs rely on `access_token` and `refresh_token` httpOnly cookies
- If `POST /api/auth/refresh` returns 401, validate if `refresh_token` is present in request cookies first
