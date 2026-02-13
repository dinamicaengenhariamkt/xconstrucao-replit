import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { getUserIdFromRequest } from "@/server/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = getUserIdFromRequest(request.headers.get("cookie"));
    if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const { id } = await params;
    await storage.deleteCliente(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
