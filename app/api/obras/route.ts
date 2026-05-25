import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, gte, isNull, lte, sql } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras } from "@shared/db/schema";
import { requireVerifiedUser, isAdminLike, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { insertObraSchemaStrict } from "@features/obras/schemas";
import { recordAudit } from "@features/auth/api/audit";

/**
 * GET /api/obras  (role-scoped)
 *  - contratante  → vê apenas as próprias (filtra cliente_id pelo JWT).
 *  - empreiteiro  → vê apenas visibilidade='publicada' AND empreiteira_id IS NULL.
 *                   Não retorna PII do contratante (clienteId omitido).
 *  - admin/super  → ?scope=admin libera tudo; sem o param, comporta como contratante (defensivo).
 *
 * Filtros aceitos (query): cidade, uf, minValor, maxValor, visibilidade, tipo, modalidade.
 */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  const url = new URL(request.url);
  const q = url.searchParams;
  const cidade = q.get("cidade");
  const uf = q.get("uf")?.toUpperCase();
  const minValor = q.get("minValor");
  const maxValor = q.get("maxValor");
  const visibilidade = q.get("visibilidade");
  const tipo = q.get("tipo");
  const modalidade = q.get("modalidade");
  const scopeAdmin = q.get("scope") === "admin";

  const role = guard.user.role;
  const filters: any[] = [];

  if (role === "empreiteiro") {
    filters.push(eq(obras.visibilidade, "publicada"));
    filters.push(isNull(obras.empreiteiraId));
  } else if (role === "contratante") {
    const [cli] = await db.select({ id: clientes.id }).from(clientes).where(eq(clientes.userId, guard.user.id));
    if (!cli) {
      const r = NextResponse.json([]);
      setNoCacheHeaders(r);
      return r;
    }
    filters.push(eq(obras.clienteId, cli.id));
  } else if (isAdminLike(role)) {
    if (!scopeAdmin) {
      // defensivo: sem scope=admin, admin enxerga vazio
      const r = NextResponse.json([]);
      setNoCacheHeaders(r);
      return r;
    }
    // sem filtro de ownership
  } else {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (cidade) filters.push(eq(obras.cidade, cidade));
  if (uf) filters.push(eq(obras.uf, uf));
  if (minValor && !Number.isNaN(Number(minValor))) filters.push(gte(obras.valorTotal, String(minValor)));
  if (maxValor && !Number.isNaN(Number(maxValor))) filters.push(lte(obras.valorTotal, String(maxValor)));
  if (visibilidade && ["rascunho", "publicada", "pausada", "arquivada"].includes(visibilidade)) {
    filters.push(eq(obras.visibilidade, visibilidade as any));
  }
  if (tipo) filters.push(eq(obras.tipo, tipo));
  if (modalidade && ["administracao", "empreitada_global", "empreitada_etapa"].includes(modalidade)) {
    filters.push(eq(obras.modalidade, modalidade as any));
  }

  const rows = await db
    .select()
    .from(obras)
    .where(filters.length > 0 ? and(...filters) : undefined)
    .orderBy(desc(obras.createdAt));

  // Empreiteiro: sanitizar PII (não devolve clienteId nem qualquer campo
  // que cole identidade do contratante — até J05 aceite, o vínculo é cego).
  const out = role === "empreiteiro"
    ? rows.map(({ clienteId, ...rest }) => rest)
    : rows;

  const r = NextResponse.json(out);
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
  // Strip campos sensíveis antes de validar
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
