import { NextRequest, NextResponse } from "next/server";
import { getFinanceiros, createFinanceiro } from "@features/financeiro/api/financeiro-service";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { insertFinanceiroSchema } from "@features/financeiro/schemas";
import { registrarAtividade } from "@features/atividades/api/registrar";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const financeiros = await getFinanceiros();
    return NextResponse.json(financeiros);
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const body = await request.json();
    const parsed = insertFinanceiroSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    }

    const financeiro = await createFinanceiro(parsed.data);

    // J07: registra lançamento criado manualmente (sem medição associada).
    // Hooks via medição aprovada ficam no endpoint de aprovar para garantir atomicidade.
    if (!(parsed.data as any).medicaoId) {
      void registrarAtividade({
        tipo: "lancamento_criado",
        actorUserId: userId,
        obraId: (parsed.data as any).obraId ?? null,
        payload: {
          lancamentoId: (financeiro as any).id,
          valor: Number((parsed.data as any).valor ?? 0),
          tipo: (parsed.data as any).tipo,
          origem: "manual",
        },
      });
    }

    return NextResponse.json(financeiro, { status: 201 });
  } catch (error) {
    return NextResponse.json({ message: "Erro interno do servidor" }, { status: 500 });
  }
}
