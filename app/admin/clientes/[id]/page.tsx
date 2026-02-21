'use client';

import { useParams } from 'next/navigation';
import Link from 'next/link';
import { cn } from '@shared/lib/utils';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Button } from '@shared/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { Skeleton } from '@shared/components/ui/skeleton';
import { useAdminCliente } from '@features/admin/clientes/hooks/use-clientes';
import {
  RiArrowLeftLine,
  RiMailLine,
  RiPhoneLine,
  RiIdCardLine,
  RiMapPinLine,
  RiCalendarLine,
  RiBriefcaseLine,
  RiMoneyDollarCircleLine,
  RiWalletLine,
  RiScalesLine,
  RiBuilding2Line,
  RiUserLine,
} from 'react-icons/ri';
import type { ClienteStatus } from '@features/admin/clientes/types';

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

const statusConfig: Record<ClienteStatus, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  inativo: { label: 'Inativo', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
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

export default function AdminClienteDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const { data: cliente, isLoading } = useAdminCliente(id);

  if (isLoading) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Skeleton className="h-9 w-32" />
        <div className="flex items-center gap-4">
          <Skeleton className="h-16 w-16 rounded-full" />
          <div>
            <Skeleton className="h-7 w-56" />
            <Skeleton className="h-5 w-24 mt-2" />
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
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

  if (!cliente) {
    return (
      <div className="p-6 md:p-10 space-y-8">
        <Link href="/admin/clientes" data-testid="link-back-clientes">
          <Button variant="ghost" size="sm" data-testid="button-back-clientes">
            <RiArrowLeftLine className="w-4 h-4 mr-2" />
            Voltar
          </Button>
        </Link>
        <div className="text-center py-16">
          <RiUserLine className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-gray-500">Cliente não encontrado</h3>
        </div>
      </div>
    );
  }

  const status = statusConfig[cliente.status];
  const saldo = cliente.valorTotalContratado - cliente.valorTotalPago;

  const infoItems = [
    { icon: RiMailLine, label: 'Email', value: cliente.email },
    { icon: RiPhoneLine, label: 'Telefone', value: cliente.telefone },
    { icon: RiIdCardLine, label: 'CPF/CNPJ', value: cliente.cpfCnpj },
    { icon: RiMapPinLine, label: 'Endereço', value: `${cliente.endereco}, ${cliente.cidade} - ${cliente.estado}` },
    { icon: RiCalendarLine, label: 'Data Cadastro', value: new Date(cliente.dataCadastro).toLocaleDateString('pt-BR') },
  ];

  const kpis = [
    { icon: RiBriefcaseLine, label: 'Total Obras', value: String(cliente.totalObras), iconBg: 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' },
    { icon: RiMoneyDollarCircleLine, label: 'Valor Contratado', value: formatCurrency(cliente.valorTotalContratado), iconBg: 'bg-purple-50 text-purple-600 dark:bg-purple-900/20' },
    { icon: RiWalletLine, label: 'Valor Pago', value: formatCurrency(cliente.valorTotalPago), iconBg: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' },
    { icon: RiScalesLine, label: 'Saldo', value: formatCurrency(saldo), iconBg: 'bg-amber-50 text-amber-600 dark:bg-amber-900/20' },
  ];

  return (
    <div className="p-6 md:p-10 space-y-8" data-testid="admin-cliente-detail-page">
      <Link href="/admin/clientes" data-testid="link-back-clientes">
        <Button variant="ghost" size="sm" data-testid="button-back-clientes">
          <RiArrowLeftLine className="w-4 h-4 mr-2" />
          Voltar
        </Button>
      </Link>

      <div className="flex items-center gap-4 flex-wrap">
        <Avatar className="h-16 w-16" data-testid="avatar-cliente-detail">
          {cliente.avatarUrl && <AvatarImage src={cliente.avatarUrl} alt={cliente.nome} />}
          <AvatarFallback className="bg-primary/10 text-primary text-lg font-bold">
            {getInitials(cliente.nome)}
          </AvatarFallback>
        </Avatar>
        <div>
          <div className="flex items-center gap-3 flex-wrap">
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white">{cliente.nome}</h1>
            <Badge
              className={cn('rounded-full text-[10px] font-bold px-2.5 py-0.5 no-default-hover-elevate no-default-active-elevate', status.className)}
              data-testid="badge-status-detail"
            >
              {status.label}
            </Badge>
          </div>
          <div className="flex items-center gap-2 mt-1 text-muted-foreground text-sm">
            {cliente.tipo === 'pessoa_juridica' ? (
              <RiBuilding2Line className="w-4 h-4" />
            ) : (
              <RiUserLine className="w-4 h-4" />
            )}
            <span>{cliente.tipo === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}</span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
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
        <Link href={`/admin/clientes/${id}`} data-testid="tab-cadastro">
          <Button
            variant="ghost"
            className="rounded-none border-b-2 border-primary font-bold text-primary"
            data-testid="button-tab-cadastro"
          >
            Cadastro
          </Button>
        </Link>
        <Link href={`/admin/clientes/${id}/obras`} data-testid="tab-obras">
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
              <p className="text-xs text-muted-foreground">Nome completo</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{cliente.nome}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Email</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{cliente.email}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Telefone</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{cliente.telefone}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">CPF/CNPJ</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{cliente.cpfCnpj}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Tipo</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {cliente.tipo === 'pessoa_juridica' ? 'Pessoa Jurídica' : 'Pessoa Física'}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Status</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">{status.label}</p>
            </div>
            <div className="sm:col-span-2">
              <p className="text-xs text-muted-foreground">Endereço completo</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {cliente.endereco}, {cliente.cidade} - {cliente.estado}
              </p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground">Data de Cadastro</p>
              <p className="text-sm font-semibold text-gray-900 dark:text-white">
                {new Date(cliente.dataCadastro).toLocaleDateString('pt-BR')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
