/**
 * Service para buscar e mutar medições do contratante (visão de quem aprova).
 * Backend real (Task #47). O mock foi removido junto com a Jornada 06.
 */

import { apiRequest } from "@shared/lib/queryClient";
import type { MedicaoContratante, MedicoesContratanteKPI } from "../types";

export async function getMedicoesContratante(): Promise<MedicaoContratante[]> {
  const response = await fetch("/api/contratante/medicoes", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Erro ao buscar medições do contratante");
  }
  return response.json();
}

export async function getMedicoesContratanteKPI(): Promise<MedicoesContratanteKPI> {
  const response = await fetch("/api/contratante/medicoes/kpi", { credentials: "include" });
  if (!response.ok) {
    throw new Error("Erro ao buscar KPI de medições");
  }
  return response.json();
}

export async function aprovarMedicao(id: string): Promise<void> {
  await apiRequest("POST", `/api/contratante/medicoes/${id}/aprovar`);
}

export async function contestarMedicao(id: string, motivo: string): Promise<void> {
  await apiRequest("POST", `/api/contratante/medicoes/${id}/contestar`, { motivo });
}
