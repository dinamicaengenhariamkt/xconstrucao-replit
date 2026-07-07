import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { pool } from "@/server/db";

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const now = new Date();
  const since24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
  const since7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const hoje = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const ontem = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1).toISOString();

  try {
    const [
      erros24h,
      erros7d,
      errosHoje,
      errosOntem,
      porNivel,
      recentes,
      topRotas,
      usuarios,
      jobs,
      auditoria,
    ] = await Promise.all([
      // Total erros 24h
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM app_errors WHERE created_at > $1`,
        [since24h]
      ),
      // Total erros 7 dias
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM app_errors WHERE created_at > $1`,
        [since7d]
      ),
      // Erros hoje (a partir de meia-noite)
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM app_errors WHERE created_at >= $1`,
        [hoje]
      ),
      // Erros ontem
      pool.query<{ count: string }>(
        `SELECT COUNT(*)::text AS count FROM app_errors WHERE created_at >= $1 AND created_at < $2`,
        [ontem, hoje]
      ),
      // Por nível (24h)
      pool.query<{ level: string; count: string }>(
        `SELECT level, COUNT(*)::text AS count FROM app_errors WHERE created_at > $1 GROUP BY level`,
        [since24h]
      ),
      // 20 erros mais recentes (sem stack, sem PII)
      pool.query<{
        id: number;
        level: string;
        message: string;
        route: string | null;
        source: string;
        created_at: string;
      }>(
        `SELECT id, level, LEFT(message, 200) AS message, route, source, created_at
         FROM app_errors ORDER BY created_at DESC LIMIT 20`
      ),
      // Top 5 rotas com mais erros (7d)
      pool.query<{ route: string; count: string }>(
        `SELECT route, COUNT(*)::text AS count FROM app_errors
         WHERE route IS NOT NULL AND created_at > $1
         GROUP BY route ORDER BY COUNT(*) DESC LIMIT 5`,
        [since7d]
      ),
      // Usuários ativos
      pool.query<{ ativas24h: string; ativas7d: string; total_ativos: string }>(
        `SELECT
          COUNT(*) FILTER (WHERE last_login_at > $1)::text AS ativas24h,
          COUNT(*) FILTER (WHERE last_login_at > $2)::text AS ativas7d,
          COUNT(*) FILTER (WHERE ativo = true)::text AS total_ativos
         FROM users`,
        [since24h, since7d]
      ),
      // Job mais recente por nome (DISTINCT ON)
      pool.query<{
        job: string;
        status: string;
        finished_at: string | null;
        error: string | null;
      }>(
        `SELECT DISTINCT ON (job) job, status, finished_at, LEFT(error, 300) AS error
         FROM job_runs ORDER BY job, started_at DESC`
      ),
      // Últimas 10 ações de auditoria
      pool.query<{ action: string; actor_id: string | null; created_at: string }>(
        `SELECT action, actor_id, created_at FROM audit_logs ORDER BY created_at DESC LIMIT 10`
      ),
    ]);

    const totalErros24h = parseInt(erros24h.rows[0]?.count ?? "0", 10);
    const totalErros7d = parseInt(erros7d.rows[0]?.count ?? "0", 10);
    const qtdHoje = parseInt(errosHoje.rows[0]?.count ?? "0", 10);
    const qtdOntem = parseInt(errosOntem.rows[0]?.count ?? "0", 10);

    const nivelMap: Record<string, number> = {};
    for (const row of porNivel.rows) {
      nivelMap[row.level] = parseInt(row.count, 10);
    }

    let tendencia: "melhora" | "piora" | "estavel" = "estavel";
    if (qtdHoje < qtdOntem) tendencia = "melhora";
    else if (qtdHoje > qtdOntem) tendencia = "piora";

    const usuariosRow = usuarios.rows[0];

    const response = NextResponse.json({
      erros: {
        total24h: totalErros24h,
        totalUltimos7dias: totalErros7d,
        porNivel: {
          error: nivelMap["error"] ?? 0,
          warn: nivelMap["warn"] ?? 0,
          fatal: nivelMap["fatal"] ?? 0,
        },
        recentes: recentes.rows.map((r) => ({
          id: r.id,
          level: r.level,
          message: r.message,
          route: r.route,
          source: r.source,
          createdAt: r.created_at,
        })),
        topRotas: topRotas.rows.map((r) => ({
          route: r.route,
          count: parseInt(r.count, 10),
        })),
      },
      usuarios: {
        ativosUltimas24h: parseInt(usuariosRow?.ativas24h ?? "0", 10),
        ativosUltimos7dias: parseInt(usuariosRow?.ativas7d ?? "0", 10),
        totalAtivos: parseInt(usuariosRow?.total_ativos ?? "0", 10),
      },
      jobs: {
        ultimaExecucao: jobs.rows.map((r) => ({
          job: r.job,
          status: r.status,
          finishedAt: r.finished_at,
          error: r.error,
        })),
      },
      auditoria: {
        ultimasAcoes: auditoria.rows.map((r) => ({
          action: r.action,
          actor: r.actor_id ?? "sistema",
          createdAt: r.created_at,
        })),
      },
      indicadores: {
        tendenciaErros: tendencia,
        errosHoje: qtdHoje,
        errosOntem: qtdOntem,
      },
    });

    response.headers.set("Cache-Control", "private, max-age=30");
    return response;
  } catch (err) {
    console.error("[saude] query failed:", err);
    return NextResponse.json({ message: "Erro interno ao carregar saúde da plataforma" }, { status: 500 });
  }
}
