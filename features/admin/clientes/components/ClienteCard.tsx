'use client';

import { CardContent } from '@shared/components/ui/card';
import { LuminousHoverCard } from '@shared/components/ui/LuminousHoverCard';
import { Badge } from '@shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { cn } from '@shared/lib/utils';
import { RiBriefcaseLine } from 'react-icons/ri';
import type { AdminCliente, ClienteStatus } from '../types';
import { formatCurrency, getInitials } from '@shared/lib/formatters';

const statusConfig: Record<ClienteStatus, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  inativo: { label: 'Inativo', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  pendente: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
  aprovacao: { label: 'Aguardando curadoria', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
};

interface ClienteCardProps {
  cliente: AdminCliente;
}

export function ClienteCard({ cliente }: ClienteCardProps) {
  const status = statusConfig[cliente.status];

  return (
    <LuminousHoverCard
      href={`/admin/clientes/${cliente.id}`}
      testId={`link-cliente-${cliente.id}`}
      className="rounded-2xl"
      cardClassName="rounded-2xl"
    >
      <CardContent className="relative z-10 p-5 flex flex-col gap-4">
            <div className="flex items-center gap-3">
              <Avatar className="h-10 w-10" data-testid={`avatar-cliente-${cliente.id}`}>
                {cliente.avatarUrl && <AvatarImage src={cliente.avatarUrl} alt={cliente.nome} />}
                <AvatarFallback className="bg-primary/10 text-primary text-sm font-bold">
                  {getInitials(cliente.nome)}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">{cliente.nome}</p>
                <p className="text-xs text-muted-foreground truncate">{cliente.cpfCnpj}</p>
              </div>
              <Badge
                className={cn('rounded-full text-[10px] font-bold px-2.5 py-0.5 no-default-hover-elevate no-default-active-elevate', status.className)}
                data-testid={`badge-status-${cliente.id}`}
              >
                {status.label}
              </Badge>
            </div>

            <div className="flex items-center justify-between gap-2 pt-1 border-t border-gray-100 dark:border-gray-800">
              <div className="flex items-center gap-1.5 text-muted-foreground">
                <RiBriefcaseLine className="w-3.5 h-3.5" />
                <span className="text-xs">{cliente.totalObras} obras</span>
              </div>
              <span className="text-xs font-bold text-gray-900 dark:text-white">
                {formatCurrency(cliente.valorTotalContratado)}
              </span>
            </div>
      </CardContent>
    </LuminousHoverCard>
  );
}
