import { NextRequest, NextResponse } from "next/server";
import {
  getAnuncioAtivoPorZona,
  getAnunciosAtivosPorZona,
  getConfigVisivel,
  isZonaMultipla,
  isZonaValida,
} from "@features/anuncios/anuncios-service";
import { getPlatformSetting } from "@features/admin/platform-settings/server/settings-reader";

const CACHE = "public, max-age=30, s-maxage=30, stale-while-revalidate=60";

/**
 * GET /api/anuncios?zona=<id> — anúncio(s) ativo(s) de uma zona (público).
 *
 * Hot path. Cache curto (30s) para que pausas reflitam rápido sem martelar o
 * banco (risco §11 do doc — 30s é o teto aceitável).
 *
 * Contrato (J24):
 * - Zonas legadas (single) → `AnuncioPublico | null`.
 * - Zonas `multiplo` (ex.: home-mercado) → `AnuncioPublico[]` (vitrine).
 *
 * J26: respeita o master toggle `plataforma.anuncios` (off → null/[] ).
 * J24: zona multipla respeita também o toggle de seção `anuncio_config`
 * (`secao:mercado-em-foco`) — off → [] (a seção some no client).
 */
export async function GET(request: NextRequest) {
  const zona = new URL(request.url).searchParams.get("zona");
  if (!zona || !isZonaValida(zona)) {
    return NextResponse.json({ message: "Zona inválida ou ausente." }, { status: 400 });
  }

  const multipla = isZonaMultipla(zona);
  const vazio = () => (multipla ? [] : null);

  const plataforma = await getPlatformSetting("plataforma");
  if (plataforma.anuncios === false) {
    const r = NextResponse.json(vazio());
    r.headers.set("Cache-Control", CACHE);
    return r;
  }

  const hoje = new Date().toISOString().slice(0, 10);

  if (multipla) {
    // Toggle explícito da seção (Opção B) — esconde mesmo com campanha ativa.
    const visivel = await getConfigVisivel("secao:mercado-em-foco");
    const lista = visivel ? await getAnunciosAtivosPorZona(zona, hoje) : [];
    const r = NextResponse.json(lista);
    r.headers.set("Cache-Control", CACHE);
    return r;
  }

  const anuncio = await getAnuncioAtivoPorZona(zona, hoje);
  const r = NextResponse.json(anuncio);
  r.headers.set("Cache-Control", CACHE);
  return r;
}
