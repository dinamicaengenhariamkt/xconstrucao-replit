import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type { AdminEmpreiteira, AdminEmpreiteiraObra, HistoricoBloqueio } from '../types';

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

interface BloquearEmpreiteiraInput {
  id: string;
  novoStatus: AdminEmpreiteira['status'];
  /** Motivo registrado pelo admin. Obrigatório ao bloquear; opcional ao desbloquear. */
  motivo?: string;
  /** Notas adicionais opcionais. */
  observacoes?: string;
  /** Identificador do admin que executou a ação. Default: 'admin@xconstrucao.com'. */
  responsavel?: string;
}

export function useBloquearEmpreiteira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, novoStatus, motivo, observacoes, responsavel }: BloquearEmpreiteiraInput) => {
      const res = await fetch(`/api/admin/empreiteiras/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus, motivo, observacoes, responsavel }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status da empreiteira');
      return res.json();
    },
    onSuccess: (_result, { id, novoStatus, motivo, observacoes, responsavel }) => {
      const novaEntrada: HistoricoBloqueio = {
        id: `hb-${id}-${Date.now()}`,
        tipo: novoStatus === 'ativa' ? 'desbloqueio' : 'bloqueio',
        data: new Date().toISOString().slice(0, 10),
        motivo,
        observacoes,
        responsavel: responsavel ?? 'admin@xconstrucao.com',
      };
      queryClient.setQueryData<AdminEmpreiteira | undefined>(
        ['admin', 'empreiteiras', id],
        (old) =>
          old
            ? {
                ...old,
                status: novoStatus,
                historicoBloqueios: [...(old.historicoBloqueios ?? []), novaEntrada],
              }
            : old,
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'empreiteiras'] });
    },
  });
}

export function useAprovarEmpreiteira() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, decisao }: { id: string; decisao: 'aprovar' | 'reprovar' }) => {
      const res = await fetch(`/api/admin/empreiteiras/${id}/aprovacao`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ decisao }),
        credentials: 'include',
      });
      if (!res.ok) {
        const errJson = await res.json().catch(() => ({}));
        throw new Error(errJson?.message || 'Erro ao processar curadoria da empreiteira');
      }
      return res.json();
    },
    onSuccess: (_data, { id, decisao }) => {
      const novoStatus: AdminEmpreiteira['status'] = decisao === 'aprovar' ? 'ativo' : 'inativo';
      queryClient.setQueryData<AdminEmpreiteira | undefined>(
        ['admin', 'empreiteiras', id],
        (old) => (old ? { ...old, status: novoStatus } : old),
      );
      queryClient.setQueryData<AdminEmpreiteira[] | undefined>(
        ['admin', 'empreiteiras'],
        (old) => old?.map((e) => (e.id === id ? { ...e, status: novoStatus } : e)),
      );
    },
  });
}

export function useResetarAcessoEmpreiteira() {
  return useMutation({
    mutationFn: async (_id: string) => {
      const res = await fetch(`/api/admin/empreiteiras/${_id}/reset-acesso`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erro ao resetar acesso');
      return res.json();
    },
  });
}
