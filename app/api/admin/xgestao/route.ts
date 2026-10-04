import { NextRequest } from 'next/server';
import { getXgestaoAdminDashboard } from '@features/xgestao/admin/server/dashboard';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';

/**
 * GET /api/admin/xgestao — visão operacional mínima do produto xgestão.
 * XG33 AJ-06: mesmo guard das sub-rotas (`requireAdminXgestao`), em vez de repetir a checagem.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  return adminJson(await getXgestaoAdminDashboard());
}
