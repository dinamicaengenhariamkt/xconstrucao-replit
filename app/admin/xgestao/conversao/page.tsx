'use client';

import Link from 'next/link';
import { useState } from 'react';
import {
  RiArrowLeftLine,
  RiCloseCircleLine,
  RiLineChartLine,
  RiTimeLine,
  RiUserFollowLine,
  RiUserUnfollowLine,
} from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { StatsCard } from '@features/shared/components/StatsCard';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { useXgestaoAdminConversao } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import { formatCurrency, formatDate } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import { PERIODOS_ADMIN, ROTULO_PERIODO, type PeriodoAdmin } from '@features/xgestao/admin/lib/estornos';
import { rotuloMotivoCancelamento } from '@features/xgestao/lib/motivo-cancelamento';

const TIPO_SAIDA: Record<string, { rotulo: string; estilo: string }> = {
  agendado: { rotulo: 'Cancelou, usa até', estilo: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300' },
  inadimplente: { rotulo: 'Pagamento pendente até', estilo: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300' },
  encerrado: { rotulo: 'Saiu em', estilo: 'bg-slate-100 text-slate-700 dark:bg-muted dark:text-slate-300' },
};

function porcento(valor: number | null): string {
  return valor === null ? 'sem dados' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function dias(valor: number | null): string {
  return valor === null ? 'sem dados' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })} dias`;
}

function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${m}/${ano}`;
}

function NomeAssinante({ userId, empreiteiraNome, nome, prefixo }: { userId: string; empreiteiraNome: string; nome: string | null; prefixo: string }) {
  return (
    <Link href={`/admin/xgestao/assinantes/${userId}`} className="min-w-0 hover:text-primary" data-testid={`${prefixo}-${userId}`}>
      <p className="truncate text-sm font-bold">{empreiteiraNome}</p>
      <p className="truncate text-xs text-muted-foreground">{nome || 'Responsável não informado'}</p>
    </Link>
  );
}

