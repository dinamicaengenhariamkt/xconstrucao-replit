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

## Convenções de planejamento
- **Toda task do board cita a jornada de origem** num cabeçalho no topo do plan file (`> Jornada: JXX — Nome (docs/jornadas/XX-...md)`). Quem abrir a task no futuro vai direto pro roteiro completo.
- **Gap fora de escopo descoberto durante a execução** → 1 linha datada (`AAAA-MM-DD (Task #N): ...`) na seção 13 "Gaps descobertos durante execução" do markdown da jornada correspondente. Não cria task nova só por isso — vira backlog rastreado por jornada.
- **Gap grande sem casa** → nova jornada numerada (14...) a partir de `docs/jornadas/_template.md` + atualizar índice de `docs/jornadas/README.md`.
- **Checklist da seção 9 de cada jornada** é fonte de verdade do que está pronto/falta. Ao fechar uma task marcar `[x]` com `_(Task #N)_` e atualizar o status no índice quando a jornada mudar de fase (`mock → parcial → revisão → pronto`).

## Super Admin & Gestão de Usuários (Task #20)
- **Superadmin = "admin++" nos gates administrativos** (Task #31): endpoints que historicamente faziam `role !== "admin"` literal foram migrados pro helper `isAdminLike(role)` em `features/auth/api/auth-utils.ts` (libera `admin` e `superadmin`, mantém `contratante`/`empreiteiro` bloqueados). Aplicado em: `app/api/perfil/admin/route.ts`, `app/api/admin/configuracoes/route.ts`, `app/api/admin/integracoes/api-key/route.ts`, `app/api/admin/clientes/[id]/aprovacao/route.ts`, `app/api/admin/empreiteiras/[id]/aprovacao/route.ts`. **Não migrado de propósito**: `app/api/auth/oauth-convert/route.ts:59` (semântica para superadmin não óbvia — registrar gap antes de mexer). Em rotas novas administrativas, **sempre** preferir `isAdminLike()` ao literal.
- **Bootstrap automático**: `server/bootstrap-superadmin.ts` roda em toda inicialização — adiciona enum `superadmin`, colunas `must_change_password`/`created_by`/`ativo`/`can_manage_users`, tabelas `audit_logs` + `password_setup_tokens`, e promove `admin@xconstrucao.com` para `superadmin` (idempotente).
- **Bootstrap CLI**: `npx tsx scripts/bootstrap-superadmin.ts --email <e> --name <n> [--password <p>] [--force-reset-password]` (também aceita env `SUPERADMIN_EMAIL`/`NAME`/`PASSWORD`/`FORCE_RESET=YES` ou prompts interativos). **Se nenhuma senha for informada (e o stdin não for um TTY), o script gera uma senha forte de 16 chars automaticamente, marca `must_change_password=true` e a imprime UMA ÚNICA VEZ no final** (use sempre que rodar em produção sem informar senha). Valida política, **gate estrito**: se já existe ≥1 super admin ativo, recusa criar/promover/reativar uma conta DIFERENTE sem `--force-reset-password` (operações idempotentes na mesma conta super existente seguem permitidas). Garante invariante de pelo menos 1 super admin ativo após a operação, **insere `user_consents` v1.0 (termos + privacidade) idempotentes** e grava `audit_logs` (`action="cli.bootstrap-superadmin"`, ip="cli").
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

## Cloudflare R2 + Uploads (Task #26)
- **Storage layer genérico**: `shared/lib/storage/r2.ts` (S3Client v3, presign PUT, sign GET, delete, head), `key-builder.ts` (rotas: `public/avatars/{role}/{userId}/...`, `public/empreiteiro/{userId}/portfolio/...`, `private/empreiteiro/{userId}/documentos/{tipo}/...`), `validation.ts` (`KIND_RULES` com mime/limite por kind: avatar 2MB, portfolio 8MB, documento 15MB).
- **Schema**: tabela `user_files` (kind, visibility public/private, key, mime, sizeBytes, ownerUserId) + `empreiteiro_documentos` (fileId, tipo, observacao). Bootstrap idempotente em `server/bootstrap-storage.ts` (chamado por `instrumentation.ts`).
- **API**:
  - `POST /api/uploads/presign` — devolve `{ url, key, headers }` (presign PUT 5min, valida kind/mime/size, anti-tamper checa userId na key).
  - `POST /api/uploads/commit` — HEAD R2 para confirmar upload + cria `user_files` row + side-effects (avatar→atualiza `users.avatarUrl` + perfil empreiteira/cliente; documento→cria `empreiteiro_documentos` + audit log; portfolio sem side-effect — page chama `updatePerfil`).
  - `GET /api/uploads/sign?id=...` e `GET /api/uploads/[id]` (signed URL TTL 15min, valida ownership ou superadmin).
  - `DELETE /api/uploads/[id]` — remove no R2 + DB + audit (`uploads.delete.documento`).
  - `GET /api/perfil/empreiteiro/documentos` — lista documentos do empreiteiro logado com signed URLs.
- **Hook + UI**: `features/shared/hooks/use-uploads.ts` (`useUpload` com XHR PUT + progresso, `deleteUpload`), `features/shared/components/FileUploader.tsx`, `features/perfil/hooks/use-documentos.ts` (`useEmpreiteiroDocumentos`, `useDeleteDocumento`).
- **Páginas migradas**:
  - `/empreiteiro/configuracoes` — avatar via R2, portfolio (imagens) via R2 + `updatePerfil({portfolioUrls})`, portfolioDocs stamped `${name}::${url}`. Nova aba **Documentos** (`SecaoDocumentos`) lista privada com upload (tipo + observação), baixar (link signed) e remover.
  - `/contratante/configuracoes` — avatar via R2 (`fileToDataUrl` removido).
  - `/admin/configuracoes` — avatar via R2 (botão "Enviar foto" ao lado do `<Avatar>`).
- **Secrets necessários** (Replit Secrets, NUNCA logar valores): `R2_ACCOUNT_ID`, `R2_ACCESS_KEY_ID`, `R2_SECRET_ACCESS_KEY`, `R2_BUCKET`, `R2_S3_ENDPOINT`, `R2_PUBLIC_BASE_URL`.
- **Segurança**: presign + commit dependem de `requireVerifiedUser`. Em impersonation, `proxy.ts` (Edge) já bloqueia mutações `/api/*` com 403 IMPERSONATION_READ_ONLY. Documentos privados nunca expõem URL pública — sempre via signed URL com TTL curto.

## Recent Changes
- 2026-05-25: Task #42 (J04.B) — backend marketplace paginado + obras-salvas. `GET /api/obras` agora devolve envelope `{ rows, total, page, pageSize, totalPages }` (clamp pageSize 1..100, default 20). Filtros novos: `cidade` ILIKE `%x%` (case-insensitive), `materiaisPor`, `tipo`. Empreiteiro: predicate `NOT EXISTS (candidatura sua)` usa `idx_candidaturas_obra_empreiteiro` (anti-self-apply). 3 endpoints novos: `GET/POST /api/empreiteiro/obras-salvas` e `DELETE /api/empreiteiro/obras-salvas/[obraId]` — POST `ON CONFLICT DO NOTHING` (idempotente), DELETE silencioso 200 (anti-oracle), favoritar `rascunho` ⇒ 404 (anti-enum), 403 para contratante/admin. Rate-limit 30/user + 60/ip por min em writes. Audit `obras-salvas.add|remove`. 6 callsites consumidores atualizados para `data?.rows` com `pageSize: 100` (mantém paginação client-side atual). Hook órfão `features/obras/hooks/use-obras.ts` + `features/obras/types/index.ts` deletados. Smoke `scripts/smoke-task42-marketplace.ts` cobre os 12 critérios da §10 J04 (12/12 ✓). J04§9 checklist marcado, §13 com 3 bullets datados (envelope renomeado, busca textual server-side adiada, paginação server-side em J04.C).
- 2026-05-25: Task #41 (J04.A) — fundação do Marketplace & Descoberta. Tabela `obras_salvas` (id, userId FK CASCADE, obraId FK CASCADE, createdAt, UNIQUE(userId,obraId)) + `insertObraSalvaSchema` em `shared/db/schema.ts`. Bootstrap idempotente `server/bootstrap-marketplace.ts` registrado em `instrumentation.ts` (mesmo pattern de #32): cria tabela + índices `uq_obras_salvas_user_obra`, `idx_obras_salvas_user_id`, e ainda `idx_candidaturas_obra_empreiteiro` + `idx_candidaturas_status` (estes últimos destravam a query anti-self-apply de J04 e o ranking de J05 — auditoria de #41 confirmou que `candidaturas` antes só tinha PK). Doc J04 reescrita ponta-a-ponta (12 critérios, cross-refs, riscos atualizados). Bullets cross-jornada em J02§13 (gap especialidades/zonaAtuacao) e J05§13 (índices herdados). Convenção `visibilidade='publicada'` vs `status` execução mantida. Endpoints e UI ficam nas tasks-filhas #42 (J04.B) e #43 (J04.C).
- 2026-05-25: Task #32 (J03.A) — schema de Obras estendido (13 colunas novas em `obras` + 4 enums + tabela `obra_anexos` + 4 índices). Bootstrap idempotente em `server/bootstrap-obras.ts` registrado em `instrumentation.ts` (mesmo pattern de `bootstrap-storage`). Backfill: linhas pré-existentes com `empreiteira_id IS NOT NULL` OU `status<>'planejamento'` viraram `visibilidade='publicada'`; resto ficou `rascunho`. `insertObraSchemaStrict` em `features/obras/schemas/index.ts` com `superRefine` condicional: rascunho exige só nome+endereco; publicada exige tipo/descricao(≥20)/cep/cidade/uf/modalidade/materiaisPor. Sem mudanças em UI/endpoints (vão pra #33). J02 promovida pra `revisão`. Docs J03/J04/J13/02/README atualizados. Convenção `status` (execução) vs `visibilidade` (marketplace) — dimensões ortogonais, ambos têm `pausada` intencionalmente.
- 2026-05-25: Task #31 (J02) — superadmin liberado nos 5 endpoints administrativos que faziam gate `role !== "admin"` literal (perfil/admin, /admin/configuracoes, /admin/integracoes/api-key, /admin/clientes/[id]/aprovacao, /admin/empreiteiras/[id]/aprovacao). Helper `isAdminLike()` adicionado em `features/auth/api/auth-utils.ts`. Aba **Perfil** do `/admin/configuracoes` deixa de ficar em Skeleton infinito para superadmins. Convenção "Convenções de planejamento" + cabeçalho `> Jornada: JXX` nos plan files. Jornada 02 atualizada (checklist + gaps).
- 2026-05-13: Task #26 (rev2) — schema completo: `users.avatar_file_id`, `empreiteiro_portfolio` (titulo/ordem) e `empreiteiro_documentos.status`. Commit grava `avatarFileId`, insere portfolio rows, e faz **replace-by-tipo** nos documentos (soft-delete da versão anterior). UI empreiteiro refeita: portfólio em grade de cards (título editável + reorder ↑/↓ + remover), documentos agrupados por **tipo obrigatório** (CNPJ, Alvará, Certidão Negativa, Outros) com badge `enviado`/`pendente` e botão Substituir/Enviar/Baixar/Remover. `/api/uploads/sign` aceita `?key=` (além de `?id=`); `/api/uploads/presign` aceita `filename` (compat com `originalName`). Avatar trocado refresca o store de auth para refletir no topbar/sidebar.
- 2026-05-13: Task #26 — integração Cloudflare R2 + uploads (avatar/portfolio público, documentos privados via URL assinada). Aba Documentos no empreiteiro, uploaders de avatar nas três visões.
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
