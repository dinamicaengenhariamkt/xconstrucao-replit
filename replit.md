# XConstrução - Construction Management Platform

## Overview
XConstrução is a comprehensive construction management platform that connects contractors (contratantes) with builders (empreiteiros). Built with Express + React + PostgreSQL (Drizzle ORM).

## Architecture
- **Frontend**: React + Vite + TanStack Query + wouter + shadcn/ui + Tailwind CSS
- **Backend**: Express.js with custom JWT auth (cookie-based)
- **Database**: PostgreSQL via Drizzle ORM
- **Font**: Manrope (Google Fonts)
- **Primary Color**: HSL 158 64% 32% (green/teal) - #22846D

## Key Files
- `shared/schema.ts` - Database schema + Zod validation
- `server/routes.ts` - API endpoints
- `server/auth.ts` - JWT authentication
- `server/storage.ts` - Database operations
- `server/seed.ts` - Seed data
- `client/src/App.tsx` - Router + providers
- `client/src/lib/auth.tsx` - Auth context
- `client/src/pages/` - All page components

## User Preferences
- All UI text in Portuguese (pt-BR)
- Currency formatted as BRL (R$)
- Multi-role system: admin, contratante, empreiteiro
- Clean, professional design with Manrope font

## Test Accounts
- Admin: admin@xconstrucao.com / admin123
- Contratante: joao@construtora.com / user123
- Empreiteiro: maria@empreiteira.com / user123

## Recent Changes
- 2026-02-12: Initial build - Full CRUD for clientes, empreiteiras, obras, financeiro
- Database seeded with sample data (5 clients, 4 empreiteiras, 6 obras, 10 financial records)
- Dark/light mode toggle implemented
