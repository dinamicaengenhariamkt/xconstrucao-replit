import {
  dbToNovaObra,
  dbToObraDetalheEmpreiteiro,
  type DbObra,
} from '@features/obras/adapters';
import type { NovaObra, PerfilStatus, ObraDetalhe } from '../types';

export interface PaginatedResponse<T> {
  rows: T[];
  total: number;
  page: number;
  pageSize: number;
  totalPages: number;
  /** Task #93: presente apenas para role=empreiteiro — indica se o perfil tem zona configurada. */
  zonaConfigurada?: boolean;
}

export interface GetNovasObrasParams {
  page?: number;
  pageSize?: number;
  q?: string;
  cidade?: string;
  uf?: string;
  minValor?: number;
  maxValor?: number;
  tipo?: string | string[];
  modalidade?: string;
  materiaisPor?: string | string[];
  /** Task #93: filtro "Só na minha zona". Mapeia pra `?na_minha_zona=true`. */
  naMinhaZona?: boolean;
}

export async function getNovasObras(
  params: GetNovasObrasParams = {},
): Promise<PaginatedResponse<NovaObra>> {
  const qs = new URLSearchParams();
  // Task #93: param do hook é `naMinhaZona` (boolean), mapeado pra query string `na_minha_zona=true`.
  const KEY_MAP: Record<string, string> = { naMinhaZona: 'na_minha_zona' };
  Object.entries(params).forEach(([k, v]) => {
    if (v === undefined || v === null || v === '' || v === false) return;
    const key = KEY_MAP[k] ?? k;
    if (Array.isArray(v)) {
      v.forEach((item) => {
        if (item !== undefined && item !== null && item !== '') {
          qs.append(key, String(item));
        }
      });
    } else {
      qs.set(key, String(v));
    }
  });
  const url = `/api/obras${qs.size > 0 ? `?${qs.toString()}` : ''}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error('Erro ao buscar novas obras');
  const payload: PaginatedResponse<DbObra> = await response.json();
  return {
    ...payload,
    rows: (payload.rows ?? []).map(dbToNovaObra),
  };
}

export async function getPerfilStatus(): Promise<PerfilStatus> {
  const response = await fetch('/api/empreiteiro/perfil-status');
  if (!response.ok) {
    // Propaga erro pro useQuery em vez de mascarar com fallback silencioso.
    // O consumidor trata isError liberando acesso por padrão + console.warn.
    throw new Error(`perfil-status ${response.status}`);
  }
  return response.json();
}

export async function getObraDetalhe(id: string): Promise<ObraDetalhe> {
  const response = await fetch(`/api/obras/${id}`);
  if (!response.ok) throw new Error('Erro ao buscar detalhes da obra');
  const payload = await response.json();
  const obra: DbObra = payload?.obra ?? payload;
  const anexos = Array.isArray(payload?.anexos) ? payload.anexos : [];
  return dbToObraDetalheEmpreiteiro(obra, anexos);
}
