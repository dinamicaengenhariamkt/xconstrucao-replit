// Admin Empreiteiras — camada real (substitui o mock). Espelha o serviço de
// clientes: agrega obras, deriva historicoBloqueios de audit_logs.
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { auditLogs, clientes, empreiteiras, obras, users } from "@shared/db/schema";
import type {
  AdminEmpreiteira,
  AdminEmpreiteiraObra,
  HistoricoBloqueio,
} from "../types";

function ymd(value: Date | string | null | undefined): string {
  if (value == null) return "";
  const d = value instanceof Date ? value : new Date(value);
  return Number.isNaN(d.getTime()) ? "" : d.toISOString().slice(0, 10);
}
function num(value: string | number | null | undefined): number {
  if (value == null) return 0;
  const n = typeof value === "number" ? value : Number(value);
  return Number.isFinite(n) ? n : 0;
}

// ─── Lista (com agregados de obras) ──────────────────────────────────────────
export async function listarEmpreiteirasAdmin(): Promise<AdminEmpreiteira[]> {
  const rows = await db
    .select({
      id: empreiteiras.id,
      userId: empreiteiras.userId,
      nome: empreiteiras.nome,
      responsavel: empreiteiras.responsavel,
      email: empreiteiras.email,
      telefone: empreiteiras.telefone,
      cnpj: empreiteiras.cnpj,
      especialidades: empreiteiras.especialidades,
      cep: empreiteiras.cep,
      endereco: empreiteiras.endereco,
      cidade: empreiteiras.cidade,
      estado: empreiteiras.estado,
      avatarUrl: empreiteiras.avatarUrl,
      siteUrl: empreiteiras.siteUrl,
      descricao: empreiteiras.descricao,
      registroProfissional: empreiteiras.registroProfissional,
      avaliacao: empreiteiras.avaliacao,
      status: empreiteiras.status,
      dataCadastro: users.createdAt,
      totalObras: sql<number>`COUNT(DISTINCT ${obras.id})::int`,
      emAndamento: sql<number>`COUNT(DISTINCT ${obras.id}) FILTER (WHERE ${obras.status} = 'em_andamento')::int`,
      concluidas: sql<number>`COUNT(DISTINCT ${obras.id}) FILTER (WHERE ${obras.status} = 'concluida')::int`,
      valorContratado: sql<number>`COALESCE(SUM(${obras.valorTotal}), 0)`,
      valorRecebido: sql<number>`COALESCE(SUM(${obras.valorPago}), 0)`,
    })
    .from(empreiteiras)
    .leftJoin(users, eq(users.id, empreiteiras.userId))
    .leftJoin(obras, eq(obras.empreiteiraId, empreiteiras.id))
    .groupBy(empreiteiras.id, users.createdAt)
    .orderBy(asc(empreiteiras.nome));

  return rows.map(mapEmpreiteira);
}

function mapEmpreiteira(r: {
  id: string;
  nome: string;
  responsavel: string;
  email: string;
  telefone: string | null;
  cnpj: string | null;
  especialidades: string[];
  cep: string | null;
  endereco: string | null;
  cidade: string | null;
  estado: string | null;
  avatarUrl: string | null;
  siteUrl: string | null;
  descricao: string | null;
  registroProfissional: string | null;
  avaliacao: string | null;
  status: "ativo" | "inativo" | "aprovacao";
  dataCadastro: Date | null;
  totalObras: number;
  emAndamento: number;
  concluidas: number;
  valorContratado: number | string;
  valorRecebido: number | string;
  historicoBloqueios?: HistoricoBloqueio[];
}): AdminEmpreiteira {
  return {
    id: r.id,
    razaoSocial: r.nome,
    nomeFantasia: "",
    cnpj: r.cnpj ?? "",
    email: r.email,
    telefone: r.telefone ?? "",
    responsavel: r.responsavel,
    status: r.status,
    avatarUrl: r.avatarUrl ?? undefined,
    dataCadastro: ymd(r.dataCadastro),
    endereco: r.endereco ?? "",
    cidade: r.cidade ?? "",
    estado: r.estado ?? "",
    especialidades: r.especialidades ?? [],
    nota: num(r.avaliacao),
    totalObras: num(r.totalObras),
    obrasEmAndamento: num(r.emAndamento),
    obrasConcluidas: num(r.concluidas),
    valorTotalContratado: num(r.valorContratado),
    valorTotalRecebido: num(r.valorRecebido),
    cep: r.cep ?? undefined,
    site: r.siteUrl ?? undefined,
    observacoes: r.descricao ?? undefined,
    responsavelRegistro: r.registroProfissional ?? undefined,
    historicoBloqueios: r.historicoBloqueios,
  };
}

// ─── Detalhe ─────────────────────────────────────────────────────────────────
export async function obterEmpreiteiraAdmin(id: string): Promise<AdminEmpreiteira | null> {
  const [r] = await db
    .select({
      id: empreiteiras.id,
      userId: empreiteiras.userId,
      nome: empreiteiras.nome,
      responsavel: empreiteiras.responsavel,
      email: empreiteiras.email,
      telefone: empreiteiras.telefone,
      cnpj: empreiteiras.cnpj,
      especialidades: empreiteiras.especialidades,
      cep: empreiteiras.cep,
      endereco: empreiteiras.endereco,
      cidade: empreiteiras.cidade,
      estado: empreiteiras.estado,
      avatarUrl: empreiteiras.avatarUrl,
      siteUrl: empreiteiras.siteUrl,
      descricao: empreiteiras.descricao,
      registroProfissional: empreiteiras.registroProfissional,
      avaliacao: empreiteiras.avaliacao,
      status: empreiteiras.status,
      dataCadastro: users.createdAt,
      totalObras: sql<number>`COUNT(DISTINCT ${obras.id})::int`,
      emAndamento: sql<number>`COUNT(DISTINCT ${obras.id}) FILTER (WHERE ${obras.status} = 'em_andamento')::int`,
      concluidas: sql<number>`COUNT(DISTINCT ${obras.id}) FILTER (WHERE ${obras.status} = 'concluida')::int`,
      valorContratado: sql<number>`COALESCE(SUM(${obras.valorTotal}), 0)`,
      valorRecebido: sql<number>`COALESCE(SUM(${obras.valorPago}), 0)`,
    })
    .from(empreiteiras)
    .leftJoin(users, eq(users.id, empreiteiras.userId))
    .leftJoin(obras, eq(obras.empreiteiraId, empreiteiras.id))
    .where(eq(empreiteiras.id, id))
    .groupBy(empreiteiras.id, users.createdAt)
    .limit(1);

  if (!r) return null;
  const historicoBloqueios = r.userId ? await obterHistoricoBloqueios(r.userId) : [];
  return mapEmpreiteira({ ...r, historicoBloqueios });
}

