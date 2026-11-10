/**
 * REV-01 — colunas e tabelas que o código já lê com `select()` sem lista.
 *
 * Em produção os bootstraps completos rodam em segundo plano e o servidor
 * atende antes deles terminarem. Este bloco roda com `await` no início de
 * `register()` e garante só o essencial das migrations 0010 a 0016 (login lê
 * `users.conta_interna`, o plano lê `assinaturas.fim_teste_em` etc.).
 *
 * Regras:
 *  - só `ADD COLUMN IF NOT EXISTS`, `CREATE TABLE/INDEX IF NOT EXISTS` e blocos
 *    `DO` que conferem o catálogo antes de alterar: rodar 2x não muda nada;
 *  - cada passo numa transação própria com `lock_timeout` curto: se a tabela
 *    estiver ocupada, desiste rápido e o bootstrap completo tenta de novo;
 *  - banco vazio (1º boot): tabela base ausente faz o passo ser pulado em
 *    silêncio; o bootstrap normal cria tudo na ordem certa.
 *
 * As definições ficam aqui, puras, para o teste unitário conferir o SQL.
 * Os bootstraps antigos (`bootstrap-troca-plano`, `bootstrap-planos` etc.)
 * continuam rodando como antes.
 */

export type PassoEssencial = {
  nome: string;
  /** Tabelas que precisam existir antes; ausente qualquer uma, o passo é pulado. */
  precisa: string[];
  sql: string;
};

export const LOCK_TIMEOUT_ESSENCIAL = "3s";
export const STATEMENT_TIMEOUT_ESSENCIAL = "20s";

/**
 * Bloco `DO` que só troca a CHECK quando falta algum dos valores aceitos.
 * Evita o DROP + ADD a cada boot (lock exclusivo e corrida entre instâncias).
 */
export function sqlGarantirCheckIn(tabela: string, constraint: string, coluna: string, valores: readonly string[]): string {
  const ident = (s: string) => {
    if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw new Error(`identificador inválido: ${s}`);
    return s;
  };
  const lit = (s: string) => `'${s.replace(/'/g, "''")}'`;
  const t = ident(tabela);
  const c = ident(constraint);
  const col = ident(coluna);
  const contem = valores.map((v) => `pg_get_constraintdef(oid) LIKE ${lit(`%'${v.replace(/'/g, "''")}'%`)}`).join(" AND ");
  return `DO $$
BEGIN
  IF to_regclass('public.${t}') IS NULL THEN RETURN; END IF;
  IF EXISTS (
    SELECT 1 FROM pg_constraint
     WHERE conrelid = 'public.${t}'::regclass AND conname = ${lit(c)}
       AND ${contem}
  ) THEN RETURN; END IF;
  ALTER TABLE ${t} DROP CONSTRAINT IF EXISTS ${c};
  ALTER TABLE ${t} ADD CONSTRAINT ${c} CHECK (${col} IN (${valores.map(lit).join(", ")}));
END $$`;
}

export const STATUS_MEMBRO = ["convidado", "ativo", "revogado", "pausado"] as const;
export const STATUS_TROCA = ["pendente_gateway", "agendada", "aplicada", "desfeita", "cancelada", "falhou"] as const;

