import { and, eq, sql } from "drizzle-orm";
import type { NextRequest } from "next/server";
import { db } from "@shared/db/db";
import { obras } from "@shared/db/schema";
import { recordAudit } from "@features/auth/api/audit";
import { getClientIp, isRateLimited } from "@features/auth/api/rate-limit";
import { getLimiteRecurso } from "@features/planos/assinatura-service";
import { insertObraSchemaStrict } from "@features/obras/schemas";

export type DonoObra =
  | { kind: "contratante"; clienteId: string }
  | { kind: "xgestao"; empreiteiraId: string };

export type CreateObraResult =
  | { ok: true; obra: typeof obras.$inferSelect }
  | { ok: false; status: number; body: Record<string, unknown> };

class ObraLimiteError extends Error {
  constructor(public readonly limite: number) {
    super("LIMITE_PLANO");
  }
}

/**
 * Cria uma obra para um dono já autorizado.
 *
 * As rotas mantêm seus guards de produto e perfil. Este núcleo preserva a
 * validação, o rate limit, a cota atômica e a auditoria em todos os fluxos.
 */
export async function createObra(
  request: NextRequest,
  userId: string,
  owner: DonoObra,
  body: unknown,
): Promise<CreateObraResult> {
  const ip = getClientIp(request);
  if (isRateLimited(`obras.create:${userId}`, 10, 60 * 1000)) {
    return {
      ok: false,
      status: 429,
      body: { message: "Muitas obras criadas em pouco tempo. Aguarde um minuto e tente novamente." },
    };
  }
  if (isRateLimited(`obras.create.ip:${ip}`, 30, 60 * 1000)) {
    return {
      ok: false,
      status: 429,
      body: { message: "Muitas requisições. Aguarde um minuto e tente novamente." },
    };
  }

  const {
    clienteId: _ignoredCliente,
    empreiteiraId: _ignoredEmpreiteira,
    id: _ignoredId,
    statusModeracao: _ignoredModeracao,
    motivoModeracao: _ignoredMotivo,
    moderadoEm: _ignoredModeradoEm,
    moderadoPor: _ignoredModeradoPor,
    visibilidade: requestedVisibilidade,
    ...safeBody
  } = (body ?? {}) as Record<string, unknown>;
  // No xgestão, visibilidade é uma decisão do servidor. Inserir o rascunho
  // antes do parse evita que uma tentativa forjada de "publicada" acione as
  // exigências de publicação e quebre o formulário mínimo.
  const payload = owner.kind === "xgestao"
    ? { ...safeBody, visibilidade: "rascunho" }
    : { ...safeBody, visibilidade: requestedVisibilidade };
  const parsed = insertObraSchemaStrict.safeParse(payload);
  if (!parsed.success) {
    return {
      ok: false,
      status: 400,
      body: { message: "Dados inválidos", errors: parsed.error.flatten() },
    };
  }

  const limiteObras = await getLimiteRecurso(userId, "obrasAbertas");
  let created: typeof obras.$inferSelect;
  try {
    created = await db.transaction(async (tx) => {
      const ownerFilter =
        owner.kind === "contratante"
          ? eq(obras.clienteId, owner.clienteId)
          : eq(obras.empreiteiraId, owner.empreiteiraId);
      if (limiteObras != null && limiteObras < 9999) {
        const [{ abertas }] = await tx
          .select({ abertas: sql<number>`COUNT(*)::int` })
          .from(obras)
          .where(and(ownerFilter, sql`${obras.status} <> 'concluida'`));
        if (abertas >= limiteObras) throw new ObraLimiteError(limiteObras);
      }

      const ownership =
        owner.kind === "contratante"
          ? { clienteId: owner.clienteId, empreiteiraId: null }
          : {
              clienteId: null,
              empreiteiraId: owner.empreiteiraId,
              // Obra própria não participa da vitrine ou da moderação.
              visibilidade: "rascunho" as const,
            };
      const [row] = await tx
        .insert(obras)
        .values({ ...parsed.data, ...ownership } as typeof obras.$inferInsert)
        .returning();
      return row;
    });
  } catch (error) {
    if (error instanceof ObraLimiteError) {
      return {
        ok: false,
        status: 402,
        body: {
          message: `Você atingiu o limite de ${error.limite} obra(s) aberta(s) do seu plano. Faça upgrade para publicar mais.`,
          code: "LIMITE_PLANO",
          limite: error.limite,
        },
      };
    }
    throw error;
  }

  await recordAudit({
    actorId: userId,
    action: "obras.create",
    targetUserId: null,
    payload: {
      obraId: created.id,
      produto: owner.kind,
      visibilidade: created.visibilidade,
      valorTotal: created.valorTotal,
    },
    request,
  });
  return { ok: true, obra: created };
}