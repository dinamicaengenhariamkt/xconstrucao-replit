import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, exists, gte, inArray, isNull, lte, lt, or, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import {
  atividades,
  clientes,
  empreiteiras,
  obras,
  users,
  xgestaoMembros,
  type AtividadeTipo,
} from "@shared/db/schema";
import { isAdminLike, requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { listarIdsObrasPermitidas, resolverEmpresaDoUsuario } from "@features/xgestao/equipe/server/access";
import { canAccessObraArea, findObraAccess } from "@features/obras/api/access";

const DEFAULT_LIMIT = 20;
const MAX_LIMIT = 50;

const TIPOS: ReadonlySet<AtividadeTipo> = new Set([
  "obra_publicada",
  "candidatura_criada",
  "candidatura_aceita",
  "candidatura_rejeitada",
  "candidatura_cancelada",
  "medicao_criada",
  "medicao_aprovada",
  "medicao_contestada",
  "diario_postado",
  "ocorrencia_aberta",
  "ocorrencia_resolvida",
  "lancamento_criado",
  "lancamento_quitado",
]);

function encodeCursor(createdAt: Date, id: string): string {
  return Buffer.from(`${createdAt.toISOString()}|${id}`, "utf8").toString("base64url");
}

function decodeCursor(cursor: string): { createdAt: Date; id: string } | null {
  try {
    const decoded = Buffer.from(cursor, "base64url").toString("utf8");
    const [iso, id] = decoded.split("|");
    if (!iso || !id) return null;
    const dt = new Date(iso);
    if (Number.isNaN(dt.getTime())) return null;
    return { createdAt: dt, id };
  } catch {
    return null;
  }
}

/**
 * GET /api/atividades?cursor=&limit=&tipo=&obraId=&from=&to=
 *
 * Gates de visibilidade por persona:
 *  - admin/superadmin: tudo
 *  - contratante: obras do contratante (via clientes.user_id) + atividades
 *    onde ele foi o actor
 *  - empreiteiro: obras vinculadas (via empreiteiras.user_id → obras.empreiteira_id)
 *    + atividades onde ele foi o actor (ex: candidatura própria a obra ainda
 *    não atribuída)
 *
 * Paginação por cursor `(created_at, id)` DESC, base64url.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const { searchParams } = new URL(request.url);
  const limitRaw = Number(searchParams.get("limit") ?? DEFAULT_LIMIT);
  const limit = Math.min(MAX_LIMIT, Math.max(1, Number.isFinite(limitRaw) ? limitRaw : DEFAULT_LIMIT));
  const cursorParam = searchParams.get("cursor");
  const tipoParam = searchParams.get("tipo");
  const obraIdParam = searchParams.get("obraId");
  const fromParam = searchParams.get("from");
  const toParam = searchParams.get("to");

  const conditions: any[] = [];

  // ---- Visibilidade por persona ----
  const role = guard.user.role;
  const userId = guard.user.id;
  const empresaXgestao = role === "empreiteiro" ? await resolverEmpresaDoUsuario(userId) : null;

  if (!isAdminLike(role)) {
    if (role === "contratante") {
      // Atividades de obras do contratante OU onde ele foi actor OU target.
      conditions.push(
        or(
          eq(atividades.actorUserId, userId),
          eq(atividades.targetUserId, userId),
          exists(
            db
              .select({ x: sql`1` })
              .from(obras)
              .innerJoin(clientes, eq(clientes.id, obras.clienteId))
              .where(and(eq(obras.id, atividades.obraId), eq(clientes.userId, userId))),
          ),
        ),
      );
    } else if (role === "empreiteiro") {
      if (empresaXgestao && empresaXgestao.papel !== "dono") {
        // Para a equipe, o vínculo à obra (e não quem praticou a ação) define
        // a visibilidade. Caso contrário, os lançamentos de colegas somem da
        // timeline. Eventos sem obra seguem privados ao próprio usuário.
        const permitidas = await listarIdsObrasPermitidas(userId, empresaXgestao.empreiteiraId);
        conditions.push(or(
          exists(db.select({ x: sql`1` }).from(obras).where(and(
            eq(obras.id, atividades.obraId),
            eq(obras.empreiteiraId, empresaXgestao.empreiteiraId),
            isNull(obras.clienteId),
            ...(permitidas === null ? [] : [inArray(obras.id, permitidas)]),
          ))),
          and(isNull(atividades.obraId), or(
            eq(atividades.actorUserId, userId),
            eq(atividades.targetUserId, userId),
          )),
        ));
        {
          // Gestores também podem ter áreas restritas, apesar de acessarem
          // todas as obras. Filtrar eventos por área para ambos os papéis.
          const grantIds = permitidas ?? (await db.select({ id: obras.id }).from(obras)
            .where(and(
              eq(obras.empreiteiraId, empresaXgestao.empreiteiraId),
              isNull(obras.clienteId),
            ))).map((row) => row.id);
          const accessRows = await Promise.all(grantIds.map(async (obraId) => [
            obraId,
            await findObraAccess(obraId, { id: userId, role }),
          ] as const));
          const areaWorkIds = (area: "diario" | "ocorrencias" | "cronograma" | "financeiro") =>
            accessRows
              .filter(([, access]) => access && canAccessObraArea(access, area))
              .map(([obraId]) => obraId);
          const diarioIds = areaWorkIds("diario");
          const ocorrenciaIds = areaWorkIds("ocorrencias");
          const cronogramaIds = areaWorkIds("cronograma");
          const financeiroIds = areaWorkIds("financeiro").filter((obraId) => {
            const access = accessRows.find(([id]) => id === obraId)?.[1];
            return access?.xgestaoCategoriasFinanceiroPermitidas == null;
          });
          const eventScopes = [];
          if (diarioIds.length) {
            eventScopes.push(and(
              inArray(atividades.obraId, diarioIds),
              inArray(atividades.tipo, ["diario_postado"]),
            )!);
          }
          if (ocorrenciaIds.length) {
            eventScopes.push(and(
              inArray(atividades.obraId, ocorrenciaIds),
              inArray(atividades.tipo, ["ocorrencia_aberta", "ocorrencia_resolvida"]),
            )!);
          }
          if (cronogramaIds.length && financeiroIds.length) {
            const measurementIds = cronogramaIds.filter((id) => financeiroIds.includes(id));
            if (measurementIds.length) {
              eventScopes.push(and(
                inArray(atividades.obraId, measurementIds),
                inArray(atividades.tipo, ["medicao_criada", "medicao_aprovada", "medicao_contestada"]),
              )!);
            }
          }
          if (financeiroIds.length) {
            eventScopes.push(and(
              inArray(atividades.obraId, financeiroIds),
              inArray(atividades.tipo, ["lancamento_criado", "lancamento_quitado"]),
            )!);
          }
          // Workless personal events remain visible; obra-scoped event payloads
          // are limited by the corresponding area (and finance category).
          conditions.push(or(
            and(
              isNull(atividades.obraId),
              or(eq(atividades.actorUserId, userId), eq(atividades.targetUserId, userId)),
            ),
            ...(eventScopes.length ? eventScopes : []),
          ));
        }
      } else if (!empresaXgestao && (await db.select({ id: xgestaoMembros.id })
        .from(xgestaoMembros).where(eq(xgestaoMembros.userId, userId)).limit(1)).length) {
        // Um membro revogado ainda pode ter eventos próprios; isso não lhe dá
        // acesso à timeline da obra da qual foi removido.
        conditions.push(and(
          isNull(atividades.obraId),
          or(eq(atividades.actorUserId, userId), eq(atividades.targetUserId, userId)),
        ));
      } else {
        // O responsável mantém o escopo anterior, inclusive obras marketplace
        // atribuídas e candidaturas próprias fora das obras xgestão.
        conditions.push(or(
          eq(atividades.actorUserId, userId),
          eq(atividades.targetUserId, userId),
          exists(db.select({ x: sql`1` }).from(obras)
            .innerJoin(empreiteiras, eq(empreiteiras.id, obras.empreiteiraId))
            .where(and(eq(obras.id, atividades.obraId), eq(empreiteiras.userId, userId)))),
        ));
      }
    } else {
      const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  // ---- Filtros opcionais ----
  if (tipoParam) {
    const tipos = tipoParam.split(",").map((s) => s.trim()).filter((t) => TIPOS.has(t as AtividadeTipo));
    if (tipos.length > 0) {
      conditions.push(inArray(atividades.tipo, tipos as AtividadeTipo[]));
    }
  }
  if (obraIdParam) {
    conditions.push(eq(atividades.obraId, obraIdParam));
  }
  if (fromParam) {
    const dt = new Date(fromParam);
    if (!Number.isNaN(dt.getTime())) conditions.push(gte(atividades.createdAt, dt));
  }
  if (toParam) {
    const dt = new Date(toParam);
    if (!Number.isNaN(dt.getTime())) conditions.push(lte(atividades.createdAt, dt));
  }

  // ---- Cursor: (created_at, id) DESC ----
  if (cursorParam) {
    const decoded = decodeCursor(cursorParam);
    if (decoded) {
      // (created_at, id) < (cursorCreatedAt, cursorId)
      conditions.push(
        or(
          lt(atividades.createdAt, decoded.createdAt),
          and(eq(atividades.createdAt, decoded.createdAt), lt(atividades.id, decoded.id)),
        ),
      );
    }
  }

  // Pega limit+1 para detectar nextCursor.
  const rows = await db
    .select({
      id: atividades.id,
      tipo: atividades.tipo,
      actorUserId: atividades.actorUserId,
      obraId: atividades.obraId,
      targetUserId: atividades.targetUserId,
      payload: atividades.payload,
      createdAt: atividades.createdAt,
      actorName: users.name,
      actorRole: users.role,
      obraNome: obras.nome,
    })
    .from(atividades)
    .leftJoin(users, eq(users.id, atividades.actorUserId))
    .leftJoin(obras, eq(obras.id, atividades.obraId))
    .where(conditions.length > 0 ? and(...conditions) : undefined)
    .orderBy(desc(atividades.createdAt), desc(atividades.id))
    .limit(limit + 1);

  const hasMore = rows.length > limit;
  const items = hasMore ? rows.slice(0, limit) : rows;
  const last = items[items.length - 1];
  const nextCursor = hasMore && last ? encodeCursor(last.createdAt, last.id) : null;

  const r = NextResponse.json({
    items,
    nextCursor,
  });
  setNoCacheHeaders(r);
  return r;
}
