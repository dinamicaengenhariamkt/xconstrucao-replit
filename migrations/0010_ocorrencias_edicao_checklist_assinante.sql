-- Ocorrências com edição completa: observação da resolução (mostrada no link
-- do cliente quando a seção está ligada) e momento da última alteração.
--
-- EMP-08: a assinatura do checklist guarda quem estava logado. O nome digitado
-- (`assinado_por`) continua como texto de exibição.
--
-- Idempotente, como as demais deste diretório: aplicado também em runtime por
-- server/bootstrap-obra-ocorrencias-edicao.ts.
ALTER TABLE obra_ocorrencias ADD COLUMN IF NOT EXISTS observacao_resolucao TEXT;
ALTER TABLE obra_ocorrencias ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP;
ALTER TABLE obra_checklists ADD COLUMN IF NOT EXISTS assinado_por_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL;
