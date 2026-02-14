import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { auth } from "@/auth";
import { insertClienteSchema } from "@shared/schema";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = session.user.id;

    const clientes = await storage.getClientes();
    return NextResponse.json(clientes);
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
    const parsed = insertClienteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const cliente = await storage.createCliente(parsed.data);
    return NextResponse.json(cliente, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
