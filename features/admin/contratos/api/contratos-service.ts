import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { userConsents, users } from '@shared/db/schema';
import { getVersaoVigente } from '@features/legal/legal-service';
import { CONTRATO_DOCUMENTOS } from '../constants';
import type { ContratoAceite, ContratoDocumento, ContratoKpi } from '../types';

const LISTA_LIMIT = 500;

/**
 * J60 — lista os aceites registrados (fonte: `user_consents`), com nome/email do
 * usuário. Hoje restrito aos documentos com semântica de "contrato" (`CONTRATO_DOCUMENTOS`,
 * = Termo do Anunciante). Filtro opcional por `documento` e busca por nome/email.
 *
 * Sem mock — dado 100% real de `user_consents` LEFT JOIN `users` (padrão de join
 * da auditoria). IP é retornado para a tela admin (gated); userAgent fica de fora
 * da listagem (dado sensível de auditoria).
 *
 * TODO(J58→J60): quando a J58 (contrato entre-partes contratante↔empreiteiro)
 * existir, agregar aqui os registros dessa fonte e ampliar CONTRATO_DOCUMENTOS /
 * o filtro por tipo. A tela já filtra por `documento` e traz `role`, então não
 * precisa refazer a UI — só plugar a nova fonte neste ponto. (grep "J58→J60")
 */
export async function listarAceites(filtros?: {
  documento?: ContratoDocumento;
  q?: string;
}): Promise<ContratoAceite[]> {
  const docsPermitidos = filtros?.documento
    ? [filtros.documento].filter((d) => CONTRATO_DOCUMENTOS.includes(d))
    : CONTRATO_DOCUMENTOS;
  if (docsPermitidos.length === 0) return [];

  const conds = [inArray(userConsents.documento, docsPermitidos)];
  const q = filtros?.q?.trim();
  if (q) {
    const like = `%${q}%`;
    conds.push(or(ilike(users.name, like), ilike(users.email, like))!);
  }

  const rows = await db
    .select({
      id: userConsents.id,
      userId: userConsents.userId,
      documento: userConsents.documento,
      versao: userConsents.versao,
      aceitoEm: userConsents.aceitoEm,
      ip: userConsents.ip,
      nome: users.name,
      email: users.email,
      role: users.role,
    })
    .from(userConsents)
    .leftJoin(users, eq(users.id, userConsents.userId))
    .where(and(...conds))
    .orderBy(desc(userConsents.aceitoEm))
    .limit(LISTA_LIMIT);

  return rows.map((r) => ({
    id: r.id,
    userId: r.userId,
    usuario: r.nome?.trim() || r.email || 'Usuário removido',
    email: r.email ?? null,
    role: r.role ?? null,
    documento: r.documento as ContratoDocumento,
    versao: r.versao,
    aceitoEm: r.aceitoEm instanceof Date ? r.aceitoEm.toISOString() : String(r.aceitoEm),
    ip: r.ip ?? null,
  }));
}

/** KPIs por documento: versão vigente + total de aceites + aceites na vigente. */
export async function contarAceitesPorTipo(): Promise<ContratoKpi[]> {
  const out: ContratoKpi[] = [];
  for (const documento of CONTRATO_DOCUMENTOS) {
    const vigente = await getVersaoVigente(documento);
    const [tot] = await db
      .select({ n: sql<number>`COUNT(*)::int` })
      .from(userConsents)
      .where(eq(userConsents.documento, documento));
    let aceitesVigentes = 0;
    if (vigente) {
      const [vg] = await db
        .select({ n: sql<number>`COUNT(*)::int` })
        .from(userConsents)
        .where(and(eq(userConsents.documento, documento), eq(userConsents.versao, String(vigente.versao))));
      aceitesVigentes = vg?.n ?? 0;
    }
    out.push({
      documento,
      versaoVigente: vigente?.versao ?? null,
      totalAceites: tot?.n ?? 0,
      aceitesVigentes,
    });
  }
  return out;
}
