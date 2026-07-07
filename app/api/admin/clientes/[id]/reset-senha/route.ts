import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { users } from "@shared/db/schema";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { getBaseUrl } from "@features/auth/api/auth-utils";
import { getUser } from "@features/auth/api/auth-storage";
import { hashPassword } from "@features/auth/api/auth-service";
import { generateStrongPassword } from "@features/auth/api/password-generator";
import { issueSetupToken } from "@features/auth/api/password-setup-tokens";
import { sendPasswordSetupEmail } from "@shared/lib/email";
import { recordAudit } from "@features/auth/api/audit";
import { obterUserIdDoCliente } from "@features/admin/clientes/api/clientes-admin-service";

// Reset por LINK: invalida a senha atual (hash aleatório descartado), força
// troca no próximo login e envia o e-mail de definição. Mesma mecânica da rota
// de usuários — reusa issueSetupToken + sendPasswordSetupEmail.
export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  const userId = await obterUserIdDoCliente(id);
  if (userId === undefined) return NextResponse.json({ message: "Cliente não encontrado" }, { status: 404 });
  if (!userId) {
    return NextResponse.json(
      { message: "Este cliente não possui login na plataforma. Cadastre um acesso antes de resetar a senha." },
      { status: 409 },
    );
  }

  const target = await getUser(userId);
  if (!target) return NextResponse.json({ message: "Usuário do cliente não encontrado" }, { status: 404 });

  const throwaway = generateStrongPassword(32);
  const hashed = await hashPassword(throwaway);
  await db.update(users).set({ password: hashed, mustChangePassword: true }).where(eq(users.id, userId));

  const { token } = await issueSetupToken(target.id, guard.userId);
  const setupUrl = `${getBaseUrl(request)}/definir-senha-inicial?token=${encodeURIComponent(token)}`;
  try {
    await sendPasswordSetupEmail(target.email, setupUrl, target.name, "Administrador", "Cliente");
  } catch (err) {
    console.error("[clientes/reset-senha] falha ao enviar e-mail:", err);
  }

  await recordAudit({
    actorId: guard.userId,
    targetUserId: userId,
    action: "admin.cliente.reset-senha",
    payload: { clienteId: id },
    request,
  });

  return NextResponse.json({ success: true });
}
