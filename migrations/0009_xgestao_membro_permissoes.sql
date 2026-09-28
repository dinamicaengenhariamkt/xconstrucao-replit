-- Phase B: nullable permission lists preserve unrestricted legacy membership access.
ALTER TABLE xgestao_membros
  ADD COLUMN IF NOT EXISTS areas_permitidas JSONB,
  ADD COLUMN IF NOT EXISTS categorias_financeiro_permitidas JSONB;