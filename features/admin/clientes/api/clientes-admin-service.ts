// Admin Clientes — camada real (substitui o mock). Agrega obras/financeiro e
// deriva historicoBloqueios de audit_logs. Mapeia o schema DB → contrato de UI.
import { and, asc, desc, eq, inArray, isNull, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  atividades,
  auditLogs,
  clienteDocumentos,
  clientes,
  empreiteiras,
  financeiro,
  obras,
  userFiles,
  users,
} from "@shared/db/schema";
import { createSignedReadUrl } from "@shared/lib/storage";
import type {
  AdminCliente,
  AdminClienteObra,
  ClienteAtividade,
  ClienteDocumento,
  ClienteFinanceiro,
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
function tipoUi(tipoDb: string): AdminCliente["tipo"] {
  return /f[ií]sica/i.test(tipoDb) ? "pessoa_fisica" : "pessoa_juridica";
}

// ─── Lista (com agregados de obras) ──────────────────────────────────────────
export async function listarClientesAdmin(): Promise<AdminCliente[]> {
  const rows = await db
    .select({
      id: clientes.id,
      userId: clientes.userId,
      nome: clientes.nome,
      tipo: clientes.tipo,
      email: clientes.email,
      telefone: clientes.telefone,
      cnpjCpf: clientes.cnpjCpf,
      endereco: clientes.endereco,
      cidade: clientes.cidade,
      estado: clientes.estado,
      avatarUrl: clientes.avatarUrl,
      status: clientes.status,
      dataCadastro: users.createdAt,
      totalObras: sql<number>`COUNT(DISTINCT ${obras.id})::int`,
      valorContratado: sql<number>`COALESCE(SUM(${obras.valorTotal}), 0)`,
      valorPago: sql<number>`COALESCE(SUM(${obras.valorPago}), 0)`,
    })
    .from(clientes)
    .leftJoin(users, eq(users.id, clientes.userId))
    .leftJoin(obras, eq(obras.clienteId, clientes.id))
    .groupBy(clientes.id, users.createdAt)
    .orderBy(asc(clientes.nome));

  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    email: r.email,
    telefone: r.telefone ?? "",
    cpfCnpj: r.cnpjCpf ?? "",
    tipo: tipoUi(r.tipo),
    status: r.status,
    avatarUrl: r.avatarUrl ?? undefined,
    dataCadastro: ymd(r.dataCadastro),
    endereco: r.endereco ?? "",
    cidade: r.cidade ?? "",
    estado: r.estado ?? "",
    totalObras: num(r.totalObras),
    valorTotalContratado: num(r.valorContratado),
    valorTotalPago: num(r.valorPago),
  }));
}

// ─── Detalhe (inclui historicoBloqueios derivado de audit) ───────────────────
export async function obterClienteAdmin(id: string): Promise<AdminCliente | null> {
  const [r] = await db
    .select({
      id: clientes.id,
      userId: clientes.userId,
      nome: clientes.nome,
      tipo: clientes.tipo,
      email: clientes.email,
      telefone: clientes.telefone,
      cnpjCpf: clientes.cnpjCpf,
      endereco: clientes.endereco,
      cidade: clientes.cidade,
      estado: clientes.estado,
      avatarUrl: clientes.avatarUrl,
      status: clientes.status,
      observacoes: clientes.observacoes,
      dataCadastro: users.createdAt,
      totalObras: sql<number>`COUNT(DISTINCT ${obras.id})::int`,
      valorContratado: sql<number>`COALESCE(SUM(${obras.valorTotal}), 0)`,
      valorPago: sql<number>`COALESCE(SUM(${obras.valorPago}), 0)`,
    })
    .from(clientes)
    .leftJoin(users, eq(users.id, clientes.userId))
    .leftJoin(obras, eq(obras.clienteId, clientes.id))
    .where(eq(clientes.id, id))
    .groupBy(clientes.id, users.createdAt)
    .limit(1);

  if (!r) return null;

  const historicoBloqueios = r.userId ? await obterHistoricoBloqueios(r.userId) : [];

  return {
    id: r.id,
    nome: r.nome,
    email: r.email,
    telefone: r.telefone ?? "",
    cpfCnpj: r.cnpjCpf ?? "",
    tipo: tipoUi(r.tipo),
    status: r.status,
    avatarUrl: r.avatarUrl ?? undefined,
    dataCadastro: ymd(r.dataCadastro),
    endereco: r.endereco ?? "",
    cidade: r.cidade ?? "",
    estado: r.estado ?? "",
    totalObras: num(r.totalObras),
    valorTotalContratado: num(r.valorContratado),
    valorTotalPago: num(r.valorPago),
    observacoes: r.observacoes ?? undefined,
    historicoBloqueios,
  };
}

