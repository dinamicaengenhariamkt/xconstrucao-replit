'use client';

import { useQuery } from "@tanstack/react-query";

export interface PublicConfig {
  nome: string;
  descricao: string;
  anuncios: boolean;
  faq: boolean;
  /** Exibe os pontos públicos de descoberta do marketplace. */
  marketplaceVisivel: boolean;
  adPaymentEnabled: boolean;
  /** Gateway em sandbox: nenhuma cobrança é real, mesmo em produção. */
  pagamentoSandbox: boolean;
}

const DEFAULTS: PublicConfig = {
  nome: "XConstrução",
  descricao: "Plataforma de gestão de obras e conexão entre contratantes e empreiteiras.",
  anuncios: true,
  faq: true,
  // Fail-open: em caso de erro de leitura, preserva a experiência existente.
  marketplaceVisivel: true,
  // fail-safe: nunca prometer cobrança real que não está ligada.
  adPaymentEnabled: false,
  // fail-safe na direção oposta ao de cima: avisar "é teste" quando na dúvida
  // é inofensivo; omitir o aviso num ambiente que de fato é sandbox faria o
  // usuário acreditar que pagou de verdade. Na dúvida, avisa.
  pagamentoSandbox: true,
};

/**
 * Lê a config pública não-sensível da plataforma (J26): nome/descrição + flags
 * de módulo. Cai nos defaults em caso de erro (fail-open na UI).
 */
export function usePublicConfig() {
  const query = useQuery<PublicConfig>({
    queryKey: ["plataforma", "public-config"],
    queryFn: async () => {
      const res = await fetch("/api/plataforma/public-config", { cache: "no-store" });
      if (!res.ok) throw new Error("Erro ao buscar config pública");
      return res.json();
    },
    staleTime: 0,
    refetchOnMount: "always",
    refetchOnWindowFocus: true,
  });
  // Sempre devolve um valor utilizável (defaults enquanto carrega / em erro).
  return { config: query.data ?? DEFAULTS, isLoading: query.isLoading };
}
