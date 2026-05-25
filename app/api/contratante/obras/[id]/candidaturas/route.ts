import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, clientes, empreiteiras, obras, users } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";

/**
 * GET /api/contratante/obras/[id]/candidaturas
 *  - Lista propostas recebidas para a obra X. Visível ao contratante DONO ou superadmin.
 *  - JOIN users + empreiteiras (LEFT — empreiteiro pode não ter perfil empreiteira ainda)
 *    para devolver nome/empresa/telefone/avaliacao/avatar reais.
 *  - Ordem: pendentes primeiro, depois mais antigas primeiro (FIFO dentro do status).
 */
export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { id: obraId } = await ctx.params;

  // Ownership: contratante dono OU admin/superadmin.
  const [obra] = await db.select({ id: obras.id, clienteId: obras.clienteId }).from(obras).where(eq(obras.id, obraId));
  if (!obra) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }
  if (!isAdminLike(guard.user.role)) {
    if (guard.user.role !== "contratante") {
      const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
    if (!cli || obra.clienteId !== cli.id) {
      // Anti-enumeração: devolve 404 em vez de 403.
      const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  const rows = await db
    .select({
      id: candidaturas.id,
      status: candidaturas.status,
      valorProposta: candidaturas.valorProposta,
      prazoEstimado: candidaturas.prazoEstimado,
      dataInicio: candidaturas.dataInicio,
      dataTermino: candidaturas.dataTermino,
      descricao: candidaturas.descricao,
      atividades: candidaturas.atividades,
      observacoesPrazo: candidaturas.observacoesPrazo,
      observacoesFinanceiras: candidaturas.observacoesFinanceiras,
      motivoRejeicao: candidaturas.motivoRejeicao,
      canceladaPeloEmpreiteiro: candidaturas.canceladaPeloEmpreiteiro,
      createdAt: candidaturas.createdAt,
      decididaEm: candidaturas.decididaEm,
      empreiteiroUserId: users.id,
      empreiteiroNome: users.name,
      empreiteiroEmail: users.email,
      empreiteiroAvatarUrl: users.avatarUrl,
      empreiteiraId: empreiteiras.id,
      empreiteiraEmpresa: empreiteiras.nome,
      empreiteiraTelefone: empreiteiras.telefone,
      empreiteiraAvatarUrl: empreiteiras.avatarUrl,
      empreiteiraAvaliacao: empreiteiras.avaliacao,
    })
    .from(candidaturas)
    .leftJoin(users, eq(users.id, candidaturas.empreiteiroId))
    .leftJoin(empreiteiras, eq(empreiteiras.userId, candidaturas.empreiteiroId))
    .where(eq(candidaturas.obraId, obraId))
    // Pendente=0, aceita=1, rejeitada=2; depois createdAt asc (FIFO).
    .orderBy(
      sql`CASE ${candidaturas.status}
            WHEN 'pendente' THEN 0
            WHEN 'aceita' THEN 1
            WHEN 'rejeitada' THEN 2
            ELSE 3 END`,
      asc(candidaturas.createdAt),
    );

  const r = NextResponse.json(rows);
  setNoCacheHeaders(r);
  return r;
}
