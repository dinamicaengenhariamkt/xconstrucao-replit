-- =============================================================
--  RESET DE DADOS DE TESTE — Dinâmica Reforma
--  Apaga TODOS os usuários não-admin e todos os dados ligados
--  a eles. Admins e superadmins são preservados.
--
--  Tabelas preservadas intactas:
--    planos, platform_settings, faq, legal_documents,
--    anuncio_config, kpi_snapshots, job_runs, audit_logs
--
--  Como rodar:
--    Painel Replit → aba "Database" → "Enable Editing"
--    Ctrl+A, Run
--    (não use BEGIN/COMMIT: o console não suporta transações manuais)
--
--  Ordem de deleção segue as FKs sem cascade (RESTRICT padrão do
--  Postgres). Se uma tabela nova surgir e bloquear a exclusão,
--  adicione-a ANTES da tabela que a referencia.
-- =============================================================

-- ─────────────────────────────────────────────────────────────
-- 0.  Subquery reutilizada: IDs dos usuários NÃO-admin
--     (não altere este padrão nas queries abaixo)
-- ─────────────────────────────────────────────────────────────
-- SELECT id FROM users
-- WHERE id NOT IN (
--     SELECT user_id FROM user_roles
--     WHERE role IN ('admin', 'superadmin')
-- )

-- ─────────────────────────────────────────────────────────────
-- 1.  pagamentos_split
--     FK sem cascade para financeiro.id e obras.id → deleta primeiro.
-- ─────────────────────────────────────────────────────────────
DELETE FROM pagamentos_split
WHERE obra_id IN (
    SELECT o.id FROM obras o
    JOIN clientes c ON o.cliente_id = c.id
    WHERE c.user_id IN (
        SELECT id FROM users
        WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
    )
)
OR financeiro_id IN (
    SELECT id FROM financeiro
    WHERE pagador_user_id IN (
        SELECT id FROM users
        WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
    )
    OR recebedor_user_id IN (
        SELECT id FROM users
        WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
    )
)
OR pagador_user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
)
OR recebedor_user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
);

-- ─────────────────────────────────────────────────────────────
-- 2.  candidaturas
--     FK sem cascade para users.id (empreiteiro_id) e obras.id
--     Cascade automático: candidatura_anexos
-- ─────────────────────────────────────────────────────────────
DELETE FROM candidaturas
WHERE empreiteiro_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
)
OR obra_id IN (
    SELECT o.id FROM obras o
    JOIN clientes c ON o.cliente_id = c.id
    WHERE c.user_id IN (
        SELECT id FROM users
        WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
    )
);

-- ─────────────────────────────────────────────────────────────
-- 3.  financeiro
--     FK sem cascade para obras.id → deleta antes das obras.
-- ─────────────────────────────────────────────────────────────
DELETE FROM financeiro
WHERE obra_id IN (
    SELECT o.id FROM obras o
    JOIN clientes c ON o.cliente_id = c.id
    WHERE c.user_id IN (
        SELECT id FROM users
        WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
    )
)
OR pagador_user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
)
OR recebedor_user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
);

-- ─────────────────────────────────────────────────────────────
-- 4.  obras
--     Cascade automático: obra_anexos, contrato_assinaturas,
--     medicoes, chat_threads → chat_mensagens, obras_salvas,
--     surveys → survey_respostas, notificacoes (via threadId)
-- ─────────────────────────────────────────────────────────────
DELETE FROM obras
WHERE cliente_id IN (
    SELECT id FROM clientes
    WHERE user_id IN (
        SELECT id FROM users
        WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
    )
);

-- ─────────────────────────────────────────────────────────────
-- 5.  anunciantes  (userId vira NULL com onDelete set null →
--     precisa deletar ANTES dos usuários para achar pelo userId)
--     Cascade automático: anuncios → anuncio_eventos + pedido_slots
--                         pedidos_anuncio → pedido_pagamento_eventos
-- ─────────────────────────────────────────────────────────────
DELETE FROM anunciantes
WHERE user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
);

-- ─────────────────────────────────────────────────────────────
-- 6.  clientes  (userId vira NULL → deleta antes dos usuários)
--     Cascade automático: cliente_documentos
-- ─────────────────────────────────────────────────────────────
DELETE FROM clientes
WHERE user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
);

-- ─────────────────────────────────────────────────────────────
-- 7.  empreiteiras  (userId vira NULL → deleta antes dos usuários)
--     Cascade automático: empreiteiro_documentos, empreiteiro_portfolio
-- ─────────────────────────────────────────────────────────────
DELETE FROM empreiteiras
WHERE user_id IN (
    SELECT id FROM users
    WHERE id NOT IN (SELECT user_id FROM user_roles WHERE role IN ('admin', 'superadmin'))
);

-- ─────────────────────────────────────────────────────────────
-- 8.  users  (o grande cascade)
--     Cascade automático: user_roles, user_preferencias, user_totp,
--     accounts, sessions, user_consents, user_files,
--     password_setup_tokens, notificacoes, saques,
--     assinaturas → assinatura_eventos,
--     pedidos_anuncio → pedido_pagamento_eventos + pedido_slots,
--     chat_threads → chat_mensagens, medicoes,
--     empreiteiro_documentos, empreiteiro_portfolio,
--     surveys → survey_respostas, obras_salvas,
--     asaas_subcontas
-- ─────────────────────────────────────────────────────────────
DELETE FROM users
WHERE id NOT IN (
    SELECT user_id FROM user_roles
    WHERE role IN ('admin', 'superadmin')
);

-- ─────────────────────────────────────────────────────────────
-- 9.  Limpeza complementar (sem FK para users)
-- ─────────────────────────────────────────────────────────────

-- Tokens de e-mail de verificação (expiram sozinhos, mas limpamos tudo)
DELETE FROM verification_tokens;

-- Leads de marketplace (contatos externos sem conta)
DELETE FROM marketplace_leads;

-- Erros de app cujo usuário foi deletado (user_id virou NULL via set null)
DELETE FROM app_errors WHERE user_id IS NULL;

-- ─────────────────────────────────────────────────────────────
-- 10. Verificação final — deve mostrar só admins restantes
-- ─────────────────────────────────────────────────────────────
SELECT 'usuarios'      AS tabela, COUNT(*) AS total FROM users
UNION ALL
SELECT 'clientes',     COUNT(*) FROM clientes
UNION ALL
SELECT 'empreiteiras', COUNT(*) FROM empreiteiras
UNION ALL
SELECT 'obras',        COUNT(*) FROM obras
UNION ALL
SELECT 'candidaturas', COUNT(*) FROM candidaturas
UNION ALL
SELECT 'assinaturas',  COUNT(*) FROM assinaturas
UNION ALL
SELECT 'financeiro',   COUNT(*) FROM financeiro
UNION ALL
SELECT 'chat_threads', COUNT(*) FROM chat_threads
UNION ALL
SELECT 'notificacoes', COUNT(*) FROM notificacoes
UNION ALL
SELECT 'anunciantes',  COUNT(*) FROM anunciantes
ORDER BY tabela;
