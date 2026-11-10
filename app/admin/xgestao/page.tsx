'use client';

import { ROTULO_PROBLEMA_COBRANCA, TIPOS_PROBLEMA_COBRANCA } from '@features/xgestao/admin/lib/cobranca-rotulos';
import { tierLabel } from '@features/xgestao/admin/plano-label';
import Link from 'next/link';
import { StatsCard } from '@features/shared/components/StatsCard';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useXgestaoAdminDashboard } from '@features/xgestao/admin/hooks/use-admin-dashboard';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { formatCurrency, formatDate } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import { MotivosAtencao, SITUACAO_STYLE } from '@features/xgestao/admin/components/AssinanteIndicadores';
import { ROTULO_SITUACAO, SITUACOES_ASSINANTE } from '@features/xgestao/admin/lib/situacao-assinante';
import {
  RiAlarmWarningLine,
  RiCheckboxCircleLine,
  RiGroupLine,
  RiHammerLine,
  RiLinkM,
  RiMoneyDollarCircleLine,
  RiPauseCircleLine,
  RiPieChart2Line,
} from 'react-icons/ri';
import type {
  XgestaoAdminAlerta,
  XgestaoAdminObraStatus,
} from '@features/xgestao/admin/server/dashboard';


const STATUS_LABEL: Record<XgestaoAdminObraStatus, string> = {
  planejamento: 'Planejamento',
  em_andamento: 'Em andamento',
  pausada: 'Pausadas',
  concluida: 'Concluídas',
};