// historicoBloqueios: lê de audit_logs (gravado pelo PATCH status). Sem tabela nova.
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
        inArray(auditLogs.action, ["admin.cliente.bloqueado", "admin.cliente.desbloqueado"]),
      ),
    )
    .orderBy(desc(auditLogs.createdAt));

  return rows.map((r) => {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    return {
      id: r.id,
      tipo: r.action === "admin.cliente.bloqueado" ? "bloqueio" : "desbloqueio",
      data: ymd(r.criadoEm),
      motivo: typeof p.motivo === "string" ? p.motivo : undefined,
      observacoes: typeof p.observacoes === "string" ? p.observacoes : undefined,
      responsavel: r.responsavel?.trim() || r.responsavelEmail || "Administrador",
    };
  });
}

// ─── Obras do cliente ────────────────────────────────────────────────────────
export async function listarObrasDoCliente(id: string): Promise<AdminClienteObra[]> {
  const rows = await db
    .select({
      id: obras.id,
      nome: obras.nome,
      status: obras.status,
      valorTotal: obras.valorTotal,
      progresso: obras.progresso,
      dataInicio: obras.dataInicio,
      dataPrevisao: obras.dataPrevisao,
      cidade: obras.cidade,
      uf: obras.uf,
      empreiteira: empreiteiras.nome,
    })
    .from(obras)
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(obras.clienteId, id))
    .orderBy(desc(obras.createdAt));

  return rows.map((r) => ({
    id: r.id,
    nome: r.nome,
    codigo: r.id.slice(0, 8).toUpperCase(),
    status: mapObraStatusCliente(r.status),
    valorContratado: num(r.valorTotal),
    percentConcluido: num(r.progresso),
    dataInicio: r.dataInicio ?? "",
    previsaoFim: r.dataPrevisao ?? "",
    empreiteira: r.empreiteira?.trim() || "—",
    localizacao: [r.cidade, r.uf].filter(Boolean).join(" - ") || undefined,
  }));
}

function mapObraStatusCliente(status: string): AdminClienteObra["status"] {
  switch (status) {
    case "em_andamento":
      return "em_andamento";
    case "concluida":
      return "concluida";
    case "pausada":
      return "pausada";
    case "planejamento":
      return "planejamento";
    default:
      return "em_andamento";
  }
}

// ─── Financeiro do cliente (agrega financeiro das obras dele) ─────────────────
export async function obterFinanceiroDoCliente(id: string): Promise<ClienteFinanceiro> {
  const obraIds = (
    await db.select({ id: obras.id }).from(obras).where(eq(obras.clienteId, id))
  ).map((o) => o.id);

  if (obraIds.length === 0) {
    return { totalPago: 0, saldoPendente: 0, proximoVencimento: null, valorProximoVencimento: null, pagamentos: [] };
  }

  const [tot] = await db
    .select({
      totalPago: sql<number>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.status} = 'pago'), 0)`,
      saldoPendente: sql<number>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.status} IN ('pendente','atrasado')), 0)`,
    })
    .from(financeiro)
    .where(inArray(financeiro.obraId, obraIds));

  const [proximo] = await db
    .select({ data: financeiro.dataVencimento, valor: financeiro.valor })
    .from(financeiro)
    .where(
      and(
        inArray(financeiro.obraId, obraIds),
        inArray(financeiro.status, ["pendente", "atrasado"]),
        sql`${financeiro.dataVencimento} IS NOT NULL`,
      ),
    )
    .orderBy(asc(financeiro.dataVencimento))
    .limit(1);

  const pagamentos = await db
    .select({
      id: financeiro.id,
      data: financeiro.data,
      descricao: financeiro.descricao,
      valor: financeiro.valor,
      status: financeiro.status,
    })
    .from(financeiro)
    .where(inArray(financeiro.obraId, obraIds))
    .orderBy(desc(financeiro.data))
    .limit(50);

  return {
    totalPago: num(tot?.totalPago),
    saldoPendente: num(tot?.saldoPendente),
    proximoVencimento: proximo?.data ?? null,
    valorProximoVencimento: proximo ? num(proximo.valor) : null,
    pagamentos: pagamentos.map((p) => ({
      id: p.id,
      data: p.data,
      descricao: p.descricao,
      valor: num(p.valor),
      status: p.status === "pago" ? "pago" : p.status === "atrasado" ? "atrasado" : "pendente",
    })),
  };
}

// ─── Documentos do dossiê (tabela `cliente_documentos`) ─────────────────────
/** Deriva o `tipo` de UI a partir do MIME do arquivo. */
function tipoDocumentoUi(mime: string | null | undefined): ClienteDocumento["tipo"] {
  if (!mime) return "outro";
  if (mime.startsWith("image/")) return "imagem";
  if (mime === "application/pdf") return "pdf";
  return "outro";
}

