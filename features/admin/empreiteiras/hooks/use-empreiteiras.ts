import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { AdminEmpreiteira, AdminEmpreiteiraObra } from '../types';
import { mockAdminEmpreiteiras, mockAdminEmpreiteiraObras } from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const novaEmpreiteiraSchema = z.object({
  razaoSocial: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  inscricaoEstadual: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  responsavel: z.string().min(3, 'Nome do responsável deve ter pelo menos 3 caracteres'),
  responsavelProfissao: z.string().min(1, 'Selecione a profissão'),
  responsavelRegistro: z.string().min(3, 'Informe o número de registro (CREA/CAU)'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  site: z.string().optional(),
  especialidades: z.array(z.string()).min(1, 'Selecione pelo menos uma especialidade'),
});

export type NovaEmpreiteiraFormData = z.infer<typeof novaEmpreiteiraSchema>;

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAdminEmpreiteiras() {
  return useQuery<AdminEmpreiteira[]>({
    queryKey: ['admin', 'empreiteiras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminEmpreiteiras;
      const res = await fetch('/api/admin/empreiteiras');
      if (!res.ok) throw new Error('Erro ao buscar empreiteiras');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAdminEmpreiteira(id: string) {
  return useQuery<AdminEmpreiteira | undefined>({
    queryKey: ['admin', 'empreiteiras', id],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminEmpreiteiras.find((e) => e.id === id);
      const res = await fetch(`/api/admin/empreiteiras/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar empreiteira');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export function useCreateEmpreiteira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NovaEmpreiteiraFormData) => {
      const res = await fetch('/api/admin/empreiteiras', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao cadastrar empreiteira');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'empreiteiras'] });
    },
  });
}

export function useAdminEmpreiteiraObras(id: string) {
  return useQuery<AdminEmpreiteiraObra[]>({
    queryKey: ['admin', 'empreiteiras', id, 'obras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminEmpreiteiraObras[id] ?? [];
      const res = await fetch(`/api/admin/empreiteiras/${id}/obras`);
      if (!res.ok) throw new Error('Erro ao buscar obras da empreiteira');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export const editarEmpreiteiraSchema = z.object({
  razaoSocial: z.string().min(3, 'Razão social deve ter pelo menos 3 caracteres'),
  nomeFantasia: z.string().optional(),
  cnpj: z.string().min(14, 'CNPJ inválido'),
  inscricaoEstadual: z.string().optional(),
  bairro: z.string().optional(),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
  responsavel: z.string().min(3, 'Nome do responsável deve ter pelo menos 3 caracteres'),
  responsavelProfissao: z.string().min(1, 'Selecione a profissão'),
  responsavelRegistro: z.string().min(3, 'Informe o número de registro (CREA/CAU)'),
  responsavelEmail: z.string().email('E-mail inválido').optional().or(z.literal('')),
  responsavelTelefone: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  site: z.string().optional(),
  especialidades: z.array(z.string()).min(1, 'Selecione pelo menos uma especialidade'),
});

export type EditarEmpreiteiraFormData = z.infer<typeof editarEmpreiteiraSchema>;

export function useUpdateEmpreiteira(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: EditarEmpreiteiraFormData) => {
      if (ENABLE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return { ...data, id };
      }
      const res = await fetch(`/api/admin/empreiteiras/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao atualizar empreiteira');
      return res.json();
    },
    onSuccess: (_result, variables) => {
      queryClient.setQueryData<AdminEmpreiteira | undefined>(
        ['admin', 'empreiteiras', id],
        (old) => (old ? { ...old, ...variables } : old),
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'empreiteiras'] });
    },
  });
}

export function useBloquearEmpreiteira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: AdminEmpreiteira['status'] }) => {
      if (ENABLE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return { id, status: novoStatus };
      }
      const res = await fetch(`/api/admin/empreiteiras/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status da empreiteira');
      return res.json();
    },
    onSuccess: (_result, { id, novoStatus }) => {
      queryClient.setQueryData<AdminEmpreiteira | undefined>(
        ['admin', 'empreiteiras', id],
        (old) => (old ? { ...old, status: novoStatus } : old),
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'empreiteiras'] });
    },
  });
}

export function useResetarAcessoEmpreiteira() {
  return useMutation({
    mutationFn: async (_id: string) => {
      if (ENABLE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        return { success: true };
      }
      const res = await fetch(`/api/admin/empreiteiras/${_id}/reset-acesso`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erro ao resetar acesso');
      return res.json();
    },
  });
}
