import { eq } from 'drizzle-orm';
import { db } from '@shared/db/db';
import { platformSettings } from '@shared/db/schema';

/**
 * XG50 — chave que liga o plano anual do xgestão: `platform_settings`, chave
 * `xgestao`, campo `anualAtivo` (ausente ou diferente de `true` = desligado).
 * Lida sem cache de propósito: é consultada só no checkout e na lista de
 * planos, e virar a chave precisa valer na hora em todas as instâncias.
 */
export async function xgestaoAnualAtivo(): Promise<boolean> {
  try {
    const [linha] = await db.select({ valor: platformSettings.valor }).from(platformSettings)
      .where(eq(platformSettings.chave, 'xgestao')).limit(1);
    return (linha?.valor as Record<string, unknown> | undefined)?.anualAtivo === true;
  } catch {
    return false;
  }
}
