import { NextRequest, NextResponse } from "next/server";
import { getAnuncioAtivoPorZona, isZonaValida } from "@features/anuncios/anuncios-service";
import { getPlatformSetting } from "@features/admin/platform-settings/server/settings-reader";

/**
 * GET /api/anuncios?zona=<id> — anúncio ativo de uma zona (público, sem auth).
 *
 * Hot path. Cache curto (30s) para que pausas reflitam rápido sem martelar o
 * banco. Risco §11 do doc: cache esconde pausas → 30s é o teto aceitável.
 *
 * J26: respeita o master toggle `plataforma.anuncios`. Quando off, retorna
 * `null` (o AdSidebarSlot já trata null → não renderiza). O gating é no
 * endpoint para valer também fora do componente.
 */
export async function GET(request: NextRequest) {
  const zona = new URL(request.url).searchParams.get("zona");
  if (!zona || !isZonaValida(zona)) {
    return NextResponse.json({ message: "Zona inválida ou ausente." }, { status: 400 });
  }
  const plataforma = await getPlatformSetting("plataforma");
  if (plataforma.anuncios === false) {
    const r = NextResponse.json(null);
    r.headers.set("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=60");
    return r;
  }
  const hoje = new Date().toISOString().slice(0, 10);
  const anuncio = await getAnuncioAtivoPorZona(zona, hoje);
  const r = NextResponse.json(anuncio);
  // Cache público curto para o hot path.
  r.headers.set("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=60");
  return r;
}
