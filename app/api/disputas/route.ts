import { after, NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { financeiro, medicoes } from "@shared/db/schema";
import { requireVerifiedUser, setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { isRateLimited } from "@features/auth/api/rate-limit";
import { recordAudit } from "@features/auth/api/audit";
import { registrarAtividade } from "@features/atividades/api/registrar";
import { abrirDisputa, getPartesObra, listarDisputasDoUsuario } from "@features/disputas/disputas-service";
import { dispararNotificacaoDisputaAberta } from "@features/notificacoes/disputa-dispatcher";

const bodySchema = z.object({
  obraId: z.string().min(1),
  alvoTipo: z.enum(["medicao", "pagamento"]),
  alvoId: z.string().min(1),
  categoria: z
    .enum([
      "pagamento_atrasado",
      "medicao_rejeitada",
      "qualidade_obra",
      "descumprimento_prazo",
      "escopo_contrato",
      "outros",
    ])
    .optional(),
  prioridade: z.enum(["alta", "media", "baixa"]).optional(),
  titulo: z.string().trim().min(3).max(160),
  descricao: z.string().trim().min(10).max(2000),
  valorEnvolvido: z.number().nonnegative().optional().nullable(),
});

/** GET /api/disputas — disputas em que o usuário autenticado é parte. */
export async function GET(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;
  const rows = await listarDisputasDoUsuario(guard.user.id);
  const r = NextResponse.json(rows);
  setNoCacheHeaders(r);
  return r;
}

/** POST /api/disputas — abre uma disputa sobre uma medição ou pagamento da obra. */
export async function POST(request: NextRequest) {
  const guard = await requireVerifiedUser(request);
  if (guard.error) return guard.error;

  if (isRateLimited(`disputas.abrir:user:${guard.user.id}`, 20, 60 * 1000)) {
    const r = NextResponse.json({ message: "Muitas requisições. Aguarde um minuto." }, { status: 429 });
    setNoCacheHeaders(r);
    return r;
  }

  const body = await request.json().catch(() => ({}));
  const parsed = bodySchema.safeParse(body);
  if (!parsed.success) {
    const r = NextResponse.json({ message: "Dados inválidos.", errors: parsed.error.flatten() }, { status: 400 });
    setNoCacheHeaders(r);
    return r;
  }

  // Ownership: usuário precisa ser parte da obra.
  const partes = await getPartesObra(parsed.data.obraId);
  if (!partes || (partes.contratanteUserId !== guard.user.id && partes.empreiteiroUserId !== guard.user.id)) {
    const r = NextResponse.json({ message: "Você não participa desta obra." }, { status: 403 });
    setNoCacheHeaders(r);
    return r;
  }

  // O alvo precisa pertencer à obra informada.
  if (parsed.data.alvoTipo === "medicao") {
    const [m] = await db.select({ obraId: medicoes.obraId }).from(medicoes).where(eq(medicoes.id, parsed.data.alvoId)).limit(1);
    if (!m || m.obraId !== parsed.data.obraId) {
      const r = NextResponse.json({ message: "Medição inválida para esta obra." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
  } else {
    const [f] = await db.select({ obraId: financeiro.obraId }).from(financeiro).where(eq(financeiro.id, parsed.data.alvoId)).limit(1);
    if (!f || f.obraId !== parsed.data.obraId) {
      const r = NextResponse.json({ message: "Lançamento inválido para esta obra." }, { status: 400 });
      setNoCacheHeaders(r);
      return r;
    }
  }

  const result = await abrirDisputa({
    obraId: parsed.data.obraId,
    abertaPorUserId: guard.user.id,
    alvoTipo: parsed.data.alvoTipo,
    alvoId: parsed.data.alvoId,
    categoria: parsed.data.categoria,
    prioridade: parsed.data.prioridade,
    titulo: parsed.data.titulo,
    descricao: parsed.data.descricao,
    valorEnvolvido: parsed.data.valorEnvolvido ?? null,
  });

  if (!result.ok) {
    const r = NextResponse.json(
      { message: "Já existe uma disputa aberta sobre este item.", disputaId: result.disputaId },
      { status: 409 },
    );
    setNoCacheHeaders(r);
    return r;
  }

  const d = result.disputa;
  void recordAudit({
    actorId: guard.user.id,
    action: "disputas.abrir",
    targetUserId: d.contraparteUserId,
    payload: { disputaId: d.id, obraId: d.obraId, alvoTipo: d.alvoTipo, alvoId: d.alvoId },
    request,
  });
  void registrarAtividade({
    tipo: "disputa_aberta",
    actorUserId: guard.user.id,
    obraId: d.obraId,
    targetUserId: d.contraparteUserId,
    payload: { disputaId: d.id, alvoTipo: d.alvoTipo, alvoId: d.alvoId, titulo: d.titulo },
  });
  after(() => dispararNotificacaoDisputaAberta({ disputaId: d.id }));

  const r = NextResponse.json(d, { status: 201 });
  setNoCacheHeaders(r);
  return r;
}
