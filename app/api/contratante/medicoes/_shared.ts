import { and, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, medicoes, obras, users } from "@shared/db/schema";
import { isAdminLike } from "@features/auth/api/auth-utils";

/**
 * Mapeia o enum interno (medicao_status) para o vocabulário usado pela UI
 * do contratante. A UI já existia antes de Task #47 com 4 valores; o backend
 * vive com 3 (status='paga' fica para a J08).
 */
export type ContratanteStatus = "aguardando_aprovacao" | "aprovada" | "rejeitada" | "paga";

export function dbStatusToContratante(s: "pendente" | "aprovada" | "contestada"): ContratanteStatus {
  if (s === "pendente") return "aguardando_aprovacao";
  if (s === "contestada") return "rejeitada";
  return "aprovada";
}

export function isoDate(d: Date | string | null | undefined): string | undefined {
  if (!d) return undefined;
  const date = typeof d === "string" ? new Date(d) : d;
  if (Number.isNaN(date.getTime())) return undefined;
  return date.toISOString().slice(0, 10);
}

/**
 * Resolve o contratante (clientes row) associado ao usuário.
 * Retorna null para roles não-contratante (incluindo admin).
 */
export async function getClienteIdForUser(userId: string): Promise<string | null> {
  const [c] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, userId));
  return c?.id ?? null;
}

export type MedicaoApiShape = {
  id: string;
  obraId: string;
  obraNome: string;
  empreiteiroNome: string;
  numero: number;
  periodo: string;
  valor: number;
  status: ContratanteStatus;
  dataEnvio: string;
  dataAvaliacao?: string;
  descricao: string;
  motivoRejeicao?: string;
  etapa: string;
  percentual: number;
  fotos: string[];
};

export async function listMedicoesForContratante(clienteId: string): Promise<MedicaoApiShape[]> {
  const rows = await db
    .select({
      id: medicoes.id,
      obraId: medicoes.obraId,
      obraNome: obras.nome,
      numero: medicoes.numero,
      etapa: medicoes.etapa,
      descricao: medicoes.descricao,
      percentual: medicoes.percentual,
      valor: medicoes.valor,
      fotos: medicoes.fotos,
      status: medicoes.status,
      motivoContestacao: medicoes.motivoContestacao,
      createdAt: medicoes.createdAt,
      decidedAt: medicoes.decidedAt,
      empreiteiroNome: users.name,
      empreiteiraNome: empreiteiras.nome,
    })
    .from(medicoes)
    .innerJoin(obras, eq(obras.id, medicoes.obraId))
    .leftJoin(users, eq(users.id, medicoes.empreiteiroId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(obras.clienteId, clienteId));

  return rows.map((r) => mapToApiShape(r));
}

export async function listMedicoesForObra(obraId: string): Promise<MedicaoApiShape[]> {
  const rows = await db
    .select({
      id: medicoes.id,
      obraId: medicoes.obraId,
      obraNome: obras.nome,
      numero: medicoes.numero,
      etapa: medicoes.etapa,
      descricao: medicoes.descricao,
      percentual: medicoes.percentual,
      valor: medicoes.valor,
      fotos: medicoes.fotos,
      status: medicoes.status,
      motivoContestacao: medicoes.motivoContestacao,
      createdAt: medicoes.createdAt,
      decidedAt: medicoes.decidedAt,
      empreiteiroNome: users.name,
      empreiteiraNome: empreiteiras.nome,
    })
    .from(medicoes)
    .innerJoin(obras, eq(obras.id, medicoes.obraId))
    .leftJoin(users, eq(users.id, medicoes.empreiteiroId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(medicoes.obraId, obraId));

  return rows.map((r) => mapToApiShape(r));
}

function mapToApiShape(r: {
  id: string;
  obraId: string;
  obraNome: string;
  numero: number;
  etapa: string;
  descricao: string | null;
  percentual: string;
  valor: string;
  fotos: string[];
  status: "pendente" | "aprovada" | "contestada";
  motivoContestacao: string | null;
  createdAt: Date;
  decidedAt: Date | null;
  empreiteiroNome: string | null;
  empreiteiraNome: string | null;
}): MedicaoApiShape {
  const dataEnvio = isoDate(r.createdAt) ?? "";
  const periodoStr = (() => {
    if (!r.createdAt) return "";
    const date = new Date(r.createdAt);
    return date.toLocaleDateString("pt-BR", { month: "long", year: "numeric" });
  })();
  return {
    id: r.id,
    obraId: r.obraId,
    obraNome: r.obraNome,
    empreiteiroNome: r.empreiteiraNome ?? r.empreiteiroNome ?? "—",
    numero: r.numero,
    periodo: periodoStr,
    valor: Number(r.valor ?? 0),
    status: dbStatusToContratante(r.status),
    dataEnvio,
    dataAvaliacao: isoDate(r.decidedAt),
    descricao: r.descricao ?? "",
    motivoRejeicao: r.motivoContestacao ?? undefined,
    etapa: r.etapa,
    percentual: Number(r.percentual ?? 0),
    fotos: r.fotos ?? [],
  };
}

/**
 * Verifica se o usuário (contratante OU admin) tem permissão para mexer numa medição
 * específica. Retorna a medição+obra carregadas se autorizado.
 */
export async function assertMedicaoEditableByContratante(
  medicaoId: string,
  user: { id: string; role: string },
): Promise<
  | { ok: true; medicao: typeof medicoes.$inferSelect; obra: typeof obras.$inferSelect }
  | { ok: false; status: number; message: string }
> {
  const [row] = await db
    .select({ medicao: medicoes, obra: obras })
    .from(medicoes)
    .innerJoin(obras, eq(obras.id, medicoes.obraId))
    .where(eq(medicoes.id, medicaoId));

  if (!row) return { ok: false, status: 404, message: "Medição não encontrada" };

  if (isAdminLike(user.role)) {
    return { ok: true, medicao: row.medicao, obra: row.obra };
  }

  if (user.role !== "contratante") {
    return { ok: false, status: 403, message: "Sem permissão." };
  }

  const clienteId = await getClienteIdForUser(user.id);
  if (!clienteId || row.obra.clienteId !== clienteId) {
    return { ok: false, status: 404, message: "Medição não encontrada" };
  }

  return { ok: true, medicao: row.medicao, obra: row.obra };
}

/**
 * Recalcula `obras.progresso` como SUM(percentual) das medições aprovadas.
 */
export async function recomputeObraProgresso(
  obraId: string,
  tx?: typeof db,
): Promise<number> {
  const client = (tx ?? db) as typeof db;
  const [agg] = await client
    .select({
      soma: sql<string>`COALESCE(SUM(percentual), 0)`,
    })
    .from(medicoes)
    .where(and(eq(medicoes.obraId, obraId), eq(medicoes.status, "aprovada")));

  const soma = Math.min(100, Math.round(Number(agg?.soma ?? 0)));
  await client.update(obras).set({ progresso: soma, updatedAt: new Date() }).where(eq(obras.id, obraId));
  return soma;
}
