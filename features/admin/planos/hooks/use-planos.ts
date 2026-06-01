import { useQuery } from '@tanstack/react-query';
import type { AdminPlano, AdminPlanoAssinante, PlanosKpi } from '../types';

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function usePlanosKpi() {
  return useQuery<PlanosKpi>({
    queryKey: ['admin', 'planos', 'kpi'],
    queryFn: async () => {
      const res = await fetch('/api/admin/planos/kpi');
      if (!res.ok) throw new Error('Erro ao buscar KPIs de planos');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function usePlanosContratante() {
  return useQuery<AdminPlano[]>({
    queryKey: ['admin', 'planos', 'contratante'],
    queryFn: async () => {
      const res = await fetch('/api/admin/planos?perfil=contratante');
      if (!res.ok) throw new Error('Erro ao buscar planos de contratante');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function usePlanosEmpreiteiro() {
  return useQuery<AdminPlano[]>({
    queryKey: ['admin', 'planos', 'empreiteiro'],
    queryFn: async () => {
      const res = await fetch('/api/admin/planos?perfil=empreiteiro');
      if (!res.ok) throw new Error('Erro ao buscar planos de empreiteiro');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAssinantesContratante() {
  return useQuery<AdminPlanoAssinante[]>({
    queryKey: ['admin', 'planos', 'assinantes', 'contratante'],
    queryFn: async () => {
      const res = await fetch('/api/admin/planos/assinantes?perfil=contratante');
      if (!res.ok) throw new Error('Erro ao buscar assinantes contratante');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAssinantesEmpreiteiro() {
  return useQuery<AdminPlanoAssinante[]>({
    queryKey: ['admin', 'planos', 'assinantes', 'empreiteiro'],
    queryFn: async () => {
      const res = await fetch('/api/admin/planos/assinantes?perfil=empreiteiro');
      if (!res.ok) throw new Error('Erro ao buscar assinantes empreiteiro');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}
