import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { z } from 'zod';
import type {
  AdminCliente,
  AdminClienteObra,
  ClienteFinanceiro,
  ClienteDocumento,
  ClienteAtividade,
} from '../types';
import {
  mockAdminClientes,
  mockAdminClienteObras,
  mockAdminClienteFinanceiro,
  mockAdminClienteDocumentos,
  mockAdminClienteAtividades,
} from '../mocks';

const ENABLE_MOCK = process.env.NEXT_PUBLIC_ENABLE_EMPREITEIRO_MOCK === 'true';

export const novoClienteSchema = z.object({
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica'], {
    required_error: 'Selecione o tipo',
  }),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  dataNascimento: z.string().optional(),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  cep: z.string().optional(),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

export type NovoClienteFormData = z.infer<typeof novoClienteSchema>;

const QUERY_CONFIG = {
  staleTime: 30 * 60 * 1000,
  refetchOnWindowFocus: false,
} as const;

export function useAdminClientes() {
  return useQuery<AdminCliente[]>({
    queryKey: ['admin', 'clientes'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClientes;
      const res = await fetch('/api/admin/clientes');
      if (!res.ok) throw new Error('Erro ao buscar clientes');
      return res.json();
    },
    ...QUERY_CONFIG,
  });
}

export function useAdminCliente(id: string) {
  return useQuery<AdminCliente | undefined>({
    queryKey: ['admin', 'clientes', id],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClientes.find((c) => c.id === id);
      const res = await fetch(`/api/admin/clientes/${id}`);
      if (!res.ok) throw new Error('Erro ao buscar cliente');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export function useAdminClienteObras(id: string) {
  return useQuery<AdminClienteObra[]>({
    queryKey: ['admin', 'clientes', id, 'obras'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClienteObras[id] ?? [];
      const res = await fetch(`/api/admin/clientes/${id}/obras`);
      if (!res.ok) throw new Error('Erro ao buscar obras do cliente');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export function useAdminClienteFinanceiro(id: string) {
  return useQuery<ClienteFinanceiro | null>({
    queryKey: ['admin', 'clientes', id, 'financeiro'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClienteFinanceiro[id] ?? null;
      const res = await fetch(`/api/admin/clientes/${id}/financeiro`);
      if (!res.ok) throw new Error('Erro ao buscar financeiro do cliente');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export function useAdminClienteDocumentos(id: string) {
  return useQuery<ClienteDocumento[]>({
    queryKey: ['admin', 'clientes', id, 'documentos'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClienteDocumentos[id] ?? [];
      const res = await fetch(`/api/admin/clientes/${id}/documentos`);
      if (!res.ok) throw new Error('Erro ao buscar documentos do cliente');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export function useCreateCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: NovoClienteFormData) => {
      const res = await fetch('/api/admin/clientes', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao cadastrar cliente');
      return res.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', 'clientes'] });
    },
  });
}

export function useAdminClienteAtividades(id: string) {
  return useQuery<ClienteAtividade[]>({
    queryKey: ['admin', 'clientes', id, 'atividades'],
    queryFn: async () => {
      if (ENABLE_MOCK) return mockAdminClienteAtividades[id] ?? [];
      const res = await fetch(`/api/admin/clientes/${id}/atividades`);
      if (!res.ok) throw new Error('Erro ao buscar atividades do cliente');
      return res.json();
    },
    enabled: !!id,
    ...QUERY_CONFIG,
  });
}

export const editarClienteSchema = z.object({
  tipo: z.enum(['pessoa_fisica', 'pessoa_juridica']),
  nome: z.string().min(3, 'Nome deve ter pelo menos 3 caracteres'),
  cpfCnpj: z.string().min(11, 'CPF/CNPJ inválido'),
  email: z.string().email('E-mail inválido'),
  telefone: z.string().min(10, 'Telefone inválido'),
  endereco: z.string().optional(),
  cidade: z.string().optional(),
  estado: z.string().optional(),
});

export type EditarClienteFormData = z.infer<typeof editarClienteSchema>;

export function useUpdateCliente(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (data: EditarClienteFormData) => {
      if (ENABLE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return { ...data, id };
      }
      const res = await fetch(`/api/admin/clientes/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data),
      });
      if (!res.ok) throw new Error('Erro ao atualizar cliente');
      return res.json();
    },
    onSuccess: (_result, variables) => {
      queryClient.setQueryData<AdminCliente | undefined>(
        ['admin', 'clientes', id],
        (old) => (old ? { ...old, ...variables } : old),
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'clientes'] });
    },
  });
}

export function useBloquearCliente() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, novoStatus }: { id: string; novoStatus: AdminCliente['status'] }) => {
      if (ENABLE_MOCK) {
        await new Promise((r) => setTimeout(r, 600));
        return { id, status: novoStatus };
      }
      const res = await fetch(`/api/admin/clientes/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: novoStatus }),
      });
      if (!res.ok) throw new Error('Erro ao atualizar status do cliente');
      return res.json();
    },
    onSuccess: (_result, { id, novoStatus }) => {
      queryClient.setQueryData<AdminCliente | undefined>(
        ['admin', 'clientes', id],
        (old) => (old ? { ...old, status: novoStatus } : old),
      );
      queryClient.invalidateQueries({ queryKey: ['admin', 'clientes'] });
    },
  });
}

export function useResetarSenhaCliente() {
  return useMutation({
    mutationFn: async (_id: string) => {
      if (ENABLE_MOCK) {
        await new Promise((r) => setTimeout(r, 800));
        return { success: true };
      }
      const res = await fetch(`/api/admin/clientes/${_id}/reset-senha`, {
        method: 'POST',
      });
      if (!res.ok) throw new Error('Erro ao resetar senha');
      return res.json();
    },
  });
}
