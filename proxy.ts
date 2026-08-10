import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { verifyAccessToken, verifyAccessTokenAllowExpired } from "@features/auth/api/auth-service";
import { isManutencaoAtiva } from "@features/admin/platform-settings/server/settings-reader";
// XG06 — módulo PURO (sem DB, sem audit), seguro para o bundle do proxy.
import { adminPodeAcessar } from "@features/auth/api/admin-scope";

/** Inline (não importar de auth-utils, que puxa DB/audit p/ o bundle do proxy). */
function isAdminLike(role: string): boolean {
  return role === "admin" || role === "superadmin";
}

/** Prefixos das áreas logadas afetadas pelo modo manutenção (admin é isento). */
const MAINTENANCE_AFFECTED_PREFIXES = ["/contratante", "/empreiteiro"];

/** Extrai a role do token (tolera expirado-mas-íntegro), ou null. */
function roleFromToken(accessToken: string | undefined): string | null {
  if (!accessToken) return null;
  const valid = verifyAccessToken(accessToken);
  if (valid?.role) return valid.role;
  const claims = verifyAccessTokenAllowExpired(accessToken);
  return claims?.role ?? null;
}

/**
 * Proxy (middleware) de proteção de rotas.
 *
 * J19 — Hardening: o Proxy do Next 16 já roda no runtime nodejs, então agora
 * validamos a ASSINATURA do JWT (via `verifyAccessToken`, que usa
 * `crypto.createHmac`). Antes a barreira de páginas era só presença de cookie;
 * agora valida assinatura + role ANTES de renderizar a página. Reusa a
 * verificação existente sem migrar a assinatura dos tokens já emitidos.
 *
 * Defense in depth (mantido):
 * - Proxy: barreira server-side de páginas (assinatura + role) e guards globais de /api/*.
 * - Frontend: `useAuth` redireciona (UX, evita flash).
 * - Backend: APIs revalidam via `requireVerifiedUser`.
 */

const READ_ONLY_METHODS = new Set(["GET", "HEAD", "OPTIONS"]);

const PASSWORD_CHANGE_API_ALLOWLIST = new Set<string>([
  "/api/auth/change-password-forced",
  "/api/auth/logout",
  "/api/auth/me",
  "/api/auth/refresh",
  "/api/auth/definir-senha-inicial",
]);

/** Prefixo de rota de página → predicado de role autorizado. */
const PROTECTED_PAGES: Array<{ prefix: string; allow: (role: string) => boolean }> = [
  { prefix: "/contratante", allow: (r) => r === "contratante" || r === "superadmin" },
  { prefix: "/empreiteiro", allow: (r) => r === "empreiteiro" || r === "superadmin" },
  { prefix: "/admin", allow: (r) => isAdminLike(r) },
];

/**
 * Lê o claim `mustChangePassword` do access token sem validar assinatura
 * (decodificação rápida do payload). A validação completa acontece no
 * `requireVerifiedUser`. Aqui só precisamos do hint para bloquear /api/*.
 */
function decodeMustChangePassword(token: string | undefined): boolean {
  if (!token) return false;
  const parts = token.split(".");
  if (parts.length < 2) return false;
  try {
    const padded = parts[1] + "=".repeat((4 - (parts[1].length % 4)) % 4);
    const json = Buffer.from(padded.replace(/-/g, "+").replace(/_/g, "/"), "base64").toString("utf8");
    const claims = JSON.parse(json) as { mustChangePassword?: boolean };
    return claims.mustChangePassword === true;
  } catch {
    return false;
  }
}

function loginRedirect(request: NextRequest): NextResponse {
  const url = new URL("/login", request.url);
  const next = request.nextUrl.pathname + request.nextUrl.search;
  url.search = `?next=${encodeURIComponent(next)}`;
  return NextResponse.redirect(url);
}

