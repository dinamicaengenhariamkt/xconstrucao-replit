-- XG52 (10/11/2026): consentimento de e-mail de marketing (LGPD) e controle dos
-- e-mails automáticos do xgestão (rotina diária em /api/cron/xgestao-diario).
-- Espelhada em server/bootstrap-colunas-essenciais.ts (roda com await no boot).

-- Opt-in desmarcado por padrão: nulo = nunca aceitou. Ativo quando há
-- consentimento e não há revogação. Origem: cadastro, configuracoes ou descadastro.
ALTER TABLE users
  ADD COLUMN IF NOT EXISTS marketing_consentimento_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS marketing_revogado_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS marketing_origem TEXT;

-- Idempotência: cada aviso (usuário, tipo, referência) sai uma vez só.
CREATE TABLE IF NOT EXISTS xgestao_emails_enviados (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  referencia TEXT NOT NULL,
  enviado_em TIMESTAMP NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS uq_xgestao_emails_enviados
  ON xgestao_emails_enviados (user_id, tipo, referencia);
CREATE INDEX IF NOT EXISTS idx_xgestao_emails_enviados_em
  ON xgestao_emails_enviados (enviado_em);
