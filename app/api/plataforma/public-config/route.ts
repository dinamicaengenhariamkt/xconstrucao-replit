import { NextResponse } from "next/server";
import { getPlatformSetting } from "@features/admin/platform-settings/server/settings-reader";

/**
 * GET /api/plataforma/public-config — config pública NÃO-sensível (J26).
 *
 * Leva ao client (footer, gating de FAQ, etc.) apenas uma whitelist explícita,
 * sem expor o endpoint admin de configurações. Cacheável 30s (alinhado ao TTL
 * do settings-reader).
 */
export async function GET() {
  const [geral, plataforma] = await Promise.all([
    getPlatformSetting("geral"),
    getPlatformSetting("plataforma"),
  ]);

  const body = {
    nome: typeof geral.nome === "string" ? geral.nome : "XConstrução",
    descricao: typeof geral.descricao === "string" ? geral.descricao : "",
    // flags de módulo: default ON; só `false` explícito desliga.
    anuncios: plataforma.anuncios !== false,
    faq: plataforma.faq !== false,
  };

  const r = NextResponse.json(body);
  r.headers.set("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=60");
  return r;
}
