/**
 * Endpoint test-only para inspecionar emails capturados em modo de teste.
 * Disponível APENAS quando EMAIL_TEST_MODE=1 (vide shared/lib/test-email-store.ts).
 *
 * Usado pelos testes Playwright em tests/e2e/ para extrair o link de verificação
 * sem precisar de SMTP / Brevo real.
 *
 *   GET    /api/test/emails?to=...   -> lista emails capturados (filtro opcional)
 *   DELETE /api/test/emails          -> limpa o store em memória
 */

import { NextRequest, NextResponse } from "next/server";
import { clearTestEmails, isEmailTestMode, listTestEmails } from "@shared/lib/test-email-store";
import { ehProducao } from "@shared/lib/rotas-teste";

// REV-12: em produção responde 404 mesmo com EMAIL_TEST_MODE ligado.
function habilitada(): boolean {
  return !ehProducao() && isEmailTestMode();
}

function disabledResponse(): NextResponse {
  return NextResponse.json(
    { error: "EMAIL_TEST_MODE não está habilitado neste ambiente." },
    { status: 404 }
  );
}

export async function GET(request: NextRequest) {
  if (!habilitada()) return disabledResponse();
  const to = request.nextUrl.searchParams.get("to") ?? undefined;
  const emails = listTestEmails(to ? { to } : undefined);
  return NextResponse.json({ emails }, { headers: { "Cache-Control": "no-store" } });
}

export async function DELETE() {
  if (!habilitada()) return disabledResponse();
  clearTestEmails();
  return NextResponse.json({ success: true });
}
