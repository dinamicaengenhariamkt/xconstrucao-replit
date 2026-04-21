import { NextRequest, NextResponse } from "next/server";
import { db } from "@shared/db/db";
import { marketplaceLeads, marketplaceLeadSchema } from "@shared/db/schema";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";

export async function POST(request: NextRequest) {
  const ip = getClientIp(request);
  if (isRateLimited(`marketplace-lead:${ip}`, 5, 60 * 60 * 1000)) {
    return NextResponse.json(
      { message: "Muitas tentativas. Tente novamente em alguns minutos." },
      { status: 429 }
    );
  }

  try {
    const body = await request.json();
    const parsed = marketplaceLeadSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Dados inválidos", errors: parsed.error.flatten() },
        { status: 400 }
      );
    }

    const [lead] = await db
      .insert(marketplaceLeads)
      .values({
        nome: parsed.data.nome,
        email: parsed.data.email,
        telefone: parsed.data.telefone,
        isWhatsapp: parsed.data.isWhatsapp,
      })
      .returning({ id: marketplaceLeads.id });

    return NextResponse.json({ success: true, id: lead.id }, { status: 201 });
  } catch (error) {
    console.error("Erro ao registrar lead do marketplace:", error);
    return NextResponse.json(
      { message: "Erro interno do servidor" },
      { status: 500 }
    );
  }
}
