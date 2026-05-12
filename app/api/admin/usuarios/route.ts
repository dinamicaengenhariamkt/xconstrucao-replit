import { NextRequest, NextResponse } from "next/server";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders, getBaseUrl } from "@features/auth/api/auth-utils";
import { createUserWithProfile, getUserByEmail } from "@features/auth/api/auth-storage";
import { hashPassword } from "@features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "@features/auth/schemas/password";
import { generateStrongPassword } from "@features/auth/api/password-generator";
import { issueSetupToken } from "@features/auth/api/password-setup-tokens";
import { sendPasswordSetupEmail } from "@shared/lib/email";
import { recordAudit } from "@features/auth/api/audit";

const ROLE_VALUES = ["superadmin", "admin", "contratante", "empreiteiro"] as const;
type Role = typeof ROLE_VALUES[number];

const createSchema = z.object({
  name: z.string().trim().min(2, "Nome muito curto"),
  email: z.string().trim().toLowerCase().email("Email inválido"),
  role: z.enum(ROLE_VALUES),
  phone: z.string().trim().optional().nullable(),
  senhaModo: z.enum(["manual", "random", "link"]),
  senhaManual: z.string().optional(),
});

function jsonNoStore(payload: unknown, status = 200): NextResponse {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export function canManage(actorRole: string, targetRole: Role): boolean {
  if (actorRole === "superadmin") return true;
  if (actorRole === "admin") return targetRole === "contratante" || targetRole === "empreiteiro";
  return false;
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "superadmin" && guard.user.role !== "admin") {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }

  const url = new URL(request.url);
  const q = (url.searchParams.get("q") ?? "").trim();
  const role = url.searchParams.get("role");
  const ativoStr = url.searchParams.get("ativo");
  const page = Math.max(1, Number(url.searchParams.get("page") ?? "1"));
  const pageSize = Math.min(100, Math.max(1, Number(url.searchParams.get("pageSize") ?? "20")));

  const conds: ReturnType<typeof eq>[] = [];
  if (q) conds.push(or(ilike(users.name, `%${q}%`), ilike(users.email, `%${q}%`))!);
  if (role && (ROLE_VALUES as readonly string[]).includes(role)) conds.push(eq(users.role, role as Role));
  if (ativoStr === "true") conds.push(eq(users.ativo, true));
  if (ativoStr === "false") conds.push(eq(users.ativo, false));

  if (guard.user.role === "admin") {
    conds.push(or(eq(users.role, "contratante"), eq(users.role, "empreiteiro"))!);
  }

  const where = conds.length > 0 ? and(...conds) : undefined;

  const [{ count }] = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(users)
    .where(where as never);

  const rows = await db
    .select({
      id: users.id,
      name: users.name,
      email: users.email,
      role: users.role,
      phone: users.phone,
      ativo: users.ativo,
      mustChangePassword: users.mustChangePassword,
      emailVerified: users.emailVerified,
      createdAt: users.createdAt,
      createdBy: users.createdBy,
    })
    .from(users)
    .where(where as never)
    .orderBy(desc(users.createdAt), asc(users.email))
    .limit(pageSize)
    .offset((page - 1) * pageSize);

  return jsonNoStore({ rows, total: count, page, pageSize });
}

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "superadmin" && guard.user.role !== "admin") {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = createSchema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  }
  const data = parsed.data;

  if (!canManage(guard.user.role, data.role)) {
    return jsonNoStore({ message: "Você não pode criar usuários com esse perfil." }, 403);
  }

  const existing = await getUserByEmail(data.email);
  if (existing) {
    return jsonNoStore({ message: "Já existe um usuário com este email." }, 409);
  }

  let passwordPlain: string | null = null;
  let mustChange = false;
  let hashed: string | null = null;

  if (data.senhaModo === "manual") {
    if (!data.senhaManual) return jsonNoStore({ message: "Informe a senha temporária." }, 400);
    const policy = evaluatePasswordPolicy(data.senhaManual, { email: data.email, name: data.name });
    if (!policy.valid) return jsonNoStore({ message: policy.message }, 400);
    passwordPlain = data.senhaManual;
    hashed = await hashPassword(data.senhaManual);
    mustChange = true;
  } else if (data.senhaModo === "random") {
    passwordPlain = generateStrongPassword(16);
    hashed = await hashPassword(passwordPlain);
    mustChange = true;
  }
  // link: hashed permanece null — usuário define ao clicar no link

  const created = await createUserWithProfile({
    name: data.name,
    email: data.email,
    role: data.role,
    phone: data.phone ?? null,
    password: hashed,
    mustChangePassword: mustChange,
    createdBy: guard.user.id,
    ativo: true,
    emailVerified: data.senhaModo === "link" ? null : new Date(),
    username: null,
  });

  let setupUrl: string | null = null;
  if (data.senhaModo === "link") {
    const { token } = await issueSetupToken(created.id, guard.user.id);
    const base = getBaseUrl(request);
    setupUrl = `${base}/definir-senha-inicial?token=${encodeURIComponent(token)}`;
    try {
      await sendPasswordSetupEmail(created.email, setupUrl, created.name, guard.user.name, roleLabel(data.role));
    } catch (err) {
      console.error("[admin/usuarios] Falha ao enviar e-mail de setup:", err);
    }
  }

  await recordAudit({
    actorId: guard.user.id,
    targetUserId: created.id,
    action: "user.create",
    payload: { role: data.role, senhaModo: data.senhaModo },
    request,
  });

  return jsonNoStore(
    {
      user: {
        id: created.id,
        name: created.name,
        email: created.email,
        role: created.role,
      },
      passwordPlain,
      setupUrl,
      mustChange,
    },
    201,
  );
}

export function roleLabel(role: Role): string {
  switch (role) {
    case "superadmin": return "super admin";
    case "admin": return "admin";
    case "contratante": return "contratante";
    case "empreiteiro": return "empreiteiro";
  }
}
