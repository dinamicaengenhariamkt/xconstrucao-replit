'use client';

import Link from 'next/link';
import { RiArrowLeftLine, RiCheckboxCircleLine } from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { formatarDataAdmin, SituacaoAssinanteBadge } from '@features/xgestao/admin/components/AssinanteIndicadores';
import { useXgestaoAdminEngajamento } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import {
  DIAS_SEM_USO,
  NIVEIS_ENGAJAMENTO,
  ROTULO_ENGAJAMENTO,
  type GrupoEngajamento,
  type NivelEngajamento,
} from '@features/xgestao/admin/lib/engajamento';
import { tierLabel } from '@features/xgestao/admin/plano-label';
import { cn } from '@shared/lib/utils';

const NIVEL_STYLE: Record<NivelEngajamento, string> = {
  ativo_7d: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
  ativo_30d: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300',
  inativo: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300',
  nunca: 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300',
};

function porcento(valor: number | null): string {
  return valor === null ? 'sem dados' : `${valor.toLocaleString('pt-BR', { maximumFractionDigits: 1 })}%`;
}

function dias(valor: number | null): string {
  if (valor === null) return 'nunca usou';
  if (valor === 0) return 'hoje';
  return valor === 1 ? 'há 1 dia' : `há ${valor} dias`;
}

function Grupo({ titulo, grupo, testId }: { titulo: string; grupo: GrupoEngajamento; testId: string }) {
  return (
    <div className="rounded-2xl border border-gray-100 bg-white p-5 dark:border-gray-800 dark:bg-gray-900" data-testid={testId}>
      <div className="flex items-baseline justify-between gap-2">
        <p className="text-sm font-semibold text-gray-900 dark:text-white">{titulo}</p>
        <p className="text-xs text-muted-foreground">{grupo.total} no total</p>
      </div>
      <p className="mt-2 text-2xl font-extrabold" data-testid={`${testId}-taxa7d`}>{porcento(grupo.taxaAtivos7d)}</p>
      <p className="text-xs text-muted-foreground">usaram nos últimos 7 dias ({porcento(grupo.taxaAtivos30d)} em 30 dias)</p>
      <div className="mt-3 space-y-1.5">
        {NIVEIS_ENGAJAMENTO.map((nivel) => (
          <div key={nivel} className="flex items-center justify-between text-sm" data-testid={`${testId}-${nivel}`}>
            <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', NIVEL_STYLE[nivel])}>{ROTULO_ENGAJAMENTO[nivel]}</span>
            <span className="font-bold" data-valor={grupo.porNivel[nivel]}>{grupo.porNivel[nivel]}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default function AdminXgestaoEngajamentoPage() {
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminEngajamento();

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
        <div className="grid gap-4 lg:grid-cols-3">
          {Array.from({ length: 3 }).map((_, index) => <Skeleton key={index} className="h-56 rounded-2xl" />)}
        </div>
        <Skeleton className="h-72 rounded-2xl" />
      </div>
    );
  }

  const { resumo, semUso, assinantes } = data;

  return (
    <div className="space-y-8 p-6 md:p-10" data-testid="xgestao-engajamento-page">
      <div>
        <Link
          href="/admin/xgestao"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar ao resumo
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Engajamento</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Quem está usando o xgestão. Conta o acesso do responsável e da equipe e os registros feitos nas obras;
          vale o mais recente.
        </p>
      </div>

      <section className="grid gap-4 lg:grid-cols-3">
        <Grupo titulo="Pagantes" grupo={resumo.pagantes} testId="xgestao-engajamento-pagantes" />
        <Grupo titulo="No teste grátis" grupo={resumo.emTeste} testId="xgestao-engajamento-teste" />
        <Grupo titulo="Todos os assinantes" grupo={resumo.todos} testId="xgestao-engajamento-todos" />
      </section>

      <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-sem-uso">
        <CardHeader className="flex-row items-center justify-between gap-3">
          <div>
            <CardTitle className="text-lg">Pagam ou estão no teste e pararam de usar</CardTitle>
            <p className="mt-1 text-sm text-muted-foreground">
              Sem uso há {DIAS_SEM_USO} dias ou mais: risco de cancelar ou de não assinar.
            </p>
          </div>
          <Link
            href="/admin/xgestao/assinantes?situacao=sem_uso"
            className="shrink-0 text-sm font-bold text-muted-foreground transition-colors hover:text-primary"
            data-testid="xgestao-sem-uso-ver-lista"
          >
            ver na lista ({resumo.semUso})
          </Link>
        </CardHeader>
        <CardContent>
          {semUso.length ? (
            <div className="divide-y divide-gray-100 dark:divide-gray-800">
              {semUso.map((a) => (
                <Link
                  key={a.userId}
                  href={`/admin/xgestao/assinantes/${a.userId}`}
                  className="flex flex-wrap items-center justify-between gap-3 py-3 transition-opacity hover:opacity-80"
                  data-testid={`xgestao-sem-uso-${a.userId}`}
                >
                  <span className="min-w-0">
                    <span className="block truncate text-sm font-bold">{a.empreiteiraNome}</span>
                    <span className="block truncate text-xs text-muted-foreground">{a.nome || 'Responsável não informado'} · {tierLabel(a.tier)}</span>
                  </span>
                  <div className="flex shrink-0 items-center gap-2 text-xs">
                    <SituacaoAssinanteBadge situacao={a.situacao} />
                    <strong>{dias(a.engajamento.diasSemUso)}</strong>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center py-10 text-center">
              <RiCheckboxCircleLine className="size-8 text-emerald-500" />
              <p className="mt-2 text-sm font-bold">Todos que pagam ou testam usaram nos últimos {DIAS_SEM_USO} dias</p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="border-gray-100 dark:border-gray-800" data-testid="xgestao-engajamento-tabela">
        <CardHeader><CardTitle className="text-lg">Uso por assinante</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[640px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-semibold">Empresa</th>
                <th className="pb-2 font-semibold">Uso</th>
                <th className="pb-2 font-semibold">Responsável</th>
                <th className="pb-2 font-semibold">Equipe</th>
                <th className="pb-2 font-semibold">Último registro</th>
                <th className="pb-2 text-right font-semibold">Registros 30 dias</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {assinantes.map((a) => (
                <tr key={a.userId} data-testid={`xgestao-engajamento-${a.userId}`} data-nivel={a.engajamento.nivel}>
                  <td className="py-2">
                    <Link href={`/admin/xgestao/assinantes/${a.userId}`} className="font-semibold hover:text-primary">{a.empreiteiraNome}</Link>
                  </td>
                  <td className="py-2">
                    <span className={cn('rounded-full px-2 py-0.5 text-xs font-semibold', NIVEL_STYLE[a.engajamento.nivel])}>
                      {dias(a.engajamento.diasSemUso)}
                    </span>
                  </td>
                  <td className="py-2 text-xs">{a.engajamento.ultimoUsoTitularEm ? formatarDataAdmin(a.engajamento.ultimoUsoTitularEm) : 'nunca'}</td>
                  <td className="py-2 text-xs">{a.engajamento.ultimoUsoEquipeEm ? formatarDataAdmin(a.engajamento.ultimoUsoEquipeEm) : '—'}</td>
                  <td className="py-2 text-xs">{a.engajamento.ultimoRegistroEm ? formatarDataAdmin(a.engajamento.ultimoRegistroEm) : 'nenhum'}</td>
                  <td className="py-2 text-right font-bold">{a.engajamento.registros30d}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}
