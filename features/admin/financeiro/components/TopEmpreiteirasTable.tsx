import type { TopEmpreiteirasTableProps } from '../types';
import { TopRankingTable } from './TopRankingTable';

export function TopEmpreiteirasTable({ empreiteiras }: TopEmpreiteirasTableProps) {
  return (
    <TopRankingTable
      items={empreiteiras}
      title="Top empreiteiras por volume"
      description="Maiores executoras da plataforma"
      entityLabel="Empreiteira"
      searchPlaceholder="Buscar empreiteira..."
      testIdPrefix="top-empreiteiras"
    />
  );
}
