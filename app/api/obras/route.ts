import { NextRequest, NextResponse } from "next/server";
import { and, desc, eq, gte, ilike, inArray, isNull, lte, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { candidaturas, clientes, obras } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { insertObraSchemaStrict } from "@features/obras/schemas";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

/**
 * GET /api/obras  (role-scoped, paginado)
 *  - contratante  → vê apenas as próprias (cliente_id pelo JWT).
 *  - empreiteiro  → visibilidade='publicada' AND empreiteira_id IS NULL
 *                   AND NOT EXISTS (candidatura sua nessa obra) — anti-self.
 *                   Sanitiza clienteId.
 *  - admin/super  → ?scope=admin libera tudo; sem param, vazio (defensivo).
 *
 * Query params: page (default 1), pageSize (default 20, max 100),
 *               cidade (ILIKE %x%), uf, minValor, maxValor,
 *               visibilidade, tipo, modalidade, materiaisPor.
 *
 * Resposta: { rows, total, page, pageSize, totalPages }.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const url = new URL(request.url);
  const q = url.searchParams;
  const cidade = q.get("cidade")?.trim();
  const uf = q.get("uf")?.toUpperCase();
  const minValor = q.get("minValor");
  const maxValor = q.get("maxValor");
  const visibilidade = q.get("visibilidade");
  const modalidade = q.get("modalidade");
  const scopeAdmin = q.get("scope") === "admin";

  // Multi-valor: aceita `?tipo=a&tipo=b` (repetido) OU `?tipo=a,b` (CSV).
  // Dedupe + trim + drop vazios. Limite defensivo de 50 valores por filtro.
  const parseMulti = (key: string): string[] => {
    const raw = q.getAll(key).flatMap((v) => v.split(","));
    const cleaned = raw.map((v) => v.trim()).filter((v) => v.length > 0);
    return Array.from(new Set(cleaned)).slice(0, 50);
  };
  const tipos = parseMulti("tipo");
  const materiaisPorList = parseMulti("materiaisPor").filter((v) =>
    ["contratante", "empreiteiro", "misto"].includes(v),
  );

  // Paginação — clamps server-side.
  const pageRaw = Number(q.get("page") ?? "1");
  const pageSizeRaw = Number(q.get("pageSize") ?? "20");
  const page = Number.isFinite(pageRaw) && pageRaw >= 1 ? Math.floor(pageRaw) : 1;
  const pageSize = Number.isFinite(pageSizeRaw)
    ? Math.min(100, Math.max(1, Math.floor(pageSizeRaw)))
    : 20;
  const offset = (page - 1) * pageSize;

  const role = guard.user.role;
  const filters: any[] = [];

  if (role === "empreiteiro") {
    filters.push(eq(obras.visibilidade, "publicada"));
    filters.push(isNull(obras.empreiteiraId));
    // Anti-self-candidatura: empreiteiro não vê obras onde ele já se candidatou.
    // Usa o índice idx_candidaturas_obra_empreiteiro criado em bootstrap-marketplace.
    filters.push(sql`NOT EXISTS (
      SELECT 1 FROM ${candidaturas}
      WHERE ${candidaturas.obraId} = ${obras.id}
        AND ${candidaturas.empreiteiroId} = ${guard.user.id}
    )`);
  } else if (role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
    if (!cli) {
      const r = NextResponse.json({ rows: [], total: 0, page, pageSize, totalPages: 0 });
      setNoCacheHeaders(r);
      return r;
    }
    filters.push(eq(obras.clienteId, cli.id));
  } else if (isAdminLike(role)) {
    if (!scopeAdmin) {
      const r = NextResponse.json({ rows: [], total: 0, page, pageSize, totalPages: 0 });
      setNoCacheHeaders(r);
      return r;
    }
    // sem filtro de ownership
  } else {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (cidade) filters.push(ilike(obras.cidade, `%${cidade}%`));
  if (uf) filters.push(eq(obras.uf, uf));
  if (minValor && !Number.isNaN(Number(minValor))) filters.push(gte(obras.valorTotal, String(minValor)));
  if (maxValor && !Number.isNaN(Number(maxValor))) filters.push(lte(obras.valorTotal, String(maxValor)));
  if (visibilidade && ["rascunho", "publicada", "pausada", "arquivada"].includes(visibilidade)) {
    filters.push(eq(obras.visibilidade, visibilidade as any));
  }
  if (tipos.length === 1) {
    filters.push(eq(obras.tipo, tipos[0]));
  } else if (tipos.length > 1) {
    filters.push(inArray(obras.tipo, tipos));
  }
  if (modalidade && ["administracao", "empreitada_global", "empreitada_etapa"].includes(modalidade)) {
    filters.push(eq(obras.modalidade, modalidade as any));
  }
  if (materiaisPorList.length === 1) {
    filters.push(eq(obras.materiaisPor, materiaisPorList[0] as any));
  } else if (materiaisPorList.length > 1) {
    filters.push(inArray(obras.materiaisPor, materiaisPorList as any));
  }

  const whereClause = filters.length > 0 ? and(...filters) : undefined;

  // COUNT + page em queries separadas (Drizzle não suporta COUNT(*) OVER()
  // limpo, e queries separadas mantêm o tipo da row idêntico ao .$inferSelect).
  const [countRow] = await db
    .select({ total: sql<number>`count(*)::int` })
    .from(obras)
    .where(whereClause);
  const total = countRow?.total ?? 0;

  const rows = await db
    .select()
    .from(obras)
    .where(whereClause)
    .orderBy(desc(obras.createdAt))
    .limit(pageSize)
    .offset(offset);

  // Empreiteiro: sanitizar PII (clienteId omitido até J05).
  const sanitized = role === "empreiteiro"
    ? rows.map(({ clienteId, ...rest }) => rest)
    : rows;

  const totalPages = total === 0 ? 0 : Math.ceil(total / pageSize);
  const r = NextResponse.json({ rows: sanitized, total, page, pageSize, totalPages });
  setNoCacheHeaders(r);
  return r;
}

/**
 * POST /api/obras  (apenas contratante)
 * - Valida via insertObraSchemaStrict (superRefine condicional por visibilidade).
 * - Força clienteId = clientes.id do contratante autenticado (anti-tamper: ignora body).
 * - Não aceita empreiteiraId no body (vem de J05).
 * - Audit log obras.create com {visibilidade, valorTotal}.
 */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (guard.user.role !== "contratante") {
    const r = NextResponse.json(
      { message: "Apenas contratantes podem cadastrar obras." },
      { status: 403 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  // Rate limit: máx 10 criações por usuário por minuto.
  const ip = getClientIp(request);
  if (isRateLimited(`obras.create:${guard.user.id}`, 10, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitas obras criadas em pouco tempo. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`obras.create.ip:${ip}`, 30, 60 * 1000)) {
    const r = NextResponse.json(
      { message: "Muitas requisições. Aguarde um minuto e tente novamente." },
      { status: 429 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
  if (!cli) {
    const r = NextResponse.json(
      { message: "Perfil de cliente não encontrado. Complete seu cadastro antes de criar obras." },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const { clienteId: _ignored, empreiteiraId: _ignored2, id: _ignored3, ...safeBody } = body ?? {};
  const parsed = insertObraSchemaStrict.safeParse(safeBody);
  if (!parsed.success) {
    const r = NextResponse.json(
      { message: "Dados inválidos", errors: parsed.error.flatten() },
      { status: 400 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const data = parsed.data;
  const [created] = await db
    .insert(obras)
    .values({
      ...data,
      clienteId: cli.id,
      empreiteiraId: null,
    } as any)
    .returning();

  await recordAudit({
    actorId: guard.user.id,
    action: "obras.create",
    targetUserId: null,
    payload: {
      obraId: created.id,
      visibilidade: created.visibilidade,
      valorTotal: created.valorTotal,
    },
    request,
  });

  const r = NextResponse.json(created, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
