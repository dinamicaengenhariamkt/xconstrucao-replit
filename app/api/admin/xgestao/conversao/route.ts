import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { metricasComerciaisXgestao } from '@features/xgestao/admin/server/comercial';
import { periodoDaUrl } from '@features/xgestao/admin/lib/estornos';

/**
 * GET /api/admin/xgestao/conversao — XG45: funil do teste grátis (com coortes
 * por mês e as últimas conversões e perdas) e cancelamentos do mês.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  // CRM-03 — `?periodo=mes|30d|90d` do resumo de motivos de cancelamento.
  const periodo = periodoDaUrl(new URL(request.url).searchParams.get('periodo'));
  const { funil, recentes, cancelamentos, motivosCancelamento } = await metricasComerciaisXgestao(undefined, new Date(), periodo);
  return adminJson({ funil, recentes, cancelamentos, motivosCancelamento });
}
