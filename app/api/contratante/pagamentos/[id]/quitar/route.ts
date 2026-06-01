import { NextRequest, NextResponse } from "next/server";
import { eq } from "drizzle-orm";
import { z } from "zod";
import { db } from "@shared/db/db";
import { userFiles, users } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import {
  getLancamento,
  isContratanteOwnerOfLancamento,
  quitarLancamento,
} from "@features/financeiro/lancamentos-service";
import { createSignedReadUrl } from "@shared/lib/storage";
import { criarNotificacao } from "@features/notificacoes/service";
import { sendPagamentoRecebidoEmail } from "@shared/lib/email";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { temDisputaAtivaNoAlvo } from "@features/disputas/disputas-service";

const bodySchema = z.object({
  metodoPagamento: z.string().trim().min(2).max(80),
  dataPagamento: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  comprovanteFileId: z.string().min(8).max(80).nullable().optional(),
});

export async function POST(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  if (guard.user.role !== "contratante" && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  const { id } = await ctx.params;
  const lanc = await getLancamento(id);
  if (!lanc) {
    const r = NextResponse.json({ error: "NOT_FOUND" }, { status: 404 });
    setNoCacheHeaders(r);
    return r;
  }

  const owns = await isContratanteOwnerOfLancamento(lanc, guard.user.id);
  if (!owns && guard.user.role !== "superadmin") {
    const r = NextResponse.json({ error: "FORBIDDEN" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  if (lanc.status === "pago") {
    const r = NextResponse.json({ error: "ALREADY_PAID" }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }

  // J10 — pagamento sob disputa ativa fica congelado até a resolução do admin.
  if (await temDisputaAtivaNoAlvo("pagamento", id)) {
    const r = NextResponse.json({ error: "EM_DISPUTA" }, { status: 409 });
    setNoCacheHeaders(r);
    return r;
  }

  const parsed = bodySchema.safeParse(await request.json().catch(() => ({})));
  if (!parsed.success) {
    const r = NextResponse.json({ error: "INVALID", details: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  let comprovanteUrl: string | null = null;
  if (parsed.data.comprovanteFileId) {
    const [file] = await db
      .select({ ownerUserId: userFiles.ownerUserId, key: userFiles.bucketKey, name: userFiles.originalName, kind: userFiles.kind })
      .from(userFiles)
      .where(eq(userFiles.id, parsed.data.comprovanteFileId))
      .limit(1);
    if (!file || file.kind !== "comprovante_pagamento" || file.ownerUserId !== guard.user.id) {
      const r = NextResponse.json({ error: "INVALID_COMPROVANTE" }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
    comprovanteUrl = await createSignedReadUrl({ key: file.key, filename: file.name });
  }

  const updated = await quitarLancamento({
    id,
    metodoPagamento: parsed.data.metodoPagamento,
    dataPagamento: parsed.data.dataPagamento,
    comprovanteFileId: parsed.data.comprovanteFileId ?? null,
    comprovanteUrl,
  });

  // Notifica o empreiteiro recebedor (in-app + email best-effort)
  try {
    const recebedorId = updated?.recebedorUserId ?? lanc.recebedorUserId;
    if (recebedorId) {
      const valorNum = Number(updated?.valor ?? lanc.valor);
      const valorFormatado = new Intl.NumberFormat("pt-BR", {
        style: "currency",
        currency: "BRL",
      }).format(Number.isFinite(valorNum) ? valorNum : 0);
      const obraNome = updated?.obraNome ?? lanc.obraNome ?? "sua obra";
      const obraId = updated?.obraId ?? lanc.obraId;
      const href = obraId
        ? `/empreiteiro/minhas-obras/${obraId}`
        : `/empreiteiro/pagamentos`;
      const dataPagamento = updated?.dataPagamento ?? new Date().toISOString().slice(0, 10);

      await criarNotificacao({
        userId: recebedorId,
        tipo: "sucesso",
        titulo: "Pagamento recebido",
        descricao: `O contratante quitou ${valorFormatado} referente à obra ${obraNome}.`,
        href,
      });

      const [recebedor] = await db
        .select({ name: users.name, email: users.email })
        .from(users)
        .where(eq(users.id, recebedorId))
        .limit(1);

      if (recebedor?.email) {
        const baseUrl = process.env.NEXT_PUBLIC_BASE_URL ?? "";
        const link = baseUrl ? `${baseUrl}${href}` : href;
        await sendPagamentoRecebidoEmail(recebedor.email, {
          empreiteiroNome: recebedor.name ?? "Empreiteiro",
          obraNome,
          valorFormatado,
          metodoPagamento: parsed.data.metodoPagamento,
          dataPagamento,
          link,
        }).catch((err) => {
          console.error("[pagamentos.quitar] falha ao enviar email ao empreiteiro:", err);
        });
      }
    }
  } catch (err) {
    console.error("[pagamentos.quitar] falha ao notificar empreiteiro:", err);
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "pagamentos.quitar",
    payload: {
      lancamentoId: id,
      obraId: lanc.obraId,
      valor: lanc.valor,
      metodoPagamento: parsed.data.metodoPagamento,
      hasComprovante: !!parsed.data.comprovanteFileId,
    },
    request,
  });
  void registrarAtividade({
    tipo: "lancamento_quitado",
    actorUserId: guard.user.id,
    obraId: lanc.obraId,
    targetUserId: updated?.recebedorUserId ?? lanc.recebedorUserId ?? null,
    payload: {
      lancamentoId: id,
      valor: Number(updated?.valor ?? lanc.valor),
      metodoPagamento: parsed.data.metodoPagamento,
      medicaoId: lanc.medicaoId,
    },
  });

  const r = NextResponse.json({ ok: true, lancamento: updated });
  setNoCacheHeaders(r);
  return r;
}
