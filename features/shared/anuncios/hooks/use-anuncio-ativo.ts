import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { AnuncioZonaId } from '../types';

/**
 * Anúncio ativo de uma zona, consumindo direto o endpoint público
 * `GET /api/anuncios?zona=` (J16). Mais leve que listar todas as zonas:
 * uma chamada por slot, cache curto alinhado ao do endpoint (30s).
 */
export interface AnuncioAtivo {
  id: string;
  titulo: string;
  subtitulo: string | null;
  criativoUrl: string | null;
  ctaUrl: string | null;
  ctaTexto: string | null;
  zona: string;
  template: string;
  conteudo: unknown | null;
}

export function useAnuncioAtivo(
  zona: AnuncioZonaId,
): UseQueryResult<AnuncioAtivo | null, Error> {
  return useQuery({
    queryKey: ['anuncios', 'ativo', zona],
    queryFn: async () => {
      const res = await fetch(`/api/anuncios?zona=${encodeURIComponent(zona)}`);
      if (!res.ok) throw new Error('Erro ao buscar anúncio');
      return res.json();
    },
    staleTime: 30 * 1000,
    refetchOnWindowFocus: false,
  });
}

/** Registra impressão/clique (best-effort, não bloqueia a UI). */
export async function registrarEventoAnuncio(
  anuncioId: string,
  tipo: 'impressao' | 'clique',
): Promise<void> {
  try {
    await fetch(`/api/anuncios/${anuncioId}/eventos`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ tipo }),
      keepalive: true,
    });
  } catch {
    // silencioso — tracking não pode quebrar a página (adblock, offline, etc.)
  }
}