export async function listarDocumentosDoCliente(id: string): Promise<ClienteDocumento[]> {
  const rows = await db
    .select({
      id: clienteDocumentos.id,
      nome: clienteDocumentos.nome,
      createdAt: clienteDocumentos.createdAt,
      bucketKey: userFiles.bucketKey,
      originalName: userFiles.originalName,
      mime: userFiles.mime,
    })
    .from(clienteDocumentos)
    .innerJoin(userFiles, eq(userFiles.id, clienteDocumentos.fileId))
    .where(
      and(
        eq(clienteDocumentos.clienteId, id),
        isNull(clienteDocumentos.deletedAt),
        isNull(userFiles.deletedAt),
      ),
    )
    .orderBy(desc(clienteDocumentos.createdAt));

  // `cliente_documento` é sempre privado → URL assinada por item.
  return Promise.all(
    rows.map(async (r) => ({
      id: r.id,
      nome: r.nome,
      tipo: tipoDocumentoUi(r.mime),
      dataEnvio: ymd(r.createdAt),
      url:
        (await createSignedReadUrl({ key: r.bucketKey, filename: r.originalName }).catch(
          () => null,
        )) ?? undefined,
    })),
  );
}

/** Vincula um arquivo já commitado (`userFiles.id`) ao dossiê do cliente. */
export async function criarDocumentoDoCliente(args: {
  clienteId: string;
  fileId: string;
  nome: string;
  uploadedBy: string;
}): Promise<{ ok: boolean; reason?: string }> {
  const [cli] = await db
    .select({ id: clientes.id })
    .from(clientes)
    .where(eq(clientes.id, args.clienteId))
    .limit(1);
  if (!cli) return { ok: false, reason: "CLIENTE_NAO_ENCONTRADO" };

  // Anti-IDOR: o arquivo precisa existir, estar vivo e ser do kind esperado.
  const [file] = await db
    .select({ id: userFiles.id, kind: userFiles.kind })
    .from(userFiles)
    .where(and(eq(userFiles.id, args.fileId), isNull(userFiles.deletedAt)))
    .limit(1);
  if (!file) return { ok: false, reason: "ARQUIVO_NAO_ENCONTRADO" };
  if (file.kind !== "cliente_documento") return { ok: false, reason: "KIND_INVALIDO" };

  await db.insert(clienteDocumentos).values({
    clienteId: args.clienteId,
    fileId: args.fileId,
    nome: args.nome,
    tipo: "outro",
    uploadedBy: args.uploadedBy,
  });
  return { ok: true };
}

/** Soft-delete do vínculo (o arquivo em `userFiles` é preservado). */
export async function removerDocumentoDoCliente(args: {
  clienteId: string;
  documentoId: string;
}): Promise<{ ok: boolean }> {
  const result = await db
    .update(clienteDocumentos)
    .set({ deletedAt: new Date() })
    .where(
      and(
        eq(clienteDocumentos.id, args.documentoId),
        eq(clienteDocumentos.clienteId, args.clienteId),
        isNull(clienteDocumentos.deletedAt),
      ),
    )
    .returning({ id: clienteDocumentos.id });
  return { ok: result.length > 0 };
}

/**
 * Edição pontual de uma obra do cliente pelo admin.
 * Só campos que pertencem à própria obra — `empreiteira` é derivada de JOIN
 * (FK `obras.empreiteiraId`, atribuída pelo aceite de candidatura em J05) e
 * por isso não é editável como texto livre aqui.
 */
export async function editarObraDoCliente(args: {
  clienteId: string;
  obraId: string;
  status: "em_andamento" | "concluida" | "pausada" | "planejamento";
  previsaoFim: string | null;
}): Promise<boolean> {
  const result = await db
    .update(obras)
    .set({ status: args.status, dataPrevisao: args.previsaoFim })
    // Escopo duplo: a obra tem de ser deste cliente (anti-IDOR entre dossiês).
    .where(and(eq(obras.id, args.obraId), eq(obras.clienteId, args.clienteId)))
    .returning({ id: obras.id });
  return result.length > 0;
}

/** Nota interna do admin. Devolve false se o cliente não existe. */
export async function atualizarObservacoesDoCliente(
  id: string,
  observacoes: string | null,
): Promise<boolean> {
  const result = await db
    .update(clientes)
    .set({ observacoes })
    .where(eq(clientes.id, id))
    .returning({ id: clientes.id });
  return result.length > 0;
}

