'use client';

import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import type { MinhaObraChecklist, ChecklistItem } from '@features/empreiteiro/minhas-obras/types';
import type { MembroEquipe } from '../types';

/** Iniciais a partir do nome (2 primeiras palavras). */
function iniciaisFromNome(nome: string): string {
  return nome
    .trim()
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0].toUpperCase())
    .join('');
}

/**
 * Entidades do detalhe da obra que têm rota dedicada própria
 * (`/api/obras/[id]/{checklists,equipe,tarefas}`) e antes eram servidas
 * como `[]`/`0` hardcoded pelo adapter (J40 Item 10). Cada aba/KPI consome
 * sua rota real — fonte única por entidade, sem inflar o GET da obra.
 */

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (!res.ok) throw new Error(`Falha ao carregar ${url}`);
  return res.json();
}

// ── Checklists ──────────────────────────────────────────────────────────────

interface DbChecklistRow {
  id: string;
  nome: string;
  descricao: string;
  tipo: MinhaObraChecklist['tipo'];
  status: MinhaObraChecklist['status'];
  completadoEm: string | null;
  assinadoPor: string | null;
  assinadoEm: string | null;
  registroProfissional: string | null;
  itens: { id: string; titulo: string; concluida: boolean }[];
}

function mapChecklist(row: DbChecklistRow): MinhaObraChecklist {
  const itens: ChecklistItem[] = row.itens.map((i) => ({
    id: i.id,
    titulo: i.titulo,
    concluida: i.concluida,
  }));
  return {
    id: row.id,
    nome: row.nome,
    descricao: row.descricao ?? '',
    tipo: row.tipo,
    status: row.status,
    itens,
    completadoEm: row.completadoEm ?? undefined,
    assinadoPor: row.assinadoPor ?? undefined,
    assinadoEm: row.assinadoEm ?? undefined,
    registroProfissional: row.registroProfissional ?? undefined,
  };
}

export function useObraChecklists(
  obraId: string | null | undefined,
): UseQueryResult<MinhaObraChecklist[], Error> {
  return useQuery({
    queryKey: ['contratante', 'obra', obraId, 'checklists'],
    queryFn: async () => {
      const { rows } = await fetchJson<{ rows: DbChecklistRow[] }>(
        `/api/obras/${obraId}/checklists`,
      );
      return rows.map(mapChecklist);
    },
    enabled: !!obraId,
    staleTime: 30_000,
  });
}

// ── Equipe ──────────────────────────────────────────────────────────────────

interface DbEquipeRow {
  id: string;
  nome: string;
  papel: string | null;
  cor: string | null;
  telefone: string | null;
}

function mapMembroEquipe(row: DbEquipeRow): MembroEquipe {
  return {
    id: row.id,
    nome: row.nome,
    funcao: row.papel ?? '',
    iniciais: iniciaisFromNome(row.nome) || '—',
    cor: row.cor ?? 'bg-primary',
    telefone: row.telefone ?? '',
  };
}

export function useObraEquipe(
  obraId: string | null | undefined,
): UseQueryResult<MembroEquipe[], Error> {
  return useQuery({
    queryKey: ['contratante', 'obra', obraId, 'equipe'],
    queryFn: async () => {
      const { rows } = await fetchJson<{ rows: DbEquipeRow[] }>(
        `/api/obras/${obraId}/equipe`,
      );
      return rows.map(mapMembroEquipe);
    },
    enabled: !!obraId,
    staleTime: 30_000,
  });
}

// ── Tarefas (contagem para o KPI do hero) ────────────────────────────────────

interface DbTarefaRow {
  id: string;
  status: 'pendente' | 'em_andamento' | 'bloqueado' | 'concluido';
}

export interface TarefasResumo {
  total: number;
  concluidas: number;
}

export function useObraTarefasResumo(
  obraId: string | null | undefined,
): UseQueryResult<TarefasResumo, Error> {
  return useQuery({
    queryKey: ['contratante', 'obra', obraId, 'tarefas-resumo'],
    queryFn: async () => {
      const { rows } = await fetchJson<{ rows: DbTarefaRow[] }>(
        `/api/obras/${obraId}/tarefas`,
      );
      return {
        total: rows.length,
        concluidas: rows.filter((t) => t.status === 'concluido').length,
      };
    },
    enabled: !!obraId,
    staleTime: 30_000,
  });
}
