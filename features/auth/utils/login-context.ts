import type { LoginContext } from "./redirect-by-role";

const EXPECTED_ROLE_BY_PROFILE: Record<string, string> = {
  contratante: "contratante",
  empreiteiro: "empreiteiro",
  administrador: "admin",
};

export function getLoginContext(profile: string | null): LoginContext | undefined {
  return profile === "xgestao" ? "xgestao" : undefined;
}

export function getExpectedRoleForLogin(profile: string | null): string | undefined {
  if (!profile) return undefined;
  return EXPECTED_ROLE_BY_PROFILE[profile];
}

export function buildOAuthSuccessCallback(
  next: string | null,
  context?: LoginContext,
): string {
  const params = new URLSearchParams();
  if (next) params.set("next", next);
  if (context) params.set("context", context);
  return params.size
    ? `/auth/oauth-success?${params.toString()}`
    : "/auth/oauth-success";
}