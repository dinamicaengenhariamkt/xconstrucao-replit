import { and, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  clientes,
  disputaMensagens,
  disputas,
  empreiteiras,
  financeiro,
  medicoes,
  obras,
  users,
} from "@shared/db/schema";
import { criarLancamentoPlataforma } from "@features/financeiro/lancamentos-service";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export type DisputaAlvo = "medicao" | "pagamento";
export type DisputaStatusDb = "aberta" | "em_analise" | "aguardando_partes" | "resolvida" | "cancelada";
export type DisputaResolucao = "favor_contratante" | "favor_empreiteiro" | "meio_termo";
export type DisputaCategoria =
  | "pagamento_atrasado"
  | "medicao_rejeitada"
  | "qualidade_obra"
  | "descumprimento_prazo"
  | "escopo_contrato"
  | "outros";

export interface ObraPartes {
  obraId: string;
  obraNome: string;
  contratanteUserId: string | null;
  empreiteiroUserId: string | null;
}

/** Resolve as duas partes (contratante/empreiteiro) de uma obra. */
export async function getPartesObra(obraId: string, tx?: DbOrTx): Promise<ObraPartes | null> {
  const client = (tx ?? db) as typeof db;
  const [row] = await client
    .select({
      obraId: obras.id,
      obraNome: obras.nome,
      contratanteUserId: clientes.userId,
      empreiteiroUserId: empreiteiras.userId,
    })
    .from(obras)
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(eq(obras.id, obraId))
    .limit(1);
  return row ?? null;
}

export interface AbrirDisputaArgs {
  obraId: string;
  abertaPorUserId: string;
  alvoTipo: DisputaAlvo;
  alvoId: string;
  categoria?: DisputaCategoria;
  prioridade?: "alta" | "media" | "baixa";
  titulo: string;
  descricao: string;
  valorEnvolvido?: number | null;
  tx?: DbOrTx;
}

export type AbrirDisputaResult =
  | { ok: true; disputa: typeof disputas.$inferSelect; jaExistia: boolean }
  | { ok: false; code: "ALVO_COM_DISPUTA_ABERTA"; disputaId: string };

/**
 * Abre uma disputa sobre um alvo (medição ou pagamento). A contraparte é
 * derivada da obra e de quem abriu. Idempotente/seguro contra corrida: o índice
 * único parcial `uq_disputas_alvo_aberta` garante no máximo uma disputa ativa
 * por alvo — se já existir, devolve ALVO_COM_DISPUTA_ABERTA.
 */
export async function abrirDisputa(args: AbrirDisputaArgs): Promise<AbrirDisputaResult> {
  const client = (args.tx ?? db) as typeof db;

  const existente = await client
    .select({ id: disputas.id })
    .from(disputas)
    .where(
      and(
        eq(disputas.alvoTipo, args.alvoTipo),
        eq(disputas.alvoId, args.alvoId),
        sql`${disputas.status} NOT IN ('resolvida','cancelada')`,
      ),
    )
    .limit(1);
  if (existente.length > 0) {
    return { ok: false, code: "ALVO_COM_DISPUTA_ABERTA", disputaId: existente[0].id };
  }

  const partes = await getPartesObra(args.obraId, client);
  const contraparteUserId =
    partes && partes.contratanteUserId === args.abertaPorUserId
      ? partes.empreiteiroUserId
      : partes?.contratanteUserId ?? null;

  try {
    const [row] = await client
      .insert(disputas)
      .values({
        obraId: args.obraId,
        abertaPorUserId: args.abertaPorUserId,
        contraparteUserId,
        alvoTipo: args.alvoTipo,
        alvoId: args.alvoId,
        categoria: args.categoria ?? "outros",
        prioridade: args.prioridade ?? "media",
        titulo: args.titulo,
        descricao: args.descricao,
        valorEnvolvido: args.valorEnvolvido != null ? String(args.valorEnvolvido) : null,
        status: "aberta",
      })
      .returning();
    return { ok: true, disputa: row, jaExistia: false };
  } catch (err: any) {
    if (err?.code === "23505") {
      const [row] = await client
        .select({ id: disputas.id })
        .from(disputas)
        .where(
          and(
            eq(disputas.alvoTipo, args.alvoTipo),
            eq(disputas.alvoId, args.alvoId),
            sql`${disputas.status} NOT IN ('resolvida','cancelada')`,
          ),
        )
        .limit(1);
      if (row) return { ok: false, code: "ALVO_COM_DISPUTA_ABERTA", disputaId: row.id };
    }
    throw err;
  }
}

