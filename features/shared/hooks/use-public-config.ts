'use client';

import { useQuery } from "@tanstack/react-query";

export interface PublicConfig {
  nome: string;
  descricao: string;
  anuncios: boolean;
  faq: boolean;
  adPaymentEnabled: boolean;
}

const DEFAULTS: PublicConfig = {
  nome: "XConstrução",
  descricao: "Plataforma de gestão de obras e conexão entre contratantes e empreiteiras.",
  anuncios: true,
  faq: true,
  // fail-safe: nunca prometer cobrança real que não está ligada.
  adPaymentEnabled: false,
};

/**
 * Lê a config pública não-sensível da plataforma (J26): nome/descrição + flags
 * de módulo. Cai nos defaults em caso de erro (fail-open na UI).
 */
export function usePublicConfig() {
  const query = useQuery<PublicConfig>({
    queryKey: ["plataforma", "public-config"],
    queryFn: async () => {
      const res = await fetch("/api/plataforma/public-config");
      if (!res.ok) throw new Error("Erro ao buscar config pública");
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
  // Sempre devolve um valor utilizável (defaults enquanto carrega / em erro).
  return { config: query.data ?? DEFAULTS, isLoading: query.isLoading };
}
