import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import {
  requireVerifiedUser,
  setNoCacheHeaders,
} from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { db } from "@shared/db/db";
import {
  clientes,
  empreiteiras,
  obras,
  candidaturas,
  userPreferencias,
} from "@shared/db/schema";

/**
 * Export de dados pessoais (LGPD — direito de portabilidade), J02. Retorna um
 * JSON com os dados que a plataforma guarda sobre o usuário autenticado:
 * conta (sem hash de senha), preferências, perfil de domínio (cliente OU
 * empreiteira) e os registros transacionais que ele originou (obras como
 * contratante, candidaturas como empreiteiro).
 *
 * Servido como download (`Content-Disposition: attachment`). Apenas o próprio
 * usuário (não disponível em modo impersonation).
 */
export async function GET(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`exportar-dados:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { message: "Muitas exportações. Tente novamente mais tarde." },
      { status: 429 },
    );
  }

  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const user = guard.user;

  if (guard.impersonation) {
    const r = NextResponse.json({ message: "Indisponível no modo visualização." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // Conta (sem campos sensíveis de autenticação).
  const { password: _pw, ...conta } = user as Record<string, unknown> & { password?: unknown };

  const [prefs] = await db
    .select()
    .from(userPreferencias)
    .where(eq(userPreferencias.userId, user.id))
    .limit(1);

  let perfilCliente: unknown = null;
  let obrasContratante: unknown[] = [];
  let perfilEmpreiteira: unknown = null;
  let candidaturasEmpreiteiro: unknown[] = [];

  if (user.role === "contratante") {
    const [cli] = await db.select().from(clientes).where(eq(clientes.userId, user.id)).limit(1);
    perfilCliente = cli ?? null;
    if (cli) {
      obrasContratante = await db.select().from(obras).where(eq(obras.clienteId, cli.id));
    }
  } else if (user.role === "empreiteiro") {
    const [emp] = await db.select().from(empreiteiras).where(eq(empreiteiras.userId, user.id)).limit(1);
    perfilEmpreiteira = emp ?? null;
    candidaturasEmpreiteiro = await db
      .select()
      .from(candidaturas)
      .where(eq(candidaturas.empreiteiroId, user.id));
  }

  const payload = {
    geradoEm: new Date().toISOString(),
    titular: { id: user.id, email: user.email, role: user.role },
    conta,
    preferencias: prefs ?? null,
    perfilCliente,
    obrasContratante,
    perfilEmpreiteira,
    candidaturasEmpreiteiro,
  };

  void recordAudit({
    actorId: user.id,
    action: "conta.exportar-dados",
    targetUserId: user.id,
    payload: { role: user.role },
    request,
  });

  const filename = `meus-dados-${user.id}.json`;
  const response = new NextResponse(JSON.stringify(payload, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
  setNoCacheHeaders(response);
  return response;
}
