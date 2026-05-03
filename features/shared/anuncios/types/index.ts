export type AnuncioZonaStatus = 'ativo' | 'vazio';

export type AnuncioZonaId =
  | 'sidebar-sup-contratante'
  | 'sidebar-inf-contratante'
  | 'sidebar-sup-empreiteiro'
  | 'sidebar-inf-empreiteiro'
  | 'banner-dashboard-contratante'
  | 'banner-dashboard-empreiteiro'
  | 'banner-qa';

export interface ZonaAnuncio {
  id: AnuncioZonaId;
  nome: string;
  descricao: string;
  icone: 'web' | 'dashboard' | 'help';
  status: AnuncioZonaStatus;
  anuncioAtual?: string;
}
