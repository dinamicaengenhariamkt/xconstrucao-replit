import { NextRequest, NextResponse } from 'next/server';
import { recordAudit } from '@features/auth/api/audit';
import { requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { listarObrasXgestao, type XgestaoAdminObraRow, type XgestaoObraStatus } from '@features/xgestao/admin/server/obras';
import { listarAssinantesDetalhados } from '@features/xgestao/admin/server/assinantes';
import { SITUACOES_OBRA } from '@features/xgestao/admin/server/situacao';
import { dataBr, montarCsv } from '@features/xgestao/admin/server/csv';

const STATUS_VALIDOS: XgestaoObraStatus[] = ['planejamento', 'em_andamento', 'pausada', 'concluida'];
const STATUS_LABEL: Record<XgestaoObraStatus, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
};
const TIER_LABEL: Record<string, string> = { free: 'Freemium', pro: 'Basic', enterprise: 'Pro' };
/** Teto de segurança: a exportação percorre páginas de 100 até esgotar ou chegar aqui. */
const MAX_LINHAS = 10_000;

function arquivo(nome: string, conteudo: string) {
  const data = new Date().toISOString().slice(0, 10);
  return new NextResponse(conteudo, {
    headers: {
      'Content-Type': 'text/csv; charset=utf-8',
      'Content-Disposition': `attachment; filename="xgestao-${nome}-${data}.csv"`,
      'Cache-Control': 'no-store',
    },
  });
}

/**
 * GET /api/admin/xgestao/export?tipo=obras|assinantes — XG36.
 * `tipo=obras` aceita os mesmos filtros da lista (`q`, `status`, `situacao`, `empreiteira_id`).
 */
export async function GET(request: NextRequest) {
  const guard = await requireAdminXgestao(request);
  if (guard.error) return guard.error;
  const params = new URL(request.url).searchParams;
  const tipo = params.get('tipo');

  if (tipo === 'obras') {
    const filtros = {
      busca: params.get('q') ?? undefined,
      status: STATUS_VALIDOS.find((v) => v === params.get('status')),
      situacao: SITUACOES_OBRA.find((v) => v === params.get('situacao')),
      empreiteiraId: params.get('empreiteira_id') ?? undefined,
    };
    const rows: XgestaoAdminObraRow[] = [];
    for (let pagina = 1; rows.length < MAX_LINHAS; pagina += 1) {
      const resultado = await listarObrasXgestao({ ...filtros, pagina, porPagina: 100 });
      rows.push(...resultado.rows);
      if (pagina >= resultado.totalPaginas) break;
    }
    await auditar(request, guard.user.id, 'obras', rows.length);
    return arquivo('obras', montarCsv(
      ['Obra', 'Empreiteira', 'Status', 'Cidade', 'UF', 'Previsão', 'Orçamento (R$)', 'Custo real (R$)', 'Última atividade', 'Link público ativo'],
      rows.map((o) => [
        o.nome, o.empreiteira, STATUS_LABEL[o.status] ?? o.status, o.cidade, o.uf, dataBr(o.dataPrevisao),
        o.valorTotal, o.valorPago, dataBr(o.ultimaAtividadeEm), o.linkPublicoAtivo ? 'Sim' : 'Não',
      ]),
    ));
  }

  if (tipo === 'assinantes') {
    const rows = await listarAssinantesDetalhados();
    await auditar(request, guard.user.id, 'assinantes', rows.length);
    return arquivo('assinantes', montarCsv(
      ['Empresa', 'Responsável', 'E-mail', 'Plano', 'Situação', 'Teste grátis até', 'Obras', 'Obras em aberto', 'Limite de obras', 'Membros', 'Último acesso', 'Entrada'],
      rows.map((a) => [
        a.empreiteiraNome, a.nome, a.email, TIER_LABEL[a.plano.tier] ?? a.plano.tier,
        a.plano.emTeste ? 'teste grátis' : (a.plano.status ?? 'sem cobrança'),
        a.plano.emTeste ? dataBr(a.plano.renovaEm) : '',
        a.obrasGerenciadas, a.uso.obrasEmAberto, a.uso.limiteObras >= 9999 ? 'sem limite' : a.uso.limiteObras,
        a.membros.length, dataBr(a.ultimoAcessoEm), dataBr(new Date(a.entradaEm).toISOString()),
      ]),
    ));
  }

  return NextResponse.json({ message: 'tipo deve ser obras ou assinantes' }, { status: 400 });
}

/** Exportação expõe dado de cliente: fica registrada em `audit_logs`. */
async function auditar(request: NextRequest, actorId: string, tipo: string, linhas: number) {
  await recordAudit({
    actorId,
    action: 'admin.xgestao.export',
    targetUserId: null,
    payload: { tipo, linhas },
    request,
  });
}
