'use client';

import { useState } from 'react';
import {
  RiUserHeartLine,
  RiSearchLine,
  RiDownload2Line,
  RiTimeLine,
  RiCheckLine,
  RiCloseCircleLine,
} from 'react-icons/ri';
import { Button } from '@shared/components/ui/button';
import { Input } from '@shared/components/ui/input';
import { Skeleton } from '@shared/components/ui/skeleton';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@shared/components/ui/select';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import { StatsCard } from '@features/shared/components/StatsCard';
import { RangeDateInput } from '@features/shared/components/filters/RangeDateInput';
import { useToast } from '@shared/hooks/use-toast';
import { downloadCSV } from '@shared/lib/csv';
import { MarketplaceLeadsTable } from '@features/admin/marketplace-leads/components/MarketplaceLeadsTable';
import {
  useMarketplaceLeads,
  fetchLeadsForExport,
} from '@features/admin/marketplace-leads/hooks/use-marketplace-leads';
import {
  MARKETPLACE_LEAD_STATUS_LABELS,
  type MarketplaceLeadStatus,
  type MarketplaceLeadsFilters,
} from '@features/admin/marketplace-leads/types';

const PAGE_SIZE = 20;

export default function MarketplaceLeadsPage() {
  const { toast } = useToast();
  const [page, setPage] = useState(1);
  const [q, setQ] = useState('');
  const [status, setStatus] = useState<MarketplaceLeadStatus | 'todos'>('todos');
  const [dataInicio, setDataInicio] = useState('');
  const [dataFim, setDataFim] = useState('');
  const [exporting, setExporting] = useState(false);

  const filters: MarketplaceLeadsFilters = {
    page,
    pageSize: PAGE_SIZE,
    q: q.trim() || undefined,
    status: status === 'todos' ? undefined : status,
    dataInicio: dataInicio || undefined,
    dataFim: dataFim || undefined,
  };

  const { data, isLoading } = useMarketplaceLeads(filters);

  function resetToFirstPage<T>(setter: (v: T) => void) {
    return (v: T) => {
      setter(v);
      setPage(1);
    };
  }

  async function handleExport() {
    setExporting(true);
    try {
      const rows = await fetchLeadsForExport(filters);
      if (rows.length === 0) {
        toast({ description: 'Nenhum lead para exportar com os filtros atuais.' });
        return;
      }
      const headers = ['Nome', 'E-mail', 'Telefone', 'WhatsApp', 'Status', 'Capturado em'];
      const csvRows = rows.map((l) => [
        l.nome,
        l.email,
        l.telefone,
        l.isWhatsapp ? 'Sim' : 'Não',
        MARKETPLACE_LEAD_STATUS_LABELS[l.status],
        new Date(l.createdAt).toLocaleString('pt-BR'),
      ]);
      downloadCSV('leads-marketplace.csv', headers, csvRows);
    } catch {
      toast({ variant: 'destructive', description: 'Falha ao exportar os leads.' });
    } finally {
      setExporting(false);
    }
  }

  const counts = data?.counts;
  const total = data?.total ?? 0;
  const totalPages = data?.totalPages ?? 1;

  return (
    <div className="space-y-6 p-6">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Leads do Marketplace</h1>
          <p className="text-sm text-slate-500">
            Interessados que pediram para ser avisados quando o marketplace lançar.
          </p>
        </div>
        <Button onClick={handleExport} disabled={exporting} variant="outline">
          <RiDownload2Line className="mr-2" />
          {exporting ? 'Exportando…' : 'Exportar CSV'}
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        <StatsCard
          label="Total de leads"
          value={total}
          icon={RiUserHeartLine}
          iconBgColor="bg-primary/10"
        />
        <StatsCard
          label="Pendentes"
          value={counts?.pendente ?? 0}
          icon={RiTimeLine}
          iconBgColor="bg-amber-50"
        />
        <StatsCard
          label="Notificados"
          value={counts?.notificado ?? 0}
          icon={RiCheckLine}
          iconBgColor="bg-blue-50"
        />
        <StatsCard
          label="Descartados"
          value={counts?.descartado ?? 0}
          icon={RiCloseCircleLine}
          iconBgColor="bg-gray-50"
        />
      </div>

      <div className="flex flex-col gap-3 md:flex-row md:items-end">
        <div className="relative flex-1">
          <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <Input
            placeholder="Buscar por nome, e-mail ou telefone…"
            value={q}
            onChange={(e) => resetToFirstPage(setQ)(e.target.value)}
            className="pl-9"
          />
        </div>
        <div className="w-full md:w-48">
          <Select
            value={status}
            onValueChange={(v) => resetToFirstPage(setStatus)(v as MarketplaceLeadStatus | 'todos')}
          >
            <SelectTrigger>
              <SelectValue placeholder="Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todos">Todos os status</SelectItem>
              <SelectItem value="pendente">Pendente</SelectItem>
              <SelectItem value="notificado">Notificado</SelectItem>
              <SelectItem value="descartado">Descartado</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="w-full md:w-auto">
          <RangeDateInput
            label="Capturado entre"
            min={dataInicio}
            max={dataFim}
            onMinChange={resetToFirstPage(setDataInicio)}
            onMaxChange={resetToFirstPage(setDataFim)}
          />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </div>
      ) : (
        <MarketplaceLeadsTable rows={data?.rows ?? []} />
      )}

      {totalPages > 1 && (
        <Pagination>
          <PaginationContent>
            <PaginationItem>
              <PaginationPrevious
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                aria-disabled={page <= 1}
                className={page <= 1 ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
            <PaginationItem>
              <span className="px-4 text-sm text-slate-500">
                Página {page} de {totalPages}
              </span>
            </PaginationItem>
            <PaginationItem>
              <PaginationNext
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                aria-disabled={page >= totalPages}
                className={page >= totalPages ? 'pointer-events-none opacity-50' : 'cursor-pointer'}
              />
            </PaginationItem>
          </PaginationContent>
        </Pagination>
      )}
    </div>
  );
}
