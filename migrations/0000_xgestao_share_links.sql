CREATE TABLE IF NOT EXISTS obra_share_links (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  token TEXT NOT NULL,
  criado_por VARCHAR NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
  ativo BOOLEAN NOT NULL DEFAULT TRUE,
  expira_em TIMESTAMP,
  visualizacoes INTEGER NOT NULL DEFAULT 0,
  ultimo_acesso_em TIMESTAMP,
  criado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE UNIQUE INDEX IF NOT EXISTS obra_share_links_token_uniq ON obra_share_links(token);
CREATE INDEX IF NOT EXISTS obra_share_links_obra_ativo_idx ON obra_share_links(obra_id, ativo);
CREATE UNIQUE INDEX IF NOT EXISTS obra_share_links_one_active_obra_uniq
  ON obra_share_links(obra_id) WHERE ativo = TRUE;