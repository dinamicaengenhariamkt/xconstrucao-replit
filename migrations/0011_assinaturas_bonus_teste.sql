-- xgestão (10/11/2026): o mês bônus de quem assina durante o teste só vale com o
-- 1º pagamento e uma vez por conta. Espelha server/bootstrap-planos.ts.
ALTER TABLE assinaturas
  ADD COLUMN IF NOT EXISTS fim_teste_em TIMESTAMP,
  ADD COLUMN IF NOT EXISTS primeiro_pagamento_em TIMESTAMP;

-- PAG-10: tiers legados do xgestão (free/pro/enterprise) saem da oferta.
-- Assinaturas antigas nesses tiers seguem lidas pelo catálogo; só não são vendidas.
UPDATE planos SET ativo = FALSE
WHERE persona = 'xgestao' AND tier IN ('free', 'pro', 'enterprise') AND ativo = TRUE;
