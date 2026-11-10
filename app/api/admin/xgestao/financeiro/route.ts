import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import {
  faturamentoXgestao,
  listarAssinantesDetalhados,
} from '@features/xgestao/admin/server/assinantes';
import { lucroObrasXgestao } from '@features/xgestao/admin/server/obras';
import { metricasComerciaisXgestao } from '@features/xgestao/admin/server/comercial';
import { cobrancaComProblemaXgestao } from '@features/xgestao/admin/server/cobranca';
import { estornosXgestao } from '@features/xgestao/admin/server/estornos';
import { periodoDaUrl } from '@features/xgestao/admin/lib/estornos';

/**
 * GET /api/admin/xgestao/financeiro — as duas leituras financeiras do produto,
 * que respondem perguntas diferentes e não devem ser somadas:
 *
 * - `lucro`: quanto os assinantes ganham nas obras que gerenciam;
 * - `faturamento`: quanto as assinaturas do produto trazem para a plataforma.
 *
 * Não há split nem comissão no xgestão — isso é modelo do marketplace, onde a
 * plataforma retém parte do pagamento da obra.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;

  // A lista de assinantes é resolvida uma vez e repassada às duas leituras:
  // cada uma sozinha refaria o mesmo join de entitlement na mesma requisição.
  const assinantes = await listarAssinantesDetalhados();
  // CRM-11 — `?estornos=mes|30d|90d` escolhe o período da lista de estornos.
  const periodo = periodoDaUrl(new URL(request.url).searchParams.get('estornos'));
  const [lucro, faturamento, comercial, cobranca, estornos] = await Promise.all([
    lucroObrasXgestao(assinantes.flatMap((assinante) => (assinante.empreiteiraId ? [assinante.empreiteiraId] : []))),
    faturamentoXgestao(assinantes),
    metricasComerciaisXgestao(assinantes),
    cobrancaComProblemaXgestao(assinantes),
    estornosXgestao(assinantes, periodo),
  ]);
  // XG45 — receita por plano, ticket médio, recorrente saindo/em risco e quem
  // mais pagou. Os cancelamentos do mês ficam na página de Conversão.
  // ADM-03 — lista de cobrança com problema (o card fica na home).
  return adminJson({ lucro, faturamento, receita: comercial.receita, cobranca, estornos });
}
