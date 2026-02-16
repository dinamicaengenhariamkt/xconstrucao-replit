"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Financeiro, InsertFinanceiro, EntradasSaidas } from "../types";

/**
 * Hooks React Query para gerenciar financeiro
 * Feature compartilhada usada por admin e contratante
 */

// Hook para listar todas as transações financeiras
export function useFinanceiros() {
  return useQuery<Financeiro[]>({
    queryKey: ["financeiros"],
    queryFn: async () => {
      const response = await fetch("/api/financeiro");
      if (!response.ok) {
        throw new Error("Erro ao carregar transações");
      }
      return response.json();
    },
  });
}

// Hook para criar uma nova transação financeira
export function useCreateFinanceiro() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertFinanceiro) => {
      const response = await fetch("/api/financeiro", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar transação");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalida a cache de financeiros para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ["financeiros"] });
    },
  });
}

// Hook para obter totais de entradas/saídas (usado principalmente pelo admin)
export function useEntradasSaidas() {
  return useQuery<EntradasSaidas>({
    queryKey: ["entradas-saidas"],
    queryFn: async () => {
      const response = await fetch("/api/financeiro/stats");
      if (!response.ok) {
        throw new Error("Erro ao carregar estatísticas");
      }
      return response.json();
    },
  });
}
