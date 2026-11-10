import { tierLabel } from '@features/xgestao/admin/plano-label';
import { ROTULO_ENGAJAMENTO } from '@features/xgestao/admin/lib/engajamento';
import { NextRequest, NextResponse } from 'next/server';
import { recordAudit } from '@features/auth/api/audit';
import { requireAdminXgestao } from '@features/xgestao/admin/server/guard';
import { listarObrasXgestao, type XgestaoAdminObraRow, type XgestaoObraStatus } from '@features/xgestao/admin/server/obras';
import { listarAssinantesDetalhados } from '@features/xgestao/admin/server/assinantes';
import { SITUACOES_OBRA } from '@features/xgestao/admin/server/situacao';
import { dataBr, montarCsv } from '@features/xgestao/admin/server/csv';
import { formatarLimite, type UsoRecurso } from '@features/xgestao/admin/lib/situacao-assinante';
import { aplicarSegmento, filtrosDaUrl } from '@features/xgestao/admin/lib/segmentos-assinante';
import { formatarDocumento, formatarTelefone, ROTULO_CANAL_CONTATO } from '@features/xgestao/admin/lib/contato-assinante';
import { rotuloMotivoCancelamento } from '@features/xgestao/lib/motivo-cancelamento';
import { periodoDaUrl, ROTULO_TIPO_ESTORNO } from '@features/xgestao/admin/lib/estornos';
import { estornosXgestao } from '@features/xgestao/admin/server/estornos';

