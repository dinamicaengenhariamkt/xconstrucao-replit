/**
 * J58 — Motivo padrão gravado em `candidaturas.motivo_rejeicao` quando o aceite de
 * uma proposta rejeita as concorrentes em cascata.
 *
 * É a marca que distingue uma rejeição AUTOMÁTICA (efeito colateral do aceite) de
 * uma rejeição MANUAL feita pelo contratante. O cancelamento do contrato reabre
 * apenas as automáticas — sem essa distinção, candidaturas recusadas de propósito
 * voltariam a `pendente`.
 *
 * Escrito por `app/api/contratante/candidaturas/[id]/aceitar/route.ts` e lido por
 * `cancelarContrato` (contrato-service.ts). Alterar o texto quebra essa correlação
 * para as candidaturas já gravadas — em caso de mudança, migrar os dados existentes.
 */
export const MOTIVO_REJEICAO_CASCATA = "Outra proposta foi selecionada";
