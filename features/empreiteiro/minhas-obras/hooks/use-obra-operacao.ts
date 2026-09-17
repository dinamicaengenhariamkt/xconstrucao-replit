'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useToast } from '@shared/hooks/use-toast';
import type { MembroEquipe, MinhaObraChecklist, MinhaObraDetalhe, MinhaObraTarefa } from '../types';
import {
  aplicarToggleOtimista,
  normalizarChecklistResposta,
  type ChecklistPatchResponse,
} from '../lib/checklist-projecao';

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
  qc.invalidateQueries({ queryKey: ['obras', obraId, 'etapas'] });
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
          etapaId: input.etapaId ?? null,
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
          etapaId: patch.etapaId,
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
  /** XG21 — de quanto em quanto tempo o checklist zera. */
  recorrencia?: MinhaObraChecklist['recorrencia'];
  recorrenciaDiaSemana?: number | null;
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

/**
 * Toggle de item do checklist, com mutação otimista.
 *
 * Separado de `useUpdateChecklist` de propósito. É o único caminho de alta
 * frequência — o usuário tica doze itens seguidos no canteiro — e o único cuja
 * projeção local é barata e determinística. Finalizar, assinar e editar passam
 * por modal, onde a latência é esperada, e replicar `markAllItens` ou o carimbo
 * de assinatura no cache seria duplicar regra de negócio sem ganho percebido.
 *
 * E, principalmente: **não invalida nada**. `invalidateDetalhe` dispararia
 * `buildMinhaObraDetalheReal` (~19 queries sequenciais mais um presign R2 por
 * foto, documento e contrato de equipe) para reler um booleano que o PATCH já
 * respondeu projetado. Era daí que vinham os 5-6 segundos até o tique aparecer.
 */
export function useToggleChecklistItem(obraId: string) {
  const qc = useQueryClient();
  const { toast } = useToast();
  const detalheKey = ['empreiteiro', 'minhas-obras', obraId];

  return useMutation({
    mutationFn: ({ checklistId, itemId }: { checklistId: string; itemId: string }) =>
      jsonFetch<ChecklistPatchResponse>(`/api/obras/${obraId}/checklists/${checklistId}`, {
        method: 'PATCH',
        body: JSON.stringify({ toggleItemId: itemId }),
      }),

    onMutate: async ({ checklistId, itemId }) => {
      // Sem cancelar, um refetch já em voo (o detalhe usa
      // `refetchOnWindowFocus`) pousaria depois do `setQueryData` e desfaria o
      // tique na tela.
      await qc.cancelQueries({ queryKey: detalheKey });
      const anterior = qc.getQueryData<MinhaObraDetalhe>(detalheKey);
      if (anterior) {
        qc.setQueryData<MinhaObraDetalhe>(detalheKey, {
          ...anterior,
          checklists: anterior.checklists.map((c) =>
            c.id === checklistId ? aplicarToggleOtimista(c, itemId) : c,
          ),
        });
      }
      return { anterior };
    },

    onError: (err: Error, _vars, ctx) => {
      if (ctx?.anterior) qc.setQueryData(detalheKey, ctx.anterior);
      toast({
        title: 'Não foi possível marcar o item',
        description: err.message,
        variant: 'destructive',
      });
    },

    onSuccess: (resp) => {
      // A rota devolve o checklist já projetado no período corrente. Escrever a
      // resposta fecha a janela em que o otimista poderia divergir do servidor
      // — por exemplo se a meia-noite virar entre o clique e a resposta — sem
      // custar nenhum refetch.
      const atualizado = normalizarChecklistResposta(resp);
      qc.setQueryData<MinhaObraDetalhe>(detalheKey, (prev) =>
        prev
          ? {
              ...prev,
              checklists: prev.checklists.map((c) =>
                c.id === atualizado.id ? atualizado : c,
              ),
            }
          : prev,
      );
    },
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
