-- CRM-03/CRM-07 (10/11/2026): motivo do cancelamento do xgestão e registro dos
-- contatos do admin com o responsável. Espelha server/bootstrap-xgestao-admin-crm.ts.
ALTER TABLE assinaturas
  ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT,
  ADD COLUMN IF NOT EXISTS motivo_cancelamento_texto TEXT;

CREATE TABLE IF NOT EXISTS xgestao_admin_contatos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  empreiteira_id VARCHAR REFERENCES empreiteiras(id) ON DELETE SET NULL,
  admin_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email', 'telefone', 'outro')),
  nota TEXT CHECK (nota IS NULL OR char_length(nota) <= 1000),
  criado_em TIMESTAMP NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_xgestao_admin_contatos_user ON xgestao_admin_contatos (user_id, criado_em);
