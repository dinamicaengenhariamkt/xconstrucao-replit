-- ============================================================================
-- APAGAR UMA OBRA DE TESTE EM PRODUÇÃO
-- ============================================================================
-- Este script apaga UMA obra e os dados relacionados no banco.
--
-- COMO USAR:
-- 1. Abra o banco de PRODUÇÃO no Replit.
-- 2. Cole este arquivo inteiro.
-- 3. Preencha v_email_dono.
-- 4. Deixe v_modo = 'PREVIEW' e execute. Confira os NOTICEs.
-- 5. Se houver mais de uma obra no dia, preencha também v_obra_id.
-- 6. Depois de conferir, troque v_modo para 'APAGAR_OBRA' e execute novamente.
--
-- PROTEÇÕES:
-- - Só aceita uma obra do e-mail informado.
-- - Por padrão, só encontra obras criadas hoje no horário de São Paulo.
-- - Recusa a exclusão se houver referência de pagamento no Asaas.
-- - Toda a limpeza ocorre em uma única transação.
--
-- NÃO APAGA:
-- - a conta do usuário;
-- - o perfil de cliente/empreiteira;
-- - arquivos físicos no Cloudflare R2;
-- - logs de auditoria da plataforma.
-- ============================================================================

DO $$
DECLARE
  -- PREENCHA ESTES CAMPOS:
  v_email_dono text := 'COLE_O_EMAIL_AQUI';
  v_obra_id text := ''; -- opcional; use se o PREVIEW encontrar mais de uma obra
  v_data_local date := (now() AT TIME ZONE 'America/Sao_Paulo')::date;
  v_modo text := 'PREVIEW'; -- depois troque para: APAGAR_OBRA

  v_total integer;
  v_alvo_id text;
  v_alvo_nome text;
  v_alvo_criada_em timestamp;
  v_n integer;
  v_item record;