/** Existe disputa ATIVA (não resolvida/cancelada) sobre o alvo? Usado por J08 para congelar pagamento. */
export async function temDisputaAtivaNoAlvo(alvoTipo: DisputaAlvo, alvoId: string, tx?: DbOrTx): Promise<boolean> {
  const client = (tx ?? db) as typeof db;
  const rows = await client
    .select({ id: disputas.id })
    .from(disputas)
    .where(
      and(
        eq(disputas.alvoTipo, alvoTipo),
        eq(disputas.alvoId, alvoId),
        sql`${disputas.status} NOT IN ('resolvida','cancelada')`,
      ),
    )
    .limit(1);
  return rows.length > 0;
}

export async function getDisputa(id: string): Promise<typeof disputas.$inferSelect | null> {
  const [row] = await db.select().from(disputas).where(eq(disputas.id, id)).limit(1);
  return row ?? null;
}

/** Um usuário é parte da disputa se for o contratante ou o empreiteiro da obra. */
export async function isParteDaDisputa(disputaId: string, userId: string): Promise<boolean> {
  const d = await getDisputa(disputaId);
  if (!d) return false;
  const partes = await getPartesObra(d.obraId);
  return partes?.contratanteUserId === userId || partes?.empreiteiroUserId === userId;
}

/** Disputas em que o usuário é parte (contratante ou empreiteiro da obra). */
export async function listarDisputasDoUsuario(userId: string): Promise<typeof disputas.$inferSelect[]> {
  return db
    .select({ d: disputas })
    .from(disputas)
    .innerJoin(obras, eq(obras.id, disputas.obraId))
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(sql`${clientes.userId} = ${userId} OR ${empreiteiras.userId} = ${userId}`)
    .orderBy(desc(disputas.createdAt))
    .then((rows) => rows.map((r) => r.d));
}

export interface DisputaMensagemView {
  id: string;
  autorUserId: string;
  autorNome: string | null;
  texto: string;
  anexoFileId: string | null;
  interna: boolean;
  criadaEm: Date;
}

export async function listarMensagens(disputaId: string, opts?: { incluirInternas?: boolean }): Promise<DisputaMensagemView[]> {
  const conds = [eq(disputaMensagens.disputaId, disputaId)];
  if (!opts?.incluirInternas) conds.push(eq(disputaMensagens.interna, false));
  const rows = await db
    .select({
      id: disputaMensagens.id,
      autorUserId: disputaMensagens.autorUserId,
      autorNome: users.name,
      texto: disputaMensagens.texto,
      anexoFileId: disputaMensagens.anexoFileId,
      interna: disputaMensagens.interna,
      criadaEm: disputaMensagens.criadaEm,
    })
    .from(disputaMensagens)
    .leftJoin(users, eq(users.id, disputaMensagens.autorUserId))
    .where(and(...conds))
    .orderBy(disputaMensagens.criadaEm);
  return rows;
}

export async function adicionarMensagem(args: {
  disputaId: string;
  autorUserId: string;
  texto: string;
  anexoFileId?: string | null;
  interna?: boolean;
  tx?: DbOrTx;
}): Promise<typeof disputaMensagens.$inferSelect> {
  const client = (args.tx ?? db) as typeof db;
  const [row] = await client
    .insert(disputaMensagens)
    .values({
      disputaId: args.disputaId,
      autorUserId: args.autorUserId,
      texto: args.texto,
      anexoFileId: args.anexoFileId ?? null,
      interna: args.interna ?? false,
    })
    .returning();
  return row;
}

/** Admin assume a disputa (aberta → em_analise). */
export async function assumirDisputa(args: { id: string; adminId: string }): Promise<typeof disputas.$inferSelect | null> {
  const [row] = await db
    .update(disputas)
    .set({ status: "em_analise", responsavelAdminId: args.adminId })
    .where(and(eq(disputas.id, args.id), eq(disputas.status, "aberta")))
    .returning();
  return row ?? null;
}

