import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";

export interface ObraDestaqueAdmin {
  id: string;
  nome: string;
  cidade: string | null;
  uf: string | null;
  tipo: string | null;
  status: string;
  visibilidade: string;
  statusModeracao: string;
  destaque: boolean;
  destaqueOrdem: number | null;
  fotoCapaFileId: string | null;
  capaUrl: string | null;
}

export interface ObrasDestaqueResponse {
  rows: ObraDestaqueAdmin[];
  count: number;
  limite: number;
}

export function useObrasDestaque() {
  return useQuery<ObrasDestaqueResponse>({
    queryKey: ["admin", "obras-destaque"],
    queryFn: async () => {
      const res = await fetch("/api/admin/obras/destaque");
      if (!res.ok) throw new Error("Erro ao buscar destaques");
      return res.json();
    },
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}

export interface ToggleDestaqueInput {
  obraId: string;
  destaque: boolean;
  ordem?: number | null;
  fotoCapaFileId?: string | null;
}

export class ToggleDestaqueError extends Error {
  constructor(
    message: string,
    readonly code: string,
    readonly status: number,
  ) {
    super(message);
  }
}

export function useToggleDestaque() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (input: ToggleDestaqueInput) => {
      const res = await fetch(`/api/admin/obras/${input.obraId}/destaque`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          destaque: input.destaque,
          ordem: input.ordem ?? null,
          fotoCapaFileId: input.fotoCapaFileId ?? null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new ToggleDestaqueError(
          data.message ?? "Erro ao atualizar destaque",
          data.error ?? "ERRO",
          res.status,
        );
      }
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "obras-destaque"] });
    },
  });
}

export interface ObraFoto {
  id: string;
  url: string;
  fase: string | null;
  fileId?: string;
}

/** Busca as fotos de uma obra (reusa o endpoint existente) para escolher a capa. */
export function useObraFotos(obraId: string | null) {
  return useQuery<{ rows: Array<{ id: string; url: string; fase: string | null; fileId: string }> }>({
    queryKey: ["admin", "obra-fotos", obraId],
    queryFn: async () => {
      const res = await fetch(`/api/obras/${obraId}/fotos`);
      if (!res.ok) throw new Error("Erro ao buscar fotos da obra");
      return res.json();
    },
    enabled: !!obraId,
    staleTime: 60 * 1000,
    refetchOnWindowFocus: false,
  });
}
