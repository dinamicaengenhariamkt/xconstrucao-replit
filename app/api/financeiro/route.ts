import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { getUserIdFromRequest } from "@/server/auth";
import { insertFinanceiroSchema } from "@shared/schema";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request.headers.get("cookie"));
    if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const financeiros = await storage.getFinanceiros();
    return NextResponse.json(financeiros);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request.headers.get("cookie"));
    if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const body = await request.json();
    const parsed = insertFinanceiroSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const financeiro = await storage.createFinanceiro(parsed.data);
    return NextResponse.json(financeiro, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