const STATUS_STYLE: Record<XgestaoAdminObraStatus, string> = {
  planejamento: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  em_andamento: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  pausada: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  concluida: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

const ALERT_STYLE: Record<XgestaoAdminAlerta['severidade'], string> = {
  critica: 'border-red-200 bg-red-50 text-red-700 dark:border-red-900/50 dark:bg-red-950/30 dark:text-red-300',
  atencao: 'border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/50 dark:bg-amber-950/30 dark:text-amber-300',
  info: 'border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/50 dark:bg-blue-950/30 dark:text-blue-300',
};

export default function AdminXgestaoPage() {
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminDashboard();
  const indicadores = data?.indicadores;
  const resumo = data?.assinaturas?.resumo;
  const comercial = data?.comercial;
  const engajamento = data?.engajamento;
  const atencao = data?.assinaturas?.atencao ?? [];
  const distribuicao = indicadores?.distribuicaoPlanos ?? { free: 0, pro: 0, enterprise: 0, basic: 0, basic_plus: 0, premium: 0 };
  const saldoPrevisto = (indicadores?.orcamentoGerenciado ?? 0) - (indicadores?.valorPago ?? 0);
  const cards = [
    { label: 'Responsáveis com acesso', value: String(indicadores?.assinantes ?? 0), icon: RiGroupLine, iconBgColor: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20', href: '/admin/xgestao/assinantes' },
    { label: 'Vínculos de equipe', value: String(indicadores?.membrosEquipe ?? 0), icon: RiGroupLine, iconBgColor: 'bg-cyan-50 text-cyan-600 dark:bg-cyan-900/20' },
    { label: 'Obras ativas', value: String(indicadores?.obrasAtivas ?? 0), icon: RiHammerLine, iconBgColor: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20', href: '/admin/xgestao/obras' },
    // XG34 — era "Progresso médio", lido de `obras.progresso` (coluna sem escritor desde a XG23).
    { label: 'Obras atrasadas', value: String(indicadores?.obrasAtrasadas ?? 0), icon: RiAlarmWarningLine, iconBgColor: 'bg-red-50 text-red-600 dark:bg-red-900/20', href: '/admin/xgestao/obras?situacao=atrasada' },
    // XG36 — em andamento e sem nenhum registro há N dias (configurável).
    { label: 'Obras paradas', value: String(indicadores?.obrasParadas ?? 0), icon: RiPauseCircleLine, iconBgColor: 'bg-orange-50 text-orange-600 dark:bg-orange-900/20', href: '/admin/xgestao/obras?situacao=parada' },
    { label: 'Orçamento gerenciado', value: formatCurrency(indicadores?.orcamentoGerenciado ?? 0), icon: RiMoneyDollarCircleLine, iconBgColor: 'bg-violet-50 text-violet-600 dark:bg-violet-900/20' },
  ];

  if (isLoading && !data) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <div><Skeleton className="h-8 w-52" /><Skeleton className="h-4 w-80 mt-2" /></div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, index) => <Skeleton key={index} className="h-32 rounded-2xl" />)}
        </div>
        <div className="grid gap-4 lg:grid-cols-2">
          <Skeleton className="h-64 rounded-2xl" />
          <Skeleton className="h-64 rounded-2xl" />
        </div>
        <Skeleton className="h-80 rounded-2xl" />
      </div>
    );
  }

  if (isError && !data) {
    return (
      <AdminDashboardError
        isRetrying={isFetching}
        onRetry={() => void refetch()}
      />
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-xgestao-page">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">xgestão</h1>
          <p className="text-sm text-muted-foreground mt-1">Visão operacional e financeira das obras próprias gerenciadas.</p>
        </div>
        <nav className="flex flex-wrap gap-2">
          {[
            { href: '/admin/xgestao/obras', label: 'Obras' },
            { href: '/admin/xgestao/assinantes', label: 'Assinantes' },
            { href: '/admin/xgestao/conversao', label: 'Conversão' },
            { href: '/admin/xgestao/engajamento', label: 'Engajamento' },
            { href: '/admin/xgestao/historico', label: 'Mês a mês' },
            { href: '/admin/xgestao/financeiro', label: 'Financeiro' },
          ].map((atalho) => (
            <Link
              key={atalho.href}
              href={atalho.href}
              className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-semibold text-gray-600 transition-colors hover:border-primary/40 hover:text-primary dark:border-gray-700 dark:text-gray-300"
            >
              {atalho.label}
            </Link>
          ))}
        </nav>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-6 gap-4">
        {cards.map((card) => (
          <StatsCard key={card.label} {...card} luminous testId={`xgestao-kpi-${card.label.toLowerCase().replaceAll(' ', '-')}`} />
        ))}
      </div>
      <p className="-mt-5 text-sm text-muted-foreground">
        {indicadores?.empreiteirasComPerfil ?? 0} empresas com perfil; {indicadores?.assinantes ?? 0} responsáveis com acesso xgestão; {indicadores?.membrosEquipe ?? 0} vínculos de membros. Membros são exibidos dentro da empresa e não contam como empresa ou assinatura.
      </p>
      <div className="grid gap-4 lg:grid-cols-3">
        <Card className="border-gray-100 dark:border-gray-800 lg:col-span-2" data-testid="xgestao-operacao-resumo">
          <CardHeader>
            <CardTitle className="text-lg">Operação das obras</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3 sm:grid-cols-2">
            {(Object.keys(STATUS_LABEL) as XgestaoAdminObraStatus[]).map((status) => (
              <div key={status} className="flex items-center justify-between rounded-xl border border-gray-100 p-3 dark:border-gray-800">
                <span className={cn('rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_STYLE[status])}>
                  {STATUS_LABEL[status]}
                </span>
                <span className="text-xl font-extrabold">{indicadores?.distribuicaoStatus[status] ?? 0}</span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-financeiro-resumo">
          <CardHeader>
            <CardTitle className="text-lg">Resumo financeiro</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Custo real (saídas pagas)</p>
              <p className="mt-1 text-2xl font-extrabold">{formatCurrency(indicadores?.valorPago ?? 0)}</p>
            </div>
            <div className="h-2 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
              <div
                className="h-full rounded-full bg-primary"
                style={{
                  width: `${Math.min(100, indicadores?.orcamentoGerenciado
                    ? ((indicadores.valorPago / indicadores.orcamentoGerenciado) * 100)
                    : 0)}%`,
                }}
              />
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className={saldoPrevisto < 0 ? 'font-semibold text-red-600 dark:text-red-400' : 'text-muted-foreground'}>
                {saldoPrevisto < 0 ? 'Acima do orçamento' : 'Saldo previsto'}
              </span>
              <span className={cn('font-bold', saldoPrevisto < 0 && 'text-red-600 dark:text-red-400')}>
                {formatCurrency(Math.abs(saldoPrevisto))}
              </span>
            </div>
            <div className="flex items-center justify-between text-sm">
              <span className="flex items-center gap-1.5 text-muted-foreground"><RiLinkM /> Links ativos</span>
              <span className="font-bold">{indicadores?.linksPublicosAtivos ?? 0}</span>
            </div>
            <div className="border-t border-gray-100 pt-3 dark:border-gray-800">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                <RiPieChart2Line /> Distribuição dos planos
              </p>
              <div className="grid grid-cols-3 gap-2 text-center">
                {(['basic', 'basic_plus', 'premium', 'free', 'pro', 'enterprise'] as const).map(tier => (
                  <div key={tier} className="rounded-lg bg-gray-50 p-2 dark:bg-gray-800/60">
                    <strong className="block">{distribuicao[tier] ?? 0}</strong>
                    <span className="text-[10px] text-muted-foreground">{tierLabel(tier)}</span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <section className="grid gap-4 lg:grid-cols-[1.4fr_1fr]">
        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-obras-recentes">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Obras recentes</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">Somente obras próprias de assinantes com acesso xgestão.</p>
            </div>
            <Link
              href="/admin/xgestao/obras"
              className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            >
              ver todas ({indicadores?.obrasGerenciadas ?? 0})
            </Link>
          </CardHeader>
          <CardContent>
            {data?.obras.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {data.obras.map((obra) => (
                  <div key={obra.id} className="grid gap-3 py-4 sm:grid-cols-[minmax(0,1fr)_110px_130px] sm:items-center" data-testid={`xgestao-obra-${obra.id}`}>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <Link
                          href={`/admin/xgestao/obras/${obra.id}`}
                          className="truncate text-sm font-bold hover:text-primary"
                          data-testid={`xgestao-obra-detalhe-${obra.id}`}
                        >
                          {obra.nome}
                        </Link>
                        {obra.linkPublicoAtivo && (
                          <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2 py-0.5 text-[10px] font-semibold text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300">
                            <RiLinkM /> Link ativo
                          </span>
                        )}
                      </div>
                      <p className="mt-1 truncate text-xs text-muted-foreground">
                        {obra.empreiteira} · {[obra.cidade, obra.uf].filter(Boolean).join(' - ') || 'Local não informado'}
                      </p>
                    </div>
                    <div>
                      <span className={cn('inline-flex rounded-full px-2.5 py-1 text-xs font-semibold', STATUS_STYLE[obra.status])}>
                        {STATUS_LABEL[obra.status]}
                      </span>
                    </div>
                    <div className="sm:text-right">
                      <p className="text-sm font-extrabold">{obra.dataPrevisao ? `Prazo ${formatDate(obra.dataPrevisao)}` : 'Sem prazo'}</p>
                      <p className="text-xs text-muted-foreground">{formatCurrency(obra.valorTotal)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed py-12 text-center text-sm text-muted-foreground">
                Ainda não há obras próprias no xgestão.
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-alertas">
          <CardHeader>
            <CardTitle className="text-lg">Alertas operacionais</CardTitle>
            <div className="flex flex-wrap gap-2 pt-2 text-xs">
              <span className="rounded-full bg-red-50 px-2.5 py-1 font-semibold text-red-700 dark:bg-red-950/30 dark:text-red-300">
                {data?.alertas.totais.ocorrenciasAbertas ?? 0} ocorrências
              </span>
              <span className="rounded-full bg-amber-50 px-2.5 py-1 font-semibold text-amber-700 dark:bg-amber-950/30 dark:text-amber-300">
                {/* ADM-09 — calculado na hora, separado por lado. */}
                {data?.alertas.totais.recebimentosAtrasados ?? 0} a receber · {data?.alertas.totais.contasAPagarAtrasadas ?? 0} a pagar atrasados
              </span>
              <span className="rounded-full bg-slate-100 px-2.5 py-1 font-semibold text-slate-700 dark:bg-slate-800 dark:text-slate-300">
                {data?.alertas.totais.obrasPausadas ?? 0} pausadas
              </span>
            </div>
          </CardHeader>
          <CardContent>
            {data?.alertas.itens.length ? (
              <div className="space-y-3">
                {data.alertas.itens.map((alerta) => (
                  // O alerta leva à obra que o originou: sem isso, saber que há
                  // uma ocorrência aberta não ajuda a chegar até ela.
                  <Link
                    key={alerta.id}
                    href={`/admin/xgestao/obras/${alerta.obraId}`}
                    className={cn('block rounded-xl border p-3 transition-opacity hover:opacity-80', ALERT_STYLE[alerta.severidade])}
                  >
                    <div className="flex items-start gap-2">
                      {alerta.tipo === 'obra_pausada' ? <RiPauseCircleLine className="mt-0.5 shrink-0" /> : <RiAlarmWarningLine className="mt-0.5 shrink-0" />}
                      <div className="min-w-0">
                        <p className="text-sm font-bold">{alerta.titulo}</p>
                        <p className="mt-0.5 text-xs opacity-90">{alerta.descricao}</p>
                        <p className="mt-1 truncate text-[11px] opacity-70">{alerta.obra}</p>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <RiCheckboxCircleLine className="size-9 text-emerald-500" />
                <p className="mt-3 text-sm font-bold">Nenhum alerta operacional</p>
                <p className="mt-1 text-xs text-muted-foreground">Não há ocorrências abertas, atrasos ou obras pausadas.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>

      {/* XG45 — números comerciais; o detalhe fica em Conversão e Financeiro. */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" data-testid="xgestao-comercial-resumo">
        {[
          { id: 'conversao', href: '/admin/xgestao/conversao', rotulo: 'Conversão do teste', valor: comercial?.taxaConversao == null ? 'sem dados' : `${comercial.taxaConversao.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, nota: `${comercial?.convertidos ?? 0} assinaram · ${comercial?.emTeste ?? 0} no teste` },
          { id: 'mrr', href: '/admin/xgestao/financeiro', rotulo: 'Recorrente mensal', valor: formatCurrency(comercial?.mrr ?? 0), nota: comercial?.ticketMedio == null ? 'sem pagantes' : `ticket médio ${formatCurrency(comercial.ticketMedio)}` },
          { id: 'saidas', href: '/admin/xgestao/conversao', rotulo: 'Saíram no mês', valor: String(comercial?.encerradosNoMes ?? 0), nota: `${formatCurrency(comercial?.mrrPerdidoNoMes ?? 0)} por mês a menos` },
          { id: 'risco', href: '/admin/xgestao/conversao', rotulo: 'Receita em risco', valor: formatCurrency(comercial?.mrrEmRisco ?? 0), nota: `${comercial?.agendados ?? 0} cancelamento(s) agendado(s) e pendências` },
          // XG46 — uso: quem paga e usa, e quem parou.
          { id: 'ativos', href: '/admin/xgestao/engajamento', rotulo: 'Pagantes ativos na semana', valor: engajamento?.pagantes.taxaAtivos7d == null ? 'sem dados' : `${engajamento.pagantes.taxaAtivos7d.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`, nota: `${engajamento?.pagantes.porNivel.ativo_7d ?? 0} de ${engajamento?.pagantes.total ?? 0} usaram nos últimos 7 dias` },
          { id: 'sem-uso', href: '/admin/xgestao/engajamento', rotulo: 'Pararam de usar', valor: String(engajamento?.semUso ?? 0), nota: 'pagam ou testam e não usam há 14 dias ou mais' },
          // ADM-03 — cobrança com problema; a lista fica no Financeiro.
          {
            id: 'cobranca',
            href: '/admin/xgestao/financeiro#cobranca',
            rotulo: 'Cobrança com problema',
            valor: String(data?.cobranca?.assinantes ?? 0),
            nota: data?.cobranca
              ? TIPOS_PROBLEMA_COBRANCA.filter((t) => data.cobranca.totais[t] > 0)
                .map((t) => `${data.cobranca.totais[t]} ${ROTULO_PROBLEMA_COBRANCA[t].toLowerCase()}`)
                .join(' · ') || 'nenhuma no momento'
              : 'nenhuma no momento',
          },
        ].map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-primary/40 dark:border-gray-800 dark:bg-gray-900"
            data-testid={`xgestao-comercial-${item.id}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.rotulo}</p>
            <p className="mt-1 text-2xl font-extrabold">{item.valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.nota}</p>
          </Link>
        ))}
      </section>

      {/* CRM-06 — atalhos para os segmentos mais urgentes, já filtrados e ordenados na lista. */}
      <section className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4" data-testid="xgestao-segmentos-urgentes">
        {[
          { id: 'teste-7d', href: '/admin/xgestao/assinantes?janela=teste_7d&ordem=urgencia', rotulo: 'Teste acaba em 7 dias', valor: resumo?.testeAcabando7d ?? 0, nota: 'em teste grátis; contato antes de acabar' },
          { id: 'aguardando', href: '/admin/xgestao/assinantes?situacao=aguardando_pagamento&ordem=urgencia', rotulo: 'Aguardando 1º pagamento', valor: resumo?.porSituacao.aguardando_pagamento ?? 0, nota: 'assinaram no teste e ainda não pagaram' },
          { id: 'inadimplentes', href: '/admin/xgestao/assinantes?situacao=inadimplente&ordem=atraso', rotulo: 'Inadimplentes', valor: resumo?.porSituacao.inadimplente ?? 0, nota: 'pagamento pendente, na carência' },
          { id: 'cancelamentos', href: '/admin/xgestao/assinantes?situacao=cancelamento_agendado&ordem=urgencia', rotulo: 'Cancelamentos agendados', valor: resumo?.porSituacao.cancelamento_agendado ?? 0, nota: 'ainda usam até o fim do período pago' },
        ].map((item) => (
          <Link
            key={item.id}
            href={item.href}
            className="rounded-2xl border border-gray-100 bg-white p-5 transition-colors hover:border-primary/40 dark:border-gray-800 dark:bg-gray-900"
            data-testid={`xgestao-segmento-${item.id}`}
          >
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.rotulo}</p>
            <p className="mt-1 text-2xl font-extrabold" data-valor={item.valor}>{item.valor}</p>
            <p className="mt-1 text-xs text-muted-foreground">{item.nota}</p>
          </Link>
        ))}
      </section>

      {/* XG44 — a home mostra o macro das assinaturas; a lista completa e o
          detalhe de cada assinante ficam nas páginas próprias. */}
      <section className="grid gap-4 lg:grid-cols-[1fr_1.4fr]">
        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-assinaturas-resumo">
          <CardHeader className="flex-row items-center justify-between">
            <CardTitle className="text-lg">Situação das assinaturas</CardTitle>
            <Link href="/admin/xgestao/assinantes" className="text-sm font-bold text-muted-foreground transition-colors hover:text-primary">
              ver todos ({resumo?.total ?? 0})
            </Link>
          </CardHeader>
          <CardContent className="space-y-2">
            {SITUACOES_ASSINANTE.map((codigo) => (
              <Link
                key={codigo}
                href={`/admin/xgestao/assinantes?situacao=${codigo}`}
                className="flex items-center justify-between rounded-xl border border-gray-100 px-3 py-2 transition-colors hover:border-primary/40 dark:border-gray-800"
                data-testid={`xgestao-assinaturas-situacao-${codigo}`}
              >
                <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', SITUACAO_STYLE[codigo])}>
                  {ROTULO_SITUACAO[codigo]}
                </span>
                <span className="text-lg font-extrabold">{resumo?.porSituacao[codigo] ?? 0}</span>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-assinantes-atencao">
          <CardHeader className="flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg">Assinantes que pedem atenção</CardTitle>
              <p className="mt-1 text-sm text-muted-foreground">
                Pagamento pendente, teste acabando, cancelamento agendado ou plano no limite.
              </p>
            </div>
            <Link
              href="/admin/xgestao/assinantes?situacao=atencao"
              className="shrink-0 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
              data-testid="xgestao-assinantes-atencao-ver-todos"
            >
              ver todos ({resumo?.precisamAtencao ?? 0})
            </Link>
          </CardHeader>
          <CardContent>
            {atencao.length ? (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                {atencao.map((item) => (
                  <Link
                    key={item.userId}
                    href={`/admin/xgestao/assinantes/${item.userId}`}
                    className="block py-3 transition-opacity hover:opacity-80"
                    data-testid={`xgestao-atencao-${item.userId}`}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <div className="min-w-0">
                        <p className="truncate text-sm font-bold">{item.empreiteiraNome}</p>
                        <p className="truncate text-xs text-muted-foreground">
                          {item.nome || 'Responsável não informado'} · {tierLabel(item.tier)}
                        </p>
                      </div>
                      <span className={cn('rounded-full px-2.5 py-0.5 text-xs font-semibold', SITUACAO_STYLE[item.situacao.codigo])}>
                        {item.situacao.rotulo}
                      </span>
                    </div>
                    <div className="mt-2"><MotivosAtencao motivos={item.atencao} /></div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-12 text-center">
                <RiCheckboxCircleLine className="size-9 text-emerald-500" />
                <p className="mt-3 text-sm font-bold">Nenhum assinante pede atenção agora</p>
              </div>
            )}
          </CardContent>
        </Card>
      </section>
    </div>
  );
}