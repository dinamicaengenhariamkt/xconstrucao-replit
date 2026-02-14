import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { auth } from "@/auth";

export async function DELETE(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

    const { id } = await params;
    await storage.deleteEmpreiteira(id);
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
