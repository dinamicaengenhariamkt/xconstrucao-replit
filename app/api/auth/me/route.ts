import { NextRequest, NextResponse } from "next/server";
import { getUser } from "@features/auth/api/auth-storage";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { readImpersonationFromRequest } from "@features/auth/api/impersonation";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const actor = await getUser(payload.sub);
    if (!actor) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });

    let viewer = actor;
    let impersonation: null | {
      actorId: string;
      actorName: string;
      actorEmail: string;
      targetId: string;
      targetName: string;
      targetEmail: string;
      targetRole: string;
    } = null;

    const imp = readImpersonationFromRequest(request);
    if (imp && imp.actorId === actor.id && actor.role === "superadmin") {
      const target = await getUser(imp.targetId);
      if (target && target.ativo) {
        viewer = target;
        impersonation = {
          actorId: actor.id,
          actorName: actor.name,
          actorEmail: actor.email,
          targetId: target.id,
          targetName: target.name,
          targetEmail: target.email,
          targetRole: target.role,
        };
      }
    }

    const { password: _pw, ...userData } = viewer;
    return NextResponse.json({
      ...userData,
      mustChangePassword: viewer.mustChangePassword ?? false,
      ativo: viewer.ativo ?? true,
      canManageUsers:
        (viewer.role === "superadmin") || ((viewer as { canManageUsers?: boolean }).canManageUsers ?? false),
      impersonation,
    });
  } catch (error) {
    console.error("/api/auth/me error:", error);
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
