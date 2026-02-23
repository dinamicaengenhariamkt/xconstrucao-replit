'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import { Card, CardContent } from '@shared/components/ui/card';
import { Badge } from '@shared/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@shared/components/ui/avatar';
import { cn } from '@shared/lib/utils';
import { RiBriefcaseLine } from 'react-icons/ri';
import type { AdminCliente, ClienteStatus } from '../types';

const statusConfig: Record<ClienteStatus, { label: string; className: string }> = {
  ativo: { label: 'Ativo', className: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-400' },
  inativo: { label: 'Inativo', className: 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400' },
  pendente: { label: 'Pendente', className: 'bg-amber-50 text-amber-700 dark:bg-amber-900/20 dark:text-amber-400' },
};

const formatCurrency = (value: number) =>
  new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);

function getInitials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join('')
    .toUpperCase();
}

interface ClienteCardProps {
  cliente: AdminCliente;
}

export function ClienteCard({ cliente }: ClienteCardProps) {
  const status = statusConfig[cliente.status];

  return (
    <Link href={`/admin/clientes/${cliente.id}`} data-testid={`link-cliente-${cliente.id}`}>
      <motion.div
        className="rounded-2xl overflow-visible"
        whileHover={{
          scale: 1.01,
          boxShadow: '0 4px 12px -2px rgba(0,0,0,0.12), 0 2px 4px -1px rgba(0,0,0,0.06)',
        }}
        transition={{ duration: 0.2 }}
      >
        <Card className="h-full rounded-2xl">
          <CardContent className="p-5 flex flex-col gap-4">
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
        </Card>
      </motion.div>
    </Link>
  );
}
