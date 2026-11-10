import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { historicoMensalXgestao } from '@features/xgestao/admin/server/historico';

/** GET /api/admin/xgestao/historico — XG46: os últimos 12 meses, mês a mês. */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  return adminJson({ meses: await historicoMensalXgestao() });
}
