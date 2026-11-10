import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { listarAssinantesDetalhados } from '@features/xgestao/admin/server/assinantes';

/**
 * GET /api/admin/xgestao/assinantes — base do produto, com plano e obras.
 * ADM-02: `?internas=1` lista só as contas internas/teste, que ficam fora da
 * lista padrão e de todas as métricas.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  const internas = new URL(request.url).searchParams.get('internas') === '1' ? 'somente' : 'excluir';
  return adminJson({ rows: await listarAssinantesDetalhados({ internas }) });
}
