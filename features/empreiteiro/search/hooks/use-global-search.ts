import { useMemo } from 'react';
import { useMinhasObras } from '@features/empreiteiro/minhas-obras/hooks/use-minhas-obras';
import { useNovasObras } from '@features/empreiteiro/novas-obras/hooks/use-novas-obras';
import { usePagamentosEmpreiteiro } from '@features/empreiteiro/pagamentos/hooks/use-pagamentos-empreiteiro';
import type { MinhaObra } from '@features/empreiteiro/minhas-obras/types';
import type { NovaObra } from '@features/empreiteiro/novas-obras/types';
import type { MedicaoEmpreiteiro } from '@features/empreiteiro/pagamentos/types';
import type { SearchGroup, SearchHit, UseSearchResult } from '@features/shared/search/types';
import { normalize, matches } from '@features/shared/search/utils';

export type EmpreiteiroSearchCategory = 'minhas-obras' | 'novas-obras' | 'medicoes';

const PER_GROUP_LIMIT = 5;

const CATEGORY_LABEL: Record<EmpreiteiroSearchCategory, string> = {
  'minhas-obras': 'Minhas obras',
  'novas-obras': 'Novas obras',
  medicoes: 'Medições',
};

const CATEGORY_LIST_HREF: Record<EmpreiteiroSearchCategory, string> = {
  'minhas-obras': '/empreiteiro/minhas-obras',
  'novas-obras': '/empreiteiro/novas-obras',
  medicoes: '/empreiteiro/pagamentos',
};

function minhaObraToHit(o: MinhaObra): SearchHit<EmpreiteiroSearchCategory> {
  return {
    id: o.id,
    category: 'minhas-obras',
    title: o.titulo,
    subtitle: `${o.contratante.nome} · ${o.endereco}`,
    meta: o.tipo,
    href: `/empreiteiro/minhas-obras/${o.id}`,
  };
}

function novaObraToHit(o: NovaObra): SearchHit<EmpreiteiroSearchCategory> {
  return {
    id: o.id,
    category: 'novas-obras',
    title: o.titulo,
    subtitle: `${o.contratante.nome} · ${o.endereco}`,
    meta: o.tipo,
    href: `/empreiteiro/novas-obras/${o.id}`,
  };
}

function medicaoToHit(m: MedicaoEmpreiteiro): SearchHit<EmpreiteiroSearchCategory> {
  return {
    id: m.id,
    category: 'medicoes',
    title: m.descricao,
    subtitle: `${m.obraNome} · Medição #${m.numero} · ${m.periodo}`,
    meta: m.status,
    href: '/empreiteiro/pagamentos',
  };
}

export function useEmpreiteiroGlobalSearch(
  query: string,
): UseSearchResult<EmpreiteiroSearchCategory> {
  const { data: minhasObras, isLoading: loadingMinhas } = useMinhasObras();
  const { data: novasObrasPayload, isLoading: loadingNovas } = useNovasObras({ pageSize: 100 });
  const novasObras = novasObrasPayload?.rows;
  const { data: medicoes, isLoading: loadingMedicoes } = usePagamentosEmpreiteiro();

  const isLoading = loadingMinhas || loadingNovas || loadingMedicoes;

  const groups = useMemo<SearchGroup<EmpreiteiroSearchCategory>[]>(() => {
    const term = normalize(query.trim());

    const minhasMatches = (minhasObras ?? []).filter((o) =>
      matches(term, o.titulo, o.endereco, o.contratante.nome, o.tipo, o.status),
    );
    const novasMatches = (novasObras ?? []).filter((o) =>
      matches(term, o.titulo, o.endereco, o.contratante.nome, o.tipo, o.descricao),
    );
    const medicoesMatches = (medicoes ?? []).filter((m) =>
      matches(term, m.descricao, m.obraNome, m.periodo, m.status),
    );

    const result: SearchGroup<EmpreiteiroSearchCategory>[] = [
      {
        category: 'minhas-obras',
        label: CATEGORY_LABEL['minhas-obras'],
        totalMatches: minhasMatches.length,
        hits: minhasMatches.slice(0, PER_GROUP_LIMIT).map(minhaObraToHit),
        seeAllHref: CATEGORY_LIST_HREF['minhas-obras'],
      },
      {
        category: 'novas-obras',
        label: CATEGORY_LABEL['novas-obras'],
        totalMatches: novasMatches.length,
        hits: novasMatches.slice(0, PER_GROUP_LIMIT).map(novaObraToHit),
        seeAllHref: CATEGORY_LIST_HREF['novas-obras'],
      },
      {
        category: 'medicoes',
        label: CATEGORY_LABEL.medicoes,
        totalMatches: medicoesMatches.length,
        hits: medicoesMatches.slice(0, PER_GROUP_LIMIT).map(medicaoToHit),
        seeAllHref: CATEGORY_LIST_HREF.medicoes,
      },
    ];

    return result.filter((g) => g.hits.length > 0);
  }, [query, minhasObras, novasObras, medicoes]);

  return { groups, isLoading };
}
