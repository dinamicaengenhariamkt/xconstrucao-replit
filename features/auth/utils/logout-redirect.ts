export type LogoutPersona = "contratante" | "empreiteiro" | "administrador" | "xgestao";

export function buildLogoutRedirect(persona: LogoutPersona, next?: string): string {
  const params = new URLSearchParams({ perfil: persona });
  const safeNext = getSafeNext(persona, next);
  if (safeNext) params.set("next", safeNext);
  return `/login?${params.toString()}`;
}

function getSafeNext(persona: LogoutPersona, next?: string): string | null {
  if (!next || !next.startsWith("/") || next.startsWith("//")) return null;

  try {
    const parsed = new URL(next, "http://xconstrucao.local");
    if (parsed.origin !== "http://xconstrucao.local") return null;
  } catch {
    return null;
  }

  if (
    persona === "xgestao" &&
    next !== "/admin/xgestao" &&
    !next.startsWith("/admin/xgestao/") &&
    !next.startsWith("/xgestao")
  ) return null;
  return next;
}