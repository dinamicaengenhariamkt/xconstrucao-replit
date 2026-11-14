'use client';

import Link from 'next/link';
import { RiArrowLeftLine } from 'react-icons/ri';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Skeleton } from '@shared/components/ui/skeleton';
import { AdminDashboardError } from '@features/xgestao/admin/components/AdminDashboardError';
import { useXgestaoAdminHistorico } from '@features/xgestao/admin/hooks/use-admin-xgestao';
import { formatCurrency } from '@shared/lib/formatters';

const MESES = ['jan', 'fev', 'mar', 'abr', 'mai', 'jun', 'jul', 'ago', 'set', 'out', 'nov', 'dez'];

function rotuloMes(mes: string): string {
  const [ano, m] = mes.split('-');
  return `${MESES[Number(m) - 1]}/${ano.slice(2)}`;
}

export default function AdminXgestaoHistoricoPage() {
  const { data, isLoading, isError, refetch, isFetching } = useXgestaoAdminHistorico();

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
        <Skeleton className="h-72 rounded-2xl" />
        <Skeleton className="h-96 rounded-2xl" />
      </div>
    );
  }

  const meses = data.meses;
  const maiorRecorrente = Math.max(1, ...meses.map((m) => m.recorrenteFimMes));
  const maiorRecebido = Math.max(1, ...meses.map((m) => m.recebido));
  const recentes = [...meses].reverse();

  return (
    <div className="space-y-8 p-6 md:p-10" data-testid="xgestao-historico-page">
      <div>
        <Link
          href="/admin/xgestao"
          className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-muted-foreground transition-colors hover:text-primary"
        >
          <RiArrowLeftLine /> Voltar ao resumo
        </Link>
        <h1 className="text-2xl font-extrabold tracking-tight">Mês a mês</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Os últimos 12 meses do xgestão: testes, quem começou a pagar, quem saiu, recorrente e o que entrou no caixa.
        </p>
      </div>

      <Card className="border-gray-100 dark:border-border" data-testid="xgestao-historico-grafico">
        <CardHeader>
          <CardTitle className="text-lg">Recorrente no fim do mês e recebido no mês</CardTitle>
          <div className="flex flex-wrap gap-4 pt-1 text-xs text-muted-foreground">
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-primary" /> Recorrente</span>
            <span className="inline-flex items-center gap-1.5"><span className="size-2.5 rounded-sm bg-emerald-500" /> Recebido</span>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {recentes.map((m) => (
              <div key={m.mes} className="grid grid-cols-[52px_minmax(0,1fr)] items-center gap-3">
                <span className="text-xs font-semibold text-muted-foreground">{rotuloMes(m.mes)}</span>
                <div className="space-y-1">
                  <div className="flex items-center gap-2" title={`Recorrente: ${formatCurrency(m.recorrenteFimMes)}`}>
                    <div className="h-2.5 rounded-sm bg-primary" style={{ width: `${(m.recorrenteFimMes / maiorRecorrente) * 85}%`, minWidth: m.recorrenteFimMes ? 4 : 0 }} />
                    <span className="shrink-0 text-[11px] font-semibold">{formatCurrency(m.recorrenteFimMes)}</span>
                  </div>
                  <div className="flex items-center gap-2" title={`Recebido: ${formatCurrency(m.recebido)}`}>
                    <div className="h-2.5 rounded-sm bg-emerald-500" style={{ width: `${(m.recebido / maiorRecebido) * 85}%`, minWidth: m.recebido ? 4 : 0 }} />
                    <span className="shrink-0 text-[11px] text-muted-foreground">{formatCurrency(m.recebido)}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <Card className="border-gray-100 dark:border-border" data-testid="xgestao-historico-tabela">
        <CardHeader><CardTitle className="text-lg">Tabela</CardTitle></CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-sm">
            <thead>
              <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
                <th className="pb-2 font-semibold">Mês</th>
                <th className="pb-2 text-right font-semibold">Testes iniciados</th>
                <th className="pb-2 text-right font-semibold">Começaram a pagar</th>
                <th className="pb-2 text-right font-semibold">Saíram</th>
                <th className="pb-2 text-right font-semibold">Pagantes no fim</th>
                <th className="pb-2 text-right font-semibold">Recorrente no fim</th>
                <th className="pb-2 text-right font-semibold">Recebido</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-border">
              {recentes.map((m) => (
                <tr key={m.mes} data-testid={`xgestao-historico-${m.mes}`}>
                  <td className="py-2 font-semibold">{rotuloMes(m.mes)}</td>
                  <td className="py-2 text-right" data-campo="testesIniciados">{m.testesIniciados}</td>
                  <td className="py-2 text-right" data-campo="novosPagantes">{m.novosPagantes}</td>
                  <td className="py-2 text-right" data-campo="saidas">{m.saidas}</td>
                  <td className="py-2 text-right" data-campo="pagantesFimMes">{m.pagantesFimMes}</td>
                  <td className="py-2 text-right font-bold" data-campo="recorrenteFimMes">{formatCurrency(m.recorrenteFimMes)}</td>
                  <td className="py-2 text-right" data-campo="recebido">{formatCurrency(m.recebido)}</td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-xs text-muted-foreground">
            No mês corrente, os números são de hoje. Troca de plano não conta como saída nem como entrada.
            O sistema não guarda desde quando um pagamento ficou pendente, então nos meses passados quem atrasou
            conta como pagante até perder o acesso.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}
