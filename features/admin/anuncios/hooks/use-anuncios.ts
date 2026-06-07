import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AnuncioKpi, Campanha, Anunciante } from '../types';

export { useZonasAnuncio } from '@features/shared/anuncios/hooks/use-zonas';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

/** Payload de criação/edição de campanha (J24: inclui template + conteudo). */
export interface CampanhaPayload {
  anuncianteId?: string;
  titulo?: string;
  subtitulo?: string;
  criativoUrl?: string;
  ctaUrl?: string;
  ctaTexto?: string;
  zona?: string;
  template?: string;
  conteudo?: unknown;
  inicio?: string;
  fim?: string;
  orcamento?: number;
  status?: 'rascunho' | 'agendada' | 'ativa' | 'pausada' | 'expirada';
}

async function readError(res: Response): Promise<string> {
  const data = await res.json().catch(() => null);
  return (data && typeof data === 'object' && 'message' in data && typeof data.message === 'string')
    ? data.message
    : 'Erro ao salvar anúncio.';
}

export function useAnuncioKpi() {
  return useQuery<AnuncioKpi>({
    queryKey: ['admin', 'anuncios', 'kpi'],
    queryFn: async () => {
      const res = await fetch('/api/admin/anuncios/kpi');
      if (!res.ok) throw new Error('Erro ao buscar KPIs de anúncios');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useCampanhas() {
  return useQuery<Campanha[]>({
    queryKey: ['admin', 'anuncios', 'campanhas'],
    queryFn: async () => {
      const res = await fetch('/api/admin/anuncios/campanhas');
      if (!res.ok) throw new Error('Erro ao buscar campanhas');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAnunciantes() {
  return useQuery<Anunciante[]>({
    queryKey: ['admin', 'anuncios', 'anunciantes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/anuncios/anunciantes');
      if (!res.ok) throw new Error('Erro ao buscar anunciantes');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

/** Invalida as queries admin + as públicas após mutação. */
function useInvalidateAnuncios() {
  const qc = useQueryClient();
  return () => {
    qc.invalidateQueries({ queryKey: ['admin', 'anuncios'] });
    qc.invalidateQueries({ queryKey: ['anuncios'] });
  };
}

export function useCriarCampanha() {
  const invalidate = useInvalidateAnuncios();
  return useMutation({
    mutationFn: async (payload: CampanhaPayload) => {
      const res = await fetch('/api/admin/anuncios/campanhas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export function useAtualizarCampanha() {
  const invalidate = useInvalidateAnuncios();
  return useMutation({
    mutationFn: async ({ id, payload }: { id: string; payload: CampanhaPayload }) => {
      const res = await fetch(`/api/admin/anuncios/campanhas/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: invalidate,
  });
}

export interface AnuncioConfigRow {
  id: string;
  chave: string;
  visivel: boolean;
  atualizadoEm: string;
}

export function useAnuncioConfig() {
  return useQuery<AnuncioConfigRow[]>({
    queryKey: ['admin', 'anuncios', 'config'],
    queryFn: async () => {
      const res = await fetch('/api/admin/anuncios/config');
      if (!res.ok) throw new Error('Erro ao buscar configuração');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useSetAnuncioConfig() {
  const invalidate = useInvalidateAnuncios();
  return useMutation({
    mutationFn: async ({ chave, visivel }: { chave: string; visivel: boolean }) => {
      const res = await fetch('/api/admin/anuncios/config', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ chave, visivel }),
      });
      if (!res.ok) throw new Error(await readError(res));
      return res.json();
    },
    onSuccess: invalidate,
  });
}
