import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userFiles } from "@shared/db/schema";

/**
 * XG12 — valida que o comprovante anexado ao lançamento pertence a quem o anexa.
 *
 * O campo `comprovanteFileId` era aceito pela API desde a XG10, mas nenhuma UI
 * o preenchia — o caminho existia sem ser exercitado. Com o upload de nota
 * fiscal no `LancamentoFinanceiroModal`, ele passa a receber entrada do usuário
 * e precisa da mesma checagem que a rota irmã de quitação já fazia
 * (`app/api/contratante/pagamentos/[id]/quitar/route.ts`).
 *
 * Sem isso, alguém poderia referenciar o `fileId` de um arquivo alheio no
 * próprio lançamento. Não vazaria o conteúdo — `/api/uploads/sign` checa o dono
 * antes de assinar —, mas criaria FK entre tenants: com `onDelete: "set null"`,
 * o ciclo de vida do arquivo de um usuário passaria a afetar a linha de outro.
 *
 * Retorna `null` quando está tudo certo, ou a mensagem do erro 400.
 */
export async function validarComprovante(
  comprovanteFileId: string | null | undefined,
  userId: string,
): Promise<string | null> {
  if (!comprovanteFileId) return null;

  const [file] = await db
    .select({
      id: userFiles.id,
      kind: userFiles.kind,
      ownerUserId: userFiles.ownerUserId,
      deletedAt: userFiles.deletedAt,
    })
    .from(userFiles)
    .where(eq(userFiles.id, comprovanteFileId));

  if (!file || file.deletedAt) return "Comprovante não encontrado.";
  if (file.ownerUserId !== userId) return "Comprovante inválido.";
  if (file.kind !== "comprovante_pagamento") return "Comprovante inválido.";

  return null;
}