export interface ResolverDisputaArgs {
  id: string;
  adminId: string;
  resolucaoTipo: DisputaResolucao;
  resolucaoTexto: string;
  /** Valor a estornar/ajustar no financeiro (quando aplicável). */
  valorAjustado?: number | null;
}

export type ResolverDisputaResult =
  | { ok: true; disputa: typeof disputas.$inferSelect }
  | { ok: false; code: "NAO_ENCONTRADA" | "JA_RESOLVIDA" };

/**
 * Resolve a disputa (admin) com efeito financeiro atômico.
 *
 * Efeito por tipo de resolução, quando há valor ajustado:
 * - favor_contratante: gera um lançamento de ESTORNO (saída de plataforma →
 *   contratante / cancela cobrança), categoria "disputa_estorno".
 * - favor_empreiteiro: libera o pagamento contestado (se alvo=pagamento, marca
 *   o lançamento da obra para seguir o fluxo normal).
 * - meio_termo: estorno parcial do valor ajustado.
 *
 * Tudo dentro de uma transação: status + efeito financeiro + auditoria do valor.
 * Idempotente: re-resolver uma disputa já resolvida retorna JA_RESOLVIDA, e o
 * lançamento de estorno é idempotente por origem (origemTipo="disputa").
 */
export async function resolverDisputa(args: ResolverDisputaArgs): Promise<ResolverDisputaResult> {
  return db.transaction(async (tx) => {
    const rows = await tx.execute(
      sql`SELECT * FROM disputas WHERE id = ${args.id} FOR UPDATE`,
    );
    const atual = rows.rows[0] as (typeof disputas.$inferSelect & Record<string, unknown>) | undefined;
    if (!atual) return { ok: false, code: "NAO_ENCONTRADA" } as const;
    if (atual.status === "resolvida" || atual.status === "cancelada") {
      return { ok: false, code: "JA_RESOLVIDA" } as const;
    }

    const valorAjustado = args.valorAjustado != null ? args.valorAjustado : null;

    // Efeito financeiro (escopo plataforma; idempotente por origem).
    if (valorAjustado && valorAjustado > 0 && args.resolucaoTipo !== "favor_empreiteiro") {
      await criarLancamentoPlataforma({
        tipo: "saida",
        descricao: `Estorno de disputa #${String(atual.id).slice(0, 8)} — ${args.resolucaoTipo}`,
        valor: valorAjustado,
        categoria: "disputa_estorno",
        status: "pago",
        origemTipo: "disputa",
        origemId: String(atual.id),
        tx,
      });
    }

    // favor_empreiteiro sobre um pagamento contestado: o lançamento da obra
    // volta a "pendente" para seguir o fluxo normal de quitação (J08).
    if (args.resolucaoTipo === "favor_empreiteiro" && atual.alvoTipo === "pagamento") {
      await tx
        .update(financeiro)
        .set({ status: "pendente" })
        .where(and(eq(financeiro.id, String(atual.alvoId)), eq(financeiro.status, "cancelado")));
    }

    // favor_contratante sobre uma medição: mantém a medição contestada
    // (empreiteiro deve refazer); nenhuma mutação extra além do estorno acima.
    void medicoes; // referência usada nos callers de integração J06

    const [updated] = await tx
      .update(disputas)
      .set({
        status: "resolvida",
        resolucaoTipo: args.resolucaoTipo,
        resolucaoTexto: args.resolucaoTexto,
        valorAjustado: valorAjustado != null ? String(valorAjustado) : null,
        resolvedAt: new Date(),
        resolvedByUserId: args.adminId,
        responsavelAdminId: atual.responsavelAdminId ?? args.adminId,
      })
      .where(eq(disputas.id, args.id))
      .returning();

    return { ok: true, disputa: updated } as const;
  });
}

// ---------------------------------------------------------------------------
// Mapeamento DB → contrato de UI existente (features/admin/disputas/types).
// ---------------------------------------------------------------------------
export interface DisputaListItem {
  id: string;
  codigo: string;
  obraId: string;
  obraNome: string;
  cliente: { id: string; nome: string };
  empreiteira: { id: string; nome: string };
  abertaPor: "cliente" | "empreiteira";
  categoria: DisputaCategoria;
  status: "aberta" | "em_analise" | "aguardando_partes" | "resolvida" | "escalada";
  prioridade: "alta" | "media" | "baixa";
  titulo: string;
  descricao: string;
  valorEnvolvido?: number;
  dataAbertura: string;
  dataResolucao?: string;
  resolucao?: string;
  responsavelAdmin?: string;
  diasAberta: number;
}

