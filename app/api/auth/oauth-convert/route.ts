import { NextRequest, NextResponse } from "next/server";
import { logError } from "@/server/lib/logger";
import { auth } from "@/auth";
import {
  createAccessToken,
  createRefreshToken
} from "@features/auth/api/auth-service";
import { createAuthCookies, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import {
  getUser,
  ensureProfileRow,
  hasAnyProfileRow,
  updateUserRole,
} from "@features/auth/api/auth-storage";
import { storage } from "@/server/storage";
import { db } from "@shared/db/db";
import { userRoles } from "@shared/db/schema";

const VALID_PERSONAS = new Set(["contratante", "empreiteiro", "xgestao"]);

/**
 * Endpoint para converter sessão NextAuth (OAuth) em tokens JWT custom
 * Chamado após login bem-sucedido com Google OAuth
 */
export async function POST(request: NextRequest) {
  try {
    // Obter sessão NextAuth ativa
    const session = await auth();

    if (!session || !session.user) {
      const response = NextResponse.json(
        { error: "Sessão não encontrada" },
        { status: 401 }
      );
      setNoCacheHeaders(response);
      return response;
    }

    const sessionUser = session.user;

    // Buscar user fresco do banco para garantir role/email atualizados
    // (DrizzleAdapter pode ter persistido com role default, vamos validar)
    let dbUser = await getUser(sessionUser.id as string);
    if (!dbUser) {
      const response = NextResponse.json(
        { error: "Usuário não encontrado" },
        { status: 404 }
      );
      setNoCacheHeaders(response);
      return response;
    }

    // Aplicar persona escolhida na landing: se for um primeiro login
    // (sem nenhuma row de domínio ainda) e veio cookie x_signup_persona
    // diferente da role default persistida pelo adapter, atualiza a role
    // ANTES de criar o profile row para evitar criar a row errada.
    const personaCookie = request.cookies.get("x_signup_persona")?.value;
    const xgestaoSignup = personaCookie === "xgestao";
    const roleEscolhida = xgestaoSignup ? "empreiteiro" : personaCookie;
    let isFirstLogin = false;
    if (
      personaCookie &&
      VALID_PERSONAS.has(personaCookie) &&
      roleEscolhida !== dbUser.role &&
      dbUser.role !== "admin"
    ) {
      isFirstLogin = !(await hasAnyProfileRow(dbUser.id));
      if (isFirstLogin) {
        const updated = await updateUserRole(
          dbUser.id,
          roleEscolhida as "contratante" | "empreiteiro"
        );
        if (updated) dbUser = updated;
      }
    }

    // Garante email verificado (OAuth Google) e row de domínio
    if (!dbUser.emailVerified) {
      await storage.updateUserEmailVerified(dbUser.id, new Date());
    }
    // Bloqueante: sem profile row vinculada o usuário não consegue usar
    // as jornadas seguintes (criar obra, candidatar-se). Preferimos abortar
    // a conversão a entregar uma sessão em estado inconsistente.
    try {
      await ensureProfileRow(dbUser);
    } catch (profileErr) {
      void logError("warn", "Falha ao garantir profile row no oauth-convert", { stack: (profileErr as Error)?.stack, route: "/api/auth/oauth-convert" });
      const response = NextResponse.json(
        {
          error: "PROFILE_PROVISION_FAILED",
          message: "Não foi possível concluir a configuração da sua conta. Tente novamente.",
        },
        { status: 500 }
      );
      setNoCacheHeaders(response);
      return response;
    }
    if (xgestaoSignup && isFirstLogin && dbUser.role === "empreiteiro") {
      await db
        .insert(userRoles)
        .values({ userId: dbUser.id, role: "xgestao", origem: "signup" })
        .onConflictDoNothing();
    }

    // Preparar dados do usuário para JWT
    const userData = {
      id: dbUser.id,
      email: dbUser.email,
      role: dbUser.role,
      name: dbUser.name,
      image: dbUser.image,
      avatarUrl: dbUser.avatarUrl ?? dbUser.image,
    };

    // Gerar tokens JWT
    const accessToken = createAccessToken(userData);
    const refreshToken = createRefreshToken(dbUser.id, true); // OAuth = remember me true (30 dias)

    // Criar resposta
    const response = NextResponse.json({
      success: true,
      user: userData,
    });

    // Configurar headers de segurança e cookies
    setNoCacheHeaders(response);
    createAuthCookies(response, accessToken, refreshToken, true); // OAuth sempre 30 dias

    // Limpar cookie de persona — já foi consumido
    response.cookies.set("x_signup_persona", "", { path: "/", maxAge: 0 });

    return response;

  } catch (error) {
    void logError("error", "Erro ao converter sessão OAuth", { stack: (error as Error)?.stack, route: "/api/auth/oauth-convert" });
    const response = NextResponse.json(
      { error: "Erro interno do servidor" },
      { status: 500 }
    );
    setNoCacheHeaders(response);
    return response;
  }
}
