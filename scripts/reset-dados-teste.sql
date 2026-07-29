-- =============================================================
--  RESET DE DADOS DE TESTE — Dinâmica Reforma
--  Apaga TODOS os usuários não-admin e todos os dados ligados
--  a eles. Admins e superadmins são preservados.
--
--  ⚠️  ATENÇÃO: roda em PRODUÇÃO. Leia antes de executar.
--
--  Tabelas preservadas intactas:
--    planos, platform_settings, faq, legal_documents,
--    anuncio_config, kpi_snapshots, job_runs, audit_logs
--
--  Como rodar:
--    Painel Replit → Database → Production Database
--    → "Enable Editing" → cole tudo → Ctrl+A → Run
--    (sem BEGIN/COMMIT: o console não suporta transações manuais)
--
--  PAPEL PRIMÁRIO DOS ADMINS: users.role IN ('admin','superadmin')
--  NÃO use user_roles — aquela tabela usa o enum user_additive_role
--  que só aceita contratante/empreiteiro/anunciante.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- Subquery base reutilizada em todo o script:
--   SELECT id FROM users WHERE role IN ('admin','superadmin')
-- ─────────────────────────────────────────────────────────────

-- ─────────────────────────────────────────────────────────────
-- 1. pagamentos_split
--    FK sem cascade para financeiro.id e obras.id → apaga primeiro.
-- ─────────────────────────────────────────────────────────────
DELETE FROM pagamentos_split
WHERE obra_id IN (
    SELECT o.id FROM obras o
    JOIN clientes c ON o.cliente_id = c.id
    WHERE c.user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
)
OR financeiro_id IN (
    SELECT id FROM financeiro
    WHERE pagador_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
       OR recebedor_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
)
OR pagador_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
OR recebedor_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));

-- ─────────────────────────────────────────────────────────────
-- 2. candidaturas
--    FK sem cascade para users.id (empreiteiro_id) e obras.id.
--    Cascade automático: candidatura_anexos
-- ─────────────────────────────────────────────────────────────
DELETE FROM candidaturas
WHERE empreiteiro_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
   OR obra_id IN (
       SELECT o.id FROM obras o
       JOIN clientes c ON o.cliente_id = c.id
       WHERE c.user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
   );

-- ─────────────────────────────────────────────────────────────
-- 3. financeiro
--    FK sem cascade para obras.id → apaga antes das obras.
-- ─────────────────────────────────────────────────────────────
DELETE FROM financeiro
WHERE obra_id IN (
    SELECT o.id FROM obras o
    JOIN clientes c ON o.cliente_id = c.id
    WHERE c.user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
)
OR pagador_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
OR recebedor_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));

-- ─────────────────────────────────────────────────────────────
-- 4. obras
--    Cascade automático: obra_anexos, contrato_assinaturas,
--    medicoes, chat_threads → chat_mensagens,
--    obras_salvas, surveys → survey_respostas,
--    disputas → disputa_mensagens   ← NEW em prod
-- ─────────────────────────────────────────────────────────────
DELETE FROM obras
WHERE cliente_id IN (
    SELECT id FROM clientes
    WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
);

-- ─────────────────────────────────────────────────────────────
-- 5. atividades  (log de eventos — referências viram NULL)
--    Limpa registros cujo ator ou alvo era não-admin.
-- ─────────────────────────────────────────────────────────────
DELETE FROM atividades
WHERE actor_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
   OR target_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));

-- ─────────────────────────────────────────────────────────────
-- 6. anunciantes  (user_id vira NULL com set null →
--    apaga ANTES dos usuários para localizar pelo user_id)
--    Cascade automático: anuncios → anuncio_eventos + pedido_slots
--                        pedidos_anuncio → pedido_pagamento_eventos
-- ─────────────────────────────────────────────────────────────
DELETE FROM anunciantes
WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));

-- ─────────────────────────────────────────────────────────────
-- 7. clientes  (user_id vira NULL → apaga antes dos usuários)
--    Cascade automático: cliente_documentos
-- ─────────────────────────────────────────────────────────────
DELETE FROM clientes
WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));

-- ─────────────────────────────────────────────────────────────
-- 8. empreiteiras  (user_id vira NULL → apaga antes dos usuários)
--    Cascade automático: empreiteiro_documentos, empreiteiro_portfolio
-- ─────────────────────────────────────────────────────────────
DELETE FROM empreiteiras
WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));

-- ─────────────────────────────────────────────────────────────
-- 9. users  (o grande cascade)
--    Cascade automático: user_roles, user_preferencias, user_totp,
--    accounts, sessions, user_consents, user_files,
--    password_setup_tokens, notificacoes, saques,
--    assinaturas → assinatura_eventos,
--    pedidos_anuncio → pedido_pagamento_eventos + pedido_slots,
--    chat_threads → chat_mensagens, medicoes,
--    empreiteiro_documentos, empreiteiro_portfolio,
--    surveys → survey_respostas, obras_salvas, asaas_subcontas
-- ─────────────────────────────────────────────────────────────
DELETE FROM users
WHERE role NOT IN ('admin','superadmin');

-- ─────────────────────────────────────────────────────────────
-- 10. Limpeza complementar (sem FK para users)
-- ─────────────────────────────────────────────────────────────

-- Tokens de e-mail de verificação
DELETE FROM verification_tokens;

-- Leads de marketplace (contatos externos sem conta)
DELETE FROM marketplace_leads;

-- Erros de app cujo usuário foi deletado (user_id virou NULL)
DELETE FROM app_errors WHERE user_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 11. Verificação final — deve mostrar só admins/dados deles
-- ─────────────────────────────────────────────────────────────
SELECT 'usuarios'        AS tabela, COUNT(*) AS total FROM users
UNION ALL SELECT 'clientes',        COUNT(*) FROM clientes
UNION ALL SELECT 'empreiteiras',    COUNT(*) FROM empreiteiras
UNION ALL SELECT 'obras',           COUNT(*) FROM obras
UNION ALL SELECT 'candidaturas',    COUNT(*) FROM candidaturas
UNION ALL SELECT 'assinaturas',     COUNT(*) FROM assinaturas
UNION ALL SELECT 'financeiro',      COUNT(*) FROM financeiro
UNION ALL SELECT 'chat_threads',    COUNT(*) FROM chat_threads
UNION ALL SELECT 'notificacoes',    COUNT(*) FROM notificacoes
UNION ALL SELECT 'anunciantes',     COUNT(*) FROM anunciantes
UNION ALL SELECT 'disputas',        COUNT(*) FROM disputas
UNION ALL SELECT 'atividades',      COUNT(*) FROM atividades
ORDER BY tabela;