export const SQL_CRIAR_ASSINATURA_TROCAS = `CREATE TABLE IF NOT EXISTS assinatura_trocas (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  empreiteira_id VARCHAR REFERENCES empreiteiras(id) ON DELETE SET NULL,
  assinatura_id VARCHAR NOT NULL REFERENCES assinaturas(id) ON DELETE CASCADE,
  plano_de_id VARCHAR NOT NULL REFERENCES planos(id),
  plano_para_id VARCHAR NOT NULL REFERENCES planos(id),
  tier_de TEXT NOT NULL,
  tier_para TEXT NOT NULL,
  tipo TEXT NOT NULL CHECK (tipo IN ('subir', 'descer')),
  valor_de NUMERIC(15,2) NOT NULL,
  valor_para NUMERIC(15,2) NOT NULL,
  valor_diferenca NUMERIC(15,2) NOT NULL DEFAULT 0,
  dias_restantes INTEGER NOT NULL DEFAULT 0,
  dias_ciclo INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL CONSTRAINT assinatura_trocas_status_check
    CHECK (status IN (${STATUS_TROCA.map((s) => `'${s}'`).join(", ")})),
  efetiva_em TIMESTAMP NOT NULL,
  payment_id_ajustado TEXT,
  ajuste_pendente BOOLEAN NOT NULL DEFAULT FALSE,
  quitada_em TIMESTAMP,
  chave_idempotencia TEXT,
  escolhas JSONB NOT NULL DEFAULT '{}'::jsonb,
  erro TEXT,
  criada_em TIMESTAMP NOT NULL DEFAULT NOW(),
  aplicada_em TIMESTAMP,
  atualizada_em TIMESTAMP NOT NULL DEFAULT NOW()
)`;