async function obterHistoricoBloqueios(userId: string): Promise<HistoricoBloqueio[]> {
  const actor = users;
  const rows = await db
    .select({
      id: auditLogs.id,
      action: auditLogs.action,
      payload: auditLogs.payload,
      criadoEm: auditLogs.createdAt,
      responsavel: actor.name,
      responsavelEmail: actor.email,
    })
    .from(auditLogs)
    .leftJoin(actor, eq(actor.id, auditLogs.actorId))
    .where(
      and(
        eq(auditLogs.targetUserId, userId),
        inArray(auditLogs.action, ["admin.empreiteira.bloqueada", "admin.empreiteira.desbloqueada"]),
      ),
    )
    .orderBy(desc(auditLogs.createdAt));

  return rows.map((r) => {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      tipo: r.action === "admin.empreiteira.bloqueada" ? "bloqueio" : "desbloqueio",
      data: ymd(r.criadoEm),
      motivo: typeof p.motivo === "string" ? p.motivo : undefined,
      observacoes: typeof p.observacoes === "string" ? p.observacoes : undefined,
      responsavel: r.responsavel?.trim() || r.responsavelEmail || "Administrador",
    };
  });
}

// ─── Obras da empreiteira ────────────────────────────────────────────────────
export async function listarObrasDaEmpreiteira(id: string): Promise<AdminEmpreiteiraObra[]> {
  const rows = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      status: obras.status,
      valorTotal: obras.valorTotal,
      progresso: obras.progresso,
      dataInicio: obras.dataInicio,
      dataPrevisao: obras.dataPrevisao,
      cliente: clientes.nome,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .where(eq(obras.empreiteiraId, id))
    .orderBy(desc(obras.createdAt));

  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    codigo: r.id.slice(0, 8).toUpperCase(),
    cliente: r.cliente?.trim() || "—",
    status: mapObraStatusEmpreiteira(r.status),
    valorContratado: num(r.valorTotal),
    percentConcluido: num(r.progresso),
    dataInicio: r.dataInicio ?? "",
    previsaoFim: r.dataPrevisao ?? "",
  }));
}

function mapObraStatusEmpreiteira(status: string): AdminEmpreiteiraObra["status"] {
  switch (status) {
    case "em_andamento":
      return "em_andamento";
    case "concluida":
      return "concluida";
    case "pausada":
      return "pausada";
    case "planejamento":
      return "em_proposta";
    default:
      return "em_andamento";
  }
}

// ─── Mutações ────────────────────────────────────────────────────────────────
export interface NovaEmpreiteiraInput {
  razaoSocial: string;
  cnpj: string;
  responsavel: string;
  responsavelRegistro: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
  site?: string;
  especialidades: string[];
}

export async function criarEmpreiteiraAdmin(input: NovaEmpreiteiraInput): Promise<{ id: string }> {
  const [row] = await db
    .insert(empreiteiras)
    .values({
      nome: input.razaoSocial,
      responsavel: input.responsavel,
      email: input.email,
      telefone: input.telefone,
      cnpj: input.cnpj,
      especialidades: input.especialidades,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
      siteUrl: input.site,
      registroProfissional: input.responsavelRegistro,
      status: "aprovacao",
    })
    .returning({ id: empreiteiras.id });
  return { id: row.id };
}

export interface EditarEmpreiteiraInput extends NovaEmpreiteiraInput {
  cep?: string;
}

export async function editarEmpreiteiraAdmin(id: string, input: EditarEmpreiteiraInput): Promise<boolean> {
  const res = await db
    .update(empreiteiras)
    .set({
      nome: input.razaoSocial,
      responsavel: input.responsavel,
      email: input.email,
      telefone: input.telefone,
      cnpj: input.cnpj,
      especialidades: input.especialidades,
      cep: input.cep,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
      siteUrl: input.site,
      registroProfissional: input.responsavelRegistro,
    })
    .where(eq(empreiteiras.id, id))
    .returning({ id: empreiteiras.id });
  return res.length > 0;
}

export async function definirStatusEmpreiteira(
  id: string,
  status: "ativo" | "inativo" | "aprovacao",
): Promise<{ userId: string | null } | null> {
  const res = await db
    .update(empreiteiras)
    .set({ status })
    .where(eq(empreiteiras.id, id))
    .returning({ userId: empreiteiras.userId });
  if (res.length === 0) return null;
  return { userId: res[0].userId };
}

export async function obterUserIdDaEmpreiteira(id: string): Promise<string | null | undefined> {
  const [row] = await db
    .select({ userId: empreiteiras.userId })
    .from(empreiteiras)
    .where(eq(empreiteiras.id, id))
    .limit(1);
  return row ? row.userId : undefined;
}
