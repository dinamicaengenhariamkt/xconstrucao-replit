import { NextRequest, NextResponse } from "next/server";
import { requireAdmin } from "@features/admin/shared/api/admin-guard";
import { listarObrasDaEmpreiteira } from "@features/admin/empreiteiras/api/empreiteiras-admin-service";

export async function GET(request: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const guard = requireAdmin(request);
  if (!guard.ok) return guard.response;

  const { id } = await ctx.params;
  return NextResponse.json(await listarObrasDaEmpreiteira(id));
}
