import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import { isRateLimited, getClientIp } from "@features/auth/api/rate-limit";
import { isMarketplaceSplitEnabled } from "@features/marketplace/flags";
import {
  criarOuAtualizarSubconta,
  getSubconta,
  type DadosRecebimento,
} from "@features/marketplace/subconta-service";

/**
 * J45 — Onboarding da subconta Asaas do empreiteiro (dados de recebimento).
 * GET: status atual (onboarding/KYC) para a tela.
 * POST: cria/atualiza a subconta (guard empreiteiro; exige cpf_cnpj no perfil).
 * Gate: MARKETPLACE_SPLIT=on + PAYMENT_GATEWAY=asaas.
 */

const bodySchema = z
  .object({
    tipoConta: z.enum(["PIX", "TED"]),
    pixChave: z.string().trim().optional(),
    pixTipo: z.string().trim().optional(),
    bancoCodigo: z.string().trim().optional(),
    agencia: z.string().trim().optional(),
    conta: z.string().trim().optional(),
    contaDigito: z.string().trim().optional(),
    contaTipo: z.string().trim().optional(),
    titularNome: z.string().trim().optional(),
    titularCpfCnpj: z.string().trim().optional(),
    mobilePhone: z.string().trim().optional(),
    incomeValue: z.number().positive().optional(),
  })
  .superRefine((data, ctx) => {
    if (data.tipoConta === "PIX" && !data.pixChave) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["pixChave"], message: "Chave PIX obrigatória" });
    }
    if (data.tipoConta === "TED" && (!data.bancoCodigo || !data.agencia || !data.conta)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, path: ["conta"], message: "Dados bancários incompletos" });
    }
  });

function guardEmpreiteiro(role: string): NextResponse | null {
  if (role !== "empreiteiro") {
    const r = NextResponse.json({ message: "Perfil sem acesso" }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }
  return null;
}

export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const roleErr = guardEmpreiteiro(guard.user.role);
  if (roleErr) return roleErr;

  if (!isMarketplaceSplitEnabled()) {
    const r = NextResponse.json({ enabled: false, subconta: null });
    setNoCacheHeaders(r);
    return r;
  }

  const subconta = await getSubconta(guard.user.id);
  const r = NextResponse.json({ enabled: true, subconta });
  setNoCacheHeaders(r);
  return r;
}

export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const roleErr = guardEmpreiteiro(guard.user.role);
  if (roleErr) return roleErr;

  const ip = getClientIp(request);
  if (isRateLimited(`recebimento.subconta:${guard.user.id}`, 10, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }
  if (isRateLimited(`recebimento.subconta.ip:${ip}`, 30, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  const result = await criarOuAtualizarSubconta(guard.user.id, parsed.data as DadosRecebimento);

  if (!result.ok) {
    const status = result.code === "PERFIL_INCOMPLETO" ? 422 : result.code === "SPLIT_DESABILITADO" ? 403 : 500;
    const message =
      result.code === "PERFIL_INCOMPLETO"
        ? result.detail
        : result.code === "SPLIT_DESABILITADO"
          ? "Recebimento indisponível no momento."
          : "Não foi possível configurar o recebimento. Tente novamente.";
    const r = NextResponse.json({ message, code: result.code }, { status });
    setNoCacheHeaders(r);
    return r;
  }

  await recordAudit({
    actorId: guard.user.id,
    action: "recebimento.subconta.upsert",
    targetUserId: null,
    payload: { tipoConta: parsed.data.tipoConta, onboardingStatus: result.subconta.onboardingStatus },
    request,
  });

  const r = NextResponse.json({ ok: true, subconta: result.subconta });
  setNoCacheHeaders(r);
  return r;
}
