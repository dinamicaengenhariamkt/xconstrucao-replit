-- XG20 — a saída passa a registrar PARA QUEM o dinheiro foi.
--
-- "Quando vai cadastrar a saída é bom eu ter um card para colocar qual que é a
-- pessoa que vai receber. Cadastrei lá o Jefferson de elétrica... eu posso
-- selecionar ele aqui. Porque depois no filtro eu posso colocar lá Jefferson
-- elétrica e eu vejo quanto eu paguei só para ele."
--
-- Antes, o beneficiário só existia como texto dentro da descrição — que é
-- literalmente o placeholder do campo. Texto livre não agrega: "Jefferson
-- Elétrica" e "jefferson eletrica" contam como duas pessoas.
--
-- `pagador_user_id`/`recebedor_user_id` não servem aqui: são FK para `users`, e
-- o beneficiário típico não tem conta na plataforma (`obra_equipe.user_id` é
-- nullable de propósito). Além disso, são essas colunas que alimentam os KPIs
-- de receita/custo da obra — reaproveitá-las quebraria os totais do topo.
--
-- `ON DELETE SET NULL` porque remover alguém da equipe não pode apagar o
-- histórico financeiro; `fornecedor_nome` guarda o snapshot do nome para o
-- lançamento continuar legível depois disso.
--
-- Idempotente, como as demais deste diretório: o schema é aplicado por
-- `drizzle-kit push` + bootstrap em runtime
-- (server/bootstrap-financeiro-fornecedor.ts), não por migrations versionadas.

ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS fornecedor_id VARCHAR;
ALTER TABLE financeiro ADD COLUMN IF NOT EXISTS fornecedor_nome TEXT;

DO $$ BEGIN
  ALTER TABLE financeiro
    ADD CONSTRAINT financeiro_fornecedor_id_fkey
    FOREIGN KEY (fornecedor_id) REFERENCES obra_equipe(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE INDEX IF NOT EXISTS idx_financeiro_obra_fornecedor ON financeiro(obra_id, fornecedor_id);
