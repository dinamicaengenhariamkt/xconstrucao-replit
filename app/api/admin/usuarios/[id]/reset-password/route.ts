import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders, getBaseUrl } from "@features/auth/api/auth-utils";
import { getUser } from "@features/auth/api/auth-storage";
import { hashPassword } from "@features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "@features/auth/schemas/password";
import { generateStrongPassword } from "@features/auth/api/password-generator";
import { issueSetupToken } from "@features/auth/api/password-setup-tokens";
import { sendPasswordSetupEmail } from "@shared/lib/email";
import { recordAudit } from "@features/auth/api/audit";
import { canManage, hasUsersTabAccess, roleLabel } from "../../route";

type Role = "superadmin" | "admin" | "contratante" | "empreiteiro";

const schema = z.object({
  senhaModo: z.enum(["manual", "random", "link"]),
  senhaManual: z.string().optional(),
  forceChangeOnFirstLogin: z.boolean().optional().default(true),
});

function jsonNoStore(payload: unknown, status = 200): NextResponse {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (!hasUsersTabAccess(guard.user as { role: string; canManageUsers?: boolean | null })) {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }
  const target = await getUser(id);
  if (!target) return jsonNoStore({ message: "Usuário não encontrado" }, 404);
  if (!canManage(guard.user.role, target.role as Role)) {
    return jsonNoStore({ message: "Acesso negado" }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  const data = parsed.data;

  let passwordPlain: string | null = null;
  let setupUrl: string | null = null;

  // Em qualquer modo, o reset INVALIDA a credencial anterior imediatamente:
  // grava um hash novo (manual, aleatório explícito ou aleatório descartado
  // no caso "link") e força a troca no próximo login. No modo "link", o
  // usuário ainda recebe um token para definir a senha definitiva.
  if (data.senhaModo === "manual") {
    if (!data.senhaManual) return jsonNoStore({ message: "Informe a senha temporária." }, 400);
    const policy = evaluatePasswordPolicy(data.senhaManual, { email: target.email, name: target.name });
    if (!policy.valid) return jsonNoStore({ message: policy.message }, 400);
    const hashed = await hashPassword(data.senhaManual);
    await db.update(users).set({ password: hashed, mustChangePassword: true }).where(eq(users.id, id));
    passwordPlain = data.senhaManual;
  } else if (data.senhaModo === "random") {
    passwordPlain = generateStrongPassword(16);
    const hashed = await hashPassword(passwordPlain);
    await db.update(users).set({ password: hashed, mustChangePassword: true }).where(eq(users.id, id));
  } else {
    // "link": invalida a credencial atual com um hash aleatório DESCARTADO
    // (não revelado), força mustChangePassword e envia o token. Assim a
    // senha antiga deixa de funcionar no instante do reset.
    const throwaway = generateStrongPassword(32);
    const hashed = await hashPassword(throwaway);
    await db
      .update(users)
      .set({ password: hashed, mustChangePassword: true })
      .where(eq(users.id, id));

    const { token } = await issueSetupToken(target.id, guard.user.id);
    const base = getBaseUrl(request);
    setupUrl = `${base}/definir-senha-inicial?token=${encodeURIComponent(token)}`;
    try {
      await sendPasswordSetupEmail(target.email, setupUrl, target.name, guard.user.name, roleLabel(target.role as Role));
    } catch (err) {
      console.error("[reset-password] falha ao enviar e-mail:", err);
    }
  }

  await recordAudit({
    actorId: guard.user.id,
    targetUserId: id,
    action: "user.reset-password",
    payload: { senhaModo: data.senhaModo },
    request,
  });

  return jsonNoStore({ passwordPlain, setupUrl });
}
