-- XG50 (10/11/2026): anti-abuso do fluxo de pagamento do xgestão.
-- Teste grátis e mês bônus valem uma vez por CPF/CNPJ (não só por conta), e as
-- tentativas negadas viram eventos por conta (`bonus_negado`, `teste_negado`).
-- Espelhada em server/bootstrap-colunas-essenciais.ts (roda com await no boot).
ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS documento_fiscal TEXT;
CREATE INDEX IF NOT EXISTS idx_assinaturas_documento_fiscal
  ON assinaturas (documento_fiscal) WHERE documento_fiscal IS NOT NULL;

ALTER TABLE assinatura_eventos
  ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE;
CREATE INDEX IF NOT EXISTS idx_assinatura_eventos_user_tipo
  ON assinatura_eventos (user_id, tipo) WHERE user_id IS NOT NULL;

-- Plano anual preparado e desligado: `platform_settings` chave `xgestao`,
-- campo `anualAtivo` (ausente = false). Ligar só depois de preencher
-- `planos.valor_anual` dos planos do xgestão.
