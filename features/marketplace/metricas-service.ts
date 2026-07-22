import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";

/**
 * J50 — Métricas de split para o painel admin. Agrega `pagamentos_split` por
 * status e `saques` por status. Números para o painel de financeiro.
 */
export interface MetricasSplit {
  // pagamentos_split
  totalConfirmado: number; // soma valorTotal dos confirmados
  totalRepassado: number; // soma valorEmpreiteiro dos confirmados (repasse)
  totalComissao: number; // soma valorPlataforma dos confirmados
  qtdPendentes: number;
  qtdConfirmados: number;
  qtdFalhos: number;
  valorPendente: number; // soma valorTotal dos pendentes (exposição em aberto)
  // saques
  totalSacado: number; // soma dos saques concluídos
  qtdSaquesPendentes: number;
}

export async function getMetricasSplit(): Promise<MetricasSplit> {
  const [split] = (
    await db.execute<{
      total_confirmado: string;
      total_repassado: string;
      total_comissao: string;
      qtd_pendentes: number;
      qtd_confirmados: number;
      qtd_falhos: number;
      valor_pendente: string;
    }>(sql`
      SELECT
        COALESCE(SUM(valor_total::numeric) FILTER (WHERE status = 'confirmado'), 0)      AS total_confirmado,
        COALESCE(SUM(valor_empreiteiro::numeric) FILTER (WHERE status = 'confirmado'), 0) AS total_repassado,
        COALESCE(SUM(valor_plataforma::numeric) FILTER (WHERE status = 'confirmado'), 0)  AS total_comissao,
        COUNT(*) FILTER (WHERE status = 'pendente')::int                                  AS qtd_pendentes,
        COUNT(*) FILTER (WHERE status = 'confirmado')::int                                AS qtd_confirmados,
        COUNT(*) FILTER (WHERE status = 'falhou')::int                                    AS qtd_falhos,
        COALESCE(SUM(valor_total::numeric) FILTER (WHERE status = 'pendente'), 0)         AS valor_pendente
      FROM pagamentos_split
    `)
  ).rows as {
    total_confirmado: string;
    total_repassado: string;
    total_comissao: string;
    qtd_pendentes: number;
    qtd_confirmados: number;
    qtd_falhos: number;
    valor_pendente: string;
  }[];

  const [saque] = (
    await db.execute<{ total_sacado: string; qtd_saques_pendentes: number }>(sql`
      SELECT
        COALESCE(SUM(valor::numeric) FILTER (WHERE status = 'concluido'), 0) AS total_sacado,
        COUNT(*) FILTER (WHERE status = 'pendente')::int                     AS qtd_saques_pendentes
      FROM saques
    `)
  ).rows as { total_sacado: string; qtd_saques_pendentes: number }[];

  return {
    totalConfirmado: Number(split?.total_confirmado ?? 0),
    totalRepassado: Number(split?.total_repassado ?? 0),
    totalComissao: Number(split?.total_comissao ?? 0),
    qtdPendentes: Number(split?.qtd_pendentes ?? 0),
    qtdConfirmados: Number(split?.qtd_confirmados ?? 0),
    qtdFalhos: Number(split?.qtd_falhos ?? 0),
    valorPendente: Number(split?.valor_pendente ?? 0),
    totalSacado: Number(saque?.total_sacado ?? 0),
    qtdSaquesPendentes: Number(saque?.qtd_saques_pendentes ?? 0),
  };
}
