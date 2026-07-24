import { and, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { surveys, surveyRespostas, type Survey } from "@shared/db/schema";
import { criarNotificacao } from "@features/notificacoes/service";

/**
 * J20 — Geração de convites de pesquisa (NPS/CSAT).
 *
 * Best-effort: nunca lança para não quebrar o fluxo gerador (conclusão de obra,
 * pagamento). A idempotência é garantida pela unique `uq_surveys_tipo_persona_origem`
 * — reenviar o mesmo evento (obraId/lancamentoId) não duplica o convite, graças ao
 * `onConflictDoNothing`.
 */

type SurveyPersona = "contratante" | "empreiteiro";

const HREF_PENDENTES: Record<SurveyPersona, string> = {
  contratante: "/contratante/notificacoes",
  empreiteiro: "/empreiteiro/notificacoes",
};

async function inserirSurvey(args: {
  tipo: "nps" | "csat";
  persona: SurveyPersona;
  userId: string;
  obraId: string | null;
  origemTipo: string;
  origemId: string;
  tituloNotificacao: string;
  descricaoNotificacao: string;
}): Promise<Survey | null> {
  try {
    const [row] = await db
      .insert(surveys)
      .values({
        tipo: args.tipo,
        persona: args.persona,
        userId: args.userId,
        obraId: args.obraId,
        origemTipo: args.origemTipo,
        origemId: args.origemId,
      })
      .onConflictDoNothing()
      .returning();

    // Só notifica quando um convite NOVO foi de fato criado (evita spam no reenvio).
    if (row) {
      await criarNotificacao({
        userId: args.userId,
        tipo: "lembrete",
        titulo: args.tituloNotificacao,
        descricao: args.descricaoNotificacao,
        href: HREF_PENDENTES[args.persona],
      });
    }
    return row ?? null;
  } catch (err) {
    console.error("[surveys] falha ao criar convite:", err);
    return null;
  }
}

/**
 * NPS pós-conclusão de obra (J06). Convida AMBAS as personas (contratante e
 * empreiteiro) a avaliar a experiência de 0 a 10. `empreiteiroUserId` pode ser
 * null (obra concluída sem empreiteiro vinculado) — nesse caso só o contratante
 * é convidado.
 */
export async function criarSurveyNPSObraConcluida(args: {
  obraId: string;
  contratanteUserId: string | null;
  empreiteiroUserId: string | null;
}): Promise<void> {
  const titulo = "Como foi sua experiência?";
  const descricao = "A obra foi concluída. Responda em 10 segundos e ajude a melhorar a plataforma.";

  if (args.contratanteUserId) {
    await inserirSurvey({
      tipo: "nps",
      persona: "contratante",
      userId: args.contratanteUserId,
      obraId: args.obraId,
      origemTipo: "obra_concluida",
      origemId: args.obraId,
      tituloNotificacao: titulo,
      descricaoNotificacao: descricao,
    });
  }
  if (args.empreiteiroUserId) {
    await inserirSurvey({
      tipo: "nps",
      persona: "empreiteiro",
      userId: args.empreiteiroUserId,
      obraId: args.obraId,
      origemTipo: "obra_concluida",
      origemId: args.obraId,
      tituloNotificacao: titulo,
      descricaoNotificacao: descricao,
    });
  }
}

/**
 * CSAT pós-pagamento (J08). Convida o pagador (contratante) e, quando houver, o
 * recebedor (empreiteiro) a avaliar a experiência de pagamento de 0 a 5. A
 * origem é o lançamento — cada quitação gera no máximo um convite por persona.
 */
export async function criarSurveyCSATPagamento(args: {
  lancamentoId: string;
  obraId: string | null;
  pagadorUserId: string | null;
  recebedorUserId: string | null;
}): Promise<void> {
  const titulo = "Como foi o pagamento?";
  const descricao = "Avalie sua experiência com o pagamento desta obra.";

  if (args.pagadorUserId) {
    await inserirSurvey({
      tipo: "csat",
      persona: "contratante",
      userId: args.pagadorUserId,
      obraId: args.obraId,
      origemTipo: "pagamento_quitado",
      origemId: args.lancamentoId,
      tituloNotificacao: titulo,
      descricaoNotificacao: descricao,
    });
  }
  if (args.recebedorUserId) {
    await inserirSurvey({
      tipo: "csat",
      persona: "empreiteiro",
      userId: args.recebedorUserId,
      obraId: args.obraId,
      origemTipo: "pagamento_quitado",
      origemId: args.lancamentoId,
      tituloNotificacao: titulo,
      descricaoNotificacao: descricao,
    });
  }
}

/** Convites pendentes de um usuário (card "responder pesquisa"). */
export async function listarSurveysPendentes(userId: string): Promise<Survey[]> {
  return db
    .select()
    .from(surveys)
    .where(and(eq(surveys.userId, userId), eq(surveys.status, "pendente")));
}

/**
 * Registra a resposta de um convite e marca o survey como respondido, numa única
 * transação. Retorna o status do resultado:
 *  - "ok": resposta gravada
 *  - "not_found": survey inexistente
 *  - "forbidden": survey de outro usuário
 *  - "already": survey já respondido/expirado
 *  - "out_of_range": nota fora da faixa do tipo
 */
export async function responderSurvey(args: {
  surveyId: string;
  userId: string;
  nota: number;
  comentario?: string | null;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<"ok" | "not_found" | "forbidden" | "already" | "out_of_range"> {
  const [survey] = await db
    .select()
    .from(surveys)
    .where(eq(surveys.id, args.surveyId))
    .limit(1);

  if (!survey) return "not_found";
  if (survey.userId !== args.userId) return "forbidden";
  if (survey.status !== "pendente") return "already";

  const max = survey.tipo === "nps" ? 10 : 5;
  if (!Number.isInteger(args.nota) || args.nota < 0 || args.nota > max) return "out_of_range";

  try {
    await db.transaction(async (tx) => {
      await tx.insert(surveyRespostas).values({
        surveyId: args.surveyId,
        nota: args.nota,
        comentario: args.comentario ?? null,
        ip: args.ip ?? null,
        userAgent: args.userAgent ?? null,
      });
      await tx
        .update(surveys)
        .set({ status: "respondido" })
        .where(eq(surveys.id, args.surveyId));
    });
    return "ok";
  } catch {
    // Corrida: a unique `uq_survey_respostas_survey` barra a segunda inserção
    // (respondeu em duas abas). Tratamos como "already".
    return "already";
  }
}
