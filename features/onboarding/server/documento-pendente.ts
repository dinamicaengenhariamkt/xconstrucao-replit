import 'server-only';
import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { users } from '@shared/db/schema';
import { getUserRoles } from '@features/auth/api/auth-utils';
import { isXgestaoMember } from '@features/auth/api/auth-storage';
import { documentoDoUsuario } from '@features/xgestao/server/documento-antiabuso';
import { documentoObrigatorioNoOnboarding } from '../lib/documento-onboarding';

/**
 * 10/11/2026 — o responsável do xgestão precisa de CPF ou CNPJ válido antes de
 * concluir (ou pular) o wizard. Membro convidado não tem empresa própria e não
 * entra aqui. Contratante, anunciante e empreiteiro só do marketplace: nunca.
 */
export async function precisaDocumentoXgestao(userId: string): Promise<boolean> {
  const [u] = await db.select({ role: users.role }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u || u.role !== 'empreiteiro') return false;
  const roles = await getUserRoles(userId);
  if (!documentoObrigatorioNoOnboarding({ role: u.role, roles })) return false;
  if (await isXgestaoMember(userId)) return false;
  return !(await documentoDoUsuario(userId));
}

/**
 * O responsável do xgestão ainda não passou pelo wizard e não tem documento.
 * O layout `/xgestao` manda para `/onboarding` antes de começar o teste: sem
 * isso, abrir `/xgestao` direto começava o teste sem a conferência por CPF/CNPJ.
 * Quem já concluiu o wizard (base antiga sem documento) nunca é desviado.
 */
export async function onboardingXgestaoPendente(userId: string): Promise<boolean> {
  const [u] = await db.select({ concluido: users.onboardingConcluido }).from(users).where(eq(users.id, userId)).limit(1);
  if (!u || u.concluido) return false;
  return precisaDocumentoXgestao(userId);
}
