import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  MarketplaceLead,
  MarketplaceLeadStatus,
  MarketplaceLeadsFilters,
  MarketplaceLeadsResponse,
} from "../types";

function buildQS(filters: MarketplaceLeadsFilters): string {
  const params = new URLSearchParams();
  if (filters.page) params.set("page", String(filters.page));
  if (filters.pageSize) params.set("pageSize", String(filters.pageSize));
  if (filters.status) params.set("status", filters.status);
  if (filters.q?.trim()) params.set("q", filters.q.trim());
  if (filters.dataInicio) params.set("dataInicio", filters.dataInicio);
  if (filters.dataFim) params.set("dataFim", filters.dataFim);
  const qs = params.toString();
  return qs ? `?${qs}` : "";
}

export function useMarketplaceLeads(filters: MarketplaceLeadsFilters) {
  return useQuery<MarketplaceLeadsResponse>({
    queryKey: ["admin", "marketplace-leads", filters],
    queryFn: async () => {
      const res = await fetch(`/api/admin/marketplace-leads${buildQS(filters)}`);
      if (!res.ok) throw new Error("Erro ao buscar leads");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export function useUpdateLeadStatus() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }: { id: string; status: MarketplaceLeadStatus }) => {
      const res = await fetch(`/api/admin/marketplace-leads/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (!res.ok) throw new Error("Erro ao atualizar status do lead");
      return res.json() as Promise<MarketplaceLead>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "marketplace-leads"] });
    },
  });
}

/** Busca todos os leads (com filtros) para gerar o CSV. Não é um hook. */
export async function fetchLeadsForExport(
  filters: MarketplaceLeadsFilters,
): Promise<MarketplaceLead[]> {
  const params = new URLSearchParams(buildQS(filters).replace(/^\?/, ""));
  params.set("all", "1");
  params.delete("page");
  params.delete("pageSize");
  const res = await fetch(`/api/admin/marketplace-leads?${params.toString()}`);
  if (!res.ok) throw new Error("Erro ao exportar leads");
  const data = (await res.json()) as { rows: MarketplaceLead[] };
  return data.rows;
}
