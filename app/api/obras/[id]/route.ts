import { NextRequest, NextResponse } from "next/server";
import { deleteObra } from "@features/obras/api/obras-service";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const { id } = await params;
    await deleteObra(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
