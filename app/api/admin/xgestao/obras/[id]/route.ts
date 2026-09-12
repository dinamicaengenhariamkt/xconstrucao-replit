import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { detalheObraXgestao } from '@features/xgestao/admin/server/obra-detalhe';

/**
 * GET /api/admin/xgestao/obras/[id] — detalhe em leitura de uma obra do produto.
 *
 * Responde 404 para obra fora do recorte: a área do xgestão não pode servir de
 * caminho alternativo até uma obra de marketplace.
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;

  const { id } = await context.params;
  const detalhe = await detalheObraXgestao(id);
  if (!detalhe) return adminJson({ message: 'Obra não encontrada.' }, 404);

  return adminJson(detalhe);
}
