export type {
  AnuncioZonaStatus,
  AnuncioZonaId,
  ZonaAnuncio,
} from '@features/shared/anuncios/types';

import type { AnuncioZonaId } from '@features/shared/anuncios/types';

export type AnuncioStatus = 'ativa' | 'pausada' | 'expirada' | 'agendada';
export type AnuncianteStatus = 'ativo' | 'inativo';

export interface AnuncioKpi {
  receitaAnuncios: number;
  receitaCrescimentoPercent: number;
  campanhasAtivas: number;
  impressoes: number;
  cliques: number;
  ctrMedio: number;
  anunciantesAtivos: number;
  campanhasExpirando: number;
}

export interface Campanha {
  id: string;
  titulo: string;
  subtitulo: string;
  anunciante: string;
  anuncianteEmail: string;
  zona: string;
  zonaId: AnuncioZonaId;
  dataInicio: string;
  dataFim: string;
  impressoes: number;
  cliques: number;
  ctr: number;
  receita: number;
  status: AnuncioStatus;
}

export interface Anunciante {
  id: string;
  nome: string;
  sigla: string;
  corBg: string;
  corTexto: string;
  contato: string;
  email: string;
  telefone: string;
  campanhasAtivas: number;
  receitaTotal: number;
  status: AnuncianteStatus;
}
