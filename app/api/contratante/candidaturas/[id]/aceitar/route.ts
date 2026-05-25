import { NextRequest, NextResponse } from "next/server";
import { and, eq, ne, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { candidaturas, clientes, empreiteiras, obras } from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";

const bodySchema = z.object({
  mensagem: z.string().max(1000).optional(),
});

/**
 * POST /api/contratante/candidaturas/[id]/aceitar
 *
 * Aceite **transacional** com lock pessimista:
 *  1. SELECT … FOR UPDATE na obra → evita 2 aceites simultâneos.
 *  2. Valida ownership (contratante dono) ou admin.
 *  3. Valida obra ainda livre (empreiteira_id IS NULL).
 *  4. Resolve empreiteiras.id via lookup pelo user_id do candidato.
 *  5. UPDATE obra: empreiteira_id + status='em_andamento'.
 *  6. UPDATE candidatura: status='aceita' + mensagem opcional.
 *  7. UPDATE concorrentes: status='rejeitada' + motivo padrão.
 *
 * Audit log: `candidaturas.aceitar`.
 */
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (!isAdminLike(guard.user.role) && guard.user.role !== "contratante") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id: candidaturaId } = await ctx.params;
  let bodyJson: unknown = {};
  try {
    bodyJson = await request.json();
  } catch {
    // body opcional
  }
  const parsedBody = bodySchema.safeParse(bodyJson);
  if (!parsedBody.success) {
    return NextResponse.json({ error: "INVALID_BODY", errors: parsedBody.error.flatten() }, { status: 400 });
  }
  const mensagem = parsedBody.data.mensagem ?? null;

  try {
    const result = await db.transaction(async (tx) => {
      // Buscar candidatura (sem lock — só para descobrir obraId).
      const [cand] = await tx
        .select()
        .from(candidaturas)
        .where(eq(candidaturas.id, candidaturaId));
      if (!cand) return { code: 404 as const, body: { error: "NOT_FOUND" } };
      if (cand.status !== "pendente") {
        return { code: 409 as const, body: { error: "INVALID_STATE", message: "Esta proposta não está mais pendente." } };
      }
      if (!cand.obraId || !cand.empreiteiroId) {
        return { code: 422 as const, body: { error: "CANDIDATURA_INCOMPLETA" } };
      }

      // Lock pessimista na obra.
      const obraRows = await tx.execute(
        sql`SELECT id, cliente_id, empreiteira_id, status FROM obras WHERE id = ${cand.obraId} FOR UPDATE`,
      );
      const obraRow = (obraRows as any).rows?.[0] ?? (obraRows as any)[0];
      if (!obraRow) return { code: 404 as const, body: { error: "OBRA_NOT_FOUND" } };

      // Ownership (admin pula).
      if (!isAdminLike(guard.user.role)) {
        const [cli] = await tx.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
        if (!cli || obraRow.cliente_id !== cli.id) {
          return { code: 403 as const, body: { error: "FORBIDDEN", message: "Você não é dono desta obra." } };
        }
      }

      if (obraRow.empreiteira_id) {
        return {
          code: 409 as const,
          body: { error: "OBRA_JA_TEM_EMPREITEIRA", message: "Esta obra já tem empreiteira contratada." },
        };
      }

      // Resolver empreiteira do candidato.
      const [emp] = await tx
        .select({ id: empreiteiras.id })
        .from(empreiteiras)
        .where(eq(empreiteiras.userId, cand.empreiteiroId));
      if (!emp) {
        return {
          code: 422 as const,
          body: {
            error: "EMPREITEIRO_SEM_PERFIL",
            message: "O empreiteiro selecionado não tem perfil de empresa configurado.",
          },
        };
      }

      const now = new Date();

      // 1) Vincular obra.
      await tx
        .update(obras)
        .set({ empreiteiraId: emp.id, status: "em_andamento", updatedAt: now })
        .where(eq(obras.id, cand.obraId));

      // 2) Aceitar candidatura — atômico: WHERE id=? AND status='pendente'.
      // Se outra request marcou rejeitada/cancelada entre o SELECT inicial
      // e este UPDATE, rowCount=0 e fazemos rollback via throw.
      const aceitas = await tx
        .update(candidaturas)
        .set({
          status: "aceita",
          mensagemContratante: mensagem,
          decididaEm: now,
        })
        .where(and(eq(candidaturas.id, candidaturaId), eq(candidaturas.status, "pendente")))
        .returning({ id: candidaturas.id });
      if (aceitas.length === 0) {
        throw new Error("CANDIDATURA_STATE_CHANGED");
      }

      // 3) Rejeitar concorrentes pendentes.
      const rejeitadas = await tx
        .update(candidaturas)
        .set({
          status: "rejeitada",
          motivoRejeicao: "Outra proposta foi selecionada",
          decididaEm: now,
        })
        .where(
          and(
            eq(candidaturas.obraId, cand.obraId),
            ne(candidaturas.id, candidaturaId),
            eq(candidaturas.status, "pendente"),
          ),
        )
        .returning({ id: candidaturas.id });

      return {
        code: 200 as const,
        body: {
          ok: true,
          obraId: cand.obraId,
          candidaturaId,
          empreiteiraId: emp.id,
          rejeitadasCount: rejeitadas.length,
          rejeitadasIds: rejeitadas.map((r) => r.id),
        },
      };
    });

    if (result.code === 200) {
      void recordAudit({
        actorId: guard.user.id,
        action: "candidaturas.aceitar",
        targetUserId: null,
        payload: {
          obraId: (result.body as any).obraId,
          candidaturaId,
          empreiteiraId: (result.body as any).empreiteiraId,
          rejeitadasCount: (result.body as any).rejeitadasCount,
        },
        request,
      });
    }

    const r = NextResponse.json(result.body, { status: result.code });
    setNoCacheHeaders(r);
    return r;
  } catch (err: any) {
    if (err?.message === "CANDIDATURA_STATE_CHANGED") {
      const r = NextResponse.json(
        { error: "INVALID_STATE", message: "Esta proposta não está mais pendente." },
        { status: 409 },
      );
      setNoCacheHeaders(r);
      return r;
    }
    console.error("[POST aceitar candidatura]", err);
    const r = NextResponse.json({ error: "INTERNAL_ERROR" }, { status: 500 });
    setNoCacheHeaders(r);
    return r;
  }
}
