'use client';

import Link from 'next/link';
import { use, useState } from 'react';
import {
  RiArrowLeftLine,
  RiHammerLine,
  RiLinkM,
  RiMoneyDollarCircleLine,
  RiTimeLine,
} from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { StatsCard } from '@features/shared/components/StatsCard';
import { ProfitSummary } from '@features/shared/profit';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import {
  BotoesContato,
  ChipsSegmento,
  descricaoSituacao,
  formatarDataAdmin,
  MotivosAtencao,
  SituacaoAssinanteBadge,
  UsoRecursoBarra,
} from '@features/xgestao/admin/components/AssinanteIndicadores';
import { useDefinirContaInterna, useRegistrarContato, useXgestaoAdminAssinante } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import {
  CANAIS_CONTATO,
  formatarDocumento,
  formatarTelefone,
  NOTA_CONTATO_MAX,
  ROTULO_CANAL_CONTATO,
  type CanalContato,
} from '@features/xgestao/admin/lib/contato-assinante';
import { rotuloMotivoCancelamento } from '@features/xgestao/lib/motivo-cancelamento';
import type { ContatoAdmin } from '@features/xgestao/admin/server/contatos';
import { Textarea } from '@shared/components/ui/textarea';
import { rotuloEventoAssinatura, rotuloStatusAssinatura } from '@features/xgestao/admin/lib/situacao-assinante';
import { tierLabel } from '@features/xgestao/admin/plano-label';
import { ROTULO_ENGAJAMENTO } from '@features/xgestao/admin/lib/engajamento';
import type { SituacaoObraAdmin } from '@features/xgestao/admin/server/assinantes';
import { formatCurrency, formatDate } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';

const STATUS_OBRA: Record<string, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausada',
  concluida: 'Concluída',
};

