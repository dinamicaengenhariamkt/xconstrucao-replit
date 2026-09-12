import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { listarAssinantesDetalhados } from '@features/xgestao/admin/server/assinantes';

/** GET /api/admin/xgestao/assinantes — base do produto, com plano e obras. */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;

  return adminJson({ rows: await listarAssinantesDetalhados() });
}