export default function AdminXgestaoConversaoPage() {
  // CRM-03 — período do resumo de motivos de cancelamento.
  const [periodo, setPeriodo] = useState<PeriodoAdmin>('mes');
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminConversao(periodo);

  if (isError && !data) {
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
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const { funil, recentes, cancelamentos, motivosCancelamento } = data;

  return (
    <div className="space-y-8 p-6 md:p-10" data-testid="xgestao-conversao-page">
      <div>
        <Link
          href="/admin/xgestao"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar ao resumo
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Conversão e cancelamentos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem começa o teste grátis, quantos assinam, em quanto tempo, e quem está saindo.
        </p>
      </div>

      <section data-testid="xgestao-funil">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">Teste grátis</h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatsCard label="Começaram o teste" value={String(funil.iniciados)} icon={RiUserFollowLine} iconBgColor="bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-300" testId="xgestao-funil-iniciados" href="/admin/xgestao/assinantes?situacao=em_teste" />
          <StatsCard label="Assinaram" value={String(funil.convertidos)} icon={RiLineChartLine} iconBgColor="bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-300" testId="xgestao-funil-convertidos" href="/admin/xgestao/assinantes?situacao=pago" />
          <StatsCard label="Não assinaram" value={String(funil.perdidos)} icon={RiUserUnfollowLine} iconBgColor="bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-300" testId="xgestao-funil-perdidos" href="/admin/xgestao/assinantes?situacao=somente_leitura" />
          <StatsCard label="Tempo até assinar (mediana)" value={dias(funil.medianaDiasAteAssinar)} icon={RiTimeLine} iconBgColor="bg-violet-50 text-violet-600 dark:bg-violet-900/20 dark:text-violet-300" />
        </div>
        <div className="mt-4 grid gap-3 rounded-2xl border border-gray-100 bg-white p-5 text-sm sm:grid-cols-2 lg:grid-cols-4 dark:border-border dark:bg-card">
          <div data-testid="xgestao-funil-taxa">
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Conversão</p>
            <p className="mt-1 text-2xl font-extrabold">{porcento(funil.taxaConversao)}</p>
            <p className="text-xs text-muted-foreground">entre quem já terminou o teste</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ainda no teste</p>
            <p className="mt-1 text-2xl font-extrabold" data-testid="xgestao-funil-em-teste">{funil.emTeste}</p>
            <p className="text-xs text-muted-foreground">ainda podem assinar com o mês extra</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Assinaram no teste</p>
            <p className="mt-1 text-2xl font-extrabold" data-testid="xgestao-funil-no-teste">{funil.convertidosNoTeste}</p>
            <p className="text-xs text-muted-foreground">{funil.convertidosDepois} assinaram depois do fim</p>
          </div>
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Nunca começaram</p>
            <p className="mt-1 text-2xl font-extrabold" data-testid="xgestao-funil-sem-teste">{funil.semTeste}</p>
            <p className="text-xs text-muted-foreground">com acesso liberado e sem teste</p>
            {/* ADM-06 — liberados que ainda não cadastraram a empresa. */}
            <p className="text-xs text-muted-foreground" data-testid="xgestao-funil-sem-empresa">{funil.semEmpresa} sem empresa cadastrada</p>
          </div>
        </div>
      </section>

      <Card className="border-gray-100 dark:border-border" data-testid="xgestao-coortes">
        <CardHeader>
          <CardTitle className="text-lg">Por mês de início do teste</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          {funil.coortes.length ? (
            <table className="w-full min-w-[480px] text-sm">
              <thead>
                <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                  <th className="pb-2 font-semibold">Mês</th>
                  <th className="pb-2 text-right font-semibold">Começaram</th>
                  <th className="pb-2 text-right font-semibold">No teste</th>
                  <th className="pb-2 text-right font-semibold">Assinaram</th>
                  <th className="pb-2 text-right font-semibold">Não assinaram</th>
                  <th className="pb-2 text-right font-semibold">Conversão</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 dark:divide-border">
                {funil.coortes.map((c) => (
                  <tr key={c.mes} data-testid={`xgestao-coorte-${c.mes}`}>
                    <td className="py-2 font-semibold">{rotuloMes(c.mes)}</td>
                    <td className="py-2 text-right">{c.iniciados}</td>
                    <td className="py-2 text-right">{c.emTeste}</td>
                    <td className="py-2 text-right">{c.convertidos}</td>
                    <td className="py-2 text-right">{c.perdidos}</td>
                    <td className="py-2 text-right font-bold">{porcento(c.taxaConversao)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          ) : (
            <p className="py-8 text-center text-sm text-muted-foreground">Ninguém começou o teste ainda.</p>
          )}
        </CardContent>
      </Card>

      <section className="grid gap-4 lg:grid-cols-2">
        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-convertidos-recentes">
          <CardHeader><CardTitle className="text-lg">Assinaram por último</CardTitle></CardHeader>
          <CardContent>
            {recentes.convertidos.length ? (
              <div className="divide-y divide-gray-100 dark:divide-border">
                {recentes.convertidos.map((c) => (
                  <div key={c.userId} className="flex items-center justify-between gap-3 py-3">
                    <NomeAssinante {...c} prefixo="xgestao-convertido" />
                    <div className="shrink-0 text-right text-xs">
                      <p className="font-bold">{c.plano ?? 'Plano'} · {formatDate(c.assinouEm)}</p>
                      <p className="text-muted-foreground">{c.comBonus ? 'no teste, com mês extra' : 'depois do teste'} · {dias(c.diasAteAssinar)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Ninguém assinou depois do teste ainda.</p>
            )}
          </CardContent>
        </Card>

        <Card className="border-gray-100 dark:border-border" data-testid="xgestao-perdidos-recentes">
          <CardHeader>
            <CardTitle className="text-lg">Terminaram o teste sem assinar</CardTitle>
            <p className="text-sm text-muted-foreground">Estão em somente leitura: bons alvos para um contato.</p>
          </CardHeader>
          <CardContent>
            {recentes.perdidos.length ? (
              <div className="divide-y divide-gray-100 dark:divide-border">
                {recentes.perdidos.map((p) => (
                  <div key={p.userId} className="flex items-center justify-between gap-3 py-3">
                    <NomeAssinante {...p} prefixo="xgestao-perdido" />
                    <p className="shrink-0 text-xs text-muted-foreground">{p.fimTeste ? `teste acabou ${formatDate(p.fimTeste)}` : 'sem data'}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-8 text-center text-sm text-muted-foreground">Ninguém terminou o teste sem assinar.</p>
            )}
          </CardContent>
        </Card>
      </section>

      <section data-testid="xgestao-cancelamentos">
        <h2 className="mb-4 text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-muted-foreground">
          Cancelamentos desde {formatDate(cancelamentos.desde)}
        </h2>
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          {[
            { id: 'novas', rotulo: 'Novas assinaturas no mês', v: cancelamentos.novasNoMes },
            { id: 'encerrados', rotulo: 'Saíram no mês', v: cancelamentos.encerradosNoMes },
            { id: 'agendados', rotulo: 'Cancelaram, ainda usam', v: cancelamentos.agendados },
            { id: 'inadimplentes', rotulo: 'Pagamento pendente', v: cancelamentos.inadimplentes },
          ].map((item) => (
            <div key={item.id} className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-border dark:bg-card" data-testid={`xgestao-cancel-${item.id}`}>
              <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">{item.rotulo}</p>
              <p className="mt-1 text-2xl font-extrabold" data-valor={item.v.quantidade}>{item.v.quantidade}</p>
              <p className="text-xs text-muted-foreground">{formatCurrency(item.v.mrr)} por mês</p>
            </div>
          ))}
        </div>
        <p className="mt-3 text-sm text-muted-foreground" data-testid="xgestao-cancel-taxa">
          Taxa de cancelamento do mês: <strong className="text-foreground">{porcento(cancelamentos.taxaCancelamentoMes)}</strong>
          {' '}({cancelamentos.encerradosNoMes.quantidade} de {cancelamentos.pagantesInicioMes} pagantes no começo do mês).
          {' '}{cancelamentos.pedidosNoMes} pedido(s) de cancelamento feitos no mês.
        </p>

        <Card className="mt-4 border-gray-100 dark:border-border" data-testid="xgestao-saidas">
          <CardHeader><CardTitle className="text-lg">Quem está saindo ou saiu</CardTitle></CardHeader>
          <CardContent>
            {cancelamentos.saidas.length ? (
              <div className="divide-y divide-gray-100 dark:divide-border">
                {cancelamentos.saidas.map((s) => (
                  <div key={`${s.userId}-${s.tipo}`} className="flex flex-wrap items-center justify-between gap-3 py-3">
                    <div className="min-w-0">
                      <NomeAssinante {...s} prefixo="xgestao-saida" />
                      {/* CRM-03 — motivo informado ao cancelar (só quem pediu). */}
                      {(s.motivo || s.motivoTexto) && (
                        <p className="mt-0.5 text-xs text-muted-foreground" data-testid={`xgestao-saida-motivo-${s.userId}`}>
                          Motivo: {rotuloMotivoCancelamento(s.motivo)}{s.motivoTexto ? ` · "${s.motivoTexto}"` : ''}
                        </p>
                      )}
                    </div>
                    <div className="flex shrink-0 items-center gap-2 text-xs">
                      <span className={cn('rounded-full px-2.5 py-0.5 font-semibold', TIPO_SAIDA[s.tipo]?.estilo)} data-tipo={s.tipo}>
                        {TIPO_SAIDA[s.tipo]?.rotulo ?? s.tipo} {formatDate(s.data)}
                      </span>
                      <span className="font-bold">{s.plano} · {formatCurrency(s.valorMensal)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center py-10 text-center">
                <RiCloseCircleLine className="size-8 text-emerald-500 dark:text-emerald-400" />
                <p className="mt-2 text-sm font-bold">Ninguém saindo neste mês</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* CRM-03 — motivos informados ao cancelar, contados por pedido no período. */}
        <Card className="mt-4 border-gray-100 dark:border-border" data-testid="xgestao-motivos-cancelamento">
          <CardHeader className="flex-row flex-wrap items-center justify-between gap-2">
            <CardTitle className="text-lg">Motivos de cancelamento</CardTitle>
            <div className="flex flex-wrap gap-2" role="group" aria-label="Período dos motivos">
              {PERIODOS_ADMIN.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setPeriodo(p)}
                  aria-pressed={periodo === p}
                  data-testid={`xgestao-motivos-periodo-${p}`}
                  className={cn(
                    'rounded-full border px-3 py-1 text-xs font-semibold transition-colors',
                    periodo === p
                      ? 'border-primary bg-primary text-primary-foreground'
                      : 'border-gray-200 text-gray-600 hover:border-primary/40 hover:text-primary dark:border-border dark:text-slate-300',
                  )}
                >
                  {ROTULO_PERIODO[p]}
                </button>
              ))}
            </div>
          </CardHeader>
          <CardContent>
            {motivosCancelamento.total ? (
              <div className="divide-y divide-gray-100 dark:divide-border">
                {motivosCancelamento.porMotivo.map((m) => (
                  <div key={m.motivo} className="flex items-center justify-between gap-3 py-2 text-sm" data-testid={`xgestao-motivo-${m.motivo}`}>
                    <span>{m.rotulo}</span>
                    <span className="font-bold" data-valor={m.quantidade}>
                      {m.quantidade} <span className="text-xs font-normal text-muted-foreground">({Math.round((m.quantidade / motivosCancelamento.total) * 100)}%)</span>
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="py-6 text-center text-sm text-muted-foreground">Nenhum pedido de cancelamento desde {formatDate(motivosCancelamento.desde)}.</p>
            )}
            <p className="mt-2 text-xs text-muted-foreground">
              {motivosCancelamento.total} pedido(s) desde {formatDate(motivosCancelamento.desde)}. O motivo é opcional para quem cancela.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}
