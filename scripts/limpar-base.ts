/**
 * Limpeza operacional da base: remove todos os usuários e operações,
 * preservando APENAS os administradores e o catálogo de configuração.
 *
 * Uso (dev):
 *   CONFIRM_LIMPAR=SIM npx tsx scripts/limpar-base.ts
 *
 * Uso (produção — exige as DUAS confirmações):
 *   CONFIRM_LIMPAR=SIM CONFIRM_LIMPAR_PROD=SIM npx tsx scripts/limpar-base.ts
 *
 * Dry-run (só mostra o que seria apagado, não executa nada):
 *   npx tsx scripts/limpar-base.ts --dry-run
 *
 * O QUE É PRESERVADO
 *   - users com role IN ('admin','superadmin') e tudo que pertence a eles
 *   - catálogo: planos, platform_settings, legal_documents, anuncio_config, faq
 *   - schema_migrations
 *
 * O QUE É APAGADO
 *   - contratantes, empreiteiros, anunciantes e todo o seu rastro
 *   - obras, candidaturas, medições, contratos, pagamentos, anúncios,
 *     chat, notificações, disputas, surveys, arquivos e logs operacionais
 *
 * POR QUE `DELETE` E NÃO `TRUNCATE ... CASCADE`
 *   TRUNCATE CASCADE ignora as regras `ON DELETE SET NULL` e esvaziaria por
 *   completo tabelas que deveriam apenas ter a coluna anulada (audit_logs,
 *   atividades, disputas...). Além disso não há como preservar o admin com
 *   TRUNCATE. A ordem abaixo respeita as FKs sem CASCADE — em particular
 *   `financeiro.obra_id`, `candidaturas.obra_id`, `candidaturas.empreiteiro_id`
 *   e `pagamentos_split.obra_id`, que bloqueiam o DELETE se vierem fora de ordem.
 *
 * SEGURANÇA
 *   Reusa a mesma heurística de detecção de produção de `tests/e2e/guards.ts`
 *   (blocklist de marcadores + allowlist de hosts de dev conhecidos).
 */
import { sql } from "drizzle-orm";
import { db } from "../shared/db/db";
import { extrairHost, pareceProducao } from "../shared/lib/db-env";

const DRY_RUN = process.argv.includes("--dry-run");

/** Roles cujos usuários (e todo o rastro) sobrevivem à limpeza. */
const ROLES_PRESERVADAS = ["admin", "superadmin"];

/**
 * Restringe a preservação a e-mails específicos, mesmo entre os admins.
 *
 * Vazio (default) = preserva TODOS os usuários com role admin/superadmin.
 * Preenchido = preserva apenas os e-mails listados; demais admins são
 * apagados junto com o resto.
 *
 * Uso: KEEP_ADMINS="fulano@x.com,ciclano@y.com" npx tsx scripts/limpar-base.ts
 *
 * Motivo de existir: o seed de desenvolvimento cria `admin@xconstrucao.com`
 * com uma senha que está em texto claro no repositório (server/seed.ts). Ao
 * preparar a base para clientes reais convém remover essa conta e manter
 * apenas o admin de verdade.
 */
const KEEP_ADMINS = (process.env.KEEP_ADMINS ?? "")
  .split(",")
  .map((e) => e.trim().toLowerCase())
  .filter(Boolean);

/**
 * Tabelas de catálogo/configuração que NUNCA são tocadas. Listadas aqui
 * apenas para documentar a intenção e para o relatório final conferir que
 * continuam intactas.
 */
const TABELAS_PRESERVADAS = [
  "planos",
  "platform_settings",
  "legal_documents",
  "anuncio_config",
  "faq",
  "schema_migrations",
];

/** Lista SQL das roles preservadas, ex.: `'admin', 'superadmin'`. */
const ROLES_SQL = ROLES_PRESERVADAS.map((r) => `'${r}'`).join(", ");

