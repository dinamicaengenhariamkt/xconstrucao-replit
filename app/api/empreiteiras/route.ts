import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@/server/auth";
import { requireVerifiedUser } from "@features/auth/api/auth-utils";
import { insertEmpreiteiraSchema } from "@shared/db/schema";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const empreiteiras = await storage.getEmpreiteiras();
    return NextResponse.json(empreiteiras);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireVerifiedUser(request);
    if (guard.error) return guard.error;

    const body = await request.json();
    const parsed = insertEmpreiteiraSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const empreiteira = await storage.createEmpreiteira(parsed.data);
    return NextResponse.json(empreiteira, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
