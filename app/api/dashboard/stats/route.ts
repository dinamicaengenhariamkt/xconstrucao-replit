import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@/server/auth";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const stats = await storage.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
