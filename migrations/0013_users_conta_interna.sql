-- ADM-02: conta interna ou de teste, fora das métricas e listas do admin xgestão.
-- Espelha server/bootstrap-conta-interna.ts.
ALTER TABLE users ADD COLUMN IF NOT EXISTS conta_interna BOOLEAN NOT NULL DEFAULT FALSE;

-- A lista "Contas internas" do admin filtra por esta coluna; quase todas são false.
CREATE INDEX IF NOT EXISTS idx_users_conta_interna ON users (id) WHERE conta_interna = TRUE;
