import { NextResponse } from "next/server";
import { getPlatformSetting } from "@features/admin/platform-settings/server/settings-reader";
import { isAdPaymentEnabled } from "@features/anuncios/self-service/flags";
import { getAsaasEnvironment } from "@shared/lib/asaas-client";

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
    // J53 — cobrança real de anúncio ligada? (gate env AD_PAYMENT_GATEWAY + gateway
    // Asaas). Default false = protótipo; a UI só oferece "Pagar" quando true.
    adPaymentEnabled: isAdPaymentEnabled(),
    // Ambiente do gateway. `sandbox` significa que nenhuma cobrança é real,
    // mesmo com a aplicação publicada — a UI usa isso para avisar o usuário
    // antes que ele informe dados de pagamento. Não é sensível: só diz em que
    // modo o gateway está, nunca chaves ou credenciais.
    pagamentoSandbox: getAsaasEnvironment() !== "production",
  };

  const r = NextResponse.json(body);
  r.headers.set("Cache-Control", "public, max-age=30, s-maxage=30, stale-while-revalidate=60");
  return r;
}