/** Índices da troca. REV-10: a chave de idempotência é por titular. */
export const SQL_INDICES_ASSINATURA_TROCAS = [
  `DROP INDEX IF EXISTS uq_assinatura_trocas_chave`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_assinatura_trocas_user_chave ON assinatura_trocas(user_id, chave_idempotencia)`,
  `CREATE INDEX IF NOT EXISTS idx_assinatura_trocas_user_status ON assinatura_trocas(user_id, status)`,
  `CREATE INDEX IF NOT EXISTS idx_assinatura_trocas_assinatura ON assinatura_trocas(assinatura_id, status)`,
  `CREATE UNIQUE INDEX IF NOT EXISTS uq_assinatura_trocas_agendada ON assinatura_trocas(assinatura_id) WHERE status = 'agendada'`,
];

export const PASSOS_ESSENCIAIS: PassoEssencial[] = [
  // 0013 — login (`auth-storage`) lê users inteiro.
  { nome: "users.conta_interna", precisa: ["users"], sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS conta_interna BOOLEAN NOT NULL DEFAULT FALSE` },
  // 0011 — plano e bônus do teste.
  {
    nome: "assinaturas.fim_teste_em/primeiro_pagamento_em",
    precisa: ["assinaturas"],
    sql: `ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS fim_teste_em TIMESTAMP, ADD COLUMN IF NOT EXISTS primeiro_pagamento_em TIMESTAMP`,
  },
  // 0010 — ocorrências editáveis e autor da assinatura do checklist.
  {
    nome: "obra_ocorrencias.observacao_resolucao/atualizado_em",
    precisa: ["obra_ocorrencias"],
    sql: `ALTER TABLE obra_ocorrencias ADD COLUMN IF NOT EXISTS observacao_resolucao TEXT, ADD COLUMN IF NOT EXISTS atualizado_em TIMESTAMP`,
  },
  {
    nome: "obra_checklists.assinado_por_user_id",
    precisa: ["obra_checklists", "users"],
    sql: `ALTER TABLE obra_checklists ADD COLUMN IF NOT EXISTS assinado_por_user_id VARCHAR REFERENCES users(id) ON DELETE SET NULL`,
  },
  // 0012 — troca de plano.
  { nome: "obras.xgestao_bloqueada_por_plano", precisa: ["obras"], sql: `ALTER TABLE obras ADD COLUMN IF NOT EXISTS xgestao_bloqueada_por_plano BOOLEAN NOT NULL DEFAULT FALSE` },
  { nome: "obra_share_links.pausado_por_plano", precisa: ["obra_share_links"], sql: `ALTER TABLE obra_share_links ADD COLUMN IF NOT EXISTS pausado_por_plano BOOLEAN NOT NULL DEFAULT FALSE` },
  { nome: "xgestao_membros.status_antes_pausa", precisa: ["xgestao_membros"], sql: `ALTER TABLE xgestao_membros ADD COLUMN IF NOT EXISTS status_antes_pausa TEXT` },
  {
    nome: "xgestao_membros.status (pausado)",
    precisa: ["xgestao_membros"],
    sql: sqlGarantirCheckIn("xgestao_membros", "xgestao_membros_status_check", "status", STATUS_MEMBRO),
  },
  {
    nome: "assinatura_trocas",
    precisa: ["users", "empreiteiras", "assinaturas", "planos"],
    sql: SQL_CRIAR_ASSINATURA_TROCAS,
  },
  {
    nome: "assinatura_trocas.status (pendente_gateway)",
    precisa: ["assinatura_trocas"],
    sql: sqlGarantirCheckIn("assinatura_trocas", "assinatura_trocas_status_check", "status", STATUS_TROCA),
  },
  ...SQL_INDICES_ASSINATURA_TROCAS.map((sql, i) => ({ nome: `assinatura_trocas índice ${i + 1}`, precisa: ["assinatura_trocas"], sql })),  // 0014 — motivo do cancelamento (lido em todo `select()` de assinaturas) e
  // contatos do admin. Espelha server/bootstrap-xgestao-admin-crm.ts.
  {
    nome: "assinaturas.motivo_cancelamento",
    precisa: ["assinaturas"],
    sql: `ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS motivo_cancelamento TEXT, ADD COLUMN IF NOT EXISTS motivo_cancelamento_texto TEXT`,
  },
  {
    nome: "xgestao_admin_contatos",
    precisa: ["users", "empreiteiras"],
    sql: `CREATE TABLE IF NOT EXISTS xgestao_admin_contatos (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  empreiteira_id VARCHAR REFERENCES empreiteiras(id) ON DELETE SET NULL,
  admin_id VARCHAR REFERENCES users(id) ON DELETE SET NULL,
  canal TEXT NOT NULL CHECK (canal IN ('whatsapp', 'email', 'telefone', 'outro')),
  nota TEXT CHECK (nota IS NULL OR char_length(nota) <= 1000),
  criado_em TIMESTAMP NOT NULL DEFAULT now()
)`,
  },
  // 0015 — anti-abuso do teste e do bônus por CPF/CNPJ e eventos por conta
  // (`bonus_negado`, `teste_negado`). Espelha migrations/0015_xgestao_pagamento_antiabuso.sql.
  {
    nome: "assinaturas.documento_fiscal",
    precisa: ["assinaturas"],
    sql: `ALTER TABLE assinaturas ADD COLUMN IF NOT EXISTS documento_fiscal TEXT`,
  },
  {
    nome: "idx_assinaturas_documento_fiscal",
    precisa: ["assinaturas"],
    sql: `CREATE INDEX IF NOT EXISTS idx_assinaturas_documento_fiscal ON assinaturas (documento_fiscal) WHERE documento_fiscal IS NOT NULL`,
  },
  {
    nome: "assinatura_eventos.user_id",
    precisa: ["assinatura_eventos", "users"],
    sql: `ALTER TABLE assinatura_eventos ADD COLUMN IF NOT EXISTS user_id VARCHAR REFERENCES users(id) ON DELETE CASCADE`,
  },
  {
    nome: "idx_assinatura_eventos_user_tipo",
    precisa: ["assinatura_eventos"],
    sql: `CREATE INDEX IF NOT EXISTS idx_assinatura_eventos_user_tipo ON assinatura_eventos (user_id, tipo) WHERE user_id IS NOT NULL`,
  },
  // 0016 — consentimento de marketing (login lê users inteiro) e controle dos
  // e-mails da rotina diária. Espelha migrations/0016_xgestao_marketing_emails.sql.
  {
    nome: "users.marketing_consentimento",
    precisa: ["users"],
    sql: `ALTER TABLE users ADD COLUMN IF NOT EXISTS marketing_consentimento_em TIMESTAMP, ADD COLUMN IF NOT EXISTS marketing_revogado_em TIMESTAMP, ADD COLUMN IF NOT EXISTS marketing_origem TEXT`,
  },
  {
    nome: "xgestao_emails_enviados",
    precisa: ["users"],
    sql: `CREATE TABLE IF NOT EXISTS xgestao_emails_enviados (
  id VARCHAR PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id VARCHAR NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  tipo TEXT NOT NULL,
  referencia TEXT NOT NULL,
  enviado_em TIMESTAMP NOT NULL DEFAULT NOW()
)`,
  },
  {
    nome: "uq_xgestao_emails_enviados",
    precisa: ["xgestao_emails_enviados"],
    sql: `CREATE UNIQUE INDEX IF NOT EXISTS uq_xgestao_emails_enviados ON xgestao_emails_enviados (user_id, tipo, referencia)`,
  },
  {
    nome: "idx_xgestao_emails_enviados_em",
    precisa: ["xgestao_emails_enviados"],
    sql: `CREATE INDEX IF NOT EXISTS idx_xgestao_emails_enviados_em ON xgestao_emails_enviados (enviado_em)`,
  },
];

