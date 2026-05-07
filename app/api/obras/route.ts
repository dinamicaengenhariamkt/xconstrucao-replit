import { NextRequest, NextResponse } from "next/server";
import { getObras, createObra } from "@features/obras/api/obras-service";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { requireVerifiedUser } from "@features/auth/api/auth-utils";
import { insertObraSchema } from "@features/obras/schemas";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const obras = await getObras();
    return NextResponse.json(obras);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const guard = await requireVerifiedUser(request);
    if (guard.error) return guard.error;

    const body = await request.json();
    const parsed = insertObraSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const obra = await createObra(parsed.data);
    return NextResponse.json(obra, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
