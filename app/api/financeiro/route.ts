import { NextRequest, NextResponse } from "next/server";
import { getFinanceiros, createFinanceiro } from "@features/financeiro/api/financeiro-service";
import { getAccessTokenFromCookieHeader, verifyAccessToken } from "@features/auth/api/auth-service";
import { insertFinanceiroSchema } from "@features/financeiro/schemas";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { findObraAccess, canWriteObraContent } from "@features/obras/api/access";

export async function GET(request: NextRequest) {
  try {
    const token = getAccessTokenFromCookieHeader(request.headers.get("cookie"));
    const payload = token ? verifyAccessToken(token) : null;

    if (!payload?.sub) {
      return NextResponse.json({ message: "Não autenticado" }, { status: 401 });
    }
    const userId = payload.sub;

    const financeiros = await getFinanceiros();
    if (payload.role === "admin" || payload.role === "superadmin") {
      return NextResponse.json(financeiros);
    }

    // A rota legada retornava a tabela financeira inteira para qualquer sessão
    // autenticada. Limitar ao conjunto de obras efetivamente acessível também
    // aplica os grants individuais do xgestão (incluindo somente leitura).
    const workIds = [...new Set(financeiros.map((row) => row.obraId).filter((id): id is string => Boolean(id)))];
    const accessEntries = await Promise.all(workIds.map(async (obraId) => [
      obraId,
      await findObraAccess(obraId, { id: userId, role: payload.role }),
    ] as const));
    const readable = new Set(accessEntries.filter(([, access]) => access).map(([obraId]) => obraId));
    return NextResponse.json(financeiros.filter((row) => row.obraId && readable.has(row.obraId)));
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

    // XG10 (segurança) — até aqui a rota só exigia estar autenticado e repassava
    // o payload ao insert: qualquer usuário logado podia lançar despesa ou
    // receita em QUALQUER obra, informando um `obraId` alheio. Lançamento de
    // obra agora exige o mesmo acesso de escrita dos demais conteúdos.
    const obraIdAlvo = (parsed.data as { obraId?: string | null }).obraId ?? null;
    if (obraIdAlvo) {
      const access = await findObraAccess(obraIdAlvo, { id: userId, role: payload.role });
      if (!access || !canWriteObraContent(access)) {
        // 404 em vez de 403: quem não tem acesso à obra não deve nem confirmar
        // que ela existe.
        return NextResponse.json({ message: "Obra não encontrada" }, { status: 404 });
      }
    } else if (payload.role !== "admin" && payload.role !== "superadmin") {
      return NextResponse.json({ message: "Lançamentos precisam estar vinculados a uma obra autorizada." }, { status: 403 });
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
