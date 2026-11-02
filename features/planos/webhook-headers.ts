/**
 * Headers do webhook que NÃO podem ser persistidos em `webhook_delivery_log`.
 *
 * O Asaas autentica o webhook com o token em `asaas-access-token`. Gravar os
 * headers crus deixava esse segredo no banco (e em qualquer dump/backup dele).
 * Nomes em minúsculas: é como `Headers.forEach` os entrega.
 */
const CABECALHOS_SENSIVEIS = new Set(["asaas-access-token", "access_token", "authorization", "cookie"]);

export function semCabecalhosSensiveis(headers: Record<string, string>): Record<string, string> {
  return Object.fromEntries(
    Object.entries(headers).filter(([nome]) => !CABECALHOS_SENSIVEIS.has(nome.toLowerCase())),
  );
}

/**
 * Headers para reprocessar um evento do log.
 *
 * Toda linha de `webhook_delivery_log` só é gravada DEPOIS de o evento passar
 * pela autenticação em `parseWebhook` (ver `app/api/webhooks/gateway/route.ts`).
 * Como o token não é mais persistido, o retry reapresenta o token esperado do
 * ambiente para que o mesmo `parseWebhook` normalize o payload sem enfraquecer
 * a checagem da rota, que continua exigindo o token do provedor.
 */
export function cabecalhosParaRetry(salvos: Record<string, string>): Record<string, string> {
  const token = process.env.ASAAS_WEBHOOK_TOKEN;
  return token ? { ...salvos, "asaas-access-token": token } : salvos;
}