/**
 * Predicado SQL que identifica um usuário preservado, aplicado sobre a tabela
 * `users`. É a fonte única de verdade da limpeza: usado na subquery dos
 * DELETEs filhos e, negado, no DELETE final de `users`.
 *
 * Filtra por `role` — não por `username`/`email` — porque um admin pode ter
 * qualquer username; `username = 'admin'` não é garantia de nada. Quando
 * KEEP_ADMINS está preenchido, exige adicionalmente que o e-mail esteja na
 * lista (comparação case-insensitive, já que e-mails são gravados como
 * digitados).
 */
const PRESERVADO_PREDICATE =
  KEEP_ADMINS.length > 0
    ? `role IN (${ROLES_SQL}) AND lower(email) IN (${KEEP_ADMINS.map((e) => `'${e.replace(/'/g, "''")}'`).join(", ")})`
    : `role IN (${ROLES_SQL})`;

const ADMINS_SUBQUERY = `SELECT id FROM users WHERE ${PRESERVADO_PREDICATE}`;

interface Passo {
  /** Nome da tabela — usado no relatório. */
  tabela: string;
  /**
   * WHERE do DELETE, sem a palavra `WHERE`. `null` = apaga a tabela inteira
   * (só para tabelas puramente operacionais, sem vínculo com admin).
   */
  where: string | null;
  /** Nota explicativa exibida no relatório quando houver algo a apagar. */
  nota?: string;
}

/**
 * Ordem de deleção: das folhas para a raiz. Alterar a ordem quebra as FKs.
 */
