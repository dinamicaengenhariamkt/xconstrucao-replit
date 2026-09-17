-- XG21 — o checklist passa a se repetir sozinho, sem perder o histórico.
--
-- "Tem que colocar algum tipo de recorrência, ou diário, ou semanal, porque
-- senão eu tenho que criar todo dia que for fazer o checklist (...) deu
-- meia-noite, ele zera, o stick some, daí eu tenho que ir lá na obra e ticar
-- tudo de novo (...) Aí o cliente entra no dia lá, se tiver sem ticar, quer
-- dizer que não foi feito no dia."
--
-- São duas necessidades, e a segunda é a difícil: zerar E provar depois o que
-- foi (ou não foi) feito em cada dia. Hoje o tique é
-- `obra_checklist_itens.concluida`, um booleano destrutivo — zerar ali apagaria
-- a evidência de que os EPIs foram conferidos ontem.
--
-- Por isso `obra_checklist_marcacoes`: cada tique é uma linha ancorada num
-- `periodo_ref` (YYYY-MM-DD em America/Sao_Paulo). O "zerar" não é um UPDATE —
-- é o período novo nascendo sem linhas. Isso também dispensa cron, que este
-- projeto não tem: o reset é calculado na leitura, não executado à meia-noite.
--
-- `item_ordem` em vez de `item_id`: o PATCH de edição faz DELETE + reinsert de
-- todos os itens (app/api/obras/[id]/checklists/[checklistId]/route.ts), então
-- os IDs mudam a cada correção de texto. Uma FK para `item_id` apagaria o
-- histórico inteiro por causa de um typo arrumado. A `ordem` é estável.
--
-- `recorrencia` é ortogonal ao `tipo`: o pedido foi reset diário num checklist
-- de SEGURANÇA/EPIs, não de tipo "Diário" (que é só rótulo e cor). Default
-- 'nenhuma' preserva o comportamento de todos os checklists existentes.
--
-- Idempotente, como as demais deste diretório: o schema é aplicado por
-- `drizzle-kit push` + bootstrap em runtime (server/bootstrap-obra-operacao.ts),
-- não por migrations versionadas.

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'obra_checklist_recorrencia') THEN
    CREATE TYPE obra_checklist_recorrencia AS ENUM ('nenhuma', 'diaria', 'semanal');
  END IF;
END $$;

ALTER TABLE obra_checklists
  ADD COLUMN IF NOT EXISTS recorrencia obra_checklist_recorrencia NOT NULL DEFAULT 'nenhuma';
ALTER TABLE obra_checklists
  ADD COLUMN IF NOT EXISTS recorrencia_dia_semana INTEGER;

CREATE TABLE IF NOT EXISTS obra_checklist_marcacoes (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  checklist_id VARCHAR NOT NULL REFERENCES obra_checklists(id) ON DELETE CASCADE,
  item_ordem INTEGER NOT NULL,
  periodo_ref DATE NOT NULL,
  marcado_por VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  marcado_em TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Um tique por item por período: torna o toggle idempotente.
CREATE UNIQUE INDEX IF NOT EXISTS uq_checklist_marcacao_periodo
  ON obra_checklist_marcacoes(checklist_id, item_ordem, periodo_ref);

-- O padrão de leitura: "as marcações deste checklist no período corrente".
CREATE INDEX IF NOT EXISTS idx_checklist_marcacoes_periodo
  ON obra_checklist_marcacoes(checklist_id, periodo_ref);
