import type { TopClientesTableProps } from '../types';
import { TopRankingTable } from './TopRankingTable';

interface TopClientesTableExtendedProps extends TopClientesTableProps {
  luminous?: boolean;
}

export function TopClientesTable({ clientes, luminous = false }: TopClientesTableExtendedProps) {
  return (
    <TopRankingTable
      items={clientes}
      title="Top clientes por volume"
      description="Maiores contratantes da plataforma"
      entityLabel="Cliente"
      searchPlaceholder="Buscar cliente..."
      testIdPrefix="top-clientes"
      luminous={luminous}
    />
  );
}
