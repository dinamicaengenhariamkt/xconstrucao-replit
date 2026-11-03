import { and, eq, isNull } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { empreiteiras, obras, xgestaoMembros } from '@shared/db/schema';
import { erroEscritaEmpresa } from './plano-empresa';

/** Apenas mutações operacionais do produto; checkout e cadastro ficam acessíveis. */
export async function erroMutacaoXgestao(
  pathname: string, method: string, user: { id: string; role: string },
): Promise<string | null> {
  if (['GET', 'HEAD', 'OPTIONS'].includes(method) || user.role !== 'empreiteiro') return null;
  const operacional = /^\/api\/xgestao\/(obras|membros)(\/|$)/.test(pathname);
  const obraId = /^\/api\/obras\/([^/]+)(\/|$)/.exec(pathname)?.[1];
  if (!operacional && !obraId) return null;
  const [empresa] = await db.select({ id: empreiteiras.id }).from(empreiteiras).where(eq(empreiteiras.userId, user.id));
  const [membro] = empresa ? [] : await db.select({ id: xgestaoMembros.empreiteiraId }).from(xgestaoMembros)
    .where(and(eq(xgestaoMembros.userId, user.id), eq(xgestaoMembros.status, 'ativo')));
  const empresaId = empresa?.id ?? membro?.id;
  if (!empresaId) return null; // autorização específica da rota ainda será exigida
  if (obraId) {
    const [propria] = await db.select({ id: obras.id }).from(obras).where(and(
      eq(obras.id, obraId), eq(obras.empreiteiraId, empresaId), isNull(obras.clienteId),
    ));
    if (!propria) return null; // jamais afeta mutações do marketplace
  }
  return erroEscritaEmpresa(empresaId);
}
