import { NextRequest } from 'next/server';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import {
  listarEmpreiteirasXgestao,
  listarObrasXgestao,
  type XgestaoObraStatus,
} from '@features/xgestao/admin/server/obras';

const STATUS_VALIDOS: XgestaoObraStatus[] = ['planejamento', 'em_andamento', 'pausada', 'concluida'];

/**
 * GET /api/admin/xgestao/obras — lista paginada das obras do produto.
 *
 * Rota própria em vez de `/api/admin/obras?produto=xgestao`: aquela é
 * compartilhada com o marketplace e só valida `isAdminLike`, então o recorte
 * dependeria de um parâmetro que o cliente controla. Aqui o filtro é
 * server-side e o prefixo já restringe o escopo administrativo.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;

  const params = new URL(request.url).searchParams;
  const statusParam = params.get('status');
  const status = STATUS_VALIDOS.find((valor) => valor === statusParam);

  const [pagina, empreiteiras] = await Promise.all([
    listarObrasXgestao({
      busca: params.get('q') ?? undefined,
      status,
      empreiteiraId: params.get('empreiteira_id') ?? undefined,
      pagina: Number(params.get('pagina')) || 1,
      porPagina: Number(params.get('por_pagina')) || undefined,
    }),
    listarEmpreiteirasXgestao(),
  ]);

  return adminJson({ ...pagina, empreiteiras });
}
