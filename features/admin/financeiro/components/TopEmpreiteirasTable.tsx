import type { TopEmpreiteirasTableProps } from '../types';
import { TopRankingTable } from './TopRankingTable';

interface TopEmpreiteirasTableExtendedProps extends TopEmpreiteirasTableProps {
  luminous?: boolean;
}

export function TopEmpreiteirasTable({
  empreiteiras,
  luminous = false,
}: TopEmpreiteirasTableExtendedProps) {
  return (
    <TopRankingTable
      items={empreiteiras}
      title="Top empreiteiras por volume"
      description="Maiores executoras da plataforma"
      entityLabel="Empreiteira"
      searchPlaceholder="Buscar empreiteira..."
      testIdPrefix="top-empreiteiras"
      luminous={luminous}
    />
  );
}
