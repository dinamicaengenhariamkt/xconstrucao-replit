import { eq } from "drizzle-orm";
import { db } from "@shared/db/db";
import { userPreferencias } from "@shared/db/schema";

/**
 * Ponto ÚNICO de checagem de preferência de email por destinatário (J02 §4).
 *
 * In-app notification é sempre criada (design J13 — o sino é canal "always on").
 * O opt-out do usuário em `user_preferencias.notificacoes` vale **só para email**.
 * Este helper é a porta que todo dispatcher deve cruzar antes de mandar email.
 *
 * Default `true` quando a linha de preferências não existe ou a chave está ausente
 * (mesma semântica do dispatcher `nova-obra-zona`, que já fazia certo). Ou seja:
 * só não envia se o usuário desligou explicitamente (`=== false`).
 *
 * Falha de leitura → `true` (não punir o usuário por erro de infra; email é
 * best-effort e melhor errar pra mais do que silenciar um aviso importante).
 *
 * Chaves canônicas (espelham os switches em `/{persona}/configuracoes` aba
 * Notificações). ATENÇÃO: cada persona expõe um subconjunto — gateie o email
 * por uma chave que a persona DESTINATÁRIA realmente controla:
 *   - `email_novaProposta` — SÓ contratante (nova proposta recebida)
 *   - `email_novaObra`     — SÓ empreiteiro (nova obra na sua zona)
 *   - `email_medicao`      — ambos (ciclo de medição/pagamento)
 *   - `email_prazo`        — ambos (prazos)
 *   - `email_contrato`     — ambos (vínculo contratual: decisão de proposta, etc.)
 */
export type EmailPreferenceKey =
  | "email_novaProposta"
  | "email_novaObra"
  | "email_medicao"
  | "email_prazo"
  | "email_contrato";

/**
 * Decide a partir de um objeto de preferências já carregado (ex.: vindo de um
 * LEFT JOIN num batch). Não toca o banco. `null`/ausente → default `true`.
 */
export function emailEnabledFromPrefs(
  prefs: Record<string, boolean> | null | undefined,
  key: EmailPreferenceKey,
): boolean {
  if (!prefs) return true;
  return prefs[key] !== false;
}

/**
 * Lê a preferência de um único usuário. Use em dispatchers que enviam para um
 * destinatário só (candidatura, medição, disputa). Para batches (ex.:
 * nova-obra-zona), prefira LEFT JOIN + {@link emailEnabledFromPrefs}.
 */
export async function emailPreferenceEnabled(
  userId: string,
  key: EmailPreferenceKey,
): Promise<boolean> {
  try {
    const [row] = await db
      .select({ notificacoes: userPreferencias.notificacoes })
      .from(userPreferencias)
      .where(eq(userPreferencias.userId, userId))
      .limit(1);
    return emailEnabledFromPrefs(row?.notificacoes ?? null, key);
  } catch (err) {
    console.error("[notificacoes] falha ao ler preferência de email:", userId, key, err);
    return true;
  }
}
