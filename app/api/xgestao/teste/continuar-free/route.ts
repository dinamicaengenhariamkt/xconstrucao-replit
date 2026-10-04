import { NextRequest } from "next/server";
import { confirmarContinuarFree } from "@features/xgestao/teste/server/teste-service";
import { jsonSemCache, requireResponsavelPlanoXgestao } from "@features/xgestao/teste/server/guard";

/** POST /api/xgestao/teste/continuar-free — XG35: responde ao aviso de fim do teste. */
export async function POST(request: NextRequest) {
  const ctx = await requireResponsavelPlanoXgestao(request);
  if (ctx.error) return ctx.error;
  const ok = await confirmarContinuarFree(ctx.userId);
  if (!ok) return jsonSemCache({ message: "Nenhum teste encerrado para confirmar." }, 404);
  return jsonSemCache({ ok: true });
}
