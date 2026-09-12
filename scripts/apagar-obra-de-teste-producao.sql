-- ============================================================================
-- APAGAR TODAS AS OBRAS DE UM E-MAIL EM PRODUÇÃO
-- ============================================================================
-- Apaga TODAS as obras pertencentes ao e-mail informado, independentemente da
-- data de criação, junto com os dados relacionados no banco.
--
-- COMO USAR:
-- 1. Preencha v_email_dono.
-- 2. Execute tudo com v_modo = 'PREVIEW'. Nada será apagado.
-- 3. Confira TODAS as obras e contagens mostradas nos NOTICEs.
-- 4. Troque v_modo para 'APAGAR_TODAS' e execute tudo novamente.
--
-- PROTEÇÕES:
-- - seleciona somente obras pertencentes ao e-mail informado;
-- - recusa tudo se alguma obra tiver referência de pagamento no Asaas;
-- - trava as obras e apaga tudo em uma única transação;
-- - reverte tudo se a quantidade final não for a esperada.
--
-- NÃO APAGA:
-- - conta do usuário ou perfil de cliente/empreiteira;
-- - arquivos físicos no Cloudflare R2;
-- - logs de auditoria da plataforma.
-- ============================================================================

DO $$
DECLARE
  -- PREENCHA SOMENTE O E-MAIL:
  v_email_dono text := 'ramon_gds@hotmail.com';
  v_modo text := 'PREVIEW'; -- depois troque para: APAGAR_TODAS

  v_total integer;
  v_alvo_ids text[];
  v_n integer;
  v_item record;
