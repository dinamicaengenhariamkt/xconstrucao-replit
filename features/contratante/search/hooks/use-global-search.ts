import { useMemo } from 'react';
import { useObrasContratante } from '@features/contratante/minhas-obras/hooks/use-minhas-obras';
import { usePagamentos } from '@features/contratante/pagamentos/hooks/use-pagamentos';
import type { ObraContratante } from '@features/contratante/minhas-obras/types';
import type { PagamentoContratante } from '@features/contratante/pagamentos/types';
import type { SearchGroup, SearchHit, UseSearchResult } from '@features/shared/search/types';
import { normalize, matches } from '@features/shared/search/utils';

export type ContratanteSearchCategory = 'obras' | 'pagamentos';

const PER_GROUP_LIMIT = 5;

const CATEGORY_LABEL: Record<ContratanteSearchCategory, string> = {
  obras: 'Minhas obras',
  pagamentos: 'Pagamentos',
};

const CATEGORY_LIST_HREF: Record<ContratanteSearchCategory, string> = {
  obras: '/contratante/minhas-obras',
  pagamentos: '/contratante/pagamentos',
};

function obraToHit(o: ObraContratante): SearchHit<ContratanteSearchCategory> {
  return {
    id: o.id,
    category: 'obras',
    title: o.titulo,
    subtitle: `${o.empreiteiro.nome} · ${o.endereco}`,
    meta: o.tipo,
    href: `/contratante/minhas-obras/${o.id}`,
  };
}

function pagamentoToHit(p: PagamentoContratante): SearchHit<ContratanteSearchCategory> {
  return {
    id: p.id,
    category: 'pagamentos',
    title: p.descricao,
    subtitle: `${p.obraNome} · ${p.categoria}`,
    meta: p.status,
    href: '/contratante/pagamentos',
  };
}

export function useContratanteGlobalSearch(
  query: string,
): UseSearchResult<ContratanteSearchCategory> {
  const { data: obrasPayload, isLoading: loadingObras } = useObrasContratante({ pageSize: 100 });
  const obras = obrasPayload?.rows;
  const { data: pagamentos, isLoading: loadingPagamentos } = usePagamentos();

  const isLoading = loadingObras || loadingPagamentos;

  const groups = useMemo<SearchGroup<ContratanteSearchCategory>[]>(() => {
    const term = normalize(query.trim());

    const obrasMatches = (obras ?? []).filter((o) =>
      matches(term, o.titulo, o.endereco, o.empreiteiro.nome, o.tipo, o.status),
    );
    const pagamentosMatches = (pagamentos ?? []).filter((p) =>
      matches(term, p.descricao, p.obraNome, p.categoria, p.metodoPagamento, p.status, p.tipo),
    );

    const result: SearchGroup<ContratanteSearchCategory>[] = [
      {
        category: 'obras',
        label: CATEGORY_LABEL.obras,
        totalMatches: obrasMatches.length,
        hits: obrasMatches.slice(0, PER_GROUP_LIMIT).map(obraToHit),
        seeAllHref: CATEGORY_LIST_HREF.obras,
      },
      {
        category: 'pagamentos',
        label: CATEGORY_LABEL.pagamentos,
        totalMatches: pagamentosMatches.length,
        hits: pagamentosMatches.slice(0, PER_GROUP_LIMIT).map(pagamentoToHit),
        seeAllHref: CATEGORY_LIST_HREF.pagamentos,
      },
    ];

    return result.filter((g) => g.hits.length > 0);
  }, [query, obras, pagamentos]);

  return { groups, isLoading };
}
