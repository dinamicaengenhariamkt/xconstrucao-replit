import type { AdminCliente } from './types';

export type ClienteStatus = AdminCliente['status'];

export const STATUS_OPTIONS: { value: ClienteStatus; label: string }[] = [
  { value: 'ativo', label: 'Ativo' },
  { value: 'inativo', label: 'Inativo' },
  { value: 'pendente', label: 'Pendente' },
  { value: 'aprovacao', label: 'Aguardando curadoria' },
];

export const ITEMS_PER_PAGE = 12;
