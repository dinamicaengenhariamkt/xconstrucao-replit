-- =============================================================================
-- Task #29 — Bootstrap do Super Admin em PRODUÇÃO (template)
-- =============================================================================
-- ATENÇÃO: este arquivo é um TEMPLATE. NUNCA edite valores sensíveis aqui.
-- Renderize com:
--
--   npx tsx scripts/render-bootstrap-superadmin-sql.ts \
--     --email admin@xconstrucao.com --name "Super Admin"
--
-- O script gera uma senha forte de 16 chars em runtime, hasheia com bcrypt
-- (mesma rotina usada por features/auth/api/auth-service.ts) e interpola o
-- hash neste template. O SQL renderizado vai para STDOUT (para você
-- redirecionar/pipar no executor de SQL de produção); o banner com
-- email + senha vai para STDERR e é mostrado UMA ÚNICA VEZ. Nada é
-- gravado em disco nem versionado.
--
-- Aplique o SQL renderizado no executor de SQL apontado para o banco de
-- PRODUÇÃO. Tudo roda dentro de uma única transação. Operação idempotente.
-- =============================================================================

BEGIN;

-- ---------------------------------------------------------------------------
-- 1) Pré-requisitos de schema (defensivo: só roda se ainda não existir).
--    O server/bootstrap-superadmin.ts já garante isso na inicialização do
--    app, mas repetimos aqui para que o SQL seja autossuficiente.
-- ---------------------------------------------------------------------------
ALTER TYPE user_role ADD VALUE IF NOT EXISTS 'superadmin' BEFORE 'admin';

ALTER TABLE users ADD COLUMN IF NOT EXISTS must_change_password BOOLEAN NOT NULL DEFAULT FALSE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS created_by VARCHAR REFERENCES users(id) ON DELETE SET NULL;
ALTER TABLE users ADD COLUMN IF NOT EXISTS ativo BOOLEAN NOT NULL DEFAULT TRUE;
ALTER TABLE users ADD COLUMN IF NOT EXISTS can_manage_users BOOLEAN NOT NULL DEFAULT FALSE;

CREATE TABLE IF NOT EXISTS audit_logs (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  actor_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  target_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  ip TEXT,
  user_agent TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- ---------------------------------------------------------------------------
-- 2) Captura o estado PRÉ-upsert numa temp table local da transação. Esse
--    é o sinal de verdade para "created vs promoted" no audit_log lá embaixo
--    — não dá para inferir isso depois do upsert, então gravamos antes.
--    A temp table é dropada no COMMIT (ON COMMIT DROP).
-- ---------------------------------------------------------------------------
CREATE TEMP TABLE _bootstrap_state ON COMMIT DROP AS
SELECT
  (SELECT id FROM users WHERE email = __EMAIL_LIT__) AS pre_id,
  __EMAIL_LIT__::text                                AS email;

-- ---------------------------------------------------------------------------
-- 3) Cria ou promove o usuário.
--    - Se já existe: promove para superadmin, reativa, força troca de senha
--      e regrava o hash gerado em runtime.
--    - Se não existe: cria do zero como superadmin ativo.
-- ---------------------------------------------------------------------------
INSERT INTO users (
  username,
  password,
  name,
  email,
  email_verified,
  role,
  must_change_password,
  ativo,
  can_manage_users
)
VALUES (
  __USERNAME_LIT__,
  __PASSWORD_HASH_LIT__,
  __NAME_LIT__,
  __EMAIL_LIT__,
  NOW(),
  'superadmin',
  TRUE,
  TRUE,
  TRUE
)
ON CONFLICT (email) DO UPDATE
  SET password               = EXCLUDED.password,
      role                   = 'superadmin'::user_role,
      ativo                  = TRUE,
      must_change_password   = TRUE,
      can_manage_users       = TRUE,
      email_verified         = COALESCE(users.email_verified, NOW());

-- ---------------------------------------------------------------------------
-- 4) Consents v1.0 (termos + privacidade). Idempotente via UNIQUE
--    (user_id, documento, versao).
-- ---------------------------------------------------------------------------
INSERT INTO user_consents (user_id, documento, versao, ip, user_agent)
SELECT u.id, d.doc::consent_document, '1.0', 'cli', 'cli/bootstrap-superadmin'
  FROM users u, (VALUES ('termos'), ('privacidade')) AS d(doc)
 WHERE u.email = __EMAIL_LIT__
ON CONFLICT (user_id, documento, versao) DO NOTHING;

-- ---------------------------------------------------------------------------
-- 5) Audit log da operação. Só insere se ainda não houver um registro
--    cli.bootstrap-superadmin para esse target — mantém a operação
--    idempotente em re-execuções e cumpre o critério "1 linha em audit_logs
--    com action='cli.bootstrap-superadmin'" do Done da Task #29.
--    O payload.action lê _bootstrap_state.pre_id para gravar com precisão
--    'created' (pre_id era NULL) vs 'promoted' (já existia).
-- ---------------------------------------------------------------------------
INSERT INTO audit_logs (actor_id, action, target_user_id, payload, ip, user_agent)
SELECT
  NULL,
  'cli.bootstrap-superadmin',
  u.id,
  jsonb_build_object(
    'email',      u.email,
    'action',     CASE WHEN s.pre_id IS NULL THEN 'created' ELSE 'promoted' END,
    'forceReset', false,
    'generated',  true,
    'consents',   jsonb_build_array('termos@1.0', 'privacidade@1.0'),
    'source',     'sql/render-bootstrap-superadmin-sql.ts'
  ),
  'cli',
  'sql/bootstrap-superadmin-prod'
FROM users u
JOIN _bootstrap_state s ON s.email = u.email
WHERE u.email = __EMAIL_LIT__
  AND NOT EXISTS (
    SELECT 1
      FROM audit_logs prev
     WHERE prev.action = 'cli.bootstrap-superadmin'
       AND prev.target_user_id = u.id
  );

-- ---------------------------------------------------------------------------
-- 5) Invariante final: tem que existir pelo menos 1 superadmin ativo.
-- ---------------------------------------------------------------------------
DO $$
DECLARE
  active_supers INT;
BEGIN
  SELECT COUNT(*) INTO active_supers
    FROM users
   WHERE role = 'superadmin' AND ativo = TRUE;
  IF active_supers < 1 THEN
    RAISE EXCEPTION 'FATAL: nenhum super admin ativo após o bootstrap (esperado >= 1)';
  END IF;
END $$;

COMMIT;

-- ---------------------------------------------------------------------------
-- 6) Verificação (mesmo set da Task #28). Pode rodar separadamente depois.
-- ---------------------------------------------------------------------------
-- SELECT id, email, role, ativo, must_change_password, can_manage_users
--   FROM users WHERE role = 'superadmin';
-- SELECT user_id, documento, versao FROM user_consents
--   WHERE user_id = (SELECT id FROM users WHERE email = __EMAIL_LIT__);
-- SELECT action, target_user_id, payload, ip, created_at
--   FROM audit_logs WHERE action = 'cli.bootstrap-superadmin';
