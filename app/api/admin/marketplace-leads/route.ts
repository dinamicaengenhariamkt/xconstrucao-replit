import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { setNoCacheHeaders } from "@features/auth/api/auth-utils";
import { recordAudit } from "@features/auth/api/audit";
import {
  listarLeadsAdmin,
  listarLeadsParaExport,
} from "@features/admin/marketplace-leads/api/marketplace-leads-service";
import {
  MARKETPLACE_LEAD_STATUSES,
  type MarketplaceLeadStatus,
  type MarketplaceLeadsFilters,
} from "@features/admin/marketplace-leads/types";

function parseFilters(url: URL): MarketplaceLeadsFilters {
  const statusRaw = url.searchParams.get("status");
  const status =
    statusRaw && MARKETPLACE_LEAD_STATUSES.includes(statusRaw as MarketplaceLeadStatus)
      ? (statusRaw as MarketplaceLeadStatus)
      : undefined;
  return {
    page: Number(url.searchParams.get("page")) || undefined,
    pageSize: Number(url.searchParams.get("pageSize")) || undefined,
    status,
    q: url.searchParams.get("q") ?? undefined,
    dataInicio: url.searchParams.get("dataInicio") ?? undefined,
    dataFim: url.searchParams.get("dataFim") ?? undefined,
  };
}

export async function GET(request: NextRequest) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const url = new URL(request.url);
  const filtros = parseFilters(url);

  // Export: retorna todos os leads (com os filtros aplicados) e registra a ação
  // em audit_logs — dados pessoais (LGPD), rastrear quem/quando exportou.
  if (url.searchParams.get("all") === "1") {
    const rows = await listarLeadsParaExport(filtros);
    await recordAudit({
      actorId: guard.userId,
      action: "admin.marketplace_lead.export",
      payload: { filtros, total: rows.length },
      request,
    });
    const r = NextResponse.json({ rows });
    setNoCacheHeaders(r);
    return r;
  }

  const data = await listarLeadsAdmin(filtros);
  const r = NextResponse.json(data);
  setNoCacheHeaders(r);
  return r;
}
