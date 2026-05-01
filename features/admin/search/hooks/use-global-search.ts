import { useMemo } from 'react';
import { useAdminClientes } from '@features/admin/clientes/hooks/use-clientes';
import { useAdminEmpreiteiras } from '@features/admin/empreiteiras/hooks/use-empreiteiras';
import { useAdminObras } from '@features/admin/obras/hooks/use-obras-list';
import { useEntradas } from '@features/admin/entradas/hooks/use-entradas';
import { useSaidas } from '@features/admin/saidas/hooks/use-saidas';
import type { AdminCliente } from '@features/admin/clientes/types';
import type { AdminEmpreiteira } from '@features/admin/empreiteiras/types';
import type { AdminObra } from '@features/admin/obras/types/list';
import type { Entrada } from '@features/admin/entradas/types';
import type { Saida } from '@features/admin/saidas/types';

export type AdminSearchCategory =
  | 'clientes'
  | 'empreiteiras'
  | 'obras'
  | 'entradas'
  | 'saidas';

export interface AdminSearchHit {
  id: string;
  category: AdminSearchCategory;
  title: string;
  subtitle?: string;
  meta?: string;
  href: string;
}

export interface AdminSearchGroup {
  category: AdminSearchCategory;
  label: string;
  hits: AdminSearchHit[];
  totalMatches: number;
  seeAllHref: string;
}

const PER_GROUP_LIMIT = 5;

const CATEGORY_LABEL: Record<AdminSearchCategory, string> = {
  clientes: 'Clientes',
  empreiteiras: 'Empreiteiras',
  obras: 'Obras',
  entradas: 'Entradas',
  saidas: 'Saídas',
};

const CATEGORY_LIST_HREF: Record<AdminSearchCategory, string> = {
  clientes: '/admin/clientes',
  empreiteiras: '/admin/empreiteiras',
  obras: '/admin/obras',
  entradas: '/admin/entradas',
  saidas: '/admin/saidas',
};

function normalize(value: string): string {
  return value
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '');
}

function matches(term: string, ...fields: (string | undefined | null)[]): boolean {
  if (!term) return true;
  const haystack = normalize(fields.filter(Boolean).join(' '));
  return haystack.includes(term);
}

function clienteToHit(c: AdminCliente): AdminSearchHit {
  const localizacao = [c.cidade, c.estado].filter(Boolean).join(' · ');
  return {
    id: c.id,
    category: 'clientes',
    title: c.nome,
    subtitle: localizacao || c.email,
    meta: c.cpfCnpj,
    href: `/admin/clientes/${c.id}`,
  };
}

function empreiteiraToHit(e: AdminEmpreiteira): AdminSearchHit {
  const localizacao = [e.cidade, e.estado].filter(Boolean).join(' · ');
  return {
    id: e.id,
    category: 'empreiteiras',
    title: e.nomeFantasia || e.razaoSocial,
    subtitle: localizacao || e.email,
    meta: e.cnpj,
    href: `/admin/empreiteiras/${e.id}`,
  };
}

function obraToHit(o: AdminObra): AdminSearchHit {
  return {
    id: o.id,
    category: 'obras',
    title: o.nome,
    subtitle: `${o.clienteNome} · ${o.empreiteiraNome}`,
    meta: o.codigo,
    href: `/admin/obras/${o.id}`,
  };
}

function entradaToHit(en: Entrada): AdminSearchHit {
  return {
    id: en.id,
    category: 'entradas',
    title: en.descricao,
    subtitle: en.clienteEmpreiteira,
    meta: en.id,
    href: '/admin/entradas',
  };
}

function saidaToHit(s: Saida): AdminSearchHit {
  return {
    id: s.id,
    category: 'saidas',
    title: s.descricao,
    subtitle: s.destino,
    meta: s.obra ?? s.id,
    href: '/admin/saidas',
  };
}

export interface UseAdminGlobalSearchResult {
  groups: AdminSearchGroup[];
  totalHits: number;
  isLoading: boolean;
}

export function useAdminGlobalSearch(query: string): UseAdminGlobalSearchResult {
  const { data: clientes, isLoading: loadingClientes } = useAdminClientes();
  const { data: empreiteiras, isLoading: loadingEmpreiteiras } = useAdminEmpreiteiras();
  const { data: obras, isLoading: loadingObras } = useAdminObras();
  const { data: entradas, isLoading: loadingEntradas } = useEntradas('12meses');
  const { data: saidas, isLoading: loadingSaidas } = useSaidas('12meses');

  const isLoading =
    loadingClientes || loadingEmpreiteiras || loadingObras || loadingEntradas || loadingSaidas;

  const groups = useMemo<AdminSearchGroup[]>(() => {
    const term = normalize(query.trim());

    const clientesMatches = (clientes ?? []).filter((c) =>
      matches(term, c.nome, c.email, c.cpfCnpj, c.cidade, c.estado),
    );
    const empreiteirasMatches = (empreiteiras ?? []).filter((e) =>
      matches(term, e.nomeFantasia, e.razaoSocial, e.cnpj, e.email, e.cidade, e.estado),
    );
    const obrasMatches = (obras ?? []).filter((o) =>
      matches(term, o.nome, o.codigo, o.clienteNome, o.empreiteiraNome, o.endereco, o.tipo),
    );
    const entradasMatches = (entradas ?? []).filter((en) =>
      matches(term, en.descricao, en.clienteEmpreiteira, en.id),
    );
    const saidasMatches = (saidas ?? []).filter((s) =>
      matches(term, s.descricao, s.destino, s.obra, s.local, s.id),
    );

    const result: AdminSearchGroup[] = [
      {
        category: 'clientes',
        label: CATEGORY_LABEL.clientes,
        totalMatches: clientesMatches.length,
        hits: clientesMatches.slice(0, PER_GROUP_LIMIT).map(clienteToHit),
        seeAllHref: CATEGORY_LIST_HREF.clientes,
      },
      {
        category: 'empreiteiras',
        label: CATEGORY_LABEL.empreiteiras,
        totalMatches: empreiteirasMatches.length,
        hits: empreiteirasMatches.slice(0, PER_GROUP_LIMIT).map(empreiteiraToHit),
        seeAllHref: CATEGORY_LIST_HREF.empreiteiras,
      },
      {
        category: 'obras',
        label: CATEGORY_LABEL.obras,
        totalMatches: obrasMatches.length,
        hits: obrasMatches.slice(0, PER_GROUP_LIMIT).map(obraToHit),
        seeAllHref: CATEGORY_LIST_HREF.obras,
      },
      {
        category: 'entradas',
        label: CATEGORY_LABEL.entradas,
        totalMatches: entradasMatches.length,
        hits: entradasMatches.slice(0, PER_GROUP_LIMIT).map(entradaToHit),
        seeAllHref: CATEGORY_LIST_HREF.entradas,
      },
      {
        category: 'saidas',
        label: CATEGORY_LABEL.saidas,
        totalMatches: saidasMatches.length,
        hits: saidasMatches.slice(0, PER_GROUP_LIMIT).map(saidaToHit),
        seeAllHref: CATEGORY_LIST_HREF.saidas,
      },
    ];

    return result.filter((g) => g.hits.length > 0);
  }, [query, clientes, empreiteiras, obras, entradas, saidas]);

  const totalHits = groups.reduce((acc, g) => acc + g.totalMatches, 0);

  return { groups, totalHits, isLoading };
}
