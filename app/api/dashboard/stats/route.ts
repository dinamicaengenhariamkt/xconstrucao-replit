import { NextRequest, NextResponse } from "next/server";
import { storage } from "@/server/storage";
import { getUserIdFromRequest } from "@/server/auth";

export async function GET(request: NextRequest) {
  try {
    const userId = getUserIdFromRequest(request.headers.get("cookie"));
    if (!userId) return NextResponse.json({ message: "Não autenticado" }, { status: 401 });

    const stats = await storage.getDashboardStats();
    return NextResponse.json(stats);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
