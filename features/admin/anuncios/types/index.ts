export type AnuncioStatus = 'ativo' | 'pausado' | 'expirado' | 'rascunho';
export type AnuncioTipo = 'banner' | 'destaque' | 'notificacao' | 'popup';

export interface Anuncio {
  id: string;
  titulo: string;
  descricao: string;
  tipo: AnuncioTipo;
  status: AnuncioStatus;
  dataInicio: string;
  dataFim: string;
  impressoes: number;
  cliques: number;
  ctr: number;
  imagemUrl?: string;
  publicoAlvo: string;
  criadorPor: string;
}

export interface AnuncioResumo {
  totalAnuncios: number;
  ativos: number;
  impressoesTotais: number;
  cliquesTotais: number;
  ctrMedio: number;
}
