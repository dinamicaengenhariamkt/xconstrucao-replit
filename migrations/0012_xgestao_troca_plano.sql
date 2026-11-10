-- XG48 — troca de plano do xgestão (subir na hora com proporcional na próxima
-- fatura; descer na renovação com escolha única de obras e pessoas).
-- Espelha server/bootstrap-troca-plano.ts. Idempotente.

ALTER TABLE obras ADD COLUMN IF NOT EXISTS xgestao_bloqueada_por_plano BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE obra_share_links ADD COLUMN IF NOT EXISTS pausado_por_plano BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE xgestao_membros ADD COLUMN IF NOT EXISTS status_antes_pausa TEXT;


CREATE TABLE IF NOT EXISTS assinatura_trocas (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  empreiteira_id VARCHAR REFERENCES empreiteiras(id) ON DELETE SET NULL,
  assinatura_id VARCHAR NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
  plano_de_id VARCHAR NOT NULL REFERENCES planos(id),
  plano_para_id VARCHAR NOT NULL REFERENCES planos(id),
  tier_de TEXT NOT NULL,
  tier_para TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('subir', 'descer')),
  valor_de NUMERIC(15,2) NOT NULL,
  valor_para NUMERIC(15,2) NOT NULL,
  valor_diferenca NUMERIC(15,2) NOT NULL DEFAULT 0,
  dias_restantes INTEGER NOT NULL DEFAULT 0,
  dias_ciclo INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CONSTRAINT assinatura_trocas_status_check
    CHECK (status IN ('pendente_gateway', 'agendada', 'aplicada', 'desfeita', 'cancelada', 'falhou')),
  efetiva_em TIMESTAMP NOT NULL,
  payment_id_ajustado TEXT,
  ajuste_pendente BOOLEAN NOT NULL DEFAULT FALSE,
  quitada_em TIMESTAMP,
  chave_idempotencia TEXT,
  escolhas JSONB NOT NULL DEFAULT '{}'::jsonb,
  erro TEXT,
  criada_em TIMESTAMP NOT NULL DEFAULT NOW(),
  aplicada_em TIMESTAMP,
  atualizada_em TIMESTAMP NOT NULL DEFAULT NOW()
);
-- REV-10: chave de idempotência por titular (antes era global).
DROP INDEX IF EXISTS uq_assinatura_trocas_chave;
CREATE UNIQUE INDEX IF NOT EXISTS uq_assinatura_trocas_user_chave ON assinatura_trocas(user_id, chave_idempotencia);
CREATE INDEX IF NOT EXISTS idx_assinatura_trocas_user_status ON assinatura_trocas(user_id, status);
CREATE INDEX IF NOT EXISTS idx_assinatura_trocas_assinatura ON assinatura_trocas(assinatura_id, status);
-- REV-11: as CHECKs só mudam quando falta algum valor (sem DROP + ADD a cada boot).
-- REV-07: 'pendente_gateway' = gravada antes de chamar o Asaas, fora da transação.
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.xgestao_membros'::regclass AND conname = 'xgestao_membros_status_check'
       AND pg_get_constraintdef(oid) LIKE '%''convidado''%' AND pg_get_constraintdef(oid) LIKE '%''ativo''%' AND pg_get_constraintdef(oid) LIKE '%''revogado''%' AND pg_get_constraintdef(oid) LIKE '%''pausado''%'
  ) THEN RETURN; END IF;
  ALTER TABLE xgestao_membros DROP CONSTRAINT IF EXISTS xgestao_membros_status_check;
  ALTER TABLE xgestao_membros ADD CONSTRAINT xgestao_membros_status_check CHECK (status IN ('convidado', 'ativo', 'revogado', 'pausado'));
END $$;
DO $$
BEGIN
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.assinatura_trocas'::regclass AND conname = 'assinatura_trocas_status_check'
       AND pg_get_constraintdef(oid) LIKE '%''pendente_gateway''%' AND pg_get_constraintdef(oid) LIKE '%''agendada''%' AND pg_get_constraintdef(oid) LIKE '%''aplicada''%' AND pg_get_constraintdef(oid) LIKE '%''desfeita''%' AND pg_get_constraintdef(oid) LIKE '%''cancelada''%' AND pg_get_constraintdef(oid) LIKE '%''falhou''%'
  ) THEN RETURN; END IF;
  ALTER TABLE assinatura_trocas DROP CONSTRAINT IF EXISTS assinatura_trocas_status_check;
  ALTER TABLE assinatura_trocas ADD CONSTRAINT assinatura_trocas_status_check CHECK (status IN ('pendente_gateway', 'agendada', 'aplicada', 'desfeita', 'cancelada', 'falhou'));
END $$;

-- No máximo uma descida agendada por assinatura.
CREATE UNIQUE INDEX IF NOT EXISTS uq_assinatura_trocas_agendada
  ON assinatura_trocas(assinatura_id) WHERE status = 'agendada';