// ─── Atividades (feed J07 do cliente) ────────────────────────────────────────
const ATIVIDADE_MAP: Record<string, ClienteAtividade["tipo"]> = {
  obra_publicada: "obra_atualizada",
  candidatura_criada: "nota",
  candidatura_aceita: "obra_atualizada",
  candidatura_rejeitada: "nota",
  candidatura_cancelada: "nota",
  medicao_criada: "obra_atualizada",
  medicao_aprovada: "obra_atualizada",
  medicao_contestada: "nota",
  diario_postado: "nota",
  ocorrencia_aberta: "nota",
  ocorrencia_resolvida: "nota",
  lancamento_criado: "pagamento",
  lancamento_quitado: "pagamento",
  disputa_aberta: "nota",
  disputa_resolvida: "nota",
};

export async function listarAtividadesDoCliente(id: string): Promise<ClienteAtividade[]> {
  const [cli] = await db.select({ userId: clientes.userId }).from(clientes).where(eq(clientes.id, id)).limit(1);
  const obraIds = (await db.select({ id: obras.id }).from(obras).where(eq(obras.clienteId, id))).map((o) => o.id);

  if (!cli?.userId && obraIds.length === 0) return [];

  const conds = [];
  if (cli?.userId) conds.push(eq(atividades.actorUserId, cli.userId));
  if (obraIds.length) conds.push(inArray(atividades.obraId, obraIds));
  const where = conds.length === 1 ? conds[0] : sql`(${conds[0]} OR ${conds[1]})`;

  const rows = await db
    .select({
      id: atividades.id,
      tipo: atividades.tipo,
      payload: atividades.payload,
      criadoEm: atividades.createdAt,
    })
    .from(atividades)
    .where(where)
    .orderBy(desc(atividades.createdAt))
    .limit(50);

  return rows.map((r) => {
    const p = (r.payload ?? {}) as Record<string, unknown>;
    const titulo = typeof p.titulo === "string" ? p.titulo : descricaoTipo(r.tipo);
    const descricao = typeof p.descricao === "string" ? p.descricao : "";
    return {
      id: r.id,
      tipo: ATIVIDADE_MAP[r.tipo] ?? "nota",
      titulo,
      descricao,
      dataHora: r.criadoEm instanceof Date ? r.criadoEm.toISOString() : new Date(r.criadoEm).toISOString(),
    };
  });
}

function descricaoTipo(tipo: string): string {
  return tipo.replace(/_/g, " ").replace(/^\w/, (c) => c.toUpperCase());
}

// ─── Mutações ────────────────────────────────────────────────────────────────
export interface NovoClienteInput {
  tipo: "pessoa_fisica" | "pessoa_juridica";
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  cep?: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

export async function criarClienteAdmin(input: NovoClienteInput): Promise<{ id: string }> {
  const [row] = await db
    .insert(clientes)
    .values({
      nome: input.nome,
      tipo: input.tipo === "pessoa_fisica" ? "Pessoa Física" : "Pessoa Jurídica",
      email: input.email,
      telefone: input.telefone,
      cnpjCpf: input.cpfCnpj,
      cep: input.cep,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
      status: "aprovacao",
    })
    .returning({ id: clientes.id });
  return { id: row.id };
}

export interface EditarClienteInput {
  tipo: "pessoa_fisica" | "pessoa_juridica";
  nome: string;
  cpfCnpj: string;
  email: string;
  telefone: string;
  endereco?: string;
  cidade?: string;
  estado?: string;
}

export async function editarClienteAdmin(id: string, input: EditarClienteInput): Promise<boolean> {
  const res = await db
    .update(clientes)
    .set({
      nome: input.nome,
      tipo: input.tipo === "pessoa_fisica" ? "Pessoa Física" : "Pessoa Jurídica",
      email: input.email,
      telefone: input.telefone,
      cnpjCpf: input.cpfCnpj,
      endereco: input.endereco,
      cidade: input.cidade,
      estado: input.estado,
    })
    .where(eq(clientes.id, id))
    .returning({ id: clientes.id });
  return res.length > 0;
}

/** Atualiza status. Retorna o userId (p/ audit de bloqueio) ou undefined se inexistente. */
export async function definirStatusCliente(
  id: string,
  status: "ativo" | "inativo" | "aprovacao",
): Promise<{ userId: string | null } | null> {
  const res = await db
    .update(clientes)
    .set({ status })
    .where(eq(clientes.id, id))
    .returning({ userId: clientes.userId });
  if (res.length === 0) return null;
  return { userId: res[0].userId };
}

export async function obterUserIdDoCliente(id: string): Promise<string | null | undefined> {
  const [row] = await db.select({ userId: clientes.userId }).from(clientes).where(eq(clientes.id, id)).limit(1);
  return row ? row.userId : undefined; // undefined = cliente inexistente; null = sem login
}
