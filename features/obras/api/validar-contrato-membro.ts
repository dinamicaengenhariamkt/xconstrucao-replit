import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userFiles } from "@shared/db/schema";

/**
 * XG22 — valida que o contrato anexado ao prestador pertence a quem o anexa.
 *
 * Espelha `features/financeiro/api/validar-comprovante.ts`, pelo mesmo motivo de
 * segurança: sem a checagem, alguém poderia referenciar o `fileId` de um arquivo
 * alheio no próprio membro da equipe. Não vazaria o conteúdo — `/api/uploads/sign`
 * confere o dono antes de assinar —, mas criaria FK entre tenants, e com
 * `ON DELETE SET NULL` o ciclo de vida do arquivo de um usuário passaria a
 * afetar a linha de outro.
 *
 * O `kind` esperado é `obra_anexo`, reusado de propósito em vez de um kind novo:
 * ele já aceita PDF, já tem quota por obra e roles corretos. A lista de kinds
 * vive replicada em nove lugares (ver o comentário em
 * `shared/lib/storage/key-builder.ts`), e divergi-la já quebrou upload em
 * produção uma vez.
 *
 * Retorna `null` quando está tudo certo, ou a mensagem do erro 400.
 */
export async function validarContratoMembro(
  contratoFileId: string | null | undefined,
  userId: string,
): Promise<string | null> {
  if (!contratoFileId) return null;

  const [file] = await db
    .select({
      id: userFiles.id,
      kind: userFiles.kind,
      ownerUserId: userFiles.ownerUserId,
      deletedAt: userFiles.deletedAt,
    })
    .from(userFiles)
    .where(eq(userFiles.id, contratoFileId));

  if (!file || file.deletedAt) return "Contrato não encontrado.";
  if (file.ownerUserId !== userId) return "Contrato inválido.";
  if (file.kind !== "obra_anexo") return "Contrato inválido.";

  return null;
}
