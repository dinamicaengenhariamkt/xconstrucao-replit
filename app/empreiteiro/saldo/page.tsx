'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiSettings3Line,
  RiInformationLine,
  RiExternalLinkLine,
} from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@shared/components/ui/card';
import { Input } from '@shared/components/ui/input';
import { Label } from '@shared/components/ui/label';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { formatCurrency, formatDateTime } from '@shared/lib/formatters';
import { cn } from '@shared/lib/utils';
import { useToast } from '@shared/hooks/use-toast';
import { useSaldo, useSolicitarSaque, type SaqueItem } from '@features/marketplace/hooks/use-saldo';

const SAQUE_STATUS_LABELS: Record<SaqueItem['status'], string> = {
  concluido: 'Concluído',
  pendente: 'Pendente',
  falhou: 'Falhou',
};

const SAQUE_STATUS_BADGE_CLASSES: Record<SaqueItem['status'], string> = {
  concluido: 'text-green-700 bg-green-50 dark:text-green-400 dark:bg-green-900/20',
  pendente: 'text-amber-700 bg-amber-50 dark:text-amber-400 dark:bg-amber-900/20',
  falhou: 'text-red-700 bg-red-50 dark:text-red-400 dark:bg-red-900/20',
};

export default function SaldoEmpreiteiroPage() {
  const { data, isLoading } = useSaldo();
  const solicitarSaque = useSolicitarSaque();
  const { toast } = useToast();

  const [valor, setValor] = useState('');

  const saldo = data?.saldo ?? null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const valorNum = Number(valor.replace(',', '.'));

    if (!Number.isFinite(valorNum) || valorNum <= 0) {
      toast({
        title: 'Valor inválido',
        description: 'Informe um valor maior que zero.',
        variant: 'destructive',
      });
      return;
    }
    if (saldo !== null && valorNum > saldo) {
      toast({
        title: 'Saldo insuficiente',
        description: `O valor solicitado excede seu saldo disponível (${formatCurrency(saldo)}).`,
        variant: 'destructive',
      });
      return;
    }

    try {
      await solicitarSaque.mutateAsync(valorNum);
      toast({
        title: 'Saque solicitado',
        description: 'Sua solicitação de saque foi registrada.',
      });
      setValor('');
    } catch (err) {
      toast({
        title: 'Não foi possível solicitar o saque',
        description: err instanceof Error ? err.message : 'Tente novamente.',
        variant: 'destructive',
      });
    }
  };

  return (
    <div className="p-6 md:p-10 flex flex-col gap-10" data-testid="saldo-empreiteiro-page">
      <PageHeader
        title="Meu Saldo"
        subtitle="Consulte seu saldo disponível e solicite saques dos seus recebimentos."
      />

      {isLoading ? (
        <div className="flex flex-col gap-6" data-testid="saldo-loading">
          <Skeleton className="h-36 w-full max-w-md rounded-xl" />
          <Skeleton className="h-48 w-full rounded-2xl" />
          <Skeleton className="h-64 w-full rounded-2xl" />
        </div>
      ) : data?.enabled === false ? (
        <Card className="max-w-2xl" data-testid="text-saldo-indisponivel">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="p-3 rounded-lg bg-gray-100 text-gray-500 dark:bg-gray-800">
              <RiInformationLine className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Recebimento via plataforma indisponível</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Recebimento via plataforma indisponível no momento.
            </p>
          </CardContent>
        </Card>
      ) : !data || saldo === null ? (
        <Card className="max-w-2xl" data-testid="text-saldo-bloqueado">
          <CardHeader className="flex flex-row items-center gap-3 space-y-0">
            <div className="p-3 rounded-lg bg-amber-100 text-amber-600 dark:bg-amber-900/30">
              <RiSettings3Line className="w-5 h-5" />
            </div>
            <CardTitle className="text-lg">Conta de recebimento pendente</CardTitle>
          </CardHeader>
          <CardContent className="flex flex-col gap-4">
            <p className="text-sm text-muted-foreground">
              Configure e aprove sua conta de recebimento em Configurações → Recebimentos antes de
              acessar seu saldo.
            </p>
            <Button asChild variant="outline" className="w-fit">
              <Link
                href="/empreiteiro/configuracoes?tab=recebimentos"
                data-testid="link-configurar-recebimentos"
              >
                <RiExternalLinkLine className="w-4 h-4" />
                Ir para Configurações → Recebimentos
              </Link>
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="flex flex-col gap-8">
          <Card className="max-w-md" data-testid="card-saldo-disponivel">
            <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-2">
              <div className="p-3 rounded-lg bg-primary/10 text-primary">
                <RiWalletLine className="w-5 h-5" />
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm font-medium text-muted-foreground mb-1">Saldo Disponível</p>
              <p
                className="text-3xl font-extrabold text-gray-900 dark:text-gray-100 tabular-nums"
                data-testid="text-saldo-valor"
              >
                {formatCurrency(saldo)}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Solicitar saque</CardTitle>
            </CardHeader>
            <CardContent>
              <form
                onSubmit={handleSubmit}
                className="flex flex-col sm:flex-row sm:items-end gap-4"
              >
                <div className="flex flex-col gap-2 w-full sm:max-w-xs">
                  <Label htmlFor="valor-saque">Valor do saque</Label>
                  <Input
                    id="valor-saque"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min="0"
                    placeholder="0,00"
                    value={valor}
                    onChange={(e) => setValor(e.target.value)}
                    data-testid="input-valor-saque"
                  />
                </div>
                <Button
                  type="submit"
                  disabled={solicitarSaque.isPending}
                  data-testid="button-solicitar-saque"
                >
                  {solicitarSaque.isPending ? 'Solicitando...' : 'Solicitar saque'}
                </Button>
              </form>
            </CardContent>
          </Card>

          <div
            className="bg-white dark:bg-gray-900 rounded-2xl overflow-hidden border border-gray-100 dark:border-gray-800"
            data-testid="list-saques"
          >
            <div className="px-6 py-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-base font-bold text-gray-900 dark:text-white">
                Histórico de saques
              </h2>
            </div>
            {data.saques.length === 0 ? (
              <div className="text-center py-16" data-testid="list-saques-empty">
                <RiMoneyDollarCircleLine className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-sm font-semibold text-gray-500">Nenhum saque solicitado</p>
                <p className="text-xs text-gray-400 mt-1">
                  Seus saques aparecerão aqui após a primeira solicitação.
                </p>
              </div>
            ) : (
              <div className="divide-y divide-gray-100 dark:divide-gray-800">
                <div className="hidden md:grid grid-cols-[1fr_1fr_1fr_1fr] gap-4 px-6 py-3 text-xs font-bold text-gray-400 uppercase tracking-wider bg-gray-50 dark:bg-gray-800/50">
                  <span>Valor</span>
                  <span>Status</span>
                  <span>Método</span>
                  <span>Data</span>
                </div>
                {data.saques.map((saque) => (
                  <div
                    key={saque.id}
                    className="grid grid-cols-1 md:grid-cols-[1fr_1fr_1fr_1fr] gap-2 md:gap-4 px-6 py-4"
                    data-testid={`saque-row-${saque.id}`}
                  >
                    <div className="flex items-center">
                      <span className="text-sm font-bold text-gray-900 dark:text-white tabular-nums">
                        {formatCurrency(Number(saque.valor))}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span
                        className={cn(
                          'text-xs font-semibold px-2.5 py-1 rounded-full',
                          SAQUE_STATUS_BADGE_CLASSES[saque.status],
                        )}
                        data-testid={`saque-status-${saque.id}`}
                      >
                        {SAQUE_STATUS_LABELS[saque.status]}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400">
                        {saque.metodo ?? '—'}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <span className="text-sm text-gray-600 dark:text-gray-400 tabular-nums">
                        {formatDateTime(saque.createdAt)}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
