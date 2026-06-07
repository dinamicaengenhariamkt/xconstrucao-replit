import { NextRequest, NextResponse } from "next/server";
import { getVersaoVigente, type LegalTipo } from "@features/legal/legal-service";

const TIPOS_VALIDOS: LegalTipo[] = ["termos", "privacidade"];

/** GET /api/legal/[tipo] — público: versão vigente de termos/privacidade. */
export async function GET(_request: NextRequest, { params }: { params: Promise<{ tipo: string }> }) {
  const { tipo } = await params;
  if (!TIPOS_VALIDOS.includes(tipo as LegalTipo)) {
    return NextResponse.json({ message: "Tipo inválido" }, { status: 400 });
  }
  const doc = await getVersaoVigente(tipo as LegalTipo);
  if (!doc) {
    return NextResponse.json({ message: "Documento não encontrado" }, { status: 404 });
  }
  const r = NextResponse.json({
    tipo: doc.tipo,
    versao: doc.versao,
    titulo: doc.titulo,
    conteudo: doc.conteudo,
    vigenteEm: doc.vigenteEm,
  });
  // Cache curto (conteúdo legal muda raramente).
  r.headers.set("Cache-Control", "public, max-age=300");
  return r;
}
