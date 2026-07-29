-- =============================================================
--  RESET DE DADOS DE TESTE — Dinâmica Reforma
--  Uma única instrução PL/pgSQL. Cole TUDO e clique Run.
--
--  ⚠️  Roda em PRODUÇÃO. Preserva admins e superadmins.
--  Tabelas intactas: planos, platform_settings, faq,
--  legal_documents, anuncio_config, kpi_snapshots, job_runs,
--  audit_logs.
--
--  Nota sobre admins: o papel primário fica em users.role.
--  A tabela user_roles usa enum user_additive_role (sem admin).
-- =============================================================

DO $$
DECLARE
  n integer;
BEGIN

  -- 1. pagamentos_split
  --    FK sem cascade para financeiro.id e obras.id
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
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[1] pagamentos_split removidos: %', n;

  -- 2. candidaturas
  --    FK sem cascade para users.id e obras.id
  --    Cascade automático: candidatura_anexos
  DELETE FROM candidaturas
  WHERE empreiteiro_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
     OR obra_id IN (
         SELECT o.id FROM obras o
         JOIN clientes c ON o.cliente_id = c.id
         WHERE c.user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
     );
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[2] candidaturas removidas: %', n;

  -- 3. financeiro
  --    FK sem cascade para obras.id
  DELETE FROM financeiro
  WHERE obra_id IN (
      SELECT o.id FROM obras o
      JOIN clientes c ON o.cliente_id = c.id
      WHERE c.user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
  )
  OR pagador_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
  OR recebedor_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[3] financeiro removidos: %', n;

  -- 4. obras
  --    Cascade: obra_anexos, contrato_assinaturas, medicoes,
  --    chat_threads → chat_mensagens, obras_salvas,
  --    surveys → survey_respostas, disputas → disputa_mensagens
  DELETE FROM obras
  WHERE cliente_id IN (
      SELECT id FROM clientes
      WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
  );
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[4] obras removidas: %', n;

  -- 5. atividades (log — referências viram NULL, limpamos os de não-admins)
  DELETE FROM atividades
  WHERE actor_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'))
     OR target_user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[5] atividades removidas: %', n;

  -- 6. anunciantes (user_id vira NULL antes dos users — cascade: anuncios etc.)
  DELETE FROM anunciantes
  WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[6] anunciantes removidos: %', n;

  -- 7. clientes (user_id vira NULL — cascade: cliente_documentos)
  DELETE FROM clientes
  WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[7] clientes removidos: %', n;

  -- 8. empreiteiras (user_id vira NULL — cascade: documentos, portfolio)
  DELETE FROM empreiteiras
  WHERE user_id NOT IN (SELECT id FROM users WHERE role IN ('admin','superadmin'));
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[8] empreiteiras removidas: %', n;

  -- 9. users — grande cascade
  --    Cascade: user_roles, user_preferencias, user_totp, accounts,
  --    sessions, user_consents, user_files, password_setup_tokens,
  --    notificacoes, saques, assinaturas → assinatura_eventos,
  --    pedidos_anuncio → pedido_pagamento_eventos + pedido_slots,
  --    chat_threads, medicoes, empreiteiro_documentos,
  --    empreiteiro_portfolio, surveys, obras_salvas, asaas_subcontas
  DELETE FROM users
  WHERE role NOT IN ('admin','superadmin');
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[9] users removidos: %', n;

  -- 10. Limpeza complementar (sem FK para users)
  DELETE FROM verification_tokens;
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[10] verification_tokens removidos: %', n;

  DELETE FROM marketplace_leads;
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[10] marketplace_leads removidos: %', n;

  DELETE FROM app_errors WHERE user_id IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RAISE NOTICE '[10] app_errors orfaos removidos: %', n;

  -- Resumo final
  RAISE NOTICE '--- RESUMO FINAL ---';
  SELECT COUNT(*) INTO n FROM users;         RAISE NOTICE 'users restantes: %', n;
  SELECT COUNT(*) INTO n FROM clientes;      RAISE NOTICE 'clientes: %', n;
  SELECT COUNT(*) INTO n FROM empreiteiras;  RAISE NOTICE 'empreiteiras: %', n;
  SELECT COUNT(*) INTO n FROM obras;         RAISE NOTICE 'obras: %', n;
  SELECT COUNT(*) INTO n FROM candidaturas;  RAISE NOTICE 'candidaturas: %', n;
  SELECT COUNT(*) INTO n FROM assinaturas;   RAISE NOTICE 'assinaturas: %', n;
  SELECT COUNT(*) INTO n FROM financeiro;    RAISE NOTICE 'financeiro: %', n;
  SELECT COUNT(*) INTO n FROM chat_threads;  RAISE NOTICE 'chat_threads: %', n;
  SELECT COUNT(*) INTO n FROM disputas;      RAISE NOTICE 'disputas: %', n;
  SELECT COUNT(*) INTO n FROM atividades;    RAISE NOTICE 'atividades: %', n;

END $$;
