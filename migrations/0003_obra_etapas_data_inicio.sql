-- XG10 — data de início da etapa.
--
-- `obra_etapas.prazo` sempre foi o fim previsto; faltava o começo para desenhar
-- a barra no gráfico de Gantt da nova aba Cronograma.
--
-- Idempotente: a tabela já existe nos ambientes publicados, então a coluna
-- entra por ALTER ... IF NOT EXISTS (ver server/bootstrap-medicoes-extras.ts).
-- Nullable de propósito — etapas já cadastradas não têm início definido, e
-- exigir um valor inventado distorceria o cronograma.

ALTER TABLE obra_etapas ADD COLUMN IF NOT EXISTS data_inicio TIMESTAMP;
