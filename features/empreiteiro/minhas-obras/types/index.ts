import type { ObraStatus, FilterChipOption } from '@features/shared/types';

export interface MinhaObra {
  id: string;
  titulo: string;
  endereco: string;
  imagemUrl: string;
  status: ObraStatus;
  progresso: number;
  orcamento: number;
  dataInicio: string;
  dataPrevisaoFim: string;
  contratante: {
    nome: string;
    iniciais: string;
    cor: string;
  };
  tipo: string;
}

export interface MinhaObraCardProps {
  obra: MinhaObra;
}

export interface MinhasObrasGridProps {
  obras: MinhaObra[];
}

export interface MinhasObrasFilterProps {
  filters: FilterChipOption[];
  activeFilter: string;
  onFilterChange: (value: string) => void;
}
