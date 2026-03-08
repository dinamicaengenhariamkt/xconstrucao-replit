'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useAdminCliente, useAdminClienteObras } from '@features/admin/clientes/hooks/use-clientes';
import {
  RiArrowLeftLine,
  RiBriefcaseLine,
  RiBuilding2Line,
} from 'react-icons/ri';
import type { AdminClienteObra } from '@features/admin/clientes/types';
import { formatCurrency } from '@shared/lib/formatters';

const obraStatusConfig: Record<AdminClienteObra['status'], { label: string; className: string }> = {
  em_andamento: { label: 'Em andamento', className: 'bg-blue-50 text-blue-700 dark:bg-blue-900/20 dark:text-blue-400' },
  concluida: { label: 'Concluída', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  pausada: { label: 'Pausada', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  cancelada: { label: 'Cancelada', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
};

export default function AdminClienteObrasPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: cliente } = useAdminCliente(id);
  const { data: obras, isLoading } = useAdminClienteObras(id);

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Skeleton className="h-9 w-32" />
        <Skeleton className="h-7 w-64" />
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-28 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-cliente-obras-page">
      <Link href={`/admin/clientes/${id}`} data-testid="link-back-cliente-detail">
        <Button variant="ghost" size="sm" data-testid="button-back-cliente-detail">
          <RiArrowLeftLine className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <div>
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">
          Obras {cliente ? `de ${cliente.nome}` : ''}
        </h1>
        <p className="text-sm text-muted-foreground mt-1">
          {obras?.length ?? 0} {(obras?.length ?? 0) === 1 ? 'obra encontrada' : 'obras encontradas'}
        </p>
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <Link href={`/admin/clientes/${id}`} data-testid="tab-cadastro-obras">
          <Button variant="ghost" className="rounded-none text-muted-foreground" data-testid="button-tab-cadastro-obras">
            Cadastro
          </Button>
        </Link>
        <Link href={`/admin/clientes/${id}/obras`} data-testid="tab-obras-active">
          <Button
            variant="ghost"
            className="rounded-none border-b-2 border-primary font-bold text-primary"
            data-testid="button-tab-obras-active"
          >
            Obras
          </Button>
        </Link>
      </div>

      {obras && obras.length > 0 ? (
        <div className="space-y-4">
          {obras.map((obra) => {
            const statusCfg = obraStatusConfig[obra.status];
            return (
              <Card key={obra.id} className="rounded-2xl" data-testid={`card-obra-${obra.id}`}>
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="text-sm font-bold text-gray-900 dark:text-white">{obra.nome}</h3>
                        <span className="text-xs text-muted-foreground">{obra.codigo}</span>
                        <Badge
                          className={cn('rounded-full text-[10px] font-bold px-2.5 py-0.5 no-default-hover-elevate no-default-active-elevate', statusCfg.className)}
                          data-testid={`badge-obra-status-${obra.id}`}
                        >
                          {statusCfg.label}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 mt-2 text-xs text-muted-foreground flex-wrap">
                        <span className="flex items-center gap-1">
                          <RiBuilding2Line className="w-3.5 h-3.5" />
                          {obra.empreiteira}
                        </span>
                        <span>Início: {new Date(obra.dataInicio).toLocaleDateString('pt-BR')}</span>
                        <span>Previsão: {new Date(obra.previsaoFim).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-6 flex-wrap">
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Valor</p>
                        <p className="text-sm font-bold text-gray-900 dark:text-white">{formatCurrency(obra.valorContratado)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Progresso</p>
                        <div className="flex items-center gap-2">
                          <div className="w-20 h-2 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary rounded-full transition-all"
                              style={{ width: `${obra.percentConcluido}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-gray-900 dark:text-white">{obra.percentConcluido}%</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-16">
          <RiBriefcaseLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">Nenhuma obra encontrada</h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Este cliente ainda não possui obras cadastradas.</p>
        </div>
      )}
    </div>
  );
}
