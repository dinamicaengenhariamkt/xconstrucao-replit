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

/**
 * Cria um lançamento de PLATAFORMA (escopo="plataforma") — receitas/despesas que
 * não pertencem a uma obra: assinaturas (J11), anúncios (J12), estornos de
 * disputa (J10), despesas manuais do admin (J09).
 *
 * Idempotente por (origemTipo, origemId) via índice único `uq_financeiro_origem`:
 * reenvio de webhook ou re-resolução de disputa devolve o lançamento existente
 * sem duplicar. Quando `origemTipo`/`origemId` são omitidos (despesa manual),
 * sempre cria — NULLs são distintos no índice único do Postgres.
 */
export async function criarLancamentoPlataforma(args: {
  tipo: "entrada" | "saida";
  descricao: string;
  valor: number;
  categoria: string;
  status?: "pendente" | "pago" | "atrasado" | "cancelado";
  data?: string;
  origemTipo?: string | null;
  origemId?: string | null;
  pagadorUserId?: string | null;
  recebedorUserId?: string | null;
  tx?: DbOrTx;
}): Promise<LancamentoRow> {
  const client = (args.tx ?? db) as typeof db;
  const today = args.data ?? new Date().toISOString().slice(0, 10);

  if (args.origemTipo && args.origemId) {
    const existing = await client
      .select()
      .from(financeiro)
      .where(and(eq(financeiro.origemTipo, args.origemTipo), eq(financeiro.origemId, args.origemId)))
      .limit(1);
    if (existing.length > 0) return rowFromJoin({ ...existing[0], obraNome: null });
  }

  try {
    const [row] = await client
      .insert(financeiro)
      .values({
        tipo: args.tipo,
        descricao: args.descricao,
        valor: String(args.valor),
        data: today,
        escopo: "plataforma",
        categoria: args.categoria,
        status: args.status ?? "pago",
        origemTipo: args.origemTipo ?? null,
        origemId: args.origemId ?? null,
        pagadorUserId: args.pagadorUserId ?? null,
        recebedorUserId: args.recebedorUserId ?? null,
      })
      .returning();
    return rowFromJoin({ ...row, obraNome: null });
  } catch (err: any) {
    // Race condition no índice único de origem: outra request criou o mesmo
    // lançamento entre o SELECT e o INSERT. Devolve o existente.
    if (err?.code === "23505" && args.origemTipo && args.origemId) {
      const [row] = await client
        .select()
        .from(financeiro)
        .where(and(eq(financeiro.origemTipo, args.origemTipo), eq(financeiro.origemId, args.origemId)))
        .limit(1);
      if (row) return rowFromJoin({ ...row, obraNome: null });
    }
    throw err;
  }
}

export interface ResumoCaixa {
  entradas: number;
  saidas: number;
  saldo: number;
  pendente: number;
}

/**
 * Agregação de caixa por escopo e período (datas ISO yyyy-mm-dd, inclusivas).
 * Soma feita no banco (SUM com FILTER), não em memória. `pendente` = entradas
 * ainda não pagas (status pendente/atrasado), usado para previsão de recebíveis.
 */
export async function getResumoCaixa(args: {
  escopo: "obra" | "plataforma";
  inicio?: string | null;
  fim?: string | null;
}): Promise<ResumoCaixa> {
  const conds = [eq(financeiro.escopo, args.escopo)];
  if (args.inicio) conds.push(sql`${financeiro.data} >= ${args.inicio}`);
  if (args.fim) conds.push(sql`${financeiro.data} <= ${args.fim}`);

  const [row] = await db
    .select({
      entradas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} = 'pago'), 0)`,
      saidas: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'saida' AND ${financeiro.status} = 'pago'), 0)`,
      pendente: sql<string>`COALESCE(SUM(${financeiro.valor}) FILTER (WHERE ${financeiro.tipo} = 'entrada' AND ${financeiro.status} IN ('pendente','atrasado')), 0)`,
    })
    .from(financeiro)
    .where(and(...conds));

  const entradas = Number(row?.entradas ?? 0);
  const saidas = Number(row?.saidas ?? 0);
  const pendente = Number(row?.pendente ?? 0);
  return { entradas, saidas, saldo: entradas - saidas, pendente };
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

  // Item 15 J40 — Recomputa obras.valorPago a partir da tabela financeiro (fonte de verdade).
  // Nunca usa incremento avulso para evitar divergência em reprocessamento.
  if (updated.obraId) {
    try {
      await db.execute(
        sql`UPDATE obras
            SET valor_pago = (
              SELECT COALESCE(SUM(valor::numeric), 0)
              FROM financeiro
              WHERE obra_id = ${updated.obraId}
                AND status  = 'pago'
                AND tipo    = 'saida'
            )
            WHERE id = ${updated.obraId}`,
      );
    } catch (err) {
      // Falha não-crítica: o valor será recomputado na próxima quitação.
      console.error("[quitarLancamento] falha ao recomputar valorPago da obra:", err);
    }
  }

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
