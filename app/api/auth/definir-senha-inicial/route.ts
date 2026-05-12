import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { hashPassword } from "@features/auth/api/auth-service";
import { evaluatePasswordPolicy } from "@features/auth/schemas/password";
import { setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { peekSetupToken, consumeSetupToken } from "@features/auth/api/password-setup-tokens";
import { getUser } from "@features/auth/api/auth-storage";
import { recordAudit } from "@features/auth/api/audit";

const schema = z.object({
  token: z.string().min(1),
  password: z.string().min(8, "Mínimo 8 caracteres"),
  confirmPassword: z.string().min(1),
});

function jsonNoStore(payload: unknown, status: number) {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) return jsonNoStore({ message: parsed.error.errors[0].message }, 400);

  const { token, password, confirmPassword } = parsed.data;
  if (password !== confirmPassword) return jsonNoStore({ message: "As senhas não conferem." }, 400);

  // Valida o token SEM consumir — para que senhas fracas não queimem o link.
  const peek = await peekSetupToken(token);
  if (!peek) return jsonNoStore({ message: "Link inválido ou expirado. Solicite um novo link." }, 400);

  const user = await getUser(peek.userId);
  if (!user) return jsonNoStore({ message: "Usuário não encontrado." }, 404);

  // Política de senha PRIMEIRO. Se falhar, o token segue válido para nova tentativa.
  const policy = evaluatePasswordPolicy(password, {
    email: user.email,
    name: user.name,
    username: user.username || undefined,
  });
  if (!policy.valid) return jsonNoStore({ message: policy.message }, 400);

  // Só agora consome o token (atomicamente, evita corrida).
  const consumed = await consumeSetupToken(token);
  if (!consumed) return jsonNoStore({ message: "Link inválido ou expirado. Solicite um novo link." }, 400);

  const hashed = await hashPassword(password);
  await db
    .update(users)
    .set({ password: hashed, mustChangePassword: false, emailVerified: user.emailVerified ?? new Date() })
    .where(eq(users.id, user.id));

  await recordAudit({
    actorId: user.id,
    targetUserId: user.id,
    action: "user.define-initial-password",
    request,
  });

  return jsonNoStore({ success: true }, 200);
}
