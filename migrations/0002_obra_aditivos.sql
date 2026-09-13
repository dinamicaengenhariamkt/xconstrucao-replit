-- XG10 — aditivos de contrato da obra.
--
-- Até aqui o valor de aditivos era `0` hardcoded nos serviços de detalhe,
-- embora o card já aparecesse no resumo financeiro. Esta tabela dá fonte de
-- dado ao card e a `valorTotal = valorContratado + aditivos`.
--
-- Idempotente (IF NOT EXISTS), como as demais deste diretório: o schema é
-- aplicado por `drizzle-kit push` + bootstrap em runtime
-- (server/bootstrap-obra-aditivos.ts), não por migrations versionadas.
--
-- `valor` é assinado de propósito: aditivo de supressão reduz o escopo.

CREATE TABLE IF NOT EXISTS obra_aditivos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  obra_id VARCHAR NOT NULL REFERENCES obras(id) ON DELETE CASCADE,
  descricao TEXT NOT NULL,
  valor NUMERIC(15,2) NOT NULL,
  data TEXT NOT NULL,
  criado_por VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_obra_aditivos_obra ON obra_aditivos(obra_id);
