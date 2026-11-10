import 'server-only';

import { eq } from 'drizzle-orm';
import type { NextRequest } from 'next/server';
import { db } from '@shared/db/db';
import { users } from '@shared/db/schema';
import { recordAudit } from '@features/auth/api/audit';
import { marketingAtivo, mudancaConsentimento, type OrigemConsentimento } from '../lib/consentimento';

export interface ConsentimentoMarketing {
  ativo: boolean;
  consentimentoEm: string | null;
  revogadoEm: string | null;
  origem: OrigemConsentimento | null;
}

export async function lerConsentimentoMarketing(userId: string): Promise<ConsentimentoMarketing | null> {
  const [u] = await db
    .select({
      consentimentoEm: users.marketingConsentimentoEm,
      revogadoEm: users.marketingRevogadoEm,
      origem: users.marketingOrigem,
    })
    .from(users)
    .where(eq(users.id, userId))
    .limit(1);
  if (!u) return null;
  return {
    ativo: marketingAtivo(u),
    consentimentoEm: u.consentimentoEm ? u.consentimentoEm.toISOString() : null,
    revogadoEm: u.revogadoEm ? u.revogadoEm.toISOString() : null,
    origem: (u.origem as OrigemConsentimento | null) ?? null,
  };
}

/**
 * Grava o aceite ou a revogação e registra em `audit_logs` (prova do
 * consentimento: quando, de onde, IP e navegador). Revogar quem já não aceita
 * não muda nada (o descadastro pode ser clicado várias vezes).
 */
export async function alterarConsentimentoMarketing(args: {
  userId: string;
  aceitar: boolean;
  origem: OrigemConsentimento;
  request?: NextRequest;
}): Promise<ConsentimentoMarketing | null> {
  const atual = await lerConsentimentoMarketing(args.userId);
  if (!atual) return null;
  if (atual.ativo === args.aceitar) return atual;
  await db.update(users).set(mudancaConsentimento(args.aceitar, args.origem)).where(eq(users.id, args.userId));
  await recordAudit({
    actorId: args.origem === 'descadastro' ? null : args.userId,
    action: args.aceitar ? 'xgestao.marketing.consentiu' : 'xgestao.marketing.revogou',
    targetUserId: args.userId,
    payload: { origem: args.origem },
    request: args.request,
  });
  return lerConsentimentoMarketing(args.userId);
}