const PASSOS: Passo[] = [
  // ── 1. Eventos, logs e filhos diretos ─────────────────────────────────────
  { tabela: "webhook_delivery_log", where: null, nota: "log de entrega de webhook" },
  { tabela: "assinatura_eventos", where: null },
  { tabela: "pedido_pagamento_eventos", where: null },
  { tabela: "pedido_slots", where: null },
  { tabela: "anuncio_eventos", where: null },
  { tabela: "survey_respostas", where: null },
  { tabela: "disputa_mensagens", where: null },
  { tabela: "obra_checklist_itens", where: null },
  { tabela: "chat_mensagens", where: null },
  { tabela: "candidatura_anexos", where: null },

  // ── 2. Dinheiro (antes de obras/financeiro) ───────────────────────────────
  { tabela: "saques", where: null },
  { tabela: "pagamentos_split", where: null },
  { tabela: "financeiro", where: null },
  { tabela: "assinaturas", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "asaas_subcontas", where: null, nota: "subcontas de empreiteiro" },

  // ── 3. Filhos de obra + candidaturas ──────────────────────────────────────
  { tabela: "candidaturas", where: null },
  { tabela: "medicoes", where: null },
  { tabela: "contrato_assinaturas", where: null },
  { tabela: "obras_salvas", where: null },
  { tabela: "obra_anexos", where: null },
  { tabela: "obra_etapas", where: null },
  { tabela: "obra_diario", where: null },
  { tabela: "obra_ocorrencias", where: null },
  { tabela: "obra_fotos", where: null },
  { tabela: "obra_tarefas", where: null },
  { tabela: "obra_checklists", where: null },
  { tabela: "obra_equipe", where: null },
  { tabela: "disputas", where: null },
  { tabela: "chat_threads", where: null },
  { tabela: "surveys", where: null },
  { tabela: "atividades", where: null },

  // ── 4. Obras ──────────────────────────────────────────────────────────────
  { tabela: "obras", where: null },

  // ── 5. Anúncios e perfis ──────────────────────────────────────────────────
  { tabela: "anuncios", where: null },
  { tabela: "pedidos_anuncio", where: null },
  { tabela: "clientes", where: null, nota: "perfis de contratante" },
  { tabela: "empreiteiras", where: null, nota: "perfis de empreiteiro" },
  { tabela: "anunciantes", where: null, nota: "perfis de anunciante" },

  // ── 6. Identidade e rastro dos usuários não-admin ─────────────────────────
  { tabela: "accounts", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "sessions", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "verification_tokens", where: null, nota: "tokens de verificação pendentes" },
  { tabela: "user_totp", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "user_consents", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "user_preferencias", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "user_roles", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "password_setup_tokens", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "notificacoes", where: `user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "empreiteiro_documentos", where: null },
  { tabela: "cliente_documentos", where: null },
  { tabela: "empreiteiro_portfolio", where: null },
  { tabela: "marketplace_leads", where: null },
  { tabela: "app_errors", where: null, nota: "erros capturados (Sentry local)" },
  { tabela: "job_runs", where: null, nota: "histórico de execução de jobs" },
  { tabela: "kpi_snapshots", where: null, nota: "snapshots históricos de KPI" },
  {
    tabela: "audit_logs",
    where: `actor_id IS NULL OR actor_id NOT IN (${ADMINS_SUBQUERY})`,
    nota: "preserva as ações feitas pelos admins",
  },

  // ── 7. Arquivos e raiz ────────────────────────────────────────────────────
  { tabela: "user_files", where: `owner_user_id NOT IN (${ADMINS_SUBQUERY})` },
  { tabela: "users", where: `NOT (${PRESERVADO_PREDICATE})` },
];

/** `true` se a tabela existir no banco — o schema é criado por bootstraps. */
async function tabelaExiste(tabela: string): Promise<boolean> {
  const res = await db.execute(
    sql`SELECT to_regclass(${`public.${tabela}`}) IS NOT NULL AS existe`,
  );
  return Boolean((res.rows[0] as { existe: boolean } | undefined)?.existe);
}

async function contar(tabela: string, where: string | null): Promise<number> {
  const q = `SELECT count(*)::int AS n FROM "${tabela}"${where ? ` WHERE ${where}` : ""}`;
  const res = await db.execute(sql.raw(q));
  return Number((res.rows[0] as { n: number } | undefined)?.n ?? 0);
}

async function main() {
  const dbUrl = process.env.DATABASE_URL ?? "";
  if (!dbUrl.trim()) {
    console.error("[limpar-base] DATABASE_URL não está definido. Abortando.");
    process.exit(1);
  }

  const ehProd = pareceProducao(dbUrl) || process.env.NODE_ENV === "production";
  const host = extrairHost(dbUrl);

  console.log("");
  console.log("═".repeat(64));
  console.log("  LIMPEZA DE BASE — preserva apenas administradores");
  console.log("═".repeat(64));
  console.log(`  Banco:     ${host}`);
  console.log(`  Ambiente:  ${ehProd ? "PRODUÇÃO (ou host não reconhecido)" : "desenvolvimento"}`);
  console.log(`  Modo:      ${DRY_RUN ? "DRY-RUN (nada será apagado)" : "EXECUÇÃO REAL"}`);
  console.log("");

  // ── Confirmações ────────────────────────────────────────────────────────
  if (!DRY_RUN) {
    if (process.env.CONFIRM_LIMPAR !== "SIM") {
      console.error(
        "[limpar-base] Confirmação ausente. Para executar de verdade, rode:\n" +
          "    CONFIRM_LIMPAR=SIM npx tsx scripts/limpar-base.ts\n" +
          "  Ou use --dry-run para apenas visualizar o que seria apagado.",
      );
      process.exit(1);
    }
    if (ehProd && process.env.CONFIRM_LIMPAR_PROD !== "SIM") {
      console.error(
        `[limpar-base] Este banco ("${host}") NÃO é reconhecido como de desenvolvimento.\n` +
          "  Para limpar mesmo assim, adicione a segunda confirmação:\n" +
          "    CONFIRM_LIMPAR=SIM CONFIRM_LIMPAR_PROD=SIM npx tsx scripts/limpar-base.ts",
      );
      process.exit(1);
    }
  }

  // ── Prévia: quem sobrevive e o que será apagado ─────────────────────────
  const admins = await db.execute(
    sql.raw(`SELECT email, role FROM users WHERE ${PRESERVADO_PREDICATE} ORDER BY email`),
  );
  const listaAdmins = admins.rows as Array<{ email: string; role: string }>;

  if (listaAdmins.length === 0) {
    console.error(
      "[limpar-base] Nenhum usuário seria preservado. Abortando — a limpeza\n" +
        "  deixaria a base sem nenhum acesso administrativo, e o seed recriaria\n" +
        "  os usuários de desenvolvimento no próximo boot." +
        (KEEP_ADMINS.length > 0
          ? `\n  Confira o KEEP_ADMINS informado: ${KEEP_ADMINS.join(", ")}`
          : ""),
    );
    process.exit(1);
  }

  // Avisa sobre e-mails informados em KEEP_ADMINS que não casaram com nenhum
  // admin — quase sempre é erro de digitação, e passar batido significaria
  // apagar uma conta que se queria manter.
  if (KEEP_ADMINS.length > 0) {
    const encontrados = new Set(listaAdmins.map((a) => a.email.toLowerCase()));
    const ausentes = KEEP_ADMINS.filter((e) => !encontrados.has(e));
    if (ausentes.length > 0) {
      console.error(
        `[limpar-base] KEEP_ADMINS lista e-mails que não correspondem a nenhum\n` +
          `  admin/superadmin: ${ausentes.join(", ")}\n` +
          "  Abortando por segurança — corrija a lista e rode de novo.",
      );
      process.exit(1);
    }
  }

  console.log(`  Administradores preservados (${listaAdmins.length}):`);
  for (const a of listaAdmins) console.log(`    · ${a.email} (${a.role})`);
  if (KEEP_ADMINS.length > 0) {
    const outros = await db.execute(
      sql.raw(
        `SELECT email FROM users WHERE role IN (${ROLES_SQL}) AND NOT (${PRESERVADO_PREDICATE}) ORDER BY email`,
      ),
    );
    const listaOutros = outros.rows as Array<{ email: string }>;
    if (listaOutros.length > 0) {
      console.log(`  Administradores que SERÃO APAGADOS (${listaOutros.length}):`);
      for (const a of listaOutros) console.log(`    · ${a.email}`);
    }
  }
  console.log("");

  console.log("  Registros a apagar:");
  let total = 0;
  const planoExecucao: Array<{ passo: Passo; n: number }> = [];

  for (const passo of PASSOS) {
    if (!(await tabelaExiste(passo.tabela))) continue;
    const n = await contar(passo.tabela, passo.where);
    planoExecucao.push({ passo, n });
    total += n;
    if (n > 0) {
      const nota = passo.nota ? `  — ${passo.nota}` : "";
      console.log(`    ${String(n).padStart(6)}  ${passo.tabela}${nota}`);
    }
  }

  console.log("");
  console.log(`  Total: ${total} registros em ${planoExecucao.filter((p) => p.n > 0).length} tabelas`);
  console.log(`  Preservadas: ${TABELAS_PRESERVADAS.join(", ")}`);
  console.log("");

  if (DRY_RUN) {
    console.log("  DRY-RUN — nada foi alterado.");
    console.log("═".repeat(64));
    return;
  }

  if (total === 0) {
    console.log("  Nada a apagar. A base já está limpa.");
    console.log("═".repeat(64));
    return;
  }

  // ── Execução, em transação única ────────────────────────────────────────
  console.log("  Executando...");
  await db.transaction(async (tx) => {
    for (const { passo, n } of planoExecucao) {
      if (n === 0) continue;
      const q = `DELETE FROM "${passo.tabela}"${passo.where ? ` WHERE ${passo.where}` : ""}`;
      await tx.execute(sql.raw(q));
      console.log(`    ✔ ${passo.tabela} (${n})`);
    }
  });

  // ── Conferência pós-limpeza ─────────────────────────────────────────────
  const restantes = await db.execute(
    sql.raw("SELECT role, count(*)::int AS n FROM users GROUP BY role ORDER BY role"),
  );
  console.log("");
  console.log("  Usuários restantes por role:");
  for (const r of restantes.rows as Array<{ role: string; n: number }>) {
    console.log(`    ${String(r.n).padStart(6)}  ${r.role}`);
  }
  console.log("");
  console.log("  Limpeza concluída ✔");
  console.log("");
  console.log("  Próximo passo: reinicie a aplicação. O seed NÃO recriará os");
  console.log("  usuários de desenvolvimento (joão/maria) porque o admin");
  console.log("  permanece na base — veja server/seed.ts.");
  console.log("═".repeat(64));
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error("[limpar-base] Falha:", err);
    process.exit(1);
  });
