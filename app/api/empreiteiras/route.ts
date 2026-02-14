import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { auth } from "@/auth";
import { insertEmpreiteiraSchema } from "@shared/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

    const empreiteiras = await storage.getEmpreiteiras();
    return NextResponse.json(empreiteiras);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

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
