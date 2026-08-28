import { NextResponse } from "next/server";
import {
  getPlatformSetting,
  resolveMarketplaceVisivel,
} from "@features/admin/platform-settings/server/settings-reader";
import { isAdPaymentEnabled } from "@features/anuncios/self-service/flags";
import { getAsaasEnvironment } from "@shared/lib/asaas-client";

/**
 * GET /api/plataforma/public-config — config pública NÃO-sensível (J26).
 *
 * Leva ao client (footer, gating de FAQ, etc.) apenas uma whitelist explícita,
 * sem expor o endpoint admin de configurações. A resposta é sempre fresca
 * porque esta flag troca a experiência pública inteira.
 */
export const dynamic = "force-dynamic";
export const revalidate = 0;
export const fetchCache = "force-no-store";

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
    // XG05 — flag pública de apresentação. Não bloqueia rotas nem APIs do
    // marketplace; só controla os pontos de entrada e descoberta.
    marketplaceVisivel: resolveMarketplaceVisivel(plataforma),
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
  r.headers.set("Cache-Control", "no-store, no-cache, must-revalidate");
  return r;
}
