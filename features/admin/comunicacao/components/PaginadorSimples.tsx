'use client';

import { useMemo } from 'react';
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from '@shared/components/ui/pagination';
import { getPaginationRange } from '@shared/lib/pagination';

/** Paginador read-only reutilizado pelas abas da observabilidade de comunicação. */
export function PaginadorSimples({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (p: number) => void;
}) {
  const range = useMemo(() => getPaginationRange(page, totalPages), [page, totalPages]);
  if (totalPages <= 1) return null;

  return (
    <Pagination>
      <PaginationContent>
        <PaginationItem>
          <PaginationPrevious
            onClick={() => page > 1 && onChange(page - 1)}
            className={page <= 1 ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
          />
        </PaginationItem>
        {range.map((p, i) =>
          p === 'ellipsis' ? (
            <PaginationItem key={`e-${i}`}>
              <span className="px-2 text-gray-400">…</span>
            </PaginationItem>
          ) : (
            <PaginationItem key={p}>
              <PaginationLink
                isActive={p === page}
                onClick={() => onChange(p as number)}
                className="cursor-pointer"
              >
                {p}
              </PaginationLink>
            </PaginationItem>
          ),
        )}
        <PaginationItem>
          <PaginationNext
            onClick={() => page < totalPages && onChange(page + 1)}
            className={page >= totalPages ? 'pointer-events-none opacity-40' : 'cursor-pointer'}
          />
        </PaginationItem>
      </PaginationContent>
    </Pagination>
  );
}
