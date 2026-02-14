import { NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { auth } from "@/auth";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

    const user = await storage.getUser(userId);
    if (!user) return NextResponse.json({ message: "Usuário não encontrado" }, { status: 404 });

    const { password: _, ...userData } = user;
    return NextResponse.json(userData);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