const STATUS_VALIDOS: XgestaoObraStatus[] = ['planejamento', 'em_andamento', 'pausada', 'concluida'];
const STATUS_LABEL: Record<XgestaoObraStatus, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
};
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
 * GET /api/admin/xgestao/export?tipo=obras|assinantes|estornos — XG36.
 * `tipo=obras` aceita os mesmos filtros da lista (`q`, `status`, `situacao`, `empreiteira_id`).
 * CRM-02: `tipo=assinantes` aceita o recorte da lista (`situacao`, `janela`,
 * `contato=nunca`, `marketing=aceitou`, `q`, `ordem`), pela mesma função da tela. Contas internas
 * ficam fora sempre. CRM-11: `tipo=estornos&periodo=mes|30d|90d`.
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
    const filtros = filtrosDaUrl(params);
    // `internas` não abre as contas internas aqui: o CSV é sempre da base padrão.
    const rows = aplicarSegmento(await listarAssinantesDetalhados(), {
      ...filtros,
      situacao: filtros.situacao === 'internas' ? '' : filtros.situacao,
    });
    await auditar(request, guard.user.id, 'assinantes', rows.length, {
      situacao: filtros.situacao || null,
      janela: filtros.janela || null,
      nuncaContatado: filtros.nuncaContatado,
      somenteMarketing: Boolean(filtros.somenteMarketing),
      busca: Boolean(filtros.busca),
    });
    return arquivo('assinantes', montarCsv(
      [
        'Empresa', 'Responsável', 'E-mail', 'Plano', 'Situação', 'Teste grátis até', 'Obras', 'Obras em aberto', 'Limite de obras', 'Membros', 'Último acesso', 'Entrada',
        // XG44 — situação comercial com prazo, uso dos limites e consolidado das obras.
        'Situação até', 'Pessoas na equipe', 'Links na obra com mais links', 'Orçamento gerenciado (R$)', 'Custo real (R$)',
        'Obras atrasadas', 'Obras paradas', 'Ocorrências abertas', 'Pagamentos atrasados', 'Atenção',
        // XG46 — uso da empresa (titular e equipe) e registros nas obras.
        'Uso', 'Último uso da empresa', 'Último registro nas obras', 'Registros em 30 dias',
        // ADM-05/06/09 — armazenamento, empresa cadastrada e atrasos por lado.
        'Armazenamento (MB)', 'Empresa cadastrada', 'Recebimentos atrasados', 'Contas a pagar atrasadas',
        // CRM-02 — contato e situação para a lista de contato/marketing.
        'Telefone', 'CPF/CNPJ', 'Cidade', 'UF', 'Situação (código)', 'Dias restantes',
        'Dias em atraso', 'Motivo do cancelamento', 'Comentário do cancelamento', 'Total já pago (R$)', 'Último contato', 'Canal do último contato',
        // XG50 — cancela e volta.
        'Voltou depois de cancelar', 'Voltou em', 'Voltas em 90 dias', 'Tentativas bloqueadas (teste/bônus)', 'Cancela e volta com frequência',
        // XG52 — consentimento de e-mail de marketing (LGPD).
        'Aceita e-mail de marketing', 'Consentimento em', 'Revogado em', 'Origem do consentimento',
      ],
      rows.map((a) => [
        a.empreiteiraNome, a.nome, a.email, tierLabel(a.plano.tier),
        a.situacao.motivo ? `${a.situacao.rotulo} (${a.situacao.motivo})` : a.situacao.rotulo,
        a.plano.emTeste ? dataBr(a.plano.renovaEm) : '',
        a.obrasGerenciadas, a.uso.obrasEmAberto, a.uso.limiteObras === 0 ? 0 : formatarLimite(a.uso.limiteObras),
        a.membros.length, dataBr(a.ultimoAcessoEm), dataBr(new Date(a.entradaEm).toISOString()),
        // CRM-08 — quem saiu: a data em que o acesso pago acabou.
        dataBr(a.situacao.ate ?? a.saida?.em ?? null), usoCsv(a.usoPlano.pessoas), usoCsv(a.usoPlano.links),
        a.consolidado.orcamento, a.consolidado.custoReal, a.consolidado.obrasAtrasadas, a.consolidado.obrasParadas,
        a.consolidado.ocorrenciasAbertas, a.consolidado.pagamentosAtrasados, a.atencao.map((m) => m.texto).join(' | '),
        ROTULO_ENGAJAMENTO[a.engajamento.nivel], dataBr(a.engajamento.ultimoSinalEm), dataBr(a.engajamento.ultimoRegistroEm),
        a.engajamento.registros30d,
        Math.round((a.armazenamentoBytes / (1024 * 1024)) * 100) / 100, a.semEmpresa ? 'Não' : 'Sim',
        a.consolidado.recebimentosAtrasados, a.consolidado.contasAPagarAtrasadas,
        a.contato.telefone ? formatarTelefone(a.contato.telefone) : '', a.contato.documento ? formatarDocumento(a.contato.documento) : '',
        a.contato.cidade, a.contato.uf, a.situacao.codigo,
        a.situacao.diasRestantes, a.situacao.diasEmAtraso,
        a.cancelamento ? rotuloMotivoCancelamento(a.cancelamento.motivo) : '', a.cancelamento?.texto ?? '',
        a.totalPago, dataBr(a.ultimoContato?.em ?? null), a.ultimoContato ? ROTULO_CANAL_CONTATO[a.ultimoContato.canal] : '',
        a.retorno.voltou ? 'Sim' : 'Não', dataBr(a.retorno.voltouEm), a.retorno.ciclos90d, a.retorno.tentativasBloqueadas,
        a.retorno.frequente ? 'Sim' : 'Não',
        a.marketing.aceito ? 'Sim' : 'Não', dataBr(a.marketing.consentimentoEm), dataBr(a.marketing.revogadoEm),
        a.marketing.origem ?? '',
      ]),
    ));
  }

  if (tipo === 'estornos') {
    const periodo = periodoDaUrl(params.get('periodo'));
    const estornos = await estornosXgestao(await listarAssinantesDetalhados(), periodo);
    await auditar(request, guard.user.id, 'estornos', estornos.itens.length, { periodo });
    return arquivo(`estornos-${periodo}`, montarCsv(
      ['Data', 'Tipo', 'Empresa', 'Responsável', 'Valor (R$)', 'Plano'],
      estornos.itens.map((e) => [dataBr(e.data), ROTULO_TIPO_ESTORNO[e.tipo], e.empreiteiraNome, e.nome, e.valor, e.plano]),
    ));
  }

  return NextResponse.json({ message: 'tipo deve ser obras, assinantes ou estornos' }, { status: 400 });
}

/** "2 de 5", "3 · sem limite" ou "1 · somente leitura" — o mesmo texto da tela. */
function usoCsv(uso: UsoRecurso): string {
  if (uso.nivel === 'bloqueado') return `${uso.usado} · somente leitura`;
  if (uso.limite === null) return `${uso.usado} · sem limite`;
  return `${uso.usado} de ${uso.limite}`;
}

/** Exportação expõe dado de cliente: fica registrada em `audit_logs`. */
async function auditar(request: NextRequest, actorId: string, tipo: string, linhas: number, filtros?: Record<string, unknown>) {
  await recordAudit({
    actorId,
    action: 'admin.xgestao.export',
    targetUserId: null,
    payload: { tipo, linhas, ...(filtros ? { filtros } : {}) },
    request,
  });
}
