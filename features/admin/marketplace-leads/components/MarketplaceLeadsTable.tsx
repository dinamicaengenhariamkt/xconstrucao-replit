'use client';

import { RiWhatsappLine } from "react-icons/ri";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@shared/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@shared/components/ui/select";
import { useToast } from "@shared/hooks/use-toast";
import { formatDateTime } from "@shared/lib/formatters";
import { LeadStatusBadge } from "./LeadStatusBadge";
import { useUpdateLeadStatus } from "../hooks/use-marketplace-leads";
import {
  MARKETPLACE_LEAD_STATUSES,
  MARKETPLACE_LEAD_STATUS_LABELS,
  type MarketplaceLead,
  type MarketplaceLeadStatus,
} from "../types";

function formatData(iso: string): string {
  return iso ? formatDateTime(iso) : "—";
}

export function MarketplaceLeadsTable({ rows }: { rows: MarketplaceLead[] }) {
  const { toast } = useToast();
  const updateStatus = useUpdateLeadStatus();

  function handleChange(id: string, status: MarketplaceLeadStatus) {
    updateStatus.mutate(
      { id, status },
      {
        onSuccess: () => toast({ description: "Status do lead atualizado." }),
        onError: () =>
          toast({ variant: "destructive", description: "Não foi possível atualizar o status." }),
      },
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-lg border border-dashed py-16 text-center text-sm text-slate-500">
        Nenhum lead encontrado com os filtros atuais.
      </div>
    );
  }

  return (
    <div className="rounded-lg border overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Nome</TableHead>
            <TableHead>E-mail</TableHead>
            <TableHead>Telefone</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Capturado em</TableHead>
            <TableHead className="text-right">Ação</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((lead) => (
            <TableRow key={lead.id}>
              <TableCell className="font-medium">{lead.nome}</TableCell>
              <TableCell>{lead.email}</TableCell>
              <TableCell>
                <span className="inline-flex items-center gap-1">
                  {lead.telefone}
                  {lead.isWhatsapp && (
                    <RiWhatsappLine
                      className="text-green-600"
                      title="É WhatsApp"
                      aria-label="É WhatsApp"
                    />
                  )}
                </span>
              </TableCell>
              <TableCell>
                <LeadStatusBadge status={lead.status} />
              </TableCell>
              <TableCell className="whitespace-nowrap text-sm text-slate-500">
                {formatData(lead.createdAt)}
              </TableCell>
              <TableCell className="text-right">
                <Select
                  value={lead.status}
                  onValueChange={(v) => handleChange(lead.id, v as MarketplaceLeadStatus)}
                  disabled={updateStatus.isPending}
                >
                  <SelectTrigger className="h-8 w-[150px] ml-auto">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MARKETPLACE_LEAD_STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {MARKETPLACE_LEAD_STATUS_LABELS[s]}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
