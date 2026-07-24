import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { clientes, empreiteiras, obras } from "@shared/db/schema";
import { criarSurveyNPSObraConcluida, criarSurveyCSATPagamento } from "./service";

/** Resolve o `users.id` do contratante dono de uma obra (via clientes). */
async function contratanteUserIdDaObra(obraId: string | null): Promise<string | null> {
  if (!obraId) return null;
  const [row] = await db
    .select({ userId: clientes.userId })
    .from(obras)
    .innerJoin(clientes, eq(clientes.id, obras.clienteId))
    .where(eq(obras.id, obraId))
    .limit(1);
  return row?.userId ?? null;
}

/**
 * J20 — Gatilho de NPS pós-conclusão de obra (J06).
 *
 * Chamado após qualquer mutação que POSSA ter concluído a obra (o PATCH genérico
 * de obras e as edições admin). Carrega o estado atual da obra e, se ela estiver
 * `concluida`, resolve os `users.id` das duas personas e dispara os convites.
 *
 * Seguro chamar em toda edição de obra concluída: a unique
 * `uq_surveys_tipo_persona_origem` garante idempotência (não duplica o convite),
 * e a notificação só dispara quando um convite NOVO é criado. Por isso não
 * exigimos o estado "antes" — a fonte de verdade é o banco.
 *
 * Best-effort: nunca lança (não pode quebrar a mutação que o chamou).
 */
export async function dispararSurveyObraConcluida(obraId: string): Promise<void> {
  try {
    const [obra] = await db
      .select({
        id: obras.id,
        status: obras.status,
        clienteId: obras.clienteId,
        empreiteiraId: obras.empreiteiraId,
      })
      .from(obras)
      .where(eq(obras.id, obraId))
      .limit(1);

    if (!obra || obra.status !== "concluida") return;

    const [contratanteUserId, empreiteiroUserId] = await Promise.all([
      obra.clienteId
        ? db
            .select({ userId: clientes.userId })
            .from(clientes)
            .where(eq(clientes.id, obra.clienteId))
            .limit(1)
            .then((r) => r[0]?.userId ?? null)
        : Promise.resolve(null),
      obra.empreiteiraId
        ? db
            .select({ userId: empreiteiras.userId })
            .from(empreiteiras)
            .where(eq(empreiteiras.id, obra.empreiteiraId))
            .limit(1)
            .then((r) => r[0]?.userId ?? null)
        : Promise.resolve(null),
    ]);

    await criarSurveyNPSObraConcluida({
      obraId,
      contratanteUserId,
      empreiteiroUserId,
    });
  } catch (err) {
    console.error("[surveys] falha no gatilho de obra concluída:", err);
  }
}

/**
 * J20 — Gatilho de CSAT pós-pagamento (J08). Chamado após a quitação de um
 * lançamento. Convida o pagador (contratante) e o recebedor (empreiteiro) a
 * avaliar a experiência de pagamento. Quando `pagadorUserId` vem null (lançamento
 * legado sem pagador explícito), resolve o contratante pela obra.
 *
 * Best-effort e idempotente (unique de origem por lançamento).
 */
export async function dispararSurveyPagamentoQuitado(args: {
  lancamentoId: string;
  obraId: string | null;
  pagadorUserId: string | null;
  recebedorUserId: string | null;
}): Promise<void> {
  try {
    const pagadorUserId =
      args.pagadorUserId ?? (await contratanteUserIdDaObra(args.obraId));

    await criarSurveyCSATPagamento({
      lancamentoId: args.lancamentoId,
      obraId: args.obraId,
      pagadorUserId,
      recebedorUserId: args.recebedorUserId,
    });
  } catch (err) {
    console.error("[surveys] falha no gatilho de pagamento quitado:", err);
  }
}
