'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/use-toast';
import type { MembroEquipe, MinhaObraChecklist, MinhaObraTarefa } from '../types';

async function jsonFetch<T>(url: string, init?: RequestInit): Promise<T> {
  const res = await fetch(url, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers ?? {}) },
  });
  if (!res.ok) {
    let msg = `Erro ${res.status}`;
    try {
      const data = await res.json();
      if (data?.message) msg = data.message;
    } catch {}
    throw new Error(msg);
  }
  if (res.status === 204) return undefined as T;
  return res.json();
}

function invalidateDetalhe(qc: ReturnType<typeof useQueryClient>, obraId: string) {
  qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras', obraId] });
  qc.invalidateQueries({ queryKey: ['empreiteiro', 'minhas-obras'] });
  qc.invalidateQueries({ queryKey: ['contratante', 'minhas-obras', obraId] });
  qc.invalidateQueries({ queryKey: ['admin', 'obras', obraId] });
}

// ─── Tarefas ─────────────────────────────────────────────────────────────────

type CreateTarefaInput = Partial<MinhaObraTarefa> & { titulo: string };

export function useCreateTarefa(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: CreateTarefaInput) =>
      jsonFetch(`/api/obras/${obraId}/tarefas`, {
        method: 'POST',
        body: JSON.stringify({
          titulo: input.titulo,
          etapa: input.etapa,
          responsavel: input.responsavel,
          prazo: input.prazo,
          status: input.status,
          prioridade: input.prioridade,
          progresso: input.progresso ?? null,
          bloqueioMotivo: input.bloqueioMotivo ?? null,
          bloqueioInfo: input.bloqueioInfo ?? null,
          descricao: input.descricao ?? null,
        }),
      }),
    onSuccess: () => {
      invalidateDetalhe(qc, obraId);
      toast({ title: 'Tarefa criada' });
    },
    onError: (err: Error) => toast({ title: 'Erro ao criar tarefa', description: err.message, variant: 'destructive' }),
  });
}

export function useUpdateTarefa(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<MinhaObraTarefa> }) =>
      jsonFetch(`/api/obras/${obraId}/tarefas/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          titulo: patch.titulo,
          etapa: patch.etapa,
          responsavel: patch.responsavel,
          prazo: patch.prazo,
          status: patch.status,
          prioridade: patch.prioridade,
          progresso: patch.progresso,
          bloqueioMotivo: patch.bloqueioMotivo,
          bloqueioInfo: patch.bloqueioInfo,
          descricao: patch.descricao,
        }),
      }),
    onSuccess: () => invalidateDetalhe(qc, obraId),
    onError: (err: Error) => toast({ title: 'Erro ao atualizar tarefa', description: err.message, variant: 'destructive' }),
  });
}

export function useDeleteTarefa(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/obras/${obraId}/tarefas/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateDetalhe(qc, obraId);
      toast({ title: 'Tarefa excluída' });
    },
    onError: (err: Error) => toast({ title: 'Erro ao excluir tarefa', description: err.message, variant: 'destructive' }),
  });
}

// ─── Checklists ──────────────────────────────────────────────────────────────

type CreateChecklistInput = {
  nome: string;
  tipo: MinhaObraChecklist['tipo'];
  descricao?: string;
  itens: { titulo: string }[];
};

export function useCreateChecklist(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: CreateChecklistInput) =>
      jsonFetch(`/api/obras/${obraId}/checklists`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateDetalhe(qc, obraId);
      toast({ title: 'Checklist criado' });
    },
    onError: (err: Error) => toast({ title: 'Erro ao criar checklist', description: err.message, variant: 'destructive' }),
  });
}

export function useUpdateChecklist(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Record<string, unknown> }) =>
      jsonFetch(`/api/obras/${obraId}/checklists/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => invalidateDetalhe(qc, obraId),
    onError: (err: Error) => toast({ title: 'Erro ao atualizar checklist', description: err.message, variant: 'destructive' }),
  });
}

export function useDeleteChecklist(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/obras/${obraId}/checklists/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateDetalhe(qc, obraId);
      toast({ title: 'Checklist excluído' });
    },
    onError: (err: Error) => toast({ title: 'Erro ao excluir checklist', description: err.message, variant: 'destructive' }),
  });
}

// ─── Equipe ──────────────────────────────────────────────────────────────────

type CreateMembroInput = Omit<MembroEquipe, 'id' | 'iniciais'>;

export function useCreateMembro(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (input: CreateMembroInput) =>
      jsonFetch(`/api/obras/${obraId}/equipe`, {
        method: 'POST',
        body: JSON.stringify(input),
      }),
    onSuccess: () => {
      invalidateDetalhe(qc, obraId);
      toast({ title: 'Membro adicionado' });
    },
    onError: (err: Error) => toast({ title: 'Erro ao adicionar membro', description: err.message, variant: 'destructive' }),
  });
}

export function useUpdateMembro(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: ({ id, patch }: { id: string; patch: Partial<MembroEquipe> }) =>
      jsonFetch(`/api/obras/${obraId}/equipe/${id}`, {
        method: 'PATCH',
        body: JSON.stringify(patch),
      }),
    onSuccess: () => invalidateDetalhe(qc, obraId),
    onError: (err: Error) => toast({ title: 'Erro ao atualizar membro', description: err.message, variant: 'destructive' }),
  });
}

export function useDeleteMembro(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  return useMutation({
    mutationFn: (id: string) =>
      jsonFetch(`/api/obras/${obraId}/equipe/${id}`, { method: 'DELETE' }),
    onSuccess: () => {
      invalidateDetalhe(qc, obraId);
      toast({ title: 'Membro removido' });
    },
    onError: (err: Error) => toast({ title: 'Erro ao remover membro', description: err.message, variant: 'destructive' }),
  });
}

// Helper: virtual ids são entradas derivadas (contratante/empreiteira) que não vivem no DB.
export function isVirtualMembroId(id: string): boolean {
  return id.startsWith('contratante-') || id.startsWith('empreiteira-');
}