/** Tabelas que os próprios passos criam (o conjunto de existentes é relido). */
const CRIADAS_AQUI = ["assinatura_trocas", "xgestao_emails_enviados"];

/** Passos a rodar, dado o conjunto de tabelas existentes. Puro (teste unitário). */
export function passosParaRodar(existentes: ReadonlySet<string>, passos: PassoEssencial[] = PASSOS_ESSENCIAIS): PassoEssencial[] {
  return passos.filter((p) => p.precisa.every((t) => existentes.has(t)));
}

export type ResultadoEssencial = { rodados: string[]; pulados: string[]; falhas: Array<{ nome: string; erro: string }> };

/**
 * Roda os passos. Nunca lança: falha de um passo é registrada e os demais
 * seguem (o bootstrap completo e o health check de schema cobrem o resto).
 */
export async function bootstrapColunasEssenciais(): Promise<ResultadoEssencial> {
  const { sql } = await import("drizzle-orm");
  const { db } = await import("@shared/db/db");
  const resultado: ResultadoEssencial = { rodados: [], pulados: [], falhas: [] };

  const tabelasUsadas = [...new Set(PASSOS_ESSENCIAIS.flatMap((p) => p.precisa))];
  const existentes = async () => {
    const r = await db.execute<{ t: string }>(sql.raw(
      `SELECT t FROM unnest(ARRAY[${tabelasUsadas.map((t) => `'${t}'`).join(", ")}]) AS t WHERE to_regclass('public.' || t) IS NOT NULL`,
    ));
    return new Set((r.rows as Array<{ t: string }>).map((x) => x.t));
  };

  let tabelas = await existentes();
  for (const passo of PASSOS_ESSENCIAIS) {
    // `assinatura_trocas` e `xgestao_emails_enviados` podem ter sido criadas por um passo anterior.
    if (passo.precisa.some((t) => CRIADAS_AQUI.includes(t) && !tabelas.has(t))) tabelas = await existentes();
    if (!passo.precisa.every((t) => tabelas.has(t))) {
      resultado.pulados.push(passo.nome);
      continue;
    }
    try {
      await db.transaction(async (tx) => {
        await tx.execute(sql.raw(`SET LOCAL lock_timeout = '${LOCK_TIMEOUT_ESSENCIAL}'`));
        await tx.execute(sql.raw(`SET LOCAL statement_timeout = '${STATEMENT_TIMEOUT_ESSENCIAL}'`));
        await tx.execute(sql.raw(passo.sql));
      });
      resultado.rodados.push(passo.nome);
    } catch (err) {
      resultado.falhas.push({ nome: passo.nome, erro: err instanceof Error ? err.message : String(err) });
    }
  }
  return resultado;
}
