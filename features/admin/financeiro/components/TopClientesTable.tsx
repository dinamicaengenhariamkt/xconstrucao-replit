import type { TopClientesTableProps } from '../types';
import { TopRankingTable } from './TopRankingTable';

export function TopClientesTable({ clientes }: TopClientesTableProps) {
  return (
    <TopRankingTable
      items={clientes}
      title="Top clientes por volume"
      description="Maiores contratantes da plataforma"
      entityLabel="Cliente"
      searchPlaceholder="Buscar cliente..."
      testIdPrefix="top-clientes"
    />
  );
}
