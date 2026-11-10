/**
 * REV-12 — guarda única das rotas `app/api/test/**`.
 *
 * Em produção essas rotas respondem 404 sempre, mesmo que `E2E_TEST_AUTH`
 * tenha sido definida por engano nos Secrets do deploy. Fora de produção
 * valem só com `E2E_TEST_AUTH=1`.
 */
export function ehProducao(env: Record<string, string | undefined> = process.env): boolean {
  return env.NODE_ENV === "production";
}

export function rotasDeTesteHabilitadas(env: Record<string, string | undefined> = process.env): boolean {
  if (ehProducao(env)) return false;
  return env.E2E_TEST_AUTH === "1";
}