function codigoDisputa(id: string, createdAt: Date): string {
  const ano = createdAt.getUTCFullYear();
  return `DSP-${ano}-${id.slice(0, 6).toUpperCase()}`;
}

/** Lista para o admin, já mapeada para o shape consumido pela UI. */
export async function listarDisputasAdmin(): Promise<DisputaListItem[]> {
  const rows = await db
    .select({
      d: disputas,
      obraNome: obras.nome,
      clienteId: clientes.id,
      clienteNome: clientes.nome,
      clienteUserId: clientes.userId,
      empreiteiraId: empreiteiras.id,
      empreiteiraNome: empreiteiras.nome,
      adminNome: users.name,
    })
    .from(disputas)
    .leftJoin(obras, eq(obras.id, disputas.obraId))
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .leftJoin(users, eq(users.id, disputas.responsavelAdminId))
    .orderBy(desc(disputas.createdAt));

  const agora = Date.now();
  return rows.map(({ d, obraNome, clienteId, clienteNome, clienteUserId, empreiteiraId, empreiteiraNome, adminNome }) => {
    const fimRef = d.resolvedAt ? d.resolvedAt.getTime() : agora;
    const diasAberta = Math.max(0, Math.floor((fimRef - d.createdAt.getTime()) / 86_400_000));
    const abertaPor: "cliente" | "empreiteira" = d.abertaPorUserId === clienteUserId ? "cliente" : "empreiteira";
    return {
      id: d.id,
      codigo: codigoDisputa(d.id, d.createdAt),
      obraId: d.obraId,
      obraNome: obraNome ?? "—",
      cliente: { id: clienteId ?? "", nome: clienteNome ?? "—" },
      empreiteira: { id: empreiteiraId ?? "", nome: empreiteiraNome ?? "—" },
      abertaPor,
      categoria: d.categoria,
      status: d.status === "cancelada" ? "resolvida" : d.status,
      prioridade: d.prioridade,
      titulo: d.titulo,
      descricao: d.descricao,
      valorEnvolvido: d.valorEnvolvido != null ? Number(d.valorEnvolvido) : undefined,
      dataAbertura: d.createdAt.toISOString().slice(0, 10),
      dataResolucao: d.resolvedAt ? d.resolvedAt.toISOString().slice(0, 10) : undefined,
      resolucao: d.resolucaoTexto ?? undefined,
      responsavelAdmin: adminNome ?? undefined,
      diasAberta,
    };
  });
}

export interface DisputasKPIView {
  totalAbertas: number;
  emAnalise: number;
  resolvidasUltimos30d: number;
  prioridadeAlta: number;
  prazoMedioResolucaoDias: number;
}

export async function getDisputasKPI(): Promise<DisputasKPIView> {
  const [row] = await db
    .select({
      totalAbertas: sql<number>`COUNT(*) FILTER (WHERE ${disputas.status} = 'aberta')::int`,
      emAnalise: sql<number>`COUNT(*) FILTER (WHERE ${disputas.status} IN ('em_analise','aguardando_partes'))::int`,
      resolvidasUltimos30d: sql<number>`COUNT(*) FILTER (WHERE ${disputas.status} = 'resolvida' AND ${disputas.resolvedAt} >= NOW() - INTERVAL '30 days')::int`,
      prioridadeAlta: sql<number>`COUNT(*) FILTER (WHERE ${disputas.prioridade} = 'alta' AND ${disputas.status} NOT IN ('resolvida','cancelada'))::int`,
      prazoMedio: sql<number>`COALESCE(AVG(EXTRACT(EPOCH FROM (${disputas.resolvedAt} - ${disputas.createdAt})) / 86400) FILTER (WHERE ${disputas.resolvedAt} IS NOT NULL), 0)::float`,
    })
    .from(disputas);
  return {
    totalAbertas: row?.totalAbertas ?? 0,
    emAnalise: row?.emAnalise ?? 0,
    resolvidasUltimos30d: row?.resolvidasUltimos30d ?? 0,
    prioridadeAlta: row?.prioridadeAlta ?? 0,
    prazoMedioResolucaoDias: Math.round((row as any)?.prazoMedio ?? 0),
  };
}
