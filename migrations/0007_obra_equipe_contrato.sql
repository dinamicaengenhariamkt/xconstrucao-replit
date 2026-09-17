-- XG22 — o contrato e o PIX do prestador moram no card dele.
--
-- "No cadastro do prestador, coloca uma caixa para pôr a chave PIX dele também,
-- deixar registrado, porque facilita para a gente de obra, e também o valor de
-- contrato, ou até anexar um link, se for o caso, um PDF, porque se a gente
-- tiver um contrato assinado a gente anexa aqui também junto com o card do
-- prestador (...) E esse valor de contrato o sistema tem que puxar e colocar
-- como prévia de gasto da obra."
--
-- O pedido tem duas metades: guardar os dados e SOMÁ-LOS. A segunda é a que dá
-- valor — até aqui o console só sabia o custo depois que o dinheiro saiu
-- (`custoTotal` vem de saídas pagas). A soma dos contratos é o custo previsto,
-- disponível no dia em que o prestador é cadastrado.
--
-- `pix_chave` é TEXT sem regex: chave PIX pode ser CPF, CNPJ, e-mail, telefone
-- ou aleatória. Validar formato aqui recusaria chave boa no meio do cadastro.
--
-- `valor_contrato` é NUMERIC(15,2) — o mesmo tipo de `obras.valor_total` e
-- `financeiro.valor`. Dinheiro neste schema nunca é float.
--
-- `contrato_file_id` + `contrato_link_url` reproduzem o arranjo de `obra_anexos`
-- (0004): arquivo OU link, nunca os dois. A exclusividade é validada na rota, e
-- não por CHECK, porque a mensagem de erro precisa chegar ao formulário.
--
-- A FK é ON DELETE SET NULL: apagar o arquivo não pode apagar o prestador, nem
-- o valor do contrato que ele carrega.
--
-- Idempotente, como as demais deste diretório: o schema é aplicado por
-- `drizzle-kit push` + bootstrap em runtime (server/bootstrap-obra-equipe-contrato.ts),
-- não por migrations versionadas.

ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS pix_chave TEXT;
ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS valor_contrato NUMERIC(15, 2);
ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS contrato_file_id VARCHAR;
ALTER TABLE obra_equipe ADD COLUMN IF NOT EXISTS contrato_link_url TEXT;

DO $$ BEGIN
  ALTER TABLE obra_equipe
    ADD CONSTRAINT obra_equipe_contrato_file_id_fkey
    FOREIGN KEY (contrato_file_id) REFERENCES user_files(id) ON DELETE SET NULL;
EXCEPTION WHEN duplicate_object THEN NULL; END $$;
