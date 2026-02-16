"use client";

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type { Obra, InsertObra } from "../types";

/**
 * Hooks React Query para gerenciar obras
 * Feature compartilhada usada por admin, contratante e empreiteiro
 */

// Hook para listar todas as obras
export function useObras() {
  return useQuery<Obra[]>({
    queryKey: ["obras"],
    queryFn: async () => {
      const response = await fetch("/api/obras");
      if (!response.ok) {
        throw new Error("Erro ao carregar obras");
      }
      return response.json();
    },
  });
}

// Hook para obter detalhes de uma obra específica
export function useObra(id: string | undefined) {
  return useQuery<Obra>({
    queryKey: ["obras", id],
    queryFn: async () => {
      if (!id) throw new Error("ID da obra não fornecido");
      const response = await fetch(`/api/obras/${id}`);
      if (!response.ok) {
        throw new Error("Erro ao carregar obra");
      }
      return response.json();
    },
    enabled: !!id, // Só executa a query se id estiver definido
  });
}

// Hook para criar uma nova obra
export function useCreateObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (data: InsertObra) => {
      const response = await fetch("/api/obras", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao criar obra");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalida a cache de obras para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}

// Hook para deletar uma obra
export function useDeleteObra() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: string) => {
      const response = await fetch(`/api/obras/${id}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || "Erro ao deletar obra");
      }

      return response.json();
    },
    onSuccess: () => {
      // Invalida a cache de obras para recarregar a lista
      queryClient.invalidateQueries({ queryKey: ["obras"] });
    },
  });
}
