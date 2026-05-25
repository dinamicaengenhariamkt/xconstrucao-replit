import { and, desc, eq, isNull, or, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, financeiro, obras, userFiles } from "@shared/db/schema";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];
import { createSignedReadUrl } from "@shared/lib/storage";

export interface LancamentoRow {
  id: string;
  tipo: string;
  descricao: string;
  valor: number;
  data: string;
  dataVencimento: string | null;
  dataPagamento: string | null;
  obraId: string | null;
  obraNome: string | null;
  categoria: string | null;
  status: "pendente" | "pago" | "atrasado" | "cancelado";
  metodoPagamento: string | null;
  comprovanteUrl: string | null;
  comprovanteFileId: string | null;
  medicaoId: string | null;
  pagadorUserId: string | null;
  recebedorUserId: string | null;
}

function rowFromJoin(r: any): LancamentoRow {
  return {
    id: r.id,
    tipo: r.tipo,
    descricao: r.descricao,
    valor: Number(r.valor),
    data: r.data,
    dataVencimento: r.dataVencimento ?? null,
    dataPagamento: r.dataPagamento ?? null,
    obraId: r.obraId ?? null,
    obraNome: r.obraNome ?? null,
    categoria: r.categoria ?? null,
    status: r.status,
    metodoPagamento: r.metodoPagamento ?? null,
    comprovanteUrl: r.comprovanteUrl ?? null,
    comprovanteFileId: r.comprovanteFileId ?? null,
    medicaoId: r.medicaoId ?? null,
    pagadorUserId: r.pagadorUserId ?? null,
    recebedorUserId: r.recebedorUserId ?? null,
  };
}

/**
 * Lança um pagamento a partir de uma medição aprovada (J06).
 * Hook chamado pelo endpoint de aprovação de medição (quando J06 for
 * implementada). Idempotente por (medicaoId, obraId): se já existe um
 * lançamento com o mesmo medicaoId, devolve-o sem criar duplicata.
 */
export async function criarLancamentoFromMedicao(args: {
  medicaoId: string;
  obraId: string;
  valor: number;
  descricao: string;
  pagadorUserId: string;
  recebedorUserId: string;
  dataVencimento?: string | null;
  categoria?: string | null;
  tx?: DbOrTx;
}): Promise<LancamentoRow> {
  const client = (args.tx ?? db) as typeof db;
  const existing = await client
    .select()
    .from(financeiro)
    .where(eq(financeiro.medicaoId, args.medicaoId))
    .limit(1);
  if (existing.length > 0) {
    return rowFromJoin({ ...existing[0], obraNome: null });
  }
  const today = new Date().toISOString().slice(0, 10);
  try {
    const [row] = await client
      .insert(financeiro)
      .values({
        tipo: "saida",
        descricao: args.descricao,
        valor: String(args.valor),
        data: today,
        obraId: args.obraId,
        categoria: args.categoria ?? "Medição",
        status: "pendente",
        dataVencimento: args.dataVencimento ?? null,
        medicaoId: args.medicaoId,
        pagadorUserId: args.pagadorUserId,
        recebedorUserId: args.recebedorUserId,
      })
      .returning();
    return rowFromJoin({ ...row, obraNome: null });
  } catch (err: any) {
    // 23505 = unique_violation. Race condition: outra request criou o mesmo
    // lançamento entre o SELECT e o INSERT. Devolve o existente.
    if (err?.code === "23505") {
      const [row] = await client
        .select()
        .from(financeiro)
        .where(eq(financeiro.medicaoId, args.medicaoId))
        .limit(1);
      if (row) return rowFromJoin({ ...row, obraNome: null });
    }
    throw err;
  }
}

const baseSelect = {
  id: financeiro.id,
  tipo: financeiro.tipo,
  descricao: financeiro.descricao,
  valor: financeiro.valor,
  data: financeiro.data,
  dataVencimento: financeiro.dataVencimento,
  dataPagamento: financeiro.dataPagamento,
  obraId: financeiro.obraId,
  obraNome: obras.nome,
  categoria: financeiro.categoria,
  status: financeiro.status,
  metodoPagamento: financeiro.metodoPagamento,
  comprovanteUrl: financeiro.comprovanteUrl,
  comprovanteFileId: financeiro.comprovanteFileId,
  medicaoId: financeiro.medicaoId,
  pagadorUserId: financeiro.pagadorUserId,
  recebedorUserId: financeiro.recebedorUserId,
} as const;

