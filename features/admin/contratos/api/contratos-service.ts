import { and, desc, eq, ilike, inArray, or, sql } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { contratoAssinaturas, obras, userConsents, users } from '@shared/db/schema';
import { getVersaoVigente } from '@features/legal/legal-service';
import { CONTRATO_DOCUMENTOS } from '../constants';
import type { ContratoAceite, ContratoDocumento, ContratoKpi } from '../types';

const LISTA_LIMIT = 500;

/**
 * J60 — lista os "aceites/assinaturas" registrados, com nome/email do usuário.
 * Duas fontes reais (sem mock):
 *  - `user_consents` → Termo do Anunciante (J59) e demais termos.
 *  - `contrato_assinaturas` → Contrato de Obra entre contratante↔empreiteiro (J58).
 *
 * IP é retornado para a tela admin (gated); userAgent fica de fora da listagem.
 * A tela filtra por `documento` (tipo) e traz `role` — para o contrato de obra,
 * `role` reflete o papel assinante (contratante/empreiteiro).
 */
export async function listarAceites(filtros?: {
  documento?: ContratoDocumento;
  q?: string;
}): Promise<ContratoAceite[]> {
  const docsPermitidos = filtros?.documento
    ? [filtros.documento].filter((d) => CONTRATO_DOCUMENTOS.includes(d))
    : CONTRATO_DOCUMENTOS;
  if (docsPermitidos.length === 0) return [];

  const q = filtros?.q?.trim();
  const like = q ? `%${q}%` : null;
  const out: ContratoAceite[] = [];

  // Fonte 1 — user_consents (termos consentíveis; hoje termo_anunciante).
  const docsConsent = docsPermitidos.filter((d) => d !== 'contrato_obra');
  if (docsConsent.length > 0) {
    const conds = [inArray(userConsents.documento, docsConsent)];
    if (like) conds.push(or(ilike(users.name, like), ilike(users.email, like))!);
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
    for (const r of rows) {
      out.push({
        id: r.id,
        userId: r.userId,
        usuario: r.nome?.trim() || r.email || 'Usuário removido',
        email: r.email ?? null,
        role: r.role ?? null,
        documento: r.documento as ContratoDocumento,
        versao: r.versao,
        aceitoEm: r.aceitoEm instanceof Date ? r.aceitoEm.toISOString() : String(r.aceitoEm),
        ip: r.ip ?? null,
      });
    }
  }

  // Fonte 2 — contrato_assinaturas (contrato de obra J58). `role` = papel assinante.
  if (docsPermitidos.includes('contrato_obra')) {
    const conds = [] as any[];
    if (like) conds.push(or(ilike(users.name, like), ilike(users.email, like))!);
    const rows = await db
      .select({
        id: contratoAssinaturas.id,
        userId: contratoAssinaturas.userId,
        papel: contratoAssinaturas.papel,
        versao: contratoAssinaturas.versaoTemplate,
        assinadoEm: contratoAssinaturas.assinadoEm,
        ip: contratoAssinaturas.ip,
        obraNome: obras.nome,
        nome: users.name,
        email: users.email,
      })
      .from(contratoAssinaturas)
      .leftJoin(users, eq(users.id, contratoAssinaturas.userId))
      .leftJoin(obras, eq(obras.id, contratoAssinaturas.obraId))
      .where(conds.length ? and(...conds) : undefined)
      .orderBy(desc(contratoAssinaturas.assinadoEm))
      .limit(LISTA_LIMIT);
    for (const r of rows) {
      out.push({
        id: r.id,
        userId: r.userId,
        usuario: r.nome?.trim() || r.email || 'Usuário removido',
        email: r.email ?? null,
        role: r.papel, // contratante | empreiteiro (papel na assinatura)
        documento: 'contrato_obra',
        versao: String(r.versao),
        aceitoEm: r.assinadoEm instanceof Date ? r.assinadoEm.toISOString() : String(r.assinadoEm),
        ip: r.ip ?? null,
      });
    }
  }

  // Ordena o conjunto combinado por data desc.
  out.sort((a, b) => (a.aceitoEm < b.aceitoEm ? 1 : a.aceitoEm > b.aceitoEm ? -1 : 0));
  return out.slice(0, LISTA_LIMIT);
}

/** KPIs por documento: versão vigente + total + na vigente. */
export async function contarAceitesPorTipo(): Promise<ContratoKpi[]> {
  const out: ContratoKpi[] = [];
  for (const documento of CONTRATO_DOCUMENTOS) {
    const vigente = await getVersaoVigente(documento);

    if (documento === 'contrato_obra') {
      const [tot] = await db.select({ n: sql<number>`COUNT(*)::int` }).from(contratoAssinaturas);
      let aceitesVigentes = 0;
      if (vigente) {
        const [vg] = await db
          .select({ n: sql<number>`COUNT(*)::int` })
          .from(contratoAssinaturas)
          .where(eq(contratoAssinaturas.versaoTemplate, vigente.versao));
        aceitesVigentes = vg?.n ?? 0;
      }
      out.push({ documento, versaoVigente: vigente?.versao ?? null, totalAceites: tot?.n ?? 0, aceitesVigentes });
      continue;
    }

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
    out.push({ documento, versaoVigente: vigente?.versao ?? null, totalAceites: tot?.n ?? 0, aceitesVigentes });
  }
  return out;
}