export async function proxy(request: NextRequest) {
  const accessToken = request.cookies.get("access_token")?.value;
  const pathname = request.nextUrl.pathname;

  // ── Guards globais de /api/* (mantidos da versão anterior) ────────────────

  // Bloqueio GLOBAL: must_change_password=true → bloqueia /api/* (allowlist mínima).
  if (
    pathname.startsWith("/api/") &&
    !PASSWORD_CHANGE_API_ALLOWLIST.has(pathname) &&
    decodeMustChangePassword(accessToken)
  ) {
    return NextResponse.json(
      {
        error: "PASSWORD_CHANGE_REQUIRED",
        message: "Troca de senha obrigatória. Acesse /trocar-senha-obrigatoria para continuar.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  // Modo "Ver como" (impersonation) — bloqueio GLOBAL de mutações em /api/*.
  if (
    pathname.startsWith("/api/") &&
    pathname !== "/api/admin/impersonate/exit" &&
    !READ_ONLY_METHODS.has(request.method) &&
    !!request.cookies.get("impersonation_token")?.value
  ) {
    return NextResponse.json(
      {
        error: "IMPERSONATION_READ_ONLY",
        message: "Modo somente leitura ativo. Saia do modo visualização para fazer alterações.",
      },
      {
        status: 403,
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate, private",
          Pragma: "no-cache",
          Expires: "0",
        },
      },
    );
  }

  // ── Escopo administrativo (XG06) ──────────────────────────────────────────
  // Admin de escopo restrito ("xgestao") só alcança a allowlist de XGESTAO_ADMIN_
  // PREFIXES. Para escopo "global" — que é o default de TODO admin existente e de
  // todo token emitido antes desta coluna — a checagem é um no-op.
  //
  // Uma regra em um lugar, em vez de editar as 94 rotas de app/api/admin/**. A
  // allowlist é positiva: rota admin nova, sem conhecimento de escopo, já nasce
  // negada ao restrito e liberada ao global.
  if (pathname.startsWith("/api/admin/") && accessToken) {
    const claims =
      verifyAccessToken(accessToken) ?? verifyAccessTokenAllowExpired(accessToken);
    if (claims?.sub && !adminPodeAcessar(claims, pathname)) {
      return NextResponse.json(
        {
          error: "ADMIN_ESCOPO_NEGADO",
          message: "Seu perfil administrativo não tem acesso a esta área.",
        },
        {
          status: 403,
          headers: {
            "Cache-Control": "no-store, no-cache, must-revalidate, private",
            Pragma: "no-cache",
            Expires: "0",
          },
        },
      );
    }
  }

  // ── Modo manutenção (J26) ─────────────────────────────────────────────────
  // Quando ativo, usuários NÃO-admin nas áreas logadas (/contratante,
  // /empreiteiro) são levados para /manutencao. Admin/superadmin sempre passam.
  // A landing pública (/) e /admin não passam por aqui. Fail-open: erro de DB
  // no leitor NUNCA liga manutenção (ver settings-reader).
  const isMaintenanceArea = MAINTENANCE_AFFECTED_PREFIXES.some(
    (p) => pathname === p || pathname.startsWith(`${p}/`),
  );
  if (isMaintenanceArea) {
    const role = roleFromToken(accessToken);
    if (!isAdminLike(role ?? "") && (await isManutencaoAtiva())) {
      return NextResponse.redirect(new URL("/manutencao", request.url));
    }
  }

  // ── Barreira server-side das páginas autenticadas (J19) ───────────────────
  const rule = PROTECTED_PAGES.find(
    (r) => pathname === r.prefix || pathname.startsWith(`${r.prefix}/`),
  );
  if (rule) {
    // Sem cookie algum → não autenticado, redireciona.
    if (!accessToken) return loginRedirect(request);

    const payload = verifyAccessToken(accessToken);
    if (payload?.sub) {
      // Token VÁLIDO → fonte de verdade da role. Role errada para a área → bloqueia.
      if (!rule.allow(payload.role)) return loginRedirect(request);
    } else {
      // Token presente mas inválido. Se for só EXPIRADO (assinatura íntegra,
      // exp vencido), deixa passar: o access token vive 15 min e o `useAuth`
      // faz refresh client-side; as APIs revalidam server-side. Bloquear aqui
      // causaria logout em navegação normal. Se a assinatura for inválida
      // (adulterado) → bloqueia. Se a role não bate com a área → redireciona.
      const claims = verifyAccessTokenAllowExpired(accessToken);
      if (!claims?.sub) return loginRedirect(request);
      if (!rule.allow(claims.role)) return loginRedirect(request);
    }
  }

  return NextResponse.next();
}

// Rotas que passam pelo proxy. As páginas autenticadas + /api/* (para os guards globais).
export const config = {
  matcher: [
    "/contratante/:path*",
    "/empreiteiro/:path*",
    "/admin/:path*",
    "/api/:path*",
  ],
};
