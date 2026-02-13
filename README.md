# Sistema de Gestão de Construção Civil

Sistema completo para gerenciar obras, clientes, empreiteiras e financeiro no setor de construção civil.

## Tecnologias

- **Frontend:** React + TypeScript + Vite
- **Backend:** Express + TypeScript
- **Banco de Dados:** PostgreSQL
- **ORM:** Drizzle
- **Autenticação:** JWT + bcryptjs

## Credenciais de Desenvolvimento

Para testes locais, use as seguintes credenciais:

- **Email:** admin@xconstrucao.com
- **Senha:** 123456
- **Role:** admin

> **Nota:** Em ambiente de produção, uma senha mais segura é utilizada automaticamente.

## Instalação

```bash
# Instalar dependências
npm install

# Configurar banco de dados
npm run db:push

# Executar seed (criar dados iniciais)
npm run dev
```

## Scripts Disponíveis

- `npm run dev` - Inicia o servidor de desenvolvimento
- `npm run build` - Build para produção
- `npm run db:push` - Sincroniza schema do banco de dados
- `npm run db:studio` - Abre Drizzle Studio para visualizar dados

## Estrutura do Projeto

```
├── client/          # Frontend React
├── server/          # Backend Express
├── shared/          # Código compartilhado (schemas, types)
└── db/              # Configuração do banco de dados
```
