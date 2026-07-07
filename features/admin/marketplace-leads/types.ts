export type MarketplaceLeadStatus = "pendente" | "notificado" | "descartado";

export interface MarketplaceLead {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  isWhatsapp: boolean;
  status: MarketplaceLeadStatus;
  createdAt: string; // ISO
}

export interface MarketplaceLeadsFilters {
  page?: number;
  pageSize?: number;
  status?: MarketplaceLeadStatus;
  q?: string;
  dataInicio?: string; // YYYY-MM-DD
  dataFim?: string; // YYYY-MM-DD
}

export interface MarketplaceLeadsResponse {
  rows: MarketplaceLead[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  counts: Record<MarketplaceLeadStatus, number>;
}

export const MARKETPLACE_LEAD_STATUSES: MarketplaceLeadStatus[] = [
  "pendente",
  "notificado",
  "descartado",
];

export const MARKETPLACE_LEAD_STATUS_LABELS: Record<MarketplaceLeadStatus, string> = {
  pendente: "Pendente",
  notificado: "Notificado",
  descartado: "Descartado",
};
