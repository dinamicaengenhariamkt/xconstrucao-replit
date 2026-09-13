-- XG10 — anexo da obra pode ser um LINK externo, não só arquivo no bucket.
--
-- "A maioria dos projetos vem em Drive... então eu posso deixar o link do Drive
-- aqui, entendeu? Tem que poder colocar um link de fácil acesso" (16:21–16:32).
--
-- `file_id` perde o NOT NULL para acomodar a linha só-link; a API exige
-- exatamente um dos dois (arquivo OU link), então nenhum anexo fica sem origem.
-- Idempotente, como as demais deste diretório.

ALTER TABLE obra_anexos ADD COLUMN IF NOT EXISTS link_url TEXT;
ALTER TABLE obra_anexos ADD COLUMN IF NOT EXISTS titulo TEXT;
ALTER TABLE obra_anexos ALTER COLUMN file_id DROP NOT NULL;
