import { sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { criarNotificacao } from "./service";

const MOTIVO_TRECHO_MAX = 120;

/** Trunca por code point (preserva emoji/surrogate pairs) ao invés de code unit UTF-16. */
function truncarTexto(texto: string, max: number): string {
  const cps = Array.from(texto);
  if (cps.length <= max) return texto;
  return `${cps.slice(0, max).join("").trimEnd()}…`;
}

type MedicaoContextoRow = {
  medicao_id: string;
  obra_id: string;
  obra_nome: string;
  numero: number;
  etapa: string;
  empreiteiro_user_id: string;
  contratante_user_id: string | null;
} & Record<string, unknown>;

interface MedicaoContexto {
  medicaoId: string;
  obraId: string;
  obraNome: string;
  numero: number;
  etapa: string;
  empreiteiroUserId: string;
  contratanteUserId: string | null;
}

async function buscarContextoMedicao(medicaoId: string): Promise<MedicaoContexto | null> {
  const result = await db.execute<MedicaoContextoRow>(sql`
    SELECT
      m.id AS medicao_id,
      m.obra_id,
      o.nome AS obra_nome,
      m.numero,
      m.etapa,
      m.empreiteiro_id AS empreiteiro_user_id,
      c.user_id AS contratante_user_id
    FROM medicoes m
    INNER JOIN obras o ON o.id = m.obra_id
    LEFT JOIN clientes c ON c.id = o.cliente_id
    WHERE m.id = ${medicaoId}
    LIMIT 1
  `);
  const row = result.rows[0];
  if (!row) return null;
  return {
    medicaoId: row.medicao_id,
    obraId: row.obra_id,
    obraNome: row.obra_nome,
    numero: row.numero,
    etapa: row.etapa,
    empreiteiroUserId: row.empreiteiro_user_id,
    contratanteUserId: row.contratante_user_id,
  };
}

/**
 * Dispatchers de notificação para o ciclo de medições (J06 → J13).
 * - Fire-and-forget: erros são logados mas não derrubam o caller.
 * - Sem advisory lock: cada evento dispara de um único POST do usuário.
 * - Tipos reutilizam o enum existente (`info`/`sucesso`/`alerta`).
 */

export async function dispararNotificacaoMedicaoCriada(args: { medicaoId: string }): Promise<void> {
  try {
    const ctx = await buscarContextoMedicao(args.medicaoId);
    if (!ctx) {
      console.warn("[medicao-notif] contexto não encontrado para medicaoId:", args.medicaoId);
      return;
    }
    if (!ctx.contratanteUserId) {
      console.warn("[medicao-notif] obra sem contratante (cliente.user_id) — notif não enviada:", ctx.obraId);
      return;
    }
    await criarNotificacao({
      userId: ctx.contratanteUserId,
      tipo: "info",
      titulo: `Nova medição: ${ctx.etapa}`,
      descricao: `${ctx.obraNome}: medição #${ctx.numero} aguarda sua avaliação.`,
      href: `/contratante/minhas-obras/${ctx.obraId}`,
    });
  } catch (err) {
    console.error("[medicao-notif] falha em dispararNotificacaoMedicaoCriada:", err);
  }
}

export async function dispararNotificacaoMedicaoAprovada(args: { medicaoId: string }): Promise<void> {
  try {
    const ctx = await buscarContextoMedicao(args.medicaoId);
    if (!ctx) {
      console.warn("[medicao-notif] contexto não encontrado para medicaoId:", args.medicaoId);
      return;
    }
    await criarNotificacao({
      userId: ctx.empreiteiroUserId,
      tipo: "sucesso",
      titulo: `Medição aprovada: ${ctx.etapa}`,
      descricao: `${ctx.obraNome}: medição #${ctx.numero} foi aprovada pelo contratante.`,
      href: `/empreiteiro/minhas-obras/${ctx.obraId}`,
    });
  } catch (err) {
    console.error("[medicao-notif] falha em dispararNotificacaoMedicaoAprovada:", err);
  }
}

export async function dispararNotificacaoMedicaoContestada(args: {
  medicaoId: string;
  motivo?: string | null;
}): Promise<void> {
  try {
    const ctx = await buscarContextoMedicao(args.medicaoId);
    if (!ctx) {
      console.warn("[medicao-notif] contexto não encontrado para medicaoId:", args.medicaoId);
      return;
    }
    const motivoLimpo = (args.motivo ?? "").trim();
    const motivoTrunc = motivoLimpo ? truncarTexto(motivoLimpo, MOTIVO_TRECHO_MAX) : "";
    const descricao = motivoTrunc
      ? `${ctx.obraNome}: medição #${ctx.numero} foi contestada. Motivo: ${motivoTrunc}`
      : `${ctx.obraNome}: medição #${ctx.numero} foi contestada pelo contratante.`;
    await criarNotificacao({
      userId: ctx.empreiteiroUserId,
      tipo: "alerta",
      titulo: `Medição contestada: ${ctx.etapa}`,
      descricao,
      href: `/empreiteiro/minhas-obras/${ctx.obraId}`,
    });
  } catch (err) {
    console.error("[medicao-notif] falha em dispararNotificacaoMedicaoContestada:", err);
  }
}
