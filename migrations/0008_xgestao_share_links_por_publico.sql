-- XG30 — um link público por público.
--
-- "Teria que ter um link só para o cliente, para o cliente ver, e outro link,
-- por exemplo, arquiteto, às vezes o arquiteto não precisa saber de pagamento."
--
-- Até aqui a obra tinha no máximo um link ativo, e gerar outro revogava o
-- anterior. Cada link passa a ter nome e seções próprias; o teto de links
-- ativos por obra é aplicado no servidor. Links existentes viram "Cliente".
--
-- Idempotente, como as demais deste diretório: aplicado também em runtime por
-- server/bootstrap-obra-share-links.ts.
ALTER TABLE obra_share_links ADD COLUMN IF NOT EXISTS nome TEXT NOT NULL DEFAULT 'Cliente';
DROP INDEX IF EXISTS obra_share_links_one_active_obra_uniq;