BEGIN
  IF trim(v_email_dono) = '' OR v_email_dono = 'COLE_O_EMAIL_AQUI' THEN
    RAISE EXCEPTION 'Preencha v_email_dono antes de executar.';
  END IF;

  IF v_modo NOT IN ('PREVIEW', 'APAGAR_OBRA') THEN
    RAISE EXCEPTION 'v_modo inválido. Use PREVIEW ou APAGAR_OBRA.';
  END IF;

  -- Lista somente obras pertencentes ao e-mail informado e criadas na data local.
  FOR v_item IN
    SELECT
      o.id,
      o.nome,
      o.status,
      o.visibilidade,
      o.created_at,
      uc.email AS email_contratante,
      ue.email AS email_empreiteiro
    FROM obras o
    LEFT JOIN clientes c ON c.id = o.cliente_id
    LEFT JOIN users uc ON uc.id = c.user_id
    LEFT JOIN empreiteiras e ON e.id = o.empreiteira_id
    LEFT JOIN users ue ON ue.id = e.user_id
    WHERE (
        lower(uc.email) = lower(trim(v_email_dono))
        OR lower(ue.email) = lower(trim(v_email_dono))
      )
      AND (o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = v_data_local
      AND (trim(v_obra_id) = '' OR o.id = trim(v_obra_id))
    ORDER BY o.created_at DESC
  LOOP
    RAISE NOTICE
      'CANDIDATA: id=% | nome=% | status=% | visibilidade=% | criada_em=%',
      v_item.id,
      v_item.nome,
      v_item.status,
      v_item.visibilidade,
      v_item.created_at;
  END LOOP;

  SELECT
    count(*)::integer,
    min(o.id),
    min(o.nome),
    min(o.created_at)
  INTO v_total, v_alvo_id, v_alvo_nome, v_alvo_criada_em
  FROM obras o
  LEFT JOIN clientes c ON c.id = o.cliente_id
  LEFT JOIN users uc ON uc.id = c.user_id
  LEFT JOIN empreiteiras e ON e.id = o.empreiteira_id
  LEFT JOIN users ue ON ue.id = e.user_id
  WHERE (
      lower(uc.email) = lower(trim(v_email_dono))
      OR lower(ue.email) = lower(trim(v_email_dono))
    )
    AND (o.created_at AT TIME ZONE 'UTC' AT TIME ZONE 'America/Sao_Paulo')::date = v_data_local
    AND (trim(v_obra_id) = '' OR o.id = trim(v_obra_id));

  IF v_total = 0 THEN
    RAISE EXCEPTION
      'Nenhuma obra encontrada para o e-mail % na data %. Nada foi apagado.',
      v_email_dono,
      v_data_local;
  END IF;

  IF v_total > 1 THEN
    RAISE EXCEPTION
      'Foram encontradas % obras. Copie o ID correto mostrado acima para v_obra_id. Nada foi apagado.',
      v_total;
  END IF;

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'OBRA SELECIONADA: % | % | criada em %', v_alvo_id, v_alvo_nome, v_alvo_criada_em;

  -- Recusa obras associadas ao gateway externo. Apagar só o registro local não
  -- cancela cobranças no Asaas e pode quebrar a conciliação financeira.
  IF EXISTS (
    SELECT 1
    FROM pagamentos_split ps
    WHERE (
        ps.obra_id = v_alvo_id
        OR ps.financeiro_id IN (
          SELECT f.id FROM financeiro f WHERE f.obra_id = v_alvo_id
        )
      )
      AND (ps.asaas_payment_id IS NOT NULL OR ps.asaas_checkout_id IS NOT NULL)
  ) THEN
    RAISE EXCEPTION
      'Esta obra possui referência de pagamento no Asaas. Nada foi apagado. Cancele/concilie o pagamento antes.';
  END IF;

  -- Resumo dos registros diretamente ligados à obra.
  SELECT count(*)::integer INTO v_n FROM candidaturas WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'candidaturas: %', v_n;
  SELECT count(*)::integer INTO v_n FROM financeiro WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'financeiro: %', v_n;
  SELECT count(*)::integer INTO v_n FROM pagamentos_split
  WHERE obra_id = v_alvo_id
     OR financeiro_id IN (SELECT id FROM financeiro WHERE obra_id = v_alvo_id);
  RAISE NOTICE 'pagamentos_split: %', v_n;
  SELECT count(*)::integer INTO v_n FROM medicoes WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'medicoes: %', v_n;
  SELECT count(*)::integer INTO v_n FROM chat_threads WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'chat_threads: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_tarefas WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'tarefas: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_checklists WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'checklists: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_diario WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'diário: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_ocorrencias WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'ocorrências: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_fotos WHERE obra_id = v_alvo_id;
  RAISE NOTICE 'fotos: %', v_n;
  RAISE NOTICE '------------------------------------------------------------';

  IF v_modo = 'PREVIEW' THEN
    RAISE NOTICE 'PREVIEW concluído: NADA FOI APAGADO.';
    RAISE NOTICE 'Confira o ID e o nome. Depois altere v_modo para APAGAR_OBRA.';
    RETURN;
  END IF;

  -- Trava a obra durante toda a limpeza.
  PERFORM 1 FROM obras WHERE id = v_alvo_id FOR UPDATE;
  IF NOT FOUND THEN
    RAISE EXCEPTION 'A obra deixou de existir antes da exclusão. Nada foi apagado.';
  END IF;

  -- Tabelas sem cascade/sem FK no schema publicado, na ordem segura.
  DELETE FROM pagamentos_split
  WHERE obra_id = v_alvo_id
     OR financeiro_id IN (SELECT id FROM financeiro WHERE obra_id = v_alvo_id);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'pagamentos_split apagados: %', v_n;

  DELETE FROM candidatura_anexos
  WHERE candidatura_id IN (SELECT id FROM candidaturas WHERE obra_id = v_alvo_id);

  DELETE FROM contrato_assinaturas WHERE obra_id = v_alvo_id;

  DELETE FROM candidaturas WHERE obra_id = v_alvo_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'candidaturas apagadas: %', v_n;

  DELETE FROM disputa_mensagens
  WHERE disputa_id IN (SELECT id FROM disputas WHERE obra_id = v_alvo_id);
  DELETE FROM disputas WHERE obra_id = v_alvo_id;

  DELETE FROM financeiro WHERE obra_id = v_alvo_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'financeiro apagado: %', v_n;

  DELETE FROM notificacoes
  WHERE thread_id IN (SELECT id FROM chat_threads WHERE obra_id = v_alvo_id);
  DELETE FROM chat_mensagens
  WHERE thread_id IN (SELECT id FROM chat_threads WHERE obra_id = v_alvo_id)
     OR anexo_obra_id = v_alvo_id;
  DELETE FROM chat_threads WHERE obra_id = v_alvo_id;

  DELETE FROM survey_respostas
  WHERE survey_id IN (SELECT id FROM surveys WHERE obra_id = v_alvo_id);
  DELETE FROM surveys WHERE obra_id = v_alvo_id;

  DELETE FROM medicoes WHERE obra_id = v_alvo_id;
  DELETE FROM obra_checklist_itens
  WHERE checklist_id IN (SELECT id FROM obra_checklists WHERE obra_id = v_alvo_id);
  DELETE FROM obra_checklists WHERE obra_id = v_alvo_id;
  DELETE FROM obra_tarefas WHERE obra_id = v_alvo_id;
  DELETE FROM obra_equipe WHERE obra_id = v_alvo_id;
  DELETE FROM obra_fotos WHERE obra_id = v_alvo_id;
  DELETE FROM obra_ocorrencias WHERE obra_id = v_alvo_id;
  DELETE FROM obra_diario WHERE obra_id = v_alvo_id;
  DELETE FROM obra_etapas WHERE obra_id = v_alvo_id;
  DELETE FROM obra_anexos WHERE obra_id = v_alvo_id;
  DELETE FROM obra_share_links WHERE obra_id = v_alvo_id;
  DELETE FROM obras_salvas WHERE obra_id = v_alvo_id;
  DELETE FROM atividades WHERE obra_id = v_alvo_id;

  DELETE FROM obras WHERE id = v_alvo_id;
  GET DIAGNOSTICS v_n = ROW_COUNT;

  IF v_n <> 1 THEN
    RAISE EXCEPTION
      'Era esperado apagar exatamente 1 obra, mas foram apagadas %. Toda a transação será revertida.',
      v_n;
  END IF;

  RAISE NOTICE 'SUCESSO: obra % (%) e dados relacionados foram apagados.', v_alvo_id, v_alvo_nome;
  RAISE NOTICE 'A conta do usuário e o perfil foram preservados.';
END $$;