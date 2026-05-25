'use client';

import { useState, useMemo, useEffect, useRef } from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { RiSearchLine, RiLoader4Line } from 'react-icons/ri';
import { PageHeader } from '@features/shared/components/PageHeader';
import { Input } from '@shared/components/ui/input';
import { Button } from '@shared/components/ui/button';
import {
  useObrasSalvasInfinite,
} from '@features/empreiteiro/obras-salvas/hooks/use-obras-salvas';
import { NovaObraCard } from '@features/empreiteiro/novas-obras/components/NovaObraCard';
import { IconBookmark, IconSearch } from '@shared/components/icons';

const PAGE_SIZE = 20;

export default function ObrasSalvasPage() {
  const {
    data,
    isLoading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
  } = useObrasSalvasInfinite({ pageSize: PAGE_SIZE });

  const obras = useMemo(
    () => (data?.pages ?? []).flatMap((p) => p.rows),
    [data],
  );
  const total = data?.pages?.[0]?.total ?? 0;

  const [searchQuery, setSearchQuery] = useState('');

  const sentinelRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const node = sentinelRef.current;
    if (!node) return;
    if (!hasNextPage) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      { rootMargin: '300px 0px' },
    );
    observer.observe(node);
    return () => observer.disconnect();
  }, [hasNextPage, isFetchingNextPage, fetchNextPage, obras.length]);

  const filtered = useMemo(() => {
    if (!searchQuery.trim()) return obras;
    const q = searchQuery.toLowerCase();
    return obras.filter(
      (o) =>
        o.titulo.toLowerCase().includes(q) ||
        o.endereco.toLowerCase().includes(q) ||
        o.tipo.toLowerCase().includes(q),
    );
  }, [obras, searchQuery]);

  const subtitle =
    total > 0
      ? `${total} obra${total !== 1 ? 's' : ''} salva${total !== 1 ? 's' : ''} para acompanhamento.`
      : 'Suas obras favoritas aparecem aqui para acompanhamento e candidatura posterior.';

  if (isLoading && !data) {
    return (
      <div className="p-10 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="animate-pulse rounded-3xl bg-gray-100 dark:bg-gray-800 aspect-[4/3]"
          />
        ))}
      </div>
    );
  }

  if (total === 0 && obras.length === 0) {
    return (
      <div className="p-10 flex flex-col gap-10" data-testid="obras-salvas-empreiteiro-page">
        <PageHeader title="Obras Salvas" subtitle={subtitle} />
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 gap-4 text-center"
        >
          <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
            <IconBookmark className="text-gray-300 text-4xl" />
          </div>
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">
            Nenhuma obra salva ainda
          </h3>
          <p className="text-sm text-gray-400 max-w-xs">
            Explore as obras disponíveis e clique no ícone de marcador para guardar suas favoritas aqui.
          </p>
          <Link
            href="/empreiteiro/novas-obras"
            className="mt-2 px-6 py-2.5 bg-primary text-white rounded-xl font-bold text-sm hover:bg-primary/90 transition-colors flex items-center gap-2"
          >
            <IconSearch className="text-lg" />
            Explorar Novas Obras
          </Link>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="p-10 flex flex-col gap-10" data-testid="obras-salvas-empreiteiro-page">
      <div className="flex flex-col gap-6 mb-12">
        <PageHeader title="Obras Salvas" subtitle={subtitle} />

        <div className="flex flex-col gap-3">
          <div className="relative w-full sm:max-w-md sm:ml-auto">
            <RiSearchLine className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 w-4 h-4" />
            <Input
              placeholder="Buscar nesta página por título, endereço ou tipo..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 bg-white dark:bg-gray-900 border-gray-200 dark:border-gray-700"
              data-testid="input-search-obras-salvas"
            />
          </div>

          {total > 0 && (
            <p
              className="text-xs text-muted-foreground"
              data-testid="obras-salvas-total-info"
            >
              <span className="font-semibold text-primary">{total}</span> obra
              {total === 1 ? '' : 's'} salva{total === 1 ? '' : 's'} · {obras.length}{' '}
              carregada{obras.length === 1 ? '' : 's'}
            </p>
          )}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="text-center py-20" data-testid="empty-state-obras-salvas-filtros">
          <h3 className="text-lg font-bold text-gray-500 dark:text-gray-400">
            Nenhuma obra encontrada
          </h3>
          <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
            Tente alterar o termo de busca.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-10">
          {filtered.map((obra, i) => (
            <motion.div
              key={obra.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
            >
              <NovaObraCard obra={obra} />
            </motion.div>
          ))}
        </div>
      )}

      {(hasNextPage || isFetchingNextPage) && (
        <div
          ref={sentinelRef}
          className="flex flex-col items-center justify-center gap-3 py-6"
          data-testid="obras-salvas-infinite-sentinel"
        >
          {isFetchingNextPage ? (
            <div
              className="flex items-center gap-2 text-sm text-muted-foreground"
              data-testid="obras-salvas-infinite-loading"
            >
              <RiLoader4Line className="h-4 w-4 animate-spin" />
              Carregando mais obras...
            </div>
          ) : (
            <Button
              variant="outline"
              size="sm"
              onClick={() => void fetchNextPage()}
              data-testid="obras-salvas-load-more"
            >
              Carregar mais
            </Button>
          )}
        </div>
      )}
    </div>
  );
}
