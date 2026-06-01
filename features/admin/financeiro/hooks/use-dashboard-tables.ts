import { useQuery } from '@tanstack/react-query';
import type {
  ObraAtencao,
  TopCliente,
  TopEmpreiteira,
  ReceitaPlataforma,
  AdoptionMetrics,
} from '../types';

const CFG = { staleTime: 30 * 60 * 1000, refetchOnWindowFocus: false } as const;

export function useObrasAtencao() {
  return useQuery<ObraAtencao[]>({
    queryKey: ['admin', 'financeiro', 'obras-atencao'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/obras-atencao');
      if (!res.ok) throw new Error('Erro ao buscar obras em atenção');
      return res.json();
    },
    ...CFG,
  });
}

export function useTopClientes() {
  return useQuery<TopCliente[]>({
    queryKey: ['admin', 'financeiro', 'top-clientes'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/top-clientes');
      if (!res.ok) throw new Error('Erro ao buscar top clientes');
      return res.json();
    },
    ...CFG,
  });
}

export function useTopEmpreiteiras() {
  return useQuery<TopEmpreiteira[]>({
    queryKey: ['admin', 'financeiro', 'top-empreiteiras'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/top-empreiteiras');
      if (!res.ok) throw new Error('Erro ao buscar top empreiteiras');
      return res.json();
    },
    ...CFG,
  });
}

export function useReceitasPlataforma() {
  return useQuery<{ receitas: ReceitaPlataforma[]; total: number }>({
    queryKey: ['admin', 'financeiro', 'receitas-plataforma'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/receitas-plataforma');
      if (!res.ok) throw new Error('Erro ao buscar receitas da plataforma');
      return res.json();
    },
    ...CFG,
  });
}

export function useAdoptionMetrics() {
  return useQuery<AdoptionMetrics>({
    queryKey: ['admin', 'financeiro', 'adoption'],
    queryFn: async () => {
      const res = await fetch('/api/admin/financeiro/adoption');
      if (!res.ok) throw new Error('Erro ao buscar métricas de adoção');
      return res.json();
    },
    ...CFG,
  });
}
