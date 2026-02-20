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

## Test Accounts
- Admin: admin@xconstrucao.com / 123456
- Contratante: joao@construtora.com / 123456
- Empreiteiro: maria@empreiteira.com / 123456

## Configuration
- `next.config.ts` - Next.js config (port 5000, allowedDevOrigins)
- `postcss.config.mjs` - PostCSS with @tailwindcss/postcss
- `tsconfig.json` - TypeScript with path aliases (@/, @shared/)
- Tailwind CSS v4 uses CSS-based config in globals.css (no tailwind.config.ts)

## Empreiteiro Feature Architecture
Feature-based architecture under `features/empreiteiro/`:
- Each feature has: types/, mocks/, hooks/, api/, components/ folders
- Mock data enabled via `NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK=true`
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

## Recent Changes
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
