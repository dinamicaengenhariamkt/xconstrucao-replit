import { Badge } from "@shared/components/ui/badge";
import { cn } from "@shared/lib/utils";
import {
  MARKETPLACE_LEAD_STATUS_LABELS,
  type MarketplaceLeadStatus,
} from "../types";

const STATUS_CLASSES: Record<MarketplaceLeadStatus, string> = {
  pendente: "bg-amber-50 text-amber-700 border-amber-200",
  notificado: "bg-blue-50 text-blue-700 border-blue-200",
  descartado: "bg-gray-100 text-gray-500 border-gray-200",
};

export function LeadStatusBadge({ status }: { status: MarketplaceLeadStatus }) {
  return (
    <Badge variant="outline" className={cn("border", STATUS_CLASSES[status])}>
      {MARKETPLACE_LEAD_STATUS_LABELS[status]}
    </Badge>
  );
}
