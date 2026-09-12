import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import {
  faturamentoXgestao,
  listarAssinantesDetalhados,
} from '@features/xgestao/admin/server/assinantes';
import { lucroObrasXgestao } from '@features/xgestao/admin/server/obras';

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
  const [lucro, faturamento] = await Promise.all([
    lucroObrasXgestao(assinantes.map((assinante) => assinante.empreiteiraId)),
    faturamentoXgestao(assinantes),
  ]);
  return adminJson({ lucro, faturamento });
}
