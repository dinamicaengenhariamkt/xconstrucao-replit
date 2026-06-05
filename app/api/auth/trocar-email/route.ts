import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { comparePassword, createEmailVerificationToken } from "@features/auth/api/auth-service";
import {
  requireVerifiedUser,
  setNoCacheHeaders,
  getBaseUrl,
} from "@features/auth/api/auth-utils";
import { getUserByEmail } from "@features/auth/api/auth-storage";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { sendVerificationEmail } from "@shared/lib/email";

const schema = z.object({
  novoEmail: z.string().email("Email inválido").transform((s) => s.trim().toLowerCase()),
  currentPassword: z.string().min(1, "Senha obrigatória"),
});

function jsonNoStore(payload: unknown, status: number) {
  const r = NextResponse.json(payload, { status });
  setNoCacheHeaders(r);
  return r;
}

/**
 * Inicia a troca de email self-service (J02). NÃO altera o email ainda — só
 * dispara um link de confirmação para o NOVO endereço. O email só muda quando
 * o usuário clica no link (`GET /api/auth/confirmar-novo-email`), provando posse
 * da caixa nova.
 *
 * Reaproveita o token de verificação de email (que já carrega `{ sub, email }`
 * no payload) — aqui o `email` embutido é o NOVO. Exige confirmação de senha;
 * contas OAuth sem senha local não usam esta rota.
 */
export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`trocar-email:${ip}`, 5, 15 * 60 * 1000)) {
    return jsonNoStore({ message: "Muitas tentativas. Tente novamente em alguns minutos." }, 429);
  }

  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const user = guard.user;

  if (guard.impersonation) {
    return jsonNoStore({ message: "Ação indisponível no modo visualização." }, 403);
  }

  const body = await request.json().catch(() => ({}));
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return jsonNoStore({ message: "Dados inválidos", errors: parsed.error.flatten() }, 400);
  }
  const { novoEmail, currentPassword } = parsed.data;

  if (!user.password) {
    return jsonNoStore(
      { message: "Esta conta usa login social. A troca de email é gerenciada pelo provedor." },
      400,
    );
  }

  const ok = await comparePassword(currentPassword, user.password);
  if (!ok) {
    return jsonNoStore({ message: "Senha incorreta." }, 401);
  }

  if (novoEmail === user.email.toLowerCase()) {
    return jsonNoStore({ message: "O novo email é igual ao atual." }, 400);
  }

  // Email já em uso por outra conta.
  const existing = await getUserByEmail(novoEmail);
  if (existing && existing.id !== user.id) {
    return jsonNoStore({ message: "Este email já está em uso por outra conta." }, 409);
  }

  // Token carrega o NOVO email; a confirmação aplica `users.email = token.email`.
  const token = createEmailVerificationToken(user.id, novoEmail);
  const baseUrl = getBaseUrl(request);
  const verificationUrl = new URL(
    `/api/auth/confirmar-novo-email?token=${encodeURIComponent(token)}`,
    baseUrl,
  ).toString();

  try {
    await sendVerificationEmail(novoEmail, verificationUrl, user.name);
  } catch (err) {
    console.error("[trocar-email] falha ao enviar email de confirmação:", err);
    return jsonNoStore({ message: "Não foi possível enviar o email de confirmação. Tente novamente." }, 502);
  }

  void recordAudit({
    actorId: user.id,
    action: "conta.trocar-email.solicitar",
    targetUserId: user.id,
    payload: { novoEmail },
    request,
  });

  return jsonNoStore(
    {
      success: true,
      message: `Enviamos um link de confirmação para ${novoEmail}. Clique nele para concluir a troca.`,
    },
    200,
  );
}