BEGIN
  IF trim(v_email_dono) = '' OR v_email_dono = 'COLE_O_EMAIL_AQUI' THEN
    RAISE EXCEPTION 'Preencha v_email_dono antes de executar.';
  END IF;

  IF v_modo NOT IN ('PREVIEW', 'APAGAR_TODAS') THEN
    RAISE EXCEPTION 'v_modo inválido. Use PREVIEW ou APAGAR_TODAS.';
  END IF;

  -- Mostra todas as obras que pertencem ao contratante ou empreiteiro do e-mail.
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
    WHERE lower(uc.email) = lower(trim(v_email_dono))
       OR lower(ue.email) = lower(trim(v_email_dono))
    ORDER BY o.created_at DESC
  LOOP
    RAISE NOTICE
      'OBRA: id=% | nome=% | status=% | visibilidade=% | criada_em=%',
      v_item.id,
      v_item.nome,
      v_item.status,
      v_item.visibilidade,
      v_item.created_at;
  END LOOP;

  SELECT count(*)::integer, array_agg(o.id)
  INTO v_total, v_alvo_ids
  FROM obras o
  LEFT JOIN clientes c ON c.id = o.cliente_id
  LEFT JOIN users uc ON uc.id = c.user_id
  LEFT JOIN empreiteiras e ON e.id = o.empreiteira_id
  LEFT JOIN users ue ON ue.id = e.user_id
  WHERE lower(uc.email) = lower(trim(v_email_dono))
     OR lower(ue.email) = lower(trim(v_email_dono));

  IF v_total = 0 THEN
    RAISE EXCEPTION
      'Nenhuma obra encontrada para o e-mail %. Nada foi apagado.',
      v_email_dono;
  END IF;

  RAISE NOTICE '------------------------------------------------------------';
  RAISE NOTICE 'TOTAL DE OBRAS SELECIONADAS: %', v_total;

  -- Apagar o registro local não cancela cobranças externas. Por segurança, uma
  -- única referência no Asaas interrompe a operação inteira.
  IF EXISTS (
    SELECT 1
    FROM pagamentos_split ps
    WHERE (
        ps.obra_id = ANY(v_alvo_ids)
        OR ps.financeiro_id IN (
          SELECT f.id
          FROM financeiro f
          WHERE f.obra_id = ANY(v_alvo_ids)
        )
      )
      AND (ps.asaas_payment_id IS NOT NULL OR ps.asaas_checkout_id IS NOT NULL)
  ) THEN
    RAISE EXCEPTION
      'Uma ou mais obras possuem referência no Asaas. Nada foi apagado.';
  END IF;

  -- Resumo antes da confirmação.
  SELECT count(*)::integer INTO v_n FROM candidaturas WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'candidaturas: %', v_n;
  SELECT count(*)::integer INTO v_n FROM financeiro WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'financeiro: %', v_n;
  SELECT count(*)::integer INTO v_n FROM pagamentos_split
  WHERE obra_id = ANY(v_alvo_ids)
     OR financeiro_id IN (
       SELECT id FROM financeiro WHERE obra_id = ANY(v_alvo_ids)
     );
  RAISE NOTICE 'pagamentos_split: %', v_n;
  SELECT count(*)::integer INTO v_n FROM medicoes WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'medicoes: %', v_n;
  SELECT count(*)::integer INTO v_n FROM chat_threads WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'chat_threads: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_tarefas WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'tarefas: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_checklists WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'checklists: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_diario WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'diário: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_ocorrencias WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'ocorrências: %', v_n;
  SELECT count(*)::integer INTO v_n FROM obra_fotos WHERE obra_id = ANY(v_alvo_ids);
  RAISE NOTICE 'fotos: %', v_n;
  RAISE NOTICE '------------------------------------------------------------';

  IF v_modo = 'PREVIEW' THEN
    RAISE NOTICE 'PREVIEW concluído: NADA FOI APAGADO.';
    RAISE NOTICE 'Confira toda a lista. Depois use v_modo = APAGAR_TODAS.';
    RETURN;
  END IF;

  -- Trava todas as obras e confirma que a seleção não mudou desde o início.
  PERFORM 1 FROM obras WHERE id = ANY(v_alvo_ids) FOR UPDATE;
  SELECT count(*)::integer INTO v_n FROM obras WHERE id = ANY(v_alvo_ids);
  IF v_n <> v_total THEN
    RAISE EXCEPTION 'A lista de obras mudou. Toda a operação foi cancelada.';
  END IF;

  -- Ordem explícita para o schema publicado, incluindo tabelas legadas sem FK.
  DELETE FROM pagamentos_split
  WHERE obra_id = ANY(v_alvo_ids)
     OR financeiro_id IN (
       SELECT id FROM financeiro WHERE obra_id = ANY(v_alvo_ids)
     );
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'pagamentos_split apagados: %', v_n;

  DELETE FROM candidatura_anexos
  WHERE candidatura_id IN (
    SELECT id FROM candidaturas WHERE obra_id = ANY(v_alvo_ids)
  );
  DELETE FROM contrato_assinaturas WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM candidaturas WHERE obra_id = ANY(v_alvo_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'candidaturas apagadas: %', v_n;

  DELETE FROM disputa_mensagens
  WHERE disputa_id IN (
    SELECT id FROM disputas WHERE obra_id = ANY(v_alvo_ids)
  );
  DELETE FROM disputas WHERE obra_id = ANY(v_alvo_ids);

  DELETE FROM financeiro WHERE obra_id = ANY(v_alvo_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;
  RAISE NOTICE 'financeiro apagado: %', v_n;

  DELETE FROM notificacoes
  WHERE thread_id IN (
    SELECT id FROM chat_threads WHERE obra_id = ANY(v_alvo_ids)
  );
  DELETE FROM chat_mensagens
  WHERE thread_id IN (
      SELECT id FROM chat_threads WHERE obra_id = ANY(v_alvo_ids)
    )
     OR anexo_obra_id = ANY(v_alvo_ids);
  DELETE FROM chat_threads WHERE obra_id = ANY(v_alvo_ids);

  DELETE FROM survey_respostas
  WHERE survey_id IN (
    SELECT id FROM surveys WHERE obra_id = ANY(v_alvo_ids)
  );
  DELETE FROM surveys WHERE obra_id = ANY(v_alvo_ids);

  DELETE FROM medicoes WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_checklist_itens
  WHERE checklist_id IN (
    SELECT id FROM obra_checklists WHERE obra_id = ANY(v_alvo_ids)
  );
  DELETE FROM obra_checklists WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_tarefas WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_equipe WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_fotos WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_ocorrencias WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_diario WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_etapas WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_anexos WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obra_share_links WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM obras_salvas WHERE obra_id = ANY(v_alvo_ids);
  DELETE FROM atividades WHERE obra_id = ANY(v_alvo_ids);

  DELETE FROM obras WHERE id = ANY(v_alvo_ids);
  GET DIAGNOSTICS v_n = ROW_COUNT;

  IF v_n <> v_total THEN
    RAISE EXCEPTION
      'Era esperado apagar % obras, mas foram apagadas %. Tudo será revertido.',
      v_total,
      v_n;
  END IF;

  RAISE NOTICE 'SUCESSO: % obras e seus dados relacionados foram apagados.', v_n;
  RAISE NOTICE 'A conta do usuário e o perfil foram preservados.';
END $$;