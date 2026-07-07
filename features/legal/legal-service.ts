import { and, desc, eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { legalDocuments, userConsents, type LegalDocument } from "@shared/db/schema";

/**
 * J28 — Serviço de documentos legais versionados. Lê a versão vigente (pública),
 * lista o histórico (admin), publica novas versões e registra re-consentimento.
 */

export type LegalTipo = "termos" | "privacidade";

/** Versão vigente (ativa, maior versão) de um tipo. */
export async function getVersaoVigente(tipo: LegalTipo): Promise<LegalDocument | null> {
  const [row] = await db
    .select()
    .from(legalDocuments)
    .where(and(eq(legalDocuments.tipo, tipo), eq(legalDocuments.ativo, true)))
    .orderBy(desc(legalDocuments.versao))
    .limit(1);
  return row ?? null;
}

/** Histórico de versões de um tipo (admin). */
export async function listarVersoes(tipo?: LegalTipo): Promise<LegalDocument[]> {
  const where = tipo ? eq(legalDocuments.tipo, tipo) : undefined;
  return db.select().from(legalDocuments).where(where).orderBy(desc(legalDocuments.criadoEm));
}

/** Publica uma nova versão (versão = maior atual + 1). Marca como vigente. */
export async function publicarVersao(args: {
  tipo: LegalTipo;
  titulo: string;
  conteudo: string;
  vigenteEm?: Date | null;
  criadoPor: string;
}): Promise<LegalDocument> {
  return db.transaction(async (tx) => {
    const [atual] = await tx
      .select({ versao: legalDocuments.versao })
      .from(legalDocuments)
      .where(eq(legalDocuments.tipo, args.tipo))
      .orderBy(desc(legalDocuments.versao))
      .limit(1);
    const novaVersao = (atual?.versao ?? 0) + 1;
    const [row] = await tx
      .insert(legalDocuments)
      .values({
        tipo: args.tipo,
        versao: novaVersao,
        titulo: args.titulo,
        conteudo: args.conteudo,
        vigenteEm: args.vigenteEm ?? new Date(),
        ativo: true,
        criadoPor: args.criadoPor,
      })
      .returning();
    return row;
  });
}

/**
 * Verifica, para um usuário, quais documentos têm versão vigente MAIOR que a aceita
 * (pendência de re-consentimento). Compara como número (versao TEXT do consent vs INT).
 */
export async function pendenciasReconsent(userId: string): Promise<
  Array<{ tipo: LegalTipo; versaoVigente: number; versaoAceita: number | null }>
> {
  const tipos: LegalTipo[] = ["termos", "privacidade"];
  const pendencias: Array<{ tipo: LegalTipo; versaoVigente: number; versaoAceita: number | null }> = [];
  for (const tipo of tipos) {
    const vigente = await getVersaoVigente(tipo);
    if (!vigente) continue;
    const consents = await db
      .select({ versao: userConsents.versao })
      .from(userConsents)
      .where(and(eq(userConsents.userId, userId), eq(userConsents.documento, tipo)));
    // Maior versão aceita (parse tolerante: "1.0" → 1, "2" → 2).
    let versaoAceita: number | null = null;
    for (const c of consents) {
      const n = Math.floor(Number(c.versao));
      if (Number.isFinite(n)) versaoAceita = versaoAceita === null ? n : Math.max(versaoAceita, n);
    }
    if (versaoAceita === null || versaoAceita < vigente.versao) {
      pendencias.push({ tipo, versaoVigente: vigente.versao, versaoAceita });
    }
  }
  return pendencias;
}

/** Registra o re-consentimento do usuário para a versão vigente de um tipo. */
export async function registrarConsentimento(args: {
  userId: string;
  tipo: LegalTipo;
  ip?: string | null;
  userAgent?: string | null;
}): Promise<boolean> {
  const vigente = await getVersaoVigente(args.tipo);
  if (!vigente) return false;
  await db
    .insert(userConsents)
    .values({
      userId: args.userId,
      documento: args.tipo,
      versao: String(vigente.versao),
      ip: args.ip ?? null,
      userAgent: args.userAgent ?? null,
    })
    .onConflictDoNothing({
      target: [userConsents.userId, userConsents.documento, userConsents.versao],
    });
  return true;
}
