import type {
  ObraDiarioApi,
  ObraEtapaApi,
  ObraFotoApi,
  ObraOcorrenciaApi,
} from '../hooks/use-obra-j06';

/**
 * Fonte opcional para os cards J06.
 * Sem `data`, o card mantém o comportamento legado e consulta a API autenticada.
 * Com `data`, o card renderiza somente o conteúdo fornecido pelo chamador.
 */
export interface J06DataSource<TRow> {
  data?: TRow[];
  isLoading?: boolean;
}

export type EtapaJ06Data = Pick<
  ObraEtapaApi,
  'id' | 'nome' | 'descricao' | 'progresso' | 'status'
  // XG10 — `dataInicio`/`prazo` entram como opcionais: quem injeta dados
  // (link público, admin) nem sempre projeta as datas do Gantt.
> & Partial<Pick<ObraEtapaApi, 'responsavel' | 'dataInicio' | 'prazo'>>;

export type DiarioJ06Data = Pick<
  ObraDiarioApi,
  'id' | 'texto' | 'createdAt' | 'fotos'
> & Partial<Pick<ObraDiarioApi, 'autorId' | 'autorNome'>>;

export type OcorrenciaJ06Data = Pick<
  ObraOcorrenciaApi,
  'id' | 'titulo' | 'descricao' | 'gravidade' | 'status' | 'fotoUrl' | 'createdAt'
> & Partial<Pick<ObraOcorrenciaApi, 'autorId' | 'autorNome' | 'resolvidoPorNome' | 'resolvidoEm'>>;

export type FotoJ06Data = Pick<
  ObraFotoApi,
  'id' | 'fileId' | 'url' | 'fase' | 'tag' | 'createdAt'
> & Partial<Pick<ObraFotoApi, 'autorId' | 'autorNome' | 'enviadaAoContratante'>>;