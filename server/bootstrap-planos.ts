import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { getPlanCatalog, PLANS_CATALOG, type PlanoPersona, type PlanoTier } from "@shared/lib/plans-catalog";
import { OFERTA_XGESTAO } from "@features/xgestao/lib/oferta-comercial";

/**
 * Bootstrap idempotente da Jornada 11 — Planos & Assinatura.
 * - Enums: plano_persona, assinatura_status.
 * - Tabelas: planos (catálogo), assinaturas, assinatura_eventos.
 * - Índices únicos PARCIAIS: 1 assinatura ativa por user; 1 evento por
 *   gateway_event_id (idempotência do webhook).
 * - Seed do catálogo a partir de shared/lib/plans-catalog (fonte de verdade dos
 *   limites). Idempotente por (tier, persona).
 */
export async function bootstrapPlanosSchema(): Promise<void> {
  try {
    await db.execute(sql`DO $$ BEGIN CREATE TYPE plano_persona AS ENUM ('contratante','empreiteiro','ambos'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    // PostgreSQL mantém enums existentes quando o bootstrap roda novamente; a
    // persona xgestão precisa ser adicionada separadamente para instalações já
    // inicializadas antes do produto existir.
    await db.execute(sql`ALTER TYPE plano_persona ADD VALUE IF NOT EXISTS 'xgestao'`);
    // Idem para a oferta nova do xgestão: sem estes valores o seed abaixo falha e
    // os planos e o teste Premium não existem no ambiente publicado.
    await db.execute(sql`ALTER TYPE plano ADD VALUE IF NOT EXISTS 'basic'`);
    await db.execute(sql`ALTER TYPE plano ADD VALUE IF NOT EXISTS 'basic_plus'`);
    await db.execute(sql`ALTER TYPE plano ADD VALUE IF NOT EXISTS 'premium'`);
    await db.execute(sql`DO $$ BEGIN CREATE TYPE assinatura_status AS ENUM ('ativa','cancelada','inadimplente','expirada'); EXCEPTION WHEN duplicate_object THEN NULL; END $$;`);
    // Migração idempotente: adiciona 'pendente_reativacao' ao enum se ainda não existir.
    await db.execute(sql`DO $$ BEGIN ALTER TYPE assinatura_status ADD VALUE IF NOT EXISTS 'pendente_reativacao'; EXCEPTION WHEN others THEN NULL; END $$;`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS planos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        tier plano NOT NULL,
        persona plano_persona NOT NULL,
        nome TEXT NOT NULL,
        descricao TEXT,
        valor_mensal NUMERIC(15,2) NOT NULL DEFAULT 0,
        valor_anual NUMERIC(15,2),
        limites_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        features TEXT[] NOT NULL DEFAULT ARRAY[]::text[],
        ativo BOOLEAN NOT NULL DEFAULT TRUE,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_planos_tier_persona ON planos(tier, persona)`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assinaturas (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        plano_id VARCHAR NOT NULL REFERENCES planos(id),
        persona plano_persona NOT NULL,
        status assinatura_status NOT NULL DEFAULT 'ativa',
        ciclo TEXT NOT NULL DEFAULT 'mensal',
        iniciada_em TIMESTAMP NOT NULL DEFAULT NOW(),
        renova_em TIMESTAMP,
        cancelada_em TIMESTAMP,
        gateway_provider TEXT NOT NULL DEFAULT 'manual',
        gateway_customer_id TEXT,
        gateway_subscription_id TEXT,
        created_at TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    await db.execute(sql`CREATE INDEX IF NOT EXISTS idx_assinaturas_user ON assinaturas(user_id)`);
    // Migração do vínculo antigo (global) para uma assinatura por produto.
    // A persona é copiada do plano antes de se tornar obrigatória, preservando
    // assinaturas existentes durante o deploy.
    await db.execute(sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS persona plano_persona`);
    await db.execute(sql`
      UPDATE assinaturas AS a
      SET persona = p.persona
      FROM planos AS p
      WHERE p.id = a.plano_id AND a.persona IS NULL
    `);
    await db.execute(sql`ALTER TABLE assinaturas ALTER COLUMN persona SET NOT NULL`);
    await db.execute(sql`DROP INDEX IF EXISTS uq_assinaturas_user_ativa`);
    // Uma mesma pessoa pode assinar marketplace e xgestão, mas não pode ter
    // duas assinaturas ativas do mesmo produto.
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_assinaturas_user_persona_ativa ON assinaturas(user_id, persona) WHERE status = 'ativa'`);

    await db.execute(sql`
      CREATE TABLE IF NOT EXISTS assinatura_eventos (
        id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
        assinatura_id VARCHAR REFERENCES assinaturas(id) ON DELETE CASCADE,
        tipo TEXT NOT NULL,
        gateway_event_id TEXT,
        payload_json JSONB NOT NULL DEFAULT '{}'::jsonb,
        criado_em TIMESTAMP NOT NULL DEFAULT NOW()
      )
    `);
    // Idempotência do webhook: um evento por gateway_event_id (quando presente).
    await db.execute(sql`CREATE UNIQUE INDEX IF NOT EXISTS uq_assinatura_eventos_gateway ON assinatura_eventos(gateway_event_id) WHERE gateway_event_id IS NOT NULL`);

    // Migração idempotente: adiciona gateway_retry_count se ainda não existir.
    // Rastreia quantas execuções consecutivas do job encontraram gateway "unknown"
    // enquanto a assinatura está em pendente_reativacao.
    await db.execute(sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS gateway_retry_count INTEGER NOT NULL DEFAULT 0`);

    // Migração idempotente: adiciona pendente_reativacao_at se ainda não existir.
    await db.execute(sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS pendente_reativacao_at TIMESTAMP`);

    // xgestão (10/11/2026) — bônus do teste só com o 1º pagamento e uma vez por
    // conta. Espelha migrations/0011_assinaturas_bonus_teste.sql.
    await db.execute(sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS fim_teste_em TIMESTAMP`);
    await db.execute(sql`ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS primeiro_pagamento_em TIMESTAMP`);

    // REV-04 — preenchimento retroativo de `primeiro_pagamento_em`. Assinante
    // pago de antes de 10/11/2026 tinha a coluna nula e caía em "sem pagamento"
    // na troca de plano (subia sem pagar o proporcional). Só assinatura paga
    // (não teste) e que não veio do teste grátis. Ordem: 1º payment_succeeded,
    // senão 1ª mensalidade no caixa, senão o início. Idempotente (só nulos).
    // `assinatura_eventos` já existe aqui; `financeiro` vem do bootstrap de obras.
    await db.execute(sql`
      UPDATE assinaturas a
         SET primeiro_pagamento_em = COALESCE(
               (SELECT min(e.criado_em) FROM assinatura_eventos e
                 WHERE e.assinatura_id = a.id AND e.tipo = 'payment_succeeded'),
               (SELECT min(f.created_at) FROM financeiro f
                 WHERE f.origem_tipo = 'xgestao_mensalidade' AND f.pagador_user_id = a.user_id
                   AND f.created_at >= a.iniciada_em - interval '1 day'),
               a.iniciada_em)
       WHERE a.persona = 'xgestao'
         AND a.status IN ('ativa', 'inadimplente', 'cancelada')
         AND a.gateway_provider <> 'trial'
         AND a.primeiro_pagamento_em IS NULL
         AND a.fim_teste_em IS NULL
    `);

    // Seed do catálogo a partir do plans-catalog (idempotente por tier+persona).
    const personas: PlanoPersona[] = ["empreiteiro", "contratante", "xgestao"];
    for (const persona of personas) {
      const tiers = Object.keys(PLANS_CATALOG[persona]) as PlanoTier[];
      for (const tier of tiers) {
        const c = getPlanCatalog(persona, tier);
        await db.execute(sql`
          INSERT INTO planos (tier, persona, nome, descricao, valor_mensal, limites_json, features, ativo)
          VALUES (
            ${tier}::plano, ${persona}::plano_persona, ${c.nome}, NULL, ${c.precoMensal},
            ${JSON.stringify(c.limites)}::jsonb, ${sql.raw(`ARRAY[${c.features.map((f) => `'${f.replace(/'/g, "''")}'`).join(",")}]::text[]`)}, TRUE
          )
          ON CONFLICT (tier, persona) DO NOTHING
        `);
      }
    }
    // O seed não sobrescreve linhas existentes. Troca só o texto gerado pela
    // versão anterior da oferta: o que o admin editou no painel fica como está.
    for (const [tier, plano] of Object.entries(OFERTA_XGESTAO)) {
      const anterior = [
        `${plano.obrasAtivas} obra(s) ativa(s)`,
        `${plano.pessoasEmpresa} pessoas por empresa, incluindo você`,
        plano.linksPorObra === null ? "Links públicos ilimitados por obra" : `${plano.linksPorObra} link(s) público(s) por obra`,
        "Dashboard, etapas, tarefas e cronograma",
        "Fotos, diário, ocorrências, checklists e timeline",
        "Documentos e financeiro (gasto × orçamento)",
        ...(plano.valoresPublicos ? ["Contrato, recebimentos e saldo no link do cliente"] : []),
      ];
      const lista = (itens: readonly string[]) =>
        sql.raw(`ARRAY[${itens.map((f) => `'${f.replace(/'/g, "''")}'`).join(",")}]::text[]`);
      await db.execute(sql`
        UPDATE planos SET features = ${lista(plano.features)}
        WHERE persona = 'xgestao' AND tier = ${tier}::plano AND features = ${lista(anterior)}
      `);
    }
    // PAG-10 — tiers legados do xgestão saem da oferta (o seed acima os cria
    // ativos em instalação nova). Assinaturas antigas nesses tiers seguem
    // lidas pelo catálogo em `situacaoPlanoXgestao`; só não são vendidas.
    await db.execute(sql`
      UPDATE planos SET ativo = FALSE
      WHERE persona = 'xgestao' AND tier IN ('free', 'pro', 'enterprise') AND ativo = TRUE
    `);
    // Testes ativos em planos fora da oferta (pro/enterprise/free legados) vão
    // para o plano do teste, que desde 09/11/2026 é o Basic (XG43). Testes já
    // em basic/basic_plus/premium ficam como estão até o fim: quem começou no
    // Premium não perde recurso no meio do prazo. Preserva o fim original e não
    // toca em cobranças/contratos manuais ou externos.
    await db.execute(sql`
      WITH atualizadas AS (
        UPDATE assinaturas AS a SET plano_id = p.id
        FROM planos AS p, planos AS atual
        WHERE a.persona = 'xgestao' AND a.gateway_provider = 'trial'
          AND a.status = 'ativa'
          AND atual.id = a.plano_id
          AND atual.tier NOT IN ('basic', 'basic_plus', 'premium')
          AND p.persona = 'xgestao' AND p.tier = 'basic'
        RETURNING a.id, a.renova_em
      )
      INSERT INTO assinatura_eventos (id, assinatura_id, tipo, payload_json)
      SELECT gen_random_uuid(), id, 'teste_oferta_atualizada',
        jsonb_build_object('tier', 'basic', 'fimTestePreservado', renova_em)
      FROM atualizadas
    `);
  } catch (err) {
    console.error("[bootstrap-planos] falha:", err);
    return;
  }

  console.info("[bootstrap-planos] schema ready (planos + assinaturas + eventos, catálogo seedado)");
}
