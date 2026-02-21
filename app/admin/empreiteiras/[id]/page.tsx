'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useAdminEmpreiteira } from '@features/admin/empreiteiras/hooks/use-empreiteiras';
import {
  RiArrowLeftLine,
  RiMailLine,
  RiPhoneLine,
  RiIdCardLine,
  RiMapPinLine,
  RiCalendarLine,
  RiUserLine,
  RiBriefcaseLine,
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiBuilding2Line,
  RiStarFill,
  RiStarLine,
  RiHammerLine,
} from 'react-icons/ri';
import type { EmpreiteiraStatus } from '@features/admin/empreiteiras/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const statusConfig: Record<EmpreiteiraStatus, { label: string; className: string }> = {
  ativa: { label: 'Ativa', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  inativa: { label: 'Inativa', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  suspensa: { label: 'Suspensa', className: 'bg-red-50 text-red-700 dark:bg-red-900/20 dark:text-red-400' },
  pendente: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
};

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

function StarRating({ nota }: { nota: number }) {
  const stars = [];
  for (let i = 1; i <= 5; i++) {
    if (i <= Math.round(nota)) {
      stars.push(<RiStarFill key={i} className="w-4 h-4 text-amber-400" />);
    } else {
      stars.push(<RiStarLine key={i} className="w-4 h-4 text-gray-300 dark:text-gray-600" />);
    }
  }
  return (
    <div className="flex items-center gap-1">
      {stars}
      <span className="text-sm font-bold text-gray-900 dark:text-white ml-1">{nota.toFixed(1)}</span>
    </div>
  );
}

export default function AdminEmpreiteiraDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: empreiteira, isLoading } = useAdminEmpreiteira(id);

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Skeleton className="h-9 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-36 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-20 rounded-2xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-2xl" />
          ))}
        </div>
      </div>
    );
  }

  if (!empreiteira) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Link href="/admin/empreiteiras" data-testid="link-back-empreiteiras">
          <Button variant="ghost" size="sm" data-testid="button-back-empreiteiras">
            <RiArrowLeftLine className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="text-center py-16">
          <RiBuilding2Line className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500">Empreiteira não encontrada</h3>
        </div>
      </div>
    );
  }

  const status = statusConfig[empreiteira.status];

  const infoItems = [
    { icon: RiIdCardLine, label: 'CNPJ', value: empreiteira.cnpj },
    { icon: RiMailLine, label: 'Email', value: empreiteira.email },
    { icon: RiPhoneLine, label: 'Telefone', value: empreiteira.telefone },
    { icon: RiUserLine, label: 'Responsável', value: empreiteira.responsavel },
    { icon: RiMapPinLine, label: 'Endereço', value: `${empreiteira.endereco}, ${empreiteira.cidade} - ${empreiteira.estado}` },
    { icon: RiCalendarLine, label: 'Data Cadastro', value: new Date(empreiteira.dataCadastro).toLocaleDateString('pt-BR') },
  ];

  const kpis = [
    { icon: RiBriefcaseLine, label: 'Total Obras', value: String(empreiteira.totalObras), iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
    { icon: RiHammerLine, label: 'Em Andamento', value: String(empreiteira.obrasEmAndamento), iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
    { icon: RiMoneyDollarCircleLine, label: 'Valor Contratado', value: formatCurrency(empreiteira.valorTotalContratado), iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
    { icon: RiWalletLine, label: 'Valor Recebido', value: formatCurrency(empreiteira.valorTotalRecebido), iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-empreiteira-detail-page">
      <Link href="/admin/empreiteiras" data-testid="link-back-empreiteiras">
        <Button variant="ghost" size="sm" data-testid="button-back-empreiteiras">
          <RiArrowLeftLine className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <div className="flex items-center gap-4 flex-wrap">
        <Avatar className="h-16 w-16" data-testid="avatar-empreiteira-detail">
          {empreiteira.avatarUrl && <AvatarImage src={empreiteira.avatarUrl} alt={empreiteira.razaoSocial} />}
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
            {getInitials(empreiteira.nomeFantasia)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{empreiteira.razaoSocial}</h1>
            <Badge
              className={cn('rounded-full text-[10px] font-bold px-2.5 py-0.5 no-default-hover-elevate no-default-active-elevate', status.className)}
              data-testid="badge-status-detail"
            >
              {status.label}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground mt-1">{empreiteira.nomeFantasia}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {infoItems.map((item) => (
          <Card key={item.label} className="rounded-2xl" data-testid={`info-${item.label.toLowerCase().replace(/[\s/]/g, '-')}`}>
            <CardContent className="p-4 flex items-start gap-3">
              <div className="p-2 rounded-lg bg-gray-50 dark:bg-gray-800 text-muted-foreground">
                <item.icon className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <p className="text-xs text-muted-foreground">{item.label}</p>
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">{item.value}</p>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-6">
        <div>
          <p className="text-xs text-muted-foreground mb-2">Especialidades</p>
          <div className="flex flex-wrap gap-1.5">
            {empreiteira.especialidades.map((esp) => (
              <Badge
                key={esp}
                variant="outline"
                className="text-xs px-2.5 py-0.5 rounded-full no-default-hover-elevate no-default-active-elevate"
                data-testid={`badge-especialidade-detail-${esp}`}
              >
                {esp}
              </Badge>
            ))}
          </div>
        </div>
        <div>
          <p className="text-xs text-muted-foreground mb-2">Avaliação</p>
          <StarRating nota={empreiteira.nota} />
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi) => (
          <Card key={kpi.label} className="rounded-2xl" data-testid={`kpi-detail-${kpi.label.toLowerCase().replace(/\s/g, '-')}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3 mb-2">
                <div className={cn('p-2 rounded-lg', kpi.iconBg)}>
                  <kpi.icon className="w-4 h-4" />
                </div>
                <p className="text-xs text-muted-foreground">{kpi.label}</p>
              </div>
              <p className="text-xl font-extrabold text-gray-900 dark:text-gray-100">{kpi.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="flex gap-2 border-b border-gray-200 dark:border-gray-800">
        <Link href={`/admin/empreiteiras/${id}`} data-testid="tab-cadastro">
          <Button
            variant="ghost"
            className="rounded-none border-b-2 border-primary font-bold text-primary"
            data-testid="button-tab-cadastro"
          >
            Cadastro
          </Button>
        </Link>
        <Link href={`/admin/empreiteiras/${id}/obras`} data-testid="tab-obras">
          <Button variant="ghost" className="rounded-none text-muted-foreground" data-testid="button-tab-obras">
            Obras
          </Button>
        </Link>
      </div>

      <Card className="rounded-2xl" data-testid="card-cadastro-details">
        <CardContent className="p-6">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">Dados do Cadastro</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-muted-foreground">Razão Social</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteira.razaoSocial}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Nome Fantasia</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteira.nomeFantasia}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CNPJ</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteira.cnpj}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteira.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteira.telefone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Responsável</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{empreiteira.responsavel}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Endereço completo</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {empreiteira.endereco}, {empreiteira.cidade} - {empreiteira.estado}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data de Cadastro</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(empreiteira.dataCadastro).toLocaleDateString('pt-BR')}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{status.label}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
