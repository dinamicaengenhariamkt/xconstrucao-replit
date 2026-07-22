import { resolvePostLoginRedirect } from "./redirect-by-role";

/**
 * J51 — Resolve o destino pós-login considerando o gate do wizard de onboarding.
 *
 * Regra: se o usuário ainda não passou pelo onboarding (`onboarding_concluido`
 * false), desvia para `/onboarding` — EXCETO admin/superadmin, que não têm
 * wizard (nascem via seed, não pelo cadastro público). Caso contrário, usa o
 * redirect normal por role (com allowlist de `next`).
 *
 * A fonte de verdade do flag é `/api/auth/me` (autoritativa e sempre fresca);
 * consultamos lá em vez de confiar no shape do `user` do store, que pode não
 * carregar o campo em toda resposta de login/refresh. Falha de rede → não
 * bloqueia: cai no destino normal por role.
 */
export async function resolvePostLoginDestination(
  role: string,
  nextParam: string | null,
): Promise<string> {
  const fallback = resolvePostLoginRedirect(role, nextParam);

  // Admin/superadmin nunca passam pelo wizard.
  if (role === "admin" || role === "superadmin") return fallback;

  try {
    const res = await fetch("/api/auth/me", {
      method: "GET",
      credentials: "include",
      cache: "no-store",
    });
    if (!res.ok) return fallback;
    const data = (await res.json()) as { onboardingConcluido?: boolean };
    if (data.onboardingConcluido === false) return "/onboarding";
    return fallback;
  } catch {
    // Best-effort: nunca prender o usuário fora do produto por falha de rede.
    return fallback;
  }
}
