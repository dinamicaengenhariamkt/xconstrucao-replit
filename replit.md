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

## Recent Changes
- 2026-02-13: Migrated from Vite+Express to Next.js 16 App Router
- All API routes migrated to Next.js Route Handlers
- All pages migrated to App Router with proper client/server component separation
- Tailwind CSS v4 with PostCSS plugin configured
- Auth flow: login returns { user } wrapper, /me returns user directly
- E2E tests passed: login, dashboard navigation, CRUD pages
- Old Vite/Express files cleaned up
