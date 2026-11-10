import { NextRequest } from 'next/server';
import { getXgestaoAdminDashboard } from '@features/xgestao/admin/server/dashboard';
import {
  assinantesQuePedemAtencao,
  listarAssinantesDetalhados,
  resumoAssinaturasXgestao,
} from '@features/xgestao/admin/server/assinantes';
import { metricasComerciaisXgestao, resumoComercial } from '@features/xgestao/admin/server/comercial';
import { cobrancaComProblemaXgestao } from '@features/xgestao/admin/server/cobranca';
import { adminJson, requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { resumirEngajamento } from '@features/xgestao/admin/lib/engajamento';

/**
 * GET /api/admin/xgestao — visão operacional mínima do produto xgestão.
 * XG33 AJ-06: mesmo guard das sub-rotas (`requireAdminXgestao`), em vez de repetir a checagem.
 * XG44: a home traz o resumo das assinaturas e os assinantes que pedem
 * atenção; a lista completa fica em /admin/xgestao/assinantes.
 * ADM-06/07/10: uma base só (a da lista), carregada uma vez por requisição.
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  const assinantes = await listarAssinantesDetalhados();
  const [dashboard, comercial, cobranca] = await Promise.all([
    getXgestaoAdminDashboard(assinantes),
    metricasComerciaisXgestao(assinantes),
    cobrancaComProblemaXgestao(assinantes),
  ]);
  return adminJson({
    ...dashboard,
    // XG45 — números comerciais da home; o detalhe fica em Conversão e Financeiro.
    comercial: resumoComercial(comercial),
    // XG46 — uso; a lista de quem parou fica em Engajamento.
    engajamento: resumirEngajamento(assinantes),
    assinaturas: {
      resumo: resumoAssinaturasXgestao(assinantes),
      atencao: assinantesQuePedemAtencao(assinantes),
    },
    // ADM-03 — card "Cobrança com problema"; a lista fica no Financeiro.
    cobranca: { assinantes: cobranca.assinantes, totais: cobranca.totais },
  });
}
