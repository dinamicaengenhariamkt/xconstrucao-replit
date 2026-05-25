import { db } from "@shared/db/db";
import { atividades, type AtividadeTipo } from "@shared/db/schema";

type DbOrTx = typeof db | Parameters<Parameters<typeof db.transaction>[0]>[0];

export interface RegistrarAtividadeArgs {
  tipo: AtividadeTipo;
  actorUserId: string | null;
  obraId?: string | null;
  targetUserId?: string | null;
  payload?: Record<string, unknown>;
  tx?: DbOrTx;
}

/**
 * Helper genérico para gravar um evento no feed J07.
 *
 * - Aceita `tx?` opcional para participar de transações atômicas (padrão Task #82).
 *   Em endpoints transacionais (ex: aprovar medição), passe `tx` para que a
 *   atividade só persista se a transação inteira commitar.
 * - Em fluxos não-transacionais usa `db` direto e nunca lança — falha silenciosa
 *   no log (atividade é metadados, não pode quebrar o fluxo gerador).
 *
 * Sem audit aqui — esse evento já é o "audit" de domínio. audit_logs continua
 * gravando a trilha técnica em paralelo nos endpoints que já o faziam.
 */
export async function registrarAtividade(args: RegistrarAtividadeArgs): Promise<void> {
  const client = (args.tx ?? db) as typeof db;
  try {
    await client.insert(atividades).values({
      tipo: args.tipo,
      actorUserId: args.actorUserId,
      obraId: args.obraId ?? null,
      targetUserId: args.targetUserId ?? null,
      payload: (args.payload ?? {}) as Record<string, unknown>,
    });
  } catch (err) {
    // Quando dentro de transação, propagar para que a tx faça rollback
    // (mantém invariante "gerador + atividade são atômicos"). Fora de transação,
    // só logar — feed não pode quebrar o fluxo principal.
    if (args.tx) throw err;
    console.error("[registrarAtividade] falha:", err);
  }
}
