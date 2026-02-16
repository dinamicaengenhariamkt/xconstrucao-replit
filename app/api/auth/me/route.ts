import { NextRequest, NextResponse } from "next/server";
import { getUserByEmail, getUser, createUser, updateUserPassword, updateUserEmailVerified } from "@features/auth/api/auth-storage";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const user = await getUser(userId);
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });

    const { password: _, ...userData } = user;
    return NextResponse.json(userData);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
