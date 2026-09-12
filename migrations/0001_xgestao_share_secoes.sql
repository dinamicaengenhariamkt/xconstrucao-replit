-- XG04 — seções visíveis por link público.
--
-- Nullable de propósito: link emitido antes desta coluna continua válido e adota
-- SECOES_PADRAO na leitura. **Sem backfill, deliberadamente** — os padrões são
-- mais restritivos que o comportamento anterior, então links antigos deixam de
-- exibir diário e ocorrências até o dono ligá-los. Decidido em 2026-09-02, com
-- os links existentes ainda sendo de teste.
ALTER TABLE obra_share_links ADD COLUMN IF NOT EXISTS secoes JSONB;
