import { NextRequest, NextResponse } from "next/server";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { requireVerifiedUser } from "@features/auth/api/auth-utils";
import { storage } from "@/server/storage";
import { insertCandidaturaSchema } from "@shared/db/schema";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }

    const candidaturas = await storage.getCandidaturas(payload.sub);
    return NextResponse.json(candidaturas);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireVerifiedUser(request);
    if (guard.error) return guard.error;
    const userId = guard.user.id;

    const body = await request.json();
    const data = {
      ...body,
      empreiteiroId: userId,
    };

    const parsed = insertCandidaturaSchema.safeParse(data);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const existing = await storage.getCandidaturaByObraAndEmpreiteiro(parsed.data.obraId!, userId);
    if (existing) {
      return NextResponse.json({ message: "Você já se candidatou a esta obra" }, { status: 409 });
    }

    const candidatura = await storage.createCandidatura(parsed.data);
    return NextResponse.json(candidatura, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
