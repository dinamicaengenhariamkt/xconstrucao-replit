import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { engajamentoXgestao } from '@features/xgestao/admin/server/engajamento';

/** GET /api/admin/xgestao/engajamento — XG46: quem usa, quem parou, quem nunca começou. */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  return adminJson(await engajamentoXgestao());
}