const SITUACAO_OBRA: Record<SituacaoObraAdmin, { rotulo: string; estilo: string }> = {
  atrasada: { rotulo: 'Atrasada', estilo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  parada: { rotulo: 'Parada', estilo: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-300' },
  no_prazo: { rotulo: 'No prazo', estilo: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300' },
  concluida: { rotulo: 'Concluída', estilo: 'bg-slate-100 text-slate-700 dark:bg-muted dark:text-slate-300' },
};

function Linha({ rotulo, children, testId }: { rotulo: string; children: React.ReactNode; testId?: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm" data-testid={testId}>
      <span className="text-muted-foreground">{rotulo}</span>
      <span className="text-right font-semibold">{children}</span>
    </div>
  );
}

export default function AdminXgestaoAssinanteDetalhePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const { data, isLoading, isError, error, refetch, isFetching } = useXgestaoAdminAssinante(id);

  const voltar = (
    <Link
      href="/admin/xgestao/assinantes"
      className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
    >
      <RiArrowLeftLine /> Voltar aos assinantes
    </Link>
  );

  if (isError && !data) {
    if ((error as { status?: number } | null)?.status === 404) {
      return (
        <div className="p-6 md:p-10">
          {voltar}
          <div
            className="rounded-2xl border border-dashed border-gray-200 py-14 text-center text-sm text-muted-foreground dark:border-border"
            data-testid="xgestao-assinante-nao-encontrado"
          >
            Assinante não encontrado no xgestão.
          </div>
        </div>
      );
    }
    return (
      <div className="p-6 md:p-10">
        <AdminDashboardError onRetry={refetch} isRetrying={isFetching} />
      </div>
    );
  }

  if (isLoading || !data) {
    return (
      <div className="space-y-6 p-6 md:p-10">
        <Skeleton className="h-8 w-64" />
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
        </div>
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const { assinante, obras, lucro, historico, pagamentos, listaPagamentos, jornadaTeste, trocaAgendada, contatos } = data;
  const { consolidado, usoPlano, situacao, plano } = assinante;
  const saldo = consolidado.orcamento - consolidado.custoReal;

  return (
    <div className="space-y-6 p-6 md:p-10" data-testid="xgestao-assinante-detalhe">
      <div>
        {voltar}
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="min-w-0">
            <h1 className="text-2xl font-extrabold tracking-tight">{assinante.empreiteiraNome}</h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {assinante.nome || 'Responsável não informado'} · {assinante.email}
              {assinante.contato.telefone && <> · {formatarTelefone(assinante.contato.telefone)}</>}
            </p>
            {/* CRM-01 — atalhos de contato (WhatsApp só com telefone válido). */}
            <div className="mt-2">
              <BotoesContato telefone={assinante.contato.telefone} email={assinante.email} testId="xgestao-assinante-detalhe-botoes" />
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {/* ADM-02 — conta interna/teste sai de todas as métricas; fica em audit_logs. */}
            <BotaoContaInterna userId={assinante.userId} contaInterna={assinante.contaInterna} />
            {assinante.empreiteiraId && (
              <Button asChild variant="outline" size="sm">
                <Link href={`/admin/xgestao/obras?empreiteira_id=${encodeURIComponent(assinante.empreiteiraId)}`} data-testid="xgestao-assinante-ver-obras">
                  <RiHammerLine /> Ver na lista de obras
                </Link>
              </Button>
            )}
          </div>
        </div>
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="inline-flex rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary">
            {tierLabel(plano.tier)}
          </span>
          <SituacaoAssinanteBadge situacao={situacao} testId="xgestao-assinante-detalhe-situacao" />
          {assinante.semEmpresa && (
            <span className="inline-flex rounded-full bg-amber-50 px-2.5 py-0.5 text-xs font-semibold text-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
              Sem empresa cadastrada
            </span>
          )}
          {assinante.contaInterna && (
            <span
              className="inline-flex rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-600 dark:bg-muted dark:text-slate-300"
              data-testid="xgestao-assinante-detalhe-interna"
            >
              Conta interna: fora das métricas
            </span>
          )}
        </div>
        {assinante.atencao.length > 0 && (
          <div className="mt-3">
            <MotivosAtencao motivos={assinante.atencao} testId="xgestao-assinante-detalhe-atencao" />
          </div>
        )}
        {/* CRM-08/10 — saída e trocas de plano. */}
        <div className="mt-2">
          <ChipsSegmento
            saida={assinante.saida}
            trocas={assinante.trocas}
            totalPago={assinante.totalPago}
            motivoCancelamento={assinante.cancelamento?.motivo}
            retorno={assinante.retorno}
            testId="xgestao-assinante-detalhe-chips"
          />
        </div>
      </div>

      {/* O StatsCard só aplica `testId` quando tem link; o invólucro identifica os KPIs. */}
      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="xgestao-assinante-kpis">
        <StatsCard
          label="Orçamento gerenciado"
          value={formatCurrency(consolidado.orcamento)}
          icon={RiMoneyDollarCircleLine}
          iconBgColor="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300"
        />
        <StatsCard
          label="Custo real (saídas pagas)"
          value={formatCurrency(consolidado.custoReal)}
          icon={RiMoneyDollarCircleLine}
          iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300"
        />
        <StatsCard
          label="Obras"
          value={`${assinante.obrasGerenciadas} (${assinante.obrasAtivas} em andamento)`}
          icon={RiHammerLine}
          iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300"
        />
        <StatsCard
          label="Último acesso"
          value={assinante.ultimoAcessoEm ? formatarDataAdmin(assinante.ultimoAcessoEm) : 'Nunca'}
          icon={RiTimeLine}
          iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-assinante-plano">
          <CardHeader><CardTitle className="text-lg">Plano e situação</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Linha rotulo="Plano">{plano.nome}</Linha>
            <Linha rotulo="Mensalidade">
              {plano.emTeste ? 'Grátis no teste' : plano.valorMensal > 0 ? `${formatCurrency(plano.valorMensal)}/mês` : '—'}
            </Linha>
            <Linha rotulo="Situação">{situacao.rotulo}</Linha>
            {descricaoSituacao(situacao) && (
              <p className="rounded-lg bg-gray-50 p-2 text-xs text-muted-foreground dark:bg-muted">{descricaoSituacao(situacao)}</p>
            )}
            {/* CRM-03 — motivo informado ao cancelar (opcional). */}
            {assinante.cancelamento && (
              <Linha rotulo="Motivo do cancelamento" testId="xgestao-assinante-motivo-cancelamento">
                <span data-motivo={assinante.cancelamento.motivo ?? 'sem_resposta'}>
                  {rotuloMotivoCancelamento(assinante.cancelamento.motivo)}
                  {assinante.cancelamento.texto && <span className="block text-xs font-normal text-muted-foreground">&quot;{assinante.cancelamento.texto}&quot;</span>}
                </span>
              </Linha>
            )}
            <Linha rotulo="Já pagou ao xgestão" testId="xgestao-assinante-total-pago">
              {formatCurrency(pagamentos.total)} ({pagamentos.pagamentos} mensalidade{pagamentos.pagamentos === 1 ? '' : 's'})
            </Linha>
            {jornadaTeste && (
              <Linha rotulo="Teste grátis" testId="xgestao-assinante-jornada">
                <span data-estado={jornadaTeste.estado}>
                  {jornadaTeste.estado === 'em_teste'
                    ? `em andamento${jornadaTeste.fimTeste ? `, até ${formatarDataAdmin(jornadaTeste.fimTeste)}` : ''}`
                    : jornadaTeste.estado === 'convertido'
                      ? `assinou ${jornadaTeste.comBonus ? 'no teste, com mês extra' : 'depois do fim'}${jornadaTeste.diasAteAssinar !== null ? ` (${Math.round(jornadaTeste.diasAteAssinar)} dias)` : ''}`
                      : `terminou sem assinar${jornadaTeste.fimTeste ? ` em ${formatarDataAdmin(jornadaTeste.fimTeste)}` : ''}`}
                </span>
              </Linha>
            )}
            {/* XG48 — descida de plano marcada para a renovação. */}
            {trocaAgendada && (
              <Linha rotulo="Troca agendada" testId="xgestao-assinante-troca-agendada">
                <span>
                  {trocaAgendada.planoDe} para {trocaAgendada.planoPara} em {formatarDataAdmin(trocaAgendada.efetivaEm)}
                  {' '}({trocaAgendada.diferencaMensal < 0 ? '-' : '+'}{formatCurrency(Math.abs(trocaAgendada.diferencaMensal))}/mês)
                </span>
              </Linha>
            )}
            <Linha rotulo="Entrada">{formatarDataAdmin(String(assinante.entradaEm))}</Linha>
            <Linha rotulo="Equipe">{assinante.membros.length} vínculo(s)</Linha>
            {/* ADM-05 — arquivos das obras (titular e equipe). */}
            <Linha rotulo="Armazenamento" testId="xgestao-assinante-armazenamento">{formatarBytes(assinante.armazenamentoBytes)}</Linha>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-assinante-uso">
          <CardHeader><CardTitle className="text-lg">Uso do plano</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            <UsoRecursoBarra rotulo="Obras em aberto" uso={usoPlano.obras} testId="xgestao-assinante-uso-obras" />
            <UsoRecursoBarra rotulo="Pessoas na empresa (com o titular)" uso={usoPlano.pessoas} testId="xgestao-assinante-uso-pessoas" />
            <UsoRecursoBarra rotulo="Links públicos na obra com mais links" uso={usoPlano.links} testId="xgestao-assinante-uso-links" />
            {(assinante.bloqueiosPlano.obrasBloqueadas > 0 || assinante.bloqueiosPlano.membrosPausados > 0) && (
              <div className="space-y-2 rounded-lg bg-gray-50 p-2 dark:bg-muted" data-testid="xgestao-assinante-bloqueios-plano">
                <Linha rotulo="Obras bloqueadas pelo plano" testId="xgestao-assinante-obras-bloqueadas">{assinante.bloqueiosPlano.obrasBloqueadas}</Linha>
                <Linha rotulo="Membros pausados" testId="xgestao-assinante-membros-pausados">{assinante.bloqueiosPlano.membrosPausados}</Linha>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Mesma contagem que o app usa para liberar ou recusar um novo cadastro: obras não concluídas, pessoas ativas mais convites pendentes, links ativos e não expirados. Obras bloqueadas e membros pausados ao descer de plano ficam de fora.
            </p>
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-assinante-saude">
          <CardHeader><CardTitle className="text-lg">Saúde das obras</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Linha rotulo="Atrasadas" testId="xgestao-assinante-saude-atrasadas">{consolidado.obrasAtrasadas}</Linha>
            <Linha rotulo="Paradas" testId="xgestao-assinante-saude-paradas">{consolidado.obrasParadas}</Linha>
            <Linha rotulo="Ocorrências abertas" testId="xgestao-assinante-saude-ocorrencias">{consolidado.ocorrenciasAbertas}</Linha>
            <Linha rotulo="Pagamentos atrasados" testId="xgestao-assinante-saude-pagamentos">{consolidado.pagamentosAtrasados}</Linha>
            {/* ADM-09 — calculado na hora: a receber (cliente da obra) e a pagar (fornecedor). */}
            <Linha rotulo="A receber atrasado" testId="xgestao-assinante-saude-receber">{consolidado.recebimentosAtrasados}</Linha>
            <Linha rotulo="A pagar atrasado" testId="xgestao-assinante-saude-pagar">{consolidado.contasAPagarAtrasadas}</Linha>
            <Linha rotulo="Links públicos ativos">{consolidado.linksAtivos}</Linha>
            <Linha rotulo={saldo < 0 ? 'Acima do orçamento' : 'Saldo previsto'}>
              <span className={cn(saldo < 0 && 'text-red-600 dark:text-red-400')}>{formatCurrency(Math.abs(saldo))}</span>
            </Linha>
            {/* XG46 — uso do app pela empresa (responsável e equipe) e registros nas obras. */}
            <div className="space-y-3 border-t border-gray-100 pt-3 dark:border-border" data-testid="xgestao-assinante-engajamento" data-nivel={assinante.engajamento.nivel}>
              <Linha rotulo="Uso" testId="xgestao-assinante-engajamento-nivel">{ROTULO_ENGAJAMENTO[assinante.engajamento.nivel]}</Linha>
              <Linha rotulo="Último uso da equipe">
                {assinante.engajamento.ultimoUsoEquipeEm ? formatarDataAdmin(assinante.engajamento.ultimoUsoEquipeEm) : '—'}
              </Linha>
              <Linha rotulo="Último registro nas obras" testId="xgestao-assinante-engajamento-registro">
                {assinante.engajamento.ultimoRegistroEm ? formatarDataAdmin(assinante.engajamento.ultimoRegistroEm) : 'nenhum'}
              </Linha>
              <Linha rotulo="Registros em 30 dias" testId="xgestao-assinante-engajamento-registros">{assinante.engajamento.registros30d}</Linha>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* CRM-01/CRM-07 — contato do responsável e acompanhamento dos contatos do admin. */}
      <div className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-assinante-contato">
          <CardHeader><CardTitle className="text-lg">Contato</CardTitle></CardHeader>
          <CardContent className="space-y-3">
            <Linha rotulo="Telefone" testId="xgestao-assinante-telefone">
              {assinante.contato.telefone ? formatarTelefone(assinante.contato.telefone) : 'não informado'}
            </Linha>
            <Linha rotulo="E-mail">{assinante.email}</Linha>
            <Linha rotulo="CPF/CNPJ" testId="xgestao-assinante-documento">
              {assinante.contato.documento ? formatarDocumento(assinante.contato.documento) : 'não informado'}
            </Linha>
            <Linha rotulo="Cidade/UF" testId="xgestao-assinante-cidade">
              {[assinante.contato.cidade, assinante.contato.uf].filter(Boolean).join(' - ') || 'não informado'}
            </Linha>
            <BotoesContato telefone={assinante.contato.telefone} email={assinante.email} testId="xgestao-assinante-contato-botoes" />
          </CardContent>
        </Card>
        <AcompanhamentoContatos userId={assinante.userId} contatos={contatos} />
      </div>

      <section className="space-y-3" data-testid="xgestao-assinante-obras">
        <div className="flex flex-wrap items-end justify-between gap-2">
          <div>
            <h2 className="text-lg font-bold text-gray-900 dark:text-foreground">Obras</h2>
            <p className="text-sm text-muted-foreground">Clique numa obra para ver o conteúdo completo, os links e o lucro.</p>
          </div>
        </div>
        {obras.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-200 py-10 text-center text-sm text-muted-foreground dark:border-border">
            Nenhuma obra cadastrada.
          </div>
        ) : (
          <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white dark:border-border dark:bg-card">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 bg-gray-50 dark:border-border dark:bg-muted">
                    <th className="px-5 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Obra</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Situação</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Orçamento</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 sm:table-cell dark:text-muted-foreground">Custo real</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 md:table-cell dark:text-muted-foreground">Previsão</th>
                    <th className="hidden px-4 py-3 text-left text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell dark:text-muted-foreground">Última atividade</th>
                    <th className="hidden px-4 py-3 text-right text-xs font-semibold uppercase tracking-wide text-gray-500 lg:table-cell dark:text-muted-foreground">Links</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50 dark:divide-border">
                  {obras.map((obra) => (
                    <tr key={obra.id} className="hover:bg-gray-50 dark:hover:bg-muted" data-testid={`xgestao-assinante-obra-${obra.id}`}>
                      <td className="px-5 py-3">
                        <Link href={`/admin/xgestao/obras/${obra.id}`} className="font-semibold hover:text-primary" data-testid={`xgestao-assinante-obra-link-${obra.id}`}>
                          {obra.nome}
                        </Link>
                        <p className="mt-0.5 text-xs text-gray-400 dark:text-muted-foreground">
                          {STATUS_OBRA[obra.status] ?? obra.status} · {[obra.cidade, obra.uf].filter(Boolean).join(' - ') || 'Local não informado'}
                          {obra.bloqueadaPorPlano && <span data-testid={`xgestao-assinante-obra-bloqueada-${obra.id}`}> · bloqueada pelo plano</span>}
                        </p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={cn('inline-flex rounded-full px-2.5 py-0.5 text-xs font-semibold', SITUACAO_OBRA[obra.situacao].estilo)} data-situacao={obra.situacao}>
                          {SITUACAO_OBRA[obra.situacao].rotulo}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right font-semibold">{formatCurrency(obra.valorTotal)}</td>
                      <td className="hidden px-4 py-3 text-right sm:table-cell">{formatCurrency(obra.custoReal)}</td>
                      <td className="hidden px-4 py-3 text-gray-500 md:table-cell dark:text-muted-foreground">{obra.dataPrevisao ? formatDate(obra.dataPrevisao) : '—'}</td>
                      <td className="hidden px-4 py-3 text-gray-500 lg:table-cell dark:text-muted-foreground">{formatarDataAdmin(obra.ultimaAtividadeEm)}</td>
                      <td className="hidden px-4 py-3 text-right lg:table-cell">
                        {obra.linksAtivos > 0 ? <span className="inline-flex items-center gap-1"><RiLinkM /> {obra.linksAtivos}</span> : '—'}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </section>

      <section>
        <ProfitSummary
          summary={lucro}
          title="Lucro das obras deste assinante"
          description="Receita menos custos lançados pelo assinante. Diagnóstico interno; nunca aparece no link público."
        />
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-assinante-equipe">
          <CardHeader><CardTitle className="text-lg">Equipe</CardTitle></CardHeader>
          <CardContent>
            {assinante.membros.length === 0 ? (
              <p className="text-sm text-muted-foreground">Só o titular. Nenhum membro convidado.</p>
            ) : (
              <ul className="divide-y divide-gray-100 dark:divide-border">
                {assinante.membros.map((membro) => (
                  <li key={membro.userId} className="py-2 text-sm">
                    <p className="font-semibold">{membro.nome}</p>
                    <p className="text-xs text-muted-foreground">{membro.email} · {membro.papel} · {membro.status}</p>
                    {membro.obras.length > 0 && (
                      <p className="mt-0.5 text-xs text-gray-400 dark:text-muted-foreground">{membro.obras.map((o) => `${o.nome} (${o.permissao})`).join(', ')}</p>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-assinante-historico">
          <CardHeader><CardTitle className="text-lg">Histórico da assinatura</CardTitle></CardHeader>
          <CardContent className="space-y-4">
            {historico.assinaturas.length === 0 ? (
              <p className="text-sm text-muted-foreground">Ainda não iniciou o teste nem assinou um plano.</p>
            ) : (
              <ul className="space-y-2">
                {historico.assinaturas.map((item) => (
                  <li key={item.id} className="rounded-xl border border-gray-100 p-3 text-sm dark:border-border">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-semibold">{item.teste ? `Teste grátis · ${item.plano}` : item.plano}</span>
                      <span className="text-xs font-semibold text-muted-foreground">{rotuloStatusAssinatura(item.status)}</span>
                    </div>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Início {formatarDataAdmin(item.iniciadaEm)}
                      {item.renovaEm && ` · ${item.teste ? 'fim' : 'renova'} ${formatarDataAdmin(item.renovaEm)}`}
                      {item.canceladaEm && ` · cancelada ${formatarDataAdmin(item.canceladaEm)}`}
                      {!item.teste && item.valorMensal > 0 && ` · ${formatCurrency(item.valorMensal)}/mês`}
                    </p>
                  </li>
                ))}
              </ul>
            )}
            {/* Mensalidades e estornos no caixa (estorno em vermelho, valor negativo). */}
            {listaPagamentos.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <RiMoneyDollarCircleLine /> Pagamentos
                </p>
                <ol className="space-y-1 text-xs" data-testid="xgestao-assinante-pagamentos">
                  {listaPagamentos.map((p) => (
                    <li key={p.id} className="flex justify-between gap-3" data-tipo={p.tipo}>
                      <span className={cn(p.tipo === 'estorno' && 'text-red-600 dark:text-red-400')}>
                        {p.tipo === 'estorno' ? 'Estorno' : 'Mensalidade'} · {formatCurrency(p.valor)}
                      </span>
                      <span className="shrink-0 text-muted-foreground">{formatarDataAdmin(`${p.data}T12:00:00`)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
            {historico.eventos.length > 0 && (
              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  <RiTimeLine /> Eventos recentes
                </p>
                <ol className="space-y-1 text-xs" data-testid="xgestao-assinante-eventos">
                  {historico.eventos.map((evento) => (
                    <li key={evento.id} className="flex justify-between gap-3">
                      <span>{rotuloEventoAssinatura(evento.tipo)}</span>
                      <span className="shrink-0 text-muted-foreground">{formatarDataAdmin(evento.criadoEm)}</span>
                    </li>
                  ))}
                </ol>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function formatarBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} KB`;
  if (bytes < 1024 ** 3) return `${(bytes / 1024 ** 2).toLocaleString('pt-BR', { maximumFractionDigits: 1 })} MB`;
  return `${(bytes / 1024 ** 3).toLocaleString('pt-BR', { maximumFractionDigits: 2 })} GB`;
}

/** CRM-07 — formulário "Registrar contato" e histórico dos contatos do admin. */
function AcompanhamentoContatos({ userId, contatos }: { userId: string; contatos: ContatoAdmin[] }) {
  const registrar = useRegistrarContato(userId);
  const [canal, setCanal] = useState<CanalContato>('whatsapp');
  const [nota, setNota] = useState('');
  const enviar = (evento: React.FormEvent) => {
    evento.preventDefault();
    registrar.mutate({ canal, nota: nota.trim() || null }, { onSuccess: () => setNota('') });
  };
  return (
    <Card className="border-gray-100 dark:border-border" data-testid="xgestao-assinante-acompanhamento">
      <CardHeader><CardTitle className="text-lg">Acompanhamento</CardTitle></CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={enviar} className="space-y-2" data-testid="xgestao-contato-form">
          <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Registrar contato</p>
          <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="Canal do contato">
            {CANAIS_CONTATO.map((c) => (
              <button
                key={c}
                type="button"
                role="radio"
                aria-checked={canal === c}
                onClick={() => setCanal(c)}
                data-testid={`xgestao-contato-canal-${c}`}
                className={cn(
                  'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                  canal === c
                    ? 'border-primary bg-primary text-primary-foreground'
                    : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-border dark:text-slate-300',
                )}
              >
                {ROTULO_CANAL_CONTATO[c]}
              </button>
            ))}
          </div>
          <Textarea
            value={nota}
            onChange={(e) => setNota(e.target.value.slice(0, NOTA_CONTATO_MAX))}
            maxLength={NOTA_CONTATO_MAX}
            rows={3}
            placeholder="O que foi conversado (opcional)"
            aria-label="Nota do contato"
            data-testid="xgestao-contato-nota"
          />
          <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{nota.length}/{NOTA_CONTATO_MAX}</span>
            <Button type="submit" size="sm" disabled={registrar.isPending} data-testid="xgestao-contato-registrar">
              {registrar.isPending ? 'Registrando…' : 'Registrar contato'}
            </Button>
          </div>
          {registrar.isError && (
            <p className="text-xs text-red-600 dark:text-red-400" role="alert">{(registrar.error as Error).message}</p>
          )}
        </form>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Histórico</p>
          {contatos.length === 0 ? (
            <p className="text-sm text-muted-foreground" data-testid="xgestao-contatos-vazio">Nenhum contato registrado.</p>
          ) : (
            <ol className="space-y-2" data-testid="xgestao-contatos-historico">
              {contatos.map((c) => (
                <li key={c.id} className="rounded-xl border border-gray-100 p-3 text-sm dark:border-border" data-canal={c.canal}>
                  <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
                    <span className="font-semibold">{ROTULO_CANAL_CONTATO[c.canal]}{c.adminNome ? ` · ${c.adminNome}` : ''}</span>
                    <span className="text-muted-foreground">{formatarDataAdmin(c.criadoEm)}</span>
                  </div>
                  {c.nota && <p className="mt-1 whitespace-pre-line text-sm">{c.nota}</p>}
                </li>
              ))}
            </ol>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/** ADM-02 — marca ou desmarca a conta interna/teste (com confirmação). */
function BotaoContaInterna({ userId, contaInterna }: { userId: string; contaInterna: boolean }) {
  const mutacao = useDefinirContaInterna(userId);
  const alternar = () => {
    const pergunta = contaInterna
      ? 'Voltar esta conta para as métricas do xgestão?'
      : 'Marcar como conta interna ou de teste? Ela sai do MRR, do funil, do engajamento e do histórico.';
    if (window.confirm(pergunta)) mutacao.mutate(!contaInterna);
  };
  return (
    <Button
      variant="outline"
      size="sm"
      onClick={alternar}
      disabled={mutacao.isPending}
      data-testid="xgestao-assinante-conta-interna"
      aria-pressed={contaInterna}
    >
      {contaInterna ? 'Desmarcar conta interna' : 'Marcar como conta interna'}
    </Button>
  );
}