/**
 * Lançamentos visíveis para um contratante:
 * - pagador_user_id = userId (criados pelo fluxo novo); OU
 * - pagador_user_id IS NULL e a obra pertence ao contratante (legados).
 */
export async function listLancamentosContratante(userId: string): Promise<LancamentoRow[]> {
  const rows = await db
    .select(baseSelect)
    .from(financeiro)
    .leftJoin(obras, eq(obras.id, financeiro.obraId))
    .leftJoin(clientes, eq(clientes.id, obras.clienteId))
    .where(
      or(
        eq(financeiro.pagadorUserId, userId),
        and(isNull(financeiro.pagadorUserId), eq(clientes.userId, userId)),
      ),
    )
    .orderBy(desc(financeiro.data));
  return rows.map(rowFromJoin);
}

/**
 * Lançamentos visíveis para um empreiteiro:
 * - recebedor_user_id = userId (criados pelo fluxo novo); OU
 * - recebedor_user_id IS NULL e a obra está atribuída a uma empreiteira
 *   cujo userId é o do usuário (legados).
 */
export async function listLancamentosEmpreiteiro(userId: string): Promise<LancamentoRow[]> {
  const rows = await db
    .select(baseSelect)
    .from(financeiro)
    .leftJoin(obras, eq(obras.id, financeiro.obraId))
    .leftJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
    .where(
      or(
        eq(financeiro.recebedorUserId, userId),
        and(isNull(financeiro.recebedorUserId), eq(empreiteiras.userId, userId)),
      ),
    )
    .orderBy(desc(financeiro.data));
  return rows.map(rowFromJoin);
}

export async function getLancamento(id: string): Promise<LancamentoRow | null> {
  const rows = await db
    .select(baseSelect)
    .from(financeiro)
    .leftJoin(obras, eq(obras.id, financeiro.obraId))
    .where(eq(financeiro.id, id))
    .limit(1);
  return rows[0] ? rowFromJoin(rows[0]) : null;
}

export async function isContratanteOwnerOfLancamento(lanc: LancamentoRow, userId: string): Promise<boolean> {
  if (lanc.pagadorUserId === userId) return true;
  if (lanc.pagadorUserId == null && lanc.obraId) {
    const rows = await db
      .select({ ownerId: clientes.userId })
      .from(obras)
      .leftJoin(clientes, eq(clientes.id, obras.clienteId))
      .where(eq(obras.id, lanc.obraId))
      .limit(1);
    return rows[0]?.ownerId === userId;
  }
  return false;
}

export async function quitarLancamento(args: {
  id: string;
  metodoPagamento: string;
  dataPagamento?: string;
  comprovanteFileId?: string | null;
  comprovanteUrl?: string | null;
}): Promise<LancamentoRow | null> {
  const today = args.dataPagamento ?? new Date().toISOString().slice(0, 10);
  const [updated] = await db
    .update(financeiro)
    .set({
      status: "pago",
      dataPagamento: today,
      metodoPagamento: args.metodoPagamento,
      comprovanteFileId: args.comprovanteFileId ?? null,
      comprovanteUrl: args.comprovanteUrl ?? null,
    })
    .where(eq(financeiro.id, args.id))
    .returning();
  if (!updated) return null;
  return getLancamento(updated.id);
}

/**
 * Gera URL assinada para o comprovante (TTL curto). Devolve null se não
 * houver fileId associado ou se o arquivo já foi removido.
 */
export async function signedUrlForComprovante(fileId: string | null): Promise<string | null> {
  if (!fileId) return null;
  const rows = await db
    .select({ key: userFiles.bucketKey, name: userFiles.originalName, deletedAt: userFiles.deletedAt })
    .from(userFiles)
    .where(eq(userFiles.id, fileId))
    .limit(1);
  const file = rows[0];
  if (!file || file.deletedAt) return null;
  return createSignedReadUrl({ key: file.key, filename: file.name });
}

// Pequeno utilitário para evitar import morto (alguma referência aos imports
// que o linter pode marcar como "unused" quando este arquivo é carregado em
// callers que só usam parte da API).
export const __raw = { sql };
